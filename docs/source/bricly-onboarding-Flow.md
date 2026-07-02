# Bricly Developer Onboarding Flow

End-to-end flow for how a new developer goes from sign-up through to a fully populated, live project with constraint model parsed, brand foundation set, CRM ready, and Studio ready to generate launch material.

This is the ideal-product flow. MVP scoping is a separate exercise that strips back from this foundation.

---

## Operating principles for this flow

1. **The wizard is its own surface**, not Studio's or CRM's. Both modules link to it for new project creation. After onboarding, work splits between modules.
2. **Module framing (current direction): asymmetric.** CRM is the consumer front, where the developer and team work day-to-day. Studio is the production back, where assets are generated and managed. Studio outputs are first-class objects in CRM views.
3. **Linear wizard.** All generation-affecting fields required. Pure CRM operational fields are deferred to Settings or just-in-time prompts.
4. **Unified, no path branching.** One wizard, with optional uploads at each generation step so developers with existing assets (brand, renders, brochure) can import rather than generate.
5. **Every error speaks human, every error notifies internally.** Errors are surfaced to the developer in plain language and simultaneously notify Bricly support so we can help proactively.
6. **Strict cascade on regeneration.** Any change to a foundational entity (ConstraintModel, BrandKit, Unit status) propagates to downstream Assets via SyncEvent, flagging them Stale until regenerated.
7. **AI as the OS, not a feature.** Agents do the work the developer used to coordinate across vendors. Human approval gates exist only where something goes public or commits irreversible state.

---

## Pre-flow (one-time, on first login)

Triggered by purchase or trial acceptance after a Book a Call demo. Sam pre-provisions the Workspace and admin User, or the developer self-serves the basic details.

| Step | Actor | Trigger | Capability | Entity affected | Output | Decision points |
|------|-------|---------|------------|------------------|--------|------------------|
| 0. Sign-up | Sam or developer | Demo conversion | Hybrid: Sam-provisioned with developer-editable confirm | Workspace (Trial → Active), admin User (Invited) | Magic link emailed | None |
| 1. First login | Developer | Magic link clicked | (Gap 1) `update_workspace` | Workspace (confirms name, market, currency, language), User (Invited → Active) | Workspace settings locked | Confirm or edit workspace details |
| 2. Pipeline auto-creation | System | First login complete | Platform plumbing (Gap 14) | Pipelines (Marketing, Sales) created with workspace defaults | Pipelines Active | None |
| 3. Empty dashboard | Developer | Step 2 complete | None | None | Developer sees empty state with primary CTA "Create your first project" | None |

Corporate brand is **not** captured in the pre-flow. It gets set later when the developer's first project brand selection completes (the chosen BrandKit can become the seed for the workspace CorporateBrand cluster). Decision deferred for now.

Channel and integration connections (calendar, WhatsApp, e-signature, ad platforms, MCP token) are **not** in the pre-flow. They surface as just-in-time prompts when first invoked, or via Settings.

Team invitations, lead routing, and other CRM operational config are also deferred to post-launch notifications.

---

## Project flow (every project)

The wizard. Linear. All generation-affecting fields required. CRM operational fields deferred.

### Step 1. Project basics

| Field | Description |
|-------|-------------|
| Trigger | Developer clicks "Create new project" |
| Actor | Developer |
| Capability | T1 `create_project`, then T2 (renamed to `update_project_details`) for the basics |
| Entity affected | Project created (state: Draft). ProjectDetails created (Gap 6) and linked. |
| What's captured | Name, location (address, plot, coordinates), project type (single block, multi-block, mixed-use), target completion, target launch date, total unit count, target revenue |
| Output | Project record in database, wizard advances |
| Decision points | None, structured form input |
| Agent role | Pattern 2 (assist): could suggest location format from plot reference, validate inputs |

### Step 2. Architect drawings upload

