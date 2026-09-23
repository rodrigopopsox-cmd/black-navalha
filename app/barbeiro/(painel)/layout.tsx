import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function BarberPrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/barbeiro/entrar");
  }

  const { data: barberRows, error } = await supabase.rpc(
    "get_my_barber_profile"
  );

  const barber = barberRows?.[0];

  if (error || !barber || !barber.barber_active) {
    await supabase.auth.signOut();
    redirect("/barbeiro/entrar");
  }

  return (
    <div className="barber-area-shell">
      <header className="barber-area-header">
        <div>
          <strong>
            BLACK <span>NAVALHA</span>
          </strong>
          <small>ÁREA DO PROFISSIONAL</small>
        </div>

        <p>{barber.barber_name}</p>
      </header>

      {children}
    </div>
  );
}