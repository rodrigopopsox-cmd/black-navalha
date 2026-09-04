import { createClient } from "@/lib/supabase/server";
import SubscriptionForm from "./subscription-form";

export default async function NovaAssinaturaPage() {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, category, duration_minutes")
    .eq("active", true)
    .eq("subscriber_service", true)
    .order("name");

  if (error) {
    return (
      <main className="admin-page">
        <div className="admin-error">
          Não foi possível carregar os serviços de assinatura:{" "}
          {error.message}
        </div>
      </main>
    );
  }

  return <SubscriptionForm services={services ?? []} />;
}