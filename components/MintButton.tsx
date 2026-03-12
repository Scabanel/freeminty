'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useMint } from '@/hooks/useMint'
import { useActiveAddress } from '@/hooks/useEligibility'
import { cn } from '@/lib/utils'
import { Loader2, Zap, CheckCircle, ExternalLink, Eye } from 'lucide-react'
import type { FreeMint, EligibilityResult } from '@/types/mint'

interface MintButtonProps {
  mint: FreeMint
  eligibility?: EligibilityResult
  className?: string
  compact?: boolean
}

export function MintButton({ mint, eligibility, className, compact }: MintButtonProps) {
  const baseClass = compact
    ? 'flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold'
    : 'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium'
  const { isConnected } = useAccount()
  const { isReadOnly } = useActiveAddress()
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { mint: executeMint, state } = useMint(mint, eligibility)

  // Mode lecture seule : adresse entrée manuellement, pas de wallet connecté
  if (isReadOnly) {
    return (
      <button
        disabled
        className={cn(
          baseClass,
          'bg-accent/8 border border-accent/20 text-accent/70 text-sm font-medium cursor-not-allowed',
          className
        )}
      >
        <Eye size={14} />
        Connect wallet to mint
      </button>
    )
  }

  if (!isConnected) {
    return (
      <button
        disabled
        className={cn(
          baseClass,
          'bg-surface-2 text-muted text-sm font-medium cursor-not-allowed',
          className
        )}
      >
        Connect wallet to mint
      </button>
    )
  }

  // Wrong chain
  if (currentChainId !== mint.chainId) {
    return (
      <button
        onClick={() => switchChain({ chainId: mint.chainId })}
        className={cn(
          baseClass,
          'bg-warning/10 border border-warning/30 text-warning text-sm font-semibold',
          'hover:bg-warning/20 transition-colors',
          className
        )}
      >
        Switch network
      </button>
    )
  }

  // Not eligible
  if (eligibility && !eligibility.eligible && eligibility.strategy !== 'allowlist') {
    return (
      <button
        disabled
        className={cn(
          baseClass,
          'bg-surface-2 text-muted text-sm font-medium cursor-not-allowed',
          className
        )}
      >
        Not eligible
      </button>
    )
  }

  // Allowlist — redirect to project site
  if (eligibility?.strategy === 'allowlist') {
    return (
      <a
        href={mint.externalUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          baseClass,
          'bg-accent/10 border border-accent/30 text-accent text-sm font-semibold',
          'hover:bg-accent/20 transition-colors',
          className
        )}
      >
        Check allowlist
        <ExternalLink size={14} />
      </a>
    )
  }

  if (state === 'success') {
    return (
      <button
        disabled
        className={cn(
          baseClass,
          'bg-success/10 border border-success/30 text-success text-sm font-semibold',
          className
        )}
      >
        <CheckCircle size={16} />
        Minted!
      </button>
    )
  }

  const isLoading = state === 'simulating' || state === 'confirming' || state === 'pending'

  const loadingLabel = {
    simulating: 'Simulating…',
    confirming: 'Confirm in wallet…',
    pending: 'Pending…',
  }[state as string] || 'Mint Free'

  return (
    <button
      onClick={executeMint}
      disabled={isLoading}
      className={cn(
        baseClass,
        'bg-primary text-white text-sm font-semibold',
        'hover:bg-primary-hover transition-all duration-200',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'shadow-lg shadow-primary/20 hover:shadow-primary/30',
        'active:scale-95',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          <Zap size={16} />
          Mint Free
        </>
      )}
    </button>
  )
}
