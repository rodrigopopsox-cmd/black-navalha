import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthorizedNotificationReconciliationOperator } from "@/lib/notifications/reconciliation-authorization";

export interface NotificationReconciliationAdminItem {
  readonly id: string;
  readonly eventId: string;
  readonly channel: string;
  readonly provider: string | null;
  readonly status: "reconciliation_required";
  readonly attemptCount: number;
  readonly maxAttempts: number;
  readonly lastAttemptAt: string | null;
  readonly createdAt: string;
}

interface NotificationReconciliationDeliveryRow {
  id: string;
  event_id: string;
  channel: string;
  provider: string | null;
  status: string;
  attempt_count: number;
  max_attempts: number;
  last_attempt_at: string | null;
  created_at: string;
}

const MAX_RECONCILIATION_ITEMS = 20;

const RECONCILIATION_COLUMNS = [
  "id",
  "event_id",
  "channel",
  "provider",
  "status",
  "attempt_count",
  "max_attempts",
  "last_attempt_at",
  "created_at",
].join(",");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function validateReconciliationRow(
  value: unknown,
): asserts value is NotificationReconciliationDeliveryRow {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      "Registro de reconciliacao inconsistente.",
    );
  }

  const row = value as NotificationReconciliationDeliveryRow;
  if (
    typeof row.id !== "string" ||
    typeof row.event_id !== "string" ||
    !UUID_PATTERN.test(row.id) ||
    !UUID_PATTERN.test(row.event_id) ||
    typeof row.channel !== "string" ||
    row.channel.trim().length === 0 ||
    !(
      row.provider === null ||
      (
        typeof row.provider === "string" &&
        row.provider.trim().length > 0
      )
    ) ||
    row.status !== "reconciliation_required" ||
    !Number.isSafeInteger(row.attempt_count) ||
    row.attempt_count < 0 ||
    !Number.isSafeInteger(row.max_attempts) ||
    row.max_attempts < 1 ||
    !(
      row.last_attempt_at === null ||
      isValidTimestamp(row.last_attempt_at)
    ) ||
    !isValidTimestamp(row.created_at)
  ) {
    throw new Error(
      "Registro de reconciliacao inconsistente.",
    );
  }
}

export async function getNotificationReconciliationAdminItems(
  limit = 20,
): Promise<readonly NotificationReconciliationAdminItem[]> {
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > MAX_RECONCILIATION_ITEMS
  ) {
    throw new Error(
      "Limite de reconciliacoes invalido.",
    );
  }

  const operator =
    await getAuthorizedNotificationReconciliationOperator();

  if (!operator || operator.kind !== "admin") {
    throw new Error(
      "Acesso administrativo nao autorizado.",
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notification_deliveries")
    .select(RECONCILIATION_COLUMNS)
    .eq("status", "reconciliation_required")
    .order("created_at", {
      ascending: true,
    })
    .order("id", {
      ascending: true,
    })
    .limit(limit);

  if (error) {
    throw new Error(
      `Falha ao consultar reconciliacoes: ${error.code ?? "unknown"}.`,
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "Resposta invalida da consulta de reconciliacoes.",
    );
  }

  if (data.length > limit) {
    throw new Error(
      "Consulta retornou reconciliacoes acima do limite.",
    );
  }

  const items = data.map((row: unknown) => {
    validateReconciliationRow(row);

    const delivery = row;

    return Object.freeze({
      id: delivery.id,
      eventId: delivery.event_id,
      channel: delivery.channel,
      provider: delivery.provider,
      status: "reconciliation_required" as const,
      attemptCount: delivery.attempt_count,
      maxAttempts: delivery.max_attempts,
      lastAttemptAt: delivery.last_attempt_at,
      createdAt: delivery.created_at,
    });
  });

  return Object.freeze(items);
}