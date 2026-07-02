# Bricly Sale and Inventory Update Flow

The propagation flow that fires every time a Unit's commercial state changes. The integration spine that proves the CRM-Studio promise: any update to status, price, or terms reflects everywhere the developer's project is visible, in the order and timing it should, with the right approvals and audit trail.

---

## Scope

**Start state.** A Unit exists in a Project and has a defined commercial state (Available, Pending_Hold, Held, Reserved, Sold, Off_Market, Snagging, Handed_Over). Studio assets exist that reference the Unit and Project. The project is live to one or more external surfaces (microsite, paid media, partner widgets, agent shares, personalised buyer packs). The CRM has live Opportunities under the Project.

**End state.** The change has propagated to every surface that should reflect it, at the timing that surface requires, with stakeholders notified, approvals captured, and a full audit trail. Surfaces that need regeneration have been regenerated. Imported assets needing manual update have been flagged. Active campaigns and listings have been updated or paused per workspace rules. Personalised packs in flight have been resolved per their lifecycle rules.

**Out of scope.** Initial unit creation (handled in Onboarding). Project state transitions (handled in Go-to-Market). Buyer pack composition (handled in Buyer Customisation). Snagging-item state changes (handled in Sales Process post-sale layer). Construction milestone updates (handled in Sales Process Stage 12 and the buyer portal).

---

## Definition

**The sale and inventory update flow = the propagation engine that turns a single state change on a Unit into the coordinated, ordered, audited refresh of every surface, asset, contact, and report that should reflect it.**

It is not a single tool. It is the SyncEvent orchestration that fires under any of these triggers:

1. Unit state transition (Available → Pending_Hold → Held → Reserved → Sold and the reverse paths).
2. Unit price change (asking_price or floor_price).
3. Unit payment plan or terms change.
4. Unit attribute change that affects public display (label override, status visibility configuration).
5. Bulk operation on a set of Units (manager-initiated repricing, batch off-market, batch release).
6. Reversal of any of the above (POS collapse, hold release, manual override).

Every trigger creates a SyncEvent. Every SyncEvent runs through the same propagation engine with surface-specific rules. Every surface logs delivery state back to the SyncEvent.

---

## Foundational principles

1. **One SyncEvent per state change.** Bulk operations create one parent SyncEvent with child SyncEvents per Unit, so audit and rollback work at both the batch and individual level.
2. **The CRM is the source of truth.** All propagation is one-way out of the CRM. Studio assets, microsites, partner feeds, and listings consume; they never originate state.
3. **Surface-specific timing.** Some surfaces are real-time (microsite, dashboards, MCP server, partner widgets). Some are near-real-time (availability list PDF, brochure availability page, agent share embeds). Some are batch with approval (paid media, listings, social proof recalcs). Surface timing is a property of the surface, not of the SyncEvent.
4. **No autonomous public action that costs money or makes a public statement.** Status flowing through to a public microsite is data refresh, not a public statement, and runs autonomously. Pausing or modifying a paid campaign costs money and runs through Pattern 2 (propose, developer approves), even when the trigger is unambiguous (unit sold, ad still running). This holds even when the action is "obviously correct."
5. **Imported assets cannot be auto-regenerated.** They are flagged Stale and notified to the developer. Bricly never overwrites developer-provided files.
6. **In-flight personalised packs update silently on state change; reps are only alerted at hard commercial gates.** When a Unit referenced in a live personalised buyer pack changes state, the pack's Unit status indicator updates automatically and the Unit is marked accordingly (eg "Reserved", "Sold"). The rep is only notified to take action at hard commercial gates: when POS + deposit are signed and uploaded to CRM (Reserved with full documentation), or when a deal falls through post-POS (Reserved → Available reversal). At those moments the rep decides which of the linked Contacts on the pack to notify (all, some, or none), so cold or unengaged buyers don't get bugged.
7. **Audit trail is non-negotiable.** Every SyncEvent, every triggered Notification, every regenerated Asset, every paused campaign, every approval, every override is logged as an AuditEvent.
8. **Idempotency on retries.** If a SyncEvent fails partway and retries, no double-fires of Notifications, no duplicate regenerations, no double-paused campaigns.

---

# Part 1: Status change types

This flow covers the full taxonomy of changes that can fire a SyncEvent on a Unit. Each type is detailed in subsequent sections.

### 1.1 Forward state transitions

| Transition | Trigger | Approval | Reversibility |
|------------|---------|----------|---------------|
| Available → Pending_Hold | Rep files hold request (T6 `place_unit_hold`) | None at this step (request itself is the soft lock) | Auto-reverse on decline / expiry |
| Pending_Hold → Held | Manager approves top-of-queue hold | Manager approval | Reversible via hold release or expiry |
| Held → Reserved | Manager approves POS with required attachments | Manager approval | Reversible via `collapse_pos` |
| Reserved → Sold | Manager approves final deed + full payment | Manager approval | Effectively terminal; reversal via legal process only, treated as Edge Case |
| Sold → Snagging | Handover walk-through reveals defects | Ops triggered | Resolution to Handed_Over |
| Sold → Handed_Over | Handover complete, no active defects | Ops triggered | Terminal |
| Snagging → Handed_Over | All SnaggingItems resolved | Auto on last resolution | Reopens if new defects raised |
| Available ↔ Off_Market | Manager withdrawal or re-release | Manager approval | Bi-directional |

### 1.2 Reverse state transitions

| Transition | Trigger | Approval | Cascade |
|------------|---------|----------|---------|
| Pending_Hold → Available | All hold requests declined / expired | None | Notify waitlisted reps |
| Held → Available | Hold expires without conversion, or hold released | None (expiry) / Manager (manual release) | Notify waitlisted reps |
| Reserved → Available | POS collapse via `collapse_pos` | Manager approval | Notify waitlisted reps + commission reversal |
| Sold → Reserved | Rare edge case (legal reversal of completed deed) | Manager + Admin approval | Heavy cascade, see Edge Cases |

### 1.3 Attribute changes (no state transition)

| Change | Trigger | Approval | Public-visible? |
|--------|---------|----------|------------------|
| asking_price change | Manager edit on Unit | Manager (with audit) | Yes |
| floor_price change | Manager edit on Unit | Manager (with audit) | No (internal) |
| Payment plan / terms change | Manager edit on Unit | Manager (with audit) | Yes |
| public_label_overrides change | Manager edit on Unit or workspace setting | Manager | Yes |
| Status visibility config change (eg show buyer name on sold units yes/no) | Workspace setting change | Admin | Yes |

### 1.4 Bulk and batch operations

| Operation | Trigger | Approval | Mechanics |
|-----------|---------|----------|-----------|
| Bulk reprice (eg all penthouses +5%) | Manager batch action | Manager + workspace-config threshold (eg >10% triggers Admin) | One parent SyncEvent, child SyncEvent per Unit, atomic batch with rollback option |
| Batch off-market (eg phase 2 building paused) | Manager batch action | Manager | As above |
| Batch release (eg phase 2 building goes live) | Manager batch action | Manager | As above |
| Bulk payment plan update | Manager batch action | Manager | As above |
| Bulk public_label_override (eg "Promise of Sale Signed" replaces "Reserved" project-wide) | Manager workspace setting | Manager | Workspace-level, propagates to all Units |

### 1.5 Manual override

