import type { DevisTypeFichier } from "@/lib/database.types";
import { DevisAnalyserError } from "@/lib/devis-analyse/types";
import * as XLSX from "xlsx";

const PDF_MIN_TEXT_CHARS = 80;
const PDF_MIN_ALPHA_RATIO = 0.02;

function cellToText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).replace(/\s+/g, " ").trim();
}

/** Excel : toutes les feuilles en grille tabulée (ordre lignes/colonnes conservé). */
export function extractExcelGridText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sections: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    sections.push(`### FEUILLE: ${sheetName}`);

    const ref = sheet["!ref"];
    if (!ref) {
      sections.push("(vide)");
      continue;
    }

    const range = XLSX.utils.decode_range(ref);
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cells: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[addr];
        cells.push(cellToText(cell?.v));
      }
      sections.push(cells.join("\t"));
    }
  }

  return sections.join("\n");
}

/** CSV : lignes × colonnes séparées par tabulations. */
export function extractCsvGridText(buffer: Buffer): string {
  const text = buffer.toString("utf-8");
  const delimiter = text.includes(";") && !text.includes("\t") ? ";" : ",";

  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .split(delimiter)
        .map((c) => c.trim().replace(/^"|"$/g, ""))
        .join("\t"),
    )
    .join("\n");
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return (result.text ?? "").replace(/\s+/g, " ").trim();
}

function isLikelyScannedPdf(text: string): boolean {
  const compact = text.replace(/\s/g, "");
  if (compact.length < PDF_MIN_TEXT_CHARS) return true;
  const alpha = (compact.match(/[a-zàâäéèêëïîôùûüç]/gi) ?? []).length;
  return alpha / compact.length < PDF_MIN_ALPHA_RATIO;
}

export async function extractDevisRawContent(
  buffer: Buffer,
  type: DevisTypeFichier,
): Promise<string> {
  switch (type) {
    case "xlsx":
      return extractExcelGridText(buffer);
    case "csv":
      return extractCsvGridText(buffer);
    case "pdf": {
      const text = await extractPdfText(buffer);
      if (isLikelyScannedPdf(text)) {
        throw new DevisAnalyserError(
          "PDF scanné non supporté pour le moment.",
          422,
          "PDF_SCANNED",
        );
      }
      return text;
    }
    default:
      throw new DevisAnalyserError("Type de fichier non supporté.", 400, "INVALID_TYPE");
  }
}

/** Limite le texte envoyé au modèle (contexte). */
export function truncateForModel(text: string, maxChars = 90_000): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[… contenu tronqué après ${maxChars} caractères …]`;
}
