import { apiError, apiOk } from "@/lib/api-response";
import { getOptionalUserId, requireSupabaseConfig } from "@/lib/api-auth";
import { DevisImportError, listDevisImports, uploadDevisImport } from "@/services/devis-import";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const configError = requireSupabaseConfig();
  if (configError) return apiError(configError.error, configError.code, configError.status);

  const chantierId = new URL(request.url).searchParams.get("chantierId");
  if (!chantierId) {
    return apiError("Paramètre chantierId requis.", "VALIDATION_ERROR", 400);
  }

  const userId = await getOptionalUserId();

  try {
    const imports = await listDevisImports(chantierId, userId);
    return apiOk({ imports });
  } catch (e) {
    if (e instanceof DevisImportError) {
      return apiError(e.message, e.code, e.status);
    }
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}

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
  const chantierId = formData.get("chantierId");

  if (!(file instanceof File)) {
    return apiError("Fichier manquant.", "VALIDATION_ERROR", 400);
  }
  if (typeof chantierId !== "string" || !chantierId.trim()) {
    return apiError("chantierId Supabase requis.", "VALIDATION_ERROR", 400);
  }

  const userId = await getOptionalUserId();

  try {
    const devisImport = await uploadDevisImport({
      chantierId: chantierId.trim(),
      file,
      ownerUserId: userId,
    });
    return apiOk({ devisImport }, 201);
  } catch (e) {
    if (e instanceof DevisImportError) {
      return apiError(e.message, e.code, e.status);
    }
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
