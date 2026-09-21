"use client";

import { useActionState } from "react";

import { linkCustomerAccount, type LinkCustomerState } from "./actions";
import styles from "./page.module.css";

const initialState: LinkCustomerState = {};

export default function LinkCustomerButton() {
  const [state, action, pending] = useActionState(
    async (): Promise<LinkCustomerState> => linkCustomerAccount(),
    initialState
  );

  return (
    <form action={action}>
      {state.unavailable ? (
        <div className={styles.identityStateMessage}>
          <strong>Cadastro ainda não encontrado.</strong>
          <p>
            Seu acesso e seu e-mail estão confirmados, mas ainda não foi possível
            localizar um cadastro disponível para vínculo. Confira se você está
            usando o mesmo e-mail informado no seu cadastro da Black Navalha.
            Se precisar, entre em contato com a Black Navalha.
          </p>
        </div>
      ) : null}
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <button className={styles.primaryButton} type="submit" disabled={pending}>
        {pending ? "VALIDANDO..." : "VINCULAR MEU CADASTRO"}
      </button>
    </form>
  );
}
