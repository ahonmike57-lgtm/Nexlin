import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "danger" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-white hover:bg-primary-hover": variant === "default",
          "border-transparent bg-secondary text-white hover:opacity-90": variant === "secondary",
          "border-transparent bg-error text-white hover:opacity-90": variant === "danger",
          "border-transparent bg-success text-white hover:opacity-90": variant === "success",
          "border-transparent bg-warning text-white hover:opacity-90": variant === "warning",
          "text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }