import type { FreeMint, Chain } from '@/types/mint'

// Alchemy RPC hosts — only ETH mainnet is enabled on this key
// Other chains fall back to NFT API search
const ALCHEMY_RPC: Record<string, { rpcHost: string; nftHost: string; chainId: number; blocksPerDay: number }> = {
  ethereum: { rpcHost: 'eth-mainnet', nftHost: 'eth-mainnet', chainId: 1, blocksPerDay: 7200 },
  base: { rpcHost: 'base-mainnet', nftHost: 'base-mainnet', chainId: 8453, blocksPerDay: 43200 },
  optimism: { rpcHost: 'opt-mainnet', nftHost: 'opt-mainnet', chainId: 10, blocksPerDay: 43200 },
  arbitrum: { rpcHost: 'arb-mainnet', nftHost: 'arb-mainnet', chainId: 42161, blocksPerDay: 375000 },
  polygon: { rpcHost: 'polygon-mainnet', nftHost: 'polygon-mainnet', chainId: 137, blocksPerDay: 43200 },
}

const EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
  10: 'https://optimistic.etherscan.io',
  42161: 'https://arbiscan.io',
  137: 'https://polygonscan.com',
}

// --- On-chain free mint discovery ---

interface AlchemyTransfer {
  hash: string
  rawContract: { address: string }
  category: string
  metadata: { blockTimestamp: string }
}

interface AlchemyTx {
  hash: string
  value: string // hex
  to: string | null
}

async function rpcCall<T>(host: string, apiKey: string, method: string, params: unknown[]): Promise<T | null> {
  try {
    const res = await fetch(`https://${host}.g.alchemy.com/v2/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.result as T
  } catch {
    return null
  }
}

async function getRecentMintTransfers(
  rpcHost: string,
  apiKey: string,
  blocksBack: number
): Promise<AlchemyTransfer[]> {
  const blockHex = await rpcCall<string>(rpcHost, apiKey, 'eth_blockNumber', [])
  if (!blockHex) return []

  const currentBlock = parseInt(blockHex, 16)
  const fromBlock = '0x' + Math.max(0, currentBlock - blocksBack).toString(16)

  const result = await rpcCall<{ transfers: AlchemyTransfer[] }>(rpcHost, apiKey, 'alchemy_getAssetTransfers', [{
    fromBlock,
    toBlock: 'latest',
    fromAddress: '0x0000000000000000000000000000000000000000',
    category: ['erc721', 'erc1155'],
    maxCount: '0x1f4', // 500 transfers — enough diversity across active contracts
    order: 'desc',    // most recent first → freshest lastMintAt timestamps
    withMetadata: true,
    excludeZeroValue: false,
  }])

  return result?.transfers || []
}

async function batchGetTxValues(
  rpcHost: string,
  apiKey: string,
  hashes: string[]
): Promise<Map<string, bigint>> {
  const result = new Map<string, bigint>()
  if (hashes.length === 0) return result

  const batch = hashes.map((hash, i) => ({
    jsonrpc: '2.0',
    method: 'eth_getTransactionByHash',
    params: [hash],
    id: i,
  }))

  try {
    const res = await fetch(`https://${rpcHost}.g.alchemy.com/v2/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
      next: { revalidate: 0 },
    })
    if (!res.ok) return result
    const data: Array<{ id: number; result: AlchemyTx | null }> = await res.json()
    for (const item of data) {
      if (item.result?.hash && item.result.value) {
        result.set(item.result.hash, BigInt(item.result.value))
      }
    }
  } catch {
    // ignore
  }

  return result
}

interface ContractMintInfo {
  address: string
  mintCount: number
  lastMintAt: string
}

async function getContractMetadataBatch(
  nftHost: string,
  apiKey: string,
  addresses: string[]
): Promise<Map<string, NftContractMetadata>> {
  const results = new Map<string, NftContractMetadata>()
  // Alchemy doesn't have a batch metadata endpoint, so we run in parallel
  await Promise.allSettled(
    addresses.map(async (addr) => {
      try {
        const res = await fetch(
          `https://${nftHost}.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata?contractAddress=${addr}`,
          { next: { revalidate: 300 } }
        )
        if (!res.ok) return
        const data: NftContractMetadata = await res.json()
        results.set(addr.toLowerCase(), data)
      } catch {
        // ignore
      }
    })
  )
  return results
}

