'use client'

import { ShieldCheck } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import type { SortOrder } from '@/types/mint'
import { useEffect, useState } from 'react'

const SORTS: { value: SortOrder; label: string }[] = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'minted', label: 'Plus populaire' },
  { value: 'ending-soon', label: 'Se termine bientôt' },
]

export function FilterBar() {
  const { sortOrder, setSortOrder, verifiedOnly, setVerifiedOnly } = useUIStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Sort tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {SORTS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSortOrder(s.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
              sortOrder === s.value
                ? 'bg-primary/15 border border-primary/30 text-primary'
                : 'border border-border text-text-secondary hover:bg-surface-2 hover:border-border-2'
            )}
          >
            {s.label}
          </button>
        ))}

        {/* Verified-only toggle */}
        <button
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
            mounted && verifiedOnly
              ? 'bg-success/15 border border-success/40 text-success'
              : 'border border-border text-text-secondary hover:bg-surface-2 hover:border-border-2'
          )}
          title="Afficher uniquement les collections vérifiées OpenSea"
        >
          <ShieldCheck size={12} />
          Vérifié
        </button>
      </div>

      {/* ETH badge */}
      <span className="flex items-center gap-1.5 text-xs text-text-secondary border border-border rounded-full px-3 py-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#627EEA]" />
        Ethereum
      </span>
    </div>
  )
}
