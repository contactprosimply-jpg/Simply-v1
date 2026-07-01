"use client";

import type { ReactNode } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

export function NoChantier({ label }: { label: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-lg font-medium text-brand">Aucun chantier sélectionné</p>
      <p className="mt-2 text-sm text-gray-500">{label}</p>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent" />
    </div>
  );
}

export function ChantierGate({
  children,
  message,
}: {
  children: ReactNode;
  message: string;
}) {
  const { ready, selectedChantier } = useChantiers();
  if (!ready) return <LoadingSpinner />;
  if (!selectedChantier) return <NoChantier label={message} />;
  return children;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-surface-dark bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function BtnPrimary({
  children,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent-blue px-5 text-sm font-semibold text-white shadow-sm"
    >
      {children}
    </button>
  );
}

export function BtnDanger({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-red-600 hover:underline"
    >
      {children}
    </button>
  );
}
