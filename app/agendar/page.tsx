import { createClient } from "@/lib/supabase/server";
import BookingFlow from "./booking-flow";

export default async function AgendarPage() {
  const supabase = await createClient();

  const {
    data: services,
    error: servicesError,
  } = await supabase
    .from("services")
    .select(
      "id, name, description, category, price, duration_minutes, subscriber_service"
    )
    .eq("active", true)
    .order("category")
    .order("name");

  const {
    data: barbers,
    error: barbersError,
  } = await supabase
    .from("barbers")
    .select("id, name, photo_url")
    .eq("active", true)
    .order("name");

  const {
    data: links,
    error: linksError,
  } = await supabase
    .from("barber_services")
    .select("barber_id, service_id");

  if (
    servicesError ||
    barbersError ||
    linksError
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#070707",
          color: "white",
          padding: "50px",
        }}
      >
        Não foi possível carregar o agendamento.
      </main>
    );
  }

  return (
    <BookingFlow
      services={services ?? []}
      barbers={barbers ?? []}
      links={links ?? []}
    />
  );
}