# Recommended Updates to Bricly Knowledge Files

Following the sales process flow session, several decisions need to be reflected back into the existing knowledge files. This document lists every change, grouped by target file.

The most significant ripple is the **activation of the post-sale layer**. The data model already sketched entities 28-32 as a "future expansion" out of MVP scope. The decision to extend Bricly into post-sale (build the buyer portal natively rather than integrate with Unlatch) promotes that layer from "future" to "in scope for the final product."

Several new Tools, Resources, and Prompts also need to be added to the capability surface to reflect decisions made during the flow design.

---

## File 1: bricly-data-model.md

### 1.1 Post-sale layer status change

**Current text** (end of entities 28-32 section): "These entities represent the post-sale digitisation layer. They are out of MVP scope. The current ideal-product model (entities 1-27) does not depend on them..."

**Update**: Remove the "out of MVP scope" framing. Replace with: "These entities represent the post-sale digitisation layer, in scope for the final product. They remain deferred for MVP scoping but are first-class in the v1 product definition. The decision to extend into post-sale natively, rather than integrate with platforms like Unlatch, was made during the sales process flow design."

The strategic note paragraph ("post-sale digitisation is a real competitive area... Bricly's strategic question is whether to extend...") should be updated to reflect that the decision has been made: extend natively, orchestrate e-signature and payment from best-in-class providers (DocuSign, Stripe).

### 1.2 New entity: SnaggingItem (or Defect)

Add as entity 33 (or wherever in the post-sale section it fits).

**Description**: An individual defect raised against a Unit during or after handover, tracked through to resolution.

**Key attributes**:
- Unit reference, Contract reference, CompletionMilestone reference (typically the snagging_period milestone)
- Raised by (Contact reference, the Buyer)
- Description, photos (Document references), location in unit
- Severity (cosmetic, functional, safety)
- Assigned User OR external contractor reference
- Status, raised date, in_progress date, resolved date
- Resolution notes, resolution photos
- Buyer confirmation status, dispute history

**Relationships**:
- BELONGS_TO: Unit, Contract, Workspace
- ATTACHED_TO: CompletionMilestone (snagging_period)
- ASSIGNED_TO: User or external Partner (contractor)
- HAS_MANY: Activities, Documents (photos, evidence)

**States**: Open, In_Progress, Resolved, Disputed, Closed

### 1.3 Updates to existing Unit state machine

**Current Unit states**: Available, Held, Reserved, Sold, Off_Market, Snagging, Handed_Over

**Update**: Add a transient state **Pending_Hold** between Available and Held, for the soft-lock period when one or more hold requests have been filed but none yet approved. Visibility: shown to all reps in the workspace as "Pending Hold" with queue position info.

Updated states: Available, Pending_Hold, Held, Reserved, Sold, Off_Market, Snagging, Handed_Over

### 1.4 ApprovalRequest queue_position attribute

**Current ApprovalRequest attributes**: Type, Target, Proposed change payload, Requester, approver(s), required approvals count, decision, decision reason, decision timestamp, expiry time.

**Update**: Add `queue_position` (integer, scoped to (target_unit, type=hold)), computed from request timestamp ordering. Preserves "first in, first served" fairness for hold approvals.

Also add `priority_rank` (optional, integer, manager-set) to allow a manager to manually re-order the queue in exceptional cases (e.g. one buyer has a strict deadline). Default is queue_position; if priority_rank is set, manager has explicitly overridden FIFO. Audit logged.

### 1.5 New attributes on Opportunity (sales pipeline)

Add to the Opportunity entity:
- `project_agnostic_flag` (boolean): true if the lead didn't reference a specific project at capture
- `floor_price_override` (currency, nullable): if a price below floor was approved, the approved price is stored here
- `financing_condition` (structured): {required: boolean, deadline_date, current_state: Applied | Pre_Approved | Approved | Funds_Confirmed | Failed, proof_documents}

### 1.6 New attributes on Unit

