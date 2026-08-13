# 02 — MVP Scope

**Status:** Canonical · Updated 2026-08-13 · Basis: `source/Bricly-MVP.md` (locked v1 scope) reconciled with the v2 prototype and Sam's 2026-08-13 decisions. **The module cut in §3 is a proposal awaiting Sam's sign-off** (REVIEW-LOG D2).

---

## 1. The two decisions that frame everything

1. **The v2 prototype is the design truth; the MVP is a subset of it.** The dev team builds toward the prototype's UI and interaction patterns. Where this doc cuts a module, the prototype remains the spec for when it's built.
2. **Fulfilment model B (decided by Sam, 2026-08-13):** the v2 UI ships, but **Studio/generation is concierge-fulfilled behind it** for the first cohort (Wizard-of-Oz). Humans produce every asset; the interface is the same one that becomes automated in v1.1. Founding members are told plainly. This matches the locked MVP doc — and the v2 prototype already contains the concierge-compatible Studio workspace (wizard + queue statuses + delivery gallery).

Release train (unchanged from the locked scope): **v1** (M1–M3 build, M3–M6 founding members) → **v1.1** (Studio generation, MCP server, ~M6 commercial launch) → **v1.2** (automations engine, DocuSign/Stripe, mobile) → **v2** (post-sale layer, forecasting, consultation sessions).

## 2. v1 success criteria (from locked scope)

1. **Activation** (weeks 1–2): member onboarded, team in CRM, project + units loaded, pipeline live.
2. **Operational backbone** (months 1–3): CRM is the source of truth — inventory, leads, opportunities, appointments, payment visibility, contract status. Reps using WhatsApp commands.
3. **Studio assets delivered** (M3–M6 via Wizard + concierge): briefs in, assets back, through the product.

Build capacity (2 devs + 1 designer, AI-leveraged, 3 months): ~15 entities end-to-end, ~37 Tools / ~21 Resources as API surface, ~16 primary screens, 3 dashboards, the Studio Wizard cluster, 1 specialised feature (WhatsApp parser), 1–2 stretch goals. **Anything beyond is out of v1 by definition.**

## 3. Proposed module cut (v2 prototype → v1 build) — FOR SAM'S REVIEW

Fulfilment column: **Real** = working software logic · **Concierge** = UI real, humans behind it · **Simulated in prototype** = demo-ware today, listed so nobody mistakes it for built.

### Tier 1 — v1 core (build first)

| v2 module | v1 scope | Fulfilment |
|---|---|---|
| Opportunities board + table | Full: 7-column board, money pill, drag transitions, new-opp drawer. Closed tab **simplified**: keep the 5-step completion stepper; drop the commissions summary stats to v1.2 (no Commission entity in v1) | Real |
| Opportunity detail | Full journey bar (12 stages, gate, checklists, CTA advance), activity feed + composer, rail cards (contact/units/offer/blocker), Deal Room (key dates, payments, docs), Documents tab with lifecycle chains, Notes tab | Real (AI-draft chip = stretch; "owns"/archive view = v1.1) |
| Units + Unit detail | Full list/filters/sort/peek + detail page. Lock-strips role gating | Real |
| Developments + detail | Card/list, Overview / Availability / Media tabs. **Visual Search tab deferred to v1.1** (computed hotspots are demo-ware; needs per-project photo + coordinate data) | Real |
| Contacts + detail | Full list, peek, page, new-contact drawer. Bulk bar **reduced**: assign/status/tag/export; defer merge + bulk-message composer to v1.1 | Real |
| Dashboard ×3 (rep/manager/developer) | Per locked scope. Manager variant includes the **approvals queue** (v2 has no dedicated Approvals page — surface pending ApprovalRequests as a manager dashboard block + bell) | Real |
| Calendar | Month/week/day, event drawer, opp-linked events. External sync = stretch (Google read-only) | Real |
| Settings | Profile/Team/Notifications/Integrations + WhatsApp/MCP config (Connection/Commands/Behaviour tabs; Agents/Activity tabs v1.1) | Real |
| WhatsApp command parser | 3–5 commands at launch from the grammar in `06-integrations-and-ai.md` §2 | Real (the one specialised feature) |
| Lead capture | Tier 1 (hosted form per project) + Tier 4 (manual/walk-in). Phone-uniqueness blocking, simple round-robin | Real |
| Studio workspace (Wizard) | Brief wizard (7 steps) + Projects status view + Asset library + internal fulfilment queue. File write-back to CRM Documents | **Concierge** |

