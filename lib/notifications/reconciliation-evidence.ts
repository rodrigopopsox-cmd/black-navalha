import "server-only";

import type {
  NotificationReconciliationEvidence,
} from "./reconciliation-contract";

export type NotificationEvidenceVerificationStatus =
  | "unverified"
  | "invalid"
  | "contradictory"
  | "expired";

export interface NotificationExternalEvidence {
  deliveryId: string;
  channel: string;
  provider: string;
  evidence: NotificationReconciliationEvidence;
  evidenceReference: string;
  observedAt: string;
}

export interface NotificationEvidenceAssessment {
  status: NotificationEvidenceVerificationStatus;
  evidenceVerified: false;
  conclusiveTransitionAllowed: false;
  databaseAuthorizationRequired: true;
  persistentAuditRequired: true;
  reason: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EVIDENCE_TYPES = new Set<NotificationReconciliationEvidence>([
  "provider_confirmed_sent",
  "provider_confirmed_rejected",
  "provider_confirmed_not_sent",
  "provider_outcome_unknown",
]);

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

export function assessUnverifiedNotificationEvidence(
  evidence: NotificationExternalEvidence,
): NotificationEvidenceAssessment {
  if (
    !evidence ||
    typeof evidence.deliveryId !== "string" ||
    !UUID_PATTERN.test(evidence.deliveryId)
  ) {
    throw new Error("deliveryId invalido.");
  }

  if (!validText(evidence.channel, 100)) {
    throw new Error("Canal da evidencia invalido.");
  }

  if (!validText(evidence.provider, 100)) {
    throw new Error("Fornecedor da evidencia invalido.");
  }

  if (!EVIDENCE_TYPES.has(evidence.evidence)) {
    throw new Error("Tipo de evidencia invalido.");
  }

  if (!validText(evidence.evidenceReference, 200)) {
    throw new Error("Referencia da evidencia invalida.");
  }

  if (
    !validText(evidence.observedAt, 50) ||
    !Number.isFinite(Date.parse(evidence.observedAt))
  ) {
    throw new Error("Data da evidencia invalida.");
  }

  return Object.freeze({
    status: "unverified" as const,
    evidenceVerified: false as const,
    conclusiveTransitionAllowed: false as const,
    databaseAuthorizationRequired: true as const,
    persistentAuditRequired: true as const,
    reason:
      "A evidencia ainda nao foi autenticada por um verificador externo confiavel.",
  });
}

export interface NotificationDeliveryEvidenceIdentity {
  deliveryId: string;
  attemptCount: number;
  channel: string;
  provider: string;
  providerMessageId: string;
}

export interface NotificationAttemptExternalEvidence
  extends NotificationExternalEvidence {
  attemptCount: number;
  providerMessageId: string;
}

export function assessNotificationAttemptEvidence(
  delivery: NotificationDeliveryEvidenceIdentity,
  evidence: NotificationAttemptExternalEvidence,
): NotificationEvidenceAssessment {
  const preliminary = assessUnverifiedNotificationEvidence(evidence);

  if (
    !delivery ||
    typeof delivery.deliveryId !== "string" ||
    !UUID_PATTERN.test(delivery.deliveryId)
  ) {
    throw new Error("Identidade da delivery invalida.");
  }

  if (
    !Number.isSafeInteger(delivery.attemptCount) ||
    delivery.attemptCount < 1 ||
    !Number.isSafeInteger(evidence.attemptCount) ||
    evidence.attemptCount < 1
  ) {
    throw new Error("Identificador da tentativa invalido.");
  }

  if (
    !validText(delivery.channel, 100) ||
    !validText(delivery.provider, 100) ||
    !validText(delivery.providerMessageId, 500) ||
    !validText(evidence.providerMessageId, 500)
  ) {
    throw new Error("Identidade externa incompleta.");
  }

  const matches =
    delivery.deliveryId.toLowerCase() ===
      evidence.deliveryId.toLowerCase() &&
    delivery.attemptCount === evidence.attemptCount &&
    delivery.channel === evidence.channel &&
    delivery.provider === evidence.provider &&
    delivery.providerMessageId === evidence.providerMessageId;

  if (!matches) {
    return Object.freeze({
      status: "invalid" as const,
      evidenceVerified: false as const,
      conclusiveTransitionAllowed: false as const,
      databaseAuthorizationRequired: true as const,
      persistentAuditRequired: true as const,
      reason:
        "A evidencia nao corresponde a identidade informada da tentativa.",
    });
  }

  return preliminary;
}

export interface NotificationEvidenceConsistencyInput {
  delivery: NotificationDeliveryEvidenceIdentity;
  evidence: NotificationAttemptExternalEvidence;
  previousEvidence: NotificationAttemptExternalEvidence[];
  attemptStartedAt: string;
  evaluatedAt: string;
  maximumEvidenceAgeSeconds: number;
}

export function assessNotificationEvidenceConsistency(
  input: NotificationEvidenceConsistencyInput,
): NotificationEvidenceAssessment {
  const preliminary = assessNotificationAttemptEvidence(
    input.delivery,
    input.evidence,
  );

  if (preliminary.status !== "unverified") {
    return preliminary;
  }

  if (!Array.isArray(input.previousEvidence)) {
    throw new Error("Historico de evidencias invalido.");
  }

  if (
    !Number.isSafeInteger(input.maximumEvidenceAgeSeconds) ||
    input.maximumEvidenceAgeSeconds < 1 ||
    input.maximumEvidenceAgeSeconds > 86400
  ) {
    throw new Error("Janela temporal invalida.");
  }

  function timestamp(value: string, field: string): number {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    ) {
      throw new Error(`Timestamp invalido: ${field}.`);
    }

    const parsed = Date.parse(value);

    if (!Number.isFinite(parsed)) {
      throw new Error(`Timestamp invalido: ${field}.`);
    }

    return parsed;
  }

