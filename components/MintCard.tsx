'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ExternalLink, TrendingUp, Users, Zap, ShieldCheck } from 'lucide-react'
import { EligibilityBadge } from '@/components/EligibilityBadge'
import { MintButton } from '@/components/MintButton'
import { useEligibility, useActiveAddress } from '@/hooks/useEligibility'
import { useCountdown } from '@/hooks/useCountdown'
import { cn, CHAIN_COLORS, CHAIN_NAMES } from '@/lib/utils'
import type { FreeMint } from '@/types/mint'

const CHAIN_DOTS: Record<string, string> = {
  ethereum: '#627EEA',
  base: '#0052FF',
  zora: '#A456F0',
  optimism: '#FF0420',
  arbitrum: '#28A0F0',
  polygon: '#8247E5',
}

interface MintCardProps {
  mint: FreeMint
}

export function MintCard({ mint }: MintCardProps) {
  const { isConnected } = useAccount()
  const { address: activeAddress } = useActiveAddress()
  const { data: eligibility, isLoading: eligibilityLoading } = useEligibility(mint)
  const { timeLeft, endingSoon } = useCountdown(mint.mintStage.endTime)
  const [imgError, setImgError] = useState(false)

  const chainColor = CHAIN_DOTS[mint.chain] || '#6366f1'
  const chainName = CHAIN_NAMES[mint.chainId] || mint.chain
  const hasFloor = mint.floorPrice && mint.floorPrice > 0

  return (
    <div className={cn(
      'group relative flex flex-col rounded-2xl overflow-hidden',
      'border border-border bg-surface',
      'transition-all duration-200',
      'hover:border-border-2 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40',
      'animate-fade-in'
    )}>

      {/* Image — square */}
      <div className="relative aspect-square bg-surface-2 overflow-hidden">
        {!imgError ? (
          <Image
            src={mint.image}
            alt={mint.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${chainColor}18, ${chainColor}08)` }}
          >
            <span className="text-5xl font-black opacity-20" style={{ color: chainColor }}>
              {mint.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {/* FREE + ending */}
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-success/20 border border-success/30 px-2 py-0.5 text-xs font-bold text-success backdrop-blur-sm">
              <Zap size={9} fill="currentColor" />
              FREE MINT
            </span>
            {endingSoon && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-warning/20 border border-warning/30 px-2 py-0.5 text-xs font-semibold text-warning backdrop-blur-sm">
                ⚡ {timeLeft}
              </span>
            )}
          </div>

          {/* Chain badge */}
          <span
            className="inline-flex items-center gap-1 rounded-lg bg-background/60 border px-2 py-1 text-xs font-medium backdrop-blur-sm"
            style={{ borderColor: `${chainColor}40`, color: chainColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: chainColor }} />
            {chainName}
          </span>
        </div>

        {/* Hover overlay — mint CTA */}
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-3',
          'bg-background/70 backdrop-blur-sm',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
        )}>
          <MintButton mint={mint} eligibility={eligibility} compact />
        </div>

        {/* Eligibility — bottom right */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-0 pointer-events-none">
          {/* hidden on hover since overlay takes over */}
        </div>
      </div>

      {/* Info panel */}
      <div className="flex flex-col gap-3 p-4">

        {/* Name + external link */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-semibold text-text-primary text-sm leading-snug line-clamp-1">
              {mint.name}
            </h3>
            {mint.verified && (
              <ShieldCheck size={13} className="text-success shrink-0" aria-label="Collection vérifiée OpenSea" />
            )}
          </div>
          {mint.externalUrl && (
            <a
              href={mint.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-text-secondary transition-colors shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          {/* Minted count */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Users size={11} className="text-muted" />
            <span>{mint.mintedCount ? mint.mintedCount.toLocaleString() : '—'}</span>
            <span className="text-muted">minted</span>
          </div>

          {/* Floor price */}
          {hasFloor ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-success">
              <TrendingUp size={11} />
              {mint.floorPrice!.toFixed(mint.floorPrice! < 0.01 ? 5 : 4)} ETH
            </div>
          ) : (
            <span className="text-xs text-muted">No floor</span>
          )}
        </div>

        {/* Eligibility strip */}
        <div className="flex items-center justify-between pt-0.5 border-t border-border">
          <EligibilityBadge
            eligibility={eligibility}
            isLoading={eligibilityLoading}
            isConnected={isConnected}
            hasActiveAddress={!!activeAddress}
          />
          {mint.mintStage.endTime && !endingSoon && (
            <span className="text-xs text-muted">Ends in {timeLeft}</span>
          )}
          {!mint.mintStage.endTime && (
            <span className="text-xs text-muted">Open edition</span>
          )}
        </div>
      </div>
    </div>
  )
}
