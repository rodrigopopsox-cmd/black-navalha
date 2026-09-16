-- 014-align-pix-checkout-hold.sql
--
-- Alinha a reserva interna do checkout ao vencimento minimo suportado
-- pelo Pix na Mercado Pago Orders API: 30 minutos.
--
-- A funcao reserve_subscription_checkout_capacity permanece inalterada
-- e continua serializando capacidade por barbeiro com SELECT ... FOR UPDATE.
-- Os privilegios atuais de create_subscription_checkout sao preservados,
-- pois a assinatura da funcao nao muda.
create or replace function public.create_subscription_checkout(
  p_plan_id uuid,
  p_barber_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_checkout_token uuid default gen_random_uuid()
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
set search_path = public
as $$
declare
  v_plan public.subscription_plans%rowtype;
  v_existing public.subscription_charges%rowtype;
  v_reservation record;
  v_charge public.subscription_charges%rowtype;
  v_expires_at timestamptz := now() + interval '30 minutes';
begin
  if p_checkout_token is null then
    raise exception 'checkout token is required';
  end if;

  if length(btrim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'invalid customer name';
  end if;

  if length(regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g')) < 10 then
    raise exception 'invalid customer phone';
  end if;

  select *
  into v_existing
  from public.subscription_charges
  where subscription_charges.checkout_token = p_checkout_token
  limit 1;

  if found then
    return query
    select
      v_existing.id,
      v_existing.checkout_token,
      v_existing.amount,
      v_existing.currency,
      r.expires_at
    from public.subscription_capacity_reservations r
    where r.checkout_token = p_checkout_token
    limit 1;

    return;
  end if;

  select *
  into v_plan
  from public.subscription_plans
  where subscription_plans.id = p_plan_id
    and active = true
  for share;

  if not found then
    raise exception 'plan not found or inactive';
  end if;

  select *
  into v_reservation
  from public.reserve_subscription_checkout_capacity(
    p_barber_id,
    v_expires_at,
    p_checkout_token,
    null
  );

  insert into public.subscription_charges (
    subscription_id,
    cycle_id,
    plan_id,
    barber_id,
    amount,
    currency,
    status,
    provider,
    provider_charge_id,
    idempotency_key,
    customer_name,
    customer_phone,
    customer_email,
    checkout_token
  )
  values (
    null,
    null,
    v_plan.id,
    p_barber_id,
    v_plan.price,
    'BRL',
    'pending',
    null,
    null,
    'subscription-checkout:' || p_checkout_token::text,
    btrim(p_customer_name),
    regexp_replace(p_customer_phone, '\D', '', 'g'),
    nullif(btrim(coalesce(p_customer_email, '')), ''),
    p_checkout_token
  )
  returning *
  into v_charge;

  return query
  select
    v_charge.id,
    v_charge.checkout_token,
    v_charge.amount,
    v_charge.currency,
    v_reservation.expires_at;
end;
$$;
