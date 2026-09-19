"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import styles from "../page.module.css";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError("Não foi possível atualizar sua senha.");
      setLoading(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(
        "Sua senha foi atualizada, mas não foi possível encerrar a sessão. Use o botão Sair antes de entrar novamente."
      );
      setLoading(false);
      return;
    }

    router.replace("/minha-assinatura/entrar");
    router.refresh();
  }

  return (
    <div className={styles.authCard}>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <label>
          <span>Nova senha</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label>
          <span>Confirmar nova senha</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button
          type="submit"
          className={styles.primaryButton}
          disabled={loading}
        >
          {loading ? "SALVANDO..." : "SALVAR NOVA SENHA"}
        </button>
      </form>
    </div>
  );
}
