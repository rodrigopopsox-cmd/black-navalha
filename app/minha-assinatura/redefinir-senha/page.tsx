import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
    <main className={`${styles.page} ${styles.authPage}`}>
      <div className={`${styles.narrow} ${styles.authShell}`}>
        <header className={styles.authBrand}>
          <Link href="/" className={styles.authBrandIdentity}>
            <Image
              src="/black-navalha/logo.png"
              alt=""
              width={70}
              height={56}
              className={styles.authBrandLogo}
              priority
            />

            <span className={styles.authBrandCopy}>
              <strong>BLACK NAVALHA</strong>
              <span>BARBEARIA</span>
            </span>
          </Link>

          <div className={styles.authBrandActions}>
            <span className={styles.authBrandArea}>CENTRAL DO CLIENTE</span>
            <Link
              href="/minha-assinatura/entrar"
              className={styles.authHeaderBack}
            >
              <ArrowLeft size={11} aria-hidden="true" />
              VOLTAR
            </Link>
          </div>
        </header>

        <section className={styles.authIntro}>
          <span>ACESSO DO CLIENTE</span>
          <h1>DEFINA SUA NOVA SENHA</h1>
          <p>Escolha uma nova senha para seu acesso pessoal.</p>
        </section>

        <ResetPasswordForm />
      </div>
    </main>
  );
}