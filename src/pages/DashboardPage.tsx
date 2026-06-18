import { useEffect, useState } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  Camera,
  CalendarClock,
  Loader2,
} from 'lucide-react'
import { useChantierStore } from '../stores/chantierStore'
import { fetchDashboardKpis } from '../services/dashboard'
import type { DashboardKpis } from '../types/database'

const emptyKpis: DashboardKpis = {
  avancementPct: 0,
  tachesEnRetard: 0,
  budgetPrevu: 0,
  budgetConsomme: 0,
  dernieresPhotos: [],
  prochainesEcheances: [],
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
}: {
  title: string
  value: string
  subtitle?: string
  icon: typeof TrendingUp
  accent?: 'blue' | 'cyan' | 'warning'
}) {
  const accentClasses = {
    blue: 'from-accent-blue/15 to-accent-blue/5 text-accent-blue',
    cyan: 'from-accent-cyan/15 to-accent-cyan/5 text-accent-cyan',
    warning: 'from-amber-100 to-amber-50 text-amber-600',
  }

  return (
    <article className="animate-fade-in rounded-2xl border border-surface-dark bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-navy">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accentClasses[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  )
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function DashboardPage() {
  const selectedId = useChantierStore((s) => s.selectedId)
  const selectedChantier = useChantierStore((s) => s.selectedChantier())
  const [kpis, setKpis] = useState<DashboardKpis>(emptyKpis)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedId) {
      setKpis(emptyKpis)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchDashboardKpis(selectedId)
      .then((data) => {
        if (!cancelled) setKpis(data)
      })
      .catch(() => {
        if (!cancelled) setKpis(emptyKpis)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedId])

  if (!selectedId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-navy">Aucun chantier sélectionné</p>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Les chantiers gagnés dans Operis apparaîtront ici automatiquement.
        </p>
      </div>
    )
  }

  const budgetPct =
    kpis.budgetPrevu === 0 ? 0 : Math.round((kpis.budgetConsomme / kpis.budgetPrevu) * 100)

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">
          {selectedChantier?.nom ?? 'Tableau de bord'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d&apos;ensemble du chantier
          {loading && (
            <span className="ml-2 inline-flex items-center gap-1 text-accent-blue">
              <Loader2 className="h-3 w-3 animate-spin" />
              Mise à jour…
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Avancement global"
          value={`${kpis.avancementPct} %`}
          subtitle="Tâches terminées / total"
          icon={TrendingUp}
          accent="cyan"
        />
        <KpiCard
          title="Tâches en retard"
          value={String(kpis.tachesEnRetard)}
          subtitle={kpis.tachesEnRetard === 0 ? 'Aucun retard détecté' : 'Action requise'}
          icon={AlertTriangle}
          accent={kpis.tachesEnRetard > 0 ? 'warning' : 'blue'}
        />
        <KpiCard
          title="Budget consommé"
          value={formatCurrency(kpis.budgetConsomme)}
          subtitle={`Sur ${formatCurrency(kpis.budgetPrevu)} prévu (${budgetPct} %)`}
          icon={Wallet}
          accent="blue"
        />
        <KpiCard
          title="Dernières photos"
          value={String(kpis.dernieresPhotos.length)}
          subtitle="Photos récentes du chantier"
          icon={Camera}
          accent="cyan"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="animate-fade-in rounded-2xl border border-surface-dark bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-accent-blue" />
            <h2 className="text-lg font-semibold text-navy">Prochaines échéances</h2>
          </div>
          {kpis.prochainesEcheances.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune échéance planifiée pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-3">
              {kpis.prochainesEcheances.map((tache) => (
                <li
                  key={tache.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">{tache.titre}</p>
                    <p className="text-xs capitalize text-gray-400">{tache.priorite}</p>
                  </div>
                  <time className="shrink-0 text-xs font-medium text-accent-blue">
                    {tache.echeance ? formatDate(tache.echeance) : '—'}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="animate-fade-in rounded-2xl border border-surface-dark bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent-cyan" />
            <h2 className="text-lg font-semibold text-navy">Dernières photos</h2>
          </div>
          {kpis.dernieresPhotos.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune photo pour ce chantier.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {kpis.dernieresPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl border border-surface-dark bg-surface"
                >
                  <img
                    src={photo.url}
                    alt="Photo chantier"
                    className="aspect-video w-full object-cover"
                    loading="lazy"
                  />
                  <p className="truncate px-2 py-1.5 text-xs text-gray-500">
                    {formatDate(photo.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
