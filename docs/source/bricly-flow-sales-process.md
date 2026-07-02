# Bricly Sales Process Flow

End-to-end flow for how a lead enters the Bricly CRM pipeline, gets qualified, is worked through to a signed Promise of Sale, completes through the final deed at notary, and transitions into the post-purchase buyer portal. The operating core of the CRM module and the day-to-day workflow for a developer's sales team.

This is the ideal-product flow. MVP scoping is a separate exercise.

Lead capture itself (form submission mechanics, MCP intake, walk-in entry) is covered in a separate flow. This document picks up at the moment the lead is captured and an Opportunity exists.

---

## Operating principles for this flow

1. **Contact and Opportunity are separate.** A Contact can exist in the workspace without being in any pipeline (referrer, notary, agency contact, casual enquiry). An Opportunity is what places that Contact into the sales pipeline.
2. **Pipeline is per-workspace, not per-project.** One Opportunity per Contact per sales pursuit. Project and Units are attached entities that can change as the buyer's interest shifts. Pipeline tells the linear story of forward progression.
3. **Pipeline shape is linear, customisable by name.** Stages move forward (New Lead → Qualified → Viewing Booked → Viewing Held → Negotiating → Hold → Reserved → Sold → Handed_Over). Outcomes that aren't forward progress (Cold, Lost) are handled by the Opportunity's orthogonal lifecycle state, not by branches in the pipeline. Stage names are developer-configurable but the shape stays linear so conversion reporting stays clean.
4. **Source attribution is captured at creation, never lost.** Channel, campaign, project of interest, capture context all sit on the Contact's capture cluster and on the Opportunity's source fields permanently.
5. **No duplicate Contacts.** Dedup runs at every capture point. Existing Contact + active recent Opportunity = capture appends to existing. Existing Contact + stale Opportunity = re-engagement decision flows through the manager.
6. **Reps live in conversation, not in the CRM.** Conversational input agent parses messages, voice notes, transcripts into structured records. The CRM stays current because input is frictionless.
7. **Approval gates exist only where state goes public or commits irreversible commercial action.** Holds, reservations, price exceptions below floor, Sold transitions, POS collapse, commission payouts. Everything else is autonomous or rep-driven.
8. **Studio capabilities are invoked from inside the CRM.** Reps never leave the CRM context to generate renders, buyer packs, or personalised collateral. Cross-module invocation via the MCP server, unified UI surface in the CRM.
9. **The sync chain fires on every commercial state change.** Unit state changes (Held, Reserved, Sold) propagate through Studio: website, brochure, microsite, dashboards all update automatically.
10. **Public display labels are decoupled from internal state names.** Internal state stays Reserved (matches the data model). Developer configures the public label ("Promise of Sale Signed", "Under Contract", "Sale Agreed"). Same for Sold ("Sold", "Owner Occupied", or hidden entirely).

---

## Roles in this flow

| Role | Default permissions | Bypass capability |
|------|---------------------|--------------------|
| Sales Rep | Create opportunities, manage own assigned contacts, request holds and reservations, customise renders in-meeting, send personalised packs | None by default. Per-user toggle available to grant approval bypass on holds and reservations (matches Senior Rep). |
| Senior Sales Rep | Same as Sales Rep | Approval bypass on by default. |
| Sales Manager | Full sales team visibility, approve/decline all request types, override pricing, mark Sold, manage hold queue, assign and reassign leads, configure routing rules, configure pipeline stages | Implicit. |
| Marketing | View and manage developments, generate and approve marketing assets. No client data access, no opportunity creation. | N/A. |
| Ops | Track payment milestones, manage documents, snagging triage and resolution, optionally absorb manager work for smaller developers | Configurable per workspace. |
| Admin / C-Level | Full system access including role management, billing, all reports | Implicit. |
| Buyer (post-sale only) | Access scoped to their own Opportunity, Contract, Unit, Documents via PurchaserPortalAccess. Can view payment milestones, construction updates, raise snagging items, communicate via CollaborationSpace. | N/A. Not a workspace User; a Contact with a portal grant. |
| Developer / MD | Super admin across all roles, inherits union of all team-level capabilities | Implicit. |

---

# Part 1: The sales flow stage by stage

## Stage 1. Lead enters the pipeline

| Field | Description |
|-------|-------------|
| Trigger | Inbound: web form submit, marketing channel capture, agency or partner submission, walk-in. Internal: rep manually creates Opportunity from an existing or new Contact. |
| Actor | System (inbound), Sales Rep or Sales Manager (manual) |
| Capability | T11 `capture_lead` (runs enrichment, dedup, qualification scoring, capture cluster population), then T13 `transition_contact_state` (anonymous → Lead), then opportunity creation via (Gap) `create_opportunity` placing into the sales Pipeline in stage "New Lead". For manual creation by rep, same chain but with rep as actor. |
| Entity affected | Contact created (state: Lead) or matched if dedup found, Opportunity created (stage: New Lead, lifecycle: Active), source attribution captured (channel, campaign, project of interest, capture context, original message content) |
| Output | Opportunity record live, source fully attributed, dedup check resolved (see Stage 1a), routing logic queued |
| Decision points | If dedup match found and existing Opportunity is active and recent (<60-90 days, workspace-configurable): new capture appends to existing Opportunity as an Activity, original rep keeps ownership. If existing Opportunity is older or Cold: re-engagement routes through manager. If Contact is in Do_Not_Contact: capture blocked with compliance log. |
| Agent role | Pattern 1: capture, enrichment, dedup, scoring, opportunity creation all autonomous. |

### Stage 1a. Source attribution and project association

The Opportunity is created with explicit project context where available:

- If the lead's enquiry references a specific project (UTM, form field, ad campaign attribution), that Project is attached to the Opportunity.
- If the lead is project-agnostic (general developer enquiry, no specific project referenced), the Opportunity is created with a `project_agnostic` flag and no Project attached.
- Multiple Projects can be attached over the Opportunity's lifecycle as the buyer's interest shifts. Project-level conversion reporting is a query over Opportunities filtered by attached Project, not by pipeline membership.

---

## Stage 2. Routing and assignment

