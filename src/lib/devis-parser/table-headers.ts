/** En-têtes de colonnes DPGF / devis (souvent concaténés par pdf-parse). */
const HEADER_TOKENS = [
  "description",
  "désignation",
  "designation",
  "libellé",
  "libelle",
  "qté",
  "qte",
  "quantité",
  "quantite",
  "unité",
  "unite",
  "p.u",
  "p.u.",
  "pu ht",
  "prix unitaire",
  "montant ht",
  "montant",
  "total ht",
];

export function isTableHeaderLine(text: string): boolean {
  const lower = text.toLowerCase().replace(/\s+/g, " ");
  let hits = 0;
  for (const token of HEADER_TOKENS) {
    if (lower.includes(token)) hits++;
  }
  if (hits >= 3) return true;
  // Concaténation type "HTUnitéQtéDescription"
  if (/ht\s*unit[eé]\s*qt[eé]\s*desc/i.test(text.replace(/\s/g, ""))) return true;
  if (/montant\s*ht.*p\.?\s*u/i.test(lower)) return true;
  return false;
}

export function isPageMarkerLine(text: string): boolean {
  return (
    /\b\d{1,3}\s+sur\s+\d{1,3}\b/i.test(text) ||
    /^page\s+\d+/i.test(text) ||
    /\bpage\s+\d+\s*\/\s*\d+/i.test(text)
  );
}

/** N° de poste crédible (1.2.3) — pas un numéro de page isolé. */
export function isValidPosteNumber(pos: string, nextToken?: string): boolean {
  const p = pos.trim();
  if (!p) return false;
  if (p.includes(".")) return /^\d+(?:\.\d+)+$/.test(p);
  if (/^sur$/i.test(nextToken ?? "")) return false;
  const n = Number.parseInt(p, 10);
  if (!Number.isFinite(n) || n < 1) return false;
  if (nextToken && nextToken.length >= 12 && !isTableHeaderLine(nextToken)) return true;
  return false;
}

export function hasPositivePrice(
  prixUnitaire: number | null,
  prixTotal: number | null,
): boolean {
  if (prixTotal != null && prixTotal > 0) return true;
  if (prixUnitaire != null && prixUnitaire > 0) return true;
  return false;
}