| Field | Description |
|-------|-------------|
| Trigger | Step 1 complete |
| Actor | Developer |
| Capability | T3 `upload_architect_files` |
| Entity affected | Document records created (subtype ArchitectFile). ConstraintModel created (state: Extracting). Extraction pipeline fires async. |
| What's uploaded | CAD files (DWG), architect drawings (PDF), site studies, surrounding context studies, plot photos |
| Output | Files stored, references on Project, async extraction running |
| Decision points | None, upload only |
| Agent role | Pattern 1 (autonomous): Claude vision API extracts ConstraintModel layer 1 in the background while developer continues |

### Step 3. Floor plans upload

| Field | Description |
|-------|-------------|
| Trigger | Step 2 complete |
| Actor | Developer |
| Capability | T3 (continued, separate UI step) |
| Entity affected | Document records (subtype ArchitectFile, labelled as floor plans, one per level) |
| What's uploaded | Floor plans (PDF/DWG) per level, with room labels if available |
| Output | Floor plan files stored, parsing pipeline fires (label detection for auto-mapping) |
| Decision points | Label each file with the level it represents |
| Agent role | Pattern 1 (autonomous): label parsing and polygon detection running async |

### Step 4. Availability list

| Field | Description |
|-------|-------------|
| Trigger | Step 3 complete |
| Actor | Developer |
| Capability | (Gap 2) `bulk_import_units` from CSV/XLSX, or manual entry. Then (Gap 3) `auto_map_floor_plan_to_units` fires automatically. |
| Entity affected | Unit records created in bulk (state: Available). AssetUnitMap records created where floor plan labels match unit IDs (state: Mapped if high-confidence, Auto_Mapped_Pending_Review if low) |
| What's captured | Unit ID, type, floor, beds, baths, internal sqm, external sqm, price, status |
| Output | Inventory populated. Floor plan polygons linked to Units where possible. |
| Decision points | Choose upload vs manual entry. For partial-failure rows, fix data and re-import. |
| Agent role | Pattern 1: parsing and mapping autonomous. Pattern 3: low-confidence mappings queued for human review later. |

### Step 5. Project details (editorial + commercial)

| Field | Description |
|-------|-------------|
| Trigger | Step 4 complete |
| Actor | Developer |
| Capability | T2 (renamed `update_project_details`) writes to ProjectDetails entity (Gap 6) |
| Entity affected | ProjectDetails populated |
| What's captured | Target buyer, style direction, brand stage, references, key selling points, payment terms, finishes spec (kitchen, bathrooms, flooring, external), amenities, mortgage availability, plus existing brochure upload (optional) |
| Output | ProjectDetails complete to soft minimum |
| Decision points | Required fields tagged "needed for generation," optional fields can be deferred |
| Agent role | Pattern 2: smart prefills based on project type, location, similar projects |

### Step 6. Mood board + brand input choice

| Field | Description |
|-------|-------------|
| Trigger | Step 5 complete. Extraction (from steps 2-3) should be done by now; if not, wait state shows here. |
| Actor | Developer |
| Capability | Read: (Gap 19) `style_library` Resource. Choose: import existing brand via (Gap 5) `import_brand_kit`, OR proceed to Bricly generation. |
| Entity affected | Mood board selections captured as ConsultationSession context inputs. If importing: BrandKit created (state: Active) from uploaded logo, palette extraction, typography detection. |
| What's captured | Style tile selections (modern, warm luxurious, bold graphic, etc.). Or: developer uploads logo files, brand guidelines PDF, palette. |
| Output | If import: BrandKit Active, skip to step 9. If generate: brand inputs ready for consultation. |
| Decision points | Generate vs import. Mood board tile selection if generating. |
| Agent role | Pattern 1 if importing: extract palette and typography from uploaded brand assets. |

### Steps 7 to 12. Generation half — superseded by Launch Package flow

The original Steps 7 through 12 of this onboarding flow defined brand consultation, brand selection, asset generation choices, asset generation wave, asset approval, distribution, and go-live. The Launch Package Generation flow (see `bricly-flow-launch-package.md`) supersedes the structure and approval mechanics of these steps based on later product decisions. Summarised here for reference; the launch package flow is the authoritative source.