| Field | Description |
|-------|-------------|
| Trigger | Stage 1 complete, Opportunity created |
| Actor | System (routing engine), Sales Manager (manual override or unassigned queue) |
| Capability | (Gap) `apply_routing_rule` evaluates workspace routing config, then T49 `assign_opportunity_to_user` or routes to manager unassigned queue |
| Entity affected | Opportunity (assigned User set, or routed to unassigned queue), Activity logged for assignment |
| Output | Opportunity has an owner OR sits in unassigned queue awaiting claim |
| Decision points | Routing rule selection in workspace settings: round-robin, project-based, hybrid. Capacity-aware filtering (lead cap per rep, configurable). Out-of-office aware (reps flag themselves unavailable). Fallback to manager unassigned queue if no rule matches or no rep is eligible. |
| Agent role | Pattern 1: routing logic autonomous including capacity and OOO checks. Pattern 2: if multiple eligible reps, agent can recommend based on past conversion rates with similar buyer profiles. |

### Routing rule layers (evaluated top-down)

1. **Project-based assignment**, if the Opportunity has a Project attached and a rule exists, route to the assigned rep.
2. **Capacity-aware filtering**, skip reps over their workspace-configured lead cap.
3. **Out-of-office aware**, skip reps who have flagged themselves unavailable.
4. **Round-robin fallback**, if no project rule matches, distribute across all eligible reps.
5. **Manager unassigned queue**, if no eligible rep exists, lead sits in a queue any User with claim permission can pull from.

---

## Stage 3. Notification fan-out

| Field | Description |
|-------|-------------|
| Trigger | Stage 2 complete, Opportunity has an owner |
| Actor | System |
| Capability | T55 `dispatch_notification` (notification fan-out across configured channels) |
| Entity affected | Notification records created and dispatched, Activity logged on Opportunity |
| Output | Assigned rep notified via their configured channels (push, email, WhatsApp, in-CRM notification tab) |
| Decision points | Per-user notification preferences: which event types fire which channels. Workspace defaults configurable, individual users can override. |
| Agent role | Pattern 1: autonomous notification dispatch. |

---

## Stage 4. Automated first touch

| Field | Description |
|-------|-------------|
| Trigger | In parallel with Stage 2-3, fires on Opportunity creation. Immediate for email, 2-3 minute delay for WhatsApp (configurable in workspace automation settings to avoid feeling automated). |
| Actor | Agent (acting on behalf of workspace) |
| Capability | T55 `dispatch_notification` to lead, then T27 `share_asset` for any requested collateral (brochure, floor plans, price list). Then conversational qualification via the inbound lead agent. |
| Entity affected | Activities logged on Opportunity (email_sent, whatsapp_sent, agent_message), Assets shared if applicable |
| Output | Lead receives the requested info immediately, plus an open-ended qualifying WhatsApp message 2-3 minutes later. Agent conversation begins. |
| Decision points | Whether to enable automated first touch on this workspace (default on). Whether to send the email content as-is or include a personalised opening (workspace template setting). |
| Agent role | Pattern 1: email and WhatsApp dispatch autonomous. Pattern 2 for the conversation itself (see Stage 5). |

---

## Stage 5. Automated qualification conversation

| Field | Description |
|-------|-------------|
| Trigger | Lead responds to the WhatsApp opener, OR system continues the conversation autonomously after the open question. |
| Actor | Agent (A11: inbound lead qualification and appointment setting agent) |
| Capability | P15 `inbound_lead_qualification_conversation` orchestrating: agent message turn → response → workspace qualification criteria check → next question OR completion. |
| Entity affected | Activities logged per message exchanged, qualification fields populated on the Opportunity (budget, timeline, finance method, project interest, viewing intent), Contact preference profile updated. |
| Output | Qualification fields filled. If criteria met: Opportunity stage transitions New Lead → Qualified, Contact state transitions Lead → Qualified. Conversation handoff to assigned rep with full transcript. |
| Decision points | Workspace defines qualification criteria. Agent escalates to human if confidence drops, if lead requests human, or if agent has been going back and forth without progress. |
| Agent role | Pattern 2: agent runs the conversation autonomously turn-by-turn but every action is reversible by the rep and the rep can intervene at any time. |

### Handoff mechanic

When qualification completes (or lead asks for a human), agent fires `handoff_to_rep`:

- Conversation history attached to Opportunity
- Rep notified via configured channels with summary and recommended talking points
- Lead receives a transition message in their voice ("Hi, [Rep name] here, I've been reading through your conversation, would love to chat about [X]")
- The same WhatsApp thread continues, rep takes over. Agent does not message in this thread again unless explicitly invoked.

---

## Stage 6. First contact by rep

| Field | Description |
|-------|-------------|
| Trigger | Agent handoff complete, OR rep claims an unassigned lead, OR rep manually engages a self-created Opportunity. |
| Actor | Sales Rep |
| Capability | T14 `log_contact_communication` for conversational input parsed by A1, T70 `schedule_appointment` if a meeting is booked, T22 `generate_personalised_render` or T59 `generate_personalised_buyer_pack` if a personalised pack is being prepared. |
| Entity affected | Activities logged (calls, WhatsApps, emails), Opportunity may transition stage, Appointment created if booked. |
| Output | Rep has spoken with the buyer (or attempted to), conversation continues in the same WhatsApp thread the agent started, rep may use personal phone for calls. Goal: identify what the buyer wants, how qualified they are, when they want to purchase, book a viewing or online meeting. |
| Decision points | Stage transition based on contact outcome (rep can move to Contacted, Contacted_No_Reply, back to Qualified, or directly to Viewing Booked if appointment confirmed). Workspace can customise stage names. |
| Agent role | Pattern 2: A1 conversational input agent parses rep messages and voice notes into structured records. Agent does not message the buyer directly during this stage unless rep invokes it. |

### Two SLA rules apply from this stage onwards

**Rule 1: Rep-activity SLA.** If 1-2 days pass with zero activity on an assigned Opportunity (no calls logged, no messages, no appointment), system nudges the rep via their configured channel ("you have N opportunities with no activity in 2 days, update the CRM or take action"). The nudge gives the rep a chance to fix it without escalation. Rep can resolve by:
- Acting on the lead, OR
- Conversationally telling A1 what they've done ("I called yesterday, no answer, trying tomorrow") which logs Activities retroactively.

