"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Check,
  CreditCard,
  UserRound,
} from "lucide-react";

import {
  createAdminSubscription,
  type AdminSubscriptionMode,
  type ExternalPaymentMethod,
} from "./actions";

import AdminPixCheckout from "./admin-pix-checkout";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

type Plan = {
  id: string;
  name: string;
  price: number;
  billingIntervalMonths: number;
  graceDays: number;
  benefits: string[];
};

type Barber = {
  id: string;
  name: string;
  availableSlots: number;
};

type PreparedPix = {
  chargeId: string;
  checkoutToken: string;
  amount: number;
  currency: string;
  reservationExpiresAt: string;
};

function money(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(
      2,
      7
    )}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(
      2,
      6
    )}-${digits.slice(6)}`;
  }

  return phone;
}

export default function SubscriptionForm({
  customers,
  plans,
}: {
  customers: Customer[];
  plans: Plan[];
}) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [mode, setMode] =
    useState<AdminSubscriptionMode>("external_payment");
  const [paymentMethod, setPaymentMethod] =
    useState<ExternalPaymentMethod>("pix_in_person");
  const [note, setNote] = useState("");

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingBarbers, setLoadingBarbers] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preparedPix, setPreparedPix] =
    useState<PreparedPix | null>(null);

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.id === customerId
      ),
    [customers, customerId]
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === planId),
    [plans, planId]
  );

  const selectedBarber = useMemo(
    () =>
      barbers.find((barber) => barber.id === barberId),
    [barbers, barberId]
  );

  async function selectPlan(nextPlanId: string) {
    setPlanId(nextPlanId);
    setBarberId("");
    setBarbers([]);
    setPreparedPix(null);
    setSuccess("");
    setError("");

    if (!nextPlanId) {
      return;
    }

    setLoadingBarbers(true);

    try {
      const supabaseModule = await import(
        "@/lib/supabase/client"
      );
      const supabase = supabaseModule.createClient();

      const { data, error: barberError } =
        await supabase.rpc(
          "get_public_subscription_barbers",
          {
            p_plan_id: nextPlanId,
          }
        );

      if (barberError) {
        throw barberError;
      }

      setBarbers(
        (data ?? []).map(
          (barber: {
            id: string;
            name: string;
            available_slots: number;
          }) => ({
            id: barber.id,
            name: barber.name,
            availableSlots: Number(
              barber.available_slots
            ),
          })
        )
      );
    } catch (loadError) {
      console.error(
        "Erro ao carregar barbeiros da assinatura:",
        loadError
      );

      setError(
        "NÃ£o foi possÃ­vel carregar a disponibilidade dos barbeiros."
      );
    } finally {
      setLoadingBarbers(false);
    }
  }

  async function submit() {
    if (preparedPix) {
      return;
    }
    setError("");
    setSuccess("");

    if (!customerId) {
      setError("Selecione o cliente.");
      return;
    }

    if (!planId) {
      setError("Selecione o plano.");
      return;
    }

    if (!barberId) {
      setError("Selecione o barbeiro.");
      return;
    }

    if (
      mode === "external_payment" &&
      paymentMethod === "other" &&
      note.trim().length < 2
    ) {
      setError(
        "Descreva o meio de pagamento recebido."
      );
      return;
    }

    setSaving(true);

    try {
      const result = await createAdminSubscription({
        customerId,
        planId,
        barberId,
        mode,
        paymentMethod:
          mode === "external_payment"
            ? paymentMethod
            : undefined,
        administrativeNote: note,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(result.message);

      if (
        mode === "prepare_pix" &&
        result.chargeId &&
        result.checkoutToken &&
        result.amount !== undefined &&
        result.currency &&
        result.reservationExpiresAt
      ) {
        setPreparedPix({
          chargeId: result.chargeId,
          checkoutToken: result.checkoutToken,
          amount: result.amount,
          currency: result.currency,
          reservationExpiresAt:
            result.reservationExpiresAt,
        });
        return;
      }

      router.push("/admin/assinantes");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-page">
      <div style={{ marginBottom: 25 }}>
        <Link
          href="/admin/assinantes"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            color: "#777",
            textDecoration: "none",
            fontSize: 11,
          }}
        >
          <ArrowLeft size={14} />
          VOLTAR PARA ASSINANTES
        </Link>
      </div>

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            ASSINATURAS
          </div>

          <h1 className="admin-title">
            Nova assinatura
          </h1>

          <p className="admin-subtitle">
            Use o catÃ¡logo comercial, a capacidade real e o
            histÃ³rico financeiro correto.
          </p>
        </div>
      </div>

      <div className="subscription-form">
        {error && (
          <div className="admin-error">{error}</div>
        )}

        {success && (
          <div className="admin-success">{success}</div>
        )}

        <section className="subscription-form-section">
          <div className="subscription-form-heading">
            <UserRound size={18} />
            <div>
              <strong>Cliente</strong>
              <span>
                Selecione um cliente jÃ¡ cadastrado.
              </span>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full">
              <label>CLIENTE *</label>

              <select
                value={customerId}
                disabled={saving || Boolean(preparedPix)}
                onChange={(event) => {
                  setCustomerId(event.target.value);
                  setPreparedPix(null);
                  setSuccess("");
                }}
              >
                <option value="">
                  Selecione o cliente
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name} Â·{" "}
                    {formatPhone(customer.phone)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <Link
              href="/admin/clientes/novo"
              className="admin-button-secondary"
            >
              CADASTRAR NOVO CLIENTE
            </Link>
          </div>

          {selectedCustomer && (
            <div style={infoBoxStyle}>
              <strong>{selectedCustomer.name}</strong>
              <span>
                {formatPhone(selectedCustomer.phone)}
              </span>
              <span>
                {selectedCustomer.email ||
                  "E-mail nÃ£o cadastrado"}
              </span>
            </div>
          )}
        </section>

        <section className="subscription-form-section">
          <div className="subscription-form-heading">
            <BadgeCheck size={18} />
            <div>
              <strong>Plano comercial</strong>
              <span>
                PreÃ§o, ciclo e benefÃ­cios vÃªm do catÃ¡logo.
              </span>
            </div>
          </div>

          <div style={planGridStyle}>
            {plans.map((plan) => {
              const selected = plan.id === planId;

              return (
                <button
                  key={plan.id}
                  type="button"
                  disabled={saving || Boolean(preparedPix)}
                  onClick={() => selectPlan(plan.id)}
                  style={{
                    ...planCardStyle,
                    ...(selected
                      ? selectedPlanCardStyle
                      : {}),
                  }}
                >
                  <span style={planNameStyle}>
                    {plan.name}
                  </span>

                  <strong style={planPriceStyle}>
                    {money(plan.price)}
                  </strong>

                  <span style={planMetaStyle}>
                    {plan.billingIntervalMonths} mÃªs Â·{" "}
                    {plan.graceDays} dias de carÃªncia
                  </span>

                  <span style={benefitCountStyle}>
                    {plan.benefits.length} benefÃ­cios
                  </span>

                  {selected && (
                    <span style={selectedLabelStyle}>
                      <Check size={13} />
                      SELECIONADO
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedPlan && (
            <div style={benefitsBoxStyle}>
              <strong>
                BenefÃ­cios deste plano
              </strong>

              <ul style={benefitsListStyle}>
                {selectedPlan.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>

              <small style={mutedTextStyle}>
                Estes benefÃ­cios serÃ£o congelados no novo ciclo apÃ³s a confirmaÃ§Ã£o da operaÃ§Ã£o.
              </small>
            </div>
          )}
        </section>

        <section className="subscription-form-section">
          <div className="subscription-form-heading">
            <UserRound size={18} />
            <div>
              <strong>Barbeiro</strong>
              <span>
                A capacidade final Ã© revalidada no banco.
              </span>
            </div>
          </div>

          {!planId ? (
            <p style={mutedTextStyle}>
              Selecione primeiro o plano.
            </p>
          ) : loadingBarbers ? (
            <p style={mutedTextStyle}>
              Carregando disponibilidade...
            </p>
          ) : barbers.length === 0 ? (
            <div className="admin-error">
              Nenhum barbeiro disponÃ­vel para este plano.
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-group full">
                <label>PROFISSIONAL *</label>

                <select
                  value={barberId}
                  disabled={saving || Boolean(preparedPix)}
                  onChange={(event) => {
                    setBarberId(event.target.value);
                    setPreparedPix(null);
                    setSuccess("");
                  }}
                >
                  <option value="">
                    Selecione o barbeiro
                  </option>

                  {barbers.map((barber) => (
                    <option
                      key={barber.id}
                      value={barber.id}
                      disabled={barber.availableSlots <= 0}
                    >
                      {barber.name} Â·{" "}
                      {barber.availableSlots > 0
                        ? "Vagas disponÃ­veis"
                        : "IndisponÃ­vel"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </section>

        <section className="subscription-form-section">
          <div className="subscription-form-heading">
            <Banknote size={18} />
            <div>
              <strong>Forma de contrataÃ§Ã£o</strong>
              <span>
                Escolha conscientemente a origem financeira.
              </span>
            </div>
          </div>

          <div style={modeGridStyle}>
            <button
              type="button"
              disabled={saving || Boolean(preparedPix)}
              onClick={() => {
                setMode("external_payment");
                setPreparedPix(null);
                setSuccess("");
              }}
              style={{
                ...modeCardStyle,
                ...(mode === "external_payment"
                  ? selectedModeCardStyle
                  : {}),
              }}
            >
              <Banknote size={20} />
              <strong>
                PAGAMENTO RECEBIDO FORA DO MERCADO PAGO
              </strong>
              <span>
                Registra receita real, ciclo pago e comissÃ£o
                histÃ³rica.
              </span>
            </button>

            <button
              type="button"
              disabled={saving || Boolean(preparedPix)}
              onClick={() => {
                setMode("prepare_pix");
                setPreparedPix(null);
                setSuccess("");
              }}
              style={{
                ...modeCardStyle,
                ...(mode === "prepare_pix"
                  ? selectedModeCardStyle
                  : {}),
              }}
            >
              <CreditCard size={20} />
              <strong>PREPARAR CONTRATAÃ‡ÃƒO PIX</strong>
              <span>
                Reserva a vaga temporariamente e cria cobranÃ§a
                pendente. NÃ£o ativa a assinatura.
              </span>
            </button>
          </div>

          {mode === "external_payment" && (
            <div style={{ marginTop: 18 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>MEIO RECEBIDO *</label>

                  <select
                    value={paymentMethod}
                    disabled={saving || Boolean(preparedPix)}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target
                          .value as ExternalPaymentMethod
                      )
                    }
                  >
                    <option value="pix_in_person">
                      PIX presencial
                    </option>
                    <option value="cash">
                      Dinheiro
                    </option>
                    <option value="other">
                      Outro
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    OBSERVAÃ‡ÃƒO{" "}
                    {paymentMethod === "other" ? "*" : ""}
                  </label>

                  <input
                    type="text"
                    value={note}
                    disabled={saving || Boolean(preparedPix)}
                    maxLength={240}
                    placeholder="ReferÃªncia administrativa opcional"
                    onChange={(event) =>
                      setNote(event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {selectedCustomer &&
          selectedPlan &&
          selectedBarber && (
            <section className="subscription-form-section">
              <div className="subscription-form-heading">
                <BadgeCheck size={18} />
                <div>
                  <strong>Resumo</strong>
                  <span>
                    Confira antes de registrar.
                  </span>
                </div>
              </div>

              <div style={summaryGridStyle}>
                <Summary
                  label="Cliente"
                  value={selectedCustomer.name}
                />
                <Summary
                  label="Plano"
                  value={`${selectedPlan.name} Â· ${money(
                    selectedPlan.price
                  )}`}
                />
                <Summary
                  label="Barbeiro"
                  value={selectedBarber.name}
                />
                <Summary
                  label="OperaÃ§Ã£o"
                  value={
                    mode === "external_payment"
                      ? "Pagamento externo confirmado"
                      : preparedPix
                        ? "ContrataÃ§Ã£o preparada"
                        : "Preparar contrataÃ§Ã£o PIX"
                  }
                />
              </div>
            </section>
          )}

        {preparedPix && (
          <AdminPixCheckout prepared={preparedPix} />
        )}

        {(error || (success && !preparedPix)) && (
          <div
            className={error ? "admin-error" : "admin-success"}
            style={{ marginTop: 18 }}
          >
            {error || success}
          </div>
        )}

        <div className="form-actions">
          <Link
            href="/admin/assinantes"
            className="admin-button-secondary"
          >
            CANCELAR
          </Link>

          <button
            type="button"
            className="admin-button"
            disabled={
              saving ||
              !customerId ||
              !planId ||
              !barberId ||
              (mode === "prepare_pix" && Boolean(preparedPix))
            }
            onClick={submit}
          >
            {saving
              ? "PROCESSANDO..."
              : mode === "external_payment"
                ? "REGISTRAR PAGAMENTO E ATIVAR"
                : preparedPix
                  ? "CONTRATAÃ‡ÃƒO PREPARADA"
                  : "PREPARAR CONTRATAÃ‡ÃƒO"}
          </button>
        </div>
      </div>
    </main>
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

const infoBoxStyle = {
  display: "grid",
  gap: 5,
  marginTop: 14,
  padding: 14,
  border: "1px solid #242424",
  borderRadius: 7,
  background: "#0e0e0e",
  color: "#ddd",
  fontSize: 12,
} as const;

const planGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 12,
} as const;

const planCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 7,
  padding: 16,
  color: "#ccc",
  background: "#0d0d0d",
  border: "1px solid #292929",
  borderRadius: 8,
  textAlign: "left",
  cursor: "pointer",
} as const;

const selectedPlanCardStyle = {
  border: "1px solid #c89b58",
  background: "#171107",
  boxShadow: "inset 0 0 0 1px #6d512a",
} as const;

const planNameStyle = {
  color: "#f3efe8",
  fontSize: 15,
  fontWeight: 800,
} as const;

const planPriceStyle = {
  color: "#e6b96d",
  fontSize: 20,
} as const;

const planMetaStyle = {
  color: "#777",
  fontSize: 11,
} as const;

const benefitCountStyle = {
  color: "#aaa",
  fontSize: 11,
} as const;

const selectedLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  marginTop: 5,
  color: "#d2a35d",
  fontSize: 10,
  fontWeight: 800,
} as const;

const benefitsBoxStyle = {
  marginTop: 15,
  padding: 16,
  border: "1px solid #242424",
  borderRadius: 8,
  background: "#0d0d0d",
  color: "#ddd",
} as const;

const benefitsListStyle = {
  margin: "10px 0",
  paddingLeft: 18,
  color: "#aaa",
  fontSize: 12,
  lineHeight: 1.7,
} as const;

const mutedTextStyle = {
  color: "#777",
  fontSize: 11,
  lineHeight: 1.6,
} as const;

const modeGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
} as const;

const modeCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 8,
  padding: 16,
  color: "#aaa",
  background: "#0d0d0d",
  border: "1px solid #292929",
  borderRadius: 8,
  textAlign: "left",
  cursor: "pointer",
} as const;

const selectedModeCardStyle = {
  color: "#ddd",
  border: "1px solid #c89b58",
  background: "#171107",
} as const;

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
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

const preparedBoxStyle = {
  borderColor: "#4e412b",
  background: "#141108",
} as const;

const preparedTextStyle = {
  margin: "8px 0 15px",
  color: "#aaa",
  fontSize: 12,
  lineHeight: 1.6,
} as const;
