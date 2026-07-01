"use client";

import { Settings, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnDanger, BtnPrimary, BtnSecondary, FormInput } from "@/components/ui/PageShell";
import type { ChantierStatut } from "@/lib/types";

const STATUTS: { value: ChantierStatut; label: string }[] = [
  { value: "planifie", label: "Planifié" },
  { value: "en_cours", label: "En cours" },
  { value: "suspendu", label: "Suspendu" },
  { value: "termine", label: "Terminé" },
];

export function ChantierSettingsButton() {
  const { selectedChantier, updateChantier, deleteChantier } = useChantiers();
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [client, setClient] = useState("");
  const [adresse, setAdresse] = useState("");
  const [montant, setMontant] = useState("");
  const [statut, setStatut] = useState<ChantierStatut>("en_cours");

  if (!selectedChantier) return null;

  const openModal = () => {
    setNom(selectedChantier.nom);
    setClient(selectedChantier.client ?? "");
    setAdresse(selectedChantier.adresse ?? "");
    setMontant(selectedChantier.montant?.toString() ?? "");
    setStatut(selectedChantier.statut);
    setOpen(true);
  };

  const save = () => {
    if (!nom.trim()) return;
    updateChantier(selectedChantier.id, {
      nom: nom.trim(),
      client: client.trim() || null,
      adresse: adresse.trim() || null,
      montant: montant ? parseFloat(montant) : null,
      statut,
    });
    setOpen(false);
  };

  const remove = () => {
    if (!confirm(`Supprimer le chantier « ${selectedChantier.nom} » et toutes ses données ?`)) return;
    deleteChantier(selectedChantier.id);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openModal}
        title="Paramètres chantier"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-surface-dark text-ink-muted transition hover:border-accent-blue/30 hover:text-accent-blue"
      >
        <Settings className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand/50 p-4 backdrop-blur-sm sm:items-center">
      <button type="button" className="absolute inset-0" onClick={() => setOpen(false)} aria-label="Fermer" />
      <div className="relative z-10 w-full max-w-md animate-fade-in-up rounded-2xl bg-white p-6 shadow-[var(--shadow-glow)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand">Paramètres chantier</h2>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <FormInput placeholder="Nom *" value={nom} onChange={(e) => setNom(e.target.value)} />
          <FormInput placeholder="Client" value={client} onChange={(e) => setClient(e.target.value)} />
          <FormInput placeholder="Adresse chantier" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          <FormInput
            type="number"
            placeholder="Montant marché €"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as ChantierStatut)}
            className="h-11 w-full rounded-xl border border-surface-dark px-4 text-sm"
          >
            {STATUTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <BtnPrimary onClick={save}>Enregistrer</BtnPrimary>
          <BtnSecondary onClick={() => setOpen(false)}>Annuler</BtnSecondary>
          <button
            type="button"
            onClick={remove}
            className="ml-auto inline-flex h-11 items-center gap-1 text-sm font-medium text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
