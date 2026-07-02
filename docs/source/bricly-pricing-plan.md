# Bricly Pricing Plan

High-ticket, value-anchored pricing for off-plan residential developers. Margins, profitability, and the path to €5M ARR.

---

## 1. Summary

Bricly prices against the commission a developer would otherwise pay an agency to sell a development, not against software cost. Agency commission on off-plan runs 4 to 10% of gross development value (GDV). Bricly replaces that for a small fraction of it.

The model has three levers: an annual platform license, a per-development activation fee, and a flat per-unit fee. No public pricing, demo-gated, annual commitment with a minimum, unlimited users within the org.

Fully-loaded gross margins land at 83 to 86% per customer once the recurring AI chat and consulting layer is included. Generation-only margins (render and marketing AI) sit near 98%. The path to €5M ARR needs roughly 112 customers on this model, versus 985 clients on the old €99 + €5/unit model. That is the central reason to move to high-ticket: the same revenue with one-ninth the customer count, which means far less support drag and a higher-quality base.

> **Note:** This supersedes the €99 base + €5/unit/month CRM model and standalone Studio pricing in the current investor P&L (v13). It is a deliberate strategic shift to enterprise, high-ticket pricing. Section 6 reconciles the two.

---

## 2. The pricing model

| Lever | Price | What it covers |
|---|---|---|
| Annual platform license | €10,000 / year | CRM, Studio, onboarding, consulting layer, and the first development |
| Each additional development | €1,500 | Constraint-model ingestion, brand, microsite, base render set and allowance for that development |
| Per unit | €200, flat | Full sales pipeline, buyer engagement, and personalised buyer packs for every unit through to close |
| Minimum annual commitment | €25,000 | Screens out sub-scale buyers, protects the high-ticket floor |
| Term | 12-month commitment | Annual upfront (discounted) or quarterly billing |

Design decisions locked in:

- **Per-unit fee is flat, not tapered, and decoupled from sale price.** Renders are shared across all units of a layout, so per-unit generation cost is near zero and there is no cost reason to taper. The flat fee is justified on displaced commission and the per-unit sales-and-pipeline value, never on "renders per unit."
- **Unlimited users within the org.** Team size does not drive cost, buyer volume does, and that is already captured by the per-unit fee and generation allowance. No seat charge, no seat minimum.
- **One product, multiple entry points.** A developer can enter through Studio or CRM, but always on the platform license and the per-development model. No low-retainer standalone modules.

### Included generation allowance per development

| Development size | Included allowance |
|---|---|
| Standard (up to ~50 units) | Renders for up to 6 layouts, all standard buyer packs, 1 microsite, 1 walkthrough, 10 ad creatives |
| Large (50+ units) | Same, plus expanded external close-up renders and up to 3 walkthroughs |

Top-ups trigger only for additional layouts beyond 6 and heavy custom buyer-render intensity. Everything in the bundle is fixed-cost or near-free generation, so the allowance is generous without margin risk. Top-ups are sold in human-readable output blocks, never raw credits, with pre-authorised auto-replenish so generation never stops mid-launch.

---

## 3. Cost of goods (COGS)

Raw AI provider costs, current 2026 rates. Figures shown in EUR, converted from USD provider pricing at approximate parity. Generation cost is tiny relative to contract value, so FX is immaterial at this granularity.

### Provider rates

| Generation type | Tool | Rate |
|---|---|---|
| Branding, copy, reasoning | Claude Opus | $5 / $25 per million input/output tokens |
| Buyer-pack text | Claude Sonnet | $3 / $15 per million tokens |
| Hero property renders | Nano Banana Pro | ~$0.13 (2K) to $0.24 (4K) per image |
| Static ad images | Nano Banana (standard) | ~$0.04 per image |
| Walkthrough video | Kling 3.0 | ~$0.10 per second (~$1.00–1.26 per 10s clip) |

The dominant cost driver is the regeneration multiple, not the per-image price. The figures below assume 3 to 4 attempts per usable asset, which is realistic for developer-grade output.

### Base development pack (generated once per development)

