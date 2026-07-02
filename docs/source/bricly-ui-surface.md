# Bricly UI Surface

The human-facing UI layer for Bricly, derived from the data model, capability surface, and completed flows. This document maps which screens render which entities, which resources they consume, which tools surface as actions, where the agent appears, and how the two modules integrate.

The API and MCP server are separate consumers of the same underlying capabilities. This document is the human-facing slice.

This is the ideal-product surface. MVP scoping is a separate exercise.

---

## Foundational decisions

1. **Module framing is asymmetric.** CRM is the operational front, the day-to-day surface for the developer's team. Studio is the production back, the workshop where assets are generated and approved. Studio outputs are first-class objects rendered in CRM views. Reps and managers live in CRM full-time. Marketing leads work primarily in Studio. The developer moves between both. This matches the locked direction from the onboarding flow.

2. **Reps invoke Studio capabilities from inside CRM.** Cross-module invocation via the MCP server, surfaced as in-context actions on Opportunity, Unit, Contact, Project views. No mode-switching to generate a buyer pack, regenerate a render, or share collateral.

3. **The agent surfaces in two ways: persistent and contextual.** The persistent surface is the Bricly assistant, accessible from anywhere via a global keyboard shortcut and a docked panel that expands and collapses. The contextual surfaces are inline (suggestions, prefills, proposals, generated-content-with-approval, autonomous-with-audit) and live in the entities and tasks where they actually help. Settings, billing, role management, and other deliberate-human surfaces do not get agent intrusion.

4. **Public-facing labels are decoupled from internal state.** Pipeline stage names, Unit state labels, and Microsite copy are configurable per workspace. The data model stays canonical.

5. **Approval is rendered at the point of intent, not in a dedicated inbox-only flow.** A rep requesting a hold sees status inline. A manager has a centralised approval queue too. Both are first-class.

6. **Three form factors with three priorities.** Mobile for reps in the field. Tablet for in-meeting buyer customisation. Desktop for everyone else and for deep work.

7. **Workspace > Project > Unit is the spine.** Most screens are either workspace-level (cross-project) or project-level (single project context). Pipeline and Contacts are workspace-level by data model design. Inventory, assets, microsite, campaigns are project-level. Buyer pack composition is Contact-level inside CRM.

---

# Section 1: Bricly CRM UI

The CRM is the operational hub. Pipeline, leads, opportunities, contacts, units, calendar, approvals, reports, partners, team, settings, plus integration touchpoints into Studio.

## 1.1 Navigation structure

**Primary navigation (left rail).**
- Home (dashboard, role-specific)
- Pipeline (workspace-level kanban)
- Leads (Contact state = Lead, awaiting routing or qualification)
- Opportunities (workspace-level list)
- Contacts (all Contacts regardless of state)
- Projects (developments list)
- Approvals (manager + senior rep)
- Calendar
- Reports
- Partners
- Team (manager + admin)
- Settings

**Studio access.** A docked Studio entry in the rail or via the assistant. Cross-module invocation surfaces as in-context actions (next sections) so reps never need to enter Studio directly.

**Global surfaces.** Topbar carries: command palette (cmd+K, opens the assistant), notifications, search, profile menu.

---

## 1.2 Dashboard

The home surface. Five role variants. All share layout primitives (stats row, action panels, activity surfaces) but render different content.

### 1.2a Dashboard, Sales Rep

**Purpose.** Today's priorities. What to do next, what's at risk, what's progressing.

**Primary user.** Sales Rep, Senior Sales Rep.

**Entities rendered.** Opportunity (own assigned, prioritised by score then recency), Activity (recent on own opportunities), Appointment (today and next 7 days), Commission (own, current period), ApprovalRequest (own pending), Unit (own holds, expiry countdown), Notification.

**Resources consumed.** R43 (rep pipeline), R45 (own opportunities by stage), R29 (upcoming appointments), R51 (own commissions), R26 (activity stream filtered to self), R32 (own pending approvals), R57 (notifications).

**Tools exposed.** Quick-action: T14 (log activity), T38 (schedule appointment), T11 (capture walk-in lead), T59 (start a personalised pack). Inline-action on each surfaced opportunity: jump to detail, mark followed-up, propose next step.

**Role-based visibility.** Rep sees only own data. Senior Rep same.

**Agent surfaces.** Pattern 3 on the "follow up next" panel ranking by SLA breach risk, engagement signals, lead score. Pattern 2 on the inline "draft your follow-up" composer. Pattern 4 via assistant: "what should I work on today", "remind me about the Ahmed deal".

### 1.2b Dashboard, Sales Manager

**Purpose.** Team performance, approvals to action, pipeline health, risks. Decisions, not data.

**Primary user.** Sales Manager.

**Entities rendered.** Opportunity (team-wide, by stage and by rep), ApprovalRequest (pending across team), User (team roster with metrics, OOO status, capacity), Unit (held, hold queues, expiring holds), Activity (team-wide), Commission (pending verification), Notification.

**Resources consumed.** R44 (workspace pipeline), R45 (all opportunities filtered), R32 (pending approvals), R28 (team activity), R39 (rep performance), R5 (units in current state), R53 (commissions pending verification), R61 (hold queues per unit).

**Tools exposed.** Inline approval: T42 (approve), T43 (reject) directly from the surfaced approval cards. Team mutation: T54 (reassign opportunity), T50 (update user settings), T52 (mark rep OOO). Override: T8 (manager override hold to reservation), T9 (mark sold if manager-level). Commission: T67 (verify commission).

**Role-based visibility.** Manager only.

**Agent surfaces.** Pattern 3 on "risks today": deals at risk (no activity in N days, hold expiring, buyer-response SLA breached, financing stall on Reserved deals). Pattern 3 on lead allocation: agent recommends a rep based on past conversion with similar buyer profiles. Pattern 4 via assistant: "show me deals at risk", "who's overloaded this week".

### 1.2c Dashboard, Marketing Lead

**Purpose.** Campaign performance, asset library health, microsite engagement, brief queue. Marketing-side decisions.

**Primary user.** Marketing Lead.

**Entities rendered.** Campaign (active across projects), Asset (recent, flagged stale, in review), Microsite (project public sites, engagement metrics), Brief (queue and in-progress), Contact (filtered to leads, by source attribution), CampaignBrief (active and pending).

**Resources consumed.** R24 (campaign performance), R17 (asset library health), R20 (microsite engagement), R14 (brief queue), R8 (workspace contacts), source attribution slices, cost-per-lead and cost-ratio resources.

**Tools exposed.** T20 (compose brief), T24 (regenerate asset), T25 (approve asset), T28 to T30 (microsite controls), T33 to T36 (campaign actions). T_GTM18 (propose phase transition) when sell-through hits thresholds. T17 to T19 (brand kit operations) if marketing owns brand. Studio jumps: open render workspace, open brochure editor, open microsite editor for a project.

**Role-based visibility.** Marketing Lead. No client data. No opportunity creation. No commission visibility.

**Agent surfaces.** Pattern 3 stale asset alerts on cascade after CRM events. Pattern 3 phase transition proposals when sell-through hits thresholds. Pattern 3 creative refresh recommendations on underperforming ad variants. Pattern 4 via assistant: "generate a new social pack for The Sanctuary".

### 1.2d Dashboard, Developer

**Purpose.** Cross-project portfolio view. The cost ratio benchmark front and centre. Sell-through pace, revenue, pipeline health, partner performance, campaign performance, project lifecycle states.

**Primary user.** Developer (admin / MD), C-Level.

**Entities rendered.** Project (portfolio), Unit (aggregate by status), Opportunity (aggregate by stage), Campaign (active per project), Commission (paid and pending), Partner (top performers), PaymentMilestone (cash flow projection), CampaignBrief (active per project).

**Resources consumed.** R2 (project list), R44 (pipeline roll-up), R20 (microsite engagement), R24 (campaign performance), R54 (commission totals), R50 (payment milestones aggregate), R_GTM cost ratio resource, R35 (partner performance).

**Tools exposed.** Mostly reads. T1 (create project, opens wizard), T21 to T23 (start a consultation session: pricing review, performance review, cross-project pattern analysis), T44 (manage partner).

**Role-based visibility.** Developer admin and C-Level only.

**Agent surfaces.** Pattern 3 cross-project pattern analysis surfaced as a top-strip card: "Mercury Towers is converting 60% slower than Dolphin Court despite higher spend, want to investigate?" Pattern 4 via assistant: "what's our cost ratio across all projects this quarter", "which campaigns are dragging cost-per-reservation up". Pattern 4 the on-demand consultant: developer can start a pricing review, channel mix review, performance review session. This is one of the visible AI-OS moments.

### 1.2e Dashboard, Ops

For workspaces with no dedicated Ops user, Ops responsibilities collapse into the Manager dashboard with an "Ops" tab. For workspaces with Ops as a distinct role, a dedicated Ops dashboard surfaces.

**Entities rendered.** Reservation (post-sale), Contract, PaymentMilestone (upcoming and overdue), SnaggingItem (open), Document (contract templates, pending KYC), CompletionMilestone (construction).

**Resources consumed.** R48 to R50 (payment plan and milestones), post-sale resources, R55 to R56 (documents).

**Tools exposed.** Payment tracking, snagging triage, document upload, construction update push.

