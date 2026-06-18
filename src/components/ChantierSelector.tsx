import { ChevronDown, Building2, Loader2 } from 'lucide-react'
import { useChantierStore } from '../stores/chantierStore'

export function ChantierSelector() {
  const { chantiers, selectedId, loading, error, selectChantier } = useChantierStore()
  const selected = chantiers.find((c) => c.id === selectedId)

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
      </div>
    )
  }

  if (chantiers.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-surface-dark bg-white px-3 py-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4 shrink-0" />
        Aucun chantier — créez-en un dans Operis
      </div>
    )
  }

  return (
    <div className="relative max-w-md">
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
      {selected && (
        <p className="mt-1 truncate text-xs text-gray-500">
          Statut : {selected.statut.replace('_', ' ')}
          {selected.montant != null && ` · ${selected.montant.toLocaleString('fr-FR')} €`}
        </p>
      )}
    </div>
  )
}
