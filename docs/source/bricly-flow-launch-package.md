# Bricly Launch Package Generation Flow

The flow that turns a newly onboarded project into a market-ready launch package. Picks up where the Developer Onboarding flow leaves Steps 7 to 11, expanded with the structural decisions taken in this session. Replaces the section ordering and approval mechanics of the onboarding flow's generation half.

---

## Scope

**Start state.** Project is live in Bricly. CAD parsed, ConstraintModel built and Approved, mood board and brand inputs captured. Architect drawings, floor plans, Units, ProjectDetails all exist. The Project sits in Launching state. Output of the Developer Onboarding flow.

**End state.** All launch-package Assets Approved and sitting in the asset library. Microsite (project_public_site) exists in Draft. BrandKit Active. ConstraintModel finalised including FinishPackages. AssetUnitMaps approved for exterior renders and level floor plans. Branded floor plan template ready. Content backbone composed. Project still in Launching state. Nothing public, no lead capture live, sales team not yet provisioned.

**Out of scope.** Going to market, publishing the site, provisioning the sales team, launching campaigns, transitioning Launching → Selling. Those belong to a separate Go-to-Market flow.

## Definition

**Launch package = the project's market-ready visual identity and infrastructure, complete enough that a developer can go live with a website, distribute brochures, and brief any ad or social activity from a coherent brand foundation.**

Not the campaigns, not the always-on content, not the finished ad creative. Those are downstream flows running off this foundation.

---

## Dependency graph (the order things must happen in)

The launch package generation flow is sequential by necessity, not by convenience. The render engine needs brand context to produce on-brand imagery. The brochure and website both need final renders. Marketing material needs brand, renders, and the content backbone. Phases run in this order:

**Phase 0.** Initial render pass. Two to four hero shots. Constraint-strict, neutrally styled, vision-verified. Purpose: ground the brand conversation.

**Phase 1.** Brand consultation and generation. Mode A part 1 (name, building names, personas, tone of voice) runs first. Phase 0 renders generate in parallel during the pause. Mode A part 2 (art direction) runs with Phase 0 renders as visual reference. Mode B generates four brand candidates, developer picks one.

**Phase 2.** Final render set. Phase 2a generates four style-approval shots with brand applied. Once approved, Phase 2b generates the rest of the seven-shot baseline plus multi-face hero adders. Finish package variants generate from the constraint model's defined packages.

**Phase 3.** Brochure and website built in parallel from the content backbone, brand, and Phase 2 renders. Both seeded from the same backbone, fork-on-edit thereafter.

**Phase 4.** Marketing material templates. Canva templates for digital ads and social. Instagram launch grid as the one finished asset. Email template shell compatible with the developer's email tool.

**Phase 5.** Asset library handoff. Approved Assets appear in CRM views (project, unit, opportunity). BrandKit surfaces visually in the CRM. The project sits ready, not live.

---

## Phase 0. Initial render pass

| Field | Description |
|-------|-------------|
| Trigger | Onboarding flow Step 7 reached. Mode A part 1 of brand consultation complete (name, personas, tone locked). Developer accepts the pause. |
| Actor | Agent + system |
| Capability | P12 `produce_project_marketing_package` partial fire: T20 `create_and_submit_brief` for the Phase 0 consultation pack only. Vision verification (new Tool, see gap list). |
| Entity affected | Brief (type: project_initial, scope: phase_0_consultation_pack). Assets (type: render, sub_scope: phase_0). |
| Output | Two to four hero render shots, neutrally styled, vision-verified against ConstraintModel layer 1. |
| Decision points | None during generation. Developer is not in flow, working elsewhere or notified-when-ready. |
| Orchestration target | External render tool (Midjourney or equivalent at time of build). Vendor-agnostic in the data model. |
| Context layer activity | Prompt composed from: ConstraintModel layer 1 (massing, height, materials, surroundings), neutral style directive (no brand applied), shot specification per Phase 0 image. |
| Approval gate | None. Phase 0 renders are scaffolding, not deliverables. Developer sees them in the brand consultation Mode A part 2, not as standalone approvals. |
| Vision verification | Yes. Three silent regeneration attempts on verification failure. After three, render flags to Bricly internal team and consultation Mode A part 2 proceeds with the renders that passed. |
| Agent role | Pattern 1 (autonomous). Generation and verification fully agent-orchestrated. |

---

## Phase 1. Brand consultation and generation

The brand sub-flow has two modes inside a single ConsultationSession. Mode A is conversational and produces structured decisions. Mode B is generative pick-one and produces the visual brand.

### Mode A part 1. Conversational, pre-Phase-0

