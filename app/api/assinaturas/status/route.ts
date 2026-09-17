import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    const { data: charge, error } = await supabase
      .from("subscription_charges")
      .select("status, subscription_id, cycle_id, paid_at")
      .eq("id", chargeId)
      .eq("checkout_token", checkoutToken)
      .maybeSingle();

    if (error) {
      console.error("subscription payment status lookup error", {
        code: error.code,
        message: error.message,
      });

      return NextResponse.json(
        { error: "Não foi possível consultar o pagamento." },
        { status: 500 }
      );
    }

    if (!charge) {
      return NextResponse.json(
        { error: "Checkout não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        status: charge.status,
        paid: charge.status === "paid",
        activated:
          charge.status === "paid" &&
          Boolean(charge.subscription_id) &&
          Boolean(charge.cycle_id),
        paidAt: charge.paid_at,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "subscription payment status route error",
      error instanceof Error ? error.message : "unknown error"
    );

    return NextResponse.json(
      { error: "Não foi possível consultar o pagamento." },
      { status: 500 }
    );
  }
}
