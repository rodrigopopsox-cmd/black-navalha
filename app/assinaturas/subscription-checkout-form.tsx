"use client";

import { FormEvent, useRef, useState } from "react";

import styles from "./page.module.css";

type Plan = {
  id: string;
  name: string;
  price: number;
};

type Barber = {
  id: string;
  name: string;
  photo_url: string | null;
  capacity: number;
  available_slots: number;
};

type PreparedCheckout = {
  amount: number;
  currency: string;
  reservationExpiresAt: string;
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function SubscriptionCheckoutForm({
  plan,
  barbers,
}: {
  plan: Plan;
  barbers: Barber[];
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [barberId, setBarberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prepared, setPrepared] = useState<PreparedCheckout | null>(null);

  const checkoutTokenRef = useRef<string | null>(null);

  function getCheckoutToken() {
    if (!checkoutTokenRef.current) {
      checkoutTokenRef.current = crypto.randomUUID();
    }

    return checkoutTokenRef.current;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setPrepared(null);

    if (customerName.trim().length < 2) {
      setError("Informe seu nome.");
      return;
    }

    const phoneDigits = customerPhone.replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError("Informe um WhatsApp válido.");
      return;
    }

    if (!barberId) {
      setError("Escolha seu barbeiro.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/assinaturas/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          barberId,
          customerName,
          customerPhone,
          customerEmail,
          checkoutToken: getCheckoutToken(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Não foi possível preparar sua contratação."
        );
        return;
      }

      setPrepared({
        amount: Number(result.checkout.amount),
        currency: result.checkout.currency,
        reservationExpiresAt: result.checkout.reservationExpiresAt,
      });
    } catch {
      setError(
        "Não foi possível preparar sua contratação. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  if (prepared) {
    const expiresAt = new Date(
      prepared.reservationExpiresAt
    ).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className={styles.checkoutSuccess} role="status">
        <strong>Vaga reservada temporariamente.</strong>

        <p>
          O checkout de {formatPrice(prepared.amount)} foi preparado e a vaga
          escolhida está reservada até {expiresAt}.
        </p>

        <p>
          A cobrança real ainda não está disponível porque o meio de pagamento
          ainda será integrado. Nenhum pagamento foi realizado e sua assinatura
          ainda não foi ativada.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.checkoutForm} onSubmit={handleSubmit}>
      <div className={styles.checkoutHeading}>
        <span>Contratar {plan.name}</span>
        <strong>Seus dados e barbeiro</strong>
        <p>
          Escolha o profissional que ficará vinculado à assinatura durante o
          ciclo mensal. A disponibilidade mostrada abaixo pode mudar até a
          confirmação da reserva.
        </p>
      </div>

      <div className={styles.checkoutFields}>
        <label>
          <span>Nome</span>
          <input
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            autoComplete="name"
            maxLength={120}
            disabled={loading}
            required
          />
        </label>

        <label>
          <span>WhatsApp</span>
          <input
            type="tel"
            value={customerPhone}
            onChange={(event) =>
              setCustomerPhone(formatPhone(event.target.value))
            }
            autoComplete="tel"
            inputMode="tel"
            placeholder="(41) 99999-9999"
            disabled={loading}
            required
          />
        </label>

        <label className={styles.fullField}>
          <span>E-mail (opcional)</span>
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            autoComplete="email"
            maxLength={254}
            disabled={loading}
          />
        </label>
      </div>

      <div className={styles.barberList}>
        {barbers.length === 0 ? (
          <p className={styles.message}>
            Nenhum barbeiro está disponível para assinatura no momento.
          </p>
        ) : (
          barbers.map((barber) => {
            const available = barber.available_slots > 0;
            const selected = barberId === barber.id;

            return (
              <button
                key={barber.id}
                type="button"
                disabled={!available || loading}
                className={`${styles.barberOption} ${
                  selected ? styles.barberSelected : ""
                }`}
                aria-pressed={selected}
                onClick={() => {
                  setBarberId(barber.id);
                  setError("");
                }}
              >
                <span>
                  <strong>{barber.name}</strong>
                  <small>
                    {available
                      ? `${barber.available_slots} ${
                          barber.available_slots === 1
                            ? "vaga disponível"
                            : "vagas disponíveis"
                        }`
                      : "Sem vagas"}
                  </small>
                </span>

                <span className={styles.barberMark} aria-hidden="true">
                  {selected ? "✓" : ""}
                </span>
              </button>
            );
          })
        )}
      </div>

      {error && (
        <p className={styles.checkoutError} role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className={styles.checkoutButton}
        disabled={loading || barbers.length === 0}
      >
        {loading ? "RESERVANDO VAGA..." : "PREPARAR CONTRATAÇÃO"}
      </button>

      <small className={styles.checkoutFootnote}>
        Esta etapa apenas prepara a contratação e reserva a vaga por 15 minutos.
        A assinatura só será ativada após confirmação segura de pagamento,
        quando essa integração estiver disponível.
      </small>
    </form>
  );
}
