import { apiError, apiOk } from "@/lib/api-response";
import { getOptionalUserId, requireSupabaseConfig } from "@/lib/api-auth";
import { DevisImportError } from "@/services/devis-import";
import { analyzeDevisImport } from "@/services/devis-analyze";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const configError = requireSupabaseConfig();
  if (configError) return apiError(configError.error, configError.code, configError.status);

  const { id } = await context.params;
  if (!id) return apiError("ID import requis.", "VALIDATION_ERROR", 400);

  const force = new URL(request.url).searchParams.get("force") === "true";
  const userId = await getOptionalUserId();

  try {
    const result = await analyzeDevisImport(id, { force, ownerUserId: userId });
    return apiOk({ analyze: result });
  } catch (e) {
    if (e instanceof DevisImportError) {
      return apiError(e.message, e.code, e.status);
    }
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
