import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import SubscriptionForm from "./subscription-form";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

type Plan = {
  id: string;
  name: string;
  price: number | string;
  billing_interval_months: number;
  grace_days: number;
  capacity_group_id: string | null;
};

type PlanService = {
  plan_id: string;
  service_id: string;
};

type Service = {
  id: string;
  name: string;
};

export default async function NovaAssinaturaPage() {
  const supabase = await createClient();

  const [
    customersResult,
    plansResult,
    linksResult,
    servicesResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, phone, email")
      .order("name", { ascending: true }),

    supabase
      .from("subscription_plans")
      .select(`
        id,
        name,
        price,
        billing_interval_months,
        grace_days,
        capacity_group_id
      `)
      .eq("active", true)
      .order("price", { ascending: true }),

    supabase
      .from("subscription_plan_services")
      .select("plan_id, service_id"),

    supabase
      .from("services")
      .select("id, name")
      .eq("active", true)
      .eq("subscriber_service", true)
      .order("name", { ascending: true }),
  ]);

  const loadError =
    customersResult.error ||
    plansResult.error ||
    linksResult.error ||
    servicesResult.error;

  if (loadError) {
    console.error(
      "Erro ao carregar Nova assinatura:",
      loadError
    );

    return (
      <main className="admin-page">
        <div className="admin-error">
          Não foi possível carregar os dados necessários para
          criar uma assinatura.
        </div>
      </main>
    );
  }

  const customers = (customersResult.data ?? []) as Customer[];
  const plans = (plansResult.data ?? []) as Plan[];
  const links = (linksResult.data ?? []) as PlanService[];
  const services = (servicesResult.data ?? []) as Service[];

  const serviceById = new Map(
    services.map((service) => [service.id, service.name])
  );

  const safePlans = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: Number(plan.price),
    billingIntervalMonths: plan.billing_interval_months,
    graceDays: plan.grace_days,
    benefits: links
      .filter((link) => link.plan_id === plan.id)
      .map((link) => serviceById.get(link.service_id))
      .filter((name): name is string => Boolean(name))
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  }));

  if (customers.length === 0 || safePlans.length === 0) {
    return (
      <main className="admin-page">
        <div className="admin-error">
          {customers.length === 0
            ? "Cadastre pelo menos um cliente antes de criar uma assinatura."
            : "Não existe plano comercial ativo disponível."}
        </div>

        {customers.length === 0 && (
          <div style={{ marginTop: 16 }}>
            <Link
              href="/admin/clientes/novo"
              className="admin-button"
            >
              CADASTRAR CLIENTE
            </Link>
          </div>
        )}
      </main>
    );
  }

  return (
    <SubscriptionForm
      customers={customers}
      plans={safePlans}
    />
  );
}
