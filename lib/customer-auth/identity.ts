import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CustomerIdentity =
  | { status: "unauthenticated" }
  | { status: "unverified"; email: string | null }
  | { status: "unlinked"; email: string }
  | {
      status: "linked";
      userId: string;
      customer: {
        id: string;
        name: string;
        email: string | null;
      };
    };

export async function getCustomerIdentity(): Promise<CustomerIdentity> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { status: "unauthenticated" };
  }

  const email = user.email?.trim().toLowerCase() ?? null;

  if (!user.email_confirmed_at) {
    return { status: "unverified", email };
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (customerError) {
    throw new Error("Não foi possível validar o vínculo do cliente.");
  }

  if (customer) {
    return {
      status: "linked",
      userId: user.id,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    };
  }

  if (!email) {
    return { status: "unverified", email: null };
  }

  return { status: "unlinked", email };
}
