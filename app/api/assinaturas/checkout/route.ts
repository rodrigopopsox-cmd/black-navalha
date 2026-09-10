import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const planId =
      typeof body.planId === "string" ? body.planId.trim() : "";

    const barberId =
      typeof body.barberId === "string" ? body.barberId.trim() : "";

    const customerName =
      typeof body.customerName === "string"
        ? body.customerName.trim()
        : "";

    const customerPhone =
      typeof body.customerPhone === "string"
        ? body.customerPhone.replace(/\D/g, "")
        : "";

    const customerEmail =
      typeof body.customerEmail === "string"
        ? body.customerEmail.trim().toLowerCase()
        : "";

    const checkoutToken =
      typeof body.checkoutToken === "string"
        ? body.checkoutToken.trim()
        : "";

    if (
      !UUID_PATTERN.test(planId) ||
      !UUID_PATTERN.test(barberId) ||
      !UUID_PATTERN.test(checkoutToken)
    ) {
      return NextResponse.json(
        { error: "Dados de contratação inválidos." },
        { status: 400 }
      );
    }

    if (customerName.length < 2 || customerName.length > 120) {
      return NextResponse.json(
        { error: "Informe seu nome." },
        { status: 400 }
      );
    }

    if (customerPhone.length < 10 || customerPhone.length > 11) {
      return NextResponse.json(
        { error: "Informe um WhatsApp válido." },
        { status: 400 }
      );
    }

    if (
      customerEmail &&
      (customerEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
    ) {
      return NextResponse.json(
        { error: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc(
      "create_subscription_checkout",
      {
        p_plan_id: planId,
        p_barber_id: barberId,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_email: customerEmail || null,
        p_checkout_token: checkoutToken,
      }
    );

    if (error) {
      const message = error.message?.toLowerCase() ?? "";

      if (
        message.includes("capacity") ||
        message.includes("no available") ||
        message.includes("sem vaga")
      ) {
        return NextResponse.json(
          {
            error:
              "As vagas deste barbeiro acabaram. Escolha outro profissional.",
          },
          { status: 409 }
        );
      }

      if (message.includes("plan not found")) {
        return NextResponse.json(
          { error: "Este plano não está mais disponível." },
          { status: 409 }
        );
      }

      console.error("subscription checkout rpc error", {
        code: error.code,
        message: error.message,
      });

      return NextResponse.json(
        { error: "Não foi possível preparar sua contratação." },
        { status: 500 }
      );
    }

    const checkout = Array.isArray(data) ? data[0] : data;

    if (!checkout) {
      return NextResponse.json(
        { error: "Não foi possível preparar sua contratação." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      checkout: {
        chargeId: checkout.charge_id,
        checkoutToken: checkout.checkout_token,
        amount: Number(checkout.amount),
        currency: checkout.currency,
        reservationExpiresAt: checkout.reservation_expires_at,
      },
    });
  } catch (error) {
    console.error(
      "subscription checkout route error",
      error instanceof Error ? error.message : "unknown error"
    );

    return NextResponse.json(
      { error: "Não foi possível preparar sua contratação." },
      { status: 500 }
    );
  }
}