The key changes:

- Brand consultation runs in two parts (Mode A part 1 and Mode A part 2) with Phase 0 neutral renders generated in between. The original Step 7 ran the full consultation before any render generation. The new sequence: name, building names, personas, tone of voice are decided first (Mode A part 1), then Phase 0 renders generate, then art direction is decided using Phase 0 renders as visual reference (Mode A part 2), then brand candidate generation runs (Mode B).
- Render generation is two-phase: Phase 2a (4 style-approval shots with brand applied) approved first, then Phase 2b (full baseline plus multi-face hero adders). FinishPackage variant renders generate as Phase 2c. Multi-face transition videos generate as Phase 2d.
- Vision verification fires on every Generated render against ConstraintModel layer 1. Three silent regeneration attempts on failure, then Brief state Escalated_To_Internal. Developer can override approval on a failed render with audit trail.
- Brochure and website are seeded from a single ContentBackbone with fork-on-edit semantics per surface. Section toggles are per-section on the project_public_site Microsite.
- Marketing material at launch is templates plus a single finished Instagram launch grid. Ad creative and copy are produced when the developer is actually launching a campaign, not at launch package generation time.
- The launch package generation flow ends with all Assets Approved and the project_public_site Microsite in Draft. Project stays in Launching state. Publishing the site, configuring lead routing, provisioning the sales team, transitioning Launching → Selling are owned by a separate Go-to-Market flow (parked, future session).

The data model and capability surface updates that come out of this session are reflected in `bricly-data-model.md` and `bricly-capability-surface.md`.

### Step 12. Go live — superseded

Original Step 12 (`set_project_live`, transition Launching → Selling, publish Microsites, open Marketing Pipeline to leads) is the entry point of the Go-to-Market flow, not the exit of the onboarding flow. Removed from onboarding scope.


### Wizard exit

- **First-ever project**: developer lands in CRM, on the project overview, to orient them to the operational hub.
- **Subsequent projects from Studio**: developer stays in Studio, on the project view.
- **Subsequent projects from CRM**: developer stays in CRM, on the project view.

### Post-launch prompts (notification-driven, not wizard)

- Invite team (T49 `invite_user`, P19 `rep_onboarding` per user)
- Configure lead routing rules
- Configure custom domain (Gap 13)
- Connect channel providers (calendar T51, WhatsApp, e-signature T71, ad platforms) when first invoked
- Assign sales reps to specific developments (future capability — see future sessions list)

---

## Edge cases and exceptions

### Edge 1: CAD or architect file extraction fails

**Full failure**: ConstraintModel state Failed (Gap 17). Developer notified in human language ("we couldn't read the CAD file. Try uploading a PDF version, or enter constraints manually"). Internal Bricly support also notified for proactive help. Developer can re-upload, switch to manual entry (Gap 18: `manually_define_constraint_model`), or contact support.

**Partial failure**: ConstraintModel state Pending_Review with low-confidence flags on specific fields. Constraint review modal fires at step 7. Developer confirms or edits per field, or requests re-extraction.

**Agent role**: Pattern 1 for extraction. Pattern 3 (human approval required) for low-confidence fallback.

### Edge 2: Brand kit candidates all rejected

Developer can request regeneration with new direction (re-opens consultation, T17 fires again with adjusted parameters). Mood boards re-surfaced with broader options. After multiple rejections, fallback to (Gap 5) `import_brand_kit` to upload developer's own brand assets. Rejected candidates move to Superseded.

### Edge 3: Developer wants to override the AI-generated constraint model

**Pragmatic with audit trail.** Layer 1 attributes get a `manual_override` capability (Gap 19). Override is logged in AuditEvent, flagged in the data, propagates to downstream assets with a "manual override" indicator. ApprovalRequest fires for the override. Original extracted value is preserved alongside the override. Architect re-upload can resolve.

### Edge 4: Availability list import fails or has bad data