| Field | Description |
|-------|-------------|
| Trigger | Onboarding flow Step 6 complete (mood board + brand input choice = generate). |
| Actor | Developer + agent |
| Capability | T21 `start_consultation` (type: brand). T22 `continue_consultation`. T23 `conclude_consultation` for Mode A part 1 (subset conclusion). |
| Entity affected | ConsultationSession (state: Open). Project.name set. Building.name set per building (if multi-block). Persona entities created (new entity, see gap list). BrandKit.tone_of_voice attribute set. |
| Output | Project name approved. Building names approved (multi-block only). Personas locked. Tone of voice locked. |
| Decision points | Lock as decided for name and building names (nominal, binary). Review at end for personas and tone (interrelated, reviewed together). |
| Order within consultation | Name → building names (if applicable) → personas → tone of voice. |
| Orchestration target | LLM for conversation. Web search owned by Bricly for project name research (location history, geography, cultural references). |
| Context layer activity | Agent queries: ProjectDetails (location, type, target market, pricing), ConstraintModel layer 1, Workspace.CorporateBrand if inheritance is set. For tone of voice grounding: reasoning chain is project type and positioning → budget tier → buyer personas → tone calibrated to how those personas want to be spoken to. |
| Agent role | Pattern 4 (conversational). Headline AI-OS moment. |

### Wait state. Phase 0 renders generate while Mode A part 1 concludes.

Developer can leave consultation and return when notified. Phase 0 renders fire on Mode A part 1 conclude.

### Mode A part 2. Conversational, post-Phase-0

| Field | Description |
|-------|-------------|
| Trigger | Phase 0 renders ready. Developer returns to consultation. |
| Actor | Developer + agent |
| Capability | T22 `continue_consultation`. T23 `conclude_consultation` (full conclusion this time). |
| Entity affected | ConsultationSession (Open → Concluded). BrandKit.art_direction attribute set (new structured attribute, see gap list). |
| Output | Art direction locked: mood keywords, lighting profile per shot type, lifestyle population rules, composition rules per shot type, colour grading profile. |
| Decision points | Reviewed at end as a single approval. |
| Block structure | Block 1: mood and atmosphere (agent surfaces three to four mood references). Block 2: time of day and lighting (uses style library reference photos, not generated previews). Block 3: lifestyle context (populated vs abstract). Block 4: composition and framing (per shot type). Block 5: shot list confirmation. |
| Orchestration target | LLM for conversation. Style library Resource (R19, see gap list) for Block 2 reference imagery. |
| Context layer activity | Phase 0 renders surfaced as the developer's actual building. Style library queried for time-of-day reference photography. Personas and tone from Mode A part 1 referenced throughout. |
| Agent role | Pattern 4 (conversational). |

### Mode B. Brand candidate generation and selection

| Field | Description |
|-------|-------------|
| Trigger | Mode A part 2 concluded. All Mode A outputs available as Brief inputs. |
| Actor | Developer + agent + system |
| Capability | T17 `generate_brand_kit_options` (4 candidates). Refinement: refine_brand_kit (Gap 10 from onboarding). T18 `select_brand_kit`. T19 `approve_brand_kit_version`. |
| Entity affected | BrandKit candidates: Generating → Candidate. Selected one: Candidate → Selected → Approved → Active. Others: Candidate → Superseded. |
| Output | Active BrandKit. Logo suite, palette, typography, brand guidelines PDF, two application mockups (one over Phase 0 render, one over letterhead/business card/social templates). |
| Decision points | Pick one of four. Unlimited inline refinements on chosen candidate. Two full regeneration cycles of the four candidates. After two regenerations, escalation to Bricly human support. |
| Orchestration target | Combination of tools (specific stack defined later, candidates include image generation models for visual exploration and Canva for logo design and template application). Brand generation is NOT built by Bricly. |
| Context layer activity | Brief composed from: Mode A outputs (project name, personas, tone, art direction), ConstraintModel layer 1 (architectural style cues for visual coherence), CorporateBrand inheritance setting if applicable. |
| Vision verification | Not applicable (brand assets are not constraint-bound). |
| Agent role | Pattern 2. Agent surfaces which candidate aligns most with the brief based on mood board and direction. Developer decides. |

### Brand deliverable inventory (what the developer receives)

- Logo suite. Primary, secondary lockup, monochrome, reversed, icon-only mark. AI, EPS, SVG, PNG at multiple sizes. Clear-space rules.
- Colour palette. Primary, secondary, accents. Hex, RGB, CMYK, Pantone. Named roles.
- Typography. Headline, body, optional caption font. Weight system, type scale, font files or licence references.
- Brand guidelines PDF.
- Buyer personas.
- Tone of voice.
- Photography and render art direction (structured object).
- Two application mockups.
- Project name.
- Building names (if multi-block).

---

## Phase 2. Final render set

