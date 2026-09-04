"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Save,
  Scissors,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Barber = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  category: string;
  price: number | string;
  duration_minutes: number;
  subscriber_service: boolean;
};

type Props = {
  barber: Barber;
  services: Service[];
  initiallySelected: string[];
};

export default function BarberServicesForm({
  barber,
  services,
  initiallySelected,
}: Props) {
  const [selected, setSelected] =
    useState<string[]>(initiallySelected);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const categories = Array.from(
    new Set(services.map((service) => service.category))
  );

  function toggleService(serviceId: string) {
    setMessage("");

    setSelected((current) => {
      if (current.includes(serviceId)) {
        return current.filter(
          (id) => id !== serviceId
        );
      }

      return [...current, serviceId];
    });
  }

  function selectAll() {
    setSelected(
      services.map((service) => service.id)
    );

    setMessage("");
  }

  function clearAll() {
    setSelected([]);
    setMessage("");
  }

  async function saveServices() {
    setSaving(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("barber_services")
      .delete()
      .eq("barber_id", barber.id);

    if (deleteError) {
      setError(
        "Erro ao atualizar serviços: " +
          deleteError.message
      );

      setSaving(false);
      return;
    }

    if (selected.length > 0) {
      const rows = selected.map(
        (serviceId) => ({
          barber_id: barber.id,
          service_id: serviceId,
        })
      );

      const { error: insertError } =
        await supabase
          .from("barber_services")
          .insert(rows);

      if (insertError) {
        setError(
          "Erro ao salvar serviços: " +
            insertError.message
        );

        setSaving(false);
        return;
      }
    }

    setMessage(
      "Serviços salvos com sucesso."
    );

    setSaving(false);
  }

  return (
    <main className="admin-page">

      <Link
        href="/admin/barbeiros"
        className="service-back"
      >
        <ArrowLeft size={14} />
        VOLTAR PARA BARBEIROS
      </Link>


      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            SERVIÇOS
          </div>

          <h1 className="admin-title">
            Serviços de {barber.name}
          </h1>

          <p className="admin-subtitle">
            Selecione tudo que este profissional
            pode realizar.
          </p>
        </div>
      </div>


      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-success">
          {message}
        </div>
      )}


      <div className="service-toolbar">

        <div>
          <strong>
            {selected.length}
          </strong>

          <span>
            de {services.length} selecionados
          </span>
        </div>

        <div className="service-toolbar-actions">

          <button
            type="button"
            onClick={selectAll}
          >
            SELECIONAR TODOS
          </button>

          <button
            type="button"
            onClick={clearAll}
          >
            LIMPAR
          </button>

        </div>

      </div>


      {categories.map((category) => {

        const categoryServices =
          services.filter(
            (service) =>
              service.category === category
          );

        return (
          <section
            key={category}
            className="barber-service-category"
          >

            <div className="service-category-header">

              <div>
                <Scissors size={16} />

                <h2>{category}</h2>

                <span>
                  {categoryServices.length}
                </span>
              </div>

            </div>


            <div className="barber-service-list">

              {categoryServices.map(
                (service) => {

                  const checked =
                    selected.includes(
                      service.id
                    );

                  return (
                    <button
                      key={service.id}
                      type="button"
                      className={
                        checked
                          ? "barber-service-option selected"
                          : "barber-service-option"
                      }
                      onClick={() =>
                        toggleService(
                          service.id
                        )
                      }
                    >

                      <span className="service-check">
                        {checked && (
                          <Check size={14} />
                        )}
                      </span>


                      <span className="service-main">

                        <strong>
                          {service.name}
                        </strong>

                        <small>
                          {service.duration_minutes} min
                        </small>

                      </span>


                      <span className="service-option-price">

                        {service.subscriber_service
                          ? "INCLUSO NO PLANO"
                          : Number(
                              service.price
                            ).toLocaleString(
                              "pt-BR",
                              {
                                style:
                                  "currency",
                                currency:
                                  "BRL",
                              }
                            )}

                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </section>
        );
      })}


      <div className="service-save">

        <button
          type="button"
          className="admin-button"
          onClick={saveServices}
          disabled={saving}
        >

          <Save size={16} />

          {saving
            ? "SALVANDO..."
            : "SALVAR SERVIÇOS"}

        </button>

      </div>

    </main>
  );
}