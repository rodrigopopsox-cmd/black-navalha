"use client";

import { useState, useTransition } from "react";

import {
  type AppointmentStatus,
  updateAppointmentStatus,
} from "./actions";

type AppointmentStatusFormProps = {
  appointmentId: string;
  currentStatus: string;
};

const STATUS_OPTIONS: {
  value: AppointmentStatus;
  label: string;
}[] = [
  {
    value: "scheduled",
    label: "Agendado",
  },
  {
    value: "confirmed",
    label: "Confirmado",
  },
  {
    value: "completed",
    label: "Concluído",
  },
  {
    value: "cancelled",
    label: "Cancelado",
  },
  {
    value: "no_show",
    label: "Não compareceu",
  },
];

function isAppointmentStatus(
  value: string
): value is AppointmentStatus {
  return STATUS_OPTIONS.some(
    (option) => option.value === value
  );
}

export default function AppointmentStatusForm({
  appointmentId,
  currentStatus,
}: AppointmentStatusFormProps) {
  const initialStatus = isAppointmentStatus(currentStatus)
    ? currentStatus
    : "scheduled";

  const [status, setStatus] =
    useState<AppointmentStatus>(initialStatus);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasChanged = status !== currentStatus;

  function handleSave() {
    setMessage("");
    setIsSuccess(false);

    startTransition(async () => {
      const result = await updateAppointmentStatus(
        appointmentId,
        status
      );

      setMessage(result.message);
      setIsSuccess(result.success);
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "8px",
        marginTop: "14px",
      }}
    >
      <small
        style={{
          color: "#666",
          fontSize: "10px",
        }}
      >
        STATUS
      </small>

      <select
        value={status}
        disabled={isPending}
        onChange={(event) => {
          const value = event.target.value;

          if (isAppointmentStatus(value)) {
            setStatus(value);
            setMessage("");
            setIsSuccess(false);
          }
        }}
        style={{
          width: "100%",
          minHeight: "38px",
          padding: "0 10px",
          color: "#ddd",
          background: "#090909",
          border: "1px solid #333",
          borderRadius: "6px",
          fontSize: "12px",
        }}
      >
        {STATUS_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={isPending || !hasChanged}
        onClick={handleSave}
        style={{
          minHeight: "36px",
          padding: "0 12px",
          color:
            isPending || !hasChanged
              ? "#777"
              : "#111",
          background:
            isPending || !hasChanged
              ? "#1a1a1a"
              : "#d29d4f",
          border: "1px solid #333",
          borderRadius: "6px",
          cursor:
            isPending || !hasChanged
              ? "not-allowed"
              : "pointer",
          fontSize: "11px",
          fontWeight: 800,
        }}
      >
        {isPending ? "SALVANDO..." : "SALVAR STATUS"}
      </button>

      {message && (
        <span
          style={{
            color: isSuccess ? "#70c987" : "#e06c75",
            fontSize: "11px",
            lineHeight: 1.4,
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
