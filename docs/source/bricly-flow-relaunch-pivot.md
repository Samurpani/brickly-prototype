# Bricly Re-Launch and Pivot Flow

The flow that handles every significant mid-cycle change to a Project after the Launch Package has been generated and (in most cases) the Project is already in market. Covers pricing changes, unit mix changes, brand refresh or rebrand, ConstraintModel revision (revised CAD, plans, or permits), naming change, sales channel change, and pause-and-relaunch.

This is the stress test of the architecture. The CAD-to-JSON constraint model, the BrandKit foundation, the ContentBackbone, the strict cascade, the SyncEvent propagation, and the agent-bounded autonomy patterns either flex cleanly under a major change, or they don't. This document describes how they're meant to.

---

## Scope

**Start state.** Project is past Launch Package generation. Project state is Launching (launch package approved but not yet to market) or Selling (in market, leads coming in, deals in flight). BrandKit Active, ConstraintModel Approved, Assets Approved, ContentBackbone composed, Microsite either Draft (still pre-launch) or Published (in market). Optionally: CampaignBrief approved, paid campaigns Live, Opportunities at various stages including Reserved Units and a Contract or two.

**End state.** Project state intact (Selling, Launching, or transitioned to Paused/Re-Launched per the change type). The triggering change is applied to its source entity (Unit, ConstraintModel, BrandKit, ProjectDetails, CampaignBrief). Every dependent Asset, Microsite, Campaign, Opportunity, and CRM surface has been evaluated, with each item either auto-regenerated, queued for developer review, retired and replaced, or explicitly left alone. Active leads notified where the change requires it. Reserved buyers handled separately. Audit trail of the change and every downstream action preserved.

**Out of scope.** The original launch package generation. Buyer-side customisation flows on a single Opportunity (which is the Buyer Customisation flow). Routine inventory updates that are already covered by the standard sync chain (single Unit status change, single price tweak inside the standard `update_unit` Tool). This flow handles changes significant enough to warrant project-wide propagation, developer approval, and conscious lead/buyer communication.

---

## Definition

**A re-launch or pivot is any change to the Project's foundational inputs that the standard sync chain cannot resolve silently.** Either because the change touches multiple entities at once, because it invalidates Assets at scale, because it changes the buyer-facing story, because it affects in-flight deals, or because it requires the developer's marketing team to make new decisions about live campaigns and active outreach.

The standard sync chain handles inventory drift. The re-launch flow handles strategic change.

---

## Architectural principles this flow tests

Before walking through the trigger types, it's worth naming what gets exercised:

1. **The constraint chain.** Every Brief references the current ConstraintModel version. Every Asset records the version it was generated under. ConstraintModel revision should ripple through deterministically.
2. **The sync chain.** SyncEvent on a source entity propagates to dependent entities, fires Notifications, queues regeneration Briefs, refreshes Microsites. Cascade should be visible, auditable, deferrable, cancellable.
3. **Versioning.** ConstraintModel, BrandKit, ContentBackbone, Asset, Microsite, CampaignBrief all version. Old versions retire, are not deleted, support revert.
4. **Imported asset boundary.** Imported Assets flag Stale on upstream changes but cannot auto-regenerate. Developer must replace, upload a new version, or accept staleness.
5. **Agent autonomy bounds.** Pattern 1 (autonomous orchestration) on internal regeneration. Pattern 2 (proposes, developer decides) on every external publish, send, or buyer-affecting change. Pattern 3 (flags, never decides) on compliance, audit, and constraint model layer 1 overrides. Pattern 4 (conversational) on consultation sessions if a pivot needs strategic re-thinking. Strictly forbidden: auto-publishing, auto-sending to active leads, auto-changing paid campaigns, auto-overriding layer 1.
6. **Visibility-aware downstream surfaces.** Anything that was held back from the canonical public site (MCP server, agent shares, partner-facing surfaces) inherits the new state when the canonical site is updated. Held-back content still triggers a request-private-info flag.

If a trigger type below seems to violate one of these, the document calls it out.

---

## Trigger taxonomy

Seven trigger types. Each gets its own section below. All share a common envelope:

| Stage | Description |
|-------|-------------|
| 1. Detection | Either developer-initiated, agent-proposed (based on detected underperformance, market shift, inventory stall), or externally-triggered (architect re-issues drawings). |
| 2. Impact analysis | Bricly computes the blast radius: affected Units, Assets, Microsites, Campaigns, Opportunities, Reservations, Contracts. Presented to the developer before any action is taken. |
| 3. Approval gate | Developer reviews the blast radius and approves the cascade (or cancels, or scopes down). High-stakes triggers require explicit hard confirmation. |
| 4. Source entity update | The triggering entity is updated to a new version. Old version moves to Superseded (or equivalent). |
| 5. Cascade execution | Strict cascade fires through SyncEvent. Per-asset-type decisions execute. Agent orchestrates regeneration. Developer approves outputs at the appropriate gates. |
| 6. Communication | Internal notifications fire. Active leads notified per rules. Buyers under reservation handled separately. Sales team briefed. |
| 7. Active campaign handling | Live paid media and outreach evaluated. Pause, refresh, or continue with disclaimer, per the change type. |
| 8. Versioning and audit | Old versions retained. AuditEvent log captures the trigger, the approval, the cascade execution, and the outcomes. |
| 9. Revert window | Developer can revert within a configurable window per change type. Some are reversible cleanly, some are not. |

The seven triggers below differ in which source entity is touched, what regenerates, who gets notified, and whether the cascade can run autonomously.

---

## Phase 0. Detection and proposal

| Field | Description |
|-------|-------------|
| Trigger | (a) Developer initiates via a "Propose change" action on the Project, Unit, or ProjectDetails view. (b) Agent proposes via Recommendation, based on detected signal (lead-to-sale ratio below benchmark, no leads on a Unit for N weeks, cost ratio above benchmark, market signal from cross-project pattern learning). (c) External event (architect re-uploads CAD files, regulatory deadline forces creative refresh). |
| Actor | Developer or agent (proposing); developer (deciding) |
| Capability | (Gap) `propose_project_change`. Variant per trigger type. ConsultationSession (type: change_consultation) for complex pivots. |
| Entity affected | ChangeProposal (new entity, see gap list). Recommendation (already exists from Go-to-Market) for agent-proposed changes. |
| Output | Change Proposal in Draft state, attached to the Project, with proposed change payload, rationale, and a preliminary blast radius estimate. |
| Decision points | None during proposal. Developer decides at Phase 1. |
| Orchestration target | Internal. |
| Agent role | Pattern 2 for proposals (proposes, never decides). Pattern 3 for surfacing market signals (alerts but never decides). |

The proposal stage never executes anything. It puts a change on the table.

---

## Phase 1. Impact analysis and blast radius

| Field | Description |
|-------|-------------|
| Trigger | ChangeProposal created. |
| Actor | Agent + system |
| Capability | (Gap) `compute_change_blast_radius`. Reads from the entity graph: ConstraintModel, BrandKit, ContentBackbone, Assets, AssetUnitMaps, Microsites, Campaigns, Opportunities, Reservations, Contracts. |
| Entity affected | ChangeProposal (state: Draft → Analysed). |
| Output | Blast radius report: affected entities grouped by type, severity, and proposed disposition (auto-regenerate, queue for review, retire and replace, leave alone). Includes financial impact estimate (campaign spend in flight, opportunities at risk, reservations affected). |
| Decision points | None. This is informational. |
| Orchestration target | Internal graph traversal. |
| Agent role | Pattern 1 (autonomous computation). |

The blast radius output is the developer's decision surface. It exists so no developer ever approves a cascade without seeing what's about to happen.

### What the blast radius shows

- **Assets affected.** Per Asset, the source the Asset references, whether it was Bricly-generated or Imported, and the proposed disposition.
- **Microsites affected.** Project public site, personalised buyer packs, partner-shared microsites, agent-shared microsites. Per Microsite, the proposed disposition (refresh, retire, leave).
- **Campaigns affected.** Live paid creative, scheduled social posts, queued email sends. Per Campaign, the proposed disposition (pause, refresh creative, continue with disclaimer).
- **Opportunities affected.** Per Opportunity, current stage, attached Unit(s), and whether the change requires lead notification.
- **Reservations and Contracts.** Per Reservation or Contract, the change applicability (pricing changes typically do not apply to a Reserved Unit at the locked price, but the underlying record may need a note). Always require human review.
- **Internal users affected.** Reps with affected Opportunities. Marketing lead. Sales manager. Developer.
- **Held-back content.** Anything currently held back from the canonical public site that depends on a regenerated input; surfaces a request-private-info flag.

---

## Phase 2. Approval gate

| Field | Description |
|-------|-------------|
| Trigger | Blast radius computed. |
| Actor | Developer |
| Capability | (Gap) `approve_change_proposal`. Variant: `approve_change_proposal_partial` for scoped-down approval (e.g., apply pricing change to a subset of Units instead of all). |
| Entity affected | ChangeProposal (state: Analysed → Approved, Approved_Partial, Rejected). |
| Output | Approved change with explicit scope. Triggers Phase 3. |
| Decision points | Approve full, approve scoped, reject, or send back for re-scoping. For high-stakes triggers (rebrand, ConstraintModel revision, naming change), double confirmation required. |
| Orchestration target | Internal. |
| Agent role | Pattern 2 (surfaces recommendation, developer decides). |

Per-trigger gate strength:

| Trigger | Approval strength |
|---------|--------------------|
| Pricing change (subset) | Single confirmation |
| Pricing change (project-wide) | Double confirmation |
| Unit mix change | Double confirmation |
| Brand refresh | Single confirmation |
| Full rebrand | Double confirmation, with consultation session beforehand |
| ConstraintModel revision | Double confirmation (architect-side change, developer confirms downstream cascade only) |
| Naming change | Double confirmation |
| Sales channel change | Single confirmation (operational, not creative) |
| Pause and relaunch | Double confirmation, with consultation session on relaunch |

