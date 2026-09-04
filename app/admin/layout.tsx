import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Scissors,
  Users,
  UserRound,
  Ban,
  Settings,
  BadgeCheck
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="admin-logo">
          <div>BLACK</div>
          <span>NAVALHA</span>
          <small>ADMINISTRAÇÃO</small>
        </div>

        <nav className="admin-nav">
          <Link href="/admin">
            <ChartNoAxesColumnIncreasing size={19} />
            Visão Geral
          </Link>

          <Link href="/admin/agenda">
            <CalendarDays size={19} />
            Agenda
          </Link>

          <Link href="/admin/barbeiros">
            <UserRound size={19} />
            Barbeiros
          </Link>

          <Link href="/admin/clientes">
            <Users size={19} />
            Clientes
          </Link>

          <Link href="/admin/assinantes">
  <BadgeCheck size={19} />
  Assinantes
</Link>

          <Link href="/admin/servicos">
            <Scissors size={19} />
            Serviços
          </Link>

          <Link href="/admin/bloqueios">
            <Ban size={19} />
            Bloqueios
          </Link>

          <Link href="/admin/configuracoes">
            <Settings size={19} />
            Configurações
          </Link>
        </nav>

        <div className="sidebar-user">
          <small>LOGADO COMO</small>
          <strong>{profile.name}</strong>
        </div>
      </aside>

      <div className="admin-content">{children}</div>
    </div>
  );
}