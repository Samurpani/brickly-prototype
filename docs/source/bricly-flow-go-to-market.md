# Bricly Go-to-Market Flow

The flow that takes an approved launch package and activates it in the market. Picks up where the Launch Package Generation flow ends. Owns the transition from assets-exist to campaigns-running, waitlist-to-launch-day, and sustained lead generation through to project sell-out.

---

## Scope

**Start state.** Launch package generated and approved. BrandKit Active. All launch-package Assets Approved. Microsite in Draft. CRM populated with Units, FinishPackages, Personas, AssetUnitMaps. ConstraintModel finalised. Content backbone composed. Project sits in Launching state. Output of the Launch Package Generation flow.

**End state.** Campaigns running across approved channels. Lead generation active and feeding the CRM. Performance reporting against the developer's cost ratio benchmark. Phase transitions managed across project lifecycle (project-level, segment-level, unit-level creative). Project transitioned through Launching → Selling, and onwards to Sold_Out when inventory is exhausted or Archived when the developer closes the campaign.

**Out of scope.** Launch package asset generation (already done). Onboarding (already done). Post-sale buyer journey, contracts, snagging, handover (post-sale digitisation layer, future).

## Definition

**Go-to-Market = the orchestration of waitlist building, launch day activation, paid media generation, organic distribution, sales team enablement, and performance reporting against the cost ratio benchmark, run as a structured agent-led consultation with developer approval at every commitment gate.**

Not the launch package itself. Not the post-sale journey. The activation layer that sits between assets and revenue.

---

## Founding principles for this flow

**Agent recommends. Developer decides. Agent executes.** Three roles, three steps, every time. No autonomous spend. No autonomous campaign changes. No autonomous publishing. The agent generates recommendations as discrete Recommendation entities in the CRM. The developer approves or rejects. On approval, the agent executes. Every recommendation, approval, and execution is logged for audit and learning.

**The developer's marketing team owns execution responsibility.** Bricly is the consultant with a powerful toolkit. The developer's in-house marketing person or project manager is responsible for taking action, providing lead quality feedback, and final commercial decisions. Bricly surfaces missing data, flags risks, and proposes actions. It does not own the developer's marketing function.

**Cost ratio benchmark is the headline metric.** Every campaign decision rolls up to a single number: total marketing spend plus internal sales cost as a percentage of revenue closed, measured against the developer's configurable agency-cost benchmark (typically 5% to 10% depending on market). Every weekly report ends with this number. Every optimisation recommendation references it.

**Phase-aware creative.** Project lifecycle has three campaign phases (project-level, segment-level, unit-level). Creative regenerates per phase. The CAD-to-JSON constraint model powers unit-level creative at a scale and specificity that media buyers and agencies cannot match. This is structural product moat.

**Compliance is not optional.** Per-jurisdiction rules for off-plan property advertising are flagged by the agent during creative generation. Developer can override, but overrides are logged in the audit trail. The compliance rules layer is owned product middleware.

**MVP scope is parked.** This document describes the ideal-product Go-to-Market flow. MVP scoping is a separate exercise.

---

## Phase 0. Launch readiness and waiting period

| Field | Description |
|-------|-------------|
| Trigger | Launch Package Generation flow ends. All assets approved. Project sits in Launching. |
| Actor | Developer (decides when to start) |
| Capability | None autonomous. Project sits ready until developer initiates Go-to-Market consultation. |
| Entity affected | Project (state: Launching, sub-state: launch_phase = "ready"). |
| Output | Project ready for market, no commitments yet. |
| Decision points | Developer decides when to start the Go-to-Market consultation. Typically governed by permits, regulatory approvals, financing close, and other developer-side gates outside Bricly's control. Gap between launch package approval and Go-to-Market start can be days to months. |
| Orchestration target | None. |
| Agent role | Dormant on this Project. May surface periodic prompts ("Project has been ready for X weeks. Ready to start Go-to-Market?") but no autonomous action. |

---

## Phase 1. Go-to-Market consultation

The agent-led consultation that produces the CampaignBrief. This is the foundational step. Every downstream activity is configured here.

| Field | Description |
|-------|-------------|
| Trigger | Developer initiates Go-to-Market consultation from the Project view in CRM. |
| Actor | Developer + agent |
| Capability | T_GTM01 `start_gtm_consultation`. T_GTM02 `continue_gtm_consultation`. T_GTM03 `conclude_gtm_consultation`. Capability surface gap. |
| Entity affected | ConsultationSession (type: gtm). CampaignBrief (created on conclude, state: Draft → Pending_Approval). |
| Output | CampaignBrief approved by developer. Trigger for Phase 2 (pre-launch activation). |
| Decision points | Single approval at end of consultation. Developer can revise any block before final approval. |
| Orchestration target | LLM for conversation. ConstraintModel and ProjectDetails for context. Workspace.CorporateBrand for inheritance. |
| Agent role | Pattern 4 (conversational). Headline AI-OS moment of the Go-to-Market flow. |

### Consultation block structure

The consultation is structured but adaptive. Required data points must be collected, but the agent adjusts depth and language to the developer's marketing literacy.

**Block 1. Launch timing.**
- Target public launch date (the anchor for the whole flow)
- Pre-launch start date (defaulted to 4 to 8 weeks before public launch, configurable)
- Waitlist activation date (defaulted to 2 to 3 days before public launch)
- Hard regulatory constraints (permits cleared, financing close date, etc.)

