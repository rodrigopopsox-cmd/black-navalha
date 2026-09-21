import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";

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

type PlanService = {
  plan_id: string;
  service_id: string;
};

type CatalogService = {
  id: string;
  name: string;
};

function getPlanPresentation(name: string, index: number) {
  const normalizedName = name.toLocaleLowerCase("pt-BR");

  if (normalizedName.includes("premium")) {
    return {
      description:
        "A experiência máxima Black Navalha, com serviços premium e tratamentos para um cuidado completo.",
      tier: "premium",
      badge: "Experiência máxima",
    };
  }

  if (normalizedName.includes("navalha")) {
    return {
      description:
        "Uma experiência completa de cabelo e barba para manter o visual sempre no nível Black Navalha.",
      tier: "navalha",
      badge: "Experiência completa",
    };
  }

  if (normalizedName.includes("essencial")) {
    return {
      description:
        "Os cuidados essenciais da sua rotina com praticidade e o padrão Black Navalha.",
      tier: "essencial",
      badge: "Cuidados essenciais",
    };
  }

  return {
    description:
      "Cuidados Black Navalha para manter seu visual sempre em dia.",
    tier: index === 0 ? "essencial" : index === 1 ? "navalha" : "premium",
    badge: "Plano Black Navalha",
  };
}

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
    { data: plans, error: plansError },
    { data: planServices, error: planServicesError },
    { data: catalogServices, error: catalogServicesError },
  ] = await Promise.all([
    admin
      .from("subscription_plans")
      .select("id, name, price, billing_interval_months, grace_days")
      .eq("active", true)
      .order("price"),

    admin
      .from("subscription_plan_services")
      .select("plan_id, service_id")
      .order("created_at"),

    admin
      .from("services")
      .select("id, name")
      .eq("active", true),
  ]);

  const servicesError = planServicesError ?? catalogServicesError;

  const availablePlans: SubscriptionPlan[] =
    !plansError && plans
      ? plans.map((plan) => ({
          id: String(plan.id),
          name: String(plan.name),
          price: Number(plan.price),
          billing_interval_months: Number(plan.billing_interval_months),
          grace_days: Number(plan.grace_days),
        }))
      : [];

  const servicesByPlan = new Map<string, { id: string; name: string }[]>();

  if (
    !servicesError &&
    Array.isArray(planServices) &&
    Array.isArray(catalogServices)
  ) {
    const serviceCatalog = new Map(
      (catalogServices as CatalogService[]).map((service) => [
        String(service.id),
        {
          id: String(service.id),
          name: String(service.name),
        },
      ]),
    );

    for (const relation of planServices as PlanService[]) {
      const service = serviceCatalog.get(String(relation.service_id));

      if (!service) continue;

      const planId = String(relation.plan_id);
      const current = servicesByPlan.get(planId) ?? [];
      current.push(service);
      servicesByPlan.set(planId, current);
    }
  }

  const params = await searchParams;
  const requestedPlanId =
    typeof params.plano === "string" ? params.plano : null;

  const selectedPlan =
    requestedPlanId !== null
      ? availablePlans.find((plan) => plan.id === requestedPlanId) ?? null
      : null;

  let availableBarbers: SubscriptionBarber[] = [];
  let barbersError = null;

  if (selectedPlan) {
    const result = await supabase.rpc("get_public_subscription_barbers", {
      p_plan_id: selectedPlan.id,
    });

    barbersError = result.error;

    if (!result.error && Array.isArray(result.data)) {
      availableBarbers = result.data.map((barber: SubscriptionBarber) => ({
        id: String(barber.id),
        name: String(barber.name),
        photo_url: barber.photo_url ?? null,
        capacity: Number(barber.capacity),
        available_slots: Number(barber.available_slots),
      }));
    }
  }

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
          <h1>Escolha sua experiência.</h1>
          <p>
            Três planos, benefícios diferentes e pagamento mensal avulso via
            Pix. Você escolhe o nível ideal para sua rotina.
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
              {availablePlans.map((plan, index) => {
                const selected = selectedPlan?.id === plan.id;
                const services = servicesByPlan.get(plan.id) ?? [];
                const presentation = getPlanPresentation(plan.name, index);
                const tierClass =
                  presentation.tier === "premium"
                    ? styles.planPremium
                    : presentation.tier === "navalha"
                      ? styles.planNavalha
                      : styles.planEssencial;

                return (
                  <Link
                    key={plan.id}
                    href={`/assinaturas?plano=${plan.id}#contratacao`}
                    className={styles.planLink}
                    aria-label={`Selecionar ${plan.name}`}
                    aria-current={selected ? "true" : undefined}
                  >
                    <article
                      className={`${styles.plan} ${tierClass} ${
                        selected ? styles.planSelected : ""
                      }`}
                      aria-labelledby={`plano-${plan.id}`}
                    >
                      <div className={styles.planTop}>
                        <div className={styles.planIdentity}>
                          <span className={styles.planLabel}>
                            {presentation.badge}
                          </span>

                          <h2 id={`plano-${plan.id}`}>{plan.name}</h2>

                          <p>{presentation.description}</p>
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
                              <span>{services.length} benefícios</span>
                              <h3>Serviços incluídos</h3>
                            </div>
                          </div>

                          {servicesError ? (
                            <p className={styles.message}>
                              Não foi possível carregar os serviços incluídos no
                              momento.
                            </p>
                          ) : services.length > 0 ? (
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

                        <div className={styles.planRule}>
                          Um ciclo mensal pago por vez. Sem renovação automática.
                        </div>
                      </div>

                      <div
                        className={`${styles.selectPlanLink} ${
                          selected ? styles.selectPlanLinkSelected : ""
                        }`}
                      >
                        {selected ? "Escolhido" : "Escolher este plano"}
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {selectedPlan ? (
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
                    key={selectedPlan.id}
                    plan={{
                      id: selectedPlan.id,
                      name: selectedPlan.name,
                      price: selectedPlan.price,
                    }}
                    barbers={availableBarbers}
                  />
                )}
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}