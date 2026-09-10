begin;

-- ============================================================
-- BLACK NAVALHA
-- Evolucao comercial de assinaturas
-- IMPORTANTE: este arquivo nao altera a integracao existente
-- subscriptions -> subscription_services -> agendamento.
-- ============================================================

-- ------------------------------------------------------------
-- 1. CATALOGO COMERCIAL DE PLANOS
-- ------------------------------------------------------------

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  billing_interval_months integer not null default 1,
  grace_days integer not null default 2,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscription_plans_name_not_blank
    check (btrim(name) <> ''),

  constraint subscription_plans_price_nonnegative
    check (price >= 0),

  constraint subscription_plans_billing_interval_positive
    check (billing_interval_months > 0),

  constraint subscription_plans_grace_days_nonnegative
    check (grace_days >= 0)
);

create index if not exists idx_subscription_plans_active
  on public.subscription_plans(active);

-- Plano comercial inicial.
-- O WHERE torna a carga repetivel sem criar o mesmo plano novamente.

insert into public.subscription_plans (
  name,
  price,
  billing_interval_months,
  grace_days,
  active
)
select
  'Plano Mensal',
  150.00,
  1,
  2,
  true
where not exists (
  select 1
  from public.subscription_plans
  where name = 'Plano Mensal'
    and billing_interval_months = 1
);

-- ------------------------------------------------------------
-- 2. VINCULO DA ASSINATURA EXISTENTE AO CATALOGO
-- ------------------------------------------------------------

alter table public.subscriptions
  add column if not exists plan_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_plan_id_fkey'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_plan_id_fkey
      foreign key (plan_id)
      references public.subscription_plans(id)
      on delete restrict;
  end if;
end
$$;

create index if not exists idx_subscriptions_plan_id
  on public.subscriptions(plan_id);

-- Mantemos NULL permitido para preservar dados legados.
-- Assinaturas existentes nao sao transformadas artificialmente
-- em pagamentos/ciclos historicos.

-- ------------------------------------------------------------
-- 3. CAPACIDADE POR BARBEIRO
-- ------------------------------------------------------------

alter table public.barbers
  add column if not exists subscriber_capacity integer;

update public.barbers
set subscriber_capacity = 30
where subscriber_capacity is null;

alter table public.barbers
  alter column subscriber_capacity set default 30;

alter table public.barbers
  alter column subscriber_capacity set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'barbers_subscriber_capacity_nonnegative'
  ) then
    alter table public.barbers
      add constraint barbers_subscriber_capacity_nonnegative
      check (subscriber_capacity >= 0);
  end if;
end
$$;

-- ------------------------------------------------------------
-- 4. CICLOS DA ASSINATURA
-- O barbeiro fica historicamente vinculado ao ciclo.
-- ------------------------------------------------------------

create table if not exists public.subscription_cycles (
  id uuid primary key default gen_random_uuid(),

  subscription_id uuid not null
    references public.subscriptions(id)
    on delete restrict,

  plan_id uuid not null
    references public.subscription_plans(id)
    on delete restrict,

  barber_id uuid not null
    references public.barbers(id)
    on delete restrict,

  period_start date not null,
  period_end date not null,

  -- Instante ate o qual a vaga permanece reservada
  -- apos o periodo pago.
  grace_until timestamptz not null,

  status text not null default 'pending',

  -- Snapshot comercial do ciclo.
  price_amount numeric(10,2) not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscription_cycles_period_valid
    check (period_end >= period_start),

  constraint subscription_cycles_price_nonnegative
    check (price_amount >= 0),

  constraint subscription_cycles_status_valid
    check (
      status in (
        'pending',
        'paid',
        'grace',
        'expired',
        'cancelled'
      )
    ),

  constraint subscription_cycles_subscription_period_unique
    unique (subscription_id, period_start)
);

create index if not exists idx_subscription_cycles_subscription_period
  on public.subscription_cycles(subscription_id, period_start desc);

create index if not exists idx_subscription_cycles_barber_capacity
  on public.subscription_cycles(barber_id, status, grace_until);

create index if not exists idx_subscription_cycles_plan_id
  on public.subscription_cycles(plan_id);

-- ------------------------------------------------------------
-- 5. RESERVA TEMPORARIA DE CAPACIDADE PARA CHECKOUT
-- Diferente da carencia de 2 dias.
-- ------------------------------------------------------------

create table if not exists public.subscription_capacity_reservations (
  id uuid primary key default gen_random_uuid(),

  subscription_id uuid not null
    references public.subscriptions(id)
    on delete restrict,

  barber_id uuid not null
    references public.barbers(id)
    on delete restrict,

  cycle_id uuid
    references public.subscription_cycles(id)
    on delete set null,

  status text not null default 'held',

  expires_at timestamptz not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscription_capacity_reservations_status_valid
    check (
      status in (
        'held',
        'consumed',
        'released',
        'expired'
      )
    )
);

