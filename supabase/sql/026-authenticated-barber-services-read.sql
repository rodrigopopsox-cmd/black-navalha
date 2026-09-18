create policy "Clientes autenticados visualizam servicos dos barbeiros"
on public.barber_services
for select
to authenticated
using (
  exists (
    select 1
    from public.barbers
    where barbers.id = barber_services.barber_id
      and barbers.active = true
  )
);
