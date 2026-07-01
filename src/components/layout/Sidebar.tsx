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
  HardHat,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, enabled: true },
  { href: "/taches", label: "Tâches", icon: ListTodo, enabled: true },
  { href: "/plans", label: "Plans", icon: Map, enabled: false },
  { href: "/planning", label: "Planning", icon: Calendar, enabled: false },
  { href: "/budget", label: "Budget", icon: Wallet, enabled: false },
  { href: "/photos", label: "Photos", icon: Camera, enabled: false },
  { href: "/comptes-rendus", label: "Comptes rendus", icon: FileText, enabled: false },
  { href: "/pointage", label: "Pointage", icon: Clock, enabled: false },
  { href: "/reunions", label: "PV réunions", icon: Users, enabled: false },
  { href: "/certificats", label: "Certificats", icon: Award, enabled: false },
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
          className="fixed inset-0 z-40 bg-brand/50 backdrop-blur-sm sm:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand text-white transition-transform duration-300 ease-out sm:static sm:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan">
              <HardHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Simply BTP</p>
              <p className="text-xs text-white/60">Suivi de chantier</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 sm:hidden"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon, enabled }) => (
              <li key={href}>
                {enabled ? (
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      pathname === href
                        ? "bg-white/15 text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                ) : (
                  <span className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/35">
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      bientôt
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-white/50">Simply BTP · v1.0</div>
      </aside>
    </>
  );
}
