'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useMissedMints } from '@/hooks/useMissedMints'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, CHAIN_NAMES } from '@/lib/utils'
import { TrendingUp, ExternalLink, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { MissedMint } from '@/lib/alchemy'

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  base: '#0052FF',
  zora: '#A456F0',
  optimism: '#FF0420',
  arbitrum: '#28A0F0',
  polygon: '#8247E5',
}

function formatEth(eth: number): string {
  if (eth >= 1) return `${eth.toFixed(3)} ETH`
  if (eth >= 0.01) return `${eth.toFixed(4)} ETH`
  return `${eth.toFixed(5)} ETH`
}

function MissedMintRow({ mint, rank }: { mint: MissedMint; rank: number }) {
  const [imgError, setImgError] = useState(false)
  const chainColor = CHAIN_COLORS[mint.chain] || '#6366f1'
  const chainName = CHAIN_NAMES[mint.chainId] || mint.chain
  const timeAgo = formatDistanceToNow(new Date(mint.lastSeenAt), { addSuffix: true })

  return (
    <div className={cn(
      'group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border bg-surface',
      'hover:border-border-2 hover:bg-surface-2 transition-all duration-150'
    )}>
      {/* Rank */}
      <span className="text-xs font-mono text-muted w-5 shrink-0 text-right">{rank}</span>

      {/* Thumbnail */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-2 shrink-0">
        {!imgError ? (
          <Image
            src={mint.image}
            alt={mint.name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xs font-bold opacity-40"
            style={{ color: chainColor }}
          >
            {mint.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {mint.name}
          </span>
          <span
            className="inline-flex items-center gap-1 shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
            style={{ borderColor: `${chainColor}40`, color: chainColor }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: chainColor }} />
            {chainName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted">
          <Clock size={9} />
          {timeAgo}
          {mint.mintedTotal && (
            <>
              <span>·</span>
              <span>{mint.mintedTotal.toLocaleString()} minted</span>
            </>
          )}
        </div>
      </div>

      {/* Floor price */}
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 justify-end text-success">
          <TrendingUp size={12} />
          <span className="text-sm font-bold">{formatEth(mint.floorPriceEth)}</span>
        </div>
        <div className="text-[10px] text-success/60 mt-0.5">
          gratuit → {formatEth(mint.floorPriceEth)}
        </div>
      </div>

      {/* Link */}
      {mint.externalUrl && (
        <a
          href={mint.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  )
}

export function MissedMintsSection() {
  const { data: missed, isLoading, isError } = useMissedMints()
  const [expanded, setExpanded] = useState(false)

  const displayed = expanded ? missed : missed?.slice(0, 6)

  if (isError) return null
  if (!isLoading && (!missed || missed.length === 0)) return null

  const best = missed?.[0]

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Tu as raté ces free mints
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Étaient gratuits · ont maintenant de la valeur
          </p>
        </div>
        {!isLoading && best && (
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-xs">
            <TrendingUp size={12} className="text-success" />
            <span className="text-text-secondary">Meilleure opportunité :</span>
            <span className="font-bold text-success">{formatEth(best.floorPriceEth)}</span>
            <span className="text-muted">— {best.name}</span>
          </div>
        )}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[20px_40px_1fr_auto_auto] gap-4 items-center px-4 pb-1 border-b border-border">
        <span className="text-[10px] text-muted">#</span>
        <span />
        <span className="text-[10px] text-muted uppercase tracking-wide">Collection</span>
        <span className="text-[10px] text-muted uppercase tracking-wide text-right">Floor</span>
        <span className="w-5" />
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[62px] w-full rounded-xl" />
            ))
          : displayed?.map((mint, i) => (
              <MissedMintRow key={mint.id} mint={mint} rank={i + 1} />
            ))}
      </div>

      {/* Show more */}
      {!isLoading && missed && missed.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs text-muted hover:text-text-primary border border-border hover:border-border-2 hover:bg-surface transition-all"
        >
          {expanded ? (
            <><ChevronUp size={13} /> Voir moins</>
          ) : (
            <><ChevronDown size={13} /> Voir les {missed.length - 6} autres</>
          )}
        </button>
      )}
    </section>
  )
}
