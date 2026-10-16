import "server-only";

import { createClient } from "@/lib/supabase/server";

import {
  getAuthorizedNotificationReconciliationOperator,
} from "./reconciliation-authorization";

import {
  prepareNotificationReconciliationAudit,
} from "./reconciliation-audit-contract";

export interface RecordUnknownNotificationReconciliationInput {
  operationId: string;
  deliveryId: string;
  evidenceReference: string;
  reason: string;
}

export interface RecordUnknownNotificationReconciliationResult {
  auditId: string;
  resultingStatus: "reconciliation_required";
  evidenceVerified: false;
  conclusiveTransitionAllowed: false;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function recordUnknownNotificationReconciliation(
  input: RecordUnknownNotificationReconciliationInput,
): Promise<RecordUnknownNotificationReconciliationResult> {
  const operator =
    await getAuthorizedNotificationReconciliationOperator();

  if (!operator) {
    throw new Error(
      "Autorizacao administrativa de reconciliacao necessaria.",
    );
  }

  const proposal = prepareNotificationReconciliationAudit({
    operationId: input.operationId,
    deliveryId: input.deliveryId,
    operator,
    evidence: "provider_outcome_unknown",
    evidenceReference: input.evidenceReference,
    reason: input.reason,
  });

  if (
    proposal.proposedDecision !== "reconciliation_required" ||
    proposal.evidenceVerified !== false
  ) {
    throw new Error("Proposta de reconciliacao nao permitida.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "record_notification_reconciliation_unknown",
    {
      p_operation_id: proposal.operationId,
      p_delivery_id: proposal.deliveryId,
      p_evidence_reference: proposal.evidenceReference,
      p_reason: proposal.reason,
    },
  );

  if (error) {
    throw new Error(
      `Falha ao registrar reconciliacao: ${error.code ?? "unknown"}.`,
    );
  }

  if (typeof data !== "string" || !UUID_PATTERN.test(data)) {
    throw new Error("Identificador de auditoria invalido.");
  }

  return Object.freeze({
    auditId: data.toLowerCase(),
    resultingStatus: "reconciliation_required" as const,
    evidenceVerified: false as const,
    conclusiveTransitionAllowed: false as const,
  });
}