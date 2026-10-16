import "server-only";

import type {
  NotificationReconciliationEvidence,
  NotificationReconciliationDecision,
} from "./reconciliation-contract";

import type {
  AuthorizedNotificationReconciliationOperator,
} from "./reconciliation-authorization";

export interface NotificationReconciliationAuditProposal {
  operationId: string;
  deliveryId: string;
  operator: AuthorizedNotificationReconciliationOperator;
  evidence: NotificationReconciliationEvidence;
  evidenceReference: string;
  reason: string;
}

export interface NotificationReconciliationAuditContract {
  operationId: string;
  deliveryId: string;
  operatorKind: "admin";
  operatorUserId: string;
  evidence: NotificationReconciliationEvidence;
  evidenceReference: string;
  reason: string;
  proposedDecision: NotificationReconciliationDecision;
  evidenceVerified: false;
  databaseAuthorizationRequired: true;
  persistentAuditRequired: true;
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

function validUuid(value: string, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`UUID invalido: ${field}.`);
  }

  return value.toLowerCase();
}

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

export function prepareNotificationReconciliationAudit(
  proposal: NotificationReconciliationAuditProposal,
): NotificationReconciliationAuditContract {
  const operationId = validUuid(
    proposal.operationId,
    "operationId",
  );

  const deliveryId = validUuid(
    proposal.deliveryId,
    "deliveryId",
  );

  if (
    !proposal.operator ||
    proposal.operator.kind !== "admin"
  ) {
    throw new Error("Operador de reconciliacao invalido.");
  }

  const operatorUserId = validUuid(
    proposal.operator.userId,
    "operatorUserId",
  );

  if (
    !Object.prototype.hasOwnProperty.call(
      DECISIONS,
      proposal.evidence,
    )
  ) {
    throw new Error("Evidencia de reconciliacao invalida.");
  }

  const evidenceReference = requiredText(
    proposal.evidenceReference,
    "evidenceReference",
    200,
  );

  const reason = requiredText(
    proposal.reason,
    "reason",
    500,
  );

  return Object.freeze({
    operationId,
    deliveryId,
    operatorKind: "admin" as const,
    operatorUserId,
    evidence: proposal.evidence,
    evidenceReference,
    reason,
    proposedDecision: DECISIONS[proposal.evidence],
    evidenceVerified: false as const,
    databaseAuthorizationRequired: true as const,
    persistentAuditRequired: true as const,
  });
}