interface NftContractMetadata {
  address: string
  name: string | null
  symbol: string | null
  totalSupply: string | null
  tokenType: string
  deployedBlockNumber: number | null
  openSeaMetadata: {
    floorPrice: number | null
    collectionName: string | null
    collectionSlug: string | null
    imageUrl: string | null
    description: string | null
    externalUrl: string | null
    twitterUsername: string | null
    discordUrl: string | null
    bannerImageUrl: string | null
    lastIngestedAt: string | null
  }
}

// Protocol/infrastructure contracts to exclude (DeFi, liquid staking, ENS, etc.)
function isProtocolContract(name: string): boolean {
  const lower = name.toLowerCase()
  const blockList = [
    // AMMs / DEX
    'uniswap', 'sushiswap', 'curve', 'balancer', 'pancakeswap',
    // Lending
    'aave', 'compound', 'morpho', 'radiant',
    // Liquid staking
    'lido', 'steth', 'reth', 'rocket pool', 'frax',
    // Bridges
    'bridge', 'hop protocol', 'across protocol',
    // ENS / naming
    'ethereum name service', 'ens:', ' ens', '.eth',
    // Finance mechanics
    'position', 'liquidity', 'lp token', 'withdrawal',
    'wrapped', 'staked', 'certificate', 'payout', 'funded',
    'receipt', 'voucher', 'vault', 'supernova',
    // Name services (ENS-style registrars)
    ' names', '.names',
    // Soulbound / non-transferable tokens
    'soulbound', ' sbt', 'genesis sbt',
    // XEN ecosystem
    'xenft', 'xen crypto', 'xen ',
    // DeFi ve-tokens (vote-escrow)
    'venova', 'velodrome', 'solidly',
  ]
  return blockList.some((kw) => lower.includes(kw))
}

function metadataToFreeMint(
  meta: NftContractMetadata,
  mintInfo: ContractMintInfo,
  chainKey: string,
  chainId: number
): FreeMint | null {
  const osm = meta.openSeaMetadata
  const name = osm.collectionName || meta.name
  if (!name || !meta.address) return null
  // Skip hex addresses used as names, very short names, etc.
  if (name.length < 3 || name.startsWith('0x')) return null

  // Must have an image (real collectible, not protocol NFT)
  if (!osm.imageUrl) return null

  // Skip protocol/DeFi NFTs
  if (isProtocolContract(name)) return null

  // INT_MAX totalSupply is a DeFi/protocol placeholder (e.g. ve-tokens)
  if (meta.totalSupply && parseInt(meta.totalSupply) > 1_000_000_000) return null

  const image = osm.imageUrl || '/placeholder-nft.png'
  const slug = osm.collectionSlug
  const opensea = slug ? `https://opensea.io/collection/${slug}` : undefined
  const explorer = `${EXPLORERS[chainId] || 'https://etherscan.io'}/address/${meta.address}`

  return {
    id: `onchain-${chainKey}-${meta.address.toLowerCase()}`,
    name,
    description: osm.description || undefined,
    image,
    bannerImage: osm.bannerImageUrl || undefined,
    contractAddress: meta.address,
    chain: chainKey as Chain,
    chainId,
    contractKind: meta.tokenType?.toLowerCase() === 'erc1155' ? 'erc1155' : 'erc721',
    mintStage: {
      kind: 'public',
      price: '0',
      startTime: 0,
      endTime: null,
      maxMintsPerWallet: null,
    },
    // totalSupply from on-chain = total minted so far (used for display)
    // We use null so card shows "X minted" (open edition style, no cap)
    totalSupply: null,
    mintedCount: meta.totalSupply ? parseInt(meta.totalSupply) : mintInfo.mintCount,
    floorPrice: osm.floorPrice ?? undefined,
    twitterUrl: osm.twitterUsername ? `https://twitter.com/${osm.twitterUsername}` : undefined,
    discordUrl: osm.discordUrl || undefined,
    externalUrl: opensea || osm.externalUrl || explorer,
    createdAt: mintInfo.lastMintAt,
    source: 'reservoir',
  }
}

