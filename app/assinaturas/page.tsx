import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import SubscriptionCheckoutForm from "./subscription-checkout-form";
import styles from "./page.module.css";

type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  billing_interval_months: number;
  grace_days: number;
};

type SubscriptionBarber = {
  id: string;
  name: string;
  photo_url: string | null;
  capacity: number;
  available_slots: number;
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AssinaturasPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string | string[] }>;
}) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [
    { data: services, error: servicesError },
    { data: plans, error: plansError },
    { data: barbers, error: barbersError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("id, name")
      .eq("active", true)
      .eq("subscriber_service", true)
      .order("name"),

    admin
      .from("subscription_plans")
      .select("id, name, price, billing_interval_months, grace_days")
      .eq("active", true)
      .order("price"),

    supabase.rpc("get_public_subscription_barbers"),
  ]);

  const availablePlans: SubscriptionPlan[] =
    !plansError && plans
      ? plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          price: Number(plan.price),
          billing_interval_months: plan.billing_interval_months,
          grace_days: plan.grace_days,
        }))
      : [];

  const availableBarbers: SubscriptionBarber[] =
    !barbersError && barbers
      ? barbers.map((barber: SubscriptionBarber) => ({
          id: barber.id,
          name: barber.name,
          photo_url: barber.photo_url ?? null,
          capacity: Number(barber.capacity),
          available_slots: Number(barber.available_slots),
        }))
      : [];

  const params = await searchParams;
  const requestedPlanId =
    typeof params.plano === "string" ? params.plano : null;

  const selectedPlan =
    availablePlans.find((plan) => plan.id === requestedPlanId) ??
    availablePlans[0] ??
    null;

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.subscriptionBrand}>
          <Link href="/" className={styles.subscriptionBrandIdentity}>
            <Image
              src="/black-navalha/logo.png"
              alt="Black Navalha"
              width={78}
              height={58}
              priority
              className={styles.subscriptionBrandLogo}
            />

            <div className={styles.subscriptionBrandCopy}>
              <strong>BLACK NAVALHA</strong>
              <span>BARBEARIA</span>
            </div>
          </Link>

          <div className={styles.subscriptionBrandActions}>
            <span className={styles.subscriptionBrandArea}>ASSINATURAS</span>
            <Link
              href="/minha-assinatura"
              className={styles.subscriptionCustomerLink}
            >
              Minha assinatura
            </Link>
            <Link href="/" className={styles.subscriptionHomeLink}>
              <ArrowLeft size={11} aria-hidden="true" />
              Voltar para a Home
            </Link>
          </div>
        </div>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Assinaturas Black Navalha</span>
          <h1>Assinaturas</h1>
          <p>
            Escolha o plano ideal para sua rotina e aproveite os serviços
            incluídos durante todo o ciclo.
          </p>
        </header>

        {plansError ? (
          <p className={styles.message}>
            Não foi possível carregar os planos disponíveis no momento.
          </p>
        ) : availablePlans.length === 0 ? (
          <p className={styles.message}>
            Não há planos disponíveis para contratação no momento.
          </p>
        ) : (
          <>
            <div className={styles.plansGrid}>
              {availablePlans.map((plan) => {
                const selected = selectedPlan?.id === plan.id;

                return (
                  <article
                    key={plan.id}
                    className={`${styles.plan} ${
                      selected ? styles.planSelected : ""
                    }`}
                    aria-labelledby={`plano-${plan.id}`}
                  >
                    <div className={styles.planTop}>
                      <div className={styles.planIdentity}>
                        <span className={styles.planLabel}>
                          {selected ? "Plano selecionado" : "Plano disponível"}
                        </span>
                        <h2 id={`plano-${plan.id}`}>{plan.name}</h2>
                        <p>
                          Pagamento mensal avulso. Você decide quando deseja
                          contratar um novo ciclo.
                        </p>
                      </div>

                      <div className={styles.price}>
                        <strong>{formatPrice(plan.price)}</strong>
                        <span>
                          {plan.billing_interval_months === 1
                            ? "por mês"
                            : `a cada ${plan.billing_interval_months} meses`}
                        </span>
                      </div>
                    </div>

                    <div className={styles.planBody}>
                      <div className={styles.benefits}>
                        <div className={styles.benefitsTitle}>
                          <BadgeCheck size={18} aria-hidden="true" />
                          <div>
                            <span>Benefícios da assinatura</span>
                            <h3>Serviços incluídos</h3>
                          </div>
                        </div>

                        {servicesError ? (
                          <p className={styles.message}>
                            Não foi possível carregar os serviços incluídos no
                            momento.
                          </p>
                        ) : services && services.length > 0 ? (
                          <ul>
                            {services.map((service) => (
                              <li key={service.id}>{service.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className={styles.message}>
                            Os serviços incluídos serão apresentados em breve.
                          </p>
                        )}
                      </div>

                      <div className={styles.planFacts}>
                        <div>
                          <CreditCard size={17} aria-hidden="true" />
                          <span>Pagamento</span>
                          <strong>Pix mensal avulso</strong>
                        </div>
                        <div>
                          <UserRound size={17} aria-hidden="true" />
                          <span>Profissional</span>
                          <strong>Você escolhe o barbeiro</strong>
                        </div>
                        <div>
                          <ShieldCheck size={17} aria-hidden="true" />
                          <span>Ativação</span>
                          <strong>Após confirmação segura</strong>
                        </div>
                      </div>
                    </div>

                    {!selected && (
                      <Link
                        href={`/assinaturas?plano=${plan.id}#contratacao`}
                        className={styles.selectPlanLink}
                      >
                        Escolher este plano
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>

            {selectedPlan && (
              <section
                id="contratacao"
                className={styles.checkoutSection}
                aria-label="Contratação da assinatura"
              >
                {barbersError ? (
                  <p className={styles.checkoutError}>
                    Não foi possível consultar a disponibilidade dos barbeiros
                    no momento.
                  </p>
                ) : (
                  <SubscriptionCheckoutForm
                    plan={{
                      id: selectedPlan.id,
                      name: selectedPlan.name,
                      price: selectedPlan.price,
                    }}
                    barbers={availableBarbers}
                  />
                )}
              </section>
            )}
          </>        )}
      </div>
    </main>
  );
}