Hard rule: agents never approve any change. Pattern 1 is forbidden at this gate.

---

## Phase 3. Source entity update and cascade execution

Phase 3 is trigger-specific. Each trigger type below describes:

- The source entity update and versioning rules
- The strict cascade map (what flags Stale, what regenerates, what stays)
- The Asset-type disposition matrix
- Communication rules (internal, leads, reserved buyers)
- Active campaign handling
- Edge cases specific to this trigger

---

### Trigger 1. Pricing change

The most common change. Single Unit price, subset of Units, or project-wide.

**Source entity update.** Unit.asking_price (and optionally Unit.floor_price) updates. PaymentPlan template references update if the percentage-based plan is affected. The Unit version bumps; the previous Unit price is retained on the Unit's version history.

**Strict cascade map.**

| Dependent | Disposition | Approval gate |
|-----------|-------------|---------------|
| Project public site availability list | Auto-regenerate (ContentBackbone references update; the price displayed is structural data flowing through references) | None — structural data flow |
| Unit detail page (in microsite) | Auto-regenerate | None — structural |
| Brochure availability section | Auto-regenerate | None — structural |
| Brochure body copy referencing prices (if any) | Auto-regenerate, agent flags any sentences that named a specific price for developer review | Developer review on flagged sentences only |
| Renders | No regeneration. Price is not a render attribute. | n/a |
| Personalised buyer packs (Active, Closed_state lifecycle-tied) | Per pack, per Opportunity: agent evaluates whether the Opportunity's pack references the affected Unit at the old price. If yes, pack flags Stale and rep is notified to refresh. Auto-refresh on rep approval. Sent PDFs already with the buyer remain; the canonical link serves current pricing. | Rep approves per pack |
| Personalised buyer packs (Expired, Closed_Lost beyond grace) | No action. | n/a |
| Campaigns: paid creative referencing price | If price is in the creative (overlay, copy, ad text), flag for refresh. If price is in the landing page only, auto-update via the microsite cascade. | Developer approves new creative; campaign continues with new creative once approved |
| Campaigns: scheduled social posts mentioning price | Flag for refresh per post. | Developer approves per post |
| Campaigns: queued emails mentioning price | Flag for refresh per email. | Developer approves |
| Active Opportunities at stages New Lead → Negotiating, attached to the affected Unit | Rep notified per Opportunity. Decision per Opportunity whether to proactively notify the buyer of the price change. | Rep decides per buyer |
| Opportunities at Hold or Reserved on the affected Unit | Reservation locked the price. The Reservation record is unchanged. CRM logs an Activity noting the project-wide price change occurred while this Unit was Reserved at the locked price. | None |
| Contracts on the affected Unit | Contract terms locked at signing. Contract is unchanged. CRM logs an Activity. | None |
| Reports and dashboards | Auto-refresh. Pipeline value recalculates. | None |

**Communication flow.**

| Recipient | Channel | When | Content |
|-----------|---------|------|---------|
| Marketing lead | In-app + email | On approval | "Project-wide pricing change approved. Cascade in progress. Expected completion: N hours." |
| Sales manager | In-app + email | On approval | Same, plus list of affected Opportunities by stage |
| Sales reps with affected Opportunities | In-app + push | On approval | Per-rep summary: "Pricing on Units X, Y changed. N of your buyers are at stages where you may want to notify them. Open the Opportunity to decide." |
| Active leads (project-agnostic, at New Lead stage with no rep engagement) | None automatic | n/a | Public surfaces update; lead sees the new price organically. No proactive email. |
| Active leads (in active rep engagement, Qualified or beyond) | Rep discretion | When rep decides | Rep crafts personal message. Agent drafts in rep's voice on request. Pattern 2. |
| Buyers under Reservation | None | n/a | Reservation locked the price. No notification required. Activity logged for the developer's audit trail. |
| Buyers under Contract | None | n/a | Contract locked the price. |

**Active campaign handling.**

- **Paid creative with price overlay.** Pause within 30 minutes of approval. Refresh creative generated by Studio; once approved, the campaign resumes with new creative.
- **Paid creative without price overlay (price only on landing page).** No pause. The landing page updates via microsite cascade.
- **Scheduled social posts mentioning price.** Held in queue until refresh approved.
- **Queued email mentioning price.** Held in queue until refresh approved.

**Edge case: price was lowered, not raised.** Same flow. The "active lead notification" decision often gets a different answer from the rep (lower price is leverage for re-engagement), but the system treatment is identical.

**Edge case: pricing change applies to a subset of Units.** Approval is scoped at Phase 2. Cascade applies only to the affected Units. AssetUnitMap polygons referencing these Units do not re-map (price is not in the map), but Unit detail content refreshes.

**Edge case: price was raised and then lowered back within the revert window.** Bricly detects the reverse and offers a "revert" option in Phase 0 that skips Phase 1's full cascade by reusing the previous version. The original Asset versions are still in storage as Superseded; they can be Reactivated. Audit trail captures the round trip.

**Edge case: mid-deal price change.** A Unit is in an active Negotiation Opportunity (offer drafted, not yet accepted) when the project-wide price changes. The Offer's price field is not auto-updated. Rep is notified specifically: "Your Offer on Unit X is at the old price; the new project price is Y. Update the Offer?" Rep decides.

**Agent role.** Pattern 1 for ContentBackbone reference updates, microsite cascade, brochure refresh, dashboard recalculation. Pattern 2 for creative refresh approval, rep-to-buyer communication. Pattern 3 for compliance flags on price claims in jurisdictions with regulated pricing language. Forbidden: auto-sending any communication to a buyer, auto-pausing campaigns without surfacing the recommendation.

---

### Trigger 2. Unit mix change

Combining two units into one. Splitting one unit. Adding new units. Removing units. All four are structural and reach further than pricing changes, because they touch the ConstraintModel layer 1, AssetUnitMaps, FinishPackage availability per Unit, and potentially the Building geometry.

**Source entity update.** Depending on sub-type:

- **Combine.** Two Units enter state Merged. A new Unit is created with combined sqm, aspect, and structural layout. The original Units are retained for audit but state Merged → not surfaceable. Reservations, Contracts, or active Opportunities on the original Units block the operation until they are resolved or transferred.
- **Split.** One Unit enters state Split. Two new Units are created with the split structural layout. Original Unit is retained, state Split, not surfaceable. Same block on existing Reservations, Contracts, active Opportunities.
- **Add.** New Unit(s) created. Architect file may need to be re-uploaded if the new Unit is on a level not previously specified; otherwise the Unit is defined within the existing ConstraintModel. ConstraintModel does not version unless layer 1 layout rules change.
- **Remove.** Unit state transitions to Off_Market with a removal reason. Unit is retained for audit; not surfaceable. Cannot be removed if state is Reserved, Sold, Snagging, or Handed_Over.

**Strict cascade map.**

| Dependent | Disposition | Approval gate |
|-----------|-------------|---------------|
| ConstraintModel | If the change requires architect drawings (combine, split, add on a new level), ConstraintModel re-extracts. New version, state Pending_Review. If the change is metadata-only (e.g., remove an off-market unit), no ConstraintModel change. | Developer approves new ConstraintModel version (T16) |
| AssetUnitMaps on exterior renders | Stale. Polygons need re-mapping. Auto-mapping pipeline re-runs, low-confidence mappings flag for review. | Developer approves re-mappings |
| AssetUnitMaps on level floor plans | Stale. Same as above. | Developer approves |
| Unit detail pages | Per affected Unit: Removed → page taken down. Combined/Split → new unit pages generated, old pages retired. Added → new pages generated. | Developer approves new pages |
| Availability list (microsite, brochure) | Auto-regenerate | None — structural |
| Renders | Generally no regeneration unless the Unit mix change implies a ConstraintModel layer 1 change (Combine/Split that affects building geometry visible in exterior renders is rare but possible). If yes, full Phase 2 render regeneration kicks in for affected shots. | Developer approves per render |
| FinishPackage availability per Unit | Re-evaluate per new Unit. Defaults inherit from project default; developer may override per Unit. | Developer reviews per new Unit |
| Personalised buyer packs on a Combined/Split/Removed Unit | Pack composition references the original Unit. Pack flags Stale. Rep is notified. For Removed: the Unit detail is replaced with a "this unit is no longer available" notice and the pack offers comparable alternatives. For Combined/Split: rep must decide whether to refresh with the new Unit identity or close the Opportunity. | Rep decides per pack |
| Active Opportunities on a Combined/Split Unit | These are the blocker that prevents the operation until resolved. Developer is forced to address: transfer the Opportunity to the new Unit (Combined), let the rep pick which split half (Split), or close the Opportunity and refund any deposits (Removed before reservation). | Developer + rep + manager |
| Reservations and Contracts on affected Units | Same blocker. Cannot execute the Unit mix change while there is an active legal commitment on the original Unit. Developer must resolve via legal action (Contract amendment) before the Unit mix change can proceed. | Forced gate; no cascade attempted until cleared |
| Campaigns: paid creative referencing specific Unit | Per creative referencing the affected Unit, flag for refresh or pause. | Developer approves |
| Campaigns: at the unit-level phase (phase_3_unit creative from Go-to-Market) | If a Unit is Removed and was the subject of phase_3 creative, pause that creative. If a Unit is Added, agent proposes phase_3 creative for the new Unit on appropriate timing. | Developer approves |
| Reports and dashboards | Auto-refresh. Total Unit count, total sellable inventory, pipeline value all recompute. | None |

**Communication flow.** Same envelope as pricing, with these additions:

