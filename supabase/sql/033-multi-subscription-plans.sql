begin;

-- ============================================================
-- BLACK NAVALHA — CATÁLOGO MULTIPLANO E GRUPOS DE CAPACIDADE
-- ============================================================

-- 30 vagas totais por barbeiro permanecem em barbers.subscriber_capacity.
-- Dentro desse total:
--   BLACK_STANDARD: 25 vagas compartilhadas por Essencial + Black Navalha.
--   BLACK_PREMIUM:   5 vagas reservadas ao Premium.
--
-- A proteção concorrente continuará usando SELECT ... FOR UPDATE
-- na linha do barbeiro. As RPCs são redefinidas abaixo nesta migration.

create table if not exists public.subscription_capacity_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  per_barber_capacity integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscription_capacity_groups_code_not_blank
    check (length(btrim(code)) > 0),

  constraint subscription_capacity_groups_name_not_blank
    check (length(btrim(name)) > 0),

  constraint subscription_capacity_groups_capacity_positive
    check (per_barber_capacity > 0)
);

alter table public.subscription_capacity_groups enable row level security;

drop policy if exists "Public can read active subscription capacity groups"
  on public.subscription_capacity_groups;

create policy "Public can read active subscription capacity groups"
  on public.subscription_capacity_groups
  for select
  to anon, authenticated
  using (active = true);

alter table public.subscription_plans
  add column if not exists capacity_group_id uuid
    references public.subscription_capacity_groups(id)
    on delete restrict;

alter table public.subscription_capacity_reservations
  add column if not exists plan_id uuid
    references public.subscription_plans(id)
    on delete restrict;

alter table public.subscription_capacity_reservations
  add column if not exists capacity_group_id uuid
    references public.subscription_capacity_groups(id)
    on delete restrict;

alter table public.subscription_cycles
  add column if not exists capacity_group_id uuid
    references public.subscription_capacity_groups(id)
    on delete restrict;

create index if not exists idx_subscription_capacity_reservations_plan
  on public.subscription_capacity_reservations(plan_id, barber_id, status, expires_at);

create index if not exists idx_subscription_capacity_reservations_group
  on public.subscription_capacity_reservations(
    capacity_group_id,
    barber_id,
    status,
    expires_at
  );

create index if not exists idx_subscription_cycles_capacity_group
  on public.subscription_cycles(
    capacity_group_id,
    barber_id,
    status,
    grace_until
  );

create table if not exists public.subscription_plan_services (
  plan_id uuid not null
    references public.subscription_plans(id)
    on delete restrict,

  service_id uuid not null
    references public.services(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  primary key (plan_id, service_id)
);

create table if not exists public.subscription_cycle_services (
  cycle_id uuid not null
    references public.subscription_cycles(id)
    on delete restrict,

  service_id uuid not null
    references public.services(id)
    on delete restrict,

  service_name text not null,
  created_at timestamptz not null default now(),

  primary key (cycle_id, service_id),

  constraint subscription_cycle_services_name_not_blank
    check (length(btrim(service_name)) > 0)
);

create index if not exists idx_subscription_cycle_services_service
  on public.subscription_cycle_services(service_id, cycle_id);

alter table public.subscription_cycle_services enable row level security;
alter table public.subscription_plan_services enable row level security;

drop policy if exists "Public can read active subscription plan services"
  on public.subscription_plan_services;

create policy "Public can read active subscription plan services"
  on public.subscription_plan_services
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.subscription_plans p
      where p.id = subscription_plan_services.plan_id
        and p.active = true
    )
  );

-- ============================================================
-- ADMIN — GESTÃO DO CATÁLOGO
-- ============================================================

grant select, insert, update
on public.subscription_capacity_groups
to authenticated;

grant select, insert, update, delete
on public.subscription_plan_services
to authenticated;

-- subscription_plans já possui leitura pública dos ativos.
-- Escrita administrativa continua explicitamente protegida por RLS.
grant insert, update
on public.subscription_plans
to authenticated;

drop policy if exists "Admin can manage subscription capacity groups"
  on public.subscription_capacity_groups;

create policy "Admin can manage subscription capacity groups"
  on public.subscription_capacity_groups
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "Admin can manage subscription plan services"
  on public.subscription_plan_services;

create policy "Admin can manage subscription plan services"
  on public.subscription_plan_services
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "Admin can insert subscription plans"
  on public.subscription_plans;

create policy "Admin can insert subscription plans"
  on public.subscription_plans
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "Admin can update subscription plans"
  on public.subscription_plans;

