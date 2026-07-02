import type { DevisAnalysePoste, DevisAnalysePosteRaw } from "@/lib/devis-analyse/types";

function formatAmount(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

/**
 * Contrôle de cohérence côté code (pas IA).
 * Tolérance : max(1 €, 1 % du total annoncé).
 */
export function applyPosteCoherenceChecks(postes: DevisAnalysePosteRaw[]): DevisAnalysePoste[] {
  return postes.map((poste) => {
    const remarques: string[] = [];
    let coherence_ok = true;

    if (poste.type_ligne === "poste") {
      if (!poste.unite) {
        coherence_ok = false;
        remarques.push("Unité manquante sur un poste.");
      }

      const { quantite, prix_unitaire, prix_total } = poste;
      if (
        quantite != null &&
        prix_unitaire != null &&
        prix_total != null &&
        quantite > 0 &&
        prix_unitaire > 0 &&
        prix_total > 0
      ) {
        const attendu = quantite * prix_unitaire;
        const tolerance = Math.max(1, Math.abs(prix_total) * 0.01);
        const ecart = Math.abs(attendu - prix_total);

        if (ecart > tolerance) {
          coherence_ok = false;
          remarques.push(
            `${quantite} × ${formatAmount(prix_unitaire)} = ${formatAmount(attendu)}, or total annoncé ${formatAmount(prix_total)}`,
          );
        }
      }
    }

    return {
      ...poste,
      coherence_ok,
      remarque: remarques.length > 0 ? remarques.join(" ") : null,
    };
  });
}
