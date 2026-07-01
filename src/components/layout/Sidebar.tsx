"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Map,
  Calendar,
  Wallet,
  Camera,
  FileText,
  Clock,
  Users,
  Award,
  ClipboardList,
  HardHat,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/taches", label: "Tâches", icon: ListTodo },
  { href: "/reserves", label: "Réserves", icon: ClipboardList },
  { href: "/plans", label: "Plans", icon: Map },
  { href: "/planning", label: "Planning", icon: Calendar },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/comptes-rendus", label: "Comptes rendus", icon: FileText },
  { href: "/pointage", label: "Pointage", icon: Clock },
  { href: "/reunions", label: "PV réunions", icon: Users },
  { href: "/certificats", label: "Certificats", icon: Award },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-brand/60 backdrop-blur-sm sm:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col bg-gradient-to-b from-brand via-brand to-[#120a04] text-white shadow-2xl transition-transform duration-300 ease-out sm:static sm:translate-x-0 sm:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan shadow-lg shadow-accent-blue/30">
              <HardHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Simply BTP</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">
                Suivi chantier
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 sm:hidden"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Navigation
          </p>
          <ul className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-white/15 text-white shadow-inner"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent-cyan to-accent-blue" />
                    )}
                    <Icon
                      className={`h-5 w-5 shrink-0 transition ${active ? "text-accent-cyan" : "text-white/50 group-hover:text-white/80"}`}
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[11px] text-white/40">Simply BTP · v1.0</p>
        </div>
      </aside>
    </>
  );
}
