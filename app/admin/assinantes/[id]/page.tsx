import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import SubscriptionEditForm from "./subscription-edit-form";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarAssinaturaPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: subscription,
    error: subscriptionError,
  } = await supabase
    .from("subscriptions")
    .select(`
      id,
      name,
      status,
      starts_at,
      expires_at,
      customer_id,
      customers (
        id,
        name,
        phone
      ),
      subscription_services (
        service_id
      )
    `)
    .eq("id", id)
    .single();

  if (
    subscriptionError ||
    !subscription
  ) {
    notFound();
  }

  const {
    data: services,
    error: servicesError,
  } = await supabase
    .from("services")
    .select(`
      id,
      name,
      category,
      duration_minutes
    `)
    .eq("active", true)
    .eq("subscriber_service", true)
    .order("name");

  if (servicesError) {
    return (
      <main className="admin-page">
        <div className="admin-error">
          Não foi possível carregar os serviços:{" "}
          {servicesError.message}
        </div>
      </main>
    );
  }

  const customer = Array.isArray(
    subscription.customers
  )
    ? subscription.customers[0]
    : subscription.customers;

  const selectedServiceIds =
    (
      subscription.subscription_services ??
      []
    ).map(
      (item) => item.service_id
    );

  return (
    <SubscriptionEditForm
      subscription={{
        id: subscription.id,

        customerId:
          subscription.customer_id,

        customerName:
          customer?.name ?? "",

        phone:
          customer?.phone ?? "",

        planName:
          subscription.name,

        status:
          subscription.status,

        startsAt:
          subscription.starts_at,

        expiresAt:
          subscription.expires_at ?? "",

        selectedServiceIds,
      }}
      services={services ?? []}
    />
  );
}