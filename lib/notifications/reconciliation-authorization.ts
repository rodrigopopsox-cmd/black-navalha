import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AuthorizedNotificationReconciliationOperator {
  kind: "admin";
  userId: string;
}

export async function getAuthorizedNotificationReconciliationOperator(): Promise<
  AuthorizedNotificationReconciliationOperator | null
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    return null;
  }

  return Object.freeze({
    kind: "admin" as const,
    userId: user.id,
  });
}