**Block 2. Budget and benchmark.**
- Total marketing budget commitment
- Pre-launch budget allocation (default suggestion ~5% of total)
- Launch budget allocation
- Sustained budget allocation
- Cost ratio benchmark (developer's number: typical agency commission in their market, the line they must stay under to make direct selling worthwhile)

**Block 3. Lead targets and economics.**
- Reverse-engineered from inventory: total units → expected lead-to-sale ratio → target lead volume
- Expected lead-to-viewing ratio
- Expected viewing-to-reservation ratio
- Expected reservation-to-sale ratio
- Target cost per qualified lead (back-calculated from benchmark)

**Block 4. Target markets and geography.**
- Countries and regions to run paid media in
- Language(s) for ad creative and landing pages (uses language variant pattern from launch package flow)
- Compliance flags surfaced per jurisdiction selected

**Block 5. Buyer segments.**
- Personas surfaced from BrandKit (defined in brand consultation)
- Channel mix per segment (which personas reached via which channels)
- Creative variant strategy (one creative set or multiple per segment)

**Block 6. Channel selection and platform mix.**
- Agent recommends platforms based on project type, price point, target market, buyer segments
- Developer selects from recommendations
- Budget allocation per platform
- Organic vs paid mix

**Block 7. Pre-launch configuration.**
- Waitlist enabled (yes/no)
- Teaser mode landing page (yes/no, defaulted yes)
- Teaser social post pack (yes/no, defaulted yes)
- Developer's existing email list integration (yes/no, which platform)
- Pre-launch paid spend allocation (small budget, primarily driving waitlist signups)

**Block 8. Sales team enablement.**
- In-house sales team contact details
- Sales team notification preferences (real-time, batched, daily digest)
- Lead ranking enabled (yes, defaulted)
- Speed-to-contact expectations

**Block 9. Approval rhythm and reporting.**
- Weekly report cadence (defaulted weekly)
- Approval requirements per recommendation type (defaults provided, configurable)
- Escalation thresholds (when does an alert escalate from notification to required-decision)

### Output: CampaignBrief

The CampaignBrief is the single approvable object that captures everything from the consultation. Approved with one click. Triggers everything downstream.

**CampaignBrief attributes**
- Launch date
- Pre-launch start date, waitlist activation date
- Total budget, pre-launch allocation, launch allocation, sustained allocation
- Cost ratio benchmark
- Target lead volume, target cost per qualified lead
- Target countries, languages
- Buyer segments referenced (Persona entities)
- Recommended platforms with allocation per platform
- Channel mix (paid, organic, email, partner)
- Waitlist enabled, teaser mode enabled
- Email list integration target (Mailchimp, Klaviyo, ActiveCampaign, etc.)
- Sales team enablement configuration
- Approval rhythm configuration
- Compliance flags acknowledged per jurisdiction
- Approval status, approved by, approved date

**Relationships**
- BELONGS_TO: Project
- BELONGS_TO: ConsultationSession (the one that produced it)
- HAS_MANY: Campaigns (downstream campaign objects per channel)
- HAS_MANY: Recommendations (every agent-proposed change references the brief)

---

## Phase 2. Pre-launch activation

| Field | Description |
|-------|-------------|
| Trigger | CampaignBrief approved. Pre-launch start date reached. |
| Actor | Developer + agent + system |
| Capability | T_GTM04 `activate_pre_launch`. Studio capabilities for teaser asset generation. T_GTM05 `publish_teaser_landing_page`. T_GTM06 `generate_teaser_social_pack`. |
| Entity affected | Project (launch_phase: ready → teaser). Microsite (state: Draft → Published, mode: teaser). Assets (teaser sub-type, see gap list). |
| Output | Teaser landing page live. Waitlist capture active. Teaser social posts published or handed to developer. Pre-launch paid media live (if enabled). |
| Decision points | Developer approves teaser landing page before publishing. Developer approves teaser social pack before publishing. Developer approves pre-launch paid creative before launching. Approval per asset class, batched. |
| Orchestration target | Microsite hosting (Bricly-owned). Social schedulers (final version: integrated; MVP: handoff). Email platforms (final version: integrated; MVP: handoff). Paid media platforms (final version: Meta and Google APIs; MVP: handoff to developer's marketing team). |
| Agent role | Pattern 1 (autonomous) for asset generation and orchestration. Pattern 2 (proposes, developer decides) for approval gates. |

### Sub-flow 2a. Teaser landing page

Single-screen landing page in teaser mode. The page is the public face of the project during pre-launch.

**Content shown.**
- Project name and logo
- Location ("coming soon" framing)
- Developer name, logo, link to developer's site, past projects reference
- Teaser text (positioning, no specific details)
- Hero video or image (no renders, no building reveals)
- Waitlist registration form
- Benefit framing: "Join the waitlist for early access, 48 to 72 hours before public launch"

**Form fields.**
- Name (required)
- Email (required)
- Phone number (required)
- Buyer type (investment or home, required)
- Property type interest (penthouse, apartment, townhouse, etc., required)
- Country of residence (optional, used for compliance and segmentation)

**Behaviour.**
- Submit captures Lead entity (state: waitlist)
- Lead tagged with buyer type, property type, signup date, signup source
- Redirect to thank-you page (retargeting trigger)
- Confirmation email sent immediately
- Lead surfaces in CRM with appropriate tags
- No call booking offered at this stage

### Sub-flow 2b. Teaser social pack

5 to 10 social posts generated by Studio for the pre-launch period. No renders shown. Lifestyle, location, neighbourhood, developer brand. Constraint model used for location, view orientation, neighbourhood character, surrounding context.

**Final version.** Posts scheduled and published via integrated social scheduler (Buffer, Later, Meta Business Suite). LinkedIn, Meta, Instagram supported.

**MVP.** Studio generates the content pack. Developer publishes manually.

### Sub-flow 2c. Pre-launch email and partner outreach

If developer has an email list, agent prompts integration. Pre-launch email sequence drafted by agent, approved by developer, sent via integrated email platform.

Partner channels (real estate networks, lifestyle publications, expat communities) flagged in consultation. Bricly does not own partner outreach in MVP but surfaces partner channel recommendations as part of the brief.

### Sub-flow 2d. Pre-launch paid media

Small budget allocation (default ~5% of total) running to the teaser landing page. Single objective: waitlist registrations.

**Final version.** Paid campaigns pushed via Meta and Google Ads APIs. Bricly manages bidding, audiences, creative rotation, with developer approval at each commitment gate.

**MVP.** Bricly generates the paid asset pack (creative, copy, audience definitions, targeting, bid recommendations, lead form configuration). Developer's marketing team launches and manages the campaigns. Lead form data flows back into Bricly CRM via lead form integration.

### Sub-flow 2e. Pre-launch ongoing

During pre-launch (typically 4 to 8 weeks):
- Waitlist leads accumulate, tagged and scored on entry
- Agent monitors waitlist growth, surfaces weekly reports
- Agent flags if waitlist trajectory is below expected for time-to-launch
- Developer can scale or pause pre-launch paid spend (approval gate)
- Sales team has visibility into waitlist but does not contact yet (waitlist contact happens in Phase 3)

---

## Phase 3. Waitlist activation

The 48 to 72 hour window before public launch where the waitlist gets exclusive early access. This is the highest-value pre-launch event and the structural reason the waitlist exists.

| Field | Description |
|-------|-------------|
| Trigger | Waitlist activation date reached (T-minus 48 to 72 hours from public launch). Agent prompts developer to confirm waitlist activation. |
| Actor | Developer + agent + system + sales team |
| Capability | T_GTM07 `activate_waitlist`. T_GTM08 `rank_waitlist_leads`. T_GTM09 `send_waitlist_outreach`. |
| Entity affected | Project (launch_phase: teaser → waitlist_activation). Lead entities (state: waitlist → waitlist_engaged on contact). Microsite (private access mode enabled for waitlist members). |
| Output | Waitlist contacted via email and WhatsApp. Sales team activated with ranked call list. Reservations and viewings booked during the exclusive window before public launch. |
| Decision points | Developer confirms waitlist activation (gate). Developer approves waitlist outreach copy (gate). Sales team notified to begin calling. |
| Orchestration target | Email platform (integrated). WhatsApp Business API. SMS platform (Twilio or equivalent). |
| Agent role | Pattern 1 (autonomous) for ranking and outreach orchestration after developer approval. Pattern 2 (proposes, developer decides) for outreach copy and timing. |

### Sub-flow 3a. Waitlist lead ranking

Agent ranks the waitlist for the sales team. Ranking logic:

**Primary signal.** Lead score, calculated from:
- Buyer type fit with available inventory mix
- Property type fit with available unit types
- Budget signals (if captured later in the journey)
- Engagement signals (email opens, page revisits, time on page)
- Profile completeness

**Tiebreaker.** Recency. Last-in-first-called among leads with equal scores. A lead that joined the waitlist yesterday has higher present-moment intent than one that joined six weeks ago, even if their fit is similar.

**Output.** Ranked call list surfaced in the CRM for the sales team. Each lead shows score, signup date, buyer type, property type, all captured signals.

### Sub-flow 3b. Waitlist outreach

Two channels fire on developer approval:

**Email.** Personalised by buyer type and property type interest. Subject line emphasises early access. Body contains:
- Full project information (renders, brochure attached or linked)
- Inventory snapshot (units in their stated property type interest)
- Call-to-action: book a viewing or call with the sales team
- Private access link to the full microsite (token-tagged for CRM tracking)

**WhatsApp.** Short message via WhatsApp Business API. Surfaces the email and offers an immediate response channel. Reply triggers sales team notification.

**Optional: SMS.** For markets where WhatsApp adoption is lower.

### Sub-flow 3c. Private access microsite mode

During waitlist_activation phase, the microsite has two modes:

**Public mode.** Continues showing teaser content. Waitlist registration still open for stragglers.

**Private mode.** Waitlist members accessing via the tokenised link see the full project: renders, full brochure, availability list, unit details, FinishPackages, pricing. Page tracks engagement and surfaces back to CRM ("Lead X viewed Unit 4B for 6 minutes").

This is the tangible benefit of being on the waitlist. The 48 to 72 hour exclusive window is real and visible.

### Sub-flow 3d. Sales team activation

Sales team gets ranked call list, lead engagement signals, and direct booking links. They work the list top to bottom. Goal: book viewings, qualify intent, secure reservations during the exclusive window before public launch.

Speed-to-contact is the single biggest predictor of conversion. Agent surfaces real-time alerts when high-score leads engage (open email, click microsite link, reply to WhatsApp) so sales team can prioritise hot signals over chronological list order.

---

## Phase 4. Public launch

The moment the project becomes publicly visible. Paid media goes live. Public landing page replaces teaser. Social posts go live. Email blast to developer's wider list. The sales team is already mid-cycle on waitlist leads.

| Field | Description |
|-------|-------------|
| Trigger | Public launch date reached. Developer double-confirms launch is live (hard gate, no automatic activation). |
| Actor | Developer + agent + system |
| Capability | T_GTM10 `activate_public_launch`. T_GTM11 `publish_launch_microsite`. T_GTM12 `activate_paid_campaigns`. T_GTM13 `publish_launch_social_pack`. T_GTM14 `send_developer_email_list_blast`. |
| Entity affected | Project (launch_phase: waitlist_activation → launch, Project state: Launching → Selling). Microsite (mode: teaser → full launch, state: Published). Campaigns (state: Pending → Live per channel). Assets (full launch sub-type now public). |
| Output | Public-facing project live. Paid media running. Lead capture active across all channels. Sales pipeline active. |
| Decision points | Developer double-confirms launch (hard gate). Developer approves any final creative not yet approved. Compliance flags resolved or overridden with audit trail. |
| Orchestration target | All approved channels: Meta, Google, social schedulers, email platforms, WhatsApp. |
| Agent role | Pattern 1 (autonomous) for orchestrated activation after developer confirmation. Pattern 3 (alerts but never decides) for any anomalies during activation. |

### Sub-flow 4a. Launch day sequence

**Hour zero (developer confirmation).** Developer hits the launch button. Hard confirmation required.

**T+0 to T+2 hours.** Microsite flips from teaser to full launch mode. Public version shows renders, brochure download, availability list, unit details, FinishPackages, pricing, lead capture forms. Booking flow goes live.

**T+0 to T+4 hours.** Email blast to developer's existing list fires (those not on waitlist). Social posts publish or notify (per integration mode).

**T+0 to T+24 hours.** Paid media campaigns activate. Initial spend conservative to learn early performance signals. Agent monitors lead form integration, attribution tracking, pixel firing.

**T+24 to T+72 hours.** Performance signals stabilise. Agent surfaces first optimisation recommendations to developer. Scaling decisions based on early data.

### Sub-flow 4b. Launch creative

Studio has already generated the launch creative pack as part of Phase 1 and Phase 2 approvals. At launch, the pack includes:

**Paid media assets.**
- Headlines and primary text per platform
- Image creative per placement and format (1:1, 9:16, 4:5, 16:9, etc.)
- Video creative where applicable
- Audience definitions per platform
- Targeting parameters per segment
- Bid strategy recommendations
- Budget pacing plan
- Lead form configuration
- UTM structure for attribution

**Organic assets.**
- Launch day social posts across platforms
- Email blast HTML and copy

**Sales team enablement.**
- Updated CRM with lead capture tags
- Brochure and inventory ready for buyer conversations
- FinishPackage options ready for personalised buyer pack generation

### Sub-flow 4c. Real-time monitoring

Agent monitors throughout launch day:
- Lead form submissions per channel
- Pixel firing and attribution health
- Compliance flags from platforms (Meta or Google ad disapprovals)
- Spend pacing against plan
- Lead score distribution across incoming leads

Anomalies surface as Recommendations or BudgetAlerts. Agent never pauses or modifies live campaigns autonomously. Developer is alerted and decides.

---

## Phase 5. Sustained lead generation

Week two onwards. The operational rhythm settles. The agent runs recommendation cycles, the developer's marketing team executes decisions, the sales team works the pipeline, the CRM measures everything against the cost ratio benchmark.

| Field | Description |
|-------|-------------|
| Trigger | Public launch complete. Project in Selling state, launch_phase = launch (will transition to phase_2_segment when triggered). |
| Actor | Developer + agent + sales team |
| Capability | T_GTM15 `generate_weekly_report`. T_GTM16 `surface_optimisation_recommendations`. T_GTM17 `surface_budget_alerts`. T_GTM18 `propose_phase_transition`. |
| Entity affected | Campaigns (ongoing). Leads (continuously created and progressed). Opportunities (created on qualified leads). CampaignReports (weekly). Recommendations (ongoing). BudgetAlerts (triggered by thresholds). |
| Output | Sustained lead flow. Weekly performance reporting. Continuous optimisation cycle. Phase transitions as inventory sells through. |
| Decision points | All optimisation actions and budget changes require developer approval. |
| Orchestration target | All approved channels, ongoing. |
| Agent role | Pattern 2 (proposes, developer decides) throughout. Pattern 3 (alerts, never decides) for budget pacing and compliance issues. |

### Sub-flow 5a. Weekly reporting cycle

Every week, the agent generates a CampaignReport. The report ends with the cost ratio number (headline metric).

**Structure.**
- Lead volume per channel, week-over-week trend
- Cost per lead per channel
- Cost per qualified lead per channel
- Cost per appointment per channel
- Cost per reservation per channel
- Cost per sale per channel (when sales close)
- Total marketing spend to date
- Total internal sales cost to date (if developer provides this)
- Total revenue closed to date
- Total cost ratio: (marketing + internal sales) / revenue
- Comparison to developer's benchmark
- Savings vs equivalent agency cost (absolute and percentage)

**Recommendations section.**
- Channels performing above target: recommendation to scale
- Channels underperforming: recommendation to optimise, refresh, or pause
- Creative variants underperforming: recommendation for refresh
- Audience signals: recommendation for narrowing or expansion
- Budget pacing: recommendation if pace will exhaust budget early or leave budget unspent

**Data gap section.**
- Leads missing qualification status
- Leads missing source attribution
- Opportunities missing stage updates
- Explicit message: "Cannot recommend [X] without [Y] data. Please update CRM to enable optimisation."

This protects Bricly from being blamed for poor performance caused by developer-side data hygiene. Surfaces the developer's responsibility visibly.

### Sub-flow 5b. Optimisation recommendation cycle

Every recommendation follows the same pattern: agent proposes, developer decides, agent executes.

**Recommendation entity attributes**
- Type (creative_refresh, budget_reallocation, audience_change, channel_pause, channel_scale, phase_transition, etc.)
- Reason (data summary that triggered it)
- Proposed action (specific, executable)
- Expected impact (predicted lead volume, cost, quality change)
- Risk flags (compliance, audience overlap, creative fatigue)
- Status (Pending, Approved, Rejected, Executed)
- Created at, decided at, executed at
- Decided by (User reference)
- Audit trail (links to source data that informed the recommendation)

**Relationships**
- BELONGS_TO: Campaign
- BELONGS_TO: CampaignBrief
- BELONGS_TO: Project

### Sub-flow 5c. Budget pacing alerts

Agent monitors spend pacing against plan. Triggers BudgetAlert entities when:

- Burn rate exceeds expected pace by configurable threshold (default 15%)
- Projected budget exhaustion before campaign end date
- Cost per qualified lead trending above target by configurable threshold (default 20% over 7 days)
- Cost ratio trending above developer's benchmark
- Underspend below configurable threshold (default 15% below pace) for 7+ days

Alerts surface in CRM, trigger developer notification, recommend a consultation with the agent to decide scale-up, scale-down, channel reallocation, or no action.

### Sub-flow 5d. Lead quality feedback loop

The cost-per-qualified-lead, cost-per-appointment, cost-per-reservation, cost-per-sale metrics all depend on the developer's sales team updating Lead and Opportunity status in the CRM faithfully.

**Required developer-side actions.**
- Mark leads as Qualified, Disqualified, with reason
- Log appointments booked and outcomes
- Create Opportunities with source attribution
- Update Opportunity stages through to Reserved, Sold, Lost
- Log Lost reasons (price, location, financing, timing, competition, other)

**Agent behaviour when data is missing.**
- Surfaces missing data explicitly in weekly reports
- Cannot recommend optimisation on channels with insufficient qualification data
- Cannot calculate accurate cost ratio without revenue and sales cost data
- Highlights data gaps as the primary blocker to confident recommendations

This is the closed-loop reporting that justifies Bricly's value to the developer. Without it, the cost ratio is incomplete and recommendations are unreliable.

---

## Phase 6. Campaign phase transitions

As inventory sells through, the campaign creative shifts. Three phases mapped to inventory state. Phase transitions are triggered by the agent, approved by the developer, executed by Studio regenerating the creative pack.

| Field | Description |
|-------|-------------|
| Trigger | Inventory percentage threshold reached OR developer requests phase transition. |
| Actor | Agent + developer + system |
| Capability | T_GTM18 `propose_phase_transition`. T_GTM19 `regenerate_phase_creative`. |
| Entity affected | Project (launch_phase transitions). Campaign (creative_phase attribute updates). Assets (new phase-specific Assets generated). |
| Output | Phase-appropriate creative live across channels. Sales team aware of phase change. Reporting adjusted. |
| Decision points | Developer approves phase transition and approves new creative pack. |
| Orchestration target | All paid channels, social, email. |
| Agent role | Pattern 2 (proposes, developer decides). Pattern 1 (autonomous) for creative generation after approval. |

### Phase 1: Project-level (launch_phase = launch)

**Inventory state.** All or most units available. Hype phase.

**Creative angle.** Whole project. Starting prices ("apartments from X"). Hero renders. Brand story. Location and lifestyle. Wide-net targeting.

**Goal.** Maximum lead volume. Build pipeline. Cost per lead relatively low because volume is the priority and quality filtering happens at the sales stage.

### Phase 2: Segment-level (launch_phase = phase_2_segment)

**Inventory state.** Mid-cycle. Some unit types running low, others still wide open. Typically triggered around 50% sell-through, configurable.

**Creative angle.** Per unit type. "Only three penthouses remaining starting from X." "Two-bedroom apartments selling fast." Segment-specific imagery. Targeting narrowed to buyer types matched to remaining inventory.

**Goal.** Quality over volume. Match remaining inventory to fit buyer types. Cost per qualified lead becomes more important than cost per lead.

### Phase 3: Unit-level (launch_phase = phase_3_unit)

**Inventory state.** Final units. Typically triggered around 80% sell-through, configurable.

**Creative angle.** Per individual unit. "Unit 4B, 110 sqm, sea view, third floor, available." Unit-specific renders, floor plans, FinishPackage options. Hyper-targeted creative powered by the constraint model and unit-specific data. This is where Bricly's structural moat is most visible.

**Goal.** Close final inventory. Cost per lead may rise but cost per sale should remain favourable because remaining units have higher specificity and motivated buyer matches.

### Phase transition mechanics

**Trigger.** Inventory percentage threshold OR developer request.

**Sequence.**
1. Agent surfaces phase transition recommendation in weekly report or as standalone alert.
2. Developer approves transition.
3. Studio regenerates creative pack appropriate to new phase. New Assets created (state: Generating → Approved with developer's approval).
4. Campaign creative updated on approved platforms.
5. Targeting refined per phase logic.
6. Reporting adjusted to phase-appropriate metrics.

### Phase 4: Closed (launch_phase = closed)

**Trigger.** Last unit reserved OR developer decision to stop OR campaign end date reached OR sustained underperformance against benchmark with no path to recovery.

**Behaviour.**
- All paid spend pauses.
- Landing page persists in current state until developer requests change.
- If project fully sold, page updates to "sold out" framing, availability list removed, but page remains live for SEO and developer brand value.
- Sales team continues working remaining pipeline (leads in process, reservations, contracts).
- Agent generates final campaign report including full lifecycle metrics and lessons-learned summary that feeds forward into the developer's next project.
- Project transitions Selling → Sold_Out (if applicable) or remains Selling with launch_phase = closed if archived early.

---

## Approval and autonomy summary

The agent operates on three patterns through the Go-to-Market flow:

**Pattern 1 (autonomous).** Asset generation after developer approval of the brief. Performance data collection. Report generation. Lead ranking. Lead capture and tagging. Phase 0 alerts. Microsite hosting operations. Compliance flag detection.

**Pattern 2 (proposes, developer decides).** Every campaign change. Every creative refresh. Every budget reallocation. Every audience change. Every phase transition. Every channel addition or pause. Waitlist outreach copy. Launch confirmation.

**Pattern 3 (alerts but never decides).** Budget pacing alerts. Cost ratio breach alerts. Compliance flag escalations. Performance anomaly detection. Data gap notifications.

**Strictly forbidden.** Auto-pausing live campaigns. Auto-scaling budgets. Auto-changing creative. Auto-publishing the launch microsite. Auto-confirming launch day. Auto-sending waitlist outreach. Auto-overriding compliance flags. Auto-transitioning Project state from Launching to Selling.

---

## Approval gate inventory (in order through the flow)

The developer must approve, sign, or confirm at every commitment gate:

1. CampaignBrief (the master document)
2. Pre-launch landing page (before publishing)
3. Teaser social pack (before publishing)
4. Pre-launch paid creative (before launching)
5. Pre-launch paid spend commitment
6. Email list integration and pre-launch email
7. Waitlist activation (T-minus 48 to 72 hours)
8. Waitlist outreach copy (email and WhatsApp)
9. Public launch confirmation (hard gate, double-confirm)
10. Launch creative across all channels
11. Launch paid spend commitment
12. Every weekly optimisation recommendation
13. Every budget increase
14. Every phase transition
15. Every creative refresh
16. Any new channel added to the mix
17. Any pause of campaigns
18. Compliance flag override (logged with reason)
19. Campaign end decision
20. Project sold-out / archived state transition

---

## Performance to CRM closed loop

This is the closed-loop reporting that justifies Bricly's value to the developer. The data flow:

**Inbound (from external sources to CRM).**
- Lead form submissions per channel → Lead entity (with source attribution via UTM and form metadata)
- Pixel events (page views, form starts, form completes, returns) → Lead engagement attributes
- WhatsApp replies → Lead engagement signals
- Email engagement → Lead engagement attributes
- Paid platform spend data (final version: via Meta and Google Ads APIs; MVP: manual entry or weekly export)
- Microsite engagement (token-tagged links from waitlist outreach) → Lead engagement signals

**Internal (CRM-side, developer-maintained).**
- Lead qualification status (Qualified, Disqualified, with reason)
- Appointment outcomes
- Opportunity creation and stage progression
- Unit holds, reservations, sales
- Lost reasons

**Outbound (from CRM to reports).**
- Cost per lead per channel (spend / leads)
- Cost per qualified lead per channel (spend / qualified leads)
- Cost per appointment per channel (spend / appointments)
- Cost per reservation per channel (spend / reservations)
- Cost per sale per channel (spend / sales)
- Source attribution all the way through to closed deal
- Campaign-to-deal correlation
- Cost ratio: (marketing spend + internal sales cost) / revenue closed
- Comparison to developer's benchmark
- Savings vs equivalent agency cost

**Cost ratio dashboard.** First-class entity. Headline view in the developer dashboard. Updates weekly. The single number that proves Bricly's value.

---

## Channel orchestration (Studio-CRM split)

| Function | Final version | MVP |
|---------|---------------|-----|
| Paid media campaign management (Meta) | Owned (push via Meta Ads API) | Asset pack handoff |
| Paid media campaign management (Google) | Owned (push via Google Ads API) | Asset pack handoff |
| Paid media campaign management (other platforms) | Orchestrated per platform | Asset pack handoff |
| Paid creative generation | Owned (Studio) | Owned (Studio) |
| Audience definition and targeting | Owned (consultation + recommendation) | Owned |
| Lead form integration | Owned | Owned (integrated forms) |
| Landing page (teaser and launch) | Owned (Bricly hosts) | Owned |
| Social post generation | Owned (Studio) | Owned |
| Social post publishing | Orchestrated (Buffer, Later, Meta Business Suite) | Handoff |
| Email content generation | Owned | Owned |
| Email sending | Hybrid (own platform option, plus integrations) | Integrations only (Mailchimp, Klaviyo, ActiveCampaign) |
| WhatsApp outreach | Orchestrated (WhatsApp Business API) | Orchestrated |
| SMS outreach | Orchestrated (Twilio or equivalent) | Orchestrated |
| Calendar booking | Orchestrated (Calendly, Cal.com) | Orchestrated |
| Performance data collection | Owned (where APIs exist) | Manual + pixel + lead form |
| Reporting and cost ratio dashboard | Owned | Owned |
| Compliance rules layer | Owned (per-jurisdiction database) | Owned |
| Recommendation generation | Owned | Owned |
| Consultation agent | Owned | Owned |
| Phase transition logic | Owned | Owned |
| Creative regeneration on phase transition | Owned | Owned |
| Partner channel outreach | Out of scope | Out of scope |
| PR | Out of scope | Out of scope |

The middleware (constraint model, prompt orchestration, brand-aware context layer, consultation logic, recommendation engine, cost ratio reporting, compliance rules layer, phase transition logic) is Bricly's. The execution at the edges (publishing, sending, paying media platforms) is orchestrated.

---

## Compliance handling

Off-plan property advertising rules vary by jurisdiction. Bricly owns a compliance rules layer that the agent queries during creative generation and campaign launch.

**Architecture.** Structured rules database per jurisdiction. Queried by the agent during creative generation and during compliance pre-flight check before campaign activation. Rules cover: prohibited claims, required disclaimers, required disclosures (energy rating, tenure, financial promotions), restrictions on artist impressions, restrictions on pricing claims, restrictions on yield or rental projections.

**Agent behaviour.**
- During creative generation, agent flags potential compliance issues with the specific rule and risk ("This claim is prohibited under MFSA rules for off-plan property in Malta. Publishing this may result in regulatory action.").
- Developer can edit creative to address the flag, or override with explicit acknowledgment.
- Overrides are logged in the audit trail with reason and timestamp.
- Audit trail preserved on the Project and on the Asset.

**Pre-flight check.** Before any campaign activation, the agent runs a compliance pre-flight pass on all creative. Issues surface as approval gates before campaign goes live.

**Jurisdictions in scope at MVP.** Determined by the markets developers in early customer cohort operate in. Malta (MFSA), UK (ASA), UAE (RERA), Spain (energy rating + tenure), expandable as needed.

---

## Edge cases

**Campaign creative rejected by platform.** Agent surfaces rejection, identifies likely cause (compliance, policy, technical), proposes corrected creative for developer approval, re-submits on approval.

**Underperforming creative variant.** Agent flags in weekly report, proposes refresh (new variants from Studio) or pause. Developer decides.

**Audience too narrow.** Agent flags low impression volume and high cost, proposes audience expansion within approved parameters. Developer decides.

**Audience too broad.** Agent flags low conversion rate and high cost per qualified lead, proposes audience narrowing. Developer decides.

**Channel budget exhausted mid-campaign.** Agent alerts via BudgetAlert. Proposes options: reallocate from other channels (within total approved), request additional budget from developer, pause channel. Developer decides.

**Compliance issue discovered post-launch.** Agent surfaces, recommends immediate creative pause, proposes corrected creative for developer approval, logs incident in audit trail.

**Developer wants to pause everything.** Single action: developer pauses Project. All campaigns pause, all outreach pauses, microsite remains live in current state. Resumable.

**Launch date moves.** Developer updates launch date. Agent recalculates all dependent dates (pre-launch start, waitlist activation, etc.). Anything already published (teaser site, social posts) flagged: revise messaging or leave as is. Anything already sent (waitlist emails) flagged as unrecoverable, developer notified of impact.

**Lead quality data not being updated.** Agent surfaces in every weekly report. After 14 days of unupdated leads, the agent escalates: "Cannot recommend optimisation without lead quality data. Please update CRM." Optimisation recommendations are not generated for channels without sufficient qualification data.

**Reservation falls through.** Unit returns to Available state. Inventory percentage recalculates. If this triggers a phase regression (e.g., back from Phase 3 to Phase 2), agent surfaces recommendation. Developer can accept regression or hold current phase.

**Project sold out but developer wants to re-engage waitlist.** Project state can remain Selling with launch_phase = closed (soft close) rather than transitioning to Sold_Out (hard close). Soft close keeps data warm. Reactivation is a developer decision.

---

## Data model implications

Items surfaced in this session that need to be applied to the data model and capability surface documents:

1. **CampaignBrief entity.** First-class entity. BELONGS_TO Project and ConsultationSession. HAS_MANY Campaigns and Recommendations. Captures the full output of the Go-to-Market consultation.

2. **Campaign entity (expanded).** Already in the data model. Add: linked CampaignBrief, creative_phase attribute (phase_1_project, phase_2_segment, phase_3_unit, closed), channel attribute, platform attribute, spend tracking, lead attribution.

3. **Recommendation entity.** First-class entity. The audit trail of every agent-proposed change. BELONGS_TO Campaign, CampaignBrief, Project. Attributes: type, reason, proposed action, expected impact, risk flags, status, decided by, audit trail.

4. **BudgetAlert entity.** First-class entity. Triggered by configurable thresholds. BELONGS_TO Campaign and Project. Attributes: trigger type, threshold breached, current value, recommended response.

5. **CampaignReport entity.** First-class entity. Generated weekly. BELONGS_TO Campaign and Project. Contains lead volume per channel, cost metrics per channel, cost ratio, savings vs benchmark, data gap section, recommendations summary.

6. **CostRatioDashboard.** First-class entity or view. Computes (marketing spend + internal sales cost) / revenue closed. Compares to developer's benchmark. Surfaces savings vs equivalent agency cost. Headline metric on developer dashboard.

7. **ComplianceFlag entity.** First-class entity. BELONGS_TO Asset, Campaign, or Brief. Attributes: jurisdiction, rule, risk level, status (raised, resolved, overridden), override reason, decided by.

8. **ComplianceRule entity.** Internal reference data. Per jurisdiction, structured rules queryable by the agent during creative generation and pre-flight checks.

9. **Project.launch_phase extended states.** Add: ready, teaser, waitlist_activation, launch, phase_2_segment, phase_3_unit, sustained, closed. Drives every state-dependent behaviour across Studio and CRM.

10. **Lead entity (expanded).** Already in data model. Add: launch_phase_at_capture (which phase was active when this lead came in), engagement signals attribute cluster (email opens, page revisits, microsite engagement, WhatsApp engagement), lead score attribute, score components attribute.

11. **Lead state extension.** Add: waitlist (captured pre-launch), waitlist_engaged (contacted during waitlist activation phase), qualified, disqualified, with their existing downstream states.

12. **Microsite.mode attribute.** Add: teaser, private_access (during waitlist activation), full_launch, sold_out. Drives what content is rendered for which visitors.

13. **Microsite private_access tokens.** Tokenised links sent to waitlist members during waitlist activation phase. Each link tied to a Lead. Engagement on private access page surfaces back to CRM as lead engagement signals.

14. **Asset sub-type: teaser_creative.** No renders, location and lifestyle-based, generated for pre-launch phase. Constraint model layer 1 used for location and surrounding context.

15. **Asset sub-type: phase_2_segment_creative.** Per unit type (penthouses, apartments, townhouses). Generated by Studio on phase transition approval.

16. **Asset sub-type: phase_3_unit_creative.** Per individual unit. Powered by constraint model and unit-specific data. Generated by Studio on phase transition approval.

17. **Asset sub-type: paid_creative.** Per channel, per placement, per format. Headlines, primary text, image variants, video variants. Tagged with target persona and target unit segment.

18. **Asset sub-type: social_post.** Per platform (LinkedIn, Meta, Instagram). Tagged with phase (pre-launch teaser, launch, sustained, phase-specific).

19. **Asset sub-type: email_template.** Pre-launch email, launch blast email, waitlist activation email, follow-up sequences.

20. **Channel entity.** Reference data. Each Channel has a type (paid_social, paid_search, organic_social, email, partner, etc.), a platform (Meta, Google, LinkedIn, etc.), and platform-specific configuration attributes.

21. **ChannelPerformance entity.** Time-series data per Channel per Campaign. Spend, impressions, clicks, leads, qualified leads, appointments, reservations, sales. Updated continuously from platform APIs (final version) or manual entry (MVP).

22. **Persona-channel mapping.** Within the CampaignBrief, the relationship between Personas and Channels (which persona is reached via which channels) is structured data, not free text.

23. **Integration entities.** Email platform integrations (Mailchimp, Klaviyo, ActiveCampaign, etc.). Social scheduler integrations (Buffer, Later, Meta Business Suite). Paid platform integrations (Meta Ads API, Google Ads API). WhatsApp Business API. SMS platform (Twilio). Calendar booking (Calendly, Cal.com). Each integration is a discrete entity with credentials, status, last sync.

24. **Approval entity (or attribute pattern).** Every approval gate generates an Approval record: what was approved, by whom, when, with what conditions. Audit trail for the entire Go-to-Market flow.

25. **Sales team activation queue.** A view, not a new entity. Surfaces ranked waitlist leads to the sales team during waitlist_activation phase. Refreshed in real time as engagement signals arrive.

26. **Lead score components.** Structured attribute on Lead. Captures the components that fed into the score (buyer type fit, property type fit, engagement signals, profile completeness, recency) so the score is explainable.

---

## Capability surface gaps (new tools, resources, prompts)

**Tools.**
- T_GTM01 `start_gtm_consultation`
- T_GTM02 `continue_gtm_consultation`
- T_GTM03 `conclude_gtm_consultation` (creates CampaignBrief)
- T_GTM04 `activate_pre_launch`
- T_GTM05 `publish_teaser_landing_page`
- T_GTM06 `generate_teaser_social_pack`
- T_GTM07 `activate_waitlist`
- T_GTM08 `rank_waitlist_leads`
- T_GTM09 `send_waitlist_outreach`
- T_GTM10 `activate_public_launch` (hard gate, double-confirm)
- T_GTM11 `publish_launch_microsite`
- T_GTM12 `activate_paid_campaigns` (final version: pushes to Meta and Google APIs; MVP: delivers asset pack)
- T_GTM13 `publish_launch_social_pack`
- T_GTM14 `send_developer_email_list_blast`
- T_GTM15 `generate_weekly_report`
- T_GTM16 `surface_optimisation_recommendations`
- T_GTM17 `surface_budget_alerts`
- T_GTM18 `propose_phase_transition`
- T_GTM19 `regenerate_phase_creative`
- T_GTM20 `run_compliance_preflight`
- T_GTM21 `override_compliance_flag` (logs override with audit trail)
- T_GTM22 `pause_project_campaigns` (developer-initiated only)

**Resources.**
- R_GTM01 `compliance_rules_by_jurisdiction` (queryable rules database)
- R_GTM02 `channel_recommendation_logic` (decision logic for platform recommendations by project type, price point, market, target segments)
- R_GTM03 `cost_ratio_benchmark_defaults` (typical agency commission rates by market for default benchmark suggestion)
- R_GTM04 `lead_score_model` (the model that ranks leads, with explainable components)
- R_GTM05 `phase_transition_thresholds` (inventory percentages that trigger phase transition recommendations)
- R_GTM06 `budget_alert_thresholds` (thresholds for BudgetAlert generation)

**Prompts.**
- P_GTM01 `run_go_to_market_consultation` (the master prompt for the consultation agent)
- P_GTM02 `generate_weekly_campaign_report` (with cost ratio focus)
- P_GTM03 `propose_creative_refresh` (for underperforming variants)
- P_GTM04 `propose_phase_transition_with_creative_pack` (combined recommendation + creative regeneration brief)
- P_GTM05 `surface_data_gaps_and_block_recommendations` (the "we cannot recommend without your input" pattern)

---

## Studio-to-CRM integration points (in this flow's scope)

Where this flow specifically depends on CRM-Studio integration:

1. **CampaignBrief approval triggers Studio asset generation.** Studio generates teaser pack, paid creative, social pack, email templates from the approved brief.

2. **CRM lead capture triggers CRM-side workflows.** Waitlist leads tagged, scored, surfaced to sales team. Engagement signals fed back to lead score.

3. **Studio phase transition triggers creative regeneration.** When phase transitions are approved, Studio regenerates the creative pack and the CRM Campaign updates with new Asset references.

4. **CRM Opportunity progression feeds back to campaign reporting.** Cost per qualified lead, cost per reservation, cost per sale, cost ratio all depend on CRM-side data updates.

5. **CRM-resident sales team activation queue.** Built from Studio-generated creative pack delivery, but the action layer lives in CRM. Sales team works from CRM, not from Studio.

6. **Cost ratio dashboard is CRM-resident.** Computed from CRM data, but Studio asset generation costs feed in as part of the marketing spend total.

7. **Buyer-customisation logic from Studio invokable during sales conversations.** When a sales rep is on a call with a qualified lead, they can invoke Studio to generate a personalised buyer pack with FinishPackage variants matched to the buyer's profile, directly from the CRM Opportunity view.

8. **Compliance flags from Studio surface in CRM.** When the agent flags a compliance issue during creative generation, the flag is visible to the developer in the CRM project view, not buried in Studio.

The two modules feel integrated because they share the same project, the same brief, the same data model, and the same agent surface. The boundary is the creative generation versus operational execution. Studio creates. CRM operates.

---

## Bricly's role explicit summary

Bricly is the consultant with a powerful toolkit, operating in three modes:

**Mode 1. The consultation agent.** Runs the Go-to-Market consultation. Surfaces recommendations. Produces the CampaignBrief.

**Mode 2. The orchestration layer.** Generates creative, manages assets, integrates with external platforms, captures data, computes reports.

**Mode 3. The recommendation engine.** Continuously surfaces optimisation opportunities and risks. Never executes without developer approval.

Bricly is not the developer's marketing department. Bricly is not their sales team. Bricly is not their media buyer (in MVP) or their automated trader (even in the final version, every commitment goes through the developer). Bricly is the system that makes a small developer's marketing function operate at the level of a much larger one, by handling the orchestration, generation, and analysis layer that would otherwise require a multi-person team.

The developer is responsible for: commercial decisions, lead quality data, sales execution, final commitment on every action that costs money or makes a public statement.

Bricly is responsible for: the quality of recommendations, the accuracy of reports, the breadth of orchestration, the compliance of generated assets, the speed of execution after approval, and the closed-loop reporting that proves the value.

---

End of document.
