'use client'

import { TrendingUp, Clock, Timer, ChevronDown } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import type { SortOrder } from '@/types/mint'

const SORTS: { value: SortOrder; label: string }[] = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'minted', label: 'Plus populaire' },
  { value: 'ending-soon', label: 'Se termine bientôt' },
]

export function FilterBar() {
  const { sortOrder, setSortOrder } = useUIStore()

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Sort tabs */}
      <div className="flex items-center gap-1.5">
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
      </div>

      {/* ETH badge */}
      <span className="flex items-center gap-1.5 text-xs text-text-secondary border border-border rounded-full px-3 py-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#627EEA]" />
        Ethereum
      </span>
    </div>
  )
}
