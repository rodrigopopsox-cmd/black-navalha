import {
  Ban,
  CalendarDays,
  Clock3,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import BarberBlockForm from "./block-form";
import BarberDeleteBlockButton from "./delete-block-button";

type BlockRow = {
  block_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default async function BarberBlocksPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_my_barber_blocks"
  );

  if (error) {
    console.error(
      "Erro ao carregar bloqueios do barbeiro:",
      error.message
    );
  }

  const blocks = (data ?? []) as BlockRow[];

  return (
    <main className="barber-area-page">
      <div className="barber-page-heading">
        <div>
          <div className="barber-area-eyebrow">ÁREA DO PROFISSIONAL</div>
          <h1>Bloqueios</h1>
          <p>
            Gerencie períodos em que sua agenda ficará indisponível.
          </p>
        </div>
      </div>

      <BarberBlockForm />

      <section className="barber-agenda-section">
        <div className="barber-section-heading">
          <div>
            <span>MEUS BLOQUEIOS</span>
            <h2>
              {blocks.length}{" "}
              {blocks.length === 1 ? "bloqueio" : "bloqueios"}
            </h2>
          </div>
        </div>

        {error ? (
          <div className="barber-empty-state">
            <Ban size={26} />
            <strong>Não foi possível carregar seus bloqueios.</strong>
            <span>Tente novamente em alguns instantes.</span>
          </div>
        ) : blocks.length === 0 ? (
          <div className="barber-empty-state">
            <Ban size={26} />
            <strong>Nenhum bloqueio cadastrado.</strong>
            <span>Seus períodos indisponíveis aparecerão aqui.</span>
          </div>
        ) : (
          <div className="barber-block-list">
            {blocks.map((block) => (
              <article
                className="barber-block-card"
                key={block.block_id}
              >
                <div>
                  <span>DATA</span>
                  <strong>
                    <CalendarDays size={14} />
                    {formatDate(block.start_at)}
                  </strong>
                </div>

                <div>
                  <span>PERÍODO</span>
                  <strong>
                    <Clock3 size={14} />
                    {formatTime(block.start_at)}
                    {" até "}
                    {formatTime(block.end_at)}
                  </strong>
                </div>

                <div>
                  <span>MOTIVO</span>
                  <strong>
                    {block.reason?.trim() || "Sem motivo informado"}
                  </strong>
                </div>

                <BarberDeleteBlockButton
                  blockId={block.block_id}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}