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

export type AppointmentActionResult = {
  success: boolean;
  message: string;
};

async function getAdminClient() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
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
    return null;
  }

  return supabase;
}

function refreshAgenda() {
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/barbeiro");
  revalidatePath("/barbeiro/agenda");
  revalidatePath("/barbeiro/comissoes");
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<AppointmentActionResult> {
  if (
    !appointmentId ||
    !APPOINTMENT_STATUSES.includes(status)
  ) {
    return {
      success: false,
      message: "Dados do agendamento inválidos.",
    };
  }

  const supabase = await getAdminClient();

  if (!supabase) {
    return {
      success: false,
      message: "Sessão administrativa inválida.",
    };
  }

  const { data: appointment, error: appointmentError } =
    await supabase
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
    .update({ status })
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

  refreshAgenda();

  return {
    success: true,
    message: "Status atualizado com sucesso.",
  };
}

export async function rescheduleAdminAppointment(
  appointmentId: string,
  startAt: string
): Promise<AppointmentActionResult> {
  if (!appointmentId || !startAt) {
    return {
      success: false,
      message: "Informe o novo horário.",
    };
  }

  const candidate = new Date(startAt);

  if (Number.isNaN(candidate.getTime())) {
    return {
      success: false,
      message: "Informe um horário válido.",
    };
  }

  const supabase = await getAdminClient();

  if (!supabase) {
    return {
      success: false,
      message: "Sessão administrativa inválida.",
    };
  }

  const { data, error } = await supabase.rpc(
    "reschedule_admin_appointment",
    {
      p_appointment_id: appointmentId,
      p_start_at: candidate.toISOString(),
    }
  );

  if (error) {
    const value =
      `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

    if (value.includes("appointment not found")) {
      return {
        success: false,
        message: "Agendamento não encontrado.",
      };
    }

    if (value.includes("status does not allow rescheduling")) {
      return {
        success: false,
        message: "O status atual não permite remarcação.",
      };
    }

    if (value.includes("outside barber working hours")) {
      return {
        success: false,
        message: "O novo horário está fora da jornada do profissional.",
      };
    }

    if (
      value.includes("new appointment time unavailable") ||
      value.includes("just became unavailable") ||
      value.includes("exclusion")
    ) {
      return {
        success: false,
        message: "O horário está bloqueado ou já ficou ocupado.",
      };
    }

    return {
      success: false,
      message: "Não foi possível remarcar o agendamento agora.",
    };
  }

  refreshAgenda();

  return {
    success: true,
    message:
      data === "unchanged"
        ? "O agendamento já estava neste horário."
        : "Agendamento remarcado com sucesso.",
  };
}