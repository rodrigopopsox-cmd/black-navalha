begin;

-- ============================================================
-- BLACK NAVALHA
-- 009 - Checkout de assinatura / dados do comprador /
--       disponibilidade publica segura
-- ============================================================

-- A cobranca precisa preservar quem iniciou a contratacao mesmo
-- antes de existir customer/subscription efetivos.

alter table public.subscription_charges
  add column if not exists customer_name text;

alter table public.subscription_charges
  add column if not exists customer_phone text;

alter table public.subscription_charges
  add column if not exists customer_email text;

alter table public.subscription_charges
  add column if not exists checkout_token uuid;

alter table public.subscription_charges
  alter column subscription_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscription_charges_customer_name_not_blank'
  ) then
    alter table public.subscription_charges
      add constraint subscription_charges_customer_name_not_blank
      check (
        customer_name is null
        or btrim(customer_name) <> ''
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscription_charges_customer_phone_not_blank'
  ) then
    alter table public.subscription_charges
      add constraint subscription_charges_customer_phone_not_blank
      check (
        customer_phone is null
        or btrim(customer_phone) <> ''
      );
  end if;
end
$$;

create unique index if not exists
  uq_subscription_charges_checkout_token
on public.subscription_charges(checkout_token)
where checkout_token is not null;

-- ------------------------------------------------------------
-- Leitura publica MINIMA de disponibilidade.
--
-- Nao expoe ciclos, reservas, clientes ou financeiro.
-- Nao substitui a verificacao transacional na contratacao:
-- available_slots e apenas informativo.
-- ------------------------------------------------------------

create or replace function public.get_public_subscription_barbers()
returns table (
  id uuid,
  name text,
  photo_url text,
  capacity integer,
  available_slots integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.name,
    b.photo_url,
    b.subscriber_capacity as capacity,
    greatest(
      b.subscriber_capacity - (
        select count(*)::integer
        from (
          select
            'subscription:' || c.subscription_id::text as occupancy_key
          from public.subscription_cycles c
          where c.barber_id = b.id
            and c.status in ('paid', 'grace')
            and c.grace_until > now()
          group by c.subscription_id

          union

          select
            case
              when r.subscription_id is not null
                then 'subscription:' || r.subscription_id::text
              else 'checkout:' || r.checkout_token::text
            end as occupancy_key
          from public.subscription_capacity_reservations r
          where r.barber_id = b.id
            and r.status = 'held'
            and r.expires_at > now()
        ) occupied
      ),
      0
    )::integer as available_slots
  from public.barbers b
  where b.active = true
  order by b.name;
$$;

revoke all on function public.get_public_subscription_barbers()
  from public;

grant execute on function public.get_public_subscription_barbers()
  to anon, authenticated;

-- ------------------------------------------------------------
-- Criacao server-side da tentativa de checkout.
--
-- Esta RPC:
-- 1. valida plano;
-- 2. trava capacidade do barbeiro;
-- 3. cria hold;
-- 4. cria cobranca PENDING interna;
-- 5. NAO cria assinatura ativa;
-- 6. NAO marca pagamento como pago.
--
-- So service_role/backend deve chama-la.
-- ------------------------------------------------------------

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
  v_expires_at timestamptz := now() + interval '15 minutes';
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

revoke all on function public.create_subscription_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  uuid
) from public;

revoke all on function public.create_subscription_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  uuid
) from anon;

revoke all on function public.create_subscription_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  uuid
) from authenticated;

commit;
