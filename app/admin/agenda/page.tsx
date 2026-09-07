import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  Scissors,
  UserRound,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type Appointment = {
  id: string;
  customer_id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  price: number | string;
  status: string;
  appointment_services: {
    service_name: string;
  }[];
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

type Barber = {
  id: string;
  name: string;
};

type AgendaPageProps = {
  searchParams: Promise<{
    data?: string | string[];
  }>;
};

const TIME_ZONE = "America/Sao_Paulo";

export default async function AgendaPage({
  searchParams,
}: AgendaPageProps) {
  const params = await searchParams;
  const requestedDate = Array.isArray(params.data)
    ? params.data[0]
    : params.data;

  const selectedDate = isValidDateParam(requestedDate)
    ? requestedDate
    : getTodayDateParam();

  const { start, end } = getDateRange(selectedDate);

  const supabase = await createClient();

  const appointmentsResult = await supabase
    .from("appointments")
    .select(`
      id,
      customer_id,
      barber_id,
      start_at,
      end_at,
      price,
      status,
      appointment_services (
        service_name
      )
    `)
    .gte("start_at", start.toISOString())
    .lt("start_at", end.toISOString())
    .order("start_at", {
      ascending: true,
    });

  if (appointmentsResult.error) {
    console.error(
      "Erro ao carregar agenda:",
      appointmentsResult.error
    );
  }

  const appointments =
    (appointmentsResult.data ?? []) as Appointment[];

  const customerIds = [
    ...new Set(
      appointments.map((appointment) => appointment.customer_id)
    ),
  ];

  const barberIds = [
    ...new Set(
      appointments.map((appointment) => appointment.barber_id)
    ),
  ];

  let customers: Customer[] = [];
  let barbers: Barber[] = [];

  if (customerIds.length > 0) {
    const customersResult = await supabase
      .from("customers")
      .select("id, name, phone")
      .in("id", customerIds);

    if (customersResult.error) {
      console.error(
        "Erro ao carregar clientes da agenda:",
        customersResult.error
      );
    } else {
      customers = (customersResult.data ?? []) as Customer[];
    }
  }

  if (barberIds.length > 0) {
    const barbersResult = await supabase
      .from("barbers")
      .select("id, name")
      .in("id", barberIds);

    if (barbersResult.error) {
      console.error(
        "Erro ao carregar profissionais da agenda:",
        barbersResult.error
      );
    } else {
      barbers = (barbersResult.data ?? []) as Barber[];
    }
  }

  const customersById = new Map(
    customers.map((customer) => [customer.id, customer])
  );

  const barbersById = new Map(
    barbers.map((barber) => [barber.id, barber])
  );

  const today = getTodayDateParam();
  const isToday = selectedDate === today;
  const previousDate = shiftDate(selectedDate, -1);
  const nextDate = shiftDate(selectedDate, 1);

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">BLACK NAVALHA</div>

          <h1 className="admin-title">Agenda</h1>

          <p className="admin-subtitle">
            Acompanhe os atendimentos por dia.
          </p>
        </div>
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
          <CalendarDays size={20} color="#d29d4f" />

          <strong>{formatSelectedDate(selectedDate)}</strong>
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "18px",
        }}
      >
        <Link
          href={`/admin/agenda?data=${previousDate}`}
          style={navigationButtonStyle}
        >
          <ChevronLeft size={16} />
          Dia anterior
        </Link>

        <Link
          href={`/admin/agenda?data=${today}`}
          style={{
            ...navigationButtonStyle,
            borderColor: isToday ? "#d29d4f" : "#333",
            color: isToday ? "#d29d4f" : "#ddd",
          }}
        >
          Hoje
        </Link>

        <Link
          href={`/admin/agenda?data=${nextDate}`}
          style={navigationButtonStyle}
        >
          Próximo dia
          <ChevronRight size={16} />
        </Link>
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
            {isToday
              ? "Nenhum agendamento hoje"
              : "Nenhum agendamento nesta data"}
          </strong>

          <span>
            Os atendimentos da data selecionada aparecerão aqui.
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
            const customer = customersById.get(
              appointment.customer_id
            );

            const barber = barbersById.get(
              appointment.barber_id
            );

            return (
              <div
                key={appointment.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(150px, 1fr))",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px",
                  background: "#0e0e0e",
                  border: "1px solid #222",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <small style={labelStyle}>HORÁRIO</small>

                  <strong
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      color: "#d29d4f",
                    }}
                  >
                    <Clock3 size={15} />

                    {formatTime(appointment.start_at)}
                    {" - "}
                    {formatTime(appointment.end_at)}
                  </strong>
                </div>

                <div>
                  <small style={labelStyle}>CLIENTE</small>

                  <strong
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <Users size={15} />
                    {customer?.name ?? "Cliente"}
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
                  <small style={labelStyle}>PROFISSIONAL</small>

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
                  <small style={labelStyle}>SERVIÇOS</small>

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
                      .map((service) => service.service_name)
                      .join(", ") || "-"}
                  </strong>
                </div>

                <div>
                  <small style={labelStyle}>VALOR</small>

                  <strong
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: "5px",
                      color: "#d29d4f",
                    }}
                  >
                    <DollarSign size={14} />

                    {formatPrice(appointment.price)}
                  </strong>

                  <div
                    style={{
                      color: "#777",
                      fontSize: "11px",
                      marginTop: "5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {appointment.status}
                  </div>
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

const navigationButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  minHeight: "38px",
  padding: "0 13px",
  color: "#ddd",
  background: "#0e0e0e",
  border: "1px solid #333",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 700,
  textDecoration: "none",
} as const;

function getTodayDateParam() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isValidDateParam(
  value: string | undefined
): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getDateRange(dateParam: string) {
  const [year, month, day] = dateParam.split("-").map(Number);

  const start = new Date(
    Date.UTC(year, month - 1, day, 3, 0, 0)
  );

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

function shiftDate(dateParam: string, amount: number) {
  const [year, month, day] = dateParam.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + amount);

  const shiftedYear = date.getUTCFullYear();
  const shiftedMonth = String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  );
  const shiftedDay = String(date.getUTCDate()).padStart(2, "0");

  return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`;
}

function formatSelectedDate(dateParam: string) {
  const [year, month, day] = dateParam.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatPrice(value: number | string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

