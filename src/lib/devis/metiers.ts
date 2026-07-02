const METIER_KEYWORDS: { metier: string; patterns: RegExp[] }[] = [
  { metier: "menuiserie", patterns: [/fen[eê]tre/i, /porte/i, /volet/i, /ch[aâ]ssis/i] },
  { metier: "électricité", patterns: [/c[aâ]ble/i, /tableau/i, /prise/i, /disjoncteur/i, /luminaire/i] },
  { metier: "plomberie", patterns: [/tuyau/i, /robinet/i, /\bwc\b/i, /[eé]vier/i, /sanitaire/i] },
  { metier: "cvc", patterns: [/ventilation/i, /\bcta\b/i, /gaine/i, /climatisation/i, /chauffage/i] },
  { metier: "gros œuvre", patterns: [/b[eé]ton/i, /coffrage/i, /ferraillage/i, /dalle/i] },
  { metier: "peinture", patterns: [/peinture/i, /enduit/i, /pon[cç]age/i] },
  { metier: "façade", patterns: [/\bite\b/i, /bardage/i, /ravalement/i, /enduit fa[cç]ade/i] },
  { metier: "vrd", patterns: [/enrob[eé]/i, /caniveau/i, /tranch[eé]e/i, /assainissement/i] },
  { metier: "serrurerie", patterns: [/garde-corps/i, /m[eé]tallerie/i, /portail/i] },
  { metier: "ascenseurs", patterns: [/ascenseur/i, /monte-charge/i] },
  { metier: "cloisons", patterns: [/placo/i, /ba13/i, /rail/i, /cloison/i] },
  { metier: "sols", patterns: [/carrelage/i, /parquet/i, /chape/i, /sol souple/i] },
  { metier: "charpente", patterns: [/fermette/i, /panne/i, /chevron/i, /charpente/i] },
];

export function detectMetier(text: string): string | null {
  for (const { metier, patterns } of METIER_KEYWORDS) {
    if (patterns.some((p) => p.test(text))) return metier;
  }
  return null;
}

export function aggregateMetiers(postes: { metier: string | null }[]): string[] {
  const set = new Set<string>();
  for (const p of postes) {
    if (p.metier) set.add(p.metier);
  }
  return [...set].sort();
}
