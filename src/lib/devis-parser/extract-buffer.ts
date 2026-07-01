import type { DevisTypeFichier } from "@/lib/database.types";
import { parseDevisTable, parseDevisText } from "@/lib/devis-parser/parse-text";
import type { ParsedDevis } from "@/lib/devis-parser/types";
import * as XLSX from "xlsx";

export async function parseDevisBuffer(
  buffer: Buffer,
  type: DevisTypeFichier | string | null,
): Promise<ParsedDevis> {
  const kind = (type ?? "pdf").toLowerCase();

  if (kind === "pdf") {
    const text = await extractPdfText(buffer);
    return parseDevisText(text);
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
  const pdfParse = (await import("pdf-parse")).default as (
    data: Buffer,
  ) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text ?? "";
}
