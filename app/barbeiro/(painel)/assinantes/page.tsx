import { BadgeCheck, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type SubscriberRow = {
  subscription_id: string;
  customer_name: string;
  customer_phone: string;
  plan_name: string;
  subscription_status: string;
  cycle_status: string;
  period_start: string;
  period_end: string;
  grace_until: string;
};

const subscriptionStatusLabels: Record<string, string> = {
  active: "Ativa",
  paused: "Pausada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

const cycleStatusLabels: Record<string, string> = {
  paid: "Ciclo pago",
  grace: "Carência",
  pending: "Pendente",
  expired: "Expirado",
  cancelled: "Cancelado",
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day)
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (digits.length === 10) {
    return digits.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  return value;
}

export default async function BarberSubscribersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_my_barber_subscribers"
  );

  if (error) {
    console.error(
      "Erro ao carregar assinantes do barbeiro:",
      error.message
    );
  }

  const subscribers = (data ?? []) as SubscriberRow[];

  return (
    <main className="barber-area-page">
      <div className="barber-page-heading">
        <div>
          <div className="barber-area-eyebrow">ÁREA DO PROFISSIONAL</div>
          <h1>Meus Assinantes</h1>
          <p>
            Assinantes atualmente vinculados aos seus ciclos pagos ou em
            carência.
          </p>
        </div>
      </div>

      <section className="barber-agenda-section" style={{ marginTop: 0 }}>
        <div className="barber-section-heading">
          <div>
            <span>CARTEIRA ATUAL</span>
            <h2>
              {subscribers.length}{" "}
              {subscribers.length === 1 ? "assinante" : "assinantes"}
            </h2>
          </div>
        </div>

        {error ? (
          <div className="barber-empty-state">
            <Users size={26} />
            <strong>Não foi possível carregar seus assinantes.</strong>
            <span>Tente novamente em alguns instantes.</span>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="barber-empty-state">
            <Users size={26} />
            <strong>Nenhum assinante vinculado no momento.</strong>
            <span>
              Assinantes com ciclo pago ou em carência aparecerão aqui.
            </span>
          </div>
        ) : (
          <div className="barber-subscribers-grid">
            {subscribers.map((subscriber) => (
              <article
                className="barber-subscriber-card"
                key={subscriber.subscription_id}
              >
                <div className="barber-subscriber-top">
                  <div className="barber-metric-icon">
                    <BadgeCheck size={18} />
                  </div>

                  <div>
                    <strong>{subscriber.customer_name}</strong>
                    <span>{formatPhone(subscriber.customer_phone)}</span>
                  </div>

                  <span
                    className={`barber-status barber-status-${subscriber.cycle_status}`}
                  >
                    {cycleStatusLabels[subscriber.cycle_status] ??
                      subscriber.cycle_status}
                  </span>
                </div>

                <div className="barber-subscriber-plan">
                  <span>PLANO</span>
                  <strong>{subscriber.plan_name}</strong>
                </div>

                <div className="barber-subscriber-data">
                  <div>
                    <span>ASSINATURA</span>
                    <strong>
                      {subscriptionStatusLabels[
                        subscriber.subscription_status
                      ] ?? subscriber.subscription_status}
                    </strong>
                  </div>

                  <div>
                    <span>PERÍODO</span>
                    <strong>
                      {formatDate(subscriber.period_start)} até{" "}
                      {formatDate(subscriber.period_end)}
                    </strong>
                  </div>

                  <div>
                    <span>CARÊNCIA</span>
                    <strong>
                      Até {formatDateTime(subscriber.grace_until)}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}