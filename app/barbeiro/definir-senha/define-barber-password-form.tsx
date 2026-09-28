"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function DefineBarberPasswordForm() {
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
      setError("Não foi possível definir sua senha.");
      setLoading(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(
        "Sua senha foi definida, mas não foi possível encerrar a sessão. Feche esta página e entre novamente pela Área do Barbeiro."
      );
      setLoading(false);
      return;
    }

    router.replace("/barbeiro/entrar");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="barber-new-password">NOVA SENHA</label>
      <input
        id="barber-new-password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        disabled={loading}
      />

      <label htmlFor="barber-confirm-password">
        CONFIRMAR NOVA SENHA
      </label>
      <input
        id="barber-confirm-password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        required
        disabled={loading}
      />

      {error ? (
        <div className="barber-login-error">{error}</div>
      ) : null}

      <button type="submit" disabled={loading}>
        {loading ? "SALVANDO..." : "DEFINIR SENHA"}
      </button>
    </form>
  );
}