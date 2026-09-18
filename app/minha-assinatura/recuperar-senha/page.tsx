import Link from "next/link";

import RecoverPasswordForm from "./recover-password-form";
import styles from "../page.module.css";

export default function RecoverPasswordPage() {
  return (
    <main className={styles.customerPage}>
      <section className={styles.customerShell}>
        <span className={styles.eyebrow}>Área do assinante</span>
        <h1>RECUPERAR SENHA</h1>
        <p>Informe seu e-mail para receber um link seguro de redefinição.</p>

        <RecoverPasswordForm />

        <Link href="/minha-assinatura/entrar">Voltar para entrar</Link>
      </section>
    </main>
  );
}