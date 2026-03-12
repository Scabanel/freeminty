import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/providers'

export const metadata: Metadata = {
  title: 'FreeMint — Free NFT Mints in Real-Time',
  description:
    'Discover and mint free NFTs across Ethereum, Base, Zora, Optimism and more. Connect your Rabby wallet and check eligibility instantly.',
  keywords: ['free mint', 'NFT', 'crypto', 'blockchain', 'Base', 'Zora', 'Ethereum'],
  openGraph: {
    title: 'FreeMint — Free NFT Mints in Real-Time',
    description: 'Never miss a free NFT mint again.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
