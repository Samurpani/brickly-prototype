# Bricly Dev Briefs — Shared Context (READ FIRST)

These briefs turn the strategy review into buildable work packages. Each brief is self-contained; a developer agent should read THIS file plus their assigned brief before writing code.

## The codebase
- **Primary file:** `Brickly/prototypes/Bricly_CRM_Prototype.html` — a single-file HTML/CSS/vanilla-JS prototype (~14,000 lines). No build step, no framework. Open via `file://` in a browser to run.
- **Test in browser after every change.** No console errors is the bar. There is no test suite.
- **Published mirror:** repo `Samurpani/brickly-prototype` (GitHub Pages via Actions workflow). Do NOT publish unless asked.

## Architecture you must reuse (do not reinvent)
- **Router:** `go(page)` switches `.page` divs by id `p-{name}`; nav items `.ni`; breadcrumb `#bc`. Per-page render functions are called via `setTimeout` in `go()`.
- **Roles:** global `role` variable (`'rep' | 'mgr' | 'op'`), switched by the R/M/O buttons top-left. Studio nav shows only for `op`.
- **Data (all in-memory JS, mutate freely):**
  - `allProps` — 20 units across 5 developments (`id, dev, type, loc, floor, beds, baths, sqm, ext, price, status: available|hold|sold, ready, features[]`)
  - `pipelineCards` — opportunities (`id, contact, email, phone, owner, project, unit, unitIds[], stage, offer, nextStep, daysInStage, holdApproval, activity[]…`)
  - `oppExtData[oppId]` — `{notes[], reminders[], tasks[], files[], docChecklist[], marketingLinks[], bids[], contract}`
  - `pipelineStages` — 14 locked stages (keys like `hold`, `reservation`, `promise_of_sale_signed`)
  - `presentSessions` — saved Present Mode sessions
- **UI helpers:** `toast(msg)` for feedback. `showQuickInput(label, placeholder, cb)` for text input — **never use `prompt()` or `confirm()`** (they throw in the demo harness).
- **Present Mode** (buyer showroom): everything namespaced `pm*`, opened via `pmOpen()` / `pmOpenFromOpp(oppId)`. Reusable pieces: `pmPlanSVG(unit, cfg, compact)` floor plans, `pmPhotoSVG(kind)` photos, `pmEuro(n)`, `PM_DEV_META`, `PM_DEV_STORY`, config pricing via `pmPriceFor(unit, cfg)`.

## Design language
- **CRM (warm light, default for new work):** bg `#f3efe4`, accent `#cb4d1a` (rust), border `#dbcfbb`; fonts Space Grotesk (body), Syne (display), IBM Plex Mono. Reuse `.btn`, `.btn-accent`, `.btn-sm`; pills `.pill p-green|p-amber|p-red`.
- **Present Mode (cream/orange, buyer-facing):** vars `--pm-*`, accent `#e8590c→#f5a623`, charcoal primary buttons.
- Namespace ALL new CSS classes and JS functions with the prefix given in your brief.

## Known pitfalls (learned the hard way)
1. **Duplicate/legacy blocks exist** in the file (e.g., a stray orphan button around line ~1393 inside `p-props`). Always verify your edit landed in the *active* block by testing in the browser, not just by grep.
2. **Pointer capture:** if you add ANY clickable overlay inside `#pm-canvas-wrap`, you MUST add its selector to `pmIsOverlayEvent()` or the 3D canvas steals its clicks.
3. Keep everything client-side and demo-safe: no new network calls, no localStorage requirement, no `prompt()`/`confirm()`.
4. The file is huge — prefer appending new `<style>`/`<script>`/`<div>` blocks near the end (before `</body>`), following the Present Mode pattern, plus minimal surgical edits to nav/existing pages.

## Product context (why these features)
Strategy: **keep the CRM as system of record, kill it as the rep's interface.** Reps get three surfaces: WhatsApp capture (Brief 01), Present Mode (built), and an AI daily brief (Brief 02). Managers/owners keep the full CRM. Market data: only ~37% of reps use CRMs; reps spend ~28% of time selling; interactive 3D sells units ~31% faster. The WhatsApp parser (job "A1") is a hard v1 requirement in `docs/source/Bricly-MVP.md`.

## Build order & dependencies
1. `01-whatsapp-capture.md` — independent
2. `02-ai-assistant-home.md` — independent (if 01 is done, reuse its parser helpers)
3. `03-buyer-microsite.md` — independent (reuses Present Mode helpers)
4. `04-persona-nav.md` — do AFTER 01 & 02 (it surfaces them in the rep nav)
5. `05-scope-tidy.md` — anytime; smallest

Only ONE agent may edit the file at a time. Work sequentially.

## Definition of done (every brief)
- Feature works end-to-end in the browser via `file://` with zero console errors
- Existing flows still work: role switching, Pipeline → opportunity detail, Present Mode full flow (lobby → showroom → unit → wrap-up)
- New code is namespaced per the brief; no edits inside Present Mode script blocks unless the brief says so
- The brief's 5-step demo script passes
