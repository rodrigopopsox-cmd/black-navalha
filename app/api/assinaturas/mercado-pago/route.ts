import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPreapproval,
  createPreapprovalPlan,
  getPreapproval,
} from "@/lib/mercado-pago/subscriptions";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

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
        {
          error:
            "Informe um e-mail para continuar ao pagamento da assinatura.",
        },
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
      .select(
        "id, name, price, billing_interval_months, active, mercado_pago_preapproval_plan_id"
      )
      .eq("id", charge.plan_id)
      .maybeSingle();

    if (planError || !plan || !plan.active) {
      return NextResponse.json(
        { error: "Plano indisponível." },
        { status: 409 }
      );
    }

    if (
      Number(plan.price) !== Number(charge.amount) ||
      charge.currency !== "BRL"
    ) {
      return NextResponse.json(
        { error: "Os dados financeiros do checkout não conferem." },
        { status: 409 }
      );
    }

    let mercadoPagoPlanId = plan.mercado_pago_preapproval_plan_id;

    if (!mercadoPagoPlanId) {
      const mercadoPagoPlan = await createPreapprovalPlan({
        reason: `Black Navalha - ${plan.name}`,
        amount: Number(charge.amount),
        currency: charge.currency,
        frequency: Number(plan.billing_interval_months),
        idempotencyKey: `subscription-plan-${plan.id}`,
      });

      const { data: updatedPlan, error: updatePlanError } = await supabase
        .from("subscription_plans")
        .update({
          mercado_pago_preapproval_plan_id: mercadoPagoPlan.id,
        })
        .eq("id", plan.id)
        .is("mercado_pago_preapproval_plan_id", null)
        .select("mercado_pago_preapproval_plan_id")
        .maybeSingle();

      if (updatePlanError) {
        throw updatePlanError;
      }

      if (updatedPlan?.mercado_pago_preapproval_plan_id) {
        mercadoPagoPlanId =
          updatedPlan.mercado_pago_preapproval_plan_id;
      } else {
        const { data: currentPlan, error: currentPlanError } =
          await supabase
            .from("subscription_plans")
            .select("mercado_pago_preapproval_plan_id")
            .eq("id", plan.id)
            .single();

        if (
          currentPlanError ||
          !currentPlan.mercado_pago_preapproval_plan_id
        ) {
          throw new Error(
            "Não foi possível vincular o plano ao Mercado Pago."
          );
        }

        mercadoPagoPlanId =
          currentPlan.mercado_pago_preapproval_plan_id;
      }
    }

    if (charge.provider_charge_id) {
      if (charge.provider !== "mercado_pago") {
        return NextResponse.json(
          { error: "Checkout já vinculado a outro provedor." },
          { status: 409 }
        );
      }

      const existingPreapproval = await getPreapproval(
        charge.provider_charge_id
      );

      return NextResponse.json({
        ok: true,
        preapprovalId: existingPreapproval.id,
        initPoint: existingPreapproval.initPoint,
        reservationExpiresAt: reservation.expires_at,
      });
    }

    const preapproval = await createPreapproval({
      planId: mercadoPagoPlanId,
      payerEmail: charge.customer_email,
      externalReference: charge.id,
      idempotencyKey: `subscription-charge-${charge.id}`,
    });

    const { error: updateChargeError } = await supabase
      .from("subscription_charges")
      .update({
        provider: "mercado_pago",
        provider_charge_id: preapproval.id,
      })
      .eq("id", charge.id)
      .eq("status", "pending")
      .is("provider_charge_id", null);

    if (updateChargeError) {
      throw updateChargeError;
    }

    return NextResponse.json({
      ok: true,
      preapprovalId: preapproval.id,
      initPoint: preapproval.initPoint,
      reservationExpiresAt: reservation.expires_at,
    });
  } catch (error) {
    console.error(
      "mercado pago subscription creation error",
      error instanceof Error ? error.message : "unknown error"
    );

    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento da assinatura." },
      { status: 500 }
    );
  }
}

