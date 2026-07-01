import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: "blue" | "cyan" | "warning";
  className?: string;
}

const accentConfig = {
  blue: {
    icon: "from-accent-blue/20 to-accent-blue/5 text-accent-blue",
    strip: "bg-accent-blue",
  },
  cyan: {
    icon: "from-accent-cyan/25 to-accent-cyan/5 text-orange-600",
    strip: "bg-accent-cyan",
  },
  warning: {
    icon: "from-amber-100 to-amber-50 text-amber-600",
    strip: "bg-amber-500",
  },
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "blue",
  className = "",
}: KpiCardProps) {
  const cfg = accentConfig[accent];

  return (
    <article className={`card-premium group relative overflow-hidden p-5 ${className}`}>
      <div className={`absolute left-0 top-0 h-1 w-full ${cfg.strip} opacity-80`} />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-brand">{value}</p>
          {subtitle && <p className="mt-1.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br transition group-hover:scale-105 ${cfg.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
