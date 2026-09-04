import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BarberServicesForm from "./barber-services-form";

export default async function BarberServicesPage({
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

  const { data: services, error: servicesError } =
    await supabase
      .from("services")
      .select(
        "id, name, category, price, duration_minutes, subscriber_service"
      )
      .eq("active", true)
      .order("category")
      .order("name");

  if (servicesError) {
    throw new Error(servicesError.message);
  }

  const { data: linkedServices } = await supabase
    .from("barber_services")
    .select("service_id")
    .eq("barber_id", id);

  const selectedIds =
    linkedServices?.map((item) => item.service_id) ?? [];

  return (
    <BarberServicesForm
      barber={barber}
      services={services ?? []}
      initiallySelected={selectedIds}
    />
  );
}