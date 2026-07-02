import type { BudgetPosteTypeLigne, DevisDocumentType } from "@/lib/database.types";

export interface DevisAnalyseDocument {
  type_document: DevisDocumentType;
  metiers_detectes: string[];
  devise: string;
  total_ht: number | null;
  total_ttc: number | null;
  taux_tva: number | null;
  remarques: string[];
}

export interface DevisAnalysePosteRaw {
  numero_position: string | null;
  lot: string | null;
  metier: string | null;
  designation: string;
  unite: string | null;
  quantite: number | null;
  prix_unitaire: number | null;
  prix_total: number | null;
  type_ligne: BudgetPosteTypeLigne;
}

export interface DevisAnalysePoste extends DevisAnalysePosteRaw {
  coherence_ok: boolean;
  remarque: string | null;
}

export interface DevisAnalyseAiResult {
  document: DevisAnalyseDocument;
  postes: DevisAnalysePosteRaw[];
}

export interface DevisAnalysePreview {
  document: DevisAnalyseDocument;
  postes: DevisAnalysePoste[];
  storage_path: string;
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
