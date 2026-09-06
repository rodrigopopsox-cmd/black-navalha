import {
  Ban,
  CalendarDays,
  Clock3,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import BlockForm from "./block-form";
import DeleteBlockButton from "./delete-block-button";

type BlockedTime = {
  id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
};

export default async function BloqueiosPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blocked_times")
    .select(`
      id,
      barber_id,
      start_at,
      end_at,
      reason
    `)
    .order("start_at", {
      ascending: true,
    });

  const { data: barbers, error: barbersError } =
    await supabase
      .from("barbers")
      .select("id, name")
      .eq("active", true)
      .order("name");

  const blockedTimes = (data ?? []) as BlockedTime[];
  const activeBarbers = barbers ?? [];

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            AGENDA
          </div>

          <h1 className="admin-title">
            Bloqueios
          </h1>

          <p className="admin-subtitle">
            Visualize e gerencie os períodos indisponíveis dos profissionais.
          </p>
        </div>
      </div>

      {barbersError && (
        <div className="admin-error">
          Não foi possível carregar os profissionais:{" "}
          {barbersError.message}
        </div>
      )}

      {!barbersError && (
        <BlockForm barbers={activeBarbers} />
      )}

      {error && (
        <div className="admin-error">
          Não foi possível carregar os bloqueios:{" "}
          {error.message}
        </div>
      )}

      {!error && blockedTimes.length === 0 && (
        <div className="admin-empty">
          <Ban size={34} />

          <strong>
            Nenhum bloqueio cadastrado
          </strong>

          <span>
            Os períodos bloqueados da agenda aparecerão aqui.
          </span>
        </div>
      )}

      {!error && blockedTimes.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {blockedTimes.map((blockedTime) => {
            const barber = activeBarbers.find(
              (item) => item.id === blockedTime.barber_id
            );

            return (
              <article
                key={blockedTime.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(180px, 1fr) minmax(180px, 1fr) minmax(220px, 2fr) auto",
                  gap: "20px",
                  padding: "20px",
                  background: "#0e0e0e",
                  border: "1px solid #222",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <small style={labelStyle}>
                    PROFISSIONAL
                  </small>

                  <strong
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <UserRound size={15} />
                    {barber?.name ?? "Profissional indisponível"}
                  </strong>
                </div>

                <div>
                  <small style={labelStyle}>
                    PERÍODO
                  </small>

                  <strong
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "7px",
                      color: "#d29d4f",
                    }}
                  >
                    <CalendarDays
                      size={15}
                      style={{
                        marginTop: "2px",
                      }}
                    />

                    <span>
                      {formatDate(blockedTime.start_at)}

                      <br />

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          marginTop: "4px",
                          color: "#aaa",
                        }}
                      >
                        <Clock3 size={13} />

                        {formatTime(blockedTime.start_at)}
                        {" - "}
                        {formatTime(blockedTime.end_at)}
                      </span>
                    </span>
                  </strong>
                </div>

                <div>
                  <small style={labelStyle}>
                    MOTIVO
                  </small>

                  <strong>
                    {blockedTime.reason?.trim() ||
                      "Sem motivo informado"}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <DeleteBlockButton
                    blockedTimeId={blockedTime.id}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

const labelStyle = {
  color: "#666",
  display: "block",
  marginBottom: "6px",
  fontSize: "10px",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}