---

## 1.3 Pipeline

**Purpose.** Workspace-level kanban view of all Opportunities across configured stages. The sales team's central work surface.

**Primary user.** Sales Rep (own filter default), Sales Manager (team-wide), Developer (read-only).

**Entities rendered.** Pipeline (configured stages), Opportunity (cards), Contact (rendered on card), Unit (rendered on card when bound).

**Resources consumed.** R43 (pipeline filtered to rep) or R44 (workspace pipeline), R45 (opportunities).

**Tools exposed.** Drag-to-move-stage triggers T53 (update opportunity stage), with modal capturing required fields per stage (hold deposit, reservation terms, lost reason, etc.). Card-action menu: T54 (reassign), T56 (close as lost or paused with reason), T59 (start personalised pack), T6 (request hold if Unit attached). Stage transitions enforce approval gates inline (price exception, hold, reservation triggers ApprovalRequest).

**Role-based visibility.** Rep sees own by default, toggle to "all". Manager sees all by default. Developer read-only.

**Views.** Kanban (default). List (sortable table) toggle on same screen. Filter sidebar: by project, by stage, by source, by rep, by lifecycle state, by score range. Saved views (workspace-level and personal).

**Agent surfaces.** Pattern 3 inline on each card: SLA breach badge, agent-suggested next action, engagement-signal indicator. Pattern 2 on the stage-change modal: required fields pre-filled from conversation history. Pattern 4 via assistant scoped to current view.

---

## 1.4 Leads

**Purpose.** Fresh inbound leads. Contact in state Lead with Opportunity in stage New Lead or Waitlist. The triage surface between lead capture and active sales work.

**Primary user.** Sales Manager (allocates from unassigned), Sales Rep (pulls if permitted), Marketing Lead (read-only segmentation slice).

**Entities rendered.** Contact (state Lead, with full capture cluster visible: source, channel, campaign, capture context, original message, dedupe candidates), Opportunity (stage New Lead or Waitlist, with capture flags array, qualification score, source attribution), Activity (auto-first-touch records inline).

**Resources consumed.** R9 (workspace leads inbox), R10 (contacts by tag), capture cluster resource.

**Tools exposed.** T54 (assign opportunity to rep), T12 (update contact preferences), T13 (transition contact state), T55 (dispatch notification to assigned rep), T11 (capture lead manually for walk-in or phone). Bulk: assign multiple, transition state on multiple.

**Views.** Unassigned (manager primary). My new leads (rep). Spam-filtered (manager spam inbox). Waitlist (pre-launch leads). By source / by campaign (marketing slice). Capture-flag filtered: "phone_match_different_name", "low_identity_confidence", "country_restricted", etc.

**Role-based visibility.** Rep sees own assigned + unassigned queue if permitted to pull. Manager sees all including spam inbox. Marketing Lead sees aggregate by source for attribution, no individual contact identity unless granted.

**Agent surfaces.** Pattern 1 with audit trail on routing rule execution (visible inline as "auto-assigned to Maria via project-rule"). Pattern 1 first-touch automation: email immediate, WhatsApp 2-3 min delayed, agent qualification conversation. Logged as Activities. Pattern 3 manager-side proposal: "agent recommends Maria for this lead based on past conversion rate with similar buyer profile". Pattern 4 the inbound buyer-side qualification agent runs in the buyer's channel and pushes structured outputs into this surface.

---

## 1.5 Opportunities

### 1.5a Opportunities list

**Purpose.** Workspace-level list view of opportunities. Complementary to the kanban pipeline. Useful for table-style triage, bulk operations, filtered exports.

**Primary user.** Sales Rep, Sales Manager, Developer.

**Entities rendered.** Opportunity (with Contact, Unit when bound, Pipeline stage, owner, source, qualification score, lifecycle state).

**Resources consumed.** R45 (opportunities filterable), R46 (opportunity by status).

**Tools exposed.** Same as Pipeline plus bulk operations (reassign multiple, transition multiple, export filtered).

**Role-based visibility.** Rep own. Manager all. Developer read-only.

### 1.5b Opportunity detail

**Purpose.** The single-deal hub. The most-visited screen for an active rep. Pipeline stage, Contact context, attached and shortlisted Units, configuration preferences, activity timeline, appointments, offers, payment plan, commission attribution, personalised pack composition.

**Primary user.** Sales Rep (own assigned), Sales Manager.