create policy "Admin can update subscription plans"
  on public.subscription_plans
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- Snapshot de ciclo nunca é administrado diretamente pelo browser.
revoke all on public.subscription_cycle_services from public, anon, authenticated;

-- A configuração comercial não pode apontar para serviço comum.
create or replace function public.enforce_subscription_plan_service()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if not exists (
    select 1
    from public.services s
    where s.id = new.service_id
      and s.subscriber_service = true
  ) then
    raise exception 'plan service must be a subscriber service';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_subscription_plan_service_valid
  on public.subscription_plan_services;

create trigger trg_subscription_plan_service_valid
before insert or update
on public.subscription_plan_services
for each row
execute function public.enforce_subscription_plan_service();
-- Grupos iniciais. Os limites poderão ser gerenciados pelo Admin.
insert into public.subscription_capacity_groups (
  code,
  name,
  per_barber_capacity
)
values
  ('BLACK_STANDARD', 'Black Essencial + Black Navalha', 25),
  ('BLACK_PREMIUM', 'Black Premium', 5)
on conflict (code) do update
set
  name = excluded.name,
  per_barber_capacity = excluded.per_barber_capacity,
  active = true,
  updated_at = now();

-- As cotas iniciais devem caber na capacidade de todos os barbeiros ativos.
-- A proteção transacional continuará validando também cada checkout.
do $block$
declare
  v_required_capacity integer;
begin
  select coalesce(sum(g.per_barber_capacity), 0)
  into v_required_capacity
  from public.subscription_capacity_groups g
  where g.active = true;

  if exists (
    select 1
    from public.barbers b
    where b.active = true
      and b.subscriber_capacity < v_required_capacity
  ) then
    raise exception
      'active barber capacity is lower than configured subscription group capacity';
  end if;
end;
$block$;
-- O plano legado não é apagado: existem charges históricas associadas.
update public.subscription_plans
set
  active = false,
  updated_at = now()
where id = '27fcd639-ddb5-43ab-8ddc-3fd141424fb5'::uuid
  and name = 'Plano Mensal';

-- Novos planos comerciais.
insert into public.subscription_plans (
  name,
  price,
  billing_interval_months,
  grace_days,
  active,
  capacity_group_id
)
select
  'Black Essencial',
  85.00,
  1,
  2,
  true,
  g.id
from public.subscription_capacity_groups g
where g.code = 'BLACK_STANDARD'
  and not exists (
    select 1
    from public.subscription_plans p
    where p.name = 'Black Essencial'
  );

insert into public.subscription_plans (
  name,
  price,
  billing_interval_months,
  grace_days,
  active,
  capacity_group_id
)
select
  'Black Navalha',
  145.00,
  1,
  2,
  true,
  g.id
from public.subscription_capacity_groups g
where g.code = 'BLACK_STANDARD'
  and not exists (
    select 1
    from public.subscription_plans p
    where p.name = 'Black Navalha'
  );

insert into public.subscription_plans (
  name,
  price,
  billing_interval_months,
  grace_days,
  active,
  capacity_group_id
)
select
  'Black Premium',
  200.00,
  1,
  2,
  true,
  g.id
from public.subscription_capacity_groups g
where g.code = 'BLACK_PREMIUM'
  and not exists (
    select 1
    from public.subscription_plans p
    where p.name = 'Black Premium'
  );

-- Garante vínculo de grupo também se os planos já existirem.
update public.subscription_plans p
set capacity_group_id = g.id
from public.subscription_capacity_groups g
where
  (p.name in ('Black Essencial', 'Black Navalha') and g.code = 'BLACK_STANDARD')
  or
  (p.name = 'Black Premium' and g.code = 'BLACK_PREMIUM');

-- ============================================================
-- SERVIÇOS DE BENEFÍCIO
-- Serviços comuns permanecem intactos.
-- Novas versões seguem preço zero + subscriber_service=true.
-- ============================================================

insert into public.services (
  name,
  description,
  category,
  price,
  duration_minutes,
  subscriber_service,
  active
)
select
  'Raspado Assinante Mensal',
  'Raspado incluído nos planos elegíveis da Black Navalha.',
  'Assinatura',
  0.00,
  s.duration_minutes,
  true,
  true
from public.services s
where s.name = 'Raspado'
  and s.active = true
  and not exists (
    select 1 from public.services x
    where x.name = 'Raspado Assinante Mensal'
  );

insert into public.services (
  name, description, category, price, duration_minutes, subscriber_service, active
)
select
  'Sobrancelha Assinante Mensal',
  'Sobrancelha incluída nos planos elegíveis da Black Navalha.',
  'Assinatura',
  0.00,
  s.duration_minutes,
  true,
  true
