"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type PlanActionInput = {
  name: string;
  price: number;
  capacityGroupId: string;
  serviceIds: string[];
  active: boolean;
  groupCapacity?: number;
};

export type PlanActionResult = {
  success: boolean;
  message: string;
  planId?: string;
};

async function getAdminClient() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return null;
  }

  return supabase;
}

function validate(input: PlanActionInput) {
  if (input.name.trim().length < 2) {
    return "Informe o nome do plano.";
  }

  if (
    !Number.isFinite(input.price) ||
    input.price <= 0
  ) {
    return "Informe um preço válido.";
  }

  if (!input.capacityGroupId) {
    return "Selecione o grupo de capacidade.";
  }

  if (input.serviceIds.length === 0) {
    return "Selecione pelo menos um benefício.";
  }

  if (
    input.groupCapacity !== undefined &&
    (!Number.isInteger(input.groupCapacity) ||
      input.groupCapacity <= 0)
  ) {
    return "Informe uma capacidade válida.";
  }

  return null;
}

export async function createPlan(
  input: PlanActionInput
): Promise<PlanActionResult> {
  const validationError = validate(input);

  if (validationError) {
    return {
      success: false,
      message: validationError,
    };
  }

  const supabase = await getAdminClient();

  if (!supabase) {
    return {
      success: false,
      message: "Acesso administrativo inválido.",
    };
  }

  const { data, error } = await supabase.rpc(
    "admin_create_subscription_plan",
    {
      p_name: input.name.trim(),
      p_price: input.price,
      p_capacity_group_id: input.capacityGroupId,
      p_service_ids: input.serviceIds,
      p_active: input.active,
    }
  );

  if (error) {
    console.error("Erro ao criar plano:", error);

    return {
      success: false,
      message: "Não foi possível criar o plano.",
    };
  }

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");

  return {
    success: true,
    message: "Plano criado com sucesso.",
    planId: String(data),
  };
}

export async function updatePlan(
  planId: string,
  input: PlanActionInput
): Promise<PlanActionResult> {
  if (!planId) {
    return {
      success: false,
      message: "Plano inválido.",
    };
  }

  const validationError = validate(input);

  if (validationError) {
    return {
      success: false,
      message: validationError,
    };
  }

  const supabase = await getAdminClient();

  if (!supabase) {
    return {
      success: false,
      message: "Acesso administrativo inválido.",
    };
  }

  const { error } = await supabase.rpc(
    "admin_update_subscription_plan",
    {
      p_plan_id: planId,
      p_name: input.name.trim(),
      p_price: input.price,
      p_capacity_group_id: input.capacityGroupId,
      p_service_ids: input.serviceIds,
      p_active: input.active,
      p_group_capacity: input.groupCapacity ?? null,
    }
  );

  if (error) {
    console.error("Erro ao atualizar plano:", error);

    const message = error.message ?? "";

    if (
      message.includes(
        "active barber capacity is lower"
      )
    ) {
      return {
        success: false,
        message:
          "A capacidade dos grupos ultrapassa a capacidade total de um barbeiro ativo.",
      };
    }

    return {
      success: false,
      message: "Não foi possível atualizar o plano.",
    };
  }

  revalidatePath("/admin/planos");
  revalidatePath(`/admin/planos/${planId}`);
  revalidatePath("/assinaturas");

  return {
    success: true,
    message: "Plano atualizado com sucesso.",
    planId,
  };
}