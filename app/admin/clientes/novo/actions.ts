"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type CreateCustomerInput = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export type CreateCustomerResult = {
  success: boolean;
  message: string;
  customerId?: string;
};

export async function createCustomer(
  input: CreateCustomerInput
): Promise<CreateCustomerResult> {
  const name = input.name?.trim();
  const phone = input.phone?.trim();
  const phoneDigits = phone.replace(/\D/g, "");
  const email = input.email?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";

  if (!name || name.length < 2) {
    return {
      success: false,
      message: "Informe o nome do cliente.",
    };
  }

  if (
    phoneDigits.length < 10 ||
    phoneDigits.length > 11
  ) {
    return {
      success: false,
      message: "Informe um WhatsApp válido.",
    };
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return {
      success: false,
      message: "Informe um e-mail válido.",
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
      message: "Você não tem permissão para cadastrar clientes.",
    };
  }

  const { data: customers, error: searchError } =
    await supabase
      .from("customers")
      .select("id, phone");

  if (searchError) {
    console.error(
      "Erro ao verificar cliente existente:",
      searchError
    );

    return {
      success: false,
      message: "Não foi possível verificar os clientes cadastrados.",
    };
  }

  const existingCustomer = customers?.find(
    (customer) =>
      normalizePhone(customer.phone) === phoneDigits
  );

  if (existingCustomer) {
    return {
      success: false,
      message: "Já existe um cliente cadastrado com este WhatsApp.",
    };
  }

  const { data: customer, error: insertError } =
    await supabase
      .from("customers")
      .insert({
        name,
        phone,
        email: email || null,
        notes: notes || null,
      })
      .select("id")
      .single();

  if (insertError) {
    console.error(
      "Erro ao cadastrar cliente:",
      insertError
    );

    return {
      success: false,
      message: "Não foi possível cadastrar o cliente.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clientes");

  return {
    success: true,
    message: "Cliente cadastrado com sucesso.",
    customerId: customer.id,
  };
}

function normalizePhone(phone: string) {
  let digits = phone.replace(/\D/g, "");

  if (
    digits.length >= 12 &&
    digits.startsWith("55")
  ) {
    digits = digits.slice(2);
  }

  return digits;
}
