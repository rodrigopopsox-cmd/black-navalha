"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type BarberAppointmentStatus =
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type BarberAppointmentActionResult = {
  ok: boolean;
  message: string;
};

const ALLOWED_STATUSES: BarberAppointmentStatus[] = [
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

async function getAuthenticatedClient() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email_confirmed_at) {
    return null;
  }

  return supabase;
}

function refreshBarberOperation() {
  revalidatePath("/barbeiro");
  revalidatePath("/barbeiro/agenda");
  revalidatePath("/barbeiro/comissoes");
}

export async function updateMyBarberAppointmentStatus(
  appointmentId: string,
  status: BarberAppointmentStatus
): Promise<BarberAppointmentActionResult> {
  if (
    !appointmentId ||
    !ALLOWED_STATUSES.includes(status)
  ) {
    return {
      ok: false,
      message: "Dados do atendimento inválidos.",
    };
  }

  const supabase = await getAuthenticatedClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Sua sessão profissional não é válida. Entre novamente.",
    };
  }

  const { error } = await supabase.rpc(
    "update_my_barber_appointment_status",
    {
      p_appointment_id: appointmentId,
      p_status: status,
    }
  );

  if (error) {
    const value = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

    if (value.includes("appointment not found")) {
      return {
        ok: false,
        message: "Atendimento não encontrado ou não pertence à sua agenda.",
      };
    }

    if (value.includes("appointment status transition not allowed")) {
      return {
        ok: false,
        message: "O status atual não permite esta alteração.",
      };
    }

    return {
      ok: false,
      message: "Não foi possível atualizar o atendimento agora.",
    };
  }

  refreshBarberOperation();

  return {
    ok: true,
    message: "Atendimento atualizado com sucesso.",
  };
}

export async function rescheduleMyBarberAppointment(
  appointmentId: string,
  startAt: string
): Promise<BarberAppointmentActionResult> {
  if (!appointmentId || !startAt) {
    return {
      ok: false,
      message: "Informe o novo horário.",
    };
  }

  const candidate = new Date(startAt);

  if (Number.isNaN(candidate.getTime())) {
    return {
      ok: false,
      message: "Informe um horário válido.",
    };
  }

  const supabase = await getAuthenticatedClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Sua sessão profissional não é válida. Entre novamente.",
    };
  }

  const { data, error } = await supabase.rpc(
    "reschedule_my_barber_appointment",
    {
      p_appointment_id: appointmentId,
      p_start_at: candidate.toISOString(),
    }
  );

  if (error) {
    const value = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

if (value.includes("appointment not found")) {
      return {
        ok: false,
        message: "Atendimento não encontrado ou não pertence à sua agenda.",
      };
    }

    if (value.includes("appointment already started")) {
      return {
        ok: false,
        message: "Este atendimento já começou e não pode ser remarcado.",
      };
    }

    if (
      value.includes("appointment status does not allow barber rescheduling")
    ) {
      return {
        ok: false,
        message: "O status atual não permite remarcação.",
      };
    }

    if (value.includes("outside barber working hours")) {
      return {
        ok: false,
        message: "O novo horário está fora da sua jornada.",
      };
    }

    if (
      value.includes("new appointment time unavailable") ||
      value.includes("just became unavailable") ||
      value.includes("exclusion")
    ) {
      return {
        ok: false,
        message: "Este horário está bloqueado ou já ficou ocupado.",
      };
    }

    return {
      ok: false,
      message: "Não foi possível remarcar o atendimento agora.",
    };
  }

  refreshBarberOperation();

  return {
    ok: true,
    message:
      data === "unchanged"
        ? "O atendimento já estava neste horário."
        : "Atendimento remarcado com sucesso.",
  };
}