create index if not exists idx_subscription_capacity_reservations_capacity
  on public.subscription_capacity_reservations(
    barber_id,
    status,
    expires_at
  );

create index if not exists idx_subscription_capacity_reservations_subscription
  on public.subscription_capacity_reservations(subscription_id);

-- Apenas um hold vigente logicamente por assinatura/barbeiro.
create unique index if not exists uq_subscription_capacity_active_hold
  on public.subscription_capacity_reservations(subscription_id, barber_id)
  where status = 'held';

-- ------------------------------------------------------------
-- 6. COBRANCAS / ESTADO FINANCEIRO
-- ------------------------------------------------------------

create table if not exists public.subscription_charges (
  id uuid primary key default gen_random_uuid(),

  subscription_id uuid not null
    references public.subscriptions(id)
    on delete restrict,

  cycle_id uuid
    references public.subscription_cycles(id)
    on delete restrict,

  plan_id uuid not null
    references public.subscription_plans(id)
    on delete restrict,

  barber_id uuid not null
    references public.barbers(id)
    on delete restrict,

  amount numeric(10,2) not null,
  currency text not null default 'BRL',

  status text not null default 'pending',

  -- Generico para permitir escolha posterior do gateway.
  provider text,
  provider_charge_id text,

  -- Chave nossa para impedir criacao/processamento duplicado.
  idempotency_key text not null,

  paid_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  expired_at timestamptz,
  refunded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscription_charges_amount_nonnegative
    check (amount >= 0),

  constraint subscription_charges_currency_not_blank
    check (btrim(currency) <> ''),

  constraint subscription_charges_idempotency_not_blank
    check (btrim(idempotency_key) <> ''),

  constraint subscription_charges_status_valid
    check (
      status in (
        'pending',
        'paid',
        'failed',
        'cancelled',
        'expired',
        'refunded',
        'partially_refunded'
      )
    ),

  constraint subscription_charges_idempotency_unique
    unique (idempotency_key)
);

create unique index if not exists uq_subscription_charges_provider_charge
  on public.subscription_charges(provider, provider_charge_id)
  where provider is not null
    and provider_charge_id is not null;

create index if not exists idx_subscription_charges_subscription
  on public.subscription_charges(subscription_id, created_at desc);

create index if not exists idx_subscription_charges_cycle
  on public.subscription_charges(cycle_id);

create index if not exists idx_subscription_charges_status
  on public.subscription_charges(status);

create index if not exists idx_subscription_charges_barber
  on public.subscription_charges(barber_id, created_at desc);

-- ------------------------------------------------------------
-- 7. EVENTOS DE PAGAMENTO / WEBHOOKS
-- ------------------------------------------------------------

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),

  charge_id uuid
    references public.subscription_charges(id)
    on delete restrict,

  provider text not null,
  provider_event_id text not null,
  event_type text not null,

  payload jsonb not null default '{}'::jsonb,

  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,

  constraint payment_events_provider_not_blank
    check (btrim(provider) <> ''),

  constraint payment_events_provider_event_not_blank
    check (btrim(provider_event_id) <> ''),

  constraint payment_events_event_type_not_blank
    check (btrim(event_type) <> ''),

  constraint payment_events_provider_event_unique
    unique (provider, provider_event_id)
);

create index if not exists idx_payment_events_charge
  on public.payment_events(charge_id, received_at desc);

create index if not exists idx_payment_events_unprocessed
  on public.payment_events(received_at)
  where processed_at is null;

-- ------------------------------------------------------------
-- 8. LEDGER AUDITAVEL DE COMISSOES
-- ------------------------------------------------------------

