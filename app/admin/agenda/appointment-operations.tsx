"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  CheckCheck,

  UserX,
  X,
} from "lucide-react";

import {
  rescheduleAdminAppointment,
  updateAppointmentStatus,
  type AppointmentStatus,
} from "./actions";

type Props = {
  appointmentId: string;
  currentStatus: string;
  startAt: string;
};


const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

function getSaoPauloParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}`,
  };
}

export default function AppointmentOperations({
  appointmentId,
  currentStatus,
  startAt,
}: Props) {
  const router = useRouter();
  const initial = getSaoPauloParts(startAt);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [showReschedule, setShowReschedule] = useState(false);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [isPending, startTransition] = useTransition();

  const canReschedule =
    currentStatus === "scheduled" || currentStatus === "confirmed";

  function clearFeedback() {
    setMessage("");
    setIsError(false);
  }

  function saveStatus(status: AppointmentStatus) {
    if (isPending || status === currentStatus) {
      return;
    }

    if (
      (status === "cancelled" || status === "no_show") &&
      !window.confirm(
        status === "cancelled"
          ? "Cancelar este atendimento? Ele deixará de contar no faturamento."
          : "Marcar que o cliente não compareceu?"
      )
    ) {
      return;
    }

    clearFeedback();

    startTransition(async () => {
      const result = await updateAppointmentStatus(
        appointmentId,
        status
      );

      setMessage(result.message);
      setIsError(!result.success);

      if (result.success) {

        setShowReschedule(false);
        router.refresh();
      }
    });
  }

  function runReschedule() {
    if (!date || !time || isPending) {
      return;
    }

    const displayDate = date.split("-").reverse().join("/");

    if (
      !window.confirm(
        `Remarcar para ${displayDate} às ${time}? O horário atual só será alterado se o novo estiver disponível.`
      )
    ) {
      return;
    }

    clearFeedback();

    startTransition(async () => {
      const result = await rescheduleAdminAppointment(
        appointmentId,
        `${date}T${time}:00-03:00`
      );

      setMessage(result.message);
      setIsError(!result.success);

      if (result.success) {
        setShowReschedule(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="admin-appointment-operations">
      <div className="admin-appointment-status-row">
        <span
          className={`barber-status barber-status-${currentStatus}`}
        >
          {STATUS_LABELS[currentStatus] ?? currentStatus}
        </span>

        <div className="admin-appointment-quick-actions">
          {currentStatus === "scheduled" ? (
            <button
              type="button"
              disabled={isPending}
              className="is-primary"
              onClick={() => saveStatus("confirmed")}
            >
              <Check size={14} />
              Confirmar
            </button>
          ) : null}

          {(currentStatus === "scheduled" ||
            currentStatus === "confirmed") ? (
            <>
              <button
                type="button"
                disabled={isPending}
                className="is-primary"
                onClick={() => saveStatus("completed")}
              >
                <CheckCheck size={14} />
                Concluir
              </button>

              <button
                type="button"
                disabled={isPending}
                className="is-neutral"
                onClick={() => saveStatus("no_show")}
              >
                <UserX size={14} />
                Não compareceu
              </button>

              <button
                type="button"
                disabled={isPending}
                className="is-danger"
                onClick={() => saveStatus("cancelled")}
              >
                <X size={14} />
                Cancelar
              </button>
            </>
          ) : null}

          {canReschedule ? (
            <button
              type="button"
              disabled={isPending}
              className="is-neutral"
              onClick={() => {
                setShowReschedule((value) => !value);

                clearFeedback();
              }}
            >
              <CalendarClock size={14} />
              {showReschedule ? "Fechar" : "Remarcar"}
            </button>
          ) : null}
        </div>
      </div>

      {showReschedule ? (
        <div className="admin-appointment-reschedule">
          <div>
            <label>
              <span>NOVA DATA</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                disabled={isPending}
              />
            </label>

            <label>
              <span>NOVO HORÁRIO</span>
              <input
                type="time"
                step="900"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                disabled={isPending}
              />
            </label>
          </div>

          <small>
            Jornada, bloqueios e conflitos são validados antes da alteração.
          </small>

          <button
            type="button"
            disabled={isPending || !date || !time}
            onClick={runReschedule}
          >
            {isPending ? "SALVANDO..." : "CONFIRMAR REMARCAÇÃO"}
          </button>
        </div>
      ) : null}

      {message ? (
        <span
          className={
            isError
              ? "admin-appointment-feedback is-error"
              : "admin-appointment-feedback is-success"
          }
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}