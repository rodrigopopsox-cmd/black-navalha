import "server-only";

import type {
  NotificationReconciliationEvidence,
} from "./reconciliation-contract";

export type NotificationEvidenceVerificationMechanism =
  | "authenticated_provider_lookup"
  | "signed_provider_webhook";

export interface NotificationEvidenceVerificationRequirements {
  deliveryId: string;
  attemptCount: number;
  channel: string;
  provider: string;
  providerMessageId: string;
  evidence: NotificationReconciliationEvidence;
  evidenceReference: string;
  observedAt: string;
  mechanism: NotificationEvidenceVerificationMechanism;
}

export interface NotificationEvidenceVerificationPlan {
  mechanism: NotificationEvidenceVerificationMechanism;
  deliveryId: string;
  attemptCount: number;
  provider: string;
  channel: string;
  evidenceReference: string;
  requiresTrustedProviderIdentity: true;
  requiresIntegrityVerification: true;
  requiresAttemptBinding: true;
  requiresTemporalValidation: true;
  requiresContradictionCheck: true;
  requiresPersistentAudit: true;
  evidenceVerified: false;
  conclusiveTransitionAllowed: false;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EVIDENCE_TYPES = new Set<NotificationReconciliationEvidence>([
  "provider_confirmed_sent",
  "provider_confirmed_rejected",
  "provider_confirmed_not_sent",
  "provider_outcome_unknown",
]);

const MECHANISMS =
  new Set<NotificationEvidenceVerificationMechanism>([
    "authenticated_provider_lookup",
    "signed_provider_webhook",
  ]);

function requiredText(
  value: unknown,
  field: string,
  maximum: number,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximum ||
    value !== value.trim()
  ) {
    throw new Error(`Campo invalido: ${field}.`);
  }

  return value;
}

export function prepareNotificationEvidenceVerification(
  input: NotificationEvidenceVerificationRequirements,
): NotificationEvidenceVerificationPlan {
  if (
    !input ||
    typeof input.deliveryId !== "string" ||
    !UUID_PATTERN.test(input.deliveryId)
  ) {
    throw new Error("deliveryId invalido.");
  }

  if (
    !Number.isSafeInteger(input.attemptCount) ||
    input.attemptCount < 1
  ) {
    throw new Error("attemptCount invalido.");
  }

  const channel = requiredText(input.channel, "channel", 100);
  const provider = requiredText(input.provider, "provider", 100);

  requiredText(
    input.providerMessageId,
    "providerMessageId",
    500,
  );

  if (!EVIDENCE_TYPES.has(input.evidence)) {
    throw new Error("Evidencia invalida.");
  }

  const evidenceReference = requiredText(
    input.evidenceReference,
    "evidenceReference",
    200,
  );

  const observedAt = requiredText(
    input.observedAt,
    "observedAt",
    50,
  );

  if (!Number.isFinite(Date.parse(observedAt))) {
    throw new Error("observedAt invalido.");
  }

  if (!MECHANISMS.has(input.mechanism)) {
    throw new Error("Mecanismo de verificacao invalido.");
  }

  return Object.freeze({
    mechanism: input.mechanism,
    deliveryId: input.deliveryId.toLowerCase(),
    attemptCount: input.attemptCount,
    provider,
    channel,
    evidenceReference,
    requiresTrustedProviderIdentity: true as const,
    requiresIntegrityVerification: true as const,
    requiresAttemptBinding: true as const,
    requiresTemporalValidation: true as const,
    requiresContradictionCheck: true as const,
    requiresPersistentAudit: true as const,
    evidenceVerified: false as const,
    conclusiveTransitionAllowed: false as const,
  });
}