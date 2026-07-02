import type { BudgetPosteTypeLigne, DevisDocumentType } from "@/lib/database.types";
import { applyCoherenceToPoste } from "@/lib/devis/coherence";
import {
  isJunkDesignation,
  isPlausiblePoste,
  sanitizeGrille,
} from "@/lib/devis/filters";
import { aggregateMetiers, detectMetier } from "@/lib/devis/metiers";
import { parseFrenchNumber, parseIntegerQty } from "@/lib/devis/numbers";
import type { DocumentAnalyse, GrilleDevis, PosteAnalyse, ResultatAnalyse } from "@/lib/devis/types";
import { parseDevisTable, parseDevisText } from "@/lib/devis-parser/parse-text";
import type { ParsedPoste } from "@/lib/devis-parser/types";
import { rowsToPlainText } from "@/lib/devis-parser/extract-pdf-layout";
import { enrichPosteDesignationsFromPdf } from "@/lib/devis-parser/associate-labels";

type ColumnRole =
  | "position"
  | "designation"
  | "unite"
  | "quantite"
  | "prix_unitaire"
  | "prix_total"
  | "ignore";

interface ColumnMap {
  position?: number;
  designation?: number;
  unite?: number;
  quantite?: number;
  prix_unitaire?: number;
  prix_total?: number;
}

