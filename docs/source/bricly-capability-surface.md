# Bricly Capability Surface — Ideal Product (v1)

The locked capability surface that maps to Bricly's MCP server design. Three categories: Tools (verbs that mutate or compute), Resources (named reads of entity context), Prompts (named workflows that combine Tools and Resources to accomplish a job).

This is the **ideal-product** surface. MVP scoping happens as a separate exercise that strips back from this foundation.

The MCP server is a curated agent-facing layer over the broader API. Tools, Resources, and Prompts here are what AI agents (internal Bricly agents and external clients like buyer AI assistants, agency MCP integrations) invoke and read. The full API surface is larger; this document defines the agent-facing slice.

**Totals**: 72 Tools, 63 Resources, 19 Prompts = 154 capabilities.

---

## Conventions

- **Owned**: logic lives entirely inside Bricly. No external service involved.
- **Orchestrated**: external service does the work; Bricly wraps it with constraint-aware prompts, brand context, and persistence.
- **Hybrid**: combines owned and orchestrated work in a single capability.
- **Job references**: shorthand from `bricly-jobs.md`. D# = Developer-level, R# = Sales rep, M# = Sales manager, ML# = Marketing lead, O# = Ops, A# = Agent-level.
- **Side-effect**: a Tool that fires as part of another Tool's execution. The agent never invokes it directly.

---

## Tools

72 Tools organised by entity. Tools are verbs; each one mutates state, performs a computation with side effects, or orchestrates an external service.

### Project

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T1 | `create_project` | Create a new project record with structured intake (name, location, type, completion, price range). Triggers downstream constraint extraction when files are uploaded. | Project | D3 | Owned |
| T2 | `update_project_brief` | Update project editorial direction (target buyer, target market, style, finishes, payment terms, brand inheritance). | Project | D3, ML1 | Owned |
| T3 | `upload_architect_files` | Upload architect drawings, CAD files, availability list, plot photos. Triggers constraint model extraction. | Project, Document (ArchitectFile subtype) | D3, ML5 | Hybrid (Claude vision API for extraction pipeline behind the scenes) |
| T4 | `archive_project` | Archive a project that has had activity. Soft removal; preserves history. | Project | D5 housekeeping | Owned |

### Unit

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T5 | `update_unit_details` | Edit unit attributes (price, sqm, type, completion date, payment terms, hold metadata). Status changes go through dedicated Tools. | Unit | M2, ML3 | Owned |
| T6 | `place_unit_hold` | Place a temporary hold on a unit for a contact. Routes through ApprovalRequest if requesting User lacks bypass authority. | Unit | R3, M1, O5 | Owned |
| T7 | `release_unit_hold` | Release an active hold; unit returns to Available. | Unit | R3, M1 | Owned |
| T8 | `convert_hold_to_reservation` | Move held unit to Reserved. Routes through ApprovalRequest if requesting User lacks bypass. | Unit | R3, M1 | Owned |
| T9 | `mark_unit_sold` | Mark a reserved unit as Sold. Triggers full sync chain across collateral, commission generation conditions. | Unit | R3, M2 | Owned |

### Contact

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T10 | `create_contact` | Create a Contact record manually (rep adds someone met, ops adds a referrer). | Contact | R3, M8, ML1 | Owned |
| T11 | `capture_lead` | Inbound lead capture from any channel (form, MCP, walk-in, agent intro). Runs enrichment, dedup, qualification scoring, capture cluster population. | Contact | R2, ML8, A2, A11 | Hybrid (enrichment via external provider; dedup and scoring owned) |
| T12 | `update_contact_details` | Edit Contact attributes (identity, preferences, communication settings, contact type tags). | Contact | R3, ML4 | Owned |
| T13 | `transition_contact_state` | Move Contact through lifecycle (Lead → Qualified, Qualified → Active, → Past_Client, → Disqualified, → Do_Not_Contact). | Contact | R2, M3 | Owned |
| T14 | `log_contact_communication` | Smart conversational input. Parses free-text input and creates structured Activity, Opportunity, Appointment, or follow-up records as appropriate. | Contact, Activity, Opportunity, Appointment (polymorphic outputs) | R1, R3, A1 | Owned |

### ConstraintModel

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T15 | `update_developer_options` | Edit layer 2 of the ConstraintModel (approved finish palette, layout variants, optional configurations). Versioned. Project-wide or per-Unit scope. | ConstraintModel | ML5, D3 | Owned |
| T16 | `approve_constraint_model_version` | Approve a Pending_Review ConstraintModel version, making it Active. Fires sync chain; flags Assets stale. Includes `preview_only` mode to show blast radius before committing. | ConstraintModel | ML5, D3 | Owned |

### BrandKit

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T17 | `generate_brand_kit_options` | Generate N candidate BrandKits for a project (default 4) from brief, corporate brand inheritance, and consultation direction. Each candidate includes full pack (logo lockups, social profile, cover, palette, type, two application mockups: one over project render, one over letterhead / business card / social templates). Capped at 2 full regeneration cycles before escalation to Bricly internal support. | BrandKit | D3, ML1 | Orchestrated (image generation models for visual exploration, Canva for logo and template application — Bricly does not own brand generation) |
| T17a | `refine_brand_kit` | Inline refinement of a Candidate or Selected BrandKit without full regeneration (palette tweak, type swap, mockup variation). Unlimited use on the chosen candidate. | BrandKit | D3, ML5 | Hybrid |
| T17b | `import_brand_kit` | Set BrandKit to Active from developer-uploaded existing brand files (logo, palette, typography, guidelines). Bypasses Generating → Candidate → Selected → Approved. If imported BrandKit is missing personas, tone of voice, or art direction, triggers a targeted ConsultationSession (gap-fill mode) to complete the BrandKit. | BrandKit | D3, ML5 | Owned |
| T18 | `select_brand_kit` | Choose one candidate as the project's active BrandKit. Other candidates become Superseded. | BrandKit | D3, ML5 | Owned |
| T19 | `approve_brand_kit_version` | Approve a Pending_Review BrandKit version. Fires sync chain; flags Assets stale. Includes `preview_only` mode. Restricted to marketing or developer role. | BrandKit | ML5 | Owned |

### Persona

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T19a | `generate_personas` | Generate buyer Persona records for a Project from ProjectDetails (location, type, target market, pricing band) plus optional developer input. Typically 2 to 4 Personas per Project. Produced during brand consultation Mode A part 1. | Persona | D3, ML1 | Hybrid (LLM for synthesis; owned for reference retrieval and structuring) |
| T19b | `update_persona` | Edit a Persona record. Triggers SyncEvent on BrandKit (tone of voice may need refresh) and on downstream Briefs that reference this Persona. | Persona | ML5 | Owned |
| T19c | `import_personas` | Set Persona records to Active from developer-uploaded existing persona research. Bypasses generation. | Persona | D3, ML5 | Owned |

