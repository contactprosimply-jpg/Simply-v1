import type { Tache, TachePriorite, TacheStatut } from "@/lib/types";

export const TACHE_STATUTS: { value: TacheStatut; label: string }[] = [
  { value: "a_faire", label: "À faire" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
];

export const TACHE_PRIORITES: { value: TachePriorite; label: string; color: string }[] = [
  { value: "basse", label: "Basse", color: "bg-gray-100 text-gray-600" },
  { value: "normale", label: "Normale", color: "bg-blue-50 text-accent-blue" },
  { value: "haute", label: "Haute", color: "bg-amber-50 text-amber-700" },
  { value: "urgente", label: "Urgente", color: "bg-red-50 text-red-700" },
];

export function isTacheEnRetard(tache: Tache): boolean {
  if (tache.statut === "termine") return false;
  if (tache.retard) return true;
  if (!tache.echeance) return false;
  return new Date(tache.echeance) < new Date();
}

export function withRetardFlag(tache: Tache): Tache {
  return { ...tache, retard: isTacheEnRetard(tache) };
}

export function formatEcheance(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
