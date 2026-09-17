"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import styles from "../page.module.css";

type Mode = "login" | "signup";

export default function CustomerAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (loginError) {
        setError("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }

      router.push("/minha-assinatura");
      router.refresh();
      return;
    }

    const redirectTo = `${window.location.origin}/minha-assinatura/auth/callback`;

    const { data, error: signupError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (signupError) {
      setError("Não foi possível criar seu acesso. Verifique os dados e tente novamente.");
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/minha-assinatura");
      router.refresh();
      return;
    }

    setMessage(
      "Cadastro recebido. Confira seu e-mail e confirme o acesso antes de continuar."
    );
    setLoading(false);
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  return (
    <div className={styles.authCard}>
      <div className={styles.authTabs}>
        <button
          type="button"
          className={mode === "login" ? styles.authTabActive : styles.authTab}
          onClick={() => changeMode("login")}
        >
          Já tenho acesso
        </button>
        <button
          type="button"
          className={mode === "signup" ? styles.authTabActive : styles.authTab}
          onClick={() => changeMode("signup")}
        >
          Criar acesso
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.authForm}>
        <label>
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          <span>Senha</span>
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}
        {message ? <p className={styles.success}>{message}</p> : null}

        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading
            ? "AGUARDE..."
            : mode === "login"
              ? "ENTRAR"
              : "CRIAR MEU ACESSO"}
        </button>
      </form>

      <p className={styles.securityNote}>
        Use o mesmo e-mail cadastrado na Black Navalha. Dados da assinatura só
        são liberados depois da validação segura da sua identidade.
      </p>
    </div>
  );
}
