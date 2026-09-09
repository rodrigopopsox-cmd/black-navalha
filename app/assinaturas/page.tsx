import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import styles from "./page.module.css";

const currentPlan = {
  name: "Plano Mensal",
  price: 150,
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AssinaturasPage() {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("services")
    .select("id, name")
    .eq("active", true)
    .eq("subscriber_service", true)
    .order("name");

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
            Um plano mensal para manter seu estilo em dia com os serviços
            incluídos na sua assinatura.
          </p>
        </header>

        <section className={styles.plan} aria-labelledby="plano-mensal">
          <div className={styles.planTop}>
            <div>
              <span className={styles.planLabel}>Plano atual</span>
              <h2 id="plano-mensal">{currentPlan.name}</h2>
            </div>

            <div className={styles.price}>
              <strong>{formatPrice(currentPlan.price)}</strong>
              <span>por mês</span>
            </div>
          </div>

          <div className={styles.benefits}>
            <div className={styles.benefitsTitle}>
              <BadgeCheck size={19} aria-hidden="true" />
              <h3>Serviços incluídos</h3>
            </div>

            {error ? (
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
          </div>

          <div className={styles.notice}>
            <strong>Contratação online em preparação.</strong>
            <span>
              Em breve será possível escolher seu profissional e contratar a
              assinatura diretamente pelo site.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
