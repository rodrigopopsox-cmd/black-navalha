"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function BarberInvitePage() {
  const router = useRouter();
  const started = useRef(false);

  const [message, setMessage] = useState(
    "Validando seu acesso profissional..."
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
        router.replace("/barbeiro/entrar?erro=convite");
        return;
      }

      const supabase = createClient();

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      window.history.replaceState(
        null,
        "",
        "/barbeiro/auth/convite"
      );

      if (sessionError) {
        await supabase.auth.signOut();
        router.replace("/barbeiro/entrar?erro=convite");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user ||
        !user.email_confirmed_at
      ) {
        await supabase.auth.signOut();
        router.replace("/barbeiro/entrar?erro=convite");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase.rpc("get_my_barber_profile");

      const barber = Array.isArray(profile) ? profile[0] : null;

      if (
        profileError ||
        !barber ||
        !barber.barber_id ||
        barber.barber_active !== true
      ) {
        await supabase.auth.signOut();
        router.replace("/barbeiro/entrar?erro=acesso");
        return;
      }

      setMessage("Acesso validado. Preparando definição da senha...");

      router.replace("/barbeiro/definir-senha");
      router.refresh();
    }

    void acceptInvite();
  }, [router]);

  return (
    <main className="barber-login-page">
      <section className="barber-login-card">
        <div className="barber-login-brand">
          BLACK <span>NAVALHA</span>
        </div>

        <p className="barber-login-eyebrow">
          ÁREA DO PROFISSIONAL
        </p>

        <h1>Ativando seu acesso</h1>

        <p className="barber-login-copy">{message}</p>
      </section>
    </main>
  );
}