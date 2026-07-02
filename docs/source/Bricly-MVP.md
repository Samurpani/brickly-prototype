# Bricly MVP — v1 Scope Locked

The locked scope for Bricly v1, derived from the MVP scoping sessions. v1 is the version shipped to the first 10 founding members at M3, operated through M6, then transitioned to the commercial launch.

This document supersedes any earlier scope discussion. Where this conflicts with prior flow documents, the data model, or the capability surface, this is the v1 truth.

**Two updates since the original scope lock:**

1. **Pricing.** v1 and the commercial model now run on the high-ticket model (annual platform license + per-development fee + per-unit fee + generation allowance, €25k minimum commitment, unlimited users). This replaces the €99 base + €5/unit/month model. See `bricly-pricing-plan.md` for the full model and `Bricly_Investor_PL_v14.xlsx` for the financials.

2. **Studio Wizard ships in v1 as a concierge-fulfilled face.** Earlier scope deferred Studio entirely to v1.1 and showed a "coming soon" link. v1 now ships the Studio Wizard as the front-end: the developer submits briefs and receives assets through the Wizard, while the Bricly team fulfils the work manually behind it. The Wizard is the interface, humans are the engine. No generative AI agents are operational in Studio at v1. This gets a visible Studio to market at launch without building the generation engine. v1.1 makes the Wizard actually generate.

---

## 1. MVP success criteria

**Definition of success for v1 and the first 10 founding members:**

Three success points, in order:

1. **Activation** (week 1 to 2 post-signup). Founding member onboarded. Team in the CRM. Project + units loaded. Pipeline live. Founding member knows how to use the system.
2. **Operational backbone** (month 1 to 3). The CRM is the source of truth. Inventory, leads, opportunities, appointments, payment milestone visibility, contract status all run through it. Sales team is using WhatsApp commands. Founding member says "this is where everything lives now."
3. **Studio assets delivered** (M3 to M6 via Wizard + concierge, M6+ via v1.1 automated Studio). Founding member produces their marketing collateral through the Studio Wizard. They submit briefs through the Wizard and assets are delivered back into it. In v1 the team fulfils the work manually behind the Wizard. v1.1 automates the generation behind the same interface.

**v1 measures activation and operational backbone. Studio asset delivery through the Wizard is a v1 experience metric but the automated generation behind it is v1.1's success metric.**

**Revenue ramp.** The PL shows 3 active clients at M6, 11 at M8, 24 at M10. First 10 paying customers land roughly M7 to M8. By the end of the M3 to M6 founding member window, 3 to 4 founding members are onboarded and active.

**Success metric for v1 commercially.** Founding members renew at M6 commercial launch. Conversion of onboarded → paying customer.

---

## 2. Build feasibility sanity check

**Team:** 1 developer + 1 designer at M1, +1 developer at M1 or M2. So effectively 2 devs + 1 designer for the bulk of the build.

**AI leverage:** Claude Code and agentic coding stack. Roughly 1.5x to 2x velocity on standard CRUD and known integrations. Less on novel work (WhatsApp parser logic, two-tier pipeline, command grammar, edge cases). Designer hours do not scale with AI.

**Realistic capacity over 3 months (M1 to M3):**

- ~14 to 16 entities built end-to-end with CRUD endpoints + UI
- ~35 to 40 Tools as API endpoints
- ~20 Resources as named reads
- ~16 primary screens at production polish
- 3 dashboard variants
- 3 Studio Wizard screens (brief intake, asset delivery gallery, request status) plus an internal fulfilment queue
- 1 specialised feature (WhatsApp command parser)
- 1 to 2 stretch goals delivered

**On the Studio Wizard's build cost.** Because the Wizard has no generation engine, no constraint model, and no AI orchestration in v1, it is a contained piece of work: three forms-and-gallery screens, a status state machine, file upload/download, and an internal queue the team works from. It is closer in cost to a CRM screen cluster than to building Studio. It still consumes real designer and frontend hours, so it competes with CRM polish. If velocity is tight at end of M2, the Wizard ships in its most minimal form (intake + delivery gallery only, status tracked manually) before any CRM stretch goal.

