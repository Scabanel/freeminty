'use client'

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { useState, useRef, useEffect } from 'react'
import { isAddress } from 'viem'
import {
  Wallet, ChevronDown, LogOut, Copy, Check,
  ExternalLink, Eye, X, ArrowRight,
} from 'lucide-react'
import { cn, formatAddress } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { useActiveAddress } from '@/hooks/useEligibility'

export function WalletConnect() {
  const { address: connectedAddress, isConnected, connector } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address: connectedAddress })

  const { watchedAddress, setWatchedAddress, clearWatchedAddress } = useUIStore()
  const { address, isReadOnly } = useActiveAddress()

  const [showMenu, setShowMenu] = useState(false)
  const [showConnectors, setShowConnectors] = useState(false)
  const [showWatchInput, setShowWatchInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
        setShowConnectors(false)
        setShowWatchInput(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (showWatchInput) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showWatchInput])

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWatchSubmit() {
    const val = inputValue.trim()
    if (!val) { setInputError('Enter an address'); return }
    if (!isAddress(val)) { setInputError('Invalid EVM address'); return }
    setWatchedAddress(val)
    setInputValue('')
    setInputError('')
    setShowWatchInput(false)
    setShowConnectors(false)
  }

  // ── Wallet connecté ──────────────────────────────────────────────
  if (isConnected && connectedAddress) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2',
            'bg-surface border border-border hover:border-primary/40 transition-all',
            'text-sm font-medium text-text-primary'
          )}
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet size={12} className="text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border border-background" />
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-xs text-muted mb-0.5">{connector?.name || 'Wallet'}</span>
            <span>{formatAddress(connectedAddress)}</span>
          </div>
          <span className="sm:hidden">{formatAddress(connectedAddress)}</span>
          {balance && (
            <span className="hidden md:block text-xs text-muted border-l border-border pl-2 ml-1">
              {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            </span>
          )}
          <ChevronDown size={14} className={cn('text-muted transition-transform', showMenu && 'rotate-180')} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface-2 shadow-xl z-50 animate-slide-up">
            <div className="p-3 border-b border-border">
              <p className="text-xs text-muted mb-1">Connected as</p>
              <p className="text-sm font-mono text-text-primary">{formatAddress(connectedAddress)}</p>
              {balance && (
                <p className="text-xs text-text-secondary mt-0.5">
                  {parseFloat(balance.formatted).toFixed(6)} {balance.symbol}
                </p>
              )}
            </div>
            <div className="p-1">
              <button
                onClick={copyAddress}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy address'}
              </button>
              <a
                href={`https://etherscan.io/address/${connectedAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
              >
                <ExternalLink size={14} />
                View on Etherscan
              </a>
              <button
                onClick={() => disconnect()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Adresse surveillée (read-only) ───────────────────────────────
  if (watchedAddress) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2',
            'bg-surface border border-accent/30 hover:border-accent/60 transition-all',
            'text-sm font-medium text-text-primary'
          )}
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
              <Eye size={12} className="text-accent" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-xs text-accent mb-0.5">Read-only</span>
            <span>{formatAddress(watchedAddress)}</span>
          </div>
          <span className="sm:hidden">{formatAddress(watchedAddress)}</span>
          <ChevronDown size={14} className={cn('text-muted transition-transform', showMenu && 'rotate-180')} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-surface-2 shadow-xl z-50 animate-slide-up">
            <div className="p-3 border-b border-border">
              <p className="text-xs text-accent mb-1 flex items-center gap-1">
                <Eye size={10} /> Watching (read-only)
              </p>
              <p className="text-sm font-mono text-text-primary break-all">{watchedAddress}</p>
              <p className="text-xs text-muted mt-1">Connect wallet to mint</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => { clearWatchedAddress(); setShowMenu(false) }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
              >
                <X size={14} />
                Stop watching
              </button>
              <button
                onClick={() => { setShowMenu(false); setShowConnectors(true) }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
              >
                <Wallet size={14} />
                Connect wallet to mint
              </button>
            </div>
          </div>
        )}

        {/* Panel connexion wallet quand en read-only */}
        {showConnectors && (
          <ConnectorPanel
            connectors={connectors}
            isPending={isPending}
            onConnect={(c) => { connect({ connector: c }); setShowConnectors(false) }}
            onWatch={() => { setShowConnectors(false); setShowWatchInput(true) }}
            onClose={() => setShowConnectors(false)}
          />
        )}
      </div>
    )
  }

  // ── Non connecté ─────────────────────────────────────────────────
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setShowConnectors(!showConnectors); setShowWatchInput(false) }}
        disabled={isPending}
        className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-2.5',
          'bg-primary text-white text-sm font-semibold',
          'hover:bg-primary-hover transition-all duration-200 shadow-lg shadow-primary/25',
          'disabled:opacity-60 disabled:cursor-not-allowed active:scale-95'
        )}
      >
        <Wallet size={15} />
        {isPending ? 'Connecting…' : 'Connect Wallet'}
      </button>

      {showConnectors && !showWatchInput && (
        <ConnectorPanel
          connectors={connectors}
          isPending={isPending}
          onConnect={(c) => { connect({ connector: c }); setShowConnectors(false) }}
          onWatch={() => { setShowConnectors(false); setShowWatchInput(true) }}
          onClose={() => setShowConnectors(false)}
        />
      )}

      {showWatchInput && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-surface-2 shadow-xl z-50 animate-slide-up">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <p className="text-xs text-accent font-medium flex items-center gap-1.5">
              <Eye size={12} /> Watch an address (read-only)
            </p>
            <button onClick={() => setShowWatchInput(false)} className="text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          </div>
          <div className="p-3 space-y-2">
            <p className="text-xs text-muted">
              Entre ton adresse ETH pour voir l&apos;éligibilité sans connecter de wallet.
            </p>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setInputError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleWatchSubmit()}
                placeholder="0x…"
                className={cn(
                  'w-full rounded-lg px-3 py-2 pr-9 text-sm font-mono',
                  'bg-surface border text-text-primary placeholder:text-muted',
                  'focus:outline-none focus:ring-1 focus:ring-accent/40 transition-colors',
                  inputError ? 'border-danger' : 'border-border focus:border-accent/60'
                )}
              />
              <button
                onClick={handleWatchSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-accent hover:text-accent/80"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            {inputError && <p className="text-xs text-danger">{inputError}</p>}
            <button
              onClick={() => { setShowWatchInput(false); setShowConnectors(true) }}
              className="text-xs text-muted hover:text-text-primary underline"
            >
              ← Retour à la connexion wallet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sous-composant réutilisable ──────────────────────────────────────
function ConnectorPanel({
  connectors,
  isPending,
  onConnect,
  onWatch,
  onClose,
}: {
  connectors: ReturnType<typeof useConnect>['connectors']
  isPending: boolean
  onConnect: (c: (typeof connectors)[number]) => void
  onWatch: () => void
  onClose: () => void
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-surface-2 shadow-xl z-50 animate-slide-up">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <p className="text-xs text-muted">Connecter un wallet</p>
        <button onClick={onClose} className="text-muted hover:text-text-primary">
          <X size={14} />
        </button>
      </div>
      <div className="p-1">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => onConnect(connector)}
            disabled={isPending}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface transition-colors disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border text-base">
              {connector.name.toLowerCase().includes('rabby') ? '🐰'
                : connector.name.toLowerCase().includes('metamask') ? '🦊'
                : connector.name.toLowerCase().includes('walletconnect') ? '🔗'
                : <Wallet size={14} className="text-muted" />}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">{connector.name}</p>
              {connector.name.toLowerCase().includes('rabby') && (
                <p className="text-xs text-accent">Recommandé</p>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <button
          onClick={onWatch}
          className="flex w-full items-center gap-2 text-xs text-muted hover:text-accent transition-colors"
        >
          <Eye size={12} />
          Entrer une adresse (lecture seule)
        </button>
      </div>
    </div>
  )
}
