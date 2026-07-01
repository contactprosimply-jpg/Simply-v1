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
import { CERTIFICAT_TYPES, certificatLabel, formatDateFr } from "@/lib/types";

export function CertificatsView() {
  const { selectedChantier, certificatsForSelected, createCertificat, updateCertificat, deleteCertificat } =
    useChantiers();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [type, setType] = useState(CERTIFICAT_TYPES[0].value);
  const [contenu, setContenu] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const reset = () => {
    setContenu("");
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (id: string) => {
    const c = certificatsForSelected.find((x) => x.id === id);
    if (!c) return;
    setEditId(id);
    setType(c.type as typeof type);
    setContenu(c.contenu);
    setDate(c.date.slice(0, 10));
    setShowForm(true);
  };

  const handleSave = () => {
    if (!contenu.trim()) return;
    if (editId) {
      updateCertificat(editId, { type, contenu: contenu.trim(), date });
    } else {
      createCertificat(type, contenu.trim(), date);
    }
    reset();
  };

  const exportCert = (c: (typeof certificatsForSelected)[0]) => {
    if (!selectedChantier) return;
    printDocument(
      certificatLabel(c.type),
      buildPrintableDoc({
        title: certificatLabel(c.type),
        chantier: selectedChantier.nom,
        date: formatDateFr(c.date),
        contenu: c.contenu,
      }),
    );
  };

  return (
    <ChantierGate message="Créez un chantier pour gérer les certificats de réception.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Certificats de réception" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => { reset(); setShowForm(true); }}>
            <Plus className="h-5 w-5" />
            Nouveau certificat
          </BtnPrimary>
        </div>

        {showForm && (
          <Card className="space-y-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="h-11 w-full rounded-xl border border-surface-dark px-4 text-sm"
            >
              {CERTIFICAT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <textarea
              rows={6}
              placeholder="Contenu du certificat…"
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

        {certificatsForSelected.length === 0 ? (
          <EmptyState message="Aucun certificat." actionLabel="Nouveau certificat" onAction={() => setShowForm(true)} />
        ) : (
          <ul className="space-y-3">
            {certificatsForSelected.map((c) => (
              <li key={c.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-brand">{certificatLabel(c.type)}</h3>
                      <p className="text-xs text-ink-muted">{formatDateFr(c.date)}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted line-clamp-4">{c.contenu}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <BtnSecondary onClick={() => exportCert(c)}>
                        <Printer className="h-4 w-4" />
                        PDF
                      </BtnSecondary>
                      <BtnSecondary onClick={() => openEdit(c.id)}>Modifier</BtnSecondary>
                      <BtnDanger onClick={() => deleteCertificat(c.id)}>Supprimer</BtnDanger>
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
