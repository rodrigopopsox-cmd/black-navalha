"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Layers3,
  Save,
} from "lucide-react";

import {
  createPlan,
  PlanActionInput,
  updatePlan,
} from "./actions";

type CapacityGroup = {
  id: string;
  code: string;
  name: string;
  per_barber_capacity: number;
};

type Service = {
  id: string;
  name: string;
};

type PlanFormValue = {
  id?: string;
  name: string;
  price: number | string;
  active: boolean;
  capacity_group_id: string;
  service_ids: string[];
};

export default function PlanForm({
  mode,
  groups,
  services,
  initialPlan,
}: {
  mode: "create" | "edit";
  groups: CapacityGroup[];
  services: Service[];
  initialPlan?: PlanFormValue;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialPlan?.name ?? "");
  const [price, setPrice] = useState(
    initialPlan ? String(initialPlan.price) : ""
  );
  const [active, setActive] = useState(
    initialPlan?.active ?? true
  );
  const [capacityGroupId, setCapacityGroupId] = useState(
    initialPlan?.capacity_group_id ?? groups[0]?.id ?? ""
  );
  const [serviceIds, setServiceIds] = useState<string[]>(
    initialPlan?.service_ids ?? []
  );
  const [groupCapacity, setGroupCapacity] = useState(() => {
    const selected = groups.find(
      (group) =>
        group.id ===
        (initialPlan?.capacity_group_id ?? groups[0]?.id)
    );

    return selected
      ? String(selected.per_barber_capacity)
      : "";
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (group) => group.id === capacityGroupId
      ),
    [capacityGroupId, groups]
  );

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function changeGroup(value: string) {
    setCapacityGroupId(value);

    const group = groups.find(
      (item) => item.id === value
    );

    setGroupCapacity(
      group ? String(group.per_barber_capacity) : ""
    );

    clearFeedback();
  }

  function toggleService(
    serviceId: string,
    checked: boolean
  ) {
    setServiceIds((current) =>
      checked
        ? Array.from(new Set([...current, serviceId]))
        : current.filter((id) => id !== serviceId)
    );

    clearFeedback();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedPrice = price
      .trim()
      .replace(",", ".");
    const priceNumber = Number(normalizedPrice);
    const capacityNumber = Number(groupCapacity);

    if (name.trim().length < 2) {
      setError("Informe o nome do plano.");
      return;
    }

    if (
      !normalizedPrice ||
      !Number.isFinite(priceNumber) ||
      priceNumber <= 0
    ) {
      setError("Informe um preço válido.");
      return;
    }

    if (!capacityGroupId) {
      setError("Selecione o grupo de capacidade.");
      return;
    }

    if (serviceIds.length === 0) {
      setError("Selecione pelo menos um benefício.");
      return;
    }

    if (
      mode === "edit" &&
      (!Number.isInteger(capacityNumber) ||
        capacityNumber <= 0)
    ) {
      setError("Informe uma capacidade válida.");
      return;
    }

    const input: PlanActionInput = {
      name: name.trim(),
      price: priceNumber,
      capacityGroupId,
      serviceIds,
      active,
      groupCapacity:
        mode === "edit" ? capacityNumber : undefined,
    };

    setSaving(true);

    const result =
      mode === "create"
        ? await createPlan(input)
        : await updatePlan(initialPlan!.id!, input);

    if (!result.success) {
      setError(result.message);
      setSaving(false);
      return;
    }

    setSuccess(result.message);
    setSaving(false);

    if (mode === "create") {
      router.push("/admin/planos");
    }

    router.refresh();
  }

  return (
    <main className="admin-page">
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/admin/planos"
          style={backLinkStyle}
        >
          <ArrowLeft size={14} />
          VOLTAR PARA PLANOS
        </Link>
      </div>

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            {mode === "create"
              ? "Novo plano"
              : "Editar plano"}
          </h1>

          <p className="admin-subtitle">
            {mode === "create"
              ? "Cadastre um novo plano comercial."
              : "Alterações afetam novas contratações e ciclos futuros. Ciclos já pagos permanecem congelados."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={saving} style={fieldsetStyle}>
          <div style={sectionTitleStyle}>
            <Layers3 size={18} />
            Dados comerciais
          </div>

          <div style={formGridStyle}>
            <div>
              <label htmlFor="plan-name" style={labelStyle}>
                NOME *
              </label>
              <input
                id="plan-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearFeedback();
                }}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="plan-price" style={labelStyle}>
                PREÇO POR CICLO (R$) *
              </label>
              <input
                id="plan-price"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value);
                  clearFeedback();
                }}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="capacity-group" style={labelStyle}>
                GRUPO DE CAPACIDADE *
              </label>
              <select
                id="capacity-group"
                value={capacityGroupId}
                onChange={(event) =>
                  changeGroup(event.target.value)
                }
                required
                style={inputStyle}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {mode === "edit" && (
              <div>
                <label htmlFor="group-capacity" style={labelStyle}>
                  VAGAS DO GRUPO POR BARBEIRO *
                </label>
                <input
                  id="group-capacity"
                  type="number"
                  min="1"
                  step="1"
                  value={groupCapacity}
                  onChange={(event) => {
                    setGroupCapacity(event.target.value);
                    clearFeedback();
                  }}
                  required
                  style={inputStyle}
                />
              </div>
            )}

            <label style={optionStyle}>
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => {
                  setActive(event.target.checked);
                  clearFeedback();
                }}
              />
              <span>
                <strong style={optionTitleStyle}>
                  Plano ativo
                </strong>
                <span style={optionDescriptionStyle}>
                  Planos desativados permanecem no histórico,
                  mas não aceitam novas contratações.
                </span>
              </span>
            </label>
          </div>

          {mode === "edit" && selectedGroup && (
            <div style={capacityNoticeStyle}>
              <strong>
                Capacidade compartilhada
              </strong>
              <span>
                Você está editando o grupo
                {" "}
                {selectedGroup.name}. A capacidade deste grupo
                é compartilhada por todos os planos vinculados
                a ele. O banco impedirá uma configuração que
                ultrapasse a capacidade total dos barbeiros.
              </span>
            </div>
          )}

          <div style={{ marginTop: "28px" }}>
            <div style={sectionTitleStyle}>
              <CheckCircle2 size={18} />
              Benefícios do plano
            </div>

            <div style={servicesGridStyle}>
              {services.map((service) => (
                <label
                  key={service.id}
                  style={serviceOptionStyle}
                >
                  <input
                    type="checkbox"
                    checked={serviceIds.includes(service.id)}
                    onChange={(event) =>
                      toggleService(
                        service.id,
                        event.target.checked
                      )
                    }
                  />
                  <span>{service.name}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div role="alert" style={errorStyle}>
              {error}
            </div>
          )}

          {success && (
            <div role="status" style={successStyle}>
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <div style={actionsStyle}>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...saveButtonStyle,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                opacity: saving ? 0.65 : 1,
              }}
            >
              <Save size={16} />
              {saving
                ? "SALVANDO..."
                : mode === "create"
                  ? "CADASTRAR PLANO"
                  : "SALVAR ALTERAÇÕES"}
            </button>

            <Link
              href="/admin/planos"
              style={cancelLinkStyle}
            >
              CANCELAR
            </Link>
          </div>
        </fieldset>
      </form>
    </main>
  );
}

const backLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  color: "#777",
  textDecoration: "none",
  fontSize: "11px",
} as const;

const fieldsetStyle = {
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "24px",
  background: "#0e0e0e",
} as const;

const sectionTitleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "20px",
  color: "#c89b58",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "1px",
} as const;

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "18px",
} as const;

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#888",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "1px",
} as const;

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #333",
  borderRadius: "6px",
  background: "#141414",
  color: "#f5f2eb",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
} as const;

const optionStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "14px",
  border: "1px solid #2a2a2a",
  borderRadius: "6px",
  background: "#121212",
  cursor: "pointer",
} as const;

const optionTitleStyle = {
  display: "block",
  color: "#ddd",
  fontSize: "13px",
  marginBottom: "4px",
} as const;

const optionDescriptionStyle = {
  display: "block",
  color: "#777",
  fontSize: "11px",
  lineHeight: 1.45,
} as const;

const capacityNoticeStyle = {
  display: "grid",
  gap: "5px",
  marginTop: "18px",
  padding: "14px",
  border: "1px solid #45371f",
  borderRadius: "6px",
  background: "#171208",
  color: "#c89b58",
  fontSize: "12px",
  lineHeight: 1.55,
} as const;

const servicesGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "10px",
} as const;

const serviceOptionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minHeight: "46px",
  padding: "0 13px",
  border: "1px solid #292929",
  borderRadius: "6px",
  background: "#121212",
  color: "#ccc",
  fontSize: "13px",
  cursor: "pointer",
} as const;

const errorStyle = {
  marginTop: "18px",
  padding: "12px",
  border: "1px solid #8b3232",
  borderRadius: "6px",
  background: "#1a0e0e",
  color: "#ff8c8c",
  fontSize: "13px",
} as const;

const successStyle = {
  marginTop: "18px",
  padding: "12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: "1px solid #355c3c",
  borderRadius: "6px",
  background: "#0e1a10",
  color: "#8fd49a",
  fontSize: "13px",
} as const;

const actionsStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "22px",
} as const;

const saveButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  minHeight: "42px",
  padding: "0 18px",
  border: "none",
  borderRadius: "6px",
  background: "#c89b58",
  color: "#0a0704",
  fontSize: "12px",
  fontWeight: 700,
} as const;

const cancelLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "42px",
  padding: "0 18px",
  color: "#bbb",
  background: "#141414",
  border: "1px solid #333",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 700,
} as const;