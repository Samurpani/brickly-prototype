# 01 — Product Overview

**Status:** Canonical · Updated 2026-08-13 · Ground truth: `Brickly/prototypes/Bricly_OS_Prototype.html` (v2)

Scope tags used across all canonical docs:
- **[MVP]** — in the v1 build the dev team ships (see `02-mvp-scope.md`)
- **[MVP·concierge]** — the UI ships in v1, but fulfilment behind it is manual (Bricly team) — the "Wizard-of-Oz" model
- **[v2-full]** — exists in the v2 prototype as the design target; built after v1
- **[Post-MVP]** — vision-tier; documented but not in the prototype or deliberately deferred

---

## 1. What Bricly is

**Bricly OS is the operating system for real-estate developers' sales and marketing.** It replaces the agency-commission model with a product: a CRM built for the sales rep (not the manager), an AI-assisted Studio that produces a development's marketing assets, and a Marketing layer that runs campaigns and attribution — all on one record, from launch to the last unit sold.

Three modules, one workspace switcher:

| Workspace | One-liner | Prototype status |
|---|---|---|
| **Bricly OS (CRM)** | Where the sales team lives: pipeline, opportunities, units, developments, contacts, calendar, reports. | Fully built in v2 prototype |
| **Bricly Studio** | Design & fulfilment: brief intake wizard → asset production → delivery gallery. Concierge-fulfilled in v1, automated later. | Built in v2 prototype (owner-gated) |
| **Bricly Marketing** | Ads & campaigns: overview, campaigns, leads & attribution, budget, channel connections. | Built in v2 prototype (owner/marketing-gated) |

North star (from `Bricly_CRM-_Product_Vision.md`): *"Watches and listens to you work and gives you the future. You do what you do best; it acts as your assistant."* The long-run bet is a full-lifecycle developer OS (site sourcing → feasibility → permits → construction → sales → post-sale) — that remains **[Post-MVP]** vision; the wedge is marketing + sales.

## 2. Who it's for

| Persona (in prototype) | Role | What they get |
|---|---|---|
| **Rep** (default) | Sales rep | Today page (agent-briefed morning: narrative brief, prep rooms, one-tap decisions — scripted demo of the agent-staff vision), pipeline, opportunity journeys, WhatsApp commands, Present Mode. **The product is built rep-first** — if reps don't use it, the data is false and everything above collapses (the "truth principle"). |
| **Manager** | Sales manager | Approvals (holds, reservations, exceptions), team visibility, full deal access where reps see anonymised locks. |
| **Marketing** | Marketing lead | Marketing workspace, automations, campaign attribution. **[v2-full]** — role deferred in v1. |
| **Owner** | Developer / MD | Cross-portfolio dashboards, reports, Studio access, workspace administration. |

Buyers never log in in v1 — they experience Bricly through Present Mode sessions, shared links/brochures, and WhatsApp. The post-sale buyer portal is **[Post-MVP]**.

## 3. The core value loop

1. **Launch** — developer's project is set up (units, floor plans, brand). Studio produces the launch package **[MVP·concierge]**.
2. **Capture** — leads arrive via hosted forms, ads, walk-ins, WhatsApp **[MVP: forms + manual]**.
3. **Sell** — reps work opportunities through a 12-stage journey (Selling phase → "Offer accepted" gate → Deal phase) with the CRM doing the admin. Present Mode turns meetings into showroom experiences **[v2-full, prototype-complete]**.
4. **Update** — unit states (Available → Hold → Reserved → Sold) propagate everywhere with manager approval gates **[MVP]**.
5. **Report** — live dashboards for manager and owner **[MVP: basic]**.
6. **Repeat** — sell-through data and brand assets carry to the developer's next launch (the retention/backfill thesis).

## 4. What makes it different

- **Rep-first CRM.** Every other CRM makes reps do double work (selling + reporting). Bricly's interaction model is: the system observes, prepares, and drafts; the rep confirms with one tap. Anything reaching a buyer always requires the rep's explicit send.
- **The meeting is the product.** Off-plan property doesn't exist yet, so Present Mode builds it in the buyer's mind: live filtering on a map, a showroom view with unit hotspots, per-unit finish/layout customisation with a live price ticker, compare, and a one-tap handoff back into the CRM.
- **Product-priced, never commission-priced.** Recurring per-development fee banded by size + one-time activation. See `08-business/README.md` → `bricly-pricing-plan-final.md`.
- **Agent-ready architecture.** The capability surface is designed to be exposed via MCP. The prototype's Settings → WhatsApp/MCP tab shows the literal v1.1 tool contract. In v1, the only agent feature is the WhatsApp command parser **[MVP]**.
- **Honest concierge era.** v1 Studio is a Wizard-of-Oz: real interface, human fulfilment. Founding members are told plainly. v1.1 automates generation behind the same interface so nothing users learn is thrown away.

## 5. Document map

| Doc | What it answers |
|---|---|
| `02-mvp-scope.md` | What the dev team builds first (proposed cut, per-feature fulfilment model) |
| `03-data-model.md` | Entities, states, relationships — prototype ↔ MVP ↔ ideal mapping |
| `04-ui-surface.md` | Every screen and interaction in the v2 prototype |
| `05-flows/` | The 8 operating flows, remapped to v2 screens with scope tags |
| `06-integrations-and-ai.md` | WhatsApp, MCP contract, Chat/Ask assistant, automations, external services |
| `07-dev-handoff.md` | Prototype guide, what's simulated, build order, architecture notes |
| `08-business/README.md` | Pointers to pricing, P&L, GTM and marketing standards (numbers live in source docs) |
| `../REVIEW-LOG.md` | Every discrepancy found in the doc audit; open decisions |

Source/vision documents remain in `Brickly/docs/source/` — they describe the **ideal product** and are kept as design intent, not build spec.
