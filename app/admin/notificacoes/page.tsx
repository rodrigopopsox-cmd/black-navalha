import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  getNotificationOperationalSnapshot,
} from "@/lib/notifications/observability";

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