import Link from "next/link";

import {
  CalendarDays,
  FileText,
  Mail,
  Pencil,
  Phone,
  Search,
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

type ClientesPageProps = {
  searchParams: Promise<{
    busca?: string | string[];
  }>;
};

export default async function ClientesPage({
  searchParams,
}: ClientesPageProps) {
  const params = await searchParams;
  const rawSearch = Array.isArray(params.busca)
    ? params.busca[0]
    : params.busca;

  const search = rawSearch?.trim() ?? "";

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
    console.error("Erro ao carregar clientes:", error);
  }

  const customers = (data ?? []) as Customer[];
  const normalizedSearch = normalizeSearch(search);

  const filteredCustomers = normalizedSearch
    ? customers.filter((customer) => {
        const name = normalizeSearch(customer.name);
        const phone = normalizeSearch(customer.phone);
        const email = normalizeSearch(customer.email ?? "");

        return (
          name.includes(normalizedSearch) ||
          phone.includes(normalizedSearch) ||
          email.includes(normalizedSearch)
        );
      })
    : customers;

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
            Consulte os clientes cadastrados na barbearia.
          </p>
        </div>

        <Link
          href="/admin/clientes/novo"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "42px",
            padding: "0 16px",
            color: "#111",
            background: "#d29d4f",
            border: "1px solid #d29d4f",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          NOVO CLIENTE
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
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

      <form
        action="/admin/clientes"
        method="get"
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            flex: "1 1 300px",
            minHeight: "42px",
            padding: "0 13px",
            background: "#0e0e0e",
            border: "1px solid #333",
            borderRadius: "6px",
          }}
        >
          <Search
            size={17}
            color="#777"
            style={{
              flexShrink: 0,
            }}
          />

          <input
            type="search"
            name="busca"
            defaultValue={search}
            placeholder="Buscar por nome, WhatsApp ou e-mail"
            aria-label="Buscar clientes"
            style={{
              width: "100%",
              minWidth: 0,
              padding: "10px 0",
              color: "#eee",
              background: "transparent",
              border: 0,
              outline: "none",
              font: "inherit",
              fontSize: "13px",
            }}
          />
        </div>

        <button
          type="submit"
          style={buttonStyle}
        >
          Buscar
        </button>

        {search && (
          <a
            href="/admin/clientes"
            style={{
              ...buttonStyle,
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              color: "#bbb",
              background: "#0e0e0e",
              borderColor: "#333",
            }}
          >
            Limpar
          </a>
        )}
      </form>

      {search && (
        <div
          style={{
            marginBottom: "14px",
            color: "#777",
            fontSize: "13px",
          }}
        >
          {filteredCustomers.length}{" "}
          {filteredCustomers.length === 1
            ? "resultado"
            : "resultados"}{" "}
          para{" "}
          <strong
            style={{
              color: "#bbb",
            }}
          >
            “{search}”
          </strong>
        </div>
      )}

      {customers.length === 0 ? (
        <div
          className="admin-empty"
          style={emptyStyle}
        >
          <Users size={32} />

          <strong>
            Nenhum cliente cadastrado
          </strong>

          <span>
            Os clientes aparecerão aqui.
          </span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div
          className="admin-empty"
          style={emptyStyle}
        >
          <Search size={32} />

          <strong>
            Nenhum cliente encontrado
          </strong>

          <span>
            Tente buscar por outro nome, WhatsApp ou e-mail.
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
          {filteredCustomers.map((customer) => (
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
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    minWidth: 0,
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
                    <small style={labelStyle}>
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

                <Link
                  href={`/admin/clientes/${customer.id}`}
                  aria-label={`Editar ${customer.name}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                    minHeight: "32px",
                    padding: "0 10px",
                    color: "#d29d4f",
                    border: "1px solid #3a3020",
                    borderRadius: "5px",
                    textDecoration: "none",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  <Pencil size={13} />
                  EDITAR
                </Link>
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
                  value={formatPhone(customer.phone)}
                />

                <InfoLine
                  icon={<Mail size={14} />}
                  label="E-MAIL"
                  value={customer.email ?? "-"}
                  muted={!customer.email}
                />

                <InfoLine
                  icon={<CalendarDays size={14} />}
                  label="CADASTRO"
                  value={formatDate(customer.created_at)}
                />

                <div>
                  <small style={labelStyle}>
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

const buttonStyle = {
  minHeight: "42px",
  padding: "0 16px",
  color: "#111",
  background: "#d29d4f",
  border: "1px solid #d29d4f",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const emptyStyle = {
  minHeight: "360px",
  border: "1px solid #222",
  borderRadius: "8px",
  background: "#0e0e0e",
} as const;

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\D/g, (character) =>
      character === " " ? " " : character
    )
    .trim();
}

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