**Hybrid handling.** Parsing failure: developer sees specific error per row, fixes CSV and re-uploads, or switches to manual mode. Partial parsing: bad rows flagged for row-by-row review (T5 per row). Auto-mapping mismatches: AssetUnitMap state Auto_Mapped_Pending_Review queued for review in step 10.

### Edge 5: Asset generation fails or partial fails

Specific Asset moves to Failed state. Other Assets in the batch proceed. Developer notified per-asset. Agent retries autonomously with adjusted parameters; after N retries, escalates to human. Developer can regenerate (T24) with feedback or accept partial and proceed.

### Edge 6: Developer abandons the wizard partway

Project state stays Draft. Wizard state persisted per step (data written as each step completes). Developer returns and lands on the step they left. Multiple Draft projects coexist. No auto-cleanup; T4 `archive_project` for manual cleanup.

### Edge 7: Concurrent edits by multiple users

MVP: last-write-wins with AuditEvent log capturing the history. No locking. Worth revisiting at scale if conflicts become an issue.

### Edge 8: Workspace billing or subscription issue mid-flow

Generation Tools (T17, T20, T24) check Workspace state. If Past_Due or Suspended, generation blocked with clear gate. Wizard data preserved. Developer prompted to resolve billing before continuing.

### Edge 9: Post-launch architect revision

Developer re-uploads architect files via T3. New ConstraintModel version extracted (state Pending_Review). All Assets referencing the previous version flagged Stale via SyncEvent. Microsites referencing Stale Assets flagged. Developer enters a "review revision" flow: see what changed, decide which Stale Assets to regenerate, approve new ConstraintModel version (T16), regeneration runs in waves. Old Assets move to Retired once new versions Published. Developer can revert via (Gap 20) `revert_to_version` if revision was a mistake.

---

## Module interaction

### Framing: asymmetric (current direction)

CRM is the consumer front, where day-to-day work happens. Studio is the production back, where assets are generated and managed. Studio outputs are first-class objects in CRM views. To be revisited.

### Entity ownership during onboarding

**Shared (both modules surface):**
- Project (parent of everything)
- ProjectDetails (editorial direction)
- Architect drawings, floor plans (CRM has download links; Studio uses for extraction and collateral)
- Units (CRM owns state transitions, Studio uses for collateral)
- BrandKit (managed in Studio, downloadable from CRM; reps need logo and brand guidelines for outreach)
- Assets (renders, brochure, social, floor plan graphics, one-pagers — generated in Studio, surfaced in CRM on project/unit/opportunity views)
- ConstraintModel layer 2 (managed in Studio, surfaced in CRM during buyer customisation)

**Studio-only:**
- Mood boards, brand consultation (ConsultationSession), brand candidates and selection
- Brief entities, generation orchestration, asset library management
- Microsite content composition and templating

**CRM-only:**
- Pipeline configuration and stage definitions
- Lead routing rules, Contact and Opportunity workflows
- Activities, Appointments, Approvals
- Commissions, PaymentPlans, Reports and dashboards

### The sync chain (CRM → Studio)

Unit status change → SyncEvent → re-evaluation of Assets referencing the Unit → stale Assets flagged → regeneration Briefs queued → Microsites refreshed → new Assets replace old → Notifications fired → audit trail preserved.

### The reverse direction (Studio → CRM)

- BrandKit Active → CRM surfaces use the BrandKit colours and typography
- ConstraintModel Approved → CRM unit detail surfaces use layer 2 options for buyer customisation menus
- Asset Published → rep can share directly to a buyer (T27 `share_asset`)
- Microsite Published → CRM has the URL, can include in outreach

### Cross-module agent invocation

Studio Tools callable from CRM context. Examples:
- Rep on Opportunity page invokes T59 `generate_personalised_buyer_pack` without leaving CRM
- Marketing lead on Unit detail invokes T24 `regenerate_asset` to refresh a render
- Manager on pipeline dashboard invokes T20 to generate new campaign creative

The MCP server unifies this. Tools are Tools; modules are UI groupings.

