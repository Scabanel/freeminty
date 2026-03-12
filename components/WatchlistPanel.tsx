'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { isAddress } from 'viem'
import { useAccount } from 'wagmi'
import { Plus, Trash2, ExternalLink, ShieldCheck, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useActiveAddress } from '@/hooks/useEligibility'
import { cn } from '@/lib/utils'
import type { EligibilityResult } from '@/types/mint'

interface ContractStatus {
  contractAddress: string
  name: string | null
  image: string | null
  collectionSlug: string | null
  externalUrl: string | null
  floorPrice: number | null
  totalSupply: string | null
  verified: boolean
  eligibility: EligibilityResult | null
  error?: string
}

async function fetchWatchlistStatuses(
  walletAddress: string,
  contracts: string[]
): Promise<ContractStatus[]> {
  if (contracts.length === 0) return []
  const params = new URLSearchParams({ contracts: contracts.join(',') })
  const res = await fetch(`/api/watchlist/${walletAddress}?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch watchlist')
  return res.json()
}

function EligibilityIcon({ eligibility }: { eligibility: EligibilityResult | null }) {
  if (!eligibility) return <HelpCircle size={14} className="text-muted" />
  if (eligibility.eligible) return <CheckCircle size={14} className="text-success" />
  if (eligibility.strategy === 'allowlist') return <HelpCircle size={14} className="text-warning" aria-label="Allowlist" />
  return <XCircle size={14} className="text-red-400" />
}

export function WatchlistPanel() {
  const { isConnected } = useAccount()
  const { address: activeAddress } = useActiveAddress()
  const { watchedContracts, addWatchedContract, removeWatchedContract } = useUIStore()
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const walletAddress = (activeAddress as string | undefined) || ''

  // All hooks must be called unconditionally before any early return
  const { data: statuses, isLoading, refetch } = useQuery({
    queryKey: ['watchlist', walletAddress, watchedContracts],
    queryFn: () => fetchWatchlistStatuses(walletAddress, watchedContracts),
    enabled: mounted && !!walletAddress && watchedContracts.length > 0,
    staleTime: 55_000,
    placeholderData: (prev) => prev,
  })

  function handleAdd() {
    const val = input.trim()
    if (!isAddress(val)) {
      setInputError('Adresse de contrat invalide (format 0x…)')
      return
    }
    setInputError('')
    addWatchedContract(val)
    setInput('')
  }

  // Defer all rendering until after hydration
  if (!mounted) return null

  if (!isConnected && !activeAddress) {
    return (
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Watchlist contrats</h2>
        <p className="text-sm text-text-secondary">
          Connectez votre wallet ou entrez une adresse pour vérifier l&apos;éligibilité de vos contrats favoris.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-text-primary">Watchlist contrats</h2>
        {watchedContracts.length > 0 && (
          <button
            onClick={() => refetch()}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Actualiser
          </button>
        )}
      </div>

      {/* Add contract input */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setInputError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="0x… adresse du contrat NFT"
            className={cn(
              'w-full rounded-xl border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-muted',
              'focus:outline-none focus:ring-2 focus:ring-primary/40',
              inputError ? 'border-red-400/60' : 'border-border'
            )}
          />
          {inputError && <p className="text-xs text-red-400">{inputError}</p>}
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary/15 border border-primary/30 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/25 transition-colors shrink-0"
        >
          <Plus size={13} />
          Ajouter
        </button>
      </div>

      {/* Contract list */}
      {watchedContracts.length === 0 && (
        <p className="text-sm text-muted py-2">Aucun contrat dans la watchlist.</p>
      )}

      {watchedContracts.length > 0 && (
        <div className="space-y-2">
          {isLoading && !statuses && (
            <div className="flex items-center gap-2 text-sm text-text-secondary py-2">
              <Loader2 size={14} className="animate-spin" />
              Vérification en cours…
            </div>
          )}

          {watchedContracts.map((addr) => {
            const status = statuses?.find((s) => s.contractAddress.toLowerCase() === addr)

            return (
              <div
                key={addr}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
              >
                {/* Thumbnail */}
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-2 shrink-0">
                  {status?.image ? (
                    <Image src={status.image} alt={status.name || addr} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-muted">
                      {(status?.name || addr).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {status?.name || `${addr.slice(0, 6)}…${addr.slice(-4)}`}
                    </span>
                    {status?.verified && (
                      <ShieldCheck size={12} className="text-success shrink-0" aria-label="Vérifié OpenSea" />
                    )}
                    {isLoading && (
                      <Loader2 size={12} className="text-muted animate-spin shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <EligibilityIcon eligibility={status?.eligibility ?? null} />
                    <span className="text-xs text-text-secondary">
                      {!status
                        ? 'Chargement…'
                        : status.error
                        ? status.error
                        : status.eligibility?.eligible
                        ? 'Eligible au mint'
                        : status.eligibility?.strategy === 'allowlist'
                        ? 'Allowlist — vérifiez le site'
                        : status.eligibility?.reason || 'Non éligible'}
                    </span>
                    {status?.floorPrice && status.floorPrice > 0 && (
                      <span className="text-xs text-success font-medium ml-1">
                        {status.floorPrice.toFixed(4)} ETH
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {status?.externalUrl && (
                    <a
                      href={status.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-text-secondary transition-colors"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => removeWatchedContract(addr)}
                    className="text-muted hover:text-red-400 transition-colors"
                    title="Retirer de la watchlist"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
