# Bricly Docs — INDEX

**Updated 2026-08-13** · One canonical set serving two purposes: (1) dev team onboarding for the v1 build, (2) upload to the Bricly Claude project for team Q&A.

**Ground truth:** `Brickly/prototypes/Bricly_OS_Prototype.html` (v2). Where any doc and the prototype disagree on UI/behaviour, the prototype wins; where numbers disagree, `source/bricly-pl-v19-change-memo.md` + `source/bricly-pricing-plan-final.md` win.

**Scope tags used everywhere:** `[MVP]` v1 build · `[MVP·concierge]` v1 UI, human fulfilment · `[v2-full]` in prototype, built post-v1 · `[Post-MVP]` vision.

## Canonical docs (read in order)

| Doc | Purpose |
|---|---|
| `01-product-overview.md` | What Bricly OS is: workspaces, personas, value loop, differentiators, tag definitions |
| `02-mvp-scope.md` | **The proposed v1 cut** (⚠️ awaiting Sam's sign-off — D2): tiered module table, fulfilment model, success criteria, what's simulated |
| `03-data-model.md` | Prototype ↔ MVP-15 ↔ ideal-32 entity mapping, JS shapes, 12-stage state machine recommendation |
| `04-ui-surface.md` | Every v2 screen (OS + Studio + Marketing), locked-16-screens mapping, 2 open build decisions (Leads inbox, Approvals queue) |
| `05-flows/` (README + 8 docs) | Operating flows remapped to v2 screens with per-step tags; `present-mode.md` supersedes `source/Present-Mode-Overview.md` |
| `06-integrations-and-ai.md` | AI posture per release, WhatsApp command grammar, MCP contract, automations, concierge routing |
| `07-dev-handoff.md` | Prototype anatomy, real/simulated/concierge, M1–M3 build order, architecture guidance, pitfalls |
| `08-business/README.md` | Pointer to authoritative business docs; number-conflict flags; no figures copied |
| `../REVIEW-LOG.md` | All discrepancies + decisions. **[NEEDS SAM]: F1 stale MVP figures · D2 MVP-cut sign-off · D3 public-mirror exclusions** |

## Claude project upload list

**Upload:** all of `canonical/` (incl. `05-flows/*`, `08-business/README.md`) + REVIEW-LOG.md, plus these source docs for depth: `Bricly-MVP.md` (with F1 caveat noted in 08-business), `bricly-jobs.md`, `bricly-data-model.md`, `bricly-capability-surface.md`, `bricly-ui-surface.md`, all 8 `bricly-flow-*` / onboarding / sale-and-inventory docs, `bricly-pricing-plan-final.md`, `bricly-pl-v19-change-memo.md`, `Bricly Marketing SOPs.md`, `Bricly_Marketing_Collateral_Production_Standard.md`, `Bricly_CRM-_Product_Vision.md`, `bricly-ideas-and-features.md`, `bricly-sales-knowledge-file-updates.md`.

**Do NOT upload:** `bricly-pricing-plan.md` (v18, superseded — F3) · `Present-Mode-Overview.md` (legacy prototype — superseded by `05-flows/present-mode.md`).

**Suggested Claude project instructions:**

> You are the Bricly team's product brain. Ground every answer in the canonical docs (00–08) first; use source docs for depth. The v2 prototype is design truth; PL v19 + pricing-plan-final are financial truth — Bricly-MVP.md's commercial figures are stale (see 08-business/README.md), but its scope is valid. Always state a feature's scope tag ([MVP] / [MVP·concierge] / [v2-full] / [Post-MVP]) when discussing it. If docs conflict, say so and cite REVIEW-LOG. Never invent financial numbers.

## Source docs (`source/`, 23 files — inputs, unmodified)

Product: Bricly-MVP · jobs · data-model · capability-surface · ui-surface · ideas-and-features · Product Vision · sales-knowledge-file-updates · Present-Mode-Overview (superseded). Flows: sales-process · lead-capture-and-routing · Sale_and_Inventory_Update · agent-initiated · buyer-customisation · launch-package · go-to-market · relaunch-pivot · onboarding-Flow. Business: pricing-plan-final · pl-v19-change-memo · pricing-plan (superseded) · Marketing SOPs · Marketing Collateral Standard.
