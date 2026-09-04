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

type Subscription = {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  planName: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  selectedServiceIds: string[];
};

export default function SubscriptionEditForm({
  subscription,
  services,
}: {
  subscription: Subscription;
  services: Service[];
}) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState(
    subscription.customerName
  );

  const [phone, setPhone] = useState(
    subscription.phone
  );

  const [planName, setPlanName] = useState(
    subscription.planName
  );

  const [status, setStatus] = useState(
    subscription.status
  );

  const [startsAt, setStartsAt] = useState(
    subscription.startsAt
  );

  const [expiresAt, setExpiresAt] = useState(
    subscription.expiresAt
  );

  const [selectedServices, setSelectedServices] =
    useState<string[]>(
      subscription.selectedServiceIds
    );

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  function toggleService(serviceId: string) {
    setSelectedServices((current) => {
      if (current.includes(serviceId)) {
        return current.filter(
          (id) => id !== serviceId
        );
      }

      return [...current, serviceId];
    });
  }

  function handlePhone(value: string) {
    let numbers = value.replace(/\D/g, "");

    numbers = numbers.slice(0, 11);

    if (numbers.length <= 2) {
      setPhone(
        numbers ? `(${numbers}` : ""
      );
      return;
    }

    if (numbers.length <= 6) {
      setPhone(
        `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      );
      return;
    }

    if (numbers.length <= 10) {
      setPhone(
        `(${numbers.slice(0, 2)}) ${numbers.slice(
          2,
          6
        )}-${numbers.slice(6)}`
      );
      return;
    }

    setPhone(
      `(${numbers.slice(0, 2)}) ${numbers.slice(
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
    setSuccess("");

    if (customerName.trim().length < 2) {
      setError("Informe o nome do cliente.");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");

    if (phoneDigits.length < 10) {
      setError("Informe um WhatsApp válido.");
      return;
    }

    if (!planName.trim()) {
      setError("Informe o nome do plano.");
      return;
    }

    if (selectedServices.length === 0) {
      setError(
        "Selecione pelo menos um serviço para a assinatura."
      );
      return;
    }

    if (expiresAt && expiresAt < startsAt) {
      setError(
        "A validade não pode ser anterior à data de início."
      );
      return;
    }

    setSaving(true);

    const supabase = createClient();

    // Atualiza o cliente
    const {
      error: customerError,
    } = await supabase
      .from("customers")
      .update({
        name: customerName.trim(),
        phone,
      })
      .eq("id", subscription.customerId);

    if (customerError) {
      setError(
        "Não foi possível atualizar os dados do cliente."
      );
      setSaving(false);
      return;
    }

    // Atualiza a assinatura
    const {
      error: subscriptionError,
    } = await supabase
      .from("subscriptions")
      .update({
        name: planName.trim(),
        status,
        starts_at: startsAt,
        expires_at: expiresAt || null,
      })
      .eq("id", subscription.id);

    if (subscriptionError) {
      setError(
        "Não foi possível atualizar a assinatura."
      );
      setSaving(false);
      return;
    }

    // Remove os vínculos antigos
    const {
      error: deleteServicesError,
    } = await supabase
      .from("subscription_services")
      .delete()
      .eq(
        "subscription_id",
        subscription.id
      );

    if (deleteServicesError) {
      setError(
        "Não foi possível atualizar os serviços da assinatura."
      );
      setSaving(false);
      return;
    }

    // Cria os novos vínculos
    const rows = selectedServices.map(
      (serviceId) => ({
        subscription_id:
          subscription.id,
        service_id: serviceId,
      })
    );

    const {
      error: insertServicesError,
    } = await supabase
      .from("subscription_services")
      .insert(rows);

    if (insertServicesError) {
      setError(
        "Não foi possível salvar os serviços da assinatura."
      );
      setSaving(false);
      return;
    }

    setSuccess(
      "Assinatura atualizada com sucesso."
    );

    setSaving(false);

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
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            color: "#777",
            textDecoration: "none",
            fontSize: 11,
          }}
        >
          <ArrowLeft size={14} />

          VOLTAR PARA ASSINANTES
        </Link>
      </div>

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            PLANOS
          </div>

          <h1 className="admin-title">
            Editar assinatura
          </h1>

          <p className="admin-subtitle">
            Atualize os dados, período e serviços do plano.
          </p>
        </div>
      </div>

      <form
        className="subscription-form"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "14px 16px",
              marginBottom: 18,
              border:
                "1px solid rgba(66, 196, 118, .3)",
              borderRadius: 6,
              background:
                "rgba(66, 196, 118, .08)",
              color: "#70d59a",
              fontSize: 13,
            }}
          >
            {success}
          </div>
        )}

        <div className="subscription-form-section">
          <div className="subscription-form-heading">
            <BadgeCheck size={18} />

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
                value={customerName}
                disabled={saving}
                onChange={(event) =>
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
                value={phone}
                disabled={saving}
                onChange={(event) =>
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
            <BadgeCheck size={18} />

            <div>
              <strong>
                Dados do plano
              </strong>

              <span>
                Nome, período e situação da assinatura.
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
                value={planName}
                disabled={saving}
                onChange={(event) =>
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
                value={startsAt}
                disabled={saving}
                onChange={(event) =>
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
                value={expiresAt}
                disabled={saving}
                onChange={(event) =>
                  setExpiresAt(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="form-group full">
              <label>
                STATUS
              </label>

              <select
                value={status}
                disabled={saving}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
              >
                <option value="active">
                  ATIVO
                </option>

                <option value="paused">
                  PAUSADO
                </option>

                <option value="cancelled">
                  CANCELADO
                </option>

                <option value="expired">
                  EXPIRADO
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="subscription-form-section">
          <div className="subscription-form-heading">
            <BadgeCheck size={18} />

            <div>
              <strong>
                Serviços incluídos
              </strong>

              <span>
                Marque os serviços permitidos neste plano.
              </span>
            </div>
          </div>

          <div className="subscription-service-options">
            {services.map((service) => {
              const selected =
                selectedServices.includes(
                  service.id
                );

              return (
                <button
                  type="button"
                  key={service.id}
                  disabled={saving}
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
                      <Check size={13} />
                    )}
                  </span>

                  <span>
                    <strong>
                      {service.name}
                    </strong>

                    <small>
                      {service.duration_minutes} min
                    </small>
                  </span>
                </button>
              );
            })}
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
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? "SALVANDO..."
              : "SALVAR ALTERAÇÕES"}
          </button>
        </div>
      </form>
    </main>
  );
}