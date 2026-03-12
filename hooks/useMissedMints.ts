'use client'

import { useQuery } from '@tanstack/react-query'
import { useUIStore } from '@/stores/uiStore'
import type { MissedMint } from '@/lib/alchemy'

async function fetchMissedMints(chain: string): Promise<MissedMint[]> {
  const params = new URLSearchParams({ chain })
  const res = await fetch(`/api/mints/missed?${params}`)
  if (!res.ok) throw new Error('Failed to fetch missed mints')
  return res.json()
}

export function useMissedMints() {
  const selectedChain = useUIStore((s) => s.selectedChain)

  return useQuery({
    queryKey: ['missed-mints', selectedChain],
    queryFn: () => fetchMissedMints(selectedChain),
    staleTime: 5 * 60_000, // 5 min
    gcTime: 10 * 60_000,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
  })
}
