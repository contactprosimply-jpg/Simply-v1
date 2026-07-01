"use client";

import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  Camera,
  CalendarClock,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { useMemo } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { Card, LoadingSpinner, NoChantier, SectionTitle } from "@/components/ui/PageShell";
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

  const avancement = kpis?.avancementPct ?? 0;
  const dernieresPhotos = photosForSelected.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero chantier */}
      <div className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand-light to-brand-muted p-6 text-white shadow-[var(--shadow-glow)] sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent-cyan/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-accent-blue/25 blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                Chantier actif
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {selectedChantier.nom}
              </h1>
              {selectedChantier.client && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/75">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {selectedChantier.client}
                </p>
              )}
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium capitalize backdrop-blur-sm">
              {selectedChantier.statut.replace("_", " ")}
            </span>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-white/80">Avancement global</span>
              <span className="font-bold">{avancement} %</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${avancement}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          className="animate-fade-in-up stagger-1"
          title="Avancement"
          value={`${avancement} %`}
          subtitle="Tâches terminées"
          icon={TrendingUp}
          accent="cyan"
        />
        <KpiCard
          className="animate-fade-in-up stagger-2"
          title="Retards"
          value={String(kpis?.tachesEnRetard ?? 0)}
          subtitle={
            (kpis?.tachesEnRetard ?? 0) === 0 ? "Tout est à jour" : "Action requise"
          }
          icon={AlertTriangle}
          accent={(kpis?.tachesEnRetard ?? 0) > 0 ? "warning" : "blue"}
        />
        <KpiCard
          className="animate-fade-in-up stagger-3"
          title="Budget"
          value={formatCurrency(kpis?.budgetConsomme ?? 0)}
          subtitle={`${budgetPct} % du prévu`}
          icon={Wallet}
          accent="blue"
        />
        <KpiCard
          className="animate-fade-in-up stagger-4"
          title="Photos"
          value={String(kpis?.photosCount ?? 0)}
          subtitle="Sur le chantier"
          icon={Camera}
          accent="cyan"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle
            icon={CalendarClock}
            title="Prochaines échéances"
            action={
              <Link
                href="/taches"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-accent-blue hover:underline"
              >
                Voir tout
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {(kpis?.prochainesEcheances.length ?? 0) === 0 ? (
            <p className="rounded-xl bg-surface/80 px-4 py-6 text-center text-sm text-ink-muted">
              Aucune échéance planifiée
            </p>
          ) : (
            <ul className="space-y-2">
              {kpis!.prochainesEcheances.map((tache) => (
                <li
                  key={tache.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-surface/60 px-4 py-3 transition hover:border-accent-blue/20 hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand">{tache.titre}</p>
                    <p className="mt-0.5 text-xs capitalize text-ink-muted">{tache.priorite}</p>
                  </div>
                  <time className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-accent-blue shadow-sm">
                    {tache.echeance ? formatDateFr(tache.echeance) : "—"}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle
            icon={Camera}
            title="Dernières photos"
            action={
              <Link
                href="/photos"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-accent-blue hover:underline"
              >
                Voir tout
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {dernieresPhotos.length === 0 ? (
            <p className="rounded-xl bg-surface/80 px-4 py-6 text-center text-sm text-ink-muted">
              Aucune photo pour l&apos;instant
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {dernieresPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group overflow-hidden rounded-xl ring-1 ring-surface-dark transition hover:ring-accent-blue/30"
                >
                  <img
                    src={photo.url}
                    alt=""
                    className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105"
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