If activity still doesn't appear after the nudge window (workspace-configurable, default 24 hours after nudge), the issue flags to the manager. Manager dashboard shows rep-level "leads not being worked" metrics.

**Rule 2: Buyer-response SLA.** If 2-4 reach-out attempts (workspace-configurable) over the first 7 days produce no response from the buyer, Opportunity auto-transitions to Cold (or workspace-configured equivalent). Contact state moves to Cold. Opportunity drops out of the rep's active view and into a long-term marketing nurture pipeline. The specific nurture sequence is configured per workspace (separate flow).

Both rules are visible on manager dashboards. Rep-level metrics show: opportunities worked, opportunities gone cold, time-to-first-touch, conversion rate from Qualified to Viewing Booked.

---

## Stage 7. Qualification confirmation and appointment scheduling

| Field | Description |
|-------|-------------|
| Trigger | Rep has spoken with the buyer OR agent has completed qualification autonomously. |
| Actor | Sales Rep, Agent, or both |
| Capability | T12 `update_contact_details` (preferences), T13 `transition_contact_state` (Lead → Qualified), (Gap) `transition_opportunity_stage`, T70 `schedule_appointment` with calendar integration |
| Entity affected | Contact state and Opportunity stage update, Appointment created (type: viewing or online_meeting), calendar events created on rep's connected calendar and on buyer's calendar via ICS, Asset reference for any pack shared. |
| Output | Buyer committed to a viewing or online meeting at a specific time. Opportunity transitions to Viewing Booked. |
| Decision points | Whether to send a personalised pack before the meeting (rep judgment, default off, manual invocation). Whether the meeting is in-person, online, or showroom visit. |
| Agent role | Pattern 1: qualification auto-transition fires when all required fields are populated. Pattern 2: agent recommends slots from rep's calendar via WhatsApp ("I have Tuesday 2pm or Thursday 11am"), buyer picks, appointment auto-creates. Pattern 2: rep can also schedule manually after a verbal agreement. |

### Pre-meeting collateral decision

- **First meeting (discovery)**: standard collateral by default. Brochure, generic renders, project overview. No personalisation pre-meeting because finishes and style get discussed in the meeting itself.
- **Exception**: if the call or chat before the meeting was substantive enough that style and unit interest are already established, rep can manually invoke T59 `generate_personalised_buyer_pack` for a personalised pre-meeting pack. Judgment call, not automated.
- **Post-meeting collateral**: personalised pack generated after the discovery viewing once style preferences, shortlisted units, and finish discussion are captured. Becomes a follow-up Activity on the Opportunity.

---

## Stage 8. Viewing or meeting

| Field | Description |
|-------|-------------|
| Trigger | Appointment scheduled time reached. |
| Actor | Sales Rep and buyer (other attendees optional: co-buyer, partner) |
| Capability | P7 `in_meeting_personalisation` orchestrating: T20 `update_opportunity_preferences`, (Gap) `set_opportunity_configuration`, T22 `generate_personalised_render` with constraint-model-bound variants, T24 `regenerate_asset`, T59 `generate_personalised_buyer_pack` |
| Entity affected | Opportunity (preferences updated, shortlist updated, configuration variants selected), Assets generated (renders, floor plan variants), Activities logged (recording, notes, tasks created) |
| Output | Buyer has seen the project, discussed finishes and layout, shortlisted units, expressed objections or interest. Rep walks out with: structured viewing outcome, shortlist of Units attached to the Opportunity, next-step commitments, tasks for follow-up. |
| Decision points | Which Units to shortlist or remove. Which finishes and layouts to lock as the buyer's preferences. Whether the buyer is at "consider for hold" or "needs more time" or "not interested." Next step: follow-up meeting, hold request, walk away. |
| Agent role | Pattern 2: in-meeting render and floor plan customisation generated on demand from inside the CRM (rep does not leave CRM to invoke Studio). Pattern 2: post-meeting, agent parses recording transcript or rep's voice notes into structured Activities, follow-up tasks, and preference updates. |

### In-meeting capabilities surfaced inside the CRM

Reps invoke Studio capabilities from the CRM context (Project view, Unit view, Opportunity view). No mode-switching. Capabilities include:

- **Render variants** within the architectural ConstraintModel layer 2 (approved finish palette, layout variants, optional configurations). Buyer cannot ask for a balcony that doesn't exist; can ask for darker floors, alternative kitchen layout, different finish package.
- **Furniture and internal styling** are freely customisable inside the generated render. The ConstraintModel governs what's built and sold; the in-meeting render plays freely with what's decorated.
- **Floor plan annotations** showing the buyer's layout choices.
- **Side-by-side comparisons** of shortlisted Units.

### Viewing capture methods

Three input methods, all flowing into structured data:

1. **Recording the viewing**, manually captured by the rep on their device (audio file), uploaded to the Opportunity. Agent transcribes and extracts: shortlisted Units, ruled-out Units, finish preferences, style preferences, objections, next steps, follow-up tasks. **Recording requires buyer consent**, workspace setting defaults to "ask for consent before recording" with a standard disclosure prompt.
2. **For online meetings**: rep grabs the native Zoom / Meet / Teams transcript and uploads it the same way. Bricly does not build live recording infrastructure.
3. **Free-text or voice notes**, rep speaks or writes to A1 ("buyer loved PH9, hated Apt 5, wants dark floors, mortgage pre-approved, follow up Thursday"), agent parses into structured Activities, preferences, tasks, and Appointments.

### Outcome and stage transition

Rep selects the viewing outcome at close. Agent can recommend the outcome based on transcript analysis, rep confirms.

- **Engaged with shortlist**: Opportunity transitions Viewing Held → Negotiating.
- **Engaged, needs more time**: Opportunity stays Viewing Held with a substate or tag "follow-up pending."
- **Not interested in this project**: Opportunity transitions to Closed_Lost with reason. Project association may be removed if buyer wants to consider other projects.
- **Not actually qualified after all**: Opportunity transitions back to Qualified for rework, or Closed_Lost if rep determines the buyer isn't the right fit.

---

## Stage 9. Negotiating

