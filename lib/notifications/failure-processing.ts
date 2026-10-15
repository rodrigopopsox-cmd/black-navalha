import "server-only";

import {
  completeNotificationDelivery,
  type ClaimedNotificationDelivery,
} from "@/lib/notifications/processing";

import {
  decideNotificationFailure,
  type NotificationFailureCategory,
  type NotificationFailurePhase,
  type NotificationFailureResult,
} from "@/lib/notifications/retry-policy";

export interface CompleteFailedNotificationInput {
  delivery: ClaimedNotificationDelivery;

  category?: NotificationFailureCategory;
  phase?: NotificationFailurePhase;

  httpStatus?: number | null;
  retryAfter?: string | null;

  provider?: string | null;
  providerMessageId?: string | null;
  error?: string | null;
}

export interface CompleteFailedNotificationResult {
  completed: boolean;
  decision: NotificationFailureResult;
}

export async function completeFailedNotification(
  input: CompleteFailedNotificationInput,
): Promise<CompleteFailedNotificationResult> {
  const phase = input.phase ?? "unknown";

  const externalOutcomeUncertain =
    phase !== "before_send";

  const category =
    externalOutcomeUncertain &&
    input.category !== "unknown"
      ? "unknown"
      : input.category;

  const decision = decideNotificationFailure({
    category,
    phase,
    attemptCount: input.delivery.attempt_count,
    maxAttempts: input.delivery.max_attempts,
    httpStatus: input.httpStatus,
    retryAfter: input.retryAfter,
    externalIdempotencyGuaranteed: false,
  });

  const reason =
    input.error?.trim() ||
    decision.reason ||
    "Resultado da entrega nao confirmado.";

  const completed = await completeNotificationDelivery({
    deliveryId: input.delivery.delivery_id,
    lockToken: input.delivery.lock_token,
    result: decision.result,
    provider: input.provider,
    providerMessageId: input.providerMessageId,
    error: reason,
    nextAttemptAt: decision.nextAttemptAt,
  });

  return {
    completed,
    decision,
  };
}
