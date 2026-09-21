begin;

-- ============================================================
-- LEITURA ADMINISTRATIVA DO CATÁLOGO
-- ============================================================
--
-- A leitura pública continua limitada pelas policies existentes.
-- O Admin precisa visualizar inclusive planos desativados para poder
-- revisá-los e reativá-los.
--
-- Não concedemos DELETE em subscription_plans. Plano comercial é
-- preservado historicamente e deve ser desativado, nunca apagado.

grant select
on public.subscription_plans
to authenticated;

drop policy if exists "Admin can read all subscription plans"
  on public.subscription_plans;

create policy "Admin can read all subscription plans"
  on public.subscription_plans
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
-- ============================================================
-- VALIDAÇÃO ADMINISTRATIVA DA CAPACIDADE DOS PLANOS
-- ============================================================
--
-- A capacidade comercial é configurada por grupo.
-- BLACK_STANDARD e BLACK_PREMIUM continuam grupos independentes.
--
-- A soma dos grupos ativos nunca pode ultrapassar a capacidade
-- total de nenhum barbeiro ativo.
--
-- A validação ocorre no PostgreSQL. O frontend administrativo
-- não é autoridade sobre capacidade.

create or replace function public.validate_subscription_capacity_groups()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_required_capacity integer;
begin
  select coalesce(sum(g.per_barber_capacity), 0)::integer
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

  return null;
end;
$function$;

drop trigger if exists trg_validate_subscription_capacity_groups
  on public.subscription_capacity_groups;

create constraint trigger trg_validate_subscription_capacity_groups
after insert or update or delete
on public.subscription_capacity_groups
deferrable initially deferred
for each row
execute function public.validate_subscription_capacity_groups();

-- Alterar a capacidade total de um barbeiro também precisa respeitar
-- a soma atual dos grupos comerciais ativos.

create or replace function public.validate_barber_subscription_capacity()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_required_capacity integer;
begin
  if new.active = false then
    return new;
  end if;

  select coalesce(sum(g.per_barber_capacity), 0)::integer
  into v_required_capacity
  from public.subscription_capacity_groups g
  where g.active = true;

  if new.subscriber_capacity < v_required_capacity then
    raise exception
      'barber subscription capacity is lower than configured subscription group capacity';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_validate_barber_subscription_capacity
  on public.barbers;

create trigger trg_validate_barber_subscription_capacity
before insert or update of subscriber_capacity, active
on public.barbers
for each row
execute function public.validate_barber_subscription_capacity();

-- ============================================================
-- ADMIN — ESCRITA ATÔMICA DO CATÁLOGO DE PLANOS
-- ============================================================
--
-- Nenhuma RPC abaixo altera ciclos pagos ou snapshots históricos.
-- subscription_plan_services representa somente o catálogo atual.
--
-- Planos nunca são apagados por estas operações. Para encerrar novas
-- vendas, o Admin define active = false.

create or replace function public.admin_create_subscription_plan(
  p_name text,
  p_price numeric,
  p_capacity_group_id uuid,
  p_service_ids uuid[],
  p_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_plan_id uuid;
  v_service_ids uuid[];
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) then
    raise exception 'admin access required';
  end if;

  if length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'plan name is required';
  end if;

  if p_price is null or p_price <= 0 then
    raise exception 'plan price must be positive';
  end if;

  if p_capacity_group_id is null
     or not exists (
       select 1
       from public.subscription_capacity_groups g
       where g.id = p_capacity_group_id
         and g.active = true
     ) then
    raise exception 'active capacity group is required';
  end if;

  select coalesce(array_agg(distinct x.service_id), '{}'::uuid[])
  into v_service_ids
  from unnest(coalesce(p_service_ids, '{}'::uuid[])) as x(service_id);

  if cardinality(v_service_ids) = 0 then
    raise exception 'select at least one subscription service';
  end if;

  if exists (
    select 1
    from unnest(v_service_ids) as x(service_id)
    left join public.services s
      on s.id = x.service_id
     and s.subscriber_service = true
     and s.active = true
    where s.id is null
  ) then
    raise exception 'invalid subscription service';
  end if;

  insert into public.subscription_plans (
    name,
    price,
    billing_interval_months,
    grace_days,
    active,
    capacity_group_id
  )
  values (
    btrim(p_name),
    p_price,
    1,
    2,
    coalesce(p_active, true),
    p_capacity_group_id
  )
  returning id
  into v_plan_id;

  insert into public.subscription_plan_services (
    plan_id,
    service_id
  )
  select
    v_plan_id,
    x.service_id
  from unnest(v_service_ids) as x(service_id);

  return v_plan_id;
