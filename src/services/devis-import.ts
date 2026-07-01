import type { DevisImportRow, DevisTypeFichier } from "@/lib/database.types";
import { buildDevisStoragePath, validateDevisFile } from "@/lib/devis-upload";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultOwnerId } from "@/lib/supabase/env";

export class DevisImportError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "DevisImportError";
  }
}

async function resolveOwnerId(userId: string | undefined): Promise<string> {
  if (userId) return userId;
  const fallback = getDefaultOwnerId();
  if (!fallback) {
    throw new DevisImportError(
      "Aucun utilisateur connecté et SUPABASE_DEFAULT_OWNER_ID non configuré.",
      503,
      "OWNER_NOT_CONFIGURED",
    );
  }
  return fallback;
}

async function resolveOrganisationId(ownerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("organisation_id")
    .eq("id", ownerId)
    .maybeSingle();
  return data?.organisation_id ?? process.env.SUPABASE_DEFAULT_ORGANISATION_ID ?? null;
}

export async function ensureSupabaseChantier(input: {
  supabaseChantierId?: string | null;
  nom: string;
  client?: string | null;
  montant?: number | null;
  statut?: string;
  userId?: string;
}): Promise<string> {
  const admin = createAdminClient();

  if (input.supabaseChantierId) {
    const { data, error } = await admin
      .from("chantiers")
      .select("id")
      .eq("id", input.supabaseChantierId)
      .maybeSingle();

    if (error) throw new DevisImportError(error.message, 500, "CHANTIER_LOOKUP_FAILED");
    if (data) return data.id;
  }

  const ownerId = await resolveOwnerId(input.userId);
  const organisationId = await resolveOrganisationId(ownerId);

  const row: {
    nom: string;
    client: string | null;
    montant: number | null;
    statut: string;
    owner_id: string;
    organisation_id?: string;
  } = {
    nom: input.nom,
    client: input.client ?? null,
    montant: input.montant ?? null,
    statut: input.statut ?? "en_cours",
    owner_id: ownerId,
  };

  if (organisationId) {
    row.organisation_id = organisationId;
  }

  const { data, error } = await admin.from("chantiers").insert(row).select("id").single();

  if (error || !data) {
    throw new DevisImportError(error?.message ?? "Création chantier impossible", 500, "CHANTIER_CREATE_FAILED");
  }

  return data.id;
}

export async function uploadDevisImport(input: {
  chantierId: string;
  file: File;
  ownerUserId?: string;
}): Promise<DevisImportRow> {
  const validation = validateDevisFile(input.file);
  if (!validation.ok) {
    throw new DevisImportError(validation.error, 400, "INVALID_FILE");
  }

  const admin = createAdminClient();

  const { data: chantier, error: chantierError } = await admin
    .from("chantiers")
    .select("id, owner_id")
    .eq("id", input.chantierId)
    .single();

  if (chantierError || !chantier) {
    throw new DevisImportError("Chantier introuvable.", 404, "CHANTIER_NOT_FOUND");
  }

  if (input.ownerUserId && chantier.owner_id !== input.ownerUserId) {
    throw new DevisImportError("Accès refusé à ce chantier.", 403, "FORBIDDEN");
  }

  const ownerId = chantier.owner_id;

  const { data: draft, error: insertError } = await admin
    .from("devis_imports")
    .insert({
      chantier_id: chantier.id,
      owner_id: ownerId,
      nom_fichier: input.file.name,
      type_fichier: validation.type,
      statut: "importe",
    })
    .select("*")
    .single();

  if (insertError || !draft) {
    throw new DevisImportError(insertError?.message ?? "Insertion impossible", 500, "IMPORT_INSERT_FAILED");
  }

  const storagePath = buildDevisStoragePath(chantier.id, draft.id, input.file.name);
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from("devis").upload(storagePath, buffer, {
    contentType: input.file.type || mimeForType(validation.type),
    upsert: false,
  });

  if (uploadError) {
    await admin.from("devis_imports").delete().eq("id", draft.id);
    throw new DevisImportError(uploadError.message, 500, "STORAGE_UPLOAD_FAILED");
  }

  const { data: updated, error: updateError } = await admin
    .from("devis_imports")
    .update({ storage_path: storagePath })
    .eq("id", draft.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    await admin.storage.from("devis").remove([storagePath]);
    await admin.from("devis_imports").delete().eq("id", draft.id);
    throw new DevisImportError(updateError?.message ?? "Mise à jour impossible", 500, "IMPORT_UPDATE_FAILED");
  }

  return updated;
}

export async function listDevisImports(chantierId: string, ownerUserId?: string): Promise<DevisImportRow[]> {
  const admin = createAdminClient();

  const { data: chantier, error: chantierError } = await admin
    .from("chantiers")
    .select("id, owner_id")
    .eq("id", chantierId)
    .single();

  if (chantierError || !chantier) {
    throw new DevisImportError("Chantier introuvable.", 404, "CHANTIER_NOT_FOUND");
  }

  if (ownerUserId && chantier.owner_id !== ownerUserId) {
    throw new DevisImportError("Accès refusé à ce chantier.", 403, "FORBIDDEN");
  }

  const { data, error } = await admin
    .from("devis_imports")
    .select("*")
    .eq("chantier_id", chantierId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new DevisImportError(error.message, 500, "IMPORT_LIST_FAILED");
  }

  return data ?? [];
}

function mimeForType(type: DevisTypeFichier): string {
  switch (type) {
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "pdf":
      return "application/pdf";
    case "csv":
      return "text/csv";
  }
}
