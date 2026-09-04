import {
  CalendarDays,
  Clock3,
  DollarSign,
  Scissors,
  UserRound,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type Appointment = {
  id: string;
  start_at: string;
  end_at: string;
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

export default async function AgendaPage() {
  const supabase = await createClient();

  const { start, end } = getTodayRange();

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      start_at,
      end_at,
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
    });

  if (error) {
    console.error(
      "Erro ao carregar agenda:",
      error
    );
  }

  const appointments =
    (data ?? []) as Appointment[];

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Agenda
          </h1>

          <p className="admin-subtitle">
            Acompanhe os atendimentos de hoje.
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
          <CalendarDays
            size={20}
            color="#d29d4f"
          />

          <strong>
            {formatToday()}
          </strong>
        </div>

        <span
          style={{
            color: "#777",
            fontSize: "13px",
          }}
        >
          {appointments.length}{" "}
          {appointments.length === 1
            ? "agendamento"
            : "agendamentos"}
        </span>
      </div>

      {appointments.length === 0 ? (
        <div
          className="admin-empty"
          style={{
            minHeight: "360px",
            border: "1px solid #222",
            borderRadius: "8px",
            background: "#0e0e0e",
          }}
        >
          <CalendarDays size={32} />

          <strong>
            Nenhum agendamento hoje
          </strong>

          <span>
            Os atendimentos do dia aparecerão
            aqui.
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {appointments.map(
            (appointment) => {
              const customer =
                appointment.customers[0];
              const barber =
                appointment.barbers[0];

              return (
                <div
                  key={appointment.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "120px minmax(170px, 1fr) minmax(170px, 1fr) minmax(200px, 1.5fr) 120px",
                    alignItems: "center",
                    gap: "20px",
                    padding: "20px",
                    background: "#0e0e0e",
                    border: "1px solid #222",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <small
                      style={labelStyle}
                    >
                      HORÁRIO
                    </small>

                    <strong
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        color: "#d29d4f",
                      }}
                    >
                      <Clock3 size={15} />

                      {formatTime(
                        appointment.start_at
                      )}
                      {" - "}
                      {formatTime(
                        appointment.end_at
                      )}
                    </strong>
                  </div>

                  <div>
                    <small
                      style={labelStyle}
                    >
                      CLIENTE
                    </small>

                    <strong
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <Users size={15} />
                      {customer?.name ??
                        "Cliente"}
                    </strong>

                    {customer?.phone && (
                      <div
                        style={{
                          color: "#777",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        {customer.phone}
                      </div>
                    )}
                  </div>

                  <div>
                    <small
                      style={labelStyle}
                    >
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
                      {barber?.name ?? "-"}
                    </strong>
                  </div>

                  <div>
                    <small
                      style={labelStyle}
                    >
                      SERVIÇOS
                    </small>

                    <strong
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "7px",
                      }}
                    >
                      <Scissors
                        size={15}
                        style={{
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      />

                      {appointment
                        .appointment_services
                        .map(
                          (service) =>
                            service.service_name
                        )
                        .join(", ") || "-"}
                    </strong>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <small
                      style={labelStyle}
                    >
                      VALOR
                    </small>

                    <strong
                      style={{
                        display: "flex",
                        justifyContent:
                          "flex-end",
                        alignItems: "center",
                        gap: "5px",
                        color: "#d29d4f",
                      }}
                    >
                      <DollarSign
                        size={14}
                      />

                      {formatPrice(
                        appointment.price
                      )}
                    </strong>

                    <div
                      style={{
                        color: "#777",
                        fontSize: "11px",
                        marginTop: "5px",
                        textTransform:
                          "uppercase",
                      }}
                    >
                      {appointment.status}
                    </div>
                  </div>
                </div>
              );
            }
          )}
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

  const [year, month, day] = formatter
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

  return { start, end };
}

function formatToday() {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(new Date());
}

function formatTime(value: string) {
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
  return Number(value).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}