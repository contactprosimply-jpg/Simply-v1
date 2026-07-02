import type { DevisTypeFichier } from "@/lib/database.types";
import { DevisAnalyserError } from "@/lib/devis/types";
import type { GrilleDevis } from "@/lib/devis/types";
import * as XLSX from "xlsx";

const PDF_MIN_TEXT_CHARS = 80;
const PDF_MIN_ALPHA_RATIO = 0.02;

function cellToText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).replace(/\s+/g, " ").trim();
}

export function extractExcelGrille(buffer: Buffer): GrilleDevis {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const grille: GrilleDevis = [];

  for (const sheetName of workbook.SheetNames) {
    grille.push([`### FEUILLE: ${sheetName}`]);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet?.["!ref"]) continue;

    const range = XLSX.utils.decode_range(sheet["!ref"]);
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cells: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: col });
        cells.push(cellToText(sheet[addr]?.v));
      }
      grille.push(cells);
    }
  }

  return grille;
}

export function extractCsvGrille(buffer: Buffer): GrilleDevis {
  const text = buffer.toString("utf-8");
  const delimiter = text.includes(";") && !text.includes("\t") ? ";" : ",";

  return text
    .split(/\r?\n/)
    .map((line) =>
      line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, "")),
    )
    .filter((row) => row.some((c) => c.length > 0));
}

async function extractPdfPlainText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text ?? "";
}

function isLikelyScannedPdf(text: string): boolean {
  const compact = text.replace(/\s/g, "");
  if (compact.length < PDF_MIN_TEXT_CHARS) return true;
  const alpha = (compact.match(/[a-zàâäéèêëïîôùûüç]/gi) ?? []).length;
  return alpha / compact.length < PDF_MIN_ALPHA_RATIO;
}

/** PDF → grille best-effort (souvent imparfaite). */
export function pdfTextToGrille(text: string): GrilleDevis {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, " ").trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  return lines.map((line) => {
    if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
    const cols = line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
    return cols.length > 1 ? cols : [line];
  });
}

export async function extractGrilleFromBuffer(
  buffer: Buffer,
  type: DevisTypeFichier,
): Promise<{ grille: GrilleDevis; pdfImperfect: boolean }> {
  switch (type) {
    case "xlsx":
      return { grille: extractExcelGrille(buffer), pdfImperfect: false };
    case "csv":
      return { grille: extractCsvGrille(buffer), pdfImperfect: false };
    case "pdf": {
      const text = await extractPdfPlainText(buffer);
      if (isLikelyScannedPdf(text)) {
        throw new DevisAnalyserError(
          "PDF scanné non supporté pour le moment.",
          422,
          "PDF_SCANNED",
        );
      }
      const grille = pdfTextToGrille(text);
      const pdfImperfect = grille.length > 0 && grille[0]!.length <= 2;
      return { grille, pdfImperfect };
    }
    default:
      throw new DevisAnalyserError("Type de fichier non supporté.", 400, "INVALID_TYPE");
  }
}
