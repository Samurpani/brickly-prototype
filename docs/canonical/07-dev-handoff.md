# 07 — Dev Handoff: Working With the v2 Prototype

**Status:** Canonical · Updated 2026-08-13 · Audience: the dev team building v1

## 1. What you're holding

`Brickly/prototypes/Bricly_OS_Prototype.html` — one self-contained HTML file (~10k lines: CSS + vanilla JS, no build step, no framework, no backend). It is the **design truth**: every screen, interaction, state transition, and copy string you build should match it unless `02-mvp-scope.md` cuts or defers the module. Open it in a browser; live mirror at github.com/Samurpani/brickly-prototype (⚠️ mirror contents pending Sam's decision on excluding business docs — REVIEW-LOG D3).

External deps: Google Fonts (Inter), Chart.js CDN (Reports), Google Maps embed (dev detail). Design tokens duplicated at `Brickly/design-system/tokens.json` — treat that file as the token source when extracting a real design system.

## 2. Map of the file (JS namespaces)

| Prefix | Module | Prefix | Module |
|---|---|---|---|
| (globals) | STAGES, JOURNEY, OPPS, EXT, CONTACTS, DEVS, UNITS, personas, workspace switcher | `rp` | Reports |
| `PERSONAS`/`tstate` | Today page (per-persona brief, Needs You action rooms, day/prep rooms, sweep, heat — all scripted) | `st`/`stwa` | Settings · WhatsApp/MCP page |
| `opp`/`oj` | Opportunities board/table · Opportunity detail + journey | `au` | Automations |
| `un`/`dv` | Units · Developments | `s`/`S_` | Studio workspace (wizard, projects, asset library) |
| `ct` | Contacts | `mk`/`MK_` | Marketing workspace |
| `pz` | Personalise takeover | `cv` | Chat/Ask |
| `pr` | Present Mode (5 steps) | `ws` | Workspace/persona menu |
| `tr`/`cmp` | Selection tray · Compare/Checkout | | |

Key data anchors (line numbers drift; grep the names): `STAGES` (7 board columns), `JOURNEY` (12-stage machine with `cta`/`req[]`/`guide`/`dateLabel`), `OPPS` (21) + `EXT` (extended per-opp data), `COMMIT_STAGES`, `CLOSED_STEPS`, `CONTACTS` (19 derived + 13 network), `DEVS` (5), `UNITS` (38, ids `#CM____`), `ST_MCP_TOOLS`, `AU_WORKFLOWS`, `SWIZ_STEPS`/`S_BRIEF_TYPES`, `MK_CAMPAIGNS`.

## 3. Real vs simulated vs concierge

**Real logic worth porting conceptually:** the 12-stage journey machine (checklist gating → CTA advance → board-stage sync → next-action reset → feed log), money display rules (`money()`, Budget→Offer pill flip at `COMMIT_STAGES`), live-derived counters/KPIs (`unDealsFor`, `rpKPIs` — derive, never denormalise), unit↔opportunity linkage, role gating per persona, tray persistence.

**Simulated (demo-ware — full list in `02-mvp-scope.md` §4):** Today's agent briefs/prep rooms ("Cole"/"Ella" content is scripted), render generation (shimmer + photo swap), Chat answers (hardcoded intents), WhatsApp/MCP connection, automations metrics, 12-month report series, buyer links/brochures/microsites + engagement lines (fake strings), all persistence (in-memory + localStorage keys `briclyChats`, `briclyTray`).

**Concierge in v1:** everything behind the Studio Wizard. **You must build the internal fulfilment queue** — briefs need somewhere for humans to see, work, and mark Delivered (Notion/ClickUp acceptable for M1; in-product by M3).

## 4. Recommended build order (from the locked M1–M3 plan)

- **M1 — Foundations:** data model (15 entities, `03-data-model.md`), auth + roles, workspaces, Developments/Units CRUD + import, Contacts. *Decision to make first:* implement the JOURNEY keys + lifecycle field as the opportunity state machine; board columns are a configurable grouping over it (`03-data-model.md` §2.4).
- **M2 — The core loop:** Opportunities board/table, Opportunity detail (journey, feed, rail, Deal Room, Documents), approval gates, WhatsApp parser (3–5 commands), lead form + routing, dashboards ×3 (manager variant carries the approvals queue — v2 has no Approvals page ⚠️, see `04-ui-surface.md` §5). **Feature freeze end of M2 week 3** (locked scope risk control).
- **M3 — Completion:** payments/key dates, document chains, Calendar, Reports (honest KPIs only), Studio Wizard + queue + Asset library, Settings, notifications; then 1–2 stretch goals (`02-mvp-scope.md` Tier 2).

## 5. Architecture guidance (prototype → product)

1. **Extract the data layer first.** The prototype's arrays are the seed/fixture format; the entity shapes in `03-data-model.md` §3 are your schema starting point.
2. **Real routing.** The prototype swaps `<section>`s with JS; the product needs URL-addressable screens (deep links to opp/unit/contact are assumed by WhatsApp notifications).
3. **State machine as server truth.** Stage transitions, checklist satisfaction, and approval gates are server-side rules; the UI never mutates stage directly.
4. **Componentize the repeated primitives:** status pills, money pill, peek panels, drawers, feed items, checklist popovers, stat cards — they recur across every module.
5. **Keep the single-file prototype untouched** as reference; don't fork it into the product repo.

## 6. Pitfalls

- Persona switcher (`curPersona`) fakes auth — real role enforcement must be server-side.
- Some prototype data is deliberately inconsistent-looking (held units with expired dates, overdue actions) — those are seeded demo states, not bugs to "fix" in fixtures.
- Prices: never display raw numbers; go through the `money()` rules incl. hide-prices mode in Present.
- The Closed tracker's commission stats are v1.2 (no Commission entity in v1) — build the stepper, skip the stats row.
- localStorage keys `briclyChats` / `briclyTray` will collide if you embed the prototype alongside the product on one origin.

## 7. Reference docs

`01-product-overview.md` (what/why) · `02-mvp-scope.md` (what to build) · `03-data-model.md` (schema) · `04-ui-surface.md` (every screen) · `05-flows/` (behaviour) · `06-integrations-and-ai.md` (WhatsApp grammar, MCP contract, AI posture) · REVIEW-LOG (open questions — check [NEEDS SAM] items before building anything they touch).