Manager can force a state transition outside the standard approval flow (eg correcting a misclick that marked a Unit Sold instead of Held). Always audit-logged with reason. Fires a SyncEvent like any other change. The override itself is the audit.

---

# Part 2: The propagation flow (step-by-step)

The flow assumes the triggering tool (T6, `convert_hold_to_reservation`, T9 `mark_unit_sold`, `collapse_pos`, etc.) has already completed and the SyncEvent has been created.

## Stage 1. SyncEvent created

| Field | Description |
|-------|-------------|
| Trigger | Any state, price, or terms change on a Unit, or a bulk operation across Units |
| Actor | Whichever tool fired the underlying change (T6, T9, `collapse_pos`, repricing tool, bulk operation tool, or manual override) |
| Capability | T_SYNC1 `create_sync_event` (internal, called by upstream tools) |
| Entity affected | New SyncEvent created with state Pending. Trigger source recorded. Triggering entity reference recorded. Affected entities list computed (see Stage 2). Propagation plan composed (see Stage 3). |
| Output | SyncEvent in Pending state, ready for execution. AuditEvent logged. |
| Decision points | Bulk operations: parent SyncEvent + child SyncEvents pattern, with rollback group identifier. |
| Agent role | Pattern 1: autonomous creation. |

## Stage 2. Affected entity resolution

| Field | Description |
|-------|-------------|
| Trigger | SyncEvent in Pending state |
| Actor | System |
| Capability | T_SYNC2 `resolve_affected_entities` |
| Entity affected | SyncEvent.affected_entities populated. Includes: Assets referencing the Unit, Microsites publishing the Unit, Campaigns running creative for the Unit or its segment, personalised buyer packs (Microsite type=personalised_buyer_pack) referencing the Unit, Opportunities bound to or shortlisting the Unit, dashboards, MCP Resources, Partner widgets, and listing feeds. |
| Output | Full propagation graph for this state change. |
| Decision points | Asset.source distinguishes Generated vs Imported. Generated assets are eligible for autonomous regeneration. Imported assets are flagged for manual update. Campaigns running creative tied to the affected Unit segment are flagged for review. |
| Agent role | Pattern 1: autonomous. |

## Stage 3. Propagation plan composition

| Field | Description |
|-------|-------------|
| Trigger | Affected entities resolved |
| Actor | System |
| Capability | T_SYNC3 `compose_propagation_plan` |
| Entity affected | SyncEvent.propagation_plan populated with ordered list of operations. Operations grouped by timing tier (real-time, near-real-time, batch-with-approval). Dependencies recorded (eg microsite update must complete before partner widget refresh that reads from microsite). |
| Output | Executable plan ready to run. |
| Decision points | Plan composition consults workspace propagation policy: what auto-propagates, what gates on approval, what notifications fire to whom. |
| Agent role | Pattern 1: autonomous. |

## Stage 4. Real-time tier execution (T+0 to T+30 seconds)

Surfaces in this tier reflect the change immediately. No approval gate, no batching.

| Field | Description |
|-------|-------------|
| Surfaces | CRM project view (unit grid, pipeline view, dashboard). CRM Opportunity views (shortlisted Unit status, bound Unit status). MCP server Resources (R5 `project_units`, R8 `unit`, R12 `unit_collateral` status fields, R23 `campaign` aggregates, all live agent and MCP client queries). Project public Microsite (state, availability list section, unit detail page status tag, FinishPackage availability). Personalised buyer pack Microsites (status indicators on referenced Units). Investor dashboard (sell-out percentage, unit count by state, revenue closed). |
| Capability | T_SYNC4 `propagate_realtime` |
| Mechanics | Cache invalidation on the affected Unit and its parents (Project, Building). Live queries pick up the new state on next read. WebSocket push to active CRM sessions for instant UI refresh. Microsite cached pages purged for the affected Unit detail page and the project availability list. |
| Timing | Sub-30 seconds end-to-end. SyncEvent records per-surface completion timestamps. |
| Failures | Per-surface retry with exponential backoff (3 attempts, then SyncEvent.execution_state Partial_Failure on that surface, alert fires to Ops). |
| Agent role | Pattern 1: autonomous. |

## Stage 5. Near-real-time tier execution (T+30 seconds to T+5 minutes)

Surfaces in this tier are regenerated from current data but require some asset rebuilding.

| Field | Description |
|-------|-------------|
| Surfaces | Availability list PDF (downloadable from microsite footer). Brochure availability page (the dynamic page in the digital brochure that reads live state). Agent share Microsites (type=agent_share). Unit one-pager PDFs that include status (the PDF cached version, not the live render). |
| Capability | T_SYNC5 `regenerate_dynamic_assets` |
| Mechanics | Background regeneration job triggered. New version of each affected asset is generated, vision verification skipped (these are data-overlay regenerations, not generative renders). Old version moves to Superseded state, new version replaces references. SyncEvent.propagation_plan tracks per-asset state. |
| Timing | 30 seconds to 5 minutes depending on asset complexity and queue depth. |
| Failures | Per-asset retry. After 3 failed attempts the Asset state moves to Regeneration_Failed and a notification fires to Marketing Lead with the failing asset and reason. |
| Agent role | Pattern 1: autonomous. |

## Stage 6. Generative regeneration tier execution (T+5 minutes to T+24 hours)

Surfaces that require new generative output. Includes vision verification.

| Field | Description |
|-------|-------------|
| Surfaces | Unit-specific marketing renders that show the unit as "available now" (rare, only relevant if the workspace generates per-unit availability creative). Phase_3_unit_creative campaign assets where the Unit is the subject of running creative. Social posts queued in the launch grid that reference the Unit's state. |
| Capability | T_SYNC6 `queue_generative_regeneration` |
| Mechanics | Briefs queued for regeneration. The strict cascade flags affected Assets as Stale. Generation proceeds in priority order (live campaign assets first, then queued assets). Vision verification runs on every regenerated render. |
| Timing | 5 minutes to 24 hours depending on queue load and ConstraintModel complexity. |
| Failures | Three silent regeneration attempts on vision verification failure, then Brief state Escalated_To_Internal, notification to Marketing Lead. |
| Agent role | Pattern 1 for regeneration after the SyncEvent fires. Pattern 2 if regeneration produces meaningfully different creative requiring re-approval (the agent flags this, Marketing Lead decides). |

## Stage 7. Approval-gated external propagation (developer / manager confirms)

Surfaces in this tier never auto-propagate. The agent proposes; the developer or sales manager decides. Pausing or modifying live paid campaigns is treated as a **high-alert action**: the agent never touches active campaigns autonomously, because doing so disrupts the platforms' learning phase and can materially degrade campaign performance even when the change seems unambiguously correct.

