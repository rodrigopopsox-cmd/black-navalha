"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
};

export default function CustomerEditForm({
  customer,
}: {
  customer: Customer;
}) {
  const router = useRouter();

  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email ?? "");
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const phoneDigits = phone.replace(/\D/g, "");
    const trimmedEmail = email.trim();
    const trimmedNotes = notes.trim();

    if (trimmedName.length < 2) {
      setError("Informe o nome do cliente.");
      return;
    }

    if (
      phoneDigits.length < 10 ||
      phoneDigits.length > 11
    ) {
      setError("Informe um WhatsApp válido.");
      return;
    }

    if (
      trimmedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      setError("Informe um e-mail válido.");
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("customers")
      .update({
        name: trimmedName,
        phone,
        email: trimmedEmail || null,
        notes: trimmedNotes || null,
      })
      .eq("id", customer.id);

    if (updateError) {
      setError(
        `Não foi possível atualizar o cliente: ${updateError.message}`
      );
      setSaving(false);
      return;
    }

    setName(trimmedName);
    setEmail(trimmedEmail);
    setNotes(trimmedNotes);
    setSuccess("Cliente atualizado com sucesso.");
    setSaving(false);

    router.refresh();
  }

  return (
    <main className="admin-page">
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <Link
          href="/admin/clientes"
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
          VOLTAR PARA CLIENTES
        </Link>
      </div>

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Editar cliente
          </h1>

          <p className="admin-subtitle">
            Atualize os dados do cliente sem alterar seu histórico.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={saving}
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
            Dados do cliente
          </div>

          <div style={formGridStyle}>
            <div>
              <label
                htmlFor="customer-name"
                style={fieldLabelStyle}
              >
                NOME *
              </label>

              <input
                id="customer-name"
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
                htmlFor="customer-phone"
                style={fieldLabelStyle}
              >
                WHATSAPP *
              </label>

              <input
                id="customer-phone"
                type="tel"
                required
                value={phone}
                onChange={(event) => {
                  handlePhone(event.target.value);
                  clearFeedback();
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="customer-email"
                style={fieldLabelStyle}
              >
                E-MAIL
              </label>

              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFeedback();
                }}
                placeholder="cliente@exemplo.com"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label
                htmlFor="customer-notes"
                style={fieldLabelStyle}
              >
                OBSERVAÇÕES
              </label>

              <textarea
                id="customer-notes"
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  clearFeedback();
                }}
                rows={5}
                style={{
                  ...inputStyle,
                  maxWidth: "100%",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
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
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                minHeight: "42px",
                padding: "0 18px",
                border: "none",
                borderRadius: "6px",
                background: saving
                  ? "#554515"
                  : "#c89b58",
                color: "#0a0704",
                fontSize: "12px",
                fontWeight: 700,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              <Save size={16} />

              {saving
                ? "SALVANDO..."
                : "SALVAR ALTERAÇÕES"}
            </button>

            <Link
              href="/admin/clientes"
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
