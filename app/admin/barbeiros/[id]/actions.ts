"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
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

export type ProvisionBarberAccessInput = {
  barberId: string;
  email: string;
};

export type ProvisionBarberAccessResult = {
  success: boolean;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      authorized: false as const,
      message: "Sessão administrativa inválida.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return {
      supabase,
      authorized: false as const,
      message: "Você não tem permissão para gerenciar barbeiros.",
    };
  }

  return {
    supabase,
    authorized: true as const,
    message: "",
  };
}

function getAppUrl() {
  const value = process.env.APP_URL?.trim();

  if (!value) {
    throw new Error("APP_URL não configurada.");
  }

  const url = new URL(value);

  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && url.hostname === "localhost")
  ) {
    throw new Error("APP_URL deve usar HTTPS fora do localhost.");
  }

  return url.origin;
}

export async function updateBarber(
  input: UpdateBarberInput
): Promise<UpdateBarberResult> {
  const id = input.id?.trim();
  const name = input.name?.trim();
  const phone = input.phone?.trim() ?? "";
  const phoneDigits = phone.replace(/\D/g, "");
  const subscriptionCommissionRate =
    input.subscriptionCommissionRate;
  const serviceCommissionRate = input.serviceCommissionRate;

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

  const auth = await requireAdmin();

  if (!auth.authorized) {
    return {
      success: false,
      message: auth.message,
    };
  }

  const { supabase } = auth;

  const { data: barber, error: barberError } = await supabase
    .from("barbers")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (barberError) {
    console.error("Erro ao validar barbeiro:", barberError);

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
      phone: phoneDigits || null,
      active: input.active,
      subscription_commission_rate: subscriptionCommissionRate,
      service_commission_rate: serviceCommissionRate,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Erro ao atualizar barbeiro:", updateError);

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

export async function provisionBarberAccess(
  input: ProvisionBarberAccessInput
): Promise<ProvisionBarberAccessResult> {
  const barberId = input.barberId?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";

  if (!barberId) {
    return {
      success: false,
      message: "Barbeiro inválido.",
    };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      success: false,
      message: "Informe um e-mail profissional válido.",
    };
  }

  const auth = await requireAdmin();

  if (!auth.authorized) {
    return {
      success: false,
      message: auth.message,
    };
  }

  const { supabase } = auth;

  const { data: barber, error: barberError } = await supabase
    .from("barbers")
    .select("id, name, auth_user_id")
    .eq("id", barberId)
    .maybeSingle();

  if (barberError) {
    console.error(
      "Erro ao validar acesso do barbeiro:",
      barberError
    );

    return {
      success: false,
      message: "Não foi possível validar o acesso profissional.",
    };
  }

  if (!barber) {
    return {
      success: false,
      message: "Barbeiro não encontrado.",
    };
  }

  if (barber.auth_user_id) {
    return {
      success: false,
      message: "Este barbeiro já possui acesso profissional configurado.",
    };
  }

  let appUrl: string;

  try {
    appUrl = getAppUrl();
  } catch (error) {
    console.error(
      "Erro na configuração da URL da aplicação:",
      error
    );

    return {
      success: false,
      message:
        "Não foi possível preparar o convite de acesso profissional.",
    };
  }

  const admin = createAdminClient();

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        professional_name: barber.name,
        access_area: "barbeiro",
      },
      redirectTo: `${appUrl}/barbeiro/auth/convite`,
    });

  if (inviteError || !inviteData.user) {
    console.error(
      "Erro ao provisionar acesso profissional:",
      inviteError
    );

    return {
      success: false,
      message:
        "Não foi possível enviar o convite. Verifique se este e-mail já possui uma conta de acesso.",
    };
  }

  const invitedUserId = inviteData.user.id;

  const { data: linkedBarber, error: linkError } = await supabase
    .from("barbers")
    .update({
      auth_user_id: invitedUserId,
    })
    .eq("id", barber.id)
    .is("auth_user_id", null)
    .select("id")
    .maybeSingle();

  if (linkError || !linkedBarber) {
    console.error(
      "Erro ao vincular acesso profissional:",
      linkError
    );

    const { error: cleanupError } =
      await admin.auth.admin.deleteUser(invitedUserId);

    if (cleanupError) {
      console.error(
        "Erro ao remover identidade profissional não vinculada:",
        cleanupError
      );
    }

    return {
      success: false,
      message:
        "O convite foi iniciado, mas não foi possível concluir o vínculo do acesso profissional.",
    };
  }

  revalidatePath("/admin/barbeiros");
  revalidatePath(`/admin/barbeiros/${barber.id}`);

  return {
    success: true,
    message:
      "Acesso profissional provisionado. O convite para definir a senha foi enviado.",
  };
}