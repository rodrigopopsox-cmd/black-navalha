import { createClient } from "@/lib/supabase/server";

import PlanForm from "../plan-form";

type CapacityGroup = {
  id: string;
  code: string;
  name: string;
  per_barber_capacity: number;
};

type Service = {
  id: string;
  name: string;
};

export default async function NovoPlanoPage() {
  const supabase = await createClient();

  const [groupsResult, servicesResult] = await Promise.all([
    supabase
      .from("subscription_capacity_groups")
      .select("id, code, name, per_barber_capacity")
      .eq("active", true)
      .order("name", { ascending: true }),

    supabase
      .from("services")
      .select("id, name")
      .eq("subscriber_service", true)
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  const groups = (groupsResult.data ?? []) as CapacityGroup[];
  const services = (servicesResult.data ?? []) as Service[];

  return (
    <PlanForm
      mode="create"
      groups={groups}
      services={services}
    />
  );
}