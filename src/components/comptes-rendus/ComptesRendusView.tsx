"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnDanger, BtnPrimary, Card, ChantierGate, EmptyState, FormInput, PageHeader } from "@/components/ui/PageShell";
import { formatDateFr } from "@/lib/types";

export function ComptesRendusView() {
  const { selectedChantier, comptesRendusForSelected, createCompteRendu, deleteCompteRendu } =
    useChantiers();
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAdd = () => {
    if (!titre.trim() || !contenu.trim()) return;
    createCompteRendu(titre.trim(), contenu.trim(), date);
    setTitre("");
    setContenu("");
    setShowForm(false);
  };

  return (
    <ChantierGate message="Créez un chantier pour rédiger des comptes rendus.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Comptes rendus" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5" />
            Nouveau compte rendu
          </BtnPrimary>
        </div>

        {showForm && (
          <Card className="space-y-3">
            <FormInput placeholder="Titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
            <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <textarea
              rows={6}
              placeholder="Contenu du compte rendu…"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              className="w-full rounded-xl border border-surface-dark px-4 py-3 text-sm"
            />
            <BtnPrimary onClick={handleAdd}>Enregistrer</BtnPrimary>
          </Card>
        )}

        {comptesRendusForSelected.length === 0 ? (
          <EmptyState
            message="Aucun compte rendu pour ce chantier."
            actionLabel="Nouveau compte rendu"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <ul className="space-y-3">
            {comptesRendusForSelected.map((cr) => (
              <li key={cr.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-brand">{cr.titre}</h3>
                      <p className="text-xs text-gray-400">{formatDateFr(cr.date)}</p>
                    </div>
                    <BtnDanger onClick={() => deleteCompteRendu(cr.id)}>Supprimer</BtnDanger>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">{cr.contenu}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ChantierGate>
  );
}
