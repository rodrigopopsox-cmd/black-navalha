"use server";

import { revalidatePath } from "next/cache";

import { getMyAppointments } from "@/lib/customer-auth/appointments";
import { createClient } from "@/lib/supabase/server";

export type CancelAppointmentState = {
  ok: boolean;
  message: string;
};

export type RescheduleBarber = {
  id: string;
  name: string;
  current: boolean;
};

export type RescheduleBarbersState = {
  ok: boolean;
  message: string;
  barbers: RescheduleBarber[];
};
export type RescheduleAvailabilityState = {
  ok: boolean;
  message: string;
  times: string[];
};

export type RescheduleAppointmentState = {
  ok: boolean;
  message: string;
};

type WorkingHour = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type BusyPeriod = {
  start_at: string;
  end_at: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

async function validateCustomerSession() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      supabase,
      message: "Sua sessão não é válida. Entre novamente.",
    };
  }

  if (!user.email_confirmed_at) {
    return {
      ok: false as const,
      supabase,
      message: "Confirme seu e-mail antes de gerenciar um agendamento.",
    };
  }

  return {
    ok: true as const,
    supabase,
  };
}

function getDayOfWeek(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day, 12).getDay();
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);

  return hour * 60 + minute;
}

function minutesToTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function createSaoPauloAppointmentDate(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`);
}

function generateAvailableTimes(
  date: string,
  workingHour: WorkingHour,
  duration: number,
  busyPeriods: BusyPeriod[]
) {
  const startMinutes = timeToMinutes(workingHour.start_time);
  const endMinutes = timeToMinutes(workingHour.end_time);
  const interval = 15;
  const slots: string[] = [];

  for (
    let start = startMinutes;
    start + duration <= endMinutes;
    start += interval
  ) {
    const end = start + duration;

    const slotStart = createSaoPauloAppointmentDate(
      date,
      minutesToTime(start)
    );

    const slotEnd = createSaoPauloAppointmentDate(
      date,
      minutesToTime(end)
    );

    if (
      Number.isNaN(slotStart.getTime()) ||
      Number.isNaN(slotEnd.getTime()) ||
      slotStart.getTime() <= Date.now()
    ) {
      continue;
    }

    const conflict = busyPeriods.some((period) => {
      const busyStart = new Date(period.start_at);
      const busyEnd = new Date(period.end_at);

      return slotStart < busyEnd && slotEnd > busyStart;
    });

    if (!conflict) {
      slots.push(minutesToTime(start));
    }
  }

  return slots;
}

export async function getMyAppointmentRescheduleBarbers(
  appointmentId: string
): Promise<RescheduleBarbersState> {
  if (!UUID_PATTERN.test(appointmentId)) {
    return { ok: false, message: "Agendamento inválido.", barbers: [] };
  }

  const session = await validateCustomerSession();

  if (!session.ok) {
    return { ok: false, message: session.message, barbers: [] };
  }

  const { data, error } = await session.supabase.rpc(
    "get_my_appointment_reschedule_barbers",
    { p_appointment_id: appointmentId }
  );

  if (error) {
    return {
      ok: false,
      message: "Não foi possível consultar os profissionais disponíveis.",
      barbers: [],
    };
  }

  const barbers = (Array.isArray(data) ? data : []).map((barber) => ({
    id: String(barber.id),
    name: String(barber.name),
    current: barber.current === true,
  }));

  return {
    ok: true,
    message:
      barbers.length > 0
        ? ""
        : "Nenhum profissional está disponível para este atendimento.",
    barbers,
  };
}
export async function getMyAppointmentRescheduleAvailability(
  appointmentId: string,
  barberId: string,
  date: string
): Promise<RescheduleAvailabilityState> {
  if (
    !UUID_PATTERN.test(appointmentId) ||
    !UUID_PATTERN.test(barberId) ||
    !DATE_PATTERN.test(date)
  ) {
    return {
      ok: false,
      message: "Data ou agendamento inválido.",
      times: [],
    };
  }

  const session = await validateCustomerSession();

  if (!session.ok) {
    return {
      ok: false,
      message: session.message,
      times: [],
    };
  }

  const { data: allowedBarbers, error: allowedBarbersError } =
    await session.supabase.rpc("get_my_appointment_reschedule_barbers", {
      p_appointment_id: appointmentId,
    });

  const barberIsAllowed =
    !allowedBarbersError &&
    Array.isArray(allowedBarbers) &&
    allowedBarbers.some((barber) => String(barber.id) === barberId);

  if (!barberIsAllowed) {
    return {
      ok: false,
      message: "O profissional escolhido não está disponível para este atendimento.",
      times: [],
    };
  }
  const appointments = await getMyAppointments();
  const ownAppointment = appointments.find(
    (appointment) => appointment.id === appointmentId
  );

  if (
    !ownAppointment ||
    !["scheduled", "confirmed"].includes(ownAppointment.status)
  ) {
    return {
      ok: false,
      message: "Agendamento não encontrado ou não pode ser remarcado.",
      times: [],
    };
  }

  const millisecondsUntilStart =
    new Date(ownAppointment.start_at).getTime() - Date.now();

  if (millisecondsUntilStart < 60 * 60 * 1000) {
    return {
      ok: false,
      message:
        "A remarcação exige pelo menos 1 hora de antecedência.",
      times: [],
    };
  }

  const duration = Math.round(
    (new Date(ownAppointment.end_at).getTime() -
      new Date(ownAppointment.start_at).getTime()) /
      60000
  );

  if (!ownAppointment.barber_id || duration <= 0) {
    return {
      ok: false,
      message: "Os dados deste atendimento não estão disponíveis.",
      times: [],
    };
  }

  const dayOfWeek = getDayOfWeek(date);

  const { data: workingHourData, error: workingHourError } =
    await session.supabase
      .from("working_hours")
      .select("day_of_week, start_time, end_time")
      .eq("barber_id", barberId)
      .eq("day_of_week", dayOfWeek)
      .eq("active", true)
      .maybeSingle();

  if (workingHourError) {
    return {
      ok: false,
      message: "Não foi possível consultar a jornada do profissional.",
      times: [],
    };
  }

  if (!workingHourData) {
    return {
      ok: true,
      message: "O profissional não atende nesta data.",
      times: [],
    };
  }

  const { data: busyData, error: busyError } = await session.supabase.rpc(
    "get_busy_periods",
    {
      p_barber_id: barberId,
      p_date: date,
    }
  );

  if (busyError) {
    return {
      ok: false,
      message: "Não foi possível consultar os horários disponíveis.",
      times: [],
    };
  }

  const currentStart = new Date(ownAppointment.start_at).getTime();
  const currentEnd = new Date(ownAppointment.end_at).getTime();

  let removedOwnInterval = false;

  const busyPeriods = (Array.isArray(busyData) ? busyData : [])
    .map((period) => ({
      start_at: String(period.start_at),
      end_at: String(period.end_at),
    }))
    .filter((period) => {
      const matchesOwnInterval =
        new Date(period.start_at).getTime() === currentStart &&
        new Date(period.end_at).getTime() === currentEnd;

      if (matchesOwnInterval && !removedOwnInterval) {
        removedOwnInterval = true;
        return false;
      }

      return true;
    });

  const times = generateAvailableTimes(
    date,
    {
      day_of_week: Number(workingHourData.day_of_week),
      start_time: String(workingHourData.start_time),
      end_time: String(workingHourData.end_time),
    },
    duration,
    busyPeriods
  );

  return {
    ok: true,
    message:
      times.length > 0
        ? ""
        : "Não há horários disponíveis nesta data.",
    times,
  };
}

export async function rescheduleMyAppointment(
  appointmentId: string,
  barberId: string,
  newStartAt: string
): Promise<RescheduleAppointmentState> {
  if (
    !UUID_PATTERN.test(appointmentId) ||
    !UUID_PATTERN.test(barberId) ||
    !newStartAt ||
    Number.isNaN(new Date(newStartAt).getTime())
  ) {
    return {
      ok: false,
      message: "Novo horário inválido.",
    };
  }

  const session = await validateCustomerSession();

  if (!session.ok) {
    return {
      ok: false,
      message: session.message,
    };
  }

  const { data, error } = await session.supabase.rpc(
    "reschedule_my_appointment",
    {
      p_appointment_id: appointmentId,
      p_barber_id: barberId,
      p_start_at: newStartAt,
    }
  );

  if (error) {
    const errorMessage =
      `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

    if (errorMessage.includes("customer rescheduling deadline exceeded")) {
      return {
        ok: false,
        message:
          "A remarcação é permitida somente com pelo menos 1 hora de antecedência.",
      };
    }

    if (errorMessage.includes("appointment already started")) {
      return {
        ok: false,
        message: "Este atendimento já começou e não pode ser remarcado.",
      };
    }

    if (
      errorMessage.includes(
        "appointment status does not allow customer rescheduling"
      )
    ) {
      return {
        ok: false,
        message: "O status atual deste agendamento não permite remarcação.",
      };
    }

    if (errorMessage.includes("appointment not found")) {
      return {
        ok: false,
        message: "Agendamento não encontrado ou não pertence à sua conta.",
      };
    }

    if (
      errorMessage.includes("new appointment time just became unavailable") ||
      errorMessage.includes("new appointment time unavailable")
    ) {
      return {
        ok: false,
        message:
          "Este horário não está mais disponível. Escolha outro horário.",
      };
    }

    if (
      errorMessage.includes("subscription appointment barber change not allowed")
    ) {
      return {
        ok: false,
        message:
          "Este atendimento usa benefício da assinatura e deve permanecer com o profissional do ciclo atual.",
      };
    }

    if (
      errorMessage.includes("barber does not provide all appointment services")
    ) {
      return {
        ok: false,
        message:
          "O profissional escolhido não realiza todos os serviços deste atendimento.",
      };
    }

    if (errorMessage.includes("barber unavailable")) {
      return {
        ok: false,
        message: "O profissional escolhido não está disponível.",
      };
    }
    if (
      errorMessage.includes("new appointment time outside barber working hours")
    ) {
      return {
        ok: false,
        message: "O novo horário está fora da jornada do profissional.",
      };
    }

    if (errorMessage.includes("new appointment time must be in the future")) {
      return {
        ok: false,
        message: "Escolha um horário futuro.",
      };
    }

    if (
      errorMessage.includes("authentication required") ||
      errorMessage.includes("email confirmation required") ||
      errorMessage.includes("customer identity not linked")
    ) {
      return {
        ok: false,
        message: "Não foi possível validar sua identidade. Entre novamente.",
      };
    }

    return {
      ok: false,
      message: "Não foi possível remarcar o agendamento agora.",
    };
  }

  if (data !== "rescheduled" && data !== "unchanged") {
    return {
      ok: false,
      message: "Não foi possível confirmar a remarcação.",
    };
  }

  revalidatePath("/minha-assinatura");

  return {
    ok: true,
    message:
      data === "unchanged"
        ? "O agendamento já está neste horário."
        : "Agendamento remarcado com sucesso.",
  };
}

