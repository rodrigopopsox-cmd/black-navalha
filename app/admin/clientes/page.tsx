import {
  CalendarDays,
  FileText,
  Mail,
  Phone,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      phone,
      email,
      notes,
      created_at
    `)
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Erro ao carregar clientes:",
      error
    );
  }

  const customers = (data ?? []) as Customer[];

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Clientes
          </h1>

          <p className="admin-subtitle">
            Consulte os clientes cadastrados na
            barbearia.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "18px",
          padding: "18px 20px",
          background: "#0e0e0e",
          border: "1px solid #222",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Users
            size={20}
            color="#d29d4f"
          />

          <strong>
            Clientes cadastrados
          </strong>
        </div>

        <span
          style={{
            color: "#777",
            fontSize: "13px",
          }}
        >
          {customers.length}{" "}
          {customers.length === 1
            ? "cliente"
            : "clientes"}
        </span>
      </div>

      {customers.length === 0 ? (
        <div
          className="admin-empty"
          style={{
            minHeight: "360px",
            border: "1px solid #222",
            borderRadius: "8px",
            background: "#0e0e0e",
          }}
        >
          <Users size={32} />

          <strong>
            Nenhum cliente cadastrado
          </strong>

          <span>
            Os clientes aparecerão aqui.
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "14px",
          }}
        >
          {customers.map((customer) => (
            <article
              key={customer.id}
              style={{
                background: "#0e0e0e",
                border: "1px solid #222",
                borderRadius: "8px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                <Users
                  size={18}
                  color="#d29d4f"
                  style={{
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                />

                <div>
                  <small
                    style={labelStyle}
                  >
                    CLIENTE
                  </small>

                  <strong
                    style={{
                      display: "block",
                      fontSize: "16px",
                      lineHeight: 1.35,
                    }}
                  >
                    {customer.name}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <InfoLine
                  icon={<Phone size={14} />}
                  label="WHATSAPP"
                  value={formatPhone(
                    customer.phone
                  )}
                />

                <InfoLine
                  icon={<Mail size={14} />}
                  label="E-MAIL"
                  value={customer.email ?? "-"}
                  muted={!customer.email}
                />

                <InfoLine
                  icon={
                    <CalendarDays size={14} />
                  }
                  label="CADASTRO"
                  value={formatDate(
                    customer.created_at
                  )}
                />

                <div>
                  <small
                    style={labelStyle}
                  >
                    OBSERVAÇÕES
                  </small>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      color: customer.notes
                        ? "#bbb"
                        : "#666",
                      fontSize: "13px",
                      lineHeight: 1.45,
                    }}
                  >
                    <FileText
                      size={14}
                      style={{
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />

                    <span>
                      {customer.notes ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function InfoLine({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <small style={labelStyle}>
        {label}
      </small>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: muted ? "#666" : "#bbb",
          fontSize: "13px",
          overflowWrap: "anywhere",
        }}
      >
        {icon}

        <span>{value}</span>
      </div>
    </div>
  );
}

const labelStyle = {
  color: "#666",
  display: "block",
  marginBottom: "5px",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(new Date(value));
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  const local =
    digits.length === 13 &&
    digits.startsWith("55")
      ? digits.slice(2)
      : digits;

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(
      2,
      7
    )}-${local.slice(7)}`;
  }

  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(
      2,
      6
    )}-${local.slice(6)}`;
  }

  return value;
}