import Link from "next/link";
import {
  Plus,
  UserRound,
  Clock3,
  Scissors,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function BarbeirosPage() {
  const supabase = await createClient();

  const { data: barbers, error } = await supabase
    .from("barbers")
    .select("id, name, phone, photo_url, active")
    .order("name");

  return (
    <main className="admin-page">

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            EQUIPE
          </div>

          <h1 className="admin-title">
            Barbeiros
          </h1>

          <p className="admin-subtitle">
            Cadastre e gerencie os profissionais da Black Navalha.
          </p>
        </div>

        <Link
          href="/admin/barbeiros/novo"
          className="admin-button"
        >
          <Plus size={17} />
          CADASTRAR BARBEIRO
        </Link>
      </div>


      {error && (
        <div className="admin-error">
          Não foi possível carregar os barbeiros:{" "}
          {error.message}
        </div>
      )}


      {!error && (!barbers || barbers.length === 0) && (
        <div className="admin-empty">

          <UserRound size={34} />

          <strong>
            Nenhum barbeiro cadastrado
          </strong>

          <span>
            Cadastre o primeiro profissional da Black Navalha.
          </span>

          <Link
            href="/admin/barbeiros/novo"
            className="admin-button"
            style={{ marginTop: "25px" }}
          >
            <Plus size={16} />
            CADASTRAR PRIMEIRO BARBEIRO
          </Link>

        </div>
      )}


      {barbers && barbers.length > 0 && (
        <div className="barbers-grid">

          {barbers.map((barber) => (
            <article
              className="barber-card"
              key={barber.id}
            >

              <div className="barber-avatar">

                {barber.photo_url ? (
                  <img
                    src={barber.photo_url}
                    alt={barber.name}
                  />
                ) : (
                  <UserRound size={29} />
                )}

              </div>


              <div className="barber-card-info">

                <div className="barber-top">

                  <div>
                    <h2>{barber.name}</h2>

                    {barber.phone && (
                      <span>{barber.phone}</span>
                    )}
                  </div>


                  <div
                    className={
                      barber.active
                        ? "status-active"
                        : "status-inactive"
                    }
                  >
                    {barber.active
                      ? "ATIVO"
                      : "INATIVO"}
                  </div>

                </div>


                <div className="barber-actions">

                  <Link
                    href={`/admin/barbeiros/${barber.id}`}
                  >
                    EDITAR
                  </Link>


                  <Link
                    href={`/admin/barbeiros/${barber.id}/horarios`}
                  >
                    <Clock3 size={14} />
                    HORÁRIOS
                  </Link>


                  <Link
                    href={`/admin/barbeiros/${barber.id}/servicos`}
                  >
                    <Scissors size={14} />
                    SERVIÇOS
                  </Link>

                </div>

              </div>

            </article>
          ))}

        </div>
      )}

    </main>
  );
}