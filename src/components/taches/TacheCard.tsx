"use client";

import { AlertTriangle, Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatEcheance, isTacheEnRetard, TACHE_PRIORITES } from "@/lib/taches";
import type { Tache, TacheStatut } from "@/lib/types";

interface TacheCardProps {
  tache: Tache;
  onEdit: (tache: Tache) => void;
  onDelete: (id: string) => void;
  onStatutChange: (id: string, statut: TacheStatut) => void;
}

export function TacheCard({ tache, onEdit, onDelete, onStatutChange }: TacheCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const enRetard = isTacheEnRetard(tache);
  const priorite = TACHE_PRIORITES.find((p) => p.value === tache.priorite);

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm transition ${
        enRetard ? "border-amber-300" : "border-surface-dark"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-brand">{tache.titre}</h3>
          {tache.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{tache.description}</p>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-surface"
            aria-label="Actions"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer"
              />
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-surface-dark bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onEdit(tache);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-brand hover:bg-surface"
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(tache.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {priorite && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorite.color}`}>
            {priorite.label}
          </span>
        )}
        {tache.echeance && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            {formatEcheance(tache.echeance)}
          </span>
        )}
        {enRetard && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            En retard
          </span>
        )}
      </div>

      {tache.statut !== "termine" && (
        <div className="mt-3 flex gap-2">
          {tache.statut === "a_faire" && (
            <button
              type="button"
              onClick={() => onStatutChange(tache.id, "en_cours")}
              className="h-10 flex-1 rounded-lg bg-accent-blue/10 text-sm font-medium text-accent-blue"
            >
              Démarrer
            </button>
          )}
          {tache.statut === "en_cours" && (
            <button
              type="button"
              onClick={() => onStatutChange(tache.id, "termine")}
              className="h-10 flex-1 rounded-lg bg-accent-cyan/10 text-sm font-medium text-teal-700"
            >
              Terminer
            </button>
          )}
        </div>
      )}
    </article>
  );
}