| Field | Description |
|-------|-------------|
| Surfaces | Active paid media campaigns (Meta, Google, LinkedIn). Third-party listings (Rightmove, Zoopla, PropertyFinder if integrated). Email blast sequences scheduled but not yet sent. Social posts scheduled but not yet published. Outbound WhatsApp / SMS broadcast campaigns. |
| Capability | T_SYNC7 `propose_external_action` per surface |
| Mechanics | Agent generates a Recommendation entity per affected campaign / listing / scheduled send. Recommendation contains: proposed action (pause, refresh creative, narrow audience, drop sold unit from the running set), reasoning, expected impact (eg "$340 saved in next 24 hours"), risk flags including **campaign-learning-phase risk** (an explicit flag where pausing or modifying a campaign mid-learning will reset the platform's optimisation), decided_by null. Recommendation surfaces in the developer's CRM inbox AND the Marketing Lead's queue as a high-alert item (visual treatment, push notification, escalation). Both Admin / Developer and Marketing Lead must see it; either with the right permission can approve. |
| Timing | Recommendations are generated within minutes of the state change. Developer / Marketing Lead acts on them in their own time. SLA: workspace-configurable, default 4 hours during business hours for standard actions, with escalation if unactioned. Paid-media recommendations specifically get high-priority surfacing but no SLA-driven autonomous action. |
| Failures | If no action is taken within the SLA, the agent escalates (notification with higher priority to the next role up). The agent never executes autonomously, regardless of how long the recommendation sits unactioned. |
| Agent role | Pattern 2: proposes, developer / Marketing Lead decides. **Strictly forbidden from auto-pausing or auto-modifying live paid spend, even when the recommendation seems unambiguous, because campaign learning phase damage outweighs short-term spend efficiency.** |

### Why paid media is treated this strictly

Paid platforms (Meta, Google) optimise campaigns through a learning phase that requires consistent signal. Pausing a campaign mid-learning, even briefly, can reset the algorithm and force the campaign to re-learn from scratch when reactivated. The short-term "we shouldn't run ads for a sold unit" calculus is dwarfed by the long-term cost of broken campaign learning. The right action is almost always: keep the campaign running, swap the creative to remaining inventory, or narrow the audience. The wrong action is to pause. The developer and Marketing Lead, who understand their campaign portfolio, are the only ones positioned to make that call.

## Stage 8. Personalised buyer pack reconciliation

Personalised packs reflect Unit status changes silently as data. Reps are only pulled in to act at hard commercial gates, where a buyer-facing communication may be warranted.

### Stage 8a. Silent update (all state changes except hard gates)

| Field | Description |
|-------|-------------|
| Trigger | SyncEvent affects a Unit referenced in one or more live personalised buyer packs (Microsite type=personalised_buyer_pack, state=Published, not expired). Applies to: Pending_Hold, Held, price changes, payment plan changes, label overrides, attribute changes |
| Actor | System (no rep involvement) |
| Capability | T_SYNC8a `update_pack_unit_status` |
| Mechanics | The pack's Unit status indicator updates to reflect new state. Status label respects workspace public_label_overrides (eg "Reserved" displays as "Promise of Sale Signed" if configured). PackVersion increments silently for audit, but no buyer-facing version-change notification fires. Pack remains live and viewable. |
| Timing | Real-time tier (sub-30 seconds). |
| Agent role | Pattern 1: autonomous. |

### Stage 8b. Rep alert at hard commercial gates

| Field | Description |
|-------|-------------|
| Trigger | One of two events on a Unit referenced in a live pack: (a) Unit goes Reserved with POS + deposit Documents attached and verified in CRM (the full reservation, not just an internal "Held"), or (b) Unit reverses from Reserved to Available after POS (POS collapse: financing_failed, buyer_breach, developer_breach) |
| Actor | Agent surfaces, owning Rep decides |
| Capability | T_SYNC8b `propose_pack_unit_notification` |
| Mechanics | The pack's Unit status indicator has already updated silently via Stage 8a. Now the rep gets an actionable alert: "Unit X in [Contact's] pack is now [Sold / back Available after fall-through]. Would you like to notify some or all linked Contacts on this pack?" Rep sees the full list of Contacts whose packs reference this Unit, with engagement signals on each (last viewed, last contacted, engagement score). Rep selects which Contacts to notify (all, some, or none). Agent drafts a templated message per selection (different template for Sold vs back-Available); rep edits and approves before send. |
| Timing | Recommendation surfaces within minutes of the gate event. Rep acts in their own time. SLA: workspace-configurable, default 4 business hours for Sold gates, 1 business hour for back-Available gates (urgency: warm leads may want to re-engage fast). |
| Failures | If rep is unreachable past SLA, notification escalates to Sales Manager. Manager can act on rep's behalf per workspace policy. Default policy: manager can send the templated notification but the selection of Contacts must be explicit (no "notify all" shortcut from manager seat). |
| Agent role | Pattern 2: drafts the notification, rep decides on recipient selection and final wording. Agent never sends without rep (or escalated manager) approval. |

### Why this split

Silent updates keep pack data accurate without burying reps in notifications every time a Unit gets a soft hold or a minor price tweak. Hard gates (full POS reservation, post-POS collapse) are the moments where buyer-facing communication actually matters, and where the rep needs control over which buyers hear from them. A buyer who shortlisted Unit X six months ago and went cold doesn't need a "Unit X is gone" text; a buyer who viewed it last week does. Rep makes that call.

## Stage 9. Notification fan-out

Notifications fire as their dependencies complete, not in a single burst. A waitlisted rep does not get the "unit is back available" notification until the public microsite has actually updated, so the buyer's experience is consistent if the rep texts the buyer immediately.

| Field | Description |
|-------|-------------|
| Trigger | Each Stage completion fires its dependent notifications |
| Actor | System |
| Capability | T55 `dispatch_notification`, T_SYNC9 `compose_status_change_notification` |
| Recipients per change type | See Part 4. |
| Mechanics | Notification entities created per recipient per channel. NotificationPreferences on User and Contact determine channel routing. Batching applied where appropriate (eg one digest notification to a manager covering all bulk batch changes rather than 50 individual ones). |
| Timing | Real-time tier notifications fire in tandem with Stage 4 completion. Approval-gated tier notifications fire when the approval is granted, not when the Recommendation is created. |
| Failures | Per-channel retry. Failed delivery logged. Backup channel attempted if configured. |
| Agent role | Pattern 1: autonomous within the rules set by NotificationPreferences. |

## Stage 10. SyncEvent completion

| Field | Description |
|-------|-------------|
| Trigger | All operations in propagation_plan have completed, failed permanently, or are pending approval (in the case of Stage 7) |
| Actor | System |
| Capability | T_SYNC10 `close_sync_event` |
| Entity affected | SyncEvent.execution_state moves to Completed, Partial_Failure, or remains Executing if Stage 7 recommendations are still outstanding. Completion timestamps recorded per affected entity. Errors recorded. AuditEvent logged. |
| Output | SyncEvent visible in audit views, AuditEvent log, and any propagation diagnostic surface. |
| Decision points | Partial_Failure surfaces in Ops dashboard for review. |
| Agent role | Pattern 1: autonomous. |

---

# Part 3: Propagation matrix by surface

Reading this matrix: each row is a surface, each column is a status change type, each cell describes what happens and at what timing tier.

