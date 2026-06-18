import { supabase } from '../lib/supabase'
import type { DashboardKpis, Tache, Photo, BudgetLigne } from '../types/database'

export async function fetchDashboardKpis(chantierId: string): Promise<DashboardKpis> {
  const [tachesRes, budgetRes, photosRes] = await Promise.all([
    supabase.from('taches').select('*').eq('chantier_id', chantierId),
    supabase.from('budget_lignes').select('*').eq('chantier_id', chantierId),
    supabase
      .from('photos')
      .select('*')
      .eq('chantier_id', chantierId)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const taches = (tachesRes.data ?? []) as Tache[]
  const budgetLignes = (budgetRes.data ?? []) as BudgetLigne[]
  const photos = (photosRes.data ?? []) as Photo[]

  const totalTaches = taches.length
  const tachesTerminees = taches.filter((t) => t.statut === 'termine').length
  const avancementPct = totalTaches === 0 ? 0 : Math.round((tachesTerminees / totalTaches) * 100)

  const now = new Date()
  const tachesEnRetard = taches.filter((t) => {
    if (t.statut === 'termine') return false
    if (t.retard) return true
    if (!t.echeance) return false
    return new Date(t.echeance) < now
  }).length

  const budgetPrevu = budgetLignes
    .filter((l) => l.type === 'devis')
    .reduce((sum, l) => sum + Number(l.montant), 0)

  const budgetConsomme = budgetLignes
    .filter((l) => l.type === 'facture' || l.type === 'depense')
    .reduce((sum, l) => sum + Number(l.montant), 0)

  const prochainesEcheances = taches
    .filter((t) => t.statut !== 'termine' && t.echeance)
    .sort((a, b) => new Date(a.echeance!).getTime() - new Date(b.echeance!).getTime())
    .slice(0, 5)

  return {
    avancementPct,
    tachesEnRetard,
    budgetPrevu,
    budgetConsomme,
    dernieresPhotos: photos,
    prochainesEcheances,
  }
}
