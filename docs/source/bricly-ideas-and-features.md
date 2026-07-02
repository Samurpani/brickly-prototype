# Bricly — Ideas & Features

A running tracker for product ideas. Not a spec, not a roadmap. The place to capture an idea, pressure-test it, work out what it touches in the data model, and decide whether it changes anything we should protect now versus build later.

Ideas move through statuses: **Raw** (just captured), **Exploring** (being thought through), **Shaping** (has a clear scope boundary and data model read), **Committed** (going into the spec), **Parked** (deliberately not now, with the reason recorded), **Killed** (decided against, with the reason recorded).

The bar for adding an idea is low. The bar for moving it to Committed is high, and it always separates ideal-product thinking from MVP scoping.

---

## Entry template

Copy this for each new idea.

```
## [Title]
**Status:** Raw | Exploring | Shaping | Committed | Parked | Killed
**Added:** [date]    **Owner:** [who]

**The idea**
One or two plain sentences.

**Why it matters**
The strategic rationale. What it unlocks, what it defends against.

**Consultant take / tradeoffs**
The honest read. Where the thinking is weak, what the risks are, what it costs.

**Data model implications**
What entities, states, or relationships it touches in the 33-entity model.

**Build vs orchestrate**
What Bricly owns versus integrates, given orchestrate-don't-rebuild.

**Scope boundary**
Ideal product versus MVP. What to protect now versus build later.

**Open questions**
What we have not resolved yet.
```

---

# The through-line: from sales tool to developer OS

Ideas 1, 2, and 3 below are one thesis, not three features. The thesis is that Bricly extends from its current wedge (architect done, start selling) backward into the pre-development lifecycle and forward into post-sale, until it is the single system a developer runs the whole project on, beginning to end.

The structural reason this is even on the table: the CRM is already the single source of truth for project and sales data. Once one system holds the canonical project record, every adjacent stage that currently lives in spreadsheets, email, and disconnected tools becomes a candidate to pull into the same record. That is the same move Legora made in legal, going from an AI tool to an agentic operating system that runs the work end to end, from matter intake to delivery, on top of one connected information layer with the human reviewing and deciding.

How the three ideas sit on the lifecycle:

```
SITE        FEASIBILITY   PLANNING &   FINANCING   CONSTRUCTION   MARKETING   SALES    POST-SALE
SOURCING                  PERMITS                                 & LAUNCH             & HANDOVER
                                                                  [current wedge]
|------------------ Idea 1: Bricly OS (the full lifecycle) ------------------------------------|
                                                  |-- Idea 2 --|              |-- Idea 3 --|
                                                  construction               post-purchase
                                                  progress                   portal
                                                       |____________________________|
                                                        construction feed powers the
                                                        off-plan buyer portal
```

The current product is sharply focused on the marketing-and-sales segment of that line, and that focus is what is converting on the Book a Call funnel. The discipline for all three ideas is the same: keep the architecture and data model able to extend across the whole line, without letting the vision pull build effort off the wedge that is working.

---

## 1. Bricly OS — the operating system for property developers

**Status:** Exploring
**Added:** 2026-06-02    **Owner:** Sam

**The idea**
Extend Bricly from marketing and sales into the full development lifecycle. Site sourcing, feasibility, acquisition, planning and permits, applications, contracts and paperwork, financing, then construction, then the marketing and sales we already do, then handover. Everything on one record, with stages and tracking from beginning to end, agents doing the work and the developer deciding. The Legora aOS launch is the functional reference: a single connected system that orchestrates agents across the whole lifecycle, sits on top of the tools the team already uses, and keeps the human reviewing and approving.

**Why it matters**
- Lock-in. A developer who runs site sourcing, permits, financing, sales, and handover on Bricly cannot leave. Switching cost is the whole business, not one workflow.
- The single source of truth compounds. Feasibility numbers feed the sales targets. Permit conditions and planning constraints feed the ConstraintModel. Construction progress feeds the buyer portal and the sell-out forecast. Each stage is more valuable because the next stage reads from it.
- It is the honest end-state of the founding principle. If AI is the OS and not a tool, the natural conclusion is an OS for the developer's whole operation, not just the part after the architect finishes.
- Defends the category. If Bricly stays a sales tool, a horizontal developer-ops platform can add AI marketing on top and commoditise us. Owning the record across the lifecycle is the defensible position.

