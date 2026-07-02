/** REP N°04, REF 12, ART.3, POSTE A1… */
const POSTE_REF_LINE_RE =
  /^(REP|REF|ART|POSTE|ITEM|LIGNE|L\.?)\s*(?:N°|Nº|N\.?|#|\.|:|-)?\s*[\dA-Za-z][\dA-Za-z.\-/]*/i;

const POSTE_REF_INLINE_RE =
  /\b(REP|REF|ART|POSTE|ITEM)\s*(?:N°|Nº|N\.?|#|\.|:|-)?\s*[\dA-Za-z][\dA-Za-z.\-/]*/i;

export function extractPosteReference(line: string): string | null {
  const t = line.trim();
  if (!t || t.length > 80) return null;
  if (POSTE_REF_LINE_RE.test(t)) {
    const m = t.match(POSTE_REF_LINE_RE);
    return m ? m[0].trim() : t;
  }
  const inline = t.match(POSTE_REF_INLINE_RE);
  if (inline && t.length <= 40) return inline[0].trim();
  return null;
}

export function isPosteReferenceLine(line: string): boolean {
  return extractPosteReference(line) != null;
}

export function formatDesignationWithRef(ref: string, detail?: string | null): string {
  const d = detail?.trim();
  if (!d || d === ref || extractPosteReference(d) === ref) return ref;
  if (d.length > 100) return `${ref} — ${d.slice(0, 100)}…`;
  return `${ref} — ${d}`;
}
