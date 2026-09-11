import "server-only";

import {
  isRecord,
  mercadoPagoRequest,
  requireString,
} from "./client";

export type MercadoPagoPlan = {
  id: string;
  raw: Record<string, unknown>;
};

export type MercadoPagoPreapproval = {
  id: string;
  status: string | null;
  externalReference: string | null;
  initPoint: string | null;
  raw: Record<string, unknown>;
};

export async function createPreapprovalPlan({
  reason,
  amount,
  currency,
  frequency,
  idempotencyKey,
}: {
  reason: string;
  amount: number;
  currency: string;
  frequency: number;
  idempotencyKey: string;
}) {
  const response = await mercadoPagoRequest<unknown>("/preapproval_plan", {
    method: "POST",
    idempotencyKey,
    body: {
      reason,
      auto_recurring: {
        frequency,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: currency,
      },
    },
  });

  if (!isRecord(response)) {
    throw new Error("Resposta inválida ao criar preapproval_plan.");
  }

  return {
    id: requireString(response.id, "preapproval_plan.id"),
    raw: response,
  } satisfies MercadoPagoPlan;
}

export async function getPreapproval(id: string) {
  const response = await mercadoPagoRequest<unknown>(
    `/preapproval/${encodeURIComponent(id)}`
  );

  if (!isRecord(response)) {
    throw new Error("Resposta inválida do preapproval.");
  }

  return parsePreapproval(response);
}

export async function createPreapproval({
  planId,
  payerEmail,
  externalReference,
  idempotencyKey,
}: {
  planId: string;
  payerEmail: string;
  externalReference: string;
  idempotencyKey: string;
}) {
  const response = await mercadoPagoRequest<unknown>("/preapproval", {
    method: "POST",
    idempotencyKey,
    body: {
      preapproval_plan_id: planId,
      payer_email: payerEmail,
      external_reference: externalReference,
    },
  });

  if (!isRecord(response)) {
    throw new Error("Resposta inválida ao criar preapproval.");
  }

  return parsePreapproval(response);
}

function parsePreapproval(
  response: Record<string, unknown>
): MercadoPagoPreapproval {
  return {
    id: requireString(response.id, "preapproval.id"),
    status:
      typeof response.status === "string" ? response.status : null,
    externalReference:
      typeof response.external_reference === "string"
        ? response.external_reference
        : null,
    initPoint:
      typeof response.init_point === "string" ? response.init_point : null,
    raw: response,
  };
}
export type MercadoPagoAuthorizedPayment = {
  id: string;
  preapprovalId: string;
  externalReference: string | null;
  currency: string;
  transactionAmount: number;
  paymentId: string | null;
  paymentStatus: string | null;
  raw: Record<string, unknown>;
};

export async function getAuthorizedPayment(
  id: string
): Promise<MercadoPagoAuthorizedPayment> {
  const response = await mercadoPagoRequest<unknown>(
    `/authorized_payments/${encodeURIComponent(id)}`
  );

  if (!isRecord(response)) {
    throw new Error("Resposta inválida do pagamento autorizado.");
  }

  const payment = isRecord(response.payment)
    ? response.payment
    : null;

  const amount = Number(response.transaction_amount);

  if (!Number.isFinite(amount)) {
    throw new Error(
      "Resposta inválida do Mercado Pago: transaction_amount."
    );
  }

  const externalReference =
    typeof response.external_reference === "string" ||
    typeof response.external_reference === "number"
      ? String(response.external_reference)
      : null;

  return {
    id: String(response.id),
    preapprovalId: requireString(
      response.preapproval_id,
      "authorized_payment.preapproval_id"
    ),
    externalReference,
    currency: requireString(
      response.currency_id,
      "authorized_payment.currency_id"
    ),
    transactionAmount: amount,
    paymentId:
      payment &&
      (typeof payment.id === "string" ||
        typeof payment.id === "number")
        ? String(payment.id)
        : null,
    paymentStatus:
      payment && typeof payment.status === "string"
        ? payment.status
        : null,
    raw: response,
  };
}

