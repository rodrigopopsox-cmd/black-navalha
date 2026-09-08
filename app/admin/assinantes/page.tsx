import Link from "next/link";

import {
  BadgeCheck,
  Plus,
  Search,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type AssinantesPageProps = {
  searchParams: Promise<{
    busca?: string | string[];
    status?: string | string[];
  }>;
};

const statusOptions = [
  {
    value: "active",
    label: "Ativo",
  },
  {
    value: "paused",
    label: "Pausado",
  },
  {
    value: "cancelled",
    label: "Cancelado",
  },
  {
    value: "expired",
    label: "Expirado",
  },
] as const;

export default async function AssinantesPage({
  searchParams,
}: AssinantesPageProps) {
  const params = await searchParams;

  const rawSearch = Array.isArray(params.busca)
    ? params.busca[0]
    : params.busca;

  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;

  const search = rawSearch?.trim() ?? "";

  const status = statusOptions.some(
    (option) => option.value === rawStatus
  )
    ? rawStatus ?? ""
    : "";

  const supabase = await createClient();

  const {
    data: subscriptions,
    error,
  } = await supabase
    .from("subscriptions")
    .select(`
      id,
      name,
      status,
      starts_at,
      expires_at,
      customers (
        id,
        name,
        phone
      ),
      subscription_services (
        services (
          id,
          name
        )
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  const allSubscriptions = subscriptions ?? [];
  const normalizedSearch = normalizeSearch(search);

  const filteredSubscriptions =
    allSubscriptions.filter((subscription) => {
      const customer = getRelation(
        subscription.customers
      );

      const matchesSearch =
        !normalizedSearch ||
        normalizeSearch(
          customer?.name ?? ""
        ).includes(normalizedSearch) ||
        normalizeSearch(
          customer?.phone ?? ""
        ).includes(normalizedSearch);

      const matchesStatus =
        !status ||
        subscription.status === status;

      return matchesSearch && matchesStatus;
    });

  const hasFilters = Boolean(search || status);

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            PLANOS
          </div>

          <h1 className="admin-title">
            Assinantes
          </h1>

          <p className="admin-subtitle">
            Gerencie clientes e serviços incluídos nos planos.
          </p>
        </div>

        <Link
          href="/admin/assinantes/novo"
          className="admin-button"
        >
          <Plus size={17} />
          NOVA ASSINATURA
        </Link>
      </div>

      {error && (
        <div className="admin-error">
          Não foi possível carregar os assinantes:{" "}
          {error.message}
        </div>
      )}

      {!error && allSubscriptions.length > 0 && (
        <>
          <form
            action="/admin/assinantes"
            method="get"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "12px",
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
                placeholder="Buscar por nome ou WhatsApp"
                aria-label="Buscar assinantes"
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

            <select
              name="status"
              defaultValue={status}
              aria-label="Filtrar por status"
              style={{
                minHeight: "42px",
                padding: "0 36px 0 12px",
                color: "#bbb",
                background: "#0e0e0e",
                border: "1px solid #333",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            >
              <option value="">
                Todos os status
              </option>

              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              style={buttonStyle}
            >
              Filtrar
            </button>

            {hasFilters && (
              <Link
                href="/admin/assinantes"
                style={{
                  ...buttonStyle,
                  display: "inline-flex",
                  alignItems: "center",
                  color: "#bbb",
                  background: "#0e0e0e",
                  borderColor: "#333",
                  textDecoration: "none",
                }}
              >
                Limpar
              </Link>
            )}
          </form>

          <div
            style={{
              marginBottom: "18px",
              color: "#777",
              fontSize: "13px",
            }}
          >
            {hasFilters
              ? `${filteredSubscriptions.length} ${
                  filteredSubscriptions.length === 1
                    ? "resultado"
                    : "resultados"
                }`
              : `${allSubscriptions.length} ${
                  allSubscriptions.length === 1
                    ? "assinatura"
                    : "assinaturas"
                }`}
          </div>
        </>
      )}

      {!error &&
        allSubscriptions.length === 0 && (
          <div className="admin-empty">
            <BadgeCheck size={34} />

            <strong>
              Nenhum assinante cadastrado
            </strong>

            <span>
              Cadastre a primeira assinatura da Black Navalha.
            </span>

            <Link
              href="/admin/assinantes/novo"
              className="admin-button"
              style={{
                marginTop: 25,
              }}
            >
              <Plus size={16} />
              CADASTRAR ASSINANTE
            </Link>
          </div>
        )}

      {!error &&
        allSubscriptions.length > 0 &&
        filteredSubscriptions.length === 0 && (
          <div className="admin-empty">
            <Search size={34} />

            <strong>
              Nenhum assinante encontrado
            </strong>

            <span>
              Tente outro nome, WhatsApp ou status.
            </span>

            <Link
              href="/admin/assinantes"
              className="admin-button-secondary"
              style={{
                marginTop: 25,
              }}
            >
              LIMPAR FILTROS
            </Link>
          </div>
        )}

      {filteredSubscriptions.length > 0 && (
        <div className="subscriptions-grid">
          {filteredSubscriptions.map(
            (subscription) => {
              const customer = getRelation(
                subscription.customers
              );

              const serviceNames =
                (
                  subscription.subscription_services ??
                  []
                )
                  .map(
                    (link: any) =>
                      getRelation(
                        link.services
                      )?.name
                  )
                  .filter(Boolean);

              return (
                <article
                  className="subscription-card"
                  key={subscription.id}
                >
                  <div className="subscription-card-top">
                    <div className="subscription-icon">
                      <BadgeCheck size={24} />
                    </div>

                    <div>
                      <h2>
                        {customer?.name ??
                          "Cliente"}
                      </h2>

                      <span>
                        {customer?.phone ?? ""}
                      </span>
                    </div>

                    <Status
                      status={
                        subscription.status
                      }
                    />
                  </div>

                  <div className="subscription-plan">
                    <small>
                      PLANO
                    </small>

                    <strong>
                      {subscription.name}
                    </strong>
                  </div>

                  <div className="subscription-period">
                    <span>
                      Início

                      <strong>
                        {formatDate(
                          subscription.starts_at
                        )}
                      </strong>
                    </span>

                    <span>
                      Validade

                      <strong>
                        {subscription.expires_at
                          ? formatDate(
                              subscription.expires_at
                            )
                          : "Sem vencimento"}
                      </strong>
                    </span>
                  </div>

                  <div className="subscription-services">
                    <small>
                      SERVIÇOS INCLUÍDOS
                    </small>

                    {serviceNames.length > 0 ? (
                      <div>
                        {serviceNames.map(
                          (serviceName) => (
                            <span
                              key={
                                serviceName
                              }
                            >
                              ✓ {serviceName}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p>
                        Nenhum serviço configurado.
                      </p>
                    )}
                  </div>

                  <div className="subscription-actions">
                    <Link
                      href={`/admin/assinantes/${subscription.id}`}
                    >
                      EDITAR ASSINATURA
                    </Link>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </main>
  );
}

function Status({
  status,
}: {
  status: string;
}) {
  const labels: Record<string, string> = {
    active: "ATIVO",
    paused: "PAUSADO",
    cancelled: "CANCELADO",
    expired: "EXPIRADO",
  };

  return (
    <span
      className={`subscription-status subscription-${status}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(
      year,
      month - 1,
      day
    )
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

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

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