from public.services s
where s.name = 'Sobrancelha'
  and s.active = true
  and not exists (
    select 1 from public.services x
    where x.name = 'Sobrancelha Assinante Mensal'
  );

insert into public.services (
  name, description, category, price, duration_minutes, subscriber_service, active
)
select
  'Barba Premium Assinante Mensal',
  'Barba Premium incluída no Black Premium.',
  'Assinatura',
  0.00,
  s.duration_minutes,
  true,
  true
from public.services s
where s.name = 'Barba Premium'
  and s.active = true
  and not exists (
    select 1 from public.services x
    where x.name = 'Barba Premium Assinante Mensal'
  );

insert into public.services (
  name, description, category, price, duration_minutes, subscriber_service, active
)
select
  'Hidratação Capilar Assinante Mensal',
  'Hidratação Capilar incluída no Black Premium.',
  'Assinatura',
  0.00,
  s.duration_minutes,
  true,
  true
from public.services s
where s.name = 'Hidratação Capilar'
  and s.active = true
  and not exists (
    select 1 from public.services x
    where x.name = 'Hidratação Capilar Assinante Mensal'
  );

insert into public.services (
  name, description, category, price, duration_minutes, subscriber_service, active
)
select
  'Pigmentação Barba Assinante Mensal',
  'Pigmentação de Barba incluída no Black Premium.',
  'Assinatura',
  0.00,
  s.duration_minutes,
  true,
  true
from public.services s
where s.name = 'Pigmentação Barba'
  and s.active = true
  and not exists (
    select 1 from public.services x
    where x.name = 'Pigmentação Barba Assinante Mensal'
  );

insert into public.services (
  name, description, category, price, duration_minutes, subscriber_service, active
)
select
  'Pigmentação Cabelo Assinante Mensal',
  'Pigmentação de Cabelo incluída no Black Premium.',
  'Assinatura',
  0.00,
  s.duration_minutes,
  true,
  true
from public.services s
where s.name = 'Pigmentação Cabelo'
  and s.active = true
  and not exists (
    select 1 from public.services x
    where x.name = 'Pigmentação Cabelo Assinante Mensal'
  );

-- ============================================================
-- COMPOSIÇÃO DOS PLANOS
-- ============================================================

-- Essencial: 4 benefícios.
insert into public.subscription_plan_services (plan_id, service_id)
select p.id, s.id
from public.subscription_plans p
join public.services s
  on s.name in (
    'Barba Assinante Mensal',
    'Raspado Assinante Mensal',
    'Raspado + Barba Assinante Mensal',
    'Sobrancelha Assinante Mensal'
  )
where p.name = 'Black Essencial'
on conflict do nothing;

-- Black Navalha: Essencial + Cabelo + Cabelo e Barba.
insert into public.subscription_plan_services (plan_id, service_id)
select p.id, s.id
from public.subscription_plans p
join public.services s
  on s.name in (
    'Barba Assinante Mensal',
    'Raspado Assinante Mensal',
    'Raspado + Barba Assinante Mensal',
    'Sobrancelha Assinante Mensal',
    'Cabelo Assinante Mensal',
    'Cabelo + Barba Assinante Mensal'
  )
where p.name = 'Black Navalha'
on conflict do nothing;

-- Premium: todos os 10 benefícios.
insert into public.subscription_plan_services (plan_id, service_id)
select p.id, s.id
from public.subscription_plans p
join public.services s
  on s.name in (
    'Barba Assinante Mensal',
    'Raspado Assinante Mensal',
    'Raspado + Barba Assinante Mensal',
    'Sobrancelha Assinante Mensal',
    'Cabelo Assinante Mensal',
    'Cabelo + Barba Assinante Mensal',
    'Barba Premium Assinante Mensal',
    'Hidratação Capilar Assinante Mensal',
    'Pigmentação Barba Assinante Mensal',
    'Pigmentação Cabelo Assinante Mensal'
  )
where p.name = 'Black Premium'
on conflict do nothing;

-- ============================================================
-- ATENÇÃO
-- As RPCs de capacidade/checkout/confirmação serão redefinidas
-- abaixo antes de esta migration ser aplicada.
-- NÃO executar este arquivo enquanto este marcador existir.
-- ============================================================

-- ============================================================
-- HELPERS INTERNOS DE CAPACIDADE
-- ============================================================

