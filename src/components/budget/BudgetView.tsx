"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnDanger, BtnPrimary, Card, ChantierGate, EmptyState, AlertBanner, FormInput, PageHeader } from "@/components/ui/PageShell";
import { formatCurrency, formatDateFr, type BudgetType } from "@/lib/types";

const TYPES: { value: BudgetType; label: string }[] = [
  { value: "devis", label: "Devis" },
  { value: "facture", label: "Facture" },
  { value: "depense", label: "Dépense" },
];

export function BudgetView() {
  const { selectedChantier, budgetForSelected, createBudgetLigne, deleteBudgetLigne } = useChantiers();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<BudgetType>("devis");
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const summary = useMemo(() => {
    const prevu = budgetForSelected.filter((b) => b.type === "devis").reduce((s, b) => s + b.montant, 0);
    const consomme = budgetForSelected
      .filter((b) => b.type === "facture" || b.type === "depense")
      .reduce((s, b) => s + b.montant, 0);
    const marge = prevu - consomme;
    const pct = prevu === 0 ? 0 : Math.round((consomme / prevu) * 100);
    return { prevu, consomme, marge, pct };
  }, [budgetForSelected]);

  const handleAdd = () => {
    const m = parseFloat(montant);
    if (!libelle.trim() || isNaN(m)) return;
    createBudgetLigne(type, libelle.trim(), m, date);
    setLibelle("");
    setMontant("");
    setShowForm(false);
  };

  return (
    <ChantierGate message="Créez un chantier pour gérer le budget.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Budget" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5" />
            Ajouter une ligne
          </BtnPrimary>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-gray-500">Prévu (devis)</p>
            <p className="mt-1 text-2xl font-bold text-brand">{formatCurrency(summary.prevu)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Consommé</p>
            <p className="mt-1 text-2xl font-bold text-brand">{formatCurrency(summary.consomme)}</p>
            <p className="text-xs text-gray-400">{summary.pct} % du prévu</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Marge</p>
            <p className={`mt-1 text-2xl font-bold ${summary.marge >= 0 ? "text-teal-600" : "text-red-600"}`}>
              {formatCurrency(summary.marge)}
            </p>
          </Card>
        </div>

        {summary.pct > 90 && summary.prevu > 0 && (
          <AlertBanner variant={summary.pct >= 100 ? "danger" : "warning"}>
            {summary.pct >= 100
              ? "Budget dépassé — vérifiez les dépenses et factures."
              : `Attention : ${summary.pct} % du budget prévu est consommé.`}
          </AlertBanner>
        )}

        {showForm && (
          <Card className="space-y-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BudgetType)}
              className="h-11 w-full rounded-xl border border-surface-dark px-4 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <FormInput placeholder="Libellé" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput
                type="number"
                placeholder="Montant €"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
              <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <BtnPrimary onClick={handleAdd}>Enregistrer</BtnPrimary>
          </Card>
        )}

        {budgetForSelected.length === 0 ? (
          <EmptyState
            message="Aucune ligne budgétaire pour ce chantier."
            actionLabel="Ajouter une ligne"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <ul className="space-y-2">
            {budgetForSelected.map((l) => (
              <li key={l.id}>
                <Card className="flex flex-wrap items-center justify-between gap-2 py-4">
                  <div>
                    <p className="font-medium text-brand">{l.libelle}</p>
                    <p className="text-xs capitalize text-gray-400">
                      {l.type} · {formatDateFr(l.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-brand">{formatCurrency(l.montant)}</span>
                    <BtnDanger onClick={() => deleteBudgetLigne(l.id)}>Supprimer</BtnDanger>
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
