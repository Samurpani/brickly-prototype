"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { navItems } from "@/lib/mvp-data"

export function MvpShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <main className="mx-auto min-h-svh max-w-7xl p-3 md:p-5">
      <div className="app-shell rise grid min-h-[calc(100svh-26px)] grid-cols-1 gap-3 rounded-[28px] p-3 md:grid-cols-[250px_1fr] md:p-4">
        <aside className="panel rise rounded-[22px] p-3 [animation-delay:60ms]">
          <div className="rounded-[18px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(213,86,31,0.08),rgba(255,255,255,0.7))] p-3">
            <p className="mono-font text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Bricly Internal
            </p>
            <h1 className="display-font mt-2 text-2xl font-semibold leading-tight">MVP Console</h1>
            <p className="mt-1 text-xs text-[var(--muted)]">Founding-member operations</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="accent">Prototype</Badge>
              <Badge tone="success">Synced</Badge>
            </div>
          </div>

          <nav className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-1 md:text-sm">
            {navItems.map((item, index) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl border px-3 py-2.5 transition duration-300 hover:-translate-y-0.5 ${
                    active
                      ? "border-[var(--accent)] bg-[linear-gradient(180deg,rgba(213,86,31,0.1),rgba(255,255,255,0.92))] text-[var(--ink)] shadow-sm"
                      : "border-[var(--line)] bg-white/55 text-[var(--muted)] hover:border-[var(--accent-soft)] hover:text-[var(--ink)]"
                  }`}
                  style={{ animationDelay: `${index * 36}ms` }}
                >
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="md:hidden">{item.short}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <section className="grid min-h-0 grid-rows-[auto_1fr] gap-3">
          <header className="panel shimmer rise rounded-[22px] p-3 [animation-delay:120ms]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mono-font text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  CRM + Studio Wizard MVP
                </p>
                <h2 className="display-font mt-1 text-3xl font-semibold leading-tight">{title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="micro-float rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-right">
                  <p className="mono-font text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Status
                  </p>
                  <p className="text-sm font-medium text-[var(--ok)]">Ready for prototype testing</p>
                </div>
                <Button variant="secondary">Preview</Button>
                <Button>Save</Button>
              </div>
            </div>
          </header>

          <div className="min-h-0 overflow-auto rounded-xl">{children}</div>
        </section>
      </div>
    </main>
  )
}
