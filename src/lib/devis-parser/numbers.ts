/** "1 234,56" ou "1234.56" → number */
export function parseFrenchNumber(raw: string): number | null {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Montants FR : 4 500,00 · 450,00 · 450.00 */
const AMOUNT_RE = /\d{1,3}(?:\s\d{3})*[,.]\d{2}|\d+[,.]\d{2}/g;

export function extractAmounts(line: string): number[] {
  const matches = line.match(AMOUNT_RE);
  if (!matches) return [];
  return matches.map(parseFrenchNumber).filter((n): n is number => n !== null);
}

/** Entier seul (qté) en fin de segment — pas confondu avec un montant */
export function parseIntegerToken(raw: string): number | null {
  const t = raw.trim();
  if (!/^\d{1,4}$/.test(t)) return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
