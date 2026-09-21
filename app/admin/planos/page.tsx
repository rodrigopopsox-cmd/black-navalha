import Link from "next/link";
import {
  BadgeCheck,
  CircleDollarSign,
  Layers3,
  Pencil,
  Plus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type CapacityGroup = {
  id: string;
  code: string;
  name: string;
  per_barber_capacity: number;
  active: boolean;
};

type PlanService = {
  plan_id: string;
  service_id: string;
};

type Service = {
  id: string;
  name: string;
};

type Plan = {
  id: string;
  name: string;
  price: number | string;
  billing_interval_months: number;
  grace_days: number;
  active: boolean;
  capacity_group_id: string | null;
};

function money(value: number | string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function PlanosPage() {
  const supabase = await createClient();

  const [
    plansResult,
    groupsResult,
    linksResult,
    servicesResult,
  ] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select(`
        id,
        name,
        price,
        billing_interval_months,
        grace_days,
        active,
        capacity_group_id
      `)
      .order("created_at", { ascending: true }),

    supabase
      .from("subscription_capacity_groups")
      .select(`
        id,
        code,
        name,
        per_barber_capacity,
        active
      `)
      .order("name", { ascending: true }),

    supabase
      .from("subscription_plan_services")
      .select("plan_id, service_id"),

    supabase
      .from("services")
      .select("id, name")
      .eq("subscriber_service", true)
      .order("name", { ascending: true }),
  ]);

  if (plansResult.error) {
    console.error(
      "Erro ao carregar planos:",
      plansResult.error
    );
  }

  if (groupsResult.error) {
    console.error(
      "Erro ao carregar grupos de capacidade:",
      groupsResult.error
    );
  }

  if (linksResult.error) {
    console.error(
      "Erro ao carregar benefícios dos planos:",
      linksResult.error
    );
  }

  if (servicesResult.error) {
    console.error(
      "Erro ao carregar serviços de assinatura:",
      servicesResult.error
    );
  }

  const plans = (plansResult.data ?? []) as Plan[];
  const groups = (groupsResult.data ?? []) as CapacityGroup[];
  const links = (linksResult.data ?? []) as PlanService[];
  const services = (servicesResult.data ?? []) as Service[];

  const groupById = new Map(
    groups.map((group) => [group.id, group])
  );

  const serviceById = new Map(
    services.map((service) => [service.id, service])
  );

  const activePlans = plans.filter(
    (plan) => plan.active
  ).length;

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Planos
          </h1>

          <p className="admin-subtitle">
            Gerencie catálogo, preço, benefícios e capacidade
            das assinaturas. Ciclos já pagos permanecem
            congelados.
          </p>
        </div>

        <Link
          href="/admin/planos/novo"
          style={primaryLinkStyle}
        >
          <Plus size={16} />
          NOVO PLANO
        </Link>
      </div>

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Planos cadastrados"
          value={String(plans.length)}
          icon={<Layers3 size={19} />}
        />
        <SummaryCard
          label="Planos ativos"
          value={String(activePlans)}
          icon={<BadgeCheck size={19} />}
        />
        <SummaryCard
          label="Grupos de capacidade"
          value={String(groups.length)}
          icon={<Layers3 size={19} />}
        />
      </div>

      {plans.length === 0 ? (
        <div className="admin-empty" style={emptyStyle}>
          <Layers3 size={32} />
          <strong>Nenhum plano cadastrado</strong>
          <span>Os planos aparecerão aqui.</span>
        </div>
      ) : (
        <div style={cardsGridStyle}>
          {plans.map((plan) => {
            const group = plan.capacity_group_id
              ? groupById.get(plan.capacity_group_id)
              : undefined;

            const benefits = links
              .filter((link) => link.plan_id === plan.id)
              .map((link) => serviceById.get(link.service_id)?.name)
              .filter((name): name is string => Boolean(name))
              .sort((a, b) => a.localeCompare(b, "pt-BR"));

            return (
              <article
                key={plan.id}
                style={{
                  ...cardStyle,
                  opacity: plan.active ? 1 : 0.68,
                }}
              >
                <div style={cardHeaderStyle}>
                  <div>
                    <span style={eyebrowStyle}>
                      {plan.active ? "ATIVO" : "INATIVO"}
                    </span>
                    <h2 style={cardTitleStyle}>
                      {plan.name}
                    </h2>
                  </div>

                  <span style={priceStyle}>
                    {money(plan.price)}
                  </span>
                </div>

                <div style={detailsGridStyle}>
                  <Detail
                    label="Ciclo"
                    value={`${plan.billing_interval_months} mês`}
                  />
                  <Detail
                    label="Carência"
                    value={`${plan.grace_days} dias`}
                  />
                  <Detail
                    label="Grupo"
                    value={group?.name ?? "Sem grupo"}
                  />
                  <Detail
                    label="Capacidade"
                    value={
                      group
                        ? `${group.per_barber_capacity} vagas por barbeiro`
                        : "-"
                    }
                  />
                </div>

                <div style={{ marginTop: "18px" }}>
                  <span style={fieldLabelStyle}>
                    BENEFÍCIOS
                  </span>

                  {benefits.length === 0 ? (
                    <p style={mutedStyle}>
                      Nenhum benefício configurado.
                    </p>
                  ) : (
                    <ul style={benefitsStyle}>
                      {benefits.map((benefit) => (
                        <li key={benefit}>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div style={actionsStyle}>
                  <Link
                    href={`/admin/planos/${plan.id}`}
                    style={secondaryLinkStyle}
                  >
                    <Pencil size={15} />
                    EDITAR PLANO
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div style={noticeStyle}>
        <CircleDollarSign size={20} />

        <div>
          <strong style={{ color: "#eee" }}>
            Histórico protegido
          </strong>
          <p style={noticeTextStyle}>
            Alterar preço, benefícios, barbeiro ou grupo não
            modifica ciclos já pagos. Para encerrar novas
            contratações, desative o plano em vez de apagá-lo.
          </p>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ color: "#c89b58" }}>{icon}</div>
      <div>
        <div style={summaryLabelStyle}>{label}</div>
        <strong style={summaryValueStyle}>{value}</strong>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span style={fieldLabelStyle}>{label}</span>
      <strong style={detailValueStyle}>{value}</strong>
    </div>
  );
}

const primaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  minHeight: "42px",
  padding: "0 16px",
  color: "#0a0704",
  background: "#c89b58",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 700,
} as const;

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "14px",
  marginBottom: "20px",
} as const;

const summaryCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "18px",
  border: "1px solid #222",
  borderRadius: "8px",
  background: "#0e0e0e",
} as const;

const summaryLabelStyle = {
  color: "#777",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
} as const;

const summaryValueStyle = {
  display: "block",
  marginTop: "4px",
  color: "#f5f2eb",
  fontSize: "24px",
} as const;

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "14px",
} as const;

const cardStyle = {
  padding: "20px",
  border: "1px solid #222",
  borderRadius: "8px",
  background: "#0e0e0e",
} as const;

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
} as const;

const eyebrowStyle = {
  color: "#c89b58",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "1px",
} as const;

const cardTitleStyle = {
  margin: "6px 0 0",
  color: "#f5f2eb",
  fontSize: "21px",
} as const;

const priceStyle = {
  color: "#e6b96d",
  fontSize: "18px",
  fontWeight: 800,
  whiteSpace: "nowrap",
} as const;

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  marginTop: "20px",
} as const;

const fieldLabelStyle = {
  display: "block",
  color: "#777",
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.9px",
  marginBottom: "5px",
} as const;

const detailValueStyle = {
  color: "#ddd",
  fontSize: "13px",
} as const;

const benefitsStyle = {
  margin: "8px 0 0",
  paddingLeft: "18px",
  color: "#bbb",
  fontSize: "13px",
  lineHeight: 1.7,
} as const;

const mutedStyle = {
  margin: "8px 0 0",
  color: "#666",
  fontSize: "12px",
} as const;

const actionsStyle = {
  display: "flex",
  marginTop: "20px",
  paddingTop: "16px",
  borderTop: "1px solid #202020",
} as const;

const secondaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  minHeight: "38px",
  padding: "0 14px",
  color: "#ddd",
  background: "#151515",
  border: "1px solid #333",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 700,
} as const;

const noticeStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  marginTop: "20px",
  padding: "16px",
  border: "1px solid #3b3020",
  borderRadius: "8px",
  background: "#151107",
  color: "#c89b58",
} as const;

const noticeTextStyle = {
  margin: "5px 0 0",
  color: "#9b907f",
  fontSize: "12px",
  lineHeight: 1.6,
} as const;

const emptyStyle = {
  minHeight: "360px",
  border: "1px solid #222",
  borderRadius: "8px",
  background: "#0e0e0e",
} as const;