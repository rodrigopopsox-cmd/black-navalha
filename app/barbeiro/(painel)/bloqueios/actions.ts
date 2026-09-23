"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type BlockActionState = {
  success: boolean;
  message: string;
};

async function getAuthenticatedClient() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    throw new Error("Sessão profissional inválida.");
  }

  return supabase;
}

export async function createBarberBlock(
  startAt: string,
  endAt: string,
  reason: string
): Promise<BlockActionState> {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return {
      success: false,
      message: "Informe um período válido.",
    };
  }

  if (end <= start) {
    return {
      success: false,
      message: "O fim deve ser posterior ao início.",
    };
  }

  const supabase = await getAuthenticatedClient();

  const { error } = await supabase.rpc(
    "create_my_barber_block",
    {
      p_start_at: start.toISOString(),
      p_end_at: end.toISOString(),
      p_reason: reason.trim() || null,
    }
  );

  if (error) {
    console.error(
      "Erro ao criar bloqueio do barbeiro:",
      error.message
    );

    const message = error.message.includes(
      "cannot create a block already ended"
    )
      ? "Não é possível criar um bloqueio que já terminou."
      : "Não foi possível criar o bloqueio.";

    return {
      success: false,
      message,
    };
  }

  revalidatePath("/barbeiro");
  revalidatePath("/barbeiro/agenda");
  revalidatePath("/barbeiro/bloqueios");

  return {
    success: true,
    message: "Bloqueio criado com sucesso.",
  };
}

export async function deleteBarberBlock(
  blockId: string
): Promise<BlockActionState> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      blockId
    )
  ) {
    return {
      success: false,
      message: "Bloqueio inválido.",
    };
  }

  const supabase = await getAuthenticatedClient();

  const { error } = await supabase.rpc(
    "delete_my_barber_block",
    {
      p_block_id: blockId,
    }
  );

  if (error) {
    console.error(
      "Erro ao excluir bloqueio do barbeiro:",
      error.message
    );

    return {
      success: false,
      message: "Não foi possível excluir o bloqueio.",
    };
  }

  revalidatePath("/barbeiro");
  revalidatePath("/barbeiro/agenda");
  revalidatePath("/barbeiro/bloqueios");

  return {
    success: true,
    message: "Bloqueio excluído com sucesso.",
  };
}