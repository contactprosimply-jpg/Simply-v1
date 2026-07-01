export type ChantierStatut = "planifie" | "en_cours" | "suspendu" | "termine";

export interface Chantier {
  id: string;
  nom: string;
  client: string | null;
  montant: number | null;
  statut: ChantierStatut;
  createdAt: string;
}

export interface Tache {
  id: string;
  chantierId: string;
  titre: string;
  statut: "a_faire" | "en_cours" | "termine";
  priorite: "basse" | "normale" | "haute" | "urgente";
  echeance: string | null;
  retard: boolean;
}

export interface DashboardKpis {
  avancementPct: number;
  tachesEnRetard: number;
  budgetPrevu: number;
  budgetConsomme: number;
  photosCount: number;
  prochainesEcheances: Tache[];
}

export function computeKpis(chantierId: string, taches: Tache[]): DashboardKpis {
  const scoped = taches.filter((t) => t.chantierId === chantierId);
  const total = scoped.length;
  const done = scoped.filter((t) => t.statut === "termine").length;
  const now = new Date();

  const tachesEnRetard = scoped.filter((t) => {
    if (t.statut === "termine") return false;
    if (t.retard) return true;
    if (!t.echeance) return false;
    return new Date(t.echeance) < now;
  }).length;

  const prochainesEcheances = scoped
    .filter((t) => t.statut !== "termine" && t.echeance)
    .sort((a, b) => new Date(a.echeance!).getTime() - new Date(b.echeance!).getTime())
    .slice(0, 5);

  return {
    avancementPct: total === 0 ? 0 : Math.round((done / total) * 100),
    tachesEnRetard,
    budgetPrevu: 0,
    budgetConsomme: 0,
    photosCount: 0,
    prochainesEcheances,
  };
}