**Anything beyond this capacity is out of v1 by definition. Stretch goals are optional and the dev team decides at end of M2 which ones to ship.**

**Onboarding load is independent of build velocity.** Founder + concierge team's time onboarding founding members from M3 onwards is separate from build hours. Plan for 1 to 2 founding members per week being onboarded staggered across M3 to M6.

---

## 3. Constraint reconciliation

The original brief had four working assumptions. Resolved against `Bricly_Investor_PL_v13.xlsx` and session decisions:

| Assumption | Brief said | Resolved as | Why |
|---|---|---|---|
| Build phase | 3 months | 3 months for CRM v1 (M1 to M3), then M3 to M6 is founding member period + Studio v1.1 build | Confirmed in session. PL's M6 commercial launch milestone reframed as v1.1 release window. |
| Team | 1 dev + 1 designer | 1 dev + 1 designer at M1, +1 dev at M1/M2 | Matches PL hiring schedule. AI leverage justifies ambitious scope. |
| Runway | 8 to 12 months | Effective 19 months per PL break-even projection | The PL shows revenue from M6 partially offsetting burn from M7+. 8 to 12 months was a no-revenue calculation. |
| Pricing | Low base + setup + reservation + success fees | High-ticket: annual platform license + per-development fee + per-unit fee + generation allowance. €25k minimum commitment. Unlimited users. | Replaces the €99 + €5/unit model. See `bricly-pricing-plan.md`. Reservation/success fees not in v1 or v1.1. |

---

## 4. MVP jobs

### In v1 (16 jobs)

| # | Job | Layer | v1 scope |
|---|---|---|---|
| 1 | D1 | Developer | Capture more buyer demand directly. Hosted lead capture form per project. |
| 2 | D4 | Developer | Know whether team is working leads. Manager visibility through dashboards. |
| 3 | D5 partial | Developer | Current state dashboards only. No forecasting. |
| 4 | R1 | Rep | Work warm leads through to viewing. |
| 5 | R2 | Rep | Triage inbound leads. |
| 6 | R3 partial | Rep | Update unit status via WhatsApp commands. |
| 7 | R9 | Rep | Cross-project unit search. |
| 8 | M1 | Manager | Approve holds, reservations, exceptions. |
| 9 | M2 | Manager | Keep inventory accurate. |
| 10 | M3 | Manager | See which reps are working. |
| 11 | M7 | Manager | Allocate inbound leads. |
| 12 | A1 partial | Agent | WhatsApp command parser. |
| 13 | O2 partial | Ops | Appointment record + Bricly-native calendar view. |
| 14 | O1 partial | Ops | Promise of Sale signed + Final Contract signed flags. |
| 15 | O3 partial | Ops | Document checklist + file uploads against opportunity. |
| 16 | O4 partial | Ops | 6-stage payment milestone structure. Manual updates only. |

### Deferred to v1.1, v2, or later (32 jobs)

All Studio jobs (D2, D3, R4 full, R5, R6 marketing, R7, R8 advanced), all Marketing Lead jobs (ML1-ML8), commission management (M4), leaderboards (M5), agency attribution (M8), all Buyer-level jobs (B1-B4), agent jobs A2-A12, past-project intelligence (D6), and the 5 deferred Ops jobs in their full form.

**Note on Studio jobs and the Wizard.** The Studio brief-intake and asset-delivery surface (the developer-facing parts of D2, D3, and R4) is in v1 through the Wizard, fulfilled by concierge. What stays deferred to v1.1 is the automated generation behind it: the AI brand/render/microsite/video generation, the CAD-to-JSON constraint model, and the generative agents. In v1 the Wizard captures the brief and shows the delivered assets; a human produces those assets.

### In v1 via the Studio Wizard (concierge-fulfilled)

| Job | Layer | v1 Wizard scope |
|---|---|---|
| D2 / D3 (intake) | Developer | Submit a development brief (style direction, references, brand stage, timeline) through the Wizard. Concierge produces brand, renders, microsite, brochure, social, ads externally and delivers them back into the Wizard. |
| R4 partial | Rep | Request a custom render or buyer-specific asset through the Wizard from inside the CRM context. Concierge produces in ~24 hours, delivers into the Wizard against the Opportunity or Unit. |

