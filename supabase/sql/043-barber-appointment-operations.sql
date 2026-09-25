begin;

-- Operações seguras do próprio atendimento pelo profissional.
-- Autoridade:
-- auth.uid() -> barbers.auth_user_id -> barber_id
--
-- Nunca recebe barber_id do navegador e não concede UPDATE geral.

create or replace function public.update_my_barber_appointment_status(
  p_appointment_id uuid,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_auth_user_id uuid;
  v_barber_id uuid;
  v_current_status text;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = v_auth_user_id
      and u.email_confirmed_at is not null
  ) then
    raise exception 'confirmed email required';
  end if;

  select b.id
  into v_barber_id
  from public.barbers b
  where b.auth_user_id = v_auth_user_id
    and b.active = true;

  if v_barber_id is null then
    raise exception 'barber profile not found';
  end if;

  if p_appointment_id is null then
    raise exception 'appointment id is required';
  end if;

  if p_status is null
     or p_status not in (
       'scheduled',
       'confirmed',
       'completed',
       'cancelled',
       'no_show'
     ) then
    raise exception 'invalid appointment status';
  end if;

  select a.status
  into v_current_status
  from public.appointments a
  where a.id = p_appointment_id
    and a.barber_id = v_barber_id
  for update;

  if not found then
    raise exception 'appointment not found';
  end if;

  if p_status = v_current_status then
    return 'unchanged';
  end if;

  if not (
    (v_current_status = 'scheduled'
      and p_status in (
        'confirmed',
        'completed',
        'cancelled',
        'no_show'
      ))
    or
    (v_current_status = 'confirmed'
      and p_status in (
        'completed',
        'cancelled',
        'no_show'
      ))
  ) then
    raise exception 'appointment status transition not allowed';
  end if;

  update public.appointments
  set status = p_status
  where id = p_appointment_id
    and barber_id = v_barber_id;

  return 'updated';
end;
$function$;

revoke all
on function public.update_my_barber_appointment_status(uuid, text)
from public, anon, authenticated;

grant execute
on function public.update_my_barber_appointment_status(uuid, text)
to authenticated;


create or replace function public.reschedule_my_barber_appointment(
  p_appointment_id uuid,
  p_start_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_auth_user_id uuid;
  v_barber_id uuid;
  v_current_start_at timestamptz;
  v_status text;
  v_duration_minutes integer;
  v_end_at timestamptz;
  v_day_of_week integer;
  v_local_start time;
  v_local_end time;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = v_auth_user_id
      and u.email_confirmed_at is not null
  ) then
    raise exception 'confirmed email required';
  end if;

  select b.id
  into v_barber_id
  from public.barbers b
  where b.auth_user_id = v_auth_user_id
    and b.active = true;

  if v_barber_id is null then
    raise exception 'barber profile not found';
  end if;

  if p_appointment_id is null then
    raise exception 'appointment id is required';
  end if;

  select
    a.start_at,
    a.status
  into
    v_current_start_at,
    v_status
  from public.appointments a
  where a.id = p_appointment_id
    and a.barber_id = v_barber_id
  for update;

  if not found then
    raise exception 'appointment not found';
  end if;

  if v_status not in ('scheduled', 'confirmed') then
    raise exception 'appointment status does not allow barber rescheduling';
  end if;

  if v_current_start_at <= now() then
    raise exception 'appointment already started';
  end if;

  if p_start_at is null or p_start_at <= now() then
    raise exception 'new appointment time must be in the future';
  end if;

  if p_start_at = v_current_start_at then
    return 'unchanged';
  end if;

  select coalesce(sum(aps.duration_minutes), 0)::integer
  into v_duration_minutes
  from public.appointment_services aps
  where aps.appointment_id = p_appointment_id;

  if v_duration_minutes <= 0 then
    raise exception 'appointment duration unavailable';
  end if;

  v_end_at :=
    p_start_at + make_interval(mins => v_duration_minutes);

  v_day_of_week :=
    extract(
      dow from p_start_at at time zone 'America/Sao_Paulo'
    )::integer;

  v_local_start :=
    (p_start_at at time zone 'America/Sao_Paulo')::time;

  v_local_end :=
    (v_end_at at time zone 'America/Sao_Paulo')::time;

  if not exists (
    select 1
    from public.working_hours wh
    where wh.barber_id = v_barber_id
      and wh.day_of_week = v_day_of_week
      and wh.active = true
      and wh.start_time <= v_local_start
      and wh.end_time >= v_local_end
  ) then
    raise exception 'new appointment time outside barber working hours';
  end if;

  if exists (
    select 1
    from public.blocked_times bt
    where bt.barber_id = v_barber_id
      and tstzrange(
        bt.start_at,
        bt.end_at,
        '[)'
      ) && tstzrange(
        p_start_at,
        v_end_at,
        '[)'
      )
  ) then
    raise exception 'new appointment time unavailable';
  end if;

  update public.appointments
  set
    start_at = p_start_at,
    end_at = v_end_at
  where id = p_appointment_id
    and barber_id = v_barber_id;

  return 'rescheduled';

exception
  when exclusion_violation then
    raise exception 'new appointment time just became unavailable';
end;
$function$;

revoke all
on function public.reschedule_my_barber_appointment(uuid, timestamptz)
from public, anon, authenticated;

grant execute
on function public.reschedule_my_barber_appointment(uuid, timestamptz)
to authenticated;

commit;