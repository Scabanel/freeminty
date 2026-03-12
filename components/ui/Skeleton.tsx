import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-surface-2',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent',
        'before:animate-shimmer before:bg-[length:200%_100%]',
        className
      )}
    />
  )
}

export function MintCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Square image skeleton */}
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="pt-0.5 border-t border-border">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}
