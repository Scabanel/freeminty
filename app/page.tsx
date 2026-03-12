import { Header } from '@/components/Header'
import { MintFeed } from '@/components/MintFeed'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-10">
        {/* Hero */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-success/10 border border-success/20 px-3 py-1 text-xs text-success font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live — free mints actifs sur Ethereum · activité &lt; 6h
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Free NFT Mints{' '}
            <span className="text-gradient">en ce moment</span>
          </h2>
          <p className="text-text-secondary text-sm max-w-lg">
            Détectés on-chain via Alchemy · quelqu&apos;un a minté gratuitement il y a moins de 6h · mint encore ouvert
          </p>
        </div>

        <MintFeed />
      </main>

      <footer className="border-t border-border py-6 mt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-3 text-xs text-muted">
          <span>freeminty · Ethereum mainnet · powered by Alchemy</span>
          <span>Données on-chain uniquement</span>
        </div>
      </footer>
    </div>
  )
}
