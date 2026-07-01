import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: "blue" | "cyan" | "warning";
}

const accentClasses = {
  blue: "from-accent-blue/15 to-accent-blue/5 text-accent-blue",
  cyan: "from-accent-cyan/15 to-accent-cyan/5 text-accent-cyan",
  warning: "from-amber-100 to-amber-50 text-amber-600",
};

export function KpiCard({ title, value, subtitle, icon: Icon, accent = "blue" }: KpiCardProps) {
  return (
    <article className="animate-fade-in rounded-2xl border border-surface-dark bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-brand">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accentClasses[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
