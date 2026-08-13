# 04 — UI Surface

**Status:** Canonical · Updated 2026-08-13 · Ground truth: `Brickly/prototypes/Bricly_OS_Prototype.html` (v2) — every screen below exists and runs in the prototype. Live demo: https://samurpani.github.io/brickly-prototype/prototypes/Bricly_OS_Prototype.html

Design system: Sandstone (light) / Blackstone (dark, `data-theme`) tokens from `Brickly/design-system/tokens.json`; Inter; olive-green primary `#657A32` on warm off-white; error `#EB5759`.

---

## 1. Shell & navigation

- **Sidebar**: "Bricly" wordmark + **workspace switcher** ("Bricly OS" ▾ → Bricly Studio (owner only), Bricly Marketing (owner/marketing)). Nav items: **Today · Chat · Dashboard · Opportunities · Units · Developments · Contacts · Present · Automations · Calendar · Reports · Settings**.
- **Topbar**: breadcrumb · centered ⌘/K search pill ("Search or jump into") · bell · "✦ Ask" (slide-in AI panel).
- **Persona switcher**: rep (default) / manager / marketing / owner — changes Today content, deal visibility (reps see anonymised "N active deals" lock-strips on units they don't own; managers see names), and workspace access.
- Routing: `go(page)`; per-module nav hooks; Esc closes overlays in priority order.

## 2. Screens (CRM workspace)

### 2.1 Today [v2-full; MVP ships simplified version as Home]
The rep's agent-briefed morning page — the fullest expression of the Product Vision's "7:40, the kitchen" scene, and a working demo of the agent-staff concept (**all content scripted per persona; no AI exists behind it**). Structure:
- **Brief**: a narrative morning summary written in the agent's voice, with inline evidence popovers (`data-ev` spans — click a claim to see the data behind it) and a letterhead-style KPI ledger.
- **Needs You**: short decision cards (each with comm-channel clarity — via/to/what-happens-on-confirm). Clicking opens an **action room** takeover: kicker, key-value facts, drafted message/decision (attributed "Cole · summary"), editable note, channel line, one primary CTA → confirm animates the card away and appends an announce line ("Signed — #CM4506 approved at €345k"); undo supported.
- **Your Day**: clickable schedule lines, each opening a **meeting-prep room** (Cole prep summary, kv facts, 4 talking points, "Open opportunity" link) plus a calendar event card (end/location/attendee, "View in calendar").
- **Focus**: ranked focus items with evidence popovers; one is a **Sweep** entry ("ten deals gone quiet, €31k between them") that opens a ranked one-at-a-time sweep room with individual sign-offs; result is written back into the brief.
- **Heat**: a live mid-morning update (attributed "Ella · scheduling" — e.g. meeting moved, pack re-attached) with one-tap confirm.
Fully per-persona (rep/manager/marketing/owner — manager gets 1:1 coaching briefs and approvals; owner gets bank-call/site-meeting/monthly-review preps). State in `PERSONAS` + per-persona `tstate`.

### 2.2 Chat [stretch in MVP — read-only scope]
Landing: greeting + composer + suggestion chips; history below fold (tabs/search/sort); thread view with sticky composer; mock AI engine with 7 intents and real action buttons; localStorage persistence.

### 2.3 Dashboard [MVP — 3 variants]
Role dashboard (`go('dashboard')`). MVP requires rep/manager/developer variants per `02-mvp-scope.md`.

### 2.4 Opportunities (Pipeline) [MVP]
- **Board view**: 7 columns (`STAGES`), cards show contact, unit, money pill (Budget~ vs Offer by stage), overdue-red next action, key-date chip, docs-awaiting chip. Drag between columns; drag to Closed Won auto-inits post-sale tracking (2% commission default).
- **Table view**: sortable columns + pagination.
- **Tabs**: All / Active / Post Viewing / **Closed** — Closed swaps in the post-sale tracker: 3 summary stats (pending commissions / awaiting bank / deeds this month) + per-deal 5-step stepper (POS signed → Bank approval → Notary searches → Final deed → Commission paid).
- **New opportunity** drawer; column totals sum `money(o)`.

### 2.5 Opportunity detail [MVP — the most important screen]
Fully rendered by `renderOpp()`:
- **Hero**: 12-stage journey bar (2 phases, ◆ Offer-accepted gate; Phase A dims once crossed, confetti on gate + on completion), stage-click checklist popovers (req list + guide), **Now strip** (Next action / Key date / Blocker) + primary CTA (`ojAdvance` advances the journey, syncs board stage, resets next/blocker).
- **Quick actions bar**: Message / Log / Send brochure / Present / Book viewing.
- **Layout toggle**: Single page vs Tabs (Activity / Deal Room / Details / Notes / Documents; Deal Room locked in Phase A).
- **Activity feed**: unified comms (WhatsApp/SMS/Email/Note/System) with channel filter, composer with ✦ AI-draft chip, send.
- **Right rail**: Contact card, Linked units (with per-unit config summary when set via Compare/Present), Offer card (≥ Negotiating only), Blocker/Nudge card (when pending), Shared-with-client card (personalised brochure / buyer microsite / Present session, each with engagement lines — "Opened 3× · 12 min on floor plans", "Visited yesterday · saved 2 units"), Automations card, portfolio card for repeat clients.
- **Deal Room** (Phase B only): key dates, payment schedule with outstanding amounts, document readiness, completion stepper, bid accordion.
- **Documents tab**: register with per-doc lifecycle pills (sign/kyc/file chains), expandable audit history, add-document drawer. **Notes tab**: composer + pinning.
- **Completed deals** render an "owns" view: collapsed banner → frozen read-only Deal Archive (key dates, paid schedule, team payout, docs, bids) + owner rail (portfolio, active opps, "New opportunity" for repeat business).

### 2.6 Units [MVP]
Stats cards → tabs, location tabs, search, sort (clickable column headers asc/desc), filter drawer (Development/Beds/Type/Price/View), table → row click opens **unit peek drawer** (specs, tray toggle, Personalise/Present buttons). **Tray checkboxes** on rows (see 2.13).

### 2.7 Unit detail [MVP]
Quick actions (Create deal / Link to deal / Personalise / Present / Share), media strip, parametric SVG floor plan, rail: development card + deals card (role-gated) + related units.

### 2.8 Developments [MVP]
Card grid with availability bars, or compact list view; filter selects (location/completion/price). **Development detail**: hero with "Enter present mode" CTA, tabs **Overview** (about, distances, amenities, Google Maps embed) / **Availability** (filterable, sortable unit table with tray checkboxes) / **Visual Search** (exterior photo with computed unit hotspot dots — available/held/sold colours, hover tooltip, click opens peek) / **Media** (Renders: external/interior · Photography: lifestyle/location) / **Deals** (role-gated, links into Marketing workspace campaigns).

### 2.9 Contacts [MVP]
4 quick-stat cards, type tabs, search, sort, +Filter menu (status/source/rep/budget/tag/activity), 10-column table → **peek drawer** → full contact page (feed merging linked-opp comms, notes, rail). Multi-select bulk bar: assign/status/tag/message (consent-skip composer), CSV export, merge (exactly 2), DNC. New-contact drawer. Deal pills cross-link to opportunities.

### 2.10 Calendar [MVP — basic]
Month/Week/Day grid + mini calendar + upcoming list. Events live-derived from persona day plans + all opportunities' next actions + user-created events (drawer). Event popover links to the opportunity. "+ New event" drawer.

### 2.11 Reports [MVP — basic; v2 depth later]
KPI row computed live (pipeline, closed, avg deal, conversion %, units available). 5 tabs: Revenue & Sales / Pipeline / Inventory / Agents / Forecast — Chart.js dashboards mixing live derivations with a 12-month demo series; forecast = linear regression.

### 2.12 Settings [MVP]
Sections: **Profile** (theme), **Team** (roster + permissions matrix), **Notifications** (toggle switches), **Integrations** (card grid: toggleable integrations; "Used by N automations" counts) → **WhatsApp/MCP sub-page**: 5 tabs (Connection / Agents / Activity / Commands / Behaviour). Connection tab = MCP server card (endpoint `mcp.bricly.io/v1`, masked auth token, 6 exposed-tool toggles) + 3-step reconnect wizard (scan/enter number → verify webhook → enable tools). See `06-integrations-and-ai.md`.

### 2.13 Selection tray → Compare → Checkout [v2-full]
Tray: fixed bottom-right pill + panel, max 5 units, persisted to localStorage; checkboxes on Units table / dev Availability / unit peek / unit detail. **Compare**: full-screen takeover, horizontal columns with spec rows, best-€/m² and best-sqm ★ highlights, inline finish/layout/add-on pickers with live configured price and render swap. **Checkout**: attach to existing deal (role-gated) or create new (name + budget prefilled), send proposal link + brochure toggles; pushes units + configs onto the opportunity, logs feed entries, adds shared-rail item.

### 2.14 Personalise takeover [v2-full → concierge path in v1]
Full-screen unit personalisation (finishes / layouts / add-ons, render swap + tint, live total) → attach to deal → creates/updates opportunity with feed entries. In v1 this UI routes to a Studio personalisation request (concierge-produced render) rather than live generation.

### 2.15 Present Mode [v2-full — prototype-complete]
Full-screen showroom takeover; 5 steps: **Lobby** (consultation filters: beds/budget steppers, location/feature chips; live Malta/Gozo SVG map with pulsing pins, card↔pin hover sync) → **Showroom** (dev hero render with unit hotspot dots, two-way hover, Units/Highlights tabs, "why buyers choose" chips) → **Unit studio** (layout-reactive SVG floor plan with draggable furniture, finish palettes with render swap, upgrade packs, "✦ Generate custom render" (simulated: 1.5s shimmer → saved snapshot pack), live price, add to shortlist) → **Compare** (cross-development shortlist columns with configured prices) → **Save & send** (session summary, associate with opportunity, generate buyer link + personalised brochure (simulated artifacts, logged as comms), save updates same opp on repeat saves). Chrome: step nav, hide-prices toggle (blurs all prices), shortlist counter, Exit. 3 entry points: sidebar (lobby), unit pages (straight to Unit studio), development pages (straight to Showroom). Full narrative: `05-flows/present-mode.md`.

## 3. Bricly Studio workspace [MVP·concierge]
Owner-gated. Own sidebar: **Dashboard / New consultation / Projects / Asset library** + Present + "Back to Bricly OS".
- **Brief wizard** (7 steps): Brief type (Launch Package / Asset Request / Brand Consultation / Personalisation) → Development → Services → Buyer context → Style direction → Timeline → Review & submit.
- **Projects**: per-development production cards with progress % and status (**Requested → In production → Delivered**), deliverables summary, due dates.
- **Asset library**: delivered assets per development, "Requested by / Delivered" register.
This is the v1 concierge Wizard: intake + status + delivery gallery. No generation UI in v1 — humans fulfil behind it. (Separate deep prototype for the brand consultation flow: `Bricly_Brand_Consultation_Prototype.html`.)

## 4. Bricly Marketing workspace [v2-full — UI demo; role deferred to v1.1]
Owner/marketing-gated. Sidebar: **Overview / Campaigns / Leads & attribution / Budget / Connections**. Campaign cards (channel, status, daily budget, pause syncs to channel), attribution views. Development detail's Deals tab links here ("Open in Bricly Marketing →").

## 5. Screen inventory vs. locked MVP's 16 screens

| Locked MVP screen (old name) | v2 prototype equivalent |
|---|---|
| Home dashboard ×3 variants | Dashboard (+ Today page exceeds spec) |
| Pipeline | Opportunities board/table |
| Leads | folded into Opportunities (New Lead column) + Contacts filters — **no separate Leads inbox in v2** ⚠️ decide in build |
| Opportunities list / detail | Opportunities table / Opportunity detail |
| Contacts list / detail | Contacts / Contact page |
| Projects / detail | Developments / Development detail |
| Properties (cross-project) | Units / Unit detail |
| Approvals | **no dedicated queue page in v2** — approvals live as blocker cards + manager Today items ⚠️ decide in build (MVP doc requires a queue; recommend adding as a manager tab) |
| Activity | unified feeds per-record (no workspace-wide feed page in v2) |
| Calendar | Calendar |
| Reports | Reports |
| Team / Settings | Settings (Team is a Settings section) |
| Studio Wizard ×3 screens | Studio workspace (wizard + projects + asset library) |