create or replace function public.subscription_capacity_occupancy(
  p_barber_id uuid,
  p_capacity_group_id uuid default null,
  p_exclude_reservation_id uuid default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $function$
  select count(*)::integer
  from (
    select
      'subscription:' || cy.subscription_id::text as occupancy_key
    from public.subscription_cycles cy
    where cy.barber_id = p_barber_id
      and cy.status in ('paid', 'grace')
      and cy.grace_until > now()
      and (
        p_capacity_group_id is null
        or cy.capacity_group_id = p_capacity_group_id
      )
    group by cy.subscription_id

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
      and (
        p_capacity_group_id is null
        or r.capacity_group_id = p_capacity_group_id
      )
      and (
        p_exclude_reservation_id is null
        or r.id <> p_exclude_reservation_id
      )
  ) occupied;
$function$;

revoke all on function public.subscription_capacity_occupancy(uuid, uuid, uuid)
from public, anon, authenticated;

create or replace function public.subscription_already_occupies_capacity(
  p_subscription_id uuid,
  p_barber_id uuid,
  p_capacity_group_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.subscription_cycles cy
    where cy.subscription_id = p_subscription_id
      and cy.barber_id = p_barber_id
      and cy.capacity_group_id = p_capacity_group_id
      and cy.status in ('paid', 'grace')
      and cy.grace_until > now()
  );
$function$;

revoke all on function public.subscription_already_occupies_capacity(uuid, uuid, uuid)
from public, anon, authenticated;
-- ============================================================
-- RESERVA TRANSACIONAL — CAPACIDADE TOTAL + GRUPO DO PLANO
-- ============================================================

create or replace function public.reserve_subscription_checkout_capacity(
  p_plan_id uuid,
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
as $function$
declare
  v_total_capacity integer;
  v_group_id uuid;
  v_group_capacity integer;
  v_total_occupied integer;
  v_group_occupied integer;
  v_subscription_already_occupies boolean := false;
  v_existing public.subscription_capacity_reservations%rowtype;
  v_new public.subscription_capacity_reservations%rowtype;
begin
  if p_checkout_token is null then
    raise exception 'checkout token is required';
  end if;

  if p_expires_at <= now() then
    raise exception 'reservation expiration must be in the future';
  end if;

  select p.capacity_group_id, g.per_barber_capacity
  into v_group_id, v_group_capacity
  from public.subscription_plans p
  join public.subscription_capacity_groups g
    on g.id = p.capacity_group_id
   and g.active = true
  where p.id = p_plan_id
    and p.active = true
  for share of p, g;

  if not found or v_group_id is null then
    raise exception 'subscription plan capacity group not found';
  end if;

  if p_subscription_id is not null
     and not exists (
       select 1
       from public.subscriptions s
       where s.id = p_subscription_id
         and s.plan_id = p_plan_id
     ) then
    raise exception 'subscription does not belong to plan';
  end if;

  -- Lock obrigatório: serializa TODA disputa de capacidade do barbeiro.
  select b.subscriber_capacity
  into v_total_capacity
  from public.barbers b
  where b.id = p_barber_id
    and b.active = true
  for update;

  if not found then
    raise exception 'barber not found or inactive';
  end if;

  if v_group_capacity > v_total_capacity then
    raise exception 'plan group capacity exceeds barber total capacity';
  end if;

  -- Mesmo token representa a mesma tentativa.
  select r.*
  into v_existing
  from public.subscription_capacity_reservations r
  where r.checkout_token = p_checkout_token
  limit 1;

  if found then
    if v_existing.barber_id <> p_barber_id
       or v_existing.plan_id is distinct from p_plan_id
       or v_existing.capacity_group_id is distinct from v_group_id then
      raise exception 'checkout token belongs to another reservation';
    end if;

    if v_existing.status = 'held'
       and v_existing.expires_at > now() then
      return query
      select v_existing.id, v_existing.checkout_token, v_existing.expires_at;
      return;
    end if;

    raise exception 'checkout reservation is no longer active';
  end if;

  -- Holds vencidos deixam de ocupar capacidade.
  update public.subscription_capacity_reservations r
  set
    status = 'expired',
    updated_at = now()
  where r.barber_id = p_barber_id
    and r.status = 'held'
    and r.expires_at <= now();

  if p_subscription_id is not null then
    v_subscription_already_occupies :=
      public.subscription_already_occupies_capacity(
        p_subscription_id,
        p_barber_id,
        v_group_id
      );
  end if;

  v_total_occupied :=
    public.subscription_capacity_occupancy(p_barber_id, null, null);

  v_group_occupied :=
    public.subscription_capacity_occupancy(p_barber_id, v_group_id, null);

  -- Renovar a própria vaga no mesmo barbeiro/grupo não cria ocupação extra.
  if not v_subscription_already_occupies then
    if v_total_occupied >= v_total_capacity then
      raise exception 'barber subscription capacity reached';
    end if;

    if v_group_occupied >= v_group_capacity then
      raise exception 'barber subscription plan capacity reached';
    end if;
  end if;

  insert into public.subscription_capacity_reservations (
    subscription_id,
    plan_id,
    capacity_group_id,
    barber_id,
    checkout_token,
    status,
    expires_at
  )
  values (
    p_subscription_id,
    p_plan_id,
    v_group_id,
    p_barber_id,
    p_checkout_token,
    'held',
    p_expires_at
  )
  returning *
  into v_new;

  return query
  select v_new.id, v_new.checkout_token, v_new.expires_at;
end;
$function$;

revoke all on function public.reserve_subscription_checkout_capacity(
  uuid,
  uuid,
  timestamptz,
  uuid,
  uuid
) from public, anon, authenticated;

-- A assinatura antiga não pode continuar sendo usada depois da 033.
revoke all on function public.reserve_subscription_checkout_capacity(
  uuid,
  timestamptz,
  uuid,
  uuid
) from public, anon, authenticated, service_role;
-- ============================================================
-- CHECKOUT — PLANO AUTORITATIVO + HOLD DE 30 MINUTOS
-- ============================================================

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
as $function$
declare
  v_plan public.subscription_plans%rowtype;
  v_existing public.subscription_charges%rowtype;
  v_customer public.customers%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_current_cycle public.subscription_cycles%rowtype;
  v_reservation record;
  v_charge public.subscription_charges%rowtype;
  v_phone text;
  v_reservation_subscription_id uuid := null;
  v_expires_at timestamptz := now() + interval '30 minutes';
  v_renewal_opens_on date;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if p_checkout_token is null then
    raise exception 'checkout token is required';
  end if;

  if length(btrim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'invalid customer name';
  end if;

  v_phone := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');

  if length(v_phone) < 10 or length(v_phone) > 11 then
    raise exception 'invalid customer phone';
  end if;

  -- Mesmo token continua idempotente.
  select c.*
  into v_existing
  from public.subscription_charges c
  where c.checkout_token = p_checkout_token
  limit 1;

  if found then
    if v_existing.plan_id is distinct from p_plan_id
       or v_existing.barber_id is distinct from p_barber_id then
      raise exception 'checkout token belongs to another checkout';
    end if;

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

  select p.*
  into v_plan
  from public.subscription_plans p
  join public.subscription_capacity_groups g
    on g.id = p.capacity_group_id
   and g.active = true
  where p.id = p_plan_id
    and p.active = true
  for share of p;

  if not found or v_plan.capacity_group_id is null then
    raise exception 'plan not found, inactive or without capacity group';
  end if;

  -- Identificação server-side somente para a regra de renovação.
  select c.*
  into v_customer
  from public.customers c
  where regexp_replace(c.phone, '\D', '', 'g') = v_phone
  order by c.created_at, c.id
  limit 1;

  if found then
    -- Renovação continua vinculada ao MESMO plano.
    -- Upgrade/downgrade não é inferido automaticamente.
    select s.*
    into v_subscription
    from public.subscriptions s
    where s.customer_id = v_customer.id
      and s.plan_id = v_plan.id
    order by s.created_at desc, s.id
    limit 1;

    if found then
      select cy.*
      into v_current_cycle
      from public.subscription_cycles cy
      where cy.subscription_id = v_subscription.id
        and cy.status in ('paid', 'grace')
        and cy.grace_until > now()
      order by cy.period_end desc, cy.created_at desc
      limit 1;

      if found then
        v_renewal_opens_on := v_current_cycle.period_end - 7;

        if v_today < v_renewal_opens_on then
          raise exception
            'subscription renewal not available before %',
            to_char(v_renewal_opens_on, 'YYYY-MM-DD');
        end if;

        -- Mesmo barbeiro e mesmo grupo: preserva a própria vaga.
        if v_current_cycle.barber_id = p_barber_id
           and v_current_cycle.capacity_group_id = v_plan.capacity_group_id then
          v_reservation_subscription_id := v_subscription.id;
        end if;
      end if;
    end if;
  end if;

  select *
  into v_reservation
  from public.reserve_subscription_checkout_capacity(
    p_plan_id,
    p_barber_id,
    v_expires_at,
    p_checkout_token,
    v_reservation_subscription_id
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
    case
      when v_current_cycle.id is not null then v_subscription.id
      else null
    end,
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
    v_phone,
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
$function$;

revoke all on function public.create_subscription_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  uuid
) from public, anon, authenticated;

grant execute on function public.create_subscription_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  uuid
) to service_role;
-- ============================================================
-- CONFIRMAÇÃO FINANCEIRA MULTIPLANO
-- Preserva idempotência e comissão administrativa da migration 032.
-- ============================================================
create or replace function public.confirm_mercado_pago_subscription_payment(
  p_charge_id uuid,
  p_provider_charge_id text,
  p_paid_at timestamptz default now()
)
returns table (
  charge_id uuid,
  subscription_id uuid,
  cycle_id uuid,
  already_processed boolean
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_charge public.subscription_charges%rowtype;
  v_plan public.subscription_plans%rowtype;
  v_customer public.customers%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_cycle public.subscription_cycles%rowtype;
  v_reservation public.subscription_capacity_reservations%rowtype;
  v_phone text;
  v_paid_date date;
  v_period_start date;
  v_period_end date;
  v_grace_until timestamptz;
  v_total_capacity integer;
  v_group_capacity integer;
  v_total_occupied integer;
  v_group_occupied integer;
  v_same_capacity_occupancy boolean := false;
  v_commission_rate numeric(5,2);
  v_commission_amount numeric(10,2);
begin
  if p_charge_id is null then
    raise exception 'charge id is required';
  end if;

  if length(btrim(coalesce(p_provider_charge_id, ''))) = 0 then
    raise exception 'provider charge id is required';
  end if;

  if p_paid_at is null then
    raise exception 'paid at is required';
  end if;

  select c.*
  into v_charge
  from public.subscription_charges c
  where c.id = p_charge_id
  for update;

  if not found then
    raise exception 'subscription charge not found';
  end if;

  if v_charge.provider is distinct from 'mercado_pago' then
    raise exception 'subscription charge provider mismatch';
  end if;

  if v_charge.provider_charge_id is distinct from btrim(p_provider_charge_id) then
    raise exception 'subscription charge provider id mismatch';
  end if;

  if v_charge.status = 'paid' then
    if v_charge.subscription_id is null or v_charge.cycle_id is null then
      raise exception 'paid subscription charge is incomplete';
    end if;

    return query
    select
      v_charge.id,
      v_charge.subscription_id,
      v_charge.cycle_id,
      true;
    return;
  end if;

  if v_charge.status <> 'pending' then
    raise exception 'subscription charge is not pending';
  end if;

  if v_charge.checkout_token is null then
    raise exception 'subscription charge has no checkout token';
  end if;

  v_phone := regexp_replace(coalesce(v_charge.customer_phone, ''), '\D', '', 'g');

  if length(v_phone) < 10 or length(v_phone) > 11 then
    raise exception 'subscription charge has invalid customer phone';
  end if;

  select p.*
  into v_plan
  from public.subscription_plans p
  where p.id = v_charge.plan_id
  for share;

  if not found then
    raise exception 'subscription plan not found';
  end if;

  /*
   * Mantemos o lock do barbeiro também na confirmação.
   * O checkout que originou esta cobrança já passou pela proteção
   * concorrente de reserve_subscription_checkout_capacity, que usa
   * SELECT ... FOR UPDATE.
   */
  select b.subscriber_capacity
  into v_total_capacity
  from public.barbers b
  where b.id = v_charge.barber_id
  for update;

  if not found then
    raise exception 'barber not found';
  end if;

  if v_plan.capacity_group_id is null then
    raise exception 'subscription plan has no capacity group';
  end if;

  select g.per_barber_capacity
  into v_group_capacity
  from public.subscription_capacity_groups g
  where g.id = v_plan.capacity_group_id
    and g.active = true
  for share;

  if not found then
    raise exception 'subscription capacity group not found';
  end if;

  select r.*
  into v_reservation
  from public.subscription_capacity_reservations r
  where r.checkout_token = v_charge.checkout_token
    and r.barber_id = v_charge.barber_id
  for update;

  if not found then
    raise exception 'checkout reservation not found';
  end if;

  if v_reservation.plan_id is distinct from v_charge.plan_id
     or v_reservation.capacity_group_id is distinct from v_plan.capacity_group_id then
    raise exception 'checkout reservation plan capacity mismatch';
  end if;

  /*
   * Um hold vigente já ocupa esta vaga e pode ser consumido.
   * Se o hold expirou antes da confirmação do provedor, a capacidade
   * precisa ser revalidada sob o mesmo lock do barbeiro antes de aceitar
   * financeiramente o ciclo. Nunca ultrapassamos subscriber_capacity.
   */
  if v_reservation.status = 'held' and v_reservation.expires_at <= now() then
    update public.subscription_capacity_reservations
    set status = 'expired', updated_at = now()
    where id = v_reservation.id;

    v_reservation.status := 'expired';
  end if;

  if v_reservation.status = 'expired' then
    v_same_capacity_occupancy :=
      v_reservation.subscription_id is not null
      and public.subscription_already_occupies_capacity(
        v_reservation.subscription_id,
        v_charge.barber_id,
        v_plan.capacity_group_id
      );

    if not v_same_capacity_occupancy then
      v_total_occupied := public.subscription_capacity_occupancy(
        v_charge.barber_id,
        null,
        v_reservation.id
      );

      v_group_occupied := public.subscription_capacity_occupancy(
        v_charge.barber_id,
        v_plan.capacity_group_id,
        v_reservation.id
      );

      if v_total_occupied >= v_total_capacity then
        raise exception 'barber subscription capacity reached after checkout expiration';
      end if;

      if v_group_occupied >= v_group_capacity then
        raise exception 'barber subscription plan capacity reached after checkout expiration';
      end if;
    end if;
  elsif v_reservation.status <> 'held' then
    raise exception 'checkout reservation cannot be consumed';
  end if;
  select c.*
  into v_customer
  from public.customers c
  where regexp_replace(c.phone, '\D', '', 'g') = v_phone
  order by c.created_at, c.id
  limit 1
  for update;

  if not found then
    insert into public.customers (
      name,
      phone,
      email
    )
    values (
      btrim(v_charge.customer_name),
      v_phone,
      nullif(btrim(coalesce(v_charge.customer_email, '')), '')
    )
    returning *
    into v_customer;
  end if;

  /*
   * Para uma contratação inicial, reutilizamos uma assinatura comercial
   * já vinculada ao mesmo cliente/plano quando houver. A assinatura legada
   * com plan_id NULL permanece intocada.
   */
  select s.*
  into v_subscription
  from public.subscriptions s
  where s.customer_id = v_customer.id
    and s.plan_id = v_plan.id
  order by s.created_at desc, s.id
  limit 1
  for update;

  v_paid_date := (p_paid_at at time zone 'America/Sao_Paulo')::date;

  if found then
    select cy.*
    into v_cycle
    from public.subscription_cycles cy
    where cy.subscription_id = v_subscription.id
      and cy.status in ('paid', 'grace')
    order by cy.period_end desc, cy.created_at desc
    limit 1
    for update;

    if found and v_cycle.period_end >= v_paid_date then
      v_period_start := v_cycle.period_end + 1;
    else
      v_period_start := v_paid_date;
    end if;
  else
    insert into public.subscriptions (
      customer_id,
      name,
      status,
      starts_at,
      expires_at,
      plan_id
    )
    values (
      v_customer.id,
      v_plan.name,
      'active',
      v_paid_date,
      null,
      v_plan.id
    )
    returning *
    into v_subscription;

    v_period_start := v_paid_date;
  end if;

  v_period_end :=
    (v_period_start + make_interval(months => v_plan.billing_interval_months))::date - 1;

  v_grace_until :=
    ((v_period_end + 1 + v_plan.grace_days)::timestamp
      at time zone 'America/Sao_Paulo');

  insert into public.subscription_cycles (
    subscription_id,
    plan_id,
    barber_id,
    period_start,
    period_end,
    grace_until,
    status,
    price_amount,
    capacity_group_id
  )
  values (
    v_subscription.id,
    v_plan.id,
    v_charge.barber_id,
    v_period_start,
    v_period_end,
    v_grace_until,
    'paid',
    v_charge.amount,
    v_plan.capacity_group_id
  )
  returning *
  into v_cycle;

  update public.subscriptions
  set
    name = v_plan.name,
    status = 'active',
    starts_at = least(starts_at, v_period_start),
    expires_at = v_period_end,
    plan_id = v_plan.id,
    updated_at = now()
  where id = v_subscription.id;

  /*
   * Congela os benefícios contratados neste ciclo.
   * Alterações administrativas futuras no catálogo só afetam ciclos futuros.
   */
  insert into public.subscription_cycle_services (
    cycle_id,
    service_id,
    service_name
  )
  select
    v_cycle.id,
    s.id,
    s.name
  from public.subscription_plan_services ps
  join public.services s
    on s.id = ps.service_id
  where ps.plan_id = v_plan.id
    and s.subscriber_service = true
  on conflict do nothing;

  /*
   * Compatibilidade com leituras legadas de subscription_services.
   * Esta tabela deixa de ser autoridade para o benefício no /agendar
   * após a migration 034.
   */
  insert into public.subscription_services (
    subscription_id,
    service_id
  )
  select
    v_subscription.id,
    ps.service_id
  from public.subscription_plan_services ps
  where ps.plan_id = v_plan.id
  on conflict do nothing;
  update public.subscription_capacity_reservations
  set
    subscription_id = v_subscription.id,
    cycle_id = v_cycle.id,
    status = 'consumed',
    updated_at = now()
  where id = v_reservation.id;

  update public.subscription_charges
  set
    subscription_id = v_subscription.id,
    cycle_id = v_cycle.id,
    status = 'paid',
    paid_at = p_paid_at,
    updated_at = now()
  where id = v_charge.id
  returning *
  into v_charge;

  /*
   * A comissão nasce somente após a confirmação financeira desta charge.
   * O percentual e o valor ficam congelados no ledger histórico.
   *
   * O barbeiro é o profissional historicamente vinculado ao ciclo pago,
   * portanto uma renovação com troca de profissional pertence ao novo
   * barbeiro.
   */
  select b.subscription_commission_rate
  into v_commission_rate
  from public.barbers b
  where b.id = v_cycle.barber_id;

  if not found then
    raise exception 'barber not found for commission';
  end if;

  if v_commission_rate > 0 then
    v_commission_amount :=
      round((v_charge.amount * v_commission_rate) / 100, 2);

    insert into public.subscription_commission_entries (
      charge_id,
      cycle_id,
      barber_id,
      entry_type,
      amount,
      rate
    )
    values (
      v_charge.id,
      v_cycle.id,
      v_cycle.barber_id,
      'commission',
      v_commission_amount,
      v_commission_rate
    );
  end if;

  return query
  select
    v_charge.id,
    v_subscription.id,
    v_cycle.id,
    false;
end;
$function$;

revoke all on function public.confirm_mercado_pago_subscription_payment(uuid, text, timestamptz)
from public, anon, authenticated;

grant execute on function public.confirm_mercado_pago_subscription_payment(uuid, text, timestamptz)
to service_role;

-- ============================================================
-- VÍNCULOS DOS NOVOS SERVIÇOS COM PROFISSIONAIS
-- Copia somente o vínculo já existente do serviço-base.
-- ============================================================

with service_pairs(base_name, subscriber_name) as (
  values
    ('Raspado', 'Raspado Assinante Mensal'),
    ('Sobrancelha', 'Sobrancelha Assinante Mensal'),
    ('Barba Premium', 'Barba Premium Assinante Mensal'),
    ('Hidratação Capilar', 'Hidratação Capilar Assinante Mensal'),
    ('Pigmentação Barba', 'Pigmentação Barba Assinante Mensal'),
    ('Pigmentação Cabelo', 'Pigmentação Cabelo Assinante Mensal')
)
insert into public.barber_services (barber_id, service_id)
select distinct
  bs.barber_id,
  subscriber.id
from service_pairs pair
join public.services base
  on base.name = pair.base_name
join public.services subscriber
  on subscriber.name = pair.subscriber_name
join public.barber_services bs
  on bs.service_id = base.id
on conflict do nothing;

-- ============================================================
-- DISPONIBILIDADE PÚBLICA POR PLANO
-- Apenas informativa. A reserva transacional continua autoritativa.
-- ============================================================

create or replace function public.get_public_subscription_barbers(
  p_plan_id uuid
)
returns table (
  id uuid,
  name text,
  photo_url text,
  capacity integer,
  available_slots integer
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_group_id uuid;
  v_group_capacity integer;
begin
  select p.capacity_group_id, g.per_barber_capacity
  into v_group_id, v_group_capacity
  from public.subscription_plans p
  join public.subscription_capacity_groups g
    on g.id = p.capacity_group_id
   and g.active = true
  where p.id = p_plan_id
    and p.active = true;

  if not found or v_group_id is null then
    return;
  end if;

  return query
  select
    b.id,
    b.name,
    b.photo_url,
    b.subscriber_capacity,
    greatest(
      least(
        b.subscriber_capacity
          - public.subscription_capacity_occupancy(b.id, null, null),
        v_group_capacity
          - public.subscription_capacity_occupancy(b.id, v_group_id, null)
      ),
      0
    )::integer
  from public.barbers b
  where b.active = true
  order by b.name;
end;
$function$;

revoke all on function public.get_public_subscription_barbers(uuid)
from public;

grant execute on function public.get_public_subscription_barbers(uuid)
to anon, authenticated;

-- Remove acesso público à leitura antiga sem plano.
revoke all on function public.get_public_subscription_barbers()
from public, anon, authenticated;


commit;