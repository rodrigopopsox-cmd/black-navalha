import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import DefineCustomerPasswordForm from "./define-customer-password-form";
import styles from "../page.module.css";

export default async function DefineCustomerPasswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError ||
    !user ||
    !user.email ||
    !user.email_confirmed_at
  ) {
    redirect("/minha-assinatura/entrar");
  }

  const { data: customer, error: customerError } =
    await supabase
      .from("customers")
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .maybeSingle();

  const authEmail = user.email.trim().toLowerCase();
  const customerEmail =
    customer?.email?.trim().toLowerCase() ?? "";

  if (
    customerError ||
    !customer ||
    !customerEmail ||
    authEmail !== customerEmail
  ) {
    redirect("/minha-assinatura/entrar");
  }

  return (
    <main className={styles.page}>
      <section className={styles.authCard}>
        <p className={styles.eyebrow}>CENTRAL DO CLIENTE</p>

        <h1>Defina sua senha</h1>

        <p>
          Olá, {customer.name}. Escolha sua senha pessoal para
          acessar a Central do Cliente.
        </p>

        <DefineCustomerPasswordForm />
      </section>
    </main>
  );
}