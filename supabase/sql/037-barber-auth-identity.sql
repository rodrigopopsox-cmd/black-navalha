-- 037-barber-auth-identity.sql
-- Identidade segura para a area privada do barbeiro.

alter table public.barbers
add column if not exists auth_user_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'barbers_auth_user_id_fkey'
      and conrelid = 'public.barbers'::regclass
  ) then
    alter table public.barbers
    add constraint barbers_auth_user_id_fkey
    foreign key (auth_user_id)
    references auth.users(id)
    on delete set null;
  end if;
end
$$;

create unique index if not exists barbers_auth_user_id_unique
on public.barbers (auth_user_id)
where auth_user_id is not null;

create or replace function public.get_my_barber_profile()
returns table (
  barber_id uuid,
  barber_name text,
  barber_phone text,
  barber_active boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_email_confirmed_at timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select u.email_confirmed_at
  into v_email_confirmed_at
  from auth.users u
  where u.id = v_user_id;

  if v_email_confirmed_at is null then
    raise exception 'email confirmation required';
  end if;

  return query
  select
    b.id,
    b.name,
    b.phone,
    b.active
  from public.barbers b
  where b.auth_user_id = v_user_id
  limit 1;
end;
$$;

revoke all
on function public.get_my_barber_profile()
from public, anon;

grant execute
on function public.get_my_barber_profile()
to authenticated;