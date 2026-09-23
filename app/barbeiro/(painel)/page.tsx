import Link from "next/link";
import { CalendarDays, CheckCircle2, Users, WalletCards } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type DashboardRow = {
  reference_date: string;
  appointments_count: number;
  completed_count: number;
  subscribers_count: number;
  commission_amount: number | string;
};

type AppointmentRow = {
  appointment_id: string;
  start_at: string;
  end_at: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  service_names: string[];
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

export default async function BarberPage() {
  const supabase = await createClient();

  const [dashboardResult, appointmentsResult] = await Promise.all([
    supabase.rpc("get_my_barber_dashboard"),
    supabase.rpc("get_my_barber_appointments"),
  ]);

  if (dashboardResult.error) {
    console.error(
      "Erro ao carregar dashboard do barbeiro:",
      dashboardResult.error.message
    );
  }

  if (appointmentsResult.error) {
    console.error(
      "Erro ao carregar agenda do barbeiro:",
      appointmentsResult.error.message
    );
  }

  const dashboard = dashboardResult.data?.[0] as DashboardRow | undefined;
  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[];

  const operationalAppointments = appointments.filter((appointment) =>
    ["scheduled", "confirmed", "completed"].includes(appointment.status)
  );

  const cards = [
    {
      label: "Agendamentos hoje",
      value: dashboard?.appointments_count ?? 0,
      icon: CalendarDays,
    },
    {
      label: "Concluídos hoje",
      value: dashboard?.completed_count ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "Meus assinantes",
      value: dashboard?.subscribers_count ?? 0,
      icon: Users,
    },
    {
      label: "Comissão no mês",
      value: moneyFormatter.format(Number(dashboard?.commission_amount ?? 0)),
      icon: WalletCards,
    },
  ];

  return (
    <main className="barber-area-page">
      <div className="barber-page-heading">
        <div>
          <div className="barber-area-eyebrow">PAINEL DO BARBEIRO</div>
          <h1>Visão Geral</h1>
          <p>Seu dia de trabalho em um só lugar.</p>
        </div>

        <Link href="/barbeiro/agenda" className="barber-primary-link">
          VER MINHA AGENDA
        </Link>
      </div>

      <section className="barber-metrics-grid" aria-label="Resumo operacional">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="barber-metric-card" key={label}>
            <div className="barber-metric-icon">
              <Icon size={19} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="barber-agenda-section">
        <div className="barber-section-heading">
          <div>
            <span>HOJE</span>
            <h2>Agenda de hoje</h2>
          </div>

          <strong>
            {operationalAppointments.length}{" "}
            {operationalAppointments.length === 1
              ? "atendimento"
              : "atendimentos"}
          </strong>
        </div>

        {operationalAppointments.length === 0 ? (
          <div className="barber-empty-state">
            <CalendarDays size={26} />
            <strong>Nenhum atendimento na agenda de hoje.</strong>
            <span>Quando houver horários, eles aparecerão aqui.</span>
          </div>
        ) : (
          <div className="barber-appointments-list">
            {operationalAppointments.map((appointment) => (
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