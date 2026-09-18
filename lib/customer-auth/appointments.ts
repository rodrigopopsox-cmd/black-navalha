import "server-only";

import { createClient } from "@/lib/supabase/server";

export type MyAppointment = {
  id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  price: number;
  status: string;
  barber_name: string | null;
  services: Array<{
    name: string;
  }>;
};

export async function getMyAppointments(): Promise<MyAppointment[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email_confirmed_at) {
    return [];
  }

  const { data, error } = await supabase.rpc("get_my_appointments");

  if (error) {
    throw new Error("Não foi possível carregar seus agendamentos.");
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((appointment) => ({
    id: String(appointment.id),
    barber_id: String(appointment.barber_id),
    start_at: String(appointment.start_at),
    end_at: String(appointment.end_at),
    price: Number(appointment.price),
    status: String(appointment.status),
    barber_name:
      typeof appointment.barber_name === "string"
        ? appointment.barber_name
        : null,
    services: Array.isArray(appointment.services)
      ? appointment.services.map((service: { name?: unknown }) => ({
          name: String(service.name ?? ""),
        }))
      : [],
  }));
}
