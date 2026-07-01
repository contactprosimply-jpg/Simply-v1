import type { AnalyzedTache, ParsedPoste } from "@/lib/devis-parser/types";
import { detectCorpsMetier } from "@/lib/devis-parser/corps-metier";

const UNITES_DISCRETES = new Set(["u", "ens", "unité", "unite", "ff", "forfait", "pce", "pc"]);

function isUniteDiscrete(unite: string | null): boolean {
  if (!unite) return true;
  return UNITES_DISCRETES.has(unite.toLowerCase().replace("²", "2"));
}

function shouldExpandPoste(poste: ParsedPoste): boolean {
  const qty = poste.quantite;
  if (qty == null || qty < 2 || !Number.isInteger(qty)) return false;
  if (isUniteDiscrete(poste.unite)) return true;
  return detectCorpsMetier(poste.designation) != null;
}

function summarizeDesignation(designation: string, max = 80): string {
  const clean = designation.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function buildTacheDescription(
  poste: ParsedPoste,
  index: number | null,
  total: number | null,
): string {
  const parts: string[] = [];
  if (poste.numeroPosition) parts.push(`Pos. ${poste.numeroPosition}`);
  if (index != null && total != null) parts.push(`Unité ${index}/${total}`);
  if (poste.prixUnitaire != null) {
    parts.push(`PU ${poste.prixUnitaire.toLocaleString("fr-FR")} €`);
  }
  if (poste.prixTotal != null && total != null && total > 1) {
    const unitPrice = poste.prixTotal / total;
    parts.push(`~${unitPrice.toLocaleString("fr-FR")} €/u`);
  } else if (poste.prixTotal != null) {
    parts.push(`${poste.prixTotal.toLocaleString("fr-FR")} €`);
  }
  return parts.join(" · ");
}

function buildUnitTitle(
  poste: ParsedPoste,
  index: number,
  total: number,
): string {
  const corps = detectCorpsMetier(poste.designation);
  const detail = summarizeDesignation(poste.designation, 70);

  if (corps) {
    return `${corps} ${index}/${total} — ${detail}`;
  }

  if (total > 1) {
    return `${poste.designation} (${index}/${total})`;
  }

  return poste.designation;
}

/**
 * Transforme chaque poste devis en une ou plusieurs tâches terrain.
 * Qté entière + unité discrète (U, ens…) → une tâche par unité (ex. 10 fenêtres → 10 tâches).
 */
export function expandPosteToTaches(poste: ParsedPoste): AnalyzedTache[] {
  const qty = poste.quantite;

  if (shouldExpandPoste(poste) && qty != null) {
    return Array.from({ length: qty }, (_, i) => {
      const index = i + 1;
      return {
        titre: buildUnitTitle(poste, index, qty).slice(0, 500),
        description: buildTacheDescription(poste, index, qty),
        lot: poste.lot,
        unite: poste.unite ?? "U",
        quantite: 1,
        numeroPosition: poste.numeroPosition,
      };
    });
  }

  return [
    {
      titre: poste.designation.slice(0, 500),
      description: buildTacheDescription(poste, null, null),
      lot: poste.lot,
      unite: poste.unite,
      quantite: qty,
      numeroPosition: poste.numeroPosition,
    },
  ];
}

export function expandAllPostesToTaches(postes: ParsedPoste[]): AnalyzedTache[] {
  return postes.flatMap((p) => expandPosteToTaches(p));
}
