"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Save,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Service = {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
};

export default function SubscriptionForm({
  services,
}: {
  services: Service[];
}) {
  const router = useRouter();

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [planName, setPlanName] =
    useState("Plano Mensal");

  const [startsAt, setStartsAt] =
    useState(todayString());

  const [expiresAt, setExpiresAt] =
    useState(nextMonthString());

  const [selectedServices, setSelectedServices] =
    useState<string[]>([]);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  function toggleService(
    serviceId: string
  ) {
    setSelectedServices(
      (current) => {
        if (
          current.includes(
            serviceId
          )
        ) {
          return current.filter(
            (id) =>
              id !== serviceId
          );
        }

        return [
          ...current,
          serviceId,
        ];
      }
    );
  }


  function handlePhone(
    value: string
  ) {
    let numbers =
      value.replace(
        /\D/g,
        ""
      );

    numbers =
      numbers.slice(
        0,
        11
      );

    if (
      numbers.length <= 2
    ) {
      setPhone(
        numbers
          ? `(${numbers}`
          : ""
      );
      return;
    }

    if (
      numbers.length <= 6
    ) {
      setPhone(
        `(${numbers.slice(
          0,
          2
        )}) ${numbers.slice(2)}`
      );
      return;
    }

    if (
      numbers.length <= 10
    ) {
      setPhone(
        `(${numbers.slice(
          0,
          2
        )}) ${numbers.slice(
          2,
          6
        )}-${numbers.slice(6)}`
      );
      return;
    }

    setPhone(
      `(${numbers.slice(
        0,
        2
      )}) ${numbers.slice(
        2,
        7
      )}-${numbers.slice(7)}`
    );
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      customerName.trim().length < 2
    ) {
      setError(
        "Informe o nome do cliente."
      );
      return;
    }

    const phoneDigits =
      phone.replace(
        /\D/g,
        ""
      );

    if (
      phoneDigits.length < 10
    ) {
      setError(
        "Informe um WhatsApp válido."
      );
      return;
    }

    if (
      !planName.trim()
    ) {
      setError(
        "Informe o nome do plano."
      );
      return;
    }

    if (
      selectedServices.length === 0
    ) {
      setError(
        "Selecione pelo menos um serviço para a assinatura."
      );
      return;
    }

    if (
      expiresAt &&
      expiresAt < startsAt
    ) {
      setError(
        "A validade não pode ser anterior à data de início."
      );
      return;
    }

    setSaving(true);

    const supabase =
      createClient();


    // Procura cliente pelo telefone.
    // A busca abaixo pega os clientes disponíveis
    // ao administrador e compara o número normalizado.

    const {
      data: customers,
      error: customerSearchError,
    } = await supabase
      .from("customers")
      .select(
        "id, name, phone"
      );


    if (
      customerSearchError
    ) {
      setError(
        "Não foi possível consultar os clientes."
      );

      setSaving(false);
      return;
    }


    const existing =
      customers?.find(
        (customer) =>
          normalizePhone(
            customer.phone
          ) ===
          phoneDigits
      );


    let customerId =
      existing?.id;


    // Se não existe, cria

    if (!customerId) {
      const {
        data: createdCustomer,
        error: createCustomerError,
      } = await supabase
        .from("customers")
        .insert({
          name:
            customerName.trim(),

          phone,
        })
        .select("id")
        .single();


      if (
        createCustomerError ||
        !createdCustomer
      ) {
        setError(
          "Não foi possível cadastrar o cliente."
        );

        setSaving(false);
        return;
      }


      customerId =
        createdCustomer.id;
    } else {
      // Atualiza o nome/telefone
      await supabase
        .from("customers")
        .update({
          name:
            customerName.trim(),

          phone,
        })
        .eq(
          "id",
          customerId
        );
    }


    // Cria assinatura

    const {
      data: subscription,
      error: subscriptionError,
    } = await supabase
      .from("subscriptions")
      .insert({
        customer_id:
          customerId,

        name:
          planName.trim(),

        status:
          "active",

        starts_at:
          startsAt,

        expires_at:
          expiresAt || null,
      })
      .select("id")
      .single();


    if (
      subscriptionError ||
      !subscription
    ) {
      setError(
        "Não foi possível criar a assinatura."
      );

      setSaving(false);
      return;
    }


    // Relaciona serviços

    const rows =
      selectedServices.map(
        (serviceId) => ({
          subscription_id:
            subscription.id,

          service_id:
            serviceId,
        })
      );


    const {
      error:
        serviceLinkError,
    } = await supabase
      .from(
        "subscription_services"
      )
      .insert(rows);


    if (
      serviceLinkError
    ) {
      /*
       * Se o vínculo falhar,
       * removemos a assinatura
       * para não deixar cadastro
       * incompleto.
       */
      await supabase
        .from("subscriptions")
        .delete()
        .eq(
          "id",
          subscription.id
        );

      setError(
        "Não foi possível vincular os serviços ao plano."
      );

      setSaving(false);
      return;
    }


    router.push(
      "/admin/assinantes"
    );

    router.refresh();
  }


  return (
    <main className="admin-page">

      <div
        style={{
          marginBottom: 25,
        }}
      >
        <Link
          href="/admin/assinantes"
          style={{
            display:
              "inline-flex",

            alignItems:
              "center",

            gap: 7,

            color:
              "#777",

            textDecoration:
              "none",

            fontSize:
              11,
          }}
        >
          <ArrowLeft
            size={14}
          />

          VOLTAR PARA ASSINANTES
        </Link>
      </div>


      <div className="admin-header">

        <div>

          <div className="admin-eyebrow">
            PLANOS
          </div>

          <h1 className="admin-title">
            Nova assinatura
          </h1>

          <p className="admin-subtitle">
            Cadastre um assinante e defina os serviços incluídos.
          </p>

        </div>

      </div>


      <form
        className="subscription-form"
        onSubmit={
          handleSubmit
        }
      >

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}


        <div className="subscription-form-section">

          <div className="subscription-form-heading">

            <BadgeCheck
              size={18}
            />

            <div>
              <strong>
                Dados do cliente
              </strong>

              <span>
                Identificação do assinante.
              </span>
            </div>

          </div>


          <div className="form-grid">

            <div className="form-group">

              <label>
                NOME *
              </label>

              <input
                type="text"
                value={
                  customerName
                }
                placeholder="Nome do cliente"
                disabled={
                  saving
                }
                onChange={
                  (event) =>
                    setCustomerName(
                      event.target.value
                    )
                }
              />

            </div>


            <div className="form-group">

              <label>
                WHATSAPP *
              </label>

              <input
                type="tel"
                value={
                  phone
                }
                placeholder="(41) 99999-9999"
                disabled={
                  saving
                }
                onChange={
                  (event) =>
                    handlePhone(
                      event.target.value
                    )
                }
              />

            </div>

          </div>

        </div>


        <div className="subscription-form-section">

          <div className="subscription-form-heading">

            <BadgeCheck
              size={18}
            />

            <div>

              <strong>
                Dados do plano
              </strong>

              <span>
                Nome e período da assinatura.
              </span>

            </div>

          </div>


          <div className="form-grid">

            <div className="form-group full">

              <label>
                NOME DO PLANO *
              </label>

              <input
                type="text"
                value={
                  planName
                }
                disabled={
                  saving
                }
                onChange={
                  (event) =>
                    setPlanName(
                      event.target.value
                    )
                }
              />

            </div>


            <div className="form-group">

              <label>
                INÍCIO *
              </label>

              <input
                type="date"
                value={
                  startsAt
                }
                disabled={
                  saving
                }
                onChange={
                  (event) =>
                    setStartsAt(
                      event.target.value
                    )
                }
              />

            </div>


            <div className="form-group">

              <label>
                VALIDADE
              </label>

              <input
                type="date"
                value={
                  expiresAt
                }
                disabled={
                  saving
                }
                onChange={
                  (event) =>
                    setExpiresAt(
                      event.target.value
                    )
                }
              />

            </div>

          </div>

        </div>


        <div className="subscription-form-section">

          <div className="subscription-form-heading">

            <BadgeCheck
              size={18}
            />

            <div>

              <strong>
                Serviços incluídos
              </strong>

              <span>
                Marque o que este plano permite agendar.
              </span>

            </div>

          </div>


          <div className="subscription-service-options">

            {services.map(
              (service) => {

                const selected =
                  selectedServices.includes(
                    service.id
                  );


                return (
                  <button
                    type="button"
                    key={
                      service.id
                    }
                    className={
                      selected
                        ? "subscription-service selected"
                        : "subscription-service"
                    }
                    onClick={() =>
                      toggleService(
                        service.id
                      )
                    }
                  >

                    <span className="subscription-checkbox">

                      {selected && (
                        <Check
                          size={13}
                        />
                      )}

                    </span>


                    <span>

                      <strong>
                        {
                          service.name
                        }
                      </strong>

                      <small>
                        {
                          service.duration_minutes
                        }{" "}
                        min
                      </small>

                    </span>

                  </button>
                );

              }
            )}

          </div>

        </div>


        <div className="form-actions">

          <Link
            href="/admin/assinantes"
            className="admin-button-secondary"
          >
            CANCELAR
          </Link>


          <button
            type="submit"
            className="admin-button"
            disabled={
              saving
            }
          >

            <Save
              size={16}
            />

            {saving
              ? "SALVANDO..."
              : "CRIAR ASSINATURA"}

          </button>

        </div>

      </form>

    </main>
  );
}


function normalizePhone(
  phone: string
) {
  return phone.replace(
    /\D/g,
    ""
  );
}


function todayString() {
  const today =
    new Date();

  return formatDateInput(
    today
  );
}


function nextMonthString() {
  const date =
    new Date();

  date.setMonth(
    date.getMonth() + 1
  );

  return formatDateInput(
    date
  );
}


function formatDateInput(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}