/**
 * Collects free mint transfers over a given block window and returns a map
 * of contract address → { mintCount, lastMintAt (ISO timestamp) }.
 */
async function collectFreeMintsInWindow(
  rpcHost: string,
  apiKey: string,
  blocksBack: number
): Promise<Map<string, ContractMintInfo>> {
  const transfers = await getRecentMintTransfers(rpcHost, apiKey, blocksBack)
  if (transfers.length === 0) return new Map()

  const uniqueHashes = [...new Set(transfers.map((t) => t.hash))]
  const txValues = await batchGetTxValues(rpcHost, apiKey, uniqueHashes)

  const contractMints = new Map<string, ContractMintInfo>()
  for (const transfer of transfers) {
    const value = txValues.get(transfer.hash)
    if (value !== undefined && value > BigInt(0)) continue // paid mint — skip

    const addr = transfer.rawContract.address?.toLowerCase()
    if (!addr) continue

    const ts = transfer.metadata?.blockTimestamp || new Date().toISOString()
    const existing = contractMints.get(addr)
    if (existing) {
      existing.mintCount++
      // Keep the most recent timestamp
      if (ts > existing.lastMintAt) existing.lastMintAt = ts
    } else {
      contractMints.set(addr, { address: addr, mintCount: 1, lastMintAt: ts })
    }
  }

  return contractMints
}

/**
 * Fetches CURRENTLY ACTIVE free mints using a multi-window strategy:
 *
 * - Window 1 (30 min): contracts with free mints in last 30 min = DEFINITELY still active
 * - Window 2 (2h): merged if < 4 results in first window
 *
 * Hard filter: if the last free mint for a contract is > 2h ago, we discard it.
 * This ensures we never show a mint that has likely already ended.
 *
 * Sorted by lastMintAt descending (most recent activity = shown first).
 */
export async function fetchActiveFreeMints(
  chains: string[],
  apiKey: string
): Promise<FreeMint[]> {
  const allMints: FreeMint[] = []
  const seen = new Set<string>()

  const now = Date.now()
  // Mint inactif depuis > 2h = probablement terminé
  const cutoff2h = new Date(now - 2 * 60 * 60 * 1000).toISOString()

  await Promise.allSettled(
    chains.map(async (chainKey) => {
      const config = ALCHEMY_RPC[chainKey]
      if (!config) return

      // Pass 1 : dernières 30 min — activité très récente = mint certainement encore ouvert
      // ETH : 12s/block → 30 min = ~150 blocks
      const blocks30m = Math.ceil(config.blocksPerDay / 48)
      const mintsHot = await collectFreeMintsInWindow(config.rpcHost, apiKey, blocks30m)

      // Pass 2 : dernières 2h si moins de 4 résultats dans les 30 premières minutes
      let contractMints = mintsHot
      if (mintsHot.size < 4) {
        const blocks2h = Math.ceil(config.blocksPerDay / 12)
        const mintsCool = await collectFreeMintsInWindow(config.rpcHost, apiKey, blocks2h)
        for (const [addr, info] of mintsCool.entries()) {
          if (!contractMints.has(addr)) contractMints.set(addr, info)
        }
      }

      if (contractMints.size === 0) return

      // FILTRE DUR : dernier mint gratuit il y a > 2h → on exclut (mint très probablement terminé)
      for (const [addr, info] of contractMints.entries()) {
        if (info.lastMintAt < cutoff2h) contractMints.delete(addr)
      }

      if (contractMints.size === 0) return

      // Top 12 triés par activité la plus récente
      const topContracts = [...contractMints.entries()]
        .sort((a, b) => b[1].lastMintAt.localeCompare(a[1].lastMintAt))
        .slice(0, 12)
        .map(([addr]) => addr)

      const metadataMap = await getContractMetadataBatch(config.nftHost, apiKey, topContracts)

      for (const addr of topContracts) {
        const mintInfo = contractMints.get(addr)!
        const meta = metadataMap.get(addr)
        if (!meta) continue

        const key = `${chainKey}-${addr}`
        if (seen.has(key)) continue
        seen.add(key)

        const mint = metadataToFreeMint(meta, mintInfo, chainKey, config.chainId)
        if (mint) allMints.push(mint)
      }
    })
  )

  // Sort by most recent free mint activity
  return allMints.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

// --- MissedMints (kept from original approach) ---

const SEARCH_TERMS = ['free mint', 'open edition', 'free open edition']

interface AlchemyContract {
  address: string
  name: string | null
  symbol: string | null
  totalSupply: string | null
  tokenType: string
  openSeaMetadata: {
    floorPrice: number | null
    collectionName: string | null
    collectionSlug: string | null
    imageUrl: string | null
    description: string | null
    externalUrl: string | null
    twitterUsername: string | null
    discordUrl: string | null
    bannerImageUrl: string | null
    lastIngestedAt: string | null
  }
}

async function searchContracts(
  nftHost: string,
  query: string,
  apiKey: string
): Promise<AlchemyContract[]> {
  const url = `https://${nftHost}.g.alchemy.com/nft/v3/${apiKey}/searchContractMetadata?query=${encodeURIComponent(query)}&limit=50`
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data: { contracts?: AlchemyContract[] } = await res.json()
    return data.contracts || []
  } catch {
    return []
  }
}

