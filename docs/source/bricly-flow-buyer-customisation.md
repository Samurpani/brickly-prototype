# Bricly Buyer Customisation Flow

The flow that turns a Contact with stated and inferred preferences into a one-to-one, multi-unit, potentially multi-project personalised buyer pack. The differentiator that justifies Bricly as more than a CRM plus a brochure builder.

---

## Scope

**Start state.** A Contact exists in CRM. One or more Opportunities exist under this Contact across one or more Projects. Some level of preference data is captured: explicit (stated in lead capture, qualification calls, or meetings), inferred (microsite browsing, email engagement, profile inference), default (Persona-level expectations for this project segment).

**End state.** A personalised pack exists as a Microsite of type `personalised_buyer_pack`, password-protected, link-delivered to the buyer via their preferred channel (WhatsApp, email, SMS), with a synced PDF export. The pack contains buyer-specific internal renders, floor plan annotations, per-unit one-pagers, a condensed meeting summary, and optional social proof signals. All actions, generations, and engagement events are logged to the CRM activity stream.

**Out of scope of this flow.** Public project microsite customisation (handled in Launch Package and Go-to-Market flows). Brochure or ad creative variants per buyer (not a real product). Post-sale PurchaserPortalAccess (separate flow, this pack transitions into it on Closed_Won).

## Definition

**The personalised buyer pack = a curated, rep-controlled, buyer-facing surface that shows a specific buyer the exact homes they're considering, rendered in the styles and finishes they expressed interest in, anchored to the conversation they had with their consultant.**

It is not a brochure variant. It is not a configurator. It is the conversation made visual, persistent, and shareable. The buyer consumes, never configures. The rep curates, never autopilots.

---

## Foundational principles locked in this session

1. **The buyer never triggers generation.** Generation is rep-controlled exclusively. The pack is a frozen artefact from the buyer's perspective.
2. **Composition is multi-unit, multi-project, Contact-anchored.** One pack per Contact, composing across all of the Contact's active Opportunities. One Opportunity per (Contact, Project) rule holds.
3. **Explicit preferences drive generation prompts.** Inferred signals and Persona defaults inform the rep's proposals and surface what to ask about. They never compose the prompt.
4. **Live generation in the meeting, no speculative pre-generation.** Cost discipline over instant gratification. Tablet UI absorbs the wait conversationally.
5. **Reactive caching, never predictive.** Once generated, a (Unit, FinishPackage, layout, StyleSet, free-text) combination is cached on the Opportunity and across the workspace. Repeat requests return cached.
6. **Modifiable zones for layout customisation.** Architect-defined permitted zones on CAD; free-draw within zones, blocked outside.
7. **Renders and floor plans always carry the disclaimer.** "Artistic visualisation. Not contractually binding. Subject to architectural and developer approval."
8. **Vision verification gates everything generated.** Constraint compliance is non-negotiable. In-meeting failures fail fast to the rep, post-meeting failures retry three times silently before internal escalation.
9. **Rep approval is the only path to send.** No autonomous send. Send action = approval.
10. **Pack composition lives in CRM context.** Rep never mode-switches to Studio. Studio capabilities are invoked from the Opportunity view.
11. **Voice, chat, and UI composition all valid.** Same backend, multiple interaction modes.
12. **Link is the canonical surface, PDF is the synced export.** Buyer's downloaded PDF is their artefact-of-record, the link always serves the current version.
13. **Password-protected, 90-day default expiry.** Bricly-generated 6 to 8 character alphanumeric password.
14. **Workspace-level social proof signals.** Threshold-gated, opt-in by developer, per-pack rep toggle, daily snapshots.

---

## Customisation dimensions

What can actually be personalised in the pack:

| Dimension | What's customisable | What's not |
|-----------|---------------------|------------|
| Interior renders | StyleSet, FinishPackage, layout variant, free-text style modifier, optional reference imagery | Architectural truth (walls, openings, structure) |
| Exterior renders | Not customised per buyer; standard launch package exteriors used | Buyer-specific exteriors |
| Floor plans | Buyer-driven layout annotations within architect-defined modifiable zones | Structural walls, fire egress, services routing |
| Per-unit one-pager | Buyer name, chosen finishes, chosen styling, price, payment plan version, currency, language | Architectural specs |
| Meeting summary | Condensed buyer-facing recap, rep-edited from agent draft | Verbatim transcripts (internal only) |
| Cross-project composition | Units span multiple Projects via active Opportunities under one Contact | Speculative Units without an active Opportunity |
| Intro paragraph | Agent-drafted in rep's voice, rep edits before send | Auto-send without rep approval |
| Pricing presentation | Actual price or "pricing on request", per-pack rep toggle | Hidden pricing without buyer awareness |
| Currency | Defaults from Contact, rep can override | Multi-currency display within same pack |
| Language | Defaults from Contact, rep can override; inherits ContentBackbone language variant pattern | Mid-pack language switching |
| Payment plan version | Rep selects from project's approved plans | Custom plans without manager approval |
| Social proof signals | Workspace opt-in, threshold-gated, daily snapshot, per-pack rep toggle | Individual buyer identification |
| "You might also consider" | Rep-curated. Adding a Unit here is visual only; no Opportunity is created and no link is made on the Contact. Buyer can ask the rep about the Unit through the contact CTA, at which point the rep formally opens an Opportunity if there's real interest | Auto-suggested similar units. Auto-creation of Opportunities for suggested Units |

---

## ConstraintModel implications: a new layer of architect input

The pack flow requires the architect (or developer) to mark **modifiable zones** at CAD upload. This extends ConstraintModel layer 1 with a new attribute:

- **Layer 1.** Architectural truth: structural walls, openings, ceiling heights, services. Non-modifiable.
- **Layer 1 modifiable zones.** Architect-marked regions where non-structural partition walls can be added, removed, or moved. Buyer free-draw allowed inside; blocked outside.
- **Layer 2.** Developer's offered options: FinishPackages (with potential split into hard/soft finishes per FinishPackage configuration mode), layout variants (developer-curated alternatives), optional configurations.
- **Layer 2 FinishPackage mode (new per-Unit attribute).** "Fully finished single package" | "Pick a package" | "Split packages (hard/soft separate)" | "Fully customisable from material library".
- **Layer 3.** Buyer's selections on a specific Opportunity: chosen FinishPackage(s), chosen layout variant or free-draw annotation, StyleSet ref, free-text modifier, reference imagery.

