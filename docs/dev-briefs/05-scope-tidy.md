# Brief 05 — Scope Tidy (prefix `st`) — smallest, anytime

**Goal:** Make the prototype tell an honest v1 story per `docs/mvp-build-checklist.md` (Marketing/Automations are v1.1, not v1). Read `00-README-shared-context.md` first.

## Build

1. **v1.1 feature flag:** hide the "Marketing" and "Automations" nav items by default for ALL roles. Add a toggle in Settings — "Show v1.1 preview features" — that reveals them with a small "v1.1" badge on each nav item. Direct navigation (`go('marketing')` / `go('automations')`) should still work when the toggle is on; when off, redirect to Home with a toast ("Marketing is a v1.1 feature").
2. **Naming:** standardize user-visible strings on **"Bricly"** (one k) — the docs' canonical spelling. UI strings only (sidebar logo, page titles, headings, toasts); do NOT rename file paths, ids, CSS classes, or JS identifiers.
3. **Remove the orphan legacy button** inside `p-props` (~line 1393: a stray duplicated "Start render-first pack" button sitting between the page header and the search bar, outside any card). Verify the Properties page renders identically after removal.
4. Nothing else. Resist the urge to refactor.

## Demo script (all must pass)
1. Fresh load → Marketing/Automations absent from the nav in all three roles
2. Settings → toggle on → both appear with a v1.1 badge and their pages load correctly
3. Toggle off → `go('marketing')` redirects to Home with a toast
4. Properties page renders unchanged; orphan button gone
5. No user-visible "Brickly" remains (code identifiers untouched); zero console errors across roles
