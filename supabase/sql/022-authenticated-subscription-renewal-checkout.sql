create or replace function public.create_my_subscription_renewal_checkout(
  p_barber_id uuid,
  p_checkout_token uuid
)
returns table (
  charge_id uuid,
  checkout_token uuid,
  amount numeric,
  currency text,
  reservation_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_email_confirmed_at timestamptz;
  v_customer public.customers%rowtype;
  v_subscription public.subscriptions%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_barber_id is null or p_checkout_token is null then
    raise exception 'invalid renewal checkout';
  end if;

  select u.email_confirmed_at
  into v_email_confirmed_at
  from auth.users u
  where u.id = v_user_id;

  if v_email_confirmed_at is null then
    raise exception 'verified email required';
  end if;

  select c.*
  into v_customer
  from public.customers c
  where c.auth_user_id = v_user_id
  limit 1;

  if not found then
    raise exception 'customer identity not linked';
  end if;

  select s.*
  into v_subscription
  from public.subscriptions s
  where s.customer_id = v_customer.id
    and s.plan_id is not null
  order by
    case s.status
      when 'active' then 0
      when 'paused' then 1
      when 'expired' then 2
      when 'cancelled' then 3
      else 4
    end,
    s.created_at desc,
    s.id
  limit 1;

  if not found then
    raise exception 'commercial subscription not found';
  end if;

  return query
  select *
  from public.create_subscription_checkout(
    v_subscription.plan_id,
    p_barber_id,
    v_customer.name,
    v_customer.phone,
    coalesce(
      v_customer.email,
      (select u.email from auth.users u where u.id = v_user_id)
    ),
    p_checkout_token
  );
end;
$$;

revoke all on function public.create_my_subscription_renewal_checkout(uuid, uuid)
from public;

revoke all on function public.create_my_subscription_renewal_checkout(uuid, uuid)
from anon;

grant execute on function public.create_my_subscription_renewal_checkout(uuid, uuid)
to authenticated;