### Tier 2 — in v1 if velocity allows (stretch, pick 1–2 at end of M2 — per locked scope)

| Item | Notes |
|---|---|
| Studio custom render request from Opportunity/Unit context ("Personalise" buttons) | High priority — validates personalisation thesis; concierge-fulfilled ~24h |
| Google Calendar read-only sync | |
| Read-only home chat (Ask panel, Scope 1) | |
| Voice note → Activity transcription | |

### Tier 3 — v1.1 (M3–M6 build, ships ~M6)

| v2 module | Why deferred |
|---|---|
| **Present Mode** (all 5 screens) | Prototype-complete and the best demo in the product, but a large front-end build with real dependencies (per-dev photography, render variants, floor-plan data). Ship it as the headline of v1.1 alongside Studio generation — the two share assets. Interim: reps demo from the prototype itself. |
| Today page | The agent-briefed morning page (narrative brief, Needs You action rooms, meeting-prep rooms, sweep, live heat updates) depends on prioritisation logic + calendar + comms ingestion — and its "Cole"/"Ella" content is fully scripted in the prototype. v1's rep dashboard covers the basics; Today is the v1.1+ north star. |
| Studio generation behind the Wizard | The whole point of v1.1 (brand/render/brochure/microsite generation, CAD-to-JSON, AI unit import) |
| Marketing workspace | Marketing Lead role is v1.1 per locked scope; UI exists |
| Tray → Compare → Checkout | Depends on configurator data (finishes/layouts/pricing deltas); pairs with Present Mode |
| Personalise takeover (self-serve) | v1 = concierge request path only |
| Visual Search tab, contact merge, owns/archive view, AI-draft chip | Polish items listed above |
| MCP server exposure | Contract drafted; expose the v1 API surface |

### Tier 4 — v1.2+ (unchanged from locked scope)

Automations **engine** (builder UI exists in prototype), DocuSign, Stripe deposits, two-way calendar, agency attribution/Partner, Commission entity + payout flows, mobile/tablet, ad webhooks, inbound LLM parsing. **v2:** post-sale layer, forecasting, consultation sessions, custom reports. **Permanently out:** deed execution, mortgage processing, bank-administered payments, notary workflows, snagging beyond logging.

## 4. What the prototype simulates (never mistake for built)

| Prototype behaviour | Reality |
|---|---|
| Today page briefs, prep rooms, heat updates (attributed to "Cole"/"Ella") | Fully scripted per-persona demo content. No agent exists. |
| "✦ Generate custom render" (Present/Personalise) | 1.5s shimmer + pre-made photo swap. No generation exists. |
| Chat/Ask answers | Hardcoded intent matching on demo data |
| Automations "active" counts, campaign metrics, report series | Seeded demo data (12-month series is mock) |
| WhatsApp/MCP connection card | Static mock — no endpoint exists |
| Buyer link / brochure / microsite artifacts + engagement lines | Fake strings logged as feed items; engagement ("Opened 3×") is seeded |
| All persistence | In-memory JS + localStorage (chats, tray). No backend anywhere. |

## 5. Entity & capability budget (locked)

15 entities · ~62 capabilities (~37 Tools / ~21 Resources / 4 Prompts: team_performance_overview, follow_up_cadence, approval_triage, lead_allocation). Details: `03-data-model.md`. Stage machine: implement the 12-key journey + lifecycle field, render as board groupings (`03-data-model.md` §2.4).

## 6. Concierge operating model (v1 product, not a workaround)

Per locked scope §10: concierge onboarding (workspace provisioning, CSV-normalised unit import, 1–2h call), training, Studio production behind the Wizard (external tools), ~24h custom render SLA, manual lead imports from members' ad funnels, direct WhatsApp support. Team: founder + 1 render/brand contractor (M3–M6); queue in Notion/ClickUp; every brief/format documented as v1.1 training data. Onboarding pace: 1–2 founding members/week — the fulfilment load behind the Wizard is the bottleneck to watch and the v1.1 automation priority signal.

## 7. Numbers note ⚠️

The locked MVP doc's commercial figures (customer ramp, ACV, runway) are **stale v14-era values**; the current model is **PL v19** (`source/bricly-pl-v19-change-memo.md`: 10 customers Y1, €100k blended committed ACV, €5M ARR ~M33, seed €500–750k at M9–M12). See REVIEW-LOG F1/F2. Build scope is unaffected.