### Stretch goals in M1 to M3 build window

The dev team picks 1 to 2 of these based on velocity at end of M2.

| Stretch | Estimated build | Priority |
|---|---|---|
| Studio custom render request flow with concierge production (R4 partial) | ~1.5 to 2 weeks | High — validates personalisation thesis |
| Read-only Google Calendar sync | ~1 week | Medium |
| Read-only home-screen AI chat (Scope 1) | ~1.5 to 2 weeks | Medium |
| Voice note to Activity transcription | ~3 to 5 days | Low |

---

## 5. MVP data model

15 entities in v1. Down from 32 in the ideal model.

| # | Entity | v1 scope |
|---|---|---|
| 1 | Workspace | Tenant. Basic settings. States: Trial, Active. |
| 2 | Project | Container. Lead capture URL fields included. States: Draft, Active, Sold_Out, Archived. |
| 3 | Unit | Atomic inventory. Full feature attributes, multi-valued tags, file refs. States: Available, Held, Reserved, Sold, Off_Market. Workspace-renameable display labels. |
| 4 | Contact | Universal person. Expanded preference_profile. Tags. opt_out boolean. States: 8 in schema, 5 actively wired in UI. |
| 5 | Opportunity | Pipeline deal. 14 stages state machine. Multi-rep co-agency via array. Commission with splits. Contract status flags. |
| 6 | Activity | Logged events + audit log (does AuditEvent's job with immutable flag for state-change rows). |
| 7 | Appointment | Calendar item. Types: viewing, follow_up, document_signing, virtual_tour, contract_signing, other. |
| 8 | ApprovalRequest | Hold, reservation, price exception. |
| 9 | User | Team member. Roles: sales_rep, sales_manager, developer_admin. |
| 10 | Pipeline | Default sales pipeline (one per workspace, hardcoded type). |
| 11 | PipelineStage | Core (14, hardcoded internal_keys) + custom (workspace-addable, no system logic). Renameable display labels. |
| 12 | PaymentMilestone | Per-Opportunity. Types: promise_of_sale_deposit, construction (one-to-many), final_deed_balance. Manual updates. |
| 13 | Document | Polymorphic uploads. media_type discriminator covers ~9 v1 types. Generic state machine. |
| 14 | Notification | Event-driven. Hardcoded trigger event list. |
| 15 | WorkspaceTag | Tag library scoped to workspace. Powers Contact tagging. |

### Deferred entities (17 entities cut)

Partner, ConstraintModel, Asset, BrandKit, Persona, Brief, FinishPackage, ContentBackbone, Campaign, AssetUnitMap, PaymentPlan, Commission, Microsite, SyncEvent, AuditEvent (collapsed into Activity), Offer, ConsultationSession, plus the 5 post-sale entities (Reservation, Contract, CompletionMilestone, PurchaserPortalAccess, CollaborationSpace).

### Pipeline stages (14 total, hardcoded internal_keys)

**Forward stages (10):** New Lead → Qualified → Contacted → Viewing Booked → Negotiating → Hold → Reservation → Promise of Sale Signed → Final Contract Signed → Closed Won.

**Branch states (4):** Closed Lost (with reason), Paused, Cold, Unreachable.

Workspace can rename display labels. Cannot reorder core stages, cannot delete core stages. Custom stages addable for pure tracking (no system logic attached).

---

## 6. MVP capability surface

~62 capabilities total. Down from 154 in the ideal model.

- **~37 Tools** (verbs that mutate or compute)
- **~21 Resources** (named reads)
- **4 Prompts** (named workflows)

### Distribution by entity layer

| Entity layer | Tools | Resources |
|---|---|---|
| Workspace + User | 6 | 3 |
| Project | 3 | 2 |
| Unit | 7 | 3 |
| Contact (incl. tags) | 5 | 3 |
| Opportunity | 6 | 5 |
| Activity + Appointment | 4 | 3 |
| ApprovalRequest | 2 | 1 |
| PaymentMilestone | 2 (upsert + delete) | 2 |
| Document | 2 | 1 |
| Notification | 1 (collapsed) | 1 |
| WorkspaceTag | 1 | 1 |
| Pipeline | 2 | 0 |

### Prompts in v1 (4)

- **P3 team_performance_overview** — Manager dashboard rollup
- **P5 follow_up_cadence** — Rep next-actions workflow
- **P9 approval_triage** — Manager approval queue
- **P10 lead_allocation** — Manager lead routing

### Owned vs orchestrated

- **Owned (most of v1):** all data model CRUD, pipeline transitions, approval flows, notifications, command parser, dashboards, reports
- **Studio Wizard (owned, concierge-fulfilled):** brief intake capture, fulfilment-request creation, asset delivery + status tracking, file write-back to CRM Documents. These are data-capture and workflow capabilities only. No generation Tools are wired to AI in v1; the generate-* capabilities are stubbed behind the concierge queue and become live in v1.1.
- **Orchestrated (small set):**
  - WhatsApp messaging via Twilio (hybrid)
  - Email delivery via standard provider (hybrid)
  - Lead capture form embed via Bricly-hosted page (owned)
  - Google Calendar OAuth (stretch goal, hybrid)
  - Voice transcription via Whisper (stretch goal, orchestrated)
- **Hybrid:** Lead capture in the future (v1 simple), AI chat (stretch goal, orchestrated LLM with owned context plumbing)

---

## 7. MVP flows

### In v1 (3 flows)

**Sales Process (simplified end-to-end).** All 14 stages flow. Manual transitions. No agent involvement except WhatsApp command parser. No personalised buyer pack. No in-meeting Studio. No SLA auto-nudges (manager dashboard surfaces it instead). No auto-Cold transitions.

**Sale and Inventory Update.** Cross-cutting unit state changes. Approval gates fire. Cross-Opportunity propagation when a Unit is Sold (removed from other opportunities' shortlists). Workspace counters update. No external sync (no Studio surfaces in v1).

**Lead Capture and Routing (partial).** Tier 1 (Bricly-hosted form per project) + Tier 4 (walk-in / manual entry). Phone-uniqueness blocking. Basic capture cluster. Manual or simple round-robin routing.

### Concierge fallback for cut steps

- **Onboarding flow:** concierge-led. Your team provisions workspace, sets up users, creates projects, normalises availability lists into CSV format, imports units, configures defaults. 1 to 2 hour onboarding call per founding member.
- **Launch Package flow:** developer submits the brief through the Studio Wizard. Concierge produces brand, renders, brochures, website, social externally (Midjourney, Nano Banana Pro, Kling, Canva, Figma) and delivers them back into the Wizard.
- **Go-to-Market flow:** founding members run their own GTM during M3 to M6.
- **Buyer Customisation flow:** custom renders requested through the Studio Wizard from the Opportunity or Unit context. Concierge produces and delivers into the Wizard.
- **Lead Capture Tiers 2/3/5:** founding members' existing ad funnels feed leads; concierge team manually imports.
- **Agent-Initiated flow:** v1.1 with MCP server.
- **Re-Launch flow:** not applicable for first 10 founding members.

---

## 8. MVP UI surface

16 primary CRM screens. 3 dashboard variants (rep, manager, developer). Plus the Studio Wizard (3 screens, concierge-fulfilled). No automated Studio generation surface in v1.

### Navigation (left rail)

Home (dashboard) · Pipeline · Leads · Opportunities · Contacts · Projects · Properties (cross-project) · Approvals · Activity · Calendar · Reports · Team · Settings · Studio (the Wizard: brief intake + asset delivery, concierge-fulfilled)

### Studio Wizard screens (v1, concierge-fulfilled)

Minimal scope, the smallest surface that makes Studio a visible part of the product:

- **Brief intake.** Guided form: development selector (pulls from CRM Project), asset type requested (brand, render set, microsite, brochure, social pack, ad pack, walkthrough, custom buyer render), style direction, references upload, timeline. Submitting creates a fulfilment request.
- **Asset delivery gallery.** Per development, the delivered assets with status states (Requested, In Production, Delivered, Revision Requested). Files downloadable and, where relevant, written back to the CRM as Documents on the Project, Unit, or Opportunity.
- **Request status.** Simple queue view so the developer sees what is in production and what is delivered.

No generation UI, no constraint-model editor, no brand workspace in v1. Those arrive in v1.1 when the Wizard becomes automated.

### Dashboards

- **Rep:** today's priorities, ranked by P5 follow_up_cadence, upcoming appointments, own pending approvals, recent activity
- **Manager:** team-wide pipeline, pending approvals queue, team activity, leads waiting allocation, deals at risk
- **Developer:** cross-project portfolio, sell-through, revenue, payment milestones aggregate

### Cut from CRM UI

Marketing Lead dashboard, Ops dashboard, Partners screen, Conversations tab (Tier 3 lead capture), Personalised buyer pack composition, Buyer Pack tab on Opportunity, Offers tab, Marketing/Microsite/Campaign tabs on Project, post-sale surfaces (Reservation/Contract/Snagging), Marketing-level views.

### Form factors

Desktop only for v1. Mobile and tablet versions deferred. WhatsApp commands give reps a mobile-style interface.

---

## 9. MVP agent layer

### In v1

- **A1 partial:** WhatsApp command parser. Hard requirement for M3.
- **Read-only home-screen AI chat (Scope 1):** stretch goal. Reads from v1 Resources, answers in natural language, cannot mutate state.
- **Voice note to Activity transcription:** stretch goal.

### Pattern of agent autonomy active in v1

- **Pattern 1** (autonomous within bounded actions): system-triggered side effects only. ApprovalRequest auto-creation, Activity logging on state changes, Notification dispatch. WhatsApp commands are Pattern 1 within their grammar.
- **Patterns 2, 3, 4:** not in v1.

### MCP server

Deferred to v1.1. Capability surface is designed to be exposed via MCP without rearchitecture when ready.

### Studio Wizard is not an agent in v1

The Studio Wizard captures structured briefs and displays delivered assets. It does not generate anything. There is no generative agent, no constraint model, no model orchestration behind it in v1. A human produces every asset. The Wizard is a clean intake-and-delivery interface over a manual fulfilment queue. This is a deliberate Wizard-of-Oz: the interface that founding members use in v1 is the same interface that becomes automated in v1.1, so nothing they learn is thrown away.

### Agent jobs A2 through A12

All deferred.

---

## 10. Concierge operating model for v1

The first 10 founding members get a CRM at M3 plus the Studio Wizard plus the Bricly team behind it. The concierge model is part of the v1 product, not a workaround. The Wizard is the face the founding member interacts with; the team is the engine that fulfils the work.

### What the Bricly team does manually

1. **Onboarding.** Per founding member: provision workspace, set up users, create projects, normalise their availability list into CSV format, import units, configure project payment milestone defaults. Done in a 1 to 2 hour onboarding call. No self-serve wizard.
2. **Training.** Walk the founding member's team through the CRM and the Studio Wizard. WhatsApp command syntax. Pipeline stages. Approval flows. How to submit a brief and retrieve assets in the Wizard. 1 to 2 follow-up calls in week 1.
3. **Studio asset production (behind the Wizard).** Founding member submits a brief through the Studio Wizard. The team produces brand, renders, brochures, websites, social, ads using external tools (Midjourney, Nano Banana Pro, Kling, Canva, Figma). Delivered assets are uploaded back into the Wizard against the development, with status moving Requested → In Production → Delivered. Relevant files also written to the CRM as Documents under the Project. The founding member experiences a single product surface; the production is manual.
4. **Custom render requests (R4 partial).** Reps request via the Studio Wizard from the Opportunity or Unit context. Concierge team produces in ~24 hours. Delivered into the Wizard and uploaded as Documents with media_type=unit_render.
5. **Lead handling.** If founding members run ad funnels, concierge team exports leads and creates them in Bricly via T11 manual mode.
6. **Bug fixing, edge case handling, support.** Direct WhatsApp or call.
7. **Format documentation.** Every founding member's availability list format, every render brief, every brand brief documented in Notion. This is the training data for v1.1 AI-assisted import and Studio automation. The Wizard brief structure is designed so the captured fields become the exact inputs the v1.1 generation engine will consume.

### Team structure during concierge

- You (founder) + 1 contractor (render and brand specialist) for M3 to M6
- Concierge team uses Notion or ClickUp for internal workflow
- Hire Customer Success Manager at M6 per PL when commercial launch approaches

---

## 11. 3-month build plan outline

### Month 1

- Planning, data model implementation, design system, auth, workspace/user/project/unit entities + CRUD
- Designer: full design system, wireframes for top 10 screens, visual design for top 5
- Dev 1: data model + foundations
- Dev 2 joins late M1 or early M2

### Month 2

- Contact + Opportunity + Activity + Appointment entities
- Pipeline kanban, Lead inbox, Opportunity detail
- ApprovalRequest + approval UI inline + Approvals screen
- WhatsApp command parser foundation (Twilio webhook + structured command grammar)
- Dashboard variants (3)
- Designer: continued screen designs

### Month 3

- PaymentMilestone + Document upload + Contract status flags
- Calendar screen + Appointment management
- Reports screen (basic)
- Studio Wizard (committed scope): brief intake screen, asset delivery gallery with status states, internal fulfilment queue. File write-back to CRM Documents.
- Settings (minimal): workspace, users, stage labels, custom stages, unit status labels, tag library, lead capture config, WhatsApp integration
- Polish, bug fix, internal testing
- Stretch goals if velocity allows: Google Calendar sync, Studio render request flow, home-screen AI chat read-only, voice transcription
- M3 end: ship to first founding members

### Month 4 to 6 (founding member period)

- Onboard founding members staggered, 1 to 2 per week
- Operate the CRM with founding members
- Run concierge production
- Begin Studio v1.1 build in parallel
- Document edge cases and format examples for v1.1
- Hire Customer Success Manager toward M6 per PL

---

## 12. Out of scope for v1, in scope for later

### v1.1 (M3 to M6 build window, ships M6-ish with commercial launch)

- **Studio automation (behind the v1 Wizard):** make the Wizard actually generate. The v1 Wizard shell (brief intake, asset delivery, status) stays; v1.1 replaces the concierge fulfilment behind it with automated generation. Brand consultation, render generation, brochure, website (Microsite entity), social, marketing material templates. Studio dashboard, brand workspace, render workspace, brochure editor, microsite editor layered onto the existing Wizard surface.
- **CAD-to-JSON constraint model:** automated extraction from architect drawings. ConstraintModel entity with three layers.
- **AI-assisted unit import:** parse availability lists (PDF, Excel) into structured units. Replaces concierge CSV normalisation.
- **Personalised buyer pack composition:** the headline cross-module surface from the ideal model.
- **MCP server:** publicly exposed for external agent integrations.
- **Marketing Lead role and dashboard.**
- **Asset entity:** generated outputs distinct from uploaded Documents.

### v1.2 (M6 onwards, commercial launch + iteration)

- **Reservation contract sending via DocuSign integration.**
- **Small deposit collection via Stripe** (reservation deposit, promise of sale deposit).
- **External calendar two-way sync** (Outlook, iCloud, Google two-way).
- **Buyer-side and agency MCP integrations.**
- **Inbound communication parsing** (Lead Capture Tier 3 with LLM).
- **Paid ad webhook ingestion** (Lead Capture Tier 2).
- **Agency attribution** (Partner entity, M8 job).
- **Commissions entity and payout flows.**
- **Automations engine** (workflow rules, triggers, schedules).
- **Mobile and tablet versions.**
- **Tier 5 MCP-native lead captures.**

### v2 (mature product)

- **Multi-pipeline configurability** (full Level 2+3 from session 1).
- **Saved smart lists, custom report builder, shareable investor reports.**
- **Notifications preferences per user.**
- **Cross-project pattern intelligence** (D6 job).
- **Consultation sessions** (the on-demand AI consultant pattern).
- **Forecasting** (D5 full).
- **Post-sale digitisation layer** (entities 28 to 32: Reservation, Contract, CompletionMilestone, PurchaserPortalAccess, CollaborationSpace).

### Permanently out of scope

- **Final deed execution.**
- **Mortgage processing.**
- **Bank-administered milestone payment collection.**
- **Notary workflows.**
- **Snagging coordination beyond logging** (handled outside Bricly).

---

## 13. Open risks and decisions

### Risks to M3 timeline

1. **WhatsApp command parser reliability.** Twilio integration is fine. Command grammar design and error handling is the risk. Mitigation: ship with a tiny command set (3 to 5 commands) and expand in M4 to M6.
2. **6-stage payment milestone edge cases.** Construction payments array, mid-flight modifications, manual updates conflicting with approval requests. Mitigation: cut PaymentPlan entity (already done), keep milestone updates simple, accept manual conflict resolution for v1.
3. **Founding member onboarding starts in M3.** If product is not stable by end of M3, onboarding gets pushed. Mitigation: feature freeze at end of M2 week 3. M3 is bug fix + polish + onboarding prep.
4. **Designer capacity.** One designer for 3 months covers roughly 10 screens at production quality. Mitigation: aggressive component reuse, AI-assisted UI generation for less critical screens.

### Decisions to validate with first 1 to 2 paying founding members

1. **Stage names.** Founding members will tell you their preferred terminology. Validate the renameable label feature is being used.
2. **WhatsApp command set.** Which commands do reps actually use? Add or remove based on usage.
3. **Payment milestone defaults per project.** What's the standard payment plan shape founding members configure? Build a template starter for v1.1.
4. **Concierge bottleneck.** Where does the Bricly team's time actually go during M3 to M6? Use this to prioritise v1.1 automation targets.

### Tensions surfaced between this scope and the investor narrative

1. **PL shows Studio revenue and a Studio presence from M6.** v1 now ships the Studio Wizard from M3, fulfilled by concierge, so Studio is a visible, usable part of the product during the founding-member period. The automated generation behind it lands in v1.1 at the commercial launch window. The `Bricly_Investor_PL_v14.xlsx` model prices Studio as part of the single high-ticket contract (one platform license covering CRM and Studio), not as separate Studio fees, so the revenue narrative is simpler than the old model: one ACV per customer, no separate Studio line.

2. **PL reaches ~112 customers for €5M ARR, not 985.** The high-ticket model in v14 reaches €5M ARR around the end of Year 2 at roughly 112 customers, versus the old model's 985 clients for ~€6.1M. The founding-member period (M3 to M6) gets to roughly 3 to 6 paying customers; the rest come from the commercial motion post-M6. The Book a Call funnel needs to convert a far smaller number of far higher-value customers, which suits the founder-led, relationship-driven motion.

3. **"AI marketing platform" pitch and v1.** This tension is now largely resolved. v1 ships a visible Studio (the Wizard), so the product a founding member sees at launch matches the "CRM + AI marketing platform" pitch rather than being CRM-only. The remaining nuance is honesty about automation: the Wizard is concierge-fulfilled in v1, not yet AI-generated. Founding members should be told plainly that they are getting white-glove service through the interface that will become automated. They know they are early; this framing keeps it clean and avoids implying the generation is automated when it is still manual.

4. **New risk: concierge fulfilment load behind the Wizard.** Putting Studio behind a clean Wizard makes it easy for founding members to request assets, which raises the manual production load on the team during M3 to M6. This is the bottleneck to watch (it is also the signal for what to automate first in v1.1). Keep the founding cohort at 1 to 2 onboarded per week so fulfilment capacity is not overwhelmed.

---

## 14. Document control

This document is the locked v1 scope as of the MVP scoping sessions. Changes to scope after this point require explicit founder decision and update to this document.

The next-level documents (specific feature specs, API contracts, UI mockups, design system) are downstream of this scope lock.

Reference documents:
- `bricly-pricing-plan.md` (high-ticket pricing model, margins, €5M ARR path)
- `bricly-jobs.md` (full job inventory, ideal product)
- `bricly-data-model.md` (32-entity ideal data model)
- `bricly-capability-surface.md` (154 capability ideal surface)
- `bricly-ui-surface.md` (ideal UI surface)
- All 9 flow documents (ideal flows)
- `Bricly_Investor_PL_v14.xlsx` (financial model, high-ticket pricing)

This v1 document strips back from those foundations.
