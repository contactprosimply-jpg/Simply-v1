import { hasBtpSignal, isJunkLine } from "@/lib/devis-parser/filters";
import { hasPositivePrice, isPageMarkerLine, isTableHeaderLine } from "@/lib/devis-parser/table-headers";
import { parseFrenchNumber } from "@/lib/devis/numbers";

const UNIT_ONLY = /^(u|ml|m2|m²|m3|m³|ens|ff|forfait|pce|pc|kg|t|h|j)$/i;

function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isAmountOnly(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (UNIT_ONLY.test(t)) return true;
  const letters = t.replace(/[^a-zàâäéèêëïîôùûüç]/gi, "");
  if (letters.length === 0 && parseFrenchNumber(t) != null) return true;
  if (letters.length <= 2 && parseFrenchNumber(t) != null) return true;
  return false;
}

export function isJunkDesignation(designation: string): boolean {
  const d = designation.trim();
  if (!d) return true;
  if (isJunkLine(d)) return true;
  if (isTableHeaderLine(d)) return true;
  if (isPageMarkerLine(d)) return true;
  if (isAmountOnly(d)) return true;

  const n = normalizeText(d);
  const compact = n.replace(/\s/g, "");

  if (/\bape\s*:|rcs\s*:|tva\s*intracom/i.test(n)) return true;
  if (/\b\d{1,3}\s+sur\s+\d{1,3}\b/.test(n)) return true;
  if (/montant\s*ht.*p\.?\s*u/i.test(compact)) return true;
  if (/htunit[eé].*qt[eé].*desc/i.test(compact)) return true;
  if (/tauxbase\s*htmontant/i.test(compact)) return true;
  if (/^u$/i.test(d) || /^ml$/i.test(d)) return true;

  const letters = d.replace(/[^a-zàâäéèêëïîôùûüç]/gi, "");
  if (letters.length < 4 && parseFrenchNumber(d) != null) return true;
  if (/^[\d\s,.€-]+$/.test(d)) return true;

  return false;
}

export function isJunkRow(row: string[]): boolean {
  const cells = row.map((c) => c.trim()).filter(Boolean);
  if (cells.length === 0) return true;

  const joined = cells.join(" ");
  if (isJunkDesignation(joined)) return true;
  if (cells.length === 1 && isJunkDesignation(cells[0]!)) return true;

  return false;
}

export function sanitizeGrille(grille: string[][]): string[][] {
  return grille.filter((row) => {
    if (row[0]?.startsWith("### FEUILLE:")) return true;
    return !isJunkRow(row) && row.some((c) => c.trim());
  });
}

export function isPlausiblePoste(p: {
  designation: string;
  type_ligne: string;
  metier: string | null;
  prix_unitaire: number | null;
  prix_total: number | null;
  quantite: number | null;
}): boolean {
  if (isJunkDesignation(p.designation)) return false;

  if (p.type_ligne === "sous_total") {
    const n = normalizeText(p.designation);
    return /total|sous[- ]?total|net a payer|remise/.test(n);
  }

  if (p.type_ligne === "titre_lot") {
    if (isJunkLine(p.designation)) return false;
    if (hasBtpSignal(p.designation)) return true;
    return /\blot\s*[\d.:]|corps d['']?[eé]tat|section\s+\d|chapitre\s+\d/i.test(
      p.designation,
    );
  }

  if (p.type_ligne === "poste") {
    if (p.designation.length < 5) return false;
    if (isAmountOnly(p.designation)) return false;
    if (!hasPositivePrice(p.prix_unitaire, p.prix_total)) return false;
    if (p.metier != null || hasBtpSignal(p.designation)) return true;
    if (p.quantite != null && p.prix_unitaire != null && p.prix_total != null) return true;
    return p.designation.length >= 10;
  }

  return false;
}