**Entities rendered.** Opportunity (header: stage, lifecycle, score, source, capture flags, owner). Contact (sidebar with full identity and preferences). Unit (bound and shortlisted and considered, sub-tab). Activity (full timeline, filterable). Appointment (upcoming and past). Offer (negotiation chain when present). PaymentPlan + PaymentMilestone (when Reserved). Commission (current split with referrer / partner if applicable). Document (KYC, ID, proof of funds, signed contracts). ApprovalRequest (pending or recent on this opportunity). Microsite (the contact's personalised buyer pack). Brief (any in-flight personalised collateral).

**Resources consumed.** R42 (opportunities for contact), R46 (opportunity detail), R29 to R31 (appointments), R47 (offers), R48 to R50 (payment plan and milestones), R51 to R54 (commissions), R55 (documents), R32 (approvals), pack engagement metrics.

**Tools exposed (the deepest tool surface in CRM).**
- Stage and lifecycle: T53 (update stage), T54 (reassign), T56 (close with reason)
- Preferences and configuration: T57 (update preferences), T58 (set configuration)
- Buyer customisation: T59 (generate personalised pack, the headline capability), T22 (generate personalised render with constraints), T24 (regenerate asset), T24a (vision verification surface), pack lifecycle (extend, expire, pause, reset password), T27 (share asset)
- Commercial: T6 (request hold), T8 (convert hold to reservation), T9 (mark sold), T60 to T62 (offer lifecycle), T63 (create payment plan)
- Activity and appointment: T14 (log activity manually), T38 (schedule appointment)
- Documents: T68 to T71 (document operations including e-signature flow)

**Layout.** Header strip (deal summary), left column (Contact context permanently visible), main area (tab navigation: Overview, Units, Activity, Pack, Offers, Payments, Documents, Commission), right rail (quick actions, agent suggestions, recent notifications).

**Role-based visibility.** Owner default. Manager full. Marketing Lead no access. Developer read.

**Agent surfaces.** Pattern 2 on the preference and configuration form: agent fills likely values from conversation history. Pattern 3 stage-progression nudges based on engagement signals: "buyer has opened the pack 4 times this week, agent suggests moving to Negotiating". Pattern 4 voice and chat composition of the personalised pack. Pattern 1 with audit trail when the rep input agent (A1) parses WhatsApp or voice notes into structured Activities. Pattern 3 the meeting capture and extraction surface: after a viewing, agent transcribes, extracts shortlist, ruled-out Units, finish preferences, objections. Rep reviews and confirms.

### 1.5c Personalised buyer pack composition (sub-surface of Opportunity)

**Purpose.** Compose the personalised buyer pack from inside Opportunity context. The headline cross-module surface that pulls Studio capabilities into the rep's workspace.

Described in detail in the buyer customisation flow. UI summary:

**Entities rendered.** Microsite (type personalised_buyer_pack, in Draft), Asset (renders being generated), AssetUnitMap, FinishPackage, StyleSet, ContentBackbone draft section, PackVersion.

**Tools exposed.** T59 (compose), T22 (generate render), T57 to T58 (preferences and configuration), T27 (share via channel), pack lifecycle tools, T24a (vision verification).

**Composition modes.** UI-driven (rep selects units, FinishPackage, StyleSet, layout variant on a panel). Voice and chat (rep speaks the composition, agent drafts, rep approves). Agent-proposed (Trigger 3: agent surfaces a proposed pack from inferred engagement signals).

**Agent surfaces.** Pattern 4 dominant. Pattern 1 vision verification. Pattern 2 preference fill from history. Pattern 3 agent-initiated pack proposal.

### 1.5d Opportunity approval inline panel

When a rep takes an action that requires approval (hold, reservation, below-floor price, commission split exception, contract terms), the ApprovalRequest renders inline on the Opportunity. Rep sees status, manager can approve from the same surface or from the centralised approval queue.

---

## 1.6 Contacts

### 1.6a Contacts list

**Purpose.** All Contacts in the Workspace. Prospects, active clients, past clients, referrers, agency contacts, external professionals (notaries, lawyers, finance brokers).

**Primary user.** Sales Rep (own assigned default), Sales Manager (all), Marketing Lead (segmentation slice).

**Entities rendered.** Contact (filterable by state, contact type tags, source, owner, project of interest, KYC status).

**Resources consumed.** R8 (workspace contacts), R10 (contacts by tag).

**Tools exposed.** T10 (create contact), T12 (update), T13 (transition state), tag operations, segment-building, T44 (link to partner if relevant).

**Views.** All contacts. My contacts (rep). By contact type. By state. By source / by tag. Saved smart lists.

### 1.6b Contact detail

**Purpose.** The single-Contact view. Identity, preferences, all opportunities across pipelines, all activity, all appointments, all documents, KYC status, attached partners.

**Entities rendered.** Contact, Opportunity (all across pipelines, concurrent and historical, including marketing-pipeline if active), Activity (full timeline), Appointment, Document, Partner (if referred), the personalised buyer pack panel if exists, Asset (personalised collateral shared with this contact).

**Resources consumed.** R7, R42, R26, R29, R55 to R56, pack engagement metrics.

**Tools exposed.** T12, T13, T14, T38, T27, T59 (with contact pre-anchored), opportunity-creation inline.

**Layout.** Identity header, opportunities timeline (showing concurrent pipelines), activity feed, files tab, packs tab.

**Role-based visibility.** Owner default. Manager full. Marketing Lead aggregated only.

**Agent surfaces.** Pattern 3 inline "draft your follow-up" with Contact-history-aware suggestions. Pattern 3 cold-lead re-engagement proposal when state has been Cold for a workspace-configured period. Pattern 4 via assistant scoped to Contact.

### 1.6c Conversations tab (workspace-level)

**Purpose.** Per the lead capture flow, social DMs and other interactions where identity is below the minimum-viable-Contact threshold (no phone or email yet) live as UnresolvedConversation entities here. The rep can upgrade them to a Contact manually when phone or email is obtained.

**Entities rendered.** UnresolvedConversation, with channel context and message history.

**Tools exposed.** Upgrade to Contact (creates Contact with capture flag low_identity_confidence), dismiss, manually merge if dupe.

**Agent surfaces.** Pattern 2 dedupe candidate detection. Pattern 1 channel-bound parser logging conversation.

---

## 1.7 Projects (developments)

### 1.7a Projects list

**Purpose.** All Projects in the Workspace.

**Primary user.** All roles see this. Rep / Manager have read-only on most projects, Marketing Lead and Developer can edit.

**Entities rendered.** Project (cards: thumbnail, status, lifecycle state, sell-through, units available / sold / total, completion date, current launch_phase if in GTM).

**Resources consumed.** R2, R5.

**Tools exposed.** T1 (create project, opens wizard), T4 (archive project, developer only). Card-level navigation.

### 1.7b Project detail

**Purpose.** The project hub. Inventory, pipeline status filtered to this project, marketing assets, source files, microsite, campaigns, team assigned, performance.

**Entities rendered.** Project, Unit (full inventory table), Opportunity (filtered to this project), Asset (microsite, brochure, social, renders, brand kit assets, unit one-pagers), Document (architect files, floor plans, availability list PDFs, brand guidelines, signed contracts), Microsite (project public site, teaser landing page if in GTM, personalised packs aggregate), Campaign (active and historical for this project), User (team assigned), ConstraintModel (current version), BrandKit (active), CampaignBrief.

**Resources consumed.** R1, R3, R4, R11, R11a, R12, R16 to R18, R19 to R20, R23 to R25, R55, R13a, R14.

**Tools exposed.**
- Project-level: T2 (update brief), T3 (upload more files), T28 (provision microsite), T29 (publish microsite), T29a (toggle microsite section visibility), T33 (launch campaign)
- Unit-level (inline on inventory table): T5 (update unit), T6 (hold), T8 (reserve), T9 (mark sold)
- Studio jumps: open brand identity workspace, open render workspace, open brochure editor, open microsite editor (all open in Studio context for this Project)
- T20 (compose brief for new asset)
- T_GTM01 (start go-to-market consultation) when project hits launch_phase = ready

**Tabs.** Overview (status, metrics, recent activity). Inventory (units table). Pipeline (opportunities filtered to this project). Marketing (assets summary, microsite, campaigns). Source files (architect drawings, floor plans, availability PDF, brand guidelines). Team (reps assigned to this project). Performance (project-scoped reports).

**Role-based visibility.** Rep view + per-unit transactions on assigned. Marketing Lead full marketing tab editable. Manager inventory + team. Developer full.

**Agent surfaces.** Pattern 3 "stale assets detected" banner with one-click regenerate. Pattern 1 with audit trail when SyncEvents propagate Unit changes to Assets and Microsites. Pattern 4 the GTM consultation invoked from a "Start go-to-market" button. Pattern 3 lifecycle prompt: "Project has been Launching for 6 weeks, ready to go to market?"

---

## 1.8 Properties (cross-project unit view)

**Purpose.** Workspace-level inventory view across all projects. Useful for cross-portfolio buyer-unit matching (Job R9), inventory hygiene checks (M2), marketing coverage audits, developer portfolio review.

**Primary user.** Sales Rep (matching buyers to units), Manager (inventory ops), Marketing Lead (asset coverage), Developer (portfolio review).

**Entities rendered.** Unit (filterable, sortable, groupable by Project, by status, by type, by price band, by FinishPackage availability).

**Resources consumed.** R6.

**Tools exposed.** T5 (inline edits), T6 (request hold), T7 (release), bulk operations.

**Role-based visibility.** Rep view + request. Manager full edit. Marketing Lead view. Developer full.

**Agent surfaces.** Pattern 2 on the search: rep types "2-bed sea view under 250k available". Pattern 4 via assistant: "find me units matching Ahmed's criteria across all developments".

### 1.8a Unit detail

**Purpose.** Single-unit deep view. Inventory state, floor plan, all renders, finish packages available, hold queue, attached opportunities, asset library specific to this unit, AssetUnitMap.

**Entities rendered.** Unit, ConstraintModel (the modifiable zones layer), FinishPackage (available variants), Asset (renders, floor plan graphics, unit one-pager), AssetUnitMap, Opportunity (currently considering this unit, hold queue), ApprovalRequest (pending on this unit), Activity (state transition history).

**Resources consumed.** R4, R11, R11a, R18, R21 to R22, R61.

**Tools exposed.** T5, T6, T7, T8, T9, T22, T24, T59 (start a pack with this unit pre-loaded), T31 to T32 (asset unit mapping). T_GTM12 if creating unit-level ad creative.

**Role-based visibility.** Rep request. Manager edit + transact. Marketing Lead asset tab edit. Developer full.

**Agent surfaces.** Pattern 2 inline render variant generator. Pattern 1 vision verification on every generated render. Pattern 3 hold queue management proposals.

### 1.8b Hold queue panel

When a Unit has a hold and one or more waitlisted buyers, the hold queue panel renders inline on Unit detail.

**Entities rendered.** Unit, ApprovalRequest (ordered), Contact, Opportunity per queue entry.

**Resources consumed.** R61.

**Tools exposed.** Reorder queue (manager bypass), T6 (place hold at position), T7 (release), notify next.

---

## 1.9 Approvals

**Purpose.** All pending approvals across the team. Hold requests, reservation requests, price exceptions, commission splits, contract terms, collateral approvals, microsite publish, brand kit selection sign-off.

**Primary user.** Sales Manager. Developer admin.

**Entities rendered.** ApprovalRequest (filterable by type, by requester, by target entity), grouped by type or merged in a unified feed.

**Resources consumed.** R32, R61.

**Tools exposed.** T42 (approve), T43 (reject), bulk approve, reason capture, escalation routing.

**Role-based visibility.** Manager full. Senior Rep with bypass sees only escalated. Rep sees own request status in their dashboard, not here. Developer admin full.

Approvals surface in two places: here (centralised) and at the point of intent (inline on Opportunity, Unit, Asset). Both are first-class.

**Agent surfaces.** Pattern 3 on each pending request: agent surfaces precedent ("similar requests approved 8 of 9 times in last 3 months"), risk flags, and recommendation. Pattern 1 with audit trail on auto-approved (bypass) requests.

---

## 1.10 Activity feed

**Purpose.** Workspace-wide audit-grade memory. Every Activity logged across Contacts, Opportunities, Units, Assets, Projects.

**Primary user.** Manager (audit and oversight), Rep (own slice), Developer (cross-project audit).

**Entities rendered.** Activity (filterable by actor — user, agent, external system — by subject, by type, by timeframe).

**Resources consumed.** R26 to R28.

**Tools exposed.** T14 (log activity manually), T37 (link or update activity).

**Role-based visibility.** Rep own subjects. Manager team-wide. Developer all.

**Agent surfaces.** Pattern 1 with audit trail visible (actor = agent shows source clearly). Pattern 4 conversational filter via assistant.

---

## 1.11 Calendar

**Purpose.** Personal and team calendar. Viewings, notary appointments, contract signings, payment meetings, follow-up calls. Booking page configuration for external buyer self-service.

**Primary user.** Sales Rep, Sales Manager.

**Entities rendered.** Appointment (month, week, day, agenda views).

**Resources consumed.** R29 to R31, external calendar sync state.

**Tools exposed.** T38, T39, T40, T41, T51 (connect user calendar). Booking page configuration.

**Role-based visibility.** Rep own. Manager team toggle.

**Agent surfaces.** Pattern 2 on appointment creation: suggest time, prefill attendees, location. Pattern 3 conflict resolution. Pattern 4 via assistant: "book Ahmed for next Tuesday at his preferred time".

---

## 1.12 Reports

**Purpose.** Pipeline performance, conversion funnels, rep performance, campaign performance, commission roll-ups, cost ratio benchmark (the headline metric from GTM flow), shareable live reports for investors and partners.

**Primary user.** Manager, Developer, Marketing Lead (campaign and attribution slices).

**Entities rendered.** Aggregates over Project, Opportunity, Campaign, Commission, PaymentMilestone, Activity. Cost ratio dashboard.

**Resources consumed.** R44, R24, R54, R50, R39 to R41, R58 to R59 (audit slice), cost ratio resource, R_GTM03.

**Tools exposed.** Export (PDF, CSV), share (live URL with read-only auth for investors and partners), set targets (T2, T50), report templates.

**Role-based visibility.** Manager full. Developer full. Marketing Lead campaign and attribution only. Rep own performance.

**Saved reports.** Pipeline performance (conversion funnel by stage). Source attribution (lead to sale by channel and campaign). Cost ratio (rolling, per project, per period, vs benchmark). Rep performance (calls, viewings, conversion, pipeline health, commission). Cost-per-X by channel (lead, qualified lead, appointment, reservation, sale). Partner performance (lead volume, conversion, commission paid). Cash flow projection (PaymentMilestone schedule). Cross-project comparison.

**Agent surfaces.** Pattern 4 conversational report generation: "show me cost per reservation by source for Mercury Towers last 90 days". Pattern 3 anomaly detection: "Q2 conversion dropped 8% on Dolphin Court, here's why". Pattern 3 narrative summaries on weekly campaign reports (P_GTM02).

---

## 1.13 Partners

**Purpose.** Manage real estate agencies and individual referrers. Commission terms, attribution rules, deal pipeline per partner, MCP connection status for agencies running their own buyer agents.

**Primary user.** Manager, Developer.

**Entities rendered.** Partner (agency or individual), Opportunity (attributed), Commission (paid and pending), Activity (interactions), MCP credential status, attribution disputes.

**Resources consumed.** R33 to R36.

**Tools exposed.** T44 (create), T45 (update), T46 (grant MCP access), T47 (revoke), T48 (configure attribution).

**Role-based visibility.** Manager. Developer.

**Agent surfaces.** Pattern 1 attribution rule enforcement with audit trail. Pattern 3 dispute resolution proposals.

---

## 1.14 Team

**Purpose.** User and role management. Invite, configure permissions, approval bypass, performance targets, OOO flags, calendar connection, assignment rules.

**Primary user.** Manager, Developer admin.

**Entities rendered.** User (roster with role, status, performance metrics, OOO, assignment rules).

**Resources consumed.** R37 to R41.

**Tools exposed.** T49 (invite), T50 (update), T51 (connect calendar), T52 (mark OOO), bypass toggle, role assignment.

**Role-based visibility.** Manager team management. Developer role assignment and bypass configuration.

**Agent surfaces.** Pattern 2 on invite (role suggestion based on context).

---

## 1.15 Settings

Split into sub-surfaces, not one mega-page.

### 1.15a Workspace

Workspace name, market, default currency, default language, billing, business hours, time zone, country restrictions for lead capture, suppression list.

**Primary user.** Developer admin.

### 1.15b Project

Per-project operational settings: pipeline stage names and public labels (decoupling), commission policies per Partner, SLA thresholds (rep-activity, buyer-response), hold duration defaults and grace period, custom domain for microsite, channel provider mappings per project.

**Primary user.** Developer, Manager (operational fields).

### 1.15c Integrations

Connect channel providers: WhatsApp Business API, Twilio (SMS), Calendly / Cal.com (calendar), DocuSign (e-signature), Stripe / Mollie / local PSP, Meta Ads API, Google Ads API, LinkedIn Lead Gen, Mailchimp / Klaviyo / ActiveCampaign (email), CTI provider (phone call transcription), Buffer / Later / Meta Business Suite (social publishing).

**Primary user.** Developer admin.

**Agent surfaces.** Pattern 2 guided connection flows.

### 1.15d Lead routing

Routing rule configuration: project-based assignment, capacity caps per rep, OOO behaviour, round-robin fallback, manager unassigned queue rules, lead score weighting components, auto-deprioritisation thresholds, 24/7 conversational agent toggle, automated first-touch toggle and templates.

**Primary user.** Manager, Developer.

### 1.15e Pipeline configuration

Customise stage names, public-facing labels (Reserved to "Promise of Sale Signed" if developer prefers), automation rules, cross-pipeline automation (e.g., when sales-pipeline Opportunity moves to Closed_Won, pause linked marketing-pipeline Opportunity).

**Primary user.** Developer admin.

### 1.15f Notification preferences

Per-user, per-event-type channel mapping. Workspace defaults set by Manager.

### 1.15g MCP and API

MCP server URL, token management for agency Partners and developer's own automations, API key issuance, audit log of MCP and API calls.

**Primary user.** Developer admin.

### 1.15h Compliance

Per-jurisdiction compliance rules database (R_GTM01), default settings, override audit log access.

**Primary user.** Developer admin.

---

## 1.16 Post-sale surfaces

These surfaces become active once an Opportunity hits Reserved or Closed_Won and the post-sale entity cluster activates (entities 28 to 32 in the data model).

### 1.16a Reservations and contracts overview

**Purpose.** Workspace-level view of Reservations and Contracts in flight. Status, key dates, blockers.

**Primary user.** Manager, Ops, Developer.

**Entities rendered.** Reservation, Contract, Document, ApprovalRequest (contract terms exceptions).

**Tools exposed.** Contract template management, signing flow orchestration via T71 (e-signature), document upload and verification.

### 1.16b Payment milestones

**Purpose.** Track payment milestones across all active Reservations and Contracts. Upcoming, due, overdue. Cash flow projection.

**Primary user.** Ops, Manager, Developer.

**Entities rendered.** PaymentPlan, PaymentMilestone, Document (payment receipts).

**Tools exposed.** T63, T64, payment confirmation flow, reminder dispatch.

**Agent surfaces.** Pattern 1 reminder dispatch on due date approach. Pattern 3 overdue escalation proposal.

### 1.16c Construction updates push

**Purpose.** Manually author construction progress updates and push to all relevant buyer portals.

**Primary user.** Developer, Project Manager, Ops.

**Entities rendered.** CompletionMilestone, attached imagery / video.

**Tools exposed.** Create update, push to selected portals, schedule for future push.

### 1.16d Snagging dashboard

**Purpose.** Manage post-handover defect items.

**Primary user.** Ops, Project Manager.

**Entities rendered.** SnaggingItem, Unit (handed over), Contact.

**Tools exposed.** Triage, route per defect-type rule, resolution lifecycle, communicate via CollaborationSpace.

### 1.16e Collaboration space messaging

**Purpose.** Multi-party messaging across rep, ops, buyer, notary, with per-message visibility scope (internal_only, buyer_visible, notary_visible, all_participants).

**Primary user.** Sales Rep, Ops, Buyer (post-sale), Notary (external).

**Entities rendered.** CollaborationSpace, messages with visibility scope tags.

**Tools exposed.** Send message with scope, attach documents, thread management.

### 1.16f Financing status panel

Inline panel on Reserved Opportunity. Buyer's financing application status, conditional approvals, documents needed, stall alerts.

**Tools exposed.** Status update, document upload, alert raise to Manager.

### 1.16g Cold lead re-engagement queue

**Purpose.** Manager-facing surface for stale leads and Cold-state contacts. Decision: re-engage manually, route to a nurture campaign, archive.

**Entities rendered.** Contact (state Cold), Opportunity (Paused or stale), proposed re-engagement campaign.

**Agent surfaces.** Pattern 3 proposal with rationale.

---

# Section 2: Bricly Studio UI

Studio is the production back. Asset generation, brand management, microsite editing, brief management, asset library, GTM consultation workspace. Outputs flow into CRM as first-class objects.

Studio is the primary surface for Marketing Lead and a regular destination for Developer (for brand consultation, asset approval, GTM consultation, performance review). Reps and Managers don't enter Studio directly. They invoke Studio capabilities via in-context CRM actions or the assistant.

## 2.1 Navigation structure

**Primary navigation.**
- Home (Studio dashboard)
- Projects (Studio-side project workspaces)
- Brand identities (cross-project brand kit library)
- Asset library (cross-project)
- Briefs (workspace-level brief queue)
- Microsites (all microsites, type-filtered)
- Campaigns (GTM campaigns across projects)
- Settings (Studio-specific)

**CRM access.** Topbar switcher back to CRM. Same data, same workspace.

---

## 2.2 Studio dashboard

**Purpose.** Studio's home surface. Brief queue, regeneration queue, stale assets, projects awaiting approval, brand consultation reminders, campaign performance summary.

**Primary user.** Marketing Lead, Developer.

**Entities rendered.** Project (Studio status per project: Pending Brand Selection, In Generation, Awaiting Approval, Active, Stale Assets Detected), Brief (in-progress and recent), Asset (recent activity, stale), BrandKit (active per project), Microsite (active), Campaign (active).

**Resources consumed.** R2, R14, R17, R12, R20, R24.

**Tools exposed.** T20 (new brief), T24 (regenerate selected stale), T1 (new project, opens wizard).

**Agent surfaces.** Pattern 3 stale asset alerts. Pattern 3 brand consultation reminders. Pattern 4 the on-demand consultant for marketing decisions.

---

## 2.3 Studio project workspace

**Purpose.** The per-project Studio surface. Single project, all generation activity, full asset library for the project, brand workspace, microsite editor entry points, campaign workspace entry points.

**Primary user.** Marketing Lead, Developer.

**Entities rendered.** Project, Brief, Asset (by type), BrandKit, ConstraintModel (current version), Microsite (project public site, teaser, all personalised packs), Campaign, CampaignBrief.

**Resources consumed.** R1, R11, R12, R14, R16 to R20, R23 to R25.

**Tabs.**
- Overview (project status, asset summary counts by type, recent activity, stale flags)
- Brand (active brand kit, candidates if in selection, art direction, personas, tone)
- Renders (exterior, interior, aerial, finish package variants, all renders for the project)
- Brochure (page-by-page editor and approval)
- Microsite (public site editor, teaser landing if active, section toggles)
- Social pack (templates, scheduled posts, launch grid)
- Marketing materials (email templates, ad creative, campaign assets)
- Source files (architect drawings, floor plans, availability list, ConstraintModel version history)
- Personalised packs (analytics aggregate, all packs sent for this project)
- Briefs (queue and history for this project)

**Tools exposed across tabs.** T2, T3, T15 to T19, T20, T22, T24 to T27, T28 to T30, T31 to T32, T33 to T36, T_GTM01 to T_GTM22 (the GTM workflow tools when in launch phases).

**Role-based visibility.** Marketing Lead full. Developer full with approval responsibility on key gates. Sales Manager view-only here.

**Agent surfaces.** Pattern 1 across all generation flows. Pattern 3 per-asset approval surfaces. Pattern 4 on the brand consultation and the GTM consultation.

---

## 2.4 Brand identity workspace

**Purpose.** Brand consultation interface and brand kit management for a project. The headline Studio AI moment.

**Primary user.** Marketing Lead, Developer (approves final selection).

**Entities rendered.** BrandKit (active and candidates), ConsultationSession (brand consultation, with progress through Mode A part 1, Mode A part 2, Mode B), Persona (generated in Mode A part 1), art direction structured attribute, Phase 0 renders (consultation pack), Phase 2a style approval renders.

**Resources consumed.** R12, R13, R13a (personas), R13b (style library), R15 (consultation), R18 with type=render filter.

**Tools exposed.** T17 (generate brand kit), T18 (regenerate), T19 (select active), T21 to T23 (consultation lifecycle), T20 (compose brief for re-run), T25 (approve brand kit selection).

**Layout.**
- Consultation panel (Pattern 4 conversational): adaptive Q&A, agent surfaces references and style library, captures decisions
- Personas panel: generated persona cards, editable
- Art direction panel: mood, lighting profile, lifestyle population rules, composition rules, colour grading
- Candidates panel: four brand candidates visualised with mock applications, side-by-side comparison
- Phase 0 renders panel: neutral-styled hero shots used as visual reference in consultation
- Phase 2a renders panel: style approval shots once brand selected

**Agent surfaces.** Pattern 4 the brand consultation agent (Mode A parts 1 and 2). Headline AI-OS moment. Pattern 1 candidate generation and Phase 0 / Phase 2a render generation. Pattern 1 vision verification on all generated renders. Pattern 2 surfacing alignment between Mode A decisions and Mode B candidates.

---

## 2.5 Render workspace

**Purpose.** Generate, review, approve renders. Exterior, interior, aerial. Variants by FinishPackage, time of day, StyleSet, mood. Per-unit personalisation.

**Primary user.** Marketing Lead, Developer (approval). Sales Rep accesses in-meeting variants via CRM invocation, not here.

**Entities rendered.** Asset (render type), Brief (generation briefs), AssetUnitMap, ConstraintModel (referenced for variants), FinishPackage.

**Resources consumed.** R18 with type filter, R14, R11.

**Tools exposed.** T20, T22, T24, T24a (vision verification result surface), T24b (override verification failure with audit), T25, T31 to T32.

**Layout.** Render gallery (filterable by phase, by type, by status). Generation queue (in-flight briefs with progress). Approval queue. Vision verification surface (renders where verification failed, retry / override options). AssetUnitMap editor (polygon mapping for multi-face buildings).

**Agent surfaces.** Pattern 1 generation against ConstraintModel layer 1. Pattern 1 vision verification with three-strike retry and Escalated_To_Internal flagging. Pattern 3 retry / override / escalate decision surface.

---

## 2.6 Brochure editor

**Purpose.** Page-by-page approval and editing of the sales brochure. Seeded from ContentBackbone, branded with active BrandKit.

**Primary user.** Marketing Lead, Developer (approval).

**Entities rendered.** Asset (brochure type), ContentBackbone, pages with section toggles, FinishPackage references, renders embedded.

**Resources consumed.** Brochure asset detail, ContentBackbone resource, R12, R18.

**Tools exposed.** T20, T24 (regenerate page or section), T25 (approve page or full), T26 (export PDF), T30a to T30d (compose, edit, fork content backbone to brochure, propagate back to backbone).

**Layout.** Page navigator. Page editor (live preview). Section approval markers. Fork-on-edit indicator when a brochure section diverges from the backbone.

**Agent surfaces.** Pattern 3 page-by-page approval. Pattern 2 inline copy edit with regeneration.

---

## 2.7 Microsite editor

**Purpose.** Edit and publish project public sites and teaser landing pages. Section-level visibility, content editing, custom domain configuration, password protection settings for personalised packs (though composition itself is in CRM).

**Primary user.** Marketing Lead, Developer (publish approval).

**Entities rendered.** Microsite (filterable by type: project_public_site, teaser_landing, personalised_buyer_pack, agent_share_microsite), Asset (referenced), ContentBackbone, FinishPackage, Persona.

**Resources consumed.** R19 to R20, R11a, R13a, ContentBackbone resource.

**Tools exposed.** T28, T29, T29a (toggle section visibility), T30 (update content), T30a to T30d, T_GTM05 (publish teaser landing page), T_GTM11 (publish launch microsite).

**Layout.** Site preview (live). Section-by-section editor with visibility toggles. Hidden section flag indicator. Custom domain configuration. Compliance preflight surface (T_GTM20 result before publish).

**Role-based visibility.** Marketing Lead edits. Developer approves publishing.

**Agent surfaces.** Pattern 3 compliance preflight. Pattern 3 brand and constraint check. Pattern 4 via assistant: "publish the Mercury Towers site with the new floor plans hidden".

---

## 2.8 Social pack workspace

**Purpose.** Social media asset generation and scheduling. Launch grid, ongoing content templates, story formats, reels.

**Primary user.** Marketing Lead.

**Entities rendered.** Asset (social type, filterable by platform).

**Resources consumed.** R18 with type filter.

**Tools exposed.** T20, T24, T25, T_GTM06 (teaser social pack), T_GTM13 (launch social pack), publish orchestration via Buffer / Later / Meta Business Suite.

**Agent surfaces.** Pattern 3 scheduling proposal. Pattern 1 generation. Pattern 3 phase transition creative regeneration.

---

## 2.9 Marketing materials workspace

**Purpose.** Paid campaign creative generation, landing pages (teaser and launch), email templates, lead form configurations.

**Primary user.** Marketing Lead.

**Entities rendered.** Asset (campaign creative), Campaign (drafts and active), CampaignBrief, Microsite (teaser landing page).

**Resources consumed.** R23 to R25, R20, CampaignBrief resource.

**Tools exposed.** T20, T_GTM04 (activate pre-launch), T_GTM05 (teaser landing), T_GTM06 (teaser social), T_GTM10 (activate public launch, hard gate), T_GTM11 (launch microsite), T_GTM12 (activate paid campaigns), T_GTM13 (launch social pack), T_GTM14 (email blast), T_GTM19 (regenerate phase creative), T_GTM22 (pause project campaigns), T_GTM21 (override compliance flag with audit).

**Layout.** Campaign overview per project. Creative variant gallery. Performance metrics inline. Phase transition surface (current phase, sell-through, proposed transition). Compliance flag surface.

**Agent surfaces.** Pattern 3 channel recommendation (R_GTM02). Pattern 3 phase transition proposals with regenerated creative brief (T_GTM18, P_GTM04). Pattern 3 creative refresh on underperforming variants. Pattern 3 budget alerts (T_GTM17). Pattern 3 optimisation recommendations (T_GTM16).

---

## 2.10 Go-to-Market consultation workspace

**Purpose.** Run the GTM consultation that produces a CampaignBrief. Then track CampaignBrief execution: pre-launch activation, waitlist, public launch, sustained campaigns, phase transitions.

**Primary user.** Developer (runs consultation, approves brief), Marketing Lead (executes brief).

**Entities rendered.** ConsultationSession (type=gtm), CampaignBrief (Draft, Pending_Approval, Approved, Active), Campaign (per channel, downstream of brief), Recommendation (agent-proposed changes referencing the brief).

**Resources consumed.** R15, R_GTM01 to R_GTM06, R24.

**Tools exposed.** T_GTM01 to T_GTM22.

**Layout.** Consultation panel (Pattern 4 conversational, runs through the 9 blocks: launch date, budget, target market, buyer segments, channel selection, pre-launch config, sales team enablement, approval rhythm). CampaignBrief summary. Phase tracker. Recommendations feed. Cost ratio dashboard inline.

**Agent surfaces.** Pattern 4 the consultation agent. The visible AI-OS expression in marketing. Pattern 3 all phase transition proposals and creative regeneration. Pattern 3 compliance flag surfacing during creative generation. Pattern 1 with audit trail on weekly report generation.

---

## 2.11 Asset library (cross-project)

**Purpose.** All Assets across all projects. Cross-project asset reuse, version management, status oversight.

**Primary user.** Marketing Lead, Developer.

**Entities rendered.** Asset (filterable by project, type, status, brand kit, version, regeneration count).

**Resources consumed.** R16, R17.

**Tools exposed.** Bulk operations (regenerate selected, export selected, share selected). T26 (export bundle).

---

## 2.12 Brand identity library (cross-project)

**Purpose.** All BrandKits across the Workspace. Useful when a developer reuses brand direction across projects, or for the CorporateBrand backfill on the Workspace.

**Primary user.** Marketing Lead, Developer.

**Entities rendered.** BrandKit (across all projects, active and historical), CorporateBrand (Workspace-level).

**Tools exposed.** T2 brand_inheritance toggle on a Project to inherit from another, CorporateBrand management.

---

## 2.13 Briefs (cross-project queue)

**Purpose.** All Briefs across projects. The unit of work in Studio.

**Entities rendered.** Brief (with phase, status, regeneration counter, escalation flag, resulting Assets).

**Resources consumed.** R14 (expanded to workspace scope).

**Tools exposed.** T20 (compose), edit, cancel, escalate.

**Agent surfaces.** Pattern 3 escalation review when a brief fails three times (state = Escalated_To_Internal).

---

## 2.14 Studio settings

StyleSet management (workspace-level curated mood boards plus developer-custom), MaterialLibrary management (for fully-customisable units in buyer customisation flow), workspace-level brand defaults, external tool catalogue overrides per Asset type, vision verification thresholds, generation cost budgets per project.

**Primary user.** Developer admin, Marketing Lead.

---

# Section 3: Cross-module surfaces

Surfaces where CRM and Studio meet inside the UI. Not separate pages, but integration mechanics and shared surfaces.

## 3.1 In-context Studio invocation (from CRM)

The pattern that makes the asymmetric framing workable. From any CRM context (Opportunity detail, Unit detail, Contact detail, Project detail, Properties list), the user can invoke Studio capabilities without leaving CRM.

**Trigger surfaces.**
- "Generate" menu on Opportunity, Unit, Contact (lists invokable capabilities filtered by context)
- "Get marketing assets" action on Project and Unit (opens a Studio brief composer inline)
- Inline render variant generator on Unit detail
- Pack composition surface on Opportunity detail
- Asset gallery embedded in Project detail (Studio-managed assets surfaced in CRM views)
- The assistant (cmd+K): "generate a render of PH9 with the Japandi style at sunset"

**Tools exposed in this pattern.** T20, T22, T24, T27, T59 most commonly. T17 to T19 if marketing lead is in CRM context.

**Behaviour.** Studio capabilities open as inline panels, modals, or sheet overlays within CRM. The user doesn't navigate to Studio. Status (in generation, awaiting approval, ready) flows back into the originating CRM surface. The full Studio deep editing surfaces (brochure editor, full render workspace) remain in Studio for marketing lead deep work.

**Agent surfaces.** Pattern 2 prefill from CRM context (project, unit, contact, opportunity preferences inherited automatically). Pattern 4 via assistant always available as alternative entry.

---

## 3.2 Embedded asset gallery (in CRM)

Studio-managed Assets surface in CRM views as first-class objects. On Project detail, Unit detail, Contact detail, Opportunity detail, an asset panel or tab shows the relevant assets, with thumbnails, status, version, and quick actions (share via T27, regenerate via T24, preview, download).

This is not a separate screen, it's the CRM rendering Studio's outputs natively.

---

## 3.3 Approval surfaces (cross-module)

Approval gates appear in two places, both first-class:

**At the point of intent.** Inline on the entity context where the action was initiated. A rep requesting a hold sees the approval status inline on the Opportunity or Unit. A marketing lead awaiting brand approval sees the status inline on the brand workspace. A developer approving microsite publish sees it on the microsite editor.

**In the centralised queue.** CRM section 1.9. Manager-facing primarily.

Studio-side approvals (brand kit selection, microsite publishing, brochure approval, render approval, override of vision verification failure) follow the same dual pattern: status surfaces on the work surface where the asset lives, and the centralised approval queue captures the same ApprovalRequest.

This works because ApprovalRequest is a workspace-level entity polymorphic across all approvable target types.

---

## 3.4 Notifications (cross-module)

Workspace-scoped, per-user filtered, multi-channel. Surfaces in CRM notifications panel (persistent), Studio notifications dropdown, mobile push, channel-specific delivery (WhatsApp, email, SMS) per user preference.

Entities: Notification, with subject reference (polymorphic to any addressable entity). Resources: R57. Tools: T72 (mark read), navigate-to-subject, dismiss.

---

## 3.5 Activity feed (cross-module)

Workspace-scoped and unified. A render generated in Studio appears in the CRM Activity feed. A unit status change in CRM appears as the trigger for any Asset cascade in Studio. The Activity entity is workspace-level and polymorphic, so it surfaces in both modules natively.

---

## 3.6 The wizard (third surface)

The project setup wizard is its own surface, outside both modules' chrome. Entered from either module via "Create new project", exits to the originating module. First-project onboarding exits to CRM regardless (per onboarding flow).

The wizard runs the flow from the onboarding document: project basics, location, identity, architect drawings (CAD upload triggering ConstraintModel extraction), floor plans, availability list, project details, brand inputs (mood board or import existing brand), brand consultation entry, optional asset generation seed.

This is the only surface that doesn't sit cleanly under CRM-or-Studio. It's a Bricly-level surface.

---

## 3.7 The Bricly assistant (persistent surface)

Accessible from anywhere via cmd+K, a docked button, or a global keyboard shortcut. Context-aware: inherits the entity scope of the current screen.

**Capabilities.** Any Tool the user's role permits. Any Resource read. Multi-step Prompts (P1 to P19 plus P_GTM01 to P_GTM05). Cross-module invocation: from CRM, invokes Studio tools. From Studio, invokes CRM tools.

**Interaction.** Voice (mobile primary) and text (desktop primary). Confirms before destructive or public-facing actions. Shows what it did with a one-line audit trail.

**Where the assistant is persistent vs contextual.**
- Persistent: all CRM operational surfaces (dashboards, pipeline, opportunities, contacts, projects, properties, units, calendar, reports), all Studio creative surfaces (project workspace, brand workspace, render workspace, brochure editor, microsite editor, marketing materials).
- Persistent but lighter: Approvals, Activity feed, Partners, Team (assist scope, not full agency).
- Contextual only (not persistent): Settings sub-surfaces, billing, MCP credential management, role assignment. These get an "ask the assistant" prompt at the bottom but no docked surface.

---

## 3.8 The on-demand consultant (contextual invocation)

A Pattern 4 conversational surface invoked from specific entity contexts, distinct from the always-available assistant. Same underlying Tool surface (T21 to T23 consultation pattern), but invoked deliberately for a specific consultation type:

- From Project view: brand consultation (during onboarding), pricing review (mid-launch), positioning review
- From Developer dashboard: cross-project pattern analysis, quarterly performance review
- From Marketing Lead dashboard: campaign performance review, channel mix review
- From Manager dashboard: rep performance review, team allocation review

This is the visible AI-OS expression. Same Tools, polymorphic by consultation type, different downstream outputs (Briefs, tags, preference updates, price changes, campaign updates, assignment rule changes).

The assistant can do many of these things in one-shot, but the on-demand consultant is the structured, multi-step, decision-producing surface for high-stakes decisions.

---

# Section 4: Agent surfaces

The agent layer is the architectural promise of Bricly's AI-OS positioning. This section specifies where the agent appears and in which pattern.

## 4.1 Pattern recap

- **Pattern 1 (autonomous).** Agent does the work, no human gate. Audit trail visible.
- **Pattern 2 (assist).** Human does the work, agent helps in real time.
- **Pattern 3 (propose and approve).** Agent does the work and proposes, human approves before effect.
- **Pattern 4 (conversational).** Agent and human in dialogue, agent acts as conversation unfolds.

## 4.2 Surface map

| Surface | Persistent assistant | Inline Pattern 2 | Pattern 3 proposals | Pattern 1 visible | Pattern 4 contextual |
|---------|---------------------|------------------|---------------------|--------------------|----------------------|
| Dashboards (all variants) | Yes | Suggestions on action panels | "Follow up next", "Risks today", "Stale assets" | Routing, first-touch records | On-demand consultant from developer dashboard |
| Pipeline | Yes | Filter input parsing | SLA breach badges on cards | Auto-staged transitions when criteria met | "Filter to X" via assistant |
| Leads | Yes | Smart filter | "Recommended rep for this lead" | Routing rule execution, first-touch automation | Inbound qualification agent (in buyer's channel) |
| Opportunity detail | Yes | Preference fill, draft messages | Stage progression nudges, engagement signal alerts | Logged activities from parsed messages | Pack composition voice / chat |
| Buyer pack composition | Yes | StyleSet / FinishPackage suggestions | Trigger 3 agent-proposed pack | Vision verification, reactive caching | Voice or chat composition |
| Contact detail | Yes | Follow-up draft | Cold lead re-engagement proposal | Auto-logged channel activities | Scoped to contact |
| Project detail | Yes | Brief prefill | Stale asset alerts, lifecycle prompt | SyncEvent propagation | GTM consultation, brand consultation |
| Unit detail | Yes | Render variant prompt prefill | Hold queue management | Vision verification, cache lookup | Variant generation conversational |
| Properties | Yes | Search parsing | — | — | "Find units matching X" |
| Approvals | Yes | — | Precedent surfacing, risk flags | Bypass auto-approvals | — |
| Activity feed | Yes | — | — | All agent actions logged | "Show me X" |
| Calendar | Yes | Time suggestion, attendee prefill | Conflict resolution | Calendar sync | Book via assistant |
| Reports | Yes | — | Anomaly detection | Weekly report generation | Report-on-demand |
| Studio dashboard | Yes | — | Stale alerts, brand reminders | Generation queue progress | On-demand consultant |
| Studio project | Yes | — | All asset approval gates | Generation, vision verification | GTM consultation |
| Brand workspace | Yes | — | Candidate alignment surfacing | Candidate generation | **Brand consultation headline** |
| Render workspace | Yes | Brief prefill | Verification failure decisions | Generation, three-strike loop | Variant via assistant |
| Brochure editor | Yes | Copy inline edit | Page-by-page approval | Cascade regeneration | — |
| Microsite editor | Yes | — | Compliance preflight | Cascade refresh | "Publish with X hidden" |
| Marketing materials | Yes | — | **Phase transition proposals, creative refresh, budget alerts, channel recommendations** | Performance data collection | — |
| GTM consultation | Yes | — | All phase transition decisions | Weekly report generation | **GTM consultation headline** |
| Settings (all) | Contextual only | Role suggestion on invite | — | — | — |
| Wizard | Pattern 4 throughout | Format suggestions, prefills | Constraint review on low confidence | Constraint extraction, label parsing, availability import | **Brand consultation** |

## 4.3 Where the agent does not appear

- Never autonomously commits public-facing state changes (publishing a microsite, sending a buyer pack, activating a paid campaign). Always Pattern 3.
- Never autonomously commits irreversible commercial state (mark sold, accept offer, approve below-floor price, release commission). Always Pattern 3.
- Not in Settings sub-surfaces beyond invite role suggestion. Workspace settings, integrations, billing, MCP credential management, role assignment, compliance rules are deliberate-human surfaces.
- Does not autonomously transition Opportunity stages. Pattern 3 only.
- Does not autonomously initiate personalised buyer pack generation. Rep-controlled exclusively (buyer customisation flow principle 1).
- Does not override ConstraintModel layer 1. Architect domain only.

---

# Section 5: Mobile, tablet, desktop

## 5.1 Mobile (rep primary, everyone secondary)

**Priority surfaces.** Rep dashboard. Pipeline (rep's own, card-swipe stage transitions). Opportunity detail. Contact detail. Properties (cross-project unit search for buyer matching). Calendar (own). Notifications. Leads (own, claim from unassigned). The Bricly assistant (hold-to-speak primary input).

**Optimised for.** Quick log-activity, voice-update-status, voice-create-opportunity-from-walk-in, hold-request-from-unit, share-asset-to-buyer.

**Lower priority on mobile.** Studio deep edits (brochure, render workspace, microsite editor), Reports, Team, Settings, Approvals queue (notifications-driven instead).

## 5.2 Tablet (in-meeting surface)

**Priority surfaces.** Opportunity detail with personalised pack composition (the headline tablet surface). Unit detail with in-meeting render variant generation. Floor plan with annotation tools (free-draw within ConstraintModel modifiable zones). Brochure preview in landscape. Side-by-side unit comparison. StyleSet / FinishPackage selectors as touch-first carousels.

**Optimised for.** Buyer-facing presentation. Live customisation. Touch interactions. Large screen real estate for renders. The pack composition wait-states are conversational.

**Lower priority on tablet.** Admin surfaces, dashboards (mobile-style summary if accessed), reports, settings.

## 5.3 Desktop (everyone else's default)

**Priority surfaces.** All surfaces. Desktop is default for managers, marketing leads, developers, ops. Reps use desktop for deep work.

## 5.4 Form factor matrix

| Surface | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Dashboard (any variant) | Optimised | Read | Optimised |
| Pipeline | Card-swipe | Read | Optimised kanban |
| Leads | Optimised | Optimised | Optimised |
| Opportunity detail | Optimised | **Optimised in-meeting** | Optimised |
| Buyer pack composition | Voice / share only | **Headline tablet surface** | Optimised |
| Contact detail | Optimised | Optimised | Optimised |
| Properties | Optimised search | Read | Optimised |
| Unit detail | Optimised | **In-meeting variants headline** | Optimised |
| Project detail | Read | Read | Optimised |
| Approvals | Notifications only | Read | Optimised queue |
| Activity feed | Stream view | — | Optimised filterable |
| Calendar | Optimised | Read | Optimised |
| Reports | Read | — | Optimised |
| Partners | Read | — | Optimised |
| Team | Read | — | Optimised |
| Settings | — | — | Optimised |
| Studio dashboard | — | — | Optimised |
| Studio project | — | Read | Optimised |
| Brand workspace | — | Read | Optimised |
| Render workspace | — | Read | Optimised |
| Brochure editor | — | Preview | Optimised |
| Microsite editor | — | Preview | Optimised |
| GTM consultation | Voice mode | — | Optimised |
| Wizard | Light steps only | Optimised | Optimised |
| Assistant | **Voice-first primary** | Touch + voice | Text + voice |

---

# Section 6: Permissions matrix

## 6.1 Screen-level access

| Screen | Sales Rep | Senior Rep | Sales Manager | Marketing Lead | Ops | Developer / Admin | Buyer (post-sale) | Partner (external) |
|--------|-----------|------------|---------------|-----------------|-----|--------------------|-------------------|---------------------|
| Wizard | — | — | Create | Create | — | Full | — | — |
| Dashboard | Rep variant | Rep variant | Manager variant | Marketing variant | Ops variant | Developer variant | — | — |
| Pipeline | Own | Own | All | — | — | Read | — | Own attributed |
| Leads | Own + pull | Own + pull | Full + spam inbox | Aggregated only | — | Full | — | Own submitted |
| Opportunities list | Own | Own | All | — | Ops slice | Read | — | Own attributed |
| Opportunity detail | Own | Own | All | — | Ops slice | Full | Own (limited) | Read own attributed |
| Buyer pack composition | Own | Own | All | — | — | Full | — | — |
| Contacts list | Own assigned | Own assigned | All | Segmentation | View | Full | — | Own submitted |
| Contact detail | Own assigned | Own assigned | All | — | Ops slice | Full | — | Read own |
| Conversations | Own | Own | All | — | — | Full | — | — |
| Projects list | View | View | View | Edit | View | Full | — | View attributed |
| Project detail | View + request | View + bypass | Edit ops fields | Edit marketing | Ops fields | Full | — | View attributed |
| Properties (cross) | View + request | View + bypass | Edit | View | View | Full | — | View attributed |
| Unit detail | Request | Request + bypass | Edit + transact | View + asset edit | View | Full | View own (post-sale) | View attributed |
| Hold queue | Read | Bypass | Edit | — | — | Edit | — | — |
| Approvals | Own requests | Own + bypass | Full queue | — | — | Full | — | — |
| Activity feed | Own subjects | Own subjects | Team | Marketing slice | Ops slice | Full | Own only | — |
| Calendar | Own | Own | Team | — | Team | Full | Own appointments | — |
| Reports | Own perf | Own perf | Team + projects | Campaign + source | Ops perf | Full | — | Own perf |
| Partners | — | — | Full | View | View | Full | — | Own only |
| Team | — | — | Manage | — | — | Full | — | — |
| Settings — workspace | — | — | — | — | — | Full | — | — |
| Settings — project | — | — | Operational | Editorial | — | Full | — | — |
| Settings — integrations | — | — | — | — | — | Full | — | — |
| Settings — routing | — | — | Edit | — | — | Edit | — | — |
| Settings — pipeline | — | — | — | — | — | Full | — | — |
| Settings — notifications | Own | Own | Own + defaults | Own | Own | Full | — | — |
| Settings — MCP / API | — | — | — | — | — | Full | — | — |
| Settings — compliance | — | — | — | — | — | Full | — | — |
| Reservations / contracts | — | — | All | — | Full | Full | Own | — |
| Payment milestones | — | — | All | — | Full | Full | Own | — |
| Construction updates | — | — | — | — | Edit | Full | Read | — |
| Snagging | — | — | View | — | Full | Full | Raise own | — |
| Collaboration space | Own threads | Own threads | All | — | All | All | Own scope | — |
| Financing panel | Own | Own | All | — | Full | View | View own | — |
| Re-engagement queue | — | — | Full | — | — | Full | — | — |
| Studio dashboard | — | — | View | Full | — | Full | — | — |
| Studio project workspace | — | — | View | Full | — | Full | — | — |
| Brand workspace | — | — | View | Edit | — | Approve | — | — |
| Render workspace | In-meeting via CRM | In-meeting via CRM | View | Edit | — | Approve | — | — |
| Brochure editor | — | — | View | Edit | — | Approve | — | — |
| Microsite editor | — | — | View | Edit | — | Approve publish | — | — |
| Social pack | — | — | View | Edit | — | Approve | — | — |
| Marketing materials | — | — | View | Edit | — | Approve | — | — |
| GTM consultation | — | — | View | Edit | — | Full + approve | — | — |
| Asset library | — | — | View | Full | — | Full | — | — |
| Brand library (Workspace) | — | — | View | Full | — | Full | — | — |
| Briefs queue | — | — | View | Full | — | Full | — | — |
| Studio settings | — | — | — | — | — | Full | — | — |
| Bricly assistant | Own scope | Own scope | Team scope | Marketing scope | Ops scope | Full | Phase 2 buyer agent | — |
| On-demand consultant | — | — | Performance / allocation reviews | Campaign / channel reviews | — | Full (all types) | — | — |

## 6.2 Tool-level gating

- **Approval bypass** is a per-user toggle, not a role attribute. When on, the user's hold and reservation requests auto-approve.
- **Below-floor price exceptions** require manager approval regardless of bypass.
- **Mark sold (T9)** is manager-default. Workspace-configurable.
- **Publish microsite (T29)** is developer-approval gated.
- **Activate paid campaigns (T_GTM12)** is hard-gated with double-confirm, developer-only.
- **Override compliance flag (T_GTM21)** is developer-only, audit-logged.
- **Override vision verification failure (T24b)** is marketing lead or developer, audit-logged.
- **MCP server token issuance for agency partners** is developer-only.
- **Workspace-level configuration** (suppression list, country restrictions, scoring weights, business hours, 24/7 conversational agent) is developer-only.

---

# Section 7: Decisions and Open Questions

## 7.1 Design decisions made in this draft

1. **CRM is the operational front, Studio is the production back.** Asymmetric framing locked. CRM is the rep / manager / developer's primary home. Studio is the marketing lead's home and a developer destination for brand and marketing decisions. Reps and managers invoke Studio capabilities via in-context actions in CRM. Validate this asymmetry holds.

2. **Five role-specific dashboard variants: Rep, Manager, Marketing Lead, Developer, Ops.** Each surfaces different stats, action panels, and agent proposals. Validate the Marketing Lead and Ops variants as warranted (versus permission scopes on the Manager dashboard).

3. **Workspace-level Pipeline, not per-project.** Matches data model. Opportunity follows the buyer across projects. Filterable by project but not divided.

4. **Leads is a distinct top-level navigation item, separate from Opportunities and Contacts.** Reasoning: per the lead capture flow, freshly captured leads have specific triage needs (capture flags, qualification score, routing, spam inbox) that merit a dedicated surface. Validate versus folding into Opportunities with a filter.

5. **Properties (cross-project) and Projects (developments) are distinct top-level items.** Properties = cross-project unit search (job R9). Projects = development management. Both warranted at top-level. Validate.

6. **Approvals queue is its own top-level surface, with approvals also rendering inline at the point of intent.** Dual surface. Manager primary user. Validate.

7. **The Bricly assistant is hybrid: persistent on operational and creative surfaces, contextual-only on Settings.** Always-on docked panel via cmd+K, plus an inline-suggestion layer that doesn't intrude on deliberate-human surfaces. Validate the split.

8. **The on-demand consultant is a separate Pattern 4 surface from the assistant.** Same underlying Tools, but the consultant is invoked deliberately for structured multi-step decisions (brand consultation, pricing review, GTM consultation, performance review). The assistant is one-shot conversational. Validate the distinction.

9. **The personalised buyer pack composition lives inside CRM Opportunity detail, not in Studio.** Studio holds templates and analytics; generation is rep-controlled from CRM context. Matches the buyer customisation flow.

10. **The wizard is a third surface outside both modules' chrome.** Entered from either module, exits to originating module. First-project lands in CRM. Matches onboarding flow direction.

11. **Cost ratio benchmark gets first-class real estate on the Developer dashboard.** Per the GTM flow: "the single number that proves Bricly's value". Not buried in Reports. Validate the prominence.

12. **Mobile-first for reps, tablet-first for in-meeting, desktop-first for everyone else.** Three optimisations. Validate this priority.

13. **The assistant is voice-first on mobile, text + voice on desktop.** Hold-to-speak mobile, type-or-speak desktop. Validate.

14. **The Conversations tab is a workspace-level surface for UnresolvedConversation entities below the minimum-viable-Contact threshold.** Per the lead capture flow. Validate the placement (top-level CRM nav vs nested under Contacts).

15. **Post-sale surfaces (buyer portal, snagging, construction updates, collaboration space, financing) activate per-workspace when the post-sale entity cluster is enabled.** Not in MVP. Surfaced here as part of the ideal-product UI.

16. **The Studio project workspace has 10 tabs.** Overview, Brand, Renders, Brochure, Microsite, Social, Marketing materials, Source files, Personalised packs, Briefs. Validate whether some collapse.

17. **Brand consultation surfaces inside the Brand identity workspace (Studio).** GTM consultation surfaces inside its own workspace (Studio). Pricing / performance / cross-project reviews surface from Dashboards via the on-demand consultant. Three different placements for the same underlying consultation pattern. Validate.

18. **In-context Studio invocation in CRM uses inline panels, modals, and sheet overlays.** No CRM-to-Studio navigation for rep / manager flows. Validate this principle holds.

## 7.2 Open questions for you

1. **Should the Bricly assistant be persistent on Approvals?** Reasoning to include: agent has strong proposal value (precedent, risk). Reasoning to exclude: high-stakes commercial decisions, the human should drive. Current draft: lighter assist scope on Approvals, persistent but reduced agency. Confirm.

2. **Does the developer want a unified "Inbox" surface combining Leads, Approvals (own requests), Notifications, Re-engagement queue, agent proposals?** Could simplify navigation for managers who live in inboxes. Currently separated. Open.

3. **Where does the cost ratio dashboard live?** Currently: panel on Developer dashboard, plus a dedicated card in Reports. Could be its own top-level Reports item. Could be a permanent strip on the developer's dashboard regardless of which tab. Open.

4. **Is the on-demand consultant overkill versus the always-available assistant?** Differentiation today: consultant is structured multi-step Pattern 4 with explicit start / continue / conclude; assistant is one-shot. But the assistant could handle structured sessions too. Concern with merging: lose the explicit "this is a strategic decision" framing. Concern with keeping separate: two surfaces doing similar things. Open.

5. **What's the right home for cross-project pattern analysis?** Currently: Pattern 3 proposal cards on Developer dashboard, plus invocable via on-demand consultant. Could warrant its own dedicated surface. Open.

6. **How should the in-meeting tablet surface differ from desktop Opportunity detail?** Currently: same data, touch-optimised, with the pack composition surface promoted to primary. Could be a dedicated "Meeting mode" toggle that hides admin chrome and surfaces only buyer-facing content. Open.

7. **Should there be a buyer-facing surface inside the workspace user's view, distinct from the Buyer portal?** I.e., when a rep wants to see "what does this buyer see right now", a preview. Currently implicit (preview button on the pack composition surface). Could be more prominent. Open.

8. **Where does the marketing-pipeline Opportunity surface?** A Contact can have a concurrent marketing-pipeline Opportunity (nurture) and a sales-pipeline Opportunity (active pursuit). The sales-pipeline view dominates current surface design. The marketing pipeline needs a home, possibly inside Marketing Lead dashboard, possibly inside Contact detail with both pipelines visible side-by-side. Open.

9. **Is there a "Sales playbook" or training surface for the team?** Implicit in jobs (M5 motivate, R8 update without login) but not surfaced. Could include rep onboarding (P19), playbook content, leaderboards. Open.

10. **How prominent are leaderboards?** Job M5 names motivation as a Manager job. Currently leaderboards are a panel option on Manager dashboard. Could warrant a dedicated screen or a public-to-team display surface. Open.

11. **Settings approach: tabs in one screen or split into many?** Current draft splits into 8 sub-surfaces. Alternative: one Settings screen with tabs. Open.

12. **How does Studio surface for the developer specifically?** Marketing Lead has Studio as a home. Developer has CRM as home but uses Studio for brand approval, microsite publish, GTM consultation. Should developer have a Studio dashboard variant? Or do they just enter via specific surfaces? Current draft: same Studio dashboard, approval queue more prominent for developer. Open.

13. **MCP server visibility to the developer.** Currently buried in Settings → MCP and API. The MCP server is a core differentiator (especially for agency Partners). Should this be more prominently surfaced, perhaps with a "MCP playground" or "test your agent integration" surface? Open.

14. **The "agent share microsite" type.** Mentioned in the data model. Surface placement unclear. Currently rolled into Microsite editor with type filtering. Could warrant a distinct surface. Open.

15. **Partners surface depth.** Currently a single top-level item. Could expand to: Partners list, Partner detail (with attributed opportunities, commission ledger, MCP credential, performance metrics, dispute history), Partner-portal preview (what the agency sees when they connect). Validate the depth needed.

16. **Buyer portal placement.** Currently surfaced as one of the post-sale entity cluster surfaces in CRM. But the buyer portal is itself a public-facing surface, not really a CRM screen. Should it have its own configuration / preview surface in Settings or Studio, separate from "this buyer's portal" inline on Contact / Opportunity? Open.

---

End of document.
