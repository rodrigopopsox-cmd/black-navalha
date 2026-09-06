create table public.business_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text,
  address text,
  instagram text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_settings enable row level security;

grant select
on table public.business_settings
to anon, authenticated;

grant insert, update, delete
on table public.business_settings
to authenticated;

create policy "Publico visualiza configuracoes"
on public.business_settings
for select
to anon, authenticated
using (true);

create policy "Admin pode cadastrar configuracoes"
on public.business_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admin pode alterar configuracoes"
on public.business_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admin pode excluir configuracoes"
on public.business_settings
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);