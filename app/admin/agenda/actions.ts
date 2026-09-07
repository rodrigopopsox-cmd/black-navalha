"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUSES)[number];

export type UpdateAppointmentStatusResult = {
  success: boolean;
  message: string;
};

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<UpdateAppointmentStatusResult> {
  if (
    !appointmentId ||
    !APPOINTMENT_STATUSES.includes(status)
  ) {
    return {
      success: false,
      message: "Dados do agendamento inválidos.",
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
      message: "Você não tem permissão para alterar agendamentos.",
    };
  }

  const {
    data: appointment,
    error: appointmentError,
  } = await supabase
    .from("appointments")
    .select("id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError) {
    console.error(
      "Erro ao validar agendamento:",
      appointmentError
    );

    return {
      success: false,
      message: "Não foi possível validar o agendamento.",
    };
  }

  if (!appointment) {
    return {
      success: false,
      message: "Agendamento não encontrado.",
    };
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      status,
    })
    .eq("id", appointmentId);

  if (updateError) {
    console.error(
      "Erro ao atualizar status do agendamento:",
      updateError
    );

    return {
      success: false,
      message: "Não foi possível atualizar o status.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/agenda");

  return {
    success: true,
    message: "Status atualizado com sucesso.",
  };
}
