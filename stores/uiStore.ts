import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Chain, SortOrder } from '@/types/mint'

interface UIStore {
  selectedChain: Chain | 'all'
  sortOrder: SortOrder
  searchQuery: string
  verifiedOnly: boolean
  // Adresse surveillée en lecture seule (sans connexion wallet)
  watchedAddress: string
  // Contrats ajoutés manuellement à la watchlist
  watchedContracts: string[]
  setSelectedChain: (chain: Chain | 'all') => void
  setSortOrder: (sort: SortOrder) => void
  setSearchQuery: (query: string) => void
  setVerifiedOnly: (value: boolean) => void
  setWatchedAddress: (address: string) => void
  clearWatchedAddress: () => void
  addWatchedContract: (address: string) => void
  removeWatchedContract: (address: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      selectedChain: 'ethereum',
      sortOrder: 'recent',
      searchQuery: '',
      verifiedOnly: false,
      watchedAddress: '',
      watchedContracts: [],
      setSelectedChain: (chain) => set({ selectedChain: chain }),
      setSortOrder: (sort) => set({ sortOrder: sort }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setVerifiedOnly: (value) => set({ verifiedOnly: value }),
      setWatchedAddress: (address) => set({ watchedAddress: address }),
      clearWatchedAddress: () => set({ watchedAddress: '' }),
      addWatchedContract: (address) => {
        const norm = address.toLowerCase()
        if (!get().watchedContracts.includes(norm)) {
          set({ watchedContracts: [...get().watchedContracts, norm] })
        }
      },
      removeWatchedContract: (address) => {
        const norm = address.toLowerCase()
        set({ watchedContracts: get().watchedContracts.filter((a) => a !== norm) })
      },
    }),
    {
      name: 'freeminty-ui',
      partialize: (state) => ({
        watchedAddress: state.watchedAddress,
        watchedContracts: state.watchedContracts,
        verifiedOnly: state.verifiedOnly,
      }),
    }
  )
)
