"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function BarberLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/barbeiro");
    router.refresh();
  }

  return (
    <main className="barber-login-page">
      <section className="barber-login-card">
        <div className="barber-login-brand">
          BLACK <span>NAVALHA</span>
        </div>

        <p className="barber-login-eyebrow">ÁREA DO PROFISSIONAL</p>
        <h1>Painel do barbeiro</h1>

        <p className="barber-login-copy">
          Acesse sua agenda e suas informações profissionais.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="barber-email">E-MAIL</label>
          <input
            id="barber-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            disabled={loading}
          />

          <label htmlFor="barber-password">SENHA</label>
          <input
            id="barber-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={loading}
          />

          {error && <div className="barber-login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "ENTRANDO..." : "ENTRAR"}
          </button>
        </form>

        <Link href="/">VOLTAR PARA BLACK NAVALHA</Link>
      </section>
    </main>
  );
}