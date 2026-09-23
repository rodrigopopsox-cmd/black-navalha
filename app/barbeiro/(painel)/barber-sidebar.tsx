"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Ban,
  BadgeDollarSign,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Clock3,
  Menu,
  UserRound,
  Users,
  X,
} from "lucide-react";

const links = [
  {
    href: "/barbeiro",
    label: "Visão Geral",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    href: "/barbeiro/agenda",
    label: "Minha Agenda",
    icon: CalendarDays,
  },
  {
    href: "/barbeiro/assinantes",
    label: "Meus Assinantes",
    icon: Users,
  },
  {
    href: "/barbeiro/clientes",
    label: "Meus Clientes",
    icon: UserRound,
  },
  {
    href: "/barbeiro/comissoes",
    label: "Comissões",
    icon: BadgeDollarSign,
  },
  {
    href: "/barbeiro/horarios",
    label: "Horários",
    icon: Clock3,
  },
  {
    href: "/barbeiro/bloqueios",
    label: "Bloqueios",
    icon: Ban,
  },
];

export default function BarberSidebar({
  barberName,
}: {
  barberName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/barbeiro") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Fechar menu profissional"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`sidebar barber-sidebar${open ? " sidebar-open" : ""}`}
      >
        <div className="admin-logo barber-sidebar-logo">
          <div>BLACK</div>
          <span>NAVALHA</span>
          <small>ÁREA PROFISSIONAL</small>
        </div>

        <nav
          className="admin-nav"
          aria-label="Navegação da área profissional"
        >
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
          <small>PROFISSIONAL</small>
          <strong>{barberName}</strong>
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