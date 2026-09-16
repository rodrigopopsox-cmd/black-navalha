import { NextResponse } from "next/server";

import { MercadoPagoApiError } from "@/lib/mercado-pago/client";
import {
  createPixOrder,
  getOrder,
  getPixPayment,
} from "@/lib/mercado-pago/subscriptions";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pixResponse(
  order: Awaited<ReturnType<typeof getOrder>>,
  reservationExpiresAt: string
) {
  const payment = getPixPayment(order);

  if (!payment) {
    throw new Error("Order do Mercado Pago não contém pagamento Pix.");
  }

  if (!payment.qrCode || !payment.qrCodeBase64) {
    throw new Error("Mercado Pago não retornou os dados do QR Code Pix.");
  }

  return {
    ok: true,
    orderId: order.id,
    paymentId: payment.id,
    status: order.status,
    statusDetail: order.statusDetail,
    qrCode: payment.qrCode,
    qrCodeBase64: payment.qrCodeBase64,
    ticketUrl: payment.ticketUrl,
    reservationExpiresAt,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const chargeId =
      typeof body.chargeId === "string" ? body.chargeId.trim() : "";
    const checkoutToken =
      typeof body.checkoutToken === "string"
        ? body.checkoutToken.trim()
        : "";

    if (
      !UUID_PATTERN.test(chargeId) ||
      !UUID_PATTERN.test(checkoutToken)
    ) {
      return NextResponse.json(
        { error: "Checkout inválido." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: charge, error: chargeError } = await supabase
      .from("subscription_charges")
      .select(
        "id, plan_id, amount, currency, status, provider, provider_charge_id, customer_email, checkout_token"
      )
      .eq("id", chargeId)
      .eq("checkout_token", checkoutToken)
      .maybeSingle();

    if (chargeError || !charge) {
      return NextResponse.json(
        { error: "Checkout não encontrado." },
        { status: 404 }
      );
    }

    if (charge.status !== "pending") {
      return NextResponse.json(
        { error: "Este checkout não está mais disponível." },
        { status: 409 }
      );
    }

    if (!charge.customer_email) {
      return NextResponse.json(
        { error: "Informe um e-mail para continuar ao pagamento." },
        { status: 400 }
      );
    }

    const { data: reservation, error: reservationError } = await supabase
      .from("subscription_capacity_reservations")
      .select("status, expires_at")
      .eq("checkout_token", checkoutToken)
      .maybeSingle();

    if (
      reservationError ||
      !reservation ||
      reservation.status !== "held" ||
      new Date(reservation.expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "Sua reserva expirou. Prepare a contratação novamente." },
        { status: 409 }
      );
    }

    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id, price, active")
      .eq("id", charge.plan_id)
      .maybeSingle();

    if (planError || !plan || !plan.active) {
      return NextResponse.json(
        { error: "Plano indisponível." },
        { status: 409 }
      );
    }

    const amount = Number(charge.amount);

    if (
      !Number.isFinite(amount) ||
      Number(plan.price) !== amount ||
      charge.currency !== "BRL"
    ) {
      return NextResponse.json(
        { error: "Os dados financeiros do checkout não conferem." },
        { status: 409 }
      );
    }

    if (charge.provider_charge_id) {
      if (charge.provider !== "mercado_pago") {
        return NextResponse.json(
          { error: "Checkout já vinculado a outro provedor." },
          { status: 409 }
        );
      }

      const existingOrder = await getOrder(charge.provider_charge_id);

      if (existingOrder.externalReference !== charge.id) {
        throw new Error("Order existente não pertence ao checkout.");
      }

      return NextResponse.json(
        pixResponse(existingOrder, reservation.expires_at)
      );
    }

    const order = await createPixOrder({
      amount,
      payerEmail: charge.customer_email,
      payerFirstName:
        process.env.MERCADO_PAGO_TEST_MODE === "true" ? "APRO" : undefined,
      externalReference: charge.id,
      idempotencyKey: `subscription-charge-pix-${charge.id}`,
    });

    if (order.externalReference !== charge.id) {
      throw new Error("Order criada sem a referência esperada.");
    }

    const payment = getPixPayment(order);

    if (!payment) {
      throw new Error("Order criada sem pagamento Pix.");
    }

    const { data: updatedCharge, error: updateChargeError } = await supabase
      .from("subscription_charges")
      .update({
        provider: "mercado_pago",
        provider_charge_id: order.id,
      })
      .eq("id", charge.id)
      .eq("status", "pending")
      .is("provider_charge_id", null)
      .select("id")
      .maybeSingle();

    if (updateChargeError) {
      throw updateChargeError;
    }

    if (!updatedCharge) {
      const { data: currentCharge, error: currentChargeError } =
        await supabase
          .from("subscription_charges")
          .select("provider, provider_charge_id")
          .eq("id", charge.id)
          .single();

      if (
        currentChargeError ||
        currentCharge.provider !== "mercado_pago" ||
        !currentCharge.provider_charge_id
      ) {
        throw new Error("Não foi possível vincular a Order ao checkout.");
      }

      const existingOrder = await getOrder(
        currentCharge.provider_charge_id
      );

      return NextResponse.json(
        pixResponse(existingOrder, reservation.expires_at)
      );
    }

    return NextResponse.json(
      pixResponse(order, reservation.expires_at)
    );
  } catch (error) {
    const safeError =
      error instanceof MercadoPagoApiError
        ? JSON.stringify({
            message: error.message,
            status: error.status,
            body: error.body,
          })
        : error instanceof Error
          ? error.message
          : error && typeof error === "object"
            ? JSON.stringify(error)
            : String(error);

    console.error(`mercado pago pix creation error: ${safeError}`);

    return NextResponse.json(
      { error: "Não foi possível gerar o Pix." },
      { status: 500 }
    );
  }
}