  const startedAt = timestamp(
    input.attemptStartedAt,
    "attemptStartedAt",
  );

  const evaluatedAt = timestamp(
    input.evaluatedAt,
    "evaluatedAt",
  );

  const observedAt = timestamp(
    input.evidence.observedAt,
    "observedAt",
  );

  if (
    evaluatedAt < startedAt ||
    observedAt < startedAt ||
    observedAt > evaluatedAt
  ) {
    return Object.freeze({
      status: "invalid" as const,
      evidenceVerified: false as const,
      conclusiveTransitionAllowed: false as const,
      databaseAuthorizationRequired: true as const,
      persistentAuditRequired: true as const,
      reason:
        "A cronologia da evidencia e incompatível com a tentativa.",
    });
  }

  const ageSeconds = (evaluatedAt - observedAt) / 1000;

  const conclusiveEvidence = new Set<NotificationReconciliationEvidence>();

  if (input.evidence.evidence !== "provider_outcome_unknown") {
    conclusiveEvidence.add(input.evidence.evidence);
  }

  for (const previous of input.previousEvidence) {
    const previousAssessment = assessNotificationAttemptEvidence(
      input.delivery,
      previous,
    );

    if (previousAssessment.status !== "unverified") {
      return Object.freeze({
        status: "invalid" as const,
        evidenceVerified: false as const,
        conclusiveTransitionAllowed: false as const,
        databaseAuthorizationRequired: true as const,
        persistentAuditRequired: true as const,
        reason:
          "O historico contem evidencia incompatível com a tentativa.",
      });
    }

    const previousObservedAt = timestamp(
      previous.observedAt,
      "previousEvidence.observedAt",
    );

    if (
      previousObservedAt < startedAt ||
      previousObservedAt > evaluatedAt
    ) {
      return Object.freeze({
        status: "invalid" as const,
        evidenceVerified: false as const,
        conclusiveTransitionAllowed: false as const,
        databaseAuthorizationRequired: true as const,
        persistentAuditRequired: true as const,
        reason:
          "O historico contem evidencia temporalmente invalida.",
      });
    }

    if (previous.evidence !== "provider_outcome_unknown") {
      conclusiveEvidence.add(previous.evidence);
    }

    if (conclusiveEvidence.size > 1) {
      return Object.freeze({
        status: "contradictory" as const,
        evidenceVerified: false as const,
        conclusiveTransitionAllowed: false as const,
        databaseAuthorizationRequired: true as const,
        persistentAuditRequired: true as const,
        reason:
          "Foram apresentadas evidencias conclusivas conflitantes.",
      });
    }
  }

  if (ageSeconds > input.maximumEvidenceAgeSeconds) {
    return Object.freeze({
      status: "expired" as const,
      evidenceVerified: false as const,
      conclusiveTransitionAllowed: false as const,
      databaseAuthorizationRequired: true as const,
      persistentAuditRequired: true as const,
      reason:
        "A evidencia ultrapassou a janela temporal preliminar.",
    });
  }
  return preliminary;
}
