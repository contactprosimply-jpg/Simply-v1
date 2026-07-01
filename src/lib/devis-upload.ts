import type { DevisTypeFichier } from "@/lib/database.types";

export const DEVIS_MAX_BYTES = 20 * 1024 * 1024;

const MIME_BY_TYPE: Record<DevisTypeFichier, string[]> = {
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  pdf: ["application/pdf"],
  csv: ["text/csv", "application/csv", "text/plain"],
};

const EXT_BY_TYPE: Record<DevisTypeFichier, string[]> = {
  xlsx: [".xlsx", ".xls"],
  pdf: [".pdf"],
  csv: [".csv"],
};

export function detectDevisType(file: File): DevisTypeFichier | null {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  for (const type of Object.keys(EXT_BY_TYPE) as DevisTypeFichier[]) {
    const extMatch = EXT_BY_TYPE[type].some((ext) => name.endsWith(ext));
    const mimeMatch = MIME_BY_TYPE[type].includes(mime);
    if (extMatch || mimeMatch) return type;
  }
  return null;
}

export function validateDevisFile(file: File): { ok: true; type: DevisTypeFichier } | { ok: false; error: string } {
  if (file.size === 0) {
    return { ok: false, error: "Fichier vide." };
  }
  if (file.size > DEVIS_MAX_BYTES) {
    return { ok: false, error: "Fichier trop volumineux (max 20 Mo)." };
  }

  const type = detectDevisType(file);
  if (!type) {
    return { ok: false, error: "Format non supporté. Utilisez .xlsx, .pdf ou .csv." };
  }

  const mime = file.type.toLowerCase();
  if (mime && mime !== "application/octet-stream" && !MIME_BY_TYPE[type].includes(mime)) {
    return { ok: false, error: "Type MIME incompatible avec l'extension du fichier." };
  }

  return { ok: true, type };
}

export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "fichier";
  const cleaned = base.replace(/[^\w.\-()+\s]/gi, "_").trim();
  return cleaned.slice(0, 180) || "fichier";
}

export function buildDevisStoragePath(chantierId: string, importId: string, fileName: string): string {
  return `chantier/${chantierId}/${importId}/${sanitizeFileName(fileName)}`;
}
