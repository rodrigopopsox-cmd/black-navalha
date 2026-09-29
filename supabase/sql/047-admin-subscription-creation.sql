begin;

-- ============================================================
-- NOVA ASSINATURA ADMIN — PAGAMENTO EXTERNO
-- ============================================================
--
-- Representa uma mensalidade REALMENTE recebida fora do Mercado Pago.
--
-- Exemplos:
--   cash          = dinheiro
--   pix_in_person = PIX presencial
--   other         = outro meio, com observação obrigatória
--
-- Esta migration NÃO implementa cortesia.
-- Esta migration NÃO fabrica Order Mercado Pago.
-- Preparação para PIX continua usando create_subscription_checkout.
--
-- Regras autoritativas:
-- - Admin autenticado obrigatório.
-- - Cliente já existe e é identificado por customer_id.
-- - Plano ativo vem do catálogo.
-- - Preço vem exclusivamente de subscription_plans.
-- - Barbeiro precisa estar ativo.
-- - Capacidade total e por grupo é validada sob lock.
-- - Benefícios vêm exclusivamente de subscription_plan_services.
-- - subscription_cycle_services congela o snapshot do ciclo.
-- - subscription_services é mantida somente por compatibilidade.
-- - Pagamento externo cria charge paid auditável.
-- - Comissão usa a taxa histórica vigente do barbeiro naquele lançamento.
-- - Nenhum histórico anterior é recalculado.
-- - Plano Mensal legado com plan_id NULL não é convertido.

-- ============================================================
-- AUDITORIA DO PAGAMENTO EXTERNO
-- ============================================================

alter table public.subscription_charges
  add column if not exists external_payment_method text;

alter table public.subscription_charges
  add column if not exists recorded_by_admin_user_id uuid
    references auth.users(id)
    on delete set null;

alter table public.subscription_charges
  add column if not exists administrative_note text;

alter table public.subscription_charges
  drop constraint if exists subscription_charges_external_payment_method_valid;

alter table public.subscription_charges
  add constraint subscription_charges_external_payment_method_valid
  check (
    external_payment_method is null
    or external_payment_method in (
      'cash',
      'pix_in_person',
      'other'
    )
  );

-- ============================================================
-- ADMIN — CONFIRMA PAGAMENTO EXTERNO E CRIA O CICLO
-- ============================================================