| Surface | Pending_Hold | Held | Reserved | Sold | Reverse to Available | Price change | Bulk reprice |
|---------|--------------|------|----------|------|-----------------------|--------------|--------------|
| CRM unit grid | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time, batch summary |
| CRM Opportunity views (shortlist) | Real-time, shortlist UI shows queue position | Real-time | Real-time, all other Opportunities lose the Unit | Real-time | Real-time | Real-time | Real-time |
| MCP Resources (R5 R8 R12) | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time |
| Project public Microsite (availability list + unit detail) | Real-time, status tag updates per public_label_overrides | Real-time | Real-time, "Promise of Sale Signed" or developer label | Real-time, "Sold" tag, Unit row greyed out in availability list, **unit detail page becomes inaccessible** (click is disabled, deep link returns "this residence has been sold" landing) | Real-time, Unit reappears (clickable, detail page re-enabled) | Real-time | Real-time, batch summary banner optional |
| Availability list PDF | Near-real-time (regenerated) | Near-real-time | Near-real-time | Near-real-time | Near-real-time | Near-real-time | Near-real-time |
| Brochure availability page (digital) | Near-real-time | Near-real-time | Near-real-time | Near-real-time | Near-real-time | Near-real-time | Near-real-time |
| Brochure (print, PDF as generated) | Flagged Stale, notification only (developer decides whether to regenerate the printed brochure for an internal restock) | Same | Same | Same | Same | Same | Same |
| Unit one-pager PDFs (cached) | Near-real-time regenerate | Near-real-time | Near-real-time | Near-real-time | Near-real-time | Near-real-time | Near-real-time |
| Floor plan annotated assets | No change (architectural truth unchanged) | No change | No change | No change | No change | No change | No change |
| Renders (baseline) | No change | No change | No change | No change | No change | No change | No change |
| Phase_3_unit_creative campaign assets | Flagged for refresh recommendation (Stage 7) | Same | Same | Sold-unit creative should pause: Recommendation fires | Re-activate creative: Recommendation fires | If material price change: Recommendation fires to refresh creative | Same |
| Paid media campaigns (Meta, Google, LinkedIn) | No change | No change | Recommendation: pause creative targeting this unit, reallocate to remaining units | Recommendation: pause sold-unit creative, propose reallocation | Recommendation: re-add to active set | Recommendation: refresh creative copy if price prominently featured | Recommendation: campaign-level review |
| Listings (third-party portals) | No change at MVP (integrations later) | No change | Recommendation: mark unit "reserved" or remove per listing-platform rules | Recommendation: mark unit "sold" or remove | Recommendation: re-list | Recommendation: update price on listing | Recommendation: batch update |
| Partner widget embeds | Real-time (reads from microsite data) | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time |
| MCP server external (agency clients querying inventory) | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time |
| Chatbot / buyer-side AI agent (referencing inventory) | Real-time (reads MCP) | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time |
| Personalised buyer packs (Microsite type=personalised_buyer_pack) | Real-time silent update (status indicator on Unit) | Real-time silent update | Real-time silent update + rep alert at POS+deposit gate (Stage 8b) | Real-time silent update + rep alert (highest priority) | Real-time silent update + rep alert at post-POS collapse | Real-time silent update | Real-time silent update |
| Investor dashboard | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time | Real-time |
| Cost ratio dashboard | Updated on next nightly recompute | Same | Same | Same | Same | Same | Same |
| Scheduled email blasts (not yet sent) | Flagged for review (Recommendation) | Same | Same | Same: critical to remove sold-unit references | Same | Same | Same |
| Scheduled social posts (not yet published) | Flagged for review (Recommendation) | Same | Same | Same | Same | Same | Same |

---

# Part 4: Notification flow by stakeholder

Status change notifications go to people who need to know, on the channel they need it, with the priority the change merits. NotificationPreferences on User and Contact govern channels and quiet hours; this matrix covers who gets notified, not how.

### When a Unit goes Pending_Hold

- **Filing rep** confirmation with queue_position
- **Waitlisted reps on the same Unit** "You are position N in the queue"
- **Sales Manager** "Hold request awaiting approval, SLA T-X hours"
- **Other reps** silent (the Unit shows Pending_Hold in CRM, no push notification needed)
- **Buyer** no notification (this is internal)

### When a Unit goes Held

- **Filing rep** "Hold approved"
- **Waitlisted reps** "You are still waitlisted; if the hold expires you will be notified"
- **Sales Manager** silent confirmation
- **Marketing Lead** silent (microsite status auto-updates)
- **Buyer** no automatic notification; rep handles directly

### When a Unit goes Reserved (POS signed with deposit and POS Document uploaded)

- **Rep who closed** "Reservation confirmed, commission accrual N% generated"
- **Waitlisted reps** "Unit reserved, your hold request auto-declined" + agent surfaces matching alternatives (Edge 5 pattern from Sales Process)
- **Sales Manager** "Reserved, commission accrued, sync chain firing"
- **Marketing Lead** silent (microsite updates auto)
- **Buyer (purchaser)** "Welcome, here is your purchaser portal access" (existing Sales Process notification)
- **Reps with this Unit referenced in their personalised packs (Stage 8b alert)** "Unit X is now Reserved on a confirmed POS. Select which Contacts on the affected packs to notify." Rep curates the recipient list.
- **Other Opportunities with this Unit on their shortlist** flagged on the rep's daily digest, rep follows up with their buyers
- **Investor / developer dashboard** sell-out percentage updates

### When a Unit goes Sold

- **Rep who closed** "Sale closed, commission moves from Accrued to Payable, send-off email draft ready"
- **Sales Manager** "Unit Sold, commission payable, full sync chain firing"
- **Marketing Lead** "Microsite, brochure, listings, paid media updated / flagged for action"
- **Buyer (purchaser)** "Welcome to handover" (Sales Process Stage 13)
- **Reps with this Unit referenced in their personalised packs (Stage 8b alert)** "Unit X is now Sold. Select which Contacts on the affected packs to notify." Rep curates the recipient list.
- **Other Opportunities with this Unit on their shortlist** flagged on rep daily digest with alternative suggestions
- **Investor / developer dashboard** sell-out, revenue, cost ratio all update
- **Past_Client referrer (if applicable)** "Your referral closed; commission allocation N"

### When a Unit reverses to Available (POS collapse, hold release, manual override)

- **Original rep** "Unit returned to Available, reason: X. Recovery window active for T hours" (if POS collapse)
- **Sales Manager** "Reversal logged, commission accruals reversed, cooling-off window active" (if POS collapse)
- **Previously waitlisted reps** notification SUPPRESSED during cooling-off window; fires automatically on window expiry or manual `release_to_waitlist`. Message: "Unit Y back available, fair game to re-engage your buyers" (this is the killer notification, it directly creates re-engagement opportunities)
- **Reps with this Unit referenced in their personalised packs (Stage 8b alert)** fires at the same time as waitlist notifications: "Unit X is back Available after fall-through. Select which Contacts on the affected packs to notify." Rep curates the recipient list. Original rep gets the first turn (their alert fires alongside the recovery-window indicator) before adjacent reps get theirs.
- **Marketing Lead** "Microsite refreshed, recommendation to re-activate paid creative" (fires after cooling-off)
- **Buyer (original)** rep handles directly, not an auto-fire (this is a relationship-sensitive moment)
- **Investor / developer dashboard** sell-out adjusts immediately on collapse (the cooling-off applies to waitlist notifications, not to internal reporting)

### When a Unit price changes

- **Reps with active Opportunities on this Unit** "Unit price changed from X to Y; existing offers may need re-evaluation"
- **Reps with this Unit on a shortlist** silent CRM update
- **Sales Manager** silent confirmation
- **Marketing Lead** "Public price updated; recommendation to refresh paid creative if price is featured prominently"
- **Buyer with personalised pack referencing this Unit** rep handles via Stage 8 reconciliation
- **Investor dashboard** revenue projections recalc on next nightly job

