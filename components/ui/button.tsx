import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-orange/40 active:scale-[0.98] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Bold orange primary - punchy CTA
        default: 
          'bg-primary-orange text-white shadow-sm hover:bg-primary-orange-hover active:bg-[#b35513]',
        // Danger/destructive - vibrant red
        destructive:
          'bg-status-error text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500/40',
        // Outline - clean border with hover fill
        outline:
          'border-2 border-border-soft bg-white text-primary-bark hover:bg-neutral-cream hover:border-primary-orange/30 active:bg-accent-beige/50',
        // Secondary - subtle beige
        secondary:
          'bg-accent-beige text-primary-bark hover:bg-[#f5d9a8] active:bg-[#f0ce94]',
        // Ghost - minimal, just hover state
        ghost:
          'text-primary-bark hover:bg-neutral-cream active:bg-accent-beige/50',
        // Link style
        link: 
          'text-primary-orange underline-offset-4 hover:underline hover:text-primary-orange-hover',
        // Success - bold green
        success:
          'bg-status-success text-white shadow-sm hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500/40',
        // Warning - bold orange-red
        warning:
          'bg-status-warning text-white shadow-sm hover:bg-orange-700 active:bg-orange-800 focus-visible:ring-orange-500/40',
        // Subtle - very light, for secondary actions
        subtle:
          'bg-surface-sunken text-primary-bark border border-border-soft hover:bg-neutral-cream hover:border-border-strong',
      },
      size: {
        default: 'h-10 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5',
        lg: 'h-12 rounded-lg px-8 text-base has-[>svg]:px-6',
        icon: 'size-10 rounded-lg',
        'icon-sm': 'size-8 rounded-md',
        'icon-lg': 'size-12 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