### Phase 2a. Style approval set

| Field | Description |
|-------|-------------|
| Trigger | BrandKit Active. |
| Actor | Agent + system, developer at approval |
| Capability | T20 `create_and_submit_brief` (scope: phase_2a). Vision verification. T25 `approve_asset` per render. T24 `regenerate_asset` if rejected. |
| Entity affected | Brief (type: project_initial, scope: phase_2a). Assets: 4 renders (exterior hero, interior typical one, aerial, exterior contextual). Generating → Generated → In_Review → Approved. |
| Output | Four brand-applied, vision-verified renders. Developer approves the style across them. |
| Decision points | Per render: approve, request changes (regenerate), reject. Style is what's being approved, not just the individual images. |
| Orchestration target | External render tool. |
| Context layer activity | Brief composed from: ConstraintModel layer 1 (the what), BrandKit art direction (the how), shot specification per image. Brand applied to colour grading, lighting, atmosphere. Constraint model strictly enforced on structure, massing, materials. |
| Vision verification | Yes. Three silent regeneration attempts on failure, then escalation to Bricly internal team. Failed renders do not block Phase 2b; they slot in once resolved. |
| Approval gate | Yes. Phase 2b does not fire until Phase 2a is approved. |
| Agent role | Pattern 1 for generation. Pattern 2 for approval (agent surfaces, developer decides). |

### Phase 2b. Full launch render set

| Field | Description |
|-------|-------------|
| Trigger | Phase 2a approved. |
| Actor | Agent + system, developer at approval |
| Capability | T20 (scope: phase_2b). Vision verification. T25, T24. |
| Entity affected | Brief (scope: phase_2b). Assets: remaining baseline shots (interior typical two, amenity, twilight exterior) plus multi-face adders (one exterior hero per additional meaningful face, if applicable). |
| Output | Complete baseline render set. Default seven shots, plus N where N = (number of meaningful building faces beyond the first hero) + courtyard exception not added. |
| Decision points | Per render: approve or reject specific image. Style is not re-litigated, it's locked from Phase 2a. |
| Orchestration target | External render tool. |
| Vision verification | Yes, same pattern. |
| Approval gate | Phase 3 (brochure + website) does not fire until Phase 2b baseline is approved. Multi-face transition videos (see below) can fire in parallel. |
| Agent role | Pattern 1 for generation. Pattern 2 for approval. |

### Phase 2c. Finish package variants

| Field | Description |
|-------|-------------|
| Trigger | Phase 2b approved. ConstraintModel layer 2 has FinishPackage entries defined. |
| Actor | Agent + system, developer at approval |
| Capability | T20 (scope: phase_2c_variants). Vision verification. T25, T24. |
| Entity affected | Brief per FinishPackage. Assets: interior renders regenerated for each defined FinishPackage. |
| Output | Interior render set duplicated per FinishPackage. Buyer or rep can flip between packages on the website unit detail page and during sales meetings. |
| Volume calculation | (number of interior shots in Phase 2b) × (number of FinishPackages) = additional renders. |
| Vision verification | Yes. |
| Approval gate | Approval is mostly batch since style was locked at Phase 2a. |
| Agent role | Pattern 1, batch approval surfaced. |

### Phase 2d. Multi-face transition animations

| Field | Description |
|-------|-------------|
| Trigger | Phase 2b approved. Building has multiple meaningful faces. |
| Actor | Agent + system |
| Capability | T20 (scope: face_transition). External video generation orchestration. |
| Entity affected | Brief per face-transition pair. Assets: face_transition_video sub-type (see gap list). |
| Output | Short video assets animating the transition between adjacent faces, saved and stitched into the availability section's switcher experience. |
| Orchestration target | Kling or equivalent video generation tool. |
| Vision verification | Not applicable (videos are interpolations between approved frames). |
| Approval gate | Per video, but typically batch-approved. |
| Agent role | Pattern 1. |

### Vision verification mechanics (across all Phase 2 generation)

Verification approach is option C: Vision API verification with per-render compliance report surfaced to the developer. Bricly takes the returned image, runs it through a vision model with the ConstraintModel as the comparison source, checks attributes (floor count, massing, materials, surroundings), flags discrepancies. Developer sees the compliance report alongside the render. Developer can override approval with audit trail.

The moat: "we've checked this against your architect's drawings." No other AI render tool makes this claim. This is the orchestration layer earning its keep.

Constraint enforcement is strict on layer 1 (the architectural truth, the what). Art direction (the how) operates with full creative latitude bounded by the brand. These two layers are orthogonal.

The developer cannot override layer 1 of the ConstraintModel. Architectural reality is the architect's domain. If the developer wants something different, layer 2 covers it or the architect issues revised drawings.

---