| Component | Tool | Cost |
|---|---|---|
| CAD-to-JSON ingestion | Claude Opus (vision) | €7 |
| Brand generation | Claude / Claude Design | €5 |
| Microsite build (templated) | Claude | €10 |
| Layout render set + development shots (≈50 renders, 4 attempts) | Nano Banana Pro | €35 |
| 10 static ad creatives | Nano Banana | €4 |
| Walkthrough video (~30s, 3 attempts) | Kling | €9 |
| **Base pack total** | | **~€70–80** |
| Large development pack (extra close-ups, 3 walkthroughs) | | ~€150 |

### Per-unit COGS

Renders are shared across all units of a layout, so the marginal cost of a unit is just the personalised buyer-pack text plus occasional custom render variants. **~€3 per unit**, conservative.

### Recurring AI layer COGS (CRM chat + AI consulting)

This is the largest and most variable cost line, and unlike generation it is recurring and scales with the number of active users, not with developments or units. The CRM's embedded AI assistant and AI consulting/advisory features run through Claude (Sonnet-weighted, with Opus reserved for heavier reasoning).

A single active sales user doing ~20 interactions a day, with CRM context injected and multi-step tool loops, costs roughly **€600–900 per active user per year** (working midpoint €800). This is the most uncertain figure in the model and the single biggest optimisation target.

| Active users (typical) | Annual AI layer COGS @ €800/user |
|---|---|
| Small developer (~3 active) | €2,400 |
| Mid developer (~5 active) | €4,000 |
| Large developer (~8 active) | €6,400 |

**This is the cost that genuinely scales with team size.** Generation is driven by buyer and launch volume; the AI layer is driven by how many people use the assistant and how hard. It does not change the no-seat-charge decision (margins remain strong), but it is why the cost controls in Section 7 matter.

Cost-control levers, in order of impact:

1. **Prompt caching** — system prompt, tool definitions, and stable context are 90% cheaper cached. Heavy caching can pull the per-user figure toward €400–500.
2. **Model routing** — most chat on Sonnet or Haiku, Opus only for genuine consulting reasoning. The model-agnostic architecture is built for this.
3. **Retrieval, not context-stuffing** — inject only the relevant CRM slice per query. The difference between a €0.30 task and a €0.05 one.
4. **Generous-but-finite fair-use ceiling** per org, same logic as the generation allowance. Caps worst-case exposure without metering normal use.

---

## 4. Per-customer economics and margins

Three representative customer profiles, built from the input that developers always run multiple developments: small-to-mid run 5 to 10 a year, large run 1 to 2. Commission anchored conservatively at 5% (the low end of the 4 to 10% range) so every savings claim holds at the floor.

### Profile A — Small developer (6 small developments/year, 60 units)

| Line | Amount |
|---|---|
| Platform license | €10,000 |
| Additional developments (5 × €1,500) | €7,500 |
| Units (60 × €200) | €12,000 |
| **Total revenue (ACV)** | **€29,500** |
| Generation COGS (6 base packs + 60 units) | €660 |
| AI layer (CRM chat + consulting, ~3 active users) | €2,400 |
| Infrastructure (allocated) | €1,200 |
| Payment processing (2.5%) | €738 |
| **Total COGS** | **€4,998** |
| **Gross profit** | **€24,502** |
| **Fully-loaded gross margin** | **83.1%** |
| Generation-only margin | 97.8% |
| vs displaced commission (€1.35M @ 5%) | 2.2% — developer saves ~98% |

### Profile B — Mid developer (6 medium developments/year, 210 units)

| Line | Amount |
|---|---|
| Platform license | €10,000 |
| Additional developments (5 × €1,500) | €7,500 |
| Units (210 × €200) | €42,000 |
| **Total revenue (ACV)** | **€59,500** |
| Generation COGS | €1,110 |
| AI layer (CRM chat + consulting, ~5 active users) | €4,000 |
| Infrastructure | €1,500 |
| Payment processing (2.5%) | €1,488 |
| **Total COGS** | **€8,098** |
| **Gross profit** | **€51,402** |
| **Fully-loaded gross margin** | **86.4%** |
| Generation-only margin | 98.1% |
| vs displaced commission (€4.7M @ 5%) | 1.3% — developer saves ~99% |

### Profile C — Large developer (2 large developments/year, 250 units)

