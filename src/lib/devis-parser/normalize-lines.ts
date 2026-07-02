import { extractAmounts } from "@/lib/devis-parser/numbers";
import { isTableHeaderLine } from "@/lib/devis-parser/table-headers";

/** N° de position seul sur une ligne (extraction PDF verticale). */
const POSITION_ONLY_RE = /^(\d+\.\d+(?:\.\d+)*)$/;

/** N° de position en début de ligne. */
export const POSITION_START_RE = /^(\d+(?:\.\d+)*)\s+(.+)$/;

const PAGE_BREAK_RE = /^(page\s+\d|\d{1,3}\s+sur\s+\d{1,3})/i;

const AMOUNT_RE = /\d{1,3}(?:\s\d{3})*[,.]\d{2}|\d+[,.]\d{2}/g;

function textWithoutAmounts(line: string): string {
  return line.replace(AMOUNT_RE, " ").replace(/\s+/g, " ").trim();
}

function amountCount(line: string): number {
  return extractAmounts(line).length;
}

function isSpacingNoiseLine(line: string): boolean {
  const t = line.trim();
  if (isTableHeaderLine(t)) return true;
  if (PAGE_BREAK_RE.test(t)) return true;
  if (/^[uU]$/.test(t)) return true;
  const without = textWithoutAmounts(t);
  if (without.length > 0) return false;
  const amts = extractAmounts(t);
  if (amts.length === 0) return true;
  return amts.every((a) => a === 0 || a === 1);
}

/**
 * Regroupe les lignes extraites verticalement par pdf-parse
 * (libellé, qté, unité, PU, total sur des lignes séparées — avec ou sans n°).
 */
export function normalizePdfLines(rawLines: string[]): string[] {
  const lines = rawLines
    .map((l) => l.replace(/\t/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const grouped = groupVerticalBlocks(lines);
  return mergeContinuationLines(grouped);
}

function attachOrphanAmounts(result: string[], line: string): boolean {
  for (let i = result.length - 1; i >= 0; i--) {
    const prev = result[i]!;
    if (amountCount(prev) >= 2) break;
    if (textWithoutAmounts(prev).length >= 3) {
      result[i] = `${prev} ${line}`;
      return true;
    }
  }
  return false;
}

function groupVerticalBlocks(lines: string[]): string[] {
  const result: string[] = [];
  let block: string[] = [];

  const flush = () => {
    if (block.length === 0) return;
    result.push(block.join(" "));
    block = [];
  };

  for (const line of lines) {
    if (PAGE_BREAK_RE.test(line)) {
      flush();
      continue;
    }

    if (isTableHeaderLine(line)) {
      flush();
      continue;
    }

    if (isSpacingNoiseLine(line) && block.length === 0) {
      continue;
    }

    const amountsOnLine = amountCount(line);
    const isPositionStart = POSITION_START_RE.test(line);
    const isPositionOnly = POSITION_ONLY_RE.test(line);

    if ((isPositionStart || isPositionOnly) && block.length > 0) {
      flush();
    }

    if (amountsOnLine >= 2 && block.length === 0) {
      if (textWithoutAmounts(line).length >= 4) {
        result.push(line);
        continue;
      }
      if (attachOrphanAmounts(result, line)) continue;
    }

    if (amountsOnLine >= 2 && block.length > 0) {
      block.push(line);
      flush();
      continue;
    }

    block.push(line);
    if (amountCount(block.join(" ")) >= 2) {
      flush();
    } else if (block.length >= 10) {
      flush();
    }
  }

  flush();
  return result;
}

/** Fusionne libellé multi-lignes jusqu'à obtenir 2 montants. */
function mergeContinuationLines(lines: string[]): string[] {
  const merged: string[] = [];
  let pending: string | null = null;

  const flushPending = () => {
    if (pending) {
      merged.push(pending);
      pending = null;
    }
  };

  for (const line of lines) {
    if (PAGE_BREAK_RE.test(line) || isTableHeaderLine(line)) {
      flushPending();
      continue;
    }

    if (isSpacingNoiseLine(line) && !pending) {
      continue;
    }

    const amounts = amountCount(line);

    if (amounts >= 2 && !pending) {
      resultPushComplete(merged, line);
      continue;
    }

    if (amounts >= 2 && pending) {
      pending = `${pending} ${line}`;
      merged.push(pending);
      pending = null;
      continue;
    }

    pending = pending ? `${pending} ${line}` : line;
    if (amountCount(pending) >= 2) {
      merged.push(pending);
      pending = null;
    } else if (pending.length > 120) {
      merged.push(pending);
      pending = null;
    }
  }

  flushPending();
  return merged;
}

function resultPushComplete(merged: string[], line: string): void {
  if (textWithoutAmounts(line).length >= 4) {
    merged.push(line);
    return;
  }
  if (attachOrphanAmounts(merged, line)) return;
  merged.push(line);
}

/** Découpe une ligne en colonnes (2+ espaces ou tabulations). */
export function splitTableColumns(line: string): string[] {
  return line
    .split(/\s{2,}/)
    .map((c) => c.trim())
    .filter(Boolean);
}

const UNIT_ONLY_RE = /^(u|ens|ff|forfait|m²|m2|ml|kg|t|h|j|unité|unite|pce|pc)$/i;

export function isPositionOnlyLine(line: string): boolean {
  return POSITION_ONLY_RE.test(line.trim());
}

export function isUnitOnlyLine(line: string): boolean {
  return UNIT_ONLY_RE.test(line.trim());
}
