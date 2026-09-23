begin;

-- ============================================================
-- ÁREA DO BARBEIRO — MEUS ASSINANTES
-- ============================================================
--
-- Toda autoridade deriva exclusivamente da sessão:
--
-- auth.uid()
--   -> barbers.auth_user_id
--   -> barbers.id
--
-- Nenhum barber_id, customer_id ou subscription_id é recebido
-- do navegador como autoridade.

create or replace function public.get_my_barber_subscribers()
returns table (
  subscription_id uuid,
  customer_name text,
  customer_phone text,
  plan_name text,
  subscription_status text,
  cycle_status text,
  period_start date,
  period_end date,
  grace_until timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_auth_user_id uuid;
  v_barber_id uuid;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = v_auth_user_id
      and u.email_confirmed_at is not null
  ) then
    raise exception 'confirmed email required';
  end if;

  select b.id
  into v_barber_id
  from public.barbers b
  where b.auth_user_id = v_auth_user_id
    and b.active = true;

  if v_barber_id is null then
    raise exception 'barber profile not found';
  end if;

  return query
  select distinct on (s.id)
    s.id,
    c.name,
    c.phone,
    coalesce(p.name, s.name),
    s.status,
    cy.status,
    cy.period_start,
    cy.period_end,
    cy.grace_until
  from public.subscription_cycles cy
  join public.subscriptions s
    on s.id = cy.subscription_id
  join public.customers c
    on c.id = s.customer_id
  left join public.subscription_plans p
    on p.id = cy.plan_id
  where cy.barber_id = v_barber_id
    and cy.status in ('paid', 'grace')
    and cy.grace_until > now()
  order by
    s.id,
    cy.period_end desc,
    cy.created_at desc,
    cy.id desc;
end;
$function$;

revoke all on function public.get_my_barber_subscribers()
from public, anon, authenticated;

grant execute on function public.get_my_barber_subscribers()
to authenticated;

commit;