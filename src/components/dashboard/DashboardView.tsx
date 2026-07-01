"use client";

import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  Camera,
  CalendarClock,
} from "lucide-react";
import { useMemo } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { computeKpis } from "@/lib/types";

function formatCurrency(amount: number) {
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DashboardView() {
  const { selectedId, selectedChantier, taches, ready } = useChantiers();

  const kpis = useMemo(() => {
    if (!selectedId) return null;
    return computeKpis(selectedId, taches);
  }, [selectedId, taches]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  if (!selectedId || !selectedChantier) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-brand">Aucun chantier sélectionné</p>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Créez votre premier chantier avec le bouton + en haut de l&apos;écran.
        </p>
      </div>
    );
  }

  const budgetPct =
    kpis && kpis.budgetPrevu > 0
      ? Math.round((kpis.budgetConsomme / kpis.budgetPrevu) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-brand sm:text-3xl">{selectedChantier.nom}</h1>
        <p className="mt-1 text-sm text-gray-500">Vue d&apos;ensemble du chantier</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Avancement global"
          value={`${kpis?.avancementPct ?? 0} %`}
          subtitle="Tâches terminées / total"
          icon={TrendingUp}
          accent="cyan"
        />
        <KpiCard
          title="Tâches en retard"
          value={String(kpis?.tachesEnRetard ?? 0)}
          subtitle={
            (kpis?.tachesEnRetard ?? 0) === 0 ? "Aucun retard détecté" : "Action requise"
          }
          icon={AlertTriangle}
          accent={(kpis?.tachesEnRetard ?? 0) > 0 ? "warning" : "blue"}
        />
        <KpiCard
          title="Budget consommé"
          value={formatCurrency(kpis?.budgetConsomme ?? 0)}
          subtitle={`Sur ${formatCurrency(kpis?.budgetPrevu ?? 0)} prévu (${budgetPct} %)`}
          icon={Wallet}
          accent="blue"
        />
        <KpiCard
          title="Photos"
          value={String(kpis?.photosCount ?? 0)}
          subtitle="Photos du chantier"
          icon={Camera}
          accent="cyan"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-surface-dark bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-accent-blue" />
            <h2 className="text-lg font-semibold text-brand">Prochaines échéances</h2>
          </div>
          {(kpis?.prochainesEcheances.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">Aucune échéance planifiée.</p>
          ) : (
            <ul className="space-y-3">
              {kpis!.prochainesEcheances.map((tache) => (
                <li
                  key={tache.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand">{tache.titre}</p>
                    <p className="text-xs capitalize text-gray-400">{tache.priorite}</p>
                  </div>
                  <time className="shrink-0 text-xs font-medium text-accent-blue">
                    {tache.echeance ? formatDate(tache.echeance) : "—"}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-surface-dark bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent-cyan" />
            <h2 className="text-lg font-semibold text-brand">Dernières photos</h2>
          </div>
          <p className="text-sm text-gray-400">Module photos — bientôt disponible.</p>
        </section>
      </div>
    </div>
  );
}
