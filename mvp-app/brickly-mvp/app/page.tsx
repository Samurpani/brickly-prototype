export default function Page() {
  return (
    <main className="min-h-svh bg-[var(--bg)] p-6 text-[var(--ink)]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--line)] bg-white/85 p-6 shadow-[0_16px_44px_rgba(79,59,26,0.08)]">
        <p className="mono-font text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Bricly prototype launcher</p>
        <h1 className="display-font mt-2 text-4xl font-semibold">Choose Prototype</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Original attached prototypes were preserved and restyled with the new design system overrides.
        </p>

        <div className="mt-6 grid gap-3">
          <a
            href="/prototype/crm.html"
            className="rounded-xl border border-[var(--line)] bg-[linear-gradient(180deg,rgba(203,77,26,0.1),rgba(255,255,255,0.9))] p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="display-font text-2xl font-semibold">CRM Prototype</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Unified CRM prototype with Studio now integrated into the left sidebar as part of the same system.</p>
          </a>
        </div>
      </div>
    </main>
  )
}