| Line | Amount |
|---|---|
| Platform license | €10,000 |
| Additional developments (1 × €1,500) | €1,500 |
| Units (250 × €200) | €50,000 |
| **Total revenue (ACV)** | **€61,500** |
| Generation COGS (2 large packs + 250 units) | €1,050 |
| AI layer (CRM chat + consulting, ~8 active users) | €6,400 |
| Infrastructure | €1,500 |
| Payment processing (2.5%) | €1,538 |
| **Total COGS** | **€10,488** |
| **Gross profit** | **€51,012** |
| **Fully-loaded gross margin** | **82.9%** |
| Generation-only margin | 98.3% |
| vs displaced commission (€8.75M @ 5%) | 0.7% — developer saves ~99% |

### Margin summary

| Profile | ACV | Total COGS | Gross profit | Gross margin |
|---|---|---|---|---|
| Small | €29,500 | €4,998 | €24,502 | 83.1% |
| Mid | €59,500 | €8,098 | €51,402 | 86.4% |
| Large | €61,500 | €10,488 | €51,012 | 82.9% |

Margins land at 83 to 86% fully loaded. The AI chat and consulting layer is now the single largest COGS line, larger than generation, infrastructure, and payments combined. Note that the large developer's margin (82.9%) is slightly below the mid developer's (86.4%) despite higher revenue, because a bigger team consumes more AI on unlimited seats. This is the unlimited-seat decision showing up in the numbers. It does not justify a seat charge at these margins, but it is why the AI cost controls in Section 7 matter. With heavy prompt caching and model routing, the AI layer cost can be cut materially, lifting these margins back toward 88 to 90%.

---

## 5. Profitability

Gross margin is not the constraint. The business is structurally high-margin at the unit level. Net profitability is a function of how many customers the team can win and serve, and the cost of that team.

### Contribution per customer

Each customer contributes €27k to €57k of gross profit per year. Against your existing CPA of ~€600 and a high-touch enterprise motion, even a CPA an order of magnitude higher than the current blended figure leaves payback inside the first development cycle. The LTV:CAC stays well into world-class territory.

### What profitability requires

The cost base that matters is payroll plus demand generation. From the current model, payroll runs ~€290k in Year 1 building to ~€630k by Year 3 across a team scaling toward 12 to 14 people, with software at ~€17k to €30k/year and paid acquisition self-funding from reinvested margin. On the high-ticket model, fewer customers means lower support and infrastructure drag per euro of revenue, but the enterprise sales motion (demo-gated, consultative) carries higher cost per closed deal. Net, the team shape stays similar while each head supports far more revenue.

The break-even logic is unchanged from the investor plan: build phase to M5, first revenue at M6 from warm developer leads, cumulative cash positive around M19. The high-ticket model reaches break-even on fewer signed logos because each one is worth 3 to 4x more.

---

## 6. The path to €5M ARR

### Blended ACV

Assuming a customer base that skews to smaller developers (more of them exist), with a realistic mix:

| Segment | Share | ACV | 
|---|---|---|
| Small | 50% | €29,500 |
| Mid | 35% | €59,500 |
| Large | 15% | €61,500 |
| **Blended ACV** | | **~€44,800** |

### Customers needed

**€5,000,000 ÷ €44,800 ≈ 112 customers.**

| Segment | Customers | ACV | Revenue |
|---|---|---|---|
| Small | 56 | €29,500 | €1,652,000 |
| Mid | 39 | €59,500 | €2,320,500 |
| Large | 17 | €61,500 | €1,045,500 |
| **Total** | **112** | | **€5,018,000** |

### What this looks like versus the old model

| | Old model (investor P&L v13) | New high-ticket model |
|---|---|---|
| Blended ACV | ~€15,400 (Y3 blended), ~€6,200 CRM-recurring/client | ~€44,800 |
| Clients for ~€5–6M ARR | 985 clients (for €6.1M) | ~112 customers (for €5.0M) |
| Customer count to manage | Very high, heavy support load | Low, concentrated, high-touch |
| Sales motion | Volume, paid funnel | Enterprise, demo-gated, consultative |

The high-ticket model reaches comparable revenue with roughly one-ninth the customers. For your ICP and your warm network (10 to 15 confirmed developer leads, founder relationships), 112 customers is reachable through founder-led and a small sales team, without needing a high-volume paid funnel pushing hundreds of low-value accounts.

### Illustrative P&L at €5M ARR

