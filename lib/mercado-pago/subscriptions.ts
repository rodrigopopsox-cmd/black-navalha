import "server-only";

import {
  isRecord,
  mercadoPagoRequest,
  requireString,
} from "./client";

export type MercadoPagoPixPayment = {
  id: string;
  status: string;
  statusDetail: string | null;
  amount: number;
  paidAmount: number | null;
  paymentMethodId: string | null;
  paymentMethodType: string | null;
  ticketUrl: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  raw: Record<string, unknown>;
};

export type MercadoPagoOrder = {
  id: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
  currency: string | null;
  totalAmount: number;
  totalPaidAmount: number | null;
  payments: MercadoPagoPixPayment[];
  raw: Record<string, unknown>;
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePayment(value: unknown): MercadoPagoPixPayment {
  if (!isRecord(value)) {
    throw new Error("Resposta inválida do Mercado Pago: order payment.");
  }

  const paymentMethod = isRecord(value.payment_method)
    ? value.payment_method
    : null;

  const amount = Number(value.amount);

  if (!Number.isFinite(amount)) {
    throw new Error("Resposta inválida do Mercado Pago: payment.amount.");
  }

  return {
    id: requireString(value.id, "payment.id"),
    status: requireString(value.status, "payment.status"),
    statusDetail: optionalString(value.status_detail),
    amount,
    paidAmount: optionalNumber(value.paid_amount),
    paymentMethodId: paymentMethod
      ? optionalString(paymentMethod.id)
      : null,
    paymentMethodType: paymentMethod
      ? optionalString(paymentMethod.type)
      : null,
    ticketUrl: paymentMethod
      ? optionalString(paymentMethod.ticket_url)
      : null,
    qrCode: paymentMethod ? optionalString(paymentMethod.qr_code) : null,
    qrCodeBase64: paymentMethod
      ? optionalString(paymentMethod.qr_code_base64)
      : null,
    raw: value,
  };
}

function parseOrder(response: unknown): MercadoPagoOrder {
  if (!isRecord(response)) {
    throw new Error("Resposta inválida da Order do Mercado Pago.");
  }

  const totalAmount = Number(response.total_amount);

  if (!Number.isFinite(totalAmount)) {
    throw new Error("Resposta inválida do Mercado Pago: total_amount.");
  }

  const transactions = isRecord(response.transactions)
    ? response.transactions
    : null;

  const paymentValues =
    transactions && Array.isArray(transactions.payments)
      ? transactions.payments
      : [];

  return {
    id: requireString(response.id, "order.id"),
    status: requireString(response.status, "order.status"),
    statusDetail: optionalString(response.status_detail),
    externalReference: optionalString(response.external_reference),
    currency: optionalString(response.currency) ?? optionalString(response.currency_id),
    totalAmount,
    totalPaidAmount: optionalNumber(response.total_paid_amount),
    payments: paymentValues.map(parsePayment),
    raw: response,
  };
}

export async function createPixOrder({
  amount,
  payerEmail,
  payerFirstName,
  externalReference,
  idempotencyKey,
}: {
  amount: number;
  payerEmail: string;
  payerFirstName?: string;
  externalReference: string;
  idempotencyKey: string;
}) {
  const formattedAmount = amount.toFixed(2);

  const response = await mercadoPagoRequest<unknown>("/v1/orders", {
    method: "POST",
    idempotencyKey,
    body: {
      type: "online",
      total_amount: formattedAmount,
      external_reference: externalReference,
      processing_mode: "automatic",
      transactions: {
        payments: [
          {
            amount: formattedAmount,
            payment_method: {
              id: "pix",
              type: "bank_transfer",
            },
            expiration_time: "PT30M",
          },
        ],
      },
      payer: {
        email: payerEmail,
        ...(payerFirstName ? { first_name: payerFirstName } : {}),
      },
    },
  });

  return parseOrder(response);
}

export async function getOrder(id: string) {
  return parseOrder(
    await mercadoPagoRequest<unknown>(
      `/v1/orders/${encodeURIComponent(id)}`
    )
  );
}

export function getPixPayment(order: MercadoPagoOrder) {
  return (
    order.payments.find(
      (payment) =>
        payment.paymentMethodId === "pix" &&
        payment.paymentMethodType === "bank_transfer"
    ) ?? null
  );
}

