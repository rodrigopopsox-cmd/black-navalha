begin;

-- ============================================================
-- ÁREA DO BARBEIRO — MINHAS COMISSÕES
-- ============================================================
--
-- O ledger subscription_commission_entries é a autoridade.
-- Valores históricos NÃO são recalculados com a taxa atual.
--
-- Toda autoridade deriva de:
-- auth.uid() -> barbers.auth_user_id -> barbers.id.
--
-- Ano/mês são apenas filtros de período.
-- Nenhum barber_id é recebido do navegador.

create or replace function public.get_my_barber_commissions(
  p_year integer default null,
  p_month integer default null
)
returns table (
  entry_type text,
  amount numeric,
  rate numeric,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_auth_user_id uuid;
  v_barber_id uuid;
  v_today date;
  v_year integer;
  v_month integer;
  v_period_start timestamptz;
  v_period_end timestamptz;
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

  v_today := (now() at time zone 'America/Sao_Paulo')::date;
  v_year := coalesce(p_year, extract(year from v_today)::integer);
  v_month := coalesce(p_month, extract(month from v_today)::integer);

  if v_year < 2000 or v_year > 2100 then
    raise exception 'invalid commission year';
  end if;

  if v_month < 1 or v_month > 12 then
    raise exception 'invalid commission month';
  end if;

  v_period_start :=
    make_date(v_year, v_month, 1)::timestamp
      at time zone 'America/Sao_Paulo';

  v_period_end :=
    (
      make_date(v_year, v_month, 1)
      + interval '1 month'
    )::timestamp
      at time zone 'America/Sao_Paulo';

  return query
  select
    ce.entry_type,
    ce.amount,
    ce.rate,
    ce.created_at
  from public.subscription_commission_entries ce
  where ce.barber_id = v_barber_id
    and ce.created_at >= v_period_start
    and ce.created_at < v_period_end
  order by ce.created_at desc, ce.id desc;
end;
$function$;

revoke all on function public.get_my_barber_commissions(integer, integer)
from public, anon, authenticated;

grant execute on function public.get_my_barber_commissions(integer, integer)
to authenticated;

commit;