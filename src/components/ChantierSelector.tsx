import { useState } from 'react'
import { ChevronDown, Building2, Loader2, Plus } from 'lucide-react'
import { useChantierStore } from '../stores/chantierStore'
import { useAuthStore } from '../stores/authStore'

export function ChantierSelector() {
  const { chantiers, selectedId, loading, error, selectChantier, createChantier } = useChantierStore()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const selected = chantiers.find((c) => c.id === selectedId)

  const [showForm, setShowForm] = useState(false)
  const [nom, setNom] = useState('')
  const [client, setClient] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!nom.trim()) return
    setCreating(true)
    setFormError(null)
    const err = await createChantier(
      nom.trim(),
      client.trim() || undefined,
      user?.id,
      profile?.organisation_id,
    )
    setCreating(false)
    if (err) {
      setFormError(err)
      return
    }
    setNom('')
    setClient('')
    setShowForm(false)
  }

  if (loading && chantiers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des chantiers…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Erreur chantiers : {error}
        <p className="mt-1 text-xs">Exécutez la migration 001 dans Supabase (projet Simply).</p>
      </div>
    )
  }

  if (chantiers.length === 0 && !showForm) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Aucun chantier</span>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-accent-blue px-3 text-xs font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouveau chantier
        </button>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="flex max-w-md flex-col gap-2 rounded-xl border border-surface-dark bg-white p-3">
        <input
          type="text"
          placeholder="Nom du chantier"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="h-10 rounded-lg border border-surface-dark px-3 text-sm"
        />
        <input
          type="text"
          placeholder="Client (optionnel)"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="h-10 rounded-lg border border-surface-dark px-3 text-sm"
        />
        {formError && <p className="text-xs text-red-600">{formError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={creating || !nom.trim()}
            onClick={() => void handleCreate()}
            className="h-9 rounded-lg bg-accent-blue px-3 text-xs font-medium text-white disabled:opacity-50"
          >
            {creating ? 'Création…' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="h-9 rounded-lg border border-surface-dark px-3 text-xs text-gray-600"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative max-w-md">
      <div className="flex items-start gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="chantier-select" className="sr-only">
            Sélectionner un chantier
          </label>
          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-blue" />
          <select
            id="chantier-select"
            value={selectedId ?? ''}
            onChange={(e) => selectChantier(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-surface-dark bg-white pl-10 pr-10 text-sm font-medium text-navy shadow-sm transition focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          >
            {chantiers.map((chantier) => (
              <option key={chantier.id} value={chantier.id}>
                {chantier.nom}
                {chantier.client ? ` — ${chantier.client}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          title="Nouveau chantier"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-surface-dark text-accent-blue hover:bg-surface"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {selected && (
        <p className="mt-1 truncate text-xs text-gray-500">
          Statut : {selected.statut.replace('_', ' ')}
          {selected.montant != null && ` · ${selected.montant.toLocaleString('fr-FR')} €`}
        </p>
      )}
    </div>
  )
}
