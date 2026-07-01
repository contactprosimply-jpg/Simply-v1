import { extractAmounts, parseFrenchNumber } from "@/lib/devis-parser/numbers";
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
]);

const SKIP_LINE =
  /^(page\s+\d|devis\s*n|n°\s*devis|date\s|client\s|adresse|siret|tél|tel|fax|email|www\.|@|rcs|tva\s*intracom|iban|bic)/i;

const TOTAL_LINE =
  /(net\s*à\s*payer|total\s*ttc|total\s*ht|montant\s*total|total\s*général|total\s*general|sous[-\s]?total|acompte|remise\s*globale)/i;

const POSITION_RE = /^(\d+(?:\.\d+)+)\s+(.+)$/;

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

function parsePosteLine(line: string, lot: string | null, ordre: number): ParsedPoste | null {
  if (SKIP_LINE.test(line) || TOTAL_LINE.test(line)) return null;

  const posMatch = line.match(POSITION_RE);
  const body = posMatch ? posMatch[2] : line;
  const numeroPosition = posMatch?.[1] ?? null;

  const amounts = extractAmounts(body);
  if (amounts.length === 0) return null;

  if (amounts.length === 1 && amounts[0]! > 500_000 && body.length < 40) return null;

  const prixTotal = amounts[amounts.length - 1]!;
  let prixUnitaire: number | null = amounts.length >= 2 ? amounts[amounts.length - 2]! : null;
  let quantite: number | null = amounts.length >= 3 ? amounts[amounts.length - 3]! : null;

  let designation = body
    .replace(/\d{1,3}(?:\s\d{3})*,\d{2}|\d+,\d{2}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let unite: string | null = null;
  const tokens = designation.split(" ");
  if (tokens.length > 1) {
    const last = tokens[tokens.length - 1]!;
    const unit = parseUnitToken(last);
    if (unit) {
      unite = unit;
      designation = tokens.slice(0, -1).join(" ").trim();
    }
  }

  if (designation.length < 3) return null;
  if (/^(total|tva|remise)/i.test(designation)) return null;

  if (quantite !== null && quantite > 10_000 && prixUnitaire !== null && prixUnitaire < 100) {
    [quantite, prixUnitaire] = [prixUnitaire, quantite];
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

function extractFinalPrice(lines: string[]): { value: number | null; label: string | null } {
  const candidates: { value: number; label: string; score: number }[] = [];

  for (const line of lines) {
    if (!TOTAL_LINE.test(line)) continue;
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
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, " ").trim())
    .filter(Boolean);

  let currentLot: string | null = null;
  const postes: ParsedPoste[] = [];
  let ordre = 0;

  for (const line of lines) {
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
    const key = `${p.numeroPosition ?? ""}|${p.designation}|${p.prixTotal}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

    const lot = isLotHeader(line);
    if (lot) {
      currentLot = lot;
      continue;
    }

    const designationIdx = cells.findIndex((c) => c.length > 5 && !/^\d+([.,]\d+)?$/.test(c));
    const nums = cells.map(parseFrenchNumber).filter((n): n is number => n !== null);

    if (designationIdx >= 0 && nums.length >= 1) {
      const designation = cells[designationIdx]!;
      if (TOTAL_LINE.test(designation) || SKIP_LINE.test(designation)) continue;
      const prixTotal = nums[nums.length - 1]!;
      const prixUnitaire = nums.length >= 2 ? nums[nums.length - 2]! : null;
      const quantite = nums.length >= 3 ? nums[nums.length - 3]! : null;
      postes.push({
        numeroPosition: cells[0]?.match(/^\d+(?:\.\d+)+$/) ? cells[0]! : null,
        lot: currentLot,
        designation,
        unite: null,
        quantite,
        prixUnitaire,
        prixTotal,
        ordre: ordre++,
      });
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
