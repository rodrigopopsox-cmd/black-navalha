"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type CancelAppointmentState = {
  ok: boolean;
  message: string;
};

export async function cancelMyAppointment(
  appointmentId: string
): Promise<CancelAppointmentState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Sua sessão não é válida. Entre novamente.",
    };
  }

  if (!user.email_confirmed_at) {
    return {
      ok: false,
      message: "Confirme seu e-mail antes de cancelar um agendamento.",
    };
  }

  const { data, error } = await supabase.rpc("cancel_my_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    const errorMessage = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

    if (errorMessage.includes("customer cancellation deadline exceeded")) {
      return {
        ok: false,
        message:
          "O cancelamento pelo cliente é permitido somente com pelo menos 1 hora de antecedência.",
      };
    }

    if (errorMessage.includes("appointment already started")) {
      return {
        ok: false,
        message: "Este horário já começou e não pode mais ser cancelado.",
      };
    }

    if (
      errorMessage.includes(
        "appointment status does not allow customer cancellation"
      )
    ) {
      return {
        ok: false,
        message: "O status atual deste agendamento não permite cancelamento.",
      };
    }

    if (errorMessage.includes("appointment not found")) {
      return {
        ok: false,
        message: "Agendamento não encontrado ou não pertence à sua conta.",
      };
    }

    if (
      errorMessage.includes("authentication required") ||
      errorMessage.includes("email confirmation required") ||
      errorMessage.includes("customer identity not linked")
    ) {
      return {
        ok: false,
        message: "Não foi possível validar sua identidade. Entre novamente.",
      };
    }

    return {
      ok: false,
      message: "Não foi possível cancelar o agendamento agora.",
    };
  }

  if (data !== "cancelled" && data !== "already_cancelled") {
    return {
      ok: false,
      message: "Não foi possível confirmar o cancelamento.",
    };
  }

  revalidatePath("/minha-assinatura");

  return {
    ok: true,
    message:
      data === "already_cancelled"
        ? "Este agendamento já estava cancelado."
        : "Agendamento cancelado com sucesso.",
  };
}
