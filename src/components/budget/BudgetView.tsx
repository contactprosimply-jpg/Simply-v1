"use client";

import { DevisImportPanel, type DevisImportPanelHandle } from "@/components/budget/DevisImportPanel";
import { FileSpreadsheet, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnDanger, BtnPrimary, BtnSecondary, Card, ChantierGate, EmptyState, AlertBanner, FormInput, PageHeader } from "@/components/ui/PageShell";
import { LotSelect } from "@/components/ui/LotSelect";
import { formatCurrency, formatDateFr, type BudgetType } from "@/lib/types";

const TYPES: { value: BudgetType; label: string }[] = [
  { value: "devis", label: "Devis" },
  { value: "facture", label: "Facture" },
  { value: "depense", label: "Dépense" },
];

export function BudgetView() {
  const { selectedChantier, budgetForSelected, createBudgetLigne, updateBudgetLigne, deleteBudgetLigne, updateChantier } = useChantiers();
  const devisImportRef = useRef<DevisImportPanelHandle>(null);
  const [importingDevis, setImportingDevis] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [type, setType] = useState<BudgetType>("devis");
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lot, setLot] = useState("");

  const reset = () => {
    setLibelle("");
    setMontant("");
    setLot("");
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (id: string) => {
    const l = budgetForSelected.find((x) => x.id === id);
    if (!l) return;
    setEditId(id);
    setType(l.type);
    setLibelle(l.libelle);
    setMontant(String(l.montant));
    setDate(l.date.slice(0, 10));
    setLot(l.lot ?? "");
    setShowForm(true);
  };

  const handleSave = () => {
    const m = parseFloat(montant);
    if (!libelle.trim() || isNaN(m)) return;
    if (editId) {
      updateBudgetLigne(editId, { type, libelle: libelle.trim(), montant: m, date, lot: lot || null });
    } else {
      createBudgetLigne(type, libelle.trim(), m, date, lot || undefined);
    }
    reset();
  };

  const summary = useMemo(() => {
    const prevu = budgetForSelected.filter((b) => b.type === "devis").reduce((s, b) => s + b.montant, 0);
    const consomme = budgetForSelected
      .filter((b) => b.type === "facture" || b.type === "depense")
      .reduce((s, b) => s + b.montant, 0);
    const marge = prevu - consomme;
    const pct = prevu === 0 ? 0 : Math.round((consomme / prevu) * 100);
    return { prevu, consomme, marge, pct };
  }, [budgetForSelected]);


  return (
    <ChantierGate message="Créez un chantier pour gérer le budget.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Budget" subtitle={selectedChantier?.nom} />
          <div className="flex flex-wrap gap-2">
            <BtnSecondary
              disabled={importingDevis}
              onClick={() => devisImportRef.current?.pickFile()}
            >
              <FileSpreadsheet className="h-5 w-5" />
              {importingDevis ? "Import en cours…" : "Importer devis"}
            </BtnSecondary>
            <BtnPrimary onClick={() => { reset(); setShowForm(true); }}>
              <Plus className="h-5 w-5" />
              Ajouter une ligne
            </BtnPrimary>
          </div>
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
            <p className={`mt-1 text-2xl font-bold ${summary.marge >= 0 ? "text-orange-600" : "text-red-600"}`}>
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

        {selectedChantier && (
          <DevisImportPanel
            ref={devisImportRef}
            hideActions
            onBusyChange={setImportingDevis}
            chantierNom={selectedChantier.nom}
            chantierClient={selectedChantier.client}
            chantierMontant={selectedChantier.montant}
            supabaseChantierId={selectedChantier.supabaseChantierId}
            onLinked={(supabaseChantierId) =>
              updateChantier(selectedChantier.id, { supabaseChantierId })
            }
          />
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
            <LotSelect value={lot} onChange={setLot} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput type="number" placeholder="Montant €" value={montant} onChange={(e) => setMontant(e.target.value)} />
              <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <BtnPrimary onClick={handleSave}>{editId ? "Mettre à jour" : "Enregistrer"}</BtnPrimary>
              <BtnSecondary onClick={reset}>Annuler</BtnSecondary>
            </div>
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
                      {l.type} · {formatDateFr(l.date)}{l.lot ? ` · ${l.lot}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brand">{formatCurrency(l.montant)}</span>
                    <BtnSecondary onClick={() => openEdit(l.id)}>Modifier</BtnSecondary>
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
