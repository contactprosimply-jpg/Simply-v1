"use client";

import { AlertTriangle, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { Card, ChantierGate, EmptyState, PageHeader } from "@/components/ui/PageShell";
import { formatDateFr, type Tache } from "@/lib/types";

export function PlanningView() {
  const router = useRouter();
  const { selectedChantier, tachesForSelected } = useChantiers();

  const grouped = useMemo(() => {
    const map = new Map<string, Tache[]>();
    const sansDate: Tache[] = [];
    for (const t of tachesForSelected.filter((x) => x.statut !== "termine")) {
      if (!t.echeance) {
        sansDate.push(t);
        continue;
      }
      const key = t.echeance.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    return { sorted, sansDate };
  }, [tachesForSelected]);

  return (
    <ChantierGate message="Créez un chantier pour voir le planning.">
      <div className="space-y-6">
        <PageHeader title="Planning" subtitle={selectedChantier?.nom} />

        {tachesForSelected.length === 0 ? (
          <EmptyState
            message="Ajoutez des tâches avec des échéances pour alimenter le planning."
            actionLabel="Créer une tâche"
            onAction={() => router.push("/taches")}
          />
        ) : (
          <div className="space-y-4">
            {grouped.sorted.map(([date, taches]) => (
              <Card key={date}>
                <div className="mb-3 flex items-center gap-2 text-brand">
                  <Calendar className="h-5 w-5 text-accent-blue" />
                  <h2 className="font-semibold">{formatDateFr(date)}</h2>
                </div>
                <ul className="space-y-2">
                  {taches.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-brand">{t.titre}</span>
                      <span className="capitalize text-gray-400">{t.statut.replace("_", " ")}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
            {grouped.sansDate.length > 0 && (
              <Card>
                <h2 className="mb-3 font-semibold text-brand">Sans échéance</h2>
                <ul className="space-y-2">
                  {grouped.sansDate.map((t) => (
                    <li key={t.id} className="rounded-xl bg-surface px-4 py-3 text-sm font-medium text-brand">
                      {t.titre}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {tachesForSelected.some((t) => t.retard && t.statut !== "termine") && (
              <Card className="border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Tâches en retard détectées</span>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </ChantierGate>
  );
}
