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

export default async function AssinaturasPage() {
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

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={15} aria-hidden="true" />
          Voltar para a Home
        </Link>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Black Navalha</span>
          <h1>Assinaturas</h1>
          <p>
            Planos para manter seu estilo em dia com os serviços incluídos na
            assinatura.
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
          availablePlans.map((plan) => (
            <section
              key={plan.id}
              className={styles.plan}
              aria-labelledby={`plano-${plan.id}`}
            >
              <div className={styles.planTop}>
                <div>
                  <span className={styles.planLabel}>Plano disponível</span>
                  <h2 id={`plano-${plan.id}`}>{plan.name}</h2>
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

              <div className={styles.benefits}>
                <div className={styles.benefitsTitle}>
                  <BadgeCheck size={19} aria-hidden="true" />
                  <h3>Serviços incluídos</h3>
                </div>

                {servicesError ? (
                  <p className={styles.message}>
                    Não foi possível carregar os serviços incluídos no momento.
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

                {barbersError ? (
                  <p className={styles.checkoutError}>
                    Não foi possível consultar a disponibilidade dos barbeiros
                    no momento.
                  </p>
                ) : (
                  <SubscriptionCheckoutForm
                    plan={{
                      id: plan.id,
                      name: plan.name,
                      price: plan.price,
                    }}
                    barbers={availableBarbers}
                  />
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