### FinishPackage

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T19d | `create_finish_package` | Define a named FinishPackage within ConstraintModel layer 2 (materials, finishes, reference imagery, default flag, price impact, available-on Units). | FinishPackage | ML5, D3 | Owned |
| T19e | `update_finish_package` | Edit a FinishPackage. Triggers Phase 2c variant render regeneration for the affected interior Assets via SyncEvent. | FinishPackage | ML5 | Owned |
| T19f | `retire_finish_package` | Move a FinishPackage from Active to Retired. Variant renders previously generated for it are flagged superseded. | FinishPackage | ML5 | Owned |

### Brief

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T20 | `create_and_submit_brief` | Create a Brief for an ad-hoc custom generation request and submit for execution. Supports phase scope (phase_0_consultation_pack, phase_2a, phase_2b, phase_2c_variant, phase_2d_transition, brochure_print, brochure_digital, website, marketing_template, launch_grid, or null for non-launch Briefs), language parameter, FinishPackage reference, Persona reference(s). Includes `dry_run` mode to return orchestration plan and cost estimate without executing. Triggers vision verification on Generated render outputs (T24a) with up to 3 silent regeneration attempts on failure before Brief state Escalated_To_Internal. The escape hatch when higher-level Tools don't fit. | Brief | ML2, ML4, A3 | Hybrid (orchestrates external render tool, Canva, Kling, LLMs based on requested outputs) |

### ConsultationSession

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T21 | `start_consultation` | Open an agent-led consultation on a decision (project_launch, brand, microsite, campaign, pricing, positioning, channel_strategy, budget_allocation, lead_allocation_rules, performance_review, cross_project_pattern_review, ad_hoc). Loads context relevant to type. | ConsultationSession | D3, ML1, ML5, M-level, D-level | Hybrid (LLM for conversation and reasoning; owned for reference retrieval) |
| T22 | `continue_consultation` | Send the user's response into an active session. Agent processes, surfaces references, asks next question or makes recommendation. | ConsultationSession | D3, ML1, ML5, M-level, D-level | Hybrid |
| T23 | `conclude_consultation` | Wrap up a session with captured decisions. Triggers downstream Tool invocations (Briefs created, generation kicked off, price changes applied, etc.). | ConsultationSession | D3, ML1, ML5, M-level, D-level | Owned (chains downstream Tools) |

### Asset

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T24 | `regenerate_asset` | Regenerate a specific Asset, optionally with brief overrides. Respects current ConstraintModel and BrandKit. Triggers vision verification on Generated render outputs. | Asset | ML3, R4 | Hybrid (orchestrates external render tool, Canva, Kling for video, etc. by Asset type) |
| T24a | `verify_asset_constraints` | Vision-API verification of a generated render Asset against the ConstraintModel layer 1 it was generated under. Returns per-attribute pass/fail with confidence scores. Called automatically inside generation pipelines; can be invoked directly for re-verification. Failure triggers up to 3 silent regeneration attempts, then Brief state Escalated_To_Internal. | Asset | ML5, A3 | Hybrid (Bricly orchestrates vision model; ConstraintModel comparison logic owned) |
| T24b | `override_verification_failure` | Developer override to Approve a render that failed vision verification. Audit-logged with reason. Does not modify the ConstraintModel; only the Asset's approval state. | Asset | ML5, D3 | Owned |
| T24c | `import_asset` | Upload an existing developer-provided Asset (render, brochure, video, logo, any type) as an alternative to Bricly generation. Asset state begins at Imported. Vision verification still runs on imported renders but is informational, not gating. Asset cannot be auto-regenerated on Stale (the strict cascade flags it, but the developer must manually replace). Generalises the onboarding-flow `import_assets` pattern across the full launch package. | Asset | D3, ML5 | Owned |
| T25 | `approve_asset` | Approve a Generated or In_Review Asset (or reject with feedback via decision parameter). Required before publishing. | Asset | ML5 | Owned |
| T26 | `publish_asset` | Publish an Approved Asset to specified channels (website, brochure pack, social, ad campaign, agent share, microsite). Fires SyncEvent. | Asset | ML5, M2 | Owned |
| T27 | `share_asset` | Share an Asset with a specific Contact via their preferred channel. Generates tracked link, logs Activity, updates engagement history. Polymorphic across Asset and Document. | Asset, Document | R3, R4, O3 | Hybrid (messaging providers for delivery) |

### Microsite

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T28 | `provision_microsite` | Create a Microsite (project_public_site, agent_share, availability_page, ad_landing_page, embed). Visibility constrained by type. For project_public_site, links to the Project's ContentBackbone. Personalised buyer packs are handled via `generate_personalised_buyer_pack` on Opportunity. | Microsite | D1, D3, ML1, M8 | Hybrid (hosting/DNS orchestration owned; optional custom domain via DNS provider) |
| T29 | `update_microsite` | Update Microsite content, visibility, expiry, linked Assets, form configuration, section toggles. Triggers re-render. | Microsite | ML5, M2 | Owned |
| T29a | `toggle_microsite_section` | Toggle a specific section on or off on a Microsite (project_public_site type): Hero, Development at a Glance, Residence Types, Location, Lifestyle and Amenities, Availability List, Finish Packages, Developer / Architect, Investment and Payment Plans, Project Timeline, Contact, Footer. Inner detail (per-unit features such as FinishPackage selector on unit detail page) is independent of site-section toggle. | Microsite | ML5, D3 | Owned |
| T30 | `publish_microsite` | Move Draft Microsite to Published. Live URL becomes accessible. Not invoked during launch package generation; invoked during Go-to-Market flow. | Microsite | ML5 | Owned |

### ContentBackbone

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T30a | `compose_content_backbone` | Compose the ContentBackbone for a Project from ProjectDetails, Units, FinishPackages, BrandKit, Personas. Output seeds brochure and website generation. Phase 3 entry of the launch package flow. | ContentBackbone | D3, ML1 | Owned (LLM-orchestrated for copy synthesis under BrandKit tone of voice) |
| T30b | `edit_content_backbone` | Edit a field on the backbone. Propagates to all surfaces that have not forked this field. | ContentBackbone | ML5 | Owned |
| T30c | `fork_content_to_surface` | Edit a field on a specific surface (brochure or website) and fork from the backbone. The other surface and the backbone are unaffected. Default behaviour on surface-level edits. | ContentBackbone, Microsite, Asset | ML5 | Owned |
| T30d | `propagate_fork_to_backbone` | Promote a forked surface edit back to the backbone and to the other surface. Explicit "push to website too" action. | ContentBackbone, Microsite, Asset | ML5 | Owned |