### When a bulk operation fires

- **Sales Manager** parent SyncEvent summary "Bulk reprice on N units, average change M%, all child SyncEvents firing"
- **All affected reps** digest notification, not per-unit blasts ("Your Opportunities on Units X, Y, Z are affected by today's reprice")
- **Marketing Lead** parent summary plus surface-level updates
- **Developer / C-level** summary if the bulk operation crosses a workspace-config threshold (eg ">20% of inventory affected")

### Workspace-configurable notification policy

The defaults above are sensible. NotificationPreferences on User allow:

- Channel selection per event type (in-app, email, SMS, WhatsApp, push)
- Quiet hours
- Digest vs real-time
- Bulk operation noise suppression (eg "only ping me for bulk ops over 5 units")

---

# Part 5: Approval gates

Most propagation is autonomous. Approval gates exist where action costs money, makes a public commitment, or has material consequences if wrong.

| Action | Approval | Why |
|--------|----------|-----|
| Unit state transition (Pending_Hold → Held, etc.) | Per existing Sales Process flow | Already documented |
| Price exception below floor | Sales Manager (or rep with bypass within configured limit) | Sales Process |
| Bulk reprice over workspace-config threshold (default 10% movement on >20% of inventory) | Admin / Developer | Material commercial impact |
| Public label override change (workspace-wide, eg "Reserved" → "Promise of Sale Signed" globally) | Manager | Public-visible commitment |
| Pause active paid campaign (Stage 7 Recommendation) | Marketing Lead or Developer | Money decision; even if obviously correct |
| Pause / modify scheduled email blast | Marketing Lead | Public commitment |
| Modify listing on third-party portal | Marketing Lead | Public commitment |
| Update personalised buyer pack on rep's behalf (Stage 8) | Rep (default), Sales Manager (escalation) | Buyer-facing artefact, relationship-sensitive |
| Early-expire personalised buyer pack | Rep | As above |
| Reverse Sold → Reserved (legal reversal) | Sales Manager + Admin (double-approval) | High-stakes edge case |
| Override stuck SyncEvent (eg force complete a Partial_Failure) | Admin | Audit-critical |

The agent never auto-pauses a paid campaign. Even when the recommendation is unambiguous (unit sold, $X/day still running). This is a hard rule across Bricly: Pattern 2 always applies to money decisions and public commitments. Speed of recommendation is the value Bricly provides; the developer remains the decision-maker.

---

# Part 6: Timing tiers explicitly

| Tier | Latency target | Examples | Failure mode |
|------|----------------|----------|--------------|
| Real-time | < 30 seconds | CRM views, MCP Resources, public microsite (cached page purge + new render), investor dashboard, partner widgets, MCP external clients | Retry 3x, then Partial_Failure on that surface, Ops alert |
| Near-real-time | < 5 minutes | Availability list PDF, brochure availability page, unit one-pager PDFs, agent share Microsites | Retry 3x per asset, then Asset state Regeneration_Failed, Marketing Lead notified |
| Generative regeneration | < 24 hours | Unit-specific generative renders, phase_3_unit_creative regenerations | Up to 3 vision verification attempts, then Brief Escalated_To_Internal |
| Approval-gated | Developer / Manager SLA | Paid media campaign changes, scheduled email / social changes, listing updates, personalised pack updates | SLA escalation if unactioned |
| Nightly batch | 24 hours | Cost ratio dashboard, cross-project pattern analysis, financial reporting | Job retry, then Ops alert |

Surface timing is fixed at the surface, not the change. A unit sale and a price change both hit the project public microsite in real-time, both hit the availability list PDF in near-real-time, both fire approval-gated recommendations for paid media if creative is affected. The change type determines what propagates, not how fast.

---

# Part 7: Agent role and autonomy boundaries

The four-pattern model from prior flows applies, with the autonomy boundaries set explicitly for this flow.

### Pattern 1 (autonomous)

- SyncEvent creation, plan composition, plan execution
- Real-time tier propagation across all surfaces
- Near-real-time asset regeneration (deterministic, data-overlay assets)
- Generative regeneration of stale Assets (with vision verification gating publish)
- Notification fan-out within NotificationPreferences rules
- AuditEvent logging
- Commission accrual creation and state transitions (Accrued, Payable, Clawed_Back, Cancelled follow workspace policy)
- Waitlisted ApprovalRequest auto-decline on Reserved
- PurchaserPortalAccess provisioning on Reserved
- Cache invalidation and rebuild
- Asset Stale flagging on imported assets (the flag, not the regeneration)
- **Silent status updates on personalised buyer packs (Unit status indicator refreshes; no buyer-facing or rep-facing notification fires)**

### Pattern 2 (proposes, developer / manager / rep decides)

- Any pause or modification of live paid campaigns (treated as high-alert action, never autonomous, regardless of how unambiguous)
- **Buyer notifications from a personalised pack at hard commercial gates (POS+deposit Reserved, or post-POS collapse): agent drafts, rep selects which linked Contacts to notify, rep approves before send**
- Any modification of scheduled email blasts or social posts
- Any update or pause of third-party listings
- Bulk operations over the workspace-config threshold
- Override of vision verification failure on a regenerated asset
- Republishing a brochure (print or digital) after material status changes
- Re-activating paused campaigns when reversed units come back Available
- Buyer-facing legal notifications on Sold → Reserved reversal (agent drafts, Sales Manager approves, per workspace policy)

### Pattern 3 (alerts but never decides)

- Stuck SyncEvent (Partial_Failure on > 1 surface)
- Vision verification failure cascade (3+ stale assets)
- Approval-gated recommendation unactioned past SLA
- Bulk operation that crosses a "this looks unusual" threshold (eg 50% reprice on entire inventory in one action)
- Data inconsistency detected (eg unit shows Sold in CRM but Microsite cache shows Available beyond Real-time tier latency)

### Strictly forbidden