**Consultant take / tradeoffs**
This is a vision, not a near-term build, and it should be filed that way to avoid diluting the wedge.

- Scope risk is the main one. The product works today because it is narrow: take the architect's output, brand it, sell it. Idea 1 dissolves that narrowness. Every stage we add (planning, financing, construction) is a mature category with entrenched incumbents and deep domain complexity that has nothing to do with our actual edge, which is the CAD-to-JSON constraint model, the orchestration layer, and the CRM-Studio integration.
- The right read is that Bricly OS is a directional bet that governs what we protect now, not what we build now. Concretely: keep the Project lifecycle extensible, keep the data model able to hold pre-development stages without a refactor, keep the API-first and MCP-native architecture so new stages are just new endpoints and tools. Do not build the pre-development stages until the wedge is won and a specific stage has a clear pull.
- Orchestrate-don't-rebuild is a strong fit here and makes the vision cheaper than it looks. Bricly OS does not mean building a permit-management tool or a feasibility-modelling tool. It means owning the record and the agent layer, and orchestrating or integrating the specialist tools at each stage. The thing Bricly owns end to end stays the same: the constraint model, the orchestration, the source of truth.
- Sequencing matters more than completeness. The two adjacent stages with the clearest pull are the two below: construction (idea 2) because it feeds the buyer portal and the forecast, and post-sale (idea 3) because it is already half-modelled. Pre-development stages (sourcing, feasibility, permits) are further out and should stay as vision until proven.

**Data model implications**
- This is primarily a **Project lifecycle extension**. Project currently runs Draft, Briefed, Branding, Generating, In_Review, Launching, Selling, Sold_Out, Completed, Archived. Those are all build-to-sell states. Bricly OS adds pre-marketing stages in front: something like Sourcing, Feasibility, Acquisition, Planning, Permitting, Financing, Pre_Construction, then the existing states. This wants its own design pass, because collapsing two different lifecycles (development progress and marketing progress) onto one status field will not hold. More likely a development-stage cluster on Project that runs in parallel to the existing marketing-and-sales states.
- New entity candidates, all out of current scope, sketched only so the model can accommodate them later: Site or Plot (pre-acquisition, before a Project exists), FeasibilityStudy, PlanningApplication, Permit, and a generalised lifecycle-stage tracker. Several of these may fold into existing entities rather than stand alone, the same way Lead folded into Contact. That call comes when the stage is actually built.
- Document polymorphism already absorbs most of the paperwork (permits, applications, contracts) the same way it absorbs ArchitectFile and ContractDocument. ApprovalRequest, Notification, Appointment, and AuditEvent extend to cover pre-development workflows the same way they extend to post-sale.
- ConsultationSession already generalises to new decision points (feasibility go/no-go, site selection, financing structure) without new structure.

**Build vs orchestrate**
Own: the Project record across all stages, the lifecycle state machine, the agent orchestration and approval gates, the constraint model. Orchestrate or integrate: everything stage-specific (feasibility modelling, planning and permit tooling, financing, construction management). The edge does not move. It is still the middleware and the source of truth, now spanning a longer line.

**Scope boundary**
- **Ideal product / vision:** the full-lifecycle OS. Record this as the north star the architecture serves.
- **Protect now:** Project lifecycle extensibility, data model room for pre-development entities, API-first and MCP-native so stages are additive. This is the same discipline already applied to the post-sale layer, which is sketched at full detail but explicitly out of scope so it can plug in without a refactor. Apply that pattern to the front of the lifecycle too.
- **Do not build now:** any pre-development stage. The wedge is converting. Pulling effort into permits or feasibility before sell-out is proven is the platform trap.
- **MVP:** entirely out. Not a v1 conversation.

**Open questions**
- One status field or two? Development-stage progress and marketing-and-sales progress are different axes and probably both live on Project in parallel. Needs a design pass before any pre-development work.
- Which adjacent stage has the strongest pull after the wedge? Current read is construction and post-sale, because they connect to things we already do. Worth validating against actual developer demand from the Book a Call calls.
- Where does a Site or Plot live before it is a Project? A developer evaluates several sites and acquires one. That is a pre-Project funnel, which may be its own pipeline on the Contact and deal model rather than a new entity.

---

## 2. Construction phase tracking

**Status:** Shaping
**Added:** 2026-06-02    **Owner:** Sam