### AssetUnitMap

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T31 | `confirm_asset_unit_mapping` | Confirm one or more auto-mapped polygons (Auto_Mapped_Pending_Review → Mapped). Batchable. Accepts corrections in same call. | AssetUnitMap | ML5, M2 | Owned |
| T32 | `assign_asset_to_building` | For multi-block projects, confirm which Building(s) an Asset depicts. Resolves block-level ambiguity for the extraction pipeline. Re-runs polygon-to-Unit matching with disambiguation. | AssetUnitMap, Asset | ML5, D3 | Owned |

### Campaign

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T33 | `create_campaign` | Create a Campaign record (name, channel, window, audience, attached Assets, budget). | Campaign | ML1, ML2, D1 | Owned |
| T34 | `update_campaign` | Edit Campaign attributes including attached Assets, state transitions, budget, audience. | Campaign | ML1, ML2 | Owned |
| T35 | `log_campaign_spend` | Record spend to date. Manual entry at v1; integrates with Meta/Google/LinkedIn ad platform APIs in Phase 2. | Campaign | ML6, D4 | Owned (manual) / Hybrid (Phase 2 with ad-platform integration) |
| T36 | `generate_utm_tagged_links` | Generate channel-tagged tracked URLs for a Campaign pointing to a target Microsite. Enforces UTM consistency across the workspace. | Campaign | ML1, ML2 | Owned |

### Activity

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T37 | `log_activity` | Manually log an Activity against a Contact, Opportunity, Unit, Asset, or Project. Used for direct structured logging when `log_contact_communication`'s conversational parsing isn't needed. | Activity | R3, A1 | Owned |

### Appointment

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T38 | `schedule_appointment` | Create an Appointment, send calendar invites, fire reminders. Supports synchronous booking and async slot proposals via mode parameter. Syncs to attendees' connected external calendars. | Appointment | R1, R3, O2 | Hybrid (Google Calendar / Outlook / iCloud APIs) |
| T39 | `reschedule_appointment` | Change time, duration, location of an existing Appointment. Notifies attendees; updates external calendars. | Appointment | R1, O2 | Hybrid |
| T40 | `cancel_appointment` | Cancel an Appointment. Notifies attendees; removes from external calendars. | Appointment | R1, O2 | Hybrid |
| T41 | `record_appointment_outcome` | Log Appointment outcome (Completed, No_Show, Cancelled) with notes and optional follow-up Activity creation. | Appointment | R1, R3, O2 | Owned |

### ApprovalRequest

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T42 | `decide_approval_request` | Approve, reject, or counter-propose on a pending ApprovalRequest. The manager's most-used Tool. Chains the original mutation if approved. | ApprovalRequest | M1, M4, ML5, D1 | Owned (chains the original Tool's mutation) |
| T43 | `withdraw_approval_request` | Withdraw a pending ApprovalRequest. Used when the requester realises the request is no longer needed. | ApprovalRequest | R3, M1 | Owned |

### Partner

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T44 | `create_partner` | Add a Partner record (individual referrer or agency) with default commission terms and attribution rules. | Partner | M8, ML7 | Owned |
| T45 | `update_partner` | Edit Partner attributes including state, attribution rules, permission scope, contact details. | Partner | M8 | Owned |
| T46 | `provision_partner_mcp_access` | Grant a Partner programmatic access via MCP. Generates API credentials; configures permission scope. | Partner | A9, agency integration | Owned |
| T47 | `submit_partner_lead` | A Partner submits a lead through their connected client (MCP, API, or manual). Creates Contact with Partner attribution baked in at capture. | Partner, Contact | A9, ML8 | Owned (chains capture_lead with partner attribution) |
| T48 | `claim_partner_attribution` | A Partner claims attribution on a Contact or Opportunity they believe they sourced. Creates ApprovalRequest for manager review. | Partner, ApprovalRequest | M8, attribution disputes | Owned (creates ApprovalRequest) |

### User

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T49 | `invite_user` | Send an invite to add a new User to the workspace. Sets initial role and permission scope. | User | Developer admin, M5 | Hybrid (email delivery) |
| T50 | `update_user` | Edit User attributes (name, role, permission scope, assignment rules, notification preferences, performance targets, state). | User | Developer admin | Owned |
| T51 | `connect_user_calendar` | OAuth-connect a User's external calendar (Google, Microsoft, iCloud). Enables `schedule_appointment` to sync. | User | Developer admin, R1, O2 | Hybrid (calendar provider OAuth) |
| T52 | `reassign_user_opportunities` | Bulk-reassign all open Opportunities owned by a User to another User. Used when a User is leaving or going on leave. Notifies affected buyers; preserves history. | User, Opportunity | M7 | Owned |

### Opportunity

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T53 | `create_opportunity` | Create an Opportunity for a Contact in a specified Pipeline. Optionally attach initial Units (sales) or Project of interest (marketing). | Opportunity | R3, ML8 | Owned |
| T54 | `assign_opportunity_to_user` | Assign or reassign Opportunity ownership. Per-Opportunity decision; auto-routed via assignment rules or manually by manager. | Opportunity | M7 | Owned |
| T55 | `transition_opportunity_stage` | Move Opportunity through its Pipeline's stage state machine. Includes pause/resume via state parameter. Triggers commission generation if commission-triggering transition (combined with payment completion). | Opportunity | R3, M3 | Owned |
| T56 | `close_opportunity` | Close an Opportunity (Closed_Won or Closed_Lost). Captures reason; locks deal terms; fires downstream effects (Commission generation conditions, Asset state changes, Microsite expiry for personalised pack). | Opportunity | R3, M3 | Owned |
| T57 | `update_opportunity_preferences` | Set or update per-Opportunity preference profile (budget, beds, view, style). Overrides Contact defaults. Used during shortlisting to attach/remove Units. | Opportunity | R3, R9 | Owned |
| T58 | `set_opportunity_configuration` | Set layer 3 selections for the bound Unit (finish variants, layout variants, optional configurations). Validates against current ConstraintModel layer 2 menu. Off-menu requests trigger ApprovalRequest for menu extension. | Opportunity, ConstraintModel | R4 | Owned |
| T59 | `generate_personalised_buyer_pack` | **The headline product Tool.** Generate personalised renders, floor plan graphics, brochure PDF, and optionally a personalised microsite for a buyer based on Opportunity preferences and configuration. Multi-format via `requested_formats` parameter (defaults to renders only; microsite opt-in). Optional `consultation_session_id` for direction context. | Opportunity, Asset, Microsite | R4, D2 | Hybrid (Midjourney, Canva, brand kit enforcement, constraint compliance owned) |