create or replace function public.admin_confirm_external_subscription_payment(
  p_customer_id uuid,
  p_plan_id uuid,
  p_barber_id uuid,
  p_payment_method text,
  p_administrative_note text default null
)
returns table (
  charge_id uuid,
  subscription_id uuid,
  cycle_id uuid
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_admin_user_id uuid := auth.uid();

  v_customer public.customers%rowtype;
  v_plan public.subscription_plans%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_current_cycle public.subscription_cycles%rowtype;
  v_cycle public.subscription_cycles%rowtype;
  v_charge public.subscription_charges%rowtype;

  v_total_capacity integer;
  v_group_capacity integer;
  v_total_occupied integer;
  v_group_occupied integer;

  v_paid_at timestamptz := now();
  v_paid_date date :=
    (now() at time zone 'America/Sao_Paulo')::date;
  v_period_start date;
  v_period_end date;
  v_grace_until timestamptz;

  v_commission_rate numeric(5,2);
  v_commission_amount numeric(10,2);
begin
  -- ----------------------------------------------------------
  -- ADMIN
  -- ----------------------------------------------------------

  if v_admin_user_id is null
     or not exists (
       select 1
       from public.profiles p
       where p.id = v_admin_user_id
         and p.role = 'admin'
     ) then
    raise exception 'admin access required';
  end if;

  -- ----------------------------------------------------------
  -- MEIO DE PAGAMENTO
  -- ----------------------------------------------------------

  if p_payment_method not in (
    'cash',
    'pix_in_person',
    'other'
  ) then
    raise exception 'invalid external payment method';
  end if;

  if p_payment_method = 'other'
     and length(btrim(coalesce(p_administrative_note, ''))) < 2 then
    raise exception 'administrative note is required for other payment method';
  end if;

  -- ----------------------------------------------------------
  -- CLIENTE
  -- ----------------------------------------------------------

  select c.*
  into v_customer
  from public.customers c
  where c.id = p_customer_id
  for update;

  if not found then
    raise exception 'customer not found';
  end if;

  -- ----------------------------------------------------------
  -- PLANO ATIVO + GRUPO ATIVO
  -- ----------------------------------------------------------

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

  if not exists (
    select 1
    from public.subscription_plan_services ps
    join public.services s
      on s.id = ps.service_id
    where ps.plan_id = v_plan.id
      and s.active = true
      and s.subscriber_service = true
  ) then
    raise exception 'subscription plan has no active benefits';
  end if;

  -- ----------------------------------------------------------
  -- BARBEIRO + LOCK AUTORITATIVO
  -- ----------------------------------------------------------

  select b.subscriber_capacity
  into v_total_capacity
  from public.barbers b
  where b.id = p_barber_id
    and b.active = true
  for update;

  if not found then
    raise exception 'active barber not found';
  end if;

  select g.per_barber_capacity
  into v_group_capacity
  from public.subscription_capacity_groups g
  where g.id = v_plan.capacity_group_id
    and g.active = true
  for share;

  if not found then
    raise exception 'active subscription capacity group not found';
  end if;

  -- ----------------------------------------------------------
  -- ASSINATURA COMERCIAL
  -- O legado plan_id NULL não participa.
  -- ----------------------------------------------------------

  select s.*
  into v_subscription
  from public.subscriptions s
  where s.customer_id = v_customer.id
    and s.plan_id = v_plan.id
  order by s.created_at desc, s.id
  limit 1
  for update;

  if found then
    -- Nova assinatura Admin não é usada para renovar silenciosamente
    -- um ciclo ainda vigente. Renovação continua tendo fluxo próprio.
    select cy.*
    into v_current_cycle
    from public.subscription_cycles cy
    where cy.subscription_id = v_subscription.id
      and cy.status in ('paid', 'grace')
      and cy.grace_until > now()
    order by cy.period_end desc, cy.created_at desc
    limit 1
    for update;

    if found then
      raise exception 'subscription already has a current paid or grace cycle';
    end if;
  else
    insert into public.subscriptions (
      customer_id,
      plan_id,
      name,
      status,
      starts_at,
      expires_at
    )
    values (
      v_customer.id,
      v_plan.id,
      v_plan.name,
      'active',
      v_paid_date,
      null
    )
    returning *
    into v_subscription;
  end if;

  -- ----------------------------------------------------------
  -- CAPACIDADE TOTAL + CAPACIDADE DO GRUPO
  -- ----------------------------------------------------------

  v_total_occupied :=
    public.subscription_capacity_occupancy(
      p_barber_id,
      null,
      null
    );

  v_group_occupied :=
    public.subscription_capacity_occupancy(
      p_barber_id,
      v_plan.capacity_group_id,
      null
    );

  if v_total_occupied >= v_total_capacity then
    raise exception 'barber subscription capacity reached';
  end if;

  if v_group_occupied >= v_group_capacity then
    raise exception 'barber subscription plan capacity reached';
  end if;

  -- ----------------------------------------------------------
  -- PERÍODO
  -- Mesmo princípio de um pagamento confirmado hoje.
  -- ----------------------------------------------------------

  v_period_start := v_paid_date;

  v_period_end :=
    (
      v_period_start
      + make_interval(months => v_plan.billing_interval_months)
    )::date - 1;

  v_grace_until :=
    (
      (v_period_end + 1)::timestamp
      at time zone 'America/Sao_Paulo'
    )
    + make_interval(days => v_plan.grace_days);

  -- ----------------------------------------------------------
  -- CICLO PAGO
  -- ----------------------------------------------------------

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
    p_barber_id,
    v_period_start,
    v_period_end,
    v_grace_until,
    'paid',
    v_plan.price,
    v_plan.capacity_group_id
  )
  returning *
  into v_cycle;

  -- ----------------------------------------------------------
  -- SNAPSHOT DO BENEFÍCIO
  -- ----------------------------------------------------------

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
    and s.active = true
    and s.subscriber_service = true
  on conflict do nothing;

  -- Compatibilidade legada.
  -- NÃO é autoridade do benefício depois da migration 034.
  insert into public.subscription_services (
    subscription_id,
    service_id
  )
  select
    v_subscription.id,
    ps.service_id
  from public.subscription_plan_services ps
  join public.services s
    on s.id = ps.service_id
  where ps.plan_id = v_plan.id
    and s.active = true
    and s.subscriber_service = true
  on conflict do nothing;

  -- ----------------------------------------------------------
  -- ASSINATURA REFLETE O CICLO PAGO
  -- ----------------------------------------------------------

  update public.subscriptions
  set
    name = v_plan.name,
    status = 'active',
    starts_at = least(starts_at, v_period_start),
    expires_at = v_period_end,
    plan_id = v_plan.id,
    updated_at = now()
  where id = v_subscription.id
  returning *
  into v_subscription;

  -- ----------------------------------------------------------
  -- CHARGE AUDITÁVEL DO PAGAMENTO EXTERNO
  -- Não existe Order Mercado Pago.
  -- ----------------------------------------------------------

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
    paid_at,
    external_payment_method,
    recorded_by_admin_user_id,
    administrative_note
  )
  values (
    v_subscription.id,
    v_cycle.id,
    v_plan.id,
    p_barber_id,
    v_plan.price,
    'BRL',
    'paid',
    'admin_external',
    null,
    'admin-external:' || v_cycle.id::text,
    v_paid_at,
    p_payment_method,
    v_admin_user_id,
    nullif(btrim(coalesce(p_administrative_note, '')), '')
  )
  returning *
  into v_charge;

  -- ----------------------------------------------------------
  -- COMISSÃO HISTÓRICA
  -- Somente porque houve pagamento real.
  -- ----------------------------------------------------------

  select b.subscription_commission_rate
  into v_commission_rate
  from public.barbers b
  where b.id = v_cycle.barber_id;

  if not found then
    raise exception 'barber not found for commission';
  end if;

  v_commission_rate := coalesce(v_commission_rate, 0);

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
    v_cycle.id;
end;
$function$;

revoke all on function public.admin_confirm_external_subscription_payment(
  uuid,
  uuid,
  uuid,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.admin_confirm_external_subscription_payment(
  uuid,
  uuid,
  uuid,
  text,
  text
) to authenticated;

commit;