- Reps with active Opportunities on Combined/Split/Removed Units are notified specifically with the resolution required.
- Buyers under active engagement on a Combined/Split/Removed Unit are notified at rep discretion, but the rep must address it within a configurable window (default 48 hours) or the manager is escalated.
- Public surfaces (project public site, partner shares, MCP server) reflect the new mix once the cascade approves.

**Active campaign handling.** Paid creative pauses on affected Units only. Other campaigns proceed.

**Edge cases.**

- **Combining two Units, both have active Opportunities.** The two Opportunities cannot both attach to the new combined Unit. Manager is escalated to choose, with audit trail.
- **Splitting a Unit, one half is reserved.** Not permitted at all. The Reservation must be resolved or transferred first.
- **Adding a Unit that is structurally distinct from the existing ConstraintModel layer 1.** Triggers a full ConstraintModel revision flow (see Trigger 4).
- **Removing a Unit that was the subject of a recent Activity from a lead.** Lead is notified by rep that the Unit is no longer available; agent suggests alternatives.

**Agent role.** Pattern 1 for ContentBackbone updates, AssetUnitMap re-mapping, dashboard recomputation. Pattern 2 for re-mapping approval, new Unit detail pages, paid creative refresh. Pattern 3 for legal blocker surfacing (Reserved or Contracted Units). Forbidden: auto-resolving active Opportunities or Reservations on affected Units.

---

### Trigger 3. Brand refresh or rebrand

Two sub-types with very different blast radius.

- **Brand refresh.** Adjustments to art_direction, tone of voice, or surface treatment within the existing BrandKit. New BrandKit version, but same brand identity. Logo and palette may or may not change.
- **Rebrand.** Full replacement of the BrandKit. New name, logo, palette, typography. Effectively a new visual identity. Treated as a near-restart of the brand-dependent parts of the launch package.

**Source entity update.** BrandKit version bumps. Previous BrandKit moves to Superseded. The new BrandKit may be generated through a fresh ConsultationSession (Mode A part 2 and Mode B from the launch package flow) or imported. The previous BrandKit is retained in version history.

**Strict cascade map.**

| Dependent | Disposition (Refresh) | Disposition (Rebrand) |
|-----------|------------------------|------------------------|
| Renders (exterior, interior, aerial) | Stale if art_direction changed (colour grading, lighting profile). Auto-regeneration via Phase 2b/2c pattern of the launch package. | Stale all. Full Phase 2 regeneration. Mandatory. |
| FinishPackage variant renders | Stale if art_direction changed. | Stale all. |
| FaceTransitionVideos | Stale if art_direction changed. | Stale all. |
| Brochure | Brand surface regenerates from ContentBackbone with new BrandKit applied. Body copy generally stable unless tone of voice changed substantially. | Full regeneration. New name, new visual identity, new tone. |
| Project public site (microsite) | Brand layer regenerates. Content stable. | Full regeneration of brand layer; content may need a refresh pass. |
| Personalised buyer packs (Active) | Stale. Refresh on rep approval, per pack. | Stale. Refresh required, per pack, on rep approval. |
| Personalised buyer packs (sent PDFs) | Buyer's downloaded copy is unchanged. Canonical link reflects current version. | Same. Note: a rebrand creates a meaningful inconsistency between a PDF a buyer holds (old brand) and the link they may revisit (new brand). Rep is alerted to consider proactively reaching out. |
| Logo and brand on CRM surfaces | Refresh immediately on BrandKit Active. | Same. |
| Email signatures and templates inheriting BrandKit | Refresh. | Same. |
| Paid creative | Pause all live campaigns. Refresh creative required. | Same, but with a longer pause expected because the refresh is full Phase 2a/2b style approval. |
| Scheduled social posts | Hold all. Regenerate per post. | Same. |
| Project name (if changed) | All references update: domain, microsite, brochure, paid creative, social, email. URL of public site changes (with 301 redirect from old URL). Buyer-facing rename communication required. | Always changes; treated as part of Trigger 6. |
| Active Opportunities | No direct field change. Rep is notified of the brand change so any follow-up communication uses the new brand. | Same. Bigger emphasis on rep briefing because the buyer's frame of reference is the old brand. |
| Reservations and Contracts | Contract documents reference the developer entity, not the project's brand name typically. If the project name changed (Trigger 6), an addendum or notice may be required per the developer's legal practice. | Same. Legal review recommended. |
| Reports and dashboards | Brand surfaces refresh. | Same. |

**Communication flow.**

- **Internal first.** Marketing lead approves the new BrandKit. Sales manager briefed. All reps briefed with the new brand assets and a talking-points doc auto-generated from the BrandKit's tone of voice and persona definitions.
- **Active leads at New Lead stage with no rep engagement.** No proactive notification. Public surfaces update; the lead sees the new brand organically.
- **Active leads at Qualified or beyond.** Rep discretion. For a rebrand, agent strongly suggests proactive outreach with a short note. Pattern 2 (agent drafts, rep approves).
- **Buyers under Reservation.** Rep proactively notifies, especially on a rebrand or name change. Sample message auto-drafted.
- **Buyers under Contract.** Manager and ops handle. Legal review on whether a formal notice is required per jurisdiction.

**Active campaign handling.**

- **Refresh.** Pause live paid creative briefly while creative refreshes. Cost ratio dashboard captures the spend gap.
- **Rebrand.** Pause all campaigns, all outreach, all scheduled posts. Treat as a near-relaunch. Re-activate the campaign on the new BrandKit cascade completion with developer approval.

**Edge cases.**

- **Imported BrandKit being refreshed.** Imported Assets that were uploaded under the old BrandKit flag Stale but cannot auto-regenerate. Developer must replace, upload new, or accept staleness. Surfaced explicitly in the blast radius.
- **Rebrand mid-campaign with a major spend commitment in flight.** Agent flags the financial impact in the blast radius. Developer decides whether to pause and absorb the spend gap, or accept the unusual situation of a campaign in the old brand for a defined window with rebrand campaign starting in parallel. The latter is operationally messy and discouraged but not blocked.
- **Rebrand because the original brand was contested (legal challenge, IP dispute).** Higher urgency. Compliance flag surfaces. Developer can shortcut the consultation in favour of a fast import of replacement assets.
- **Rebrand affects Persona definitions.** Personas are part of the BrandKit. Updated Personas ripple into Campaign targeting (CampaignBrief Block 5) and Opportunity persona-matching logic if used. Agent flags affected Campaigns.

**Agent role.** Pattern 4 (conversational) for rebrand consultation. Pattern 2 for selection and approval. Pattern 1 for cascade orchestration once approved. Pattern 3 for surfacing legal and compliance implications.

---

### Trigger 4. ConstraintModel revision (architect-issued)

The architect issues revised CAD files. ConstraintModel re-extracts. This is the case where the architect's truth has changed, which by design Bricly cannot override.

**Source entity update.** ArchitectFile re-uploaded (T3). ConstraintModel re-extracts via the vision API pipeline. New version, state Pending_Review. Developer reviews and approves via T16 `approve_constraint_model_version`. Old version moves to Superseded.

**Strict cascade map.**

| Dependent | Disposition |
|-----------|-------------|
| Renders generated under the old ConstraintModel | Stale. Vision verification fails against the new layer 1. Regenerate via Phase 2 pipeline. |
| FinishPackage variant renders | Stale if layer 1 attributes touching the interior (ceiling heights, openings, services routing) changed. Otherwise valid. Agent computes per render based on changed attributes. |
| AssetUnitMaps | Stale on exterior renders if building geometry changed. Stale on level floor plans if level layout changed. Re-mapping required. |
| Floor plan graphics | Stale. Regenerate from new architect files. |
| Brochure | Body referring to specific layout features may need a copy refresh. Renders within the brochure flag Stale; brochure rebuilds from refreshed content. |
| Project public site | Renders, floor plans, technical specs regenerate. Content flags for review where the architect's revision changes a stated specification. |
| Personalised buyer packs | All Active packs flag Stale. Layer 3 selections (FinishPackage, layout variant, free-draw annotations) must be re-validated against new layer 1 modifiable zones. Annotations outside new modifiable zones are flagged for rep + buyer attention. |
| Active Opportunities at any stage on units whose constraint model materially changed | Rep + manager notified. Decision per Opportunity whether the change affects the buyer's decision. |
| Reservations and Contracts | Forced gate. A ConstraintModel revision that materially alters a Reserved or Contracted Unit's stated specification is a contractual matter. Developer's legal team handles. Cascade pauses on those Units until legal disposition is recorded. |
| Imported Assets | Stale. Cannot regenerate. Developer must replace. Surfaced explicitly. |
| Campaigns | Live paid creative referencing the affected aspect of the building flagged for review. Spec-claim creative (sqm, layout, view) pauses until verified against new layer 1. |
| ConsultationSessions in flight | Reference the old ConstraintModel version. Notified; can continue or restart on developer's call. |

**Communication flow.**

- **Marketing lead and sales manager** are first. Architect-issued revisions are unusual and high-impact; the cascade is significant.
- **All reps** briefed with the changes (agent generates a comparison summary: "What changed between v1 and v2 of the constraint model").
- **Active leads at Qualified or beyond on an affected Unit** notified by the rep proactively, with the agent-drafted explanation in the rep's voice.
- **Reserved or Contracted buyers** handled by the developer's legal practice. Bricly logs the change and notification status but does not auto-send to these buyers.

**Active campaign handling.**

- **Creative making a specification claim about the affected aspect.** Pause immediately. Refresh once verified.
- **Brand creative without specification claims.** Continue.

**Edge cases.**