create table if not exists public.subscription_commission_entries (
  id uuid primary key default gen_random_uuid(),

  charge_id uuid not null
    references public.subscription_charges(id)
    on delete restrict,

  cycle_id uuid not null
    references public.subscription_cycles(id)
    on delete restrict,

  barber_id uuid not null
    references public.barbers(id)
    on delete restrict,

  entry_type text not null,

  amount numeric(10,2) not null,

  -- Percentual fica opcional enquanto a regra financeira
  -- ainda nao estiver definida.
  rate numeric(8,4),

  reverses_entry_id uuid
    references public.subscription_commission_entries(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint subscription_commission_entries_type_valid
    check (entry_type in ('commission', 'reversal')),

  constraint subscription_commission_entries_amount_nonnegative
    check (amount >= 0),

  constraint subscription_commission_entries_rate_valid
    check (rate is null or rate >= 0),

  constraint subscription_commission_reversal_reference_valid
    check (
      (entry_type = 'commission' and reverses_entry_id is null)
      or
      (entry_type = 'reversal' and reverses_entry_id is not null)
    )
);

-- Uma comissao positiva por cobranca.
create unique index if not exists uq_subscription_commission_per_charge
  on public.subscription_commission_entries(charge_id)
  where entry_type = 'commission';

-- Uma reversao para cada lancamento original.
create unique index if not exists uq_subscription_commission_reversal
  on public.subscription_commission_entries(reverses_entry_id)
  where entry_type = 'reversal';

create index if not exists idx_subscription_commission_barber
  on public.subscription_commission_entries(barber_id, created_at desc);

create index if not exists idx_subscription_commission_cycle
  on public.subscription_commission_entries(cycle_id);

-- ------------------------------------------------------------
-- 9. RLS
--
-- Nenhuma dessas estruturas financeiras deve ficar gravavel
-- pelo cliente diretamente. Service role/backend continua
-- podendo operar, enquanto clientes anon/authenticated nao
-- recebem policy de escrita por este script.
-- ------------------------------------------------------------

alter table public.subscription_plans enable row level security;
alter table public.subscription_cycles enable row level security;
alter table public.subscription_capacity_reservations enable row level security;
alter table public.subscription_charges enable row level security;
alter table public.payment_events enable row level security;
alter table public.subscription_commission_entries enable row level security;

-- Catalogo comercial ativo pode ser consultado publicamente.
drop policy if exists "Public can read active subscription plans"
  on public.subscription_plans;

create policy "Public can read active subscription plans"
  on public.subscription_plans
  for select
  to anon, authenticated
  using (active = true);

-- Nenhuma policy publica de INSERT/UPDATE/DELETE e criada
-- para ciclos, reservas, cobrancas, eventos ou comissoes.
-- A futura integracao de pagamento sera feita pelo servidor.

-- ------------------------------------------------------------
-- 10. FUNCAO TRANSACIONAL DE RESERVA DE VAGA
--
-- Bloqueia a linha do barbeiro antes de contar ocupacao.
-- Assim checkouts simultaneos nao conseguem exceder capacidade.
-- ------------------------------------------------------------

create or replace function public.reserve_subscription_capacity(
  p_subscription_id uuid,
  p_barber_id uuid,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_occupied integer;
  v_existing_id uuid;
  v_reservation_id uuid;
begin
  if p_expires_at <= now() then
    raise exception 'reservation expiration must be in the future';
  end if;

  -- Serializa alteracoes de capacidade deste barbeiro.
  select subscriber_capacity
    into v_capacity
  from public.barbers
  where id = p_barber_id
    and active = true
  for update;

  if not found then
    raise exception 'barber not found or inactive';
  end if;

  -- A reserva so pode pertencer a uma assinatura existente.
  if not exists (
    select 1
    from public.subscriptions
    where id = p_subscription_id
  ) then
    raise exception 'subscription not found';
  end if;

  -- Idempotencia basica: devolve hold vigente existente.
  select id
    into v_existing_id
  from public.subscription_capacity_reservations
  where subscription_id = p_subscription_id
    and barber_id = p_barber_id
    and status = 'held'
    and expires_at > now()
  limit 1;

  if v_existing_id is not null then
    return v_existing_id;
  end if;

  -- Holds vencidos deixam de consumir capacidade.
  update public.subscription_capacity_reservations
  set
    status = 'expired',
    updated_at = now()
  where barber_id = p_barber_id
    and status = 'held'
    and expires_at <= now();

  -- Ciclos pagos ou em carencia ainda reservam vaga.
  -- DISTINCT evita contar mais de uma vez a mesma assinatura
  -- em situacoes de transicao.
  select count(distinct occupied.subscription_id)
    into v_occupied
  from (
    select c.subscription_id
    from public.subscription_cycles c
    where c.barber_id = p_barber_id
      and c.status in ('paid', 'grace')
      and c.grace_until > now()

    union

    select r.subscription_id
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
    status,
    expires_at
  )
  values (
    p_subscription_id,
    p_barber_id,
    'held',
    p_expires_at
  )
  returning id into v_reservation_id;

  return v_reservation_id;
end;
$$;

-- Nao permitir chamada direta pelo navegador.
revoke all on function public.reserve_subscription_capacity(uuid, uuid, timestamptz)
  from public;

revoke all on function public.reserve_subscription_capacity(uuid, uuid, timestamptz)
  from anon;

revoke all on function public.reserve_subscription_capacity(uuid, uuid, timestamptz)
  from authenticated;

-- ------------------------------------------------------------
-- 11. OBSERVACAO DE SEGURANCA
--
-- Confirmacao de pagamento, ativacao do ciclo, consumo de hold
-- e criacao de comissao deverao ser implementados em operacao
-- server-side idempotente quando o gateway for escolhido.
--
-- Nenhum retorno do navegador sera suficiente para marcar
-- pagamento como confirmado.
-- ------------------------------------------------------------

commit;

