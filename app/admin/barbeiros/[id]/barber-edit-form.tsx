"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  provisionBarberAccess,
  updateBarber,
} from "./actions";

type Barber = {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  subscriptionCommissionRate: number;
  serviceCommissionRate: number;
  accessConfigured: boolean;
};

export default function BarberEditForm({
  barber,
}: {
  barber: Barber;
}) {
  const [name, setName] = useState(barber.name);
  const [phone, setPhone] = useState(barber.phone ?? "");
  const [active, setActive] = useState(barber.active);
  const [
    subscriptionCommissionRate,
    setSubscriptionCommissionRate,
  ] = useState(String(barber.subscriptionCommissionRate));
  const [serviceCommissionRate, setServiceCommissionRate] =
    useState(String(barber.serviceCommissionRate));

  const [accessConfigured, setAccessConfigured] = useState(
    barber.accessConfigured
  );
  const [accessEmail, setAccessEmail] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessError, setAccessError] = useState("");
  const [accessSuccess, setAccessSuccess] = useState("");

  const [isPending, startTransition] = useTransition();
  const [isProvisioning, startProvisioning] = useTransition();

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function handlePhone(value: string) {
    let numbers = value.replace(/\D/g, "");

    if (numbers.length >= 12 && numbers.startsWith("55")) {
      numbers = numbers.slice(2);
    }

    numbers = numbers.slice(0, 11);

    if (numbers.length <= 2) {
      setPhone(numbers ? `(${numbers}` : "");
      return;
    }

    if (numbers.length <= 6) {
      setPhone(`(${numbers.slice(0, 2)}) ${numbers.slice(2)}`);
      return;
    }

    if (numbers.length <= 10) {
      setPhone(
        `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
      );
      return;
    }

    setPhone(
      `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearFeedback();

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const phoneDigits = trimmedPhone.replace(/\D/g, "");

    if (trimmedName.length < 2) {
      setError("Informe o nome do barbeiro.");
      return;
    }

    if (
      phoneDigits &&
      (phoneDigits.length < 10 || phoneDigits.length > 11)
    ) {
      setError("Informe um WhatsApp válido.");
      return;
    }

    const commissionRate = Number(
      subscriptionCommissionRate.replace(",", ".")
    );

    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 100
    ) {
      setError(
        "Informe uma comissão de assinatura entre 0% e 100%."
      );
      return;
    }

    const serviceRate = Number(
      serviceCommissionRate.replace(",", ".")
    );

    if (
      !Number.isFinite(serviceRate) ||
      serviceRate < 0 ||
      serviceRate > 100
    ) {
      setError(
        "Informe uma comissão de serviços entre 0% e 100%."
      );
      return;
    }

    startTransition(async () => {
      const result = await updateBarber({
        id: barber.id,
        name: trimmedName,
        phone: trimmedPhone,
        active,
        subscriptionCommissionRate: commissionRate,
        serviceCommissionRate: serviceRate,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setName(trimmedName);
      setPhone(trimmedPhone);
      setSuccess(result.message);
    });
  }

  function handleProvisionAccess(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setAccessError("");
    setAccessSuccess("");

    if (!accessEmail.trim()) {
      setAccessError("Informe o e-mail de acesso profissional.");
      return;
    }

    startProvisioning(async () => {
      const result = await provisionBarberAccess({
        barberId: barber.id,
        email: accessEmail,
      });

      if (!result.success) {
        setAccessError(result.message);
        return;
      }

      setAccessConfigured(true);
      setAccessEmail("");
      setAccessSuccess(result.message);
    });
  }

  return (
    <main className="admin-page">
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/admin/barbeiros"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            color: "#777",
            textDecoration: "none",
            fontSize: "11px",
          }}
        >
          <ArrowLeft size={14} />
          VOLTAR PARA BARBEIROS
        </Link>
      </div>

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">EQUIPE</div>
          <h1 className="admin-title">Editar barbeiro</h1>
          <p className="admin-subtitle">
            Gerencie os dados profissionais, comissões e o estado do
            acesso à Área do Barbeiro.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={isPending}
          style={{
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "24px",
            background: "#0e0e0e",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "22px",
              color: "#c89b58",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            <UserRound size={18} />
            Dados do profissional
          </div>

          <div style={formGridStyle}>
            <div>
              <label htmlFor="barber-name" style={fieldLabelStyle}>
                NOME *
              </label>
              <input
                id="barber-name"
                type="text"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearFeedback();
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="barber-phone" style={fieldLabelStyle}>
                WHATSAPP PROFISSIONAL
              </label>
              <input
                id="barber-phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  handlePhone(event.target.value);
                  clearFeedback();
                }}
                placeholder="(41) 99999-9999"
                style={inputStyle}
              />
              <span style={helpStyle}>
                Contato profissional. Não é utilizado como identidade
                de acesso.
              </span>
            </div>

            <div>
              <label
                htmlFor="barber-subscription-commission-rate"
                style={fieldLabelStyle}
              >
                COMISSÃO DE ASSINATURA (%) *
              </label>
              <input
                id="barber-subscription-commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                required
                value={subscriptionCommissionRate}
                onChange={(event) => {
                  setSubscriptionCommissionRate(event.target.value);
                  clearFeedback();
                }}
                style={inputStyle}
              />
              <span style={helpStyle}>
                Alterações afetam somente pagamentos futuros.
              </span>
            </div>

            <div>
              <label
                htmlFor="barber-service-commission-rate"
                style={fieldLabelStyle}
              >
                COMISSÃO DE SERVIÇOS (%) *
              </label>
              <input
                id="barber-service-commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                required
                value={serviceCommissionRate}
                onChange={(event) => {
                  setServiceCommissionRate(event.target.value);
                  clearFeedback();
                }}
                style={inputStyle}
              />
              <span style={helpStyle}>
                Alterações afetam somente lançamentos futuros.
              </span>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <span style={fieldLabelStyle}>STATUS</span>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "fit-content",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => {
                    setActive(event.target.checked);
                    clearFeedback();
                  }}
                  style={{
                    width: "18px",
                    minHeight: "18px",
                    accentColor: "#d29d4f",
                  }}
                />
                <span style={{ color: "#bbb" }}>
                  Barbeiro ativo
                </span>
              </label>
              <span style={helpStyle}>
                Somente profissionais ativos podem operar normalmente
                na Área do Barbeiro e receber novos agendamentos.
              </span>
            </div>
          </div>

          {error ? <div style={errorStyle}>{error}</div> : null}

          {success ? (
            <div role="status" style={successStyle}>
              <CheckCircle2 size={16} />
              {success}
            </div>
          ) : null}

          <div style={actionsStyle}>
            <button
              type="submit"
              disabled={isPending}
              style={primaryButtonStyle}
            >
              <Save size={16} />
              {isPending ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
            </button>

            <Link
              href="/admin/barbeiros"
              style={secondaryButtonStyle}
            >
              CANCELAR
            </Link>
          </div>
        </fieldset>
      </form>

      <section
        style={{
          marginTop: "22px",
          padding: "24px",
          border: "1px solid #222",
          borderRadius: "8px",
          background: "#0e0e0e",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px",
            color: "#c89b58",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          <KeyRound size={18} />
          Acesso profissional
        </div>

        {accessConfigured ? (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#8fd49a",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              <ShieldCheck size={18} />
              ACESSO CONFIGURADO
            </div>

            <p style={accessCopyStyle}>
              Este profissional possui uma identidade vinculada à Área
              do Barbeiro. A senha é pessoal e não é exibida ou
              armazenada pelo Admin.
            </p>

            {accessSuccess ? (
              <div role="status" style={successStyle}>
                <CheckCircle2 size={16} />
                {accessSuccess}
              </div>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleProvisionAccess}>
            <div
              style={{
                color: "#d9a65a",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              ACESSO NÃO CONFIGURADO
            </div>

            <p style={accessCopyStyle}>
              Informe o e-mail profissional para enviar um convite. O
              barbeiro definirá a própria senha e não receberá acesso
              administrativo.
            </p>

            <label htmlFor="barber-access-email" style={fieldLabelStyle}>
              E-MAIL DE ACESSO PROFISSIONAL *
            </label>

            <div
              style={{
                position: "relative",
                maxWidth: "520px",
              }}
            >
              <Mail
                size={16}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#666",
                  pointerEvents: "none",
                }}
              />
              <input
                id="barber-access-email"
                type="email"
                value={accessEmail}
                onChange={(event) => {
                  setAccessEmail(event.target.value);
                  setAccessError("");
                  setAccessSuccess("");
                }}
                placeholder="profissional@exemplo.com"
                autoComplete="email"
                required
                disabled={isProvisioning}
                style={{
                  ...inputStyle,
                  paddingLeft: "42px",
                }}
              />
            </div>

            {accessError ? (
              <div style={errorStyle}>{accessError}</div>
            ) : null}

            {accessSuccess ? (
              <div role="status" style={successStyle}>
                <CheckCircle2 size={16} />
                {accessSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isProvisioning}
              style={{
                ...primaryButtonStyle,
                marginTop: "16px",
              }}
            >
              <KeyRound size={16} />
              {isProvisioning
                ? "ENVIANDO..."
                : "ENVIAR CONVITE DE ACESSO"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "18px",
} as const;

const fieldLabelStyle = {
  display: "block",
  color: "#888",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "6px",
} as const;

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #333",
  borderRadius: "6px",
  background: "#141414",
  color: "#f5f2eb",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
} as const;

const helpStyle = {
  display: "block",
  marginTop: "7px",
  color: "#666",
  fontSize: "11px",
  lineHeight: 1.4,
} as const;

const accessCopyStyle = {
  margin: "0 0 18px",
  color: "#777",
  fontSize: "12px",
  lineHeight: 1.6,
  maxWidth: "680px",
} as const;

const errorStyle = {
  marginTop: "18px",
  padding: "12px",
  border: "1px solid #8b3232",
  borderRadius: "6px",
  background: "#1a0e0e",
  color: "#ff8c8c",
  fontSize: "13px",
} as const;

const successStyle = {
  marginTop: "18px",
  padding: "12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: "1px solid #355c3c",
  borderRadius: "6px",
  background: "#0e1a10",
  color: "#8fd49a",
  fontSize: "13px",
} as const;

const actionsStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "20px",
} as const;

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  minHeight: "42px",
  padding: "0 18px",
  border: "none",
  borderRadius: "6px",
  background: "#c89b58",
  color: "#0a0704",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const secondaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "42px",
  padding: "0 18px",
  color: "#bbb",
  background: "#141414",
  border: "1px solid #333",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 700,
} as const;