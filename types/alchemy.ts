export interface AlchemyOpenSeaMetadata {
  floorPrice: number | null
  collectionName: string | null
  collectionSlug: string | null
  safelistRequestStatus: string | null
  imageUrl: string | null
  description: string | null
  externalUrl: string | null
  twitterUsername: string | null
  discordUrl: string | null
  bannerImageUrl: string | null
  lastIngestedAt: string | null
}

export interface AlchemyContract {
  address: string
  name: string | null
  symbol: string | null
  totalSupply: string | null
  tokenType: 'ERC721' | 'ERC1155' | string
  contractDeployer: string | null
  deployedBlockNumber: number | null
  openSeaMetadata: AlchemyOpenSeaMetadata
}

export interface AlchemySearchResponse {
  contracts: AlchemyContract[]
  pageKey?: string
}
