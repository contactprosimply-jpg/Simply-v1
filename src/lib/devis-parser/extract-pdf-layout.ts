interface TextItem {
  x: number;
  y: number;
  text: string;
}

const Y_TOLERANCE = 5;
const X_GAP = 12;

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

/**
 * Extrait le PDF en lignes de cellules (colonnes triées par X)
 * pour reconstituer les tableaux DPGF mal lus par pdf-parse.
 */
export async function extractPdfTableRows(buffer: Buffer): Promise<string[][]> {
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
      const text = raw.str.replace(/\s+/g, " ").trim();
      if (!text) continue;
      const t = raw.transform;
      items.push({ x: t[4] ?? 0, y: t[5] ?? 0, text });
    }
  }

  if (items.length === 0) return [];

  items.sort((a, b) => b.y - a.y || a.x - b.x);

  const rowGroups: TextItem[][] = [];
  for (const item of items) {
    const current = rowGroups[rowGroups.length - 1];
    if (current && Math.abs(current[0]!.y - item.y) <= Y_TOLERANCE) {
      current.push(item);
    } else {
      rowGroups.push([item]);
    }
  }

  return rowGroups.map((group) => clusterIntoColumns(group));
}

/** Texte tabulé (fallback parseDevisText). */
export function rowsToPlainText(rows: string[][]): string {
  return rows.map((r) => r.join("\t")).join("\n");
}