The CAD-to-JSON extraction (Claude vision API) is extended to detect non-structural partition candidates and propose modifiable zones for architect/developer approval at onboarding.

---

## Trigger model

Three triggers initiate pack composition. All rep-controlled. Self-serve buyer customisation is explicitly out.

### Trigger 1. Rep-manual, in-meeting

| Field | Description |
|-------|-------------|
| Actor | Sales Rep on tablet, buyer present |
| Context | Discovery viewing, follow-up viewing, showroom visit, online meeting |
| Capability | T22 `generate_personalised_render`, T57 `update_opportunity_preferences`, T58 `set_opportunity_configuration`, (Gap) `annotate_floor_plan_layout`, T24 `regenerate_asset`, T24a `verify_asset_constraints`, agent session for in-meeting conversation parsing |
| Entity affected | Opportunity (layer 3 selections), Assets (renders, floor plan annotations), Activity (session-grouped at meeting close) |
| Output | Renders, floor plan annotations, structured preferences accumulated on the Opportunity, ready for pack composition |
| Agent role | Pattern 2 (proposes during the meeting, rep approves), Pattern 1 for vision verification within the fail-fast in-meeting pattern |

### Trigger 2. Rep-manual, post-meeting (or any time outside a meeting)

| Field | Description |
|-------|-------------|
| Actor | Sales Rep, at desk, on mobile, anywhere in CRM |
| Context | After a meeting, follow-up after buyer engagement, response to buyer message, scheduled outreach |
| Capability | T59 `generate_personalised_buyer_pack`, T22 (any additional renders), T28 `provision_microsite` type=`personalised_buyer_pack`, T27 `share_asset` for delivery, T30 `publish_microsite` |
| Entity affected | Microsite (Draft → Published), Asset (the pack as a composed artefact), Document (PDF export), Activity on Contact and each linked Opportunity, Notification to buyer |
| Output | Pack sent. Live link with password. PDF generated. Buyer notified via preferred channel |
| Agent role | Pattern 1 for composition mechanics (PDF generation, link provisioning, sync chain firing). Pattern 2 for content draft (meeting summary, intro paragraph), rep approves before send |

### Trigger 3. Agent-proposes, rep approves

