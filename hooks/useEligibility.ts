'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useUIStore } from '@/stores/uiStore'
import type { FreeMint, EligibilityResult } from '@/types/mint'

async function fetchEligibility(mintId: string, address: string): Promise<EligibilityResult> {
  const res = await fetch(`/api/eligibility/${address}?mintId=${mintId}`)
  if (!res.ok) throw new Error('Failed to check eligibility')
  return res.json()
}

export function useActiveAddress(): { address: string | undefined; isReadOnly: boolean } {
  const { address: connectedAddress, isConnected } = useAccount()
  const watchedAddress = useUIStore((s) => s.watchedAddress)

  if (isConnected && connectedAddress) {
    return { address: connectedAddress, isReadOnly: false }
  }
  if (watchedAddress) {
    return { address: watchedAddress, isReadOnly: true }
  }
  return { address: undefined, isReadOnly: false }
}

export function useEligibility(mint: FreeMint) {
  const { address } = useActiveAddress()

  return useQuery({
    queryKey: ['eligibility', mint.id, address],
    queryFn: () => fetchEligibility(mint.id, address!),
    enabled: !!address,
    staleTime: 60_000,
    gcTime: 120_000,
    refetchInterval: false,
  })
}
