create or replace function public.reschedule_my_appointment(
  p_appointment_id uuid,
  p_start_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_customer_id uuid;
  v_email_confirmed_at timestamptz;

  v_appointment_customer_id uuid;
  v_barber_id uuid;
  v_current_start_at timestamptz;
  v_status text;

  v_duration_minutes integer;
  v_end_at timestamptz;

  v_day_of_week integer;
  v_local_start time;
  v_local_end time;
begin
  -- Identidade autenticada é a única autoridade sobre o cliente.
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select users.email_confirmed_at
  into v_email_confirmed_at
  from auth.users
  where users.id = v_user_id;

  if v_email_confirmed_at is null then
    raise exception 'email confirmation required';
  end if;

  select customers.id
  into v_customer_id
  from public.customers
  where customers.auth_user_id = v_user_id;

  if v_customer_id is null then
    raise exception 'customer identity not linked';
  end if;

  -- Mantém o appointment atual intacto enquanto a remarcação é validada.
  select
    appointments.customer_id,
    appointments.barber_id,
    appointments.start_at,
    appointments.status
  into
    v_appointment_customer_id,
    v_barber_id,
    v_current_start_at,
    v_status
  from public.appointments
  where appointments.id = p_appointment_id
  for update;

  if not found or v_appointment_customer_id <> v_customer_id then
    raise exception 'appointment not found';
  end if;

  if v_status not in ('scheduled', 'confirmed') then
    raise exception 'appointment status does not allow customer rescheduling';
  end if;

  -- A antecedência é avaliada contra o horário atualmente reservado.
  if v_current_start_at <= now() then
    raise exception 'appointment already started';
  end if;

  if v_current_start_at < now() + interval '1 hour' then
    raise exception 'customer rescheduling deadline exceeded';
  end if;

  if p_start_at is null or p_start_at <= now() then
    raise exception 'new appointment time must be in the future';
  end if;

  -- Repetir exatamente o horário atual é uma operação idempotente.
  if p_start_at = v_current_start_at then
    return 'unchanged';
  end if;

  -- Usa a duração histórica do próprio appointment.
  select coalesce(sum(appointment_services.duration_minutes), 0)::integer
  into v_duration_minutes
  from public.appointment_services
  where appointment_services.appointment_id = p_appointment_id;

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

  -- O novo intervalo precisa permanecer integralmente dentro da jornada.
  if not exists (
    select 1
    from public.working_hours
    where working_hours.barber_id = v_barber_id
      and working_hours.day_of_week = v_day_of_week
      and working_hours.active = true
      and working_hours.start_time <= v_local_start
      and working_hours.end_time >= v_local_end
  ) then
    raise exception 'new appointment time outside barber working hours';
  end if;

  -- Bloqueios administrativos continuam sendo autoridade.
  if exists (
    select 1
    from public.blocked_times
    where blocked_times.barber_id = v_barber_id
      and tstzrange(
        blocked_times.start_at,
        blocked_times.end_at,
        '[)'
      ) && tstzrange(
        p_start_at,
        v_end_at,
        '[)'
      )
  ) then
    raise exception 'new appointment time unavailable';
  end if;

  -- Atualiza o MESMO appointment.
  -- A constraint prevent_overlapping_appointments é a proteção concorrente
  -- final contra outro scheduled/confirmed no mesmo barbeiro/intervalo.
  update public.appointments
  set
    start_at = p_start_at,
    end_at = v_end_at
  where appointments.id = p_appointment_id;

  return 'rescheduled';

exception
  when exclusion_violation then
    -- O UPDATE inteiro é revertido; o horário anterior permanece intacto.
    raise exception 'new appointment time just became unavailable';
end;
$$;

revoke all
on function public.reschedule_my_appointment(uuid, timestamptz)
from public;

revoke all
on function public.reschedule_my_appointment(uuid, timestamptz)
from anon;

grant execute
on function public.reschedule_my_appointment(uuid, timestamptz)
to authenticated;