### Offer

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T60 | `draft_offer` | Create an Offer in Drafted state. Accepts optional `template_id` to pre-fill from workspace template (standard cash buyer, early-bird, etc.). | Offer | R3 | Owned |
| T61 | `submit_offer` | Submit a Drafted offer. Routes to internal review (ApprovalRequest) if terms are outside guardrails; otherwise communicated to buyer. | Offer | R3, M1 | Owned (chains ApprovalRequest if needed) |
| T62 | `accept_offer` | Accept an Offer. Triggers full downstream chain: PaymentPlan instantiation from accepted terms, Unit state transition to Reserved, related Offers in chain marked Superseded. | Offer, PaymentPlan, Unit | R3, M1 | Owned (multi-entity chain) |

### Payment

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T63 | `set_payment_terms` | Set the payment terms for an Opportunity (typically 2-3 events tied to contractual moments: reservation, POS, final deed). Often inherited from accepted Offer. | PaymentPlan | R3, M1 | Owned |
| T64 | `record_payment_received` | Record that a payment event landed. Uploads confirmation Document, marks event Paid. Triggers Commission generation when (Opportunity Closed_Won + final PaymentMilestone Paid). | PaymentMilestone, Document, Commission (conditional) | O4, M4 | Owned (multi-entity chain) |

### Commission

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T65 | `generate_commission` | Generate Commission record(s) for an Opportunity when trigger conditions met (deal Closed_Won AND final payment received). Typically automated as side effect; invokable manually for retrospective adjustment. Produces N records per deal (rep, referrer, agency splits). | Commission | M4 | Owned |
| T66 | `approve_commission_payout` | Approve Commission for payment. Pending_Approval → Approved. | Commission | M4 | Owned |
| T67 | `record_commission_payment` | Record that a Commission has been paid. Uploads PaymentDocument confirmation; marks Paid. | Commission, Document | M4, O3 | Owned (chains Document upload) |

### Document

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T68 | `upload_document` | Upload a Document file. Polymorphic by subtype (KYC, Contract, Architect, Payment, Marketing). Attaches to subject entity. Subtype-specific validation runs at upload. | Document | O1, O3, R3 | Owned |
| T69 | `request_document_from_contact` | Send a Contact a secure upload request for a specific document type (KYC, ID, proof of funds, signed reservation). Generates secure upload link; tracks completion. | Document | O1, O3 | Hybrid (messaging providers + owned secure upload portal) |
| T70 | `verify_document` | Mark a Document as verified (or rejected via decision parameter). Records verifier User, timestamp, verification authority for regulatory documents. | Document | O3 | Owned |
| T71 | `send_document_for_signature` | Send a ContractDocument out for electronic signature. Tracks signature progress; retrieves signed file. | Document | O1, R3 | Hybrid (DocuSign or equivalent e-signature platform) |

### Notification

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| T72 | `send_notification` | Manually fire a Notification to a User or Contact. Edge cases not covered by auto-firing Tools (urgent ad-hoc alert, broadcast, manual escalation). | Notification | M1, R3 edge cases | Hybrid (channel providers for delivery) |

### Polymorphic Tools

The following Tool is polymorphic across many entities and counted once:

- `tag_entity` covers tagging on Contact, Unit, Project, Opportunity. Already included in the 72 count above.

### AuditEvent

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| (within 72) | `export_audit_log` | Export a filtered slice of the AuditEvent log for compliance, audit, or legal review. Generates tamper-evident export. | AuditEvent | Compliance, legal | Owned |

### Notification (mark-read)

| # | Name | Description | Entity | Job | Owned/Orchestrated |
|---|------|-------------|--------|-----|---------------------|
| (within 72) | `mark_notification_read` | Mark one or more Notifications as Read or Dismissed via state parameter. | Notification | All Users | Owned |

---

## Resources

63 Resources organised by entity. Resources are named reads. They return entity context, often computed or filtered, but never mutate state.

### Project

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R1 | `project` | Project | D5, M6 | Full project state, current ConstraintModel/BrandKit versions, unit count and status mix, sell-out percentage, target dates, microsite URL. |
| R2 | `workspace_projects` | Project (collection) | D4, D5, M6 | All projects in workspace; filterable by state. |
| R3 | `project_launch_readiness` | Project (computed) | D3 | Checklist view; what's missing to go from Draft to Launching; blockers flagged. |

### Unit

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R4 | `unit` | Unit | R3, R9, M1 | Full unit detail, current status, current Opportunity binding, price, payment terms, available layer 2 options, floor plan reference. |
| R5 | `unit_availability` | Unit (project filtered) | M2, R9, ML3 | All units in a project, filterable by status, type, beds, price band, floor, view, finish options. |
| R6 | `workspace_units_matching` | Unit (cross-project, matched to criteria) | R9 | Units across all live projects matching buyer criteria (budget, beds, location, completion, lifestyle tags). |

### Contact

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R7 | `contact` | Contact | R1, R3, ML4 | Full Contact detail, identity, preferences, contact type tags, current state, capture cluster, KYC status, owner. |
| R8 | `workspace_contacts` | Contact (collection) | M7, ML4 | All Contacts in workspace; filterable by state, type, owner, source. |
| R9 | `workspace_leads_inbox` | Contact (filtered to Lead) | R2, M7 | All Leads not yet assigned or qualified; the fresh leads surface. |
| R10 | `workspace_contacts_by_tag` | Contact (filtered by tag) | M7, ML4, ML7, R9 | Tag-based segmentation (single tag, AND, OR, NOT). |

### ConstraintModel

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R11 | `project_constraints` | ConstraintModel | R4, A3, ML5 | Full current ConstraintModel: layer 1 (read-only), layer 2 (editable surface), version metadata, extraction confidence flags. Version history included. |
| R11a | `project_finish_packages` | FinishPackage (filtered by Project) | R3, R4, A3, ML4 | All Active FinishPackages on a Project with materials, finishes, reference imagery, default flag, price impact, available-on Units. Drives the FinishPackage selector on the website and in sales meetings, and is the source for Phase 2c variant render generation. |

