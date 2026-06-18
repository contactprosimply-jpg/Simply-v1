import { supabase } from '../lib/supabase'
import type { Chantier } from '../types/database'

interface OperisTender {
  id: string
  title: string
  client: string
  budget_ht: number | null
  user_id: string
  created_at: string
  simply_chantier_id: string | null
}

function mapTenderToChantier(t: OperisTender): Chantier {
  return {
    id: t.simply_chantier_id ?? t.id,
    ao_id: t.id,
    nom: t.title,
    client: t.client,
    montant: t.budget_ht,
    statut: 'en_cours',
    owner_id: t.user_id,
    organization_id: null,
    created_at: t.created_at,
  }
}

export async function fetchChantiers(): Promise<{ chantiers: Chantier[]; error: string | null }> {
  const chantiersRes = await supabase
    .from('chantiers')
    .select('*')
    .order('created_at', { ascending: false })

  if (!chantiersRes.error) {
    return { chantiers: (chantiersRes.data ?? []) as Chantier[], error: null }
  }

  const missingTable =
    chantiersRes.error.message.includes('Could not find the table') ||
    chantiersRes.error.message.includes('schema cache')

  if (!missingTable) {
    return { chantiers: [], error: chantiersRes.error.message }
  }

  const tendersRes = await supabase
    .from('tenders')
    .select('id, title, client, budget_ht, user_id, created_at, simply_chantier_id')
    .eq('status', 'gagne')
    .order('created_at', { ascending: false })

  if (tendersRes.error) {
    return { chantiers: [], error: tendersRes.error.message }
  }

  return {
    chantiers: ((tendersRes.data ?? []) as OperisTender[]).map(mapTenderToChantier),
    error: null,
  }
}