## Phase 3. Brochure and website (parallel from shared backbone)

### The content backbone

A single content object that seeds both surfaces. Holds:

- Project story (name, tagline, narrative paragraph).
- Location (address, geographic context, neighbourhood description, points of interest, accessibility).
- The development (architectural concept, scale, key features).
- Amenities (per amenity: name, description, image reference).
- Residence types (per type: short description, from-price, from-size, render reference).
- Units (per unit: full specs, status, price, level, orientation, references to renders and floor plans).
- FinishPackages (per package: materials, finishes).
- Specifications (construction quality, materials, sustainability, completion date).
- Investment (price ranges, payment terms, completion timeline).
- Contact and lead capture configuration.
- Developer and architect credentials.
- Project timeline placeholder for construction updates.

The backbone references entities (Project, Building, Unit, FinishPackage, BrandKit) rather than duplicating them. Structural data (price, status, finish package definitions) propagates always via the strict cascade. Editorial content (copy, story, descriptions) defaults to fork on edit.

### Fork semantics

Default to fork. Developer edits the brochure, the brochure changes, the website doesn't. The developer can propagate a change to the backbone via an explicit "push to website too" action when they want.

Three content states across surfaces:
- **Shared.** Backbone owns. Surface edits prompt for propagate vs fork.
- **Forked.** Edited on one surface, intentionally diverged. Backbone and the other surface no longer auto-update this piece.
- **Surface-specific.** Exists on one surface only by design (lead form fields on web, payment terms detail block on brochure).

### Website sub-flow

| Field | Description |
|-------|-------------|
| Trigger | Phase 2b approved. Content backbone composed. |
| Actor | Agent + system, developer at section toggle and approval |
| Capability | T28 `provision_microsite` (type: project_public_site, state: Draft). T29 `update_microsite`. Content composition is an internal generation step (see capability surface gap list). |
| Entity affected | Microsite (state: Draft). Microsite.content_config holds section toggle states. |
| Output | Project public website, Draft state, URL exists but not yet public. |
| Section structure (top to bottom) | 1. Hero (render or video background, "View Availability List" or "Register Interest" CTA, "Get in Touch" nav). 2. Development at a glance. 3. Residence types (per type: one or two sentences, from-price, from-size, button linking to filtered availability list). 4. Location. 5. Lifestyle and amenities. 6. Availability list (split view, render with polygon hover sync to list). 7. Finish packages (if defined). 8. Developer and architect. 9. Investment and payment plans (toggleable). 10. Project timeline and updates. 11. Contact and lead capture. 12. Footer (brochure download, legal, social, language toggle). |
| Section toggles | Every section toggleable. Default state: all on. Section-level toggle hides the section on the landing page, but inner detail (e.g., FinishPackage selector on unit detail page) remains independent. |
| Unit detail page (per unit, separate URL) | Floor plan unbranded on display, branded version generated on form-gated download. Building-level floor plan view with the unit highlighted (level floor plan AssetUnitMap). Residence type render by default, unit-specific render if available. View from the floor (developer-uploaded per level). FinishPackage selector. Status tag (Available clickable, Reserved/Sold deactivated). Full specs (total size, interior size, exterior size, rooms, bedrooms, bathrooms, square meterage, orientation). CTAs: book viewing, request information, share. |
| Multi-face render experience | Switcher between exterior faces. Hover-to-highlight polygon mapping per face. Kling-generated transition video plays on face switch. |
| Decision points | Per section toggle. Final review of the assembled site before sub-flow completes. |
| Orchestration target | Website composition is owned (Bricly composes from backbone). External tools for specific assets (renders, videos) already produced upstream. Hosting orchestration owned by Bricly. |
| Context layer activity | BrandKit applied across all visual surfaces (typography, palette, logo lockups). ConstraintModel referenced for FinishPackage selector mechanics. AssetUnitMaps power the availability section's interactive render. |
| Approval gate | Per section the developer reviews. Full site preview before sub-flow concludes. |
| Agent role | Pattern 1 for composition. Pattern 2 for section toggle decisions and final review. |

### Brochure sub-flow

