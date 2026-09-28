import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import BarberEditForm from "./barber-edit-form";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarBarbeiroPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: barber, error } = await supabase
    .from("barbers")
    .select(`
      id,
      name,
      phone,
      active,
      subscription_commission_rate,
      service_commission_rate,
      auth_user_id
    `)
    .eq("id", id)
    .single();

  if (error || !barber) {
    notFound();
  }

  return (
    <BarberEditForm
      barber={{
        id: barber.id,
        name: barber.name,
        phone: barber.phone,
        active: barber.active,
        subscriptionCommissionRate:
          Number(barber.subscription_commission_rate),
        serviceCommissionRate:
          Number(barber.service_commission_rate),
        accessConfigured: Boolean(barber.auth_user_id),
      }}
    />
  );
}