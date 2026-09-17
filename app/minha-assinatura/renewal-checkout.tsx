"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

type Barber = {
  id: string;
  name: string;
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

function secondsUntil(value: string) {
  return Math.max(
    0,
    Math.ceil((new Date(value).getTime() - Date.now()) / 1000)
  );
}

function countdown(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function RenewalCheckout({
  barbers,
  currentBarberId,
}: {
  barbers: Barber[];
  currentBarberId: string;
}) {
  const router = useRouter();
  const [barberId, setBarberId] = useState(currentBarberId);
  const [prepared, setPrepared] = useState<PreparedCheckout | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [finalChecking, setFinalChecking] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const tokenRef = useRef<string | null>(null);
  const finalCheckStartedRef = useRef(false);

  function token() {
    if (!tokenRef.current) tokenRef.current = crypto.randomUUID();
    return tokenRef.current;
  }

  async function checkStatus(checkout: PreparedCheckout) {
    const response = await fetch("/api/assinaturas/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        chargeId: checkout.chargeId,
        checkoutToken: checkout.checkoutToken,
      }),
    });

    if (!response.ok) return false;

    const result = await response.json();
    return result.paid === true && result.activated === true;
  }

  function confirmPayment() {
    setConfirmed(true);
    setExpired(false);
    setError("");
    router.refresh();
  }

  useEffect(() => {
    if (!prepared) return;

    const update = () =>
      setRemaining(secondsUntil(prepared.reservationExpiresAt));

    update();
    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, [prepared]);

  useEffect(() => {
    if (!prepared || !pix || confirmed || remaining <= 0) return;

    let cancelled = false;
    let checking = false;

    async function check() {
      if (cancelled || checking) return;
      checking = true;

      try {
        const activated = await checkStatus(prepared!);

        if (!cancelled && activated) {
          confirmPayment();
        }
      } catch {
        // Polling apenas observa o estado interno.
      } finally {
        checking = false;
      }
    }

    void check();
    const timer = window.setInterval(() => void check(), 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [prepared, pix, confirmed, remaining]);

  useEffect(() => {
    if (
      !prepared ||
      !pix ||
      confirmed ||
      remaining > 0 ||
      finalCheckStartedRef.current
    ) {
      return;
    }

    finalCheckStartedRef.current = true;
    let cancelled = false;

    async function finalCheck() {
      setFinalChecking(true);

      try {
        const activated = await checkStatus(prepared!);

        if (cancelled) return;

        if (activated) {
          confirmPayment();
          return;
        }

        setExpired(true);
      } catch {
        if (!cancelled) {
          setExpired(true);
        }
      } finally {
        if (!cancelled) {
          setFinalChecking(false);
        }
      }
    }

    void finalCheck();

    return () => {
      cancelled = true;
    };
  }, [prepared, pix, confirmed, remaining]);

  async function prepareRenewal() {
    if (!barberId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/minha-assinatura/renovacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId,
          checkoutToken: token(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Não foi possível preparar sua renovação."
        );
        return;
      }

      finalCheckStartedRef.current = false;
      setConfirmed(false);
      setFinalChecking(false);
      setExpired(false);
      setPix(null);
      setCopyMessage("");

      setPrepared({
        chargeId: result.checkout.chargeId,
        checkoutToken: result.checkout.checkoutToken,
        amount: Number(result.checkout.amount),
        currency: result.checkout.currency,
        reservationExpiresAt: result.checkout.reservationExpiresAt,
      });
    } catch {
      setError("Não foi possível preparar sua renovação.");
    } finally {
      setLoading(false);
    }
  }

  async function generatePix() {
    if (!prepared || remaining <= 0) return;

    setPixLoading(true);
    setError("");

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

      if (
        !response.ok ||
        typeof result.orderId !== "string" ||
        typeof result.paymentId !== "string" ||
        typeof result.qrCode !== "string" ||
        typeof result.qrCodeBase64 !== "string"
      ) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Não foi possível gerar o Pix."
        );
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
      setError("Não foi possível gerar o Pix.");
    } finally {
      setPixLoading(false);
    }
  }

  async function copyPix() {
    if (!pix) return;

    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopyMessage("Código Pix copiado.");
    } catch {
      setCopyMessage("Não foi possível copiar automaticamente.");
    }
  }

  if (confirmed) {
    return (
      <section className={styles.renewalPanel}>
        <span className={styles.eyebrow}>Renovação confirmada</span>
        <h3>Novo ciclo liberado.</h3>
        <p>
          O pagamento foi confirmado com segurança pelo servidor. Os dados da
          sua assinatura foram atualizados automaticamente.
        </p>
      </section>
    );
  }

  if (prepared) {
    return (
      <section className={styles.renewalPanel}>
        <span className={styles.eyebrow}>Renovação preparada</span>
        <h3>
          {finalChecking
            ? "Verificando pagamento..."
            : expired
              ? "Reserva expirada"
              : countdown(remaining)}
        </h3>
        <p>
          {finalChecking
            ? "Estamos fazendo uma última consulta segura ao servidor antes de encerrar esta reserva."
            : expired
              ? "O prazo desta reserva terminou sem confirmação de pagamento pelo servidor."
              : "A reserva acompanha o prazo real de 30 minutos no servidor."}
        </p>

        {!expired && !finalChecking && remaining > 0 && !pix ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={generatePix}
            disabled={pixLoading}
          >
            {pixLoading ? "GERANDO PIX..." : "GERAR PIX DA RENOVAÇÃO"}
          </button>
        ) : null}

        {!expired && !finalChecking && remaining > 0 && pix ? (
          <div className={styles.pixBox}>
            <img
              src={`data:image/jpeg;base64,${pix.qrCodeBase64}`}
              alt="QR Code Pix da renovação"
            />
            <textarea value={pix.qrCode} readOnly rows={5} />
            <button
              type="button"
              className={styles.primaryButton}
              onClick={copyPix}
            >
              COPIAR CÓDIGO PIX
            </button>
            {copyMessage ? <p>{copyMessage}</p> : null}
            <small>
              A tela apenas acompanha o pagamento. A confirmação continua sendo
              feita pelo servidor.
            </small>
          </div>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
      </section>
    );
  }

  return (
    <section className={styles.renewalPanel}>
      <span className={styles.eyebrow}>Renovação voluntária</span>
      <h3>Escolha seu barbeiro para o próximo ciclo.</h3>
      <p>
        Você pode manter o profissional atual ou escolher outro com
        disponibilidade. Nenhuma cobrança é automática.
      </p>

      <div className={styles.renewalBarbers}>
        {barbers.map((barber) => {
          const isCurrent = barber.id === currentBarberId;
          const available = isCurrent || Number(barber.available_slots) > 0;
          const selected = barber.id === barberId;

          return (
            <button
              key={barber.id}
              type="button"
              disabled={!available || loading}
              className={`${styles.renewalBarber} ${
                selected ? styles.renewalBarberSelected : ""
              }`}
              onClick={() => {
                setBarberId(barber.id);
                setError("");
              }}
            >
              <strong>{barber.name}</strong>
              <small>
                {isCurrent
                  ? "Seu barbeiro atual"
                  : available
                    ? "Vagas disponíveis"
                    : "Indisponível"}
              </small>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.primaryButton}
        onClick={prepareRenewal}
        disabled={loading || !barberId}
      >
        {loading ? "PREPARANDO..." : "PREPARAR RENOVAÇÃO"}
      </button>

      {error ? <p className={styles.error}>{error}</p> : null}
    </section>
  );
}
