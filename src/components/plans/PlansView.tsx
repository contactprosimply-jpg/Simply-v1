"use client";

import { Plus, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { PlanViewer } from "@/components/plans/PlanViewer";
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
import { FileUpload } from "@/components/ui/FileUpload";
import { LotSelect } from "@/components/ui/LotSelect";
import { formatDateFr } from "@/lib/types";

export function PlansView() {
  const { selectedChantier, plansForSelected, createPlan, updatePlan, deletePlan } = useChantiers();
  const [nom, setNom] = useState("");
  const [url, setUrl] = useState("");
  const [lot, setLot] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ url: string; nom: string } | null>(null);

  const reset = () => {
    setNom("");
    setUrl("");
    setLot("");
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (id: string) => {
    const p = plansForSelected.find((x) => x.id === id);
    if (!p) return;
    setEditId(id);
    setNom(p.nom);
    setUrl(p.pdfUrl);
    setLot(p.lot ?? "");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!nom.trim() || !url.trim()) return;
    if (editId) {
      updatePlan(editId, { nom: nom.trim(), pdfUrl: url.trim(), lot: lot || null });
    } else {
      createPlan(nom.trim(), url.trim(), lot || undefined);
    }
    reset();
  };

  return (
    <ChantierGate message="Créez un chantier pour gérer les plans.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Plans" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => { reset(); setShowForm(true); }}>
            <Plus className="h-5 w-5" />
            Importer un plan
          </BtnPrimary>
        </div>

        {showForm && (
          <Card>
            <div className="space-y-3">
              <FormInput placeholder="Nom du plan *" value={nom} onChange={(e) => setNom(e.target.value)} />
              <LotSelect value={lot} onChange={setLot} />
              <FileUpload
                accept="application/pdf,image/*"
                label="Importer PDF ou image"
                onDataUrl={(dataUrl, fileName) => {
                  setUrl(dataUrl);
                  if (!nom) setNom(fileName.replace(/\.[^.]+$/, ""));
                }}
              />
              <FormInput placeholder="Ou URL du PDF" value={url} onChange={(e) => setUrl(e.target.value)} />
              <div className="flex gap-2">
                <BtnPrimary onClick={handleSave}>{editId ? "Mettre à jour" : "Ajouter"}</BtnPrimary>
                <BtnSecondary onClick={reset}>Annuler</BtnSecondary>
              </div>
            </div>
          </Card>
        )}

        {plansForSelected.length === 0 ? (
          <EmptyState message="Aucun plan importé." actionLabel="Importer un plan" onAction={() => setShowForm(true)} icon={FileText} />
        ) : (
          <ul className="space-y-3">
            {plansForSelected.map((plan) => (
              <li key={plan.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10">
                      <FileText className="h-6 w-6 text-accent-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand">{plan.nom}</p>
                      <p className="text-xs text-ink-muted">
                        {formatDateFr(plan.createdAt)}
                        {plan.lot ? ` · ${plan.lot}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BtnPrimary onClick={() => setViewer({ url: plan.pdfUrl, nom: plan.nom })}>
                      Voir
                    </BtnPrimary>
                    <a
                      href={plan.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-1 rounded-xl border border-surface-dark px-3 text-sm text-accent-blue"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ouvrir
                    </a>
                    <BtnSecondary onClick={() => openEdit(plan.id)}>Modifier</BtnSecondary>
                    <BtnDanger onClick={() => deletePlan(plan.id)}>Supprimer</BtnDanger>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
        {viewer && <PlanViewer url={viewer.url} nom={viewer.nom} onClose={() => setViewer(null)} />}
      </div>
    </ChantierGate>
  );
}
