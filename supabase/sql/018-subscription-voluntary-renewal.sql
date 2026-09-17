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
as $function$
declare
  v_capacity integer;
  v_occupied integer;
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

  if p_subscription_id is not null
     and not exists (
       select 1
       from public.subscriptions s
       where s.id = p_subscription_id
     ) then
    raise exception 'subscription not found';
  end if;

  /*
   * Lock obrigatorio da linha do barbeiro.
   * Checkouts concorrentes para o mesmo profissional continuam
   * serializados sob SELECT ... FOR UPDATE.
   */
  select b.subscriber_capacity
  into v_capacity
  from public.barbers b
  where b.id = p_barber_id
    and b.active = true
  for update;

  if not found then
    raise exception 'barber not found or inactive';
  end if;

  /*
   * Mesmo token = mesma tentativa.
   */
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

  /*
   * Expira logicamente holds vencidos deste barbeiro antes da contagem.
   */
  update public.subscription_capacity_reservations r
  set
    status = 'expired',
    updated_at = now()
  where r.barber_id = p_barber_id
    and r.status = 'held'
    and r.expires_at <= now();

  /*
   * Se a propria assinatura ja possui um ciclo que ocupa vaga neste
   * barbeiro, renovar com ele nao cria uma nova ocupacao.
   */
  if p_subscription_id is not null then
    select exists (
      select 1
      from public.subscription_cycles cy
      where cy.subscription_id = p_subscription_id
        and cy.barber_id = p_barber_id
        and cy.status in ('paid', 'grace')
        and cy.grace_until > now()
    )
    into v_subscription_already_occupies;
  end if;

  /*
   * Uma assinatura conta apenas uma vez.
   * Checkout sem subscription_id representa nova ocupacao temporaria.
   */
  select count(*)
  into v_occupied
  from (
    select
      'subscription:' || cy.subscription_id::text as occupancy_key
    from public.subscription_cycles cy
    where cy.barber_id = p_barber_id
      and cy.status in ('paid', 'grace')
      and cy.grace_until > now()
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
  ) occupied;

  /*
   * Em lotacao maxima:
   * - assinatura que JA ocupa este barbeiro pode renovar a propria vaga;
   * - qualquer nova ocupacao continua bloqueada.
   */
  if v_occupied >= v_capacity
     and not v_subscription_already_occupies then
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
$function$;

revoke all on function public.reserve_subscription_checkout_capacity(
  uuid,
  timestamptz,
  uuid,
  uuid
) from public, anon, authenticated;
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

  /*
   * Mesmo checkout_token continua idempotente.
   */
  select c.*
  into v_existing
  from public.subscription_charges c
  where c.checkout_token = p_checkout_token
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

  select p.*
  into v_plan
  from public.subscription_plans p
  where p.id = p_plan_id
    and p.active = true
  for share;

  if not found then
    raise exception 'plan not found or inactive';
  end if;

  /*
   * Identificacao server-side somente para aplicar a regra de renovacao.
   * Nenhum dado privado da assinatura e exposto por esta RPC.
   */
  select c.*
  into v_customer
  from public.customers c
  where regexp_replace(c.phone, '\D', '', 'g') = v_phone
  order by c.created_at, c.id
  limit 1;

  if found then
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
        /*
         * Renovacao voluntaria:
         * abre 7 dias antes do fim do ciclo e permanece possivel
         * durante a carencia configurada no proprio ciclo/plano.
         */
        v_renewal_opens_on := v_current_cycle.period_end - 7;

        if v_today < v_renewal_opens_on then
          raise exception
            'subscription renewal not available before %',
            to_char(v_renewal_opens_on, 'YYYY-MM-DD');
        end if;

        /*
         * Mesmo barbeiro: a reserva usa subscription_id e portanto
         * representa a mesma ocupacao ja existente.
         *
         * Outro barbeiro: subscription_id fica NULL para exigir uma
         * vaga real no novo profissional, mantendo a ocupacao antiga
         * preservada ate a confirmacao do novo ciclo.
         */
        if v_current_cycle.barber_id = p_barber_id then
          v_reservation_subscription_id := v_subscription.id;
        end if;
      end if;
    end if;
  end if;

  select *
  into v_reservation
  from public.reserve_subscription_checkout_capacity(
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
  perform 1
  from public.barbers b
  where b.id = v_charge.barber_id
  for update;

  if not found then
    raise exception 'barber not found';
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
    /*
     * Renovacao tardia no mesmo barbeiro:
     * se esta reserva ja representa uma assinatura que continua ocupando
     * este profissional, a confirmacao nao adiciona uma nova vaga.
     *
     * Para contratacao inicial ou troca de barbeiro, subscription_id da
     * reserva e NULL e a capacidade continua sendo revalidada normalmente.
     */
    if not (
      v_reservation.subscription_id is not null
      and exists (
        select 1
        from public.subscription_cycles own_cycle
        where own_cycle.subscription_id = v_reservation.subscription_id
          and own_cycle.barber_id = v_charge.barber_id
          and own_cycle.status in ('paid', 'grace')
          and own_cycle.grace_until > now()
      )
    ) and (
      select count(*)
      from (
        select
          'subscription:' || cy.subscription_id::text as occupancy_key
        from public.subscription_cycles cy
        where cy.barber_id = v_charge.barber_id
          and cy.status in ('paid', 'grace')
          and cy.grace_until > now()
        group by cy.subscription_id

        union

        select
          case
            when r.subscription_id is not null
              then 'subscription:' || r.subscription_id::text
            else 'checkout:' || r.checkout_token::text
          end
        from public.subscription_capacity_reservations r
        where r.barber_id = v_charge.barber_id
          and r.status = 'held'
          and r.expires_at > now()
          and r.id <> v_reservation.id
      ) occupied
    ) >= (
      select b.subscriber_capacity
      from public.barbers b
      where b.id = v_charge.barber_id
    ) then
      raise exception 'barber subscription capacity reached after checkout expiration';
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
    price_amount
  )
  values (
    v_subscription.id,
    v_plan.id,
    v_charge.barber_id,
    v_period_start,
    v_period_end,
    v_grace_until,
    'paid',
    v_charge.amount
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
   * A assinatura concreta recebe os mesmos serviços subscriber_service
   * ativos já usados pela integração existente de benefícios.
   */
  insert into public.subscription_services (
    subscription_id,
    service_id
  )
  select
    v_subscription.id,
    s.id
  from public.services s
  where s.active = true
    and s.subscriber_service = true
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
   * Comissão deliberadamente ausente: percentual/regra financeira
   * continuam não definidos.
   */

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
