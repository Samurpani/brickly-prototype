# AI Agent Input Modalities & Use Cases

**Status:** Working draft for AI architecture · 2026-08-25 · Ground truth: `prototypes/Bricly_Jobs_and_Flows.html` (jobs map), `canonical/06-integrations-and-ai.md` (agent posture & MCP contract), `canonical/03-data-model.md` (Document/Asset/ConstraintModel), `canonical/05-flows/` (flow specs)

**The ask this answers:** *"For a complete AI architecture, we'd like to know all the different ways users might want to send inputs and data to the AI agent — voice, PDFs, CAD files — the full list, so our AI agents can process them."*

---

## 1. Purpose & how to read

This document enumerates **every input surface** through which a user (or system) sends data to Bricly's AI layer, organised by:

- **User type** (§3) — the 4 internal personas, the buyer, external human parties, and external AI agents.
- **Journey stage** (§5) — the five stages a developer moves through with Bricly: **Load → Launch → Perform → Sell → Close**, plus **Cross-cutting** jobs that span all stages. (These are the Jobs & Flows stages, *not* the 14-stage sales pipeline — pipeline stages live inside Sell and Close.)

Each use case cites its **job ID** from the jobs map (L2, A1, R3…) so scope and priority stay traceable to one source.

**Milestone tags** (matching the jobs map chips):
`[v1]` shipped/committed (M1–M3, incl. AI read + write-with-preview, nudges, and email/calendar/WhatsApp-voice data-in per the Fri 21 Aug meeting) · `[v1 concierge]` Wizard front-end, humans fulfil · `[v1 stretch]` team picks 1–2 at end of M2 · `[v1.1]` automated Studio generation + MCP exposure · `[v1.2]` automations engine, inbound parsing, webhooks · `[Phase 2]` roadmap · `[proposed]` not yet locked.

**AI-verb legend** (from the jobs map): **ingest** (unstructured → structured records) · **write** (mutate CRM records, preview-then-commit) · **nudge** (detect + surface the moment) · **generate** (produce assets/content) · **match** (recommend from criteria).

**Design rule (locked, applies everywhere):** anything that reaches a buyer requires a human tap. Agents draft, prepare and log; the rep's tap is the signature. Guarded actions (holds, unit status changes) always route through `ApprovalRequest` — no input channel bypasses a gate.

---

## 2. Input modality taxonomy

The master list of channels and formats the AI layer must accept, with the processing capability each one implies.

