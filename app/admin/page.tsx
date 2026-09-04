import {
  CalendarDays,
  DollarSign,
  UserRound,
  Users,
} from "lucide-react";

export default function AdminPage() {
  return (
    <main className="admin-page">

      <div className="admin-header">

        <div>
          <div className="admin-eyebrow">
            BLACK NAVALHA
          </div>

          <h1 className="admin-title">
            Visão Geral
          </h1>

          <p className="admin-subtitle">
            Acompanhe a operação da barbearia.
          </p>
        </div>

      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
        }}
      >

        <DashboardCard
          title="Agendamentos hoje"
          value="0"
          icon={<CalendarDays />}
        />

        <DashboardCard
          title="Faturamento hoje"
          value="R$ 0,00"
          icon={<DollarSign />}
        />

        <DashboardCard
          title="Clientes"
          value="0"
          icon={<Users />}
        />

        <DashboardCard
          title="Barbeiros ativos"
          value="0"
          icon={<UserRound />}
        />

      </div>


      <div
        style={{
          marginTop: "35px",
          background: "#0e0e0e",
          border: "1px solid #222",
          borderRadius: "8px",
          padding: "25px",
        }}
      >

        <h2
          style={{
            fontSize: "16px",
            marginBottom: "25px",
          }}
        >
          Agenda de hoje
        </h2>

        <div className="admin-empty">

          <CalendarDays size={30} />

          <strong>
            Nenhum agendamento hoje
          </strong>

          <span>
            Os próximos atendimentos aparecerão aqui.
          </span>

        </div>

      </div>

    </main>
  );
}


function DashboardCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0e0e0e",
        border: "1px solid #222",
        borderRadius: "8px",
        padding: "22px",
      }}
    >
      <div
        style={{
          color: "#d29d4f",
          marginBottom: "22px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#777",
          fontSize: "11px",
          marginBottom: "7px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          color: "white",
          fontSize: "25px",
        }}
      >
        {value}
      </strong>

    </div>
  );
}