export async function cancelMyAppointment(
  appointmentId: string
): Promise<CancelAppointmentState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Sua sessão não é válida. Entre novamente.",
    };
  }

  if (!user.email_confirmed_at) {
    return {
      ok: false,
      message: "Confirme seu e-mail antes de cancelar um agendamento.",
    };
  }

  const { data, error } = await supabase.rpc("cancel_my_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    const errorMessage =
      `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

    if (errorMessage.includes("customer cancellation deadline exceeded")) {
      return {
        ok: false,
        message:
          "O cancelamento pelo cliente é permitido somente com pelo menos 1 hora de antecedência.",
      };
    }

    if (errorMessage.includes("appointment already started")) {
      return {
        ok: false,
        message: "Este horário já começou e não pode mais ser cancelado.",
      };
    }

    if (
      errorMessage.includes(
        "appointment status does not allow customer cancellation"
      )
    ) {
      return {
        ok: false,
        message: "O status atual deste agendamento não permite cancelamento.",
      };
    }

    if (errorMessage.includes("appointment not found")) {
      return {
        ok: false,
        message: "Agendamento não encontrado ou não pertence à sua conta.",
      };
    }

    if (
      errorMessage.includes("authentication required") ||
      errorMessage.includes("email confirmation required") ||
      errorMessage.includes("customer identity not linked")
    ) {
      return {
        ok: false,
        message: "Não foi possível validar sua identidade. Entre novamente.",
      };
    }

    return {
      ok: false,
      message: "Não foi possível cancelar o agendamento agora.",
    };
  }

  if (data !== "cancelled" && data !== "already_cancelled") {
    return {
      ok: false,
      message: "Não foi possível confirmar o cancelamento.",
    };
  }

  revalidatePath("/minha-assinatura");

  return {
    ok: true,
    message:
      data === "already_cancelled"
        ? "Este agendamento já estava cancelado."
        : "Agendamento cancelado com sucesso.",
  };
}
