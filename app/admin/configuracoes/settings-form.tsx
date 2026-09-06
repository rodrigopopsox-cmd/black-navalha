"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Save } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type BusinessSettings = {
  id: string;
  name: string;
  whatsapp: string | null;
  address: string | null;
  instagram: string | null;
};

type SettingsFormProps = {
  initialData: BusinessSettings | null;
};

export default function SettingsForm({
  initialData,
}: SettingsFormProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    whatsapp: initialData?.whatsapp ?? "",
    address: initialData?.address ?? "",
    instagram: initialData?.instagram ?? "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const name = form.name.trim();

    if (!name) {
      setError("Informe o nome da barbearia.");
      setIsLoading(false);
      return;
    }

    const payload = {
      name,
      whatsapp: form.whatsapp.trim() || null,
      address: form.address.trim() || null,
      instagram: form.instagram.trim() || null,
    };

    const supabase = createClient();

    let resultError: { message: string } | null = null;

    if (initialData) {
      const { error: updateError } = await supabase
        .from("business_settings")
        .update(payload)
        .eq("id", initialData.id);

      resultError = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("business_settings")
        .insert([payload]);

      resultError = insertError;
    }

    if (resultError) {
      setError(
        `Não foi possível salvar as configurações: ${resultError.message}`
      );
      setIsLoading(false);
      return;
    }

    setSuccess("Configurações salvas com sucesso.");
    setIsLoading(false);
    router.refresh();
  }

  function handleInput(
    field: keyof typeof form,
    value: string
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setError(null);
    setSuccess(null);
  }

  return (
    <div>
      <header
        style={{
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#c89b58",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          <Building2 size={18} />
          Configurações da barbearia
        </div>

        <p
          style={{
            color: "#777",
            fontSize: "14px",
          }}
        >
          Edite as informações públicas da Black Navalha.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={isLoading}
          style={{
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "24px",
            background: "#0e0e0e",
          }}
        >
          <label
            htmlFor="settings-name"
            style={fieldLabelStyle}
          >
            NOME DA BARBEARIA *
          </label>

          <input
            id="settings-name"
            type="text"
            required
            value={form.name}
            onChange={(event) =>
              handleInput("name", event.target.value)
            }
            placeholder="Ex.: Black Navalha"
            style={inputStyle}
          />

          <label
            htmlFor="settings-whatsapp"
            style={{
              ...fieldLabelStyle,
              marginTop: "16px",
            }}
          >
            WHATSAPP COMERCIAL
          </label>

          <input
            id="settings-whatsapp"
            type="text"
            value={form.whatsapp}
            onChange={(event) =>
              handleInput("whatsapp", event.target.value)
            }
            placeholder="Ex.: 11 99999-9999"
            style={inputStyle}
          />

          <label
            htmlFor="settings-address"
            style={{
              ...fieldLabelStyle,
              marginTop: "16px",
            }}
          >
            ENDEREÇO
          </label>

          <input
            id="settings-address"
            type="text"
            value={form.address}
            onChange={(event) =>
              handleInput("address", event.target.value)
            }
            placeholder="Ex.: Rua Exemplo, 123 - Centro"
            style={inputStyle}
          />

          <label
            htmlFor="settings-instagram"
            style={{
              ...fieldLabelStyle,
              marginTop: "16px",
            }}
          >
            INSTAGRAM
          </label>

          <input
            id="settings-instagram"
            type="text"
            value={form.instagram}
            onChange={(event) =>
              handleInput("instagram", event.target.value)
            }
            placeholder="Ex.: @blacknavalha"
            style={inputStyle}
          />

          {error && (
            <div
              role="alert"
              style={{
                marginTop: "16px",
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
                marginTop: "16px",
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

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: "18px",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "11px 22px",
              border: "none",
              borderRadius: "6px",
              background: isLoading
                ? "#554515"
                : "#c89b58",
              color: "#0a0704",
              fontWeight: 700,
              cursor: isLoading
                ? "not-allowed"
                : "pointer",
              fontSize: "13px",
              letterSpacing: "1px",
            }}
          >
            <Save size={16} />

            {isLoading
              ? "SALVANDO..."
              : "SALVAR CONFIGURAÇÕES"}
          </button>
        </fieldset>
      </form>
    </div>
  );
}

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
  maxWidth: "480px",
  padding: "10px 12px",
  border: "1px solid #333",
  borderRadius: "6px",
  background: "#141414",
  color: "#f5f2eb",
  fontSize: "14px",
  outline: "none",
} as const;
