import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  subscriptionId: string;
  barbers: Barber[];
};

type Cycle = {
  id: string;
  barber_id: string;
  period_start: string;
  period_end: string;
  grace_until: string;
  status: string;
  price_amount: number | string;
  created_at: string;
};

type Charge = {
  id: string;
  subscription_id: string | null;
  cycle_id: string | null;
  barber_id: string;
  amount: number | string;
  currency: string;
  status: string;
  provider: string | null;
  provider_charge_id: string | null;
  paid_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  expired_at: string | null;
  refunded_at: string | null;
  created_at: string;
};

type Barber = {
  id: string;
  name: string;
};

const cycleStatusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  grace: "Em carência",
  expired: "Expirado",
  cancelled: "Cancelado",
};

const chargeStatusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Estornado",
  partially_refunded: "Estorno parcial",
};

export default async function SubscriptionHistory({
  subscriptionId,
  barbers,
}: Props) {
  const supabase = createAdminClient();

  const [cyclesResult, chargesResult] = await Promise.all([
    supabase
      .from("subscription_cycles")
      .select(`
        id,
        barber_id,
        period_start,
        period_end,
        grace_until,
        status,
        price_amount,
        created_at
      `)
      .eq("subscription_id", subscriptionId)
      .order("period_start", { ascending: false }),

    supabase
      .from("subscription_charges")
      .select(`
        id,
        subscription_id,
        cycle_id,
        barber_id,
        amount,
        currency,
        status,
        provider,
        provider_charge_id,
        paid_at,
        failed_at,
        cancelled_at,
        expired_at,
        refunded_at,
        created_at
      `)
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false }),
  ]);

  if (cyclesResult.error || chargesResult.error) {
    console.error("Erro ao carregar histórico da assinatura", {
      cycles: cyclesResult.error?.message,
      charges: chargesResult.error?.message,
    });

    return (
      <section style={sectionStyle}>
        <div style={headingStyle}>
          <div>
            <div style={eyebrowStyle}>HISTÓRICO</div>
            <h2 style={titleStyle}>Financeiro e operacional</h2>
          </div>
        </div>

        <div className="admin-error">
          Não foi possível carregar o histórico desta assinatura.
        </div>
      </section>
    );
  }

  const cycles = (cyclesResult.data ?? []) as Cycle[];
  const charges = (chargesResult.data ?? []) as Charge[];


  const barberNames = new Map(
    barbers.map((barber) => [barber.id, barber.name])
  );

  const currentCycle =
    cycles.find(
      (cycle) =>
        cycle.status === "paid" || cycle.status === "grace"
    ) ?? cycles[0] ?? null;

  const currentCharge = currentCycle
    ? charges.find((charge) => charge.cycle_id === currentCycle.id) ?? null
    : null;

  return (
    <section style={sectionStyle}>
      <div style={headingStyle}>
        <div>
          <div style={eyebrowStyle}>HISTÓRICO</div>
          <h2 style={titleStyle}>Financeiro e operacional</h2>
          <p style={subtitleStyle}>
            Ciclos e cobranças registrados para esta assinatura.
          </p>
        </div>
      </div>

      {cycles.length === 0 && charges.length === 0 ? (
        <div style={emptyStyle}>
          <strong>Sem histórico financeiro registrado.</strong>
          <span style={{ color: "#777", fontSize: 13 }}>
            Esta assinatura pode ser legada ou ainda não possuir ciclo/cobrança
            comercial registrada.
          </span>
        </div>
      ) : (
        <>
          <div style={summaryGridStyle}>
            <InfoCard
              label="CICLO ATUAL"
              value={
                currentCycle
                  ? `${formatDate(currentCycle.period_start)} ate ${formatDate(
                      currentCycle.period_end
                    )}`
                  : "Sem ciclo"
              }
              detail={
                currentCycle
                  ? cycleStatusLabels[currentCycle.status] ?? currentCycle.status
                  : undefined
              }
            />

            <InfoCard
              label="BARBEIRO DO CICLO"
              value={
                currentCycle
                  ? barberNames.get(currentCycle.barber_id) ??
                    "Profissional não identificado"
                  : "-"
              }
            />

            <InfoCard
              label="CARÊNCIA"
              value={
                currentCycle
                  ? `Até ${formatDateTime(currentCycle.grace_until)}`
                  : "-"
              }
              detail="Reserva de capacidade pós-ciclo"
            />

            <InfoCard
              label="SITUAÇÃO FINANCEIRA"
              value={
                currentCharge
                  ? chargeStatusLabels[currentCharge.status] ??
                    currentCharge.status
                  : charges.length > 0
                    ? chargeStatusLabels[charges[0].status] ?? charges[0].status
                    : "Sem cobrança"
              }
              detail={
                currentCharge?.paid_at
                  ? `Pago em ${formatDateTime(currentCharge.paid_at)}`
                  : undefined
              }
            />
          </div>

          <div style={blockStyle}>
            <h3 style={blockTitleStyle}>Histórico de ciclos</h3>

            {cycles.length === 0 ? (
              <p style={mutedStyle}>Nenhum ciclo registrado.</p>
            ) : (
              <div style={listStyle}>
                {cycles.map((cycle) => {
                  const relatedCharge =
                    charges.find((charge) => charge.cycle_id === cycle.id) ??
                    null;

                  return (
                    <article key={cycle.id} style={itemStyle}>
                      <div style={itemGridStyle}>
                        <Data
                          label="PERÍODO"
                          value={`${formatDate(cycle.period_start)} ate ${formatDate(
                            cycle.period_end
                          )}`}
                        />
                        <Data
                          label="STATUS"
                          value={
                            cycleStatusLabels[cycle.status] ?? cycle.status
                          }
                        />
                        <Data
                          label="BARBEIRO"
                          value={
                            barberNames.get(cycle.barber_id) ??
                            "Profissional não identificado"
                          }
                        />
                        <Data
                          label="VALOR DO CICLO"
                          value={formatMoney(cycle.price_amount, "BRL")}
                        />
                        <Data
                          label="CARÊNCIA ATÉ"
                          value={formatDateTime(cycle.grace_until)}
                        />
                        <Data
                          label="COBRANÇA"
                          value={
                            relatedCharge
                              ? shortId(relatedCharge.id)
                              : "Sem cobrança vinculada"
                          }
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div style={blockStyle}>
            <h3 style={blockTitleStyle}>Histórico de cobranças</h3>

            {charges.length === 0 ? (
              <p style={mutedStyle}>Nenhuma cobrança registrada.</p>
            ) : (
              <div style={listStyle}>
                {charges.map((charge) => (
                  <article key={charge.id} style={itemStyle}>
                    <div style={itemGridStyle}>
                      <Data
                        label="VALOR"
                        value={formatMoney(charge.amount, charge.currency)}
                      />
                      <Data
                        label="STATUS"
                        value={
                          chargeStatusLabels[charge.status] ?? charge.status
                        }
                      />
                      <Data
                        label="PAGAMENTO"
                        value={
                          charge.paid_at
                            ? formatDateTime(charge.paid_at)
                            : "Não pago"
                        }
                      />
                      <Data
                        label="PROVIDER"
                        value={formatProvider(charge.provider)}
                      />
                      <Data
                        label="ORDER ID"
                        value={charge.provider_charge_id ?? "-"}
                        mono
                      />
                      <Data
                        label="BARBEIRO"
                        value={
                          barberNames.get(charge.barber_id) ??
                          "Profissional não identificado"
                        }
                      />
                      <Data
                        label="CICLO"
                        value={
                          charge.cycle_id
                            ? shortId(charge.cycle_id)
                            : "Ainda não vinculado"
                        }
                        mono
                      />
                      <Data
                        label="CRIADA EM"
                        value={formatDateTime(charge.created_at)}
                      />
                    </div>

                    <div style={idRowStyle}>
                      <span>
                        Charge: <code>{charge.id}</code>
                      </span>
                      {charge.cycle_id && (
                        <span>
                          Ciclo: <code>{charge.cycle_id}</code>
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function InfoCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div style={cardStyle}>
      <small style={labelStyle}>{label}</small>
      <strong style={cardValueStyle}>{value}</strong>
      {detail && <span style={mutedStyle}>{detail}</span>}
    </div>
  );
}

function Data({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <small style={labelStyle}>{label}</small>
      <div
        style={{
          marginTop: 5,
          color: "#e7e7e7",
          fontSize: 13,
          overflowWrap: "anywhere",
          fontFamily: mono ? "monospace" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

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

function formatMoney(value: number | string, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(Number(value));
}

function formatProvider(provider: string | null) {
  if (provider === "mercado_pago") {
    return "Mercado Pago";
  }

  return provider ?? "-";
}

function shortId(value: string) {
  return `${value.slice(0, 8)}...`;
}

const sectionStyle = {
  marginTop: 32,
  paddingTop: 28,
  borderTop: "1px solid #262626",
} as const;

const headingStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 20,
} as const;

const eyebrowStyle = {
  color: "#d29d4f",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.14em",
} as const;

const titleStyle = {
  margin: "6px 0 0",
  color: "#f5f5f5",
  fontSize: 24,
} as const;

const subtitleStyle = {
  margin: "7px 0 0",
  color: "#777",
  fontSize: 13,
} as const;

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 12,
  marginBottom: 22,
} as const;

const cardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  padding: 16,
  border: "1px solid #282828",
  borderRadius: 8,
  background: "#0d0d0d",
} as const;

const cardValueStyle = {
  color: "#f0f0f0",
  fontSize: 14,
  lineHeight: 1.45,
} as const;

const labelStyle = {
  display: "block",
  color: "#8b8b8b",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.1em",
} as const;

const mutedStyle = {
  margin: 0,
  color: "#777",
  fontSize: 12,
  lineHeight: 1.5,
} as const;

const blockStyle = {
  marginTop: 18,
} as const;

const blockTitleStyle = {
  margin: "0 0 10px",
  color: "#d29d4f",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
} as const;

const listStyle = {
  display: "grid",
  gap: 10,
} as const;

const itemStyle = {
  padding: 16,
  border: "1px solid #252525",
  borderRadius: 8,
  background: "#0b0b0b",
} as const;

const itemGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
  gap: 16,
} as const;

const idRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px 18px",
  marginTop: 15,
  paddingTop: 12,
  borderTop: "1px solid #202020",
  color: "#666",
  fontSize: 10,
  overflowWrap: "anywhere",
} as const;

const emptyStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  padding: 20,
  border: "1px solid #282828",
  borderRadius: 8,
  background: "#0d0d0d",
  color: "#ddd",
} as const;
