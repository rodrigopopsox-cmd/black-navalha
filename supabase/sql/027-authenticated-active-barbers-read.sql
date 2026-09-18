create policy "Clientes autenticados visualizam barbeiros ativos"
on public.barbers
for select
to authenticated
using (active = true);
