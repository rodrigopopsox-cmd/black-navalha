import { notFound } from "next/navigation";

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

type Plan = {
  id: string;
  name: string;
  price: number | string;
  active: boolean;
  capacity_group_id: string;
};

type PlanService = {
  service_id: string;
};

export default async function EditarPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    planResult,
    groupsResult,
    servicesResult,
    linksResult,
  ] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select(`
        id,
        name,
        price,
        active,
        capacity_group_id
      `)
      .eq("id", id)
      .maybeSingle(),

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

    supabase
      .from("subscription_plan_services")
      .select("service_id")
      .eq("plan_id", id),
  ]);

  if (!planResult.data) {
    notFound();
  }

  const plan = planResult.data as Plan;
  const groups = (groupsResult.data ?? []) as CapacityGroup[];
  const services = (servicesResult.data ?? []) as Service[];
  const links = (linksResult.data ?? []) as PlanService[];

  return (
    <PlanForm
      mode="edit"
      groups={groups}
      services={services}
      initialPlan={{
        id: plan.id,
        name: plan.name,
        price: plan.price,
        active: plan.active,
        capacity_group_id: plan.capacity_group_id,
        service_ids: links.map((link) => link.service_id),
      }}
    />
  );
}