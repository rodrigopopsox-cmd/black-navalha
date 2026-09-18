import {
  CalendarDays,
  Clock3,
  History,
  Scissors,
  UserRound,
} from "lucide-react";

import type { MyAppointment } from "@/lib/customer-auth/appointments";

import CancelAppointmentButton from "./cancel-appointment-button";
import styles from "./page.module.css";

const TIME_ZONE = "America/Sao_Paulo";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

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

type AppointmentListProps = {
  appointments: MyAppointment[];
  variant?: "upcoming" | "history";
};

export default function UpcomingAppointments({
  appointments,
  variant = "upcoming",
}: AppointmentListProps) {
  const isHistory = variant === "history";

  return (
    <section className={styles.appointmentsPanel}>
      <div className={styles.servicesHeading}>
        {isHistory ? (
          <History size={20} aria-hidden="true" />
        ) : (
          <CalendarDays size={20} aria-hidden="true" />
        )}
        <h3>
          {isHistory ? "Histórico de atendimentos" : "Próximos agendamentos"}
        </h3>
      </div>

      {appointments.length === 0 ? (
        <div className={styles.appointmentsEmpty}>
          <p>
            {isHistory
              ? "Você ainda não possui atendimentos no histórico."
              : "Você não possui próximos horários agendados."}
          </p>
        </div>
      ) : (
        <div className={styles.appointmentsList}>
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className={styles.appointmentCard}
            >
              <div className={styles.appointmentDate}>
                <CalendarDays size={17} aria-hidden="true" />
                <div>
                  <span>Data</span>
                  <strong>{formatDate(appointment.start_at)}</strong>
                </div>
              </div>

              <div className={styles.appointmentDetails}>
                <div>
                  <Clock3 size={15} aria-hidden="true" />
                  <span>
                    {formatTime(appointment.start_at)} às{" "}
                    {formatTime(appointment.end_at)}
                  </span>
                </div>

                <div>
                  <UserRound size={15} aria-hidden="true" />
                  <span>
                    {appointment.barber_name ?? "Profissional não informado"}
                  </span>
                </div>

                <div>
                  <Scissors size={15} aria-hidden="true" />
                  <span>
                    {appointment.services
                      .map((service) => service.name)
                      .filter(Boolean)
                      .join(", ") || "Serviço não informado"}
                  </span>
                </div>
              </div>

              <span className={styles.appointmentStatus}>
                {STATUS_LABELS[appointment.status] ?? appointment.status}
              </span>

              {!isHistory &&
              (appointment.status === "scheduled" ||
                appointment.status === "confirmed") ? (
                <CancelAppointmentButton
                  appointmentId={appointment.id}
                  startAt={appointment.start_at}
                />
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