| Field | Description |
|-------|-------------|
| Actor | Agent (A3 render/collateral agent and engagement signal agent), rep approves |
| Context | Inferred preferences from microsite engagement, email engagement, repeated behavioural signals strong enough to warrant proactive outreach. Agent confidence threshold gates this trigger. Hybrid delivery: agent pushes proactively to rep (via rep's preferred channel: WhatsApp, in-CRM notification) when engagement signal is high (hot lead, multiple sessions, deep engagement). Agent pulls (surfaces "ready for your review" on next CRM session) when signal is moderate. Agent decides which based on signal strength, configurable thresholds per workspace |
| Capability | Agent proposes pack composition, surfaces to rep via push (proactive) or pull (next CRM session) depending on signal strength, rep reviews and approves or discards |
| Entity affected | Pack proposal (Draft Microsite, not visible to buyer), Activity on Contact, Notification to rep |
| Output | Either: rep approves with edits → pack moves through Trigger 2 send flow. Or: rep discards → proposal logged and archived |
| Agent role | Pattern 2 (drafts proposal, rep approves), with the explicit constraint that **agent never auto-sends** even if rep is unresponsive. Discards after configurable timeout (default 30 days) |

---

## Preference inputs

Three categories, with strict separation between what informs and what generates.

### Explicit preferences (the only inputs that compose the generation prompt)

Captured by rep or agent during meetings, calls, or chat:

- **StyleSet selection** per Opportunity. From the Bricly-defined or workspace-defined StyleSet library
- **Free-text style modifier** per Opportunity. Rep-captured ("walnut, plants, low furniture")
- **Reference imagery** per Opportunity. Rep-uploaded (Pinterest links, buyer's phone photos)
- **FinishPackage selection** per Unit per Opportunity. Constrained to layer 2 menu
- **Layout variant selection or free-draw annotation** per Unit per Opportunity. Constrained to layer 2 variants or layer 1 modifiable zones
- **Currency, language preferences** at Contact level
- **Payment plan version preference** per Opportunity
- **Pricing visibility preference** per pack

### Inferred preferences (inform the rep's proposals, never the prompt)

Derived from:
- Microsite engagement (units viewed, time spent, FinishPackage clicks, save events)
- Email and message engagement (open rates, click-through, link follows)
- Source channel (lead capture origin signals: paid social vs broker referral vs walk-in)
- Persona inference (buyer's profile pattern matched against workspace's Personas)
- Past Opportunity behaviour (this is buyer's third project considered with workspace, prior preferences carry forward)

Used by:
- Agent to surface "based on what we've seen, this buyer probably wants X, want to lead with that?"
- Agent to compose Trigger 3 proposal pack
- Rep to anticipate buyer questions and pre-curate the meeting

### Default preferences (seed the menu, never the prompt)

- Persona-level expectations for this project segment (typical buyer wants X StyleSet, X FinishPackage)
- Project defaults (developer's most popular FinishPackage at this point in the sell-through cycle)
- Workspace defaults (currency, language, payment plan)

Used by:
- Initial menu population when rep opens the render request panel
- Fallback when explicit data is sparse and rep needs a starting point

---

## Generation prompt structure

The orchestration layer composes the render prompt deterministically from structured fields. No fuzzy inference, no weighted scoring.

```
Subject: {Unit.type} in {Project.name}, {Unit.view orientation}, {Unit.level}
Architectural constraints (from ConstraintModel layer 1):
  wall positions, openings, ceiling height, structural elements, materials list
Modifiable zone state (if buyer drew):
  buyer's layer 3 annotation, validated against layer 1 modifiable zones
Layout state (from Opportunity layer 3):
  chosen layout variant OR validated free-draw annotation
Finish state (from Opportunity layer 3):
  FinishPackage materials list OR split hard/soft packages OR custom material picks
Style direction (from Opportunity, StyleSet ref + free-text modifier):
  StyleSet reference imagery, mood keywords, free-text additions, optional buyer-uploaded reference imagery
Brand bound (from BrandKit.art_direction):
  lighting profile, composition rules, colour grading
Shot type (from rep selection):
  interior hero | kitchen view | living room view | master bedroom | bathroom | etc.
```

The composition is owned by Bricly. The render execution is orchestrated to Midjourney (or successor). Vision verification (T24a) runs against the original ConstraintModel layer 1 specification, gates the output.

---

## Step-by-step flow

### Stage 1. Pre-meeting context preparation

| Field | Description |
|-------|-------------|
| Trigger | Appointment scheduled (Sales Process Stage 7) |
| Actor | Agent autonomous (Pattern 1), rep reviews in CRM before meeting |
| Capability | P6 `prep_for_buyer_meeting`, agent composes meeting brief from Contact + Opportunities + inferred preferences + microsite engagement |
| Entity affected | Activity on Opportunity (meeting brief), no asset generation at this stage |
| Output | Rep arrives at meeting with: buyer's stated preferences, inferred preferences flagged separately, suggested talking points, shortlist proposal, units to feature in the order of inferred relevance |
| Agent role | Pattern 2: surfaces a brief, rep is the meeting driver |

### Stage 2. In-meeting render and floor plan customisation

| Field | Description |
|-------|-------------|
| Trigger | Meeting in progress, rep selects a Unit to discuss |
| Actor | Sales Rep on tablet, buyer reviews on screen |
| Capability | T22 with FinishPackage, layout variant, StyleSet, free-text modifier. (Gap) `annotate_floor_plan_layout` for layout free-draw. T24a for verification. T24 for retry on rep-confirmed retry. Reactive caching on every successful render |
| Entity affected | Opportunity (layer 3 preferences updated), Assets (renders and floor plan annotations) |
| Output | Renders generated live, displayed on the tablet, validated against the ConstraintModel. Layout annotations accumulated. Each Unit accumulates a set of approved candidate assets for the pack |
| Approval | Implicit: rep adds the render to the Opportunity's pack-candidate set by tapping "keep" on the tablet. Renders not kept are stored but not promoted to pack-candidates |
| Agent role | Pattern 2: agent suggests next renders based on conversation parsing (voice or rep notes). Pattern 1: vision verification on every render, fail-fast on first failure with rep choice to retry or adjust |
| UX during wait | Tablet shows: reference imagery for chosen StyleSet, FinishPackage material samples, the layer 1 floor plan, similar approved renders from the launch package library, the constraint disclaimer, and the agent-suggested follow-up question for the rep |

### Stage 3. Meeting capture and structured preference extraction

| Field | Description |
|-------|-------------|
| Trigger | Meeting ends, rep stops the recording or finishes notes |
| Actor | Agent (autonomous parsing), rep reviews extraction |
| Capability | A1 agent transcribes and parses, extracts: shortlist, ruled-out Units, finish preferences, style preferences, objections, next steps, follow-up tasks. T57, T58 to commit structured updates to the Opportunity |
| Entity affected | Activity on Opportunity (single session-grouped Activity with sub-event drill-down), Opportunity preference and configuration fields updated, follow-up tasks created |
| Output | Opportunity carries the complete in-meeting context: explicit preferences, kept renders, layout annotations, structured next steps |
| Approval | Rep reviews the agent's extraction, edits inline, confirms |
| Agent role | Pattern 1 for extraction. Pattern 2 for structured updates (agent proposes, rep confirms structurally meaningful changes like "buyer is now investor not owner-occupier") |

### Stage 4. Pack composition initiation

| Field | Description |
|-------|-------------|
| Trigger | Rep decides to compose. Can be at meeting close on tablet, post-meeting at desk, or in response to buyer engagement. Trigger can also be agent-initiated (Trigger 3) with rep at the approval step |
| Actor | Sales Rep, optionally voice/chat to agent |
| Capability | T59 `generate_personalised_buyer_pack`, T28 `provision_microsite` type=`personalised_buyer_pack` (Draft state), composition panel surfaced in Opportunity view |
| Entity affected | Microsite (Draft), Asset references compiled, Document (PDF placeholder) |
| Output | Draft pack with all sections, ready for rep review |
| Composition contents | Buyer header (from Contact). Cross-Opportunity Units selector (defaults to all in-meeting shortlisted). Per-Unit content selection (renders, floor plan annotations, FinishPackage view, layout variant). Meeting summary draft (agent-composed from Activity, rep edits). Intro paragraph draft (agent-composed in rep's voice). Pricing presentation toggle. Currency and language overrides. Payment plan selector. "You might also consider" section (optional, rep adds Units as visual references only; no Opportunity created, no Contact link, buyer engages through the contact CTA if interested). Social proof signals section (if workspace opt-in and thresholds met). Preview |
| Agent role | Pattern 1 for composition mechanics. Pattern 2 for drafted content |

### Stage 5. Rep review and content editing

| Field | Description |
|-------|-------------|
| Trigger | Composition draft ready |
| Actor | Sales Rep |
| Capability | Inline editing of meeting summary, intro paragraph, currency, language, payment plan, pricing toggle, social proof toggle, similar units selection. Render reordering, render exclusion, additional render generation via T22 |
| Entity affected | Microsite (Draft updated), Activity on Contact for material edits, no buyer-visible state change |
| Output | Pack curated to rep's satisfaction |
| Approval | Rep self-approves by moving to send. No separate approval gate |
| Agent role | Pattern 2 for content suggestions, Pattern 3 for surfacing inconsistencies ("the meeting summary mentions investor framing but you selected an owner-occupier payment plan, intended?") |

### Stage 6. Send action

| Field | Description |
|-------|-------------|
| Trigger | Rep taps send, or instructs agent to send via voice/chat ("send it") |
| Actor | Sales Rep (explicit) |
| Capability | T30 `publish_microsite` for the pack. PDF generation (Owned, composed from Microsite content). Password generation (Bricly auto-generated, 6 to 8 char alphanumeric, shown to rep). T27 `share_asset` for delivery via the channel the rep picks at send time (WhatsApp, email, or SMS). The Contact's preferred channel is surfaced as the default suggestion, but the rep selects each time. Activity logged on Contact and each linked Opportunity. Notification fired to buyer |
| Entity affected | Microsite state Draft → Published. Document (PDF) generated and linked. Activity on Contact and Opportunities. Notification to buyer with link and password |
| Output | Pack live and delivered. Buyer receives link with password via preferred channel |
| Approval | Send action is the approval. No autonomous send |
| Agent role | Pattern 1 for mechanics. Pattern 3 for surfacing send-time anomalies (eg "the link is being sent at 11pm in buyer's timezone, want to schedule for tomorrow morning?") |

### Stage 7. Buyer engagement

| Field | Description |
|-------|-------------|
| Trigger | Buyer opens the link, enters password, views the pack |
| Actor | Buyer (read-only consumption) |
| Capability | Microsite view tracking, section-level engagement metrics, PDF download tracking, contact-CTA tracking, share detection (new device fingerprint), comment or favourite (if enabled) |
| Entity affected | Microsite engagement metrics (aggregate). Discrete events as Activities on Contact (PDF download, contact-rep CTA tapped, comment posted on Unit or render, Unit favourited). Notifications to rep on alert-worthy thresholds |
| Output | Buyer experiences the pack. Engagement signals flow back to CRM |
| Buyer-side affordances | View, download PDF, share link (and password), tap contact-rep CTA which opens WhatsApp/email to the rep pre-filled with the Unit context, leave comments on specific Units or renders, favourite Units |
| Buyer-side restrictions | Cannot trigger generation. Cannot swap FinishPackage or StyleSet. Cannot change layout. Cannot see other buyers' identities or behaviours. Cannot bypass password |
| Agent role | Pattern 1 for engagement metric aggregation. Pattern 3 for alert-worthy threshold detection and rep notification |

### Stage 8. Pack updates and versioning

| Field | Description |
|-------|-------------|
| Trigger | Rep regenerates a render (eg buyer asked for different StyleSet via message), adds a Unit, edits the meeting summary, changes a payment plan, or otherwise modifies a sent pack |
| Actor | Sales Rep |
| Capability | T24 for regeneration. T22 for new render. T29 `update_microsite` for content updates. Auto-sync of PDF export with link |
| Entity affected | Microsite (version incremented, current version flag updated). Old version retained in CRM for rep audit. Asset references updated. Activity on Contact. Notification to buyer ("your consultant has updated your pack") |
| Output | Buyer's link auto-shows current version. Buyer's previously-downloaded PDF remains theirs to keep, the link's current PDF reflects the latest |
| Approval | Rep-initiated regenerations auto-update without separate approval. Adding a Unit confirms the addition; rest of pack stays |
| Agent role | Pattern 1 for sync. Pattern 2 for proposing updates ("buyer messaged about Scandinavian, want to regenerate the renders with that StyleSet and update the pack?") |

### Stage 9. Pack lifecycle transitions

| Trigger | Behaviour |
|---------|-----------|
| Opportunity Closed_Won (any one of the linked Opportunities) | Pack is removed from live view. The buyer's link returns a "pack closed, contact your consultant for next steps" state. The pack record stays linked to the Contact and to each linked Opportunity for historical and audit reference. PurchaserPortalAccess is a separate downstream flow for the won Unit, not a transition the pack makes |
| Opportunity Closed_Lost (all linked Opportunities) | Pack stays viewable until standard expiry. Visible state changes to "Opportunity closed". 90-day expiry counter resets from this state change, not from original send |
| Project paused (Selling → Launching) | Pack pauses. Buyer sees "your consultant will be in touch shortly". Rep notified. Resumes when project resumes |
| Rep reassignment on Opportunity | Pack contact info auto-updates to new rep. Agent flags attributable content (meeting summary, intro paragraph) to new rep for review before any new send. Existing pack remains viewable, but updates require new rep to review previous content first |
| Buyer requests standard collateral instead | Personalised pack stays at current state (can be paused early or left). Rep sends standard brochure via T27 separately. Logged as buyer-feedback signal |
| Expiry reached (default 90 days from send, rep-configurable per pack, with the lifecycle-tied rule above for closed-state Opportunities) | Microsite state Published → Expired. Link returns "this pack has expired" view with contact-rep CTA. PDFs already downloaded remain with the buyer |

---

## Approval gates summary

| Moment | Approval mechanism | Agent autonomy |
|--------|--------------------|----------------|
| In-meeting render generation | Implicit on "keep" tap | Pattern 1 for vision verification, fail-fast on first failure |
| In-meeting layout annotation | Implicit on commit by rep | Pattern 1 for modifiable-zone validation |
| Post-meeting structured preference extraction | Rep reviews and confirms agent's parse | Pattern 2 for extraction |
| Pack composition draft contents | Rep reviews and edits | Pattern 2 for drafts (summary, intro) |
| Pack send | Explicit rep action (tap or voice command) | Pattern 1 for mechanics, never for send |
| Post-send regeneration | Rep-initiated, auto-update | Pattern 1 for sync |
| Adding a unit to a sent pack | Confirm the addition, no full re-approval | Pattern 1 for sync |
| Vision verification failure (in-meeting) | Rep decides retry or adjust on first failure | Pattern 3 (surface, no decision) |
| Vision verification failure (post-meeting) | Three silent retries then internal escalation per existing pattern | Pattern 1 (gated to three attempts) |
| Agent-proposed pack (Trigger 3) | Rep reviews proposal, edits, sends or discards | Pattern 2; agent never auto-sends |

---

## Speed and caching architecture

### In-meeting: live generation, no speculative pre-warm

Cost discipline over instant gratification. Rep fills the wait conversationally. Tablet UI absorbs the wait with structured talking points (StyleSet imagery, FinishPackage samples, layer 1 plan, similar approved renders, agent suggestions). Rep can queue multiple renders, cancel any.

### Reactive caching at three levels

1. **Opportunity-level cache.** Once generated for this buyer, the (Unit, FinishPackage, layout, StyleSet, free-text) combination is cached on the Opportunity. Subsequent rep requests for the same combination return instantly.

2. **Workspace-level cache.** A render generated for buyer A on (Unit, FinishPackage, layout, StyleSet) without free-text modifier is cached at the workspace level. Buyer B asking for the same combination, generated by a different rep, gets a cache hit. Free-text-modified renders are not workspace-cached (too specific).

3. **Project-level launch package library.** Renders generated at launch (Phase 2c variant renders per FinishPackage) are always available without generation cost. The pack composition layer prefers library assets when the buyer's selection matches an approved launch-package variant.

### Cache invalidation

- ConstraintModel layer 1 change: invalidates all renders for affected Units. SyncEvent flags Stale.
- ConstraintModel layer 2 FinishPackage change: invalidates affected variant renders. SyncEvent flags Stale.
- BrandKit art_direction change: invalidates all renders project-wide. SyncEvent flags Stale.
- Workspace StyleSet retirement: renders generated against that StyleSet flagged Stale, not auto-regenerated.

---

## CRM logging architecture

### In-meeting events

Session-grouped: a "Viewing Session" Activity rolls up all in-meeting events with structured sub-event drill-down. Sub-events include each render generation, layout annotation, FinishPackage selection, StyleSet selection. Visible as a single timeline entry with expandable detail.

### Composition events

Per-event: pack composition started, units added or removed, summary edited, intro edited, currency/language/payment changed, social proof toggle, pricing toggle. Each is an Activity on the Contact.

### Send events

Per-event: pack sent. Activity on Contact and each linked Opportunity. Asset entry for the Microsite. Document entry for the PDF. Notification to buyer.

### Engagement events (post-send)

- Discrete events (PDF download, contact-rep CTA, comment posted, Unit favourited): Activity on Contact.
- Aggregate signals (view counts, time spent per section, scroll depth): metrics on the Microsite, not Activities.
- Alert thresholds: agent-configurable per workspace. Examples: pack viewed 5+ times in a week → rep alert. Pack viewed once then ignored 7+ days → rep alert. PDF downloaded then no further engagement 14 days → rep alert.

### Surfaces this feeds

- Opportunity activity timeline (per-Opportunity narrative)
- Contact activity timeline (cross-Opportunity buyer view)
- Rep dashboard (active packs, hot packs, alert-worthy packs)
- Manager dashboard (pack-level conversion metrics, time-to-engagement, send-to-viewing-to-reservation rates)

---

## Orchestrate vs own

| Capability | Owned by Bricly | Orchestrated |
|------------|-----------------|--------------|
| Preference reasoning (explicit, inferred, default separation) | Owned | — |
| Prompt composition from structured fields | Owned | — |
| ConstraintModel layer 1 enforcement and modifiable-zone validation | Owned (CAD-to-JSON, vision API) | Hybrid |
| Vision verification on every render | Owned (verification logic), orchestrated (vision model) | Hybrid |
| Render generation | — | Orchestrated (Midjourney or successor) |
| Layout annotation tool on tablet | Owned (UI), orchestrated (rendering of annotated plan) | Hybrid |
| StyleSet library (Bricly-defined and workspace-defined) | Owned | — |
| FinishPackage and ConstraintModel layer 2 management | Owned | — |
| Brand-aware context bounding | Owned (BrandKit.art_direction layer) | — |
| Pack composition (multi-Opportunity, multi-Unit, content assembly) | Owned | — |
| Meeting summary and intro paragraph drafting | Owned (LLM-orchestrated under rep voice profile) | Hybrid |
| PDF generation from Microsite content | Owned | — |
| Microsite provisioning and password gating | Owned (T28 stack) | — |
| Reactive caching at three levels | Owned | — |
| Delivery via WhatsApp, email, SMS | — | Orchestrated (messaging providers) |
| Engagement metric aggregation and alert thresholding | Owned | — |
| Voice/chat composition agent | Owned (LLM-orchestrated, rep voice context) | Hybrid |

The proprietary middleware (preference reasoning, prompt composition, constraint enforcement, brand bounding, modifiable-zone validation, pack composition, reactive caching, agent autonomy boundary management) is Bricly's. The generative and delivery tools at the edges are not.

---

## Agent role summary

**Pattern 1 (autonomous).**
- Vision verification on every generated render
- Reactive caching at all three levels
- Pack composition mechanics (PDF sync, link generation, password generation, Microsite state management)
- Engagement metric aggregation
- Sync chain firing on pack updates
- Stage 1 pre-meeting brief composition
- In-meeting transcript parsing and structured preference extraction (Stage 3)
- Cache invalidation on upstream changes (ConstraintModel, BrandKit, StyleSet)

**Pattern 2 (proposes, rep decides).**
- In-meeting render suggestions based on conversation parsing
- Trigger 3 pack proposals from inferred engagement signals
- Meeting summary draft
- Intro paragraph draft in rep's voice
- Render inclusion/exclusion proposals during composition
- Update proposals post-send ("buyer messaged about X, want to regenerate?")
- Profile shift flagging ("investor → owner-occupier, review pack?")

**Pattern 3 (surfaces, never decides).**
- Vision verification failures in-meeting (rep decides retry or adjust)
- Send-time anomalies ("11pm in buyer's timezone, want to schedule?")
- Inconsistency surfacing during composition ("payment plan and meeting framing don't match")
- Engagement signal threshold alerts to rep
- Profile-divergent pack content flags after rep reassignment
- Rejected layout request reporting to developer (aggregated)
- Workspace-level buyer-feedback signals ("multiple buyers asking for standard, review approach")

**Strictly forbidden.**
- Buyer-triggered generation of any kind
- Autonomous send of any pack to a buyer
- Autonomous modification of a sent pack
- Autopilot regeneration after a sent pack (rep must initiate)
- Auto-override of ConstraintModel layer 1
- Override of vision verification (only T24b `override_verification_failure` by rep/developer is allowed)
- Composition of packs that include buyer identification of other buyers
- Auto-creation of Opportunities for "similar units" suggestions
- Auto-linking of "similar units" to the Contact (suggestions are visual references in the pack only, not tracked engagements)

---

## Edge case catalogue

| # | Edge case | Handling |
|---|-----------|----------|
| 1 | Buyer requests something the ConstraintModel rejects | Modifiable-zone validation blocks at the tablet. Agent logs as structured "rejected request" event on Opportunity. Aggregated into a periodic report for developer. |
| 2 | Buyer engagement data is sparse, weak signal | Composition shows "low confidence" indicator. Defaults populated from Persona and Project defaults. Agent recommends qualification call before proposal-style packs (Trigger 3 suppressed below confidence threshold). |
| 3 | Buyer profile changes mid-flow | Rep updates preference fields on Opportunity. Agent flags shift, proposes pack regeneration. Pack versioned. Buyer sees current version on next visit. |
| 4 | Same buyer, two units, different customisation per unit | Two Opportunities under one Contact, each with its own preferences. Cross-Opportunity composition surfaces both, rep curates per Unit. Meeting summary handles both narratives (eg "PH9 as home, Apt 4B as investment"). |
| 5 | Buyer rejects personalised material, asks for standard | Personalised pack stays at current state. Rep sends standard brochure via T27 separately. Logged as buyer-feedback signal. Aggregated across rep and workspace for trend analysis. |
| 6 | Pack lifecycle on Opportunity closure | Closed_Won (any linked Opportunity): pack is removed from live view (buyer's link returns "pack closed, contact your consultant for next steps") but the pack record stays linked to the Contact and to each Opportunity for historical reference. Won Unit's onward journey is handled through PurchaserPortalAccess separately. Closed_Lost (all linked Opportunities): pack viewable until 90 days from state change, then expires |
| 7 | Buyer brings someone who shouldn't see pricing | Rep manually composes a second pack with pricing hidden. Two packs under one Contact. Not a built-in feature, manual rep handling. |
| 8 | Rep leaves, deal reassigned | Contact info auto-updates to new rep. Agent flags attributable content (summary, intro) for new rep review before next send. |
| 9 | Project paused | Workspace-level pause. All packs in project show "your consultant will be in touch shortly". Reps notified. Resumes on project resume. |
| 10 | Multi-rep cross-Opportunity composition | Composing rep is the lead. All linked-Opportunity rep owners see engagement signals. Any owning rep can compose their own version if they want. Manager override available. |
| 11 | Vision verification failure in-meeting | Fail-fast on first failure. Rep prompted to retry or adjust inputs. No silent three-attempt loop during live meetings. |
| 12 | Vision verification failure post-meeting | Three silent retries, then internal escalation. Pack composition holds the affected render in a "refining" state until resolved. Rest of pack proceeds. |
| 13 | Buyer's partner enters wrong password N times | Logged on Contact. Alert to rep after threshold. Rep can reset password and resend. |
| 14 | Buyer forwards link to unauthorised third party | Mitigated by password requirement. New-device-fingerprint share detection logged. Aggregate share signals surfaced to rep but no automatic action taken. |
| 15 | Workspace StyleSet retired mid-flow | Renders generated against retired StyleSet flagged Stale. Pack continues to display them but rep is prompted to regenerate with a current StyleSet. |
| 16 | FinishPackage retired mid-flow | Variant renders flagged Stale. Pack continues to display. Rep prompted to regenerate or remove the affected Unit's renders from the pack. |
| 17 | Buyer enters password correctly but link has expired | Buyer sees "this pack has expired, contact your consultant" with CTA. Rep notified. Rep can extend expiry or compose a new pack. |
| 18 | Buyer downloads PDF after pack content changes | The downloaded PDF reflects the version at download time. Link always shows current. No retroactive PDF push. |
| 19 | Pack composition spans Opportunities owned by different reps | The composing rep curates their own Opportunity's contribution. Cross-owning reps see the pack and can object via manager workflow if needed. Manager override available. |
| 20 | Buyer flags an error or asks a question on a specific render via the contact CTA | CTA pre-fills the message with the Unit and render context. Rep responds, regenerates if needed, pack versions. Activity logged with full thread context. |

---

## Data model and capability surface gaps

Items surfaced in this session that need to be applied to the data model and capability surface documents:

### Data model additions and extensions

1. **ConstraintModel layer 1 modifiable_zones attribute.** New structured attribute on ConstraintModel layer 1: array of polygon zones where non-structural partition modifications are permitted. Set by architect at CAD upload (with Bricly vision-API proposing candidates for review). Each zone references the layer 1 wall/floor context, includes max wall additions allowed, constraints on partition type (structural impossible, services routing limitations).

2. **Unit.finish_package_mode attribute.** New per-Unit attribute referencing layer 2: "fully_finished_single" | "pick_a_package" | "split_hard_soft" | "fully_customisable". Determines the FinishPackage selector UX on the Opportunity composition and pack.

3. **FinishPackage.split_components attribute extension.** When mode is "split_hard_soft", the FinishPackage entity gets hard_components (flooring, walls, doors, joinery) and soft_components (tiles in bathrooms/kitchens, finishes) as separately-selectable bundles.

4. **MaterialLibrary entity (for "fully_customisable" mode).** Workspace-level material library referenced by Unit.finish_package_mode = "fully_customisable". Materials, finishes, suppliers, reference imagery. Buyer composes a custom FinishPackage by picking materials. Stored on Opportunity layer 3.

5. **StyleSet entity.** Workspace-level entity defining curated mood boards: name, reference imagery, mood keywords, material/colour cues, lighting and atmosphere notes. Bricly ships a default library (Scandinavian, modern, industrial, classical, coastal, Mediterranean, Japandi, etc.). Developers can add workspace-custom StyleSets via workspace admin permission only (no Bricly review required). Referenced by Opportunity (layer 3) and Asset (renders generated against a StyleSet).

6. **Opportunity layer 3 preference fields.** Extension of Opportunity to carry: chosen_style_set (StyleSet ref), free_text_style_modifier, reference_imagery (array of file refs), chosen_finish_package per Unit (FinishPackage ref or custom MaterialLibrary picks), chosen_layout_variant per Unit (layer 2 variant ref or layer 3 free-draw annotation), payment_plan_version_selected, pricing_visibility (visible | on_request).

7. **FloorPlanAnnotation Asset sub-type.** New Asset sub-type representing buyer-driven layout annotations on a Unit floor plan. Attributes: Unit ref, Opportunity ref, annotation_data (polygon set within modifiable zones), generated_floor_plan_image (the annotated PNG/PDF), validation_status (validated against layer 1 modifiable zones).

8. **Microsite type=personalised_buyer_pack first-class detail.** Existing Microsite type, but flesh out the entity to support: Contact anchor, multi-Opportunity reference array, per-Unit content selection map, meeting_summary (current version), intro_paragraph (current version), pricing_visibility, currency_override, language_override, payment_plan_selected, similar_units_array (with explicit "do not auto-suggest"), social_proof_config (signals enabled, thresholds), password_hash, version_history, current_version_ref.

9. **PackVersion entity (or Microsite versioning extension).** Each rep-initiated update to a personalised_buyer_pack creates a new version. Buyer link always serves current. CRM retains full history. Attributes: version_number, parent_microsite_ref, content_snapshot, created_by, created_at, what_changed_summary.

10. **SocialProofConfig (workspace-level).** Workspace-level configuration of which signals are enabled, thresholds per signal, time-window settings. Defaults: off. Approved signals: unit_shortlist_count, unit_hold_count, level_reserved_pct, building_reserved_pct, project_sold_pct, configurable time window (last_7_days, last_30_days, cumulative).

11. **RejectedRequest entity (or Activity sub-type).** Logged when buyer's request is blocked by ConstraintModel (eg layout outside modifiable zone). Attributes: Opportunity ref, Unit ref, requested_change (structured), block_reason (which constraint), timestamp. Aggregated into developer-facing periodic reports.

12. **BuyerFeedbackSignal Activity sub-type.** Logged when buyer rejects personalised material, requests standard, or pushes back on the pack. Attributes: Contact ref, signal_type (rejected_personalised, requested_standard, asked_for_partner_version, etc.), context. Aggregated for rep-level and workspace-level trend analysis.

13. **CommentOnPack Activity sub-type.** Buyers can leave comments on specific Units or renders inside the pack. Attributes: Contact ref, Microsite ref, Unit ref (if comment is unit-specific), Asset ref (if comment is render-specific), comment_text, sentiment (agent-classified), agent_flag (set if comment is inappropriate or harassing, for rep attention). No buyer-side moderation gate; rep sees all comments and handles edge cases. **FavouriteUnit Activity sub-type.** Buyers can favourite Units. Attributes: Contact ref, Microsite ref, Unit ref, favourited_at.

14. **EngagementMetrics on Microsite.** Aggregate metrics (separate from Activity stream): total_views, unique_devices, time_spent_per_section, scroll_depth_per_section, pdf_download_count, share_detection_events, contact_cta_taps. Updated daily for snapshot purposes; real-time for alert thresholds.

15. **AlertThresholdConfig (workspace-level).** Workspace-level configuration of engagement alert thresholds. Defaults: 5+ views in 7 days → alert. Viewed once then 7+ day silence → alert. PDF downloaded then 14+ day silence → alert. Configurable per workspace.

16. **RepVoiceProfile extension on User entity.** New attribute on User (sales rep) for capturing their writing voice and tone, used by agent for intro paragraph and follow-up message drafting. Captured during onboarding and refined over time via the rep's confirmed/edited agent drafts.

### Capability (Tool, Resource, Prompt) additions

17. **(Gap) T22 enhancement: generate_personalised_render with full structured input.** Extend T22 to accept the full prompt structure (Unit, FinishPackage, layout variant or annotation, StyleSet, free-text modifier, reference imagery, shot type). Returns generated Asset, cache_hit boolean.

18. **(Gap) `annotate_floor_plan_layout`.** New Tool for buyer-driven layout annotation on the tablet. Accepts Opportunity ref, Unit ref, annotation polygon set. Validates against ConstraintModel layer 1 modifiable_zones. Returns FloorPlanAnnotation Asset.

19. **(Gap) `select_style_set`.** New Tool. Sets Opportunity.chosen_style_set. Workspace context determines available StyleSets.

20. **(Gap) `add_reference_imagery`.** New Tool. Uploads reference imagery to Opportunity for prompt conditioning. Returns file refs.

21. **(Gap) `set_free_text_modifier`.** New Tool. Sets Opportunity.free_text_style_modifier.

22. **T59 enhancement: generate_personalised_buyer_pack full structured spec.** Extend T59 to accept: Contact ref, included_opportunities (array), per-Unit content selection map, meeting_summary_override, intro_paragraph_override, currency_override, language_override, payment_plan_version, pricing_visibility, similar_units (array of Unit refs, must have or create Opportunities), social_proof_config_override (per-pack toggle), password_override (rep can specify instead of auto-generated). Returns Microsite (Draft) with full preview data.

23. **(Gap) `publish_personalised_buyer_pack`.** New Tool. Specialised version of T30 for personalised packs. Generates password (auto, 6-8 char alphanumeric). Sets expiry (default 90 days, rep can override). Generates PDF. Fires Notification to buyer via preferred channel. Sets Microsite state Draft → Published.

24. **(Gap) `update_personalised_buyer_pack`.** New Tool. Updates a sent pack. Triggers PDF regeneration, version increment, buyer notification ("your consultant has updated your pack").

25. **(Gap) `extend_pack_expiry` / `early_expire_pack` / `pause_pack`.** Pack lifecycle Tools.

26. **(Gap) `reset_pack_password`.** Rep-invoked password reset. Buyer notified with new password.

27. **(Gap) Resource: `pack_engagement_metrics`.** Per-Microsite aggregated metrics for rep and manager dashboards.

28. **(Gap) Resource: `workspace_pack_performance`.** Cross-pack performance: send-to-engagement, send-to-viewing, send-to-reservation conversion rates. Manager dashboard.

29. **(Gap) Resource: `rejected_request_report`.** Aggregated rejected layout/finish requests by project and unit. Developer-facing periodic report.

30. **(Gap) Resource: `buyer_feedback_signals`.** Aggregated buyer-feedback signals by rep and workspace. Manager dashboard.

31. **(Gap) Prompt: `compose_pack_voice_command`.** Voice/chat composition agent entry point. "Send James Richards a pack for PH9 and Apt 4B with the Japandi renders, standard payment plan, discovery meeting summary." Returns Draft Microsite preview for rep approval.

32. **(Gap) Prompt: `regenerate_pack_for_preference_shift`.** Agent-initiated regeneration prompt when Opportunity preference fields change post-send.

33. **(Gap) Prompt: `propose_pack_from_inferred_signals`.** Trigger 3 entry point. Agent composes a pack proposal from inferred engagement signals, surfaces to rep.

34. **(Gap) Prompt: `pre_meeting_brief_composer`.** Agent assembles the rep's meeting brief from Contact + Opportunities + inferred preferences + microsite engagement. Stage 1 of this flow.

### Microsite type=personalised_buyer_pack: content section inventory

Sections rendered on the buyer-facing link and the synced PDF:

- Header (buyer name, personalised intro, "Prepared for {buyer_name}")
- Intro paragraph (rep's voice, agent-drafted, rep-approved)
- Meeting summary (condensed recap of what was discussed)
- Per-Unit sections (one per included Unit, in rep-curated order):
  - Unit identification (project, building, level, type, beds, baths, sqm)
  - Chosen FinishPackage description
  - Chosen StyleSet description and reference imagery
  - Renders generated for this Unit (rep-curated set, in rep-curated order)
  - Floor plan with buyer's annotations (if any)
  - Constraint disclaimer (always visible on renders and floor plans)
  - Pricing presentation (actual or on-request, per pack)
  - Payment plan summary
  - Social proof signals (if enabled and thresholds met)
  - Construction timeline (from Project.target_completion_date)
- "You might also consider" (optional, rep-curated)
- Contact your consultant section (rep name, contact CTA, opens WhatsApp/email)
- Footer (developer brand, project links, legal disclaimers, language and currency note)

---

## Studio-CRM integration touchpoints

This flow is the canonical example of Studio capabilities surfaced through CRM context.

| Moment | CRM context | Studio capability | Surface |
|--------|-------------|-------------------|---------|
| Pre-meeting brief | Opportunity view, P6 | Render library access, FinishPackage selector preview | In Opportunity panel |
| In-meeting render generation | Opportunity view, Unit view, P7 | T22 with full structured input | Tablet, in Opportunity context |
| In-meeting layout annotation | Unit view, P7 | Annotate_floor_plan_layout | Tablet, in Opportunity context |
| Post-meeting preference extraction | Opportunity view, A1 agent | Structured preference Tools (T57, T58, select_style_set, etc.) | Agent-driven, surfaced in Opportunity |
| Pack composition initiation | Opportunity view, P8 | T59, T28 | Composition panel in Opportunity view |
| Render regeneration during composition | Composition panel | T22, T24 | In composition panel |
| Voice/chat pack composition | Anywhere in CRM | Compose_pack_voice_command | Chat or voice |
| Pack send | Composition panel | Publish_personalised_buyer_pack, T27 | In composition panel |
| Pack update post-send | Opportunity view or Contact view | Update_personalised_buyer_pack | Pack details panel |
| Engagement signal surfacing | Opportunity view, Contact view, dashboards | Pack_engagement_metrics | Activity timeline and dedicated metric panel |
| Trigger 3 proposal review | Notification or in-CRM inbox | Propose_pack_from_inferred_signals output | Proposal review panel |

The pattern is consistent: rep stays in CRM, Studio capabilities are first-class Tools invoked from the relevant entity context. The MCP server handles cross-module invocation. Studio outputs (Assets, Microsites, Documents) are first-class objects in CRM views.

---

## Cross-flow dependencies

### Inputs from upstream flows

- **Launch Package flow.** ConstraintModel (all layers including new modifiable zones), BrandKit (art_direction, palette, typography, personas, tone), FinishPackages, baseline render library, Phase 2c variant renders, branded floor plan template, ContentBackbone, Microsite type=project_public_site (for buyer's prior browsing engagement).
- **Sales Process flow.** Opportunity entity, Stage transitions, meeting capture mechanics (A1 agent for parsing), shortlist management, in-meeting personalisation primitives (already partially defined, extended in this flow).
- **Lead Capture and Routing flow.** Contact entity, qualification preferences, source channel inference, buyer-side AI agent capture context.
- **Developer Onboarding flow.** Workspace setup, StyleSet workspace customisation, FinishPackage definitions, MaterialLibrary setup if applicable, RepVoiceProfile initial capture.
- **Go-to-Market flow.** Project launch state, sell-through metrics (feed into social proof signals), public microsite engagement (feed into inferred preferences).

### Outputs to downstream flows

- **Sales Process flow (continuation).** Personalised pack engagement signals feed Opportunity Stage progression (Viewing Held → Negotiating triggered by buyer engagement patterns). Pack content informs Negotiation stage.
- **Post-Sale flow (PurchaserPortalAccess).** On Closed_Won, the pack transitions toward the buyer portal. Won Unit details, finish selections, and pricing flow into the post-sale portal scope.
- **Cross-Project Reporting.** Pack performance metrics feed manager and developer dashboards. Rejected request reports feed developer's future-project planning. Buyer feedback signals feed workspace-level pattern analysis.

---

## Finalisation decisions

The following items were confirmed at finalisation and are reflected throughout this document:

1. **Comments and favourites on the pack are in.** Buyers can leave comments on specific Units or renders, and favourite Units. Each is logged as a discrete Activity on the Contact (CommentOnPack Activity sub-type, with sentiment classification by agent). No moderation gate; agent flags inappropriate comments to the rep, rep handles. Comments and favourites are buyer-side engagement signals only, not generation triggers.

2. **Trigger 3 default behaviour: hybrid.** Agent pushes proactively when engagement signal is high (hot lead, deep engagement, multiple sessions). Agent pulls (surfaces on next CRM session) when signal is moderate. Agent decides based on signal strength, thresholds configurable per workspace.

3. **"You might also consider" creates nothing.** Units added to this section by the rep are visual references only. No Opportunity is created. No link is made on the Contact. The buyer engages through the contact CTA if interested, at which point the rep formally opens an Opportunity through the normal Sales Process flow.

4. **PurchaserPortalAccess transition on Closed_Won: removal from live view, record retained.** Pack is removed from live view (buyer's link returns "pack closed, contact your consultant for next steps"). The pack record stays linked to the Contact and to each linked Opportunity for historical and audit reference. PurchaserPortalAccess is a separate downstream flow, not a transition the pack makes.

5. **Share detection: loose signal only.** New-device-fingerprint share detection is logged on the Microsite as an engagement signal. No strict access control. No device binding. Buyer can share the link and password freely with partner, family, accountant. Share-detection signals aggregate on the rep's pack-engagement panel but trigger no automatic restriction.

6. **Workspace-custom StyleSets: admin only, no Bricly review.** Workspace admin can add StyleSets directly. They become usable in pack generation immediately. Bricly does not gate or review.

7. **Pack delivery channel: rep picks at send time.** Contact's preferred_channel attribute surfaces as the default suggestion. Rep selects the channel each send. No fallback hierarchy.

8. **In-meeting tablet consent: covered by existing meeting recording consent.** No separate consent prompt for the tablet experience. The Sales Process flow's meeting recording consent default ("ask for consent before recording, with standard disclosure prompt") covers visual and generative interactions on the tablet.
