import { useState, type FormEvent } from 'react'
import { HardHat, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

type Mode = 'login' | 'signup'

export function LoginPage() {
  const { signIn, signUp, loading } = useAuthStore()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (mode === 'login') {
      const result = await signIn(email, password)
      if (result.error) setError(result.error)
      return
    }

    const result = await signUp(email, password, fullName, company)
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo('Compte créé. Vérifiez votre email si la confirmation est activée, puis connectez-vous.')
    setMode('login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy-light to-accent-blue p-4">
      <div className="animate-fade-in w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan shadow-lg">
            <HardHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Simply</h1>
          <p className="mt-1 text-sm text-gray-500">Suivi de chantier BTP</p>
        </div>

        <div className="mb-6 flex rounded-xl bg-surface p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === 'login' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === 'signup' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
            }`}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-navy">
                  Nom complet
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 w-full rounded-xl border border-surface-dark px-4 text-sm transition focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-navy">
                  Entreprise
                </label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-12 w-full rounded-xl border border-surface-dark px-4 text-sm transition focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                  placeholder="Mon entreprise BTP"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-surface-dark px-4 text-sm transition focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              placeholder="vous@entreprise.fr"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-surface-dark px-4 text-sm transition focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {info && (
            <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  )
}
