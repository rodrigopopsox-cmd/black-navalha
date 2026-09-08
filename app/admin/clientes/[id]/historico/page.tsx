import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  DollarSign,
  Scissors,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type Appointment = {
  id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  price: number | string;
  status: string;
  appointment_services: {
    service_name: string;
  }[];
};

type Barber = {
  id: string;
  name: string;
};

const TIME_ZONE = "America/Sao_Paulo";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export default async function HistoricoClientePage({
  params,
}: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error: customerError } =
    await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("id", id)
      .single();

  if (customerError || !customer) {
    notFound();
  }

  const appointmentsResult = await supabase
    .from("appointments")
    .select(`
      id,
      barber_id,
      start_at,
      end_at,
      price,
      status,
      appointment_services (
        service_name
      )
    `)
    .eq("customer_id", customer.id)
    .order("start_at", {
      ascending: false,
    });

  if (appointmentsResult.error) {
    console.error(
      "Erro ao carregar histórico do cliente:",
      appointmentsResult.error
    );
  }

  const appointments =
    (appointmentsResult.data ?? []) as Appointment[];

  const barberIds = [
    ...new Set(
      appointments.map((appointment) => appointment.barber_id)
    ),
  ];

  let barbers: Barber[] = [];

  if (barberIds.length > 0) {
    const barbersResult = await supabase
      .from("barbers")
      .select("id, name")
      .in("id", barberIds);

    if (barbersResult.error) {
      console.error(
        "Erro ao carregar profissionais do histórico:",
        barbersResult.error
      );
    } else {
      barbers = (barbersResult.data ?? []) as Barber[];
    }
  }

  const barbersById = new Map(
    barbers.map((barber) => [barber.id, barber])
  );

  return (
    <main className="admin-page">
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <Link
          href={`/admin/clientes/${customer.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            color: "#777",
            textDecoration: "none",
            fontSize: "11px",
          }}
        >
          <ArrowLeft size={14} />
          VOLTAR PARA O CLIENTE
        </Link>
      </div>

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Histórico do cliente
          </h1>

          <p className="admin-subtitle">
            {customer.name}
            {customer.phone ? ` · ${customer.phone}` : ""}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
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
            gap: "9px",
          }}
        >
          <CalendarDays size={19} color="#d29d4f" />
          <strong>Atendimentos</strong>
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
            minHeight: "300px",
            border: "1px solid #222",
            borderRadius: "8px",
            background: "#0e0e0e",
          }}
        >
          <CalendarDays size={32} />

          <strong>Nenhum agendamento encontrado</strong>

          <span>
            Este cliente ainda não possui atendimentos registrados.
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {appointments.map((appointment) => {
            const barber = barbersById.get(
              appointment.barber_id
            );

            const dateParam = formatDateParam(
              appointment.start_at
            );

            return (
              <div
                key={appointment.id}
                style={{
                  padding: "20px",
                  background: "#0e0e0e",
                  border: "1px solid #222",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(150px, 1fr))",
                    alignItems: "start",
                    gap: "20px",
                  }}
                >
                  <div>
                    <small style={labelStyle}>DATA</small>

                    <strong
                      style={{
                        color: "#d29d4f",
                      }}
                    >
                      {formatDate(appointment.start_at)}
                    </strong>
                  </div>

                  <div>
                    <small style={labelStyle}>
                      HORÁRIO
                    </small>

                    <strong
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <Clock3 size={15} />
                      {formatTime(appointment.start_at)}
                      {" - "}
                      {formatTime(appointment.end_at)}
                    </strong>
                  </div>

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
                      {barber?.name ?? "-"}
                    </strong>
                  </div>

                  <div>
                    <small style={labelStyle}>
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

                      {appointment.appointment_services
                        .map(
                          (service) => service.service_name
                        )
                        .join(", ") || "-"}
                    </strong>
                  </div>

                  <div>
                    <small style={labelStyle}>VALOR</small>

                    <strong
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#d29d4f",
                      }}
                    >
                      <DollarSign size={14} />
                      {formatPrice(appointment.price)}
                    </strong>
                  </div>

                  <div>
                    <small style={labelStyle}>STATUS</small>

                    <strong>
                      {STATUS_LABELS[appointment.status] ??
                        appointment.status}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "18px",
                    paddingTop: "16px",
                    borderTop: "1px solid #222",
                  }}
                >
                  <Link
                    href={`/admin/agenda?data=${dateParam}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      minHeight: "36px",
                      padding: "0 13px",
                      color: "#ddd",
                      background: "#151515",
                      border: "1px solid #333",
                      borderRadius: "5px",
                      textDecoration: "none",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    <CalendarDays size={14} />
                    ABRIR NA AGENDA
                  </Link>
                </div>
              </div>
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
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDateParam(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatPrice(value: number | string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
