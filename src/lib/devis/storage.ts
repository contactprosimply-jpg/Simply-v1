import { sanitizeFileName } from "@/lib/devis-upload";
import { DevisAnalyserError } from "@/lib/devis/types";
import { createAdminClient } from "@/lib/supabase/admin";

export function buildAnalyserStoragePath(chantierId: string, fileName: string): string {
  const id = crypto.randomUUID();
  return `chantier/${chantierId}/${id}-${sanitizeFileName(fileName)}`;
}

export async function uploadDevisToStorage(input: {
  chantierId: string;
  fileName: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  const admin = createAdminClient();

  const { data: chantier, error: chantierError } = await admin
    .from("chantiers")
    .select("id")
    .eq("id", input.chantierId)
    .maybeSingle();

  if (chantierError) {
    throw new DevisAnalyserError(chantierError.message, 500, "CHANTIER_LOOKUP_FAILED");
  }
  if (!chantier) {
    throw new DevisAnalyserError("Chantier introuvable.", 404, "CHANTIER_NOT_FOUND");
  }

  const storagePath = buildAnalyserStoragePath(input.chantierId, input.fileName);

  const { error: uploadError } = await admin.storage.from("devis").upload(storagePath, input.buffer, {
    contentType: input.contentType,
    upsert: false,
  });

  if (uploadError) {
    throw new DevisAnalyserError(uploadError.message, 500, "STORAGE_UPLOAD_FAILED");
  }

  return storagePath;
}
