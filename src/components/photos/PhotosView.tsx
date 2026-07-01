"use client";

import { Plus, Camera } from "lucide-react";
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
import { FileUpload } from "@/components/ui/FileUpload";
import { Lightbox } from "@/components/ui/Lightbox";
import { LotSelect } from "@/components/ui/LotSelect";
import { formatDateFr } from "@/lib/types";

export function PhotosView() {
  const {
    selectedChantier,
    photosForSelected,
    tachesForSelected,
    reservesForSelected,
    createPhoto,
    updatePhoto,
    deletePhoto,
  } = useChantiers();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [tacheId, setTacheId] = useState("");
  const [reserveId, setReserveId] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState("");

  const reset = () => {
    setUrl("");
    setTags("");
    setNote("");
    setTacheId("");
    setReserveId("");
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (id: string) => {
    const p = photosForSelected.find((x) => x.id === id);
    if (!p) return;
    setEditId(id);
    setUrl(p.url);
    setTags(p.tags.join(", "));
    setNote(p.note ?? "");
    setTacheId(p.tacheId ?? "");
    setReserveId(p.reserveId ?? "");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!url.trim()) return;
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (editId) {
      updatePhoto(editId, {
        url: url.trim(),
        tags: tagList,
        note: note.trim() || null,
        tacheId: tacheId || null,
        reserveId: reserveId || null,
      });
    } else {
      createPhoto(
        url.trim(),
        tagList,
        note.trim() || undefined,
        tacheId || undefined,
        reserveId || undefined,
      );
    }
    reset();
  };

  const allTags = [...new Set(photosForSelected.flatMap((p) => p.tags))];
  const filtered = tagFilter
    ? photosForSelected.filter((p) => p.tags.includes(tagFilter))
    : photosForSelected;

  return (
    <ChantierGate message="Créez un chantier pour ajouter des photos.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Photos chantier" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => { reset(); setShowForm(true); }}>
            <Plus className="h-5 w-5" />
            Ajouter
          </BtnPrimary>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTagFilter("")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${!tagFilter ? "bg-brand text-white" : "bg-white ring-1 ring-surface-dark"}`}
            >
              Toutes
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter(tag)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${tagFilter === tag ? "bg-brand text-white" : "bg-white ring-1 ring-surface-dark"}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {showForm && (
          <Card className="space-y-3">
            <FileUpload
              capture
              label="Importer image"
              onDataUrl={(dataUrl) => setUrl(dataUrl)}
            />
            <FormInput placeholder="Ou coller une URL" value={url} onChange={(e) => setUrl(e.target.value)} />
            <FormInput placeholder="Tags (réserve, avancement…)" value={tags} onChange={(e) => setTags(e.target.value)} />
            <FormInput placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
            <select
              value={tacheId}
              onChange={(e) => setTacheId(e.target.value)}
              className="h-11 w-full rounded-xl border border-surface-dark px-4 text-sm"
            >
              <option value="">— Lier à une tâche —</option>
              {tachesForSelected.map((t) => (
                <option key={t.id} value={t.id}>{t.titre}</option>
              ))}
            </select>
            <select
              value={reserveId}
              onChange={(e) => setReserveId(e.target.value)}
              className="h-11 w-full rounded-xl border border-surface-dark px-4 text-sm"
            >
              <option value="">— Lier à une réserve —</option>
              {reservesForSelected.map((r) => (
                <option key={r.id} value={r.id}>{r.titre}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <BtnPrimary onClick={handleSave}>{editId ? "Mettre à jour" : "Enregistrer"}</BtnPrimary>
              <BtnSecondary onClick={reset}>Annuler</BtnSecondary>
            </div>
          </Card>
        )}

        {filtered.length === 0 ? (
          <EmptyState message="Aucune photo." actionLabel="Ajouter une photo" onAction={() => setShowForm(true)} icon={Camera} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((photo) => (
              <Card key={photo.id} className="overflow-hidden p-0">
                <button type="button" onClick={() => setLightbox(photo.url)} className="block w-full">
                  <img src={photo.url} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                </button>
                <div className="p-4">
                  <p className="text-xs text-ink-muted">{formatDateFr(photo.createdAt)}</p>
                  {photo.note && <p className="mt-1 text-sm text-brand">{photo.note}</p>}
                  {photo.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {photo.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-surface px-2 py-0.5 text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                  {(photo.tacheId || photo.reserveId) && (
                    <div className="mt-2 flex gap-2 text-xs">
                      {photo.tacheId && <Link href="/taches" className="text-accent-blue">Tâche</Link>}
                      {photo.reserveId && <Link href="/reserves" className="text-accent-blue">Réserve</Link>}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <BtnSecondary onClick={() => openEdit(photo.id)}>Modifier</BtnSecondary>
                    <BtnDanger onClick={() => deletePhoto(photo.id)}>Supprimer</BtnDanger>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      </div>
    </ChantierGate>
  );
}
