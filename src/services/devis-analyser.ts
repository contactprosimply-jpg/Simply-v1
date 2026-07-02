import { applyPosteCoherenceChecks } from "@/lib/devis-analyse/coherence";
import {
  extractDevisRawContent,
  truncateForModel,
} from "@/lib/devis-analyse/extract-content";
import { analyseDevisWithGroq } from "@/lib/devis-analyse/groq";
import { uploadDevisToStorage } from "@/lib/devis-analyse/storage";
import type { DevisAnalysePreview } from "@/lib/devis-analyse/types";
import { DevisAnalyserError } from "@/lib/devis-analyse/types";
import { detectDevisType, validateDevisFile } from "@/lib/devis-upload";

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
  const rawContent = await extractDevisRawContent(buffer, validation.type);
  const contentForAi = truncateForModel(rawContent);

  if (!contentForAi.trim()) {
    throw new DevisAnalyserError("Aucun contenu extractible dans le fichier.", 422, "EMPTY_CONTENT");
  }

  const storage_path = await uploadDevisToStorage({
    chantierId: input.chantierId,
    fileName: input.file.name,
    buffer,
    contentType: mimeForFile(validation.type, input.file),
  });

  const aiResult = await analyseDevisWithGroq(contentForAi, input.file.name);
  const postes = applyPosteCoherenceChecks(aiResult.postes);

  return {
    document: aiResult.document,
    postes,
    storage_path,
  };
}

export { detectDevisType };
