import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import DefineBarberPasswordForm from "./define-barber-password-form";

export default async function DefineBarberPasswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email_confirmed_at) {
    redirect("/barbeiro/entrar");
  }

  const { data: profile, error: profileError } = await supabase.rpc(
    "get_my_barber_profile"
  );

  const barber = Array.isArray(profile) ? profile[0] : null;

  if (
    profileError ||
    !barber ||
    !barber.barber_id ||
    barber.barber_active !== true
  ) {
    redirect("/barbeiro/entrar");
  }

  return (
    <main className="barber-login-page">
      <section className="barber-login-card">
        <div className="barber-login-brand">
          BLACK <span>NAVALHA</span>
        </div>

        <p className="barber-login-eyebrow">ÁREA DO PROFISSIONAL</p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <KeyRound size={26} color="#d29d4f" />
        </div>

        <h1>Defina sua senha</h1>

        <p className="barber-login-copy">
          Olá, {barber.barber_name}. Escolha sua senha pessoal para
          acessar a Área do Barbeiro.
        </p>

        <DefineBarberPasswordForm />

        <Link href="/">VOLTAR PARA BLACK NAVALHA</Link>
      </section>
    </main>
  );
}