import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import ServiceEditForm from "./service-edit-form";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarServicoPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: service, error } = await supabase
    .from("services")
    .select(`
      id,
      name,
      description,
      category,
      price,
      duration_minutes,
      subscriber_service,
      active
    `)
    .eq("id", id)
    .single();

  if (error || !service) {
    notFound();
  }

  return (
    <ServiceEditForm
      service={{
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        duration_minutes: service.duration_minutes,
        subscriber_service: service.subscriber_service,
        active: service.active,
      }}
    />
  );
}
