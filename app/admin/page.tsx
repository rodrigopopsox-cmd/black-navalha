import {
  CalendarDays,
  Clock3,
  DollarSign,
  UserRound,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type TodayAppointment = {
  id: string;
  start_at: string;
  price: number | string;
  status: string;
  customers: {
    name: string;
    phone: string | null;
  }[];
  barbers: {
    name: string;
  }[];
  appointment_services: {
    service_name: string;
  }[];
};

const VALID_TODAY_STATUSES = [
  "scheduled",
  "confirmed",
  "completed",
];

export default async function AdminPage() {
  const supabase = await createClient();

  const { start, end } = getTodayRange();

  const [
    appointmentsResult,
    customersResult,
    barbersResult,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id,
        start_at,
        price,
        status,
        customers (
          name,
          phone
        ),
        barbers (
          name
        ),
        appointment_services (
          service_name
        )
      `)
      .gte("start_at", start.toISOString())
      .lt("start_at", end.toISOString())
      .order("start_at", {
        ascending: true,
      }),

    supabase
      .from("customers")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("barbers")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("active", true),
  ]);

  if (appointmentsResult.error) {
    console.error(
      "Erro ao carregar agenda:",
      appointmentsResult.error
    );
  }

  if (customersResult.error) {
    console.error(
      "Erro ao contar clientes:",
      customersResult.error
    );
  }

  if (barbersResult.error) {
    console.error(
      "Erro ao contar barbeiros:",
      barbersResult.error
    );
  }

  const appointments =
    (appointmentsResult.data ??
      []) as TodayAppointment[];

  const validTodayAppointments =
    appointments.filter((appointment) =>
      VALID_TODAY_STATUSES.includes(
        appointment.status
      )
    );

  const todayRevenue =
    validTodayAppointments.reduce(
      (total, appointment) =>
        total +
        Number(appointment.price),
      0
    );

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Visão Geral
          </h1>

          <p className="admin-subtitle">
            Acompanhe a operação da barbearia.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
        }}
      >
        <DashboardCard
          title="Agendamentos hoje"
          value={String(
            validTodayAppointments.length
          )}
          icon={<CalendarDays />}
        />

        <DashboardCard
          title="Faturamento hoje"
          value={formatPrice(
            todayRevenue
          )}
          icon={<DollarSign />}
        />

        <DashboardCard
          title="Clientes"
          value={String(
            customersResult.count ?? 0
          )}
          icon={<Users />}
        />

        <DashboardCard
          title="Barbeiros ativos"
          value={String(
            barbersResult.count ?? 0
          )}
          icon={<UserRound />}
        />
      </div>

      <div
        style={{
          marginTop: "35px",
          background: "#0e0e0e",
          border: "1px solid #222",
          borderRadius: "8px",
          padding: "25px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            marginBottom: "25px",
          }}
        >
          Agenda de hoje
        </h2>

        {validTodayAppointments.length ===
        0 ? (
          <div className="admin-empty">
            <CalendarDays
              size={30}
            />

            <strong>
              Nenhum agendamento hoje
            </strong>

            <span>
              Os próximos atendimentos
              aparecerão aqui.
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {validTodayAppointments.map(
              (appointment) => (
                <div
                  key={appointment.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "90px minmax(160px, 1fr) minmax(160px, 1fr) minmax(180px, 1.5fr) 110px",
                    gap: "18px",
                    alignItems: "center",
                    border: "1px solid #222",
                    borderRadius: "7px",
                    padding: "16px 18px",
                    background: "#111",
                  }}
                >
                  <div
                    style={{
                      color: "#d29d4f",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      fontWeight: 700,
                    }}
                  >
                    <Clock3 size={15} />

                    {formatTime(
                      appointment.start_at
                    )}
                  </div>

                  <div>
                    <small
                      style={{
                        color: "#666",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      CLIENTE
                    </small>

                    <strong>
                      {appointment.customers[0]?.name ??
                        "Cliente"}
                    </strong>
                  </div>

                  <div>
                    <small
                      style={{
                        color: "#666",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      PROFISSIONAL
                    </small>

                    <strong>
                      {appointment.barbers[0]?.name ??
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <small
                      style={{
                        color: "#666",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      SERVIÇOS
                    </small>

                    <strong>
                      {appointment
                        .appointment_services
                        .map(
                          (service) =>
                            service.service_name
                        )
                        .join(", ") ||
                        "-"}
                    </strong>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <small
                      style={{
                        color: "#666",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      VALOR
                    </small>

                    <strong
                      style={{
                        color: "#d29d4f",
                      }}
                    >
                      {formatPrice(
                        appointment.price
                      )}
                    </strong>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0e0e0e",
        border: "1px solid #222",
        borderRadius: "8px",
        padding: "22px",
      }}
    >
      <div
        style={{
          color: "#d29d4f",
          marginBottom: "22px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#777",
          fontSize: "11px",
          marginBottom: "7px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          color: "white",
          fontSize: "25px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function getTodayRange() {
  const now = new Date();

  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );

  const [
    year,
    month,
    day,
  ] = formatter
    .format(now)
    .split("-")
    .map(Number);

  const start = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      3,
      0,
      0
    )
  );

  const end = new Date(
    start.getTime() +
      24 * 60 * 60 * 1000
  );

  return {
    start,
    end,
  };
}

function formatTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(new Date(value));
}

function formatPrice(
  value: number | string
) {
  return Number(
    value
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}
