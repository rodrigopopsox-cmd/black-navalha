import Link from "next/link";
import {
  Plus,
  UserRound,
  Clock3,
  Scissors,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type OccupancyCycle = {
  subscription_id: string;
  barber_id: string;
  period_start: string;
  period_end: string;
  grace_until: string;
  status: string;
};

type SubscriptionSummary = {
  id: string;
  customers:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

export default async function BarbeirosPage() {
  const supabase = await createClient();

  const { data: barbers, error } = await supabase
    .from("barbers")
    .select(`
      id,
      name,
      phone,
      photo_url,
      active,
      subscriber_capacity
    `)
    .order("name");

  let occupancyCycles: OccupancyCycle[] = [];
  let subscriptionNames = new Map<string, string>();

  if (!error && barbers && barbers.length > 0) {
    const adminSupabase = createAdminClient();

    const cyclesResult = await adminSupabase
      .from("subscription_cycles")
      .select(`
        subscription_id,
        barber_id,
        period_start,
        period_end,
        grace_until,
        status
      `)
      .in(
        "barber_id",
        barbers.map((barber) => barber.id)
      )
      .in("status", ["paid", "grace"])
      .gt("grace_until", new Date().toISOString())
      .order("period_end", {
        ascending: false,
      });

    if (cyclesResult.error) {
      console.error(
        "Erro ao carregar ocupação de assinantes",
        cyclesResult.error.message
      );
    } else {
      occupancyCycles =
        (cyclesResult.data ?? []) as OccupancyCycle[];
    }

    const subscriptionIds = Array.from(
      new Set(
        occupancyCycles.map(
          (cycle) => cycle.subscription_id
        )
      )
    );

    if (subscriptionIds.length > 0) {
      const subscriptionsResult = await supabase
        .from("subscriptions")
        .select(`
          id,
          customers (
            name
          )
        `)
        .in("id", subscriptionIds);

      if (subscriptionsResult.error) {
        console.error(
          "Erro ao carregar assinantes da capacidade",
          subscriptionsResult.error.message
        );
      } else {
        subscriptionNames = new Map(
          (
            (subscriptionsResult.data ?? []) as SubscriptionSummary[]
          ).map((subscription) => [
            subscription.id,
            getRelation(subscription.customers)?.name ??
              "Assinante",
          ])
        );
      }
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            EQUIPE
          </div>

          <h1 className="admin-title">
            Barbeiros
          </h1>

          <p className="admin-subtitle">
            Gerencie os profissionais e acompanhe a capacidade de assinantes.
          </p>
        </div>

        <Link
          href="/admin/barbeiros/novo"
          className="admin-button"
        >
          <Plus size={17} />
          CADASTRAR BARBEIRO
        </Link>
      </div>

      {error && (
        <div className="admin-error">
          Não foi possível carregar os barbeiros:{" "}
          {error.message}
        </div>
      )}

      {!error && (!barbers || barbers.length === 0) && (
        <div className="admin-empty">
          <UserRound size={34} />

          <strong>
            Nenhum barbeiro cadastrado
          </strong>

          <span>
            Cadastre o primeiro profissional da Black Navalha.
          </span>

          <Link
            href="/admin/barbeiros/novo"
            className="admin-button"
            style={{ marginTop: "25px" }}
          >
            <Plus size={16} />
            CADASTRAR PRIMEIRO BARBEIRO
          </Link>
        </div>
      )}

      {barbers && barbers.length > 0 && (
        <div className="barbers-grid">
          {barbers.map((barber) => {
            const cyclesBySubscription = new Map<
              string,
              OccupancyCycle
            >();

            for (const cycle of occupancyCycles) {
              if (cycle.barber_id !== barber.id) {
                continue;
              }

              if (
                !cyclesBySubscription.has(
                  cycle.subscription_id
                )
              ) {
                cyclesBySubscription.set(
                  cycle.subscription_id,
                  cycle
                );
              }
            }

            const occupiedCycles = Array.from(
              cyclesBySubscription.values()
            );

            const capacity =
              Number(barber.subscriber_capacity) || 0;

            const occupied = occupiedCycles.length;

            const available = Math.max(
              capacity - occupied,
              0
            );

            const occupancyPercent =
              capacity > 0
                ? Math.min(
                    Math.round(
                      (occupied / capacity) * 100
                    ),
                    100
                  )
                : 0;

            return (
              <article
                className="barber-card"
                key={barber.id}
              >
                <div className="barber-avatar">
                  {barber.photo_url ? (
                    <img
                      src={barber.photo_url}
                      alt={barber.name}
                    />
                  ) : (
                    <UserRound size={29} />
                  )}
                </div>

                <div className="barber-card-info">
                  <div className="barber-top">
                    <div>
                      <h2>{barber.name}</h2>

                      {barber.phone && (
                        <span>{barber.phone}</span>
                      )}
                    </div>

                    <div
                      className={
                        barber.active
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {barber.active
                        ? "ATIVO"
                        : "INATIVO"}
                    </div>
                  </div>

                  <div style={capacityPanelStyle}>
                    <div style={capacityHeaderStyle}>
                      <div>
                        <small style={eyebrowStyle}>
                          CAPACIDADE DE ASSINANTES
                        </small>

                        <strong style={capacityTitleStyle}>
                          {occupied} de {capacity} vagas ocupadas
                        </strong>
                      </div>

                      <strong
                        style={{
                          color:
                            available > 0
                              ? "#70d59a"
                              : "#e47b7b",
                          fontSize: "12px",
                        }}
                      >
                        {available} disponíveis
                      </strong>
                    </div>

                    <div style={progressTrackStyle}>
                      <div
                        style={{
                          ...progressFillStyle,
                          width: `${occupancyPercent}%`,
                        }}
                      />
                    </div>

                    <div style={capacityStatsStyle}>
                      <CapacityData
                        label="OCUPADAS"
                        value={occupied}
                      />

                      <CapacityData
                        label="DISPONÍVEIS"
                        value={available}
                      />

                      <CapacityData
                        label="CAPACIDADE"
                        value={capacity}
                      />

                      <CapacityData
                        label="OCUPAÇÃO"
                        value={`${occupancyPercent}%`}
                      />
                    </div>

                    {occupiedCycles.length > 0 ? (
                      <div style={subscriberListStyle}>
                        <small style={eyebrowStyle}>
                          ASSINANTES OCUPANDO VAGA
                        </small>

                        {occupiedCycles.map((cycle) => {
                          const now = new Date();

                          const today =
                            new Intl.DateTimeFormat(
                              "en-CA",
                              {
                                timeZone:
                                  "America/Sao_Paulo",
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              }
                            ).format(now);

                          const inGrace =
                            cycle.period_end < today &&
                            new Date(
                              cycle.grace_until
                            ) > now;

                          return (
                            <div
                              key={cycle.subscription_id}
                              style={subscriberRowStyle}
                            >
                              <div>
                                <strong
                                  style={{
                                    color: "#e8e8e8",
                                    fontSize: "12px",
                                  }}
                                >
                                  {subscriptionNames.get(
                                    cycle.subscription_id
                                  ) ?? "Assinante"}
                                </strong>

                                <span
                                  style={{
                                    display: "block",
                                    marginTop: "3px",
                                    color: "#777",
                                    fontSize: "10px",
                                  }}
                                >
                                  {formatDate(
                                    cycle.period_start
                                  )}{" "}
                                  até{" "}
                                  {formatDate(
                                    cycle.period_end
                                  )}
                                </span>
                              </div>

                              <span
                                style={{
                                  color: inGrace
                                    ? "#d29d4f"
                                    : "#70d59a",
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  textTransform:
                                    "uppercase",
                                }}
                              >
                                {inGrace
                                  ? "Carência"
                                  : "Ciclo pago"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={emptyCapacityStyle}>
                        Nenhum assinante ocupa vaga neste profissional.
                      </div>
                    )}
                  </div>

                  <div className="barber-actions">
                    <Link
                      href={`/admin/barbeiros/${barber.id}`}
                    >
                      EDITAR
                    </Link>

                    <Link
                      href={`/admin/barbeiros/${barber.id}/horarios`}
                    >
                      <Clock3 size={14} />
                      HORÁRIOS
                    </Link>

                    <Link
                      href={`/admin/barbeiros/${barber.id}/servicos`}
                    >
                      <Scissors size={14} />
                      SERVIÇOS
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function CapacityData({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <small style={eyebrowStyle}>
        {label}
      </small>

      <strong
        style={{
          display: "block",
          marginTop: "5px",
          color: "#f0f0f0",
          fontSize: "16px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function getRelation<T>(
  value: T | T[] | null
): T | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDate(value: string) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(year, month - 1, day)
  );
}

const capacityPanelStyle = {
  marginTop: "18px",
  padding: "16px",
  border: "1px solid #292929",
  borderRadius: "8px",
  background: "#0b0b0b",
} as const;

const capacityHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "12px",
} as const;

const eyebrowStyle = {
  display: "block",
  color: "#777",
  fontSize: "9px",
  fontWeight: 800,
  letterSpacing: "0.1em",
} as const;

const capacityTitleStyle = {
  display: "block",
  marginTop: "6px",
  color: "#e8e8e8",
  fontSize: "13px",
} as const;

const progressTrackStyle = {
  height: "6px",
  marginTop: "14px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "#242424",
} as const;

const progressFillStyle = {
  height: "100%",
  borderRadius: "999px",
  background: "#d29d4f",
} as const;

const capacityStatsStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(90px, 1fr))",
  gap: "14px",
  marginTop: "15px",
} as const;

const subscriberListStyle = {
  display: "grid",
  gap: "8px",
  marginTop: "17px",
  paddingTop: "14px",
  borderTop: "1px solid #252525",
} as const;

const subscriberRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "9px 10px",
  border: "1px solid #242424",
  borderRadius: "6px",
  background: "#0f0f0f",
} as const;

const emptyCapacityStyle = {
  marginTop: "15px",
  paddingTop: "13px",
  borderTop: "1px solid #252525",
  color: "#666",
  fontSize: "11px",
} as const;
