import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { checkEligibility } from '@/lib/eligibility'
import type { EligibilityResult, FreeMint } from '@/types/mint'

interface ContractStatus {
  contractAddress: string
  name: string | null
  image: string | null
  collectionSlug: string | null
  externalUrl: string | null
  floorPrice: number | null
  totalSupply: string | null
  verified: boolean
  eligibility: EligibilityResult | null
  error?: string
}

async function getContractMetadata(contractAddress: string, apiKey: string) {
  try {
    const res = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata?contractAddress=${contractAddress}`,
      { next: { revalidate: 120 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params
  const { searchParams } = req.nextUrl
  const contractsParam = searchParams.get('contracts')

  if (!isAddress(address)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }

  if (!contractsParam) {
    return NextResponse.json({ error: 'contracts param required' }, { status: 400 })
  }

  const contracts = contractsParam
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter((c) => isAddress(c))
    .slice(0, 20) // max 20 contracts

  if (contracts.length === 0) {
    return NextResponse.json([])
  }

  const apiKey = process.env.ALCHEMY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 })
  }

  const results = await Promise.all(
    contracts.map(async (contractAddress): Promise<ContractStatus> => {
      const meta = await getContractMetadata(contractAddress, apiKey)

      if (!meta) {
        return {
          contractAddress,
          name: null,
          image: null,
          collectionSlug: null,
          externalUrl: null,
          floorPrice: null,
          totalSupply: null,
          verified: false,
          eligibility: null,
          error: 'Contract not found',
        }
      }

      const osm = meta.openSeaMetadata || {}
      const name = osm.collectionName || meta.name || contractAddress
      const verified =
        osm.safelistRequestStatus === 'verified' || osm.safelistRequestStatus === 'approved'

      // Build a minimal FreeMint to reuse checkEligibility
      const fakeMint: FreeMint = {
        id: `watchlist-${contractAddress}`,
        name,
        image: osm.imageUrl || '',
        contractAddress,
        chain: 'ethereum',
        chainId: 1,
        contractKind: meta.tokenType?.toLowerCase() === 'erc1155' ? 'erc1155' : 'erc721',
        mintStage: {
          kind: 'public',
          price: '0',
          startTime: 0,
          endTime: null,
          maxMintsPerWallet: null,
        },
        totalSupply: meta.totalSupply ? parseInt(meta.totalSupply) : null,
        mintedCount: meta.totalSupply ? parseInt(meta.totalSupply) : 0,
        floorPrice: osm.floorPrice ?? undefined,
        createdAt: new Date().toISOString(),
        source: 'reservoir',
        verified,
      }

      let eligibility: EligibilityResult | null = null
      try {
        eligibility = await checkEligibility(fakeMint, address)
      } catch {
        eligibility = {
          mintId: fakeMint.id,
          eligible: false,
          strategy: 'unknown',
          reason: 'Eligibility check failed',
        }
      }

      return {
        contractAddress,
        name,
        image: osm.imageUrl || null,
        collectionSlug: osm.collectionSlug || null,
        externalUrl: osm.collectionSlug
          ? `https://opensea.io/collection/${osm.collectionSlug}`
          : osm.externalUrl || null,
        floorPrice: osm.floorPrice ?? null,
        totalSupply: meta.totalSupply || null,
        verified,
        eligibility,
      }
    })
  )

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
  })
}
