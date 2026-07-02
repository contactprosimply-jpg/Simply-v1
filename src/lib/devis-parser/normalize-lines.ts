import { extractAmounts } from "@/lib/devis-parser/numbers";

/** N° de position seul sur une ligne (extraction PDF verticale). */
const POSITION_ONLY_RE = /^(\d+\.\d+(?:\.\d+)*)$/;

/** N° de position en début de ligne. */
export const POSITION_START_RE = /^(\d+(?:\.\d+)*)\s+(.+)$/;

const UNIT_ONLY_RE = /^(u|ens|ff|forfait|m²|m2|ml|kg|t|h|j|unité|unite|pce|pc)$/i;

const PAGE_BREAK_RE = /^(page\s+\d|\d{1,3}\s+sur\s+\d{1,3})/i;

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

    const amountsOnLine = extractAmounts(line).length;
    const isPositionStart = POSITION_START_RE.test(line);
    const isPositionOnly = POSITION_ONLY_RE.test(line);

    if ((isPositionStart || isPositionOnly) && block.length > 0) {
      flush();
    }

    if (amountsOnLine >= 2 && block.length === 0) {
      result.push(line);
      continue;
    }

    if (amountsOnLine >= 2 && block.length > 0) {
      block.push(line);
      flush();
      continue;
    }

    block.push(line);
    const joinedAmounts = extractAmounts(block.join(" ")).length;
    if (joinedAmounts >= 2) {
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
    if (PAGE_BREAK_RE.test(line)) {
      flushPending();
      continue;
    }

    const amounts = extractAmounts(line);

    if (amounts.length >= 2 && !pending) {
      merged.push(line);
      continue;
    }

    if (amounts.length >= 2 && pending) {
      pending = `${pending} ${line}`;
      merged.push(pending);
      pending = null;
      continue;
    }

    pending = pending ? `${pending} ${line}` : line;
    const pendingAmounts = extractAmounts(pending);
    if (pendingAmounts.length >= 2) {
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

/** Découpe une ligne en colonnes (2+ espaces ou tabulations). */
export function splitTableColumns(line: string): string[] {
  return line
    .split(/\s{2,}/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export function isPositionOnlyLine(line: string): boolean {
  return POSITION_ONLY_RE.test(line.trim());
}

export function isUnitOnlyLine(line: string): boolean {
  return UNIT_ONLY_RE.test(line.trim());
}
