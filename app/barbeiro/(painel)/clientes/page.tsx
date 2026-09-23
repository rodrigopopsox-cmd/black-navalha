import { CalendarClock, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type CustomerRow = {
  customer_name: string;
  customer_phone: string;
  appointments_count: number;
  last_appointment_at: string | null;
  next_appointment_at: string | null;
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (digits.length === 10) {
    return digits.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  return value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function BarberCustomersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_my_barber_customers"
  );

  if (error) {
    console.error(
      "Erro ao carregar clientes do barbeiro:",
      error.message
    );
  }

  const customers = (data ?? []) as CustomerRow[];

  return (
    <main className="barber-area-page">
      <div className="barber-page-heading">
        <div>
          <div className="barber-area-eyebrow">ÁREA DO PROFISSIONAL</div>
          <h1>Meus Clientes</h1>
          <p>
            Clientes que já possuem atendimento registrado com você.
          </p>
        </div>
      </div>

      <section className="barber-agenda-section" style={{ marginTop: 0 }}>
        <div className="barber-section-heading">
          <div>
            <span>RELACIONAMENTO</span>
            <h2>
              {customers.length}{" "}
              {customers.length === 1 ? "cliente" : "clientes"}
            </h2>
          </div>
        </div>

        {error ? (
          <div className="barber-empty-state">
            <UserRound size={26} />
            <strong>Não foi possível carregar seus clientes.</strong>
            <span>Tente novamente em alguns instantes.</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="barber-empty-state">
            <UserRound size={26} />
            <strong>Nenhum cliente encontrado.</strong>
            <span>
              Clientes atendidos por você aparecerão aqui.
            </span>
          </div>
        ) : (
          <div className="barber-customers-grid">
            {customers.map((customer) => (
              <article
                className="barber-customer-card"
                key={`${customer.customer_phone}-${customer.customer_name}`}
              >
                <div className="barber-customer-heading">
                  <div className="barber-metric-icon">
                    <UserRound size={18} />
                  </div>

                  <div>
                    <strong>{customer.customer_name}</strong>
                    <span>{formatPhone(customer.customer_phone)}</span>
                  </div>
                </div>

                <div className="barber-customer-stats">
                  <div>
                    <span>AGENDAMENTOS</span>
                    <strong>{customer.appointments_count}</strong>
                  </div>

                  <div>
                    <span>ÚLTIMO REGISTRO</span>
                    <strong>
                      {customer.last_appointment_at
                        ? formatDateTime(customer.last_appointment_at)
                        : "Ainda não ocorreu"}
                    </strong>
                  </div>

                  <div>
                    <span>PRÓXIMO HORÁRIO</span>
                    <strong>
                      {customer.next_appointment_at
                        ? formatDateTime(customer.next_appointment_at)
                        : "Nenhum"}
                    </strong>
                  </div>
                </div>

                {customer.next_appointment_at && (
                  <div className="barber-customer-next">
                    <CalendarClock size={15} />
                    Próximo atendimento confirmado na agenda
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}