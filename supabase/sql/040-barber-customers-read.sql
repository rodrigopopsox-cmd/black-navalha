begin;

-- ============================================================
-- ÁREA DO BARBEIRO — MEUS CLIENTES
-- ============================================================
--
-- Cliente do profissional:
-- possui pelo menos um appointment historicamente vinculado ao
-- barbeiro autenticado.
--
-- Toda autoridade deriva de:
-- auth.uid() -> barbers.auth_user_id -> barbers.id.
--
-- Nenhum barber_id ou customer_id é recebido do navegador.

create or replace function public.get_my_barber_customers()
returns table (
  customer_name text,
  customer_phone text,
  appointments_count bigint,
  last_appointment_at timestamptz,
  next_appointment_at timestamptz
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
  select
    c.name,
    c.phone,
    count(a.id)::bigint,

    max(a.start_at) filter (
      where a.start_at < now()
         or a.status in ('completed', 'cancelled', 'no_show')
    ),

    min(a.start_at) filter (
      where a.start_at >= now()
        and a.status in ('scheduled', 'confirmed')
    )

  from public.appointments a
  join public.customers c
    on c.id = a.customer_id

  where a.barber_id = v_barber_id

  group by
    c.id,
    c.name,
    c.phone

  order by
    max(a.start_at) desc nulls last,
    c.name;
end;
$function$;

revoke all on function public.get_my_barber_customers()
from public, anon, authenticated;

grant execute on function public.get_my_barber_customers()
to authenticated;

commit;