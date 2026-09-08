"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  Scissors,
} from "lucide-react";

import { createService } from "./actions";

export default function ServiceCreateForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [subscriberService, setSubscriberService] =
    useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();
    const normalizedPrice = price
      .trim()
      .replace(",", ".");
    const priceNumber = Number(normalizedPrice);
    const durationNumber = Number(duration);

    if (trimmedName.length < 2) {
      setError("Informe o nome do serviço.");
      return;
    }

    if (!trimmedCategory) {
      setError("Informe a categoria do serviço.");
      return;
    }

    if (
      !normalizedPrice ||
      !Number.isFinite(priceNumber) ||
      priceNumber < 0
    ) {
      setError("Informe um preço válido.");
      return;
    }

    if (
      !Number.isInteger(durationNumber) ||
      durationNumber <= 0
    ) {
      setError(
        "Informe uma duração válida em minutos."
      );
      return;
    }

    setSaving(true);

    const result = await createService({
      name: trimmedName,
      category: trimmedCategory,
      price: priceNumber,
      durationMinutes: durationNumber,
      description: trimmedDescription,
      subscriberService,
      active,
    });

    if (!result.success) {
      setError(result.message);
      setSaving(false);
      return;
    }

    setSuccess(result.message);
    setSaving(false);

    router.push("/admin/servicos");
    router.refresh();
  }

  return (
    <main className="admin-page">
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/admin/servicos"
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
          VOLTAR PARA SERVIÇOS
        </Link>
      </div>

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Novo serviço
          </h1>

          <p className="admin-subtitle">
            Cadastre um novo serviço oferecido pela barbearia.
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
            <Scissors size={18} />
            Dados do serviço
          </div>

          <div style={formGridStyle}>
            <div>
              <label
                htmlFor="service-name"
                style={fieldLabelStyle}
              >
                NOME *
              </label>

              <input
                id="service-name"
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
                htmlFor="service-category"
                style={fieldLabelStyle}
              >
                CATEGORIA *
              </label>

              <input
                id="service-category"
                type="text"
                required
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  clearFeedback();
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="service-price"
                style={fieldLabelStyle}
              >
                PREÇO (R$) *
              </label>

              <input
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value);
                  clearFeedback();
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="service-duration"
                style={fieldLabelStyle}
              >
                DURAÇÃO (MINUTOS) *
              </label>

              <input
                id="service-duration"
                type="number"
                min="1"
                step="1"
                required
                value={duration}
                onChange={(event) => {
                  setDuration(event.target.value);
                  clearFeedback();
                }}
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                htmlFor="service-description"
                style={fieldLabelStyle}
              >
                DESCRIÇÃO
              </label>

              <textarea
                id="service-description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
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

            <label style={optionStyle}>
              <input
                type="checkbox"
                checked={subscriberService}
                onChange={(event) => {
                  setSubscriberService(
                    event.target.checked
                  );
                  clearFeedback();
                }}
              />

              <span>
                <strong style={optionTitleStyle}>
                  Serviço de plano
                </strong>

                <span style={optionDescriptionStyle}>
                  Identifica este serviço como destinado a assinaturas.
                </span>
              </span>
            </label>

            <label style={optionStyle}>
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => {
                  setActive(event.target.checked);
                  clearFeedback();
                }}
              />

              <span>
                <strong style={optionTitleStyle}>
                  Serviço ativo
                </strong>

                <span style={optionDescriptionStyle}>
                  Mantém o serviço disponível nos fluxos que utilizam serviços ativos.
                </span>
              </span>
            </label>
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
                ? "CADASTRANDO..."
                : "CADASTRAR SERVIÇO"}
            </button>

            <Link
              href="/admin/servicos"
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

const optionStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "14px",
  border: "1px solid #2a2a2a",
  borderRadius: "6px",
  background: "#121212",
  cursor: "pointer",
} as const;

const optionTitleStyle = {
  display: "block",
  color: "#ddd",
  fontSize: "13px",
  marginBottom: "4px",
} as const;

const optionDescriptionStyle = {
  display: "block",
  color: "#777",
  fontSize: "11px",
  lineHeight: 1.45,
} as const;
