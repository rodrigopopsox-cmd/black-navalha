"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import styles from "../page.module.css";

export default function DefineCustomerPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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

    const { error: updateError } =
      await supabase.auth.updateUser({
        password,
      });

    if (updateError) {
      setError("Não foi possível definir sua senha.");
      setLoading(false);
      return;
    }

    const { error: signOutError } =
      await supabase.auth.signOut();

    if (signOutError) {
      setError(
        "Sua senha foi definida, mas não foi possível encerrar a sessão. Feche esta página e entre novamente pela Central do Cliente."
      );
      setLoading(false);
      return;
    }

    router.replace("/minha-assinatura/entrar");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 14,
        marginTop: 20,
      }}
    >
      <label htmlFor="customer-new-password">
        NOVA SENHA
      </label>

      <input
        id="customer-new-password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
        required
        disabled={loading}
      />

      <label htmlFor="customer-confirm-password">
        CONFIRMAR NOVA SENHA
      </label>

      <input
        id="customer-confirm-password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        value={confirmation}
        onChange={(event) =>
          setConfirmation(event.target.value)
        }
        required
        disabled={loading}
      />

      {error ? (
        <div className={styles.error}>{error}</div>
      ) : null}

      <button
        className={styles.primaryButton}
        type="submit"
        disabled={loading}
      >
        {loading ? "SALVANDO..." : "DEFINIR SENHA"}
      </button>
    </form>
  );
}