| # | Modality | Formats / payload | Processing required | Scope |
|---|---|---|---|---|
| 1 | **WhatsApp text commands** | Free-text natural language (Twilio webhook) | LLM intent parsing → 6 intents; entity resolution (contact names, unit IDs, developments); one clarifying question on ambiguity; preview-then-commit | `[v1]` |
| 2 | **WhatsApp voice notes** | Audio (.ogg/opus via Twilio) | Speech-to-text (Whisper) → then same parse pipeline as text | `[v1]` (per 21 Aug meeting) |
| 3 | **WhatsApp media messages** | Photos (.jpg), PDFs, forwarded documents | Classification + OCR/extraction → file to the right deal/checklist slot | `[v1.1]` (partial `[v1]` via concierge) |
| 4 | **In-app chat / Ask panel** | Free-text queries against workspace data | Read-only NL → Resource queries; AI-draft chip = LLM call w/ opp context | `[v1 stretch]` read-only |
| 5 | **Email ingestion** | Inbound email + attachments | Sender/thread → deal matching; attachment classification; data-in per 21 Aug meeting | `[v1]` sync · `[v1.2]` LLM parse |
| 6 | **Calendar sync** | Google Calendar events (read-only v1) | Event ↔ Appointment/Opportunity linking | `[v1]` · two-way `[v1.2]` |
| 7 | **Hosted lead forms (Tier 1)** | Form A (identity, buyer_type, budget_band) / Form B (+1–3 selected units); UTM, session, IP geo server-side | Structured capture; phone-dedupe; atomic Contact+Opportunity creation | `[v1]` |
| 8 | **Availability schedule upload** | Excel, CSV, PDF, **photo of a printout** | Normalise to canonical CSV; column → Unit-field mapping; validation pass (dupes, missing prices) before commit | `[v1]` concierge-assisted · `[v1.1]` AI |
| 9 | **Floor plan / media bulk upload** | "Drive dump": PDFs, images, **CAD (.dwg/.dxf)**, brochures, site studies | `media_type` classification (~9 v1 types); filename/level/unit-number pattern matching → Unit linking; low-confidence fix-up queue | `[v1]` |
| 10 | **CAD → constraint model** | .dwg/.dxf architect files | CAD parsing → ConstraintModel JSON (drives render generation limits) | `[v1 concierge]` human · `[v1.1]` AI |
| 11 | **Deal migration import** | Old-CRM exports, spreadsheets, WhatsApp-group history — "no format demanded" | Contact dedupe on phone; Opportunity placement at true stage; checklist back-fill | `[v1 concierge]` |
| 12 | **Studio Wizard brief** | Structured intake form + reference uploads (style refs, brand assets, existing collateral) | Brief → StudioRequest; adaptive consultation Q&A (A12) | `[v1 concierge]` · `[v1.1]` generation |
| 13 | **Present Mode session data** | Interaction capture: shortlist, finishes, layouts, compare choices, session note | Session → Opportunity enrichment (units[], Activity, files) | `[v1]` (v2-full surface) |
| 14 | **Deal document uploads** | KYC (passport/ID, proof of address, source of funds), reservation forms, POS, contracts, receipts | Auto-classify → opportunity + stage + checklist slot | `[v1]` upload · `[v1.1]` auto-file |
| 15 | **MCP tool calls** | JSON tool invocations at `mcp.bricly.io/v1` (6 tools, individually toggleable) | Guard enforcement: read-only / autonomous / approval-gated / rep-tap | `[v1.1]` |
| 16 | **Ad-platform webhooks (Tier 2)** | Meta/Google lead-form payloads | Schema mapping → same atomic capture as Tier 1; v1 = concierge CSV import | `[v1.2]` |
| 17 | **Inbound buyer conversations (Tier 3)** | WhatsApp/email free text from buyers | LLM qualification dialogue, unit matching, appointment booking (A11) | `[Phase 2]` |
| 18 | **Partner/agency submissions (Tier 5)** | Lead submissions + commission tracking via MCP (A9) | Identity classes, guarded-action matrix | `[Phase 2]` |
| 19 | **Buyer portal inputs** | Status queries, messages, snag reports w/ photos, referrals (B1–B4) | Photo understanding for snags; thread routing to notary/solicitor/dev | `[Phase 2]` |
| 20 | **Manual UI entry** | New-contact / new-opportunity / new-event drawers, approvals taps, checklist ticks | Structured writes (baseline — always available) | `[v1]` |

---

## 3. User types & how each one reaches the AI

