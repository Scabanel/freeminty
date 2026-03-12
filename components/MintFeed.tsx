'use client'

import { MintCard } from '@/components/MintCard'
import { MintCardSkeleton } from '@/components/ui/Skeleton'
import { FilterBar } from '@/components/FilterBar'
import { useMints } from '@/hooks/useMints'
import { RefreshCw, SearchX, Wifi } from 'lucide-react'

export function MintFeed() {
  const { mints, isLoading, isError, refetch, isFetching } = useMints()

  // Skeleton uniquement au TOUT premier chargement (pas de données du tout)
  const showSkeleton = isLoading && mints.length === 0

  return (
    <div className="space-y-6">
      {/* Filters + refresh indicator */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <FilterBar />
        </div>
        {isFetching && !showSkeleton && (
          <RefreshCw size={13} className="shrink-0 text-muted animate-spin" />
        )}
      </div>

      {/* Loading skeleton — premier chargement uniquement */}
      {showSkeleton && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MintCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error — pas de données du tout */}
      {isError && mints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-danger/8 flex items-center justify-center">
            <Wifi size={22} className="text-danger/70" />
          </div>
          <div className="text-center">
            <p className="text-text-primary font-medium">Impossible de charger les mints</p>
            <p className="text-muted text-xs mt-1">Vérifie ta connexion ou la clé API</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl px-4 py-2 bg-surface border border-border text-sm text-text-secondary hover:border-border-2 transition-colors"
          >
            <RefreshCw size={13} />
            Réessayer
          </button>
        </div>
      )}

      {/* Empty state */}
      {!showSkeleton && !isError && mints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center">
            <SearchX size={22} className="text-muted" />
          </div>
          <div className="text-center">
            <p className="text-text-primary font-medium">Aucun free mint trouvé</p>
            <p className="text-muted text-xs mt-1">Essaie une autre chaîne ou reviens plus tard</p>
          </div>
        </div>
      )}

      {/* Mints grid — données disponibles (même si refetch en cours) */}
      {mints.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mints.map((mint) => (
            <MintCard key={mint.id} mint={mint} />
          ))}
        </div>
      )}
    </div>
  )
}
