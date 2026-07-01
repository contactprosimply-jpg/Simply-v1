"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
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
import { formatDateFr } from "@/lib/types";

export function PointageView() {
  const { selectedChantier, pointagesForSelected, createPointage, updatePointage, deletePointage } = useChantiers();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [ouvrier, setOuvrier] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [heures, setHeures] = useState("8");
  const [pauses, setPauses] = useState("1");

  const totalHeures = useMemo(
    () => pointagesForSelected.reduce((s, p) => s + p.heures - p.pauses, 0),
    [pointagesForSelected],
  );

  const reset = () => {
    setOuvrier("");
    setHeures("8");
    setPauses("1");
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (id: string) => {
    const p = pointagesForSelected.find((x) => x.id === id);
    if (!p) return;
    setEditId(id);
    setOuvrier(p.ouvrier);
    setDate(p.date.slice(0, 10));
    setHeures(String(p.heures));
    setPauses(String(p.pauses));
    setShowForm(true);
  };

  const handleSave = () => {
    const h = parseFloat(heures);
    const pa = parseFloat(pauses);
    if (!ouvrier.trim() || isNaN(h)) return;
    if (editId) {
      updatePointage(editId, { ouvrier: ouvrier.trim(), date, heures: h, pauses: isNaN(pa) ? 0 : pa });
    } else {
      createPointage(ouvrier.trim(), date, h, isNaN(pa) ? 0 : pa);
    }
    reset();
  };

  return (
    <ChantierGate message="Créez un chantier pour saisir le pointage.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Pointage" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => { reset(); setShowForm(true); }}>
            <Plus className="h-5 w-5" />
            Saisir des heures
          </BtnPrimary>
        </div>

        <Card>
          <p className="text-sm text-ink-muted">Total heures nettes (chantier)</p>
          <p className="text-2xl font-bold text-brand">{totalHeures.toFixed(1)} h</p>
        </Card>

        {showForm && (
          <Card className="space-y-3">
            <FormInput placeholder="Nom de l'ouvrier *" value={ouvrier} onChange={(e) => setOuvrier(e.target.value)} />
            <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <FormInput type="number" step="0.5" placeholder="Heures" value={heures} onChange={(e) => setHeures(e.target.value)} />
              <FormInput type="number" step="0.25" placeholder="Pauses (h)" value={pauses} onChange={(e) => setPauses(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <BtnPrimary onClick={handleSave}>{editId ? "Mettre à jour" : "Enregistrer"}</BtnPrimary>
              <BtnSecondary onClick={reset}>Annuler</BtnSecondary>
            </div>
          </Card>
        )}

        {pointagesForSelected.length === 0 ? (
          <EmptyState message="Aucun pointage." actionLabel="Saisir des heures" onAction={() => setShowForm(true)} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-dark bg-white shadow-sm">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-surface-dark bg-surface text-ink-muted">
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
                  <tr key={p.id} className="border-b border-surface-dark/50">
                    <td className="px-4 py-3">{formatDateFr(p.date)}</td>
                    <td className="px-4 py-3 font-medium text-brand">{p.ouvrier}</td>
                    <td className="px-4 py-3">{p.heures} h</td>
                    <td className="px-4 py-3">{p.pauses} h</td>
                    <td className="px-4 py-3 font-semibold">{(p.heures - p.pauses).toFixed(1)} h</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <BtnSecondary onClick={() => openEdit(p.id)}>Modifier</BtnSecondary>
                        <BtnDanger onClick={() => deletePointage(p.id)}>Suppr.</BtnDanger>
                      </div>
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
