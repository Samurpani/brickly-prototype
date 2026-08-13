# Flow: Present Mode

**[v2-full — prototype-complete, ships v1.1]** — this doc **supersedes** `source/Present-Mode-Overview.md`, which describes a legacy prototype (`pm*` namespace, three.js apartment viewer). The v2 implementation (`pr*` namespace in `Bricly_OS_Prototype.html`) keeps the same 5-stage consultation arc but replaces the 3D viewer with a hotspot showroom + layout-reactive SVG floor plans, and uses the Sandstone/olive design system. **Until v1.1 ships, reps demo from the prototype itself.**

Why it matters (unchanged thesis): the sales meeting is the product. Present Mode turns the consultation from "browsing a PDF" into a guided, personalised session that ends with a configured shortlist attached to a real opportunity — the meeting produces CRM state.

## Entry points

1. Sidebar "Present" → Lobby (open consultation)
2. Unit page "Present this unit" → straight to Unit Studio
3. Development page "Enter present mode" → straight to Showroom

## The 5 stages

### 1. Lobby — frame the consultation
Buyer requirements as physical controls: bed/budget steppers, location and feature chips. Right side: live Malta/Gozo SVG map, developments as pulsing pins; result cards ↔ pins hover-sync. Filtering narrows the portfolio in front of the buyer. → Pick a development.

### 2. Showroom — sell the development
Hero exterior render with **unit hotspot dots** (positioned per unit, coloured by availability), two-way hover with the unit list. Tabs: Units (filtered list) / Highlights (amenities, distances, "why buyers choose" chips). → Pick a unit.

### 3. Unit Studio — personalise
The centrepiece. Layout-reactive SVG floor plan (furniture draggable), finish palettes that swap the render, upgrade packs, **live configured price**, and "✦ Generate custom render" — *simulated* in the prototype (1.5s shimmer → pre-made snapshot pack saved to the session). In v1, this button becomes a **Studio personalisation request** (concierge, ~24h); real generation is the v1.1 headline. → Add to shortlist (max compare set).

### 4. Compare — decide
Cross-development shortlist columns with configured prices and spec rows, best-value highlights. Works across developments — the rep sells the portfolio, not one project.

### 5. Save & Send — convert the session into CRM state
Session summary → associate with an existing opportunity or create one → generate buyer link + personalised brochure (simulated artifacts, logged as comms feed items). Repeat saves update the same opportunity. This is the "meeting writes the CRM" moment: shortlist units land on the opp, viewing feedback checklist items get satisfied, follow-up assets are queued.

## Chrome & rules

Step navigation with back-tracking, **hide-prices toggle** (blurs every price for sensitive meetings), shortlist counter, Exit returns to the launching screen. Prices respect the workspace `money()` display rules.

## Build notes for v1.1

- Dependencies that gate it: per-development photography/renders, hotspot coordinates, floor-plan SVGs, finish/pricing configurator data — this is exactly the data the Studio concierge collects during v1, which is why Present Mode follows Studio generation in the release train.
- The buyer link and brochure become real artifacts (microsite + PDF) in v1.1 via Studio generation.
- Legacy doc's three.js viewer, ambient audio, and multi-screen sync: **[Post-MVP]**, not in v2 design truth.
