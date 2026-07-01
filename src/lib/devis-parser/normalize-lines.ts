import { extractAmounts } from "@/lib/devis-parser/numbers";

/** N° de position seul sur une ligne (extraction PDF verticale). */
const POSITION_ONLY_RE = /^(\d+\.\d+(?:\.\d+)*)$/;

/** N° de position en début de ligne. */
export const POSITION_START_RE = /^(\d+(?:\.\d+)*)\s+(.+)$/;

const UNIT_ONLY_RE = /^(u|ens|ff|forfait|m²|m2|ml|kg|t|h|j|unité|unite|pce|pc)$/i;

/**
 * Regroupe les lignes extraites verticalement par pdf-parse
 * (n°, libellé, qté, unité, PU, total sur des lignes séparées).
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
    const isPositionStart = POSITION_START_RE.test(line);
    const isPositionOnly = POSITION_ONLY_RE.test(line);

    if (isPositionStart || isPositionOnly) {
      flush();
      block.push(line);
      if (isPositionStart && extractAmounts(line).length >= 2) {
        flush();
      }
      continue;
    }

    if (block.length > 0) {
      block.push(line);
      const joined = block.join(" ");
      const amounts = extractAmounts(joined);
      if (amounts.length >= 2) {
        flush();
      } else if (block.length >= 8) {
        flush();
      }
      continue;
    }

    result.push(line);
  }

  flush();
  return result;
}

/** Fusionne libellé multi-lignes sans n° en tête. */
function mergeContinuationLines(lines: string[]): string[] {
  const merged: string[] = [];
  let pending: string | null = null;

  for (const line of lines) {
    const startsPosition = POSITION_START_RE.test(line) || POSITION_ONLY_RE.test(line);

    if (startsPosition) {
      if (pending) merged.push(pending);
      pending = line;
      if (extractAmounts(line).length >= 2) {
        merged.push(pending);
        pending = null;
      }
      continue;
    }

    if (pending) {
      pending = `${pending} ${line}`;
      const amounts = extractAmounts(pending);
      if (amounts.length >= 2 || pending.length > 100) {
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
