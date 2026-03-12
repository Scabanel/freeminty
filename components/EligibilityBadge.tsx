'use client'

import { Badge } from '@/components/ui/Badge'
import { CheckCircle, XCircle, Lock, HelpCircle, Loader2, Eye } from 'lucide-react'
import type { EligibilityResult } from '@/types/mint'

interface EligibilityBadgeProps {
  eligibility?: EligibilityResult
  isLoading?: boolean
  isConnected: boolean
  hasActiveAddress?: boolean
}

export function EligibilityBadge({ eligibility, isLoading, isConnected, hasActiveAddress }: EligibilityBadgeProps) {
  if (!isConnected && !hasActiveAddress) {
    return (
      <Badge variant="unknown" className="gap-1">
        <HelpCircle size={10} />
        Connect wallet
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Badge variant="unknown" className="gap-1">
        <Loader2 size={10} className="animate-spin" />
        Checking…
      </Badge>
    )
  }

  if (!eligibility) {
    return (
      <Badge variant="unknown" className="gap-1">
        <HelpCircle size={10} />
        Unknown
      </Badge>
    )
  }

  if (eligibility.strategy === 'allowlist') {
    return (
      <Badge variant="allowlist" className="gap-1">
        <Lock size={10} />
        Allowlist
      </Badge>
    )
  }

  if (eligibility.eligible) {
    return (
      <Badge variant="eligible" className="gap-1">
        <CheckCircle size={10} />
        Eligible
      </Badge>
    )
  }

  return (
    <Badge variant="ineligible" className="gap-1">
      <XCircle size={10} />
      {eligibility.reason?.includes('minted') ? 'Already minted' : 'Not eligible'}
    </Badge>
  )
}