### BrandKit

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R12 | `project_brand_kit` | BrandKit | ML5, A3 | Current active BrandKit: logo suite, palette, typography, brand guidelines PDF, tone of voice, brand keywords, do's and don'ts, art direction (mood, lighting profile, lifestyle population rules, composition rules, colour grading), application mockups. |
| R13 | `project_brand_kit_candidates` | BrandKit (filtered to candidates) | D3 | Active candidate BrandKits during selection phase. Powers the "choose your brand" surface. |
| R13a | `project_personas` | Persona (filtered by Project) | D3, ML1, ML4, A3 | All Active Personas for a Project. Used by BrandKit for tone grounding, by Briefs for copy targeting, by Campaigns for audience targeting, by Opportunities for persona matching. |
| R13b | `style_library` | Style reference imagery (curated) | D3, ML1 | Curated reference photography for brand consultation Mode A part 2, specifically Block 2 (time of day and lighting). Real photographs of real buildings at different times of day. Vendor-agnostic. |

### Brief

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R14 | `project_briefs` | Brief (filtered by Project) | ML5, D5 | All Briefs for a project: type, phase scope, status, requesting User/Agent, resulting Assets, regeneration counter, escalation flag if vision verification failed three times. Cost audit surface. |
| R14a | `project_content_backbone` | ContentBackbone | ML5, D3 | The Project's current ContentBackbone: editorial copy across project story, location, development, amenities, residence types, specifications, investment, developer / architect, contact, lead capture configuration, section toggle state per surface, fork map per editorial field. Source of truth for brochure and website content composition. |

### ConsultationSession

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R15 | `consultation_session` | ConsultationSession | Audit, resumption | Full conversation log, surfaced references, recommendations, decisions, downstream outputs. |

### Asset

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R16 | `asset` | Asset | ML5, R4, R3 | Full Asset detail: type-specific attributes, file refs with download URLs, BrandKit/ConstraintModel versions applied, approval/publish status, distribution channels. |
| R17 | `project_assets` | Asset (filtered by Project) | ML5, M2, ML4 | All Assets for a project; filterable by type, state, Unit, Opportunity, channel. The project's marketing collateral library. |
| R18 | `unit_collateral` | Asset (filtered by Unit) | R3, R4, ML4 | All Assets associated with a specific Unit: floor plan, unit-specific renders, one-pagers, brochure pages featuring this Unit. |

### Microsite

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R19 | `microsite` | Microsite | ML5, D5 | Full Microsite detail: type, subject, URL, visibility, linked Assets, view tracking, expiry, capture form config. |
| R20 | `microsite_engagement` | Microsite (computed) | D4, D6, ML5 | View tracking detail: total views, unique visitors, time on page, scroll depth, form captures, click-throughs. Per-Microsite and aggregated. |

### AssetUnitMap

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R21 | `pending_mapping_review` | AssetUnitMap (filtered) | ML5, M2 | Auto-mapped polygons below confidence threshold; the marketing lead's review queue. |
| R22 | `pending_block_assignment` | Asset (filtered to multi-block, unresolved building) | ML5, D3 | Multi-block project Assets needing block confirmation. The disambiguation queue. |

### Campaign

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R23 | `campaign` | Campaign | ML6, D4, D5 | Full Campaign detail: channel, state, window, audience, attached Assets, budget, spend, attributed Leads/Opportunities count and value, computed metrics. |
| R24 | `campaign_performance` | Campaign (computed, cross-Campaign) | D4, D6 | Aggregated performance: cost per lead, conversion rate, ROI by channel. Feeds budget allocation and A12 consultation. |
| R25 | `campaign_attribution` | Contact/Opportunity (filtered by Campaign) | ML6, D4, D6 | All Leads attributed to a Campaign with conversion status, current stage, time-to-conversion, deal value. |

### Activity

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R26 | `contact_activity` | Activity (filtered by Contact) | R1, R3, M3 | Full activity timeline against this Contact. |
| R27 | `opportunity_activity` | Activity (filtered by Opportunity) | R1, R3, R5, M3 | All Activities against an Opportunity; the deal timeline. |
| R28 | `workspace_activity_feed` | Activity (collection) | M3, D4 | Workspace-wide activity stream; filterable by entity type, actor, time window. |

### Appointment

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R29 | `user_appointments` | Appointment (filtered by User attendee) | R1, M3 | All Appointments for a specific User. The rep's schedule. |
| R30 | `opportunity_appointments` | Appointment (filtered by Opportunity) | R1, O2 | All Appointments tied to an Opportunity; the deal scheduling history. |
| R31 | `user_availability` | User (computed from calendar) | R1, A11 | A User's availability slots computed from external calendar feeds. Used for async slot proposal and A11 agent scheduling. |

### ApprovalRequest

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R32 | `pending_approvals_queue` | ApprovalRequest (filtered to Pending, scoped to current User) | M1, M4, ML5 | The approver's work queue. Sorted by priority/expiry. The manager's morning view. |

### Partner

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R33 | `partner` | Partner | M8 | Full Partner detail: type, name, contact, commission terms, attribution rules, linked individuals, MCP status, total commissions paid, deals attributed. |
| R34 | `workspace_partners` | Partner (collection) | M8, D4 | All Partners; filterable by type, state, performance. |
| R35 | `partner_performance` | Partner (computed) | D4, D6, M8 | Aggregated metrics per Partner: deals sourced, conversion rate, average deal value, commission paid, disputes. |
| R36 | `partner_opportunities` | Opportunity (filtered by Partner) | M8, M4 | All Opportunities attributed to a specific Partner with stage, value, commission accrued. |

### User

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R37 | `current_user` | User (caller) | All Tools needing caller context | The User invoking the current call. Used to scope reads ("my opportunities") and verify permission. |
| R38 | `workspace_users` | User (collection) | M3, M7, Developer admin | All Users; filterable by role, state, performance. |
| R39 | `user_performance` | User (computed) | M3, M5, D4 | Detailed performance: target vs attainment, conversion rates, average deal value, commission earned and pending, activity volume, response times. |
| R40 | `user_workload` | User (computed) | M7 | Current load: open Opportunities count, pending follow-ups, upcoming Appointments, response time SLA. |
| R41 | `workspace_leaderboard` | User (collection, computed) | M5 | Performance-ranked view of sales-facing Users; filterable by metric, time window. Role-scoped visibility. |

### Opportunity

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R42 | `opportunity` | Opportunity | R1, R3, M3 | Full Opportunity detail. |
| R43 | `user_opportunities` | Opportunity (filtered by owner User) | R1, R3, M3 | The rep's pipeline. |
| R44 | `pipeline_forecast` | Opportunity (aggregated by stage, pipeline-scoped) | M6, D5 | Stage-weighted forecast: projected close-out by quarter with confidence bands. Feeds D5 investor reporting and A6 forecasting agent. |
| R45 | `at_risk_opportunities` | Opportunity (computed) | R1, M3, A4 | Stuck-in-stage, gone-cold, missed follow-up, unanswered approval. The "save these deals" surface. |
| R46 | `opportunity_pending_actions` | Computed across linked entities | R1, R3 | "What needs to happen next on this deal": pending approvals, upcoming appointments, overdue follow-ups, stale Assets. The rep's go-to read. |

