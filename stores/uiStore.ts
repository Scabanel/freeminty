import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Chain, SortOrder } from '@/types/mint'

interface UIStore {
  selectedChain: Chain | 'all'
  sortOrder: SortOrder
  searchQuery: string
  // Adresse surveillée en lecture seule (sans connexion wallet)
  watchedAddress: string
  setSelectedChain: (chain: Chain | 'all') => void
  setSortOrder: (sort: SortOrder) => void
  setSearchQuery: (query: string) => void
  setWatchedAddress: (address: string) => void
  clearWatchedAddress: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      selectedChain: 'ethereum',
      sortOrder: 'recent',
      searchQuery: '',
      watchedAddress: '',
      setSelectedChain: (chain) => set({ selectedChain: chain }),
      setSortOrder: (sort) => set({ sortOrder: sort }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setWatchedAddress: (address) => set({ watchedAddress: address }),
      clearWatchedAddress: () => set({ watchedAddress: '' }),
    }),
    {
      name: 'freeminty-ui',
      partialize: (state) => ({ watchedAddress: state.watchedAddress }),
    }
  )
)
