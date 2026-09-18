create or replace function public.cancel_my_appointment(
  p_appointment_id uuid
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
  v_start_at timestamptz;
  v_status text;
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
    appointments.customer_id,
    appointments.start_at,
    appointments.status
  into
    v_appointment_customer_id,
    v_start_at,
    v_status
  from public.appointments
  where appointments.id = p_appointment_id
  for update;

  if not found or v_appointment_customer_id <> v_customer_id then
    raise exception 'appointment not found';
  end if;

  if v_status = 'cancelled' then
    return 'already_cancelled';
  end if;

  if v_status not in ('scheduled', 'confirmed') then
    raise exception 'appointment status does not allow customer cancellation';
  end if;

  if v_start_at <= now() then
    raise exception 'appointment already started';
  end if;

  if v_start_at < now() + interval '1 hour' then
    raise exception 'customer cancellation deadline exceeded';
  end if;

  update public.appointments
  set status = 'cancelled'
  where id = p_appointment_id;

  return 'cancelled';
end;
$$;

revoke all on function public.cancel_my_appointment(uuid) from public;
revoke all on function public.cancel_my_appointment(uuid) from anon;
grant execute on function public.cancel_my_appointment(uuid) to authenticated;