### Offer

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R47 | `opportunity_offers` | Offer (filtered by Opportunity) | R3, M1 | All Offers in an Opportunity including counter-chains. Negotiation history. |

### Payment

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R48 | `opportunity_payment_terms` | PaymentPlan (filtered by Opportunity) | R3, R1, O4 | The active PaymentPlan with full event schedule and current state. |
| R49 | `overdue_payments` | PaymentMilestone (filtered) | O4, M1, D5 | Payment events past their expected moment without confirmation. Ops chase surface. |
| R50 | `cash_flow_projection` | PaymentMilestone (aggregated) | D5, A6, A12 | Forward-looking cash flow across all active deals. Aggregated by month/quarter with paid vs upcoming vs at-risk breakdown. Critical for D5 investor/bank reporting. |

### Commission

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R51 | `user_commissions` | Commission (filtered by User recipient) | R6, M3, M5 | Rep's earnings: paid, pending, generated, disputed. |
| R52 | `partner_commissions` | Commission (filtered by Partner recipient) | M4, M8 | Partner's commission earnings; visible internally and via MCP to the connected Partner (scoped). |
| R53 | `pending_commission_approvals` | Commission (filtered to Pending_Approval) | M4 | The manager's commission approval queue. |
| R54 | `workspace_commission_summary` | Commission (aggregated) | D4, D5 | Total accrued YTD, total paid YTD, broken down by rep, partner, project, channel. Heavy aggregation, cached. |

### Document

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R55 | `opportunity_documents` | Document (filtered by Opportunity) | R3, O3 | All Documents attached to an Opportunity: KYC, contracts, payment receipts, signed reservation, ID. The deal file. |
| R56 | `pending_document_requests` | Document request (filtered to outstanding) | O3 | Contacts sent document requests but not completed. The ops chase queue. |

### Notification

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R57 | `user_notifications` | Notification (filtered by recipient = current User) | All Users | The user's inbox. Filterable by read state, event type, priority. |

### AuditEvent

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R58 | `entity_audit_trail` | AuditEvent (filtered by target entity) | Compliance, M4 dispute resolution | All AuditEvents touching a specific entity. Used for compliance audits, dispute investigation, GDPR data access. |
| R59 | `user_audit_trail` | AuditEvent (filtered by actor User) | Security, compliance | All actions performed by a User. Performance reviews, suspicious activity investigations, role-change audits. |

### Workspace tagging

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R60 | `workspace_tags` | Tag vocabulary (computed) | M7, ML4, ML7 | All tags currently in use across the workspace with usage count and common pairings. The controlled vocabulary. |

### Additional read surfaces

| # | Name | Entity | Job | Context returned |
|---|------|--------|-----|------------------|
| R61 | `approval_request` | ApprovalRequest | M1, M4, ML5 | Single ApprovalRequest detail. |
| R62 | `offer_chain` | Offer (computed by chain root) | R3, M1 | Full counter-offer chain reconstruction. Negotiation audit trail. |
| R63 | `commission_history` | Commission (filtered by Opportunity or Unit) | M4 audit | Full commission history for a deal: all records, adjustments, disputes, payments. |

---

## Prompts

19 named workflows. Each Prompt combines Tools and Resources into a sequence the agent can follow to accomplish a job end-to-end.

### Developer-level

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P1 | `launch_new_project` | D3, ML1 | `create_project` → `update_project_brief` → `upload_architect_files` → constraint extraction → `approve_constraint_model_version` → `start_consultation` type=project_launch → `continue_consultation` loop → `conclude_consultation` triggers `generate_brand_kit_options` → `select_brand_kit` → `generate_project_assets` via `create_and_submit_brief` → `provision_microsite` type=project_public_site → `approve_asset` loop → `publish_microsite` and `publish_asset` → state transition to Selling. |
| P2 | `prepare_investor_report` | D5, A6 | `workspace_projects` → `pipeline_forecast` per project → `cash_flow_projection` workspace → `workspace_commission_summary` → `campaign_performance` → optionally `start_consultation` type=performance_review → agent composes report → optionally `provision_microsite` type=embed for shareable dashboard. |
| P3 | `review_team_performance` | D4, M3, M5 | `workspace_users` filtered to sales → `user_performance` per user → `user_activity` per user → `workspace_leaderboard` → `at_risk_opportunities` → optionally `start_consultation` type=performance_review for deeper analysis. |
| P4 | `plan_next_project_from_history` | D6, A7 | `workspace_projects` filtered to Completed/Selling → `campaign_performance` cross-project → `workspace_commission_summary` aggregated → `microsite_engagement` patterns → `start_consultation` type=cross_project_pattern_review with full data → recommendation captured at conclusion. |

### Sales rep

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P5 | `daily_pipeline_review` | R1, R7 | `current_user` → `user_opportunities` filtered to active → `at_risk_opportunities` filtered to current user → `user_notifications` unread → `opportunity_pending_actions` per at-risk → prioritised follow-up list. |
| P6 | `prep_for_buyer_meeting` | R3, R5 | `contact` → `contact_opportunities` → `contact_activity` recent → `opportunity_payment_terms` if late-stage → `unit_collateral` for shortlisted units → `unit_availability` for project → meeting brief composed: buyer profile, history, current state, suggested talking points. |
| P7 | `in_meeting_personalisation` | R4, D2, A3 | Rep gives buyer preferences → `update_opportunity_preferences` → `set_opportunity_configuration` for selected variants → `generate_personalised_buyer_pack` with `requested_formats=["renders"]` (renders-only fast path) → rep shows in real time. |
| P8 | `share_buyer_pack_post_meeting` | R3, R4, D2 | `current_user` and `opportunity` context → `generate_personalised_buyer_pack` with `requested_formats=["renders","brochure","microsite"]` → share via tracked link with buyer through their preferred channel → optionally `schedule_appointment` for follow-up. |

### Sales manager

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P9 | `morning_approval_queue_review` | M1 | `current_user` → `pending_approvals_queue` → per item: `approval_request` detail plus target entity context → `decide_approval_request` per item. |
| P10 | `allocate_inbound_lead` | M7 | `workspace_leads_inbox` → per lead: `contact` detail plus capture context → `workspace_users` filtered to reps → `user_workload` to balance load → `assign_opportunity_to_user`. |
| P11 | `verify_commission_payouts` | M4 | `pending_commission_approvals` → per item: `commission` detail plus underlying `opportunity` and `offer` → `approve_commission_payout` per item → handoff to ops for payment processing. |

