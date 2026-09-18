import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ResetPasswordForm from "./reset-password-form";
import styles from "../page.module.css";

export default async function ResetPasswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/minha-assinatura/entrar");
  }

  return (
    <main className={styles.customerPage}>
      <section className={styles.customerShell}>
        <span className={styles.eyebrow}>Área do assinante</span>
        <h1>NOVA SENHA</h1>
        <p>Defina uma nova senha para seu acesso pessoal.</p>

        <ResetPasswordForm />
      </section>
    </main>
  );
}