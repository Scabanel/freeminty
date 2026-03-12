import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function formatSupply(minted: number, total: number | null): string {
  if (total === null) return `${minted.toLocaleString()} minted`
  const pct = Math.round((minted / total) * 100)
  return `${minted.toLocaleString()} / ${total.toLocaleString()} (${pct}%)`
}

export function getSupplyPercent(minted: number, total: number | null): number {
  if (!total) return 0
  return Math.min((minted / total) * 100, 100)
}

export function formatTimeLeft(endTime: number | null): string {
  if (!endTime) return 'No end date'
  const now = Date.now() / 1000
  const diff = endTime - now
  if (diff <= 0) return 'Ended'
  if (diff < 60) return `${Math.floor(diff)}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
  return `${Math.floor(diff / 86400)}d ${Math.floor((diff % 86400) / 3600)}h`
}

export function isEndingSoon(endTime: number | null): boolean {
  if (!endTime) return false
  const diff = endTime - Date.now() / 1000
  return diff > 0 && diff < 3600 // less than 1 hour
}

export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  7777777: 'Zora',
  10: 'Optimism',
  42161: 'Arbitrum',
  137: 'Polygon',
}

export const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  base: '#0052FF',
  zora: '#A456F0',
  optimism: '#FF0420',
  arbitrum: '#28A0F0',
  polygon: '#8247E5',
}

export const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  zora: 7777777,
  optimism: 10,
  arbitrum: 42161,
  polygon: 137,
}

export const CHAIN_FROM_ID: Record<number, string> = {
  1: 'ethereum',
  8453: 'base',
  7777777: 'zora',
  10: 'optimism',
  42161: 'arbitrum',
  137: 'polygon',
}
