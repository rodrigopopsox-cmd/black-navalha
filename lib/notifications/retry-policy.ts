import "server-only";

export type NotificationFailureCategory =
  | "transient"
  | "permanent"
  | "unknown";

export type NotificationFailureDecision =
  | "retry"
  | "failed"
  | "reconciliation_required";

export type NotificationFailurePhase =
  | "before_send"
  | "after_send"
  | "unknown";

export interface NotificationFailureInput {
  category?: NotificationFailureCategory;
  phase?: NotificationFailurePhase;
  attemptCount: number;
  maxAttempts?: number;
  httpStatus?: number | null;
  retryAfter?: string | null;
  externalIdempotencyGuaranteed?: boolean;
  now?: Date;
  random?: () => number;
}

export interface NotificationFailureResult {
  result: NotificationFailureDecision;
  nextAttemptAt: string | null;
  delayMs: number | null;
  reason: string | null;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 60_000;
const MAX_DELAY_MS = 30 * 60_000;
const MAX_RETRY_AFTER_MS = 24 * 60 * 60_000;
const JITTER_RATIO = 0.2;

function validPositiveInteger(
  value: number,
  name: string,
): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Valor invalido: ${name}.`);
  }
}

function parseRetryAfter(
  value: string | null | undefined,
  now: Date,
): number | null {
  if (!value) return null;

  const trimmed = value.trim();

  let delayMs: number;

  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);

    if (!Number.isSafeInteger(seconds)) {
      return MAX_RETRY_AFTER_MS + 1;
    }

    delayMs = seconds * 1000;

    if (!Number.isFinite(delayMs)) {
      return MAX_RETRY_AFTER_MS + 1;
    }
  } else {
    const timestamp = Date.parse(trimmed);

    if (!Number.isFinite(timestamp)) {
      return null;
    }

    delayMs = timestamp - now.getTime();
  }

  if (
    !Number.isFinite(delayMs) ||
    delayMs < 0
  ) {
    return null;
  }

  return delayMs;
}

function classifyHttpStatus(
  status: number | null | undefined,
): NotificationFailureCategory | null {
  if (status == null) return null;

  if (
    !Number.isInteger(status) ||
    status < 100 ||
    status > 599
  ) {
    throw new Error("HTTP status invalido.");
  }

  if (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return "transient";
  }

  if (status >= 400 && status < 500) {
    return "permanent";
  }

  if (status >= 500) {
    return "transient";
  }

  return null;
}

export function decideNotificationFailure(
  input: NotificationFailureInput,
): NotificationFailureResult {
  const maxAttempts =
    input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  validPositiveInteger(input.attemptCount, "attemptCount");
  validPositiveInteger(maxAttempts, "maxAttempts");

  if (input.attemptCount > maxAttempts) {
    throw new Error("Tentativas excedem limite.");
  }

  const now = input.now ?? new Date();

  if (!Number.isFinite(now.getTime())) {
    throw new Error("Data atual invalida.");
  }

  const httpCategory = classifyHttpStatus(input.httpStatus);

  let category: NotificationFailureCategory;

  if (input.category === "unknown") {
    category = "unknown";
  } else if (input.category === "permanent") {
    category = "permanent";
  } else if (httpCategory === "permanent") {
    category = "permanent";
  } else if (httpCategory === "transient") {
    category = "transient";
  } else if (input.category === "transient") {
    category = "transient";
  } else {
    category = "unknown";
  }

  if (
    category !== "transient" &&
    category !== "permanent" &&
    category !== "unknown"
  ) {
    throw new Error("Categoria de falha invalida.");
  }

  if (category === "permanent") {
    return {
      result: "failed",
      nextAttemptAt: null,
      delayMs: null,
      reason: "Falha permanente confirmada.",
    };
  }

  if (category === "unknown") {
    return {
      result: "reconciliation_required",
      nextAttemptAt: null,
      delayMs: null,
      reason: "Resultado externo desconhecido.",
    };
  }

  const phase = input.phase ?? "unknown";

  if (
    phase !== "before_send" &&
    phase !== "after_send" &&
    phase !== "unknown"
  ) {
    throw new Error("Fase de envio invalida.");
  }

  const safeToRetry =
    phase === "before_send" ||
    input.externalIdempotencyGuaranteed === true;

  if (!safeToRetry) {
    return {
      result: "reconciliation_required",
      nextAttemptAt: null,
      delayMs: null,
      reason: "Retry sem garantia de idempotencia externa.",
    };
  }

  if (input.attemptCount >= maxAttempts) {
    return {
      result: "failed",
      nextAttemptAt: null,
      delayMs: null,
      reason: "Limite maximo de tentativas atingido.",
    };
  }

  const random = input.random ?? Math.random;
  const randomValue = random();

  if (
    !Number.isFinite(randomValue) ||
    randomValue < 0 ||
    randomValue >= 1
  ) {
    throw new Error("Valor de jitter invalido.");
  }

  const exponentialDelay = Math.min(
    MAX_DELAY_MS,
    BASE_DELAY_MS * 2 ** (input.attemptCount - 1),
  );

  const jitteredDelay = Math.round(
    exponentialDelay * (1 + randomValue * JITTER_RATIO),
  );

  let delayMs = Math.min(MAX_DELAY_MS, jitteredDelay);

  if (input.httpStatus === 429) {
    const retryAfterMs = parseRetryAfter(
      input.retryAfter,
      now,
    );

    if (retryAfterMs !== null) {
      if (retryAfterMs > MAX_RETRY_AFTER_MS) {
        return {
          result: "reconciliation_required",
          nextAttemptAt: null,
          delayMs: null,
          reason: "Retry-After excede limite operacional seguro.",
        };
      }

      delayMs = Math.max(delayMs, retryAfterMs);
    }
  }

  const nextAttemptMs = now.getTime() + delayMs;

  if (!Number.isFinite(nextAttemptMs)) {
    throw new Error("Data calculada invalida.");
  }

  return {
    result: "retry",
    nextAttemptAt: new Date(
      nextAttemptMs,
    ).toISOString(),
    delayMs,
    reason: "Falha transitoria elegivel para retry seguro.",
  };
}
