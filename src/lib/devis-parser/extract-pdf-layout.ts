import { extractAmounts, splitGluedAmounts } from "@/lib/devis-parser/numbers";
import {
  extractPosteReference,
  looseExtractRep,
  mergeSplitReferenceLines,
  normalizeExtractedText,
} from "@/lib/devis-parser/poste-references";

export interface TextItem {
  x: number;
  y: number;
  text: string;
  page: number;
}

export interface SpatialPosteHint {
  amount: number;
  ref: string | null;
  detail: string | null;
}

const Y_TOLERANCE = 5;
const X_GAP = 12;
const DESC_ABOVE_PTS = 320;
const DESC_BELOW_PTS = 80;

function estimateEndX(item: TextItem): number {
  return item.x + Math.max(item.text.length * 4.5, 10);
}

function clusterIntoColumns(group: TextItem[]): string[] {
  if (group.length === 0) return [];
  group.sort((a, b) => a.x - b.x);

  const columns: string[] = [];
  let buf = group[0]!.text;
  let prevEnd = estimateEndX(group[0]!);

  for (let i = 1; i < group.length; i++) {
    const item = group[i]!;
    if (item.x - prevEnd > X_GAP) {
      columns.push(buf.trim());
      buf = item.text;
    } else {
      buf += ` ${item.text}`;
    }
    prevEnd = Math.max(prevEnd, estimateEndX(item));
  }
  columns.push(buf.trim());
  return columns.filter(Boolean);
}

function amountFromText(text: string): number | null {
  const amounts = extractAmounts(splitGluedAmounts(normalizeExtractedText(text)));
  if (amounts.length === 0) return null;
  return amounts[amounts.length - 1]!;
}

function isDetailFragment(text: string): boolean {
  const t = normalizeExtractedText(text);
  if (!t || t.length < 8) return false;
  if (extractPosteReference(t)) return false;
  if (amountFromText(t) != null) return false;
  return /[a-zàâäéèêëïîôùûüç]{4,}/i.test(t);
}

function refAndDetailFromDescription(raw: string): { ref: string | null; detail: string | null } {
  const text = normalizeExtractedText(mergeSplitReferenceLines([raw]).join(" "));
  if (!text) return { ref: null, detail: null };

  const ref = looseExtractRep(text) ?? extractPosteReference(text);
  if (ref) {
    let detail: string | null = null;
    const idx = text.indexOf(ref);
    if (idx >= 0) {
      const tail = text.slice(idx + ref.length).replace(/^[\s—–-]+/, "").trim();
      if (isDetailFragment(tail)) detail = tail.slice(0, 100);
    }
    if (!detail) {
      const parts = text.split(/\s+/).filter(isDetailFragment);
      detail = parts[0]?.slice(0, 100) ?? null;
    }
    return { ref, detail };
  }

  if (/\bR[ÉE]P\b/i.test(text)) {
    const m = text.match(/\bR[ÉE]P\b\s*(?:N[°º\u00B0\u00BA]?|No\.?|#)?\s*0*(\d{1,4})\b/i);
    if (m) {
      const synthetic = `REP N°${m[1]}`;
      const tail = text.replace(/\bR[ÉE]P\b\s*(?:N[°º\u00B0\u00BA]?|No\.?|#)?\s*0*\d{1,4}\b/i, "").trim();
      return {
        ref: synthetic,
        detail: isDetailFragment(tail) ? tail.slice(0, 100) : null,
      };
    }
  }

  return { ref: null, detail: null };
}

/** Tous les fragments texte pdfjs avec position (page, x, y). */
export async function extractPdfTextItems(buffer: Buffer): Promise<TextItem[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;

  const items: TextItem[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    for (const raw of content.items) {
      if (!("str" in raw)) continue;
      const text = normalizeExtractedText(raw.str);
      if (!text) continue;
      const t = raw.transform;
      items.push({ x: t[4] ?? 0, y: t[5] ?? 0, text, page: pageNum });
    }
  }

  return items;
}

/**
 * Pour chaque montant détecté dans le PDF, récupère le libellé à gauche / au-dessus
 * (colonne Description DPGF — indépendant du clustering ligne pdfjs).
 */
export function buildSpatialPosteHints(items: TextItem[]): SpatialPosteHint[] {
  if (items.length === 0) return [];

  const amountItems = items
    .map((it) => ({ it, amount: amountFromText(it.text) }))
    .filter((x): x is { it: TextItem; amount: number } => x.amount != null && x.amount > 10);

  if (amountItems.length === 0) return [];

  const pageMaxX = new Map<number, number>();
  for (const it of items) {
    pageMaxX.set(it.page, Math.max(pageMaxX.get(it.page) ?? 0, it.x));
  }

  const amountXs = amountItems.map((a) => a.it.x).sort((a, b) => a - b);
  const pivotX = amountXs[Math.floor(amountXs.length / 2)] ?? amountXs[0]!;
  const rightAmounts = amountItems.filter((a) => a.it.x >= pivotX - 30);

  const hints: SpatialPosteHint[] = [];
  const seen = new Set<string>();

  const sorted = [...rightAmounts].sort(
    (a, b) => a.it.page - b.it.page || b.it.y - a.it.y || a.it.x - b.it.x,
  );

  for (const { it, amount } of sorted) {
    const key = `${it.page}:${Math.round(it.y)}:${amount}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const pageWidth = pageMaxX.get(it.page) ?? it.x;
    const descMaxX = Math.min(
      Math.min(...rightAmounts.filter((a) => a.it.page === it.page).map((a) => a.it.x)) - 20,
      pageWidth * 0.62,
    );

    const descItems = items.filter(
      (d) =>
        d.page === it.page &&
        d.x < descMaxX &&
        d.y >= it.y - DESC_ABOVE_PTS &&
        d.y <= it.y + DESC_BELOW_PTS,
    );

    descItems.sort((a, b) => b.y - a.y || a.x - b.x);
    const descText = descItems.map((d) => d.text).join(" ");
    const { ref, detail } = refAndDetailFromDescription(descText);

    if (ref) {
      hints.push({ amount, ref, detail });
    } else if (detail) {
      hints.push({ amount, ref: null, detail });
    }
  }

  return hints.sort((a, b) => {
    if (a.ref && !b.ref) return -1;
    if (!a.ref && b.ref) return 1;
    return 0;
  });
}

export async function extractPdfSpatialPosteHints(buffer: Buffer): Promise<SpatialPosteHint[]> {
  const items = await extractPdfTextItems(buffer);
  return buildSpatialPosteHints(items);
}

/**
 * Extrait le PDF en lignes de cellules (colonnes triées par X)
 * pour reconstituer les tableaux DPGF mal lus par pdf-parse.
 */
export function extractPdfTableRowsFromItems(items: TextItem[]): string[][] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const rowGroups: TextItem[][] = [];
  for (const item of sorted) {
    const current = rowGroups[rowGroups.length - 1];
    if (current && Math.abs(current[0]!.y - item.y) <= Y_TOLERANCE) {
      current.push(item);
    } else {
      rowGroups.push([item]);
    }
  }

  return rowGroups.map((group) => clusterIntoColumns(group));
}

export async function extractPdfTableRows(buffer: Buffer): Promise<string[][]> {
  return extractPdfTableRowsFromItems(await extractPdfTextItems(buffer));
}

/** Texte tabulé (fallback parseDevisText). */
export function rowsToPlainText(rows: string[][]): string {
  return rows.map((r) => r.join("\t")).join("\n");
}