- Auto-pausing or auto-modifying live paid spend, even when the recommendation is unambiguous (campaign-learning-phase damage outweighs short-term spend efficiency)
- Auto-sending a buyer notification from a personalised pack at any commercial gate without rep approval and rep-selected recipient list
- Auto-publishing a regenerated brochure (print or digital)
- Auto-modifying third-party listings
- Auto-sending a buyer notification on routine Unit state changes (the silent status update on the pack is the only auto-action; the human-touch notification is rep-controlled)
- Auto-overriding a manual state override (the override is the developer's decision; the agent never reverts it)
- Reproducing or auto-restoring a state that an Admin has manually rolled back

---

# Part 8: Edge cases

### Edge 1: Race condition on simultaneous hold requests

Two reps file hold requests on the same Available Unit within seconds. The queue_position pattern from Sales Process Edge 3 handles this: timestamp-ordered, deterministic, first-in-first-served. The SyncEvent fires once for the Unit transition to Pending_Hold; ApprovalRequest entities are created in timestamp order with sequential queue_positions. The MCP server's atomic write ensures no double-allocation. Subsequent state checks on the Unit show Pending_Hold with the queue length visible in the unit view.

### Edge 2: Race condition: Unit being marked Sold while a rep is composing a buyer pack including it

Rep is mid-composition in the Studio composition panel. Unit is marked Sold elsewhere (manager approves another rep's POS). The composition session shows the Unit as Sold in real-time (Stage 4 propagation reaches the composition UI). Rep sees the change inline, decides whether to remove the Unit from the pack, swap for an alternative, or proceed (rare; only if the buyer's intent is to compare lost-deal Units against alternatives). Pack composition is rep-driven, so no auto-action.

### Edge 3: SyncEvent partial failure mid-propagation

Real-time tier completed. Near-real-time tier: availability list PDF regeneration succeeds, but unit one-pager PDF regeneration fails three times. SyncEvent.execution_state moves to Partial_Failure on that asset. Asset state moves to Regeneration_Failed. Marketing Lead notified. SyncEvent stays open with that specific operation in Failed state until manually retried or marked accepted.

### Edge 4: Cascade failures on a bulk operation

Parent SyncEvent for a 50-unit bulk reprice. 47 child SyncEvents complete. 3 fail at near-real-time tier. Parent SyncEvent state is Partial_Failure. Per-unit retry is automatic; if still failing, Marketing Lead reviews. Rollback option: the bulk operation tool supports `rollback_bulk_sync` which fires reverse SyncEvents for all child operations that succeeded, restoring pre-bulk state. This is a heavy operation and requires Admin approval.

### Edge 5: POS collapse reversal (Reserved → Available)

Documented in Sales Process Edge 4. This flow handles the propagation side:

1. SyncEvent fires with trigger source = `collapse_pos`
2. Unit transitions Reserved → Available
3. Real-time tier: microsite, CRM views, MCP Resources update
4. Commission record state transitions: Accrued → Cancelled (if not yet paid), or Clawed_Back (if already paid)
5. **Cooling-off window fires (workspace-configurable, default 24 hours).** During this window, the Unit is functionally Available in the system but waitlisted reps are NOT yet notified. This gives the original rep and Sales Manager a window to attempt deal recovery (eg buyer was a borderline financing-fail, second lender being tried). The Unit shows on the original rep's dashboard with a "recovery window: T-X hours remaining" indicator. Manager can either: (a) let the window expire, after which waitlist notifications fire automatically, or (b) manually fire `release_to_waitlist` to skip the cooling-off if recovery is not realistic.
6. After cooling-off window expires (or on manual release): Notifications fire to previously waitlisted reps (this is the high-value notification)
7. Stage 7 Recommendations fire: re-activate paused paid creative on this Unit, re-add to active listings, potentially compose a "back available" social post
8. Marketing Lead actions or dismisses each Recommendation
9. Personalised buyer pack reconciliation: silent status update fires immediately on collapse (Stage 8a); rep alerts on owning packs fire at the same time as waitlist notifications (post cooling-off), so the original rep gets to call their original buyer (or not, depending on the collapse reason) before agents on adjacent packs reach out to theirs

### Edge 6: Sold → Reserved reversal (legal reversal of completed deed)

Extremely rare. Treated as Admin-level operation with double-approval (Sales Manager + Admin / Developer). Cascade is heavy:

- Commission state: Paid → Clawed_Back (real money movement, ops process)
- PurchaserPortalAccess: Active → Revoked (or kept depending on reason)
- Microsite: Sold → Reserved (or Available, per scenario), with audit-logged reason
- All Sold-state-derived assets must be re-evaluated (one-pager status tags, brochure availability page, etc.)
- **Buyer notification: agent drafts the message, Sales Manager approves before send.** Workspace policy attribute `legal_reversal_notification_policy` governs the template and approval chain (default: agent drafts in workspace tone, Sales Manager reviews and approves, Admin co-signs if the buyer-facing communication has legal weight per local jurisdiction). The notification itself goes to the buyer via their preferred channel.
- Investor dashboard recalc, with audit note for revenue reversal
- Cost ratio recompute on next nightly job

This is the kind of operation where the audit trail matters more than the speed. SyncEvent runs but every step is logged with the override reason.

### Edge 7: Manual override correction of a misclick

Manager realises a Unit was incorrectly marked Sold (eg meant to mark Held). Fires `manual_state_override` with reason. SyncEvent fires the reverse change. Cascade includes notification to anyone who received "unit sold" notifications in the prior minutes, with an apology / correction template (agent drafts, manager approves before send). Commission accruals reverse if generated.

### Edge 8: Concurrent edits by multiple managers

Two managers edit the same Unit's price simultaneously. Last-write-wins per Onboarding Edge 7. AuditEvent log captures both writes. SyncEvent fires for the winning write. Worth revisiting at scale.

### Edge 9: In-flight personalised customisation render in progress

Buyer is mid-meeting with a rep on a tablet. Unit is being personalised. Unit is marked Sold elsewhere (another rep closes). The in-meeting flow Edge 11 (Buyer Customisation) handles vision verification fail-fast; for unit-sold-mid-render, the composition panel surfaces the change immediately, rep decides whether to proceed with the personalisation as a "what if" exercise or pivot to alternatives.

### Edge 10: Cached external client (MCP partner agency) holding stale data

Partner's MCP client cached unit availability 5 minutes ago. Unit is now Sold. The MCP server's cache invalidation is real-time, but a partner that caches locally may show stale state until their cache refreshes. Best practice: MCP server includes cache-control headers, and partners are notified during onboarding to honour them. Stale cache on partner side is not Bricly's responsibility, but the SyncEvent timing should not amplify it (Bricly's own caches always invalidate real-time).

### Edge 11: Listing platform integration absent (MVP state)

No third-party listing integrations at MVP. Status changes fire Recommendation entities for "manual listing update on X portals" with the changed unit details and platform list. Marketing Lead receives the recommendation, manually updates the portals, marks the Recommendation resolved.

### Edge 12: Multi-currency price change

Unit price is held in a base currency. A Contact may have a preferred display currency. Price change in base currency fires SyncEvent; all surfaces that display in non-base currencies recompute using the current FX rate snapshot. FX rate snapshot is updated daily by a separate batch job. Recomputation is deterministic.

### Edge 13: Project paused during in-flight SyncEvent

Developer pauses Project (Go-to-Market Edge). In-flight SyncEvents complete to their current stage but Stage 7 Recommendations are paused (no campaign changes proposed while project itself is paused). On project resume, queued Recommendations are re-surfaced.

### Edge 14: Reservation falls through, original buyer wants to restore deal during cooling-off

POS collapsed, cooling-off window active. Waitlisted reps have NOT been notified yet (per Edge 5 cooling-off). Original buyer reverses the failure (eg loan was actually approved, paperwork mix-up). This is the scenario the cooling-off window exists for. Manager fires `restore_reservation` within the window. SyncEvent fires for the restore: Unit returns to Reserved, no waitlist notifications ever fired (they were suppressed during cooling-off), commission accrual restored, microsite returns to "Promise of Sale Signed" or workspace label, personalised pack silent status update fires. Clean recovery, no waitlist disruption.

If the recovery attempt happens AFTER cooling-off has expired and waitlist notifications have fired, the original buyer must start a new hold request and queue alongside the now-active waitlisted requests. No special "restore prior reservation" path post-cooling-off. The manager can use `priority_rank` from Sales Process to manually re-order the queue with audit-logged reason if the case justifies it.

### Edge 15: Asset regeneration race when ConstraintModel was also recently updated