end;
$function$;

revoke all on function public.admin_create_subscription_plan(
  text,
  numeric,
  uuid,
  uuid[],
  boolean
) from public, anon, authenticated;

grant execute on function public.admin_create_subscription_plan(
  text,
  numeric,
  uuid,
  uuid[],
  boolean
) to authenticated;


create or replace function public.admin_update_subscription_plan(
  p_plan_id uuid,
  p_name text,
  p_price numeric,
  p_capacity_group_id uuid,
  p_service_ids uuid[],
  p_active boolean,
  p_group_capacity integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_service_ids uuid[];
  v_group public.subscription_capacity_groups%rowtype;
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) then
    raise exception 'admin access required';
  end if;

  if p_plan_id is null
     or not exists (
       select 1
       from public.subscription_plans p
       where p.id = p_plan_id
     ) then
    raise exception 'subscription plan not found';
  end if;

  if length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'plan name is required';
  end if;

  if p_price is null or p_price <= 0 then
    raise exception 'plan price must be positive';
  end if;

  if p_capacity_group_id is null then
    raise exception 'capacity group is required';
  end if;

  select g.*
  into v_group
  from public.subscription_capacity_groups g
  where g.id = p_capacity_group_id
  for update;

  if not found then
    raise exception 'capacity group not found';
  end if;

  if not v_group.active then
    raise exception 'capacity group is inactive';
  end if;

  if p_group_capacity is not null then
    if p_group_capacity <= 0 then
      raise exception 'group capacity must be positive';
    end if;

    update public.subscription_capacity_groups
    set
      per_barber_capacity = p_group_capacity,
      updated_at = now()
    where id = p_capacity_group_id;
  end if;

  select coalesce(array_agg(distinct x.service_id), '{}'::uuid[])
  into v_service_ids
  from unnest(coalesce(p_service_ids, '{}'::uuid[])) as x(service_id);

  if cardinality(v_service_ids) = 0 then
    raise exception 'select at least one subscription service';
  end if;

  if exists (
    select 1
    from unnest(v_service_ids) as x(service_id)
    left join public.services s
      on s.id = x.service_id
     and s.subscriber_service = true
     and s.active = true
    where s.id is null
  ) then
    raise exception 'invalid subscription service';
  end if;

  update public.subscription_plans
  set
    name = btrim(p_name),
    price = p_price,
    active = coalesce(p_active, false),
    capacity_group_id = p_capacity_group_id,
    updated_at = now()
  where id = p_plan_id;

  delete from public.subscription_plan_services ps
  where ps.plan_id = p_plan_id
    and not (ps.service_id = any(v_service_ids));

  insert into public.subscription_plan_services (
    plan_id,
    service_id
  )
  select
    p_plan_id,
    x.service_id
  from unnest(v_service_ids) as x(service_id)
  on conflict do nothing;

  return p_plan_id;
end;
$function$;

revoke all on function public.admin_update_subscription_plan(
  uuid,
  text,
  numeric,
  uuid,
  uuid[],
  boolean,
  integer
) from public, anon, authenticated;

grant execute on function public.admin_update_subscription_plan(
  uuid,
  text,
  numeric,
  uuid,
  uuid[],
  boolean,
  integer
) to authenticated;
commit;