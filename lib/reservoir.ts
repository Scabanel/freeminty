import type { FreeMint, Chain } from '@/types/mint'
import type { ReservoirCollection, ReservoirCollectionsResponse } from '@/types/reservoir'
import { CHAIN_FROM_ID } from '@/lib/utils'

const RESERVOIR_BASE_URLS: Record<string, string> = {
  ethereum: 'https://api.reservoir.tools',
  base: 'https://base-api.reservoir.tools',
  zora: 'https://zora-api.reservoir.tools',
  optimism: 'https://optimism-api.reservoir.tools',
  arbitrum: 'https://arbitrum-api.reservoir.tools',
  polygon: 'https://polygon-api.reservoir.tools',
}

const RESERVOIR_CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  zora: 7777777,
  optimism: 10,
  arbitrum: 42161,
  polygon: 137,
}

async function fetchReservoirChain(chain: string, apiKey: string): Promise<FreeMint[]> {
  const baseUrl = RESERVOIR_BASE_URLS[chain]
  if (!baseUrl) return []

  const url = new URL(`${baseUrl}/collections/v7`)
  url.searchParams.set('includeMintStages', 'true')
  url.searchParams.set('mintable', 'true')
  url.searchParams.set('limit', '20')
  url.searchParams.set('sortBy', 'mintedCount')

  const res = await fetch(url.toString(), {
    headers: {
      'x-api-key': apiKey || 'demo',
      accept: '*/*',
    },
    next: { revalidate: 30 },
  })

  if (!res.ok) {
    console.error(`Reservoir ${chain} error:`, res.status, await res.text())
    return []
  }

  const data: ReservoirCollectionsResponse = await res.json()
  const now = Date.now() / 1000
  const chainId = RESERVOIR_CHAIN_IDS[chain] || 1

  const mints: FreeMint[] = []

  for (const col of data.collections || []) {
    // Find active free mint stage
    const freeStage = col.mintStages?.find(
      (stage) =>
        (stage.price?.amount?.native === 0 || stage.price?.amount?.raw === '0') &&
        (stage.startTime == null || stage.startTime <= now) &&
        (stage.endTime == null || stage.endTime > now)
    )

    if (!freeStage) continue

    const chainName = (CHAIN_FROM_ID[chainId] || 'ethereum') as Chain

    mints.push({
      id: `reservoir-${chain}-${col.id}`,
      name: col.name || 'Unknown Collection',
      description: col.description,
      image: col.image || '/placeholder-nft.png',
      bannerImage: col.banner,
      contractAddress: col.primaryContract,
      chain: chainName,
      chainId,
      contractKind: col.contractKind || 'erc721',
      tokenId: freeStage.tokenId,
      mintStage: {
        kind: freeStage.kind === 'allowlist' ? 'allowlist' : 'public',
        price: '0',
        startTime: freeStage.startTime || 0,
        endTime: freeStage.endTime || null,
        maxMintsPerWallet: freeStage.maxMintsPerWallet || null,
        allowlistId: freeStage.allowlistId,
      },
      totalSupply: col.tokenCount ? parseInt(col.tokenCount) : null,
      mintedCount: 0,
      floorPrice: col.floorAsk?.price?.amount?.native,
      twitterUrl: col.twitterUrl,
      discordUrl: col.discordUrl,
      externalUrl: col.externalUrl,
      createdAt: col.createdAt,
      source: 'reservoir',
    })
  }

  return mints
}

export async function fetchAllFreeMints(
  chains: string[],
  apiKey: string
): Promise<FreeMint[]> {
  const results = await Promise.allSettled(
    chains.map((chain) => fetchReservoirChain(chain, apiKey))
  )

  const allMints: FreeMint[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allMints.push(...result.value)
    }
  }

  // Deduplicate by contract address
  const seen = new Set<string>()
  return allMints.filter((m) => {
    const key = `${m.chainId}-${m.contractAddress.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchReservoirMintsByRecency(
  chains: string[],
  apiKey: string
): Promise<FreeMint[]> {
  const results = await Promise.allSettled(
    chains.map(async (chain) => {
      const baseUrl = RESERVOIR_BASE_URLS[chain]
      if (!baseUrl) return []

      const url = new URL(`${baseUrl}/collections/v7`)
      url.searchParams.set('includeMintStages', 'true')
      url.searchParams.set('mintable', 'true')
      url.searchParams.set('limit', '10')
      url.searchParams.set('sortBy', 'createdAt')

      const res = await fetch(url.toString(), {
        headers: { 'x-api-key': apiKey || 'demo' },
        next: { revalidate: 30 },
      })

      if (!res.ok) return []
      const data: ReservoirCollectionsResponse = await res.json()

      const now = Date.now() / 1000
      const chainId = RESERVOIR_CHAIN_IDS[chain] || 1

      return (data.collections || [])
        .filter((col: ReservoirCollection) =>
          col.mintStages?.some(
            (s) =>
              (s.price?.amount?.native === 0 || s.price?.amount?.raw === '0') &&
              (s.endTime == null || s.endTime > now)
          )
        )
        .map((col: ReservoirCollection) => {
          const chainName = (CHAIN_FROM_ID[chainId] || 'ethereum') as Chain
          const freeStage = col.mintStages!.find(
            (s) =>
              (s.price?.amount?.native === 0 || s.price?.amount?.raw === '0') &&
              (s.endTime == null || s.endTime > now)
          )!
          return {
            id: `reservoir-recent-${chain}-${col.id}`,
            name: col.name,
            description: col.description,
            image: col.image || '/placeholder-nft.png',
            contractAddress: col.primaryContract,
            chain: chainName,
            chainId,
            contractKind: col.contractKind || 'erc721',
            mintStage: {
              kind: freeStage.kind === 'allowlist' ? ('allowlist' as const) : ('public' as const),
              price: '0',
              startTime: freeStage.startTime || 0,
              endTime: freeStage.endTime || null,
              maxMintsPerWallet: freeStage.maxMintsPerWallet || null,
              allowlistId: freeStage.allowlistId,
            },
            totalSupply: col.tokenCount ? parseInt(col.tokenCount) : null,
            mintedCount: 0,
            floorPrice: col.floorAsk?.price?.amount?.native,
            twitterUrl: col.twitterUrl,
            discordUrl: col.discordUrl,
            externalUrl: col.externalUrl,
            createdAt: col.createdAt,
            source: 'reservoir' as const,
          }
        })
    })
  )

  const all: FreeMint[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }
  return all
}