Architect re-uploaded files; new ConstraintModel version is in Pending_Review. Unit goes Sold during this window. SyncEvent fires for the status change. Affected Assets are flagged Stale both for the status change and for the ConstraintModel version mismatch. Regeneration is queued but blocked until ConstraintModel is approved (Onboarding Edge 9 handles the ConstraintModel approval). Marketing Lead sees both Stale reasons on the asset.

### Edge 16: Imported asset stale

Developer imported a brochure they had pre-existing. Unit goes Sold. The strict cascade flags the imported brochure as Stale (the availability page is outdated). Bricly cannot regenerate. Notification fires to developer: "Your imported brochure has stale data; consider replacing or letting Bricly generate a refreshed version." Developer decides.

### Edge 17: Public_label_override change mid-flow

Workspace setting changes the public label for "Reserved" status from "Reserved" to "Promise of Sale Signed" while a Unit is in Reserved state. SyncEvent fires for the label change, real-time tier updates the public-facing label everywhere. Internal CRM state unchanged. Buyer-facing surfaces (microsite, agent shares, partner widgets) reflect the new label.

### Edge 18: Status visibility toggle on Sold units

Workspace setting changes from "show sold units with buyer name" to "show sold units anonymously" (or vice versa). SyncEvent fires for the workspace setting, propagates to all surfaces showing sold-unit detail. No state transition on individual Units; only display.

### Edge 19: Buyer-side AI agent (MCP-native chatbot) holds a unit reference mid-conversation

Buyer is chatting with a developer-owned AI agent. Agent surfaced PH9 to the buyer 30 seconds ago as "available." PH9 just got marked Held. Agent's next turn must reflect the new state. Real-time MCP propagation guarantees the agent's queries return the new state, but the conversational context the agent has built may still reference PH9. Best practice: the agent re-queries inventory state before any commit-style turn (eg before saying "I can book a viewing for PH9, when's good?"), so the buyer experience is consistent. This is an agent-design pattern, not a SyncEvent rule.

### Edge 20: Held Unit during a project rebrand or BrandKit change

If the developer changes the BrandKit while units are in Held or Reserved state, the next regeneration of assets referencing those Units uses the new BrandKit. The state of the Unit doesn't affect BrandKit application; assets stale flag through the standard cascade (Asset.brand_kit_version mismatch).

---

# Part 9: Orchestrate vs own

| Function | Final version | MVP |
|----------|---------------|-----|
| SyncEvent orchestration | Owned (core middleware) | Owned |
| CRM views / dashboards real-time refresh | Owned | Owned |
| MCP server live inventory Resources | Owned | Owned |
| Project public Microsite hosting and refresh | Owned (Bricly hosts) | Owned |
| Availability list PDF / brochure availability page regeneration | Owned (Studio orchestration) | Owned |
| Generative asset regeneration | Orchestrated (Midjourney, Kling, etc.) | Orchestrated |
| Vision verification on regenerated renders | Hybrid (Bricly orchestrates Claude vision API, comparison logic owned) | Hybrid |
| Notification delivery | Orchestrated per channel (in-app owned, email via integrations, SMS via Twilio, WhatsApp via Business API) | Orchestrated |
| Paid media campaign modification | Owned (via Meta Ads API, Google Ads API) | Asset / Recommendation handoff to developer |
| Third-party listing updates | Orchestrated per portal (final), absent at MVP | Manual via Recommendation |
| Partner widget embeds | Owned (Bricly hosts the embeddable widget, partners embed) | Owned |
| Email blast / scheduled send modification | Orchestrated (Mailchimp, Klaviyo, ActiveCampaign) | Orchestrated |
| Social scheduler modification | Orchestrated (Buffer, Later, Meta Business Suite) | Orchestrated |
| Commission record state transitions | Owned | Owned |
| AuditEvent logging | Owned | Owned |
| Cost ratio dashboard recompute | Owned | Owned |

The proprietary middleware (SyncEvent engine, propagation_plan composer, the constraint cascade, audit trail, recommendation engine, multi-channel notification orchestration) is Bricly's. The execution at the edges (publishing on paid platforms, sending email and SMS, updating third-party listings) is orchestrated.

---

# Part 10: Reporting and analytics

The flow generates data that feeds developer-facing reporting. The data flow.

### Outbound to reports

- **Inventory state over time.** Time-series of unit-state counts per Project. Feeds the sell-out forecast.
- **Time-to-sold.** Per Unit, from listing-live to Sold. Aggregated to project-level "median days to close" and per-buyer-type / per-finish-package / per-floor breakdowns.
- **Reversal rate.** POS collapses per N reservations. Per project, per rep, per buyer source. The early warning for over-aggressive reservation acceptance.
- **Stale asset incidence.** How many assets went Stale, how many were regenerated successfully, how many needed manual intervention. Feeds Marketing Lead workflow optimisation.
- **SyncEvent performance.** Per-tier completion times, partial failures, retry counts. Feeds Ops / engineering monitoring.
- **Recommendation actionability.** What % of Stage 7 Recommendations were acted on within SLA, what % escalated, what % auto-expired. Feeds workspace policy tuning.
- **Cost ratio impact of inventory churn.** Reversals consume marketing spend (re-activated campaigns, re-engagement effort). Surfaces in cost ratio dashboard.

### Dashboards

- **Project view.** Sell-out percentage, units by state, revenue closed vs target, days-to-sell-out projection.
- **Manager view.** All pending approvals, all in-flight SyncEvents, all Recommendations awaiting action, all reversal flags.
- **Marketing Lead view.** All Stale assets, all Stage 7 Recommendations affecting their queue, regeneration backlog, vision verification escalations.
- **Investor / developer dashboard.** Sell-out percentage, revenue projection, cost ratio with savings-vs-benchmark, time-to-sell-out, agent activity summary.
- **Workspace audit view.** Every SyncEvent, every override, every approval, every reversal, searchable and filterable.

---

# Decisions and Open Questions (resolved)

This section captures the decisions locked in this session.

## Decisions locked

### D1. Stage 7 (paid media / listings / scheduled sends) is always Pattern 2, high-alert action

The agent never autonomously pauses or modifies a live paid campaign, regardless of how unambiguous the trigger. Pausing mid-learning damages the platform's optimisation and is more costly than the short-term spend efficiency from pausing. Admin / Developer and Marketing Lead are notified as a high-alert action and must approve. **Locked.**

### D2. Personalised buyer packs update silently on routine state changes; rep is alerted only at hard commercial gates

The pack's Unit status indicator updates in real-time on all state changes (Pending_Hold, Held, price, etc.). Rep gets an actionable alert (with curated recipient selection) only when: (a) POS + deposit have been signed and uploaded to CRM (Reserved with full documentation), or (b) a deal falls through post-POS (Reserved → Available reversal). At those moments rep sees the list of Contacts with packs referencing the Unit, picks which ones to notify (all, some, or none, with engagement signals to inform the choice), and approves the templated message before send. Old / cold leads don't get pestered. **Locked.**

### D3. Imported assets flagged Stale, never auto-regenerated

Bricly never overwrites developer-provided files. The flag fires, the notification fires, the developer decides. Consistent with prior flows. **Locked.**

### D4. Bulk operation rollback exists, requires Admin approval

`rollback_bulk_sync` is a tool. Heavy operation, audit-critical, requires Admin. **Locked.**

### D5. SyncEvent timing tiers are surface properties, not change-type properties

