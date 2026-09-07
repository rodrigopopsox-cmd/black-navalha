import Link from "next/link";
import {
  BadgeCheck,
  Clock3,
  DollarSign,
  Pencil,
  Scissors,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number | string;
  duration_minutes: number;
  subscriber_service: boolean;
  active: boolean;
  created_at: string;
};

export default async function ServicosPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select(`
      id,
      name,
      description,
      category,
      price,
      duration_minutes,
      subscriber_service,
      active,
      created_at
    `)
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Erro ao carregar serviços:",
      error
    );
  }

  const services = (data ?? []) as Service[];

  const activeServices = services.filter(
    (service) => service.active
  ).length;

  const planServices = services.filter(
    (service) => service.subscriber_service
  ).length;

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Serviços
          </h1>

          <p className="admin-subtitle">
            Consulte e gerencie os serviços oferecidos pela
            barbearia.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <SummaryCard
          label="Serviços cadastrados"
          value={String(services.length)}
          icon={<Scissors size={19} />}
        />

        <SummaryCard
          label="Serviços ativos"
          value={String(activeServices)}
          icon={<BadgeCheck size={19} />}
        />

        <SummaryCard
          label="Serviços de plano"
          value={String(planServices)}
          icon={<BadgeCheck size={19} />}
        />
      </div>

      {services.length === 0 ? (
        <div
          className="admin-empty"
          style={{
            minHeight: "360px",
            border: "1px solid #222",
            borderRadius: "8px",
            background: "#0e0e0e",
          }}
        >
          <Scissors size={32} />

          <strong>
            Nenhum serviço cadastrado
          </strong>

          <span>
            Os serviços aparecerão aqui.
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(270px, 1fr))",
            gap: "14px",
          }}
        >
          {services.map((service) => (
            <article
              key={service.id}
              style={{
                background: "#0e0e0e",
                border: "1px solid #222",
                borderRadius: "8px",
                padding: "20px",
                opacity: service.active
                  ? 1
                  : 0.65,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "flex-start",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "9px",
                    minWidth: 0,
                  }}
                >
                  <Scissors
                    size={18}
                    color="#d29d4f"
                    style={{
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />

                  <div>
                    <small style={labelStyle}>
                      {service.category}
                    </small>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "16px",
                        lineHeight: 1.35,
                      }}
                    >
                      {service.name}
                    </strong>
                  </div>
                </div>

                <StatusBadge
                  active={service.active}
                />
              </div>

              {service.subscriber_service && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#d29d4f",
                    border:
                      "1px solid rgba(210, 157, 79, 0.35)",
                    borderRadius: "999px",
                    padding: "5px 9px",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    marginBottom: "16px",
                  }}
                >
                  <BadgeCheck size={13} />
                  PLANO
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <small style={labelStyle}>
                    PREÇO
                  </small>

                  <strong
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      color: "#d29d4f",
                    }}
                  >
                    <DollarSign size={14} />
                    {formatPrice(
                      service.price
                    )}
                  </strong>
                </div>

                <div>
                  <small style={labelStyle}>
                    DURAÇÃO
                  </small>

                  <strong
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Clock3 size={14} />
                    {service.duration_minutes} min
                  </strong>
                </div>
              </div>

              <div>
                <small style={labelStyle}>
                  DESCRIÇÃO
                </small>

                <p
                  style={{
                    margin: 0,
                    color: service.description
                      ? "#999"
                      : "#666",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {service.description ?? "-"}
                </p>
              </div>

              <div
                style={{
                  marginTop: "18px",
                  paddingTop: "16px",
                  borderTop: "1px solid #222",
                }}
              >
                <Link
                  href={`/admin/servicos/${service.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    minHeight: "36px",
                    padding: "0 12px",
                    color: "#d29d4f",
                    background: "#17130d",
                    border:
                      "1px solid rgba(210, 157, 79, 0.3)",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  <Pencil size={14} />
                  EDITAR
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
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
    <div
      style={{
        background: "#0e0e0e",
        border: "1px solid #222",
        borderRadius: "8px",
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          color: "#d29d4f",
          marginBottom: "14px",
        }}
      >
        {icon}
      </div>

      <small
        style={{
          color: "#777",
          display: "block",
          marginBottom: "5px",
          fontSize: "11px",
        }}
      >
        {label}
      </small>

      <strong
        style={{
          fontSize: "23px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      style={{
        flexShrink: 0,
        borderRadius: "999px",
        padding: "5px 9px",
        fontSize: "10px",
        fontWeight: 700,
        color: active
          ? "#85c78d"
          : "#888",
        background: active
          ? "rgba(67, 160, 71, 0.12)"
          : "#181818",
        border: active
          ? "1px solid rgba(67, 160, 71, 0.25)"
          : "1px solid #292929",
      }}
    >
      {active ? "ATIVO" : "INATIVO"}
    </span>
  );
}

const labelStyle = {
  color: "#666",
  display: "block",
  marginBottom: "5px",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
} as const;

function formatPrice(
  value: number | string
) {
  return Number(value).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}
