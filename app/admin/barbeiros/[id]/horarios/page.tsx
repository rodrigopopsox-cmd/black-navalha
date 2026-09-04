import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import WorkingHoursForm from "./working-hours-form";

export default async function HorariosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: barber } = await supabase
    .from("barbers")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!barber) {
    notFound();
  }

  const { data: hours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("barber_id", id)
    .order("day_of_week");

  return (
    <WorkingHoursForm
      barber={barber}
      existingHours={hours ?? []}
    />
  );
}