begin;

-- ============================================================
-- ÁREA DO BARBEIRO — COMISSÕES DE ASSINATURAS + SERVIÇOS
-- ============================================================
--
-- Preserva a segurança profissional:
-- auth.uid() -> barbers.auth_user_id -> barber_id.
--
-- Nenhuma função recebe barber_id.
-- Nenhum SELECT geral é concedido ao profissional.
-- Os dois ledgers históricos permanecem autoridades independentes.


create or replace function public.get_my_barber_dashboard(
  p_date date default null
)
returns table (
  reference_date date,
  appointments_count bigint,
  completed_count bigint,
  subscribers_count bigint,
  commission_amount numeric
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_auth_user_id uuid;
  v_barber_id uuid;
  v_reference_date date;
  v_day_start timestamptz;
  v_day_end timestamptz;
  v_month_start timestamptz;
  v_month_end timestamptz;
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

  v_reference_date :=
    coalesce(
      p_date,
      (now() at time zone 'America/Sao_Paulo')::date
    );

  v_day_start :=
    v_reference_date::timestamp
      at time zone 'America/Sao_Paulo';

  v_day_end :=
    (v_reference_date + 1)::timestamp
      at time zone 'America/Sao_Paulo';

  v_month_start :=
    date_trunc('month', v_reference_date::timestamp)
      at time zone 'America/Sao_Paulo';

  v_month_end :=
    (date_trunc('month', v_reference_date::timestamp) + interval '1 month')
      at time zone 'America/Sao_Paulo';

  return query
  select
    v_reference_date,

    (
      select count(*)
      from public.appointments a
      where a.barber_id = v_barber_id
        and a.start_at >= v_day_start
        and a.start_at < v_day_end
        and a.status in ('scheduled', 'confirmed', 'completed')
    )::bigint,

    (
      select count(*)
      from public.appointments a
      where a.barber_id = v_barber_id
        and a.start_at >= v_day_start
        and a.start_at < v_day_end
        and a.status = 'completed'
    )::bigint,

    (
      select count(distinct cy.subscription_id)
      from public.subscription_cycles cy
      where cy.barber_id = v_barber_id
        and cy.status in ('paid', 'grace')
        and cy.grace_until > now()
    )::bigint,

    (
      coalesce(
        (
          select sum(
            case
              when ce.entry_type = 'commission' then ce.amount
              when ce.entry_type = 'reversal' then -ce.amount
              else 0
            end
          )
          from public.subscription_commission_entries ce
          where ce.barber_id = v_barber_id
            and ce.created_at >= v_month_start
            and ce.created_at < v_month_end
        ),
        0
      )
      +
      coalesce(
        (
          select sum(
            case
              when se.entry_type = 'commission' then se.amount
              when se.entry_type = 'reversal' then -se.amount
              else 0
            end
          )
          from public.service_commission_entries se
          where se.barber_id = v_barber_id
            and se.created_at >= v_month_start
            and se.created_at < v_month_end
        ),
        0
      )
    )::numeric;
end;
$function$;

revoke all on function public.get_my_barber_dashboard(date)
from public, anon, authenticated;

grant execute on function public.get_my_barber_dashboard(date)
to authenticated;


drop function if exists public.get_my_barber_commissions(integer, integer);

create function public.get_my_barber_commissions(
  p_year integer default null,
  p_month integer default null
)
returns table (
  source text,
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
    entries.source,
    entries.entry_type,
    entries.amount,
    entries.rate,
    entries.created_at
  from (
    select
      'subscription'::text as source,
      ce.entry_type,
      ce.amount,
      ce.rate,
      ce.created_at,
      ce.id
    from public.subscription_commission_entries ce
    where ce.barber_id = v_barber_id
      and ce.created_at >= v_period_start
      and ce.created_at < v_period_end

    union all

    select
      'service'::text as source,
      se.entry_type,
      se.amount,
      se.rate,
      se.created_at,
      se.id
    from public.service_commission_entries se
    where se.barber_id = v_barber_id
      and se.created_at >= v_period_start
      and se.created_at < v_period_end
  ) entries
  order by entries.created_at desc, entries.id desc;
end;
$function$;

revoke all on function public.get_my_barber_commissions(integer, integer)
from public, anon, authenticated;

grant execute on function public.get_my_barber_commissions(integer, integer)
to authenticated;

commit;