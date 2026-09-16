"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

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
  chargeId: string;
  checkoutToken: string;
  amount: number;
  currency: string;
  reservationExpiresAt: string;
};

type PixData = {
  orderId: string;
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getRemainingSeconds(expiresAt: string) {
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
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
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [prepared, setPrepared] = useState<PreparedCheckout | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const checkoutTokenRef = useRef<string | null>(null);

  function getCheckoutToken() {
    if (!checkoutTokenRef.current) {
      checkoutTokenRef.current = crypto.randomUUID();
    }

    return checkoutTokenRef.current;
  }

  useEffect(() => {
    if (!prepared) return;

    function updateCountdown() {
      setRemainingSeconds(
        getRemainingSeconds(prepared!.reservationExpiresAt)
      );
    }

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [prepared]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (customerName.trim().length < 2) {
      setError("Informe seu nome.");
      return;
    }

    const phoneDigits = customerPhone.replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError("Informe um WhatsApp válido.");
      return;
    }

    if (!customerEmail.trim()) {
      setError("Informe seu e-mail para continuar ao pagamento.");
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
        headers: { "Content-Type": "application/json" },
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
        chargeId: result.checkout.chargeId,
        checkoutToken: result.checkout.checkoutToken,
        amount: Number(result.checkout.amount),
        currency: result.checkout.currency,
        reservationExpiresAt: result.checkout.reservationExpiresAt,
      });
    } catch {
      setError("Não foi possível preparar sua contratação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePix() {
    if (!prepared || remainingSeconds <= 0) return;

    setError("");
    setCopyMessage("");
    setPaymentLoading(true);

    try {
      const response = await fetch("/api/assinaturas/mercado-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chargeId: prepared.chargeId,
          checkoutToken: prepared.checkoutToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Não foi possível gerar o Pix."
        );
        return;
      }

      if (
        typeof result.orderId !== "string" ||
        typeof result.paymentId !== "string" ||
        typeof result.qrCode !== "string" ||
        typeof result.qrCodeBase64 !== "string"
      ) {
        setError("O Mercado Pago não retornou os dados completos do Pix.");
        return;
      }

      setPix({
        orderId: result.orderId,
        paymentId: result.paymentId,
        qrCode: result.qrCode,
        qrCodeBase64: result.qrCodeBase64,
        ticketUrl:
          typeof result.ticketUrl === "string" ? result.ticketUrl : null,
      });
    } catch {
      setError("Não foi possível gerar o Pix. Tente novamente.");
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleCopyPix() {
    if (!pix) return;

    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopyMessage("Código Pix copiado.");
    } catch {
      setCopyMessage("Não foi possível copiar automaticamente.");
    }
  }

  if (prepared) {
    const expired = remainingSeconds <= 0;

    return (
      <div className={styles.checkoutSuccess} role="status">
        <strong>Vaga reservada temporariamente.</strong>

        <p>
          Pagamento de {formatPrice(prepared.amount)} via Pix.
        </p>

        <div
          aria-label={`Tempo restante da reserva: ${formatCountdown(
            remainingSeconds
          )}`}
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}
        >
          {formatCountdown(remainingSeconds)}
        </div>

        <p>
          {expired
            ? "A reserva de capacidade expirou. O pagamento não garante mais a vaga sem nova validação do servidor."
            : "Este tempo acompanha a expiração real da reserva no servidor."}
        </p>

        {pix ? (
          <>
            <img
              src={`data:image/jpeg;base64,${pix.qrCodeBase64}`}
              alt="QR Code para pagamento via Pix"
              style={{
                width: "min(320px, 100%)",
                height: "auto",
                display: "block",
                margin: "1rem auto",
                background: "#fff",
                padding: "0.75rem",
              }}
            />

            <label style={{ display: "grid", gap: "0.5rem", width: "100%" }}>
              <span>Pix Copia e Cola</span>
              <textarea
                value={pix.qrCode}
                readOnly
                rows={5}
                style={{ width: "100%", resize: "vertical" }}
              />
            </label>

            <button
              type="button"
              className={styles.checkoutButton}
              onClick={handleCopyPix}
            >
              COPIAR CÓDIGO PIX
            </button>

            {copyMessage && <p>{copyMessage}</p>}

            {pix.ticketUrl && (
              <a
                href={pix.ticketUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir instruções do Pix no Mercado Pago
              </a>
            )}

            <p>
              Após o pagamento, aguarde a confirmação automática. Esta tela não
              ativa a assinatura.
            </p>
          </>
        ) : (
          <button
            type="button"
            className={styles.checkoutButton}
            disabled={expired || paymentLoading}
            onClick={handleGeneratePix}
          >
            {paymentLoading ? "GERANDO PIX..." : "GERAR PIX"}
          </button>
        )}

        {error && (
          <p className={styles.checkoutError} role="alert">
            {error}
          </p>
        )}

        <small className={styles.checkoutFootnote}>
          Sua assinatura só será ativada após confirmação segura do pagamento
          pelo Mercado Pago no servidor.
        </small>
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
          ciclo mensal. A disponibilidade pode mudar até a reserva.
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
          <span>E-mail</span>
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            autoComplete="email"
            maxLength={254}
            disabled={loading}
            required
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
                    {available ? "Vagas disponíveis" : "Indisponível"}
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
        Esta etapa reserva a vaga por 30 minutos. A assinatura só será ativada
        após confirmação segura do pagamento.
      </small>
    </form>
  );
}