### Marketing lead

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P12 | `produce_project_marketing_package` | ML1, D3 | The launch package generation flow. Picks up after onboarding ConstraintModel Approved. Phase 0: `create_and_submit_brief` (phase_0_consultation_pack) for 4 neutral hero renders → vision verification loop. Phase 1: `start_consultation` (brand) Mode A part 1 (name, building names, `generate_personas`, tone of voice) → pause while Phase 0 renders generate → Mode A part 2 (art direction with Phase 0 renders as visual reference, using `style_library`) → `generate_brand_kit_options` (Mode B, 4 candidates) → `refine_brand_kit` and `select_brand_kit` → `approve_brand_kit_version`. Phase 2: `create_and_submit_brief` (phase_2a, 4 style-approval renders, brand-applied) → vision verification + `approve_asset` per render → on approval, `create_and_submit_brief` (phase_2b, full baseline + multi-face hero adders) → `create_and_submit_brief` (phase_2c_variant) per Active FinishPackage → `create_and_submit_brief` (phase_2d_transition) for multi-face buildings (Kling orchestrated). AssetUnitMaps proposed for exterior renders and level floor plans → `confirm_asset_unit_mapping` per render or plan. Phase 3: `compose_content_backbone` → in parallel, `create_and_submit_brief` (brochure_print + brochure_digital) and `provision_microsite` (project_public_site, Draft) → `toggle_microsite_section` per developer choice → `approve_asset` per brochure and final site preview. Phase 4: `create_and_submit_brief` (marketing_template) sample first then full template set, plus `create_and_submit_brief` (launch_grid) → `approve_asset` per. Phase 5: Approved Assets surface in CRM via R12, R17, R18. Project stays in Launching state. **Does not** invoke `publish_microsite` or `set_project_live` — those belong to a separate Go-to-Market flow. |
| P13 | `launch_campaign_with_attribution` | ML6, ML1 | `create_campaign` → `update_campaign` with attached approved creative → `generate_utm_tagged_links` → `update_campaign` to Live → Phase 2: `publish_campaign_to_platform` for connected ad accounts → periodic performance sync. |

### Ops

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P14 | `assemble_deal_file` | O3, O1 | `opportunity` detail → `opportunity_documents` to see what exists → `pending_document_requests` for what's outstanding → `request_document_from_contact` for gaps → `verify_document` as items arrive → deal file complete when required docs Verified. |

### Agent-level

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P15 | `inbound_lead_qualification_conversation` | A11, R1 | `capture_lead` fires → agent opens conversation via buyer's preferred channel → qualifying questions → `workspace_units_matching` to find candidates → `schedule_appointment` in async slot proposal mode → on slot pick: handoff to assigned rep with conversation history attached. |
| P16 | `run_consultation` | A12 | Trigger context determines type → `start_consultation` with subject and context → loop: `continue_consultation` until adaptive Q&A reaches conclusion or soft cap → `conclude_consultation` produces downstream outputs (Briefs, tag updates, price changes, etc.). |

### Gap-fillers (added in audit pass)

| # | Name | Job | Sequence summary |
|---|------|-----|------------------|
| P17 | `gdpr_data_subject_access` | Compliance, governance | `contact` → `entity_audit_trail` filtered to Contact → `opportunity_documents` filtered to Contact → `contact_activity` full export → `export_audit_log` filtered to Contact → compose data package per regulation. |
| P18 | `dispute_resolution` | M1, M4, M8 | Dispute fired via `dispute_commission` or `claim_partner_attribution` → ApprovalRequest enters `pending_approvals_queue` → manager reads `entity_audit_trail` on target entity → reviews `offer_chain` if commission-related or `partner_opportunities` if attribution-related → `decide_approval_request` with counter or resolution. |
| P19 | `rep_onboarding` | M5, Developer admin | `invite_user` → on accept: `connect_user_calendar` → `update_user` to set role, permission scope, assignment rules, performance targets → assign initial Opportunities via `reassign_user_opportunities` or auto-rules → rep ready. |

---

## Coverage matrix

This appendix maps every job and entity to the capabilities serving them. The matrix is the audit of the surface; if a job or entity has no capability, the surface is incomplete.

### By job

**Developer-level**

| Job | Tools | Resources | Prompts |
|-----|-------|-----------|---------|
| D1 Capture demand directly | T11, T28, T36, T47 | R20, R25 | P13 |
| D2 Convert via personalisation | T58, T57, T59 | — | P7, P8 |
| D3 Launch fast | T1, T2, T3, T15, T16, T17, T18, T19, T28 | R3, R11, R12, R13, R22 | P1, P12 |
| D4 Visibility | — | R38, R39, R28, R41, R40, R45, R44, R54, R20, R24 | P3 |
| D5 Forecast and report | — | R44, R50, R54, R2, R24 | P2 |
| D6 Use multi-project history | — | R2, R35, R20, R24 | P4 |

**Sales rep**

| Job | Tools | Resources | Prompts |
|-----|-------|-----------|---------|
| R1 Work warm leads | T38, T14 | R43, R45, R7, R26, R46, R31 | P5, P15 |
| R2 Capture walk-in | T11, T10, T53, T13, T14 | — | P15 |
| R3 Run viewing | T6, T57, T58, T59 | R4, R18, R7, R42, R46 | P6, P7 |
| R4 Customise live | T59, T24 | R18 | P7 |
| R5 Single source of truth on buyer | — | R7, R26, R42, R47, R49, R63 | P6 |
| R6 See own commissions | — | R43, R51, R44, R39 | — |
| R7 Right cadence follow-up | — | R45, R46 | P5 |
| R8 Update CRM without login | T14, T51 | — | — |
| R9 Match buyer across developments | — | R6, R5, R4 | — |

**Sales manager**

| Job | Tools | Resources | Prompts |
|-----|-------|-----------|---------|
| M1 Approve | T42, T43 | R32, R61 | P9 |
| M2 Inventory ops | T5 | R5, R4, R45, R32 | — |
| M3 Visibility on team | — | R28, R39, R43, R45 | P3 |
| M4 Verify payouts | T66, T67 | R53, R52, R63 | P11 |
| M5 Motivate team | T50 | R41, R39 | P19 |
| M6 Brief developer | — | R44, R54, R50, R2 | P2 |
| M7 Allocate leads | T54, T50, T52 | R9, R38, R40 | P10 |
| M8 Manage agency relationships | T44, T45, T46, T47, T48 | R33, R34, R36, R52 | — |

