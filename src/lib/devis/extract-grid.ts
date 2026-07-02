import type { DevisTypeFichier } from "@/lib/database.types";
import { sanitizeGrille } from "@/lib/devis/filters";
import { DevisAnalyserError } from "@/lib/devis/types";
import type { GrilleDevis } from "@/lib/devis/types";
import {
  buildSpatialPosteHints,
  extractPdfTableRowsFromItems,
  extractPdfTextItems,
  type SpatialPosteHint,
} from "@/lib/devis-parser/extract-pdf-layout";
import { buildPdfExtractionDiagnostic, type PdfExtractionDiagnostic } from "@/lib/devis-parser/extraction-diagnostic";
import * as XLSX from "xlsx";

const PDF_MIN_TEXT_CHARS = 80;
const PDF_MIN_ALPHA_RATIO = 0.02;

function cellToText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).replace(/\s+/g, " ").trim();
}

function averageColumnCount(grille: GrilleDevis): number {
  const rows = grille.filter((r) => r.some((c) => c.trim()) && !r[0]?.startsWith("###"));
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, r) => acc + r.filter((c) => c.trim()).length, 0);
  return sum / rows.length;
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

/** Fallback pdf-parse : une cellule par ligne (souvent mauvais). */
function pdfTextToGrille(text: string): GrilleDevis {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, " ").trim())
    .filter(Boolean)
    .map((line) => [line]);
}

export async function extractGrilleFromBuffer(
  buffer: Buffer,
  type: DevisTypeFichier,
): Promise<{
  grille: GrilleDevis;
  pdfImperfect: boolean;
  pdfPlainText?: string;
  spatialHints?: SpatialPosteHint[];
  extractionDiagnostic?: PdfExtractionDiagnostic;
}> {
  switch (type) {
    case "xlsx":
      return { grille: sanitizeGrille(extractExcelGrille(buffer)), pdfImperfect: false };
    case "csv":
      return { grille: sanitizeGrille(extractCsvGrille(buffer)), pdfImperfect: false };
    case "pdf": {
      const text = await extractPdfPlainText(buffer);
      if (isLikelyScannedPdf(text)) {
        throw new DevisAnalyserError(
          "PDF scanné non supporté pour le moment.",
          422,
          "PDF_SCANNED",
        );
      }

      let grille: GrilleDevis = [];
      let spatialHints: SpatialPosteHint[] = [];
      let extractionDiagnostic: PdfExtractionDiagnostic | undefined;

      try {
        const textItems = await extractPdfTextItems(buffer);
        spatialHints = buildSpatialPosteHints(textItems);
        grille = extractPdfTableRowsFromItems(textItems);
        extractionDiagnostic = buildPdfExtractionDiagnostic(textItems, spatialHints);
      } catch {
        grille = [];
        spatialHints = [];
      }

      const avgCols = averageColumnCount(grille);

      if (grille.length === 0 || avgCols < 2.5) {
        grille = pdfTextToGrille(text);
      }

      // PDF devis BTP : toujours texte pdf-parse en priorité (layout pdfjs souvent trompeur)
      return {
        grille: sanitizeGrille(grille),
        pdfImperfect: true,
        pdfPlainText: text,
        spatialHints,
        extractionDiagnostic,
      };
    }
    default:
      throw new DevisAnalyserError("Type de fichier non supporté.", 400, "INVALID_TYPE");
  }
}
