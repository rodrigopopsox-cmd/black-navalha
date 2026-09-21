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
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [expirationChecked, setExpirationChecked] = useState(false);

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

  useEffect(() => {
    if (!prepared || !pix || paymentConfirmed) {
      return;
    }

    let cancelled = false;
    let checking = false;

    async function checkPaymentStatus() {
      if (
        cancelled ||
        checking ||
        getRemainingSeconds(prepared!.reservationExpiresAt) <= 0
      ) {
        return;
      }

      checking = true;

      try {
        const response = await fetch("/api/assinaturas/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            chargeId: prepared!.chargeId,
            checkoutToken: prepared!.checkoutToken,
          }),
        });

        if (!response.ok) return;

        const result = await response.json();

        if (!cancelled && result.paid === true && result.activated === true) {
          setPaymentConfirmed(true);
          setError("");
        }
      } catch {
        // Falhas transitórias de consulta não alteram o estado financeiro.
      } finally {
        checking = false;
      }
    }

    void checkPaymentStatus();

    const timer = window.setInterval(() => {
      void checkPaymentStatus();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [prepared, pix, paymentConfirmed]);
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

      setExpirationChecked(false);
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

  function handleRestartCheckout() {
    setPrepared(null);
    setPix(null);
    setPaymentConfirmed(false);
    setExpirationChecked(false);
    setRemainingSeconds(0);
    setError("");
    setCopyMessage("");
    setPaymentLoading(false);
    checkoutTokenRef.current = null;
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

  useEffect(() => {
    if (
      !prepared ||
      !pix ||
      paymentConfirmed ||
      remainingSeconds > 0 ||
      expirationChecked
    ) {
      return;
    }

    let cancelled = false;

    async function finalPaymentCheck() {
      try {
        const response = await fetch("/api/assinaturas/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            chargeId: prepared!.chargeId,
            checkoutToken: prepared!.checkoutToken,
          }),
        });

        if (response.ok) {
          const result = await response.json();

          if (
            !cancelled &&
            result.paid === true &&
            result.activated === true
          ) {
            setPaymentConfirmed(true);
            setError("");
            return;
          }
        }
      } catch {
        // A falha desta consulta não confirma pagamento.
      } finally {
        if (!cancelled) {
          setExpirationChecked(true);
        }
      }
    }

    void finalPaymentCheck();

    return () => {
      cancelled = true;
    };
  }, [
    prepared,
    pix,
    paymentConfirmed,
    remainingSeconds,
    expirationChecked,
  ]);
  if (prepared) {
    const expired = remainingSeconds <= 0;

    if (paymentConfirmed) {
      return (
        <div className={`${styles.checkoutSuccess} ${styles.paymentConfirmed}`} role="status" aria-live="polite">
          <strong>Pagamento confirmado.</strong>
          <p>
            Seu {plan.name} está ativo. O pagamento foi confirmado com
            segurança pelo servidor.
          </p>
          <p>
            Os benefícios da assinatura já estão liberados para o ciclo pago.
          </p>
          <a className={styles.checkoutButtonLink} href="/agendar">
            AGENDAR HORÁRIO
          </a>
        </div>
      );
    }

    if (expired && !expirationChecked) {
      return (
        <div className={`${styles.checkoutSuccess} ${styles.paymentChecking}`} role="status" aria-live="polite">
          <strong>Verificando pagamento...</strong>
          <p>
            O prazo da reserva terminou. Estamos fazendo uma última consulta
            segura antes de encerrar este Pix.
          </p>
        </div>
      );
    }
    if (expired && expirationChecked) {
      return (
        <div className={`${styles.checkoutExpired} ${styles.paymentExpired}`} role="status" aria-live="polite">
          <strong>Esta reserva expirou.</strong>
          <p>
            O prazo deste Pix terminou. Para continuar, prepare uma nova
            contratação e gere um novo Pix.
          </p>
          <button
            type="button"
            className={styles.checkoutButton}
            onClick={handleRestartCheckout}
          >
            PREPARAR NOVA CONTRATAÇÃO
          </button>
          <small className={styles.checkoutFootnote}>
            Nenhuma assinatura é ativada sem confirmação segura do pagamento.
          </small>
        </div>
      );
    }

    return (
      <div className={styles.paymentJourney} role="status">
        <div className={styles.paymentHeader}>
          <span>Pagamento</span>
          <strong>Finalize seu {plan.name}</strong>
          <p>
            Sua vaga está reservada. Conclua o pagamento via Pix dentro do
            prazo abaixo.
          </p>
        </div>

        <div className={styles.paymentSummary}>
          <span>Você está contratando</span>
          <strong>{plan.name}</strong>
          <small>{formatPrice(prepared.amount)}</small>
        </div>

        <div className={styles.paymentTimer}>
          <span>Prazo da reserva</span>
          <strong
            aria-label={`Tempo restante da reserva: ${formatCountdown(
              remainingSeconds
            )}`}
          >
            {formatCountdown(remainingSeconds)}
          </strong>
          <small>Tempo restante da sua reserva</small>
        </div>

        <p className={styles.reservationNote}>{expired
            ? "O prazo da reserva terminou."
            : "Sua vaga está garantida durante este prazo."}</p>

        {pix ? (
          <>
            <div className={styles.pixHeading}>
              <span>Pix gerado</span>
              <strong>Pague com Pix</strong>
              <p>
                Escaneie o QR Code ou use o Pix Copia e Cola. A confirmação é
                automática.
              </p>
            </div>

            <div className={styles.pixLayout}>
              <div className={styles.pixQrPanel}>
                <span>QR Code Pix</span>
                <div className={styles.pixQrFrame}>
                  <img
                    src={`data:image/jpeg;base64,${pix.qrCodeBase64}`}
                    alt="QR Code para pagamento via Pix"
                  />
                </div>
              </div>

              <div className={styles.pixCopyPanel}>
                <span>Pix Copia e Cola</span>
                <textarea value={pix.qrCode} readOnly rows={5} />

                <button
                  type="button"
                  className={styles.checkoutButton}
                  onClick={handleCopyPix}
                >
                  COPIAR CÓDIGO PIX
                </button>

                {copyMessage && (
                  <p className={styles.copyMessage}>{copyMessage}</p>
                )}

                <div className={styles.paymentWaiting}>
                  <span className={styles.waitingDot} aria-hidden="true" />
                  <div>
                    <strong>Aguardando confirmação</strong>
                    <p>
                      Assim que o pagamento for confirmado, seu plano será
                      ativado automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {pix.ticketUrl && (
              <a
                href={pix.ticketUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir instruções do Pix no Mercado Pago
              </a>
            )}

            <p className={styles.paymentNote}>
              Após pagar, aguarde nesta tela enquanto confirmamos o Pix.
            </p>
          </>
        ) : (
          <div className={styles.pixPrepare}>
            <div className={styles.pixHeading}>
              <span>Pix</span>
              <strong>Pague com Pix</strong>
              <p>
                Um QR Code e o código Pix Copia e Cola serão gerados para esta
                contratação.
              </p>
            </div>

            <button
              type="button"
              className={styles.checkoutButton}
              disabled={expired || paymentLoading}
              onClick={handleGeneratePix}
            >
              {paymentLoading ? "GERANDO PIX..." : "GERAR PIX"}
            </button>
          </div>
        )}

        {error && (
          <p className={styles.checkoutError} role="alert">
            {error}
          </p>
        )}

        <small className={styles.checkoutFootnote}>
          A ativação acontece automaticamente após a confirmação do Pix.
        </small>
      </div>
    );
  }

  return (
    <div className={styles.checkoutJourney}>
      <div className={styles.existingCustomer}>
        <div>
          <span>Já é assinante?</span>
          <strong>Entre direto na Central do Cliente</strong>
          <p>
            Consulte seu plano, agendamentos e renovação pela sua área segura.
          </p>
        </div>

        <a href="/minha-assinatura">ACESSAR CENTRAL</a>
      </div>

      <form className={styles.checkoutForm} onSubmit={handleSubmit}>
        <div className={styles.checkoutHeading}>
          <span>Finalizar contratação</span>
          <strong>Complete seus dados</strong>
          <p>
            Informe seus dados e escolha o barbeiro que ficará vinculado ao
            ciclo.
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
        {loading ? "RESERVANDO VAGA..." : "RESERVAR VAGA E CONTINUAR"}
      </button>

        <small className={styles.checkoutFootnote}>
          A vaga fica reservada por 30 minutos para você concluir o Pix.
        </small>
      </form>
    </div>
  );
}
