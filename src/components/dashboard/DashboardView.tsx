"use client";

import Link from "next/link";
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
import { Card, LoadingSpinner, NoChantier } from "@/components/ui/PageShell";
import { computeKpis, formatCurrency, formatDateFr } from "@/lib/types";

export function DashboardView() {
  const { selectedId, selectedChantier, data, photosForSelected, ready } = useChantiers();

  const kpis = useMemo(() => {
    if (!selectedId) return null;
    return computeKpis(selectedId, data);
  }, [selectedId, data]);

  if (!ready) return <LoadingSpinner />;

  if (!selectedId || !selectedChantier) {
    return (
      <NoChantier label="Créez votre premier chantier avec le bouton + en haut de l'écran." />
    );
  }

  const budgetPct =
    kpis && kpis.budgetPrevu > 0
      ? Math.round((kpis.budgetConsomme / kpis.budgetPrevu) * 100)
      : 0;

  const dernieresPhotos = photosForSelected.slice(0, 4);

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
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-accent-blue" />
              <h2 className="text-lg font-semibold text-brand">Prochaines échéances</h2>
            </div>
            <Link href="/taches" className="text-xs font-medium text-accent-blue">
              Voir tâches
            </Link>
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
                    {tache.echeance ? formatDateFr(tache.echeance) : "—"}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent-cyan" />
              <h2 className="text-lg font-semibold text-brand">Dernières photos</h2>
            </div>
            <Link href="/photos" className="text-xs font-medium text-accent-blue">
              Voir tout
            </Link>
          </div>
          {dernieresPhotos.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune photo.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {dernieresPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl border border-surface-dark"
                >
                  <img
                    src={photo.url}
                    alt=""
                    className="aspect-video w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
