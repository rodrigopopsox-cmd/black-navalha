"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Save } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Barber = {
  id: string;
  name: string;
};

type BlockFormProps = {
  barbers: Barber[];
};

export default function BlockForm({
  barbers,
}: BlockFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [barberId, setBarberId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!barberId) {
      setError("Selecione o profissional.");
      return;
    }

    if (!startAt || !endAt) {
      setError("Informe o início e o fim do bloqueio.");
      return;
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setError("Informe um período válido.");
      return;
    }

    if (end <= start) {
      setError(
        "O fim do bloqueio deve ser posterior ao início."
      );
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase
      .from("blocked_times")
      .insert({
        barber_id: barberId,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        reason: reason.trim() || null,
      });

    if (insertError) {
      console.error(insertError);

      setError(
        "Não foi possível cadastrar o bloqueio: " +
          insertError.message
      );

      setLoading(false);
      return;
    }

    setBarberId("");
    setStartAt("");
    setEndAt("");
    setReason("");
    setLoading(false);

    router.refresh();
  }

  return (
    <form
      className="admin-form"
      onSubmit={handleSubmit}
      style={{ marginBottom: "28px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
          paddingBottom: "20px",
          borderBottom: "1px solid #222",
        }}
      >
        <Ban size={22} color="#d29d4f" />

        <div>
          <strong
            style={{
              display: "block",
              fontSize: "13px",
            }}
          >
            Novo bloqueio
          </strong>

          <span
            style={{
              color: "#666",
              fontSize: "11px",
            }}
          >
            Defina um período em que o profissional ficará indisponível.
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
          <label htmlFor="barber">
            PROFISSIONAL *
          </label>

          <select
            id="barber"
            value={barberId}
            onChange={(event) =>
              setBarberId(event.target.value)
            }
            required
            disabled={loading || barbers.length === 0}
          >
            <option value="">
              Selecione o profissional
            </option>

            {barbers.map((barber) => (
              <option
                key={barber.id}
                value={barber.id}
              >
                {barber.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startAt">
            INÍCIO *
          </label>

          <input
            id="startAt"
            type="datetime-local"
            value={startAt}
            onChange={(event) =>
              setStartAt(event.target.value)
            }
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endAt">
            FIM *
          </label>

          <input
            id="endAt"
            type="datetime-local"
            value={endAt}
            onChange={(event) =>
              setEndAt(event.target.value)
            }
            required
            disabled={loading}
          />
        </div>

        <div className="form-group full">
          <label htmlFor="reason">
            MOTIVO
          </label>

          <input
            id="reason"
            type="text"
            placeholder="Ex: almoço, compromisso pessoal, folga..."
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            disabled={loading}
          />

          <span className="form-help">
            Campo opcional.
          </span>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="admin-button"
          type="submit"
          disabled={loading || barbers.length === 0}
        >
          <Save size={16} />

          {loading
            ? "SALVANDO..."
            : "CRIAR BLOQUEIO"}
        </button>
      </div>
    </form>
  );
}