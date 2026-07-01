"use client";

import { Plus, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnDanger, BtnPrimary, BtnSecondary, Card, ChantierGate, EmptyState, FormInput, PageHeader } from "@/components/ui/PageShell";
import { formatDateFr } from "@/lib/types";

export function PlansView() {
  const { selectedChantier, plansForSelected, createPlan, deletePlan } = useChantiers();
  const [nom, setNom] = useState("");
  const [url, setUrl] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (!nom.trim() || !url.trim()) return;
    createPlan(nom.trim(), url.trim());
    setNom("");
    setUrl("");
    setShowForm(false);
  };

  return (
    <ChantierGate message="Créez un chantier pour gérer les plans.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Plans" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5" />
            Importer un plan
          </BtnPrimary>
        </div>

        {showForm && (
          <Card>
            <div className="space-y-3">
              <FormInput placeholder="Nom du plan" value={nom} onChange={(e) => setNom(e.target.value)} />
              <FormInput placeholder="URL du PDF" value={url} onChange={(e) => setUrl(e.target.value)} />
              <div className="flex gap-2">
                <BtnPrimary onClick={handleAdd}>Ajouter</BtnPrimary>
                <BtnSecondary onClick={() => setShowForm(false)}>Annuler</BtnSecondary>
              </div>
            </div>
          </Card>
        )}

        {plansForSelected.length === 0 ? (
          <EmptyState
            message="Aucun plan importé pour ce chantier."
            actionLabel="Importer un plan"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <ul className="space-y-3">
            {plansForSelected.map((plan) => (
              <li key={plan.id}>
                <Card className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-accent-blue" />
                    <div>
                      <p className="font-medium text-brand">{plan.nom}</p>
                      <p className="text-xs text-gray-400">{formatDateFr(plan.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={plan.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 items-center gap-1 rounded-lg bg-surface px-3 text-sm text-accent-blue"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ouvrir
                    </a>
                    <BtnDanger onClick={() => deletePlan(plan.id)}>Supprimer</BtnDanger>
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
