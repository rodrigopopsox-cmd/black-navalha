"use client";

import { useRef, useState } from "react";

import {
  recordUnknownReconciliationAction,
} from "./actions";

interface ReconciliationUnknownFormProps {
  deliveryId: string;
}

interface PendingIntent {
  operationId: string;
  deliveryId: string;
  evidenceReference: string;
  reason: string;
}

export default function ReconciliationUnknownForm({
  deliveryId,
}: ReconciliationUnknownFormProps) {
  const [evidenceReference, setEvidenceReference] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const pendingIntent = useRef<PendingIntent | null>(null);
  const submitting = useRef(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting.current || success) {
      return;
    }

    if (!confirmed) {
      setMessage("Confirme explicitamente a verificacao inconclusiva.");
      return;
    }

    if (
      evidenceReference.trim() !== evidenceReference ||
      evidenceReference.length < 1 ||
      evidenceReference.length > 200 ||
      reason.trim() !== reason ||
      reason.length < 1 ||
      reason.length > 500
    ) {
      setMessage("Preencha referencia e justificativa validas.");
      return;
    }

    const existingIntent = pendingIntent.current;

    if (
      existingIntent &&
      (
        existingIntent.deliveryId !== deliveryId ||
        existingIntent.evidenceReference !== evidenceReference ||
        existingIntent.reason !== reason
      )
    ) {
      setMessage(
        "Os dados desta operacao nao correspondem a intencao original. " +
        "Nenhum novo registro foi solicitado.",
      );
      return;
    }

    submitting.current = true;
    setSaving(true);
    setMessage("");

    const intent: PendingIntent = existingIntent ?? {
      operationId: crypto.randomUUID(),
      deliveryId,
      evidenceReference,
      reason,
    };

    pendingIntent.current = intent;

    try {
      const result = await recordUnknownReconciliationAction({
        ...intent,
        confirmation: true,
      });

      if (
        !result.success ||
        result.resultingStatus !== "reconciliation_required" ||
        typeof result.auditId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          result.auditId,
        )
      ) {
        setMessage(
          "Nao foi possivel confirmar o registro. A operacao pode ter sido gravada. " +
          "Se repetir, mantenha os mesmos dados e o mesmo identificador.",
        );
        return;
      }

      setSuccess(true);
      setMessage(
        `Verificacao inconclusiva registrada. Auditoria: ${result.auditId}. ` +
        "A entrega permanece bloqueada para reenvio.",
      );
    } catch {
      setMessage(
        "Resultado da operacao desconhecido. O registro pode ter sido gravado. " +
        "Repita somente com os mesmos dados e o mesmo identificador. " +
        "Atualizar ou fechar a pagina perde a identificacao local desta tentativa.",
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const intentLocked = pendingIntent.current !== null;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 12,
        marginTop: 16,
        padding: 16,
        border: "1px solid #333",
        borderRadius: 8,
      }}
    >
      <p style={{ color: "#aaa", fontSize: 12 }}>
        Registro administrativo inconclusivo para a entrega{" "}
        <code>{deliveryId}</code>. Esta operacao nao envia mensagens
        nem altera o status da entrega.
      </p>

      <label>
        <span style={{ display: "block", marginBottom: 6 }}>
          Referencia da verificacao
        </span>

        <input
          type="text"
          value={evidenceReference}
          onChange={(event) => {
            if (intentLocked) return;
            setEvidenceReference(event.target.value);
          }}
          disabled={intentLocked || saving || success}
          maxLength={200}
          required
          style={{ width: "100%", padding: 10 }}
        />
      </label>

      <label>
        <span style={{ display: "block", marginBottom: 6 }}>
          Justificativa administrativa
        </span>

        <textarea
          value={reason}
          onChange={(event) => {
            if (intentLocked) return;
            setReason(event.target.value);
          }}
          disabled={intentLocked || saving || success}
          maxLength={500}
          required
          rows={3}
          style={{ width: "100%", padding: 10 }}
        />
      </label>

      <label style={{ display: "flex", gap: 8 }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          disabled={saving || success}
        />

        <span>
          Confirmo que a verificacao permanece inconclusiva e nao
          autoriza reenvio ou transicao conclusiva.
        </span>
      </label>

      <button
        type="submit"
        disabled={saving || success || !confirmed}
        style={{
          padding: "10px 14px",
          background: "#d29d4f",
          color: "#111",
          border: 0,
          borderRadius: 6,
          cursor: saving ? "wait" : "pointer",
        }}
      >
        {saving
          ? "Registrando..."
          : intentLocked
            ? "Repetir mesma operacao"
            : "Registrar verificacao inconclusiva"}
      </button>

      {intentLocked && (
        <p
          style={{
            color: "#aaa",
            fontSize: 11,
            overflowWrap: "anywhere",
          }}
        >
          Identificador desta operacao:{" "}
          <code>{pendingIntent.current?.operationId}</code>
        </p>
      )}

      {message && (
        <p
          role="status"
          style={{
            color: success ? "#8fd19e" : "#e8bd78",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      )}

      {!intentLocked && !success && (
        <p style={{ color: "#777", fontSize: 11 }}>
          O identificador da operacao sera criado no primeiro envio.
        </p>
      )}
    </form>
  );
}