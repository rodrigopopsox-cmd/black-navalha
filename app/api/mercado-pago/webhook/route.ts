import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthorizedPayment,
  getPreapproval,
} from "@/lib/mercado-pago/subscriptions";
import { validateMercadoPagoWebhookSignature } from "@/lib/mercado-pago/webhook-signature";

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

export async function POST(request: Request) {
  let body: WebhookBody;

  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const url = new URL(request.url);
  const dataIdFromUrl = url.searchParams.get("data.id");
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

  const type = asString(body.type);
  const action = asString(body.action) ?? type ?? "unknown";

  if (!dataId || !type || !requestId) {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  if (
    type !== "subscription_preapproval" &&
    type !== "subscription_authorized_payment"
  ) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = createAdminClient();
  const providerEventId = `${type}:${requestId}:${dataId}`;

  const { data: insertedEvent, error: eventInsertError } = await supabase
    .from("payment_events")
    .insert({
      provider: "mercado_pago",
      provider_event_id: providerEventId,
      event_type: type,
      payload: body,
    })
    .select("id")
    .maybeSingle();

  if (eventInsertError) {
    if (eventInsertError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    console.error("mercado pago webhook event insert error", {
      code: eventInsertError.code,
      message: eventInsertError.message,
    });

    return NextResponse.json(
      { error: "event storage failed" },
      { status: 500 }
    );
  }

  if (!insertedEvent) {
    return NextResponse.json(
      { error: "event storage failed" },
      { status: 500 }
    );
  }

  try {
    if (type === "subscription_preapproval") {
      const preapproval = await getPreapproval(dataId);

      await supabase
        .from("payment_events")
        .update({
          processed_at: new Date().toISOString(),
          payload: {
            webhook: body,
            verified_resource: preapproval.raw,
          },
        })
        .eq("id", insertedEvent.id);

      return NextResponse.json({ ok: true });
    }

    const authorizedPayment = await getAuthorizedPayment(dataId);

    /*
     * Uma fatura agendada não significa dinheiro recebido.
     * Só payment.status=approved pode avançar ao processamento financeiro.
     */
    if (authorizedPayment.paymentStatus !== "approved") {
      await supabase
        .from("payment_events")
        .update({
          processed_at: new Date().toISOString(),
          payload: {
            webhook: body,
            verified_resource: authorizedPayment.raw,
          },
        })
        .eq("id", insertedEvent.id);

      return NextResponse.json({
        ok: true,
        paymentApproved: false,
      });
    }

    if (!authorizedPayment.externalReference) {
      throw new Error(
        "approved authorized payment has no external reference"
      );
    }

    const { data: charge, error: chargeError } = await supabase
      .from("subscription_charges")
      .select(
        "id, amount, currency, status, provider, provider_charge_id"
      )
      .eq("id", authorizedPayment.externalReference)
      .maybeSingle();

    if (chargeError || !charge) {
      throw new Error(
        "subscription charge for authorized payment not found"
      );
    }

    if (
      charge.provider !== "mercado_pago" ||
      charge.provider_charge_id !== authorizedPayment.preapprovalId
    ) {
      throw new Error(
        "authorized payment does not belong to subscription charge"
      );
    }

    if (
      charge.currency !== authorizedPayment.currency ||
      Number(charge.amount) !== authorizedPayment.transactionAmount
    ) {
      throw new Error(
        "authorized payment financial values do not match charge"
      );
    }

    const paidAt = new Date().toISOString();

    const { data: confirmation, error: confirmationError } =
      await supabase.rpc(
        "confirm_mercado_pago_subscription_payment",
        {
          p_charge_id: charge.id,
          p_provider_charge_id: authorizedPayment.preapprovalId,
          p_paid_at: paidAt,
        }
      );

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
          verified_resource: authorizedPayment.raw,
          confirmation: confirmationResult ?? null,
        },
      })
      .eq("id", insertedEvent.id);

    return NextResponse.json({
      ok: true,
      paymentApproved: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "unknown processing error";

    await supabase
      .from("payment_events")
      .update({
        processing_error: message.slice(0, 1000),
      })
      .eq("id", insertedEvent.id);

    console.error("mercado pago webhook processing error", message);

    return NextResponse.json(
      { error: "processing failed" },
      { status: 500 }
    );
  }
}
