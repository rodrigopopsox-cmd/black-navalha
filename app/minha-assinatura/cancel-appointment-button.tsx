"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelMyAppointment } from "./appointment-actions";
import styles from "./page.module.css";

type CancelAppointmentButtonProps = {
  appointmentId: string;
  startAt: string;
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export default function CancelAppointmentButton({
  appointmentId,
  startAt,
}: CancelAppointmentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const millisecondsUntilStart =
    new Date(startAt).getTime() - Date.now();

  const canCancel = millisecondsUntilStart >= ONE_HOUR_MS;

  function handleCancel() {
    if (!canCancel || isPending) {
      return;
    }

    const confirmed = window.confirm(
      "Deseja cancelar este agendamento? Esta ação não faz uma remarcação."
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setIsError(false);

    startTransition(async () => {
      const result = await cancelMyAppointment(appointmentId);

      setMessage(result.message);
      setIsError(!result.ok);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className={styles.appointmentCancellation}>
      {canCancel ? (
        <>
          <p>
            Você pode cancelar este horário até 1 hora antes do atendimento.
          </p>
          <button
            type="button"
            className={styles.cancelAppointmentButton}
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? "Cancelando..." : "Cancelar agendamento"}
          </button>
        </>
      ) : (
        <p className={styles.cancellationUnavailable}>
          O prazo de cancelamento online encerrou. Cancelamentos pelo cliente
          exigem pelo menos 1 hora de antecedência.
        </p>
      )}

      {message ? (
        <p className={isError ? styles.error : styles.success}>{message}</p>
      ) : null}
    </div>
  );
}