function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function classifyHeaderCell(cell: string): ColumnRole {
  const n = normalizeText(cell);
  if (!n) return "ignore";
  if (/^(n°|no|numero|num|ref|position|#|code)$/.test(n) || n === "n") return "position";
  if (/(designation|libelle|description|poste|prestation|ouvrage)/.test(n)) return "designation";
  if (n === "u" || /^(unite|unit)$/.test(n)) return "unite";
  if (/(qte|quantite|qty)/.test(n)) return "quantite";
  if (/(prix unitaire|p\.?\s*u\.?|pu ht|pu|prix u)/.test(n) && !/total/.test(n)) {
    return "prix_unitaire";
  }
  if (/(montant|total ht|prix total|montant ht|total)/.test(n) && !/unitaire/.test(n)) {
    return "prix_total";
  }
  return "ignore";
}

function buildColumnMap(headerRow: string[]): ColumnMap {
  const map: ColumnMap = {};
  headerRow.forEach((cell, idx) => {
    const role = classifyHeaderCell(cell);
    if (role === "ignore") return;
    if (role === "position" && map.position == null) map.position = idx;
    if (role === "designation" && map.designation == null) map.designation = idx;
    if (role === "unite" && map.unite == null) map.unite = idx;
    if (role === "quantite" && map.quantite == null) map.quantite = idx;
    if (role === "prix_unitaire" && map.prix_unitaire == null) map.prix_unitaire = idx;
    if (role === "prix_total" && map.prix_total == null) map.prix_total = idx;
  });
  return map;
}

function scoreHeaderRow(row: string[]): number {
  let score = 0;
  const roles = new Set<ColumnRole>();
  for (const cell of row) {
    const role = classifyHeaderCell(cell);
    if (role !== "ignore") {
      roles.add(role);
      score += 1;
    }
  }
  if (roles.has("designation")) score += 2;
  if (roles.has("quantite") || roles.has("prix_unitaire") || roles.has("prix_total")) score += 1;
  return score >= 3 ? score : 0;
}

function nonEmptyCellCount(row: string[]): number {
  return row.filter((c) => c.trim()).length;
}

function findHeaderRowIndex(grille: GrilleDevis): number {
  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < Math.min(grille.length, 80); i++) {
    const row = grille[i]!;
    if (row[0]?.startsWith("### FEUILLE:")) continue;
    if (nonEmptyCellCount(row) < 3) continue;
    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestScore >= 3 ? bestIdx : -1;
}

function isEmptyRow(row: string[]): boolean {
  return row.every((c) => !c.trim());
}

function looksLikePosition(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^\d+(\.\d+)+$/.test(v)) return true;
  if (/^[A-Za-z]\.\d+/.test(v)) return true;
  if (/^\d{1,4}$/.test(v)) return true;
  return false;
}

function isSheetMarker(row: string[]): boolean {
  return row.length === 1 && row[0]!.startsWith("### FEUILLE:");
}

function isSousTotalDesignation(designation: string): boolean {
  const n = normalizeText(designation);
  if (/sous[- ]?total/.test(n)) return true;
  if (/total (du )?lot/.test(n)) return true;
  if (/^total\s*(ht|ttc|general|général)?$/.test(n)) return true;
  if (n === "total" || n === "total ht" || n === "total ttc") return true;
  return false;
}

function inferDesignationColumn(row: string[], map: ColumnMap): number {
  if (map.designation != null) return map.designation;
  let bestIdx = 0;
  let bestLen = 0;
  row.forEach((cell, idx) => {
    if (parseFrenchNumber(cell) != null) return;
    if (looksLikePosition(cell)) return;
    if (cell.length > bestLen) {
      bestLen = cell.length;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

function getCell(row: string[], idx: number | undefined): string {
  if (idx == null || idx < 0 || idx >= row.length) return "";
  return row[idx]!.trim();
}

function classifyLineType(
  designation: string,
  quantite: number | null,
  prixUnitaire: number | null,
  prixTotal: number | null,
): BudgetPosteTypeLigne {
  if (!designation) return "poste";
  if (isSousTotalDesignation(designation)) return "sous_total";
  const hasAmounts =
    (quantite != null && quantite > 0) ||
    (prixUnitaire != null && prixUnitaire > 0) ||
    (prixTotal != null && prixTotal > 0);
  if (!hasAmounts && designation.length >= 3) return "titre_lot";
  return "poste";
}

function inferAmountsFromRow(row: string[], map: ColumnMap): {
  quantite: number | null;
  prix_unitaire: number | null;
  prix_total: number | null;
} {
  let quantite = parseIntegerQty(getCell(row, map.quantite));
  let prix_unitaire = parseFrenchNumber(getCell(row, map.prix_unitaire));
  let prix_total = parseFrenchNumber(getCell(row, map.prix_total));

  if (prix_total == null || prix_unitaire == null) {
    const nums: { idx: number; val: number }[] = [];
    row.forEach((cell, idx) => {
      if (
        idx === map.position ||
        idx === map.designation ||
        idx === map.unite
      ) {
        return;
      }
      const val = parseFrenchNumber(cell);
      if (val != null && /[,.]\d{2}/.test(cell)) {
        nums.push({ idx, val });
      }
    });
    if (nums.length >= 2) {
      prix_unitaire ??= nums[nums.length - 2]!.val;
      prix_total ??= nums[nums.length - 1]!.val;
    } else if (nums.length === 1) {
      prix_total ??= nums[0]!.val;
    }
  }

  if (quantite == null) {
    row.forEach((cell, idx) => {
      if (idx === map.position || idx === map.designation || idx === map.unite) return;
      if (parseFrenchNumber(cell) != null && /[,.]/.test(cell)) return;
      if (/^\d{1,4}$/.test(cell.trim()) && idx === map.designation) return;
      const q = parseIntegerQty(cell);
      if (q != null && quantite == null && q <= 9999) quantite = q;
    });
  }

  return { quantite, prix_unitaire, prix_total };
}

function detectDocumentType(grille: GrilleDevis): DevisDocumentType {
  const blob = grille.flat().join(" ").toLowerCase();
  if (/\bdpgf\b/.test(blob)) return "dpgf";
  if (/bordereau/.test(blob)) return "bordereau";
  if (/devis/.test(blob)) return "devis";
  return "autre";
}

function extractDocumentTotals(grille: GrilleDevis): {
  total_ht: number | null;
  total_ttc: number | null;
  taux_tva: number | null;
} {
  let total_ht: number | null = null;
  let total_ttc: number | null = null;
  let taux_tva: number | null = null;

  for (const row of grille) {
    const line = row.join(" ");
    const n = normalizeText(line);
    const amounts = row.map(parseFrenchNumber).filter((v): v is number => v != null);
    const last = amounts[amounts.length - 1];

    if (last == null) continue;
    if (n.includes("total ht") || (n.includes("montant") && n.includes("ht"))) {
      total_ht = last;
    }
    if (n.includes("total ttc") || n.includes("net a payer") || n.includes("ttc")) {
      total_ttc = last;
    }
    if (n.includes("tva") && (n.includes("%") || n.includes("taux"))) {
      const pct = row.map(parseFrenchNumber).find((v) => v != null && v > 0 && v <= 30);
      if (pct != null) taux_tva = pct;
    }
  }

  return { total_ht, total_ttc, taux_tva };
}

function parseStructuredRows(
  grille: GrilleDevis,
  headerIdx: number,
  map: ColumnMap,
  options: { structureReconnue: boolean },
): PosteAnalyse[] {
  const postes: PosteAnalyse[] = [];
  let lotCourant: string | null = null;
  let ordre = 0;

  for (let i = headerIdx + 1; i < grille.length; i++) {
    const row = grille[i]!;
    if (isEmptyRow(row) || isSheetMarker(row)) continue;

    let numero_position: string | null = null;
    const posCell = getCell(row, map.position);
    if (posCell && looksLikePosition(posCell)) {
      numero_position = posCell;
    } else if (looksLikePosition(row[0] ?? "")) {
      numero_position = row[0]!.trim();
    }

    const desIdx = inferDesignationColumn(row, map);
    let designation = getCell(row, desIdx);
    if (!designation) {
      designation = row.find((c) => c.trim().length > 2 && parseFrenchNumber(c) == null) ?? "";
    }
    designation = designation.trim();
    if (!designation || isJunkDesignation(designation)) continue;

    const unite = getCell(row, map.unite) || null;
    const amounts = inferAmountsFromRow(row, map);
    const type_ligne = classifyLineType(
      designation,
      amounts.quantite,
      amounts.prix_unitaire,
      amounts.prix_total,
    );

    if (type_ligne === "titre_lot" && !isJunkDesignation(designation)) {
      lotCourant = designation;
    }

    const metier = detectMetier(designation);

    const raw: Omit<PosteAnalyse, "coherence_ok" | "remarque"> = {
      numero_position,
      lot: lotCourant,
      metier,
      designation,
      unite: unite || null,
      quantite: amounts.quantite,
      prix_unitaire: amounts.prix_unitaire,
      prix_total: amounts.prix_total,
      type_ligne,
      ordre: ordre++,
    };

    postes.push(applyCoherenceToPoste(raw));
  }

  if (!options.structureReconnue && postes.length === 0) {
    return parseRawFallback(grille, headerIdx);
  }

  return postes;
}

function parseRawFallback(grille: GrilleDevis, startIdx = 0): PosteAnalyse[] {
  const postes: PosteAnalyse[] = [];
  let ordre = 0;

  for (let i = startIdx; i < grille.length; i++) {
    const row = grille[i]!;
    if (isEmptyRow(row) || isSheetMarker(row)) continue;

    const joined = row.filter(Boolean).join(" ").trim();
    if (!joined || scoreHeaderRow(row) > 0 || isJunkDesignation(joined)) continue;

    let numero_position: string | null = null;
    let designation = joined;
    if (looksLikePosition(row[0] ?? "")) {
      numero_position = row[0]!.trim();
      designation = row.slice(1).filter(Boolean).join(" ").trim() || joined;
    }

    const amounts = inferAmountsFromRow(row, {});
    const type_ligne = classifyLineType(
      designation,
      amounts.quantite,
      amounts.prix_unitaire,
      amounts.prix_total,
    );

    const raw: Omit<PosteAnalyse, "coherence_ok" | "remarque"> = {
      numero_position,
      lot: null,
      metier: detectMetier(designation),
      designation,
      unite: null,
      quantite: amounts.quantite,
      prix_unitaire: amounts.prix_unitaire,
      prix_total: amounts.prix_total,
      type_ligne,
      ordre: ordre++,
    };

    postes.push(applyCoherenceToPoste(raw));
  }

  return postes;
}

function parsedToPosteAnalyse(p: ParsedPoste): PosteAnalyse {
  return applyCoherenceToPoste({
    numero_position: p.numeroPosition,
    lot: p.lot,
    metier: detectMetier(p.designation),
    designation: p.designation,
    unite: p.unite,
    quantite: p.quantite,
    prix_unitaire: p.prixUnitaire,
    prix_total: p.prixTotal,
    type_ligne: "poste",
    ordre: p.ordre,
  });
}

function parseFromLayoutEngine(grille: GrilleDevis): {
  postes: PosteAnalyse[];
  prixFinal: number | null;
} {
  const layout = parseDevisTable(grille);
  return {
    postes: layout.postes.map(parsedToPosteAnalyse),
    prixFinal: layout.prixFinal,
  };
}

function parseFromTextEngine(text: string): {
  postes: PosteAnalyse[];
  prixFinal: number | null;
} {
  const parsed = parseDevisText(text);
  return {
    postes: parsed.postes.map(parsedToPosteAnalyse),
    prixFinal: parsed.prixFinal,
  };
}

function scorePosteSet(postes: PosteAnalyse[]): number {
  return postes.filter(
    (p) =>
      p.type_ligne === "poste" &&
      p.prix_total != null &&
      p.prix_total > 0 &&
      !/^remise\b/i.test(p.designation),
  ).length;
}

function pickBestPosteCandidates(candidates: PosteAnalyse[][]): PosteAnalyse[] {
  let best: PosteAnalyse[] = [];
  let bestScore = -1;
  for (const candidate of candidates) {
    const filtered = candidate.filter((p) => isPlausiblePoste(p));
    const score = scorePosteSet(filtered);
    if (score > bestScore || (score === bestScore && filtered.length > best.length)) {
      bestScore = score;
      best = filtered;
    }
  }
  return best;
}

function refreshPosteCoherence(postes: PosteAnalyse[]): PosteAnalyse[] {
  return postes.map((p) => {
    if (p.type_ligne !== "poste") return p;
    const { coherence_ok: _c, remarque: _r, ...raw } = p;
    return applyCoherenceToPoste(raw);
  });
}

export interface AnalyserDevisOptions {
  /** PDF ou extraction imparfaite */
  pdfImperfect?: boolean;
  /** Texte brut pdf-parse (regroupement vertical) */
  pdfPlainText?: string;
  /** Libellés REP détectés par position pdfjs (colonne Description) */
  spatialHints?: import("@/lib/devis-parser/extract-pdf-layout").SpatialPosteHint[];
}

/**
 * Moteur heuristique agnostique — analyse une grille lignes×colonnes.
 */
export function analyserDevis(
  grille: GrilleDevis,
  options?: AnalyserDevisOptions,
): ResultatAnalyse {
  const remarques: string[] = [];
  grille = sanitizeGrille(grille);

  const headerIdx = findHeaderRowIndex(grille);
  const structureFromHeader = headerIdx >= 0;
  let structure_reconnue = structureFromHeader && !options?.pdfImperfect;

  if (!structure_reconnue) {
    remarques.push(
      "Structure de colonnes non reconnue — mapping manuel recommandé (étape C).",
    );
  }

  let postes: PosteAnalyse[];
  let prixFinalLayout: number | null = null;

  if (options?.pdfPlainText) {
    const candidates: PosteAnalyse[][] = [];
    let prixCandidates: (number | null)[] = [];

    const fromText = parseFromTextEngine(options.pdfPlainText);
    candidates.push(fromText.postes);
    prixCandidates.push(fromText.prixFinal);

    const fromTabText = parseFromTextEngine(rowsToPlainText(grille));
    candidates.push(fromTabText.postes);
    prixCandidates.push(fromTabText.prixFinal);

    const layout = parseFromLayoutEngine(grille);
    candidates.push(layout.postes);
    prixCandidates.push(layout.prixFinal);

    if (candidates.every((c) => scorePosteSet(c) < 3)) {
      candidates.push(parseRawFallback(grille));
      prixCandidates.push(null);
    }

    const bestIdx = candidates.reduce(
      (best, c, i) => {
        const score = scorePosteSet(c.filter((p) => isPlausiblePoste(p)));
        return score > best.score ? { score, idx: i } : best;
      },
      { score: -1, idx: 0 },
    );
    postes = pickBestPosteCandidates(candidates);
    prixFinalLayout = prixCandidates[bestIdx.idx] ?? layout.prixFinal;
  } else if (structureFromHeader && !options?.pdfImperfect) {
    const map = buildColumnMap(grille[headerIdx]!);
    if (map.designation == null) {
      remarques.push("Colonne désignation non identifiée — inférence sur la colonne la plus large.");
    }
    postes = parseStructuredRows(grille, headerIdx, map, { structureReconnue: structure_reconnue });
  } else {
    const layout = parseFromLayoutEngine(grille);
    postes = layout.postes;
    prixFinalLayout = layout.prixFinal;
    if (scorePosteSet(postes) < 3) {
      postes = parseRawFallback(grille);
    }
  }

  postes = postes.filter((p) => isPlausiblePoste(p));

  if (options?.pdfPlainText) {
    enrichPosteDesignationsFromPdf(
      postes,
      grille,
      options.pdfPlainText,
      options.spatialHints,
    );
    postes = refreshPosteCoherence(postes);

    const fallbackPostes = postes.filter(
      (p) => p.type_ligne === "poste" && /^Poste \d+ \(HT /.test(p.designation),
    );
    if (fallbackPostes.length > 0) {
      const sources = [
        options.pdfPlainText,
        ...grille.flat(),
      ]
        .join("\n")
        .toUpperCase();
      if (
        !/\bREP\b|\bREF\b|\bRÉP\b/i.test(sources) &&
        !(options.spatialHints ?? []).some((h) => h.ref)
      ) {
        remarques.push(
          "Références REP/REF absentes du texte PDF extrait — libellés peut-être dans des dessins non textuels.",
        );
      }
    }
  }

  const plausiblePostes = postes.filter((p) => p.type_ligne === "poste");
  if (plausiblePostes.length < 3) {
    structure_reconnue = false;
    if (!remarques.some((r) => r.includes("Excel"))) {
      remarques.push(
        "Peu de postes fiables extraits — préférez le fichier Excel (.xlsx) pour ce devis.",
      );
    }
  }

  if (postes.length === 0) {
    remarques.push("Aucune ligne de poste extraite.");
  }

  const totals = extractDocumentTotals(grille);
  if (prixFinalLayout != null && totals.total_ttc == null) {
    totals.total_ttc = prixFinalLayout;
  }
  const type_document = detectDocumentType(grille);
  const metiers_detectes = aggregateMetiers(postes);

  const incoherent = postes.filter((p) => p.type_ligne === "poste" && !p.coherence_ok).length;
  if (incoherent > 0) {
    remarques.push(`${incoherent} poste(s) avec incohérence qté × PU ≠ total ou unité manquante.`);
  }

  const document: DocumentAnalyse = {
    type_document,
    metiers_detectes,
    total_ht: totals.total_ht,
    total_ttc: totals.total_ttc,
    taux_tva: totals.taux_tva,
    structure_reconnue,
    remarques,
  };

  return { document, postes };
}
