"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  UserRound,
} from "lucide-react";

import { updateBarber } from "./actions";

type Barber = {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
};

export default function BarberEditForm({
  barber,
}: {
  barber: Barber;
}) {
  const [name, setName] = useState(barber.name);
  const [phone, setPhone] = useState(barber.phone ?? "");
  const [active, setActive] = useState(barber.active);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function handlePhone(value: string) {
    let numbers = value.replace(/\D/g, "");

    if (
      numbers.length >= 12 &&
      numbers.startsWith("55")
    ) {
      numbers = numbers.slice(2);
    }

    numbers = numbers.slice(0, 11);

    if (numbers.length <= 2) {
      setPhone(numbers ? `(${numbers}` : "");
      return;
    }

    if (numbers.length <= 6) {
      setPhone(
        `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      );
      return;
    }

    if (numbers.length <= 10) {
      setPhone(
        `(${numbers.slice(0, 2)}) ${numbers.slice(
          2,
          6
        )}-${numbers.slice(6)}`
      );
      return;
    }

    setPhone(
      `(${numbers.slice(0, 2)}) ${numbers.slice(
        2,
        7
      )}-${numbers.slice(7)}`
    );
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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

    startTransition(async () => {
      const result = await updateBarber({
        id: barber.id,
        name: trimmedName,
        phone: trimmedPhone,
        active,
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

  return (
    <main className="admin-page">
      <div
        style={{
          marginBottom: "24px",
        }}
      >
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
          <div className="admin-eyebrow">
            EQUIPE
          </div>

          <h1 className="admin-title">
            Editar barbeiro
          </h1>

          <p className="admin-subtitle">
            Atualize os dados do profissional sem alterar seus horários ou serviços.
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
              <label
                htmlFor="barber-name"
                style={fieldLabelStyle}
              >
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
              <label
                htmlFor="barber-phone"
                style={fieldLabelStyle}
              >
                WHATSAPP
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
                Telefone profissional. Este campo é opcional.
              </span>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <span style={fieldLabelStyle}>
                STATUS
              </span>

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
                Somente profissionais ativos poderão receber novos agendamentos.
              </span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: "18px",
                padding: "12px",
                border: "1px solid #8b3232",
                borderRadius: "6px",
                background: "#1a0e0e",
                color: "#ff8c8c",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              style={{
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
              }}
            >
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              type="submit"
              disabled={isPending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                minHeight: "42px",
                padding: "0 18px",
                border: "none",
                borderRadius: "6px",
                background: isPending
                  ? "#554515"
                  : "#c89b58",
                color: "#0a0704",
                fontSize: "12px",
                fontWeight: 700,
                cursor: isPending
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              <Save size={16} />

              {isPending
                ? "SALVANDO..."
                : "SALVAR ALTERAÇÕES"}
            </button>

            <Link
              href="/admin/barbeiros"
              style={{
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
              }}
            >
              CANCELAR
            </Link>
          </div>
        </fieldset>
      </form>
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
