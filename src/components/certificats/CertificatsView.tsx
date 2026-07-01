"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnDanger, BtnPrimary, Card, ChantierGate, PageHeader } from "@/components/ui/PageShell";
import { formatDateFr } from "@/lib/types";

const TYPES = ["Réception provisoire", "Réception définitive", "Levée de réserves", "Autre"];

export function CertificatsView() {
  const { selectedChantier, certificatsForSelected, createCertificat, deleteCertificat } =
    useChantiers();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState(TYPES[0]);
  const [contenu, setContenu] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAdd = () => {
    if (!contenu.trim()) return;
    createCertificat(type, contenu.trim(), date);
    setContenu("");
    setShowForm(false);
  };

  return (
    <ChantierGate message="Créez un chantier pour gérer les certificats de réception.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Certificats de réception" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5" />
            Nouveau certificat
          </BtnPrimary>
        </div>

        {showForm && (
          <Card className="space-y-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-11 w-full rounded-xl border border-surface-dark px-4 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-surface-dark px-4 text-sm"
            />
            <textarea
              rows={6}
              placeholder="Contenu du certificat…"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              className="w-full rounded-xl border border-surface-dark px-4 py-3 text-sm"
            />
            <BtnPrimary onClick={handleAdd}>Enregistrer</BtnPrimary>
          </Card>
        )}

        {certificatsForSelected.length === 0 ? (
          <Card className="text-center text-sm text-gray-400">Aucun certificat.</Card>
        ) : (
          <ul className="space-y-3">
            {certificatsForSelected.map((c) => (
              <li key={c.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="rounded-full bg-accent-blue/10 px-2.5 py-0.5 text-xs font-medium text-accent-blue">
                        {c.type}
                      </span>
                      <p className="mt-2 text-xs text-gray-400">{formatDateFr(c.date)}</p>
                    </div>
                    <BtnDanger onClick={() => deleteCertificat(c.id)}>Supprimer</BtnDanger>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">{c.contenu}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ChantierGate>
  );
}
