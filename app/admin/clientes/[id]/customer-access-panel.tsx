"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { provisionCustomerAccess } from "./actions";

export default function CustomerAccessPanel({
  customerId,
  email,
  accessConfigured,
}: {
  customerId: string;
  email: string | null;
  accessConfigured: boolean;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function provision() {
    if (loading || accessConfigured) {
      return;
    }

    if (
      !window.confirm(
        "Enviar convite para o cliente definir a própria senha da Central do Cliente?"
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await provisionCustomerAccess(customerId);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(result.message);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        marginBottom: 22,
        padding: 20,
        border: "1px solid #222",
        borderRadius: 8,
        background: "#0e0e0e",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              color: "#c89b58",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
            }}
          >
            <ShieldCheck size={17} />
            CENTRAL DO CLIENTE
          </div>

          <strong
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              color: accessConfigured ? "#8fd49a" : "#ddd",
              fontSize: 14,
            }}
          >
            {accessConfigured && <CheckCircle2 size={16} />}
            {accessConfigured
              ? "ACESSO CONFIGURADO"
              : "ACESSO NÃO CONFIGURADO"}
          </strong>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginTop: 8,
              color: email ? "#999" : "#666",
              fontSize: 12,
              overflowWrap: "anywhere",
            }}
          >
            <Mail size={14} />
            {email || "Cliente sem e-mail cadastrado"}
          </div>

          <p
            style={{
              maxWidth: 600,
              margin: "10px 0 0",
              color: "#777",
              fontSize: 11,
              lineHeight: 1.6,
            }}
          >
            {accessConfigured
              ? "O cliente já possui uma identidade vinculada à Central. A senha nunca é exibida ou administrada por esta tela."
              : "O convite cria o acesso seguro e permite que o próprio cliente defina sua senha. O Admin não conhece a senha."}
          </p>
        </div>

        {!accessConfigured && (
          <button
            type="button"
            disabled={loading || !email}
            onClick={provision}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              minHeight: 40,
              padding: "0 14px",
              border: "1px solid #4b3b24",
              borderRadius: 6,
              background: loading || !email ? "#17130d" : "#c89b58",
              color: loading || !email ? "#777" : "#0a0704",
              fontSize: 11,
              fontWeight: 800,
              cursor:
                loading || !email ? "not-allowed" : "pointer",
            }}
          >
            <KeyRound size={15} />
            {loading ? "ENVIANDO..." : "ENVIAR CONVITE DE ACESSO"}
          </button>
        )}
      </div>

      {error && (
        <div className="admin-error" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}

      {success && (
        <div className="admin-success" style={{ marginTop: 14 }}>
          {success}
        </div>
      )}
    </section>
  );
}