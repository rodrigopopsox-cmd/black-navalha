-- 015-service-role-subscription-charges-update.sql
--
-- Permite ao backend server-side vincular a Order do Mercado Pago
-- a uma subscription_charge pending após a criação idempotente do Pix.
-- Não concede acesso a anon ou authenticated.

grant update
on table public.subscription_charges
to service_role;
