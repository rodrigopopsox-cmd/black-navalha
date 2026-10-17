"use server";

import {
  getAuthorizedNotificationReconciliationOperator,
} from "@/lib/notifications/reconciliation-authorization";

import {
  recordUnknownNotificationReconciliation,
} from "@/lib/notifications/reconciliation-unknown-recording";

export interface RecordUnknownReconciliationActionInput {
  operationId: string;
  deliveryId: string;
  evidenceReference: string;
  reason: string;
  confirmation: boolean;
}

export interface RecordUnknownReconciliationActionResult {
  success: boolean;
  message: string;
  auditId?: string;
  resultingStatus?: "reconciliation_required";
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validText(
  value: unknown,
  maximum: number,
): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maximum &&
    value === value.trim()
  );
}

export async function recordUnknownReconciliationAction(
  input: RecordUnknownReconciliationActionInput,
): Promise<RecordUnknownReconciliationActionResult> {
  const operator =
    await getAuthorizedNotificationReconciliationOperator();

  if (!operator || operator.kind !== "admin") {
    return {
      success: false,
      message: "Acesso administrativo nao autorizado.",
    };
  }

  if (
    !input ||
    typeof input.operationId !== "string" ||
    !UUID_PATTERN.test(input.operationId)
  ) {
    return {
      success: false,
      message: "Identificador da operacao invalido.",
    };
  }

  if (
    typeof input.deliveryId !== "string" ||
    !UUID_PATTERN.test(input.deliveryId)
  ) {
    return {
      success: false,
      message: "Identificador da entrega invalido.",
    };
  }

  if (!validText(input.evidenceReference, 200)) {
    return {
      success: false,
      message: "Referencia da verificacao invalida.",
    };
  }

  if (!validText(input.reason, 500)) {
    return {
      success: false,
      message: "Justificativa administrativa invalida.",
    };
  }

  if (input.confirmation !== true) {
    return {
      success: false,
      message: "Confirmacao explicita obrigatoria.",
    };
  }

  try {
    const result = await recordUnknownNotificationReconciliation({
      operationId: input.operationId.toLowerCase(),
      deliveryId: input.deliveryId.toLowerCase(),
      evidenceReference: input.evidenceReference,
      reason: input.reason,
    });

    if (
      result.resultingStatus !== "reconciliation_required" ||
      result.evidenceVerified !== false ||
      result.conclusiveTransitionAllowed !== false
    ) {
      throw new Error("Resultado inesperado da reconciliacao.");
    }

    return {
      success: true,
      message:
        "Verificacao inconclusiva registrada. A entrega permanece bloqueada para reenvio.",
      auditId: result.auditId,
      resultingStatus: "reconciliation_required",
    };
  } catch {
    return {
      success: false,
      message:
        "Nao foi possivel registrar a verificacao inconclusiva.",
    };
  }
}