**The idea**
Track the construction phase per development. Resource and staff allocation, issues, task updates, project updates. The build itself, from start of works to handover.

**Why it matters**
- It is the missing stage between sale and handover. We model the sale and we model the post-sale layer, but the build that happens in between is currently a black box to the system.
- Construction progress is the single most valuable input to two things we already care about: the off-plan buyer portal (idea 3 needs live build updates) and the sell-out forecast and reporting (D5, reporting to investors and the bank with confidence reads better with real construction status, not just sales status).
- Handover-affecting events (delays, milestone slips) are exactly the things a developer needs surfaced early, and they tie directly to Unit states we already have (Snagging, Handed_Over) and to CompletionMilestone.

**Consultant take / tradeoffs**
This is the idea to scope down hard, and your instinct that you are not sure how detailed to go is the right instinct.

- Full construction management (staff allocation, task management, resource planning, issue tracking) is a mature, crowded category. Procore, Buildertrend, and others own it. Bricly has no edge there and building it is a distraction from the constraint model and the Studio-CRM integration that are the actual moat.
- The version that earns its place is narrow: a **construction-progress layer**, not a construction-management tool. What Bricly needs is the progress signal, milestones, percent complete, dated site media, and issues that affect handover dates. That is the slice that feeds the buyer portal, the forecast, and the Unit and milestone states. Everything past that (who is on site, task assignment, materials) is construction management and should be integrated from the tools the contractor already uses, not owned.
- Drawing the line this way keeps faith with orchestrate-don't-rebuild and keeps the build cheap. We consume a progress feed and surface it. We do not become a PM tool.
- The recommendation is therefore: own the progress and milestone layer, integrate the rest. If a developer wants full construction PM, that is a partner integration, not a Bricly module.

**Data model implications**
- Partly anticipated already. **CompletionMilestone** (entity 30) covers structural_completion, internal_works_completion, snagging_period_start and end, practical_completion, handover, warranty periods, with expected and actual dates, evidence Documents, responsible party, and dependencies. **Unit** already has Snagging and Handed_Over states. So the milestone backbone exists in the post-sale layer.
- The gap is the lighter, more frequent progress signal that sits between milestones: percent complete, regular dated site updates, photo and video media tied to a Building or the Project, and issues that may move a milestone date. Candidate: a ConstructionUpdate or ProgressUpdate entity tied to Project and Building, producing Assets (the site media) and optionally raising Notifications when a handover-affecting milestone is at risk.
- Construction media is an Asset subtype, which means it can flow through the existing sync chain and into the buyer portal and microsite the same way render Assets do.
- Staff, tasks, and resource allocation are deliberately not modelled. If we ever need them they come through integration, not native entities.

**Build vs orchestrate**
Own: milestones (already modelled), the progress-update signal, construction media as Assets, handover-risk notifications. Orchestrate or integrate: full construction management, scheduling, resource and staff allocation, from the contractor's existing tooling.

**Scope boundary**
- **Ideal product:** a construction-progress layer that feeds the buyer portal, the forecast, and the milestone and Unit states, with full PM integrated rather than owned.
- **Protect now:** the CompletionMilestone design already protects the milestone backbone. Worth confirming the milestone model can carry a lightweight progress percentage and link to dated media, so the progress feed plugs in without a refactor.
- **Do not build now:** anything resembling construction management. No staff, no tasks, no resource planning as native features.
- **MVP:** out. The progress layer is a post-wedge build, and it sequences after the post-sale layer is real, because its main consumer is the buyer portal.

**Open questions**
- Where does the progress signal come from? Manual developer or site-manager input, contractor tool integration, or both? The answer sets whether this is a thin input form or an integration project.
- Does percent complete live on Project, Building, or Unit? Likely Building for multi-block, with Project rolling up. Needs deciding alongside the milestone design.
- How much of this can be deferred to integration entirely for v1, so Bricly only consumes and displays a feed rather than capturing it?

---

## 3. Post-purchase buyer portal

**Status:** Shaping (largely already modelled)
**Added:** 2026-06-02    **Owner:** Sam

**The idea**
A buyer login for after the sale. The buyer tracks their purchase and process, sees live updates of the property being built (it is off-plan, so the build is ongoing after they buy), reports and tracks issues, and once they move in has a channel to report and manage snagging and defects with the developer.

