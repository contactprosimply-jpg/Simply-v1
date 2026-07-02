/** "1 234,56" / "1.234,56" / "1234,56 €" → 1234.56 */
export function parseFrenchNumber(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw)
    .replace(/\u00a0/g, " ")
    .replace(/€/g, "")
    .trim();
  if (!s || s === "-" || s === "—") return null;

  s = s.replace(/\s/g, "");

  if (/,\d{1,3}$/.test(s) && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/,/.test(s)) {
    s = s.replace(",", ".");
  }

  const n = Number.parseFloat(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function parseIntegerQty(raw: string): number | null {
  const n = parseFrenchNumber(raw);
  if (n == null || !Number.isFinite(n)) return null;
  if (!Number.isInteger(n) && Math.abs(n - Math.round(n)) > 0.001) return null;
  const i = Math.round(n);
  return i > 0 && i <= 999_999 ? i : null;
}
