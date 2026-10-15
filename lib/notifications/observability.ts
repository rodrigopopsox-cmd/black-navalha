import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export interface NotificationOperationalSnapshot {
  capturedAt: string;

  statuses: {
    pending: number;
    processing: number;
    retry: number;
    sent: number;
    failed: number;
    cancelled: number;
    reconciliationRequired: number;
  };

  overdueProcessing: number;
  futureRetries: number;

}

const DELIVERY_STATUSES = [
  "pending",
  "processing",
  "retry",
  "sent",
  "failed",
  "cancelled",
  "reconciliation_required",
] as const;

export async function getNotificationOperationalSnapshot(
  leaseTimeoutSeconds = 300,
): Promise<NotificationOperationalSnapshot> {
  if (
    !Number.isSafeInteger(leaseTimeoutSeconds) ||
    leaseTimeoutSeconds < 60 ||
    leaseTimeoutSeconds > 86400
  ) {
    throw new Error("Timeout operacional invalido.");
  }

  const supabase = createAdminClient();

  const now = new Date();

  const leaseDeadline = new Date(
    now.getTime() - leaseTimeoutSeconds * 1000,
  ).toISOString();

  async function countByStatus(status: string): Promise<number> {
    const { count, error } = await supabase
      .from("notification_deliveries")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", status);

    if (error || count === null) {
      throw new Error(
        `Falha na observabilidade de notificacoes: ${error?.code ?? "unknown"}.`,
      );
    }

    return count;
  }

  const statusCounts = await Promise.all(
    DELIVERY_STATUSES.map(countByStatus),
  );

  const [
    overdueResult,
    futureRetriesResult,
  ] = await Promise.all([
    supabase
      .from("notification_deliveries")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "processing")
      .lt("locked_at", leaseDeadline),

    supabase
      .from("notification_deliveries")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "retry")
      .gt("next_attempt_at", now.toISOString()),
  ]);

  if (
    overdueResult.error ||
    futureRetriesResult.error ||
    overdueResult.count === null ||
    futureRetriesResult.count === null
  ) {
    throw new Error(
      "Falha ao consultar indicadores operacionais de notificacoes.",
    );
  }

  return {
    capturedAt: now.toISOString(),

    statuses: {
      pending: statusCounts[0],
      processing: statusCounts[1],
      retry: statusCounts[2],
      sent: statusCounts[3],
      failed: statusCounts[4],
      cancelled: statusCounts[5],
      reconciliationRequired: statusCounts[6],
    },

    overdueProcessing: overdueResult.count,
    futureRetries: futureRetriesResult.count,


  };
}
