"use client";

import { Plus, Printer } from "lucide-react";
import { useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import {
  BtnDanger,
  BtnPrimary,
  BtnSecondary,
  Card,
  ChantierGate,
  EmptyState,
  FormInput,
  PageHeader,
} from "@/components/ui/PageShell";
import { buildPrintableDoc, printDocument } from "@/lib/export";
import { formatDateFr } from "@/lib/types";

export function ComptesRendusView() {
  const { selectedChantier, comptesRendusForSelected, createCompteRendu, updateCompteRendu, deleteCompteRendu } =
    useChantiers();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const reset = () => {
    setTitre("");
    setContenu("");
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (id: string) => {
    const cr = comptesRendusForSelected.find((x) => x.id === id);
    if (!cr) return;
    setEditId(id);
    setTitre(cr.titre);
    setContenu(cr.contenu);
    setDate(cr.date.slice(0, 10));
    setShowForm(true);
  };

  const handleSave = () => {
    if (!titre.trim() || !contenu.trim()) return;
    if (editId) {
      updateCompteRendu(editId, { titre: titre.trim(), contenu: contenu.trim(), date });
    } else {
      createCompteRendu(titre.trim(), contenu.trim(), date);
    }
    reset();
  };

  const exportCr = (cr: (typeof comptesRendusForSelected)[0]) => {
    if (!selectedChantier) return;
    printDocument(
      cr.titre,
      buildPrintableDoc({
        title: cr.titre,
        chantier: selectedChantier.nom,
        date: formatDateFr(cr.date),
        contenu: cr.contenu,
      }),
    );
  };

  return (
    <ChantierGate message="Créez un chantier pour rédiger des comptes rendus.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Comptes rendus" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => { reset(); setShowForm(true); }}>
            <Plus className="h-5 w-5" />
            Nouveau compte rendu
          </BtnPrimary>
        </div>

        {showForm && (
          <Card className="space-y-3">
            <FormInput placeholder="Titre *" value={titre} onChange={(e) => setTitre(e.target.value)} />
            <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <textarea
              rows={8}
              placeholder="Travaux réalisés, effectifs, incidents, météo…"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              className="w-full rounded-xl border border-surface-dark bg-surface/50 px-4 py-3 text-sm"
            />
            <div className="flex gap-2">
              <BtnPrimary onClick={handleSave}>{editId ? "Mettre à jour" : "Enregistrer"}</BtnPrimary>
              <BtnSecondary onClick={reset}>Annuler</BtnSecondary>
            </div>
          </Card>
        )}

        {comptesRendusForSelected.length === 0 ? (
          <EmptyState message="Aucun compte rendu." actionLabel="Nouveau compte rendu" onAction={() => setShowForm(true)} />
        ) : (
          <ul className="space-y-3">
            {comptesRendusForSelected.map((cr) => (
              <li key={cr.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-brand">{cr.titre}</h3>
                      <p className="text-xs text-ink-muted">{formatDateFr(cr.date)}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted line-clamp-4">{cr.contenu}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <BtnSecondary onClick={() => exportCr(cr)}>
                        <Printer className="h-4 w-4" />
                        PDF
                      </BtnSecondary>
                      <BtnSecondary onClick={() => openEdit(cr.id)}>Modifier</BtnSecondary>
                      <BtnDanger onClick={() => deleteCompteRendu(cr.id)}>Supprimer</BtnDanger>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ChantierGate>
  );
}
