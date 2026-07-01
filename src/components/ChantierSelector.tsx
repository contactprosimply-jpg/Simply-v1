"use client";

import { useState } from "react";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnPrimary, BtnSecondary, FormInput } from "@/components/ui/PageShell";

export function ChantierSelector() {
  const { chantiers, selectedId, selectedChantier, ready, selectChantier, createChantier } =
    useChantiers();

  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [client, setClient] = useState("");

  if (!ready) {
    return (
      <div className="h-11 w-48 animate-pulse rounded-xl bg-surface-dark" aria-hidden />
    );
  }

  const handleCreate = () => {
    if (!nom.trim()) return;
    createChantier(nom.trim(), client.trim() || undefined);
    setNom("");
    setClient("");
    setShowForm(false);
  };

  if (chantiers.length === 0 && !showForm) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-muted">Commencez par créer un chantier</span>
        <BtnPrimary onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Nouveau chantier
        </BtnPrimary>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex max-w-md flex-col gap-3 rounded-2xl border border-surface-dark bg-white p-4 shadow-[var(--shadow-card)]">
        <FormInput
          type="text"
          placeholder="Nom du chantier"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <FormInput
          type="text"
          placeholder="Client (optionnel)"
          value={client}
          onChange={(e) => setClient(e.target.value)}
        />
        <div className="flex gap-2">
          <BtnPrimary onClick={handleCreate} className={!nom.trim() ? "pointer-events-none opacity-50" : ""}>
            Créer
          </BtnPrimary>
          <BtnSecondary onClick={() => setShowForm(false)}>Annuler</BtnSecondary>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-blue" />
          <select
            value={selectedId ?? ""}
            onChange={(e) => selectChantier(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-surface-dark bg-white pl-10 pr-10 text-sm font-semibold text-brand shadow-sm transition focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            aria-label="Sélectionner un chantier"
          >
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
                {c.client ? ` — ${c.client}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          title="Nouveau chantier"
          className="btn-primary-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {selectedChantier && (
        <p className="mt-1.5 truncate text-xs text-ink-muted">
          <span className="inline-flex items-center rounded-md bg-accent-cyan/15 px-2 py-0.5 font-medium capitalize text-orange-800">
            {selectedChantier.statut.replace("_", " ")}
          </span>
        </p>
      )}
    </div>
  );
}
