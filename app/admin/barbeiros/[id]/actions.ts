"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type UpdateBarberInput = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  subscriptionCommissionRate: number;
  serviceCommissionRate: number;
};

export type UpdateBarberResult = {
  success: boolean;
  message: string;
};

export async function updateBarber(
  input: UpdateBarberInput
): Promise<UpdateBarberResult> {
  const id = input.id?.trim();
  const name = input.name?.trim();
  const phone = input.phone?.trim() ?? "";
  const phoneDigits = phone.replace(/\D/g, "");
  const subscriptionCommissionRate =
    input.subscriptionCommissionRate;
  const serviceCommissionRate =
    input.serviceCommissionRate;

  if (!id) {
    return {
      success: false,
      message: "Barbeiro inválido.",
    };
  }

  if (name.length < 2) {
    return {
      success: false,
      message: "Informe o nome do barbeiro.",
    };
  }

  if (
    phoneDigits &&
    (phoneDigits.length < 10 || phoneDigits.length > 11)
  ) {
    return {
      success: false,
      message: "Informe um WhatsApp válido.",
    };
  }

  if (
    !Number.isFinite(subscriptionCommissionRate) ||
    subscriptionCommissionRate < 0 ||
    subscriptionCommissionRate > 100
  ) {
    return {
      success: false,
      message:
        "Informe uma comissão de assinatura entre 0% e 100%.",
    };
  }

  if (
    !Number.isFinite(serviceCommissionRate) ||
    serviceCommissionRate < 0 ||
    serviceCommissionRate > 100
  ) {
    return {
      success: false,
      message:
        "Informe uma comissão de serviços entre 0% e 100%.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "Sessão administrativa inválida.",
    };
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    return {
      success: false,
      message: "Você não tem permissão para alterar barbeiros.",
    };
  }

  const { data: barber, error: barberError } =
    await supabase
      .from("barbers")
      .select("id")
      .eq("id", id)
      .maybeSingle();

  if (barberError) {
    console.error(
      "Erro ao validar barbeiro:",
      barberError
    );

    return {
      success: false,
      message: "Não foi possível validar o barbeiro.",
    };
  }

  if (!barber) {
    return {
      success: false,
      message: "Barbeiro não encontrado.",
    };
  }

  const { error: updateError } = await supabase
    .from("barbers")
    .update({
      name,
      phone: phone || null,
      active: input.active,
      subscription_commission_rate:
        subscriptionCommissionRate,
      service_commission_rate:
        serviceCommissionRate,
    })
    .eq("id", id);

  if (updateError) {
    console.error(
      "Erro ao atualizar barbeiro:",
      updateError
    );

    return {
      success: false,
      message: "Não foi possível atualizar o barbeiro.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/barbeiros");
  revalidatePath(`/admin/barbeiros/${id}`);
  revalidatePath("/admin/agenda");

  return {
    success: true,
    message: "Barbeiro atualizado com sucesso.",
  };
}