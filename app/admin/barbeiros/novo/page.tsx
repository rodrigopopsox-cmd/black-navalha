"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  Save,
  UserRound,
} from "lucide-react";

import { createBarber } from "./actions";

export default function NovoBarbeiroPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [accessEmail, setAccessEmail] = useState("");
  const [active, setActive] = useState(true);
  const [subscriptionCommissionRate, setSubscriptionCommissionRate] =
    useState("0");
  const [serviceCommissionRate, setServiceCommissionRate] =
    useState("0");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (name.trim().length < 2) {
      setMessage("Informe o nome do barbeiro.");
      setMessageType("error");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");

    if (
      phoneDigits &&
      (phoneDigits.length < 10 || phoneDigits.length > 11)
    ) {
      setMessage("Informe um WhatsApp profissional válido.");
      setMessageType("error");
      return;
    }

    const subscriptionRate = Number(
      subscriptionCommissionRate.replace(",", ".")
    );

    const serviceRate = Number(
      serviceCommissionRate.replace(",", ".")
    );

    if (
      !Number.isFinite(subscriptionRate) ||
      subscriptionRate < 0 ||
      subscriptionRate > 100
    ) {
      setMessage(
        "Informe uma comissão de assinatura entre 0% e 100%."
      );
      setMessageType("error");
      return;
    }

    if (
      !Number.isFinite(serviceRate) ||
      serviceRate < 0 ||
      serviceRate > 100
    ) {
      setMessage(
        "Informe uma comissão de serviços entre 0% e 100%."
      );
      setMessageType("error");
      return;
    }

    if (!accessEmail.trim()) {
      setMessage("Informe o e-mail de acesso profissional.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const result = await createBarber({
      name,
      phone,
      active,
      subscriptionCommissionRate: subscriptionRate,
      serviceCommissionRate: serviceRate,
      accessEmail,
    });

    setLoading(false);
    setMessage(result.message);

    if (result.success) {
      setMessageType("success");

      setTimeout(() => {
        router.push("/admin/barbeiros");
        router.refresh();
      }, 900);

      return;
    }

    setMessageType("error");

    if (result.barberCreated) {
      setName("");
      setPhone("");
      setAccessEmail("");
      setActive(true);
      setSubscriptionCommissionRate("0");
      setServiceCommissionRate("0");
    }
  }

  return (
    <main className="admin-page">
      <div style={{ marginBottom: "25px" }}>
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
          <h1 className="admin-title">Novo barbeiro</h1>
          <p className="admin-subtitle">
            Cadastre o profissional e provisione o acesso seguro à
            Área do Barbeiro.
          </p>
        </div>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "28px",
            paddingBottom: "25px",
            borderBottom: "1px solid #222",
          }}
        >
          <div className="barber-avatar">
            <UserRound size={28} />
          </div>

          <div>
            <strong
              style={{
                display: "block",
                fontSize: "13px",
                marginBottom: "4px",
              }}
            >
              Dados do profissional
            </strong>

            <span
              style={{
                color: "#666",
                fontSize: "11px",
              }}
            >
              Horários e serviços poderão ser configurados depois.
            </span>
          </div>
        </div>

        {message ? (
          <div
            className={
              messageType === "success"
                ? "admin-success"
                : "admin-error"
            }
            style={{ marginBottom: "22px" }}
          >
            {message}
          </div>
        ) : null}

        <div className="form-grid">
          <div className="form-group full">
            <label htmlFor="name">NOME DO BARBEIRO *</label>
            <input
              id="name"
              type="text"
              placeholder="Ex: Rodrigo"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group full">
            <label htmlFor="phone">WHATSAPP PROFISSIONAL</label>
            <input
              id="phone"
              type="tel"
              placeholder="(41) 99999-9999"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              disabled={loading}
            />
            <span className="form-help">
              Número profissional para contato e futuras notificações.
              Não é utilizado como identidade de acesso.
            </span>
          </div>

          <div className="form-group full">
            <label htmlFor="subscription-commission-rate">
              COMISSÃO DE ASSINATURA (%) *
            </label>
            <input
              id="subscription-commission-rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              inputMode="decimal"
              value={subscriptionCommissionRate}
              onChange={(event) =>
                setSubscriptionCommissionRate(event.target.value)
              }
              required
              disabled={loading}
            />
            <span className="form-help">
              Incide sobre mensalidades de assinatura conforme as
              regras financeiras vigentes.
            </span>
          </div>

          <div className="form-group full">
            <label htmlFor="service-commission-rate">
              COMISSÃO DE SERVIÇOS (%) *
            </label>
            <input
              id="service-commission-rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              inputMode="decimal"
              value={serviceCommissionRate}
              onChange={(event) =>
                setServiceCommissionRate(event.target.value)
              }
              required
              disabled={loading}
            />
            <span className="form-help">
              Incide sobre serviços concluídos conforme as regras de
              comissão já configuradas no sistema.
            </span>
          </div>

          <div className="form-group full">
            <label>STATUS</label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "fit-content",
                cursor: "pointer",
                marginTop: "7px",
              }}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={(event) =>
                  setActive(event.target.checked)
                }
                disabled={loading}
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
            <span className="form-help">
              Somente profissionais ativos podem operar normalmente
              na Área do Barbeiro e receber novos agendamentos.
            </span>
          </div>

          <div className="form-group full">
            <div
              style={{
                marginTop: "10px",
                paddingTop: "26px",
                borderTop: "1px solid #222",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "17px",
                }}
              >
                <KeyRound size={18} color="#d29d4f" />
                <strong style={{ fontSize: "13px" }}>
                  Acesso profissional
                </strong>
              </div>

              <label htmlFor="access-email">
                E-MAIL DE ACESSO PROFISSIONAL *
              </label>

              <div style={{ position: "relative" }}>
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
                  id="access-email"
                  type="email"
                  placeholder="profissional@exemplo.com"
                  value={accessEmail}
                  onChange={(event) =>
                    setAccessEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                  disabled={loading}
                  style={{ paddingLeft: "42px" }}
                />
              </div>

              <span className="form-help">
                O profissional receberá um convite para definir a
                própria senha. O Admin não cria, visualiza ou armazena
                a senha do barbeiro.
              </span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Link
            href="/admin/barbeiros"
            className="admin-button-secondary"
          >
            CANCELAR
          </Link>

          <button
            className="admin-button"
            type="submit"
            disabled={loading}
          >
            <Save size={16} />
            {loading ? "CADASTRANDO..." : "CADASTRAR BARBEIRO"}
          </button>
        </div>
      </form>
    </main>
  );
}