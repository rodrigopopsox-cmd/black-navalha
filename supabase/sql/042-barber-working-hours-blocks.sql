begin;

-- ============================================================
-- ÁREA DO BARBEIRO — HORÁRIOS + BLOQUEIOS
-- ============================================================
--
-- Autoridade em todas as RPCs:
-- auth.uid() -> barbers.auth_user_id -> barbers.id.
--
-- Nenhuma operação recebe barber_id do navegador.
-- Nenhum privilégio geral de tabela é concedido.

-- ============================================================
-- 1. MINHA JORNADA — SOMENTE LEITURA
-- ============================================================

create or replace function public.get_my_barber_working_hours()
returns table (
  day_of_week integer,
  start_time time,
  end_time time,
  active boolean
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
    wh.day_of_week,
    wh.start_time,
    wh.end_time,
    wh.active
  from public.working_hours wh
  where wh.barber_id = v_barber_id
  order by wh.day_of_week;
end;
$function$;

revoke all on function public.get_my_barber_working_hours()
from public, anon, authenticated;

grant execute on function public.get_my_barber_working_hours()
to authenticated;


-- ============================================================
-- 2. MEUS BLOQUEIOS — LEITURA
-- ============================================================

create or replace function public.get_my_barber_blocks()
returns table (
  block_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  reason text,
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
    bt.id,
    bt.start_at,
    bt.end_at,
    bt.reason,
    bt.created_at
  from public.blocked_times bt
  where bt.barber_id = v_barber_id
  order by bt.start_at desc, bt.id desc;
end;
$function$;

revoke all on function public.get_my_barber_blocks()
from public, anon, authenticated;

grant execute on function public.get_my_barber_blocks()
to authenticated;


-- ============================================================
-- 3. CRIAR MEU BLOQUEIO
-- ============================================================

create or replace function public.create_my_barber_block(
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_reason text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $function$
declare
  v_auth_user_id uuid;
  v_barber_id uuid;
  v_block_id uuid;
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

  if p_start_at is null or p_end_at is null then
    raise exception 'block period is required';
  end if;

  if p_end_at <= p_start_at then
    raise exception 'block end must be after start';
  end if;

  if p_end_at <= now() then
    raise exception 'cannot create a block already ended';
  end if;

  insert into public.blocked_times (
    barber_id,
    start_at,
    end_at,
    reason
  )
  values (
    v_barber_id,
    p_start_at,
    p_end_at,
    nullif(btrim(coalesce(p_reason, '')), '')
  )
  returning id
  into v_block_id;

  return v_block_id;
end;
$function$;

revoke all on function public.create_my_barber_block(
  timestamptz,
  timestamptz,
  text
)
from public, anon, authenticated;

grant execute on function public.create_my_barber_block(
  timestamptz,
  timestamptz,
  text
)
to authenticated;


-- ============================================================
-- 4. EXCLUIR MEU BLOQUEIO
-- ============================================================

create or replace function public.delete_my_barber_block(
  p_block_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $function$
declare
  v_auth_user_id uuid;
  v_barber_id uuid;
  v_deleted_id uuid;
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

  if p_block_id is null then
    raise exception 'block id is required';
  end if;

  delete from public.blocked_times bt
  where bt.id = p_block_id
    and bt.barber_id = v_barber_id
  returning bt.id
  into v_deleted_id;

  if v_deleted_id is null then
    raise exception 'block not found';
  end if;

  return true;
end;
$function$;

revoke all on function public.delete_my_barber_block(uuid)
from public, anon, authenticated;

grant execute on function public.delete_my_barber_block(uuid)
to authenticated;

commit;