import {
  BadgeDollarSign,
  RotateCcw,
} from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CommissionEntry = {
  id: string;
  charge_id: string;
  cycle_id: string;
  barber_id: string;
  entry_type: "commission" | "reversal";
  amount: number | string;
  rate: number | string | null;
  reverses_entry_id: string | null;
  created_at: string;
};

type BarberSummary = {
  id: string;
  name: string;
};

export default async function ComissoesPage() {
  const adminSupabase = createAdminClient();
  const supabase = await createClient();

  const { data, error } = await adminSupabase
    .from("subscription_commission_entries")
    .select(`
      id,
      charge_id,
      cycle_id,
      barber_id,
      entry_type,
      amount,
      rate,
      reverses_entry_id,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  const entries = (data ?? []) as CommissionEntry[];

  const barberIds = Array.from(
    new Set(entries.map((entry) => entry.barber_id))
  );

  let barberNames = new Map<string, string>();

  if (barberIds.length > 0) {
    const barbersResult = await supabase
      .from("barbers")
      .select("id, name")
      .in("id", barberIds);

    if (barbersResult.error) {
      console.error(
        "Erro ao carregar barbeiros das comissões:",
        barbersResult.error.message
      );
    } else {
      barberNames = new Map(
        ((barbersResult.data ?? []) as BarberSummary[]).map(
          (barber) => [barber.id, barber.name]
        )
      );
    }
  }

  const commissions = entries.filter(
    (entry) => entry.entry_type === "commission"
  );

  const reversals = entries.filter(
    (entry) => entry.entry_type === "reversal"
  );

  const commissionsTotal = commissions.reduce(
    (total, entry) => total + Number(entry.amount),
    0
  );

  const reversalsTotal = reversals.reduce(
    (total, entry) => total + Number(entry.amount),
    0
  );

  const netTotal = commissionsTotal - reversalsTotal;

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            ASSINATURAS
          </div>

          <h1 className="admin-title">
            Comissões
          </h1>

          <p className="admin-subtitle">
            Acompanhe os lançamentos históricos de comissão das
            mensalidades de assinatura efetivamente pagas.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          Não foi possível carregar as comissões:{" "}
          {error.message}
        </div>
      )}

      {!error && (
        <>
          <section style={summaryGridStyle}>
            <SummaryCard
              label="COMISSÕES"
              value={formatCurrency(commissionsTotal)}
              detail={`${commissions.length} lançamento${
                commissions.length === 1 ? "" : "s"
              }`}
            />

            <SummaryCard
              label="REVERSÕES"
              value={formatCurrency(reversalsTotal)}
              detail={`${reversals.length} reversão${
                reversals.length === 1 ? "" : "ões"
              }`}
            />

            <SummaryCard
              label="SALDO LÍQUIDO"
              value={formatCurrency(netTotal)}
              detail="Comissões menos reversões"
            />
          </section>

          {entries.length === 0 ? (
            <div className="admin-empty">
              <BadgeDollarSign size={34} />

              <strong>
                Nenhuma comissão lançada
              </strong>

              <span>
                Os lançamentos serão gerados somente em novas
                mensalidades de assinatura pagas com percentual
                maior que 0%.
              </span>
            </div>
          ) : (
            <section style={ledgerStyle}>
              <div>
                <div className="admin-eyebrow">
                  LEDGER
                </div>

                <h2 style={ledgerTitleStyle}>
                  Histórico de comissões
                </h2>
              </div>

              <div style={entriesStyle}>
                {entries.map((entry) => {
                  const isReversal =
                    entry.entry_type === "reversal";

                  return (
                    <article
                      key={entry.id}
                      style={entryStyle}
                    >
                      <div style={entryHeaderStyle}>
                        <div>
                          <small style={labelStyle}>
                            PROFISSIONAL
                          </small>

                          <strong style={primaryStyle}>
                            {barberNames.get(entry.barber_id) ??
                              "Profissional não identificado"}
                          </strong>
                        </div>

                        <span
                          style={{
                            ...typeBadgeStyle,
                            color: isReversal
                              ? "#e7a2a2"
                              : "#79d59b",
                            borderColor: isReversal
                              ? "#633838"
                              : "#315b40",
                            background: isReversal
                              ? "#1a0f0f"
                              : "#0d1911",
                          }}
                        >
                          {isReversal ? (
                            <>
                              <RotateCcw size={13} />
                              REVERSÃO
                            </>
                          ) : (
                            <>
                              <BadgeDollarSign size={13} />
                              COMISSÃO
                            </>
                          )}
                        </span>
                      </div>

                      <div style={entryDataStyle}>
                        <EntryData
                          label="VALOR"
                          value={`${isReversal ? "-" : ""}${formatCurrency(
                            Number(entry.amount)
                          )}`}
                        />

                        <EntryData
                          label="PERCENTUAL HISTÓRICO"
                          value={
                            entry.rate === null
                              ? "-"
                              : `${formatRate(entry.rate)}%`
                          }
                        />

                        <EntryData
                          label="LANÇAMENTO"
                          value={formatDateTime(entry.created_at)}
                        />
                      </div>

                      <div style={idsStyle}>
                        <span>
                          Charge: {entry.charge_id}
                        </span>

                        <span>
                          Ciclo: {entry.cycle_id}
                        </span>

                        {entry.reverses_entry_id && (
                          <span>
                            Reverte: {entry.reverses_entry_id}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article style={summaryCardStyle}>
      <small style={labelStyle}>
        {label}
      </small>

      <strong style={summaryValueStyle}>
        {value}
      </strong>

      <span style={summaryDetailStyle}>
        {detail}
      </span>
    </article>
  );
}

function EntryData({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <small style={labelStyle}>
        {label}
      </small>

      <strong style={dataValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatRate(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "14px",
  marginBottom: "22px",
} as const;

const summaryCardStyle = {
  padding: "18px",
  border: "1px solid #272727",
  borderRadius: "8px",
  background: "#0d0d0d",
} as const;

const labelStyle = {
  display: "block",
  color: "#777",
  fontSize: "9px",
  fontWeight: 800,
  letterSpacing: "0.1em",
} as const;

const summaryValueStyle = {
  display: "block",
  marginTop: "8px",
  color: "#f0f0f0",
  fontSize: "22px",
} as const;

const summaryDetailStyle = {
  display: "block",
  marginTop: "5px",
  color: "#777",
  fontSize: "10px",
} as const;

const ledgerStyle = {
  display: "grid",
  gap: "16px",
  padding: "20px",
  border: "1px solid #272727",
  borderRadius: "8px",
  background: "#090909",
} as const;

const ledgerTitleStyle = {
  margin: "6px 0 0",
  color: "#f0f0f0",
  fontSize: "20px",
} as const;

const entriesStyle = {
  display: "grid",
  gap: "10px",
} as const;

const entryStyle = {
  padding: "16px",
  border: "1px solid #242424",
  borderRadius: "7px",
  background: "#0f0f0f",
} as const;

const entryHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "12px",
} as const;

const primaryStyle = {
  display: "block",
  marginTop: "5px",
  color: "#eeeeee",
  fontSize: "13px",
} as const;

const typeBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "6px 8px",
  border: "1px solid",
  borderRadius: "999px",
  fontSize: "9px",
  fontWeight: 800,
} as const;

const entryDataStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "14px",
  marginTop: "16px",
} as const;

const dataValueStyle = {
  display: "block",
  marginTop: "5px",
  color: "#d7d7d7",
  fontSize: "12px",
} as const;

const idsStyle = {
  display: "grid",
  gap: "3px",
  marginTop: "14px",
  paddingTop: "12px",
  borderTop: "1px solid #222",
  color: "#606060",
  fontSize: "9px",
  wordBreak: "break-all",
} as const;