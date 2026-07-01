"use client";

import { LOTS_BTP } from "@/lib/types";

export function LotSelect({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-11 w-full rounded-xl border border-surface-dark bg-surface/50 px-4 text-sm focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 ${className}`}
    >
      <option value="">— Lot —</option>
      {LOTS_BTP.map((lot) => (
        <option key={lot} value={lot}>
          {lot}
        </option>
      ))}
    </select>
  );
}
