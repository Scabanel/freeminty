'use client'

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { FreeMint, EligibilityResult } from '@/types/mint'
import { ERC721_MINT_ABI, ERC721_ALLOWLIST_ABI, ZORA_MINT_ABI } from '@/lib/abis'
import { encodeAbiParameters, parseAbiParameters, zeroAddress, type Address } from 'viem'

type MintState = 'idle' | 'simulating' | 'confirming' | 'pending' | 'success' | 'error'

function buildMintArgs(mintData: FreeMint, address: Address, eligibility?: EligibilityResult) {
  if (mintData.source === 'zora') {
    const minterArgs = encodeAbiParameters(
      parseAbiParameters('address'),
      [address]
    )
    return {
      abi: ZORA_MINT_ABI,
      functionName: 'mintWithRewards' as const,
      args: [address, BigInt(mintData.tokenId || '0'), BigInt(1), minterArgs, zeroAddress] as const,
    }
  }

  if (mintData.mintStage.kind === 'allowlist' && eligibility?.merkleProof) {
    return {
      abi: ERC721_ALLOWLIST_ABI,
      functionName: 'allowlistMint' as const,
      args: [eligibility.merkleProof, BigInt(1)] as const,
    }
  }

  return {
    abi: ERC721_MINT_ABI,
    functionName: 'mint' as const,
    args: [BigInt(1)] as const,
  }
}

export function useMint(mintData: FreeMint, eligibility?: EligibilityResult) {
  const { address } = useAccount()
  const [state, setState] = useState<MintState>('idle')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const mintArgs = address ? buildMintArgs(mintData, address, eligibility) : null

  const { writeContractAsync } = useWriteContract()

  const { data: receipt, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (isSuccess && receipt) {
      setState('success')
      toast.success('Minted successfully! 🎉', { duration: 6000 })
    }
  }, [isSuccess, receipt])

  async function executeMint() {
    if (!address || !mintArgs) return

    setState('simulating')
    const toastId = toast.loading('Preparing mint…')

    try {
      setState('confirming')
      toast.loading('Confirm in your wallet…', { id: toastId })

      const hash = await writeContractAsync({
        address: mintData.contractAddress as Address,
        abi: mintArgs.abi as never,
        functionName: mintArgs.functionName as never,
        args: mintArgs.args as never,
        chainId: mintData.chainId,
        value: BigInt(0),
      })

      setTxHash(hash)
      setState('pending')
      toast.loading('Transaction pending…', { id: toastId })
    } catch (err: unknown) {
      setState('error')
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('User rejected') || message.includes('denied')) {
        toast.error('Transaction rejected', { id: toastId })
      } else {
        toast.error(`Mint failed: ${message.slice(0, 60)}`, { id: toastId })
      }
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return {
    mint: executeMint,
    state,
    txHash,
    isLoading: state === 'simulating' || state === 'confirming' || state === 'pending',
    isSuccess: state === 'success',
    isError: state === 'error',
  }
}
