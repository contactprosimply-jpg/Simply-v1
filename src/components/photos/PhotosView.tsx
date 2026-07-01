"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useChantiers } from "@/components/providers/ChantierProvider";
import { BtnDanger, BtnPrimary, BtnSecondary, Card, ChantierGate, EmptyState, FormInput, PageHeader } from "@/components/ui/PageShell";
import { formatDateFr } from "@/lib/types";

export function PhotosView() {
  const { selectedChantier, photosForSelected, createPhoto, deletePhoto } = useChantiers();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = () => {
    if (!url.trim()) return;
    createPhoto(
      url.trim(),
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      note.trim() || undefined,
    );
    setUrl("");
    setTags("");
    setNote("");
    setShowForm(false);
  };

  return (
    <ChantierGate message="Créez un chantier pour ajouter des photos.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="Photos chantier" subtitle={selectedChantier?.nom} />
          <BtnPrimary onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5" />
            Ajouter une photo
          </BtnPrimary>
        </div>

        {showForm && (
          <Card className="space-y-3">
            <FormInput placeholder="URL de l'image" value={url} onChange={(e) => setUrl(e.target.value)} />
            <FormInput
              placeholder="Tags (séparés par des virgules)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <FormInput placeholder="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} />
            <BtnPrimary onClick={handleAdd}>Enregistrer</BtnPrimary>
          </Card>
        )}

        {photosForSelected.length === 0 ? (
          <EmptyState
            message="Aucune photo sur ce chantier."
            actionLabel="Ajouter une photo"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photosForSelected.map((photo) => (
              <Card key={photo.id} className="overflow-hidden p-0">
                <img
                  src={photo.url}
                  alt=""
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <p className="text-xs text-gray-400">{formatDateFr(photo.createdAt)}</p>
                  {photo.note && <p className="mt-1 text-sm text-brand">{photo.note}</p>}
                  {photo.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {photo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-surface px-2 py-0.5 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <BtnDanger onClick={() => deletePhoto(photo.id)}>Supprimer</BtnDanger>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ChantierGate>
  );
}
