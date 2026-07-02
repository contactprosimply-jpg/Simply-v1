import type { TextItem } from "@/lib/devis-parser/extract-pdf-layout";
import { extractPosteReference, normalizeExtractedText } from "@/lib/devis-parser/poste-references";

export interface PdfExtractionDiagnostic {
  text_item_count: number;
  rep_fragments: string[];
  spatial_hints_with_ref: number;
  spatial_samples: Array<{
    amount: number;
    ref: string | null;
    detail: string | null;
  }>;
  rep_extractable: boolean;
}

export function buildPdfExtractionDiagnostic(
  items: TextItem[],
  spatialHints: Array<{ amount: number; ref: string | null; detail: string | null }>,
): PdfExtractionDiagnostic {
  const repFragments: string[] = [];

  for (const it of items) {
    const t = it.text;
    if (!/\bR[ÉE]P\b|\bREP\b/i.test(t)) continue;
    const frag = t.slice(0, 80);
    if (!repFragments.includes(frag)) repFragments.push(frag);
  }

  const withRef = spatialHints.filter((h) => h.ref);

  return {
    text_item_count: items.length,
    rep_fragments: repFragments.slice(0, 12),
    spatial_hints_with_ref: withRef.length,
    spatial_samples: spatialHints
      .filter((h) => h.ref || h.amount === 4724.95)
      .slice(0, 8)
      .map((h) => ({ amount: h.amount, ref: h.ref, detail: h.detail?.slice(0, 60) ?? null })),
    rep_extractable: repFragments.length > 0 || withRef.length > 0,
  };
}

export function scanRepInText(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const t = normalizeExtractedText(line);
    if (!/\bR[ÉE]P\b|\bREP\b/i.test(t)) continue;
    const ref = extractPosteReference(t);
    out.push(ref ?? t.slice(0, 60));
  }
  return out.slice(0, 12);
}
