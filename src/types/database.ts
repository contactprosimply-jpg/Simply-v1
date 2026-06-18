export type ChantierStatut = 'en_cours' | 'termine' | 'suspendu' | 'planifie'

export type TacheStatut = 'a_faire' | 'en_cours' | 'termine'
export type TachePriorite = 'basse' | 'normale' | 'haute' | 'urgente'
export type BudgetType = 'devis' | 'facture' | 'depense'

export interface Chantier {
  id: string
  ao_id: string | null
  nom: string
  client: string | null
  montant: number | null
  statut: ChantierStatut
  owner_id: string
  organization_id: string | null
  created_at: string
}

export interface Profile {
  id: string
  organisation_id?: string | null
  full_name: string | null
  created_at?: string
}

export interface Tache {
  id: string
  chantier_id: string
  titre: string
  description: string | null
  assigne_a: string | null
  statut: TacheStatut
  priorite: TachePriorite
  echeance: string | null
  retard: boolean
  created_at: string
}

export interface Photo {
  id: string
  chantier_id: string
  url: string
  tags: string[] | null
  lie_a: string | null
  created_at: string
}

export interface BudgetLigne {
  id: string
  chantier_id: string
  type: BudgetType
  libelle: string
  montant: number
  date: string
}

export interface DashboardKpis {
  avancementPct: number
  tachesEnRetard: number
  budgetPrevu: number
  budgetConsomme: number
  dernieresPhotos: Photo[]
  prochainesEcheances: Tache[]
}

export interface Database {
  public: {
    Tables: {
      chantiers: {
        Row: Chantier
        Insert: Omit<Chantier, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Chantier, 'id'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      taches: {
        Row: Tache
        Insert: Omit<Tache, 'id' | 'created_at' | 'retard'> & {
          id?: string
          created_at?: string
          retard?: boolean
        }
        Update: Partial<Omit<Tache, 'id'>>
      }
      photos: {
        Row: Photo
        Insert: Omit<Photo, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Photo, 'id'>>
      }
      budget_lignes: {
        Row: BudgetLigne
        Insert: Omit<BudgetLigne, 'id'> & { id?: string }
        Update: Partial<Omit<BudgetLigne, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
