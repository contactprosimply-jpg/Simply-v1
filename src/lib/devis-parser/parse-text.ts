import { detectCorpsMetier } from "@/lib/devis-parser/corps-metier";
import { isJunkLine, isPlausiblePoste } from "@/lib/devis-parser/filters";
import {
  normalizePdfLines,
  POSITION_START_RE,
  splitTableColumns,
} from "@/lib/devis-parser/normalize-lines";
import { extractAmounts, parseFrenchNumber, parseIntegerToken } from "@/lib/devis-parser/numbers";
import {
  isPageMarkerLine,
  isTableHeaderLine,
  isValidPosteNumber,
} from "@/lib/devis-parser/table-headers";
import type { ParsedDevis, ParsedPoste } from "@/lib/devis-parser/types";

const UNITS = new Set([
  "u",
  "ens",
  "ff",
  "forfait",
  "m²",
  "m2",
  "ml",
  "kg",
  "t",
  "h",
  "j",
  "jour",
  "jours",
  "unité",
  "unite",
  "pce",
  "pc",
]);

const SKIP_LINE =
  /^(page\s+\d|devis\s*n|n°\s*devis|date\s|client\s|adresse|siret|tél|tel|fax|email|www\.|@)/i;

const TOTAL_LINE =
  /(net\s*à\s*payer|total\s*ttc|total\s*ht|montant\s*total|total\s*général|total\s*general|sous[-\s]?total|acompte|remise\s*globale)/i;

const HEADER_LINE =
  /^(d[eé]signation|libell[eé]|poste|n°|numero|r[eé]f|qt[eé]|quantit[eé]|unit[eé]|p\.?u\.?|prix\s*unitaire|montant|total)\b/i;

/** Position : 1, 1.1, 1.1.2, 01.001… */
const POSITION_RE = POSITION_START_RE;

function hasAmount(line: string): boolean {
  return extractAmounts(line).length > 0;
}

function isLotHeader(line: string): string | null {
  const m = line.match(/^(?:LOT|Lot)\s*[:\-\s]?\s*(.+)$/i);
  if (!m) return null;
  if (hasAmount(line) && extractAmounts(line).length >= 2) return null;
  return m[1].trim() || line;
}

function parseUnitToken(token: string): string | null {
  const t = token.trim().toLowerCase().replace("²", "2");
  if (UNITS.has(t)) return token.trim();
  if (t === "m2") return "m²";
  return null;
}

