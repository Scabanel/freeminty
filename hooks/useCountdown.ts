'use client'

import { useState, useEffect } from 'react'
import { formatTimeLeft, isEndingSoon } from '@/lib/utils'

export function useCountdown(endTime: number | null) {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(endTime))
  const [endingSoon, setEndingSoon] = useState(() => isEndingSoon(endTime))

  useEffect(() => {
    if (!endTime) return

    const interval = setInterval(() => {
      setTimeLeft(formatTimeLeft(endTime))
      setEndingSoon(isEndingSoon(endTime))
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  return { timeLeft, endingSoon }
}
