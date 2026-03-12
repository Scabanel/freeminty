// Minimal ABI fragments for common NFT mint functions

export const ERC721_MINT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'quantity', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'quantity', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'minted',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'numberMinted',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export const ERC721_ALLOWLIST_ABI = [
  {
    name: 'mintAllowlist',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'proof', type: 'bytes32[]' },
      { name: 'to', type: 'address' },
      { name: 'quantity', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'allowlistMint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'proof', type: 'bytes32[]' },
      { name: 'quantity', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'whitelistMint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'proof', type: 'bytes32[]' },
      { name: 'quantity', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'merkleRoot',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const

export const ZORA_MINT_ABI = [
  {
    name: 'mintWithRewards',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'minter', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'quantity', type: 'uint256' },
      { name: 'minterArguments', type: 'bytes' },
      { name: 'mintReferral', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'minter', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'quantity', type: 'uint256' },
      { name: 'minterArguments', type: 'bytes' },
    ],
    outputs: [],
  },
] as const

export const ERC1155_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
