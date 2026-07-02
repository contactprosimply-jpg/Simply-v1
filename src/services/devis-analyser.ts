import { extractGrilleFromBuffer } from "@/lib/devis/extract-grid";
import { analyserDevis } from "@/lib/devis/parser";
import { uploadDevisToStorage } from "@/lib/devis/storage";
import type { ResultatAnalyse } from "@/lib/devis/types";
import { DevisAnalyserError } from "@/lib/devis/types";
import { validateDevisFile } from "@/lib/devis-upload";

export interface DevisAnalysePreview extends ResultatAnalyse {
  storage_path: string;
}

function mimeForFile(type: string, file: File): string {
  if (file.type) return file.type;
  switch (type) {
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "pdf":
      return "application/pdf";
    case "csv":
      return "text/csv";
    default:
      return "application/octet-stream";
  }
}

export async function analyserDevisFile(input: {
  chantierId: string;
  file: File;
}): Promise<DevisAnalysePreview> {
  const validation = validateDevisFile(input.file);
  if (!validation.ok) {
    throw new DevisAnalyserError(validation.error, 400, "INVALID_FILE");
  }

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const { grille, pdfImperfect } = await extractGrilleFromBuffer(buffer, validation.type);

  if (grille.length === 0) {
    throw new DevisAnalyserError("Aucun contenu extractible dans le fichier.", 422, "EMPTY_CONTENT");
  }

  const storage_path = await uploadDevisToStorage({
    chantierId: input.chantierId,
    fileName: input.file.name,
    buffer,
    contentType: mimeForFile(validation.type, input.file),
  });

  const result = analyserDevis(grille, {
    pdfImperfect: validation.type === "pdf" && pdfImperfect,
  });

  if (validation.type === "pdf" && pdfImperfect) {
    result.document.structure_reconnue = false;
    if (!result.document.remarques.some((r) => r.includes("PDF"))) {
      result.document.remarques.push(
        "Extraction PDF imparfaite — mapping manuel recommandé (étape C).",
      );
    }
  }

  return {
    ...result,
    storage_path,
  };
}
