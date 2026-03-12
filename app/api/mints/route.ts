import { NextRequest, NextResponse } from 'next/server'
import { fetchActiveFreeMints } from '@/lib/alchemy'
import type { FreeMint, SortOrder } from '@/types/mint'

// Cache in-memory 60s → appels répétés instantanés sans re-fetch on-chain
interface CacheEntry { data: FreeMint[]; ts: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 60_000

async function getCachedMints(chains: string[], apiKey: string): Promise<FreeMint[]> {
  const key = chains.sort().join(',')
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.ts < CACHE_TTL) return hit.data
  const data = await fetchActiveFreeMints(chains, apiKey)
  cache.set(key, { data, ts: now })
  return data
}

// Seul ETH mainnet est actif — les autres chaînes ne sont pas activées sur la clé Alchemy
const ALL_CHAINS = ['ethereum']

function sortMints(mints: FreeMint[], sort: SortOrder): FreeMint[] {
  switch (sort) {
    case 'ending-soon':
      return [...mints].sort((a, b) => {
        const aEnd = a.mintStage.endTime ?? Infinity
        const bEnd = b.mintStage.endTime ?? Infinity
        return aEnd - bEnd
      })
    case 'minted':
      return [...mints].sort((a, b) => b.mintedCount - a.mintedCount)
    case 'supply':
      return [...mints].sort((a, b) => (b.totalSupply ?? 0) - (a.totalSupply ?? 0))
    case 'recent':
    default:
      return [...mints].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const chain = searchParams.get('chain') || 'all'
  const sort = (searchParams.get('sort') || 'recent') as SortOrder

  const chains = chain === 'all' ? ALL_CHAINS : [chain]
  const apiKey = process.env.ALCHEMY_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ALCHEMY_API_KEY not configured' },
      { status: 503 }
    )
  }

  try {
    const mints = await getCachedMints(chains, apiKey)
    const sorted = sortMints(mints, sort)

    return NextResponse.json(sorted, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('Mints API error:', error)
    return NextResponse.json({ error: 'Failed to fetch mints' }, { status: 500 })
  }
}
