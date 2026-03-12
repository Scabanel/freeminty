import { NextRequest, NextResponse } from 'next/server'
import { checkEligibility } from '@/lib/eligibility'
import { fetchActiveFreeMints } from '@/lib/alchemy'
import type { EligibilityResult } from '@/types/mint'
import { isAddress } from 'viem'

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params
  const { searchParams } = req.nextUrl
  const mintId = searchParams.get('mintId')

  if (!isAddress(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }

  if (!mintId) {
    return NextResponse.json({ error: 'mintId required' }, { status: 400 })
  }

  const alchemyKey = process.env.ALCHEMY_API_KEY
  if (!alchemyKey) {
    const result: EligibilityResult = { mintId, eligible: false, strategy: 'unknown', reason: 'API not configured' }
    return NextResponse.json(result)
  }

  try {
    const allMints = await fetchActiveFreeMints(['ethereum'], alchemyKey)
    const mint = allMints.find((m) => m.id === mintId)

    if (!mint) {
      // Return unknown eligibility if mint not found
      const result: EligibilityResult = {
        mintId,
        eligible: false,
        strategy: 'unknown',
        reason: 'Mint not found or expired',
      }
      return NextResponse.json(result)
    }

    const result = await checkEligibility(mint, address)

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('Eligibility API error:', error)
    const result: EligibilityResult = {
      mintId: mintId || '',
      eligible: false,
      strategy: 'unknown',
      reason: 'Eligibility check failed',
    }
    return NextResponse.json(result, { status: 200 })
  }
}
