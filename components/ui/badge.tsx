import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Default - subtle neutral
        default:
          "bg-status-neutral-bg text-status-neutral border border-status-neutral-border",
        // Success - vibrant green
        success:
          "bg-status-success-bg text-status-success border border-status-success-border",
        // Warning - bold amber/orange
        warning:
          "bg-status-warning-bg text-status-warning border border-status-warning-border",
        // Error/Destructive - clear red
        destructive:
          "bg-status-error-bg text-status-error border border-status-error-border",
        // Info - confident blue
        info:
          "bg-status-info-bg text-status-info border border-status-info-border",
        // Primary - brand orange
        primary:
          "bg-primary-orange-light text-primary-orange border border-primary-orange/20",
        // Secondary - warm beige
        secondary:
          "bg-accent-beige text-primary-bark border border-accent-brown/10",
        // Outline - just border
        outline:
          "bg-transparent text-primary-bark border border-border-strong",
        // Solid variants for high emphasis
        "success-solid":
          "bg-status-success text-white border-transparent",
        "warning-solid":
          "bg-status-warning text-white border-transparent",
        "destructive-solid":
          "bg-status-error text-white border-transparent",
        "info-solid":
          "bg-status-info text-white border-transparent",
        "primary-solid":
          "bg-primary-orange text-white border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
