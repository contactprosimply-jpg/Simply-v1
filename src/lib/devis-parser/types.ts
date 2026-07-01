export interface ParsedPoste {
  numeroPosition: string | null;
  lot: string | null;
  designation: string;
  unite: string | null;
  quantite: number | null;
  prixUnitaire: number | null;
  prixTotal: number | null;
  ordre: number;
}

export interface ParsedDevis {
  prixFinal: number | null;
  prixFinalLabel: string | null;
  postes: ParsedPoste[];
}

export interface AnalyzedTache {
  titre: string;
  description: string | null;
  lot: string | null;
  unite: string | null;
  quantite: number | null;
}

export interface DevisAnalyzeResult {
  devisImportId: string;
  prixFinal: number | null;
  prixFinalLabel: string | null;
  postesCount: number;
  taches: AnalyzedTache[];
  postes: ParsedPoste[];
}
