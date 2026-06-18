import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Simply error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6">
          <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
            <h1 className="text-xl font-bold text-navy">Erreur au chargement</h1>
            <p className="mt-3 text-sm text-gray-600">{this.state.error.message}</p>
            <p className="mt-4 text-xs text-gray-500">
              Vérifiez les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sur Vercel, puis
              redéployez.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
