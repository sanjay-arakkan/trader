import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[15px] font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none active:scale-[0.97] active:opacity-80",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-85",
        destructive:
          "bg-destructive text-white hover:opacity-85",
        outline:
          "border border-border bg-card hover:bg-accent",
        secondary:
          "bg-[var(--ios-fill-tertiary)] text-foreground hover:bg-[var(--ios-fill-secondary)]",
        ghost:
          "hover:bg-accent text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        ios: "bg-[var(--ios-fill-tertiary)] text-primary hover:bg-[var(--ios-fill-secondary)]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-[8px] gap-1.5 px-3.5 text-[13px]",
        lg: "h-12 rounded-[12px] px-7",
        icon: "size-11 rounded-[10px]",
        "icon-sm": "size-9 rounded-[8px]",
        "icon-lg": "size-12 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
