/** Corps de métier détectables dans les libellés devis. */
export const CORPS_METIER: { pattern: RegExp; label: string }[] = [
  { pattern: /\bfen[eê]tres?\b/i, label: "Fenêtre" },
  { pattern: /\bch[aâ]ssis\b/i, label: "Châssis" },
  { pattern: /\bportes?\b/i, label: "Porte" },
  { pattern: /\bvolets?\b/i, label: "Volet" },
  { pattern: /\bportails?\b/i, label: "Portail" },
  { pattern: /\bradiateurs?\b/i, label: "Radiateur" },
  { pattern: /\bluminaires?\b/i, label: "Luminaire" },
  { pattern: /\bprises?\b/i, label: "Prise" },
  { pattern: /\binterrupteurs?\b/i, label: "Interrupteur" },
  { pattern: /\bwc\b|toilettes?/i, label: "WC" },
  { pattern: /\blavabos?\b/i, label: "Lavabo" },
  { pattern: /\bdouches?\b/i, label: "Douche" },
  { pattern: /\bbaignoires?\b/i, label: "Baignoire" },
  { pattern: /\brobinets?\b/i, label: "Robinet" },
  { pattern: /\bvanne\b/i, label: "Vanne" },
  { pattern: /\bcloisons?\b/i, label: "Cloison" },
  { pattern: /\bcarrelages?\b/i, label: "Carrelage" },
  { pattern: /\bparquets?\b/i, label: "Parquet" },
  { pattern: /\bpeintures?\b/i, label: "Peinture" },
  { pattern: /\bstores?\b/i, label: "Store" },
  { pattern: /\bvmc\b/i, label: "VMC" },
  { pattern: /\bchaudi[eè]res?\b/i, label: "Chaudière" },
];

export function detectCorpsMetier(designation: string): string | null {
  for (const { pattern, label } of CORPS_METIER) {
    if (pattern.test(designation)) return label;
  }
  return null;
}
