import * as React from "react"

import { cn } from "@/lib/utils"

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "accent"
}) {
  const styles =
    tone === "success"
      ? "bg-[var(--ok)]/12 text-[var(--ok)]"
      : tone === "warning"
        ? "bg-[var(--warn)]/12 text-[var(--warn)]"
        : tone === "accent"
          ? "bg-[var(--accent)]/12 text-[var(--accent)]"
          : "bg-zinc-200/70 text-zinc-700"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        styles,
        className,
      )}
      {...props}
    />
  )
}
