import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        free: 'bg-success/10 text-success border border-success/25',
        live: 'bg-primary/10 text-primary border border-primary/25',
        'ending-soon': 'bg-warning/10 text-warning border border-warning/25',
        allowlist: 'bg-accent/10 text-accent border border-accent/25',
        eligible: 'bg-success/10 text-success border border-success/25',
        ineligible: 'bg-danger/10 text-danger border border-danger/25',
        unknown: 'bg-surface-3 text-text-dim border border-border',
        chain: 'bg-surface-2 text-text-secondary border border-border',
        new: 'bg-accent/15 text-accent border border-accent/30',
      },
    },
    defaultVariants: {
      variant: 'free',
    },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export function Badge({ variant, className, style, children }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} style={style}>
      {children}
    </span>
  )
}
