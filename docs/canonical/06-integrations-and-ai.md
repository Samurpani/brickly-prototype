# 06 — Integrations & AI

**Status:** Canonical · Updated 2026-08-13 · Ground truth: v2 prototype Settings → Integrations → WhatsApp/MCP, Chat page, Ask panel, Automations; scope per `source/Bricly-MVP.md` §9

---

## 1. Agent posture (what "AI" means per release)

| Release | AI capability |
|---|---|
| **v1 [MVP]** | WhatsApp command parser (the only mutating agent feature). System-triggered side effects (approval auto-creation, activity logging, notification dispatch). Stretch: read-only home-screen chat; voice-note→Activity transcription. **No generation. Studio is concierge-fulfilled.** |
| **v1.1** | MCP server publicly exposed (contract below). Studio generation goes live behind the existing Wizard. AI-assisted unit import (parse PDFs/Excel availability lists). |
| **v1.2+** | Automations engine (the builder UI already exists), inbound conversation parsing (LLM lead capture Tier 3), ad-platform webhooks. |
| **Vision** | The rep's agent staff — Remy (record), Ella (day), Cole (deals), Nora (money) — one voice, attributed work, single-tap approvals. See `source/Bricly_CRM-_Product_Vision.md`. **The v2 Today page is a working demo of this** (Cole prep summaries, Ella scheduling updates, action rooms with drafted messages and one-tap confirms) — all scripted content, no AI behind it. |

**Design rule locked in the vision doc and honoured everywhere:** anything that reaches a buyer requires a human tap. Agents draft, prepare, and log; the rep's tap is the signature.

## 2. WhatsApp command parser [MVP — hard requirement for M3]

Reps use their existing WhatsApp muscle memory as a mobile-style interface (v1 is desktop-only otherwise). Twilio webhook → structured command grammar → CRM mutations with confirmations. Ship with a tiny command set (3–5) and expand from usage.

Command grammar (from the prototype's Commands tab; each maps 1:1 to an MCP tool):

| Intent | Example utterance |
|---|---|
| `log_activity` | "Showed Mike the Dolphin Court maisonette this morning" |
| `request_hold` | "Put a hold on CM9802 for Mike Gatt" |
| `create_task` | "Remind me to chase Luca's deposit Friday" |
| `update_unit_status` | "Mark CM1104 as sold" |
| `get_brief` | "What's my day look like?" |
| `send_brochure` | "Send Mike the Dolphin Court brochure" |

Behaviour rules (prototype Behaviour tab): confirmations echo what was understood before mutating; ambiguous parses ask one clarifying question; guarded actions (holds, unit status) route through ApprovalRequest instead of executing directly.

## 3. MCP server [v1.1 — contract already drafted in the prototype]

Settings → Integrations → WhatsApp/MCP → Connection tab shows the literal v1.1 contract:

- **Endpoint:** `mcp.bricly.io/v1` (per-workspace) · masked auth token with reveal
- **Exposed tools (6, individually toggleable):**

| Tool | Description (verbatim from prototype) | Guard |
|---|---|---|
| `log_activity` | Log a viewing, call or meeting against an opportunity | autonomous |
| `request_hold` | Raise a hold request for a unit pending manager approval | creates ApprovalRequest |
| `create_task` | Create a task/reminder | autonomous |
| `update_unit_status` | Change a unit's status (available / hold / sold) | approval-gated |
| `get_brief` | Return the rep's morning brief / daily priorities | read-only |
| `send_brochure` | Attach and send a project brochure to a contact | rep-tap required |

- **Setup wizard** (3 steps): scan/enter number → verify webhook → enable MCP tools.
- v1 builds the capability surface so this exposure needs **no rearchitecture** — Tools are API endpoints, Resources are named reads (per locked MVP: ~37 Tools, ~21 Resources, 4 Prompts).
- The ideal-product MCP surface (154 capabilities, external buyer/partner agents, identity classes, guarded-action matrix) is specified in `source/bricly-capability-surface.md` and `source/bricly-flow-agent-initiated.md` — **[Post-MVP]**.

## 4. Chat & Ask [stretch in v1 — read-only]

- **Ask panel**: topbar "✦ Ask" slide-in; expandable to full page; answers questions against workspace data ("Dolphin Court this week").
- **Chat page**: composer + chips, thread history, 7 demo intents with action buttons.
- v1 scope if the stretch ships: **read-only** — answers from Resources in natural language, cannot mutate state. Mutations remain WhatsApp-grammar only until the MCP layer lands.
- Opportunity feed has a ✦ AI-draft chip (drafts a reply in context) — in v1 this can be a plain LLM call with the opp context; buyer-facing sends always need the rep's tap.

## 5. Automations [UI: v2-full · engine: v1.2]

Builder (full-screen takeover): name, trigger, linear numbered steps (no branching — deliberate cut), from templates. Triggers seen in the prototype: New Lead Captured, Tag Added, Viewing Completed, Price Drop, No Reply After 3 Days, Hold Expiring Soon. Steps: Send WhatsApp / Send Email / Wait N days / Notify Rep / Change Pipeline Stage (+ Meta Ads retarget on the marketing templates). Integration keys cross-link to Settings cards.

v1 ships **without** the engine; the two marketing-flavoured seeds (Price-Drop Announcement, Re-engagement Drip) carry the marketing-automation story in demos.

## 6. Third-party integrations

| Integration | Purpose | Scope |
|---|---|---|
| **Twilio (WhatsApp)** | Command parser webhook + outbound messages | [MVP] hybrid |
| **Email provider** (standard ESP) | Outbound email delivery | [MVP] hybrid |
| **Bricly-hosted lead form** | Tier-1 lead capture per project | [MVP] owned |
| **Google Calendar** | Read-only sync | [MVP stretch] |
| **Whisper** | Voice note → Activity transcription | [MVP stretch] |
| **Chart.js (CDN)** | Reports rendering (prototype detail; build may choose otherwise) | — |
| **Google Maps embed** | Development detail map | [MVP] trivial |
| **DocuSign** | Reservation contract sending | [v1.2] |
| **Stripe** | Deposit collection | [v1.2] |
| **Meta / Google Ads** | Campaign webhooks + retargeting | [v1.2] |
| **Outlook/iCloud two-way calendar** | Full calendar sync | [v1.2] |

## 7. Concierge queue (v1's "integration" with humans)

Every generation-looking surface in v1 routes to the internal fulfilment queue instead of an AI service:

| Surface | v1 behaviour |
|---|---|
| Studio brief wizard | Creates StudioRequest → Notion/ClickUp queue → team produces externally (Midjourney, Nano Banana Pro, Kling, Canva, Figma) → uploads back → status walks Requested → In production → Delivered; files write back as CRM Documents |
| "Personalise" / custom render (from Opportunity or Unit) | Same queue, ~24h SLA, delivered against the Opportunity/Unit with `media_type=unit_render` |
| Present Mode "Generate custom render" | v1: not live-generated — either pre-produced render variants (as the prototype simulates with finish-swap photos) or routed to the queue |
| Present Mode "Generate brochure / buyer link" | Brochure → queue; buyer link → static shared page in v1 (trackable microsite is v1.1) |

Every brief and delivery is documented (formats, fields, hours spent) — that log is the training data and prioritisation signal for v1.1 automation.
