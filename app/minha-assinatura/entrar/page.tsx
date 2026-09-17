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
    <main className={styles.page}>
      <div className={styles.narrow}>
        <Link href="/assinaturas" className={styles.back}>
          <ArrowLeft size={15} aria-hidden="true" />
          Voltar para assinaturas
        </Link>

        <header className={styles.header}>
          <span>Área do assinante</span>
          <h1>Minha assinatura</h1>
          <p>
            Entre com seu acesso pessoal para consultar sua assinatura com
            segurança.
          </p>
        </header>

        <CustomerAuthForm />
      </div>
    </main>
  );
}
