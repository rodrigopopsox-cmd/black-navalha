"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Ban,
  BadgeCheck,
  BadgeDollarSign,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Layers3,
  Menu,
  Scissors,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Visão Geral", icon: ChartNoAxesColumnIncreasing },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/barbeiros", label: "Barbeiros", icon: UserRound },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/assinantes", label: "Assinantes", icon: BadgeCheck },
  { href: "/admin/comissoes", label: "Comissões", icon: BadgeDollarSign },
  { href: "/admin/planos", label: "Planos", icon: Layers3 },
  { href: "/admin/servicos", label: "Serviços", icon: Scissors },
  { href: "/admin/bloqueios", label: "Bloqueios", icon: Ban },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Fechar menu administrativo"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
        <div className="admin-logo">
          <div>BLACK</div>
          <span>NAVALHA</span>
          <small>ADMINISTRAÇÃO</small>
        </div>

        <nav className="admin-nav" aria-label="Navegação administrativa">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "active" : undefined}
              onClick={() => setOpen(false)}
              title={open ? undefined : label}
            >
              <Icon size={19} />
              <span className="admin-nav-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-user">
          <small>LOGADO COMO</small>
          <strong>{userName}</strong>
        </div>

        <button
          type="button"
          className="admin-sidebar-toggle"
          aria-label={open ? "Recolher menu" : "Expandir menu"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
          <span>{open ? "Fechar" : "Menu"}</span>
        </button>
      </aside>
    </>
  );
}