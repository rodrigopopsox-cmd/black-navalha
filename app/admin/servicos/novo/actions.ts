"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type CreateServiceInput = {
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  description: string;
  subscriberService: boolean;
  active: boolean;
};

export type CreateServiceResult = {
  success: boolean;
  message: string;
  serviceId?: string;
};

export async function createService(
  input: CreateServiceInput
): Promise<CreateServiceResult> {
  const name = input.name?.trim();
  const category = input.category?.trim();
  const description = input.description?.trim() ?? "";
  const price = Number(input.price);
  const durationMinutes = Number(input.durationMinutes);

  if (!name || name.length < 2) {
    return {
      success: false,
      message: "Informe o nome do serviço.",
    };
  }

  if (!category) {
    return {
      success: false,
      message: "Informe a categoria do serviço.",
    };
  }

  if (!Number.isFinite(price) || price < 0) {
    return {
      success: false,
      message: "Informe um preço válido.",
    };
  }

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return {
      success: false,
      message: "Informe uma duração válida em minutos.",
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
      message: "Você não tem permissão para cadastrar serviços.",
    };
  }

  const { data: service, error: insertError } =
    await supabase
      .from("services")
      .insert({
        name,
        category,
        price,
        duration_minutes: durationMinutes,
        description: description || null,
        subscriber_service: Boolean(input.subscriberService),
        active: Boolean(input.active),
      })
      .select("id")
      .single();

  if (insertError) {
    console.error(
      "Erro ao cadastrar serviço:",
      insertError
    );

    return {
      success: false,
      message: "Não foi possível cadastrar o serviço.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/servicos");
  revalidatePath("/agendar");

  return {
    success: true,
    message: "Serviço cadastrado com sucesso.",
    serviceId: service.id,
  };
}
