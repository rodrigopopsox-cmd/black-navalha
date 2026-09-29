"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, QrCode } from "lucide-react";

type PreparedPix = {
  chargeId: string;
  checkoutToken: string;
  amount: number;
  currency: string;
  reservationExpiresAt: string;
};

type PixOrder = {
  orderId: string;
  paymentId: string;
  status: string | null;
  statusDetail: string | null;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  reservationExpiresAt: string;
};

type StatusResponse = {
  status?: string;
  paid?: boolean;
  activated?: boolean;
  paidAt?: string | null;
  error?: string;
};

function money(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function remainingSeconds(expiresAt: string) {
  const remaining =
    new Date(expiresAt).getTime() - Date.now();

  return Math.max(0, Math.ceil(remaining / 1000));
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    rest
  ).padStart(2, "0")}`;
}

export default function AdminPixCheckout({
  prepared,
}: {
  prepared: PreparedPix;
}) {
  const [pix, setPix] = useState<PixOrder | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(() =>
    remainingSeconds(prepared.reservationExpiresAt)
  );

  const expiresAt =
    pix?.reservationExpiresAt ??
    prepared.reservationExpiresAt;

  useEffect(() => {
    setSecondsLeft(remainingSeconds(expiresAt));

    const timer = window.setInterval(() => {
      setSecondsLeft(remainingSeconds(expiresAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const checkStatus = useCallback(async () => {
    const response = await fetch("/api/assinaturas/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        chargeId: prepared.chargeId,
        checkoutToken: prepared.checkoutToken,
      }),
    });

    const data = (await response.json()) as StatusResponse;

    if (!response.ok) {
      throw new Error(
        data.error || "Não foi possível consultar o pagamento."
      );
    }

    if (data.paid === true && data.activated === true) {
      setConfirmed(true);
      setExpired(false);
      return true;
    }

    return false;
  }, [prepared.chargeId, prepared.checkoutToken]);

  useEffect(() => {
    if (!pix || confirmed || expired || secondsLeft <= 0) {
      return;
    }

    const poll = window.setInterval(() => {
      void checkStatus().catch((statusError) => {
        console.error(
          "Erro ao acompanhar PIX administrativo:",
          statusError
        );
      });
    }, 3000);

    return () => window.clearInterval(poll);
  }, [
    pix,
    confirmed,
    expired,
    secondsLeft,
    checkStatus,
  ]);

  useEffect(() => {
    if (secondsLeft > 0 || confirmed || expired) {
      return;
    }

    if (!pix) {
      setExpired(true);
      return;
    }

    let cancelled = false;

    async function finalCheck() {
      setChecking(true);

      try {
        const paidAndActivated = await checkStatus();

        if (!cancelled && !paidAndActivated) {
          setExpired(true);
        }
      } catch (statusError) {
        console.error(
          "Erro na verificação final do PIX administrativo:",
          statusError
        );

        if (!cancelled) {
          setError(
            "Não foi possível concluir a verificação final do pagamento."
          );
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void finalCheck();

    return () => {
      cancelled = true;
    };
  }, [
    secondsLeft,
    confirmed,
    expired,
    pix,
    checkStatus,
  ]);

  async function generatePix() {
    if (secondsLeft <= 0 || generating || confirmed) {
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const response = await fetch(
        "/api/assinaturas/mercado-pago",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chargeId: prepared.chargeId,
            checkoutToken: prepared.checkoutToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Não foi possível gerar o PIX."
        );
      }

      if (
        typeof data?.orderId !== "string" ||
        typeof data?.paymentId !== "string" ||
        typeof data?.qrCode !== "string" ||
        typeof data?.qrCodeBase64 !== "string" ||
        typeof data?.reservationExpiresAt !== "string"
      ) {
        throw new Error(
          "O Mercado Pago não retornou todos os dados do PIX."
        );
      }

      setPix({
        orderId: data.orderId,
        paymentId: data.paymentId,
        status:
          typeof data.status === "string" ? data.status : null,
        statusDetail:
          typeof data.statusDetail === "string"
            ? data.statusDetail
            : null,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        ticketUrl:
          typeof data.ticketUrl === "string"
            ? data.ticketUrl
            : null,
        reservationExpiresAt: data.reservationExpiresAt,
      });
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Não foi possível gerar o PIX."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function copyPixCode() {
    if (!pix?.qrCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        "Não foi possível copiar automaticamente. Selecione o código PIX e copie manualmente."
      );
    }
  }

  const qrSrc = useMemo(() => {
    if (!pix?.qrCodeBase64) {
      return "";
    }

    return pix.qrCodeBase64.startsWith("data:")
      ? pix.qrCodeBase64
      : `data:image/png;base64,${pix.qrCodeBase64}`;
  }, [pix]);

  if (confirmed) {
    return (
      <section
        className="subscription-form-section"
        style={confirmedBoxStyle}
      >
        <div style={statusHeadingStyle}>
          <Check size={20} />
          <strong>Pagamento confirmado</strong>
        </div>

        <p style={textStyle}>
          O backend confirmou o pagamento e a ativação do ciclo.
          A assinatura já está ativa.
        </p>
      </section>
    );
  }

  return (
    <section
      className="subscription-form-section"
      style={preparedBoxStyle}
    >
      <div style={statusHeadingStyle}>
        <QrCode size={20} />
        <strong>
          {pix ? "PIX gerado" : "Contratação preparada"}
        </strong>
      </div>

      <p style={textStyle}>
        {pix
          ? "Aguardando confirmação do pagamento pelo backend. O QR Code e o código PIX não confirmam pagamento."
          : "A cobrança interna está pendente e a capacidade está reservada. Ainda não existe pagamento confirmado."}
      </p>

      <div style={summaryStyle}>
        <Summary
          label="Valor"
          value={money(prepared.amount)}
        />
        <Summary
          label="Tempo restante"
          value={formatCountdown(secondsLeft)}
        />
        <Summary
          label="Reserva até"
          value={new Date(expiresAt).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })}
        />
      </div>

      {checking && (
        <div style={waitingStyle}>
          Verificando pagamento...
        </div>
      )}

      {expired && !checking && (
        <div className="admin-error" style={{ marginTop: 16 }}>
          Esta reserva expirou. Nenhum pagamento confirmado foi
          identificado.
        </div>
      )}

      {error && (
        <div className="admin-error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      {!pix && !expired && (
        <div style={{ marginTop: 18 }}>
          <button
            type="button"
            className="admin-button"
            disabled={generating || secondsLeft <= 0}
            onClick={generatePix}
          >
            {generating ? "GERANDO PIX..." : "GERAR PIX"}
          </button>
        </div>
      )}

      {pix && !expired && (
        <div style={pixLayoutStyle}>
          <div style={qrPanelStyle}>
            <img
              src={qrSrc}
              alt="QR Code PIX"
              width={230}
              height={230}
              style={qrImageStyle}
            />
          </div>

          <div style={pixCodePanelStyle}>
            <strong>Pix Copia e Cola</strong>

            <textarea
              readOnly
              value={pix.qrCode}
              aria-label="Pix Copia e Cola"
              style={pixCodeStyle}
            />

            <button
              type="button"
              className="admin-button-secondary"
              onClick={copyPixCode}
            >
              <Copy size={14} />
              {copied ? "CÓDIGO COPIADO" : "COPIAR CÓDIGO PIX"}
            </button>

            {pix.ticketUrl && (
              <a
                href={pix.ticketUrl}
                target="_blank"
                rel="noreferrer"
                style={ticketLinkStyle}
              >
                ABRIR PIX NO MERCADO PAGO
              </a>
            )}

            <small style={mutedStyle}>
              A confirmação ocorre somente após o backend registrar
              pagamento e ativação.
            </small>
          </div>
        </div>
      )}
    </section>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span style={summaryLabelStyle}>{label}</span>
      <strong style={summaryValueStyle}>{value}</strong>
    </div>
  );
}

const preparedBoxStyle = {
  borderColor: "#4e412b",
  background: "#141108",
} as const;

const confirmedBoxStyle = {
  borderColor: "#315a3d",
  background: "#0d1710",
} as const;

const statusHeadingStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#e6b96d",
} as const;

const textStyle = {
  margin: "8px 0 15px",
  color: "#aaa",
  fontSize: 12,
  lineHeight: 1.6,
} as const;

const summaryStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 15,
} as const;

const summaryLabelStyle = {
  display: "block",
  marginBottom: 5,
  color: "#777",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
} as const;

const summaryValueStyle = {
  color: "#eee",
  fontSize: 13,
} as const;

const pixLayoutStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 18,
  marginTop: 20,
  alignItems: "start",
} as const;

const qrPanelStyle = {
  display: "flex",
  justifyContent: "center",
  padding: 16,
  borderRadius: 8,
  background: "#fff",
} as const;

const qrImageStyle = {
  display: "block",
  width: "100%",
  maxWidth: 230,
  height: "auto",
} as const;

const pixCodePanelStyle = {
  display: "grid",
  gap: 12,
  minWidth: 0,
} as const;

const pixCodeStyle = {
  width: "100%",
  minHeight: 105,
  resize: "vertical",
  padding: 12,
  boxSizing: "border-box",
  border: "1px solid #2b2b2b",
  borderRadius: 7,
  background: "#090909",
  color: "#ddd",
  fontSize: 11,
  lineHeight: 1.5,
  wordBreak: "break-all",
} as const;

const ticketLinkStyle = {
  color: "#d2a35d",
  fontSize: 10,
  fontWeight: 800,
  textDecoration: "none",
} as const;

const mutedStyle = {
  color: "#777",
  fontSize: 11,
  lineHeight: 1.6,
} as const;

const waitingStyle = {
  marginTop: 14,
  color: "#d2a35d",
  fontSize: 11,
  fontWeight: 700,
} as const;
