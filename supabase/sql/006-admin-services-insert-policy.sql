grant insert
on table public.services
to authenticated;

create policy "Admin pode cadastrar servicos"
on public.services
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