| Field | Description |
|-------|-------------|
| Trigger | Stage 8 complete with shortlist and buyer engagement. |
| Actor | Sales Rep, with Agent assist |
| Capability | T59 `generate_personalised_buyer_pack`, T27 `share_asset`, T70 `schedule_appointment` (follow-up viewings or calls), T14 `log_contact_communication`, (Gap) `make_offer` or `counter_offer` for price negotiations, R62 `offer_chain` for tracking |
| Entity affected | Opportunity (shortlist refined, configuration variants finalised, price discussed, payment plan discussed), Offers created and tracked, Activities logged, Assets generated and shared |
| Output | Personalised buyer pack sent, buyer reviewing, price and payment terms being negotiated, finishes locked in or near-locked. |
| Decision points | Price negotiation (see "Price negotiation" below). Payment plan structure within developer's approved templates. Final shortlist collapse to one Unit when buyer commits to a specific unit. |
| Agent role | Pattern 2: agent drafts follow-up messages in rep's voice, surfaces stale Opportunities, recommends next best action. Pattern 2: render generation on demand. |

### Price negotiation

Each Unit carries two prices: **asking price** (listed publicly) and **floor price** (lowest approved price, internal only). Reps can negotiate freely between asking and floor without approval. Any price below floor requires an ApprovalRequest of type `price_exception`.