| Field | Description |
|-------|-------------|
| Trigger | Phase 2b approved. Content backbone composed. Can fire in parallel with website sub-flow. |
| Actor | Agent + system, developer at approval |
| Capability | T20 (scope: brochure). Two output formats: print and digital. |
| Entity affected | Brief (scope: brochure_print, brochure_digital). Assets: brochure type, format extension distinguishes print vs digital. |
| Output | Print brochure (CMYK, high-res, bleed and crop marks). Digital brochure (RGB, screen-res, hyperlinked, QR code on back to live availability). Both generated by default at launch. |
| Section structure | 1. Cover. 2. Inside cover / TOC. 3. The development. 4. Location. 5. The architecture / building. 6. Residence types. 7. Lifestyle and amenities. 8. Specifications and finishes. 9. Investment and payment plan (toggleable). 10. Developer / architect. 11. Availability list (print: inline snapshot; digital: QR code to live page). 12. Typical floor plan layouts per residence type. 13. Contact / back cover. |
| Language variants | Default language generated at launch. Additional languages on demand via Brief with language parameter. |
| Availability handling | Print version: static availability list inline, accurate at print time, considered a snapshot. Digital version: QR or short URL to live availability page. |
| Decision points | Section approval, language choice (default at launch, more on demand), print vs digital toggle (both default). |
| Orchestration target | Canva or equivalent layout tool (vendor-agnostic in data model). |
| Context layer activity | Content backbone read. BrandKit applied (typography, palette, photography direction across page templates). Phase 2 renders embedded. FinishPackages shown. Unit list pulled live for the print snapshot. |
| Approval gate | Per brochure (print and digital separately). Re-fork mechanics if developer edits inline. |
| Agent role | Pattern 1 for composition. Pattern 2 for approval. |

---

## Phase 4. Marketing material templates

The launch package delivers visual identity infrastructure for campaigns, not finished campaigns. Templates and one defined launch-moment asset.

