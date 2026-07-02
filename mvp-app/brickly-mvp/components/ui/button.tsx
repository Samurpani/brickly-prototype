import * as React from "react"

import { cn } from "@/lib/utils"

export type ButtonVariant = "primary" | "secondary" | "ghost"

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-white shadow-[0_12px_28px_rgba(213,86,31,0.28)] hover:bg-[#c94f1c]"
      : variant === "secondary"
        ? "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-zinc-50"
        : "bg-transparent text-[var(--ink)] hover:bg-black/5"

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40 focus:ring-offset-2 focus:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    />
  )
}
