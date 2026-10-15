import "server-only";

export interface NotificationConsumerLimits {
  batchSize: number;
  concurrency: number;
  leaseSeconds: number;
  operationTimeoutSeconds: number;
  leaseSafetyMarginSeconds: number;
}

export const DEFAULT_NOTIFICATION_CONSUMER_LIMITS: Readonly<NotificationConsumerLimits> =
  Object.freeze({
    batchSize: 10,
    concurrency: 2,
    leaseSeconds: 300,
    operationTimeoutSeconds: 60,
    leaseSafetyMarginSeconds: 30,
  });

const MAX_BATCH_SIZE = 10;
const MAX_CONCURRENCY = 2;
const MAX_LEASE_SECONDS = 86400;
const MAX_OPERATION_TIMEOUT_SECONDS = 120;
const MIN_LEASE_SAFETY_MARGIN_SECONDS = 30;

function validateInteger(
  value: number,
  field: string,
  minimum: number,
  maximum: number,
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`Configuracao operacional invalida: ${field}.`);
  }
}

export function validateNotificationConsumerLimits(
  input: NotificationConsumerLimits,
): Readonly<NotificationConsumerLimits> {
  validateInteger(input.batchSize, "batchSize", 1, MAX_BATCH_SIZE);

  validateInteger(
    input.concurrency,
    "concurrency",
    1,
    MAX_CONCURRENCY,
  );

  validateInteger(
    input.leaseSeconds,
    "leaseSeconds",
    60,
    MAX_LEASE_SECONDS,
  );

  validateInteger(
    input.operationTimeoutSeconds,
    "operationTimeoutSeconds",
    1,
    MAX_OPERATION_TIMEOUT_SECONDS,
  );

  validateInteger(
    input.leaseSafetyMarginSeconds,
    "leaseSafetyMarginSeconds",
    MIN_LEASE_SAFETY_MARGIN_SECONDS,
    300,
  );

  if (input.concurrency > input.batchSize) {
    throw new Error(
      "Concorrencia nao pode exceder o tamanho do lote.",
    );
  }

  if (
    input.operationTimeoutSeconds +
      input.leaseSafetyMarginSeconds >=
    input.leaseSeconds
  ) {
    throw new Error(
      "Timeout operacional e margem de seguranca excedem o lease.",
    );
  }

  return Object.freeze({ ...input });
}

export function getDefaultNotificationConsumerLimits():
  Readonly<NotificationConsumerLimits> {
  return validateNotificationConsumerLimits(
    DEFAULT_NOTIFICATION_CONSUMER_LIMITS,
  );
}