- Reps with bypass enabled can approve their own price exceptions up to a workspace-configured limit (if the developer allows it).
- Price exceptions can fire standalone (rep testing buyer's willingness before requesting hold) or tied to the hold request (one approval covering hold + price).
- Counter-offer chains are tracked via Offer entities so the full negotiation history is auditable.

### What Negotiating contains (single stage, not sub-stages)

The Negotiating stage is the work between viewing held and hold requested. Multiple things happen here (pack sent, price discussed, payment plan agreed, finishes locked) but they don't each create stage transitions. They're Activities and substate flags within Negotiating. The pipeline transition happens when a hold request is filed.

---

## Stage 10. Hold request and approval

| Field | Description |
|-------|-------------|
| Trigger | Rep determines the buyer is ready to commit to a specific Unit and files a hold request. |
| Actor | Sales Rep (request), Sales Manager (approval), or self-approve if rep has bypass. |
| Capability | T6 `place_unit_hold` creates an ApprovalRequest (type: hold). If rep has bypass, transitions immediately. Otherwise routes to manager queue. |
| Entity affected | ApprovalRequest created with `queue_position` scoped to (target_unit, type=hold). Unit transitions Available → Pending Hold (visible to other reps as held but not yet approved). Opportunity collapses shortlist to one bound Unit. |
| Output | Hold request live, position in queue assigned (1 if first, higher if others already requested holds on the same Unit). Rep notified of position. |
| Decision points | Manager approves top of queue first (not free choice), based on request timestamp ordering. SLA: workspace-configurable, default 24 hours. Manager can extend hold duration at approval time. |
| Agent role | Pattern 3: manager approval required unless rep has bypass. Pattern 1: queue position calculation, notification fan-out autonomous. Pattern 2: A1 can nudge manager via WhatsApp if SLA is at risk ("you have N hold requests pending, oldest is M hours old"). |

### Hold queue mechanics

- **Soft lock with visible waitlist.** First rep to file takes position 1, subsequent reps stack as a waitlist. Manager approves top-down, not free choice.
- **Multiple requests can stack.** If 3 reps file on the same Unit, manager sees the queue. Approving #1 changes #2 to "waitlist position 1", #3 to "waitlist position 2".
- **Lower-positioned requests don't auto-decline** when #1 approves. They wait. If the approved hold expires without converting to reservation, the next in queue is surfaced to the manager.
- **Approved hold attributes**: hold duration (workspace-configurable default, default 14 days), hold price (if negotiated below floor, requires price exception), notes.
- **Optional expression-of-interest deposit** can be required at hold (workspace setting). Small, refundable, just to filter tyre-kickers. Default off.

### Hold expiry

- 3 days before expiry, manager notified: "Hold on Unit X expires in 3 days. Current state: waitlist of N, do you want to extend?"
- Manager can extend any time before expiry (workspace-configurable grace period after expiry also allowed).
- On expiry without action: Unit transitions Held → Available, Opportunity transitions back to Negotiating, all waitlisted reps notified (their buyers now have a shot), Studio sync chain fires.

---

## Stage 11. Reservation (Promise of Sale signed)

| Field | Description |
|-------|-------------|
| Trigger | Hold approved. Rep coordinates with buyer to sign Promise of Sale and pay deposit. |
| Actor | Sales Rep (request), Sales Manager (approval), Ops (document verification) |
| Capability | T8 `convert_hold_to_reservation` creates an ApprovalRequest (type: reservation). Requires uploaded signed POS Document, proof of deposit payment, notary appointment date for the final deed. |
| Entity affected | Reservation entity created. Unit transitions Held → Reserved. Opportunity stage transitions Hold → Reserved (lifecycle remains Active, Closed_Won is reserved for the Sold transition). Documents attached. Commission accrual records may generate depending on workspace commission timing config. |
| Output | Promise of Sale formally signed. Deposit paid (typically 10%, workspace-configurable). Unit off-market with hard lock. Studio sync chain fires: website, brochure, microsite, dashboards update with the new status. Public display label shows "Promise of Sale Signed" or developer-configured equivalent. |
| Decision points | Manager approves only if all three attachments are present and valid: signed POS, deposit confirmation, notary appointment date. Ops may pre-verify documents before manager approval (two-step). |
| Agent role | Pattern 3: manager approval required. Pattern 1: hard lock activation, waitlist auto-decline, sync chain fire all autonomous on approval. |

### What happens at reservation

1. Unit state: Held → Reserved (hard lock, can't be revisited by other holds)
2. All waitlisted ApprovalRequests on this Unit auto-decline with reason `unit_reserved`
3. Reservation entity created with: deposit amount, deposit date, POS Document reference, notary appointment date, PaymentPlan reference, financing condition (subject to bank loan, X days deadline auto-populated from POS terms)
4. Commission accrual generated per workspace commission policy (see Commission timing)
5. Contact state: Active (was Qualified before)
6. Studio sync chain fires: availability list refreshes everywhere
7. PurchaserPortalAccess provisioned (Pending_Activation), invitation sent to buyer to activate their portal account

### Commission timing flexibility

Workspace setting per Partner agreement (and workspace-wide default for internal reps):

- **Pay on POS**: Commission accrues at Reserved, payable when deposit confirmed.
- **Pay on final deed**: Commission accrues at Sold, payable when final payment confirmed.
- **Split**: e.g., 50% at POS, 50% at final deed. Each tranche has its own accrual and payable trigger.

Commission record carries `status` field: Accrued, Payable, Paid.

### Reserved → Available reversal (POS collapse)

See Edge Case section. POS collapses can fire within the financing-condition window (loan failed), buyer breach, or developer breach. Single Tool `collapse_pos` handles all three with reason codes.

---

## Stage 12. POS to final deed (the wait)

| Field | Description |
|-------|-------------|
| Trigger | Stage 11 complete. POS signed, deposit paid, awaiting final deed. |
| Actor | Buyer (provides financing proof, lawyer/notary coordination), Ops (document chase, payment milestone tracking), Sales Rep (relationship continuity), Developer (construction progress) |
| Capability | T17 `track_financing_status` for the structured financing workflow, T62 `update_payment_milestone`, T64 `mark_payment_received`, P14 `assemble_deal_file`, communication via CollaborationSpace (notary, solicitor, developer, buyer) |
| Entity affected | PaymentMilestone records, financing status transitions on Reservation, Documents attached (bank loan approval, KYC, proof of funds), CompletionMilestone records updated as construction progresses, CollaborationSpace activity, PurchaserPortalAccess activity |
| Output | Deal progresses through financing approval, payment milestones, construction progress, notary preparation, until the final deed appointment. |
| Decision points | Financing approved → deal continues. Financing failed within condition window → POS collapse (see Edge Cases). Payment milestone overdue → ops escalation. Construction delay → buyer notification, possible developer-breach scenario. |
| Agent role | Pattern 1: payment milestone reminders to buyer, financing condition deadline tracking, construction update sync to buyer portal. Pattern 2: agent surfaces deal-at-risk indicators to manager (financing not approved within X days of POS, payment milestone overdue, no contact with buyer for Y days). Pattern 3: any deposit refund or material POS adjustment requires manager approval. |

### Financing tracking

Structured workflow on the Reservation:

- States: Applied → Pre-Approved → Approved → Funds Confirmed
- Each state has a date and an uploaded Document for proof
- Financing condition deadline (e.g., 60 days from POS) auto-populated from POS terms
- Rep gets reminders as deadline approaches
- If deadline passes without approval, deal flags at-risk and rep contacts buyer for status

### Stage payments

Each PaymentMilestone has:
- Amount, due date, trigger condition (date-based or construction-milestone-based)
- Status (pending, requested, paid, overdue)
- Proof of payment attachment when marked paid
- Buyer-facing visibility in PurchaserPortalAccess

Notifications fire as milestones approach. Developer marks payments received (manual confirmation), or integrated PSP confirms automatically if payment runs through the portal.

### Construction updates

Project Manager, Ops, or Developer pushes updates to the buyer portal. Manual upload of:
- Photos and videos
- CompletionMilestone marks (structural_completion, internal_works_completion, practical_completion)
- Update narrative (manual text, no AI generation in this scope)

Buyer sees these in their PurchaserPortalAccess.

### Communication

Single CollaborationSpace per Contract. Participants: developer team Users, buyer Contact, notary, solicitor, other external professionals. Per-participant role and permission scope controls message visibility:

- **Internal-only messages** (developer team only) visible to internal Users.
- **Buyer-visible updates** are pushed to the buyer.
- **Buyer cannot see notary-only or solicitor-only threads.** Buyer can see updates intentionally pushed to them.
- All messages logged as Activities on the Contract for audit.

---

## Stage 13. Sold (final deed)

| Field | Description |
|-------|-------------|
| Trigger | Final deed appointment held at notary. Final contract signed AND full payment received. |
| Actor | Sales Rep or Developer triggers, Sales Manager approves |
| Capability | T9 `mark_unit_sold` creates an ApprovalRequest (type: sold). Requires: signed final deed Document, final payment confirmation. |
| Entity affected | Unit transitions Reserved → Sold. Contract entity state moves to Completed. Opportunity transitions Closed_Won. Contact transitions Active → Past_Client. Commission payable records generate per workspace policy (full payable if accrued on POS, accrued + payable if accrued on Sold). Full Studio sync chain fires. |
| Output | Deal closed. Money settled. Ownership transferred legally. Commission settlement queued. Studio updates everywhere (website, brochure, microsite, dashboards). Public display label per developer config (Sold, Owner Occupied, or hidden). |
| Decision points | Manager approves only if both attachments present and valid. Public visibility of Sold units configurable per developer per project. |
| Agent role | Pattern 3: manager approval required. Pattern 1: sync chain, commission generation, state cascade autonomous on approval. |

---

## Stage 14. Handover

| Field | Description |
|-------|-------------|
| Trigger | Construction complete (or partial completion sufficient for handover per developer policy). Handover appointment booked. |
| Actor | Developer, Project Manager, Ops, Buyer |
| Capability | T70 `schedule_appointment` (type: handover), then (Gap) `complete_handover` on appointment outcome. |
| Entity affected | Appointment (handover) completed, Unit transitions Sold → Handed_Over (or Sold → Snagging if active defects, then → Handed_Over on snagging close). CompletionMilestone marks practical_completion and handover. SnaggingItems created if defects identified during walk-through. |
| Output | Buyer has keys and physical possession. Snagging list created if applicable. Warranty period begins. |
| Decision points | If defects exist at handover: handover still completes, defects logged as SnaggingItems for resolution in the snagging period. Buyer signs handover acknowledgement (digital signature via integrated provider). |
| Agent role | Pattern 1: notifications, milestone marks, snagging entity creation autonomous. Pattern 3: buyer's digital signature required. |

---

## Stage 15. Snagging

| Field | Description |
|-------|-------------|
| Trigger | Buyer flags a defect via the portal (or defect identified at handover walk-through). |
| Actor | Buyer (raise), Ops (triage and route), Contractor or Ops User (resolve), Buyer (confirm or dispute) |
| Capability | (Gap) `raise_snagging_item` via PurchaserPortalAccess. (Gap) `assign_snagging_item` for routing. (Gap) `resolve_snagging_item`. (Gap) `confirm_snagging_resolution` or `dispute_snagging_resolution`. |
| Entity affected | SnaggingItem entity (new), linked to Unit, Contract, CompletionMilestone (snagging_period). Activities logged. Buyer notifications fire. |
| Output | Defects tracked through to resolution. Buyer's experience post-handover stays managed. |
| Decision points | Per-defect-type routing rules (electrical → electrician, plumbing → plumber, finishing → contractor X). Configurable at workspace or project level. Severity classification (cosmetic, functional, safety). |
| Agent role | Pattern 1: routing per type, notification fan-out, status tracking autonomous. Pattern 3: snagging item close requires buyer confirmation OR manager override (with reason logged). |

### Snagging resolution loop

1. Buyer raises a SnaggingItem in the portal: description, photos, location in unit, severity.
2. System routes to default ops/handover user OR per-defect-type rule (electrical to the electrician, plumbing to the plumber, etc.).
3. Ops or contractor marks in_progress, then resolved with notes and photos.
4. Buyer reviews in portal: confirm resolved OR dispute (kicks back to open).
5. Final close on buyer confirmation, OR manager override after dispute (with reason logged).

When all SnaggingItems are resolved and the snagging_period CompletionMilestone closes, Unit transitions Snagging → Handed_Over if not already.

---

## Stage 16. Post-sale buyer portal (ongoing)

| Field | Description |
|-------|-------------|
| Trigger | PurchaserPortalAccess activated by buyer (invitation sent at Reservation, activated by buyer on first login). |
| Actor | Buyer (in portal), Developer team (push updates) |
| Capability | Portal capabilities: document vault, payment milestone tracking, construction updates, communication (CollaborationSpace), snagging, referral mechanic. |
| Entity affected | PurchaserPortalAccess (Active state), ongoing Activities, Documents, Notifications, SnaggingItems, referral Contacts (when buyer refers a friend). |
| Output | Buyer has a single white-label surface for their entire post-purchase journey. Developer relationship continues through to handover and warranty. Referral pipeline opens. |
| Decision points | Per-developer brand and content config for the portal. Per-buyer access scope. |
| Agent role | Pattern 1: most portal interactions autonomous (document visibility, milestone reminders, update publication). Pattern 2: developer reviews and approves construction update content before publication. |

### Buyer portal surface

- **Document vault**: all signed contracts, payment receipts, plans, specifications, warranty docs. Scoped to this buyer's deal.
- **Payment milestone tracking**: what's been paid, what's due, when, with payment links if PSP integration is active.
- **Construction updates**: photos, videos, milestone marks, narrative. Pushed by developer/PM/ops.
- **Customisation choices confirmation**: if buyer chose specific finishes during the sales process, those decisions visible and confirmable.
- **Communication**: CollaborationSpace thread with developer team. Notary and solicitor participate via the same space but with separate visibility rules.
- **Snagging**: raise, track, confirm or dispute resolutions.
- **Referral mechanic**: both a personalised referral link (shareable, auto-attributes to this buyer as Partner) AND a manual intro form (buyer enters name and contact, Contact created with attribution). Buyer sees their referrals and attribution status ("3 referrals, 1 in pipeline, 0 sold, €X earned so far").

---

# Part 2: State machines

## Contact lifecycle

```
(capture) → Lead → Qualified → Active → Past_Client
                ↘            ↗
                  Cold ↔ (re-engagement)
                ↘
                  Disqualified
                ↘
                  Do_Not_Contact (terminal)
                ↘
                  Spam, Duplicate (terminal / merge)
```

**Transitions:**
- Lead → Qualified: agent or rep confirms qualification criteria met
- Qualified → Active: opportunity progresses (viewing booked or beyond)
- Active → Past_Client: deal closed (Sold)
- Lead/Qualified → Cold: 2-4 reach-outs over 7 days with no response (rule 2)
- Cold → Lead/Qualified: re-engagement (manager-routed unless original rep re-engaged personally)
- Any → Disqualified: rep determines buyer isn't a fit
- Any → Do_Not_Contact: buyer opts out, GDPR request, compliance flag (terminal)
- Any → Spam / Duplicate: capture identified as junk or merged with existing

## Opportunity stage (pipeline) and lifecycle (orthogonal)

**Pipeline stages (linear, customisable per workspace):**
```
New Lead → Qualified → Viewing Booked → Viewing Held → Negotiating → Hold → Reserved → Sold → Handed_Over
```

**Lifecycle states (orthogonal to stage):**
```
Active ↔ Paused
Active → Closed_Won (at Sold)
Active → Closed_Lost (at any stage with reason code)
Closed_Won/Lost → Archived (housekeeping)
```

**Reverse transitions on pipeline stage:**
- Viewing Booked → Qualified: viewing cancelled, no reschedule yet
- Negotiating → Qualified: rep determines buyer needs more discovery
- Hold → Negotiating: hold expired without converting to reservation
- Reserved → Available (on Unit) + Opportunity to Closed_Lost: POS collapse
- Reserved → Negotiating: rare edge case (deposit returned but buyer wants a different unit) — handled as POS collapse + new Opportunity

## Unit lifecycle

```
Available → Pending Hold → Held → Reserved → Sold → Snagging → Handed_Over
                       ↘ (decline)           ↘ (collapse)
                       Available             Available
         ↘
           Off_Market (manager-triggered)
```

**Transitions:**
- Available → Pending Hold: any hold request filed (soft lock)
- Pending Hold → Held: top-of-queue approved
- Pending Hold → Available: all hold requests declined or expired
- Held → Reserved: T8 convert_hold_to_reservation approved with all required attachments
- Held → Available: hold expires without conversion, or hold released by rep/manager
- Reserved → Sold: T9 mark_unit_sold approved with signed final deed and full payment
- Reserved → Available: POS collapse via collapse_pos
- Sold → Snagging: handover walk-through reveals defects
- Sold → Handed_Over: handover complete with no active defects
- Snagging → Handed_Over: all SnaggingItems resolved
- Available ↔ Off_Market: manager-triggered withdrawal

## ApprovalRequest

```
(filed) → Pending → Approved
              ↘     ↘
                Rejected
              ↘
                Expired (SLA passed)
              ↘
                Withdrawn (requester cancels)
```

## Reservation

```
(created at POS) → Active → Completed (at Sold)
                       ↘
                         Cancelled (POS collapse)
```

## Contract

```
(created at Reservation, populated through Stage 12) → Active → Completed (at Sold)
                                                            ↘
                                                              Cancelled (POS collapse)
```

---

# Part 3: Role permissions matrix

| Action | Sales Rep | Senior Rep | Sales Manager | Marketing | Ops | Admin |
|--------|-----------|------------|---------------|-----------|-----|-------|
| Create Contact | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Create Opportunity | ✓ | ✓ | ✓ | ✗ | (if O5 enabled) | ✓ |
| View own opportunities | ✓ | ✓ | ✓ (all) | ✗ | ✓ | ✓ |
| View team opportunities | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Assign opportunity to rep | ✗ | ✗ | ✓ | ✗ | (if O5 enabled) | ✓ |
| Reassign opportunity | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Customise renders in-meeting | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Generate personalised buyer pack | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Request hold | ✓ (approval required) | ✓ (bypass on) | ✓ (self-approve) | ✗ | ✗ | ✓ |
| Approve hold | ✗ (unless bypass toggled) | ✓ | ✓ | ✗ | ✗ | ✓ |
| Override pricing within asking-floor range | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Approve price exception below floor | ✗ (unless bypass toggled) | ✓ (limit configurable) | ✓ | ✗ | ✗ | ✓ |
| Request reservation (convert hold to reservation) | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Approve reservation | ✗ | (workspace-configurable) | ✓ | ✗ | ✗ | ✓ |
| Verify documents (KYC, proof of funds) | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Approve Sold transition | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Approve POS collapse | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Approve commission payout | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Push construction updates | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Assign snagging items | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Resolve snagging items | ✗ | ✗ | ✓ | ✗ | ✓ (or external contractor) | ✓ |
| Override snagging close (after buyer dispute) | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Configure pipeline stages | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Configure routing rules | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Configure commission policies per Partner | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Configure workspace SLAs | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Manage team / invite users | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Manage roles and permissions | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

**Per-rep approval bypass toggle**: any Sales Rep can have approval bypass enabled at the user level by an Admin or Sales Manager, granting them Senior Rep equivalence on holds and reservations. Price exception bypass limits are configurable separately per user.

---

# Part 4: Studio integration touchpoints

Studio capabilities are invoked from inside the CRM. Reps and managers never leave the CRM context. The MCP server handles cross-module invocation. Studio outputs are first-class objects in CRM views.

Every Studio invocation from the CRM logs an Activity on the relevant Opportunity, Unit, or Project.

| Sales stage | Studio capability invoked | Trigger | Output | Logged where |
|-------------|----------------------------|---------|--------|--------------|
| 1 (capture) | T55 `dispatch_notification` with standard collateral | Automated first touch | Email with brochure / floor plans / price list to lead | Activity on Opportunity |
| 4 (automated first touch) | T27 `share_asset` for standard collateral | Form submission | Buyer receives requested assets | Activity on Opportunity |
| 7 (pre-meeting prep, exception path) | T59 `generate_personalised_buyer_pack` | Rep manually invokes when call/chat was substantive enough | Personalised pack | Activity on Opportunity, Asset linked |
| 8 (viewing in-meeting) | T22 `generate_personalised_render`, T24 `regenerate_asset` | Buyer requests variant live | Render variant displayed in real time | Activity on Opportunity, Asset linked |
| 8 (post-meeting) | T59 `generate_personalised_buyer_pack` | Viewing complete, rep sends follow-up | Personalised pack with shortlist, finish preferences, comparison | Activity on Opportunity, Asset linked |
| 9 (negotiating) | T22, T24, T59 | Rep iterates on personalisation as buyer narrows down | Updated renders, packs, comparisons | Activity on Opportunity, Assets linked |
| 11 (reservation) | Sync chain fires automatically | Reserved status set | Website, brochure, microsite, dashboards update | SyncEvent, Notifications, Asset state changes (Stale → Regenerated) |
| 12 (POS to deed) | Microsite update with progress | Construction milestone marked | Buyer portal reflects update | Activity on Contract, PurchaserPortalAccess view |
| 13 (sold) | Sync chain fires automatically | Sold status set | All public-facing surfaces update | SyncEvent, Notifications |
| 14 (handover) | Microsite update with completion | Handover marked | Buyer portal reflects handover | Activity on Contract, PurchaserPortalAccess view |
| 16 (post-sale portal) | Studio publishes construction updates, branding, microsite-style buyer portal | Developer pushes update | Buyer sees update in portal | Activity on Contract |

---

# Part 5: Edge cases

## Edge 1: Duplicate lead capture

System enforces no duplicate Contacts. Dedup runs on email + phone primarily, fuzzy match on name+location secondary.

- **Existing Contact, active Opportunity <60-90 days**: new capture appends to existing Opportunity as Activity. Original rep keeps the lead. Notification fires to rep.
- **Existing Contact, stale Opportunity (>workspace threshold) or Cold**: routes through manager re-engagement decision. Original rep keeps it if they personally caused the re-engagement.
- **Existing Contact in Do_Not_Contact**: capture blocked. Compliance log entry.

## Edge 2: Hold expiry

3 days before expiry, manager notified. Grace period after expiry allows manager extension.

On expiry without action:
- Unit transitions Held → Available
- Opportunity transitions Hold → Negotiating
- Original rep notified
- All waitlisted reps notified (their buyers now have a shot)
- Studio sync chain fires
- Audit trail preserved on Unit and Opportunity

## Edge 3: Multiple opportunities on the same unit

Multiple buyers shortlisting the same Unit is normal. The Unit is tracked as a shortlisted attached entity on multiple Opportunities. Conflict only arises at hold time, handled by the soft-lock waitlist queue (Stage 10).

## Edge 4: POS collapse (deal falls through after Reserved)

Single Tool `collapse_pos` handles three scenarios with reason codes:

1. **Within financing-condition window, loan failed**: clean exit per POS terms, deposit refund per contract. Reason: `financing_failed`. Contact state → Cold.
2. **Buyer breach**: buyer walks, developer keeps deposit. Reason: `buyer_breach`. Contact state → Disqualified (or workspace-configured).
3. **Developer breach or force majeure**: buyer walks, deposit refunded plus possible damages. Reason: `developer_breach`. Contact state → Active (may want a different unit).

In all three:
- Unit transitions Reserved → Available
- Opportunity transitions Closed_Lost with reason
- Commission accruals reverse if generated
- Studio sync chain fires
- **All reps with previously-waitlisted hold requests on this Unit are notified**, fair game to re-engage their buyers
- Manager approval required

## Edge 5: Lead going dark and re-engaging months later

Cold lead replies to a drip email, fills the form again, or contacts the developer directly months later.

- System detects existing Contact via dedup
- If the original rep personally caused the re-engagement (their last outbound Activity triggered the reply), the rep keeps ownership
- Otherwise: routes to manager's unassigned queue with full context (original capture, new capture, original rep activity history). Manager assigns.
- New Opportunity may be created if the original was Closed_Lost; same Opportunity reactivated (Cold → New Lead or → Re-engaged) if appropriate.

If the buyer is asking about a Unit that is now Reserved or Sold, system auto-surfaces matching alternatives from the same project (or workspace) using T70 `workspace_units_matching` or equivalent. Rep sees original interest + recommended alternatives.

## Edge 6: Rep not working assigned leads

1-2 days zero activity → nudge to rep via configured channel. Rep can act, or conversationally log retroactive activity via A1.

If no resolution within nudge window → flags to manager. Manager dashboard shows rep-level "leads not being worked" metrics.

## Edge 7: Buyer not responding

2-4 reach-out attempts (workspace-configurable) over 7 days → Opportunity auto-transitions to Cold, Contact state → Cold, drops out of active view into long-term marketing nurture.

## Edge 8: Conflicting hold requests on the same unit

Soft-lock waitlist queue (see Stage 10). First in, first served. Manager approves top of queue. Lower-position requests wait. If approved hold expires without converting, next in queue is surfaced.

## Edge 9: Price below floor

Requires `price_exception` ApprovalRequest. Manager approves unless rep has bypass with sufficient limit. Can fire standalone (testing willingness) or tied to a hold request.

## Edge 10: Payment milestone overdue

Buyer reminder fires automatically as milestone approaches and on overdue. Ops dashboard surfaces overdue milestones. Manager escalation after workspace-configurable threshold. Severe overdue = deal-at-risk flag, surfaces to manager and rep.

## Edge 11: Snagging dispute

Buyer disputes a resolved item → kicks back to open. Ops or contractor re-engages. If repeated disputes on the same item, manager can override with reason logged. Buyer is notified of override.

## Edge 12: Construction delay impacting POS timeline

If construction delays push the final deed appointment past contractual delivery dates, developer-breach scenarios may trigger. Handled via `collapse_pos` (reason: `developer_breach`) or via contractual amendment (manager-approved, logged on Reservation).

---

# Part 6: Agent role mapping

## Pattern 1: Fully autonomous (no human approval required)

- Inbound lead capture, dedup, source attribution, Opportunity creation
- Routing rule execution (project-based, capacity-aware, OOO-aware)
- Notification fan-out across channels per user preference
- Automated email and WhatsApp first touch (with 2-3 min WhatsApp delay)
- Stale-lead detection and nudge to rep (Rule 1)
- Buyer-response timeout detection and Cold transition (Rule 2)
- Studio sync chain on every commercial state change
- Hold expiry processing and waitlist notification
- Payment milestone reminder fan-out to buyer
- Construction update sync to buyer portal (post-publication)
- POS-collapse waitlist notification
- Commission accrual and payable record generation
- Snagging routing per defect type
- Re-engagement detection (who caused the reply)

## Pattern 2: Assist with human approval (agent drafts/recommends, human confirms or invokes)

- A11 inbound qualification conversation (autonomous turn-by-turn but rep can intervene, lead can request human)
- A1 conversational input parsing rep's voice/text into structured records
- Render variant generation requested by rep
- Personalised buyer pack generation (rep requests, agent generates, rep reviews before send)
- Transcript processing into structured Activities and tasks (rep reviews extracted records)
- Manager's morning approval queue context preparation (manager decides)
- Re-engagement routing (agent surfaces decision, manager assigns)
- Pipeline-stage transition recommendation after viewing (agent recommends, rep confirms)
- Deal-at-risk surfacing for managers
- Construction update narrative drafting (out of scope for this iteration; future capability)

## Pattern 3: Requires human approval (action cannot fire without sign-off)

- Hold approval (Sales Manager, unless rep has bypass)
- Reservation approval (Sales Manager)
- Price exception below floor (Sales Manager, unless rep has bypass with limit)
- Sold transition (Sales Manager)
- POS collapse with reason code (Sales Manager)
- Commission payout (Sales Manager)
- Snagging item close after buyer dispute (Sales Manager override)
- Construction delay POS amendment (Sales Manager)
- Buyer's handover acknowledgement (Buyer signs)
- Buyer's snagging resolution confirmation (Buyer confirms or disputes)

---

# Appendix: Open questions and deferred decisions

1. **Specific commission split mechanics**: how exactly to compute splits between rep, referrer, partner agency. Data model has the fields; flow doesn't define the calculation logic in this document.
2. **Long-term marketing nurture sequence**: Cold leads go into a nurture pipeline. Mechanics of that pipeline (drip cadence, content, retargeting) are a separate flow.
3. **AI receptionist phone call capability**: future Phase 2+ addition to the inbound first-touch sequence. Not in scope here.
4. **Multi-buyer / co-purchase scenarios**: data model supports Opportunity with multiple Contacts as co-buyers, but the flow above is written for single-buyer simplicity. Mechanics of co-buyer approval and signatures need a dedicated pass.
5. **Internal vs external contractor management for snagging**: snagging routes per defect type to internal Ops or external contractor. External contractor as a User type and their access scope is out of this flow's depth.
6. **PSP integration for buyer-portal payment**: payment milestone tracking is structured. Actual payment acceptance via Stripe/Mollie/local PSP is an orchestrated integration, scoped separately.
7. **Buyer portal authentication model**: PurchaserPortalAccess is the access grant entity, but the actual auth mechanism (magic link, SSO, password, MFA) and Buyer-as-Contact-not-User permission model needs detailed design.
8. **Reporting and dashboards for this flow**: this document defines the flow and state. Specific dashboards (conversion funnel per stage, time-in-stage, rep performance, project-level conversion, deal-at-risk surfacing) are a separate output.
