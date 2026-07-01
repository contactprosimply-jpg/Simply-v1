"use client";

import { Plus, ClipboardList, Link2, Camera } from "lucide-react";
import Link from "next/link";
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
import { LotSelect } from "@/components/ui/LotSelect";
import { formatDateFr } from "@/lib/types";
import type { ReserveStatut } from "@/lib/types";

const STATUTS: { value: ReserveStatut; label: string; color: string }[] = [
  { value: "ouverte", label: "Ouverte", color: "bg-red-100 text-red-700" },
  { value: "en_cours", label: "En cours", color: "bg-amber-100 text-amber-800" },
  { value: "levee", label: "Levée", color: "bg-teal-100 text-teal-800" },
];

export function ReservesView() {
  const {
    selectedChantier,
    reservesForSelected,
    tachesForSelected,
    photosForSelected,
    createReserve,
    updateReserve,
    deleteReserve,
    createTache,
  } = useChantiers();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [lot, setLot] = useState("");
  const [filter, setFilter] = useState<ReserveStatut | "all">("all");

  const resetForm = () => {
    setTitre("");
    setDescription("");
    setLot("");
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (id: string) => {
    const r = reservesForSelected.find((x) => x.id === id);
    if (!r) return;
    setEditId(id);
    setTitre(r.titre);
    setDescription(r.description ?? "");
    setLot(r.lot ?? "");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!titre.trim()) return;
    if (editId) {
      updateReserve(editId, {
        titre: titre.trim(),
        description: description.trim() || null,
        lot: lot || null,
      });
    } else {
      createReserve(titre.trim(), lot || undefined, description.trim() || undefined);
    }
    resetForm();
  };

  const createTaskFromReserve = (reserveId: string, reserveTitre: string, lotVal: string | null) => {
    createTache({
      titre: `Réserve : ${reserveTitre}`,
      priorite: "haute",
      reserveId,
      lot: lotVal ?? undefined,
    });
    updateReserve(reserveId, { statut: "en_cours" });
  };

  const filtered =
    filter === "all" ? reservesForSelected : reservesForSelected.filter((r) => r.statut === filter);

  return (
    <ChantierGate message="Créez un chantier pour gérer les réserves.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Réserves" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-5 w-5" />
            Nouvelle réserve
          </BtnPrimary>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "ouverte", "en_cours", "levee"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f ? "bg-brand text-white" : "bg-white text-ink-muted ring-1 ring-surface-dark"
              }`}
            >
              {f === "all" ? "Toutes" : STATUTS.find((s) => s.value === f)?.label}
            </button>
          ))}
        </div>

        {showForm && (
          <Card className="space-y-3">
            <FormInput placeholder="Titre de la réserve *" value={titre} onChange={(e) => setTitre(e.target.value)} />
            <LotSelect value={lot} onChange={setLot} />
            <textarea
              rows={3}
              placeholder="Description / localisation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-surface-dark bg-surface/50 px-4 py-3 text-sm"
            />
            <div className="flex gap-2">
              <BtnPrimary onClick={handleSave}>{editId ? "Mettre à jour" : "Créer"}</BtnPrimary>
              <BtnSecondary onClick={resetForm}>Annuler</BtnSecondary>
            </div>
          </Card>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            message="Aucune réserve sur ce chantier."
            actionLabel="Nouvelle réserve"
            onAction={() => setShowForm(true)}
            icon={ClipboardList}
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => {
              const st = STATUTS.find((s) => s.value === r.statut)!;
              const linkedPhotos = photosForSelected.filter((p) => p.reserveId === r.id);
              const linkedTask = tachesForSelected.find((t) => t.id === r.tacheId);
              return (
                <li key={r.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-brand">{r.titre}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.color}`}>
                            {st.label}
                          </span>
                          {r.lot && (
                            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-muted">
                              {r.lot}
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <p className="mt-1 text-sm text-ink-muted">{r.description}</p>
                        )}
                        <p className="mt-2 text-xs text-ink-muted">{formatDateFr(r.createdAt)}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {linkedTask && (
                            <Link href="/taches" className="inline-flex items-center gap-1 text-accent-blue">
                              <Link2 className="h-3 w-3" />
                              Tâche liée
                            </Link>
                          )}
                          {linkedPhotos.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-ink-muted">
                              <Camera className="h-3 w-3" />
                              {linkedPhotos.length} photo(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {r.statut !== "levee" && (
                          <>
                            {!r.tacheId && (
                              <BtnSecondary
                                onClick={() => createTaskFromReserve(r.id, r.titre, r.lot)}
                              >
                                Créer tâche
                              </BtnSecondary>
                            )}
                            <BtnSecondary onClick={() => updateReserve(r.id, { statut: "levee" })}>
                              Lever
                            </BtnSecondary>
                          </>
                        )}
                        <BtnSecondary onClick={() => openEdit(r.id)}>Modifier</BtnSecondary>
                        <BtnDanger onClick={() => deleteReserve(r.id)}>Supprimer</BtnDanger>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ChantierGate>
  );
}