### Files tab in CRM project view

R55-style filtered query surfacing all Documents on Project: architect drawings, floor plans, brand guidelines, availability list, brochure PDFs, signed contracts (later), KYC docs per contact (later). One tab, everything project-related.

---

## Agent role

### Pattern map

- **Pattern 1 (autonomous)**: agent does the work, no human in loop, surfaces results.
- **Pattern 2 (assist)**: human does the work, agent helps in real time.
- **Pattern 3 (propose + approve)**: agent does the work and proposes, human approves before it takes effect.
- **Pattern 4 (conversational)**: agent and human in dialogue, agent acts as conversation unfolds.

### By wizard step

| Step | Agent pattern | What the agent does |
|------|---------------|---------------------|
| Pre-flow | None | Platform plumbing only |
| 1. Project basics | Pattern 2 | Location validation, format suggestions |
| 2. Architect drawings | Pattern 1 | ConstraintModel extraction via Claude vision API |
| 3. Floor plans | Pattern 1 | Label parsing, polygon detection |
| 4. Availability list | Pattern 1 (with Pattern 3 escalation) | Bulk import, auto-mapping; low-confidence mappings escalate to human review |
| 5. ProjectDetails | Pattern 2 | Smart prefills from project type, location, similar projects |
| 6. Mood board + brand input | Pattern 1 if importing | Palette and typography extraction from uploaded brand assets |
| 7. Brand consultation | **Pattern 4 (headline)** | Adaptive Q&A, surfaces references, captures decisions, fires T17 |
| 8. Brand selection | Pattern 2 | Surfaces which candidate aligns most with brief |
| Wait state | Pattern 1 | Orchestrates T20 across multiple external tools for parallel asset generation |
| 10. Asset approval | Pattern 2 (Pattern 1 for imported) | Surfaces ready/queued/cascade; imported assets auto-approve unless flagged |
| 11. Distribution | Pattern 2 | Recommendations based on project type, audience |
| 12. Go live | Pattern 1 | Publish cascade fires automatically on confirm |

### Approval gates (human required)

- ConstraintModel approval: auto if high confidence, human if low (T16)
- AssetUnitMap approval: auto if high confidence, human if low (T31)
- BrandKit selection: always human (T18, T19)
- Asset approval before publish: always human (T25)
- Microsite first publish: always human (T30)
- Project transition to Selling: always human (Gap 16)
- Constraint model overrides: always human + audit (Gap 19)

### The "AI as the OS" expression in onboarding

The clearest moments where AI does work that previously required vendor coordination:

1. CAD-to-JSON constraint extraction (steps 2-3)
2. Floor plan to availability auto-mapping (step 4)
3. Brand consultation (step 7)
4. Brand candidate generation (step 7-8 wait state)
5. Asset generation wave (step 9 wait state)
6. Strict cascade on changes (post-launch via A5 sync agent)

### Failure path escalation

- Edge 1: Pattern 3 (agent surfaces error + notifies support)
- Edge 2: Pattern 3 (re-runs with new direction, escalates after multiple rejections)
- Edge 3: Pattern 3 (agent suggests, never decides on layer 1 override)
- Edge 4: Pattern 3 (row-by-row review)
- Edge 5: Pattern 1 then Pattern 3 (retries, then escalates)
- Edges 6-7: No agent
- Edge 8: Pattern 3 (blocks generation, gates to billing)
- Edge 9: Pattern 3 (surfaces change, lists affected assets, requires human approval)

---

## Capability surface gap list

Identified during the original onboarding session. Where items have been applied to the data model or capability surface, the row notes `Applied`.

