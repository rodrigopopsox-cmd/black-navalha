import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("category")
    .order("name");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#f5f2eb",
        padding: "60px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            color: "#c89b58",
            textTransform: "uppercase",
            letterSpacing: "4px",
            fontWeight: 700,
          }}
        >
          Black Navalha
        </p>

        <h1
          style={{
            fontSize: "56px",
            margin: "10px 0",
          }}
        >
          Agende seu horário
        </h1>

        <p
          style={{
            color: "#999",
            marginBottom: "40px",
          }}
        >
          Escolha um serviço para começar.
        </p>

        {error && (
          <div
            style={{
              padding: "20px",
              border: "1px solid #8b3232",
              color: "#ff8c8c",
            }}
          >
            Erro ao carregar serviços: {error.message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "15px",
          }}
        >
          {services?.map((service) => (
            <div
              key={service.id}
              style={{
                background: "#111",
                border: "1px solid #242424",
                padding: "25px",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  color: "#c89b58",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                {service.category}
              </div>

              <h2
                style={{
                  fontSize: "20px",
                  marginBottom: "12px",
                }}
              >
                {service.name}
              </h2>

              {service.description && (
                <p
                  style={{
                    color: "#999",
                    fontSize: "14px",
                    minHeight: "45px",
                  }}
                >
                  {service.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  borderTop: "1px solid #242424",
                  paddingTop: "15px",
                }}
              >
                <strong style={{ color: "#c89b58" }}>
                  {service.subscriber_service
                    ? "Incluso no plano"
                    : Number(service.price).toLocaleString(
                        "pt-BR",
                        {
                          style: "currency",
                          currency: "BRL",
                        }
                      )}
                </strong>

                <span style={{ color: "#777" }}>
                  {service.duration_minutes} min
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}