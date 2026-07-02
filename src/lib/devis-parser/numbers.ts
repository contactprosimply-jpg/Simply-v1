/** "1 234,56" ou "1234.56" → number */
export function parseFrenchNumber(raw: string): number | null {
  const cleaned = raw
    .replace(/[\u00A0\u202F\u2007\u2009]/g, "")
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

/** "4 724,954 724,95" → "4 724,95 4 724,95" (PU et total collés par pdf-parse). */
export function splitGluedAmounts(line: string): string {
  return line.replace(/(\d{1,3}(?: \d{3})*,\d{2})(?=\d)/g, (m) => `${m} `);
}

export function extractAmounts(line: string): number[] {
  const normalized = splitGluedAmounts(line);
  const matches = normalized.match(AMOUNT_RE);
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
