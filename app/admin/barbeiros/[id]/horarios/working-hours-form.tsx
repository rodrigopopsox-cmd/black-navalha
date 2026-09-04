"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Barber = {
  id: string;
  name: string;
};

type ExistingHour = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

type Day = {
  day: number;
  name: string;
  active: boolean;
  start: string;
  end: string;
};

const dayNames = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export default function WorkingHoursForm({
  barber,
  existingHours,
}: {
  barber: Barber;
  existingHours: ExistingHour[];
}) {
  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [days, setDays] = useState<Day[]>(
    dayNames.map((name, day) => {
      const saved = existingHours.find(
        (item) => item.day_of_week === day
      );

      return {
        day,
        name,
        active: saved?.active ?? (day !== 0),
        start: saved?.start_time?.slice(0, 5) ?? "09:00",
        end: saved?.end_time?.slice(0, 5) ?? "20:30",
      };
    })
  );

  function updateDay(
    day: number,
    field: "active" | "start" | "end",
    value: boolean | string
  ) {
    setDays((current) =>
      current.map((item) =>
        item.day === day
          ? { ...item, [field]: value }
          : item
      )
    );
  }

  async function save() {
    setSaving(true);
    setError("");
    setSuccess("");

    for (const day of days) {
      if (day.active && day.end <= day.start) {
        setError(
          `O horário final de ${day.name} deve ser posterior ao horário inicial.`
        );
        setSaving(false);
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("working_hours")
      .delete()
      .eq("barber_id", barber.id);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    const rows = days.map((day) => ({
      barber_id: barber.id,
      day_of_week: day.day,
      start_time: day.start,
      end_time: day.end,
      active: day.active,
    }));

    const { error: insertError } = await supabase
      .from("working_hours")
      .insert(rows);

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSuccess("Horários salvos com sucesso.");
    setSaving(false);
  }

  return (
    <main className="admin-page">
      <div style={{ marginBottom: 25 }}>
        <Link
          href="/admin/barbeiros"
          style={{
            display: "inline-flex",
            gap: 7,
            alignItems: "center",
            color: "#777",
            textDecoration: "none",
            fontSize: 11,
          }}
        >
          <ArrowLeft size={14} />
          VOLTAR PARA BARBEIROS
        </Link>
      </div>

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">JORNADA</div>

          <h1 className="admin-title">
            Horários de {barber.name}
          </h1>

          <p className="admin-subtitle">
            Defina os dias e horários em que este profissional
            pode receber agendamentos.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-error">{error}</div>
      )}

      {success && (
        <div className="admin-success">{success}</div>
      )}

      <div
        style={{
          background: "#0e0e0e",
          border: "1px solid #222",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {days.map((day) => (
          <div
            key={day.day}
            className="working-day"
          >
            <div className="working-day-name">
              <input
                type="checkbox"
                checked={day.active}
                onChange={(event) =>
                  updateDay(
                    day.day,
                    "active",
                    event.target.checked
                  )
                }
              />

              <strong>{day.name}</strong>
            </div>

            {day.active ? (
              <div className="working-times">
                <Clock3 size={15} />

                <input
                  type="time"
                  value={day.start}
                  onChange={(event) =>
                    updateDay(
                      day.day,
                      "start",
                      event.target.value
                    )
                  }
                />

                <span>até</span>

                <input
                  type="time"
                  value={day.end}
                  onChange={(event) =>
                    updateDay(
                      day.day,
                      "end",
                      event.target.value
                    )
                  }
                />
              </div>
            ) : (
              <span className="day-off">
                FOLGA
              </span>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 20,
        }}
      >
        <button
          className="admin-button"
          onClick={save}
          disabled={saving}
        >
          <Save size={16} />

          {saving
            ? "SALVANDO..."
            : "SALVAR HORÁRIOS"}
        </button>
      </div>
    </main>
  );
}