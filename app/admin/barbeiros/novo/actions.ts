"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateBarberInput = {
  name: string;
  phone: string;
  active: boolean;
  subscriptionCommissionRate: number;
  serviceCommissionRate: number;
  accessEmail: string;
};

export type CreateBarberResult = {
  success: boolean;
  message: string;
  barberCreated?: boolean;
  accessProvisioned?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
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

export async function createBarber(
  input: CreateBarberInput
): Promise<CreateBarberResult> {
  const name = input.name?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const phoneDigits = normalizePhone(phone);
  const accessEmail = input.accessEmail?.trim().toLowerCase() ?? "";
  const subscriptionCommissionRate = input.subscriptionCommissionRate;
  const serviceCommissionRate = input.serviceCommissionRate;

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
      message: "Informe um WhatsApp profissional válido.",
    };
  }

  if (
    !Number.isFinite(subscriptionCommissionRate) ||
    subscriptionCommissionRate < 0 ||
    subscriptionCommissionRate > 100
  ) {
    return {
      success: false,
      message: "Informe uma comissão de assinatura entre 0% e 100%.",
    };
  }

  if (
    !Number.isFinite(serviceCommissionRate) ||
    serviceCommissionRate < 0 ||
    serviceCommissionRate > 100
  ) {
    return {
      success: false,
      message: "Informe uma comissão de serviços entre 0% e 100%.",
    };
  }

  if (!EMAIL_PATTERN.test(accessEmail)) {
    return {
      success: false,
      message: "Informe um e-mail profissional válido.",
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return {
      success: false,
      message: "Você não tem permissão para cadastrar barbeiros.",
    };
  }

  const { data: barber, error: insertError } = await supabase
    .from("barbers")
    .insert({
      name,
      phone: phoneDigits || null,
      active: input.active,
      subscription_commission_rate: subscriptionCommissionRate,
      service_commission_rate: serviceCommissionRate,
      auth_user_id: null,
    })
    .select("id")
    .single();

  if (insertError || !barber) {
    console.error("Erro ao cadastrar barbeiro:", insertError);

    return {
      success: false,
      message: "Não foi possível cadastrar o barbeiro.",
    };
  }

  let appUrl: string;

  try {
    appUrl = getAppUrl();
  } catch (error) {
    console.error("Erro na configuração da URL da aplicação:", error);

    revalidatePath("/admin");
    revalidatePath("/admin/barbeiros");

    return {
      success: false,
      barberCreated: true,
      accessProvisioned: false,
      message:
        "O barbeiro foi cadastrado, mas o acesso profissional não pôde ser provisionado. Revise a configuração da aplicação e tente provisionar o acesso pela edição do profissional.",
    };
  }

  const admin = createAdminClient();

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(accessEmail, {
      data: {
        professional_name: name,
        access_area: "barbeiro",
      },
      redirectTo: `${appUrl}/barbeiro/auth/convite`,
    });

  if (inviteError || !inviteData.user) {
    console.error("Erro ao convidar acesso profissional:", inviteError);

    revalidatePath("/admin");
    revalidatePath("/admin/barbeiros");

    return {
      success: false,
      barberCreated: true,
      accessProvisioned: false,
      message:
        "O barbeiro foi cadastrado, mas o convite de acesso não pôde ser enviado. O cadastro foi preservado para novo provisionamento.",
    };
  }

  const invitedUserId = inviteData.user.id;

  const { error: linkError } = await supabase
    .from("barbers")
    .update({
      auth_user_id: invitedUserId,
    })
    .eq("id", barber.id);

  if (linkError) {
    console.error("Erro ao vincular identidade profissional:", linkError);

    const { error: cleanupError } =
      await admin.auth.admin.deleteUser(invitedUserId);

    if (cleanupError) {
      console.error(
        "Erro ao remover identidade profissional não vinculada:",
        cleanupError
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/barbeiros");

    return {
      success: false,
      barberCreated: true,
      accessProvisioned: false,
      message:
        "O barbeiro foi cadastrado, mas não foi possível concluir o vínculo do acesso profissional. O cadastro foi preservado.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/barbeiros");
  revalidatePath(`/admin/barbeiros/${barber.id}`);

  return {
    success: true,
    barberCreated: true,
    accessProvisioned: true,
    message:
      "Barbeiro cadastrado. O convite para definir a senha foi enviado ao e-mail profissional.",
  };
}