**Why it matters**
- It closes the lifecycle on the buyer side and is the post-sale half of the Bricly OS thesis (idea 1).
- For off-plan specifically, the live build update is a real retention and trust feature. The buyer has paid for something that does not exist yet and wants to see it taking shape. That feed is also a soft upsell and referral surface.
- It is a known competitive area. Unlatch and similar platforms own post-sale digitisation, and we have already reviewed and partially out-scoped Unlatch for MVP. This is where that scope lives.

**Consultant take / tradeoffs**
The honest read is that most of this idea already exists in the data model, so the value of capturing it here is to confirm scope and to isolate the one genuinely new part.

- The post-sale digitisation layer (entities 28 to 32) already covers the bulk of it. **PurchaserPortalAccess** (entity 31) is the buyer-facing portal: access scope, visible content config, activity log, co-buyer access, linked to Reservation, Contract, CompletionMilestones, and Documents. **CollaborationSpace** (entity 32) is the multi-party space bridging buyer, notary, solicitor, and the developer team. **CompletionMilestone** gives the buyer their process and progress. SnaggingItem covers the move-in defects and issue reporting. So "track the purchase," "access the process," and "report issues" are already modelled.
- The one genuinely new element in your framing is the **live construction feed**, the buyer seeing the property being built. That is not really a post-sale feature, it is a construction-progress feature surfaced into the portal, which makes it a direct dependency on idea 2. No progress layer, no live feed. This is the cleanest argument for sequencing idea 2 before fully shipping idea 3.
- So the action here is not net-new design. It is: confirm the post-sale layer is in scope (memory says it was activated as in-scope in the data model work), and add the construction feed as a portal surface that reads from idea 2.

**Data model implications**
- Already modelled: PurchaserPortalAccess, CollaborationSpace, Reservation, Contract, CompletionMilestone, SnaggingItem. The chain from sale to handover is in the post-sale layer.
- New: the portal needs to surface construction progress. That is the ConstructionUpdate or progress Asset feed from idea 2, scoped into PurchaserPortalAccess visible-content config. The portal already supports scoped visibility of milestones and Documents, so adding a media or progress feed to that scope is an extension, not a new spine.
- The portal is described as the post-sale equivalent of the personalised Microsite. Worth confirming whether it extends Microsite as a new type or stays its own entity, which the data model already flags as an open question.

**Build vs orchestrate**
Own: the portal, the milestone and snagging surfaces, the collaboration space, all already in the owned post-sale design. Consume: the construction feed from idea 2. Integrate: e-signature (DocuSign) and payments (Stripe or equivalent), already in scope as integrations for the contract and payment side of the portal.

**Scope boundary**
- **Ideal product:** the full post-sale portal including the live construction feed.
- **Protect now:** already protected. The post-sale layer is sketched at full detail and designed to plug in without a refactor. The only addition is making sure the portal's visible-content config can carry a construction-progress feed once idea 2 exists.
- **Do not build now:** consistent with the data model, the whole post-sale layer is out of MVP and v1. Unlatch was partially out-scoped for MVP for this reason.
- **MVP:** out. Sequences after the wedge, and the live-feed part sequences after idea 2.

**Open questions**
- Portal as a Microsite type or its own entity? Open in the data model already, decide before building.
- How much of the contract and completion workflow (notary, solicitor, e-sign, payment milestones) ships in a first portal version versus a later one? The collaboration space is rich, and a first version may be progress-feed plus snagging only.
- Three open Re-Launch flow questions touch the boundary of in-flight changes and cancelled reservations mid-cascade. Confirm the post-sale portal's behaviour is consistent with however those resolve.

---

## Cross-idea notes

- **Sequencing.** If the wedge is won and we expand, the order that respects the dependencies is: post-sale layer (idea 3, mostly modelled) and the construction-progress layer (idea 2) together, because idea 3's live feed needs idea 2. Pre-development stages (idea 1's front end) come last and stay vision until a specific stage shows real pull.
- **One discipline across all three.** Protect extensibility now, build the wedge, expand deliberately. The post-sale layer is the template: full design, explicitly out of scope, plugs in cleanly. Apply the same to construction and to the pre-development front of the lifecycle.
- **The moat does not move.** Across every stage, what Bricly owns stays the constraint model, the orchestration and prompt layer, the source of truth, and the CRM-Studio integration. Everything stage-specific is orchestrated or integrated. The OS vision is defensible only because it keeps that line.
