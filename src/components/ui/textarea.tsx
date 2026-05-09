import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground selection:bg-primary/20 border-border w-full min-w-0 rounded-[10px] border bg-card px-4 py-3 text-[15px] transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "focus:border-primary focus:ring-1 focus:ring-primary/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
