# Brief 03 — Buyer Microsite + Engagement Signals (prefix `ms`)

**Goal:** Make Present Mode's generated buyer link REAL (prototype-real): a branded, buyer-facing microsite view, plus engagement signals that flow back to the opportunity. Read `00-README-shared-context.md` first.

## Build

1. **New full-screen overlay `#ms-overlay`** (z-index above the CRM, below `#toast`) rendering the buyer microsite for a given saved `presentSessions` entry or an opp (fallback: build from `opp.unitIds` with default configs):
   - agency-branded header (Bricly Estates · agent name) + buyer greeting ("Prepared for Mike")
   - shortlisted unit cards: reuse `pmPlanSVG(unit, cfg, true)` compact plans + `pmPhotoSVG` photos + configured totals via `pmPriceFor`
   - development story highlights from `PM_DEV_STORY` (distances + 2 lifestyle photos)
   - payment plan section derived from the opp (`paymentPlan` like "10/20/70" → 3 milestone rows with € amounts)
   - agent contact footer with CTAs: "Book a viewing" (toast + logs signal) and "I'm interested" (toast + logs signal + activity entry)
   - style: Present Mode cream/orange theme (`--pm-*` vars are global once defined; reuse them) — this is buyer-facing
   - close button returns to wherever the CRM was
2. **Entry points:**
   - Present Mode wrap-up link card: add a "Preview buyer view →" button (edit only the template string in `pmRenderWrapup`)
   - Opportunity detail → Marketing Collateral tab: the "Personal Presentation" link (created by Present Mode saves) opens the overlay; also add a quick link in the Overview quick actions if trivial
3. **Engagement simulation:** module-level `msStats[oppId] = {views, lastSeen, unitClicks:{unitId:n}, ctas:0}`. Opening the overlay increments `views` + sets `lastSeen`; clicking a unit card increments its counter; CTAs increment `ctas`.
4. **Surface signals in the CRM:**
   - Opp detail Overview gets a "Buyer engagement" panel: views, last seen, most-viewed unit, small CSS spark bars. Include a **"Simulate buyer visit"** button (adds 1–3 views + random unit clicks) so demos work without leaving the CRM.
   - When views increase, unshift an activity entry (e.g., "Buyer opened microsite — viewed the penthouse twice") and `toast` the rep.
5. **Constraints:** do NOT modify Present Mode internals beyond the one wrap-up button; nothing may be added inside `#pm-canvas-wrap` (pointer-capture pitfall). The overlay must also work when opened directly from an opp with no saved session.

## Demo script (all must pass)
1. Present to Mike (OPP-1042) → shortlist 2 units → wrap-up → save session + generate link → "Preview buyer view" opens the branded microsite with both configured units and correct totals
2. Click a unit card twice, close the overlay
3. Opp detail shows Buyer engagement: 1 view, most-viewed unit correct
4. "Simulate buyer visit" ×2 → counters + activity feed update, toast fires
5. Marketing Collateral "Personal Presentation" link reopens the same microsite
