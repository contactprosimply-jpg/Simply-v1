import { apiError, apiOk } from "@/lib/api-response";
import { getOptionalUserId, requireSupabaseConfig } from "@/lib/api-auth";
import { DevisImportError, ensureSupabaseChantier } from "@/services/devis-import";

export const dynamic = "force-dynamic";

interface SyncBody {
  supabaseChantierId?: string | null;
  nom: string;
  client?: string | null;
  montant?: number | null;
  statut?: string;
}

export async function POST(request: Request) {
  const configError = requireSupabaseConfig();
  if (configError) return apiError(configError.error, configError.code, configError.status);

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return apiError("Corps JSON invalide.", "INVALID_JSON", 400);
  }

  if (!body.nom?.trim()) {
    return apiError("Le nom du chantier est requis.", "VALIDATION_ERROR", 400);
  }

  const userId = await getOptionalUserId();

  try {
    const supabaseChantierId = await ensureSupabaseChantier({
      supabaseChantierId: body.supabaseChantierId,
      nom: body.nom.trim(),
      client: body.client ?? null,
      montant: body.montant ?? null,
      statut: body.statut ?? "en_cours",
      userId,
    });
    return apiOk({ supabaseChantierId }, 201);
  } catch (e) {
    if (e instanceof DevisImportError) {
      return apiError(e.message, e.code, e.status);
    }
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
