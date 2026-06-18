import { supabase } from '../lib/supabase'
import type { Chantier } from '../types/database'

export async function fetchChantiers(): Promise<{ chantiers: Chantier[]; error: string | null }> {
  const { data, error } = await supabase
    .from('chantiers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { chantiers: [], error: error.message }
  }

  return { chantiers: (data ?? []) as Chantier[], error: null }
}

export async function createChantier(input: {
  nom: string
  client?: string
  ownerId: string
  organisationId: string
}): Promise<{ chantier: Chantier | null; error: string | null }> {
  const { data, error } = await supabase
    .from('chantiers')
    .insert({
      nom: input.nom,
      client: input.client ?? null,
      owner_id: input.ownerId,
      organisation_id: input.organisationId,
      statut: 'en_cours',
    } as never)
    .select('*')
    .single()

  if (error) {
    return { chantier: null, error: error.message }
  }

  return { chantier: data as Chantier, error: null }
}
