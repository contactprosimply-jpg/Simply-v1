"use client";

import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { TACHE_PRIORITES, TACHE_STATUTS } from "@/lib/taches";
import type { Tache, TachePriorite, TacheStatut } from "@/lib/types";

interface TacheFormProps {
  open: boolean;
  tache?: Tache | null;
  onClose: () => void;
  onSubmit: (data: {
    titre: string;
    description: string;
    priorite: TachePriorite;
    echeance: string;
    statut: TacheStatut;
  }) => void;
}

export function TacheForm({ open, tache, onClose, onSubmit }: TacheFormProps) {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [priorite, setPriorite] = useState<TachePriorite>("normale");
  const [echeance, setEcheance] = useState("");
  const [statut, setStatut] = useState<TacheStatut>("a_faire");

  useEffect(() => {
    if (!open) return;
    setTitre(tache?.titre ?? "");
    setDescription(tache?.description ?? "");
    setPriorite(tache?.priorite ?? "normale");
    setEcheance(tache?.echeance?.slice(0, 10) ?? "");
    setStatut(tache?.statut ?? "a_faire");
  }, [open, tache]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    onSubmit({
      titre: titre.trim(),
      description: description.trim(),
      priorite,
      echeance,
      statut,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand/40 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Fermer" />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand">
            {tache ? "Modifier la tâche" : "Nouvelle tâche"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="titre" className="mb-1.5 block text-sm font-medium text-brand">
              Titre *
            </label>
            <input
              id="titre"
              required
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="h-12 w-full rounded-xl border border-surface-dark px-4 text-sm focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              placeholder="Ex. Coulage dalle RDC"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-surface-dark px-4 py-3 text-sm focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              placeholder="Détails, consignes…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="priorite" className="mb-1.5 block text-sm font-medium text-brand">
                Priorité
              </label>
              <select
                id="priorite"
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as TachePriorite)}
                className="h-12 w-full rounded-xl border border-surface-dark px-4 text-sm"
              >
                {TACHE_PRIORITES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="echeance" className="mb-1.5 block text-sm font-medium text-brand">
                Échéance
              </label>
              <input
                id="echeance"
                type="date"
                value={echeance}
                onChange={(e) => setEcheance(e.target.value)}
                className="h-12 w-full rounded-xl border border-surface-dark px-4 text-sm"
              />
            </div>
          </div>

          {tache && (
            <div>
              <label htmlFor="statut" className="mb-1.5 block text-sm font-medium text-brand">
                Statut
              </label>
              <select
                id="statut"
                value={statut}
                onChange={(e) => setStatut(e.target.value as TacheStatut)}
                className="h-12 w-full rounded-xl border border-surface-dark px-4 text-sm"
              >
                {TACHE_STATUTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-accent-blue text-sm font-semibold text-white hover:opacity-95"
          >
            {tache ? "Enregistrer" : "Créer la tâche"}
          </button>
        </form>
      </div>
    </div>
  );
}
