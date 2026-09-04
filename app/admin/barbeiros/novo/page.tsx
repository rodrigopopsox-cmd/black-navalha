"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function NovoBarbeiroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Informe o nome do barbeiro.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("barbers")
      .insert({
        name: name.trim(),
        phone: phone.trim() || null,
        active,
      });

    if (error) {
      console.error(error);

      setError(
        "Não foi possível cadastrar o barbeiro: " +
          error.message
      );

      setLoading(false);
      return;
    }

    router.push("/admin/barbeiros");
    router.refresh();
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
          <div className="admin-eyebrow">
            EQUIPE
          </div>

          <h1 className="admin-title">
            Novo barbeiro
          </h1>

          <p className="admin-subtitle">
            Cadastre um novo profissional da Black Navalha.
          </p>
        </div>

      </div>


      <form
        className="admin-form"
        onSubmit={handleSubmit}
      >

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
              Você poderá configurar horários e serviços depois.
            </span>
          </div>
        </div>


        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}


        <div className="form-grid">

          <div className="form-group full">

            <label htmlFor="name">
              NOME DO BARBEIRO *
            </label>

            <input
              id="name"
              type="text"
              placeholder="Ex: Rodrigo"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              disabled={loading}
            />

          </div>


          <div className="form-group full">

            <label htmlFor="phone">
              WHATSAPP
            </label>

            <input
              id="phone"
              type="tel"
              placeholder="(41) 99999-9999"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              disabled={loading}
            />

            <span className="form-help">
              Telefone profissional. Este campo é opcional.
            </span>

          </div>


          <div className="form-group full">

            <label>
              STATUS
            </label>

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
              Somente profissionais ativos poderão receber
              novos agendamentos.
            </span>

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

            {loading
              ? "SALVANDO..."
              : "SALVAR BARBEIRO"}
          </button>

        </div>

      </form>

    </main>
  );
}