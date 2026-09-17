"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type LinkCustomerState = {
  error?: string;
};

export async function linkCustomerAccount(): Promise<LinkCustomerState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sua sessão não é válida. Entre novamente." };
  }

  if (!user.email || !user.email_confirmed_at) {
    return { error: "Confirme seu e-mail antes de acessar sua assinatura." };
  }

  const { data, error } = await supabase.rpc("claim_customer_identity");

  if (error) {
    return { error: "Não foi possível validar seu acesso agora." };
  }

  if (data !== "linked") {
    return {
      error:
        "Não foi possível vincular seu acesso automaticamente. Entre em contato com a Black Navalha.",
    };
  }

  redirect("/minha-assinatura");
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/minha-assinatura/entrar");
}
