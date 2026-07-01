"use client";

import { Menu } from "lucide-react";
import { ChantierSelector } from "@/components/ChantierSelector";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-dark bg-white/90 backdrop-blur-md">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-dark text-brand transition hover:bg-surface sm:hidden"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <ChantierSelector />
        </div>
      </div>
    </header>
  );
}
