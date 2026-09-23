import { Clock3 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type WorkingHour = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
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

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default async function BarberWorkingHoursPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_my_barber_working_hours"
  );

  if (error) {
    console.error(
      "Erro ao carregar horários do barbeiro:",
      error.message
    );
  }

  const hours = (data ?? []) as WorkingHour[];

  return (
    <main className="barber-area-page">
      <div className="barber-page-heading">
        <div>
          <div className="barber-area-eyebrow">ÁREA DO PROFISSIONAL</div>
          <h1>Horários</h1>
          <p>
            Consulte sua jornada semanal configurada pela administração.
          </p>
        </div>
      </div>

      {error ? (
        <div className="barber-empty-state">
          <Clock3 size={26} />
          <strong>Não foi possível carregar sua jornada.</strong>
          <span>Tente novamente em alguns instantes.</span>
        </div>
      ) : (
        <section className="barber-working-hours-list">
          {dayNames.map((name, day) => {
            const workingHour = hours.find(
              (item) => item.day_of_week === day
            );

            const active = workingHour?.active ?? false;

            return (
              <article className="barber-working-hour" key={day}>
                <div>
                  <span>DIA</span>
                  <strong>{name}</strong>
                </div>

                {active && workingHour ? (
                  <div className="barber-working-hour-period">
                    <Clock3 size={16} />
                    <strong>
                      {formatTime(workingHour.start_time)}
                      {" até "}
                      {formatTime(workingHour.end_time)}
                    </strong>
                  </div>
                ) : (
                  <span className="barber-day-off">FOLGA</span>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}