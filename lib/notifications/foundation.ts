import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_PAYLOAD_BYTES = 4096;

const FORBIDDEN_PAYLOAD_KEYS =
  /password|passwd|secret|token|authorization|credential|api.?key|access.?key|private.?key|card|cvv|cpf|document|payment|financial/i;

export type NotificationEventStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled";

export type NotificationDeliveryStatus =
  | "pending"
  | "processing"
  | "retry"
  | "sent"
  | "failed"
  | "cancelled";

export type NotificationPayload = Record<
  string,
  string | number | boolean | null
>;

export interface RegisterNotificationEventInput {
  idempotencyKey: string;
  eventType: string;
  entityType?: string | null;
  entityId?: string | null;
  recipientType: string;
  recipientId: string;
  scheduledFor: string;
  payload?: NotificationPayload;
}

export interface NotificationEventRecord {
  id: string;
  idempotency_key: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  recipient_type: string;
  recipient_id: string;
  scheduled_for: string;
  payload: NotificationPayload;
  status: NotificationEventStatus;
}

export interface RegisterNotificationDeliveryInput {
  eventId: string;
  channel: string;
  maxAttempts?: number;
}

export interface NotificationDeliveryRecord {
  id: string;
  event_id: string;
  channel: string;
  provider: string | null;
  status: NotificationDeliveryStatus;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
}

export class NotificationIdempotencyConflictError extends Error {
  constructor() {
    super("A chave idempotente já representa uma notificação incompatível.");
    this.name = "NotificationIdempotencyConflictError";
  }
}

function requiredText(value: string, field: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim() ||
    value.trim().length === 0 ||
    value.length > 200
  ) {
    throw new Error(`Campo inválido: ${field}.`);
  }

  return value;
}

function validUuid(value: string, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`UUID inválido: ${field}.`);
  }

  return value.toLowerCase();
}

function validDate(value: string): string {
  if (
    typeof value !== "string" ||
    !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  ) {
    throw new Error("scheduledFor deve conter timezone explícito.");
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new Error("scheduledFor inválido.");
  }

  return new Date(timestamp).toISOString();
}

function sanitizePayload(
  payload: NotificationPayload = {},
): NotificationPayload {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new Error("Payload inválido.");
  }

  const result: NotificationPayload = {};

  for (const [key, value] of Object.entries(payload)) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key) ||
      FORBIDDEN_PAYLOAD_KEYS.test(key)
    ) {
      throw new Error("Payload contém um campo não permitido.");
    }

    if (
      value !== null &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      throw new Error("Payload deve conter somente valores simples.");
    }

    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error("Payload contém número inválido.");
    }

    if (typeof value === "string" && value.length > 500) {
      throw new Error("Payload contém texto excessivamente longo.");
    }

    result[key] = value;
  }

  if (
    new TextEncoder().encode(JSON.stringify(result)).length >
    MAX_PAYLOAD_BYTES
  ) {
    throw new Error("Payload excede o limite permitido.");
  }

  return result;
}

function canonicalPayload(payload: NotificationPayload): string {
  const sorted = Object.keys(payload)
    .sort()
    .map((key) => [key, payload[key]]);

  return JSON.stringify(sorted);
}

function sameInstant(first: string, second: string): boolean {
  return Date.parse(first) === Date.parse(second);
}

function eventMatches(
  existing: NotificationEventRecord,
  expected: {
    idempotency_key: string;
    event_type: string;
    entity_type: string | null;
    entity_id: string | null;
    recipient_type: string;
    recipient_id: string;
    scheduled_for: string;
    payload: NotificationPayload;
  },
): boolean {
  return (
    existing.idempotency_key === expected.idempotency_key &&
    existing.event_type === expected.event_type &&
    existing.entity_type === expected.entity_type &&
    existing.entity_id === expected.entity_id &&
    existing.recipient_type === expected.recipient_type &&
    existing.recipient_id === expected.recipient_id &&
    sameInstant(existing.scheduled_for, expected.scheduled_for) &&
    canonicalPayload(existing.payload) ===
      canonicalPayload(expected.payload)
  );
}

