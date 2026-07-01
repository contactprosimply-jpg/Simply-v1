import type { BudgetPosteRow, DevisImportRow, TacheRow } from "@/lib/database.types";
import { expandPosteToTaches } from "@/lib/devis-parser/expand-taches";
import { parseDevisBuffer } from "@/lib/devis-parser/extract-buffer";
import type { AnalyzedTache, DevisAnalyzeResult, ParsedPoste } from "@/lib/devis-parser/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { DevisImportError } from "@/services/devis-import";

export async function analyzeDevisImport(
  importId: string,
  options?: { force?: boolean; ownerUserId?: string },
): Promise<DevisAnalyzeResult> {
  const admin = createAdminClient();

  const { data: imp, error: impError } = await admin
    .from("devis_imports")
    .select("*")
    .eq("id", importId)
    .single();

  if (impError || !imp) {
    throw new DevisImportError("Import introuvable.", 404, "IMPORT_NOT_FOUND");
  }

  if (options?.ownerUserId && imp.owner_id !== options.ownerUserId) {
    throw new DevisImportError("Accès refusé.", 403, "FORBIDDEN");
  }

  if (!imp.storage_path) {
    throw new DevisImportError("Fichier non stocké.", 400, "NO_STORAGE_PATH");
  }

  const { data: existingPostes } = await admin
    .from("budget_postes")
    .select("id")
    .eq("devis_import_id", importId);

  if (existingPostes && existingPostes.length > 0 && !options?.force) {
    return loadExistingAnalyzeResult(admin, imp, existingPostes.map((p) => p.id));
  }

  if (options?.force && existingPostes && existingPostes.length > 0) {
    const ids = existingPostes.map((p) => p.id);
    await admin.from("taches").delete().in("budget_poste_id", ids);
    await admin.from("budget_postes").delete().eq("devis_import_id", importId);
  }

  const { data: file, error: dlError } = await admin.storage.from("devis").download(imp.storage_path);
  if (dlError || !file) {
    throw new DevisImportError(dlError?.message ?? "Téléchargement impossible", 500, "STORAGE_DOWNLOAD_FAILED");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseDevisBuffer(buffer, imp.type_fichier);

  if (parsed.postes.length === 0) {
    throw new DevisImportError(
      "Aucune ligne de devis détectée dans le fichier. Vérifiez le format PDF.",
      422,
      "PARSE_EMPTY",
    );
  }

  const posteRows = parsed.postes.map((p) => ({
    chantier_id: imp.chantier_id,
    devis_import_id: imp.id,
    owner_id: imp.owner_id,
    numero_position: p.numeroPosition,
    lot: p.lot,
    designation: p.designation,
    unite: p.unite,
    quantite: p.quantite,
    prix_unitaire: p.prixUnitaire,
    prix_total: p.prixTotal,
    ordre: p.ordre,
  }));

  const { data: insertedPostes, error: posteError } = await admin
    .from("budget_postes")
    .insert(posteRows)
    .select("*");

  if (posteError || !insertedPostes) {
    throw new DevisImportError(posteError?.message ?? "Insertion postes impossible", 500, "POSTES_INSERT_FAILED");
  }

  const tacheRows: {
    chantier_id: string;
    budget_poste_id: string;
    owner_id: string;
    titre: string;
    description: string | null;
    unite: string | null;
    quantite: number | null;
    quantite_faite: number;
    statut: string;
    priorite: string;
    ordre: number;
  }[] = [];

  let ordre = 0;
  insertedPostes.forEach((poste: BudgetPosteRow, idx: number) => {
    const src = parsed.postes[idx]!;
    const expanded = expandPosteToTaches(src);
    for (const t of expanded) {
      tacheRows.push({
        chantier_id: imp.chantier_id,
        budget_poste_id: poste.id,
        owner_id: imp.owner_id,
        titre: t.titre,
        description: t.description,
        unite: t.unite,
        quantite: t.quantite,
        quantite_faite: 0,
        statut: "a_faire",
        priorite: "normale",
        ordre: ordre++,
      });
    }
  });

  const { data: insertedTaches, error: tacheError } = await admin
    .from("taches")
    .insert(tacheRows)
    .select("*");

  if (tacheError) {
    await admin.from("budget_postes").delete().eq("devis_import_id", importId);
    throw new DevisImportError(tacheError.message, 500, "TACHES_INSERT_FAILED");
  }

  if (parsed.prixFinal != null) {
    await admin.from("chantiers").update({ montant: parsed.prixFinal }).eq("id", imp.chantier_id);
  }

  await admin.from("devis_imports").update({ statut: "valide" }).eq("id", importId);

  const taches = mapDbTachesToAnalyzed(insertedTaches ?? [], insertedPostes);

  return {
    devisImportId: imp.id,
    prixFinal: parsed.prixFinal,
    prixFinalLabel: parsed.prixFinalLabel,
    postesCount: insertedPostes.length,
    tachesCount: taches.length,
    taches,
    postes: parsed.postes,
  };
}

function mapDbTachesToAnalyzed(
  taches: TacheRow[],
  postes: BudgetPosteRow[],
): AnalyzedTache[] {
  return taches.map((t) => ({
    titre: t.titre,
    description: t.description,
    lot: postes.find((p) => p.id === t.budget_poste_id)?.lot ?? null,
    unite: t.unite,
    quantite: t.quantite,
    numeroPosition: postes.find((p) => p.id === t.budget_poste_id)?.numero_position ?? null,
  }));
}

async function loadExistingAnalyzeResult(
  admin: ReturnType<typeof createAdminClient>,
  imp: DevisImportRow,
  posteIds: string[],
): Promise<DevisAnalyzeResult> {
  const { data: postes } = await admin
    .from("budget_postes")
    .select("*")
    .eq("devis_import_id", imp.id)
    .order("ordre", { ascending: true });

  const { data: taches } = await admin
    .from("taches")
    .select("*")
    .in("budget_poste_id", posteIds)
    .order("ordre", { ascending: true });

  const prixFinal = postes?.reduce((sum, p) => sum + (p.prix_total ?? 0), 0) ?? null;
  const mapped = mapDbTachesToAnalyzed(taches ?? [], postes ?? []);

  return {
    devisImportId: imp.id,
    prixFinal: prixFinal && prixFinal > 0 ? prixFinal : null,
    prixFinalLabel: "Total postes (déjà analysé)",
    postesCount: postes?.length ?? 0,
    tachesCount: mapped.length,
    taches: mapped,
    postes:
      postes?.map((p, idx) => ({
        numeroPosition: p.numero_position,
        lot: p.lot,
        designation: p.designation,
        unite: p.unite,
        quantite: p.quantite,
        prixUnitaire: p.prix_unitaire,
        prixTotal: p.prix_total,
        ordre: p.ordre ?? idx,
      })) ?? [],
  };
}
