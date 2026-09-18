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
