import { NextRequest, NextResponse } from 'next/server'
import { fetchMissedFreeMints, type MissedMint } from '@/lib/alchemy'

const ALL_CHAINS = ['ethereum', 'base', 'optimism', 'arbitrum', 'polygon']

// Cache in-memory 5min — les missed mints changent peu
interface CacheEntry { data: MissedMint[]; ts: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60_000

async function getCachedMissed(chains: string[], apiKey: string): Promise<MissedMint[]> {
  const key = chains.sort().join(',')
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.ts < CACHE_TTL) return hit.data
  const data = await fetchMissedFreeMints(chains, apiKey)
  cache.set(key, { data, ts: now })
  return data
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const chain = searchParams.get('chain') || 'all'
  const chains = chain === 'all' ? ALL_CHAINS : [chain]

  const apiKey = process.env.ALCHEMY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ALCHEMY_API_KEY not configured' }, { status: 503 })
  }

  try {
    const missed = await getCachedMissed(chains, apiKey)
    return NextResponse.json(missed, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Missed mints API error:', error)
    return NextResponse.json({ error: 'Failed to fetch missed mints' }, { status: 500 })
  }
}
