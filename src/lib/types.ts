export type ChantierStatut = "planifie" | "en_cours" | "suspendu" | "termine";
export type TacheStatut = "a_faire" | "en_cours" | "termine";
export type TachePriorite = "basse" | "normale" | "haute" | "urgente";
export type BudgetType = "devis" | "facture" | "depense";
export type ReserveStatut = "ouverte" | "en_cours" | "levee";
export type CertificatType =
  | "reception_provisoire"
  | "reception_definitive"
  | "levee_reserves"
  | "autre";

export const CERTIFICAT_TYPES: { value: CertificatType; label: string }[] = [
  { value: "reception_provisoire", label: "Réception provisoire" },
  { value: "reception_definitive", label: "Réception définitive" },
  { value: "levee_reserves", label: "Levée de réserves" },
  { value: "autre", label: "Autre" },
];

export const LOTS_BTP = [
  "Gros œuvre",
  "Menuiserie",
  "Électricité",
  "Plomberie",
  "CVC",
  "Peinture",
  "Carrelage",
  "Étanchéité",
  "Autre",
];

export interface Chantier {
  id: string;
  nom: string;
  client: string | null;
  adresse: string | null;
  montant: number | null;
  statut: ChantierStatut;
  createdAt: string;
}

export interface Tache {
  id: string;
  chantierId: string;
  titre: string;
  description: string | null;
  statut: TacheStatut;
  priorite: TachePriorite;
  echeance: string | null;
  retard: boolean;
  lot: string | null;
  reserveId: string | null;
  createdAt: string;
}

export interface Reserve {
  id: string;
  chantierId: string;
  titre: string;
  description: string | null;
  lot: string | null;
  statut: ReserveStatut;
  tacheId: string | null;
  createdAt: string;
}

export interface Plan {
  id: string;
  chantierId: string;
  nom: string;
  pdfUrl: string;
  lot: string | null;
  createdAt: string;
}

export interface Photo {
  id: string;
  chantierId: string;
  url: string;
  tags: string[];
  note: string | null;
  tacheId: string | null;
  reserveId: string | null;
  createdAt: string;
}

export interface BudgetLigne {
  id: string;
  chantierId: string;
  type: BudgetType;
  libelle: string;
  montant: number;
  date: string;
  lot: string | null;
}

export interface CompteRendu {
  id: string;
  chantierId: string;
  titre: string;
  contenu: string;
  date: string;
  createdAt: string;
}

export interface Pointage {
  id: string;
  chantierId: string;
  ouvrier: string;
  date: string;
  heures: number;
  pauses: number;
}

export interface Reunion {
  id: string;
  chantierId: string;
  titre: string;
  date: string;
  participants: string[];
  contenu: string;
  createdAt: string;
}

export interface Certificat {
  id: string;
  chantierId: string;
  type: CertificatType | string;
  contenu: string;
  date: string;
  createdAt: string;
}

export interface AppData {
  version: number;
  chantiers: Chantier[];
  taches: Tache[];
  reserves: Reserve[];
  plans: Plan[];
  photos: Photo[];
  budgetLignes: BudgetLigne[];
  comptesRendus: CompteRendu[];
  pointages: Pointage[];
  reunions: Reunion[];
  certificats: Certificat[];
  selectedId: string | null;
}

export interface DashboardKpis {
  avancementPct: number;
  tachesEnRetard: number;
  budgetPrevu: number;
  budgetConsomme: number;
  photosCount: number;
  reservesOuvertes: number;
  prochainesEcheances: Tache[];
}

export function computeKpis(
  chantierId: string,
  data: Pick<AppData, "taches" | "budgetLignes" | "photos" | "reserves">,
): DashboardKpis {
  const scoped = data.taches.filter((t) => t.chantierId === chantierId);
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

  const budget = data.budgetLignes.filter((b) => b.chantierId === chantierId);
  const budgetPrevu = budget.filter((b) => b.type === "devis").reduce((s, b) => s + b.montant, 0);
  const budgetConsomme = budget
    .filter((b) => b.type === "facture" || b.type === "depense")
    .reduce((s, b) => s + b.montant, 0);

  const photosCount = data.photos.filter((p) => p.chantierId === chantierId).length;
  const reservesOuvertes = (data.reserves ?? []).filter(
    (r) => r.chantierId === chantierId && r.statut !== "levee",
  ).length;

  return {
    avancementPct: total === 0 ? 0 : Math.round((done / total) * 100),
    tachesEnRetard,
    budgetPrevu,
    budgetConsomme,
    photosCount,
    reservesOuvertes,
    prochainesEcheances,
  };
}

export function formatDateFr(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(amount: number) {
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function certificatLabel(type: string) {
  return CERTIFICAT_TYPES.find((t) => t.value === type)?.label ?? type;
}

/** Extrait les actions d'un PV (lignes commençant par - ou •) */
export function extractActionsFromPv(contenu: string): string[] {
  return contenu
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-•*]\s+/.test(l))
    .map((l) => l.replace(/^[-•*]\s+/, "").trim())
    .filter(Boolean);
}