export async function registerNotificationEvent(
  input: RegisterNotificationEventInput,
): Promise<NotificationEventRecord> {
  const entityType =
    input.entityType == null
      ? null
      : requiredText(input.entityType, "entityType");

  const entityId =
    input.entityId == null
      ? null
      : validUuid(input.entityId, "entityId");

  if ((entityType === null) !== (entityId === null)) {
    throw new Error("Entidade deve possuir tipo e identificador.");
  }

  const expected = {
    idempotency_key: requiredText(
      input.idempotencyKey,
      "idempotencyKey",
    ),
    event_type: requiredText(input.eventType, "eventType"),
    entity_type: entityType,
    entity_id: entityId,
    recipient_type: requiredText(
      input.recipientType,
      "recipientType",
    ),
    recipient_id: validUuid(input.recipientId, "recipientId"),
    scheduled_for: validDate(input.scheduledFor),
    payload: sanitizePayload(input.payload),
  };

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notification_events")
    .insert(expected)
    .select(
      "id, idempotency_key, event_type, entity_type, entity_id, recipient_type, recipient_id, scheduled_for, payload, status",
    )
    .single();

  if (!error && data) {
    return data as NotificationEventRecord;
  }

  if (error?.code !== "23505") {
    throw new Error(
      `Falha ao registrar evento de notificação: ${error?.code ?? "unknown"}.`,
    );
  }

  const { data: existing, error: lookupError } = await supabase
    .from("notification_events")
    .select(
      "id, idempotency_key, event_type, entity_type, entity_id, recipient_type, recipient_id, scheduled_for, payload, status",
    )
    .eq("idempotency_key", expected.idempotency_key)
    .maybeSingle();

  if (lookupError || !existing) {
    throw new Error("Falha ao recuperar evento idempotente.");
  }

  const event = existing as NotificationEventRecord;

  if (!eventMatches(event, expected)) {
    throw new NotificationIdempotencyConflictError();
  }

  return event;
}

export async function registerNotificationDelivery(
  input: RegisterNotificationDeliveryInput,
): Promise<NotificationDeliveryRecord> {
  const eventId = validUuid(input.eventId, "eventId");
  const channel = requiredText(input.channel, "channel");
  const maxAttempts = input.maxAttempts ?? 5;

  if (
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > 100
  ) {
    throw new Error("maxAttempts inválido.");
  }

  const supabase = createAdminClient();

  const { data: event, error: eventError } = await supabase
    .from("notification_events")
    .select("id, scheduled_for")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(
      `Falha ao consultar evento: ${eventError.code ?? "unknown"}.`,
    );
  }

  if (!event) {
    throw new Error("Evento de notificação não encontrado.");
  }

  const { data, error } = await supabase
    .from("notification_deliveries")
    .insert({
      event_id: eventId,
      channel,
      max_attempts: maxAttempts,
      next_attempt_at: event.scheduled_for,
    })
    .select(
      "id, event_id, channel, provider, status, attempt_count, max_attempts, next_attempt_at",
    )
    .single();

  if (!error && data) {
    return data as NotificationDeliveryRecord;
  }

  if (error?.code !== "23505") {
    throw new Error(
      `Falha ao registrar entrega: ${error?.code ?? "unknown"}.`,
    );
  }

  const { data: existing, error: lookupError } = await supabase
    .from("notification_deliveries")
    .select(
      "id, event_id, channel, provider, status, attempt_count, max_attempts, next_attempt_at",
    )
    .eq("event_id", eventId)
    .eq("channel", channel)
    .maybeSingle();

  if (lookupError || !existing) {
    throw new Error("Falha ao recuperar entrega idempotente.");
  }

  const delivery = existing as NotificationDeliveryRecord;

  if (delivery.max_attempts !== maxAttempts) {
    throw new NotificationIdempotencyConflictError();
  }

  return delivery;
}