| Field | Description |
|-------|-------------|
| Trigger | Phase 3 sub-flows producing approved Assets. Can fire in parallel with Phase 3 once BrandKit is Active and Phase 2 renders are approved. |
| Actor | Agent + system, developer at approval |
| Capability | T20 (scope: marketing_templates, scope: launch_grid). |
| Entity affected | Brief per template format. Assets: SocialPost type for the launch grid; template-state Assets (new state or sub-type, see gap list) for the Canva templates. |
| Output | Brand-applied Canva templates for: Meta feed (1:1), Meta story (9:16), Meta reel placeholder (9:16, static), Google display (multiple sizes), Instagram story templates (three to five reusable), reel templates (placeholder or static). Email template shell compatible with the developer's email tool. Instagram launch grid as finished, ready-to-post asset (nine-tile launch announcement). |
| What is NOT delivered at launch | Ad copy, headlines, CTAs, campaign creative. These are produced when the developer actually launches a campaign, with developer approval per piece. Video creative (reels, walkthroughs) beyond the multi-face transitions. Print-ready files for physical collateral (developer's print shop handles, brand guidelines and mockups give the shop what it needs). |
| Canva handoff | Bricly provisions Canva workspace access for the developer. Developer logs into Canva for ongoing edits. No embedded editor in Bricly Studio at launch. |
| Email handoff | HTML templates compatible with the developer's email tool (Mailchimp, HubSpot, etc.) at launch. Bricly's own email platform is a roadmap item. |
| Decision points | Approval of one to two samples per format before the rest generate (same pattern as Phase 2a then 2b). Approval of launch grid as finished asset. |
| Orchestration target | Canva for design templates. Email template generation owned by Bricly. |
| Context layer activity | BrandKit applied. Phase 2 renders embedded in templates as starter imagery. Content backbone provides text starter content (project name, tagline) but no copy is finalised. |
| Approval gate | Sample-first then full set, same pattern as Phase 2. |
| Agent role | Pattern 1 for generation. Pattern 2 for approval. |

---

## Phase 5. Asset library handoff to CRM views

Not a generation phase. The handoff of what the launch package has produced into the CRM module's surfaces, while the Project remains in Launching state.

| Field | Description |
|-------|-------------|
| Trigger | Phases 0 through 4 producing Approved Assets and a Draft Microsite. |
| Actor | System |
| Capability | Cross-module read surfaces (R17 `project_assets`, R18 `unit_collateral`, R12 `project_brand_kit`). Studio-to-CRM data flow per the existing module interaction spec. |
| Entity affected | None directly. Existing entities surface in CRM views via Resource queries. |
| What surfaces in CRM | Approved Assets appear in project view, unit view, opportunity view. BrandKit colours and typography render in CRM project pages. ConstraintModel layer 2 (FinishPackages) surfaces in CRM unit detail for sales preview. Branded floor plan template ready for on-demand invocation from CRM. |
| What does NOT happen | Microsite stays Draft. No public URL active. No lead capture live. Sales team not provisioned. Project state stays Launching. Lead routing rules not configured. |
| Agent role | None. System-driven surfacing. |

---

## Mapping flows (sub-flow inside Phase 2 to Phase 3 transition)

### Exterior render mapping

| Field | Description |
|-------|-------------|
| Trigger | Phase 2b approved. Each exterior render is a candidate for unit polygon mapping. |
| Actor | Agent proposes, developer approves |
| Capability | T31 `confirm_asset_unit_mapping`. Auto-mapping pipeline (T3 equivalent for exteriors, see gap list). |
| Entity affected | AssetUnitMap per (exterior_render, unit) pair. State: Auto_Mapped_Pending_Review → Mapped. |
| Output | Each meaningful exterior render has polygons drawn over visible units. Powers the website availability list's split-view interaction. |
| Decision points | Per exterior render: developer reviews proposed polygons, approves or corrects, batchable. |
| Fallback | If mapping is incomplete or skipped, the availability section falls back to a plain list without the interactive render. Acceptable degradation. |
| Edge | Units that don't appear on any exterior render (courtyard-facing, hidden side) appear in the availability list but don't highlight on the render. Acceptable degradation. |
| Agent role | Pattern 3. Agent proposes, developer decides. Constraint-model-aware and vision-aware proposal. |

### Level floor plan mapping

| Field | Description |
|-------|-------------|
| Trigger | Level floor plans available (uploaded at onboarding Step 3). |
| Actor | Agent proposes, developer approves |
| Capability | T31. T3 auto-mapping pipeline (extends from existing floor-plan-to-availability mapping). |
| Entity affected | AssetUnitMap per (level_floor_plan, unit) pair. |
| Output | Each level floor plan has polygons drawn over units on that level. Powers the unit detail page's "where on the level" view. |
| Decision points | Per level floor plan: developer reviews, approves, corrects. |
| Agent role | Pattern 3. |

---

## Edge cases

### Edge 1. Incomplete ConstraintModel

CAD parsing produced a partial constraint model (layer 1 has gaps). Vision verification cannot check attributes that are missing.

**Handling.** Block by default. Launch package generation does not fire if ConstraintModel layer 1 is incomplete. Developer is shown the gaps and prompted to fill them manually or request architect resubmission. Developer can override and proceed with an explicit warning ("downstream quality may degrade, vision verification will skip the missing attributes"). Override is audit-logged.

### Edge 2. Brand candidates all rejected

Developer rejects all four candidates and the inline refinement options.

**Handling.** Unlimited inline refinements on any chosen candidate. Two full regeneration cycles of the four candidates before escalation. After two regenerations, escalate to Bricly human support. Developer can fall back to importing existing brand assets at any point.

### Edge 3. Render fails vision verification

Generated render does not match the ConstraintModel on a verified attribute.

**Handling.** Three silent automatic regenerations. After three, the render flags to the Bricly internal team queue for review. Developer sees a "we're refining this one, we'll be in touch" state on that specific render. The rest of the launch package proceeds with the renders that passed. The failed render slots into the asset library once resolved (strict cascade re-fires downstream Assets that depend on it).

### Edge 4. Developer wants to use existing brand assets

Developer skips brand generation, uploads existing logo, palette, typography, guidelines.

**Handling.** `import_brand_kit` (Gap 5 from onboarding) sets BrandKit Active without going through Generating → Candidate → Selected → Approved. If the imported brand is incomplete (no personas, no tone of voice, no art direction), Bricly runs a targeted consultation to fill the gaps. Developer always ends with a complete BrandKit.

### Edge 5. Constraint model override on a specific render

Developer wants a render that deviates from architectural reality.

**Handling.** Not permitted. Layer 1 of the ConstraintModel governs architectural truth, which is the architect's domain. If the developer wants something different, either layer 2 covers it (legitimate variant via FinishPackage or layout option) or the architect issues revised drawings. The only mechanism inside the developer's control: override approval on a render that failed vision verification, with audit trail. Approving a non-compliant render is the developer's right; changing the constraint model to make it compliant is not.

### Edge 6. Scope change mid-generation

Project scope changes during launch package generation (pricing, unit mix, finish packages, brand direction, architect-revised drawings).

**Handling.**
- Pricing: doesn't affect in-flight Briefs. Content backbone references update. Brochure and website availability sections refresh via strict cascade.
- Unit mix: affects availability list, unit detail pages, AssetUnitMap polygons. Bricly flags in-flight Briefs affected, developer decides to apply the change or complete with current scope. AssetUnitMaps may need to be redrawn for affected units.
- FinishPackages: affects Phase 2c variant renders. New packages trigger new variant generation. Removed packages flag the variant renders as superseded.
- Brand direction: rare but high-impact. Effectively re-runs the launch package from brand onwards. Developer is warned and confirms.
- Architect-revised drawings (ConstraintModel update): force halt on in-flight generation. Strict cascade fires on Approved Assets. Developer enters the review-revision flow from onboarding Edge 9. Old Assets retire as new Approved versions Publish.

### Edge 7. Developer wants to add custom assets

Developer wants more than the default launch package set (additional render angles, video walkthrough, second brochure language, sales presentation deck).

**Handling.** Out-of-band individual Briefs in Studio. Post-launch-package or in parallel. Do not gate launch package completion. Follow the same generation, verification, approval pattern.

### Edge 8. Developer imports a generated Asset type

Every Asset type can be imported as an alternative to generation. Renders, brochure, website assets, brand, mockups.

**Handling.** Generalised `import_assets` (Gap 17 from onboarding) applies universally. Imported Assets bypass generation but follow downstream flow (AssetUnitMap proposing on imported renders, brochure entering the asset library, etc.). Vision verification on imported renders is informational, not gating, since the developer's import decision overrides. Critical tradeoff surfaced at import: imported Assets cannot auto-update via the strict cascade. When underlying data changes, imported Assets flag Stale but Bricly cannot regenerate them (no source). Developer is notified, can upload an updated version, replace with Bricly-generated, or accept staleness.

---

## Approval gates summary

The launch package generation flow has approval gates at the following points:

1. **Mode A part 1 conclude.** Name and building names approved as decided. Personas and tone reviewed together.
2. **Mode A part 2 conclude.** Art direction approved as a single review.
3. **Mode B pick.** One of four brand candidates approved. Active BrandKit set.
4. **Phase 2a per-render.** Style approval across the four shots. Phase 2b does not fire until Phase 2a is approved.
5. **Phase 2b per-render.** Individual render approval. Style is not re-litigated.
6. **Phase 2c batch.** Finish package variant approval, batch.
7. **Phase 2d batch.** Multi-face transition videos, batch.
8. **Mapping confirmations.** Exterior render polygons and level floor plan polygons, batch per render or plan.
9. **Phase 3 brochure.** Per brochure (print, digital), section-by-section as the developer reviews.
10. **Phase 3 website.** Per section toggle, plus final site preview.
11. **Phase 4 marketing material.** Sample first (one to two per format), then full template set. Instagram launch grid as a finished asset approved separately.

No gate at launch package completion itself. The package is "ready" once the gates above are passed. The decision to go live is a separate Go-to-Market flow.

---

## Orchestrate vs own per capability

| Capability | Owned by Bricly | Orchestrated |
|------------|-----------------|--------------|
| ConstraintModel extraction (vision API) | Owned (Claude vision orchestrated) | Hybrid |
| Vision verification on generated Assets | Owned (orchestrates vision model) | Hybrid |
| Brand candidate generation | — | Orchestrated (image generation models for visual exploration, Canva for logo and template application) |
| Render generation | — | Orchestrated (external render tool, vendor-agnostic) |
| Brochure layout | — | Orchestrated (Canva or equivalent) |
| Website composition | Owned | — |
| Microsite hosting and provisioning | Owned (T28 stack) | — |
| Marketing material templates | — | Orchestrated (Canva) |
| Multi-face transition animations | — | Orchestrated (Kling or equivalent) |
| Email template HTML generation | Owned | — |
| Content backbone composition | Owned | — |
| ConsultationSession (brand consultation) | Hybrid (LLM for conversation, owned for reference retrieval, web search for project name research) | Hybrid |
| AssetUnitMap auto-mapping | Owned (vision orchestrated) | Hybrid |
| FinishPackage variant render orchestration | Owned (orchestrates render tool per package) | Hybrid |

The middleware (constraint model, prompt orchestration, brand-aware context layer, vision verification, content backbone, fork-on-edit content management) is Bricly's. The generative tools at the edges are not.

---

## Agent role summary

**Pattern 1 (autonomous orchestration).** Phase 0 generation, Phase 2 generation, Phase 2c variant generation, Phase 2d transitions, vision verification loop (within the three-attempt cap), brochure composition, website composition, marketing template generation, Asset library handoff to CRM.

**Pattern 2 (proposes, developer decides).** Brand candidate surfacing recommendation, per-render approval surfacing, per-section toggle surfacing, mapping polygon review surfacing.

**Pattern 3 (proposes only on layer 1 of the constraint model, never decides).** Constraint model gap resolution prompts, override-render-with-failed-verification flagging.

**Pattern 4 (conversational).** Brand consultation Mode A. The headline AI-OS moment of the launch package flow.

**Strictly forbidden.** Auto-approval of any Asset. Auto-publishing of any Microsite. Auto-transition of Project state from Launching to Selling. Auto-override of ConstraintModel layer 1.

---

## Studio-to-CRM handoff points (within this flow's scope)

The launch package generation flow produces an internal-facing asset library handoff only. Operational handoff (sales team provisioning, lead routing, microsite publishing, campaign launching, public going-live) is the Go-to-Market flow.

Handoffs within this flow:

1. **BrandKit Active.** CRM project surfaces use BrandKit colours, typography, logo. Rep outreach templates inherit BrandKit.
2. **Approved Assets.** Surface in CRM project view, unit view, opportunity view (R17, R18). Reps can preview, marketing lead can manage.
3. **FinishPackages defined.** Surface in CRM unit detail for sales preview and in-meeting customisation (powers personalised buyer pack generation post-launch).
4. **AssetUnitMaps approved.** Power interactive surfaces wherever Assets are surfaced.
5. **Branded floor plan template ready.** Invokable on demand from CRM (rep generates branded floor plan for a buyer) or from the website form-gated download flow.
6. **Content backbone composed.** Available as the source of truth for future surface generation (additional brochures, microsite pages, agent share microsites).

Public-facing surfaces (Microsite Published, lead capture live, campaigns running) are not part of this flow.

---

## Capability surface and data model gaps (consolidated)

Items surfaced in this session that need to be applied to the data model and capability surface documents:

1. **Persona entity.** First-class entity, BELONGS_TO Project, referenced by BrandKit, Brief, Campaign, Opportunity. Generated in brand consultation Mode A part 1. States: Generating, Approved, Active.

2. **FinishPackage entity.** First-class entity (or structured sub-element on ConstraintModel). Defines named finish options with material specifications. Referenced by Unit, Asset (variant renders), Opportunity (buyer's chosen package).

3. **BrandKit.art_direction structured attribute.** Mood keywords, lighting profile per shot type, lifestyle population rules, composition rules per shot type, colour grading profile.

4. **Asset sub-type: view_from_level.** Per-level imagery uploaded by developer or generated. Attributes: level, orientation, source (uploaded vs generated). Referenced from unit detail page based on unit's level.

5. **Asset sub-type: face_transition_video.** Short video animating between adjacent exterior faces. Generated via Kling or equivalent.

6. **Asset sub-type: marketing_template.** Brand-applied Canva templates (ad formats, social formats, story templates) handed to developer for ongoing customisation.

7. **AssetUnitMap extension.** Currently covers exterior renders. Extend pattern to level floor plans (unit polygon on its level plan, highlighted on unit detail page). Same entity, additional Asset type in scope.

8. **ContentBackbone entity (or composition pattern).** Single content source that seeds both brochure and website. Forkable per surface. Open question whether this becomes a new entity or a relationship layer over existing entities.

9. **Microsite.content_config section-level granularity (extends Gap 15 from onboarding).** Per-section visibility toggle, configurable by developer at launch and post-launch.

10. **Vision verification on Assets.** Verification result attribute on Asset including which constraint attributes were checked, confidence scores, pass/fail, override status. Audit trail for developer overrides.

11. **Regeneration counter on Briefs.** Tracks automatic regeneration attempts (capped at three on vision failure). Triggers internal escalation when cap is reached.

12. **Two-phase render generation pattern.** Phase 2a then Phase 2b sequencing as an explicit pattern at the Brief or P12 prompt level.

13. **Generalised `import_assets`.** Extend Gap 17 from onboarding (where it was scoped to onboarding Step 9) to apply universally across the launch package. Every generation step has an import alternative.

14. **Imported Asset sync chain behaviour.** When underlying data changes and an imported Asset becomes Stale, Bricly cannot regenerate. Developer notification, manual resolution. Distinct from Stale-then-regenerate on Bricly-generated Assets. Asset.source attribute distinguishes (relates to onboarding Gap 18, Asset state Imported).

15. **Language variant pattern on Brief.** Brief-level language input, propagates through content backbone composition. At launch, default language generated. Additional languages on demand.

16. **Style library Resource (R19 referenced in onboarding gap list).** Curated reference photography for brand consultation Mode A part 2 Block 2 (time of day and lighting reference imagery). Now confirmed as a needed Resource at this flow's level.

17. **Bricly internal escalation queue.** Failed renders after three verification attempts, failed brand after two regeneration cycles, and similar dead-end states need a real internal handler queue and review tool. Bricly-internal capability, not customer-facing.

18. **Go-to-Market flow (parked).** Separate wizard, separate session, separate scope. Owns: sales team provisioning, lead routing, microsite publishing, campaign launching, Project state Launching → Selling. Future session.

---

## Reframe of onboarding flow Steps 7 to 11

The Developer Onboarding flow currently sequences brand consultation before any render generation (Step 7 brand consultation, Step 9 asset generation including renders). This session changed the sequence to: brand consultation Mode A part 1 → Phase 0 renders generate → brand consultation Mode A part 2 (using Phase 0 renders) → Mode B brand selection → Phase 2 renders. The onboarding flow's Steps 7 to 11 are now superseded by this document's Phase 0 to Phase 5. The onboarding flow document is updated separately to point to this flow for the generation half.

---

End of document.
