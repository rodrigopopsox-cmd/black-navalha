import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ClaimedNotificationDelivery {
  delivery_id: string;
  event_id: string;
  channel: string;
  lock_token: string;
  attempt_count: number;
  max_attempts: number;
  event_type: string;
  recipient_type: string;
  recipient_id: string;
  payload: Record<string, unknown>;
}

export type NotificationDeliveryResult =
  | "sent"
  | "retry"
  | "failed"
  | "reconciliation_required";

export interface CompleteNotificationDeliveryInput {
  deliveryId: string;
  lockToken: string;
  result: NotificationDeliveryResult;
  provider?: string | null;
  providerMessageId?: string | null;
  error?: string | null;
  nextAttemptAt?: string | null;
}

function validUuid(value: string, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`UUID invalido: ${field}.`);
  }

  return value.toLowerCase();
}

function validPositiveInteger(
  value: number,
  field: string,
  maximum: number,
): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > maximum
  ) {
    throw new Error(`Valor invalido: ${field}.`);
  }

  return value;
}

function validOptionalText(
  value: string | null | undefined,
  field: string,
  maximum: number,
): string | null {
  if (value == null) {
    return null;
  }

  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maximum
  ) {
    throw new Error(`Texto invalido: ${field}.`);
  }

  return value;
}

export async function claimNotificationDeliveries(
  limit = 10,
): Promise<ClaimedNotificationDelivery[]> {
  const validatedLimit = validPositiveInteger(
    limit,
    "limit",
    100,
  );

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc(
    "claim_notification_deliveries",
    {
      p_limit: validatedLimit,
    },
  );

  if (error) {
    throw new Error(
      `Falha ao reservar notificacoes: ${error.code ?? "unknown"}.`,
    );
  }

  return (data ?? []) as ClaimedNotificationDelivery[];
}

export async function completeNotificationDelivery(
  input: CompleteNotificationDeliveryInput,
): Promise<boolean> {
  const deliveryId = validUuid(input.deliveryId, "deliveryId");
  const lockToken = validUuid(input.lockToken, "lockToken");

  if (
    input.result !== "sent" &&
    input.result !== "retry" &&
    input.result !== "failed" &&
    input.result !== "reconciliation_required"
  ) {
    throw new Error("Resultado de entrega invalido.");
  }

  const provider = validOptionalText(
    input.provider,
    "provider",
    200,
  );

  const providerMessageId = validOptionalText(
    input.providerMessageId,
    "providerMessageId",
    500,
  );

  const errorMessage = validOptionalText(
    input.error,
    "error",
    1000,
  );

  let nextAttemptAt: string | null = null;

  if (input.result === "retry") {
    if (!input.nextAttemptAt) {
      throw new Error("Retry exige proxima tentativa.");
    }

    const timestamp = Date.parse(input.nextAttemptAt);

    if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
      throw new Error("Data de retry invalida.");
    }

    nextAttemptAt = new Date(timestamp).toISOString();
  }

  if (input.result !== "retry" && input.nextAttemptAt != null) {
    throw new Error(
      "Proxima tentativa permitida somente para retry.",
    );
  }
  if (input.result === "sent" && errorMessage !== null) {
    throw new Error("Entrega enviada nao pode conter erro.");
  }

  if (input.result === "reconciliation_required") {
    if (errorMessage === null) {
      throw new Error("Reconciliacao exige justificativa.");
    }

    if (input.nextAttemptAt != null) {
      throw new Error(
        "Reconciliacao nao permite agendamento de retry.",
      );
    }
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc(
    "complete_notification_delivery",
    {
      p_delivery_id: deliveryId,
      p_lock_token: lockToken,
      p_result: input.result,
      p_provider: provider,
      p_provider_message_id: providerMessageId,
      p_error: errorMessage,
      p_next_attempt_at: nextAttemptAt,
    },
  );

  if (error) {
    throw new Error(
      `Falha ao concluir notificacao: ${error.code ?? "unknown"}.`,
    );
  }

  return data === true;
}

export async function recoverStaleNotificationDeliveries(
  timeoutSeconds = 300,
  limit = 100,
): Promise<number> {
  const validatedTimeout = validPositiveInteger(
    timeoutSeconds,
    "timeoutSeconds",
    86400,
  );

  if (validatedTimeout < 60) {
    throw new Error("Timeout minimo de recuperacao: 60 segundos.");
  }

  const validatedLimit = validPositiveInteger(
    limit,
    "limit",
    1000,
  );

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc(
    "recover_stale_notification_deliveries",
    {
      p_timeout_seconds: validatedTimeout,
      p_limit: validatedLimit,
    },
  );

  if (error) {
    throw new Error(
      `Falha ao recuperar notificacoes: ${error.code ?? "unknown"}.`,
    );
  }

  if (typeof data !== "number") {
    throw new Error("Resposta invalida da recuperacao.");
  }

  return data;
}
