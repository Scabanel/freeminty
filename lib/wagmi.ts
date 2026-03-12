import { createConfig, http } from 'wagmi'
import { mainnet, base, optimism, arbitrum, polygon, zora } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [mainnet, base, zora, optimism, arbitrum, polygon],
  connectors: [
    // Generic injected — détecte Rabby, MetaMask, etc. automatiquement
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [mainnet.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        : 'https://eth.llamarpc.com'
    ),
    [base.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        : 'https://base.llamarpc.com'
    ),
    [zora.id]: http('https://rpc.zora.energy'),
    [optimism.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        ? `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        : 'https://optimism.llamarpc.com'
    ),
    [arbitrum.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        ? `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        : 'https://arbitrum.llamarpc.com'
    ),
    [polygon.id]: http('https://polygon.llamarpc.com'),
  },
})

export { mainnet, base, zora, optimism, arbitrum, polygon }
