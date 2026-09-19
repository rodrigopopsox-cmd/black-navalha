import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCustomerIdentity } from "@/lib/customer-auth/identity";

import CustomerAuthForm from "./customer-auth-form";
import styles from "../page.module.css";

export default async function CustomerLoginPage() {
  const identity = await getCustomerIdentity();

  if (identity.status === "linked") {
    redirect("/minha-assinatura");
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
            <Link href="/assinaturas" className={styles.authHeaderBack}>
              <ArrowLeft size={11} aria-hidden="true" />
              VOLTAR
            </Link>
          </div>
        </header>

        <section className={styles.authIntro}>
          <span>ACESSO DO CLIENTE</span>
          <h1>SEU ESPAÇO BLACK NAVALHA.</h1>
          <p>Assinatura, horários e benefícios em um só lugar.</p>
        </section>

        <CustomerAuthForm />
      </div>
    </main>
  );
}