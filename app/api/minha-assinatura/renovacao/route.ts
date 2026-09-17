import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Entre na sua conta para renovar." },
        { status: 401 }
      );
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Confirme seu e-mail antes de renovar." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const barberId =
      typeof body.barberId === "string" ? body.barberId.trim() : "";

    const checkoutToken =
      typeof body.checkoutToken === "string"
        ? body.checkoutToken.trim()
        : "";

    if (
      !UUID_PATTERN.test(barberId) ||
      !UUID_PATTERN.test(checkoutToken)
    ) {
      return NextResponse.json(
        { error: "Dados de renovação inválidos." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "create_my_subscription_renewal_checkout",
      {
        p_barber_id: barberId,
        p_checkout_token: checkoutToken,
      }
    );

    if (error) {
      const message = error.message?.toLowerCase() ?? "";

      if (message.includes("commercial subscription not found")) {
        return NextResponse.json(
          { error: "Nenhuma assinatura disponível para renovação." },
          { status: 409 }
        );
      }

      if (message.includes("subscription renewal not available before")) {
        const match = error.message?.match(
          /subscription renewal not available before (\d{4}-\d{2}-\d{2})/i
        );
        const availableOn = match?.[1];
        const formattedDate = availableOn
          ? availableOn.split("-").reverse().join("/")
          : null;

        return NextResponse.json(
          {
            error: formattedDate
              ? `Sua renovação estará disponível a partir de ${formattedDate}.`
              : "Sua renovação ainda não está disponível.",
          },
          { status: 409 }
        );
      }

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

      console.error("authenticated subscription renewal error", {
        code: error.code,
        message: error.message,
      });

      return NextResponse.json(
        { error: "Não foi possível preparar sua renovação." },
        { status: 500 }
      );
    }

    const checkout = Array.isArray(data) ? data[0] : data;

    if (!checkout) {
      return NextResponse.json(
        { error: "Não foi possível preparar sua renovação." },
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
      "authenticated subscription renewal route error",
      error instanceof Error ? error.message : "unknown error"
    );

    return NextResponse.json(
      { error: "Não foi possível preparar sua renovação." },
      { status: 500 }
    );
  }
}
