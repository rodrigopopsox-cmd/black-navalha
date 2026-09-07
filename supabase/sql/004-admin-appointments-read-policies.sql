grant select
on table public.appointments
to authenticated;

grant select
on table public.appointment_services
to authenticated;

create policy "Admin pode visualizar agendamentos"
on public.appointments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admin pode visualizar servicos dos agendamentos"
on public.appointment_services
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
