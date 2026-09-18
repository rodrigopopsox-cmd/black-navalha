"use client";

import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import styles from "../page.module.css";

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/minha-assinatura/auth/recuperacao`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo }
    );

    if (resetError) {
      setError(
        resetError.status === 429
          ? "Muitas solicitações foram feitas. Aguarde alguns minutos e tente novamente."
          : "Não foi possível solicitar a redefinição agora."
      );
      setLoading(false);
      return;
    }

    setMessage(
      "Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir sua senha."
    );
    setLoading(false);
  }

  return (
    <div className={styles.authCard}>
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

        {error ? <p className={styles.error}>{error}</p> : null}
        {message ? <p className={styles.success}>{message}</p> : null}

        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? "ENVIANDO..." : "ENVIAR LINK DE RECUPERAÇÃO"}
        </button>
      </form>
    </div>
  );
}