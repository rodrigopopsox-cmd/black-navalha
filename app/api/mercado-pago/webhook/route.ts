import { NextResponse } from "next/server";

import { getOrder, getPixPayment } from "@/lib/mercado-pago/subscriptions";
import { validateMercadoPagoWebhookSignature } from "@/lib/mercado-pago/webhook-signature";
import { createAdminClient } from "@/lib/supabase/admin";

type WebhookBody = {
  action?: unknown;
  type?: unknown;
  data?: {
    id?: unknown;
  };
};

function asString(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function sameMoney(left: number, right: number) {
  return (
    Number.isFinite(left) &&
    Number.isFinite(right) &&
    Math.round(left * 100) === Math.round(right * 100)
  );
}

export async function POST(request: Request) {
  let body: WebhookBody;

  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const url = new URL(request.url);
  const dataIdFromUrl =
    url.searchParams.get("data.id") ?? url.searchParams.get("data_id");
  const dataIdFromBody = asString(body.data?.id);
  const dataId = dataIdFromUrl ?? dataIdFromBody;

  const requestId = request.headers.get("x-request-id");
  const signature = request.headers.get("x-signature");

if (
    !validateMercadoPagoWebhookSignature({
      signature,
      requestId,
      dataId,
    })
  ) {
    return NextResponse.json(
      { error: "invalid signature" },
      { status: 401 }
    );
  }

  const typeFromUrl = url.searchParams.get("type");
  const type = asString(body.type) ?? typeFromUrl;

  if (!dataId || !type || !requestId) {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  if (type !== "order") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = createAdminClient();
  const providerEventId = `order:${requestId}:${dataId}`;

  let eventId: string;

  const { data: insertedEvent, error: eventInsertError } = await supabase
    .from("payment_events")
    .insert({
      provider: "mercado_pago",
      provider_event_id: providerEventId,
      event_type: asString(body.action) ?? "order",
      payload: body,
    })
    .select("id")
    .maybeSingle();

  if (eventInsertError) {
    if (eventInsertError.code !== "23505") {
      console.error("mercado pago webhook event insert error", {
        code: eventInsertError.code,
        message: eventInsertError.message,
      });

      return NextResponse.json(
        { error: "event storage failed" },
        { status: 500 }
      );
    }

    const { data: existingEvent, error: existingEventError } = await supabase
      .from("payment_events")
      .select("id, processed_at")
      .eq("provider", "mercado_pago")
      .eq("provider_event_id", providerEventId)
      .maybeSingle();

    if (existingEventError || !existingEvent) {
      console.error("mercado pago webhook duplicate lookup error", {
        code: existingEventError?.code ?? null,
        message: existingEventError?.message ?? "event not found",
      });

      return NextResponse.json(
        { error: "event storage failed" },
        { status: 500 }
      );
    }

    if (existingEvent.processed_at) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    eventId = existingEvent.id;
  } else {
    if (!insertedEvent) {
      return NextResponse.json(
        { error: "event storage failed" },
        { status: 500 }
      );
    }

    eventId = insertedEvent.id;
  }

  try {
    /*
     * O body do webhook não é autoridade financeira.
     * A Order é sempre consultada novamente no Mercado Pago.
     */
    const order = await getOrder(dataId);
    const pixPayment = getPixPayment(order);

    if (!pixPayment) {
      throw new Error("verified order has no Pix payment");
    }

    /*
     * Contrato atual da Orders API:
     * Pix concluído = processed / accredited.
     */
    const financiallyApproved =
      order.status === "processed" &&
      order.statusDetail === "accredited" &&
      pixPayment.status === "processed" &&
      pixPayment.statusDetail === "accredited";

    if (!financiallyApproved) {
      await supabase
        .from("payment_events")
        .update({
          processed_at: new Date().toISOString(),
          processing_error: null,
          payload: {
            webhook: body,
            verified_resource: order.raw,
          },
        })
        .eq("id", eventId);

      return NextResponse.json({
        ok: true,
        paymentApproved: false,
      });
    }

    if (!order.externalReference) {
      throw new Error("approved order has no external reference");
    }

    const { data: charge, error: chargeError } = await supabase
      .from("subscription_charges")
      .select(
        "id, amount, currency, status, provider, provider_charge_id"
      )
      .eq("id", order.externalReference)
      .maybeSingle();

    if (chargeError || !charge) {
      throw new Error("subscription charge for order not found");
    }

    if (
      charge.provider !== "mercado_pago" ||
      charge.provider_charge_id !== order.id ||
      order.id !== dataId
    ) {
      throw new Error("order does not belong to subscription charge");
    }

    const chargeAmount = Number(charge.amount);

    if (
      charge.currency !== "BRL" ||
      order.currency !== "BRL" ||
      !sameMoney(chargeAmount, order.totalAmount) ||
      order.totalPaidAmount === null ||
      !sameMoney(chargeAmount, order.totalPaidAmount) ||
      !sameMoney(chargeAmount, pixPayment.amount) ||
      pixPayment.paidAmount === null ||
      !sameMoney(chargeAmount, pixPayment.paidAmount)
    ) {
      throw new Error("order financial values do not match charge");
    }

    if (
      pixPayment.paymentMethodId !== "pix" ||
      pixPayment.paymentMethodType !== "bank_transfer"
    ) {
      throw new Error("verified payment is not Pix");
    }

    const paidAt = new Date().toISOString();

    const { data: confirmation, error: confirmationError } =
      await supabase.rpc("confirm_mercado_pago_subscription_payment", {
        p_charge_id: charge.id,
        p_provider_charge_id: order.id,
        p_paid_at: paidAt,
      });

    if (confirmationError) {
      throw new Error(
        `payment confirmation failed: ${confirmationError.message}`
      );
    }

    const confirmationResult = Array.isArray(confirmation)
      ? confirmation[0]
      : confirmation;

    await supabase
      .from("payment_events")
      .update({
        charge_id: charge.id,
        processed_at: new Date().toISOString(),
        processing_error: null,
        payload: {
          webhook: body,
          verified_resource: order.raw,
          payment_id: pixPayment.id,
          confirmation: confirmationResult ?? null,
        },
      })
      .eq("id", eventId);

    return NextResponse.json({
      ok: true,
      paymentApproved: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown processing error";

    await supabase
      .from("payment_events")
      .update({
        processing_error: message.slice(0, 1000),
      })
      .eq("id", eventId);

    console.error("mercado pago webhook processing error", message);

    return NextResponse.json(
      { error: "processing failed" },
      { status: 500 }
    );
  }
}
