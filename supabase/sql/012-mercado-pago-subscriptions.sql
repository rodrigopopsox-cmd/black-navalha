begin;

-- ============================================================
-- BLACK NAVALHA
-- 012 - Mercado Pago / vinculo do catalogo comercial
--
-- Associa o plano comercial interno ao preapproval_plan criado
-- no Mercado Pago. Nao ativa assinatura, nao confirma pagamento,
-- nao cria ciclo e nao cria comissao.
-- ============================================================

alter table public.subscription_plans
  add column if not exists mercado_pago_preapproval_plan_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscription_plans_mp_preapproval_plan_not_blank'
      and conrelid = 'public.subscription_plans'::regclass
  ) then
    alter table public.subscription_plans
      add constraint subscription_plans_mp_preapproval_plan_not_blank
      check (
        mercado_pago_preapproval_plan_id is null
        or btrim(mercado_pago_preapproval_plan_id) <> ''
      );
  end if;
end
$$;

create unique index if not exists
  uq_subscription_plans_mp_preapproval_plan
on public.subscription_plans(mercado_pago_preapproval_plan_id)
where mercado_pago_preapproval_plan_id is not null;

comment on column public.subscription_plans.mercado_pago_preapproval_plan_id is
  'ID do preapproval_plan correspondente no Mercado Pago. NULL enquanto o plano ainda nao foi criado/vinculado no gateway.';

commit;
