"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { TacheCard } from "@/components/taches/TacheCard";
import { TacheForm } from "@/components/taches/TacheForm";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnPrimary, LoadingSpinner, NoChantier, PageHeader } from "@/components/ui/PageShell";
import { TACHE_STATUTS } from "@/lib/taches";
import type { Tache, TacheStatut } from "@/lib/types";

export function TachesView() {
  const {
    selectedChantier,
    ready,
    tachesForSelected,
    createTache,
    updateTache,
    updateTacheStatut,
    deleteTache,
  } = useChantiers();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tache | null>(null);
  const [mobileTab, setMobileTab] = useState<TacheStatut>("a_faire");

  const byStatut = useMemo(() => {
    const map: Record<TacheStatut, Tache[]> = {
      a_faire: [],
      en_cours: [],
      termine: [],
    };
    for (const t of tachesForSelected) {
      map[t.statut].push(t);
    }
    return map;
  }, [tachesForSelected]);

  if (!ready) return <LoadingSpinner />;

  if (!selectedChantier) {
    return <NoChantier label="Créez un chantier pour gérer les tâches." />;
  }

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (tache: Tache) => {
    setEditing(tache);
    setFormOpen(true);
  };

  const handleSubmit = (data: {
    titre: string;
    description: string;
    priorite: Tache["priorite"];
    echeance: string;
    statut: TacheStatut;
    lot: string;
  }) => {
    if (editing) {
      updateTache(editing.id, {
        titre: data.titre,
        description: data.description || null,
        priorite: data.priorite,
        echeance: data.echeance || null,
        statut: data.statut,
        lot: data.lot || null,
      });
    } else {
      createTache({
        titre: data.titre,
        description: data.description || undefined,
        priorite: data.priorite,
        echeance: data.echeance || undefined,
        lot: data.lot || undefined,
      });
    }
  };

  const columnStyles: Record<TacheStatut, { bar: string; bg: string }> = {
    a_faire: { bar: "bg-slate-400", bg: "bg-slate-50/80" },
    en_cours: { bar: "bg-accent-blue", bg: "bg-accent-blue/5" },
    termine: { bar: "bg-accent-cyan", bg: "bg-teal-50/80" },
  };

  const column = (statut: TacheStatut, label: string) => {
    const style = columnStyles[statut];
    return (
    <section
      key={statut}
      className={`flex min-w-0 flex-col rounded-2xl p-3 ring-1 ring-surface-dark/60 ${style.bg}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${style.bar}`} />
        <h2 className="text-sm font-semibold text-brand">{label}</h2>
        <span className="ml-auto rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-brand shadow-sm">
          {byStatut[statut].length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {byStatut[statut].length === 0 ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl border-2 border-dashed border-surface-dark/80 bg-white/50 py-10 text-center text-sm font-medium text-ink-muted transition hover:border-accent-blue/40 hover:bg-white hover:text-accent-blue"
          >
            + Ajouter une tâche
          </button>
        ) : (
          byStatut[statut].map((tache) => (
            <TacheCard
              key={tache.id}
              tache={tache}
              onEdit={openEdit}
              onDelete={deleteTache}
              onStatutChange={updateTacheStatut}
            />
          ))
        )}
      </div>
    </section>
  );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Tâches" subtitle={selectedChantier.nom} />
        <BtnPrimary onClick={openCreate}>
          <Plus className="h-5 w-5" />
          Nouvelle tâche
        </BtnPrimary>
      </div>

      {/* Mobile : onglets */}
      <div className="flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-surface-dark md:hidden">
        {TACHE_STATUTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setMobileTab(s.value)}
            className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition sm:text-sm ${
              mobileTab === s.value
                ? "bg-gradient-to-r from-accent-blue to-accent-blue/90 text-white shadow-md"
                : "text-ink-muted hover:bg-surface"
            }`}
          >
            {s.label} ({byStatut[s.value].length})
          </button>
        ))}
      </div>

      <div className="md:hidden">{column(mobileTab, TACHE_STATUTS.find((s) => s.value === mobileTab)!.label)}</div>

      {/* Tablette+ : kanban 3 colonnes */}
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {TACHE_STATUTS.map((s) => column(s.value, s.label))}
      </div>

      <TacheForm
        open={formOpen}
        tache={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
