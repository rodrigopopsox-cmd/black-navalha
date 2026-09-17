import "server-only";

import { createClient } from "@/lib/supabase/server";

export type MySubscriptionData =
  | { has_subscription: false }
  | {
      has_subscription: true;
      subscription: {
        name: string;
        status: string;
        starts_at: string;
        expires_at: string | null;
      };
      plan: {
        name: string;
        price: number;
        billing_interval_months: number;
        grace_days: number;
      } | null;
      cycle: {
        period_start: string;
        period_end: string;
        grace_until: string;
        status: string;
        price_amount: number;
        barber_id: string;
        barber_name: string | null;
      } | null;
      services: Array<{ name: string }>;
    };

export async function getMySubscription(): Promise<MySubscriptionData | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email_confirmed_at) {
    return null;
  }

  const { data, error } = await supabase.rpc("get_my_subscription");

  if (error) {
    throw new Error("Não foi possível carregar sua assinatura.");
  }

  return data as MySubscriptionData | null;
}