function stripAmountsFromDesignation(body: string): string {
  return body
    .replace(/\d{1,3}(?:\s\d{3})*[,.]\d{2}|\d+[,.]\d{2}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractUnitFromTail(designation: string): { designation: string; unite: string | null } {
  let unite: string | null = null;
  const tokens = designation.split(" ");
  if (tokens.length > 1) {
    const last = tokens[tokens.length - 1]!;
    const unit = parseUnitToken(last);
    if (unit) {
      unite = unit;
      return { designation: tokens.slice(0, -1).join(" ").trim(), unite };
    }
  }
  return { designation, unite };
}

function assignAmountColumns(amounts: number[]): {
  quantite: number | null;
  prixUnitaire: number | null;
  prixTotal: number;
} | null {
  if (amounts.length === 0) return null;

  let prixTotal = amounts[amounts.length - 1]!;
  let prixUnitaire: number | null = amounts.length >= 2 ? amounts[amounts.length - 2]! : null;
  let quantite: number | null = amounts.length >= 3 ? amounts[amounts.length - 3]! : null;

  if (amounts.length === 2) {
    const [a, b] = amounts;
    if (a <= 9999 && b > a && (Number.isInteger(a) || a < 100)) {
      quantite = a;
      prixTotal = b;
      prixUnitaire = b / a;
    } else {
      prixUnitaire = a;
      prixTotal = b;
    }
  }

  if (quantite !== null && quantite > 10_000 && prixUnitaire !== null && prixUnitaire < 100) {
    [quantite, prixUnitaire] = [prixUnitaire, quantite];
  }

  return { quantite, prixUnitaire, prixTotal };
}

function buildPosteFromParts(
  line: string,
  lot: string | null,
  ordre: number,
  numeroPosition: string | null,
  designation: string,
  unite: string | null,
  quantite: number | null,
  prixUnitaire: number | null,
  prixTotal: number,
): ParsedPoste | null {
  if (!isPlausiblePoste(line, designation, numeroPosition, quantite, prixUnitaire, prixTotal)) {
    return null;
  }
  return {
    numeroPosition,
    lot,
    designation,
    unite,
    quantite,
    prixUnitaire,
    prixTotal,
    ordre,
  };
}

/** Colonnes séparées par 2+ espaces (tableau PDF). */
function tryParseColumnRow(line: string, lot: string | null, ordre: number): ParsedPoste | null {
  const cols = splitTableColumns(line);
  if (cols.length < 3) return null;

  let numeroPosition: string | null = null;
  let i = 0;
  if (/^\d+(?:\.\d+)*$/.test(cols[0]!)) {
    numeroPosition = cols[0]!;
    i = 1;
  }

  const tail = cols.slice(i);
  const amounts: number[] = [];
  const textCols: string[] = [];
  let unite: string | null = null;
  let quantite: number | null = null;

  for (const col of tail) {
    const amt = parseFrenchNumber(col);
    if (amt != null && /[,.]\d{2}/.test(col)) {
      amounts.push(amt);
      continue;
    }
    const asInt = parseIntegerToken(col);
    if (asInt != null && quantite == null) {
      quantite = asInt;
      continue;
    }
    const unit = parseUnitToken(col);
    if (unit) {
      unite = unit;
      continue;
    }
    textCols.push(col);
  }

  if (amounts.length < 2 || textCols.length === 0) return null;

  const cols2 = assignAmountColumns(amounts);
  if (!cols2) return null;

  let { prixUnitaire, prixTotal } = cols2;
  if (quantite == null) quantite = cols2.quantite;

  const designation = textCols.join(" ").trim();
  if (designation.length < 3) return null;

  return buildPosteFromParts(
    line,
    lot,
    ordre,
    numeroPosition,
    designation,
    unite,
    quantite,
    prixUnitaire,
    prixTotal,
  );
}

/** Ligne tabulaire : n° + libellé + qté + unité + PU + total */
function tryParseStructuredRow(
  line: string,
  lot: string | null,
  ordre: number,
): ParsedPoste | null {
  const posMatch = line.match(POSITION_RE);
  if (!posMatch) return null;

  const numeroPosition = posMatch[1]!;
  const rest = posMatch[2]!;
  if (extractAmounts(rest).length < 2) return null;

  return finalizePosteLine(line, lot, ordre, numeroPosition, rest);
}

function parsePosteLine(line: string, lot: string | null, ordre: number): ParsedPoste | null {
  if (
    isJunkLine(line) ||
    SKIP_LINE.test(line) ||
    TOTAL_LINE.test(line) ||
    HEADER_LINE.test(line) ||
    isTableHeaderLine(line) ||
    isPageMarkerLine(line)
  ) {
    return null;
  }

  const columnRow = tryParseColumnRow(line, lot, ordre);
  if (columnRow) return columnRow;

  const structured = tryParseStructuredRow(line, lot, ordre);
  if (structured) return structured;

  const amountTail = tryParseAmountTailLine(line, lot, ordre);
  if (amountTail) return amountTail;

  const posMatch = line.match(POSITION_RE);
  const body = posMatch ? posMatch[2]! : line;
  const numeroPosition = posMatch?.[1] ?? null;

  return finalizePosteLine(line, lot, ordre, numeroPosition, body);
}

/** Désignation + montants en queue de ligne (format PDF variable). */
function tryParseAmountTailLine(
  line: string,
  lot: string | null,
  ordre: number,
): ParsedPoste | null {
  const amountMatches = [...line.matchAll(/\d{1,3}(?:\s\d{3})*[,.]\d{2}|\d+[,.]\d{2}/g)];
  if (amountMatches.length < 2) return null;

  const firstIdx = amountMatches[0]!.index ?? 0;
  let head = line.slice(0, firstIdx).trim();
  if (head.length < 4) return null;

  let numeroPosition: string | null = null;
  const posHead = head.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
  if (posHead) {
    numeroPosition = posHead[1]!;
    head = posHead[2]!.trim();
  }

  if (head.length < 4) return null;

  return finalizePosteLine(line, lot, ordre, numeroPosition, `${head} ${line.slice(firstIdx)}`);
}

function finalizePosteLine(
  line: string,
  lot: string | null,
  ordre: number,
  numeroPosition: string | null,
  body: string,
): ParsedPoste | null {
  const amounts = extractAmounts(body);
  if (amounts.length === 0) return null;
  if (amounts.length === 1 && amounts[0]! > 500_000 && body.length < 40) return null;

  const cols = assignAmountColumns(amounts);
  if (!cols) return null;

  let { quantite, prixUnitaire, prixTotal } = cols;

  let designation = stripAmountsFromDesignation(body);
  const { designation: des2, unite } = extractUnitFromTail(designation);
  designation = des2;

  if (quantite != null && Number.isInteger(quantite)) {
    const qtyTail = new RegExp(`\\b${quantite}\\s*$`);
    if (qtyTail.test(designation)) {
      designation = designation.replace(qtyTail, "").trim();
    }
  }

  if (designation.length < 3) return null;
  if (/^(total|tva|remise)/i.test(designation)) return null;

  if (quantite == null && unite?.toLowerCase() === "u" && prixUnitaire != null && prixTotal != null) {
    const ratio = prixTotal / prixUnitaire;
    if (ratio >= 1 && ratio <= 9999 && Math.abs(ratio - Math.round(ratio)) < 0.01) {
      quantite = Math.round(ratio);
    }
  }

  return buildPosteFromParts(
    line,
    lot,
    ordre,
    numeroPosition,
    designation,
    unite,
    quantite,
    prixUnitaire,
    prixTotal,
  );
}

function extractFinalPrice(lines: string[]): { value: number | null; label: string | null } {
  const candidates: { value: number; label: string; score: number }[] = [];

  for (const line of lines) {
    if (!TOTAL_LINE.test(line) || isJunkLine(line)) continue;
    const amounts = extractAmounts(line);
    if (amounts.length === 0) continue;
    const value = amounts[amounts.length - 1]!;
    let score = 0;
    const lower = line.toLowerCase();
    if (lower.includes("net") && lower.includes("payer")) score += 100;
    if (lower.includes("ttc")) score += 80;
    if (lower.includes("total") && lower.includes("général")) score += 70;
    if (lower.includes("total") && lower.includes("general")) score += 70;
    if (lower.includes("montant total")) score += 60;
    if (lower.includes("total ht")) score += 50;
    candidates.push({ value, label: line.slice(0, 80), score });
  }

  if (candidates.length === 0) {
    const tail = lines.slice(-40);
    for (const line of tail) {
      if (isJunkLine(line)) continue;
      const amounts = extractAmounts(line);
      if (amounts.length === 1 && amounts[0]! > 1000) {
        candidates.push({ value: amounts[0]!, label: line.slice(0, 80), score: 10 });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.value - a.value);
  const best = candidates[0];
  return best ? { value: best.value, label: best.label } : { value: null, label: null };
}

export function parseDevisText(text: string): ParsedDevis {
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lines = normalizePdfLines(rawLines);

  let result = extractPostesFromLines(lines);
  if (result.postes.length === 0) {
    result = extractPostesFromLines(mergeMultilinePostes(rawLines.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean)));
  }

  return result;
}

function extractPostesFromLines(lines: string[]): ParsedDevis {
  let currentLot: string | null = null;
  const postes: ParsedPoste[] = [];
  let ordre = 0;

  for (const line of lines) {
    if (isJunkLine(line) || HEADER_LINE.test(line)) continue;

    const lot = isLotHeader(line);
    if (lot) {
      currentLot = lot;
      continue;
    }

    const poste = parsePosteLine(line, currentLot, ordre);
    if (poste) {
      postes.push(poste);
      ordre += 1;
    }
  }

  const { value: prixFinal, label: prixFinalLabel } = extractFinalPrice(lines);
  const deduped = dedupePostes(postes);

  return {
    prixFinal,
    prixFinalLabel,
    postes: deduped,
  };
}

function dedupePostes(postes: ParsedPoste[]): ParsedPoste[] {
  const seen = new Set<string>();
  return postes.filter((p) => {
    if (isJunkLine(p.designation)) return false;
    const key = `${p.numeroPosition ?? ""}|${p.designation}|${p.prixTotal}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Fusionne désignation multi-lignes + montants sur la ligne suivante (PDF courant). */
function mergeMultilinePostes(lines: string[]): string[] {
  const merged: string[] = [];
  let pending: string | null = null;

  for (const line of lines) {
    if (isJunkLine(line)) {
      if (pending) {
        merged.push(pending);
        pending = null;
      }
      continue;
    }

    const startsPosition = POSITION_RE.test(line) || /^(\d+\.\d+(?:\.\d+)+)$/.test(line);

    if (startsPosition) {
      if (pending) merged.push(pending);
      pending = line;
      if (hasAmount(line) && extractAmounts(line).length >= 2) {
        merged.push(pending);
        pending = null;
      }
      continue;
    }

    if (pending) {
      if (isJunkLine(line) || TOTAL_LINE.test(line) || HEADER_LINE.test(line)) {
        merged.push(pending);
        pending = null;
        continue;
      }
      pending = `${pending} ${line}`;
      const amounts = extractAmounts(pending);
      if (amounts.length >= 2 || (amounts.length >= 1 && pending.length > 80)) {
        merged.push(pending);
        pending = null;
      }
      continue;
    }

    merged.push(line);
  }

  if (pending) merged.push(pending);
  return merged;
}

/** Parse une ligne tableau déjà découpée en cellules (pdfjs). */
function parseLayoutRow(
  cells: string[],
  lot: string | null,
  ordre: number,
): ParsedPoste | null {
  if (cells.length < 3) return null;

  const line = cells.join(" ");
  if (
    isJunkLine(line) ||
    isTableHeaderLine(line) ||
    isPageMarkerLine(line) ||
    TOTAL_LINE.test(line)
  ) {
    return null;
  }

  let start = 0;
  let numeroPosition: string | null = null;
  const first = cells[0]!;
  if (/^\d+(?:\.\d+)*$/.test(first) && isValidPosteNumber(first, cells[1])) {
    numeroPosition = first;
    start = 1;
  }

  const tail = cells.slice(start);
  const amountCells: { idx: number; val: number }[] = [];

  for (let j = tail.length - 1; j >= 0; j--) {
    const col = tail[j]!;
    if (!/[,.]\d{2}/.test(col)) continue;
    const val = parseFrenchNumber(col);
    if (val == null) continue;
    amountCells.unshift({ idx: j, val });
    if (amountCells.length >= 2) break;
  }

  if (amountCells.length < 2) return null;

  const prixTotal = amountCells[amountCells.length - 1]!.val;
  const prixUnitaire = amountCells[amountCells.length - 2]!.val;
  const amountIdxSet = new Set(amountCells.map((a) => a.idx));

  let quantite: number | null = null;
  let unite: string | null = null;
  const textParts: string[] = [];

  for (let j = 0; j < tail.length; j++) {
    if (amountIdxSet.has(j)) continue;
    const col = tail[j]!;
    const unit = parseUnitToken(col);
    if (unit) {
      unite = unit;
      continue;
    }
    const qi = parseIntegerToken(col);
    if (qi != null && quantite == null) {
      quantite = qi;
      continue;
    }
    if (col.length >= 2) textParts.push(col);
  }

  const designation = textParts.join(" ").trim();
  if (designation.length < 3) return null;

  if (quantite == null && unite?.toLowerCase() === "u" && prixUnitaire > 0 && prixTotal > 0) {
    const ratio = prixTotal / prixUnitaire;
    if (ratio >= 1 && ratio <= 9999 && Math.abs(ratio - Math.round(ratio)) < 0.02) {
      quantite = Math.round(ratio);
    }
  }

  return buildPosteFromParts(
    line,
    lot,
    ordre,
    numeroPosition,
    designation,
    unite,
    quantite,
    prixUnitaire,
    prixTotal,
  );
}

/** Parse CSV / feuille tabulaire (colonnes libellé, qté, PU, total). */
export function parseDevisTable(rows: string[][]): ParsedDevis {
  const postes: ParsedPoste[] = [];
  let ordre = 0;
  let currentLot: string | null = null;

  for (const row of rows) {
    const cells = row.map((c) => String(c ?? "").trim()).filter(Boolean);
    if (cells.length === 0) continue;
    const line = cells.join(" ");

    if (isJunkLine(line)) continue;

    const lot = isLotHeader(line);
    if (lot) {
      currentLot = lot;
      continue;
    }

    const layoutPoste = parseLayoutRow(cells, currentLot, ordre);
    if (layoutPoste) {
      postes.push(layoutPoste);
      ordre += 1;
      continue;
    }

    const poste = parsePosteLine(line, currentLot, ordre);
    if (poste) {
      postes.push(poste);
      ordre += 1;
    }
  }

  const textLines = rows.map((r) => r.join(" "));
  const { value: prixFinal, label: prixFinalLabel } = extractFinalPrice(textLines);

  return {
    prixFinal,
    prixFinalLabel,
    postes: dedupePostes(postes),
  };
}

// Réexport utile pour tests / debug
export { detectCorpsMetier, isJunkLine };