Add to the Unit entity:
- `asking_price` (existing, rename `price` for clarity)
- `floor_price` (currency): the lowest approved price, internal only, used as the threshold for `price_exception` ApprovalRequests
- `public_label_overrides` (object): per-status display label overrides for Reserved, Sold, Held (e.g. {"Reserved": "Promise of Sale Signed"})

### 1.7 Reservation entity activation

Reservation (entity 28) was sketched as future. Now in scope.

Confirm attributes include:
- POS Document reference (signed)
- Deposit amount, deposit date, deposit Document reference (proof)
- Financing condition deadline (auto-populated from POS terms)
- Notary appointment date
- PaymentPlan reference

Add: `cancellation_reason` (enum: financing_failed, buyer_breach, developer_breach, other), `cancellation_date`, `deposit_disposition` (refund_full, refund_partial, retained, refund_plus_damages), `cancellation_notes`.

### 1.8 CollaborationSpace permission scoping

CollaborationSpace already has "per-participant role and permission scope" in its description. Make explicit:

Add `message_visibility_scope` per message (or per thread): internal_only | buyer_visible | notary_visible | all_participants. This supports the rule that buyer cannot see notary-only messages but can see updates pushed to them.

### 1.9 New entity: ReferralLink (optional, could be subsumed into Partner)

If referral attribution needs more than the existing Partner entity:

**Description**: A unique attribution link generated for a Past_Client to refer new buyers.

**Key attributes**:
- Past_Client reference (Contact)
- Workspace reference
- Unique URL token
- Active state, created date, expiry date
- Tracked: clicks, captures, opportunities created, deals closed, commission/incentive earned

Alternative: extend Partner to support `partner_type: past_client_referrer` and use existing Partner attribution. Simpler. Recommend this path.

### 1.10 PurchaserPortalAccess: in-scope confirmation

PurchaserPortalAccess (entity 31) was sketched as future. Now in scope. No structural changes needed, just confirm in the data model framing that it's the access surface for the Buyer Contact, scoped to their own Reservation, Contract, CompletionMilestones, Documents.

---

## File 2: bricly-jobs.md

### 2.1 New Sales Rep jobs

Add to the Sales Rep section (R1-R9):

#### R10: Generate and send personalised follow-up pack after first viewing
*Phase: MVP*

- **Trigger**: First viewing or online meeting complete, buyer engaged with shortlist
- **Functional outcome**: Personalised pack with shortlist, finish preferences, comparison renders sent through buyer's preferred channel within minutes
- **Constraint**: Without manual design work, without same generic PDF every other rep sends
- **Underlying motivation**: Stay differentiated from competing agencies, give the buyer something to show their partner or accountant, control the narrative outside the room

