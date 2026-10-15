import "server-only";

export type NotificationReconciliationEvidence =
  | "provider_confirmed_sent"
  | "provider_confirmed_rejected"
  | "provider_confirmed_not_sent"
  | "provider_outcome_unknown";

export type NotificationReconciliationDecision =
  | "sent"
  | "failed"
  | "retry"
  | "reconciliation_required";

export interface NotificationReconciliationProposal {
  deliveryId: string;
  evidence: NotificationReconciliationEvidence;
  evidenceReference: string;
  reason: string;
}

export interface NotificationReconciliationResult {
  decision: NotificationReconciliationDecision;
  requiresDatabaseAuthorization: true;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DECISIONS: Record<
  NotificationReconciliationEvidence,
  NotificationReconciliationDecision
> = {
  provider_confirmed_sent: "sent",
  provider_confirmed_rejected: "failed",
  provider_confirmed_not_sent: "retry",
  provider_outcome_unknown: "reconciliation_required",
};

function requiredText(
  value: string,
  field: string,
  maximum: number,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value !== value.trim() ||
    value.length > maximum
  ) {
    throw new Error(`Campo invalido: ${field}.`);
  }

  return value;
}

export function evaluateNotificationReconciliation(
  proposal: NotificationReconciliationProposal,
): NotificationReconciliationResult {
  if (
    typeof proposal.deliveryId !== "string" ||
    !UUID_PATTERN.test(proposal.deliveryId)
  ) {
    throw new Error("deliveryId invalido.");
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      DECISIONS,
      proposal.evidence,
    )
  ) {
    throw new Error("Evidencia de reconciliacao invalida.");
  }

  requiredText(
    proposal.evidenceReference,
    "evidenceReference",
    200,
  );

  requiredText(
    proposal.reason,
    "reason",
    500,
  );

  return Object.freeze({
    decision: DECISIONS[proposal.evidence],
    requiresDatabaseAuthorization: true as const,
  });
}
