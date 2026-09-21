-- Permite exclusivamente ao backend server-side ler o catálogo necessário
-- para renderizar os benefícios dos planos em /assinaturas.
-- Não concede acesso adicional a anon ou authenticated.

grant select
on table public.subscription_plan_services
to service_role;

grant select
on table public.services
to service_role;