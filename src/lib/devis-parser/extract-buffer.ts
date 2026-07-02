import type { DevisTypeFichier } from "@/lib/database.types";
import { extractPdfTableRows, rowsToPlainText } from "@/lib/devis-parser/extract-pdf-layout";
import { parseDevisTable, parseDevisText } from "@/lib/devis-parser/parse-text";
import type { ParsedDevis } from "@/lib/devis-parser/types";
import * as XLSX from "xlsx";

function pickBestParsed(candidates: ParsedDevis[]): ParsedDevis {
  const scored = candidates
    .filter((c) => c.postes.length > 0)
    .map((c) => {
      const withPrice = c.postes.filter(
        (p) => (p.prixTotal ?? 0) > 0 || (p.prixUnitaire ?? 0) > 0,
      ).length;
      return { c, score: withPrice * 10 + c.postes.length };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.c ?? candidates[0] ?? { prixFinal: null, prixFinalLabel: null, postes: [] };
}

export async function parseDevisBuffer(
  buffer: Buffer,
  type: DevisTypeFichier | string | null,
): Promise<ParsedDevis> {
  const kind = (type ?? "pdf").toLowerCase();

  if (kind === "pdf") {
    const candidates: ParsedDevis[] = [];

    try {
      const rows = await extractPdfTableRows(buffer);
      if (rows.length > 0) {
        candidates.push(parseDevisTable(rows));
        candidates.push(parseDevisText(rowsToPlainText(rows)));
      }
    } catch {
      // pdfjs indisponible — fallback pdf-parse
    }

    const legacyText = await extractPdfText(buffer);
    if (legacyText.trim()) {
      candidates.push(parseDevisText(legacyText));
    }

    return pickBestParsed(candidates);
  }

  if (kind === "csv") {
    const text = buffer.toString("utf-8");
    const rows = text.split(/\r?\n/).map((line) => line.split(/[;,]/));
    return parseDevisTable(rows);
  }

  if (kind === "xlsx" || kind === "xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]!];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    return parseDevisTable(rows as string[][]);
  }

  return parseDevisText(buffer.toString("utf-8"));
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text ?? "";
}
