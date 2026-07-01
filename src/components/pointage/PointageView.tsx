"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnDanger, BtnPrimary, Card, ChantierGate, EmptyState, FormInput, PageHeader } from "@/components/ui/PageShell";
import { formatDateFr } from "@/lib/types";

export function PointageView() {
  const { selectedChantier, pointagesForSelected, createPointage, deletePointage } = useChantiers();
  const [showForm, setShowForm] = useState(false);
  const [ouvrier, setOuvrier] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [heures, setHeures] = useState("8");
  const [pauses, setPauses] = useState("1");

  const totalHeures = useMemo(
    () => pointagesForSelected.reduce((s, p) => s + p.heures - p.pauses, 0),
    [pointagesForSelected],
  );

  const handleAdd = () => {
    const h = parseFloat(heures);
    const p = parseFloat(pauses);
    if (!ouvrier.trim() || isNaN(h)) return;
    createPointage(ouvrier.trim(), date, h, isNaN(p) ? 0 : p);
    setOuvrier("");
    setShowForm(false);
  };

  return (
    <ChantierGate message="Créez un chantier pour saisir le pointage.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Pointage" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5" />
            Saisir des heures
          </BtnPrimary>
        </div>

        <Card>
          <p className="text-sm text-gray-500">Total heures nettes (chantier)</p>
          <p className="text-2xl font-bold text-brand">{totalHeures.toFixed(1)} h</p>
        </Card>

        {showForm && (
          <Card className="space-y-3">
            <FormInput placeholder="Nom de l'ouvrier" value={ouvrier} onChange={(e) => setOuvrier(e.target.value)} />
            <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                type="number"
                step="0.5"
                placeholder="Heures"
                value={heures}
                onChange={(e) => setHeures(e.target.value)}
              />
              <FormInput
                type="number"
                step="0.25"
                placeholder="Pauses (h)"
                value={pauses}
                onChange={(e) => setPauses(e.target.value)}
              />
            </div>
            <BtnPrimary onClick={handleAdd}>Enregistrer</BtnPrimary>
          </Card>
        )}

        {pointagesForSelected.length === 0 ? (
          <EmptyState
            message="Aucun pointage enregistré."
            actionLabel="Saisir des heures"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-dark bg-white">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-surface-dark bg-surface text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Ouvrier</th>
                  <th className="px-4 py-3 font-medium">Heures</th>
                  <th className="px-4 py-3 font-medium">Pauses</th>
                  <th className="px-4 py-3 font-medium">Net</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pointagesForSelected.map((p) => (
                  <tr key={p.id} className="border-b border-surface-dark last:border-0">
                    <td className="px-4 py-3">{formatDateFr(p.date)}</td>
                    <td className="px-4 py-3 font-medium text-brand">{p.ouvrier}</td>
                    <td className="px-4 py-3">{p.heures} h</td>
                    <td className="px-4 py-3">{p.pauses} h</td>
                    <td className="px-4 py-3 font-medium">{(p.heures - p.pauses).toFixed(1)} h</td>
                    <td className="px-4 py-3">
                      <BtnDanger onClick={() => deletePointage(p.id)}>Suppr.</BtnDanger>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ChantierGate>
  );
}
