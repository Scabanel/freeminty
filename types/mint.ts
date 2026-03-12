export type Chain = 'ethereum' | 'base' | 'zora' | 'optimism' | 'arbitrum' | 'polygon'

export type MintKind = 'public' | 'allowlist' | 'token-gate'

export type EligibilityStrategy = 'public' | 'allowlist' | 'token-gate' | 'ineligible' | 'unknown'

export interface MintStage {
  kind: MintKind
  price: string // '0' for free
  startTime: number // unix timestamp
  endTime: number | null // null = no end
  maxMintsPerWallet: number | null
  allowlistId?: string
  tokenGating?: {
    contractAddress: string
    tokenId?: string
    minBalance: number
  }
}

export interface FreeMint {
  id: string
  name: string
  description?: string
  image: string
  bannerImage?: string
  contractAddress: string
  chain: Chain
  chainId: number
  contractKind: 'erc721' | 'erc1155'
  tokenId?: string // for ERC-1155
  mintStage: MintStage
  totalSupply: number | null
  mintedCount: number
  floorPrice?: number // in ETH, post-mint value
  twitterUrl?: string
  discordUrl?: string
  externalUrl?: string
  createdAt: string
  source: 'reservoir' | 'zora' | 'manifold'
  verified?: boolean // OpenSea safelistRequestStatus === 'verified' | 'approved'
}

export interface EligibilityResult {
  mintId: string
  eligible: boolean
  strategy: EligibilityStrategy
  merkleProof?: `0x${string}`[]
  reason?: string
  alreadyMinted?: number
  maxMintsPerWallet?: number | null
}

export type SortOrder = 'recent' | 'ending-soon' | 'minted' | 'supply'

export interface MintFilters {
  chain: Chain | 'all'
  sort: SortOrder
  search: string
}