| # | Gap | Type | Status |
|---|-----|------|--------|
| 1 | `update_workspace` Tool (admin-only, edits Workspace attributes) | New Tool | Open |
| 2 | `bulk_import_units` Tool (CSV/XLSX to Unit records in bulk) | New Tool | Open |
| 3 | `auto_map_floor_plan_to_units` Tool (explicit and re-invocable) | New Tool | Open |
| 4 | ~~`Project.onboarding_path` attribute~~ — removed after unified-wizard decision | — | Closed |
| 5 | `import_brand_kit` Tool (existing brand files → BrandKit Active without generation) | New Tool | Applied as T17b in capability surface |
| 6 | **ProjectDetails** entity (hangs off Project, editorial direction; versioned) | New entity | Open |
| 7 | Rename T2 to `update_project_details`, scope to ProjectDetails | Tool rename | Open |
| 8 | ConsultationSession explicit states: Open, Paused, Concluded, Abandoned | State refinement | Open |
| 9 | BrandKit state refinement: add Candidate, fix Selected semantics (Generating → Candidate → Selected → Approved → Active → Superseded) | State refinement | Applied in data model (BrandKit entity 13) plus added Imported state for T17b |
| 10 | `refine_brand_kit` Tool (inline edits without full regeneration) | New Tool | Applied as T17a in capability surface |
| 11 | Rename T24 to `regenerate_asset` (T20 covers create-via-Brief) | Tool rename + clarification | Applied in capability surface |
| 12 | Asset state Rejected distinct from Failed | State refinement | Open |
| 13 | `connect_custom_domain` Tool or T29 extension (DNS verification included) | New Tool / extension | Open |
| 14 | Auto-creation of default Marketing and Sales Pipelines at workspace creation | Platform plumbing | Open |
| 15 | Microsite `content_config` attribute (block-level configuration on embeds) | Entity attribute | Applied in data model (Microsite entity 22) with section-level granularity from launch package session |
| 16 | `set_project_live` Tool (explicit Launching → Selling transition) | New Tool | Open. Owned by the parked Go-to-Market flow, not the launch package generation flow |
| 17 | `import_assets` Tool (upload existing renders, brochures, etc.) | New Tool | Applied as T24c in capability surface, generalised across all Asset types |
| 18 | Asset state `Imported` (distinct from Generated; affects sync chain) | State refinement | Applied in data model (Asset entity 12) |
| 19 | `style_library` Resource (mood board references with imagery) | New Resource | Applied as R13b in capability surface |
| 20 | ConstraintModel `revert_to_version` Tool (rollback for accidental re-uploads) | New Tool | Open |

### Gaps added in the Launch Package Generation session

| # | Gap | Type | Status |
|---|-----|------|--------|
| 21 | **Persona** entity (first-class, BELONGS_TO Project) | New entity | Applied in data model (entity 13a) and capability surface (T19a-c, R13a) |
| 22 | **FinishPackage** entity (first-class within ConstraintModel layer 2, referenced cleanly by Briefs, Assets, Opportunities) | New entity | Applied in data model (entity 14a) and capability surface (T19d-f, R11a) |
| 23 | **ContentBackbone** entity (single content source seeding brochure and website, forkable per surface) | New entity | Applied in data model (entity 14b) and capability surface (T30a-d, R14a) |
| 24 | BrandKit.art_direction structured attribute (mood, lighting profile per shot type, lifestyle population rules, composition rules, colour grading) | Attribute extension | Applied in data model (BrandKit entity 13) |
| 25 | Asset sub-type: view_from_level (per-level imagery, uploaded or generated, referenced from unit detail page) | New Asset sub-type | Applied in data model (Asset entity 12) |
| 26 | Asset sub-type: face_transition_video (Kling-orchestrated transitions between exterior faces) | New Asset sub-type | Applied in data model (Asset entity 12) |
| 27 | Asset sub-type: marketing_template (brand-applied Canva templates) | New Asset sub-type | Applied in data model (Asset entity 12) |
| 28 | AssetUnitMap extension to level floor plans (in addition to exterior renders) | Pattern extension | Applied in data model (AssetUnitMap entity 16) |
| 29 | Asset.vision_verification result cluster (per-attribute pass/fail, confidence, override status, audit trail) | Attribute cluster | Applied in data model (Asset entity 12) and capability surface (T24a, T24b) |
| 30 | Brief.regeneration_counter (caps automatic regenerations at 3 on vision verification failure, then Escalated_To_Internal) | Attribute | Applied in data model (Brief entity 14) and capability surface (T24a) |
| 31 | Brief.phase_scope (phase_0_consultation_pack, phase_2a, phase_2b, phase_2c_variant, phase_2d_transition, brochure_print, brochure_digital, website, marketing_template, launch_grid) | Attribute | Applied in data model (Brief entity 14) and capability surface (T20) |
| 32 | Brief.language (default per Project, additional languages on demand) | Attribute | Applied in data model (Brief entity 14) and capability surface (T20) |
| 33 | `verify_asset_constraints` Tool (vision API verification of generated render against ConstraintModel layer 1) | New Tool | Applied as T24a in capability surface |
| 34 | `override_verification_failure` Tool (developer override on Approve, audit-logged) | New Tool | Applied as T24b in capability surface |
| 35 | `toggle_microsite_section` Tool (section-level visibility on project_public_site Microsite) | New Tool | Applied as T29a in capability surface |
| 36 | `compose_content_backbone`, `edit_content_backbone`, `fork_content_to_surface`, `propagate_fork_to_backbone` Tools | New Tools | Applied as T30a-d in capability surface |
| 37 | Bricly internal escalation queue (failed renders, failed brand regenerations, dead-end states) | Bricly-internal capability | Open |
| 38 | **Go-to-Market flow** (separate wizard owning publish, sales team provisioning, lead routing, campaign launching, Launching → Selling) | Future flow doc | Parked |

