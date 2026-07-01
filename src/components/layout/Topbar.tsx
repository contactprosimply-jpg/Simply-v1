"use client";

import { Menu } from "lucide-react";
import { ChantierSelector } from "@/components/ChantierSelector";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-dark/80 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="flex min-h-[4.25rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-dark bg-white text-brand shadow-sm transition hover:border-accent-blue/30 hover:shadow sm:hidden"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="mb-1 hidden text-[10px] font-semibold uppercase tracking-widest text-ink-muted sm:block">
            Chantier
          </p>
          <ChantierSelector />
        </div>
      </div>
    </header>
  );
}
