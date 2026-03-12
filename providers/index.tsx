'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 25_000,
            gcTime: 60_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a26',
              color: '#f1f1f8',
              border: '1px solid #2a2a3d',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1a1a26' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1a1a26' },
            },
            loading: {
              iconTheme: { primary: '#7c3aed', secondary: '#1a1a26' },
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
