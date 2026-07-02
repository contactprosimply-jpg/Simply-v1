/** REP N°04, REF 12, ART.3, POSTE A1… */
const N_MARK = `(?:N[°º\\u00B0\\u00BA]?|No\\.?|#)`;

const POSTE_REF_LINE_RE = new RegExp(
  `^(R[ÉE]P|REP|REF|ART|POSTE|ITEM|LIGNE|L\\.?)\\s*(?:${N_MARK}|\\.|\\:|\\-)?\\s*[\\dA-Za-z][\\dA-Za-z.\\-/]*`,
  "i",
);

const POSTE_REF_INLINE_RE = new RegExp(
  `\\b(R[ÉE]P|REP|REF|ART|POSTE|ITEM)\\s*(?:${N_MARK}|\\.|\\:|\\-)?\\s*[\\dA-Za-z][\\dA-Za-z.\\-/]*`,
  "i",
);

const REP_PREFIX_ONLY_RE = /^(R[ÉE]P|REP|REF|ART|POSTE|ITEM)$/i;
const REP_SUFFIX_RE = /^(?:N[°º\u00B0\u00BA]?|No\.?|#)\s*[\dA-Za-z][\dA-Za-z.\-/]*/i;

export function normalizeExtractedText(text: string): string {
  return text
    .replace(/[\u00A0\u202F\u2007\u2009]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPosteReference(line: string): string | null {
  const t = normalizeExtractedText(line);
  if (!t || t.length > 500) return null;
  if (POSTE_REF_LINE_RE.test(t)) {
    const m = t.match(POSTE_REF_LINE_RE);
    return m ? m[0].trim() : t;
  }
  const inline = t.match(POSTE_REF_INLINE_RE);
  if (inline) {
    const idx = inline.index ?? 0;
    if (idx === 0 || idx <= 3 || t.length <= 80) return inline[0].trim();
  }
  if (/^REP\b/i.test(t) && t.length <= 40) {
    const num = t.match(/(?:N[°º\u00B0\u00BA]?|No\.?|#)?\s*0*(\d{1,4})\b/i);
    if (num) return `REP N°${num[1]}`;
  }
  return null;
}

/** "REP" sur une ligne + "N°04" sur la suivante (pdf-parse / pdfjs). */
export function mergeSplitReferenceLines(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = normalizeExtractedText(lines[i] ?? "");
    if (!line) continue;
    if (REP_PREFIX_ONLY_RE.test(line) && i + 1 < lines.length) {
      const next = normalizeExtractedText(lines[i + 1] ?? "");
      if (REP_SUFFIX_RE.test(next) || /^\d[\dA-Za-z.\-/]*$/.test(next)) {
        out.push(`${line} ${next}`);
        i += 1;
        continue;
      }
    }
    out.push(line);
  }
  return out;
}

/** "REP N°04" → "04" */
export function extractRefNumber(ref: string): string | null {
  const m =
    ref.match(/(?:N°|Nº|N\.?|#)\s*([\dA-Za-z][\dA-Za-z.\-/]*)/i) ??
    ref.match(/\b(\d+(?:\.\d+)*)\s*$/);
  return m?.[1]?.trim() ?? null;
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
