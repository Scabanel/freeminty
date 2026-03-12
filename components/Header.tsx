'use client'

import { Flame, RefreshCw, Search } from 'lucide-react'
import { WalletConnect } from '@/components/WalletConnect'
import { useMints, useLastRefresh } from '@/hooks/useMints'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function Header() {
  const { refetch, isFetching, dataUpdatedAt, mints } = useMints()
  const lastRefresh = useLastRefresh(dataUpdatedAt)
  const { searchQuery, setSearchQuery } = useUIStore()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Flame size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-text-primary tracking-tight">
              free<span className="text-primary">minty</span>
            </span>
          </div>

          {/* Search — center */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search collections…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-4 py-2 rounded-xl text-sm',
                  'bg-surface border border-border',
                  'text-text-primary placeholder:text-muted',
                  'focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
                  'transition-colors'
                )}
              />
            </div>
          </div>

          {/* Live indicator */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="hidden md:flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 shrink-0"
          >
            {isFetching ? (
              <RefreshCw size={12} className="animate-spin text-primary" />
            ) : (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            )}
            <span className="font-medium text-text-primary">{mints.length}</span>
            <span>live · {isFetching ? 'syncing…' : lastRefresh}</span>
          </button>

          {/* Wallet */}
          <div className="shrink-0">
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  )
}
