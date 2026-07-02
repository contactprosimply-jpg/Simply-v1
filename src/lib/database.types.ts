/**
 * Types Supabase — générés manuellement (étape A devis/DPGF).
 * Alignés sur supabase/migrations/20260701150000_devis_import_data_model.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DevisImportStatut = "importe" | "valide";
export type DevisTypeFichier = "xlsx" | "pdf" | "csv";
export type BudgetPosteTypeLigne = "poste" | "titre_lot" | "sous_total";
export type DevisDocumentType = "devis" | "dpgf" | "bordereau" | "autre";
export type TacheStatutDb = "a_faire" | "en_cours" | "termine" | "bloque";
export type TachePrioriteDb = "basse" | "normale" | "haute" | "urgente";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          organisation_id: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          organisation_id: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chantiers: {
        Row: {
          id: string;
          ao_id: string | null;
          nom: string;
          client: string | null;
          montant: number | null;
          statut: string;
          owner_id: string;
          organisation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ao_id?: string | null;
          nom: string;
          client?: string | null;
          montant?: number | null;
          statut?: string;
          owner_id?: string;
          organisation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ao_id?: string | null;
          nom?: string;
          client?: string | null;
          montant?: number | null;
          statut?: string;
          owner_id?: string;
          organisation_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chantiers_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      devis_imports: {
        Row: {
          id: string;
          chantier_id: string;
          owner_id: string;
          nom_fichier: string | null;
          type_fichier: DevisTypeFichier | string | null;
          storage_path: string | null;
          statut: DevisImportStatut | string;
          metiers_detectes: string[] | null;
          total_ht: number | null;
          total_ttc: number | null;
          taux_tva: number | null;
          resume: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chantier_id: string;
          owner_id?: string;
          nom_fichier?: string | null;
          type_fichier?: DevisTypeFichier | string | null;
          storage_path?: string | null;
          statut?: DevisImportStatut | string;
          metiers_detectes?: string[] | null;
          total_ht?: number | null;
          total_ttc?: number | null;
          taux_tva?: number | null;
          resume?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chantier_id?: string;
          owner_id?: string;
          nom_fichier?: string | null;
          type_fichier?: DevisTypeFichier | string | null;
          storage_path?: string | null;
          statut?: DevisImportStatut | string;
          metiers_detectes?: string[] | null;
          total_ht?: number | null;
          total_ttc?: number | null;
          taux_tva?: number | null;
          resume?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "devis_imports_chantier_id_fkey";
            columns: ["chantier_id"];
            isOneToOne: false;
            referencedRelation: "chantiers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "devis_imports_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_postes: {
        Row: {
          id: string;
          chantier_id: string;
          devis_import_id: string | null;
          owner_id: string;
          numero_position: string | null;
          lot: string | null;
          metier: string | null;
          designation: string;
          unite: string | null;
          quantite: number | null;
          prix_unitaire: number | null;
          prix_total: number | null;
          type_ligne: BudgetPosteTypeLigne | string;
          coherence_ok: boolean;
          remarque: string | null;
          ordre: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chantier_id: string;
          devis_import_id?: string | null;
          owner_id?: string;
          numero_position?: string | null;
          lot?: string | null;
          metier?: string | null;
          designation: string;
          unite?: string | null;
          quantite?: number | null;
          prix_unitaire?: number | null;
          prix_total?: number | null;
          type_ligne?: BudgetPosteTypeLigne | string;
          coherence_ok?: boolean;
          remarque?: string | null;
          ordre?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chantier_id?: string;
          devis_import_id?: string | null;
          owner_id?: string;
          numero_position?: string | null;
          lot?: string | null;
          metier?: string | null;
          designation?: string;
          unite?: string | null;
          quantite?: number | null;
          prix_unitaire?: number | null;
          prix_total?: number | null;
          type_ligne?: BudgetPosteTypeLigne | string;
          coherence_ok?: boolean;
          remarque?: string | null;
          ordre?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_postes_chantier_id_fkey";
            columns: ["chantier_id"];
            isOneToOne: false;
            referencedRelation: "chantiers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_postes_devis_import_id_fkey";
            columns: ["devis_import_id"];
            isOneToOne: false;
            referencedRelation: "devis_imports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_postes_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      taches: {
        Row: {
          id: string;
          chantier_id: string;
          budget_poste_id: string | null;
          owner_id: string | null;
          titre: string;
          description: string | null;
          assigne_a: string | null;
          unite: string | null;
          quantite: number | null;
          quantite_faite: number;
          statut: TacheStatutDb | string;
          priorite: TachePrioriteDb | string;
          echeance: string | null;
          retard: boolean;
          ordre: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chantier_id: string;
          budget_poste_id?: string | null;
          owner_id?: string | null;
          titre: string;
          description?: string | null;
          assigne_a?: string | null;
          unite?: string | null;
          quantite?: number | null;
          quantite_faite?: number;
          statut?: TacheStatutDb | string;
          priorite?: TachePrioriteDb | string;
          echeance?: string | null;
          retard?: boolean;
          ordre?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chantier_id?: string;
          budget_poste_id?: string | null;
          owner_id?: string | null;
          titre?: string;
          description?: string | null;
          assigne_a?: string | null;
          unite?: string | null;
          quantite?: number | null;
          quantite_faite?: number;
          statut?: TacheStatutDb | string;
          priorite?: TachePrioriteDb | string;
          echeance?: string | null;
          retard?: boolean;
          ordre?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "taches_chantier_id_fkey";
            columns: ["chantier_id"];
            isOneToOne: false;
            referencedRelation: "chantiers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "taches_budget_poste_id_fkey";
            columns: ["budget_poste_id"];
            isOneToOne: false;
            referencedRelation: "budget_postes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "taches_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/** Helpers row / insert */
export type ChantierRow = Database["public"]["Tables"]["chantiers"]["Row"];
export type ChantierInsert = Database["public"]["Tables"]["chantiers"]["Insert"];
export type DevisImportRow = Database["public"]["Tables"]["devis_imports"]["Row"];
export type DevisImportInsert = Database["public"]["Tables"]["devis_imports"]["Insert"];
export type BudgetPosteRow = Database["public"]["Tables"]["budget_postes"]["Row"];
export type BudgetPosteInsert = Database["public"]["Tables"]["budget_postes"]["Insert"];
export type TacheRow = Database["public"]["Tables"]["taches"]["Row"];
export type TacheInsert = Database["public"]["Tables"]["taches"]["Insert"];
