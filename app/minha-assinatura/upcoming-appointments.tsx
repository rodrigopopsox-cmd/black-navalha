import {
  CalendarDays,
  Clock3,
  History,
  Scissors,
  UserRound,
} from "lucide-react";

import type { MyAppointment } from "@/lib/customer-auth/appointments";

import CancelAppointmentButton from "./cancel-appointment-button";
import RescheduleAppointment from "./reschedule-appointment";
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

function formatLongDate(value: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(value));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getRelativeLabel(value: string) {
  const now = new Date();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrowDate);

  const appointmentDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

  if (appointmentDate === today) {
    return "Hoje";
  }

  if (appointmentDate === tomorrow) {
    return "Amanhã";
  }

  return null;
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
  const firstAppointment = !isHistory ? appointments[0] : null;
  const otherAppointments = !isHistory ? appointments.slice(1) : appointments;

  return (
    <section
      className={
        isHistory
          ? `${styles.appointmentsPanel} ${styles.historyPanel}`
          : `${styles.appointmentsPanel} ${styles.upcomingPanel}`
      }
    >
      <div className={styles.sectionHeading}>
        <div className={styles.sectionHeadingIcon}>
          {isHistory ? (
            <History size={19} aria-hidden="true" />
          ) : (
            <CalendarDays size={19} aria-hidden="true" />
          )}
        </div>

        <div>
          <span className={styles.sectionEyebrow}>
            {isHistory ? "Seus atendimentos" : "Agenda"}
          </span>
          <h3>
            {isHistory ? "Histórico de atendimentos" : "Seu próximo horário"}
          </h3>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className={styles.appointmentsEmpty}>
          <CalendarDays size={20} aria-hidden="true" />
          <strong>
            {isHistory
              ? "Nenhum atendimento no histórico"
              : "Nenhum horário marcado"}
          </strong>
        </div>
      ) : null}

      {firstAppointment ? (
        <article className={styles.nextAppointmentCard}>
          <div className={styles.nextAppointmentTop}>
            <div>
              <span className={styles.nextAppointmentLabel}>
                {getRelativeLabel(firstAppointment.start_at) ??
                  "Próximo atendimento"}
              </span>

              <strong className={styles.nextAppointmentDate}>
                {formatLongDate(firstAppointment.start_at)}
              </strong>

              <div className={styles.nextAppointmentTime}>
                <Clock3 size={18} aria-hidden="true" />
                <strong>
                  {formatTime(firstAppointment.start_at)} às{" "}
                  {formatTime(firstAppointment.end_at)}
                </strong>
              </div>
            </div>

            <span className={styles.appointmentStatus}>
              {STATUS_LABELS[firstAppointment.status] ??
                firstAppointment.status}
            </span>
          </div>

          <div className={styles.nextAppointmentMeta}>
            <div>
              <UserRound size={16} aria-hidden="true" />
              <span>
                {firstAppointment.barber_name ??
                  "Profissional não informado"}
              </span>
            </div>

            <div>
              <Scissors size={16} aria-hidden="true" />
              <span>
                {firstAppointment.services
                  .map((service) => service.name)
                  .filter(Boolean)
                  .join(", ") || "Serviço não informado"}
              </span>
            </div>
          </div>

          <div className={styles.appointmentManagement}>
            <RescheduleAppointment
              appointmentId={firstAppointment.id}
              startAt={firstAppointment.start_at}
            />

            <CancelAppointmentButton
              appointmentId={firstAppointment.id}
              startAt={firstAppointment.start_at}
            />
          </div>
        </article>
      ) : null}

      {otherAppointments.length > 0 ? (
        <>
          {!isHistory ? (
            <div className={styles.otherAppointmentsTitle}>
              Outros horários agendados
            </div>
          ) : null}

          <div className={styles.appointmentsList}>
            {otherAppointments.map((appointment) => (
              <article
                key={appointment.id}
                className={styles.appointmentCard}
              >
                <div className={styles.appointmentCardTop}>
                  <div className={styles.appointmentDate}>
                    <CalendarDays size={17} aria-hidden="true" />
                    <div>
                      <span>Data</span>
                      <strong>{formatDate(appointment.start_at)}</strong>
                    </div>
                  </div>

                  <span className={styles.appointmentStatus}>
                    {STATUS_LABELS[appointment.status] ?? appointment.status}
                  </span>
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
                      {appointment.barber_name ??
                        "Profissional não informado"}
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

                {!isHistory &&
                (appointment.status === "scheduled" ||
                  appointment.status === "confirmed") ? (
                  <div className={styles.appointmentManagement}>
                    <RescheduleAppointment
                      appointmentId={appointment.id}
                      startAt={appointment.start_at}
                    />

                    <CancelAppointmentButton
                      appointmentId={appointment.id}
                      startAt={appointment.start_at}
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