| User type | Who | Primary input surfaces | Notes |
|---|---|---|---|
| **Rep** (sales_rep) | Works Phase A deals; lives in WhatsApp, not the CRM | WhatsApp text + voice (A1), Present Mode sessions, Units search, manual drawers | The conversational-input bet: the CRM stays current only if updating it is as easy as texting |
| **Manager** (sales_manager) | Inventory integrity, approvals, allocation | Approvals queue taps, WhatsApp intents, availability Excel handover (L2), reassignment actions | Every guarded transition lands on their queue regardless of source channel |
| **Marketing lead** | Collateral, campaigns, brand gate-keeping | Studio Wizard briefs, collateral-change requests (ML3), campaign data reviews | Mostly `[Phase 2]` jobs; v1 = concierge briefs |
| **Owner / Developer** (developer_admin) | Portfolio visibility, launch decisions, investor reporting | Studio Wizard intake (D3), dashboard/Reports queries, forecast asks (D5), consultation sessions (A12) | Subsumes "developer" — no separate persona |
| **Ops** | Onboarding data, deal files, appointments, contracts | Bulk uploads (L3), migration exports (L5), contract/KYC uploads (O1/O3), calendar drawer (O2) | Heaviest *file-based* input user |
| **Buyer** | End customer — **no login in v1** | Lead forms, replies on WhatsApp/email (via rep), Present Mode choices (via rep's device), buyer portal `[Phase 2]` | Reaches the AI only through mediated surfaces until the portal ships |
| **External humans** | Architect, notary/solicitor, partner agency, bank | Architect: CAD/plan files (via Drive dump or email) · Notary: appointment threads, signed docs · Agency: lead submissions, shared availability · Bank: sanction letters | Today: files arrive *through* Ops/Manager; direct channels are candidates (§6C) |
| **External AI agents** | A9 agency agents, buyer-side agents, future MCP callers | MCP tool calls under identity classes + guarded-action matrix | The ideal surface (154 capabilities) is spec'd in `source/bricly-capability-surface.md` `[Post-MVP]` |

---

## 4. Master matrix — user type × stage

Modalities each user actively sends through, per stage. (Tags abbreviated: c = concierge, s = stretch.)

| | **1 Load** | **2 Launch** | **3 Perform** | **4 Sell** | **5 Close** | **Cross-cutting** |
|---|---|---|---|---|---|---|
| **Rep** | — | — | Board CTAs, first-contact drafts `[v1]` | WhatsApp text+voice `[v1]`, Present sessions `[v1]`, match queries `[v1]`, personalise requests `[v1 c]` | WhatsApp status intents `[v1]`, POS/notary scheduling `[v1]` | Ask/chat queries `[v1 s]`, commission queries `[Phase 2]` |
| **Manager** | Availability Excel/PDF/photo `[v1]`, WhatsApp setup `[v1]`, conversational inventory updates `[v1]` | Brand approvals `[Phase 2]` | Allocation/reassignment taps `[v1]` | Approval taps (from any channel) `[v1]` | Approvals queue `[v1]`, payout sign-off `[Phase 2]` | Team-activity queries `[v1]`, briefing asks `[v1 s]` |
| **Marketing** | — | Studio briefs `[v1 c]`, collateral-change requests `[Phase 2]`, brand kit uploads `[v1 c]` | Campaign/spend data `[Phase 2]` | Buyer-profile collateral briefs `[Phase 2]` | — | Inventory-sync triggers (A5) `[v1]` |
| **Owner/Developer** | Signed contract + team roster (pre-flight) `[v1 c]` | Wizard intake + consultation Q&A `[v1 c]` | Margin/demand reviews `[v1]` | Personalisation briefs `[v1 c]` | — | Forecast/report asks `[v1 s→Phase 2]`, cross-project queries `[Phase 2]` |
| **Ops** | Drive dump (plans/CADs/brochures) `[v1]`, migration exports `[v1 c]` | — | — | — | Contract uploads `[v1]`, KYC/deal files `[v1]`, appointment drawer `[v1]` | Snag triage `[proposed]`, construction updates `[proposed]` |
| **Buyer** | — | — | Lead forms A/B `[v1]`, consultation booking `[v1]`, inbound conversations `[Phase 2]` | Preferences via Present Mode (mediated) `[v1]`, variant requests (mediated) `[v1 c]` | KYC docs (via rep/ops) `[v1]`, portal uploads `[Phase 2]` | Portal: status, messages, snags, referrals `[Phase 2]` |
| **External humans** | Architect CADs (via dump) `[v1]` | Architect revisions `[v1 c]` | Agency lead handoff `[Phase 2]` | — | Notary threads, bank letters (via ops today) `[v1]`→ direct `[§6C]` | Agency availability shares `[Phase 2]` |
| **External AI** | — | — | Lead submission via MCP `[Phase 2]` | MCP tools (log/hold/task/status/brief/brochure) `[v1.1]` | MCP guarded writes `[v1.1]` | Read-only Resources `[v1.1]` |

---

## 5. Use cases by stage

Format: **User → what they send → how the AI processes it → what happens → gating**. Priority (Pain·Value·Urgency) inherited from the source job.

### Stage 1 — Load (onboarding: workspace, units, plans, deals)

| Job | User | Input sent | Modality & format | AI processing | Output & gating | Prio | Scope |
|---|---|---|---|---|---|---|---|
| **L2** — "the brain-dump moment" | Manager | Unit schedule *in whatever shape it exists* | Excel, PDF, **photo of a printout** | **Ingest:** normalise to canonical CSV; map columns → Unit fields (unit_no · type · beds · floor · sqm · price · status); unmapped columns → tags | Unit records; validation pass flags dupes/missing prices — *nothing silently imported wrong* | H·H·H | `[v1]` concierge-assisted |
| **L3** | Ops | The Drive dump: per-level floor plans, brochures, **CADs**, site studies | Bulk file upload (PDF, image, .dwg/.dxf, ZIP) | **Ingest:** `media_type` classification (~9 types); filename/level/unit-number pattern match → link plan to Unit | Documents linked; low-confidence matches → human fix-up queue | H·H·H | `[v1]` |
| **L4** | Manager | Twilio number, rep roster, intent toggles | Settings UI + onboarding call | — (enables modalities 1–2) | 6 intents live; voice notes enabled — *transcribe first, then parse same as text* | H·H·H | `[v1]` |
| **L5** | Ops | Existing leads/deals exported as-is | Old-CRM export, spreadsheets, WhatsApp-group history | **Ingest:** Contact creation w/ phone-dedupe (hard block); Opportunities at true stage w/ units[] | Live board; first-week concierge shadow fixes data | M·H·H | `[v1 concierge]` |
| **M2** | Manager | "CM1104 is sold", corrections before external pushes | WhatsApp text/voice or UI | **Write + nudge:** guarded transition → ApprovalRequest; propagation to every surface | Cross-opp removal on Sold, reps notified | H·H·H | `[v1]` |

### Stage 2 — Launch (brand, collateral, go-to-market)

| Job | User | Input sent | Modality & format | AI processing | Output & gating | Prio | Scope |
|---|---|---|---|---|---|---|---|
| **D3** | Owner/Developer | Launch brief: style direction, references, brand stage, timeline | Studio Wizard structured intake + reference uploads | Brief → StudioRequest; **generate** `[v1.1]` (constraint model from CADs); concierge fulfils in v1 | Assets in delivery gallery (versioned, approvable); hosted lead form goes live | H·H·H | `[v1 concierge]` → `[v1.1]` |
| **A12** | Owner, Marketing, Manager | Answers in an adaptive consultation Q&A; on-demand decision asks (pricing, channel mix) | Conversational (Wizard chat) | **Match + generate:** loads context, surfaces comparable data w/ sources, captures locked decisions → briefs | ConsultationSession persisted; escalates on low confidence | M·H·L | `[v1 concierge]` |
| **CAD intake** (D3/L3) | Architect (via Ops) | Drawings + revisions | .dwg/.dxf files | CAD parse → **ConstraintModel JSON** — the architectural limits every render/variant must respect | Constraint model attached to Project/Units | — | `[v1 c]` human → `[v1.1]` AI |
| **ML3** | Marketing | "Price list changed / phase 2 released" change notices | UI request (future: conversational) | **Generate + nudge:** regenerate affected collateral; flag stale assets | Updated collateral versions | M·H·M | `[Phase 2]` |
| **Brand kit** | Marketing/Owner | Logo, palette, typography, tone-of-voice, buyer personas | File upload + Wizard fields | Stored as BrandKit; feeds all generation | Brand consistency gate (ML5/ML8) | — | `[v1 concierge]` |

### Stage 3 — Perform (demand capture & triage)

| Job | User | Input sent | Modality & format | AI processing | Output & gating | Prio | Scope |
|---|---|---|---|---|---|---|---|
| **D1** | Buyer | Form A (name, phone+country, email, buyer_type, property_type_interest, budget_band) / Form B (+1–3 units); consultation slot pick | Hosted lead form; UTM/session/IP geo server-side | **Ingest:** atomic capture — Contact (phone-deduped) + Opportunity + source + Activity + notification in one transaction; GTM event back to pixel | New Lead on board (or straight to Viewing Booked w/ Appointment if slot booked) | H·H·H | `[v1]` |
| **R2** | Rep (receiving) | — (form data does the first sort) | Form fields as signals | **Nudge:** rules-based priority ranking; scoring agent is Phase 2 (A2) | "Make first contact" CTA; overdue turns red | H·H·M | `[v1]` |
| **M7** | Manager | Reassignment taps | UI (board / Contacts bulk) | **Nudge:** round-robin v1; capacity/language rules later | Rep pinged bell + WhatsApp; SLA clock | M·H·M | `[v1]` |
| **A2** | System (acts for manager/rep) | Inbound lead from any channel | Any capture tier | **Nudge + write:** enrich, score, assign, draft outreach *in the rep's voice* | Draft only — must not auto-send | M·H·M | `[Phase 2]` |
| **A11** | Buyer ↔ agent | Qualifying conversation: criteria, budget, availability answers | WhatsApp/email free text (two-way) | **Write + match:** qualification dialogue, unit recommendations, books viewing on rep availability | Handover to rep w/ full history; must escalate to human on low confidence or on buyer request | M·H·M | `[Phase 2]` |
| Tier 2 webhooks | Ad platforms | Meta/Google lead-form payloads | Webhook JSON (v1: concierge CSV import) | Schema map → same atomic capture | Same as D1 | — | `[v1.2]` |

### Stage 4 — Sell (Phase A: lead → negotiating; Present Mode)

| Job | User | Input sent | Modality & format | AI processing | Output & gating | Prio | Scope |
|---|---|---|---|---|---|---|---|
| **A1** — the flagship | Rep | *"Just showed Mike Gatt the maisonette at Dolphin Court, wants a hold on CM9802, follow up Thursday"* | **WhatsApp text or voice note** (Twilio) | **Ingest + write:** STT if voice → multi-intent parse (that example = 3 intents) → entity resolution against live records (#CM prefix optional) → exactly one clarifying question on ambiguity | Preview card → rep taps Confirm/Edit → records update everywhere; guarded intents → ApprovalRequest | H·H·H | `[v1]` |
| **R3** | Rep | "Put a hold on CM9802 for Mike Gatt" / "Mark CM1104 as sold" | WhatsApp / voice (also email, per data-in scope) | **Ingest + write:** `request_hold` / `update_unit_status` | ApprovalRequest → M1; on approval, full propagation | H·H·H | `[v1]` |
| **R1** | Rep | Tap-approval of drafted follow-ups | Drafted message in rep's channel | **Nudge + write:** cadence workflow ranks today's follow-ups; draft references viewed units | Rep tap = send (buyer-facing rule) | H·H·H | `[v1]` |
| **R9** | Rep (relaying buyer) | Buyer criteria: budget, beds, type, view, timeline — "or just points at the building" | Filters/⌘K search; Visual Search hotspots; future NL | **Match** (v1 = filters + search) | Shortlist tray → Present Mode Compare | M·H·M | `[v1]` |
| **Present session** (R5 upstream) | Rep + Buyer together | Shortlist, finish/layout choices, compare decisions, session note | Present Mode interaction capture | Session → Opportunity: units[], Activity, files | Auto-captured on Save & send | — | `[v1]` |
| **R4 / D2** | Buyer (via rep) | Mid-meeting variant ask: "different finish / layout / view" | Personalise quick action; capture of preference_profile | **Generate** against ConstraintModel — v1: concierge ~24h; v1.1: A3 in-meeting | Variant lands on Opportunity + Unit, appears in Present + follow-up pack | H·H·M | `[v1 c]` → `[v1 stretch]` → `[v1.1]` |
| **R5** | Rep | Send trigger after meeting | One tap (send_brochure) | **Generate + write:** personalised pack from buyer's actual shortlist | Sent on buyer's channel; Activity logged | H·H·M | `[v1 c]` → `[Phase 2]` |
| **A4** | System | Silence/milestone triggers (not user-sent) | — | **Nudge + write:** personalised draft referencing viewed unit | Rep approves or pre-authorises | M·H·M | `[Phase 2]` |

### Stage 5 — Close (Phase B: hold → handover)

| Job | User | Input sent | Modality & format | AI processing | Output & gating | Prio | Scope |
|---|---|---|---|---|---|---|---|
| **M1** | Manager | Approve/reject taps | Approvals queue (never a chat message — structured ApprovalRequest w/ queue_position per unit+type) | **Nudge:** triage surfaces competing demand, 14-day expiry, inventory impact | Unit transitions, propagation, rep+buyer notified | H·H·H | `[v1]` |
| **O1** | Ops | Signed/returned contracts | PDF upload (or email attachment) | **Generate:** template populated from deal record (buyer, unit, price, plan). **Ingest:** upload auto-classifies to opportunity + checklist slot | Contract stored, POS-signed flag tracked | M·H·M | `[v1]` |
| **O3** | Ops (collecting from buyer) | KYC: passport/ID, proof of address, source of funds; reservation form, receipts | File/photo uploads, email attachments, WhatsApp media | **Ingest:** dropped file finds its opportunity, stage and checklist slot via media_type | Audit-ready deal file; immutable Activity rows | M·H·M | `[v1]` |
| **O2** | Ops / Rep | Appointment requests (notary, signing, handover) | A1 conversational or "+ New event" drawer; external calendar + email sync in v1 | **Write:** typed Appointments linked to opportunity | Reminders, calendar sync | M·M·M | `[v1]` |
| **R6** | Rep | Verbal buyer commit → reservation details, deposit terms | WhatsApp/UI; deposit recorded | **Write:** gate fires, Deal Room unlocks; KYC checklist runs | Hold (14-day) → Reservation needs approval + form + deposit | H·H·M | `[v1]` core, `[Phase 2]` full |
| **O4** | Ops | Payment confirmations, receipts | Manual status update + receipt upload (v1) | **Nudge:** upcoming/overdue surfaced; auto-chase Phase 2 | Milestone tracker; Reports aggregation | M·H·M | `[v1]` |
| Notary/bank docs | External (via Ops) | Sanction letters, Konvenju, searches | Email/paper → today re-uploaded by Ops | Same O3 ingest path | Filed to deal | — | `[v1]` mediated; direct channel → §6C |

### Cross-cutting (all stages)

| Job | User | Input sent | Modality & format | AI processing | Output & gating | Prio | Scope |
|---|---|---|---|---|---|---|---|
| **D4/M3** | Owner / Manager | Dashboard & report queries | UI; Ask panel NL `[v1 stretch]` | Read-only aggregation of immutable Activity | Live dashboards — no self-reporting anywhere | H·H·M | `[v1]` |
| **D5/A6** | Owner | "Board deck for Thursday" forecast asks | NL request | **Generate:** sell-out forecast in recipient's format, caveated w/ confidence | Report artifact | M·H·M | `[v1 stretch]` → `[Phase 2]` |
| **A5** | System (for Marketing/Manager) | Unit status changes (internal trigger) | Event | **Write + nudge:** collateral/availability sync everywhere | Stale-asset flags | M·H·M | `[v1]` |
| **A9** | External agency AI | Lead submissions, commission queries | MCP tool calls (identity classes) | Guarded-action matrix | Tracked partner deals | M·M·L | `[Phase 2]` |
| **B1–B4** | Buyer | Status queries, messages to notary/dev, **snag reports w/ photos**, referrals | Buyer portal (post-sale) | Photo understanding → snag records (O6 triage); thread routing | Snag queue, referral attribution | M·M/H·L | `[Phase 2]` |
| **A13** | Buyer ↔ system | Post-sale life events, upgrade interest | Portal/WhatsApp | **Generate + nudge:** continuity touchpoints | Repeat-client pathway | M·M·L | `[proposed]` |
| **A7/D6** | Owner | Cross-project pattern queries | NL | **Match** across past projects | De-risking insights | M·M·L | `[Phase 2]` |

---

## 6. Beyond the documented surface — candidate modalities

Everything in §2–5 assumes the user *deliberately tells* the AI something. The richest untapped inputs are **forwarded, captured, and implicit**. Each candidate below is mapped to user × stage and tagged **effort** (build cost) / **fit** (how naturally it extends the committed architecture). None are committed — this is a menu for roadmap discussion.

### A. Ambient & voice capture — Rep · Sell
| Candidate | What the user sends | AI processing | Effort / fit |
|---|---|---|---|
| Viewing-conversation recording (with consent) | Audio of the buyer meeting | Diarised STT → extract preferences, objections, budget signals → preference_profile + Activity; feeds D2 personalisation | High / High — the rep never types a note again |
| CarPlay / hands-free logging between viewings | Voice, eyes-free | Same A1 pipeline, voice-first UX | Low / High — A1 already handles voice |
| "Hey Bricly" Siri Shortcut / voice assistant | Spoken intents | Shortcut → same 6-intent parser | Low / Medium |
| CTI call transcripts (in/outbound) | Phone call audio | STT → summary + extracted intents → preview | Med / High — already flagged as a docs gap |

### B. Camera-as-input (photo → structured data) — Rep, Ops · Sell & Close
| Candidate | What the user sends | AI processing | Effort / fit |
|---|---|---|---|
| Snap a paper doc (signed POS, ID, deposit slip) | WhatsApp photo | OCR + classify → O3 ingest path → checklist slot | Med / High — extends modality 3 |
| Photo of sales-office whiteboard availability board | Photo | Table extraction → diff vs Unit records → M2 preview-then-commit corrections | Med / Medium |
| Business card photo | Photo | OCR → Contact draft (phone-deduped) | Low / High |
| Handwritten viewing sheet | Photo | Handwriting OCR → log_activity drafts | Med / Medium |
| Construction-site photos | Photos, geotagged | Auto-tag to project/phase → buyer-portal updates (O7) | Med / Medium |
| Screenshot forwarding (buyer's IG DM, competitor listing) | Screenshot via WhatsApp | Image understanding → lead capture or competitive note | Med / Medium |

### C. Forward-to-Bricly email dropbox — all internal + notary/bank/architect · Close & Cross
Unique per-workspace address (`deals@<workspace>.bricly.io`) or BCC. Forward the bank sanction letter, notary email or architect revision → AI matches sender/thread/content to the right deal, classifies the attachment, files it, and logs the correspondence. **The zero-UI channel for external humans who will never install anything.** Effort: Med / Fit: High — reuses O1/O3 classification; email data-in is already v1 scope.

### D. Context & sensor signals — Rep · Sell
Geofence: rep arrives at Dolphin Court with a viewing on the calendar → prompt *"Log viewing held with Mike?"* — one tap. Calendar + location fusion attacks the biggest compliance gap (unlogged activity) with near-zero rep effort. Effort: Med / Fit: High. Consent + battery caveats.

### E. Implicit behavioural signals — Buyer (passively) · Perform & Sell
Microsite/brochure engagement telemetry (dwell time, revisits, unit favourites), email opens, WhatsApp read receipts, Present Mode interaction traces. Nobody "sends" anything — but these are the *inputs* that make the A2 scoring and A4 nurture agents work, and the prototype's microsite engagement panel already demos it. Requires an **event pipeline**, not a message parser. Effort: Med / Fit: High (v1.1 trackable microsite is the natural carrier).

### F. Buyer-supplied media — Buyer · Sell & Close
- Inspiration images / Pinterest-style boards → conditioning inputs for render personalisation (R4/D2), constrained by the ConstraintModel.
- Buyer voice notes forwarded by the rep → same STT + preference extraction.
- Mortgage/KYC docs via secure one-time upload link (no portal needed) → O3 ingest.
- Snag photos + video at handover (B3).
Effort: Low–Med / Fit: High for the upload link; Medium for inspiration-conditioned generation.

### G. External system webhooks — systems · Close & Cross
| Source | Payload | Effect |
|---|---|---|
| DocuSign `[v1.2 planned]` | Envelope signed events | Advance doc lifecycle chain (sent→viewed→agreed→signed) automatically |
| Stripe `[v1.2 planned]` | Payment received | Advance PaymentMilestone; kill manual O4 updates |
| Bank/financing APIs | Pre-approval status | Unblock Reservation gate context |
| Accounting (Xero etc.) | Reconciled payments | Same as Stripe for bank-transfer markets |
| Listing portals | Inquiry + availability sync | Tier-1-equivalent capture; two-way availability |
| Land registry | Search results | Notary-searches step evidence |

### H. Bulk "brain dump" folder ingest — Manager/Ops · Load
Drag-drop the entire messy project folder (mixed CADs, Excels, PDFs, photos, old contracts) → AI sorts, classifies and routes every file to the L2/L3/L5 pipelines in one pass, with a single review queue. Plus **versioned CAD re-ingest with diff detection** when the architect sends revisions (flags affected units/renders/collateral → feeds ML3). Effort: Med–High / Fit: Very high — it's the L2/L3 "no format demanded" philosophy taken to its conclusion, and the best onboarding demo imaginable.

---

## 7. Processing-capability roll-up (what the architecture must support, by phase)

| Capability | Needed for (modalities) | First required |
|---|---|---|
| LLM intent parsing + entity resolution (contacts/units/devs) + clarifying-question loop | 1, 2, 4, 5, 17 | `[v1]` |
| Preview-then-commit write layer + ApprovalRequest gates (channel-agnostic) | all mutating inputs | `[v1]` |
| Speech-to-text (Whisper) | 2, §6A | `[v1]` |
| Excel/CSV/table normalisation + column mapping + validation queue | 8, 11, §6H | `[v1]` (concierge-assisted) |
| File classification (`media_type`, ~9 types) + deal/unit/checklist routing | 9, 14, §6B/C/H | `[v1]` basic → `[v1.1]` AI |
| Email thread ↔ deal matching + attachment handling | 5, §6C | `[v1]` sync → `[v1.2]` parse |
| OCR / document extraction (typed + handwriting + ID docs) | 3, 14, §6B | `[v1.1]` |
| CAD parsing → ConstraintModel JSON (+ revision diffing) | 10, §6H | `[v1 c]` human → `[v1.1]` |
| Image/photo understanding (whiteboards, screenshots, site photos, snags) | §6B, 19 | `[v1.1+]` candidates |
| MCP server: tool registry, identity classes, guard matrix | 15, 18 | `[v1.1]` |
| Webhook ingestion framework (schema-mapped, idempotent) | 16, §6G | `[v1.2]` |
| Behavioural event/telemetry pipeline + scoring features | 13, §6E | `[v1.1]` microsite → `[Phase 2]` scoring |
| Generation conditioned on ConstraintModel + BrandKit (+ buyer inspiration) | 12, §6F | `[v1.1]` |
| Consent, recording-law and GDPR handling (recording, telemetry, geofencing) | 2, §6A/D/E | before any ambient capture ships |

**Shared primitive worth naming:** almost every file-ish input (§6 B, C, G, H and modalities 3, 9, 14) reduces to one question — *"which deal/unit/checklist slot does this artifact belong to?"* Build **artifact classification + routing** once, as a service, and every channel above becomes a thin adapter onto it. Same for the **write layer**: WhatsApp, email, MCP, portal and UI all converge on identical preview-then-commit + gate semantics.

---

## 8. Gaps & open questions

1. **CTI / phone calls** — mentioned in `source/bricly-flow-lead-capture-and-routing.md` §10 but unspec'd. Biggest untapped channel for Maltese sales culture; needs provider choice + recording-consent position.
2. **Social DMs** (Instagram/Facebook) — named as a capture channel, no integration path defined. Meta's messaging APIs could ride the Tier-2 webhook framework.
3. **OCR depth** — v1 "AI-assisted PDF parsing" is scoped for availability lists only; ID-document extraction (KYC) and handwriting are undefined.
4. **Video as input** — buyer walkthrough reactions, site videos: no documented use; only relevant if §6A/B ships.
5. **Recording & telemetry compliance** — GDPR lawful basis, Maltese two-party consent norms, retention policy for transcripts/telemetry. Must be resolved before §6 A/D/E leave the menu.
6. **Buyer identity across channels** — the same buyer arrives via form, WhatsApp and (later) portal; phone-number dedupe is the v1 anchor, but email-only and DM-only identities need a merge strategy.
7. **Offline/site conditions** — sales offices and construction sites have poor connectivity; voice/photo capture should queue-and-sync.

---

*Related docs: `canonical/06-integrations-and-ai.md` (agent posture, MCP contract) · `canonical/05-flows/lead-capture-and-routing.md` (5-tier model) · `canonical/05-flows/onboarding.md` (Load-stage imports) · `canonical/03-data-model.md` (Document chains, ConstraintModel) · `prototypes/Bricly_Jobs_and_Flows.html` (all job IDs cited here).*