- **The revision invalidates approved renders that already drove deals.** Bricly does not undo deals. Audit trail captures the revision and which deals were closed under the old constraint model. Legal handles. Renders in the old buyer packs already with buyers remain in those PDFs.
- **Revision is minor (e.g., a setback adjustment that doesn't affect visible building geometry).** Agent computes which Assets are actually affected based on attribute-level diff. Many Assets may not need regeneration. Developer sees a tight, accurate blast radius.
- **Revision is major (e.g., entire floor plan re-issued).** Approaches full re-run of Phase 2 of the launch package. Developer is warned in the blast radius.
- **Developer wants to reject the new ConstraintModel and stay on the old one.** Not permitted. The architect's truth is authoritative for layer 1. Developer can negotiate with the architect to re-issue the drawings, which restarts the revision flow.

**Agent role.** Pattern 1 for extraction and verification. Pattern 3 (proposes only on layer 1 of the constraint model, never decides). Pattern 2 for downstream Asset approvals. Pattern 4 for re-running consultation if the revision is substantial enough to warrant a brand or content rethink.

---

### Trigger 5. Naming change

The development changes name. Sometimes paired with a rebrand, sometimes not. When it stands alone, it's still high-impact because every reference updates.

**Source entity update.** Project.name updates. Building.name(s) may update. New name version recorded on Project; old name retained in version history. Microsite slug and domain considerations addressed (see below).

**Strict cascade map.**

| Dependent | Disposition |
|-----------|-------------|
| Project public site URL | If on a Bricly-hosted subdomain (project-name.bricly.io), URL changes. 301 redirects auto-configured on old URL. If on a developer custom domain, developer decides whether to keep the existing domain or change it (developers often keep the domain even after a name change for SEO continuity). |
| Brochure cover and all brochure references | Regenerate. |
| Project public site copy, headers, meta tags | Regenerate. |
| All Assets with the project name baked in (renders rarely; brochure pages and social posts often; ad creative usually) | Per Asset, flag for refresh. Renders with text overlay or watermark of project name need re-rendering; clean renders without overlay do not. |
| Personalised buyer packs | Pack header refreshes. PDF content updates. Sent PDFs unchanged. |
| Paid creative referencing the old name | Pause. Refresh creative. |
| Social posts referencing the old name | Hold. Regenerate per post or accept that old posts retain the old name (the developer chooses per post). |
| Email content referencing the old name | Hold queued. Refresh. Sent emails unchanged. |
| Search engine indexing | Bricly initiates re-submission of the new sitemap and 301 redirects. |
| Active Opportunities | Reps notified to use the new name in outbound communication. No retroactive activity rewriting. |
| Reservations and Contracts | Legal review. Contract documents reference the legal property description and developer entity, not the marketing name typically, but jurisdiction varies. Some jurisdictions require a notice or addendum to buyers under Reservation or Contract. Developer's legal practice handles. |
| Lead capture forms | UTM and tracking parameters may include the old name. Update where the data flows can be retagged cleanly; otherwise tag the rename in attribution reporting. |
| Workspace.CorporateBrand reference | Unaffected (the project name change is project-scoped). |
| Reports and dashboards | Display new name. Historical data labelled with the name at the time. |

**Communication flow.**

- **All internal users** notified in advance of the change date. Reps especially because their outbound communication needs to switch consistently.
- **Active leads at Qualified or beyond** notified by the rep with a personal message ("The project formerly known as X is now Y. Same development, same location, same units."). Agent drafts.
- **Reserved buyers** proactively notified. The continuity of identity matters more here because they've made a financial commitment.
- **Contracted buyers** handled by the developer's legal practice.

**Active campaign handling.**

- **Pause all paid creative referencing the old name.** Bricly switches creative to the new name as it's approved.
- **Scheduled social posts.** Hold and refresh.
- **Domain redirects in place** before any active campaign resumes, to avoid broken landing pages.

**Edge cases.**

- **The new name is contested or has a competing trademark.** Compliance flag. Developer is warned. Naming change is paused until legal review confirms.
- **The name change is part of a rebrand.** Combined with Trigger 3. Single approval covers both.
- **The old name is on physical signage at the development site.** Outside Bricly's scope. Activity logged so developer remembers to update physical assets.

**Agent role.** Pattern 2 for cascade approvals. Pattern 1 for orchestration. Pattern 3 for legal and trademark surfacing.

---

### Trigger 6. Sales channel change

Switching from agent-led to direct sales, or vice versa. Or adding agents to a previously direct-only model. Or changing the agent partner mix.

**Source entity update.** Workspace's lead routing rules update. Partner entities are activated or deactivated. Commission terms update. SalesChannelConfig (new entity or attribute set, see gap list) records the active channel mix per Project.

**Strict cascade map.**

| Dependent | Disposition |
|-----------|-------------|
| Lead routing rules | Update per new channel mix. New routing logic applies to new leads from approval onwards. |
| Existing leads in flight | Stay with current rep or partner per first-touch-wins rule. Not retroactively reassigned. |
| Existing Opportunities | Stay with current attribution. Not retroactively reassigned. |
| Commission terms | New leads routed under new commission terms. Existing Opportunities retain the commission terms in force at capture. |
| Partner-facing surfaces (partner microsite, MCP server visibility, partner shares) | Activate or deactivate per change. New Partners get onboarded. Departing Partners are notified and have a wind-down window for any in-flight Opportunities they sourced. |
| Project public site | Lead capture form behaviour may change. If switching to agent-only, the form may route differently or close to direct enquiries. If switching to direct, agent referral CTAs may be removed. |
| Brochure and renders | No regeneration. Channel change is operational, not creative. |
| Personalised buyer packs | Largely unaffected. The rep or partner generating the pack continues; new packs follow the new channel rules. |
| Active campaigns | No automatic pause. Targeting may update (if channel change implies different audience). Lead form integrations may need re-pointing. |
| Reservations and Contracts | Untouched. Commissions on closing Reservations honour the terms in force at capture. |
| Compliance | Some jurisdictions require specific disclosures about direct sales vs intermediated sales. Compliance pre-flight verifies. |

**Communication flow.**

- **Internal team** briefed. Reps and partners specifically.
- **Departing Partners** receive a formal notice with wind-down terms.
- **New Partners** receive onboarding instructions.
- **Active leads.** No notification unless the channel change affects their experience (e.g., their current point of contact is being changed, which would be handled as a rep handover).
- **Reserved and Contracted buyers.** No notification. The relationship is locked in.

**Active campaign handling.** Continue. Channel change is back-office.

**Edge cases.**

- **Switching from agent-led to direct mid-cycle when agents have unfilled pipelines.** Partner wind-down window is critical. In-flight Opportunities the partner sourced are honoured.
- **Adding partners after a direct-only launch.** Partner-facing assets (partner microsite, MCP server resources scoped for partner) need first-time generation. Treat as a sub-flow of partner onboarding rather than a full re-launch.
- **Conflict between an existing direct lead and a new partner-sourced lead on the same Unit.** Handled by the existing soft-lock waitlist queue and first-touch-wins dedup. No special handling.

**Agent role.** Pattern 2 for partner onboarding and offboarding approvals. Pattern 1 for routing rule updates and lead form integration changes. Pattern 3 for compliance surfacing.

---

### Trigger 7. Pause and re-launch

The developer pauses the Project for an extended period (regulatory hold, financing renegotiation, construction delay), then later re-launches. This is the largest-scope trigger because the time elapsed may invalidate brand timing, market positioning, creative freshness, and lead nurture sequences.

**Source entity update.** Project state Selling → Paused (or Launching → Paused before any market activity). On re-launch, Project state Paused → Selling, with a new launch_phase reflecting the relaunch (typically a soft launch_phase = "relaunch_warmup" before going back to launch_phase = "launch").

A re-launch typically triggers a new ConsultationSession (Mode: relaunch consultation) which may surface that other Triggers (pricing, brand refresh, naming change) should fire as part of the re-launch.

**Strict cascade map (Pause).**

| Dependent | Disposition |
|-----------|-------------|
| All paid campaigns | Pause. Spend stops. |
| All scheduled outreach (emails, social posts) | Hold. |
| All Active Opportunities | Stay open. Reps are briefed on the pause and instructed on how to communicate with active leads. |
| Active leads at Qualified or beyond | Rep proactively notifies with the pause context and the expected re-launch window. Agent drafts. Pattern 2. |
| Reservations and Contracts | Continue under their existing terms. Pause does not affect them. |
| Project public site | Either remains live as-is (developer choice) or transitions to a "this development is currently paused, leave your details to be notified when we re-open" state. Default is the latter. |
| Personalised buyer packs | Active packs remain accessible. Sent PDFs unchanged. Engagement signals continue to log. |
| Brand and Assets | Stay as they are. No regeneration. |
| Reports and dashboards | Reflect Paused state. Pipeline value is held at the moment of pause. Forecasting suspended until re-launch. **Cost ratio dashboard freezes at the pause moment**, displayed as "Paused at X% on date Y". On re-launch, a new measurement period begins; the old period is retained for reference. |
| MCP server, partner shares, agent shares | Inherit pause. Public-visible state matches the canonical site. Held-back content remains held back. |

**Strict cascade map (Re-launch).**

| Dependent | Disposition |
|-----------|-------------|
| Re-launch consultation | Mandatory. Developer selects from a structured catalogue of common re-launch scenarios (see below) which pre-loads the consultation with the relevant questions, defaults, and sub-triggers. Agent then walks the developer through: any pricing change needed, any brand refresh, any naming change, any constraint model revision (especially if the pause was for design rework), any sales channel change. The consultation outputs zero or more sub-triggers from this flow that fire as part of the re-launch. |
| Sub-trigger fires | Each sub-trigger goes through its own Phase 1 to Phase 3 cascade within the re-launch envelope. |
| Active leads at Qualified or beyond | Notified at re-launch with whatever is appropriate (new pricing, new name, new brand, new units). |
| Cold leads from before the pause | Re-engagement decision per the standard Cold-lead handling in the Sales Process flow. Bulk re-engagement campaign may be approved as part of the re-launch CampaignBrief refresh. |
| Reservations and Contracts | Continue as they are unless a sub-trigger affects them. |
| New CampaignBrief | Strongly recommended. Old CampaignBrief is unlikely to remain accurate after an extended pause. |
| All paid campaigns | Re-activated under the new CampaignBrief with refreshed creative. Approval gate. |
| Project public site | Re-published with re-launch content. Approval gate. |
| Audit trail | Captures the pause start, the pause end, the re-launch consultation, and every sub-trigger that fired. |

**Common re-launch scenarios catalogue.** Presented as a dropdown at the start of the re-launch consultation. Selecting a scenario pre-loads the consultation with the relevant questions, defaults, and sub-trigger suggestions. Developer can deviate from defaults at any point.

| Scenario | Typical sub-triggers | Pre-loaded defaults |
|----------|----------------------|----------------------|
| Returning after construction pause | Possible pricing change (market shift over pause window), possible brand refresh, fresh CampaignBrief | Refresh creative even if no other change. Lead re-engagement campaign defaulted on. |
| Returning after design rework (architect revisions during pause) | ConstraintModel revision (mandatory, completed during pause), possible Unit mix change, refreshed renders and brochure, fresh CampaignBrief | Forces ConstraintModel cascade first. Reservations and Contracts handled by legal practice. |
| Returning after permit or regulatory hold | Possible naming change (if regulator required), compliance pre-flight re-run across all jurisdictions, possibly fresh CampaignBrief | Compliance flag stays on the Project until cleared in writing. |
| Returning after financing renegotiation | Possible pricing change (new financing terms may shift price floor), possible PaymentPlan changes, fresh CampaignBrief | Defaults price review on. PaymentPlan templates flagged for update. |
| Returning after slow market / re-positioning | Pricing change likely (often reduction), possible brand refresh, fresh CampaignBrief, possible channel change | Defaults price review on. Lead re-engagement campaign defaulted on. |
| Returning after partial sell-out hold | No major changes expected. Refresh availability, refresh creative for remaining inventory phase (Go-to-Market phase_2_segment or phase_3_unit). | Inventory recalculation defaulted on. Creative phase aligned with remaining sell-through. |
| Returning after legal dispute or IP challenge | Naming change likely, rebrand likely, fresh CampaignBrief | Defaults naming change and rebrand consultations on. |
| Returning after corporate restructure | Possible channel change, possible commission terms update, partner notifications | Defaults channel review on. Partners receive a manual notification. |
| Clean re-launch (no specific reason, developer choice) | Whatever the developer chooses. No pre-loaded defaults beyond fresh CampaignBrief. | Empty consultation, all questions optional. |

**Communication flow.**

- **At pause.** All internal users. All active leads at Qualified or beyond. Reserved and Contracted buyers receive a formal note from the developer's team (not auto-sent by Bricly without explicit approval).
- **At re-launch.** All internal users. All previously-active leads with explicit consent to re-engage. Reserved and Contracted buyers if any sub-trigger affects them.

**Active campaign handling.** Total pause. Re-activation requires full creative refresh and developer approval.

**Edge cases.**

- **Pause is short (under 30 days).** Developer can elect to keep the public site live and pause only paid campaigns. Treated as a partial pause.
- **Pause is forced by regulatory action.** Compliance flag stays on the Project until cleared.
- **During pause, the architect issues revised drawings.** ConstraintModel revision fires (Trigger 4) within the pause, so the re-launch consultation references the new ConstraintModel from the start.
- **Re-launch is intended as a fresh start with a new name and new brand.** Sub-triggers fire in sequence: rebrand → naming change → new CampaignBrief → re-launch. Audit trail makes it clear this was a strategic relaunch, not a marketing reset.

**Agent role.** Pattern 4 (conversational) for pause briefing and re-launch consultation. Pattern 2 for every approval gate. Pattern 1 for orchestrated cascade on each sub-trigger. Pattern 3 for surfacing risks of an extended pause (lead decay, partner relationship strain, regulatory deadlines).

---

## Phase 4. Cascade execution

Once Phase 2 approves and Phase 3 cascade map is locked, execution runs. This phase is largely Pattern 1 (autonomous orchestration) for Bricly-generated Assets, Pattern 2 for any output that crosses an approval gate before publishing or sending.

### Execution model

- **SyncEvents fire in dependency order.** ConstraintModel first if applicable, then BrandKit, then ContentBackbone, then Assets, then Microsites, then Campaigns. Within a layer, parallel where possible.
- **Per-Asset disposition is computed at Phase 1 and locked at Phase 2.** Execution honours the locked disposition.
- **Regeneration uses existing patterns.** Phase 2a/2b for renders. T20 `create_and_submit_brief` for new Briefs. T24 `regenerate_asset` for individual Asset refresh. Three silent regenerations on vision verification failure, then internal escalation.
- **Approval gates per Asset type.** Renders: per-render. Brochure: full document review. Microsite: full review. Paid creative: per creative review.
- **Imported Assets do not auto-regenerate.** Stale flag fires. Developer must replace.
- **Progress is visible.** Developer sees a live cascade progress view per Project: which Assets are regenerating, which are queued, which are awaiting approval, which are completed.

### Failure handling

- **Vision verification fails on a regenerated render.** Same pattern as launch package: three silent retries, then internal escalation. The rest of the cascade continues. The failed render slots in once resolved.
- **External tool failure (Midjourney, Canva, Kling, ad platforms).** Brief state Failed. Agent retries with backoff. After N failures, escalation to Bricly internal team. Developer sees the affected Assets in a "we're working on this" state.
- **Partial cascade failure.** Some Assets complete, others fail. The cascade does not block on partial failures (avoids holding up the whole project). The cascade summary at the end shows what completed, what failed, what's queued. Developer can retry failed items individually.
- **Cancellation.** Developer can cancel an in-flight cascade. Already-regenerated Assets stay; pending regenerations are dropped; superseded Assets revert. Audit trail captures the cancellation.

---

## Phase 5. Internal communication

| Recipient | What they get | Channel |
|-----------|---------------|---------|
| Developer (the requester) | Confirmation that the cascade completed (or didn't), full audit summary, list of remaining approvals required | In-app + email |
| Marketing lead | Cascade summary, list of approvals needed from them | In-app + email |
| Sales manager | Cascade summary, briefing on affected Opportunities and any rep-level actions required | In-app + email |
| Sales reps | Per-rep summary: which of your Opportunities are affected, which buyers may need a personal note, what to say | In-app + push |
| Ops | Cascade summary if it affects any Contracted Units (legal review may be required) | In-app + email |
| Partner reps | If sales channel includes Partners and the change affects partner-shared surfaces, the developer has the option to send a manual notification (email or in-platform notice) summarising the changes. Not auto-sent. The developer composes or accepts an agent-drafted note, selects which Partners to notify, and sends. | Partner-facing notification, developer-triggered |

Briefing documents auto-generated:

- **Sales rep briefing.** A talking-points doc, sourced from the BrandKit's tone of voice and the change context. "Here's what changed, here's how to talk about it with a buyer in stage X, here's what to avoid saying."
- **Cross-team change log.** A single source of truth for the change, accessible to everyone, with timestamps, approvers, and outcomes.

---

## Phase 6. Lead and buyer communication

Treated separately because lead and buyer notification is high-stakes and never autonomous.

### Active lead notification matrix

| Lead state | Pricing change | Unit mix change | Brand refresh | Rebrand | Constraint revision | Naming change | Channel change | Pause | Re-launch |
|------------|----------------|------------------|---------------|---------|----------------------|----------------|-----------------|-------|-----------|
| New Lead (no rep engagement) | No proactive | Their Unit removed → notify; otherwise none | None | None | None | None proactive | None | Pause status visible on site | Re-engagement campaign |
| Qualified | Rep discretion | Always notify | None | Notify | Notify if their Unit affected | Notify | None | Notify | Notify |
| Negotiating | Always notify | Always notify | Notify | Notify | Always notify | Notify | None | Notify | Notify |
| Offer / Hold | Always notify | Forced (legal block) | Notify | Notify | Always notify | Notify | None | Notify | Notify |
| Reserved | Activity logged; Reservation locked | Forced (legal block) | Notify (cont. of relationship) | Notify | Legal review | Notify | None | Formal notice | Notify |
| Contracted | Activity logged; Contract locked | Forced (legal block) | Notify (cont. of relationship) | Notify | Legal review | Notify | None | Formal notice | Notify |

**Notification mechanics.**

- All buyer-facing notifications go through the rep or the developer's legal practice (for Reserved or Contracted). Bricly never auto-sends to a buyer without rep approval.
- Agent drafts the message in the rep's voice (Pattern 2). Rep reviews, edits, and sends through the buyer's preferred channel.
- One per-buyer message at a time. Bricly does not bulk-send to leads from this flow. Bulk outreach to active leads on a change (e.g., a price-reduction newsletter) is a manual operation handled outside the change cascade, typically by the developer's marketing lead or admin, using the standard outreach tools.
- The one ambiguous case: a price reduction across many active leads, where the developer wants to send a single announcement email. The flow does not own this. The developer or admin composes and sends the announcement manually through the standard email outreach path. Bricly logs the change in the audit trail; the announcement is a separate, manual event.

---

## Phase 7. Active campaign handling

Summary table across all triggers:

| Trigger | Paid creative | Scheduled posts | Queued emails | Lead capture | Microsite |
|---------|---------------|------------------|----------------|---------------|-----------|
| Pricing change (creative references price) | Pause, refresh, approve, resume | Hold, refresh | Hold, refresh | Continue | Refresh availability section |
| Pricing change (creative does not reference price) | Continue | Continue | Continue | Continue | Refresh availability section |
| Unit mix change | Per affected Unit, pause | Per affected post | Per affected email | Continue | Refresh availability and Unit detail |
| Brand refresh | Pause, refresh, approve, resume | Hold, refresh | Hold, refresh | Continue | Refresh brand layer |
| Rebrand | Pause all, refresh all, approve, resume | Hold all, refresh | Hold all, refresh | Brief pause during cutover | Full refresh |
| Constraint revision (spec claim creative) | Pause, refresh | Hold, refresh | Hold, refresh | Continue | Refresh affected sections |
| Constraint revision (no spec claim) | Continue | Continue | Continue | Continue | Refresh affected sections |
| Naming change | Pause all creative referencing old name, refresh | Hold all referencing old name | Hold all referencing old name | Update URLs and tracking | Domain redirect + refresh |
| Channel change | Continue (targeting may update) | Continue | Continue | Update form routing | Continue |
| Pause | Pause all | Hold all | Hold all | Switch to "notify me" mode | Switch to paused state |
| Re-launch | Activate all on new CampaignBrief | Generate new | Generate new | Activate full lead capture | Re-publish |

**Compliance pre-flight on refresh.** Every refreshed creative re-runs the compliance pre-flight against the relevant jurisdictions. Overrides logged in audit trail.

---

## Phase 8. Versioning and audit

### What's versioned

| Entity | Versioning model |
|--------|-------------------|
| ConstraintModel | Explicit versions, retained, revert-supported (Gap 20 from onboarding: `revert_to_version`). |
| BrandKit | Versions retained. Superseded BrandKits are recoverable. |
| ContentBackbone | Versions retained. Forks per surface tracked. |
| Asset | Each generated Asset is versioned; old versions retained in Superseded state for audit. |
| Microsite | Versions retained. Published version is the current one; previous versions are accessible via version history. |
| CampaignBrief | Versions retained on every approval. |
| Campaign | Each major creative refresh creates a new Campaign version. Old versions show in the Campaign history. |
| ChangeProposal | Retained as the record of the trigger event. Includes blast radius, approval decision, cascade outcome. |
| Project.name | History retained with timestamp and trigger reference. |

### Old versions: retain or discard

Default: retain everything. Storage cost is much lower than the cost of an irrecoverable mistake. Versions are visible in the Project's "Version history" view, accessible to developer, marketing lead, and sales manager.

Exception: imported Assets that were replaced are retained for 12 months (configurable per workspace), then archived.

### Reverting a change

Each trigger type has a defined revert window and revert behaviour:

| Trigger | Revert window | Revert behaviour |
|---------|---------------|-------------------|
| Pricing change | Indefinite | Reverse-direction trigger fires; cascade runs in reverse using the prior version. |
| Unit mix change (combine/split) | Constrained — only while no Opportunity has been opened on the new Unit(s). After that, manual unwinding required. | Combine reverses into split (and vice versa) before any new activity attaches. After, manual. |
| Unit mix change (add) | Indefinite if Unit has not been engaged. | Unit transitions Off_Market; remove from public surfaces. |
| Unit mix change (remove) | Indefinite if no replacement Unit was created from this slot. | Re-activate the Unit. |
| Brand refresh | Indefinite | Previous BrandKit reactivates; cascade runs in reverse. |
| Rebrand | Constrained — typically narrow because of the public-facing nature. Configurable per workspace, default 30 days. | Cascade reverses. |
| Constraint revision | Not user-revertable. The architect must re-issue. | n/a |
| Naming change | Constrained — public communications can't be retracted. Default 14 days. | Cascade reverses. Domains revert. Communications already sent stay. |
| Channel change | Indefinite | Routing rules revert. Existing Opportunities unchanged. |
| Pause | Indefinite | Pause status lifts; site and campaigns resume. |
| Re-launch | Each sub-trigger has its own revert window. | Per sub-trigger. |

### Audit trail

Every ChangeProposal, every Phase 2 approval, every cascade execution, every regeneration Brief, every Notification fired, every external action (publish, send, pause) creates an AuditEvent. The audit log is queryable per Project, per User (who approved), per Asset, per Opportunity.

This is what makes the architecture defensible in the cases that matter: legal disputes, regulatory inspections, internal reviews of why a deal closed or didn't.

---

## Approval gate inventory

Every gate in the re-launch flow. Most are explicit in the trigger sections; this is the consolidated list:

1. ChangeProposal approval (Phase 2) — always developer
2. Scoped approval (e.g., subset of Units for pricing change) — always developer
3. ConstraintModel new version approval (T16) — developer, on ConstraintModel revision
4. BrandKit new version approval (T19) — developer, on Brand refresh or rebrand
5. CampaignBrief new version approval — developer, on re-launch
6. Per-Asset approval after regeneration — developer or marketing lead, per the Asset type's standard approval gate
7. Per-Microsite approval before re-publish — developer
8. Per-Campaign creative approval — developer
9. Compliance override (where a flag fires and developer chooses to proceed) — developer, with audit log and reason
10. Force-resolve gate when Reservation or Contract blocks a Unit mix change — developer + legal
11. Lead notification approval (per rep) — rep
12. Reserved or Contracted buyer notification approval — manager or developer's legal practice
13. Revert decision — developer
14. Re-launch consultation outputs — developer, on each sub-trigger
15. Partner notification on change (manual; developer selects recipients and confirms send) — developer

Pattern 1 is forbidden at every gate. Patterns 2 and 4 surface; the developer or appropriate role decides.

---

## Edge cases (cross-cutting)

### EC1. Change happens mid-deal

A specific Opportunity is at the Negotiating or Offer stage when a change fires on its Unit.

- **Pricing change.** Offer remains at the old price. Rep is notified specifically. Rep can let the Offer stand, update it, or withdraw.
- **Unit mix change (Combine, Split, Remove).** Forced gate; Opportunity must be resolved before the Unit mix change executes.
- **Brand refresh, rebrand, naming change.** Opportunity attribution unaffected. Rep updates outbound communication.
- **Constraint revision.** If material to the buyer's decision, the rep proactively re-engages with new spec context.

### EC2. Deposit taken, then unit re-priced

The buyer is Reserved on a Unit. A project-wide price change fires.

- The Reservation locked the price. The Reservation record is untouched. The deal proceeds at the locked price.
- CRM logs an Activity on the Opportunity noting the project-wide price change while this Unit was at Reserved.
- If the buyer becomes aware (sees the public website with a different price) and asks, the rep handles the conversation. There is no automatic notification.
- If the buyer demands a price match (lower price), this is a commercial conversation between rep, manager, and developer. Bricly does not auto-adjust the Reservation.

### EC3. Change reverses an earlier change

Price was raised, now lowered back. Brand was refreshed, now reverted. The flow handles this by treating the reverse as a new ChangeProposal that targets the previous version. Phase 1 blast radius computes against current state. If the previous version exists in storage, the agent surfaces a "this looks like a reversion" recommendation and offers to skip the full cascade by reusing the previous version's Assets where they're still valid.

### EC4. Change affects only some units, not all

Handled via scoped approval at Phase 2 (`approve_change_proposal_partial`). Cascade applies to the specified scope only. Microsite Unit detail pages refresh per affected Unit. AssetUnitMap polygons re-evaluate only where the affected Units appear.

### EC5. Change invalidates Assets the developer wants to keep

Developer can mark an Asset as "Pinned" through (Gap) `pin_asset_version`. Pinned Assets do not auto-regenerate on cascade but do flag Stale with a clear visual indicator. Developer accepts the staleness in exchange for keeping the original. Audit logged.

**Hard unpin rule.** When a regenerated upstream entity makes the pinned Asset structurally incorrect (e.g., a pinned exterior render that shows a building face that no longer exists after a ConstraintModel revision, or a pinned Unit detail page for a Unit that has been Combined or Removed), the system hard-unpins the Asset automatically. The Asset transitions to Superseded. Pin override is not permitted on structural mismatch. The developer is notified and the audit trail captures the forced unpin.

### EC6. Cascade is in flight when another change is proposed

Bricly serialises changes per Project. The second ChangeProposal queues until the first cascade completes (or is cancelled). Developer is informed. Exception: a ConstraintModel revision can supersede an in-flight non-ConstraintModel change because the architect's truth takes precedence; in this case, the in-flight cascade pauses and the ConstraintModel cascade fires first.

### EC7. The change is rejected by developer, but partial work has already happened

ChangeProposal in Phase 1 or before Phase 2 approval: no execution has occurred. Rejection is clean.

ChangeProposal mid-Phase-3 (developer cancels in flight): cascade halts. Already-regenerated Assets stay in their state (Generated, In_Review, or Approved). Developer can keep them, retire them manually, or revert.

### EC8. Imported Assets across all triggers

Consistent rule: imported Assets flag Stale on upstream change but cannot auto-regenerate. Developer must replace, upload a new version, or accept staleness. Surfaced in every blast radius.

### EC9. MCP server and partner-facing surfaces

These inherit the canonical public state. They do not have independent content that survives a cascade. Held-back content stays held back; a partner asking through MCP about a held-back attribute receives a request-private-info flag.

### EC10. Change introduces new compliance requirement

Naming change with new trademark territory, channel change requiring new regulatory licence (e.g., RERA dual licence in Dubai), or ConstraintModel revision that triggers fresh disclosure obligations. Compliance pre-flight surfaces the new requirement. Developer must acknowledge before cascade proceeds.

### EC11. Cascade triggers a downstream cascade

Example: a constraint revision regenerates renders, which the brochure references; the brochure regenerates, which the website references; the website refreshes. The cascade traverses the dependency graph until all sub-dependencies are met and in sync. No artificial depth cap. Sub-dependencies that the change does not affect are left alone (a Unit detail page that does not reference any regenerated render does not get touched). The cascade stops when every affected node has been regenerated, re-mapped, or explicitly retired. Bricly surfaces total expected completion time in the blast radius. Cycles are not permitted (an Asset cannot reference itself transitively); the system rejects cycle attempts at the graph layer.

### EC12. Public-facing communications already sent

Emails sent, social posts published, ads run, PDFs downloaded by buyers. These are unrecoverable. The audit trail captures what went out under which version. Bricly does not pretend it can retract them. Developer is informed of the "already in the world" status.

### EC13. The change is regulatory-forced

The developer must change a price, withdraw a Unit, change a name, or pause the project because of a regulatory order. Same flow, but compliance flag is permanently logged on the Project, and the developer cannot override it.

---

## Orchestrate vs own

Mostly owned, because this flow is internal to Bricly's middleware (constraint chain, brand chain, sync chain). External orchestration applies at the edges:

| Component | Final version | MVP |
|-----------|---------------|-----|
| Blast radius computation | Owned | Owned |
| ChangeProposal lifecycle | Owned | Owned |
| ConstraintModel re-extraction | Owned (vision API orchestrated for extraction, comparison logic owned) | Owned |
| BrandKit regeneration | Orchestrated (Canva, image models) | Same |
| Render regeneration | Orchestrated (Midjourney, Kling) | Same |
| Brochure regeneration | Orchestrated (Canva) | Same |
| Microsite refresh | Owned | Owned |
| Paid campaign pause/refresh | Final: Owned (Meta and Google Ads APIs). MVP: Asset pack handoff. | Asset pack handoff |
| Scheduled post hold/refresh | Orchestrated (Buffer, Later, Meta Business Suite) | Same |
| Email queue hold/refresh | Orchestrated (Mailchimp, Klaviyo, ActiveCampaign) | Same |
| Domain redirects | Owned (Bricly-hosted) or orchestrated (developer custom domain) | Same |
| Compliance pre-flight | Owned | Owned |
| Versioning and audit | Owned | Owned |
| Cascade orchestration | Owned | Owned |

The middleware is the moat. The execution edges are where Bricly orchestrates best-in-class tools.

---

## Agent role summary

**Pattern 1 (autonomous orchestration).** Blast radius computation. SyncEvent propagation. Internal regeneration Briefs. ContentBackbone updates. Dashboard recomputation. Audit trail recording. Vision verification loop (within three-attempt cap).

**Pattern 2 (proposes, developer decides).** ChangeProposal proposals based on detected signals for operational triggers (pricing change, sales channel change). Approval gates throughout. Creative refresh suggestions. Lead and buyer notification drafts. Active campaign pause and refresh recommendations. **Strategic triggers (rebrand, ConstraintModel revision, naming change, pause, re-launch) are always developer-initiated.** Agents do not propose these autonomously.

**Pattern 3 (flags, never decides).** Compliance violations on regenerated creative. Legal blockers (Reserved or Contracted Units affected by structural changes). Layer 1 ConstraintModel override attempts (which are never permitted; agent flags and refuses). Reversion conflicts (developer wanted to revert but Reservations now depend on the new state).

**Pattern 4 (conversational).** Rebrand consultation. Re-launch consultation. Always developer-initiated or developer-confirmed.

**Strictly forbidden.**
- Auto-approving any ChangeProposal.
- Auto-publishing refreshed Microsites.
- Auto-sending any notification to a buyer.
- Auto-pausing or resuming paid campaigns.
- Auto-overriding ConstraintModel layer 1.
- Auto-resolving Opportunities or Reservations to clear a Unit mix change blocker.
- Auto-triggering a re-launch from a pause without developer confirmation.
- Auto-suggesting a re-launch consultation based on detected signals. Re-launches are strategic; the developer initiates.
- Auto-extending or auto-shortening revert windows.
- Auto-sending bulk notifications to active leads on any change. Bulk announcements (e.g., a price-reduction newsletter) are manual operations handled outside this flow.

---

## Capability surface and data model gaps

Items surfaced in this flow that need to be applied to `bricly-data-model.md` and `bricly-capability-surface.md`.

### Data model

1. **ChangeProposal entity.** First-class entity. BELONGS_TO Project. Attributes: trigger_type (enum of the eight triggers), proposed_change_payload, rationale, blast_radius_snapshot, scope (full or partial), approval_state, approved_by, approved_at, cascade_execution_state, audit_trail_ref. States: Draft, Analysed, Approved, Approved_Partial, Rejected, Executing, Completed, Cancelled, Reverted.

2. **Asset.pinned attribute.** Boolean on Asset. When true, the Asset does not auto-regenerate on cascade. Flag Stale fires but no regeneration Brief is queued. Audit logged on pin and unpin. **Hard unpin rule.** When a regenerated upstream entity makes the pinned Asset structurally incorrect (e.g., a pinned exterior render that shows a building face that no longer exists after a ConstraintModel revision, or a pinned Unit detail page for a Unit that has been Combined or Removed), the system hard-unpins the Asset automatically. Pin override is not permitted on structural mismatch. Developer is notified, audit logged, and the Asset transitions to Superseded.

3. **ConstraintModel.revert_to_version Tool surfacing.** Already noted as Gap 20 from onboarding. Confirm it's wired into the re-launch flow with full cascade behaviour.

4. **BrandKit.revert_to_version.** New Tool. Same pattern as ConstraintModel.revert_to_version.

5. **CampaignBrief versioning.** Confirm versioning model. New versions on approved changes. Old versions retained.

6. **Project.launch_phase additional states.** Add `relaunch_warmup` between `launch` resume and full re-launch. Add `paused` as a state on the Project itself or on launch_phase.

7. **Project.name_history.** Versioned name history with timestamp and ChangeProposal reference. Old names are queryable for audit and search-engine redirect mapping.

8. **SalesChannelConfig entity (or Project.channel_mix attribute set).** Captures active channel mix per Project: direct, partners (list of active Partner refs), commission terms per channel, partner-facing surface visibility settings. Updated by Trigger 7.

9. **Persona.superseded_at and supersession_reason.** When a BrandKit refresh or rebrand updates Personas, old Personas move to Superseded with timestamp and reason.

10. **Unit version history.** Unit attributes (price, finish_package_mode, public_label_overrides) are already versioned in their references. Confirm explicit version tracking with timestamps and ChangeProposal refs.

11. **Microsite.version_history.** Already noted as part of buyer customisation flow (PackVersion). Generalise to the project_public_site Microsite type.

12. **Asset.stale_reason.** When an Asset flags Stale, capture the reason (ConstraintModel revision, BrandKit refresh, ContentBackbone update, Unit mix change, pricing change, etc.) so the cascade can compute deterministically what to do.

13. **AuditEvent enrichment for ChangeProposal lifecycle.** Audit events tagged with ChangeProposal ref so the full lifecycle of a change is queryable.

14. **CascadeProgressView (resource).** Not an entity but a view. Lists every in-flight cascade per Project with per-Asset status. Visible to developer, marketing lead, sales manager.

### Capability surface

**Tools.**

1. T_RL01 `propose_project_change` — Variant per trigger type. Creates a ChangeProposal.
2. T_RL02 `compute_change_blast_radius` — Reads dependency graph, returns blast radius. Pattern 1.
3. T_RL03 `approve_change_proposal` — Developer approval, full scope. Approval gate.
4. T_RL04 `approve_change_proposal_partial` — Developer approval, scoped subset.
5. T_RL05 `reject_change_proposal` — Developer rejection.
6. T_RL06 `execute_cascade` — Triggers cascade execution per the locked disposition map. Pattern 1.
7. T_RL07 `cancel_cascade` — Mid-cascade cancellation by developer.
8. T_RL08 `revert_change` — Trigger a reverse-direction ChangeProposal. Reuses previous versions where valid.
9. T_RL09 `pin_asset_version` — Set Asset.pinned to true.
10. T_RL10 `unpin_asset_version` — Set Asset.pinned to false.
11. T_RL11 `pause_project` — Project state Selling → Paused (or Launching → Paused).
12. T_RL12 `resume_project` — Project state Paused → previous, often triggering re-launch consultation.
13. T_RL13 `start_relaunch_consultation` — ConsultationSession type=relaunch. Pattern 4.
14. T_RL14 `continue_relaunch_consultation` — Within session.
15. T_RL15 `conclude_relaunch_consultation` — Outputs zero or more sub-trigger ChangeProposals.
16. T_RL16 `revert_constraint_model_to_version` — Alias for the Gap 20 onboarding capability, used in re-launch context. Actually, the ConstraintModel layer 1 cannot be reverted by the developer; this Tool is restricted to architect-confirmed reversions.
17. T_RL17 `revert_brand_kit_to_version` — Developer revert within the revert window.
18. T_RL18 `force_unit_mix_resolution` — Used at the forced gate when an Active Opportunity or Reservation blocks a Unit mix change. Manager/developer escalation path.
19. T_RL19 `draft_change_communication` — Agent drafts the buyer-facing notification in the rep's voice. Pattern 2. One per buyer at a time. Rep reviews and sends. No bulk send.
20. T_RL20 `notify_partners_of_change` — Developer-triggered manual partner notification. Drafts a summary of the changes, developer selects which Partners to receive it, developer confirms send. Bricly does not auto-notify Partners.

**Resources.**

1. R_RL01 `change_proposals_for_project` — Lists all ChangeProposals in any state for a Project.
2. R_RL02 `cascade_progress_view` — In-flight cascade status per Project.
3. R_RL03 `version_history` — Polymorphic across versioned entities (ConstraintModel, BrandKit, CampaignBrief, Microsite, Asset, Project.name).
4. R_RL04 `affected_opportunities` — Per ChangeProposal, the list of Opportunities affected with stage and proposed disposition.
5. R_RL05 `affected_reservations_contracts` — Per ChangeProposal, the Reservations and Contracts affected, with legal review state.
6. R_RL06 `affected_campaigns` — Per ChangeProposal, the Campaigns affected and the disposition.
7. R_RL07 `pinned_assets_for_project` — All currently-pinned Assets per Project.

**Prompts.**

1. P_RL01 `propose_pricing_change` — Walks the developer through scoping a pricing change.
2. P_RL02 `propose_unit_mix_change` — Walks through a Combine, Split, Add, or Remove.
3. P_RL03 `propose_brand_change` — Refresh or rebrand decision; triggers consultation if rebrand.
4. P_RL04 `propose_naming_change` — Walks through name change including domain implications.
5. P_RL05 `propose_channel_change` — Walks through partner/direct mix updates.
6. P_RL06 `pause_project_flow` — Walks the developer through pause including buyer communications.
7. P_RL07 `relaunch_project_flow` — Presents the common re-launch scenarios catalogue, runs consultation, fans out sub-triggers.
8. P_RL08 `respond_to_constraint_revision` — Surfaces blast radius when architect re-uploads CAD.
9. P_RL09 `review_cascade_results` — Post-cascade summary and any remaining approval items.
10. P_RL10 `notify_partners_of_change` — Developer-triggered manual partner notification flow. Drafts a summary of changes, developer selects recipients and confirms send.

---

## Studio-CRM integration

The re-launch flow is the most visible expression of the CRM-Studio integration promise. Examples:

- A developer in CRM clicks "Change pricing on these 5 units" → Studio is invoked behind the scenes to refresh brochure availability sections and unit detail pages. The developer never switches to Studio. The cascade progress view shows in CRM.
- A rep in the CRM sees a notification: "Pricing on PH9 changed. Your buyer Maria Vella is at Negotiating. Refresh her personalised pack?" One tap, Studio regenerates the pack, rep reviews, sends. Still in CRM.
- An architect re-uploads CAD files via the architect portal → ConstraintModel re-extracts → developer sees a Studio-rooted notification but the affected Opportunities are surfaced in CRM. Cross-module by design.

The integration is invisible to the user, but every Studio invocation from CRM logs an Activity on the relevant Opportunity, Unit, or Project. Audit trail crosses module boundaries.

---

## Open paths and conscious deferrals

Items considered and parked rather than overlooked.

- **MVP scoping.** This document is the ideal-product version of the flow. MVP scoping is a separate exercise (consistent with Go-to-Market deferral).
- **Multi-project change.** Developer wants to apply a pricing change across multiple Projects at once (e.g., portfolio-wide adjustment). Out of scope here; the flow handles one Project at a time. Future capability.
- **Architect collaboration surface.** When the architect re-uploads CAD, an explicit collaboration surface between architect and developer (similar to CollaborationSpace) would help. Parked.
- **Buyer pack re-version dispatch.** When personalised packs flag Stale and reps refresh them en masse, the engagement signal of "buyer revisited the link after refresh" is meaningful. Already covered by Microsite engagement metrics; flagged here for clarity.
- **Predictive cascade modelling.** Before approving a change, agents could model expected impact on lead-to-sale ratio, cost ratio, and revenue based on cross-project pattern learning (Layer 3 jobs). Parked for the agent capabilities roadmap.

---

# Decisions and Open Questions

This section is separated from the main flow per the session brief.

## Decisions locked

1. **A re-launch is any change that the standard sync chain cannot resolve silently.** The standard sync chain handles inventory drift. Re-launch handles strategic change.
2. **ChangeProposal is a first-class entity.** Every significant change has a proposal lifecycle with blast radius, approval, cascade, and audit. Never silent.
3. **Blast radius is always shown before approval.** No cascade executes without the developer seeing what's about to happen.
4. **Seven trigger types, target market pivot is not one of them.** A project's target market stays the same once committed. The things that change are permits, plans, and layouts, and those flow through ConstraintModel revisions and the associated cascades. Anything that would have been a target market pivot is handled as a brand refresh, a copy refresh, or a sub-trigger inside a re-launch.
5. **High-stakes triggers require double confirmation.** Project-wide pricing, Unit mix, rebrand, ConstraintModel revision, naming change, pause, re-launch.
6. **Imported Assets flag Stale on upstream changes but never auto-regenerate.** Developer must replace, upload new, or accept staleness.
7. **Pinned Assets do not auto-regenerate but flag Stale visibly.** Developer accepts staleness in exchange for keeping the original.
8. **Hard-unpin on structural mismatch.** When a regenerated upstream entity makes a pinned Asset structurally incorrect (pinned render showing a building face that no longer exists, pinned page for a Combined or Removed Unit), the system hard-unpins automatically. Pin override is not permitted on structural mismatch. Developer is notified, audit logged.
9. **Reservations and Contracts lock the price at the moment of agreement.** Pricing changes do not retroactively apply. CRM logs the discrepancy as an Activity.
10. **A Unit mix change cannot execute on a Unit that has an active Reservation or Contract.** Forced legal gate; must be resolved first.
11. **The architect's truth is authoritative for ConstraintModel layer 1.** Developer cannot reject or override a new ConstraintModel version; only the architect can re-issue.
12. **Buyer-facing notifications are never sent autonomously and are never bulk-sent from the cascade.** Rep approves per message, one buyer at a time. Reserved and Contracted buyers go through the developer's legal practice for material changes. **Bulk announcements (e.g., a price-reduction newsletter) are manual operations handled outside this flow** by the developer's marketing lead or admin, using the standard outreach tools.
13. **Active campaign handling depends on whether the change touches the creative.** If the price is in the ad, pause and refresh. If the price is only on the landing page, continue and let the microsite cascade.
14. **Revert windows are bounded per trigger type.** Some changes are cleanly reversible (pricing); some are not (sent communications, contractually-committed Units).
15. **Versions are retained, not deleted.** Storage is much cheaper than the cost of an irrecoverable mistake.
16. **Old versions of public communications already sent stay in the world.** Bricly does not pretend it can retract them. Audit trail captures what went out under which version.
17. **Cascades are serialised per Project.** A second ChangeProposal queues. Exception: a ConstraintModel revision can supersede an in-flight change because the architect's truth takes precedence.
18. **Cascade depth follows the dependency graph until all sub-dependencies are met and in sync.** No artificial cap. The cascade traverses every level of the graph that's actually affected by the change. Sub-dependencies that the change does not touch are left alone. The cascade stops when every affected node has been regenerated, re-mapped, or explicitly retired. Cycles are not permitted (Asset cannot reference itself transitively); the system rejects cycle attempts at the graph layer.
19. **Held-back content stays held back.** The visibility-aware principle applies across all triggers. New downstream surfaces (MCP server, partner shares, agent shares) inherit the canonical public state.
20. **Sales channel change is back-office.** Operational, not creative. Existing Opportunities retain their attribution and commission terms in force at capture.
21. **Pause is an explicit Project state.** Not a soft suggestion. All campaigns pause, all outreach holds, the public site transitions to a paused state by default.
22. **External integrations stay connected during pause.** Meta Ads, Google Ads, Mailchimp, and other platform connections remain live. Campaigns pause at the platform level. No re-authentication required on resume.
23. **Re-launch is preceded by a mandatory consultation, anchored to a common scenarios catalogue.** Developer picks the scenario that fits (construction pause return, design rework return, permit hold return, financing return, slow market return, partial sell-out hold, legal/IP return, corporate restructure return, or clean re-launch). The selection pre-loads the consultation with the relevant questions, defaults, and sub-trigger suggestions.
24. **Agents do not propose re-launches.** Strategic triggers (rebrand, ConstraintModel revision, naming change, pause, re-launch) are always developer-initiated. Agents propose operational changes only (pricing, sales channel change), and only based on detected signals.
25. **Partner notifications on change are manual, developer-initiated.** Bricly drafts a summary of the changes, developer selects which Partners to notify, developer confirms send. No auto-notification.
26. **Compliance overrides do not carry over to regenerated creative.** Fresh override required every time. The compliance landscape itself may have shifted between versions.
27. **Cost ratio dashboard freezes at the pause moment.** Displayed as "Paused at X% on date Y". On re-launch, a new measurement period begins; the old period is retained for reference. Avoids a misleading reading from a static-spend, drifting-revenue calculation during the pause window.
28. **Reverse-direction changes use a shortcut, not a fresh regeneration.** When the agent detects that a developer's new ChangeProposal is functionally a reversion of a previous change (price raised then lowered back to the prior value, brand refreshed then reverted), the previous version's Assets are still in storage as Superseded. Agent surfaces "this looks like a reversion to version N-1" in Phase 0 and offers a shortcut that reactivates the previous Assets where they're still structurally valid. Faster, cheaper, and the previous Assets were already approved. Developer can accept the shortcut or decline and run a fresh regeneration. Detection logic and validity-check threshold to be specified in implementation.
29. **Workspace-level changes are out of scope.** The only workspace-level change that would matter is CorporateBrand logo, which cascades visually but is operationally minor. Handled separately if and when it arises.
30. **Pattern 1 is forbidden at every approval gate.** Agents propose, never decide. Pattern 2 surfaces and recommends; the developer or appropriate role approves.

## Open questions (kept in draft for later)

1. **Hard limit on simultaneous in-flight ChangeProposals per Project.** Serialisation handles execution order, but should the system also limit how many can be in Draft or Analysed states concurrently? Risk: developers create proposals as drafts and forget about them, polluting the project state.

2. **When a Reservation is cancelled mid-cascade (e.g., financing falls through for a Reservation that was blocking a Unit mix change), does the cascade auto-resume or does the developer have to re-confirm?** Suggestion: re-confirm, because the project state may have shifted in other ways during the block. Hard rule. Confirm.

3. **MVP boundary.** Deferred to a dedicated MVP scoping session. Which triggers ship in MVP and which are Phase 2 to be decided then.
