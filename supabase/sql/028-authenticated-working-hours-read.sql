create policy "Clientes autenticados visualizam horarios de barbeiros"
on public.working_hours
for select
to authenticated
using (
  active = true
  and exists (
    select 1
    from public.barbers
    where barbers.id = working_hours.barber_id
      and barbers.active = true
  )
);
