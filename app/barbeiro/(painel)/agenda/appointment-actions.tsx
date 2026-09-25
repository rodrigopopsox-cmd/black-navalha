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
  rescheduleMyBarberAppointment,
  updateMyBarberAppointmentStatus,
  type BarberAppointmentStatus,
} from "./actions";

type Props = {
  appointmentId: string;
  currentStatus: string;
  startAt: string;
};

type ActionConfig = {
  status: BarberAppointmentStatus;
  label: string;
  icon: "confirm" | "complete" | "no-show" | "cancel";
  tone: "primary" | "neutral" | "danger";
};

const ACTIONS: ActionConfig[] = [
  {
    status: "confirmed",
    label: "Confirmar",
    icon: "confirm",
    tone: "primary",
  },
  {
    status: "completed",
    label: "Concluir",
    icon: "complete",
    tone: "primary",
  },
  {
    status: "no_show",
    label: "Não compareceu",
    icon: "no-show",
    tone: "neutral",
  },
  {
    status: "cancelled",
    label: "Cancelar",
    icon: "cancel",
    tone: "danger",
  },
];

function allowedAction(current: string, next: BarberAppointmentStatus) {
  if (current === "scheduled") {
    return ["confirmed", "completed", "cancelled", "no_show"].includes(next);
  }

  if (current === "confirmed") {
    return ["completed", "cancelled", "no_show"].includes(next);
  }

  return false;
}

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

function ActionIcon({ type }: { type: ActionConfig["icon"] }) {
  if (type === "complete") {
    return <CheckCheck size={14} />;
  }

  if (type === "no-show") {
    return <UserX size={14} />;
  }

  if (type === "cancel") {
    return <X size={14} />;
  }

  return <Check size={14} />;
}

export default function BarberAppointmentActions({
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

  const terminal = ["completed", "cancelled", "no_show"].includes(
    currentStatus
  );

  function clearFeedback() {
    setMessage("");
    setIsError(false);
  }

  function runStatus(action: ActionConfig) {
    if (isPending) {
      return;
    }

    if (
      (action.status === "cancelled" || action.status === "no_show") &&
      !window.confirm(
        action.status === "cancelled"
          ? "Cancelar este atendimento? Ele permanecerá no histórico e não contará no faturamento."
          : "Marcar que o cliente não compareceu?"
      )
    ) {
      return;
    }

    clearFeedback();

    startTransition(async () => {
      const result = await updateMyBarberAppointmentStatus(
        appointmentId,
        action.status
      );

      setMessage(result.message);
      setIsError(!result.ok);

      if (result.ok) {
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
      const result = await rescheduleMyBarberAppointment(
        appointmentId,
        `${date}T${time}:00-03:00`
      );

      setMessage(result.message);
      setIsError(!result.ok);

      if (result.ok) {
        setShowReschedule(false);
        router.refresh();
      }
    });
  }

  if (terminal) {
    return (
      <div className="barber-appointment-actions is-finished">
        Atendimento encerrado
      </div>
    );
  }

  return (
    <div className="barber-appointment-actions">
      <div className="barber-appointment-action-buttons">
        {ACTIONS.filter((action) =>
          allowedAction(currentStatus, action.status)
        ).map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={isPending}
            className={`is-${action.tone}`}
            onClick={() => runStatus(action)}
          >
            <ActionIcon type={action.icon} />
            <span>{action.label}</span>
          </button>
        ))}

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
          <span>{showReschedule ? "Fechar" : "Remarcar"}</span>
        </button>
      </div>

      {showReschedule ? (
        <div className="barber-reschedule-inline">
          <div className="barber-reschedule-fields">
            <label>
              <span>NOVA DATA</span>
              <input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  clearFeedback();
                }}
                disabled={isPending}
              />
            </label>

            <label>
              <span>NOVO HORÁRIO</span>
              <input
                type="time"
                step="900"
                value={time}
                onChange={(event) => {
                  setTime(event.target.value);
                  clearFeedback();
                }}
                disabled={isPending}
              />
            </label>
          </div>

          <div className="barber-reschedule-footer">
            <small>
              Jornada, bloqueios e conflitos são validados antes da alteração.
            </small>

            <button
              type="button"
              onClick={runReschedule}
              disabled={isPending || !date || !time}
            >
              {isPending ? "SALVANDO..." : "CONFIRMAR"}
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <span className={isError ? "is-error" : "is-success"}>
          {message}
        </span>
      ) : null}
    </div>
  );
}