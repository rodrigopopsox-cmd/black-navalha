begin;

-- ============================================================
-- BLACK NAVALHA
-- 008 - Reserva de capacidade para pre-checkout
--
-- Uma contratacao nova ainda nao possui subscription_id.
-- O checkout reserva capacidade primeiro; assinatura/ciclo
-- somente serao efetivados apos pagamento confirmado no servidor.
-- ============================================================

alter table public.subscription_capacity_reservations
  alter column subscription_id drop not null;

alter table public.subscription_capacity_reservations
  add column if not exists checkout_token uuid;

update public.subscription_capacity_reservations
set checkout_token = gen_random_uuid()
where checkout_token is null;

alter table public.subscription_capacity_reservations
  alter column checkout_token set default gen_random_uuid();

alter table public.subscription_capacity_reservations
  alter column checkout_token set not null;

create unique index if not exists
  uq_subscription_capacity_checkout_token
on public.subscription_capacity_reservations(checkout_token);

-- O indice antigo nao atende pre-checkout porque NULL nao e
-- considerado igual a NULL em UNIQUE convencional.
drop index if exists public.uq_subscription_capacity_active_hold;

-- Assinaturas ja existentes continuam protegidas contra
-- dois holds ativos para o mesmo barbeiro.
create unique index if not exists
  uq_subscription_capacity_active_subscription_hold
on public.subscription_capacity_reservations(subscription_id, barber_id)
where status = 'held'
  and subscription_id is not null;

-- Checkout novo e identificado por token opaco.
-- A funcao continua serializando por barbeiro com FOR UPDATE.
create or replace function public.reserve_subscription_checkout_capacity(
  p_barber_id uuid,
  p_expires_at timestamptz,
  p_checkout_token uuid default gen_random_uuid(),
  p_subscription_id uuid default null
)
returns table (
  reservation_id uuid,
  checkout_token uuid,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_occupied integer;
  v_existing public.subscription_capacity_reservations%rowtype;
  v_new public.subscription_capacity_reservations%rowtype;
begin
  if p_checkout_token is null then
    raise exception 'checkout token is required';
  end if;

  if p_expires_at <= now() then
    raise exception 'reservation expiration must be in the future';
  end if;

  if p_subscription_id is not null
     and not exists (
       select 1
       from public.subscriptions s
       where s.id = p_subscription_id
     ) then
    raise exception 'subscription not found';
  end if;

  -- Lock da linha do barbeiro: checkouts concorrentes para o
  -- mesmo profissional sao processados em serie.
  select b.subscriber_capacity
  into v_capacity
  from public.barbers b
  where b.id = p_barber_id
    and b.active = true
  for update;

  if not found then
    raise exception 'barber not found or inactive';
  end if;

  -- Mesmo token = mesma tentativa. Evita consumir duas vagas.
  select r.*
  into v_existing
  from public.subscription_capacity_reservations r
  where r.checkout_token = p_checkout_token
  limit 1;

  if found then
    if v_existing.barber_id <> p_barber_id then
      raise exception 'checkout token belongs to another barber';
    end if;

    if v_existing.status = 'held'
       and v_existing.expires_at > now() then
      return query
      select
        v_existing.id,
        v_existing.checkout_token,
        v_existing.expires_at;
      return;
    end if;

    raise exception 'checkout reservation is no longer active';
  end if;

  update public.subscription_capacity_reservations r
  set
    status = 'expired',
    updated_at = now()
  where r.barber_id = p_barber_id
    and r.status = 'held'
    and r.expires_at <= now();

  -- Uma assinatura conta apenas uma vez mesmo durante transicoes.
  -- Um pre-checkout sem assinatura tambem ocupa uma vaga enquanto
  -- seu hold estiver vigente.
  select count(*)
  into v_occupied
  from (
    select
      'subscription:' || c.subscription_id::text as occupancy_key
    from public.subscription_cycles c
    where c.barber_id = p_barber_id
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
    where r.barber_id = p_barber_id
      and r.status = 'held'
      and r.expires_at > now()
  ) occupied;

  if v_occupied >= v_capacity then
    raise exception 'barber subscription capacity reached';
  end if;

  insert into public.subscription_capacity_reservations (
    subscription_id,
    barber_id,
    checkout_token,
    status,
    expires_at
  )
  values (
    p_subscription_id,
    p_barber_id,
    p_checkout_token,
    'held',
    p_expires_at
  )
  returning *
  into v_new;

  return query
  select
    v_new.id,
    v_new.checkout_token,
    v_new.expires_at;
end;
$$;

revoke all on function public.reserve_subscription_checkout_capacity(
  uuid,
  timestamptz,
  uuid,
  uuid
) from public;

revoke all on function public.reserve_subscription_checkout_capacity(
  uuid,
  timestamptz,
  uuid,
  uuid
) from anon;

revoke all on function public.reserve_subscription_checkout_capacity(
  uuid,
  timestamptz,
  uuid,
  uuid
) from authenticated;

-- A funcao 007 permanece disponivel apenas internamente por
-- compatibilidade, mas nenhuma funcao de capacidade fica publica.
-- ------------------------------------------------------------
-- A leitura publica de disponibilidade sera exposta posteriormente
-- por uma fronteira server-side controlada. Ciclos e reservas
-- permanecem privados.
-- ------------------------------------------------------------

commit;
