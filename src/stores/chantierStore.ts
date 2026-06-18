import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Chantier } from '../types/database'
import { fetchChantiers as loadChantiers } from '../services/chantiers'

interface ChantierState {
  chantiers: Chantier[]
  selectedId: string | null
  loading: boolean
  error: string | null
  fetchChantiers: () => Promise<void>
  selectChantier: (id: string) => void
  selectedChantier: () => Chantier | null
}

export const useChantierStore = create<ChantierState>()(
  persist(
    (set, get) => ({
      chantiers: [],
      selectedId: null,
      loading: false,
      error: null,

      fetchChantiers: async () => {
        set({ loading: true, error: null })

        const { chantiers, error } = await loadChantiers()

        if (error) {
          set({ loading: false, error })
          return
        }

        const currentId = get().selectedId
        const stillValid = chantiers.some((c) => c.id === currentId)

        set({
          chantiers,
          loading: false,
          selectedId: stillValid ? currentId : chantiers[0]?.id ?? null,
        })
      },

      selectChantier: (id) => set({ selectedId: id }),

      selectedChantier: () => {
        const { chantiers, selectedId } = get()
        return chantiers.find((c) => c.id === selectedId) ?? null
      },
    }),
    {
      name: 'simply-chantier',
      partialize: (state) => ({ selectedId: state.selectedId }),
    },
  ),
)
