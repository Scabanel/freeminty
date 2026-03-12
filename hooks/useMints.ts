'use client'

import { useQuery } from '@tanstack/react-query'
import { useUIStore } from '@/stores/uiStore'
import type { FreeMint } from '@/types/mint'
import { useMemo } from 'react'

async function fetchMints(chain: string, sort: string): Promise<FreeMint[]> {
  const params = new URLSearchParams({ chain, sort })
  const res = await fetch(`/api/mints?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch mints')
  return res.json()
}

export function useMints() {
  const { sortOrder, searchQuery, verifiedOnly } = useUIStore()

  const query = useQuery({
    queryKey: ['mints', 'ethereum', sortOrder],
    queryFn: () => fetchMints('ethereum', sortOrder),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 55_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  })

  const filteredMints = useMemo(() => {
    if (!query.data) return []
    let results = query.data
    if (verifiedOnly) results = results.filter((m) => m.verified)
    const q = searchQuery.toLowerCase().trim()
    if (!q) return results
    return results.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.contractAddress.toLowerCase().includes(q) ||
        m.chain.toLowerCase().includes(q)
    )
  }, [query.data, searchQuery, verifiedOnly])

  return {
    ...query,
    mints: filteredMints,
  }
}

export function useLastRefresh(dataUpdatedAt: number) {
  const secondsAgo = Math.floor((Date.now() - dataUpdatedAt) / 1000)
  if (secondsAgo < 5) return 'Just now'
  if (secondsAgo < 60) return `${secondsAgo}s ago`
  return `${Math.floor(secondsAgo / 60)}m ago`
}
