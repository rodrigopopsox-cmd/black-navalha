"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import styles from "../../page.module.css";

export default function CustomerInvitePage() {
  const router = useRouter();
  const started = useRef(false);

  const [message, setMessage] = useState(
    "Validando seu acesso à Central do Cliente..."
  );

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    async function acceptInvite() {
      const hash = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (!accessToken || !refreshToken) {
        router.replace(
          "/minha-assinatura/entrar?erro=convite"
        );
        return;
      }

      const supabase = createClient();

      const { error: sessionError } =
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

      window.history.replaceState(
        null,
        "",
        "/minha-assinatura/auth/convite"
      );

      if (sessionError) {
        await supabase.auth.signOut();
        router.replace(
          "/minha-assinatura/entrar?erro=convite"
        );
        return;
      }

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
        await supabase.auth.signOut();
        router.replace(
          "/minha-assinatura/entrar?erro=convite"
        );
        return;
      }

      const normalizedEmail = user.email.trim().toLowerCase();

      const { data: customer, error: customerError } =
        await supabase
          .from("customers")
          .select("id, email")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      const customerEmail =
        customer?.email?.trim().toLowerCase() ?? "";

      if (
        customerError ||
        !customer ||
        !customerEmail ||
        customerEmail !== normalizedEmail
      ) {
        await supabase.auth.signOut();
        router.replace(
          "/minha-assinatura/entrar?erro=acesso"
        );
        return;
      }

      setMessage(
        "Acesso validado. Preparando definição da senha..."
      );

      router.replace("/minha-assinatura/definir-senha");
      router.refresh();
    }

    void acceptInvite();
  }, [router]);

  return (
    <main className={styles.page}>
      <section className={styles.authCard}>
        <p className={styles.eyebrow}>CENTRAL DO CLIENTE</p>
        <h1>Ativando seu acesso</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}