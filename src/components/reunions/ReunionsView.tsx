"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnDanger, BtnPrimary, Card, ChantierGate, EmptyState, FormInput, PageHeader } from "@/components/ui/PageShell";
import { formatDateFr } from "@/lib/types";

export function ReunionsView() {
  const { selectedChantier, reunionsForSelected, createReunion, deleteReunion } = useChantiers();
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [participants, setParticipants] = useState("");
  const [contenu, setContenu] = useState("");

  const handleAdd = () => {
    if (!titre.trim() || !contenu.trim()) return;
    createReunion(
      titre.trim(),
      date,
      participants
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      contenu.trim(),
    );
    setTitre("");
    setParticipants("");
    setContenu("");
    setShowForm(false);
  };

  return (
    <ChantierGate message="Créez un chantier pour rédiger des PV de réunion.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="PV réunions" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5" />
            Nouveau PV
          </BtnPrimary>
        </div>

        {showForm && (
          <Card className="space-y-3">
            <FormInput placeholder="Titre de la réunion" value={titre} onChange={(e) => setTitre(e.target.value)} />
            <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <FormInput
              placeholder="Participants (séparés par des virgules)"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
            <textarea
              rows={6}
              placeholder="Compte-rendu de réunion…"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              className="w-full rounded-xl border border-surface-dark px-4 py-3 text-sm"
            />
            <BtnPrimary onClick={handleAdd}>Enregistrer</BtnPrimary>
          </Card>
        )}

        {reunionsForSelected.length === 0 ? (
          <EmptyState
            message="Aucun procès-verbal pour ce chantier."
            actionLabel="Nouveau PV"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <ul className="space-y-3">
            {reunionsForSelected.map((r) => (
              <li key={r.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-brand">{r.titre}</h3>
                      <p className="text-xs text-gray-400">{formatDateFr(r.date)}</p>
                    </div>
                    <BtnDanger onClick={() => deleteReunion(r.id)}>Supprimer</BtnDanger>
                  </div>
                  {r.participants.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Participants : {r.participants.join(", ")}
                    </p>
                  )}
                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">{r.contenu}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ChantierGate>
  );
}
