import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  WalletCards,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type CommissionRow = {
  source: "subscription" | "service";
  entry_type: "commission" | "reversal";
  amount: number | string;
  rate: number | string | null;
  created_at: string;
};

type PageProps = {
  searchParams: Promise<{
    periodo?: string | string[];
  }>;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const periodFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

function currentPeriod() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function parsePeriod(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  const fallback = currentPeriod();

  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) {
    return fallback;
  }

  const [year, month] = raw.split("-").map(Number);

  if (
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12
  ) {
    return fallback;
  }

  return raw;
}

function shiftPeriod(value: string, months: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

function formatPeriod(value: string) {
  const [year, month] = value.split("-").map(Number);
  return periodFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRate(value: number | string | null) {
  if (value === null) {
    return "-";
  }

  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(Number(value))}%`;
}

export default async function BarberCommissionsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const period = parsePeriod(params.periodo);
  const [year, month] = period.split("-").map(Number);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "get_my_barber_commissions",
    {
      p_year: year,
      p_month: month,
    }
  );

  if (error) {
    console.error(
      "Erro ao carregar comissões do barbeiro:",
      error.message
    );
  }

  const entries = (data ?? []) as CommissionRow[];

  const subscriptionCommissions = entries
    .filter(
      (entry) =>
        entry.source === "subscription" &&
        entry.entry_type === "commission"
    )
    .reduce((total, entry) => total + Number(entry.amount), 0);

  const serviceCommissions = entries
    .filter(
      (entry) =>
        entry.source === "service" &&
        entry.entry_type === "commission"
    )
    .reduce((total, entry) => total + Number(entry.amount), 0);

  const reversals = entries
    .filter((entry) => entry.entry_type === "reversal")
    .reduce((total, entry) => total + Number(entry.amount), 0);

  const commissions = subscriptionCommissions + serviceCommissions;
  const net = commissions - reversals;

  return (
    <main className="barber-area-page">
      <div className="barber-page-heading">
        <div>
          <div className="barber-area-eyebrow">ÁREA DO PROFISSIONAL</div>
          <h1>Comissões</h1>
          <p>
            Comissões históricas de assinaturas e atendimentos concluídos.
          </p>
        </div>
      </div>

      <section className="barber-date-navigation">
        <div>
          <span>PERÍODO</span>
          <strong>{formatPeriod(period)}</strong>
        </div>

        <nav aria-label="Navegação por período de comissão">
          <Link
            href={`/barbeiro/comissoes?periodo=${shiftPeriod(period, -1)}`}
          >
            <ChevronLeft size={17} />
            <span>Mês anterior</span>
          </Link>

          <Link
            href="/barbeiro/comissoes"
            className={period === currentPeriod() ? "is-current" : undefined}
          >
            Atual
          </Link>

          <Link
            href={`/barbeiro/comissoes?periodo=${shiftPeriod(period, 1)}`}
          >
            <span>Próximo mês</span>
            <ChevronRight size={17} />
          </Link>
        </nav>
      </section>

      <section className="barber-commission-summary">
        <article>
          <span>ASSINATURAS</span>
          <strong>{moneyFormatter.format(subscriptionCommissions)}</strong>
        </article>

        <article>
          <span>SERVIÇOS</span>
          <strong>{moneyFormatter.format(serviceCommissions)}</strong>
        </article>

        <article>
          <span>REVERSÕES</span>
          <strong>{moneyFormatter.format(reversals)}</strong>
        </article>

        <article className="is-highlight">
          <span>SALDO LÍQUIDO</span>
          <strong>{moneyFormatter.format(net)}</strong>
        </article>
      </section>

      <section className="barber-agenda-section">
        <div className="barber-section-heading">
          <div>
            <span>LANÇAMENTOS</span>
            <h2>
              {entries.length}{" "}
              {entries.length === 1 ? "lançamento" : "lançamentos"}
            </h2>
          </div>
        </div>

        {error ? (
          <div className="barber-empty-state">
            <WalletCards size={26} />
            <strong>Não foi possível carregar suas comissões.</strong>
            <span>Tente novamente em alguns instantes.</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="barber-empty-state">
            <WalletCards size={26} />
            <strong>Nenhum lançamento neste período.</strong>
            <span>
              Comissões de assinaturas e serviços concluídos aparecerão aqui.
            </span>
          </div>
        ) : (
          <div className="barber-commission-list">
            {entries.map((entry, index) => (
              <article
                className="barber-commission-entry"
                key={`${entry.created_at}-${entry.entry_type}-${index}`}
              >
                <div
                  className={`barber-commission-entry-icon ${
                    entry.entry_type === "reversal" ? "is-reversal" : ""
                  }`}
                >
                  {entry.entry_type === "reversal" ? (
                    <RotateCcw size={17} />
                  ) : (
                    <WalletCards size={17} />
                  )}
                </div>

                <div>
                  <strong>
                    {entry.entry_type === "reversal"
                      ? `Reversão · ${
                          entry.source === "service"
                            ? "Serviço"
                            : "Assinatura"
                        }`
                      : `Comissão · ${
                          entry.source === "service"
                            ? "Serviço"
                            : "Assinatura"
                        }`}
                  </strong>
                  <span>{formatDateTime(entry.created_at)}</span>
                </div>

                <div>
                  <span>TAXA HISTÓRICA</span>
                  <strong>{formatRate(entry.rate)}</strong>
                </div>

                <strong
                  className={
                    entry.entry_type === "reversal" ? "is-negative" : ""
                  }
                >
                  {entry.entry_type === "reversal" ? "- " : ""}
                  {moneyFormatter.format(Number(entry.amount))}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}