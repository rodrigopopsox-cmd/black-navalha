"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  getMyAppointmentRescheduleAvailability,
  getMyAppointmentRescheduleBarbers,
  rescheduleMyAppointment,
  type RescheduleBarber,
} from "./appointment-actions";
import styles from "./page.module.css";

type RescheduleAppointmentProps = {
  appointmentId: string;
  startAt: string;
  barberId: string;
  barberName: string | null;
  barberChangeAllowed: boolean;
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
  barberId,
  barberName,
  barberChangeAllowed,
}: RescheduleAppointmentProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [barbers, setBarbers] = useState<RescheduleBarber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState(barberId);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const [isLoadingBarbers, startLoadingBarbers] = useTransition();
  const [isLoadingTimes, startLoadingTimes] = useTransition();
  const [isRescheduling, startRescheduling] = useTransition();

  const canReschedule =
    new Date(startAt).getTime() - Date.now() >= ONE_HOUR_MS;

  function resetSelection() {
    setBarbers([]);
    setSelectedBarberId(barberId);
    setDate("");
    setTimes([]);
    setSelectedTime("");
    setMessage(null);
    setIsError(false);
  }

  function toggleOpen() {
    if (
      !canReschedule ||
      isLoadingBarbers ||
      isLoadingTimes ||
      isRescheduling
    ) {
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

    if (barberChangeAllowed) {
      startLoadingBarbers(async () => {
        const result = await getMyAppointmentRescheduleBarbers(appointmentId);

        setBarbers(result.barbers);
        setMessage(result.message || null);
        setIsError(!result.ok);
      });
    }
  }

  function handleBarberChange(value: string) {
    setSelectedBarberId(value);
    setDate("");
    setTimes([]);
    setSelectedTime("");
    setMessage(null);
    setIsError(false);
  }

  function handleDateChange(value: string) {
    setDate(value);
    setTimes([]);
    setSelectedTime("");
    setMessage(null);
    setIsError(false);

    if (!value || !selectedBarberId) {
      return;
    }

    startLoadingTimes(async () => {
      const result = await getMyAppointmentRescheduleAvailability(
        appointmentId,
        selectedBarberId,
        value
      );

      setTimes(result.times);
      setMessage(result.message || null);
      setIsError(!result.ok);
    });
  }

  function handleConfirm() {
    if (!selectedBarberId || !date || !selectedTime || isRescheduling) {
      return;
    }

    const selectedBarber =
      barbers.find((barber) => barber.id === selectedBarberId)?.name ??
      barberName ??
      "o profissional selecionado";

    const confirmed = window.confirm(
      `Deseja remarcar este agendamento para ${date
        .split("-")
        .reverse()
        .join("/")} às ${selectedTime} com ${selectedBarber}? O horário atual só será alterado se a remarcação for confirmada com sucesso.`
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
        selectedBarberId,
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
        disabled={isLoadingBarbers || isLoadingTimes || isRescheduling}
      >
        {isOpen ? "Fechar remarcação" : "Remarcar agendamento"}
      </button>

      {isOpen ? (
        <div className={styles.rescheduleForm}>
          <p>
            Escolha o profissional, a nova data e o horário. Os serviços e
            valores deste atendimento permanecem os mesmos. Seu horário atual
            só será alterado depois que a remarcação for confirmada.
          </p>

          {barberChangeAllowed ? (
            <label className={styles.rescheduleField}>
              <span>Profissional</span>
              <select
                value={selectedBarberId}
                onChange={(event) => handleBarberChange(event.target.value)}
                disabled={
                  isLoadingBarbers || isLoadingTimes || isRescheduling
                }
              >
                <option value={barberId}>
                  {barberName ?? "Profissional atual"}
                </option>

                {barbers
                  .filter((barber) => barber.id !== barberId)
                  .map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <p className={styles.rescheduleUnavailable}>
              Este atendimento usa benefício da assinatura e permanece com{" "}
              {barberName ?? "o profissional do ciclo atual"}.
            </p>
          )}

          {isLoadingBarbers ? (
            <p className={styles.rescheduleFeedback}>
              Consultando profissionais...
            </p>
          ) : null}

          <label className={styles.rescheduleField}>
            <span>Nova data</span>
            <input
              type="date"
              min={getSaoPauloToday()}
              value={date}
              onChange={(event) => handleDateChange(event.target.value)}
              disabled={
                isLoadingBarbers || isLoadingTimes || isRescheduling
              }
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
