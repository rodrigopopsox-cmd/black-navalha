"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  getMyAppointmentRescheduleAvailability,
  rescheduleMyAppointment,
} from "./appointment-actions";
import styles from "./page.module.css";

type RescheduleAppointmentProps = {
  appointmentId: string;
  startAt: string;
};

const ONE_HOUR_MS = 60 * 60 * 1000;

function getSaoPauloToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function RescheduleAppointment({
  appointmentId,
  startAt,
}: RescheduleAppointmentProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const [isLoadingTimes, startLoadingTimes] = useTransition();
  const [isRescheduling, startRescheduling] = useTransition();

  const canReschedule =
    new Date(startAt).getTime() - Date.now() >= ONE_HOUR_MS;

  function resetSelection() {
    setDate("");
    setTimes([]);
    setSelectedTime("");
    setMessage(null);
    setIsError(false);
  }

  function toggleOpen() {
    if (!canReschedule || isLoadingTimes || isRescheduling) {
      return;
    }

    if (isOpen) {
      resetSelection();
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setMessage(null);
    setIsError(false);
  }

  function handleDateChange(value: string) {
    setDate(value);
    setTimes([]);
    setSelectedTime("");
    setMessage(null);
    setIsError(false);

    if (!value) {
      return;
    }

    startLoadingTimes(async () => {
      const result = await getMyAppointmentRescheduleAvailability(
        appointmentId,
        value
      );

      setTimes(result.times);
      setMessage(result.message || null);
      setIsError(!result.ok);
    });
  }

  function handleConfirm() {
    if (!date || !selectedTime || isRescheduling) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja remarcar este agendamento para ${date.split("-").reverse().join("/")} às ${selectedTime}? O horário atual só será alterado se o novo horário for confirmado com sucesso.`
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setIsError(false);

    startRescheduling(async () => {
      const newStartAt = `${date}T${selectedTime}:00-03:00`;
      const result = await rescheduleMyAppointment(
        appointmentId,
        newStartAt
      );

      setMessage(result.message);
      setIsError(!result.ok);

      if (result.ok) {
        setTimes([]);
        setSelectedTime("");
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  if (!canReschedule) {
    return (
      <div className={styles.appointmentReschedule}>
        <p className={styles.rescheduleUnavailable}>
          O prazo de remarcação online encerrou. Remarcações exigem pelo menos
          1 hora de antecedência.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.appointmentReschedule}>
      <button
        type="button"
        className={styles.rescheduleAppointmentButton}
        onClick={toggleOpen}
        disabled={isLoadingTimes || isRescheduling}
      >
        {isOpen ? "Fechar remarcação" : "Remarcar agendamento"}
      </button>

      {isOpen ? (
        <div className={styles.rescheduleForm}>
          <p>
            Escolha uma nova data e horário. O profissional e os serviços
            permanecem os mesmos. Seu horário atual só será alterado depois que
            o novo horário for confirmado.
          </p>

          <label className={styles.rescheduleField}>
            <span>Nova data</span>
            <input
              type="date"
              min={getSaoPauloToday()}
              value={date}
              onChange={(event) => handleDateChange(event.target.value)}
              disabled={isLoadingTimes || isRescheduling}
            />
          </label>

          {isLoadingTimes ? (
            <p className={styles.rescheduleFeedback}>
              Consultando horários...
            </p>
          ) : null}

          {times.length > 0 ? (
            <div className={styles.rescheduleTimes}>
              {times.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={
                    selectedTime === time
                      ? `${styles.rescheduleTime} ${styles.rescheduleTimeSelected}`
                      : styles.rescheduleTime
                  }
                  onClick={() => {
                    setSelectedTime(time);
                    setMessage(null);
                    setIsError(false);
                  }}
                  disabled={isRescheduling}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : null}

          {selectedTime ? (
            <button
              type="button"
              className={styles.confirmRescheduleButton}
              onClick={handleConfirm}
              disabled={isRescheduling}
            >
              {isRescheduling
                ? "Remarcando..."
                : `Confirmar ${selectedTime}`}
            </button>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className={isError ? styles.error : styles.success}>{message}</p>
      ) : null}
    </div>
  );
}