Plus product principles surfaced (not gaps but worth documenting):

- Every error speaks human, every error notifies internally
- Capability surface descriptions should be vendor-agnostic (Midjourney/Canva are implementation, not contract)
- ConstraintModel layer 1 is the architect's domain. Developer cannot override layer 1; only the architect can revise drawings to update it. Developer can override approval on a render that fails vision verification (audit-logged), but cannot change the underlying constraints.
- Launch package generation is asset production. Go-to-market is operational launch. Two distinct flows, two distinct moments in time, possibly weeks or months apart.
- Every Asset type can be imported as an alternative to generation. Imported Assets bypass generation but follow downstream flow. They cannot be auto-regenerated on the strict cascade; developer must manually replace.
- Vision verification on every Generated render is Bricly's defensible moat. The claim "we've checked this against your architect's drawings" is what no other AI render tool can make.

---

## Future sessions / parked items

- **Launch Package Generation flow** (DONE): authoritative flow document for the generation half (originally Steps 7 to 11 of this onboarding flow) lives in `bricly-flow-launch-package.md`.
- **Go-to-Market flow** (parked): separate wizard owning publish-the-site, sales team provisioning, lead routing configuration, microsite publication strategy, campaign launching, Project state Launching → Selling. Triggered when the developer decides to go to market. Out of scope for both onboarding and launch package generation.
- **Module framing decision (B vs C)**: revisit whether Studio and CRM are truly two products that integrate, or whether they're one product with two UI navigation groupings. Current direction: framing B. Possible move toward C.
- **Sales agent assignment per development**: workflow for assigning specific reps to specific projects (vs all-reps-across-all-projects). User.assignment_rules already supports it in the data model; workflow needs design. Likely lives inside the Go-to-Market flow.
- **External tool catalogue for asset generation**: concrete list of tools used per Asset type (external render tool for renders, Canva for design, Kling for video, etc.) replacing the "etc." in the current capability surface.
- **Corporate brand backfill**: when does the workspace's CorporateBrand cluster get populated? Probably after project 1's BrandKit selection is approved.
- **Path B (existing project import) deep flow**: unified wizard handles this now via optional uploads per step, but the developer experience for an entirely-imported project (skip brand consultation, skip asset generation, just populate CRM) should be explicitly designed.
- **Wizard entry context routing**: how the wizard knows whether it was entered from CRM or Studio (for exit routing). Possibly Project.initiated_from attribute or session state.

---

End of document.