export interface MissedMint {
  id: string
  name: string
  image: string
  contractAddress: string
  chain: Chain
  chainId: number
  externalUrl?: string
  twitterUrl?: string
  mintedTotal: number | null
  floorPriceEth: number
  lastSeenAt: string
  collectionSlug?: string
}

/**
 * Missed free mints: collections that were once free, now have floor price > 0.
 * Sorted by floor price descending.
 */
export async function fetchMissedFreeMints(
  chains: string[],
  apiKey: string
): Promise<MissedMint[]> {
  const cutoffRecent = new Date()
  cutoffRecent.setDate(cutoffRecent.getDate() - 3)

  const cutoffOld = new Date()
  cutoffOld.setDate(cutoffOld.getDate() - 30)

  const tasks = chains.flatMap((chain) =>
    SEARCH_TERMS.map((term) => {
      const config = ALCHEMY_RPC[chain]
      return config ? searchContracts(config.nftHost, term, apiKey) : Promise.resolve([])
    })
  )

  const results = await Promise.allSettled(tasks)
  const seen = new Set<string>()
  const missed: MissedMint[] = []

  let taskIdx = 0
  for (const chainKey of chains) {
    for (const _term of SEARCH_TERMS) {
      const result = results[taskIdx++]
      if (result.status !== 'fulfilled') continue

      const config = ALCHEMY_RPC[chainKey]
      if (!config) continue

      for (const contract of result.value) {
        const key = `${chainKey}-${contract.address.toLowerCase()}`
        if (seen.has(key)) continue

        const meta = contract.openSeaMetadata
        const lastSeen = meta?.lastIngestedAt ? new Date(meta.lastIngestedAt) : null
        const floor = meta?.floorPrice ?? null
        const name = meta?.collectionName || contract.name

        if (!name || !floor || floor <= 0) continue
        if (!lastSeen) continue

        const isOldEnough = lastSeen < cutoffRecent
        const isNotTooOld = lastSeen > cutoffOld

        if (!isOldEnough || !isNotTooOld) continue

        seen.add(key)
        missed.push({
          id: `missed-${chainKey}-${contract.address.toLowerCase()}`,
          name,
          image: meta?.imageUrl || '/placeholder-nft.png',
          contractAddress: contract.address,
          chain: chainKey as Chain,
          chainId: config.chainId,
          externalUrl: meta?.collectionSlug
            ? `https://opensea.io/collection/${meta.collectionSlug}`
            : meta?.externalUrl || undefined,
          twitterUrl: meta?.twitterUsername
            ? `https://twitter.com/${meta.twitterUsername}`
            : undefined,
          mintedTotal: contract.totalSupply ? parseInt(contract.totalSupply) : null,
          floorPriceEth: floor,
          lastSeenAt: meta?.lastIngestedAt || new Date().toISOString(),
          collectionSlug: meta?.collectionSlug || undefined,
        })
      }
    }
  }

  return missed.sort((a, b) => b.floorPriceEth - a.floorPriceEth).slice(0, 20)
}
