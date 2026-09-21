import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  LogOut,
  Scissors,
  UserRound,
} from "lucide-react";

import { getMyAppointments } from "@/lib/customer-auth/appointments";
import { getCustomerIdentity } from "@/lib/customer-auth/identity";
import {
  getMySubscription,
  type MySubscriptionData,
} from "@/lib/customer-auth/subscription";
import { createClient } from "@/lib/supabase/server";

import { signOutCustomer } from "./actions";
import LinkCustomerButton from "./link-customer-button";
import RenewalCheckout from "./renewal-checkout";
import UpcomingAppointments from "./upcoming-appointments";
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
          <div className={styles.customerBrand}>
            <Link href="/" className={styles.customerBrandIdentity}>
              <Image
                src="/black-navalha/logo.png"
                alt="Black Navalha"
                width={78}
                height={58}
                priority
                className={styles.customerBrandLogo}
              />

              <div className={styles.customerBrandCopy}>
                <strong>BLACK NAVALHA</strong>
                <span>BARBEARIA</span>
              </div>
            </Link>

            <div className={styles.customerBrandActions}>
              <div className={styles.customerBrandArea}>
                CENTRAL DO CLIENTE
              </div>

              <form action={signOutCustomer}>
                <button className={styles.customerLogout} type="submit">
                  <LogOut size={12} aria-hidden="true" />
                  Sair
                </button>
              </form>
            </div>
          </div>

          <section className={styles.panel}>
            <span className={styles.eyebrow}>Acesso do cliente</span>
            <h1 className={styles.identityStateTitle}>Confirme seu e-mail</h1>
            <p>
              Confirme seu endereço de e-mail antes de acessar dados privados.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (identity.status === "unlinked") {
    return (
      <main className={styles.page}>
        <div className={styles.narrow}>
          <div className={styles.customerBrand}>
            <Link href="/" className={styles.customerBrandIdentity}>
              <Image
                src="/black-navalha/logo.png"
                alt="Black Navalha"
                width={78}
                height={58}
                priority
                className={styles.customerBrandLogo}
              />

              <div className={styles.customerBrandCopy}>
                <strong>BLACK NAVALHA</strong>
                <span>BARBEARIA</span>
              </div>
            </Link>

            <div className={styles.customerBrandActions}>
              <div className={styles.customerBrandArea}>
                CENTRAL DO CLIENTE
              </div>

              <form action={signOutCustomer}>
                <button className={styles.customerLogout} type="submit">
                  <LogOut size={12} aria-hidden="true" />
                  Sair
                </button>
              </form>
            </div>
          </div>

          <section className={`${styles.panel} ${styles.identityStatePanel}`}>
            <span className={styles.eyebrow}>Identidade confirmada</span>
            <h1 className={styles.identityStateTitle}>Vincule seu cadastro</h1>

            <div className={styles.identityStateMessage}>
              <strong>Seu e-mail está confirmado.</strong>
              <p>
                Conecte sua conta ao cadastro da Black Navalha para acessar sua
                assinatura, benefícios e agendamentos.
              </p>
              <span className={styles.identityStateSecurity}>
                Vinculação segura com o seu cadastro existente
              </span>
            </div>

            <LinkCustomerButton />
          </section>
        </div>
      </main>
    );
  }

  const [data, appointments] = await Promise.all([
    getMySubscription(),
    getMyAppointments(),
  ]);

  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (appointment) =>
      new Date(appointment.end_at) >= now &&
      (appointment.status === "scheduled" ||
        appointment.status === "confirmed")
  );

  const upcomingIds = new Set(
    upcomingAppointments.map((appointment) => appointment.id)
  );

  const appointmentHistory = appointments
    .filter(
      (appointment) =>
        !upcomingIds.has(appointment.id) &&
        (new Date(appointment.end_at) < now ||
          appointment.status === "completed" ||
          appointment.status === "cancelled" ||
          appointment.status === "no_show")
    )
    .sort(
      (first, second) =>
        new Date(second.start_at).getTime() -
        new Date(first.start_at).getTime()
    );

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
        <div className={styles.customerBrand}>
          <Link href="/" className={styles.customerBrandIdentity}>
            <Image
              src="/black-navalha/logo.png"
              alt="Black Navalha"
              width={78}
              height={58}
              priority
              className={styles.customerBrandLogo}
            />

            <div className={styles.customerBrandCopy}>
              <strong>BLACK NAVALHA</strong>
              <span>BARBEARIA</span>
            </div>
          </Link>

          <div className={styles.customerBrandActions}>
            <div className={styles.customerBrandArea}>
              CENTRAL DO CLIENTE
            </div>

            <form action={signOutCustomer}>
              <button className={styles.customerLogout} type="submit">
                <LogOut size={12} aria-hidden="true" />
                Sair
              </button>
            </form>
          </div>
        </div>

        <header className={styles.privateHeader}>
          <div className={styles.customerIdentityClean}>
            <span>Cliente</span>
            <strong>{identity.customer.name}</strong>
          </div>
        </header>

        {!data || !data.has_subscription ? (
          <>
            <section className={`${styles.panel} ${styles.noSubscriptionCard}`}>
              <span className={styles.eyebrow}>Plano Black Navalha</span>
              <h2>Eleve sua experiência.</h2>
              <p>
                Conheça o Plano Mensal e tenha acesso aos benefícios exclusivos
                para assinantes da Black Navalha.
              </p>
              <Link href="/assinaturas" className={styles.primaryLink}>
                Conhecer planos
              </Link>
            </section>

            <UpcomingAppointments appointments={upcomingAppointments} />

            <div className={styles.actions}>
              <Link href="/agendar" className={styles.primaryLink}>
                Agendar horário
              </Link>
            </div>

            <UpcomingAppointments
              appointments={appointmentHistory}
              variant="history"
            />
          </>
        ) : (
          <SubscriptionView
            data={data}
            upcomingAppointments={upcomingAppointments}
            appointmentHistory={appointmentHistory}
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
  upcomingAppointments,
  appointmentHistory,
  renewalAvailable,
  renewalBarbers,
}: {
  data: Extract<MySubscriptionData, { has_subscription: true }>;
  upcomingAppointments: Awaited<ReturnType<typeof getMyAppointments>>;
  appointmentHistory: Awaited<ReturnType<typeof getMyAppointments>>;
  renewalAvailable: boolean;
  renewalBarbers: PublicBarber[];
}) {
  const renewal = getRenewalState(data.cycle);

  return (
    <>
      <section className={styles.subscriptionHero}>
        <div className={styles.subscriptionHeroPlan}>
          <BadgeCheck size={30} aria-hidden="true" />
          <div>
            <span className={styles.eyebrow}>Plano atual</span>
            <h2>{data.plan?.name ?? data.subscription.name}</h2>
            <p>
              {STATUS_LABELS[data.subscription.status] ?? data.subscription.status}
              {data.plan ? ` · ${formatMoney(data.plan.price)} por mês` : ""}
            </p>
          </div>
        </div>

        <div className={styles.subscriptionHeroServices}>
          <div className={styles.subscriptionHeroServicesTitle}>
            <Scissors size={17} aria-hidden="true" />
            <span>Serviços incluídos</span>
          </div>

          {data.services.length > 0 ? (
            <ul>
              {data.services.map((service) => (
                <li key={service.name}>{service.name}</li>
              ))}
            </ul>
          ) : (
            <p>Nenhum serviço incluído.</p>
          )}
        </div>
      </section>

      <section className={styles.infoGrid}>
        <article className={styles.infoCard}>
          <CalendarDays size={20} aria-hidden="true" />
          <span>Validade do plano</span>
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
          <span>Seu barbeiro</span>
          <strong>{data.cycle?.barber_name ?? "Não informado"}</strong>
        </article>

        <article className={styles.infoCard}>
          <CalendarDays size={20} aria-hidden="true" />
          <span>Próxima renovação</span>
          <strong>{renewal.label}</strong>
          {renewal.detail ? <small>{renewal.detail}</small> : null}
        </article>

        <article className={styles.infoCard}>
          <CalendarDays size={20} aria-hidden="true" />
          <span>Reserva da vaga</span>
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

      <UpcomingAppointments appointments={upcomingAppointments} />

      <div className={styles.actions}>
        <Link href="/agendar" className={styles.primaryLink}>
          Agendar horário
        </Link>
      </div>

      <UpcomingAppointments
        appointments={appointmentHistory}
        variant="history"
      />

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
