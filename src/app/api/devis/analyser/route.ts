import { apiError, apiOk } from "@/lib/api-response";
import { getOptionalUserId, requireSupabaseConfig } from "@/lib/api-auth";
import { DevisAnalyserError } from "@/lib/devis/types";
import { analyserDevisFile } from "@/services/devis-analyser";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const configError = requireSupabaseConfig();
  if (configError) return apiError(configError.error, configError.code, configError.status);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("FormData invalide.", "INVALID_FORM", 400);
  }

  const file = formData.get("file");
  const chantierId = formData.get("chantier_id") ?? formData.get("chantierId");

  if (!(file instanceof File)) {
    return apiError('Champ "file" requis (fichier multipart).', "VALIDATION_ERROR", 400);
  }
  if (typeof chantierId !== "string" || !chantierId.trim()) {
    return apiError('Paramètre "chantier_id" requis.', "VALIDATION_ERROR", 400);
  }

  await getOptionalUserId();

  try {
    const preview = await analyserDevisFile({
      chantierId: chantierId.trim(),
      file,
    });

    return apiOk({
      document: preview.document,
      postes: preview.postes,
      storage_path: preview.storage_path,
    });
  } catch (e) {
    if (e instanceof DevisAnalyserError) {
      return apiError(e.message, e.code, e.status);
    }
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
