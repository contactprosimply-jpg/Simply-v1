"use client";

import { Camera, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { readFileAsDataUrl } from "@/lib/files";

interface FileUploadProps {
  accept?: string;
  label?: string;
  onDataUrl: (dataUrl: string, fileName: string) => void;
  capture?: boolean;
}

export function FileUpload({
  accept = "image/*,application/pdf",
  label = "Importer un fichier",
  onDataUrl,
  capture,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onDataUrl(dataUrl, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-accent-blue/40 bg-accent-blue/5 px-4 text-sm font-medium text-accent-blue transition hover:bg-accent-blue/10"
        >
          <Upload className="h-4 w-4" />
          {loading ? "Chargement…" : label}
        </button>
        {capture && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.capture = "environment";
              input.onchange = () => handleFile(input.files?.[0]);
              input.click();
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan px-4 text-sm font-semibold text-white"
          >
            <Camera className="h-4 w-4" />
            Appareil photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
