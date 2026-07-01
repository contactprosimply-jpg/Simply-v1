"use client";

import { Plus, ListPlus, Printer } from "lucide-react";
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
import { extractActionsFromPv, formatDateFr } from "@/lib/types";

export function ReunionsView() {
  const {
    selectedChantier,
    reunionsForSelected,
    createReunion,
    updateReunion,
    deleteReunion,
    createTachesBulk,
  } = useChantiers();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [participants, setParticipants] = useState("");
  const [contenu, setContenu] = useState("");

  const reset = () => {
    setTitre("");
    setParticipants("");
    setContenu("");
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (id: string) => {
    const r = reunionsForSelected.find((x) => x.id === id);
    if (!r) return;
    setEditId(id);
    setTitre(r.titre);
    setDate(r.date.slice(0, 10));
    setParticipants(r.participants.join(", "));
    setContenu(r.contenu);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!titre.trim() || !contenu.trim()) return;
    const parts = participants.split(",").map((p) => p.trim()).filter(Boolean);
    if (editId) {
      updateReunion(editId, { titre: titre.trim(), date, participants: parts, contenu: contenu.trim() });
    } else {
      createReunion(titre.trim(), date, parts, contenu.trim());
    }
    reset();
  };

  const exportPv = (r: (typeof reunionsForSelected)[0]) => {
    if (!selectedChantier) return;
    printDocument(
      r.titre,
      buildPrintableDoc({
        title: r.titre,
        chantier: selectedChantier.nom,
        date: formatDateFr(r.date),
        extraMeta: `Participants : ${r.participants.join(", ")}`,
        contenu: r.contenu,
      }),
    );
  };

  const spawnTasks = (contenuPv: string) => {
    const actions = extractActionsFromPv(contenuPv);
    if (actions.length === 0) {
      alert("Aucune action détectée. Utilisez des lignes commençant par - ou •");
      return;
    }
    createTachesBulk(actions);
    alert(`${actions.length} tâche(s) créée(s)`);
  };

  return (
    <ChantierGate message="Créez un chantier pour rédiger des PV de réunion.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="PV réunions" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => { reset(); setShowForm(true); }}>
            <Plus className="h-5 w-5" />
            Nouveau PV
          </BtnPrimary>
        </div>

        {showForm && (
          <Card className="space-y-3">
            <FormInput placeholder="Titre *" value={titre} onChange={(e) => setTitre(e.target.value)} />
            <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <FormInput placeholder="Participants (virgules)" value={participants} onChange={(e) => setParticipants(e.target.value)} />
            <textarea
              rows={8}
              placeholder="Compte-rendu… (actions avec - ou • en début de ligne)"
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

        {reunionsForSelected.length === 0 ? (
          <EmptyState message="Aucun procès-verbal." actionLabel="Nouveau PV" onAction={() => setShowForm(true)} />
        ) : (
          <ul className="space-y-3">
            {reunionsForSelected.map((r) => (
              <li key={r.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-brand">{r.titre}</h3>
                      <p className="text-xs text-ink-muted">{formatDateFr(r.date)}</p>
                      {r.participants.length > 0 && (
                        <p className="mt-1 text-xs text-ink-muted">Participants : {r.participants.join(", ")}</p>
                      )}
                      <p className="mt-3 whitespace-pre-wrap text-sm text-ink-muted line-clamp-4">{r.contenu}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <BtnSecondary onClick={() => spawnTasks(r.contenu)}>
                        <ListPlus className="h-4 w-4" />
                        → Tâches
                      </BtnSecondary>
                      <BtnSecondary onClick={() => exportPv(r)}>
                        <Printer className="h-4 w-4" />
                        PDF
                      </BtnSecondary>
                      <BtnSecondary onClick={() => openEdit(r.id)}>Modifier</BtnSecondary>
                      <BtnDanger onClick={() => deleteReunion(r.id)}>Supprimer</BtnDanger>
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
