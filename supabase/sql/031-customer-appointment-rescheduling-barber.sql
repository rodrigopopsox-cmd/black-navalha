-- Permite troca de barbeiro na remarcação somente para appointments
-- que NÃO utilizaram benefício de assinatura.
-- Preserva o mesmo appointment, serviços e preços históricos.

create or replace function public.reschedule_my_appointment(
  p_appointment_id uuid,
  p_barber_id uuid,
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
  v_current_barber_id uuid;
  v_current_start_at timestamptz;
  v_status text;

  v_duration_minutes integer;
  v_service_count integer;
  v_supported_service_count integer;
  v_uses_subscription_benefit boolean;
  v_end_at timestamptz;

  v_day_of_week integer;
  v_local_start time;
  v_local_end time;
begin
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

  -- O appointment é bloqueado antes de qualquer decisão de remarcação.
  select
    appointments.customer_id,
    appointments.barber_id,
    appointments.start_at,
    appointments.status
  into
    v_appointment_customer_id,
    v_current_barber_id,
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

  if v_current_start_at <= now() then
    raise exception 'appointment already started';
  end if;

  if v_current_start_at < now() + interval '1 hour' then
    raise exception 'customer rescheduling deadline exceeded';
  end if;

  if p_barber_id is null then
    raise exception 'barber required';
  end if;

  if p_start_at is null or p_start_at <= now() then
    raise exception 'new appointment time must be in the future';
  end if;

  -- O profissional recebido nunca é confiado apenas ao browser.
  if not exists (
    select 1
    from public.barbers
    where barbers.id = p_barber_id
      and barbers.active = true
  ) then
    raise exception 'barber unavailable';
  end if;

  -- Duração, serviços e uso de benefício vêm exclusivamente do histórico.
  select
    coalesce(sum(appointment_services.duration_minutes), 0)::integer,
    count(*)::integer,
    coalesce(
      bool_or(appointment_services.subscription_id is not null),
      false
    )
  into
    v_duration_minutes,
    v_service_count,
    v_uses_subscription_benefit
  from public.appointment_services
  where appointment_services.appointment_id = p_appointment_id;

  if v_duration_minutes <= 0 or v_service_count <= 0 then
    raise exception 'appointment services unavailable';
  end if;

  -- Appointment que utilizou benefício não troca de barbeiro no meio do ciclo.
  if v_uses_subscription_benefit
     and p_barber_id <> v_current_barber_id then
    raise exception 'subscription appointment barber change not allowed';
  end if;

  -- Appointment comum pode trocar de profissional somente quando o novo
  -- barbeiro executa TODOS os mesmos serviços históricos.
  if p_barber_id <> v_current_barber_id then
    select count(distinct appointment_services.service_id)::integer
    into v_service_count
    from public.appointment_services
    where appointment_services.appointment_id = p_appointment_id;

    select count(distinct appointment_services.service_id)::integer
    into v_supported_service_count
    from public.appointment_services
    join public.barber_services
      on barber_services.service_id = appointment_services.service_id
     and barber_services.barber_id = p_barber_id
    where appointment_services.appointment_id = p_appointment_id;

    if v_supported_service_count <> v_service_count then
      raise exception 'barber does not provide all appointment services';
    end if;
  end if;

  -- Mesma combinação de profissional e horário é idempotente.
  if p_barber_id = v_current_barber_id
     and p_start_at = v_current_start_at then
    return 'unchanged';
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
    from public.working_hours
    where working_hours.barber_id = p_barber_id
      and working_hours.day_of_week = v_day_of_week
      and working_hours.active = true
      and working_hours.start_time <= v_local_start
      and working_hours.end_time >= v_local_end
  ) then
    raise exception 'new appointment time outside barber working hours';
  end if;

  if exists (
    select 1
    from public.blocked_times
    where blocked_times.barber_id = p_barber_id
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

  -- Atualiza atomicamente o MESMO appointment.
  -- appointment_services, preços e vínculos históricos permanecem intactos.
  -- A exclusion constraint existente continua como proteção concorrente final.
  update public.appointments
  set
    barber_id = p_barber_id,
    start_at = p_start_at,
    end_at = v_end_at
  where appointments.id = p_appointment_id;

  return 'rescheduled';

exception
  when exclusion_violation then
    raise exception 'new appointment time just became unavailable';
end;
$$;

revoke all
on function public.reschedule_my_appointment(uuid, uuid, timestamptz)
from public;

revoke all
on function public.reschedule_my_appointment(uuid, uuid, timestamptz)
from anon;

grant execute
on function public.reschedule_my_appointment(uuid, uuid, timestamptz)
to authenticated;

-- Só remove o contrato antigo depois que o novo já foi criado/autorizado.
drop function if exists public.reschedule_my_appointment(uuid, timestamptz);

-- Retorna somente os profissionais que podem ser considerados na remarcação
-- do próprio appointment. A escrita continuará revalidando todas as regras.
create or replace function public.get_my_appointment_reschedule_barbers(
  p_appointment_id uuid
)
returns table (
  id uuid,
  name text,
  current boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_customer_id uuid;
  v_email_confirmed_at timestamptz;
  v_current_barber_id uuid;
  v_status text;
  v_uses_subscription_benefit boolean;
  v_service_count integer;
begin
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

  select
    appointments.barber_id,
    appointments.status
  into
    v_current_barber_id,
    v_status
  from public.appointments
  where appointments.id = p_appointment_id
    and appointments.customer_id = v_customer_id;

  if not found then
    raise exception 'appointment not found';
  end if;

  if v_status not in ('scheduled', 'confirmed') then
    raise exception 'appointment status does not allow customer rescheduling';
  end if;

  select
    count(distinct appointment_services.service_id)::integer,
    coalesce(
      bool_or(appointment_services.subscription_id is not null),
      false
    )
  into
    v_service_count,
    v_uses_subscription_benefit
  from public.appointment_services
  where appointment_services.appointment_id = p_appointment_id;

  if v_service_count <= 0 then
    raise exception 'appointment services unavailable';
  end if;

  if v_uses_subscription_benefit then
    return query
    select
      barbers.id,
      barbers.name,
      true
    from public.barbers
    where barbers.id = v_current_barber_id
      and barbers.active = true;

    return;
  end if;

  return query
  select
    barbers.id,
    barbers.name,
    barbers.id = v_current_barber_id
  from public.barbers
  where barbers.active = true
    and (
      select count(distinct barber_services.service_id)
      from public.barber_services
      join public.appointment_services
        on appointment_services.service_id = barber_services.service_id
       and appointment_services.appointment_id = p_appointment_id
      where barber_services.barber_id = barbers.id
    ) = v_service_count
  order by
    (barbers.id = v_current_barber_id) desc,
    barbers.name asc;
end;
$$;

revoke all
on function public.get_my_appointment_reschedule_barbers(uuid)
from public;

revoke all
on function public.get_my_appointment_reschedule_barbers(uuid)
from anon;

grant execute
on function public.get_my_appointment_reschedule_barbers(uuid)
to authenticated;
-- Expõe apenas a decisão semântica necessária à UI.
-- subscription_id continua privado.
create or replace function public.get_my_appointments()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_customer_id uuid;
  v_email_confirmed_at timestamptz;
  v_result jsonb;
begin
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

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', appointment_data.id,
        'barber_id', appointment_data.barber_id,
        'start_at', appointment_data.start_at,
        'end_at', appointment_data.end_at,
        'price', appointment_data.price,
        'status', appointment_data.status,
        'barber_name', appointment_data.barber_name,
        'barber_change_allowed', appointment_data.barber_change_allowed,
        'services', appointment_data.services
      )
      order by appointment_data.start_at asc
    ),
    '[]'::jsonb
  )
  into v_result
  from (
    select
      appointments.id,
      appointments.barber_id,
      appointments.start_at,
      appointments.end_at,
      appointments.price,
      appointments.status,
      barbers.name as barber_name,
      not exists (
        select 1
        from public.appointment_services benefit_service
        where benefit_service.appointment_id = appointments.id
          and benefit_service.subscription_id is not null
      ) as barber_change_allowed,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'name', appointment_services.service_name
            )
            order by appointment_services.created_at asc
          )
          from public.appointment_services
          where appointment_services.appointment_id = appointments.id
        ),
        '[]'::jsonb
      ) as services
    from public.appointments
    left join public.barbers
      on barbers.id = appointments.barber_id
    where appointments.customer_id = v_customer_id
  ) as appointment_data;

  return v_result;
end;
$$;

revoke all on function public.get_my_appointments() from public;
revoke all on function public.get_my_appointments() from anon;
grant execute on function public.get_my_appointments() to authenticated;
