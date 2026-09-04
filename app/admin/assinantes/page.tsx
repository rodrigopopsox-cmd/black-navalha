import Link from "next/link";

import {
  BadgeCheck,
  Plus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";


export default async function AssinantesPage() {

  const supabase =
    await createClient();


  const {
    data: subscriptions,
    error,
  } = await supabase
    .from("subscriptions")
    .select(`
      id,
      name,
      status,
      starts_at,
      expires_at,
      customers (
        id,
        name,
        phone
      ),
      subscription_services (
        services (
          id,
          name
        )
      )
    `)
    .order(
      "created_at",
      {
        ascending: false,
      }
    );


  return (

    <main className="admin-page">


      <div className="admin-header">

        <div>

          <div className="admin-eyebrow">
            PLANOS
          </div>

          <h1 className="admin-title">
            Assinantes
          </h1>

          <p className="admin-subtitle">
            Gerencie clientes e serviços incluídos nos planos.
          </p>

        </div>


        <Link
          href="/admin/assinantes/novo"
          className="admin-button"
        >

          <Plus size={17} />

          NOVA ASSINATURA

        </Link>

      </div>


      {error && (

        <div className="admin-error">

          Não foi possível carregar os assinantes:{" "}
          {error.message}

        </div>

      )}


      {!error &&
        (
          !subscriptions ||
          subscriptions.length === 0
        ) && (

        <div className="admin-empty">

          <BadgeCheck size={34} />

          <strong>
            Nenhum assinante cadastrado
          </strong>

          <span>
            Cadastre a primeira assinatura da Black Navalha.
          </span>


          <Link
            href="/admin/assinantes/novo"
            className="admin-button"
            style={{
              marginTop: 25,
            }}
          >

            <Plus size={16} />

            CADASTRAR ASSINANTE

          </Link>

        </div>

      )}


      {subscriptions &&
        subscriptions.length > 0 && (

        <div className="subscriptions-grid">


          {subscriptions.map(
            (subscription) => {

              const customer =
                getRelation(
                  subscription.customers
                );


              const serviceNames =
                (
                  subscription.subscription_services ??
                  []
                )
                  .map(
                    (link: any) =>
                      getRelation(
                        link.services
                      )?.name
                  )
                  .filter(Boolean);


              return (

                <article
                  className="subscription-card"
                  key={
                    subscription.id
                  }
                >


                  <div className="subscription-card-top">

                    <div className="subscription-icon">

                      <BadgeCheck
                        size={24}
                      />

                    </div>


                    <div>

                      <h2>
                        {
                          customer?.name ??
                          "Cliente"
                        }
                      </h2>

                      <span>
                        {
                          customer?.phone ??
                          ""
                        }
                      </span>

                    </div>


                    <Status
                      status={
                        subscription.status
                      }
                    />

                  </div>


                  <div className="subscription-plan">

                    <small>
                      PLANO
                    </small>

                    <strong>
                      {
                        subscription.name
                      }
                    </strong>

                  </div>


                  <div className="subscription-period">

                    <span>

                      Início

                      <strong>
                        {
                          formatDate(
                            subscription.starts_at
                          )
                        }
                      </strong>

                    </span>


                    <span>

                      Validade

                      <strong>

                        {
                          subscription.expires_at
                            ? formatDate(
                                subscription.expires_at
                              )
                            : "Sem vencimento"
                        }

                      </strong>

                    </span>

                  </div>


                  <div className="subscription-services">

                    <small>
                      SERVIÇOS INCLUÍDOS
                    </small>


                    {serviceNames.length >
                    0 ? (

                      <div>

                        {serviceNames.map(
                          (
                            serviceName
                          ) => (

                            <span
                              key={
                                serviceName
                              }
                            >

                              ✓{" "}
                              {
                                serviceName
                              }

                            </span>

                          )
                        )}

                      </div>

                    ) : (

                      <p>
                        Nenhum serviço configurado.
                      </p>

                    )}

                  </div>


                  <div className="subscription-actions">

                    <Link
                      href={`/admin/assinantes/${subscription.id}`}
                    >
                      EDITAR ASSINATURA
                    </Link>

                  </div>


                </article>

              );

            }
          )}

        </div>

      )}


    </main>

  );

}


function Status({
  status,
}: {
  status: string;
}) {

  const labels:
    Record<string, string> = {

    active:
      "ATIVO",

    paused:
      "PAUSADO",

    cancelled:
      "CANCELADO",

    expired:
      "EXPIRADO",

  };


  return (

    <span
      className={`subscription-status subscription-${status}`}
    >
      {labels[status] ?? status}
    </span>

  );

}


function formatDate(
  value: string
) {

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);


  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(
      year,
      month - 1,
      day
    )
  );

}


function getRelation<T>(
  value: T | T[] | null
): T | null {

  if (!value) {
    return null;
  }


  if (
    Array.isArray(value)
  ) {

    return (
      value[0] ??
      null
    );

  }


  return value;

}