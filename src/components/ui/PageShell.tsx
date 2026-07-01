"use client";

import type { LucideIcon } from "lucide-react";
import { Building2, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">{title}</h1>
      {subtitle && (
        <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-cyan" />
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function NoChantier({ label }: { label: string }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/20 ring-1 ring-accent-blue/20">
        <Building2 className="h-10 w-10 text-accent-blue" />
      </div>
      <p className="text-xl font-semibold text-brand">Aucun chantier sélectionné</p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{label}</p>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-surface-dark border-t-accent-blue" />
      </div>
      <p className="text-sm text-ink-muted">Chargement…</p>
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
  return <div className="animate-fade-in">{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`card-premium p-5 ${className}`}>
      {children}
    </div>
  );
}

export function BtnPrimary({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-primary-gradient inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center gap-2 rounded-xl border border-surface-dark bg-white px-5 text-sm font-medium text-brand shadow-sm transition hover:border-accent-blue/30 hover:bg-surface hover:shadow disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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
      className="min-h-11 rounded-lg px-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
    >
      {children}
    </button>
  );
}

export function FormInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-surface-dark bg-surface/50 px-4 text-sm text-brand transition placeholder:text-gray-400 focus:border-accent-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-blue/20 ${className}`}
    />
  );
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}) {
  return (
    <Card className="flex flex-col items-center border-dashed py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-surface to-surface-dark">
        <Icon className="h-7 w-7 text-accent-blue/70" />
      </div>
      <p className="max-w-xs text-sm leading-relaxed text-ink-muted">{message}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <BtnPrimary onClick={onAction}>{actionLabel}</BtnPrimary>
        </div>
      )}
    </Card>
  );
}

export function AlertBanner({
  children,
  variant = "warning",
}: {
  children: ReactNode;
  variant?: "warning" | "danger" | "success";
}) {
  const styles =
    variant === "danger"
      ? "border-red-200/80 bg-gradient-to-r from-red-50 to-red-50/50 text-red-800"
      : variant === "success"
        ? "border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-emerald-50/50 text-emerald-800"
        : "border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/50 text-amber-900";
  return (
    <div className={`rounded-xl border px-4 py-3.5 text-sm font-medium shadow-sm ${styles}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue/15 to-accent-cyan/10">
          <Icon className="h-5 w-5 text-accent-blue" />
        </div>
        <h2 className="text-base font-semibold text-brand sm:text-lg">{title}</h2>
      </div>
      {action}
    </div>
  );
}
