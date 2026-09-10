-- Backend privilegiado: pre-checkout de assinaturas.
-- Não concede novos privilégios a anon ou authenticated.
-- A escrita continua encapsulada pelas funções existentes.

grant execute
on function public.create_subscription_checkout(uuid, uuid, text, text, text, uuid)
to service_role;

grant select
on table public.subscription_charges
to service_role;

grant select
on table public.subscription_capacity_reservations
to service_role;

grant select
on table public.subscription_cycles
to service_role;

grant select
on table public.subscription_commission_entries
to service_role;
