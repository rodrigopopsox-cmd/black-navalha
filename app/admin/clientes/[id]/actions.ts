"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProvisionCustomerAccessResult = {
  success: boolean;
  message: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function provisionCustomerAccess(
  customerIdInput: string
): Promise<ProvisionCustomerAccessResult> {
  const customerId = customerIdInput?.trim() ?? "";

  if (!UUID_PATTERN.test(customerId)) {
    return {
      success: false,
      message: "Cliente inválido.",
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
      .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    return {
      success: false,
      message: "Você não tem permissão para provisionar acesso de clientes.",
    };
  }

  const { data: customer, error: customerError } =
    await supabase
      .from("customers")
      .select("id, name, email, auth_user_id")
      .eq("id", customerId)
      .maybeSingle();

  if (customerError || !customer) {
    return {
      success: false,
      message: "Cliente não encontrado.",
    };
  }

  if (customer.auth_user_id) {
    return {
      success: false,
      message: "Este cliente já possui acesso à Central configurado.",
    };
  }

  const email = customer.email?.trim().toLowerCase() ?? "";

  if (!EMAIL_PATTERN.test(email)) {
    return {
      success: false,
      message:
        "Cadastre um e-mail válido no cliente antes de provisionar o acesso.",
    };
  }

  let appUrl: string;

  try {
    appUrl = getAppUrl();
  } catch (error) {
    console.error(
      "Erro na configuração da URL para convite do cliente:",
      error
    );

    return {
      success: false,
      message:
        "Não foi possível preparar o convite. Revise a configuração da aplicação.",
    };
  }

  const admin = createAdminClient();

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        customer_name: customer.name,
        access_area: "cliente",
      },
      redirectTo: `${appUrl}/minha-assinatura/auth/convite`,
    });

  if (inviteError || !inviteData.user) {
    console.error(
      "Erro ao provisionar acesso do cliente:",
      inviteError
    );

    return {
      success: false,
      message:
        "Não foi possível enviar o convite. Verifique se este e-mail já possui uma conta de acesso.",
    };
  }

  const invitedUserId = inviteData.user.id;

  const { data: linkedCustomer, error: linkError } =
    await supabase
      .from("customers")
      .update({
        auth_user_id: invitedUserId,
      })
      .eq("id", customer.id)
      .is("auth_user_id", null)
      .select("id")
      .maybeSingle();

  if (linkError || !linkedCustomer) {
    console.error(
      "Erro ao vincular acesso do cliente:",
      linkError
    );

    const { error: cleanupError } =
      await admin.auth.admin.deleteUser(invitedUserId);

    if (cleanupError) {
      console.error(
        "Erro ao remover identidade de cliente não vinculada:",
        cleanupError
      );
    }

    return {
      success: false,
      message:
        "O convite foi iniciado, mas não foi possível concluir o vínculo da Central do Cliente.",
    };
  }

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${customer.id}`);

  return {
    success: true,
    message:
      "Acesso à Central provisionado. O convite para definir a senha foi enviado ao e-mail do cliente.",
  };
}