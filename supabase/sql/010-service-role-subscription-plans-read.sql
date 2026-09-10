-- Permite que o backend privilegiado leia o catálogo comercial de planos.
-- Não concede acesso a anon ou authenticated.

grant select
on table public.subscription_plans
to service_role;
