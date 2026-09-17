alter table public.customers
add column auth_user_id uuid null;

alter table public.customers
add constraint customers_auth_user_id_fkey
foreign key (auth_user_id)
references auth.users(id)
on delete set null;

create unique index customers_auth_user_id_unique
on public.customers (auth_user_id)
where auth_user_id is not null;

create policy "Cliente visualiza proprio cadastro"
on public.customers
for select
to authenticated
using (
  auth_user_id = auth.uid()
);
