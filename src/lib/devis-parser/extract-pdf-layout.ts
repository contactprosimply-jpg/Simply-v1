interface TextItem {
  x: number;
  y: number;
  text: string;
}

const Y_TOLERANCE = 5;

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

  return rowGroups.map((group) => {
    group.sort((a, b) => a.x - b.x);
    return group.map((g) => g.text);
  });
}

/** Texte tabulé (fallback parseDevisText). */
export function rowsToPlainText(rows: string[][]): string {
  return rows.map((r) => r.join("\t")).join("\n");
}
