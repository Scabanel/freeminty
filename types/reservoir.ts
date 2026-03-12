// Raw Reservoir API response types

export interface ReservoirMintStage {
  stage: string
  tokenId?: string
  kind: 'public' | 'allowlist'
  price: {
    currency: { contract: string; name: string; symbol: string; decimals: number }
    amount: { raw: string; decimal: number; usd: number; native: number }
  }
  startTime?: number
  endTime?: number
  maxMintsPerWallet?: number
  allowlistId?: string
}

export interface ReservoirCollection {
  id: string
  name: string
  description?: string
  image?: string
  banner?: string
  twitterUrl?: string
  discordUrl?: string
  externalUrl?: string
  primaryContract: string
  contractKind: 'erc721' | 'erc1155'
  chainId: number
  tokenCount: string
  mintedTimestamp?: number
  createdAt: string
  mintStages?: ReservoirMintStage[]
  floorAsk?: {
    price?: {
      amount?: { native?: number }
    }
  }
}

export interface ReservoirCollectionsResponse {
  collections: ReservoirCollection[]
  continuation?: string
}
