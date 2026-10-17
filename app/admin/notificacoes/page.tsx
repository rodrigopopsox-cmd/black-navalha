import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  getNotificationOperationalSnapshot,
} from "@/lib/notifications/observability";

import {
  getNotificationReconciliationAdminItems,
} from "@/lib/notifications/reconciliation-admin-read";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    redirect("/login");
  }

  const snapshot = await getNotificationOperationalSnapshot();
  const reconciliationItems =
    await getNotificationReconciliationAdminItems(20);

  const indicators = [
    {
      label: "Pendentes",
      value: snapshot.statuses.pending,
    },
    {
      label: "Processando",
      value: snapshot.statuses.processing,
    },
    {
      label: "Retry",
      value: snapshot.statuses.retry,
    },
    {
      label: "Enviadas",
      value: snapshot.statuses.sent,
    },
    {
      label: "Falhas",
      value: snapshot.statuses.failed,
    },
    {
      label: "Canceladas",
      value: snapshot.statuses.cancelled,
    },
    {
      label: "Requerem reconciliação",
      value: snapshot.statuses.reconciliationRequired,
    },
    {
      label: "Processamentos potencialmente vencidos",
      value: snapshot.overdueProcessing,
    },
    {
      label: "Retries futuros",
      value: snapshot.futureRetries,
    },
  ];

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Notificações
          </h1>

          <p className="admin-subtitle">
            Acompanhamento operacional somente leitura.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        {indicators.map((indicator) => (
          <section
            key={indicator.label}
            style={{
              background: "#0e0e0e",
              border: "1px solid #222",
              borderRadius: 8,
              padding: 22,
            }}
          >
            <div
              style={{
                color: "#999",
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              {indicator.label}
            </div>

            <strong
              style={{
                color: "#d29d4f",
                fontSize: 28,
              }}
            >
              {indicator.value}
            </strong>
          </section>
        ))}
      </div>

      <section
        aria-labelledby="reconciliation-items-title"
        style={{
          marginTop: 24,
          background: "#0e0e0e",
          border: "1px solid #222",
          borderRadius: 8,
          padding: 22,
        }}
      >
        <h2
          id="reconciliation-items-title"
          style={{
            fontSize: 17,
            marginBottom: 12,
          }}
        >
          Reconciliações pendentes
        </h2>

        <p
          style={{
            color: "#aaa",
            lineHeight: 1.7,
            marginBottom: 16,
          }}
        >
          Até 20 entregas com resultado externo desconhecido,
          ordenadas da mais antiga para a mais recente.
          Consulta somente leitura, sem autorização para reenvio
          ou alteração de status.
        </p>

        {reconciliationItems.length === 0 ? (
          <p style={{ color: "#999" }}>
            Nenhuma reconciliação pendente encontrada nesta consulta.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 850,
                textAlign: "left",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Entrega",
                    "Evento",
                    "Canal",
                    "Fornecedor",
                    "Status",
                    "Tentativas",
                    "Última tentativa",
                    "Criada em",
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #333",
                        color: "#d29d4f",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {reconciliationItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: 12, borderBottom: "1px solid #222" }}>
                      <code>{item.id}</code>
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #222" }}>
                      <code>{item.eventId}</code>
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #222" }}>
                      {item.channel}
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #222" }}>
                      {item.provider ?? "—"}
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #222" }}>
                      {item.status}
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #222" }}>
                      {item.attemptCount} / {item.maxAttempts}
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #222" }}>
                      {item.lastAttemptAt
                        ? new Date(item.lastAttemptAt).toLocaleString(
                            "pt-BR",
                            { timeZone: "America/Sao_Paulo" },
                          )
                        : "—"}
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #222" }}>
                      {new Date(item.createdAt).toLocaleString(
                        "pt-BR",
                        { timeZone: "America/Sao_Paulo" },
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p
          style={{
            color: "#777",
            fontSize: 12,
            marginTop: 16,
            lineHeight: 1.6,
          }}
        >
          A listagem e os indicadores são consultas independentes.
          Não representam um snapshot transacional. Qualquer decisão
          operacional futura exige revalidação no PostgreSQL e
          evidência externa autenticada.
        </p>
      </section>

      <section
        style={{
          marginTop: 24,
          background: "#0e0e0e",
          border: "1px solid #222",
          borderRadius: 8,
          padding: 22,
        }}
      >
        <h2
          style={{
            fontSize: 17,
            marginBottom: 12,
          }}
        >
          Reconciliação
        </h2>

        <p
          style={{
            color: "#aaa",
            lineHeight: 1.7,
          }}
        >
          Entregas com resultado externo desconhecido
          permanecem bloqueadas para reenvio automático.
          Esta página não executa reconciliação,
          envio ou alteração de status.
        </p>

        <p
          style={{
            color: "#777",
            fontSize: 12,
            marginTop: 12,
          }}
        >
          Indicadores obtidos por consultas independentes.
          Não representam um snapshot transacional único.
        </p>

        <p
          style={{
            color: "#777",
            fontSize: 12,
            marginTop: 8,
          }}
        >
          Referência da coleta:{" "}
          {new Date(snapshot.capturedAt).toLocaleString(
            "pt-BR",
            {
              timeZone: "America/Sao_Paulo",
            },
          )}
        </p>
      </section>
    </main>
  );
}