A unit sale and a price change both hit the microsite real-time, both hit the availability list PDF near-real-time. The surface determines the timing, not the change. **Locked.**

### D6. Notifications fire as Stages complete, not as a single burst

Waitlisted reps don't get "unit is back available" until the public microsite has actually updated. Per-stage notification timing maintained. **Locked.**

### D7. Bulk operation notifications are digests, not per-unit blasts

One digest per affected rep, with deep-linkable per-unit details inside. **Locked.**

### D8. Manual override is its own audit trail, no agent rollback

Manager fires `manual_state_override`. If wrong, manager fires a counter-override. Agent never reverses. **Locked.**

### D9. Sold → Reserved reversal is double-approval (Manager + Admin)

Two approvals. For solo workspaces, one user holding both roles still triggers two confirmations (double-confirm UX). **Locked.**

### D10. Public_label_overrides are workspace-level, not project-level

Workspace-level for MVP. Per-project label customisation deferred. **Locked.**

---

## Open questions resolved

### Q1. Paid media on sold units: no autopause, high-alert action

The agent never touches active campaigns. Surfaces as a high-alert Recommendation to Admin / Marketing Lead. Both must see; either can approve. Campaign-learning-phase risk flagged on every recommendation. **Resolved (see D1, Stage 7).**

### Q3. Personalised pack on Unit-Sold-elsewhere: keep pack live, silent status update, rep alert at hard gate

Pack remains live with the Unit now showing Sold in its status indicator. Rep gets an alert at the hard commercial gate (when the sale is real, ie POS + deposit uploaded) to curate the buyer notification. **Resolved (see D2, Stage 8).**

### Q4. Buyer notification authority on legal reversal: agent drafts, manager approves

Agent drafts. Sales Manager approves before send. Admin co-signs if local jurisdiction gives the communication legal weight. Workspace policy attribute `legal_reversal_notification_policy` captures the rules per workspace. **Resolved (see Edge 6).**

### Q6. Multi-currency display: standard FX practice (daily snapshot)

Daily FX snapshot for display recompute. No real-time FX dependency. **Resolved.**

### Q8. Cooling-off window before waitlist notifications on POS collapse

Workspace-configurable cooling-off window (default 24 hours) on POS collapse. Original rep and Sales Manager get a recovery window to attempt deal restoration before waitlisted reps are notified. After window expires (or on manual `release_to_waitlist`), waitlist notifications fire. Personalised pack rep alerts on adjacent packs are held back to the same moment, so the original rep can call their original buyer first. **Resolved (see Edge 5 and Edge 14).**

### Q10. Sold units on microsite: greyed out, unit detail page inaccessible

Sold units stay visible in the availability list with "Sold" tag, but rendered greyed out and not clickable. Deep links to their unit detail pages return a "this residence has been sold" landing. Page is not accessible for browsing. **Resolved (see propagation matrix).**

### Q2. SLA for Stage 7 Recommendations

Workspace-configurable. Default 4 business hours for standard actions, with escalation if unactioned. Paid media recommendations get high-priority surfacing but no SLA-driven autonomous action (the agent never executes regardless of how long the recommendation sits).

### Q5. Cache-control for partner / external MCP clients

Bricly serves cache-control headers via the MCP server with sensible TTLs (real-time-tier reads carry low TTL, near-real-time tier reads carry medium TTL). Partners are advised during onboarding to honour these headers. No technical enforcement on partner-side caching at MVP. Documented best practice in partner onboarding.

### Q7. Bulk operation "looks unusual" threshold

Pattern 3 alert fires to Admin when a single bulk operation crosses any of: > 50% price movement on > 30% of project inventory, or > 50% of project units moving to a single non-Available state in one action. Workspace-configurable thresholds with the above as defaults.

### Q9. SyncEvent rollback granularity

MVP: full-batch rollback only via `rollback_bulk_sync`. Partial rollback ("undo units 7-15 only") deferred to a future tool to keep MVP scope tight.

### Q11. Investor Dashboard freshness

Sell-out percentage and revenue-closed updates fire on the real-time tier (the underlying data is real-time anyway; the aggregation is cheap at single-project level). Cost ratio remains nightly batch (cross-project aggregation, FX recompute, marketing spend reconciliation are heavy enough to justify the cadence). If investor reporting demands tighter freshness on cost ratio, can be revisited.

### Q12. Notification timing during quiet hours

Critical-priority notifications (POS collapse with active rep, manual override correction, Sold → Reserved legal reversal) override quiet hours. Standard and digest notifications respect quiet hours. Priority is set on the Notification entity at creation; recipients can configure their own override thresholds in NotificationPreferences.

---

## Conflicts resolved

### C1. Compliance pre-flight vs Marketing Lead approval

Compliance pre-flight check is Pattern 1 (autonomous: the check runs, the flag fires or doesn't). Any resulting flag override or remediation Recommendation is Pattern 2 (Marketing Lead decides). Consistent across both flows.

### C2. Commission state machine

Defer to Sales Process. Use Accrued, Pending_Approval, Approved, Paid, Clawed_Back, Cancelled, Disputed. No new "Reversed" state introduced. This flow updated accordingly.

### C3. Manager override authority on a rep's personalised pack

Sales Manager can act unilaterally on a rep's pack when rep is unreachable past SLA, but with audit-logged reason. Recipient selection (when sending buyer notifications via Stage 8b) is explicit per Contact — manager cannot use a "notify all" shortcut from the manager seat. Consistent with the "no auto-batch on rep's behalf" principle from Buyer Customisation.

### C4. Public-facing label scope

Workspace-level for status labels (Reserved → "Promise of Sale Signed"). Per-pack toggles for pricing visibility. Both are intentional: status labels are developer-brand-controlled; pricing visibility is rep-controlled. **No conflict.**

### C5. Imported asset stale notification wording

Coordinated wording across this flow, Onboarding's `import_assets` flow, and Launch Package. Standard template: "Your imported [asset type] now contains stale data on [Unit / Project / segment]. Consider replacing with an updated version or letting Bricly generate a refresh." Audit-logged.

### C6. Brochure (print) regeneration

Print brochure flagged Stale on state changes, never auto-regenerated. Developer decides when to refresh for a print run. Workspace policy attribute `print_brochure_refresh_policy` allows defaults (eg "flag for refresh when 10% of inventory has changed state since last print"). **Resolved.**

### C7. Phase transition vs Stage 6 generative regeneration: Admin gate prevents double-fire

When sales velocity crosses a phase transition threshold (Go-to-Market) AND individual Unit state changes are firing this flow's Stage 6 regeneration concurrently, the system **flags the conflict to Admin and pauses Stage 6 generative regenerations on affected Units until the Admin confirms how to proceed**. Admin chooses: (a) let the phase transition regeneration take over (Stage 6 regenerations cancel as superseded), or (b) let Stage 6 regenerations complete first and run phase transition after. This prevents double-fire of generative jobs (which is expensive and produces inconsistent output) and gives Admin explicit control during the conflict window. The phase transition's larger regeneration almost always wins, but Admin makes the call. **Resolved.**

### C8. Rep notification on Sold (sales rep who lost the shortlist)

Daily digest with alternatives, sourced via T70 `workspace_units_matching`. Consistent with Sales Process Edge 3. **Resolved.**

---

End of document.
