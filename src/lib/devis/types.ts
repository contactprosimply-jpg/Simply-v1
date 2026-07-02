import type { BudgetPosteTypeLigne, DevisDocumentType } from "@/lib/database.types";

export interface DocumentAnalyse {
  type_document: DevisDocumentType;
  metiers_detectes: string[];
  total_ht: number | null;
  total_ttc: number | null;
  taux_tva: number | null;
  structure_reconnue: boolean;
  remarques: string[];
}

export interface PosteAnalyse {
  numero_position: string | null;
  lot: string | null;
  metier: string | null;
  designation: string;
  unite: string | null;
  quantite: number | null;
  prix_unitaire: number | null;
  prix_total: number | null;
  type_ligne: BudgetPosteTypeLigne;
  coherence_ok: boolean;
  remarque: string | null;
  ordre: number;
}

export interface ResultatAnalyse {
  document: DocumentAnalyse;
  postes: PosteAnalyse[];
}

export class DevisAnalyserError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "DevisAnalyserError";
  }
}

export type GrilleDevis = string[][];