| Line | Amount | % of revenue |
|---|---|---|
| Revenue | €5,018,000 | 100% |
| AI layer (CRM chat + consulting) | (€399,200) | 8.0% |
| Generation (renders, brand, microsite, video) | (€98,100) | 2.0% |
| Infrastructure | (€151,200) | 3.0% |
| Payment processing (2.5%) | (€125,450) | 2.5% |
| **Total COGS** | **(€773,950)** | **15.4%** |
| **Gross profit** | **€4,244,050** | **84.6%** |
| Payroll (team ~12–14, eng + enterprise sales + CS) | (€900,000) | |
| Paid acquisition / demand gen | (€250,000) | |
| Software stack | (€30,000) | |
| Events & conferences (developer ICP) | (€40,000) | |
| Office, legal, misc | (€60,000) | |
| **Total operating cost** | **(€1,280,000)** | 25.5% |
| **EBITDA** | **~€2,964,000** | **~59%** |

At €5M ARR this model produces roughly €2.9 to €3.0M EBITDA at ~59% margin. The AI chat and consulting layer (~€400k) is the largest single COGS line and the main reason total COGS sits near 15% rather than the ~8% it would be on generation alone. Heavy prompt caching and model routing on the AI layer is the lever that moves EBITDA back toward the mid-60s percent.

### A note on ARR composition (be precise with investors)

Only the platform license is hard subscription recurring. The per-development and per-unit fees are usage-based, but they recur because the ICP continuously launches developments, which is their core business.

| Revenue type | At €5M | Nature |
|---|---|---|
| Platform licenses (112 × €10,000) | €1,120,000 | Hard recurring subscription |
| Per-development + per-unit | €3,898,000 | Usage-based, recurs with sustained launch cadence |
| **Total annual revenue** | **€5,018,000** | |

Treating the full €5M as recurring is defensible for this ICP because developers always have multiple developments in flight. Stating the split shows rigour and pre-empts the obvious diligence question.

---

## 7. Strategic notes

**Large-development headroom, deferred to M6.** On a single 200-unit premium development, flat €200/unit captures under 1% of displaced commission (€7M to €14M). This is enormous unclaimed value. Leave it for the founding ten to win logos and case studies, then introduce a value-banded per-unit fee at commercial launch: €200 for units under €500k, stepped up above €500k and again above €750k. This lifts large-developer ACV without touching small developers, because small units sit in the bottom band.

**Founding cohort discount.** If the founding ten are priced below this card to accelerate signups, treat the gap as deliberate deferred revenue to recapture at M6, not as the standard rate. Decide the discount explicitly so you know what you are deferring.

**Update the software stack line.** The investor P&L lists Midjourney, RunwayML, GPT-4, and Supabase as fixed monthly subscriptions. The confirmed stack is per-generation API usage (Nano Banana Pro, Kling, Claude) on Neon, which is what the COGS here is built on. Usage-based generation cost scales cleanly with revenue and is lower than the fixed-subscription budget at current volumes.

**The AI layer is the cost to manage, not the renders.** The CRM chat and AI consulting layer is the largest COGS line and the one that scales with team size on unlimited seats. The render and marketing generation, by contrast, is episodic and trivial (~€1k/customer/year). Keep seats unlimited and free (margins stay strong at 83 to 86%), but treat AI-layer efficiency as an engineering priority from day one: prompt caching, model routing to Sonnet/Haiku, lean retrieval, and a generous fair-use ceiling. This is where 5 to 7 points of gross margin live.

**The real margin risk is regeneration, not price.** A user regenerating a hero render 40 times turns a €0.20 asset into €8. The allowance-plus-top-up mechanism contains this. Size the included allowance around layout count and standard buyer-pack volume, meter only custom-render intensity as overage.

---

## 8. Open items to validate

1. Confirm the commission anchor band per market (Dubai may run higher than 5%, which strengthens the savings claim).
2. Confirm the founding-cohort discount, if any, so the founding-rate card can be shown alongside the standard card.
3. Pressure-test the blended customer mix (50/35/15) against your actual pipeline. A heavier mid/large skew raises blended ACV and lowers the customer count needed for €5M.
4. Decide the value-banded per-unit structure for M6 so the large-development headroom is captured on schedule.

---

*Figures are illustrative and built on current 2026 provider rates and the cost structure in the Bricly investor P&L v13. Generation COGS converted from USD at approximate parity. Margins and EBITDA will move with final team shape, customer mix, and commission anchor.*
