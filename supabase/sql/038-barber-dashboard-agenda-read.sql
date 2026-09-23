begin;

-- Área do Barbeiro — Dashboard + Minha Agenda.
-- Toda autoridade deriva de auth.uid() -> barbers.auth_user_id.
-- Nenhuma função recebe barber_id do navegador.

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
    )::numeric;
end;
$function$;

revoke all on function public.get_my_barber_dashboard(date)
from public, anon, authenticated;

grant execute on function public.get_my_barber_dashboard(date)
to authenticated;


create or replace function public.get_my_barber_appointments(
  p_date date default null
)
returns table (
  appointment_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  status text,
  customer_name text,
  customer_phone text,
  service_names text[]
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

  return query
  select
    a.id,
    a.start_at,
    a.end_at,
    a.status,
    c.name,
    c.phone,
    coalesce(
      (
        select array_agg(
          aps.service_name
          order by aps.created_at, aps.id
        )
        from public.appointment_services aps
        where aps.appointment_id = a.id
      ),
      array[]::text[]
    )
  from public.appointments a
  join public.customers c
    on c.id = a.customer_id
  where a.barber_id = v_barber_id
    and a.start_at >= v_day_start
    and a.start_at < v_day_end
  order by a.start_at, a.id;
end;
$function$;

revoke all on function public.get_my_barber_appointments(date)
from public, anon, authenticated;

grant execute on function public.get_my_barber_appointments(date)
to authenticated;

commit;