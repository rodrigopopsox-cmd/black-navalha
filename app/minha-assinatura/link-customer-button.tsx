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
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <button className={styles.primaryButton} type="submit" disabled={pending}>
        {pending ? "VALIDANDO..." : "VINCULAR MEU CADASTRO"}
      </button>
    </form>
  );
}
