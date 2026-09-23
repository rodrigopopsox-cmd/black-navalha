import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type AppointmentRow = {
  appointment_id: string;
  start_at: string;
  end_at: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  service_names: string[];
};

type SearchParams = Promise<{
  data?: string | string[];
}>;

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const candidate = new Date(`${raw}T00:00:00.000Z`);

    if (!Number.isNaN(candidate.getTime()) && formatDateKey(candidate) === raw) {
      return candidate;
    }
  }

  const saoPauloToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return new Date(`${saoPauloToday}T00:00:00.000Z`);
}

function shiftDate(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return formatDateKey(shifted);
}

function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

export default async function BarberAgendaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selectedDate = parseDate(params.data);
  const dateKey = formatDateKey(selectedDate);
  const today = parseDate();
  const todayKey = formatDateKey(today);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_barber_appointments", {
    p_date: dateKey,
  });

  if (error) {
    console.error("Erro ao carregar Minha Agenda:", error.message);
  }

  const appointments = (data ?? []) as AppointmentRow[];

  return (
    <main className="barber-area-page">
      <div className="barber-page-heading">
        <div>
          <div className="barber-area-eyebrow">ÁREA DO PROFISSIONAL</div>
          <h1>Minha Agenda</h1>
          <p>Somente os seus atendimentos aparecem nesta agenda.</p>
        </div>
      </div>

      <section className="barber-date-navigation">
        <div>
          <span>DATA SELECIONADA</span>
          <strong>{dateFormatter.format(selectedDate)}</strong>
        </div>

        <nav aria-label="Navegação por data">
          <Link
            href={`/barbeiro/agenda?data=${shiftDate(selectedDate, -1)}`}
            aria-label="Dia anterior"
          >
            <ChevronLeft size={17} />
            <span>Dia anterior</span>
          </Link>

          <Link
            href={
              dateKey === todayKey
                ? "/barbeiro/agenda"
                : `/barbeiro/agenda?data=${todayKey}`
            }
            className={dateKey === todayKey ? "is-current" : undefined}
          >
            Hoje
          </Link>

          <Link
            href={`/barbeiro/agenda?data=${shiftDate(selectedDate, 1)}`}
            aria-label="Próximo dia"
          >
            <span>Próximo dia</span>
            <ChevronRight size={17} />
          </Link>
        </nav>
      </section>

      <section className="barber-agenda-section">
        <div className="barber-section-heading">
          <div>
            <span>ATENDIMENTOS</span>
            <h2>{appointments.length} na data selecionada</h2>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="barber-empty-state">
            <CalendarDays size={26} />
            <strong>Nenhum agendamento nesta data.</strong>
            <span>Use os controles acima para consultar outro dia.</span>
          </div>
        ) : (
          <div className="barber-appointments-list">
            {appointments.map((appointment) => (
              <article
                className="barber-appointment-card"
                key={appointment.appointment_id}
              >
                <div className="barber-appointment-time">
                  <strong>{formatTime(appointment.start_at)}</strong>
                  <span>até {formatTime(appointment.end_at)}</span>
                </div>

                <div className="barber-appointment-main">
                  <strong>{appointment.customer_name}</strong>
                  <span>{appointment.customer_phone}</span>
                  <p>
                    {appointment.service_names.length > 0
                      ? appointment.service_names.join(" • ")
                      : "Serviço não informado"}
                  </p>
                </div>

                <span
                  className={`barber-status barber-status-${appointment.status}`}
                >
                  {STATUS_LABELS[appointment.status] ?? appointment.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}