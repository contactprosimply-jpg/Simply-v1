/** Lignes administratives / pied de page à ne jamais transformer en tâches. */
import {
  hasPositivePrice,
  isPageMarkerLine,
  isTableHeaderLine,
  isValidPosteNumber,
} from "@/lib/devis-parser/table-headers";

const JUNK_PATTERNS = [
  /\bape\s*[:：]/i,
  /\brcs\s*[:：]/i,
  /\brcs\s+\d/i,
  /\bn[°o]?\s*tva\s*intracom/i,
  /\btva\s*intracom/i,
  /\bcapital\s*[:：]/i,
  /\bsiret\b/i,
  /\bsiren\b/i,
  /\biban\b/i,
  /\bbic\b/i,
  /\bcode\s*ape\b/i,
  /\bforme\s*juridique\b/i,
  /\bassurance\s*d[eé]cennale\b/i,
  /\brc\s*pro\b/i,
  /\bmentions?\s*l[eé]gales\b/i,
  /\bsas\b|\bsarl\b|\beurl\b|\bsa\b/i,
  /\bconditions?\s*g[eé]n[eé]rales\b/i,
  /\bvalidit[eé]\s*du\s*devis\b/i,
  /\bd[eé]lai\s*de\s*paiement\b/i,
  /\bpénalit[eé]s?\s*de\s*retard\b/i,
  /\bsignature\s*du\s*client\b/i,
  /\bbon\s*pour\s*accord\b/i,
  /\bpage\s+\d+\s*\/\s*\d+/i,
  /\bwww\./i,
  /\b@\w+\.\w+/,
];

const BTP_KEYWORDS =
  /\b(fourniture|pose|poser|installation|installer|d[eé]pose|d[eé]montage|montage|fournir|livraison|mise\s+en\s+place|main\s*d['']?œuvre|main\s*d['']?oeuvre|ragr[eé]age|enduit|isolation|plomberie|[eé]lectricit[eé]|menuiserie|carrelage|parquet|peinture|cloison|fen[eê]tre|ch[aâ]ssis|porte|volet|radiateur|vmc|chaudi[eè]re|sanitaire|gaine|tuyau|c[aâ]ble|tableau|[eé]clairage|dalle|b[eé]ton|charpente|couverture|zinguerie|fa[iï]ence|placo|pl[aâ]tre)\b/i;

export function isJunkLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 5) return true;
  if (JUNK_PATTERNS.some((re) => re.test(trimmed))) return true;
  if (isTableHeaderLine(trimmed)) return true;
  if (isPageMarkerLine(trimmed)) return true;
  // Ligne quasi uniquement identifiants / chiffres légaux
  const letters = trimmed.replace(/[^a-zàâäéèêëïîôùûüç]/gi, "");
  if (letters.length < 8 && /\d{9,}/.test(trimmed)) return true;
  return false;
}

export function hasBtpSignal(text: string): boolean {
  return BTP_KEYWORDS.test(text);
}

/** Poste plausible : n° de position, signal BTP, ou structure qté + PU + total cohérente. */
export function isPlausiblePoste(
  line: string,
  designation: string,
  numeroPosition: string | null,
  quantite: number | null,
  prixUnitaire: number | null,
  prixTotal: number | null,
): boolean {
  if (isJunkLine(line) || isJunkLine(designation)) return false;
  if (isTableHeaderLine(designation) || isPageMarkerLine(line)) return false;

  if (!hasPositivePrice(prixUnitaire, prixTotal)) return false;

  if (numeroPosition) {
    if (!isValidPosteNumber(numeroPosition, designation.split(/\s+/)[0])) return false;
    if (designation.length < 4) return false;
    if (isJunkLine(designation)) return false;
    if (isTableHeaderLine(designation)) return false;
    return true;
  }

  if (hasBtpSignal(designation)) return true;

  const hasQtyPuTotal =
    quantite != null &&
    quantite > 0 &&
    quantite <= 9999 &&
    prixUnitaire != null &&
    prixTotal != null &&
    prixUnitaire > 0 &&
    Math.abs(quantite * prixUnitaire - prixTotal) < Math.max(1, prixTotal * 0.02);

  if (hasQtyPuTotal && designation.length >= 8) return true;

  // Montant seul sans position ni libellé métier → pied de page (ex. capital social)
  if (quantite == null && prixUnitaire == null && prixTotal != null && prixTotal >= 5000) {
    return false;
  }

  // Ligne avec 2 montants + libellé raisonnable (PDF mal structuré)
  if (
    prixUnitaire != null &&
    prixTotal != null &&
    prixTotal > 0 &&
    designation.length >= 5 &&
    !/^\d+$/.test(designation)
  ) {
    return true;
  }

  return false;
}
