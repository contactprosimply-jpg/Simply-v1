"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { TacheCard } from "@/components/taches/TacheCard";
import { TacheForm } from "@/components/taches/TacheForm";
import { useChantiers } from "@/components/providers/ChantierProvider";
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

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  if (!selectedChantier) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-brand">Aucun chantier sélectionné</p>
        <p className="mt-2 text-sm text-gray-500">Créez un chantier pour gérer les tâches.</p>
      </div>
    );
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
  }) => {
    if (editing) {
      updateTache(editing.id, {
        titre: data.titre,
        description: data.description || null,
        priorite: data.priorite,
        echeance: data.echeance || null,
        statut: data.statut,
      });
    } else {
      createTache({
        titre: data.titre,
        description: data.description || undefined,
        priorite: data.priorite,
        echeance: data.echeance || undefined,
      });
    }
  };

  const column = (statut: TacheStatut, label: string) => (
    <section key={statut} className="flex min-w-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand">{label}</h2>
        <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-gray-500">
          {byStatut[statut].length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {byStatut[statut].length === 0 ? (
          <p className="rounded-xl border border-dashed border-surface-dark py-8 text-center text-sm text-gray-400">
            Aucune tâche
          </p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand sm:text-3xl">Tâches</h1>
          <p className="mt-1 text-sm text-gray-500">{selectedChantier.nom}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent-blue px-5 text-sm font-semibold text-white shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Nouvelle tâche
        </button>
      </div>

      {/* Mobile : onglets */}
      <div className="flex gap-1 rounded-xl bg-surface p-1 md:hidden">
        {TACHE_STATUTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setMobileTab(s.value)}
            className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition sm:text-sm ${
              mobileTab === s.value ? "bg-white text-brand shadow-sm" : "text-gray-500"
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
