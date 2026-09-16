-- Mercado Pago / Orders webhook
-- Acesso minimo necessario ao backend service_role para payment_events.

grant select, insert, update
on table public.payment_events
to service_role;