**Marketing lead**

| Job | Tools | Resources | Prompts |
|-----|-------|-----------|---------|
| ML1 Brief and coordinate launch | T1, T2, T33, T34 | — | P1, P12, P13 |
| ML2 Always-on content | T20, T26 | R17, R14 | — |
| ML3 Refresh after change | T24 | R17 (filtered Stale), R5 | — |
| ML4 Equip sales team | T20, T27 | R7, R10, R18 | — |
| ML5 Gatekeep | T16, T19, T25, T26, T29, T30, T31, T32 | R17, R21, R22, R12 | — |
| ML6 Manage paid media | T33, T34, T35 | R23, R24, R25 | P13 |
| ML7 Brand consistency | T19 | R12, R13, R60 | — |
| ML8 Manage external lead sources | T11, T47 | R9 | — |

**Ops**

| Job | Tools | Resources | Prompts |
|-----|-------|-----------|---------|
| O1 Contract paperwork | T68, T71 | R55 | P14 |
| O2 Coordinate appointments | T38, T39, T40, T41 | R29, R30, R31 | — |
| O3 Organise deal files | T68, T69, T70 | R55, R56 | P14 |
| O4 Track milestones | T63, T64 | R48, R49 | — |
| O5 Hold transitions | T6, T7, T8 | R4 | — |

**Agent-level**

| Job | Capabilities |
|-----|--------------|
| A1 Conversational rep input | T14 directly; surface consumed |
| A2 Lead triage | T11, T13, T54; Prompt-driven |
| A3 Render generation | T24, T59; P7 |
| A4 Follow-up | T14, T38; reads `at_risk_opportunities` |
| A5 Sync collateral | System-driven via SyncEvents; T24, T26 |
| A6 Reporting | P2, reads R44, R50, R54, R24 |
| A7 Cross-project pattern | P4, reads R2, R20, R35 |
| A8 Buyer's AI assistant | T28 (public surfaces), T11, T38 |
| A9 Agency AI | T47, T48; reads R36, R52 |
| A10 Developer automations | Full API surface exposure |
| A11 Inbound qualification | P15, T38 in async slot proposal mode |
| A12 On-demand consultant | P16, T21, T22, T23 |

### By entity

All 27 core entities (1-27 in the data model) have Tools that mutate them and Resources that read them:

| Entity | Tools | Resources |
|--------|-------|-----------|
| Workspace | T49 (User-level mutations scope to Workspace); platform plumbing | R60, R37 implicitly |
| Project | T1, T2, T3, T4 | R1, R2, R3 |
| Unit | T5, T6, T7, T8, T9 | R4, R5, R6 |
| Contact | T10, T11, T12, T13, T14 | R7, R8, R9, R10 |
| Opportunity | T53, T54, T55, T56, T57, T58, T59 | R42, R43, R44, R45, R46 |
| Activity | T37 | R26, R27, R28 |
| Appointment | T38, T39, T40, T41 | R29, R30, R31 |
| ApprovalRequest | T42, T43 (others system-fired) | R32, R61 |
| Partner | T44, T45, T46, T47, T48 | R33, R34, R35, R36 |
| User | T49, T50, T51, T52 | R37, R38, R39, R40, R41 |
| ConstraintModel | T15, T16 | R11 |
| Asset | T24, T25, T26, T27 | R16, R17, R18 |
| BrandKit | T17, T18, T19 | R12, R13 |
| Brief | T20 | R14 |
| Campaign | T33, T34, T35, T36 | R23, R24, R25 |
| AssetUnitMap | T31, T32 | R21, R22 |
| Pipeline | Hardcoded default at v1; mgmt Tools deferred to Phase 2 | — |
| PaymentPlan | T63 | R48 |
| PaymentMilestone | T64 | R49, R50 |
| Document | T68, T69, T70, T71 | R55, R56 |
| Commission | T65, T66, T67 | R51, R52, R53, R54, R63 |
| Microsite | T28, T29, T30 | R19, R20 |
| Notification | T72, mark-read Tool | R57 |
| SyncEvent | System-fired; admin Tools off agent surface | — |
| AuditEvent | export_audit_log | R58, R59 |
| Offer | T60, T61, T62 | R47, R62 |
| ConsultationSession | T21, T22, T23 | R15 |

Post-sale entities (28-32: Reservation, Contract, CompletionMilestone, PurchaserPortalAccess, CollaborationSpace) are marked as future expansion in the data model and are not surfaced here.

---

## Strategic notes

1. **The MCP surface is curated, not the full API.** Tools, Resources, and Prompts here are what AI agents invoke. The full API has additional endpoints (admin operations, bulk data, granular CRUD) not exposed on the MCP surface to keep the agent's verb surface clean.

2. **Side-effect creation is the default for governance entities.** ApprovalRequest, Activity, AuditEvent, Notification, SyncEvent, Commission (mostly) are created as side effects of other Tools, not via direct agent verbs. This keeps the agent's mental model focused on intent (place a hold, accept an offer) rather than mechanics.

3. **The consultation pattern (T21-T23 plus P16) is the visible AI-OS expression.** At project launch, brand decisions, pricing reviews, performance reviews, cross-project pattern analysis. Same three Tools, polymorphic by type, different downstream outputs.

4. **The personalised buyer pack Tool (T59) is the headline product capability.** Multi-format, agent-friendly, orchestrates Midjourney/Canva/constraint compliance into one verb the rep invokes from a buyer meeting. Everything else in the Studio surface supports this moment.

5. **The Partner surface is the moat for agency integration.** T46-T48 enable A9 (agency AI submitting leads). Programmatic agency integration becomes a defensible position once running.

6. **D6 retention compounds.** The cross-project capabilities (R20, R24, R35, R44, P4) become more valuable as more projects run on Bricly. Day-one customers don't see this value; multi-project customers do.

---

## What's next

This document defines the **ideal capability surface**. The natural next exercises:

1. **MVP scoping.** Apply build-cost and customer-value filters to identify the subset of this surface that ships in v1. Different exercise, different filters.

2. **API specification.** The Tools and Resources here are agent-facing names and descriptions. The next layer is the actual API contract (full input/output schemas, validation rules, error codes, rate limits).

3. **Prompt engineering.** Each Prompt above is a sequence description. Implementing them as actual MCP Prompts requires writing the prompt text, defining the parameters, and testing the agent's reliability through them.

4. **Roadmap mapping.** Tag every capability with its build phase and link to dependencies. The MCP surface is the source of truth for what Bricly does; the roadmap is the order in which it gets built.
