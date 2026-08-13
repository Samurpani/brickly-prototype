# Bricly Investor P&L — v18 to v19 Change Memo

**Date:** 3 July 2026
**Owner:** Sam
**Status:** v19 is the working model. v18 is retired and should not be shown externally.

## Why v19 exists

v18 contained three structural errors and several presentation choices that would have failed investor diligence. v19 rebuilds the model around a development-level cohort engine and prices the concierge era honestly. The pricing card is unchanged. The company is unchanged. What changed is the arithmetic connecting them.

## The six fixes

### 1. Development-level cohort engine

v18 held developments per customer flat forever and applied 1% logo churn as the only decay. Off-plan developments sell out, and when they do the €20k recurring line for that development ends unless a new launch replaces it. v19 models this directly on the Cohort Engine sheet: developments activate on a 6-month phase-in from signing, exit management on a 24-month average sell-through, get backfilled at a 50% rate, and expand at 0.5 net-new developments per customer per year beyond backfill. ARR is a function of active developments, which is what it actually is.

The consequence is visible in the retention metrics: dev-level gross retention of roughly 69% annually and an NRR proxy of roughly 82%. This business must out-acquire its own sell-through. The backfill rate is the single most important assumption in the company, and it is now a named input rather than an invisible impossibility.

### 2. Segment mix rebased to the documented ICP

v18 assumed 50% of customers land on Studio or Scale tiers, meaning 10 to 18 developments under simultaneous management, while the jobs doc defines the ICP as 3 to 5 active projects. v19 weights the mix Single 35% / Foundation 45% / Studio 15% / Scale 5%, giving 5.0 blended committed developments per customer and a blended committed ACV of €100k instead of €166k. Realized recurring per customer settles near €77k at steady state once sell-through bites. The v18 mix survives as the Upside scenario, where it belongs.

### 3. Activation phased, not billed at signing

v18 recognised €91.3k of blended activation the month a customer signed, implying a €260k+ day-one invoice at card rates. v19 bills activation as each development activates across the 6-month phase-in, and backfill and expansion developments pay activation when they enter. Y2 activation revenue is now a function of developments actually coming under management.

### 4. Concierge margin priced honestly

v18 assumed 70% gross margin on activation from day one, while the deck states the agency charged $30k+ and took 3 to 4 months for the same scope, and v1 fulfils Studio through humans behind the Wizard. v19 uses 35% in Y1, 55% in Y2, 70% in Y3. Margin expansion is now the visible financial payoff of automating Studio, which is a better investor story than pretending the margin was always there.

### 5. Evidence-based ramp

v18 landed 12.6 customers in Y1 and closed pipeline the same month it was created. v19 signs 10 customers in Y1 (1 per month from M6, stepping to 2 per month from M10), 30 in Y2, 43 in Y3, with the sales team hired on the v18 schedule extended into Y3. Rebuild this row from real funnel data (demo-to-close rate and cycle length on the first ten serious conversations) as soon as it exists.

### 6. Honest displayed unit economics

v18 displayed LTV:CAC of 53.3x, 1.6-month payback, and an 83-month lifetime. v19 computes CAC fully loaded from actual Y2 sales and marketing spend (roughly €26k), caps LTV display at 36 months, and lands at roughly 8x LTV:CAC with 4 to 5 month payback. These are excellent numbers that people will believe.

## What the honest base case shows

| Metric | v18 | v19 base |
|---|---|---|
| Blended committed ACV | €166,000 | €100,000 |
| Y1 total revenue | €1,383,934 | ~€381,000 |
| Y2 total revenue | €9,708,996 | ~€3,930,000 |
| ARR end Y2 | €8,369,580 | ~€2,885,000 |
| €5M ARR crossing | end Y2 | ~M33 |
| Y1 EBITDA | +€612,170 | ~ –€216,000 |
| Y2 EBITDA | +€6,312,755 | ~ +€1,440,000 |
| Minimum cash | never below €177k | ~€76k at M11 |
| Funding need | none shown | €500k–€750k seed at M9–M12 |

The base case survives on the €300k pre-seed with roughly three months of buffer at the trough and no slack for a slower ramp. The downside scenario (7 customers Y1, 3.5 devs per customer, 35% backfill) goes cash-negative around M14. The recommendation embedded in the model: raise €500k to €750k between M9 and M12, on Y1 traction data, before the buffer thins. This keeps the Series A conversation on the M24 clock with a real growth story instead of a fragile one.

## Narrative implications

Recurring is 44% of Y2 revenue; activation one-time production is 46%. Pitch ARR on the recurring line alone and present activation as high-attach production revenue that funds the land. Do not let anyone add the two into a single "ARR" number, because a diligence analyst will separate them and the correction will cost credibility.

The sub-100% NRR proxy is not a weakness to hide. It is the honest structure of a per-development model, and the answer to it is already in the roadmap: backfill improves as Bricly becomes the default way a developer launches anything new, and the renewal path to €25–30k per development adds price-driven expansion. Say this proactively.

## Documents affected

- `Bricly_Investor_PL_v19.xlsx` — new model, replaces v18. All seven sheets rebuilt.
- `Bricly-MVP.md` — updated. Stale v14 pricing language, v14 file references, the "3 active at M6, 11 at M8, 24 at M10" ramp, the "112 customers for €5M" claim, and the "effective 19 months runway" line all corrected to v19.
- `bricly-pricing-explained.md` — no change required. Card rates, worked examples, and positioning are all unaffected. The model changed, the price did not.
- `Bricly__Pitch_Deck.pdf` — cannot be edited here (image-based deck). Two corrections needed before it goes in front of anyone: the "raised over half a million dollars" slide conflicts with the €300k pre-seed in the model, and any revenue or ARR slides sourced from v18 need v19 figures.

## Assumption levers to revisit with real data

1. Backfill rate (0.5). Ask every founding member directly: when this development sells out, what is your next launch and when.
2. Average months under management (24). Calibrate against the first client's actual sell-through pace.
3. Segment mix. Recut after the first 5 signed customers; the tier they land on is the mix.
4. Ramp row on the Cohort Engine sheet. Replace with funnel-derived figures after ten serious demos.
5. Y1 activation margin (35%). Track actual hours behind the Wizard per Launch activation during M3–M6; this is also the v1.1 automation priority signal.
