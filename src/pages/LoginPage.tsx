import { useState, type FormEvent } from 'react'
import { HardHat, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const { signIn, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy-light to-accent-blue p-4">
      <div className="animate-fade-in w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan shadow-lg">
            <HardHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Simply</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connectez-vous avec votre compte Operis
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-surface-dark px-4 text-sm transition focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
