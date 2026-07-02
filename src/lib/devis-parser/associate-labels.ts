import { isJunkDesignation } from "@/lib/devis/filters";
import type { GrilleDevis, PosteAnalyse } from "@/lib/devis/types";
import { detectMetier } from "@/lib/devis/metiers";
import { extractAmounts, splitGluedAmounts } from "@/lib/devis-parser/numbers";
import {
  extractPosteReference,
  extractRefNumber,
  formatDesignationWithRef,
  isPosteReferenceLine,
  mergeSplitReferenceLines,
  normalizeExtractedText,
} from "@/lib/devis-parser/poste-references";

const LOOKBACK = 80;
const LOOKFORWARD = 25;

function needsDesignationEnrichment(designation: string): boolean {
  return /^Poste \d+ \(HT /.test(designation) || designation.length < 12;
}

function isDetailCandidate(text: string): boolean {
  const c = normalizeExtractedText(text);
  if (!c || c.length < 10) return false;
  if (isPosteReferenceLine(c)) return false;
  if (isJunkDesignation(c)) return false;
  if (extractAmounts(splitGluedAmounts(c)).length > 0) return false;
  return /[a-zàâäéèêëïîôùûüç]{5,}/i.test(c);
}

function detailFromCell(cell: string, ref: string): string | null {
  const c = normalizeExtractedText(cell);
  if (c.length <= ref.length + 5) return null;
  if (!c.startsWith(ref)) return null;
  const extra = c.slice(ref.length).replace(/^[\s—–-]+/, "").trim();
  return isDetailCandidate(extra) ? extra.slice(0, 100) : null;
}

function extractDetailBetween(
  lines: string[],
  fromIdx: number,
  toIdx: number,
): string | null {
  const start = Math.min(fromIdx, toIdx);
  const end = Math.max(fromIdx, toIdx);
  for (let j = start + 1; j < end; j++) {
    const line = lines[j] ?? "";
    if (isDetailCandidate(line)) return line.slice(0, 100);
  }
  return null;
}

function findRefNearLine(
  lines: string[],
  rowIdx: number,
): { ref: string | null; detail: string | null } {
  const same = normalizeExtractedText(lines[rowIdx] ?? "");
  const sameRef = extractPosteReference(same);
  if (sameRef) {
    return { ref: sameRef, detail: detailFromCell(same, sameRef) };
  }

  for (let j = rowIdx - 1; j >= Math.max(0, rowIdx - LOOKBACK); j--) {
    const line = normalizeExtractedText(lines[j] ?? "");
    const ref = extractPosteReference(line);
    if (ref) {
      return {
        ref,
        detail: detailFromCell(line, ref) ?? extractDetailBetween(lines, j, rowIdx),
      };
    }
  }

  for (let j = rowIdx + 1; j <= Math.min(lines.length - 1, rowIdx + LOOKFORWARD); j++) {
    const line = normalizeExtractedText(lines[j] ?? "");
    const ref = extractPosteReference(line);
    if (ref) {
      return {
        ref,
        detail: extractDetailBetween(lines, rowIdx, j) ?? detailFromCell(line, ref),
      };
    }
  }

  return { ref: null, detail: null };
}

function findPosteForAmount(
  postes: PosteAnalyse[],
  amount: number,
  used: Set<number>,
): PosteAnalyse | null {
  const candidates = postes.filter(
    (p) =>
      p.type_ligne === "poste" &&
      p.prix_total != null &&
      !used.has(p.ordre) &&
      needsDesignationEnrichment(p.designation),
  );
  const byTotal = candidates.find((p) => Math.abs(p.prix_total! - amount) < 0.05);
  if (byTotal) return byTotal;
  return (
    candidates.find(
      (p) => p.prix_unitaire != null && Math.abs(p.prix_unitaire - amount) < 0.05,
    ) ?? null
  );
}

function applyRefToPoste(
  poste: PosteAnalyse,
  ref: string,
  detail: string | null,
): void {
  poste.designation = formatDesignationWithRef(ref, detail);
  poste.numero_position = extractRefNumber(ref);
  poste.metier = detectMetier(poste.designation);
}

function grilleToSearchLines(grille: GrilleDevis): string[] {
  const raw: string[] = [];
  for (const row of grille) {
    if (row[0]?.startsWith("### FEUILLE:")) continue;
    const cells = row.map((c) => normalizeExtractedText(c)).filter(Boolean);
    if (cells.length === 0) continue;
    raw.push(cells.join("\t"));
    for (const cell of cells) raw.push(cell);
  }
  return mergeSplitReferenceLines(raw);
}

function enrichFromLineStream(postes: PosteAnalyse[], lines: string[]): void {
  const used = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const amounts = extractAmounts(splitGluedAmounts(lines[i] ?? ""));
    if (amounts.length === 0) continue;

    const { ref, detail } = findRefNearLine(lines, i);
    if (!ref) continue;

    const toMatch =
      amounts.length >= 2 ? [amounts[amounts.length - 1]!] : amounts;

    for (const amt of toMatch) {
      const poste = findPosteForAmount(postes, amt, used);
      if (!poste) continue;
      applyRefToPoste(poste, ref, detail);
      used.add(poste.ordre);
      break;
    }
  }
}

/** Associe REP/REF aux postes via montants + recherche de ref proche (haut, bas, même ligne). */
export function enrichPosteDesignationsFromPdf(
  postes: PosteAnalyse[],
  grille: GrilleDevis,
  pdfPlainText?: string,
): void {
  const grilleLines = grilleToSearchLines(grille);
  enrichFromLineStream(postes, grilleLines);

  const plainLines = mergeSplitReferenceLines(
    (pdfPlainText ?? "")
      .split(/\r?\n/)
      .map((l) => normalizeExtractedText(l))
      .filter(Boolean),
  );
  enrichFromLineStream(postes, plainLines);

  const tabLines = mergeSplitReferenceLines(
    grille
      .filter((r) => !r[0]?.startsWith("### FEUILLE:"))
      .map((r) => r.map((c) => normalizeExtractedText(c)).filter(Boolean).join("\t"))
      .filter(Boolean),
  );
  enrichFromLineStream(postes, tabLines);

  const used = new Set<number>();
  for (const poste of postes) {
    if (poste.type_ligne !== "poste" || !needsDesignationEnrichment(poste.designation)) continue;
    if (poste.prix_total == null || used.has(poste.ordre)) continue;

    for (let i = 0; i < grilleLines.length; i++) {
      const amounts = extractAmounts(splitGluedAmounts(grilleLines[i] ?? ""));
      if (!amounts.some((a) => Math.abs(a - poste.prix_total!) < 0.05)) continue;
      const { ref, detail } = findRefNearLine(grilleLines, i);
      if (!ref) continue;
      applyRefToPoste(poste, ref, detail);
      used.add(poste.ordre);
      break;
    }
  }
}
