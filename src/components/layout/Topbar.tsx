import { Menu, LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { ChantierSelector } from '../ChantierSelector'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, profile, signOut } = useAuthStore()

  const displayName =
    profile?.full_name ?? user?.email?.split('@')[0] ?? 'Utilisateur'

  return (
    <header className="sticky top-0 z-30 border-b border-surface-dark bg-white/90 backdrop-blur-md">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-dark text-navy transition hover:bg-surface sm:hidden"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <ChantierSelector />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-navy">{displayName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-dark text-navy transition hover:border-accent-blue hover:text-accent-blue"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
