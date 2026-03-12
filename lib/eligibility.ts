import {
  createPublicClient,
  http,
  type Address,
  keccak256,
  encodePacked,
  type Chain,
} from 'viem'
import { mainnet, base, zora, optimism, arbitrum, polygon } from 'viem/chains'
import { ERC721_MINT_ABI, ERC1155_ABI } from '@/lib/abis'
import type { FreeMint, EligibilityResult } from '@/types/mint'

const CHAIN_CONFIGS: Record<number, { chain: Chain; rpc: string }> = {
  1: {
    chain: mainnet,
    rpc: process.env.ALCHEMY_API_KEY
      ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      : 'https://eth.llamarpc.com',
  },
  8453: {
    chain: base,
    rpc: process.env.ALCHEMY_API_KEY
      ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      : 'https://base.llamarpc.com',
  },
  7777777: { chain: zora, rpc: 'https://rpc.zora.energy' },
  10: {
    chain: optimism,
    rpc: process.env.ALCHEMY_API_KEY
      ? `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      : 'https://optimism.llamarpc.com',
  },
  42161: {
    chain: arbitrum,
    rpc: process.env.ALCHEMY_API_KEY
      ? `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      : 'https://arbitrum.llamarpc.com',
  },
  137: { chain: polygon, rpc: 'https://polygon.llamarpc.com' },
}

function getPublicClient(chainId: number) {
  const config = CHAIN_CONFIGS[chainId]
  if (!config) throw new Error(`Unsupported chain: ${chainId}`)
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpc),
  })
}

async function checkPublicMintEligibility(
  mint: FreeMint,
  walletAddress: Address
): Promise<EligibilityResult> {
  const client = getPublicClient(mint.chainId)

  // Check how many the user has already minted
  let alreadyMinted = 0
  try {
    const balance = await client.readContract({
      address: mint.contractAddress as Address,
      abi: ERC721_MINT_ABI,
      functionName: 'numberMinted',
      args: [walletAddress],
    })
    alreadyMinted = Number(balance)
  } catch {
    try {
      const balance = await client.readContract({
        address: mint.contractAddress as Address,
        abi: ERC721_MINT_ABI,
        functionName: 'minted',
        args: [walletAddress],
      })
      alreadyMinted = Number(balance)
    } catch {
      // Contract may not have this function
    }
  }

  const maxMints = mint.mintStage.maxMintsPerWallet
  const eligible = maxMints == null || alreadyMinted < maxMints

  return {
    mintId: mint.id,
    eligible,
    strategy: 'public',
    alreadyMinted,
    maxMintsPerWallet: maxMints,
    reason: eligible
      ? undefined
      : `Already minted ${alreadyMinted}/${maxMints}`,
  }
}

async function checkTokenGateEligibility(
  mint: FreeMint,
  walletAddress: Address
): Promise<EligibilityResult> {
  const gating = mint.mintStage.tokenGating!
  const client = getPublicClient(mint.chainId)

  try {
    let balance: bigint

    if (gating.tokenId != null) {
      // ERC-1155
      balance = await client.readContract({
        address: gating.contractAddress as Address,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: [walletAddress, BigInt(gating.tokenId)],
      })
    } else {
      // ERC-721
      balance = await client.readContract({
        address: gating.contractAddress as Address,
        abi: ERC721_MINT_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      })
    }

    const eligible = Number(balance) >= (gating.minBalance || 1)
    return {
      mintId: mint.id,
      eligible,
      strategy: 'token-gate',
      reason: eligible
        ? undefined
        : `Need ${gating.minBalance} token(s) at ${gating.contractAddress.slice(0, 8)}…`,
    }
  } catch {
    return {
      mintId: mint.id,
      eligible: false,
      strategy: 'token-gate',
      reason: 'Could not verify token holdings',
    }
  }
}

// Simple merkle leaf computation (keccak256 of packed address)
function computeLeaf(address: Address): `0x${string}` {
  return keccak256(encodePacked(['address'], [address]))
}

async function checkAllowlistEligibility(
  mint: FreeMint,
  walletAddress: Address
): Promise<EligibilityResult> {
  if (!mint.mintStage.allowlistId) {
    return { mintId: mint.id, eligible: false, strategy: 'allowlist', reason: 'No allowlist' }
  }

  // Try fetching allowlist from Reservoir API
  try {
    const res = await fetch(
      `https://api.reservoir.tools/collections/v7?id=${mint.contractAddress}&includeMintStages=true`,
      { headers: { 'x-api-key': process.env.RESERVOIR_API_KEY || 'demo' } }
    )

    if (!res.ok) {
      return { mintId: mint.id, eligible: false, strategy: 'allowlist', reason: 'Could not fetch allowlist' }
    }

    // Without the actual merkle tree, we can only check if the stage is allowlist type
    // and return unknown eligibility for the user to check on the project's site
    return {
      mintId: mint.id,
      eligible: false,
      strategy: 'allowlist',
      reason: 'Allowlist — check project site for eligibility',
    }
  } catch {
    return {
      mintId: mint.id,
      eligible: false,
      strategy: 'allowlist',
      reason: 'Allowlist check failed',
    }
  }
}

export async function checkEligibility(
  mint: FreeMint,
  walletAddress: string
): Promise<EligibilityResult> {
  const address = walletAddress as Address

  if (mint.mintStage.kind === 'allowlist') {
    if (mint.mintStage.tokenGating) {
      return checkTokenGateEligibility(mint, address)
    }
    return checkAllowlistEligibility(mint, address)
  }

  // Public mint
  return checkPublicMintEligibility(mint, address)
}
