import { redirect } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  LogOut,
  Scissors,
  UserRound,
} from "lucide-react";

import { getCustomerIdentity } from "@/lib/customer-auth/identity";
import {
  getMySubscription,
  type MySubscriptionData,
} from "@/lib/customer-auth/subscription";
import { createClient } from "@/lib/supabase/server";

import { signOutCustomer } from "./actions";
import LinkCustomerButton from "./link-customer-button";
import RenewalCheckout from "./renewal-checkout";
import styles from "./page.module.css";

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  paused: "Pausada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

type PublicBarber = {
  id: string;
  name: string;
  available_slots: number;
};

function parseDate(value: string) {
  return new Date(`${value}T12:00:00-03:00`);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(parseDate(value));
}

function formatMoney(value: number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getSaoPauloDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function subtractDays(value: string, days: number) {
  const date = parseDate(value);
  date.setDate(date.getDate() - days);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getGraceDate(graceUntil: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(graceUntil));
}

function getRenewalState(
  cycle: {
    period_end: string;
    grace_until: string;
  } | null
) {
  if (!cycle) {
    return {
      label: "Sem ciclo comercial",
      detail: null,
      available: false,
    };
  }

  const today = getSaoPauloDate();
  const renewalOpen = subtractDays(cycle.period_end, 7);
  const graceDate = getGraceDate(cycle.grace_until);

  if (today < renewalOpen) {
    return {
      label: `Abre em ${formatDate(renewalOpen)}`,
      detail: "7 dias antes do fim do ciclo",
      available: false,
    };
  }

  if (today <= cycle.period_end) {
    return {
      label: "Disponível",
      detail: "Você já pode renovar voluntariamente.",
      available: true,
    };
  }

  if (today <= graceDate) {
    return {
      label: "Disponível na carência",
      detail: "Sua vaga permanece reservada durante a carência.",
      available: true,
    };
  }

  return {
    label: "Carência encerrada",
    detail: "Uma nova contratação dependerá da capacidade disponível.",
    available: false,
  };
}

export default async function MinhaAssinaturaPage() {
  const identity = await getCustomerIdentity();

  if (identity.status === "unauthenticated") {
    redirect("/minha-assinatura/entrar");
  }

  if (identity.status === "unverified") {
    return (
      <main className={styles.page}>
        <div className={styles.narrow}>
          <section className={styles.panel}>
            <span className={styles.eyebrow}>Área do assinante</span>
            <h1>Confirme seu e-mail</h1>
            <p>
              Confirme seu endereço de e-mail antes de acessar dados privados.
            </p>
            <form action={signOutCustomer}>
              <button className={styles.secondaryButton} type="submit">
                Sair
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  if (identity.status === "unlinked") {
    return (
      <main className={styles.page}>
        <div className={styles.narrow}>
          <section className={styles.panel}>
            <span className={styles.eyebrow}>Identidade confirmada</span>
            <h1>Vincule seu cadastro</h1>
            <p>
              Seu e-mail foi confirmado. Agora valide a correspondência com o
              cadastro existente da Black Navalha.
            </p>
            <LinkCustomerButton />
            <form action={signOutCustomer}>
              <button className={styles.secondaryButton} type="submit">
                Sair
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  const data = await getMySubscription();

  let renewalBarbers: PublicBarber[] = [];
  let renewalAvailable = false;

  if (data?.has_subscription && data.cycle) {
    renewalAvailable = getRenewalState(data.cycle).available;

    if (renewalAvailable) {
      const supabase = await createClient();
      const { data: barbers, error } = await supabase.rpc(
        "get_public_subscription_barbers"
      );

      if (!error && Array.isArray(barbers)) {
        renewalBarbers = barbers.map((barber) => ({
          id: String(barber.id),
          name: String(barber.name),
          available_slots: Number(barber.available_slots),
        }));
      }
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.narrow}>
        <header className={styles.privateHeader}>
          <div>
            <span className={styles.eyebrow}>Minha assinatura</span>
            <h1>Olá, {identity.customer.name}</h1>
          </div>

          <form action={signOutCustomer}>
            <button className={styles.logoutButton} type="submit">
              <LogOut size={15} aria-hidden="true" />
              Sair
            </button>
          </form>
        </header>

        {!data || !data.has_subscription ? (
          <section className={styles.panel}>
            <span className={styles.eyebrow}>Assinatura</span>
            <h2>Você ainda não possui uma assinatura comercial.</h2>
            <p>
              Quando você contratar um plano, o ciclo e a renovação aparecerão
              aqui com segurança.
            </p>
            <a href="/assinaturas" className={styles.primaryLink}>
              Conhecer planos
            </a>
          </section>
        ) : (
          <SubscriptionView
            data={data}
            renewalAvailable={renewalAvailable}
            renewalBarbers={renewalBarbers}
          />
        )}
      </div>
    </main>
  );
}

function SubscriptionView({
  data,
  renewalAvailable,
  renewalBarbers,
}: {
  data: Extract<MySubscriptionData, { has_subscription: true }>;
  renewalAvailable: boolean;
  renewalBarbers: PublicBarber[];
}) {
  const renewal = getRenewalState(data.cycle);

  return (
    <>
      <section className={styles.subscriptionHero}>
        <BadgeCheck size={30} aria-hidden="true" />
        <div>
          <span className={styles.eyebrow}>Plano atual</span>
          <h2>{data.plan?.name ?? data.subscription.name}</h2>
          <p>
            {STATUS_LABELS[data.subscription.status] ?? data.subscription.status}
            {data.plan ? ` · ${formatMoney(data.plan.price)} por mês` : ""}
          </p>
        </div>
      </section>

      <section className={styles.infoGrid}>
        <article className={styles.infoCard}>
          <CalendarDays size={20} aria-hidden="true" />
          <span>Ciclo</span>
          <strong>
            {data.cycle
              ? `${formatDate(data.cycle.period_start)} até ${formatDate(
                  data.cycle.period_end
                )}`
              : "Sem ciclo comercial"}
          </strong>
        </article>

        <article className={styles.infoCard}>
          <UserRound size={20} aria-hidden="true" />
          <span>Barbeiro</span>
          <strong>{data.cycle?.barber_name ?? "Não informado"}</strong>
        </article>

        <article className={styles.infoCard}>
          <CalendarDays size={20} aria-hidden="true" />
          <span>Renovação</span>
          <strong>{renewal.label}</strong>
          {renewal.detail ? <small>{renewal.detail}</small> : null}
        </article>

        <article className={styles.infoCard}>
          <CalendarDays size={20} aria-hidden="true" />
          <span>Carência</span>
          <strong>
            {data.cycle
              ? `Até ${new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/Sao_Paulo",
                }).format(new Date(data.cycle.grace_until))}`
              : "-"}
          </strong>
        </article>
      </section>

      <section className={styles.servicesPanel}>
        <div className={styles.servicesHeading}>
          <Scissors size={20} aria-hidden="true" />
          <h3>Serviços incluídos</h3>
        </div>

        {data.services.length > 0 ? (
          <ul>
            {data.services.map((service) => (
              <li key={service.name}>{service.name}</li>
            ))}
          </ul>
        ) : (
          <p>Nenhum serviço incluído foi encontrado para esta assinatura.</p>
        )}
      </section>

      {renewalAvailable && data.cycle?.barber_id ? (
        renewalBarbers.length > 0 ? (
          <RenewalCheckout
            barbers={renewalBarbers}
            currentBarberId={data.cycle.barber_id}
          />
        ) : (
          <section className={styles.renewalPanel}>
            <span className={styles.eyebrow}>Renovação voluntária</span>
            <h3>Renovação disponível</h3>
            <p>
              Não foi possível consultar os profissionais disponíveis agora.
              Tente novamente em alguns instantes.
            </p>
          </section>
        )
      ) : null}
    </>
  );
}
