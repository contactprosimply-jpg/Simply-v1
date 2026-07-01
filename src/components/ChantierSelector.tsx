"use client";

import { useState } from "react";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { useChantiers } from "@/components/providers/ChantierProvider";

export function ChantierSelector() {
  const { chantiers, selectedId, selectedChantier, ready, selectChantier, createChantier } =
    useChantiers();

  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [client, setClient] = useState("");

  if (!ready) {
    return <p className="text-sm text-gray-500">Chargement…</p>;
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Aucun chantier</span>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-accent-blue px-4 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Nouveau chantier
        </button>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex max-w-md flex-col gap-2 rounded-xl border border-surface-dark bg-white p-3 shadow-sm">
        <input
          type="text"
          placeholder="Nom du chantier"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="h-11 rounded-lg border border-surface-dark px-3 text-sm"
        />
        <input
          type="text"
          placeholder="Client (optionnel)"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="h-11 rounded-lg border border-surface-dark px-3 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!nom.trim()}
            onClick={handleCreate}
            className="h-10 rounded-lg bg-accent-blue px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            Créer
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="h-10 rounded-lg border border-surface-dark px-4 text-sm text-gray-600"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <div className="flex items-start gap-2">
        <div className="relative min-w-0 flex-1">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-blue" />
          <select
            value={selectedId ?? ""}
            onChange={(e) => selectChantier(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-surface-dark bg-white pl-10 pr-10 text-sm font-medium text-brand shadow-sm focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            aria-label="Sélectionner un chantier"
          >
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
                {c.client ? ` — ${c.client}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          title="Nouveau chantier"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-surface-dark text-accent-blue hover:bg-surface"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {selectedChantier && (
        <p className="mt-1 truncate text-xs text-gray-500">
          Statut : {selectedChantier.statut.replace("_", " ")}
        </p>
      )}
    </div>
  );
}