(R10 is closely related to existing R5 "Send a personalised follow-up pack after the meeting" — confirm whether to keep both or merge. Recommend merging R5 and R10 since they're describing the same job.)

### 2.2 New Sales Manager jobs

Add to the Sales Manager section (M1-M8):

#### M9: Manage the hold request waitlist queue across the team
*Phase: MVP*

- **Trigger**: One or more hold requests filed on the same Unit, queue exists
- **Functional outcome**: Manager sees queue per unit with requester, buyer, request timestamp, queue position, requested hold terms. Approves top of queue. Can manually re-order in exceptional cases with audit log.
- **Constraint**: Without losing fairness to whoever filed first, without losing visibility on competing demand
- **Underlying motivation**: Competing demand is a signal. Multiple holds on the same unit means the unit's priced or marketed well. Visibility on the queue informs pricing decisions and pipeline forecasting.

#### M10: Decide ownership on re-engaging cold leads
*Phase: MVP*

- **Trigger**: A Cold or Past_Client Contact re-engages (replies to drip, fills form, contacts developer)
- **Functional outcome**: Manager sees re-engagement context (original capture, new capture, original rep activity, time since last contact). Decides who owns the lead.
- **Constraint**: Without unfairly stealing leads from reps who worked them originally, without leaving dormant leads to rot
- **Underlying motivation**: Cold leads come back, and they convert higher than fresh leads. Whoever owns them matters for fairness, morale, and conversion.

### 2.3 Updated Ops jobs

Add to the Ops section (O1-O5):

#### O6: Triage and resolve snagging items raised by buyers
*Phase: Phase 2 (post-sale layer activation)*

- **Trigger**: Buyer raises a SnaggingItem via the buyer portal, or a defect is identified at handover
- **Functional outcome**: Ops sees snagging dashboard per project and per unit, routes per defect type (electrical, plumbing, finishings), tracks resolution, manages buyer confirmation or dispute
- **Constraint**: Without losing items in inboxes, without buyer chasing for status, without disputes escalating
- **Underlying motivation**: Post-handover relationship determines referrals and repeat business. Snagging done badly costs the developer the next deal.

#### O7: Manage construction updates to the buyer portal
*Phase: Phase 2*

- **Trigger**: Construction milestone reached (foundation poured, structure complete, finishings, practical completion)
- **Functional outcome**: Photos uploaded, milestone marked, update narrative drafted, published to buyer portal across all affected buyers
- **Constraint**: Without manually messaging every buyer, without forgetting buyers waiting 12+ months for handover
- **Underlying motivation**: Buyer satisfaction in the gap between POS and handover is fragile. Regular updates keep it strong.

### 2.4 New post-sale layer: Buyer jobs (new layer below team-level)

Add a new layer to the jobs taxonomy: **Buyer-level jobs**. These are jobs the Buyer performs in the post-sale buyer portal, on their own behalf.

#### B1: Track the status of my purchase from POS to keys
*Phase: Phase 2*

- **Acts on behalf of**: Buyer
- **Trigger**: Buyer logs into portal anytime between POS and handover
- **Functional outcome**: Single screen showing current state of purchase: payment milestones (paid, due, upcoming), construction progress, document status, key dates (notary, handover)
- **Constraint**: Without chasing the developer for updates, without managing the deal across email and WhatsApp threads
- **Underlying motivation**: Buyer has committed 6-18 months of waiting and a 10-100% of a large sum. They need confidence the deal is on track.

#### B2: Communicate with the developer, notary, and solicitor in one place
*Phase: Phase 2*

- **Acts on behalf of**: Buyer
- **Trigger**: Buyer has a question or needs an action
- **Functional outcome**: Buyer messages the developer team in the portal, sees responses, sees relevant notary or solicitor updates pushed to them, with full audit trail
- **Constraint**: Without losing thread across email, without information siloed between parties
- **Underlying motivation**: Reduce coordination friction so the deal completes faster.

#### B3: Raise and track snagging defects
*Phase: Phase 2*

- **Acts on behalf of**: Buyer
- **Trigger**: Buyer notices a defect during handover walk-through or in the snagging period
- **Functional outcome**: Buyer raises an item with description, photos, location and severity. Tracks status. Confirms resolution or disputes it.
- **Constraint**: Without phone calls, without losing track of what's been fixed
- **Underlying motivation**: Get the unit to acceptable quality without becoming a project manager themselves.

#### B4: Refer friends and earn attribution / incentive
*Phase: Phase 2*

- **Acts on behalf of**: Buyer
- **Trigger**: Buyer wants to recommend the developer to a friend
- **Functional outcome**: Buyer generates a personalised referral link OR manually introduces a friend via the portal form. Tracks referral pipeline and earned incentive.
- **Constraint**: Without losing attribution to a generic "where did you hear about us" question
- **Underlying motivation**: Buyer-driven referrals are the highest-converting channel in off-plan and the cheapest.

### 2.5 Updates to existing agent jobs

#### A11 status update
Current: "Phase 2"
Update note: A11 (inbound lead conversational qualification and appointment setting) is now confirmed as the qualification mechanism in the final product flow. Still Phase 2 in build sequence, but explicitly the post-MVP target for the inbound funnel.

#### A1 status update
Current: "Phase: MVP"
Update note: A1 (conversational rep input agent) is reinforced as the primary update mechanism throughout the flow. SLA nudges, viewing transcription, retroactive activity logging, in-meeting render invocation all route through A1.

#### New agent A13: Post-sale relationship continuity agent
*Phase: Phase 2+*

- **Acts on behalf of**: Buyer and developer team
- **Trigger**: Reservation activated, ongoing through handover and warranty period
- **Functional outcome**: Agent surfaces relevant updates to the buyer (next payment milestone, construction progress, document required), drafts construction-update narratives from photos and milestones (for ops to review), nudges the developer when buyer-facing surfaces are stale
- **Constraint**: Must not over-message the buyer, must respect the developer's brand and tone, must not auto-publish without ops review
- **Underlying motivation**: The post-sale gap is where developers lose buyer satisfaction. An agent that keeps the relationship warm without ops effort makes the buyer portal valuable.

### 2.6 Update strategic notes section

Add to strategic notes (current section lists 5 notes):

6. **Post-sale layer is now in scope for the final product.** The data model already supported it; the decision was deferred pending strategic call. Decision: extend natively rather than integrate with Unlatch or similar. Orchestrate e-signature (DocuSign) and payment (Stripe/Mollie/local PSP) from best-in-class providers. Bricly owns the workflow, the data, and the buyer experience.

7. **The buyer is a first-class user in the post-sale layer**, but not a workspace User. Buyer is a Contact with a PurchaserPortalAccess grant. Permissions scoped per access grant. This keeps the workspace User model clean and the buyer's footprint contained.

---

## File 3: bricly-capability-surface.md

### 3.1 New Tools

Add to the Tools section in the appropriate entity groupings:

**Unit / ApprovalRequest section:**

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T(new) | `place_unit_hold_with_queue` | Replaces or augments T6. Files hold request, computes queue_position scoped to (target_unit, type=hold). Returns position info. | Unit, ApprovalRequest | R3, M1, M9 | Owned |
| T(new) | `reorder_hold_queue` | Manager-only. Manually re-orders the hold queue with reason and audit log. | ApprovalRequest | M9 | Owned |
| T(new) | `collapse_pos` | Manager-approved. Reverses Reserved unit to Available with structured reason (financing_failed, buyer_breach, developer_breach, other), deposit disposition, supporting Documents. Notifies all reps with previously-waitlisted hold requests. | Unit, Reservation, Opportunity | M1, O1 | Owned |
| T(new) | `request_price_exception` | Files an ApprovalRequest of type price_exception for a price below floor. Can fire standalone or alongside a hold request. | ApprovalRequest, Opportunity | R3, M1 | Owned |

**Opportunity / Contact section:**

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T(new) | `create_opportunity` | Creates a sales-pipeline Opportunity for a Contact, placing it in stage "New Lead" or workspace-equivalent. Triggered by inbound capture, marketing lead, or manual rep creation. | Opportunity | R2, M7, ML1 | Owned |
| T(new) | `transition_opportunity_stage` | Move Opportunity through pipeline stages (forward or reverse). Validates against the linked Pipeline's state machine. | Opportunity | R3, M3 | Owned |
| T(new) | `apply_routing_rule` | Evaluates workspace routing config (project-based, capacity-aware, OOO-aware), assigns Opportunity to User or unassigned queue. | Opportunity | M7, A2 | Owned |
| T(new) | `track_financing_status` | Updates structured financing state on Reservation (Applied → Pre_Approved → Approved → Funds_Confirmed → Failed) with proof Documents. | Reservation, Opportunity | R7, O3 | Owned |

**Post-sale layer (new section):**

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T(new) | `provision_purchaser_portal_access` | Creates PurchaserPortalAccess (Pending_Activation), sends invitation to buyer Contact. | PurchaserPortalAccess | B1, O3 | Owned |
| T(new) | `activate_purchaser_portal` | Buyer self-serves activation via magic link or equivalent. State Pending_Activation → Active. | PurchaserPortalAccess | B1 | Owned |
| T(new) | `raise_snagging_item` | Buyer raises a defect via portal. Creates SnaggingItem (Open). | SnaggingItem | B3 | Owned |
| T(new) | `assign_snagging_item` | Routes SnaggingItem per defect-type rule or manual assignment. | SnaggingItem | O6 | Owned |
| T(new) | `resolve_snagging_item` | Ops or contractor marks SnaggingItem Resolved with notes and photos. Buyer notified to confirm. | SnaggingItem | O6 | Owned |
| T(new) | `confirm_snagging_resolution` | Buyer confirms a resolved item. Closes. | SnaggingItem | B3 | Owned |
| T(new) | `dispute_snagging_resolution` | Buyer disputes a resolved item. Re-opens. | SnaggingItem | B3 | Owned |
| T(new) | `override_snagging_close` | Manager forces close after repeated disputes. Reason logged. Buyer notified. | SnaggingItem | M9, O6 | Owned |
| T(new) | `complete_handover` | Marks handover Appointment outcome. Transitions Unit Sold → Snagging (if defects) or Sold → Handed_Over. CompletionMilestone updated. Buyer signature captured via integration. | Appointment, Unit, CompletionMilestone | O7 | Owned |
| T(new) | `push_construction_update` | Developer/PM/ops uploads photos, marks CompletionMilestone, adds narrative. Pushes to all buyer portals on affected Units. | CompletionMilestone, Asset | O7, D5 | Owned |
| T(new) | `send_message_in_collaboration_space` | Sends a message in the CollaborationSpace with visibility scope (internal_only, buyer_visible, notary_visible, all_participants). | CollaborationSpace | B2, O3 | Owned |
| T(new) | `generate_referral_link` | Creates a unique referral link for a Past_Client. | Partner (extended) or ReferralLink | B4 | Owned |
| T(new) | `submit_referral_intro` | Past_Client manually submits a referral intro from the portal. Creates Contact with attribution. | Contact, Partner | B4 | Owned |

**Payment / commission section:**

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T(new) | `update_payment_milestone` | Updates PaymentMilestone status (pending, requested, paid, overdue), attaches proof of payment. | PaymentMilestone | O4 | Owned |
| T(new) | `mark_payment_received` | Developer or ops marks a payment received with proof. Triggers commission payable transitions if applicable. | PaymentMilestone, Commission | O4 | Owned |
| T(new) | `configure_commission_policy` | Workspace or per-Partner commission timing policy (pay_on_pos, pay_on_final_deed, split). | Workspace, Partner | M4 | Owned |

### 3.2 New Resources

Add to the Resources section:

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R(new) | `unit_hold_queue` | ApprovalRequest (filtered by target_unit, type=hold, status=Pending) | M9 | All pending hold requests on a Unit, ordered by queue_position, with requester and buyer context. |
| R(new) | `workspace_unassigned_leads` | Opportunity (filtered by assigned User = null, stage = New Lead) | M7 | Manager unassigned queue. Pulled from when routing rules don't match. |
| R(new) | `at_risk_reservations` | Reservation (filtered by deal-at-risk indicators: financing approval overdue, payment milestone overdue, no contact in N days) | M1, M3 | Deal-at-risk surfacing for managers. |
| R(new) | `buyer_portal_view` | Composite (Reservation, Contract, PaymentMilestones, CompletionMilestones, Documents, SnaggingItems, CollaborationSpace messages — all filtered by PurchaserPortalAccess scope) | B1 | The buyer's view of their own post-sale state. |
| R(new) | `project_snagging_dashboard` | SnaggingItem (filtered by Project, optionally by Unit, status) | O6 | Ops view of all snagging across a project. |
| R(new) | `project_construction_progress` | CompletionMilestone (filtered by Project) + linked update Documents | O7, D5 | Construction progress view for ops and developer. |
| R(new) | `past_client_referrals` | Contact (filtered by referrer Partner = this Past_Client) + linked Opportunities and status | B4 | Past_Client sees their referral pipeline and earned attribution. |

### 3.3 New Prompts

Add to the Prompts section:

**Sales Manager:**

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P(new) | `review_hold_queue` | M1, M9 | `unit_hold_queue` per Unit with pending requests → per item: `approval_request` detail + `contact` + `opportunity` context → approve top of queue OR reorder with reason → `decide_approval_request` fires → notify queue. |
| P(new) | `decide_reengagement` | M10 | Re-engagement event detected → `contact` detail → `contact_activity` history → original rep `user_performance` → routing recommendation from agent → `assign_opportunity_to_user` manually. |

**Ops:**

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P(new) | `manage_snagging_resolution` | O6 | `project_snagging_dashboard` → per item: `snagging_item` detail → `assign_snagging_item` or `resolve_snagging_item` → notify buyer → on dispute: re-open or `override_snagging_close` (with manager involvement). |
| P(new) | `push_construction_milestone_update` | O7, D5 | `project_construction_progress` → mark CompletionMilestone progress → upload photos as Documents → compose narrative → `push_construction_update` → fans out to all PurchaserPortalAccess instances on affected Units → buyer notifications fire. |

**Buyer (new role, new prompt section):**

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P(new) | `buyer_portal_dashboard_view` | B1 | `buyer_portal_view` → renders dashboard: payment milestones, construction progress, document status, key dates, communication thread, snagging items. |
| P(new) | `buyer_raise_snagging` | B3 | Buyer initiates from portal → `raise_snagging_item` → routing fires via `assign_snagging_item` → ops or contractor receives notification. |
| P(new) | `buyer_refer_friend` | B4 | Either `generate_referral_link` for a shareable link OR `submit_referral_intro` for manual intro → Contact created with attribution → `past_client_referrals` updates to show the new referral. |

**Agent-level:**

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P(new) | `slet_nudge_or_escalate` | R1, M3 | Rep-activity SLA check fires → if zero activity 1-2 days: nudge rep via configured channel → if no resolution within nudge window: flag to manager dashboard → A1 can resolve via retroactive activity log on rep response. |

### 3.4 Updates to existing items

**T6 `place_unit_hold`**: Update to clarify queue_position is computed and returned. (Alternatively, replace with `place_unit_hold_with_queue` above.)

**T8 `convert_hold_to_reservation`**: Update required inputs to explicitly include: signed POS Document, deposit proof Document, notary appointment date. ApprovalRequest type: reservation.

**T9 `mark_unit_sold`**: Update required inputs to explicitly include: signed final deed Document, full payment confirmation. ApprovalRequest type: sold.

**T11 `capture_lead`**: Update to clarify that capture is always followed by `create_opportunity` if and only if the capture source warrants pipeline entry (website form, marketing channel, agency submission). Manual Contact creation (T10) doesn't trigger Opportunity creation by default.

**T49 `invite_user`** (and related): Note that the Buyer role is NOT a workspace User. Buyer access flows through PurchaserPortalAccess as a Contact with portal grant, not through User invitation.

---

## File 4: Bricly_-_Onboarding_Flow.md

The onboarding flow ends with the project going Live. No structural changes required for the sales process flow itself. However, a few small additions are worth flagging:

### 4.1 Post-launch prompts addition

Current post-launch prompts list: invite team, configure lead routing, custom domain, channel providers, assign sales reps.

**Add**:
- Configure pipeline stage names and customisation (if developer wants to rename Reserved to "Promise of Sale Signed" or similar in public-facing surfaces)
- Configure commission policies per Partner / agency
- Configure SLA thresholds (rep-activity SLA window, buyer-response attempt count and window)
- Configure hold duration default and grace period
- Configure snagging routing rules per defect type (if post-sale module is enabled)
- Configure buyer portal branding and content blocks (if post-sale module is enabled)
- Connect e-signature provider (DocuSign) for POS, final deed, handover acknowledgement
- Connect PSP (Stripe/Mollie/local) for buyer-portal payment acceptance

### 4.2 Project lifecycle states

Current: Draft, Launching, Selling.

**Consider adding**: Completed (construction complete, all units handed over or in handover) and Archived (project closed for active sales, retained for historical reporting). This is implicit in the data model but worth surfacing in the onboarding flow state machine.

---

## File 5: Prototype implications (Bricly_CRM_Prototype.html)

The interactive prototype was the demo reference for the sales process. Several gaps between prototype and final-product flow are worth noting for the next iteration of the prototype (no immediate file change required, this is a tracking list):

1. Prototype shows "On Hold" and "P.O.S" as request types. P.O.S maps to the Reserved state transition request, which in the data model is the `convert_hold_to_reservation` Tool (T8). Worth aligning terminology in the prototype to either match the data model (Hold → Reservation request) or keep the developer-friendly P.O.S label, but explicitly note the mapping.
2. Hold queue UI is not present in the prototype. Manager approval flow shows a single pending request, not a queue per unit with positions. Add to next prototype iteration.
3. Re-engagement flow for cold leads is not in the prototype. Add a manager re-engagement decision UI.
4. Buyer portal is not in the prototype. New surface entirely.
5. Snagging dashboard is not in the prototype. New surface for Ops.
6. Construction update push UI is not in the prototype. New surface for Developer/PM/Ops.
7. CollaborationSpace messaging UI is not in the prototype. New surface for multi-party comms.
8. Financing status tracking UI is not in the prototype. New surface for the rep and ops on a Reserved Opportunity.

---

## Summary of decisions made during this session

For traceability, here are the strategic decisions made during the sales process flow design that shape these updates:

1. **Pipeline is per-workspace, not per-project.** Opportunity follows the buyer across projects.
2. **Lead capture creates an Opportunity immediately** if source is inbound (web, marketing, agency). Bare Contacts (no Opportunity) covers referrers, notaries, casual contacts.
3. **No duplicate Contacts allowed.** Dedup at every capture point.
4. **Automated first-touch is in scope for final product**: immediate email, 2-3 min delayed WhatsApp, agent qualification conversation (A11).
5. **Routing rules**: project-based, capacity-aware, OOO-aware, with manager unassigned fallback.
6. **Two SLAs**: rep-activity (1-2 days, nudge before escalation) and buyer-response (2-4 attempts over 7 days, then Cold transition).
7. **Pipeline is linear**, customisable by name. Branch outcomes handled by orthogonal lifecycle state.
8. **Reps invoke Studio capabilities from inside the CRM**, not from Studio directly.
9. **Hold queue is soft-lock with visible waitlist**, FIFO with manager reorder option.
10. **Asking price + floor price** on every Unit. Below-floor needs price_exception approval.
11. **Reserved = POS signed + deposit paid**. Sold = final deed + full payment. Two distinct states, with developer-configurable public labels.
12. **POS collapse handled by single Tool with reason codes** (`collapse_pos`).
13. **Commission timing is per-Partner agreement** (pay on POS, pay on final deed, or split).
14. **Post-sale layer is in scope for final product**, activates entities 28-32 in the data model.
15. **Bricly builds the post-sale buyer portal natively**, orchestrating e-signature (DocuSign) and payment (Stripe/Mollie/local PSP).
16. **Buyer is a Contact with PurchaserPortalAccess**, not a workspace User.
17. **Snagging is a new entity** (SnaggingItem), owned by Ops, routed per defect-type rules.
18. **Construction updates are manually authored** by developer/PM/ops. No AI narrative generation in this scope.
19. **CollaborationSpace has per-message visibility scope**: internal_only, buyer_visible, notary_visible, all_participants. Buyer cannot see notary-only threads.
20. **Referral mechanic supports both**: personalised referral link AND manual intro form. Past_Client sees their referral pipeline.
