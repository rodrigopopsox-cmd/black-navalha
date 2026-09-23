"use client";

import {
  FormEvent,
  useState,
  useTransition,
} from "react";
import { Ban, Save } from "lucide-react";

import { createBarberBlock } from "./actions";

export default function BarberBlockForm() {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!startAt || !endAt) {
      setMessage("Informe o início e o fim do bloqueio.");
      return;
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setMessage("Informe um período válido.");
      return;
    }

    if (end <= start) {
      setMessage("O fim deve ser posterior ao início.");
      return;
    }

    startTransition(async () => {
      const result = await createBarberBlock(
        start.toISOString(),
        end.toISOString(),
        reason
      );

      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        setStartAt("");
        setEndAt("");
        setReason("");
      }
    });
  }

  return (
    <form
      className="barber-block-form"
      onSubmit={handleSubmit}
    >
      <div className="barber-block-form-heading">
        <Ban size={20} />
        <div>
          <strong>Novo bloqueio</strong>
          <span>
            Reserve um período em que você não poderá receber agendamentos.
          </span>
        </div>
      </div>

      {message && (
        <div
          className={
            success
              ? "barber-action-message is-success"
              : "barber-action-message is-error"
          }
        >
          {message}
        </div>
      )}

      <div className="barber-block-fields">
        <label>
          <span>INÍCIO</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            required
            disabled={pending}
          />
        </label>

        <label>
          <span>FIM</span>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
            required
            disabled={pending}
          />
        </label>

        <label className="is-full">
          <span>MOTIVO</span>
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ex: almoço, compromisso pessoal, folga..."
            disabled={pending}
          />
        </label>
      </div>

      <button type="submit" disabled={pending}>
        <Save size={15} />
        {pending ? "SALVANDO..." : "CRIAR BLOQUEIO"}
      </button>
    </form>
  );
}