"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminSubscriptionMode =
  | "external_payment"
  | "prepare_pix";

export type ExternalPaymentMethod =
  | "cash"
  | "pix_in_person"
  | "other";

export type CreateAdminSubscriptionInput = {
  customerId: string;
  planId: string;
  barberId: string;
  mode: AdminSubscriptionMode;
  paymentMethod?: ExternalPaymentMethod;
  administrativeNote?: string;
};

export type CreateAdminSubscriptionResult = {
  success: boolean;
  message: string;
  subscriptionId?: string;
  cycleId?: string;
  chargeId?: string;
  checkoutToken?: string;
  amount?: number;
  currency?: string;
  reservationExpiresAt?: string;
};

async function getAdminClient() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    return null;
  }

  return supabase;
}

function knownRpcMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("capacity") ||
    normalized.includes("no available") ||
    normalized.includes("sem vaga")
  ) {
    return "As vagas deste plano para o barbeiro selecionado acabaram.";
  }

  if (
    normalized.includes("plan not found") ||
    normalized.includes("inactive") ||
    normalized.includes("without capacity group")
  ) {
    return "Este plano não está mais disponível.";
  }

  if (normalized.includes("active barber not found")) {
    return "Este barbeiro não está mais disponível.";
  }

  if (normalized.includes("customer not found")) {
    return "O cliente selecionado não foi encontrado.";
  }

  if (
    normalized.includes(
      "subscription already has a current paid or grace cycle"
    )
  ) {
    return "Este cliente já possui um ciclo vigente deste plano. Use o fluxo de renovação quando aplicável.";
  }

  if (
    normalized.includes(
      "subscription renewal not available before"
    )
  ) {
    const match = message.match(
      /subscription renewal not available before (\d{4}-\d{2}-\d{2})/i
    );

    const availableOn = match?.[1];
    const formattedDate = availableOn
      ? availableOn.split("-").reverse().join("/")
      : null;

    return formattedDate
      ? `A renovação deste cliente estará disponível a partir de ${formattedDate}.`
      : "A renovação deste cliente ainda não está disponível.";
  }

  return null;
}

export async function createAdminSubscription(
  input: CreateAdminSubscriptionInput
): Promise<CreateAdminSubscriptionResult> {
  const customerId = input.customerId?.trim() ?? "";
  const planId = input.planId?.trim() ?? "";
  const barberId = input.barberId?.trim() ?? "";
  const note = input.administrativeNote?.trim() ?? "";

  if (
    !UUID_PATTERN.test(customerId) ||
    !UUID_PATTERN.test(planId) ||
    !UUID_PATTERN.test(barberId)
  ) {
    return {
      success: false,
      message: "Selecione cliente, plano e barbeiro.",
    };
  }

  if (
    input.mode !== "external_payment" &&
    input.mode !== "prepare_pix"
  ) {
    return {
      success: false,
      message: "Selecione como esta contratação será registrada.",
    };
  }

  if (input.mode === "external_payment") {
    if (
      input.paymentMethod !== "cash" &&
      input.paymentMethod !== "pix_in_person" &&
      input.paymentMethod !== "other"
    ) {
      return {
        success: false,
        message: "Selecione o meio de pagamento recebido.",
      };
    }

    if (
      input.paymentMethod === "other" &&
      note.length < 2
    ) {
      return {
        success: false,
        message: "Descreva o meio de pagamento recebido.",
      };
    }
  }

  const supabase = await getAdminClient();

  if (!supabase) {
    return {
      success: false,
      message: "Acesso administrativo inválido.",
    };
  }

  if (input.mode === "external_payment") {
    const { data, error } = await supabase.rpc(
      "admin_confirm_external_subscription_payment",
      {
        p_customer_id: customerId,
        p_plan_id: planId,
        p_barber_id: barberId,
        p_payment_method: input.paymentMethod,
        p_administrative_note: note || null,
      }
    );

    if (error) {
      const knownMessage = knownRpcMessage(
        error.message ?? ""
      );

      if (!knownMessage) {
        console.error(
          "Erro ao registrar pagamento externo da assinatura:",
          {
            code: error.code,
            message: error.message,
          }
        );
      }

      return {
        success: false,
        message:
          knownMessage ??
          "Não foi possível registrar o pagamento externo.",
      };
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return {
        success: false,
        message:
          "Não foi possível concluir a assinatura administrativa.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/assinantes");
    revalidatePath("/admin/barbeiros");

    return {
      success: true,
      message:
        "Pagamento externo registrado e assinatura ativada com sucesso.",
      chargeId: result.charge_id,
      subscriptionId: result.subscription_id,
      cycleId: result.cycle_id,
    };
  }

  /*
   * Preparação de PIX:
   * o browser fornece somente IDs.
   * Nome, telefone e e-mail são recarregados do customer
   * no servidor antes de chamar o motor existente.
   */
  const { data: customer, error: customerError } =
    await supabase
      .from("customers")
      .select("id, name, phone, email")
      .eq("id", customerId)
      .maybeSingle();

  if (customerError || !customer) {
    return {
      success: false,
      message: "O cliente selecionado não foi encontrado.",
    };
  }

  const customerName = customer.name?.trim() ?? "";
  const customerPhone =
    customer.phone?.replace(/\D/g, "") ?? "";
  const customerEmail =
    customer.email?.trim().toLowerCase() ?? "";

  if (customerName.length < 2) {
    return {
      success: false,
      message: "O cliente selecionado não possui nome válido.",
    };
  }

  if (
    customerPhone.length < 10 ||
    customerPhone.length > 11
  ) {
    return {
      success: false,
      message:
        "O cliente selecionado não possui WhatsApp válido.",
    };
  }

  if (!customerEmail) {
    return {
      success: false,
      message:
        "Cadastre um e-mail no cliente antes de preparar o pagamento PIX.",
    };
  }

  const checkoutToken = crypto.randomUUID();

  const checkoutClient = createAdminClient();

  const { data, error } = await checkoutClient.rpc(
    "create_subscription_checkout",
    {
      p_plan_id: planId,
      p_barber_id: barberId,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_customer_email: customerEmail,
      p_checkout_token: checkoutToken,
    }
  );

  if (error) {
    const knownMessage = knownRpcMessage(
      error.message ?? ""
    );

    if (!knownMessage) {
      console.error(
        "Erro ao preparar PIX administrativo:",
        {
          code: error.code,
          message: error.message,
        }
      );
    }

    return {
      success: false,
      message:
        knownMessage ??
        "Não foi possível preparar o pagamento PIX.",
    };
  }

  const checkout = Array.isArray(data) ? data[0] : data;

  if (!checkout) {
    return {
      success: false,
      message:
        "Não foi possível preparar o pagamento PIX.",
    };
  }

  revalidatePath("/admin/assinantes");

  return {
    success: true,
    message:
      "Contratação preparada. Nenhum pagamento foi confirmado e a assinatura ainda não foi ativada.",
    chargeId: checkout.charge_id,
    checkoutToken: checkout.checkout_token,
    amount: Number(checkout.amount),
    currency: checkout.currency,
    reservationExpiresAt:
      checkout.reservation_expires_at,
  };
}
