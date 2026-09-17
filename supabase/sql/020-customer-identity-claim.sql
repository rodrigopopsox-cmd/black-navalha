create or replace function public.claim_customer_identity()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_email_confirmed_at timestamptz;
  v_customer_id uuid;
  v_customer_auth_user_id uuid;
  v_match_count integer;
begin
  if v_user_id is null then
    return 'unauthenticated';
  end if;

  select
    lower(trim(u.email)),
    u.email_confirmed_at
  into
    v_email,
    v_email_confirmed_at
  from auth.users u
  where u.id = v_user_id;

  if v_email is null or v_email_confirmed_at is null then
    return 'unverified';
  end if;

  select c.id
  into v_customer_id
  from public.customers c
  where c.auth_user_id = v_user_id
  limit 1;

  if v_customer_id is not null then
    return 'linked';
  end if;

  select count(*)
  into v_match_count
  from public.customers c
  where lower(trim(c.email)) = v_email;

  if v_match_count <> 1 then
    return 'unavailable';
  end if;

  select
    c.id,
    c.auth_user_id
  into
    v_customer_id,
    v_customer_auth_user_id
  from public.customers c
  where lower(trim(c.email)) = v_email
  limit 1
  for update;

  if v_customer_auth_user_id is not null
     and v_customer_auth_user_id <> v_user_id then
    return 'unavailable';
  end if;

  if v_customer_auth_user_id = v_user_id then
    return 'linked';
  end if;

  update public.customers
  set auth_user_id = v_user_id
  where id = v_customer_id
    and auth_user_id is null;

  if found then
    return 'linked';
  end if;

  return 'unavailable';
end;
$$;

revoke all on function public.claim_customer_identity() from public;
revoke all on function public.claim_customer_identity() from anon;
grant execute on function public.claim_customer_identity() to authenticated;
