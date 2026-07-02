# **Bricly Marketing SOPs**

*Drafted from the Bricly flows and standard off-plan marketing practice. Each SOP follows the Bricly SOP template. Comments in the margin flag where your input, a target number, or a decision is needed. Procedure steps are tagged \[D\] deterministic (becomes a Tool) or \[J\] judgment (becomes orchestration context).*

*Capability and Tool names are reconstructed from the flows. Reconcile them against bricly-capability-surface.md when you finalise each one.*

# **Brand and identity**

## **MKT-BR-01   Brand consultation (name, building names, personas, tone)**

category: Marketing  |  subcategory: Brand and identity  
maturity: ideal  |  autonomy: Pattern 4 (conversational)  
tools: start\_consultation, continue\_consultation, conclude\_consultation  
resources: project\_details, constraint\_model, corporate\_brand  
entities: Project, Building, Persona, BrandKit, ConsultationSession  
upstream: OPS-ON-03  |  downstream: MKT-BR-02, MKT-BR-03, MKT-AD-03  
metric: time to locked brand brief; downstream on-brand first-pass rate

**1\. Outcome**

Lock the project's verbal identity, the name, building names, buyer personas and tone of voice, before any visual asset is generated, so everything downstream aims at the right buyer and reads as one brand.

**2\. Definition of done**

* Project name approved.

* Confirm if developer wants to add “By {Developer Name} under logo

* Building names approved where the project is multi-block.

* Buyer personas locked, each concrete and tied to available inventory.

* Tone of voice recorded on the BrandKit.

* Moodboard selected

**3\. Trigger and preconditions**

**Trigger:** Onboarding reaches the brand step and the developer chooses generate over import.

**Preconditions:** Project basics captured, location known, ConstraintModel extracting or approved.

**4\. Procedure**

1. \[J\] Agent | open the brand consultation, gather positioning, history and site location, about the project, target buyer and comparables | (start\_consultation type:brand) | conversational.

2. \[J\] Agent | propose project name and, if multi-block, building names | proposes, developer locks.

3. \[J\] Agent | derive 2 to 4 buyer personas from market and developer input | proposes, developer reviews.

4. \[J\] Agent | define tone of voice and set it on the BrandKit | (conclude\_consultation) | developer approves.

5. \[J\] Agent | Propose different visual moodboards that are derived from the tone of voice and personas with reason to each style and why it applies \- Lock in one that will dictate the visual style of the brand

**5\. Judgment and guardrails**

* Personas drive every later targeting and creative decision, so keep them concrete: budget band, buyer type, motivation, not demographic clichés.

* Name and building names are nominal locks. Personas and tone are reviewed together because they interrelate.

* Name options should be presented as different categories: 1\. through research about the area, location, history, and surroundings. 2\. Based on the type of project. 3\. Taking all the project details into account. 

* Anchor personas to the actual unit mix. A persona with no matching inventory is noise.

***Hard limits***

* Nothing is generated visually besides the visual moodboards or published in this SOP.

**6\. Data contract**

***Inputs***

* Project basics, location, comparables, developer positioning input.

***Outputs***

* Project.name, Building.name, Persona entities, BrandKit.tone\_of\_voice, ConsultationSession, moodboard.

**7\. Quality bar and metric**

* Name set and accepted.

* Personas concrete and inventory-relevant.

* Tone recorded on the BrandKit.

* Moodboard is a match

**Metric:** Time to a locked brand brief; share of downstream assets passing on-brand review first time.

**8\. Failure modes and escalation**

* Developer rejects all name options: capture the constraints and regenerate, do not force a choice.

* Thin market input: ask targeted questions rather than invent a persona.

**9\. Example**

A 24-unit seafront block. The agent proposes a coastline-evoking name, two personas (overseas investor 250 to 400k, local upgrader 400 to 600k) and a warm, confident tone, and visual moodboard to match. The developer locks the name, adjusts a budget band, approves the tone, selects a moodboard.

## **MKT-BR-02   Brand kit generation and selection**

category: Marketing  |  subcategory: Brand and identity  
maturity: ideal  |  autonomy: Pattern 2 (assist), gated selection  
tools: generate\_brand\_candidates, conclude\_consultation  
resources: constraint\_model, phase\_0\_renders, corporate\_brand  
entities: BrandKit, ConsultationSession, Asset  
upstream: MKT-BR-01, MKT-BR-03  |  downstream: MKT-WB-\*, MKT-BC-\*, MKT-AD-02  
metric: rounds to brand selection; brand consistency score across assets

**1\. Outcome**

Produce a coherent visual brand kit (logo suite, colour, type, motifs, application on branded elements, mockups) and have the developer choose one direction, so every asset can be generated on-brand.

**2\. Definition of done**

* Four brand candidates generated.

* Developer selects one.

* BrandKit set to Active with logo, colour, typography, patterns, type of imagery, visual identity and usage rules.

**3\. Trigger and preconditions**

**Trigger:** Brand consultation Mode A complete (name, personas, tone, moodboard locked) and art direction defined.

**Preconditions:** BR-01 complete, art direction (BR-03) available, Phase 0 renders available as visual reference.

**4\. Procedure**

1. \[D\] Agent | generate four distinct brand candidates from tone, art direction and personas | (generate\_brand\_candidates) | autonomous.

2. \[J\] Developer | review candidates and select one | gate.

3. \[D\] System | set the chosen BrandKit Active, store logo suite, palette, type and usage rules | (conclude\_consultation) | autonomous after selection.

**5\. Judgment and guardrails**

* Four candidates is the standard spread: enough contrast to reveal preference, few enough to decide quickly.

* Candidates should differ in direction, not just colour, so the choice is meaningful.

* Inherit from the workspace CorporateBrand where one exists, so multi-project developers stay consistent.

* If the developer is not happy with options → select, add feedback and our design team will work on feedback.

***Hard limits***

* Developer selection is required. No auto-promotion of a candidate to Active.

* Brand assets are not published anywhere in this SOP.

**6\. Data contract**

***Inputs***

* Tone, art direction, personas, moodboards, Phase 0 renders, CorporateBrand if set.

***Outputs***

* Four candidate Assets, one Active BrandKit, usage rules.

**7\. Quality bar and metric**

* Exactly one BrandKit Active.

* Logo, palette, type and usage rules all present.

* Direction matches the locked tone.

**Metric:** Rounds to selection; brand consistency score measured across later generated assets.

**8\. Failure modes and escalation**

* Developer likes none: capture what is off, regenerate one round before escalating to a human designer.

* Developer wants to mix two candidates: produce a fifth merged candidate, do not silently blend.

**9\. Example**

Four directions: coastal-minimal, heritage-serif, bold-contemporary, soft-luxury. The developer picks bold-contemporary, asks for a warmer accent, the agent adjusts and sets it Active.

## **MKT-BR-03   Art direction definition**

category: Marketing  |  subcategory: Brand and identity  
maturity: ideal  |  autonomy: Pattern 2 (assist)  
tools: continue\_consultation  
resources: phase\_0\_renders, constraint\_model, persona  
entities: BrandKit, ConsultationSession  
upstream: MKT-BR-01, MKT-RN-01  |  downstream: MKT-BR-02, MKT-RN-02  
metric: art-direction reuse rate across the project's assets

**1\. Outcome**

Translate the locked tone and the Phase 0 renders into a written art direction that every render, page and ad inherits, so visual output is consistent rather than improvised per asset.

**2\. Definition of done**

* Art direction brief recorded: mood, palette intent, lighting, material emphasis, composition rules, what to avoid.

* Brief attached to the BrandKit and referenced by downstream generation.

**3\. Trigger and preconditions**

**Trigger:** Brand consultation Mode A part 1 done and Phase 0 renders ready as reference.

**Preconditions:** Name, personas, tone locked; 2 to 4 Phase 0 hero renders available.

**4\. Procedure**

1. \[J\] Agent | review Phase 0 renders with the developer, capture what resonates | (continue\_consultation) | conversational.

2. Show options of similar projects and style and allow the developer to select preferred vision and direction

3. \[J\] Agent | write the art direction: mood, lighting, palette intent, materials, composition, exclusions | proposes, developer approves.

4. \[D\] System | attach the art direction to the BrandKit for downstream inheritance | autonomous.

**5\. Judgment and guardrails**

* Art direction is the bridge between words and pictures. Specific beats poetic: say warm late-afternoon light, low contrast, natural stone, not aspirational and timeless.

* List what to avoid as explicitly as what to pursue. Exclusions prevent the most common off-brand drift.

* Tie composition rules to the persona, an investor pack and a lifestyle pack frame the same building differently.

***Hard limits***

* No assets generated or published here.

**6\. Data contract**

***Inputs***

* Phase 0 renders, tone, personas.

***Outputs***

* Art direction brief on the BrandKit.

**7\. Quality bar and metric**

* Brief covers mood, light, palette, materials, composition and exclusions.

* Brief is concrete enough to prompt a render without further interpretation.

**Metric:** How often downstream assets inherit the direction without rework.

**8\. Failure modes and escalation**

* Developer cannot articulate preference: use the Phase 0 renders as a forced choice, this or that, and infer the direction.

**9\. Example**

Direction set to warm minimalism: late-afternoon light, low contrast, natural stone and oak, calm uncluttered framing, avoid cool blue tones and busy staging.

## **MKT-BR-04   Imported brand handling (Not v imp)**

category: Marketing  |  subcategory: Brand and identity  
maturity: ideal  |  autonomy: Pattern 2 (assist)  
tools: upload\_brand\_assets, build\_brandkit\_from\_import  
resources: corporate\_brand  
entities: BrandKit, Asset  
upstream: OPS-ON-03  |  downstream: all generation SOPs  
metric: import-to-Active time; on-brand rate on imported-brand projects

**1\. Outcome**

Ingest a developer's existing brand and map it into a BrandKit so generation stays on-brand without forcing a rebrand on developers who already have an identity.

**2\. Definition of done**

* Brand assets uploaded (logo, palette, type, guidelines).

* BrandKit built from the import and set Active.

* Usage rules captured so generation respects them.

**3\. Trigger and preconditions**

**Trigger:** Developer chooses import over generate at the brand step.

**Preconditions:** Developer has brand assets to provide.

**4\. Procedure**

1. \[D\] Developer | upload logo files, palette, fonts, any guidelines | (upload\_brand\_assets) | autonomous.

2. \[J\] Agent | parse the assets, extract palette and type, flag gaps | (build\_brandkit\_from\_import) | proposes.

3. \[J\] Developer | confirm or fill gaps (missing tone, usage rules) | gate.

4. \[D\] System | set the BrandKit Active | autonomous.

**5\. Judgment and guardrails**

* Imported brands are often incomplete for generation. Extract what exists, then ask only for the gaps that block render and page output (tone, accent usage, type hierarchy).

* Respect the developer's existing rules over Bricly defaults. The brand is theirs.

***Hard limits***

* Imported assets cannot be auto-regenerated downstream. They flag stale on upstream change and must be re-uploaded.

* Do not alter the developer's logo or marks.

**6\. Data contract**

***Inputs***

* Uploaded brand assets and guidelines.

***Outputs***

* Active BrandKit, usage rules, gap flags.

**7\. Quality bar and metric**

* BrandKit Active with palette, type, logo and tone present.

* Gaps resolved or explicitly accepted.

**Metric:** Time from import to Active; on-brand pass rate on imported-brand projects.

**8\. Failure modes and escalation**

* Low-res or missing logo: request a vector, fall back to flagging the asset for manual handling.

* No guidelines provided: derive defaults and confirm with the developer.

**9\. Example**

A developer uploads a logo, two brand colours and a font. The agent builds the kit, notices no tone is defined, asks three questions, sets the kit Active.

## **MKT-BR-05   Corporate brand inheritance**

category: Marketing  |  subcategory: Brand and identity  
maturity: ideal  |  autonomy: Pattern 2 (assist)  
tools: set\_corporate\_brand  
resources: corporate\_brand, brandkit  
entities: Workspace.CorporateBrand, BrandKit  
upstream: MKT-BR-02  |  downstream: future projects in the workspace  
metric: cross-project brand consistency

**1\. Outcome**

Set a workspace-level corporate brand so multi-project developers inherit a consistent house style on every new project instead of rebuilding from scratch.

**2\. Definition of done**

* CorporateBrand cluster set on the Workspace.

* New projects inherit it as their brand seed by default.

**3\. Trigger and preconditions**

**Trigger:** First project brand selected, or developer sets a corporate brand in settings.

**Preconditions:** At least one Active BrandKit, or developer-provided corporate assets.

**4\. Procedure**

1. \[J\] Developer | choose to promote a project BrandKit to CorporateBrand, or upload corporate assets | (set\_corporate\_brand) | gate.

2. \[D\] System | store the CorporateBrand on the Workspace | autonomous.

3. \[D\] System | seed new project BrandKits from it, still editable per project | autonomous.

**5\. Judgment and guardrails**

* Corporate brand is a seed, not a lock. Each project can diverge, the inheritance just removes the blank-page step.

* Decision on whether to set this is deferred until the developer has a brand they are happy to reuse.

***Hard limits***

* Inheritance never overwrites a project's own approved BrandKit.

**6\. Data contract**

***Inputs***

* A chosen BrandKit or corporate assets.

***Outputs***

* Workspace.CorporateBrand; seeded project BrandKits.

**7\. Quality bar and metric**

* CorporateBrand present on the Workspace.

* New projects inherit it and remain editable.

**Metric:** Brand consistency measured across the workspace's projects.

**8\. Failure modes and escalation**

* Developer wants per-project freedom: keep inheritance as a default, not a constraint.

**9\. Example**

After the first project, the developer promotes its BrandKit to the house brand. The next project opens pre-seeded with the house colours and type.

# **Renders and assets**

## **MKT-RN-01   Initial render pass (Phase 0 hero shots)**

category: Marketing  |  subcategory: Renders and assets  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: create\_and\_submit\_brief, generate\_render, vision\_verify  
resources: constraint\_model, availability  
entities: Brief, Asset (render, phase\_0)  
upstream: OPS-CM-02, MKT-BR-01  |  downstream: MKT-BR-03, MKT-BR-02  
metric: verification pass rate; time to usable hero shots

**1\. Outcome**

Produce two to four neutral, constraint-strict hero shots that ground the brand conversation, so art direction is decided against real images of this building rather than in the abstract.

**2\. Definition of done**

* Two to four hero renders generated, neutrally styled, no brand applied.

* Each render vision-verified against ConstraintModel layer 1\.

* Renders available inside the brand consultation.

**3\. Trigger and preconditions**

**Trigger:** Onboarding reaches the brand step and the developer accepts the generation pause.

**Preconditions:** ConstraintModel layer 1 approved (massing, height, materials, surroundings).

**4\. Procedure (MVP)**

1. \[D\] Agent creates a task with all the details for the renders team

2. \[D\] Agent automates the workflow until human must take over 

3. \[D\] Depending on the level, size, and quality of the development, agent recommends the type of render quality needed (Luxury → should be human made, top quality, Lower Small Projects → Could be ai generated)

4. Human creates renders and uploads them to the tasks

5. \[D\] Agent pushes this to workspace and notifies developer with update

**4.2 Procedure (Final Product)**

1. \[D\] Agent | compose a Phase 0 brief from constraint layer 1 and a neutral style directive | (create\_and\_submit\_brief) | autonomous.

2. \[D\] Agent | generate two to four hero shots | (generate\_render) | autonomous.

3. \[D\] Agent | vision-verify each against the constraint model, three silent retries on failure | (vision\_verify) | autonomous gate.

4. \[D\] System | surface passing renders inside the brand consultation | autonomous.

**5\. Judgment and guardrails**

* Phase 0 renders are scaffolding, not deliverables. Neutral styling on purpose, the brand has not been chosen yet.

* Constraint fidelity matters more than beauty here. The job is an honest massing and material reference.

* After three verification failures, flag to the internal team and proceed with whatever passed.

***Hard limits***

* No brand applied.

* Nothing public, no approval gate, the developer sees these only inside the consultation.

**6\. Data contract**

***Inputs***

* ConstraintModel layer 1, shot specification per image.

***Outputs***

* Phase 0 render Assets, verification results.

**7\. Quality bar and metric**

* Renders respect massing, height, materials, surroundings.

* At least two passed verification.

**Metric:** Vision verification pass rate; time from brief to usable hero shots.

**8\. Failure modes and escalation**

* All fail verification three times: escalate internally, do not show unverified renders as references.

* Constraint model thin: generate what layer 1 supports, flag missing inputs.

**9\. Example**

Three exterior hero shots of a hillside block, neutral daylight, correct slope and setback, surfaced in the brand session for the art-direction conversation.

## **MKT-RN-02   Final render set generation**

category: Marketing  |  subcategory: Renders and assets  
maturity: ideal  |  autonomy: Pattern 1 generation, gated approval  
tools: create\_and\_submit\_brief, generate\_render, vision\_verify  
resources: constraint\_model, brandkit, art\_direction  
entities: Brief, Asset (render, final), AssetUnitMap  
upstream: MKT-BR-02, MKT-BR-03  |  downstream: MKT-WB-\*, MKT-BC-01, MKT-AD-02  
metric: approved-shots per project; verification pass rate; cost per render

**1\. Outcome**

Generate the full launch render set with brand applied, the baseline hero shots plus multi-face adders, so the website, brochure and ads all draw from a coherent, approved image library.

**2\. Definition of done**

* Style-approval shots generated and approved by the developer.

* Full baseline set plus hero adders generated and verified.

* Renders mapped to project and units via AssetUnitMap and approved.

**3\. Trigger and preconditions**

**Trigger:** BrandKit Active and art direction set.

**Preconditions:** BR-02 and BR-03 complete; ConstraintModel finalised.

**4\. Procedure (Final Product)**

1. \[D\] Agent | generate style-approval shots with brand applied | (generate\_render) | autonomous.

2. \[J\] Developer | approve the style | gate.

3. \[D\] Agent | generate the rest of the baseline plus multi-face hero adders | (generate\_render) | autonomous.

4. \[D\] Agent | vision-verify every render | (vision\_verify) | autonomous gate.

5. \[J\] Developer | approve the final set | gate.

6. \[D\] System | map renders to project and units, mark Approved | autonomous.

4.1 **Procedure (MVP)**

1. Developer goes through conversation & wizard  
2. Render list / hero shots are selected by developer   
3. Wizard completed and informs developer renders and being produced and will be notified once they are created   
4. Agent → creates a task with all the details about the request and project which is assigned to design team  
5. Design team build the hero shots (low quality to confirm angles, render list)  
6. Once confirmed by developer → final renders are produced  
7. Feedback round?   
8. Confirmed and uploaded 

**5\. Judgment and guardrails**

* Style approval before volume. Lock the look on a few shots, then generate the rest, so a wrong direction is caught cheaply.

* Constraint fidelity is non-negotiable. A render that violates the architecture is a liability, off-plan buyers are buying the picture.

* Generate to the shot list the downstream assets need, not as many as possible. Renders are the dominant COGS line.

***Hard limits***

* Developer approval required before the set is used.

* No exterior render may misrepresent the architecture.

**6\. Data contract**

***Inputs***

* ConstraintModel, BrandKit, art direction, shot list.

***Outputs***

* Approved render Assets, AssetUnitMaps.

**7\. Quality bar and metric**

* Every render verified.

* Style approved before the full set.

* Renders mapped to the right units.

**Metric:** Approved shots per project; verification pass rate; render cost per project.

**8\. Failure modes and escalation**

* Style rejected after approval shots: regenerate the approval shots only, do not generate the full set.

* Verification failures on specific shots: retry then escalate, ship the rest.

**9\. Example**

Four style shots approved, then a seven-shot baseline plus two extra hero faces generated, all verified, mapped to the relevant unit types and approved.

## **MKT-RN-03   Finish package render variants**

category: Marketing  |  subcategory: Renders and assets  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: generate\_render, vision\_verify  
resources: constraint\_model.finish\_packages, brandkit  
entities: Asset (render, finish\_variant), FinishPackage  
upstream: MKT-RN-02  |  downstream: SAL-BC-01, MKT-WB-03  
metric: variants per finish package; cache reuse rate

**1\. Outcome**

Generate render variants for each defined finish package so buyers and the sales team can see the same home in the available finish options & configuration options \-  without re-commissioning a studio.

**2\. Definition of done**

* A render variant exists for each FinishPackage defined in the constraint model.

* Each variant verified and tagged to its FinishPackage.

* Variants available to Studio and the CRM.

**3\. Trigger and preconditions**

**Trigger:** Final render set approved and FinishPackages defined.

**Preconditions:** RN-02 complete; FinishPackages present on the ConstraintModel.

**4\. Procedure**

1. \[D\] Agent | for each FinishPackage,ConfigOptions generate the relevant interior variants | (generate\_render) | autonomous.

2. \[D\] Agent | vision-verify each variant | (vision\_verify) | autonomous gate.

3. \[D\] System | tag variants to FinishPackage and add to the asset library | autonomous.

**5\. Judgment and guardrails**

* Generate variants for the finish packages the developer actually sells, not every theoretical combination.

* Cache aggressively. These variants are reused in buyer packs, the first generation should serve many buyers.

***Hard limits***

* Variants respect the architecture, only finishes change, not structure.

* Disclaimer applies to any buyer-facing use.

**6\. Data contract**

***Inputs***

* FinishPackages, approved base renders, BrandKit.

***Outputs***

* Finish-variant render Assets tagged to FinishPackage; cache entries.

**7\. Quality bar and metric**

* One verified variant set per FinishPackage.

* Variants differ only in finish, not architecture.

**Metric:** Variants per finish package; downstream cache reuse rate.

**8\. Failure modes and escalation**

* A FinishPackage is under-specified: flag for the developer to define materials before generating.

**9\. Example**

Three finish packages, warm, neutral, dark, each rendered for the two main unit types, verified and cached for buyer packs.

## **MKT-RN-04   Render prompt and context engineering**

category: Marketing  |  subcategory: Renders and assets  
maturity: ideal  |  autonomy: Pattern 1 within boundary  
tools: compose\_render\_prompt, generate\_render  
resources: constraint\_model, brandkit, art\_direction, persona  
entities: Brief, Asset  
upstream: OPS-CM-01, MKT-BR-03  |  downstream: all render SOPs  
metric: first-pass verification rate; rework rate

**1\. Outcome**

The proprietary layer that turns the constraint model, brand and art direction into prompts and context that make a general render tool produce developer-grade, architecture-faithful output. This is the moat.

**2\. Definition of done**

* A documented prompt-composition method exists: which constraint fields map to which prompt elements, how brand and art direction are injected, how shot specs are expressed.

* The method is model-agnostic and produces verifiable output.

**3\. Trigger and preconditions**

**Trigger:** Any render brief is composed.

**Preconditions:** ConstraintModel, BrandKit and art direction available.

**4\. Procedure**

1. \[D\] Agent | pull constraint fields (massing, materials, surroundings, light), brand and art direction | autonomous.

2. \[J\] Agent | compose the prompt and context: structure, negatives, shot spec, brand cues | (compose\_render\_prompt) | proprietary method.

3. \[D\] Agent | submit to the render provider through the abstraction layer | (generate\_render) | autonomous.

4. \[D\] Agent | feed verification failures back as prompt corrections | autonomous.

**5\. Judgment and guardrails**

* This is where Bricly's edge lives. The general tool is a commodity, the prompt and context engineering is not. Write it with your real method.

* Express the architecture as hard constraints and negatives, not hopeful adjectives. The constraint model is the source of truth, the prompt enforces it.

* Keep the prompt method independent of any one provider so the model stays configuration, not code.

***Hard limits***

* Never bake a specific vendor's syntax into the stored method. Route through the provider abstraction.

* Never relax a constraint to get a prettier image.

**6\. Data contract**

***Inputs***

* Constraint fields, brand, art direction, shot spec.

***Outputs***

* Composed prompt and context; generated render; correction loop.

**7\. Quality bar and metric**

* Prompts derive from the constraint model, not free text.

* Method is provider-independent.

* Output verifies at a high first-pass rate.

**Metric:** First-pass vision-verification rate; rework rate per render.

**8\. Failure modes and escalation**

* Low first-pass rate on a project: inspect which constraint fields are weak, tighten the mapping.

**9\. Example**

A hillside shot prompt is composed from slope, setback, stone cladding and late-afternoon light, with negatives for added storeys and altered rooflines, producing a verified image first try.

## **MKT-RN-05   Interior render generation**

category: Marketing  |  subcategory: Renders and assets  
maturity: ideal  |  autonomy: Pattern 1 generation  
tools: generate\_render, vision\_verify  
resources: constraint\_model, finish\_packages, style\_sets  
entities: Asset (render, interior), StyleSet, FinishPackage  
upstream: MKT-RN-04, MKT-RN-03  |  downstream: SAL-BC-01, MKT-WB-03  
metric: verification pass rate; cache hit rate

**1\. Outcome**

Generate interior renders by style, finish and layout variant, so listings and buyer packs can show the inside of a home that does not physically exist yet, faithfully.

**2\. Definition of done**

* Interior renders generated for the required StyleSet, FinishPackage and layout combinations.

* Each verified and carrying the disclaimer for buyer-facing use.

* Renders cached against their combination.

**3\. Trigger and preconditions**

**Trigger:** A brief requests interior scope (launch library or buyer pack).

**Preconditions:** Constraint model with interior geometry, StyleSets and FinishPackages defined.

**4\. Procedure**

1. \[D\] Agent | resolve the combination: unit, StyleSet, FinishPackage, layout | autonomous.

2. \[D\] Agent | check cache, generate on miss | (generate\_render) | autonomous.

3. \[D\] Agent | vision-verify against interior constraints | (vision\_verify) | autonomous gate.

4. \[D\] System | cache and tag the render | autonomous.

**5\. Judgment and guardrails**

* Interiors must respect openings, ceiling heights and services routing, not just look good.

* Cache by full combination so a generation serves both the public library and later buyer packs.

***Hard limits***

* No structural change implied by the render.

* Disclaimer on every buyer-facing interior.

**6\. Data contract**

***Inputs***

* Unit geometry, StyleSet, FinishPackage, layout variant.

***Outputs***

* Verified interior render Assets; cache entries.

**7\. Quality bar and metric**

* Renders match the unit's real geometry.

* Verified and disclaimed where buyer-facing.

**Metric:** Verification pass rate; cache hit rate over time.

**8\. Failure modes and escalation**

* Geometry missing for a unit: flag for floor-plan parsing before generating.

**9\. Example**

A two-bed living room rendered in warm-minimal with the oak finish package, verified against the real window positions, cached for reuse.

# **Website and microsite**

## **MKT-WB-01   Content backbone composition**

category: Marketing  |  subcategory: Website and microsite  
maturity: ideal  |  autonomy: Pattern 2 (assist)  
tools: compose\_content\_backbone  
resources: project\_details, brandkit, persona, constraint\_model  
entities: ContentBackbone, Project  
upstream: MKT-RN-02, MKT-BR-02  |  downstream: MKT-WB-02, MKT-WB-03, MKT-BC-01  
metric: backbone reuse across surfaces; content rework rate

**1\. Outcome**

Compose one source of project copy and structure, the backbone, that seeds the website and the brochure, so both tell the same story and edits do not diverge.

**2\. Definition of done**

* ContentBackbone composed: positioning, sections, unit narrative, location, developer credentials, calls to action.

* Brochure and website both seed from it.

**3\. Trigger and preconditions**

**Trigger:** Brand and final renders ready, Developer selects, build website,brochure content

**Preconditions:** BrandKit Active, final renders approved, ProjectDetails complete, Developer selects to start

**4\. Procedure**

1. \[J\] Agent | draft the backbone from project details, personas and tone | (compose\_content\_backbone) | proposes.

2. Agent \- asks developer for me details on property types, type of views, specific features, and 

3. Agent \- Come up with content plan and send checklist back to developer for them to approve all sections (content plan is taken from pre build section list)

4. Agent \- Does research on the locations, get places of interest and project details 

5. Agent \- creates content for each section that is needed (Hero/Positioning statement 

6. \[J\] Developer | review and edit | gate.

7. \[D\] System | store the backbone as the seed for downstream surfaces, fork-on-edit thereafter | autonomous.

**5\. Judgment and guardrails**

* One backbone, many surfaces. Write once, fork per surface only when a surface genuinely needs different framing.

* Lead with the persona's motivation, an investor backbone foregrounds yield and location, a lifestyle one foregrounds the living experience.

***Hard limits***

* Nothing is published here, this is source content only.

**6\. Data contract**

***Inputs***

* ProjectDetails, personas, tone, renders, location data.

***Outputs***

* ContentBackbone, pages, sections.

**7\. Quality bar and metric**

* Backbone covers all surfaces' needs.

* Tone matches the BrandKit.

* Both website and brochure can seed from it.

**Metric:** Reuse across surfaces; content rework rate after first publish.

**8\. Failure modes and escalation**

* Thin project details: prompt for the missing facts rather than inventing claims.

**9\. Example**

A backbone with a seafront-living positioning, six sections, two unit narratives, location highlights and a book-a-viewing CTA, approved with minor edits.

## **MKT-WB-02   Teaser landing page build and publish**

category: Marketing  |  subcategory: Website and microsite  
maturity: ideal  |  autonomy: Pattern 1 build, gated publish  
tools: build\_microsite, publish\_teaser\_landing\_page  
resources: content\_backbone, brandkit, teaser\_assets  
entities: Microsite (teaser), Lead  
upstream: MKT-AD-01, MKT-WB-01  |  downstream: MKT-LG-01, MKT-FU-05  
metric: waitlist conversion rate on the teaser page

**1\. Outcome**

Stand up the single-screen teaser page that is the public face during pre-launch and captures the waitlist, so demand is building before the project is fully revealed.

**2\. Definition of done**

* Teaser page built: name, location framing, developer credentials, teaser hero, waitlist form.

* Page published.

* Submissions create waitlist Leads with tags.

**3\. Trigger and preconditions**

**Trigger:** CampaignBrief approved and pre-launch start date reached.

**Preconditions:** Brand, content backbone, teaser assets ready; waitlist capture configured.

**4\. Procedure**

1. \[D\] Agent | build the teaser page from brand and backbone | (build\_microsite mode:teaser) | autonomous.

2. \[J\] Developer | approve the page | gate.

3. \[D\] System | publish, wire the waitlist form to Lead capture | (publish\_teaser\_landing\_page) | autonomous after approval.

4. \[D\] System | tag submissions (buyer type, property type, source) and send confirmation | autonomous.

**5\. Judgment and guardrails**

* Teaser means restraint: no renders, no building reveal, no pricing. The waitlist benefit is early access, sell that.

* Form fields are the minimum that segment well, name, email, phone, buyer type, property interest. Every extra field costs conversion.

***Hard limits***

* Publishing requires developer approval.

* No renders or unit reveals on the teaser.

**6\. Data contract**

***Inputs***

* Brand, backbone, teaser hero, form config.

***Outputs***

* Published teaser Microsite; waitlist Leads; confirmation emails.

**7\. Quality bar and metric**

* Page on-brand, no reveals.

* Form creates tagged waitlist Leads.

* Confirmation fires.

**Metric:** Visitor to waitlist conversion rate.

**8\. Failure modes and escalation**

* Form not feeding the CRM: hold publish until capture is verified end to end.

* Low conversion: revisit the benefit framing and field count.

**9\. Example**

A teaser page goes live with a coastline hero, a waitlist form and a 48-hour early-access promise. Submissions land as tagged waitlist Leads.

## **MKT-WB-03   Launch microsite build and publish**

category: Marketing  |  subcategory: Website and microsite  
maturity: ideal  |  autonomy: Pattern 1 build, gated publish  
tools: build\_microsite, publish\_launch\_microsite  
resources: content\_backbone, brandkit, renders, availability, pricing  
entities: Microsite (project\_public\_site), Unit  
upstream: MKT-WB-01, MKT-RN-02, MKT-BC-01  |  downstream: MKT-AD-04, MKT-LG-02  
metric: site to lead conversion; time on page

**1\. Outcome**

Build and publish the full launch microsite, the canonical public surface, with renders, brochure, availability and pricing, so the project is fully shoppable at launch.

**2\. Definition of done**

* Launch microsite built with renders, brochure download, availability list, unit detail, finish packages, pricing, lead forms.

* Visibility configured (WB-04).

* Site published, replacing the teaser at launch.

**3\. Trigger and preconditions**

**Trigger:** Public launch confirmed, Microsite trigger selected 

**Preconditions:** Renders approved, brochure ready, backbone composed, availability current, visibility set.

**4\. Procedure**

1. \[D\] Agent | build the full site from backbone, brand, renders and live availability | (build\_microsite mode:full) | autonomous.

2. \[D\] Agent | availability list is to be decided to hide behind registration page

3. \[J\] Developer | approve | Edit through page builder and chat | confirm visibility | gate.

4. \[D\] Agent \- approves also \- Consults the develop and guides them when they updates things that goes against guidelines, settings, best practices \- Raises alert with CS

5. \[D\] System | publish on launch confirmation, flip from teaser | (publish\_launch\_microsite) | autonomous after confirm.

6. \[D\] System | keep availability and pricing synced from the CRM | autonomous.

**5\. Judgment and guardrails**

* The microsite is the source of truth for what is externally visible. Held-back units and unpublished pricing stay hidden everywhere downstream, including the MCP server.

* Availability is live, not a snapshot. A sold unit must update here automatically through the sync chain.

***Hard limits***

* Publishing requires developer confirmation.

* Held-back content stays held back across all external surfaces.

**6\. Data contract**

***Inputs***

* Backbone, brand, renders, availability, pricing, visibility config.

***Outputs***

* Published canonical Microsite; live availability and pricing.

**7\. Quality bar and metric**

* Renders, brochure, availability, pricing present and correct.

* Visibility honoured.

* Lead forms feed the CRM.

**Metric:** Site to lead conversion; time on page; unit-detail engagement.

**8\. Failure modes and escalation**

* Availability mismatch at publish: block until the CRM and site agree.

* A render fails late verification: publish without it, queue regeneration.

**9\. Example**

At launch the teaser flips to the full site: hero renders, downloadable brochure, a live availability grid, unit pages with finish options and pricing, and a book-a-viewing form.

# **Website and microsite**

## **MKT-WB-07   Registration gate and pricelist access**

category: Marketing  |  subcategory: Website and microsite  
maturity: ideal  |  autonomy: Pattern 1 self-serve, reserve gated by launch phase  
tools: register\_buyer, grant\_browse\_access, add\_to\_shortlist, share\_unit, request\_viewing, reserve\_unit (ideal) / request\_to\_reserve (MVP)  
resources: availability, pricing, renders, finish\_packages, content\_backbone, brandkit  
entities: PurchaserPortalAccess (browse-phase grant), Contact (state: Lead), Opportunity (Waitlist / New Lead), Unit, Shortlist (Units on Opportunity), Reservation, ReferralLink  
upstream: MKT-WB-03, MKT-WB-04  |  downstream: MKT-WB-05, MKT-LG-04, MKT-FU-01, SAL-PP-01  
metric: visitor-to-registration conversion; shortlist rate; registration-to-reserve conversion

**1\. Outcome**

Gate the availability list, pricing and unit detail behind a self-serve registration. A visitor creates an account, then browses every published unit, shortlists favourites, shares, requests a viewing, and reserves once launch is live. Registration captures a qualified lead and opens one buyer account that persists from first browse through reserve through the post-sale portal. This is the resolution of the WB-03 step 2 decision.

**2\. Definition of done**

* Public microsite carries the full vision (brand, renders, lifestyle, location, story) and ends on a single browse-availability call to action. No prices or unit detail on the public surface.  
* Availability list, pricing, unit detail and finish packages live only behind the gate.  
* Registration creates Contact (Lead), Opportunity (Waitlist pre-launch, New Lead at launch) and a browse-phase PurchaserPortalAccess grant in one atomic write.  
* Behind the gate: browse, shortlist, share, request viewing or brochure, and reserve.  
* Reserve is locked pre-launch with a countdown, and unlocks at launch.  
* Buyer actions feed the CRM. Explicit preferences feed Studio.

**3\. Trigger and preconditions**

Trigger: Launch microsite built (WB-03), visibility set (WB-04), gate enabled.  
Preconditions: availability and pricing current and synced from the CRM; held-back units hidden; buyer auth configured (Better-Auth, Contact-with-grant, email plus magic link); PSP configured if the reserve holding fee is live (SAL-PP-01).

**4\. Procedure**

1\. \[D\] System | serve the public microsite with vision content and a single browse-availability CTA, no prices or unit detail public | autonomous.

2\. \[D\] Buyer | click browse availability, complete the registration form (name, email, phone, buyer type, property type interest) | self-serve.

3\. \[D\] System | on submit, atomically create Contact (Lead), Opportunity (Waitlist pre-launch, New Lead at launch) and a browse-phase PurchaserPortalAccess grant, authenticate the buyer | (register\_buyer) | autonomous.

4\. \[D\] System | grant access to the availability list, pricing, unit detail and finish packages behind the gate | (grant\_browse\_access) | autonomous.

5\. \[D\] Buyer | browse units, shortlist favourites, share a unit or shortlist, request a viewing or brochure | self-serve.

6\. \[D\] System | record shortlist as Units attached to the Opportunity, surface shortlist counts per unit as a scarcity signal, log return visits and dwell time as inferred signal (WB-05) | autonomous.

7\. \[D\] Agent | use explicit shortlist and finish selections to compose Studio personalised pack prompts, use inferred signals only to inform what is proposed to the rep | autonomous within the explicit / inferred boundary.

8\. \[J\] Rep | work the ranked registered list, book viewings, qualify | Pattern 3 hot-signal alerts.

9\. \[D\] System | pre-launch, keep reserve locked with a visible countdown | autonomous.

10\. \[D\] System | at launch, unlock reserve | autonomous after launch confirmation (LN-02).

11a. \[J\] Buyer \+ Rep (MVP) | buyer requests to reserve, rep confirms and opens the Reservation | (request\_to\_reserve) | rep-mediated, gate.

11b. \[D\] Buyer \+ System (ideal) | buyer presses reserve, Unit goes Pending\_Hold with a short TTL, buyer pays the holding fee, Unit goes Reserved, otherwise the hold releases | (reserve\_unit) | autonomous with atomic first-press-wins. See SAL-PP-01.

**5\. Judgment and guardrails**

* The gate is a browse-unlock framed as unlocking the interactive experience. The public page must carry the full emotional sell first, or conversion drops.  
* Only explicit buyer preferences (shortlist, finish selections) compose generation prompts. Inferred signals (return visits, dwell time) only inform what the agent proposes to the rep. This is a privacy boundary, hold it.  
* Held-back units and unpublished pricing stay hidden behind the gate too, same source-of-truth rule as WB-03 and WB-04.

**Hard limits**

* The system never reserves on a buyer's behalf. Reserve is always buyer-initiated, and in the ideal flow confirmed by PSP payment.  
* Fastest-fingers reserve is atomic. Two buyers never hold the same unit. Concurrency is a correctness requirement.  
* The holding fee is a refundable fee, distinct from the contract deposit. Legal treatment is confirmed per jurisdiction before going live.

**6\. Data contract**

**Inputs**

* Availability, pricing, renders, finish packages, visibility config, buyer auth config, PSP config (if reserve is live).

**Outputs**

* Contact (Lead), Opportunity (Waitlist or New Lead), browse-phase PurchaserPortalAccess, Shortlist (Units on Opportunity), ReferralLink (on share), Reservation (Pending\_Deposit, on reserve), engagement signals to the CRM, explicit preferences to Studio.

**7\. Quality bar and metric**

* Registration is one low-friction step, and the account persists across phases.  
* Prices and unit detail never appear on the public surface.  
* Shortlist, share, request and reserve all work and feed the CRM.  
* Reserve is locked pre-launch and atomic at launch.

**Metric:** visitor-to-registration conversion; shortlist rate; registration-to-reserve conversion; share-driven signups.

**8\. Failure modes and escalation**

* Concurrency double-claim on reserve: hard block, the atomic claim rejects the second presser cleanly with a just-taken state and offers the hold queue.  
* Holding-fee payment fails or times out: release the Pending\_Hold back to Available, notify the buyer, log it.  
* Pricing or availability mismatch behind the gate versus the CRM: block reserve on the affected unit until they agree.  
* Buyer auth fails at registration: still create Contact and Opportunity so the lead is not lost, prompt re-auth.

**9\. Example**

A visitor lands from an ad, scrolls the microsite, falls for the project, clicks browse availability and registers with name, email, phone and buyer type. They are inside the price list immediately, shortlist three units and share one with their partner. Reserve is locked with a twelve-day countdown. At launch the countdown hits zero, reserve unlocks, they press reserve on their top unit, pay the holding fee, and the unit flips to Reserved across every surface.

**10\. Decisions captured**

* The price list is gated. Prices, unit detail and the interactive actions sit behind registration. The public microsite does the emotional sell only.  
* Registration and the pre-launch waitlist are unified into one self-serve buyer account that spans the lifecycle, with capabilities unlocking by phase.  
* Buyer auth is Better-Auth, Contact-with-grant, email plus magic link, persisting across phases. This resolves the standing buyer-portal auth open question.  
* The reserve mechanic ships rep-mediated for MVP. Buyer-initiated fastest-fingers reserve with PSP and atomic concurrency is the launch-hardening pass.  
* The reservation payment is a refundable holding fee, distinct from the contract deposit, with legal treatment confirmed per jurisdiction.

# **Ads and paid media**

## **MKT-AD-13   Sustained and post-launch paid media**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal (MVP: handoff)  |  autonomy: Pattern 2 (recommends), gated changes  
tools: build\_campaigns, generate\_recommendations, apply\_changes  
resources: campaign\_brief, performance\_data, availability, lead\_quality\_feedback  
entities: Campaign, Recommendation, AuditEvent  
upstream: MKT-AD-04, MKT-AD-10  |  downstream: MKT-RP-01, MKT-AD-08, MKT-AD-09  
metric: post-launch sell-through; cost ratio trend through the selling period

**1\. Outcome**

Keep paid media running through the whole selling period after launch day, so the project replaces post-launch fall-off and chips away at remaining inventory, rather than stalling. This SOP encodes the single most common launch failure: cutting spend after launch to mine the existing lead database.

**2\. Definition of done**

* Post-launch budget reserved in the brief and scheduled, not left to a launch-day decision.  
* Prospecting continues alongside retargeting (AD-09) and unit-level creative (AD-08) as inventory narrows.  
* Spend changes proposed as Recommendations tied to the cost ratio, never auto-applied.  
* A standing recommendation fires if the developer proposes stopping media to rely on the database.

**3\. Trigger and preconditions**

Trigger: Public launch complete, project in Selling, sustained phase reached.  
Preconditions: AD-04 live; performance and lead-quality data flowing; post-launch budget set in the brief (AD-01).

**4\. Procedure**

1\. \[D\] System | continue live campaigns into the sustained phase per the brief's post-launch allocation | autonomous.

2\. \[D\] Agent | monitor sell-through, fall-off and cost ratio against the benchmark | autonomous.

3\. \[J\] Agent | propose budget continuation and reallocation as Recommendations, each tied to the cost ratio | (generate\_recommendations) | proposes.

4\. \[J\] Developer | approve or reject | gate.

5\. \[D\] Agent | apply approved changes, log every one | (apply\_changes) | autonomous after approval.

6\. \[D\] Agent | if the developer proposes cutting media to mine the database, surface the failure pattern and the expected near-zero incremental sales before they decide | Pattern 2 alert.

**5\. Judgment and guardrails**

* Never cut spend right after launch to rely on the existing lead database. The people who were going to buy bought on launch day. A leftover list of a few thousand produces almost no further sales on its own.  
* Expect a 5 to 10 percent post-launch fall-off. The first month after launch is steadying the ship: replace the buyers who fall off with new ones, so the sold percentage holds, then chip away from month two.  
* Shift weight toward retargeting (AD-09) and unit-level creative (AD-08) as inventory narrows. Warm and specific beats broad and cheap late in the cycle.  
* Optimise to the cost ratio and qualified leads, not raw volume.

**Hard limits**

* No autonomous spend changes, pauses or budget moves.  
* Never advertise a sold or held-back unit.  
* Every recommendation, approval and execution is logged.

**6\. Data contract**

**Inputs**

* Performance data, lead-quality feedback, availability, brief targets.

**Outputs**

* Sustained Campaigns; Recommendations; applied changes; AuditEvents.

**7\. Quality bar and metric**

* Media continues after launch with a reserved budget.  
* Fall-off is replaced, sold percentage holds then climbs.  
* Creative shifts to retargeting and unit level as inventory narrows.

**Metric:** post-launch sell-through; cost ratio trend week over week through the selling period.

**8\. Failure modes and escalation**

* Developer wants to cut media after launch: surface the database-mining failure pattern and the expected near-zero incremental sales, recommend continuation, developer decides, logged.  
* Sell-through stalls despite continued media: trigger the product-mix and pricing feedback loop, surface sales-team feedback (see LN-01).  
* Budget exhausted early: recommend a top-up tied to the remaining inventory value, do not silently throttle.

**9\. Example**

A project takes 67 percent on launch day. Media keeps running into the selling period. Over the next month the team replaces a handful of fall-offs with new buyers, holds at roughly two thirds, then unit-level creative on the remaining penthouses chips the project toward sell-out.

# **Launch orchestration (new subcategory, confirm or reposition)**

## **MKT-LN-01   Phased digital launch strategy**

category: Marketing  |  subcategory: Launch orchestration  
maturity: ideal  |  autonomy: Pattern 2 sequencing and timing, Pattern 1 execution after confirmation  
tools: activate\_pre\_launch, activate\_waitlist, rank\_waitlist, unlock\_reserve, activate\_public\_launch (hard gate)  
resources: campaign\_brief, availability, pricing, engagement\_signals, media\_budget  
entities: Project (launch\_phase), Microsite, Opportunity (Waitlist), Reservation, CampaignBrief  
upstream: MKT-AD-01, MKT-WB-03, MKT-WB-07  |  downstream: MKT-LN-02, MKT-AD-13, MKT-AD-05, MKT-LG-08  
metric: launch-day sell-through; cost ratio; registration volume; waitlist-to-reserve conversion

**1\. Outcome**

A phased digital launch that uses the registration gate and a locked availability list to concentrate demand into a single launch moment, then sustains sales with continued marketing. The aim is high launch-day sell-through and high lead quality at a cost ratio well under the agency-commission benchmark.

**2\. Definition of done**

* Launch model chosen by buyer type (build-up-and-launch, or straight-to-market).  
* Launch phases configured on the Project (pre-launch, waitlist, launch, sustained).  
* Gate live in pre-launch with reserve locked and a visible countdown (WB-07).  
* Waitlist cohort gets an early reserve unlock before the public.  
* Launch day unlocks reserve for all, with the sales team mid-cycle on registered leads.  
* Continued-marketing budget reserved and scheduled for post-launch (AD-13).

**3\. Trigger and preconditions**

Trigger: CampaignBrief approved (AD-01), launch dates set.  
Preconditions: gate live (WB-07), microsite built (WB-03), pricing and product mix reviewed, media budget with a post-launch contingency, renders at the quality bar.

**4\. Procedure**

1\. \[J\] Developer \+ Agent | choose the launch model by buyer type. Investor-led apartment stock takes the build-up and launch-day model. A genuine end-user product (primary residence, slow decisions) takes straight-to-market, reserve open from day one, with less launch-day competition | agent recommends, developer decides | gate.

2\. \[D\] System | pre-launch, gate live, browse on, reserve locked, countdown running | (activate\_pre\_launch) | autonomous.

3\. \[D\] Agent \+ System | pre-launch paid media drives registrations (AD-05), the public page sells the vision, the gate captures browse-intent leads | autonomous execution, Pattern 2 on spend changes.

4\. \[D\] System | surface shortlist counts as a scarcity signal and live registered counts as social proof | autonomous.

5\. \[J\] Rep | work the ranked registered list, book viewings, qualify, build relationships before launch | Pattern 3 hot-signal alerts.

6\. \[D\] System | unlock reserve for the pre-launch registered cohort 48 to 72 hours before public launch | (activate\_waitlist, unlock\_reserve) | autonomous after developer confirm. See LG-08.

7\. \[J\] Rep | convert early-access reservations during the exclusive window | rep-driven.

8\. \[J\] Developer | double-confirm public launch | hard gate. See LN-02.

9\. \[D\] System | flip the microsite to full launch, unlock reserve for all, fastest-fingers claim live | (activate\_public\_launch) | autonomous after confirm.

10\. \[D\] Buyer \+ System | buyers reserve and pay the holding fee, units flip to Reserved across all surfaces in real time | buyer-initiated, autonomous propagation. See SAL-PP-01.

11\. \[D\] Agent | keep media live, propose budget continuation, do not stop spend to mine the existing database | Pattern 2, developer decides. See AD-13.

12\. \[J\] Rep \+ System | replace the 5 to 10 percent post-launch fall-off with new buyers, steady the sold percentage, then chip away | rep-driven, system tracks.

13\. \[D\] Agent | if the launch under-performs, surface product-mix and pricing feedback from the sales team and propose adjustments | Pattern 3 alert, Pattern 2 proposal.

**5\. Judgment and guardrails**

* Reserve stays locked through pre-launch on purpose. Locking concentrates demand into the launch moment. Unlocking early dilutes the launch.  
* The public page must carry the full emotional sell. The gate works because browse-intent beats inquiry-intent, but only after the buyer has fallen in love.  
* Aim for 60 percent or more sell-through on launch day. A soft launch that takes 10 percent is very hard to recover from.  
* Match the model to the buyer. Forcing an end-user product through a launch-day rush under-performs, which is what the straight-to-market branch exists for.

**Hard limits**

* Never cut media spend right after launch to rely on the existing lead database. This is the single most common launch failure.  
* Public launch requires developer double-confirmation. No automatic launch.  
* The holding fee and any deposits follow the jurisdiction's escrow or trust rules, confirmed before launch.

**6\. Data contract**

**Inputs**

* CampaignBrief, launch dates, availability, pricing, media budget with contingency, buyer-type and mix data, engagement signals.

**Outputs**

* Project launch\_phase transitions, reserve-unlock events, launch-day reservations, continued-marketing schedule, product-mix feedback loop.

**7\. Quality bar and metric**

* Phases sequenced correctly, reserve locked until the right moment.  
* Launch-day sell-through at target.  
* Post-launch media continues and fall-off is replaced.

**Metric:** launch-day sell-through percentage; cost ratio versus the agency-commission benchmark; registration volume and quality; waitlist-to-reserve and registration-to-reserve conversion.

**8\. Failure modes and escalation**

* Developer wants to cut media after launch: Agent surfaces the database-mining failure pattern, recommends continuation. Pattern 2, developer decides, logged.  
* Launch under target: trigger the product-mix and pricing feedback loop, surface sales-team feedback, propose straight-to-market continuation.  
* Demand not concentrating in pre-launch (low shortlist and registration volume): Agent flags weak top-of-funnel early enough to adjust spend or creative before launch day.

**9\. Example**

A 40-unit investor-led apartment project. The four-week pre-launch goes live: the gate is open, browse is on, reserve is locked with a countdown, and pre-launch media drives 1,800 registrations. Shortlist counts climb and the sales team works the hot list. Forty-eight hours before public launch the registered cohort gets early reserve access and books 12 units. On launch day reserve unlocks for everyone, the fastest-fingers rush takes another 15, and the project hits 67 percent on day one. Media keeps running, the team replaces a handful of fall-offs over the next month, and chips away to sell-out.

## **MKT-LN-02   Launch day execution runbook**

category: Marketing  |  subcategory: Launch orchestration  
maturity: ideal  |  autonomy: Pattern 1 orchestration after a hard developer confirmation  
tools: activate\_public\_launch, publish\_launch\_microsite, unlock\_reserve, activate\_paid\_campaigns, schedule\_social  
resources: campaign\_brief, availability, microsite, social\_assets  
entities: Project (launch\_phase), Microsite, Campaign, Reservation, Unit  
upstream: MKT-LN-01, MKT-WB-03, MKT-WB-07, MKT-AD-04, MKT-SO-02  |  downstream: MKT-AD-13, MKT-RP-02  
metric: launch-day sell-through; reserve error rate; time from confirmation to fully live

**1\. Outcome**

Execute the single launch moment cleanly. On one developer confirmation, the microsite flips to full launch, reserve unlocks for everyone, paid and social go live, and the team monitors the rush, so the day everything funnels into runs without errors or double-claims.

**2\. Definition of done**

* Developer double-confirms launch. Hard gate, no automatic activation.  
* Microsite flips teaser to full launch (WB-03), reserve unlocks across all accounts (WB-07).  
* Paid campaigns activate (AD-04), launch social fires (SO-02), developer list blast sends (FU-06) where used.  
* Reserve claims process atomically, fastest-fingers, with the holding-fee step (SAL-PP-01).  
* The team is monitoring inventory, reserve errors and spend in real time.

**3\. Trigger and preconditions**

Trigger: Public launch date reached, developer ready to confirm.  
Preconditions: gate live with reserve locked (WB-07), waitlist window complete (LG-08), creative approved, availability and pricing synced, PSP live (SAL-PP-01), launch social and paid built and approved (SO-02, AD-04).

**4\. Procedure**

1\. \[J\] Developer | double-confirm public launch | hard gate.

2\. \[D\] System | flip the microsite from teaser to full launch | (publish\_launch\_microsite) | autonomous after confirm.

3\. \[D\] System | unlock reserve for all registered accounts, start the fastest-fingers claim | (unlock\_reserve) | autonomous after confirm.

4\. \[D\] System | activate paid campaigns and fire launch social | (activate\_paid\_campaigns, schedule\_social) | autonomous after confirm.

5\. \[D\] Buyer \+ System | buyers reserve and pay the holding fee, units flip to Reserved and propagate to every surface in real time | buyer-initiated, autonomous propagation. See SAL-PP-01.

6\. \[D\] Agent | monitor inventory, reserve errors, online counts and spend, surface anomalies | Pattern 3 alerts, never decides.

7\. \[J\] Rep | work live demand, convert reservations, answer the questions the gate cannot | rep-driven.

**5\. Judgment and guardrails**

* One confirmation, then orchestrated activation. Do not stage the flip, the unlock and the spend as separate manual steps that can drift out of sync on the day.  
* Reserve correctness is the day's risk. The atomic claim must reject the second presser cleanly and offer the hold queue. A double-booked unit is a refund and a bad phone call.  
* Watch availability sync. A sold unit must drop from every surface in real time, including the MCP server and any partner widgets.  
* Keep a human in the loop on anomalies. The agent alerts, the team decides.

**Hard limits**

* No automatic launch. Public launch requires developer double-confirmation.  
* No autonomous spend changes during the launch window beyond the approved activation.  
* The atomic reserve claim is never relaxed for speed.

**6\. Data contract**

**Inputs**

* Launch confirmation, approved creative and social, availability, pricing, PSP config.

**Outputs**

* Full-launch Microsite, live Campaigns, unlocked reserve, launch-day Reservations, real-time propagation, monitoring log.

**7\. Quality bar and metric**

* Microsite, reserve, paid and social all live within the launch window of the confirmation.  
* No double-claims, no availability mismatches.  
* Anomalies alerted, not silently absorbed.

**Metric:** launch-day sell-through; reserve error rate (target zero); time from confirmation to fully live.

**8\. Failure modes and escalation**

* Reserve concurrency error: hard block the second claim, log, offer the hold queue, alert the team.  
* Availability mismatch at flip: block reserve on the affected units until the CRM and site agree.  
* A render fails late verification: publish without it, queue regeneration (per WB-03).  
* Paid or social fails to activate: retry, fall back to handoff in MVP, do not drop silently.

**9\. Example**

At 1pm the developer confirms. The microsite flips to full launch, reserve unlocks, paid and social go live, and the registered crowd starts pressing reserve. Units flip to Reserved across the site, brochure and investor dashboard in real time, the agent flags one near-simultaneous claim that the atomic lock rejected cleanly, and the team works live demand for the rest of the afternoon.

# **Sales SOP library (belongs in the sales library, referenced by marketing)**

## **SAL-PP-01   Unit reservation and holding payment**

category: Sales  |  subcategory: Purchase process  
maturity: ideal (MVP: rep-mediated)  |  autonomy: buyer-initiated, never autonomous on the system side  
tools: reserve\_unit (ideal) / request\_to\_reserve (MVP), take\_holding\_payment, place\_unit\_hold, convert\_hold\_to\_reservation  
resources: availability, pricing, payment\_provider, reservation\_terms  
entities: Reservation, Unit, Opportunity, Contact, PurchaserPortalAccess, PaymentDocument  
upstream: MKT-WB-07, MKT-LN-02  |  downstream: SAL purchase process, post-sale portal  
metric: reserve-to-paid conversion; reserve error rate (target zero); holding-fee settlement rate

**1\. Outcome**

Turn a buyer's reserve action into a held unit backed by a refundable holding payment, atomically and without double-claims, so the launch-day rush converts into clean Reservations and the unit comes off-market for everyone else.

**2\. Definition of done**

* A buyer reserve creates a Reservation (Pending\_Deposit) bound to one Unit, one Opportunity, one Contact.  
* The holding fee is taken through the PSP and recorded as a PaymentDocument.  
* The Unit moves Available, Pending\_Hold, then Reserved, and propagates to every surface in real time.  
* On a failed or timed-out payment, the hold releases back to Available.  
* The buyer's PurchaserPortalAccess carries through from browse to the post-sale portal.

**3\. Trigger and preconditions**

Trigger: Reserve is unlocked (LN-02) and a buyer presses reserve, or a rep files a reservation in the MVP flow.  
Preconditions: Unit Available; pricing current; PSP configured; reservation terms and holding-fee amount set; buyer registered with a portal grant (WB-07).

**4\. Procedure**

1a. \[D\] Buyer \+ System (ideal) | buyer presses reserve, the system places an atomic Pending\_Hold on the Unit for that buyer with a short TTL | (reserve\_unit, place\_unit\_hold) | autonomous, first-press-wins.

1b. \[J\] Buyer \+ Rep (MVP) | buyer requests to reserve, the rep confirms and places the hold | (request\_to\_reserve, place\_unit\_hold) | rep-mediated, gate.

2\. \[D\] Buyer \+ System | buyer pays the holding fee through the PSP inside the TTL | (take\_holding\_payment) | buyer-initiated.

3\. \[D\] System | on payment, convert the hold to a Reservation (Pending\_Deposit), move the Unit to Reserved, record the PaymentDocument | (convert\_hold\_to\_reservation) | autonomous.

4\. \[D\] System | propagate Reserved to every surface in real time, provision or carry the buyer's portal access | autonomous.

5\. \[D\] System | on payment failure or TTL expiry, release the hold, return the Unit to Available, notify the buyer | autonomous.

**5\. Judgment and guardrails**

* The claim is atomic. Two buyers never hold the same unit. The second presser is rejected cleanly and offered the hold queue.  
* The system never reserves on a buyer's behalf. Reserve is buyer-initiated, and in the ideal flow confirmed by payment.  
* The holding fee is a refundable fee that secures the unit, distinct from the formal contract deposit. Do not conflate the two.  
* The TTL is short enough to keep the rush honest and long enough to complete a payment.

**Hard limits**

* No autonomous reservation that takes money without a buyer action.  
* Concurrency is a correctness requirement, not a nicety.  
* Holding-fee and deposit handling follow the jurisdiction's escrow or trust rules, confirmed before launch. Malta and the EU differ from attorney-trust markets.

**6\. Data contract**

**Inputs**

* Reserve action, Unit, pricing, holding-fee amount, reservation terms, PSP config.

**Outputs**

* Reservation (Pending\_Deposit), Unit state Reserved, PaymentDocument, real-time propagation, portal access carried through.

**7\. Quality bar and metric**

* Every reserve is atomic and either completes to Reserved or releases cleanly.  
* The holding fee settles and is recorded.  
* Reserved propagates everywhere in real time.

**Metric:** reserve-to-paid conversion; reserve error rate (target zero); holding-fee settlement rate.

**8\. Failure modes and escalation**

* Concurrency double-claim: reject the second claim, log, offer the hold queue.  
* Payment fails or times out: release the hold, return the Unit to Available, notify the buyer.  
* PSP outage: hold the unit on a manual rep-confirmed basis, take payment when the PSP recovers, do not lose the buyer.  
* Pricing mismatch at reserve: block the claim on that unit until the CRM and site agree.

**9\. Example**

At launch a buyer presses reserve on their top unit. The system places a ten-minute hold, the buyer pays the 500-euro holding fee through the pay gate, the unit flips to Reserved across the site, brochure and dashboard, and their portal carries through to the post-sale process. A second buyer who pressed a fraction later is told the unit was just taken and offered the queue.

## **MKT-WB-04   Microsite visibility configuration**

category: Marketing  |  subcategory: Website and microsite  
maturity: ideal  |  autonomy: Pattern 2 (assist), gated  
tools: configure\_visibility  
resources: microsite, availability, pricing  
entities: Microsite, Unit, Asset  
upstream: MKT-WB-03  |  downstream: MKT-LG-\*, OPS agent surfaces  
metric: held-back-content leakage incidents (target zero)

**1\. Outcome**

Set, section by section, what is public versus held back on the canonical site, because that setting is the source of truth every external surface inherits, including agents and partners.

**2\. Definition of done**

* Each section and sensitive field marked public or held back: pricing, full floor plans, exact unit numbers, undisclosed units.

* Setting propagates to MCP, partner and agent surfaces.

**3\. Trigger and preconditions**

**Trigger:** Microsite build, or any change to what the developer wants shown.

**Preconditions:** Microsite exists; developer has a disclosure preference.

**4\. Procedure**

1. \[J\] Developer | choose what is public versus held back per section and field | (configure\_visibility) | gate.

2. \[D\] System | apply the setting as the canonical visibility source | autonomous.

3. \[D\] System | inherit it across MCP, partner and agent surfaces; held-back requests carry a private-info flag | autonomous.

**5\. Judgment and guardrails**

* One canonical visibility source prevents leaks. Never let a second surface decide its own visibility.

* Held-back is not deleted. A request for held-back content is flagged for a rep to disclose deliberately, not silently served.

***Hard limits***

* Held-back content never appears on any external surface without an explicit elevated scope.

* Pricing is never hidden in a way that misleads, pricing on request is an explicit state.

**6\. Data contract**

***Inputs***

* Developer disclosure choices.

***Outputs***

* Canonical visibility configuration; private-info flags on held-back requests.

**7\. Quality bar and metric**

* Every sensitive field has an explicit setting.

* External surfaces honour it.

* Held-back requests are flagged, not served.

**Metric:** Leakage incidents of held-back content, target zero.

**8\. Failure modes and escalation**

* Ambiguous default: hold back by default, ask the developer.

* A partner needs more visibility: grant scoped access, do not loosen the canonical setting.

**9\. Example**

Pricing set to on request, exact unit numbers hidden, two penthouses held back entirely. An agent querying availability sees everything except those, and a request for a held-back penthouse raises a flag for the rep.

## **MKT-WB-05   Microsite engagement tracking setup**

category: Marketing  |  subcategory: Website and microsite  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: configure\_tracking  
resources: microsite, opportunity  
entities: Microsite, Activity, Lead  
upstream: MKT-WB-03  |  downstream: MKT-LG-08, MKT-FU-\*, SAL-LH-\*  
metric: share of leads with engagement signals attached

**1\. Outcome**

Wire tokenised links and on-page events back to the CRM so the sales team sees who looked at what, which is the raw signal for ranking and timely follow-up.

**2\. Definition of done**

* Tokenised links resolve to specific Leads or Contacts.

* Page views, unit views, dwell time and brochure downloads log to the CRM activity stream.

* High-intent events available to ranking and alerting.

**3\. Trigger and preconditions**

**Trigger:** Microsite published.

**Preconditions:** Microsite live; CRM Contacts and Leads exist or can be created.

**4\. Procedure**

1. \[D\] Agent | issue tokenised links per Lead for private and tracked access | (configure\_tracking) | autonomous.

2. \[D\] System | capture page, unit and download events against the Lead | autonomous.

3. \[D\] System | surface high-intent events to ranking and real-time alerts | autonomous.

**5\. Judgment and guardrails**

* Engagement signal is only useful if it reaches the rep in time. Wire the hot events (unit revisit, long dwell) to real-time alerts, not just a report.

* Respect privacy. Track engagement, do not expose held-back content through a token.

***Hard limits***

* Never place personal data in a URL.

* Tokens never unlock held-back content beyond the Lead's granted scope.

**6\. Data contract**

***Inputs***

* Microsite, Lead and Contact records.

***Outputs***

* Tokenised links; engagement Activities; intent signals.

**7\. Quality bar and metric**

* Events attach to the right Lead.

* Hot events trigger alerts.

* No personal data in URLs.

**Metric:** Share of leads carrying engagement signals; alert-to-contact time.

**8\. Failure modes and escalation**

* Events not attributing: fall back to anonymous analytics, flag the attribution gap.

* Token shared by a buyer: scope it, expire it, do not expose private content.

**9\. Example**

Lead 14 opens a private link, views Unit 4B for six minutes, and the rep gets a real-time alert with the dwell context.

## **MKT-WB-06   SEO and metadata setup**

category: Marketing  |  subcategory: Website and microsite  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: configure\_seo  
resources: microsite, content\_backbone  
entities: Microsite  
upstream: MKT-WB-03  |  downstream: organic discovery  
metric: organic impressions and clicks; index coverage

**1\. Outcome**

Set page metadata, structured data and indexing rules so the public site is discoverable and represents the project correctly in search and social shares.

**2\. Definition of done**

* Titles, descriptions and Open Graph data set per page.

* Structured data for the development and units added.

* Indexing rules set so teaser and private content are not indexed.

**3\. Trigger and preconditions**

**Trigger:** Launch microsite build.

**Preconditions:** Microsite content and visibility settled.

**4\. Procedure**

1. \[D\] Agent | generate titles, descriptions and Open Graph data from the backbone | (configure\_seo) | autonomous.

2. \[D\] Agent | add structured data for the project and units | autonomous.

3. \[D\] System | apply indexing rules: index public pages, exclude teaser and private surfaces | autonomous.

**5\. Judgment and guardrails**

* Index the public launch site, never the teaser, the private buyer packs or held-back pages.

* Structured data should describe the development honestly, search penalises mismatches between markup and page.

***Hard limits***

* Never index private or held-back surfaces.

* No misleading metadata.

**6\. Data contract**

***Inputs***

* Backbone, page structure, visibility settings.

***Outputs***

* Per-page metadata, structured data, indexing rules.

**7\. Quality bar and metric**

* Every public page has title, description and social data.

* Private pages excluded from indexing.

* Structured data matches the page.

**Metric:** Organic impressions and clicks; index coverage of public pages.

**8\. Failure modes and escalation**

* Private page indexed by mistake: add exclusion, request removal.

* Thin descriptions: regenerate from the backbone.

**9\. Example**

Public unit pages get descriptive titles and social cards, the teaser and buyer packs carry no-index, and the development is marked up as a residential project.

# **Brochure and collateral**

## **MKT-BC-01   Brochure generation**

category: Marketing  |  subcategory: Brochure and collateral  
maturity: ideal  |  autonomy: Pattern 1 build, gated approval  
tools: generate\_brochure  
resources: content\_backbone, brandkit, renders, availability  
entities: Asset (brochure), Microsite  
upstream: MKT-WB-01, MKT-RN-02  |  downstream: MKT-LG-10, MKT-FU-02  
metric: brochure download rate; download-to-enquiry rate

**1\. Outcome**

Build the project brochure from the same backbone, brand and renders as the website, so the leave-behind buyers download or receive is consistent with everything else.

**2\. Definition of done**

* Brochure generated as a branded PDF: positioning, renders, unit information, location, developer credentials, contact and CTA.

* Approved by the developer.

* Available for form-gated download and rep sharing.

**3\. Trigger and preconditions**

**Trigger:** Content backbone composed and final renders approved.

**Preconditions:** Backbone, brand, renders, availability ready.

**4\. Procedure**

1. \[D\] Agent | compose the brochure from the backbone, brand and renders | (generate\_brochure) | autonomous.

2. \[J\] Developer | approve | gate.

3. \[D\] System | store as a shareable asset, wire to the gated download | autonomous.

**5\. Judgment and guardrails**

* Seed from the backbone, fork on edit. The brochure is a surface of the same story, not a separate writing job.

* Keep pricing handling consistent with the site's visibility setting, do not print prices the site holds back.

***Hard limits***

* Approval required before distribution.

* Disclaimer on renders.

**6\. Data contract**

***Inputs***

* Backbone, brand, renders, availability, contact details.

***Outputs***

* Approved brochure Asset; gated download wiring.

**7\. Quality bar and metric**

* On-brand, consistent with the site.

* Pricing handling matches visibility.

* Renders disclaimed.

**Metric:** Download rate; download-to-enquiry conversion.

**8\. Failure modes and escalation**

* Render or data changes after approval: flag the brochure stale, regenerate.

* Pricing policy mismatch: defer to the visibility setting.

**9\. Example**

A 16-page brochure is generated from the backbone with hero renders and unit pages, approved, and wired to the site's form-gated download.

## **MKT-BC-02   Branded floor plan template**

category: Marketing  |  subcategory: Brochure and collateral  
maturity: ideal  |  autonomy: Pattern 2 (assist)  
tools: build\_floorplan\_template  
resources: brandkit, floor\_plans, constraint\_model  
entities: Asset (floor\_plan\_template), AssetUnitMap  
upstream: MKT-RN-02, OPS-ON-05  |  downstream: SAL-BC-03, MKT-WB-03, MKT-BC-01  
metric: template reuse across units

**1\. Outcome**

Produce the branded floor plan template applied across every level and unit, so plans on the site, in the brochure and in buyer packs are legible, consistent and on-brand.

**2\. Definition of done**

* A branded template exists: brand styling, legend, dimensions, orientation, disclaimer.

* Applied across levels and units via AssetUnitMap.

**3\. Trigger and preconditions**

**Trigger:** Final renders approved and floor plans parsed.

**Preconditions:** Floor plans uploaded and parsed; BrandKit Active.

**4\. Procedure**

1. \[J\] Agent | design the template from the brand and the parsed plans | (build\_floorplan\_template) | proposes.

2. \[J\] Developer | approve | gate.

3. \[D\] System | apply across units, map via AssetUnitMap | autonomous.

**5\. Judgment and guardrails**

* Consistency over decoration. A floor plan's job is clarity, brand it lightly.

* Always include orientation and the disclaimer, off-plan plans are indicative.

***Hard limits***

* Plans reflect the architecture, no embellishment that misrepresents space.

**6\. Data contract**

***Inputs***

* Parsed floor plans, BrandKit.

***Outputs***

* Floor plan template; per-unit applications.

**7\. Quality bar and metric**

* Legible, on-brand, with legend, scale, orientation and disclaimer.

* Applied to all units.

**Metric:** Template reuse across the project's units.

**8\. Failure modes and escalation**

* Plan parsing weak for a unit: flag for manual handling before applying.

**9\. Example**

A template with the brand palette, a clear legend and a north arrow is applied to all 24 units and surfaced on each unit page.

## **MKT-BC-03   Email template shell setup**

category: Marketing  |  subcategory: Brochure and collateral  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: build\_email\_template  
resources: brandkit, email\_integration  
entities: Asset (email\_template)  
upstream: MKT-BR-02  |  downstream: MKT-FU-\*, MKT-LG-08  
metric: email render fidelity across clients

**1\. Outcome**

Build the brand-applied email shell compatible with the developer's email tool, so every nurture, waitlist and blast message is on-brand and renders reliably. Create email signature for the project with developer branding on it

**2\. Definition of done**

* Responsive email shell built with brand styling, header, footer, CTA and legal footer.

* Compatible with the developer's email platform.

* Available to all follow-up SOPs.

**3\. Trigger and preconditions**

**Trigger:** Launch package marketing-template phase.

**Preconditions:** BrandKit Active; email platform identified.

**4\. Procedure**

1. \[D\] Agent | build a responsive shell from the brand | (build\_email\_template) | autonomous.

2. \[D\] Agent | validate rendering across common clients | autonomous.

3. \[D\] System | store and expose to follow-up SOPs | autonomous.

**5\. Judgment and guardrails**

* A shell, not a finished email. The follow-up SOPs pour content into it.

* Keep it simple and robust, email clients are unforgiving. Plain, on-brand, accessible.

***Hard limits***

* Must include an unsubscribe and the developer's legal footer.

**6\. Data contract**

***Inputs***

* BrandKit, email platform spec.

***Outputs***

* Reusable email template Asset.

**7\. Quality bar and metric**

* Renders across major clients.

* Brand applied.

* Unsubscribe and legal footer present.

**Metric:** Render fidelity across clients; deliverability of messages built on it.

**8\. Failure modes and escalation**

* Client-specific breakage: simplify the layout.

* Platform incompatibility: export to the platform's supported format.

**9\. Example**

A responsive shell with the brand header, a single clear CTA and a compliant footer, validated and made available to the waitlist and nurture sequences.

# **Ads and paid media**

## **MKT-AD-01   Go-to-market consultation to CampaignBrief**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal  |  autonomy: Pattern 4 (conversational), gated approval  
tools: start\_gtm\_consultation, continue\_gtm\_consultation, conclude\_gtm\_consultation  
resources: project\_details, constraint\_model, persona, corporate\_brand  
entities: ConsultationSession (gtm), CampaignBrief  
upstream: MKT-WB-01  |  downstream: all AD, SO and LG SOPs  
metric: consultation-to-approval time; brief completeness

**1\. Outcome**

Run the agent-led consultation that produces the single approvable CampaignBrief, the object that configures every downstream campaign, channel, budget and target.

**2\. Definition of done**

* CampaignBrief approved with: launch timing, budget split, cost ratio benchmark, lead targets, countries and languages, persona segments, channel mix and allocation, waitlist and teaser settings, email integration target, sales enablement, approval rhythm, compliance flags acknowledged.

**3\. Trigger and preconditions**

**Trigger:** Developer initiates the go-to-market consultation from the Project view.

**Preconditions:** Launch package approved; project in Launching.

**4\. Procedure**

1. \[J\] Agent | run the consultation block by block, adapting depth to the developer's marketing literacy | (start/continue\_gtm\_consultation) | conversational.

2. \[J\] Agent | assemble the CampaignBrief from the answers | (conclude\_gtm\_consultation) | proposes.

3. \[J\] Developer | review and approve the single brief | gate.

**5\. Judgment and guardrails**

* One approvable object. Everything downstream references the brief, so get it complete before anything spends.

* Set the cost ratio benchmark here, it is the number every later report and optimisation is measured against.

* Adapt language to the developer. Some know media buying, some do not, the required data points are the same, the depth of explanation is not.

***Hard limits***

* Single approval gate at the end. No campaign spends before the brief is approved.

* Compliance flags must be acknowledged per jurisdiction in the brief.

**6\. Data contract**

***Inputs***

* Project details, personas, constraint model, developer goals and budget.

***Outputs***

* Approved CampaignBrief; downstream Campaign and Recommendation objects reference it.

**7\. Quality bar and metric**

* Every required block answered.

* Cost ratio benchmark set.

* Compliance acknowledged.

* Developer approved.

**Metric:** Consultation-to-approval time; brief completeness; later variance from the brief.

**8\. Failure modes and escalation**

* Developer unsure on budget: propose a range tied to the cost ratio benchmark, do not leave it blank.

* Compliance unknown for a market: flag and resolve before approval.

**9\. Example**

A 30-minute consultation yields a brief: launch in six weeks, 5 percent agency-cost benchmark, two personas, Meta and Google split 60/40, waitlist on, email via the developer's tool. Approved in one click.

## **MKT-AD-02   Paid creative pack generation**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal (MVP: handoff pack)  |  autonomy: Pattern 1 generation  
tools: generate\_creative\_pack, vision\_verify  
resources: campaign\_brief, brandkit, renders, persona  
entities: Asset (paid\_creative), CampaignBrief  
upstream: MKT-AD-01, MKT-RN-02  |  downstream: MKT-AD-04, MKT-AD-08  
metric: creative volume per placement; winning-variant rate

**1\. Outcome**

Generate the paid creative, headlines, copy, image and video per placement and format, from the approved brief and the render library, so launch has tested-ready ad assets across channels.

**2\. Definition of done**

* Headlines and primary text generated per platform and persona.

* Image creative per placement and format (1:1, 9:16, 4:5, 16:9).

* Video where applicable.

* Each asset on-brand and compliant.

**3\. Trigger and preconditions**

**Trigger:** CampaignBrief approved.

**Preconditions:** Brand, renders, personas available; compliance rules loaded.

**4\. Procedure**

1. \[D\] Agent | generate copy variants per persona and platform | (generate\_creative\_pack) | autonomous.

2. \[D\] Agent | produce image and video creative per placement from the render library | autonomous.

3. \[D\] Agent | run compliance and vision checks | (vision\_verify) | autonomous gate.

4. \[J\] Developer | approve the pack (batched) | gate.

**5\. Judgment and guardrails**

* Generate variants to test, not one hero. The point of programmatic creative is breadth to learn from.

* Tie each variant to a persona, do not run generic creative when you have personas.

* Phase-aware: launch creative is project-level, later regenerate to segment and unit level (AD-08).

***Hard limits***

* Developer approval before anything runs.

* Every asset passes compliance before approval.

* Renders carry the disclaimer where shown.

**6\. Data contract**

***Inputs***

* CampaignBrief, brand, renders, personas, compliance rules.

***Outputs***

* Approved paid creative Assets per placement and persona.

**7\. Quality bar and metric**

* Full placement and format coverage.

* On-brand and compliant.

* Variants tied to personas.

**Metric:** Creative volume per placement; rate at which generated variants become winners.

**8\. Failure modes and escalation**

* Compliance rejects a variant: regenerate within rules, log the rejection.

* Thin render coverage for a placement: flag for additional renders.

**9\. Example**

For two personas, the agent produces 6 headlines, 4 primary texts and image sets in four ratios plus a short video, all compliant, approved in a batch.

## **MKT-AD-03   Audience and targeting definition**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal  |  autonomy: Pattern 2 (assist)  
tools: define\_audiences  
resources: campaign\_brief, persona, availability  
entities: CampaignBrief, Audience  
upstream: MKT-AD-01  |  downstream: MKT-AD-04, MKT-AD-09  
metric: audience-to-qualified-lead rate by segment

**1\. Outcome**

Define the audiences and targeting per platform and persona so spend reaches the right buyers, not the cheapest clicks.

**2\. Definition of done**

* Audiences defined per platform and persona: geography, interests, behaviours, lookalikes, exclusions.

* Retargeting and suppression audiences specified.

* Targeting attached to the brief.

**3\. Trigger and preconditions**

**Trigger:** CampaignBrief approved; creative in production.

**Preconditions:** Personas locked; target countries and languages set.

**4\. Procedure**

1. \[J\] Agent | propose audiences per persona and platform from the brief | (define\_audiences) | proposes.

2. \[J\] Developer | review and adjust | gate.

3. \[D\] System | attach audiences to the campaign config | autonomous.

**5\. Judgment and guardrails**

* Off-plan buyers cluster by intent and geography more than by demographics. Weight interest and behaviour over age and gender.

* Always define exclusions, current buyers, existing leads, irrelevant geographies, so spend is not wasted.

* Investor and end-user personas need different audiences even on the same project.

***Hard limits***

* No targeting that breaches platform or jurisdiction rules (housing-category restrictions where they apply).

**6\. Data contract**

***Inputs***

* Personas, geographies, languages, platform options.

***Outputs***

* Defined audiences and exclusions per platform.

**7\. Quality bar and metric**

* Audiences map to personas.

* Exclusions and suppression in place.

* Within platform policy.

**Metric:** Audience to qualified-lead rate by segment.

**8\. Failure modes and escalation**

* Housing-category targeting limits on a platform: use compliant broad targeting plus creative-led qualification.

* Audience too narrow to deliver: broaden and rely on creative to filter.

**9\. Example**

Investor audience: high-net-worth interest and expat behaviours across three countries. End-user audience: local geo plus life-stage signals. Existing leads excluded from both.

## **MKT-AD-04   Campaign setup and launch**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal (MVP: handoff)  |  autonomy: Pattern 1 build, hard-gated activation  
tools: build\_campaigns, activate\_paid\_campaigns  
resources: campaign\_brief, creative\_pack, audiences, lead\_forms  
entities: Campaign, CampaignBrief  
upstream: MKT-AD-02, MKT-AD-03, MKT-AD-11  |  downstream: MKT-AD-06, MKT-AD-10  
metric: time-to-live; setup error rate

**1\. Outcome**

Stand up the campaigns on Meta and Google, wire creative, audiences and lead forms, and go live only on developer confirmation, so launch activates cleanly and tracked.

**2\. Definition of done**

* Campaigns built per channel with creative, audiences, lead forms, budgets and UTM structure.

* Tracking and pixels verified.

* Campaigns live after developer confirmation.

**3\. Trigger and preconditions**

**Trigger:** Public launch confirmed (or pre-launch for the teaser objective).

**Preconditions:** Creative approved, audiences defined, lead forms configured, attribution structure set.

**4\. Procedure**

1. \[D\] Agent | build campaigns per channel from the brief | (build\_campaigns) | autonomous.

2. \[D\] Agent | verify pixels, lead-form wiring and UTMs | autonomous.

3. \[J\] Developer | confirm go-live | hard gate.

4. \[D\] System | activate, ramp spend conservatively to learn | (activate\_paid\_campaigns) | autonomous after confirm.

**5\. Judgment and guardrails**

* Hard gate on activation. No campaign goes live without explicit developer confirmation, this commits spend.

* Start conservative to read early signals before scaling. The first 24 to 72 hours are for learning, not volume.

* In MVP, Bricly produces the full launch-ready pack and the developer's team activates, lead data still flows back via the lead-form integration.

***Hard limits***

* Activation requires developer confirmation. No autonomous spend.

* No live campaign changes without going through the optimisation cycle (AD-10).

**6\. Data contract**

***Inputs***

* Brief, creative, audiences, lead forms, UTMs.

***Outputs***

* Live Campaigns; verified tracking.

**7\. Quality bar and metric**

* Tracking verified before launch.

* Lead forms feed the CRM.

* Activated only on confirmation.

**Metric:** Time to live; setup error rate; early lead flow.

**8\. Failure modes and escalation**

* Pixel or lead-form not firing: block activation until fixed.

* Disapproval at the platform: resolve compliance, resubmit.

**9\. Example**

Campaigns are built across Meta and Google, tracking verified, the developer confirms, and spend starts at a conservative cap while the agent watches early performance.

## **MKT-AD-05   Pre-launch paid media (waitlist objective)**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal (MVP: handoff)  |  autonomy: Pattern 1 build, gated activation  
tools: build\_campaigns, activate\_paid\_campaigns  
resources: campaign\_brief, teaser\_assets, teaser\_landing\_page  
entities: Campaign (teaser), Lead (waitlist)  
upstream: MKT-AD-01, MKT-WB-02  |  downstream: MKT-LG-01, MKT-LG-08  
metric: cost per waitlist registration

**1\. Outcome**

Run a small pre-launch budget to the teaser page with one objective, waitlist registrations, so demand is captured before the public launch.

**2\. Definition of done**

* Pre-launch campaigns built to the teaser page, single objective.

* Default budget allocation (around 5 percent of total) set.

* Live after developer approval, feeding waitlist Leads.

**3\. Trigger and preconditions**

**Trigger:** Pre-launch start date reached; teaser page live.

**Preconditions:** Teaser page published; teaser creative ready; brief approved.

**4\. Procedure**

1. \[D\] Agent | build teaser campaigns with a waitlist-registration objective | (build\_campaigns) | autonomous.

2. \[J\] Developer | approve pre-launch creative and budget | gate.

3. \[D\] System | activate, monitor cost per registration | (activate\_paid\_campaigns) | autonomous after approval.

4. \[D\] Agent | flag if the waitlist trajectory is below target for time-to-launch | autonomous alert.

**5\. Judgment and guardrails**

* One objective only, registrations. Do not muddy pre-launch with traffic or awareness goals.

* Keep the budget small, the job is to seed the waitlist, not to sell. The exclusive window does the converting.

* Watch trajectory against time-to-launch, a thin waitlist is a launch risk worth flagging early.

***Hard limits***

* Activation requires developer approval.

* No reveals in teaser creative.

**6\. Data contract**

***Inputs***

* Teaser page, teaser creative, budget allocation.

***Outputs***

* Live teaser Campaigns; waitlist Leads; trajectory alerts.

**7\. Quality bar and metric**

* Single registration objective.

* Budget within the pre-launch allocation.

* Leads tagged as waitlist.

**Metric:** Cost per waitlist registration; waitlist growth versus time-to-launch.

**8\. Failure modes and escalation**

* Cost per registration too high: revisit creative and audience before raising spend.

* Trajectory below target: alert the developer to extend pre-launch or adjust.

**9\. Example**

A 5 percent pre-launch budget drives waitlist signups at a healthy cost per registration. The agent reports weekly and flags when the list is on track.

## **MKT-AD-06   Bid strategy and budget pacing**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal  |  autonomy: Pattern 2 (recommends), gated changes  
tools: recommend\_bid\_changes  
resources: campaign, performance\_data, campaign\_brief  
entities: Campaign, Recommendation  
upstream: MKT-AD-04  |  downstream: MKT-AD-10  
metric: cost per qualified lead versus target

**1\. Outcome**

Set and adjust bid strategy and pace spend against the plan so the campaign hits its cost per qualified lead without overspending early or starving later.

**2\. Definition of done**

* Bid strategy set per campaign aligned to the objective.

* Budget pacing plan in place across pre-launch, launch and sustained phases.

* Pacing and bid changes proposed as Recommendations, never auto-applied.

**3\. Trigger and preconditions**

**Trigger:** Campaigns live.

**Preconditions:** AD-04 done; performance data flowing; cost ratio benchmark set.

**4\. Procedure**

1. \[D\] Agent | monitor pacing and cost per qualified lead against the plan | autonomous.

2. \[J\] Agent | propose bid and budget changes as Recommendations | (recommend\_bid\_changes) | proposes.

3. \[J\] Developer | approve or reject | gate.

4. \[D\] Agent | apply approved changes | autonomous after approval.

**5\. Judgment and guardrails**

* Pace to the phase. Conservative at launch to learn, scale into what works, do not front-load spend.

* Optimise to qualified leads and the cost ratio, not raw leads or clicks. Cheap bad leads fail the real metric.

* Every change is a Recommendation the developer approves. No autonomous bid or budget moves.

***Hard limits***

* No autonomous spend changes.

* No exceeding the brief's budget without explicit approval.

**6\. Data contract**

***Inputs***

* Performance data, brief targets, phase.

***Outputs***

* Bid strategy; pacing plan; bid and budget Recommendations.

**7\. Quality bar and metric**

* Strategy matches objective.

* Pacing follows the phase plan.

* Changes are gated.

**Metric:** Cost per qualified lead versus target; budget burn versus plan.

**8\. Failure modes and escalation**

* Underdelivery: recommend a bid or budget increase, do not auto-raise.

* Overspend pacing: recommend a throttle and alert.

**9\. Example**

Early CPL is high, the agent recommends a bid cap and a small budget shift to the better audience, the developer approves, CPL settles toward target.

## **MKT-AD-07   Ad compliance check per jurisdiction**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal  |  autonomy: Pattern 3 (flags, never decides)  
tools: check\_ad\_compliance  
resources: compliance\_rules, campaign\_brief  
entities: Asset (creative), AuditEvent  
upstream: MKT-AD-02  |  downstream: MKT-AD-04  
metric: platform disapproval rate; override audit completeness

**1\. Outcome**

Flag per-market off-plan advertising rules during creative generation so the developer launches compliant, with any override logged. The compliance rules layer is owned Bricly middleware.

**2\. Definition of done**

* Every creative checked against the relevant jurisdiction's rules.

* Issues flagged to the developer in plain language.

* Overrides logged in the audit trail.

**3\. Trigger and preconditions**

**Trigger:** Any creative is generated or about to run.

**Preconditions:** Compliance rules loaded for the target jurisdictions.

**4\. Procedure**

1. \[D\] Agent | check each creative against the jurisdiction's off-plan advertising rules | (check\_ad\_compliance) | autonomous.

2. \[J\] Agent | flag issues to the developer with the rule cited | flags, does not decide.

3. \[J\] Developer | fix or override | gate.

4. \[D\] System | log overrides as AuditEvents | autonomous.

**5\. Judgment and guardrails**

* The agent flags, it never decides compliance. The developer owns the legal call, Bricly surfaces the risk.

* Off-plan property advertising is regulated differently per market, pricing claims, disclaimers, completion-date statements. Encode the rules, do not guess.

* An override is legitimate but it must be logged. The audit trail is the protection.

***Hard limits***

* Never silently pass non-compliant creative.

* Never auto-override, the developer decides.

**6\. Data contract**

***Inputs***

* Creative, jurisdiction, compliance rules.

***Outputs***

* Compliance flags; AuditEvents on overrides.

**7\. Quality bar and metric**

* Every creative checked.

* Issues cited with the rule.

* Overrides logged.

**Metric:** Platform disapproval rate; completeness of the override audit trail.

**8\. Failure modes and escalation**

* Rule unknown for a market: flag as unverified, ask the developer or their counsel before running.

* Repeated disapprovals: tighten the rule set for that market.

**9\. Example**

A creative implies a guaranteed completion date. The agent flags the market's rule, the developer rewords it, and the cleared version runs.

## **MKT-AD-08   Phase-aware creative regeneration**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal  |  autonomy: Pattern 1 generation, gated approval  
tools: generate\_creative\_pack, vision\_verify  
resources: constraint\_model, availability, campaign\_brief  
entities: Asset (creative), Campaign  
upstream: MKT-AD-02  |  downstream: MKT-AD-10  
metric: phase-level CPL; unit-level creative conversion

**1\. Outcome**

Regenerate creative per campaign phase, project level, then segment level, then unit level, using the constraint model to make unit-specific ads at a scale media buyers cannot match. This is a structural moat.

**2\. Definition of done**

* Creative regenerated when the campaign moves phase.

* Unit-level creative produced from the constraint model for remaining inventory.

* Each new set verified and approved.

**3\. Trigger and preconditions**

**Trigger:** Campaign phase transition, or inventory shifts toward specific units.

**Preconditions:** Constraint model and render library available; current availability known.

**4\. Procedure**

1. \[D\] Agent | detect the phase and the units to feature | autonomous.

2. \[D\] Agent | regenerate creative at the right level from constraints and renders | (generate\_creative\_pack) | autonomous.

3. \[D\] Agent | verify | (vision\_verify) | autonomous gate.

4. \[J\] Developer | approve the new set | gate.

**5\. Judgment and guardrails**

* The constraint model lets Bricly generate unit-specific creative at scale, the thing an agency or media buyer cannot do by hand. Lean into it as inventory narrows.

* Match the creative level to the funnel stage, broad project creative early, specific unit creative as the project sells down.

* Retire creative for sold units automatically, never advertise a sold unit.

***Hard limits***

* Approval before the new set runs.

* Never feature sold or held-back units.

**6\. Data contract**

***Inputs***

* Phase, availability, constraint model, renders.

***Outputs***

* Phase-appropriate creative Assets.

**7\. Quality bar and metric**

* Creative level matches the phase.

* Sold units excluded.

* Verified and approved.

**Metric:** CPL by phase; conversion on unit-level creative versus project-level.

**8\. Failure modes and escalation**

* Availability stale: block regeneration until inventory syncs.

* Verification failure on unit creative: retry then escalate.

**9\. Example**

As the project sells past 60 percent, the agent regenerates ads to feature the three remaining penthouse types specifically, each rendered from its real geometry, and they outconvert the generic launch creative.

## **MKT-AD-09   Retargeting setup**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal  |  autonomy: Pattern 1 build, gated activation  
tools: build\_campaigns, define\_audiences  
resources: microsite, tracking, campaign\_brief  
entities: Campaign (retargeting), Audience  
upstream: MKT-WB-05, MKT-AD-03  |  downstream: MKT-AD-10  
metric: retargeting CPL versus prospecting CPL

**1\. Outcome**

Set up retargeting off thank-you pages and microsite engagement so warm visitors who did not convert get a second, cheaper touch.

**2\. Definition of done**

* Retargeting audiences built from site visitors, brochure downloaders and form abandoners.

* Retargeting creative sequenced by recency and engagement.

* Suppression of existing leads and buyers in place.

**3\. Trigger and preconditions**

**Trigger:** Teaser or launch traffic is live and tracked.

**Preconditions:** Tracking wired (WB-05); audiences definable.

**4\. Procedure**

1. \[D\] Agent | build retargeting audiences from engagement events | (define\_audiences) | autonomous.

2. \[D\] Agent | sequence creative by recency and depth of engagement | (build\_campaigns) | autonomous.

3. \[J\] Developer | approve | gate.

4. \[D\] System | activate with suppression of existing leads and buyers | autonomous after approval.

**5\. Judgment and guardrails**

* Retargeting is the cheapest qualified volume you have, warm intent already exists. Prioritise it.

* Sequence the message, a brochure downloader gets a different ad than a bouncer. Match depth to engagement.

* Suppress people already in the pipeline, retargeting a current lead wastes money and annoys them.

***Hard limits***

* Approval before activation.

* Suppress existing leads and buyers.

**6\. Data contract**

***Inputs***

* Engagement events, audiences, creative.

***Outputs***

* Live retargeting Campaigns with suppression.

**7\. Quality bar and metric**

* Audiences from real engagement.

* Creative sequenced.

* Existing pipeline suppressed.

**Metric:** Retargeting CPL versus prospecting CPL.

**8\. Failure modes and escalation**

* Audience too small to deliver: widen the window or combine signals.

* Frequency too high: cap it before it irritates.

**9\. Example**

Visitors who viewed a unit page but did not enquire are retargeted with a unit-specific ad and a book-a-viewing CTA, at a fraction of prospecting cost.

## **MKT-AD-10   Paid media optimisation cycle**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal  |  autonomy: Pattern 2 (recommend), gated, weekly  
tools: generate\_recommendations, apply\_changes  
resources: performance\_data, campaign\_brief, lead\_quality\_feedback  
entities: Recommendation, Campaign, AuditEvent  
upstream: MKT-AD-04  |  downstream: MKT-RP-01, MKT-RP-02  
metric: cost ratio trend; CPL trend week over week

**1\. Outcome**

Run the weekly recommend, decide, execute loop that moves the campaign toward the cost ratio benchmark, with the developer deciding every change.

**2\. Definition of done**

* Weekly recommendations generated: budget shifts, creative swaps, audience changes, pauses.

* Each tied to the cost ratio benchmark.

* Approved changes applied and logged.

**3\. Trigger and preconditions**

**Trigger:** Weekly cadence (or threshold breach).

**Preconditions:** Campaigns live; performance and lead-quality data flowing.

**4\. Procedure**

1. \[D\] Agent | analyse performance against the brief and lead-quality feedback | autonomous.

2. \[J\] Agent | generate discrete Recommendations, each referencing the cost ratio | (generate\_recommendations) | proposes.

3. \[J\] Developer | approve or reject each | gate.

4. \[D\] Agent | execute approved changes, log every one | (apply\_changes) | autonomous after approval.

**5\. Judgment and guardrails**

* Recommend, the developer decides, then execute. Three roles, every time. No autonomous spend or campaign changes.

* Anchor every recommendation to the cost ratio, the developer should see why a change helps the one number that matters.

* Use lead-quality feedback, not just platform metrics. A channel with cheap leads that never close is failing the real test.

***Hard limits***

* No autonomous spend changes, pauses or budget moves.

* Every recommendation, approval and execution is logged.

**6\. Data contract**

***Inputs***

* Performance data, lead-quality feedback, brief targets.

***Outputs***

* Recommendations; applied changes; AuditEvents.

**7\. Quality bar and metric**

* Recommendations reference the cost ratio.

* Developer decided each.

* All changes logged.

**Metric:** Cost ratio trend; CPL and qualified-lead trend week over week.

**8\. Failure modes and escalation**

* Developer does not respond: hold changes, surface the cost of inaction, do not act unilaterally.

* A recommendation backfires: log it, learn, adjust the next cycle.

**9\. Example**

Week three: the agent recommends shifting 20 percent of budget from a high-CPL audience to the retargeting set and swapping two fatigued creatives. The developer approves both, the cost ratio improves.

## **MKT-AD-11   Lead form configuration and integration**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: configure\_lead\_forms  
resources: platform\_integrations, campaign\_brief  
entities: LeadForm, Lead, Campaign  
upstream: MKT-AD-01  |  downstream: MKT-LG-04, MKT-AD-04  
metric: lead-form completion rate; CRM sync success rate

**1\. Outcome**

Configure native lead forms and route submissions into the CRM with attribution intact, so paid leads arrive structured and fully sourced, not as a CSV someone exports later.

**2\. Definition of done**

* Native lead forms configured per platform with the minimum-viable fields.

* Submissions create Leads with full source attribution.

* Sync verified end to end before campaigns run.

**3\. Trigger and preconditions**

**Trigger:** Campaign setup.

**Preconditions:** Platform integrations connected; capture pipeline ready.

**4\. Procedure**

1. \[D\] Agent | configure native lead forms with minimal fields and qualifying questions | (configure\_lead\_forms) | autonomous.

2. \[D\] Agent | map fields to the capture pipeline and attribution | autonomous.

3. \[D\] Agent | run an end-to-end test submission | autonomous gate.

**5\. Judgment and guardrails**

* Native forms convert better than off-platform landing pages for cold paid traffic. Use them, then qualify in follow-up.

* Keep fields minimal, every field drops completion. Capture the identifier and one or two qualifiers, enrich later.

* Attribution must survive the handoff. A lead with no source is a measurement hole.

***Hard limits***

* Campaigns do not run until the sync test passes.

* No personal data passed insecurely between platform and CRM.

**6\. Data contract**

***Inputs***

* Platform integrations, field spec, attribution scheme.

***Outputs***

* Configured LeadForms; attributed Leads; verified sync.

**7\. Quality bar and metric**

* Forms create attributed Leads.

* Minimal fields.

* Sync tested end to end.

**Metric:** Form completion rate; CRM sync success rate.

**8\. Failure modes and escalation**

* Sync fails the test: block launch until fixed.

* Low completion: cut a field.

**9\. Example**

A Meta instant form captures name, phone and buyer type, and each submission lands in the CRM within seconds as a fully attributed Lead.

## **MKT-AD-12   UTM and attribution structure**

category: Marketing  |  subcategory: Ads and paid media  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: configure\_attribution  
resources: campaign\_brief, tracking  
entities: Campaign, Lead, Opportunity  
upstream: MKT-AD-01  |  downstream: MKT-RP-01, MKT-RP-02, SAL reporting  
metric: share of leads and deals with complete attribution

**1\. Outcome**

Define the UTM scheme and attribution model so every lead and every closed deal carries permanent, consistent source data, which is what makes the cost ratio reporting trustworthy.

**2\. Definition of done**

* A consistent UTM convention defined across channels and campaigns.

* Attribution model chosen and applied.

* Source data written to Lead and Opportunity and never lost.

**3\. Trigger and preconditions**

**Trigger:** Campaign setup.

**Preconditions:** Channels and campaigns defined in the brief.

**4\. Procedure**

1. \[D\] Agent | generate a consistent UTM scheme per channel, campaign and creative | (configure\_attribution) | autonomous.

2. \[D\] System | write source attribution onto Leads at capture | autonomous.

3. \[D\] System | carry attribution through to the Opportunity and into reporting | autonomous.

**5\. Judgment and guardrails**

* Consistency is the whole point. A messy UTM scheme makes the cost ratio unreliable, and the cost ratio is the headline metric.

* Attribution is captured once at creation and never overwritten. Source is permanent.

* Pick one attribution model and apply it everywhere, mixing models corrupts comparison.

***Hard limits***

* Never put personal data in UTM parameters.

* Never overwrite an existing source attribution.

**6\. Data contract**

***Inputs***

* Channel and campaign structure, attribution model choice.

***Outputs***

* UTM scheme; attribution on Leads and Opportunities.

**7\. Quality bar and metric**

* Consistent scheme across channels.

* Source written at capture and preserved.

* Reporting can roll up by source.

**Metric:** Share of leads and deals with complete, consistent attribution.

**8\. Failure modes and escalation**

* Inconsistent tags from a manual campaign: enforce the scheme, correct retroactively where possible.

* Attribution lost in a handoff: trace and patch the pipeline.

**9\. Example**

Every campaign uses the same UTM pattern, so a closed deal three months later still shows it came from the launch Meta investor campaign, and the cost ratio by channel is exact.

# **Organic and social**

## **MKT-SO-01   Teaser social pack generation**

category: Marketing  |  subcategory: Organic and social  
maturity: ideal (MVP: generate, developer posts)  |  autonomy: Pattern 1 generation, gated publish  
tools: generate\_social\_pack  
resources: brandkit, constraint\_model, persona  
entities: Asset (social, teaser)  
upstream: MKT-AD-01  |  downstream: MKT-SO-05  
metric: teaser reach and waitlist referral from social

**1\. Outcome**

Generate the pre-launch social pack, 5 to 10 posts with no reveals, lifestyle and location led, to build awareness and feed the waitlist before launch.

**2\. Definition of done**

* 5 to 10 teaser posts generated: lifestyle, location, neighbourhood, developer brand.

* No renders or building reveals.

* Approved and ready to schedule or hand off.

**3\. Trigger and preconditions**

**Trigger:** Pre-launch start.

**Preconditions:** Brand and personas ready; teaser positioning set.

**4\. Procedure**

1. \[D\] Agent | generate teaser posts from brand, location and constraint context | (generate\_social\_pack) | autonomous.

2. \[J\] Developer | approve | gate.

3. \[D\] System | schedule via integration, or hand off in MVP | autonomous after approval.

**5\. Judgment and guardrails**

* Teaser social sells the lifestyle and the location, not the building. Use the constraint model for accurate neighbourhood and orientation, not reveals.

* Point everything at the waitlist. The job is registrations, not vanity reach.

***Hard limits***

* No reveals.

* Publishing requires approval.

**6\. Data contract**

***Inputs***

* Brand, location, personas, constraint context.

***Outputs***

* Approved teaser social Assets.

**7\. Quality bar and metric**

* No reveals.

* On-brand.

* Waitlist CTA present.

**Metric:** Teaser reach; waitlist referrals from social.

**8\. Failure modes and escalation**

* Thin location material: use neighbourhood and lifestyle angles, do not fabricate.

**9\. Example**

Eight posts on seafront living, the neighbourhood and the developer's track record, each driving to the waitlist, no building shown.

## **MKT-SO-02   Launch social pack generation**

category: Marketing  |  subcategory: Organic and social  
maturity: ideal (MVP: generate, developer posts)  |  autonomy: Pattern 1 generation, gated publish  
tools: generate\_social\_pack  
resources: brandkit, renders, content\_backbone  
entities: Asset (social, launch)  
upstream: MKT-RN-02, MKT-WB-01  |  downstream: MKT-SO-05  
metric: launch-day social engagement and referral traffic

**1\. Outcome**

Generate the launch-day social posts across platforms from the approved creative and renders, so the organic channel fires in sync with the paid launch.

**2\. Definition of done**

* Launch posts produced per platform from renders and backbone.

* Approved.

* Scheduled or handed off for launch day.

**3\. Trigger and preconditions**

**Trigger:** Public launch.

**Preconditions:** Renders approved; backbone composed; brand applied.

**4\. Procedure**

1. \[D\] Agent | generate launch posts per platform from renders and backbone | (generate\_social\_pack) | autonomous.

2. \[J\] Developer | approve | gate.

3. \[D\] System | publish or notify on launch day | autonomous after approval.

**5\. Judgment and guardrails**

* Launch social should reveal the project properly, this is the moment renders go public.

* Sequence the reveal across the day rather than dumping everything at once.

***Hard limits***

* Approval before publishing.

* Renders carry the disclaimer.

**6\. Data contract**

***Inputs***

* Renders, backbone, brand, platform specs.

***Outputs***

* Approved launch social Assets.

**7\. Quality bar and metric**

* Per-platform coverage.

* On-brand, disclaimed.

* Sequenced for launch day.

**Metric:** Launch-day engagement; referral traffic to the site.

**8\. Failure modes and escalation**

* A render fails late checks: hold that post, publish the rest.

**9\. Example**

A launch-day sequence reveals the hero render, then unit types, then the availability link, paced across the morning.

## **MKT-SO-03   Instagram launch grid**

category: Marketing  |  subcategory: Organic and social  
maturity: ideal  |  autonomy: Pattern 1 generation, gated publish  
tools: generate\_social\_pack  
resources: brandkit, renders  
entities: Asset (instagram\_grid)  
upstream: MKT-RN-02  |  downstream: MKT-SO-05  
metric: profile-to-site click-through

**1\. Outcome**

Produce the finished Instagram launch grid as the one fully polished organic asset, so the project's profile looks considered from the first visit.

**2\. Definition of done**

* A cohesive multi-post grid designed as one composition.

* Brand and renders applied.

* Approved and ready to post in order.

**3\. Trigger and preconditions**

**Trigger:** Launch package marketing-template phase.

**Preconditions:** Renders approved; brand applied.

**4\. Procedure**

1. \[D\] Agent | design the grid as a single composition across posts | (generate\_social\_pack) | autonomous.

2. \[J\] Developer | approve | gate.

3. \[D\] System | queue posts in the correct order | autonomous after approval.

**5\. Judgment and guardrails**

* The grid is a brand statement, treat it as one designed surface, not nine separate posts.

* This is the one polished organic piece, the rest of organic is lighter-weight.

***Hard limits***

* Post order matters, the grid only reads correctly if posted in sequence.

* Disclaimer on renders.

**6\. Data contract**

***Inputs***

* Renders, brand.

***Outputs***

* Approved grid Assets in order.

**7\. Quality bar and metric**

* Reads as one composition.

* On-brand.

* Correct post order.

**Metric:** Profile to site click-through.

**8\. Failure modes and escalation**

* Order broken on publish: the grid breaks, enforce sequence in scheduling.

**9\. Example**

A nine-post grid that together forms the hero render and tagline, posted in reverse order so it assembles correctly on the profile.

## **MKT-SO-04   Sustained organic content**

category: Marketing  |  subcategory: Organic and social  
maturity: ideal  |  autonomy: Pattern 2 (assist)  
tools: generate\_social\_pack, plan\_content\_calendar  
resources: brandkit, availability, performance\_data  
entities: Asset (social), ContentCalendar  
upstream: MKT-AD-01  |  downstream: MKT-SO-05  
metric: sustained engagement; organic-sourced leads

**1\. Outcome**

Run an ongoing organic cadence through the selling period to keep the project visible and warm between paid pushes.

**2\. Definition of done**

* A content calendar set for the selling phase.

* Recurring posts generated: progress, milestones, unit spotlights, social proof.

* Approved on a rolling basis.

**3\. Trigger and preconditions**

**Trigger:** Week two onwards, post-launch.

**Preconditions:** Project selling; brand and renders available; availability live.

**4\. Procedure**

1. \[J\] Agent | propose a rolling content calendar | (plan\_content\_calendar) | proposes.

2. \[D\] Agent | generate scheduled posts per the calendar | (generate\_social\_pack) | autonomous.

3. \[J\] Developer | approve batches | gate.

4. \[D\] System | schedule | autonomous after approval.

**5\. Judgment and guardrails**

* Sustained organic is about presence and proof, milestones, sold announcements where allowed, unit spotlights. Low effort, high consistency.

* Pull from real events, construction progress and reservations, rather than manufacturing content.

***Hard limits***

* Never post sold or held-back units as available.

* Approval before publishing.

**6\. Data contract**

***Inputs***

* Calendar, availability, brand, milestones.

***Outputs***

* Scheduled organic Assets.

**7\. Quality bar and metric**

* Calendar in place.

* Posts reflect real availability.

* Approved in batches.

**Metric:** Sustained engagement; organic-sourced leads over time.

**8\. Failure modes and escalation**

* Content dries up: lean on availability changes and milestones as the content engine.

**9\. Example**

A weekly cadence of one progress post, one unit spotlight and one social-proof post keeps the project visible between paid bursts.

## **MKT-SO-05   Social scheduling and publishing**

category: Marketing  |  subcategory: Organic and social  
maturity: ideal (MVP: handoff)  |  autonomy: Pattern 1 schedule, gated publish  
tools: schedule\_social  
resources: social\_integration, social\_assets  
entities: Asset (social), ScheduledPost  
upstream: MKT-SO-01..04  |  downstream: none  
metric: on-time publish rate

**1\. Outcome**

Schedule and publish approved social via the integrated scheduler, or hand off cleanly in MVP, so posting is reliable and not a manual chore.

**2\. Definition of done**

* Approved posts scheduled at the right times per platform.

* Published via integration, or exported for manual posting in MVP.

* Publishing confirmed and logged.

**3\. Trigger and preconditions**

**Trigger:** Any social pack approved.

**Preconditions:** Social integration connected, or a handoff format agreed.

**4\. Procedure**

1. \[D\] Agent | schedule approved posts per platform and time | (schedule\_social) | autonomous.

2. \[D\] System | publish via integration, or package for manual posting | autonomous.

3. \[D\] System | confirm publication and log | autonomous.

**5\. Judgment and guardrails**

* In MVP, generate and schedule then hand off, do not block on a full publishing integration.

* Respect platform timing and limits, a scheduler that violates rate limits fails silently.

***Hard limits***

* Only approved content is scheduled.

* No publishing of unapproved posts.

**6\. Data contract**

***Inputs***

* Approved social Assets, integration or handoff target.

***Outputs***

* Scheduled and published posts; publication log.

**7\. Quality bar and metric**

* Posts scheduled correctly.

* Published or handed off.

* Publication confirmed.

**Metric:** On-time publish rate.

**8\. Failure modes and escalation**

* Integration token expired: re-auth, fall back to handoff, do not drop posts silently.

* Publish fails: alert and retry.

**9\. Example**

Approved launch posts are scheduled across Instagram and Facebook for launch morning and publish on time, with confirmations logged.

# **Lead generation**

## **MKT-LG-01   Waitlist building**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: capture\_lead, tag\_lead  
resources: teaser\_landing\_page, channel\_integrations  
entities: Lead (waitlist), Activity  
upstream: MKT-WB-02, MKT-AD-05  |  downstream: MKT-LG-08, MKT-FU-02  
metric: waitlist size and quality versus time-to-launch

**1\. Outcome**

Capture pre-launch demand into a tagged, rankable waitlist so the launch opens to warm, segmented interest rather than a cold start.

**2\. Definition of done**

* Waitlist submissions captured from teaser page and pre-launch ads.

* Each tagged: source, buyer type, property interest, country.

* Confirmation sent; Lead created with waitlist status.

**3\. Trigger and preconditions**

**Trigger:** Any pre-launch capture event.

**Preconditions:** Teaser capture live; tagging scheme defined.

**4\. Procedure**

1. \[D\] System | capture the submission, create a waitlist Lead | (capture\_lead) | autonomous.

2. \[D\] System | tag source, buyer type, property interest, country | (tag\_lead) | autonomous.

3. \[D\] System | send confirmation and set expectations for launch | autonomous.

4. \[D\] System | make the Lead available to ranking | autonomous.

**5\. Judgment and guardrails**

* Minimum viable Lead is a single identifier, phone or email. Capture is atomic, never lose a partial.

* Tag at capture, not later. Untagged waitlist leads cannot be ranked or segmented when launch comes.

* The waitlist is an asset to be ranked, not just a list. Quality of tags now determines activation quality later.

***Hard limits***

* Never lose a submission to a validation failure, capture first, enrich after.

* No outreach yet, this SOP only builds the list.

**6\. Data contract**

***Inputs***

* Submissions, tagging scheme.

***Outputs***

* Tagged waitlist Leads; confirmations.

**7\. Quality bar and metric**

* Every submission captured.

* Tags applied at capture.

* Confirmation sent.

**Metric:** Waitlist size and tag quality versus time-to-launch.

**8\. Failure modes and escalation**

* Validation fails on a field: capture the identifier, flag the rest for enrichment.

* Duplicate submission: route to dedup (LG-05).

**9\. Example**

A teaser submission with email, buyer type investor and a Spain country tag becomes a ranked-ready waitlist Lead with an instant confirmation.

## **MKT-LG-02   Lead capture form setup**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: configure\_capture\_form  
resources: microsite, capture\_pipeline  
entities: LeadForm, Lead  
upstream: MKT-WB-03  |  downstream: MKT-LG-04  
metric: form completion rate; capture success rate

**1\. Outcome**

Configure the on-site capture forms (enquiry, viewing request, brochure) so every web submission becomes a structured, attributed Lead.

**2\. Definition of done**

* Forms configured with minimal fields and clear intent (enquire, book viewing, download).

* Submissions create attributed Leads.

* Validation degrades gracefully, never blocks capture.

**3\. Trigger and preconditions**

**Trigger:** Microsite build.

**Preconditions:** Capture pipeline ready; attribution scheme set.

**4\. Procedure**

1. \[D\] Agent | configure each form with minimal fields and explicit intent | (configure\_capture\_form) | autonomous.

2. \[D\] System | wire submissions to the capture pipeline with attribution | autonomous.

3. \[D\] System | confirm and route the Lead | autonomous.

**5\. Judgment and guardrails**

* Match fields to intent. A viewing request can ask more than a brochure download, do not over-ask on low-intent forms.

* Graceful validation. A malformed phone should not lose the email, capture what is valid.

***Hard limits***

* Capture is atomic and never blocked by validation.

* No personal data in URLs.

**6\. Data contract**

***Inputs***

* Form specs, capture pipeline, attribution.

***Outputs***

* Configured LeadForms; attributed Leads.

**7\. Quality bar and metric**

* Forms match intent.

* Submissions attributed.

* Validation never blocks capture.

**Metric:** Completion rate by form; capture success rate.

**8\. Failure modes and escalation**

* Pipeline rejects a Lead: queue and retry, do not drop.

* Low completion: reduce fields.

**9\. Example**

The book-a-viewing form asks name, phone, preferred dates and unit interest, while the brochure form asks only email, both creating attributed Leads.

## **MKT-LG-03   Channel setup (Meta, Google, LinkedIn, WhatsApp, web)**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous), gated connect  
tools: connect\_channel, test\_channel  
resources: platform\_integrations  
entities: ChannelIntegration, Lead  
upstream: MKT-AD-01  |  downstream: MKT-LG-04, MKT-AD-11  
metric: channels live with verified capture; per-channel lead volume

**1\. Outcome**

Connect every lead source into one capture pipeline so leads from any channel arrive in the same structured, attributed way.

**2\. Definition of done**

* Each channel connected: Meta, Google, LinkedIn, WhatsApp, web forms, partner feeds.

* Each tested end to end.

* All routing into the unified capture pipeline with source attribution.

**3\. Trigger and preconditions**

**Trigger:** Campaign setup, or a new channel added.

**Preconditions:** Platform credentials available; capture pipeline ready.

**4\. Procedure**

1. \[J\] Developer | authorise each platform connection | gate.

2. \[D\] Agent | connect and map each channel's payload to the capture schema | (connect\_channel) | autonomous.

3. \[D\] Agent | run a test lead through each channel | (test\_channel) | autonomous gate.

4. \[D\] System | mark channels live | autonomous.

**5\. Judgment and guardrails**

* One pipeline, many sources. Normalising every channel into one schema is what makes downstream parsing, scoring and dedup work.

* WhatsApp behaves differently from a web form, map each channel's quirks rather than assuming a common shape.

* No channel goes live until a test lead arrives correctly attributed.

***Hard limits***

* Connections require developer authorisation.

* No channel is live until its test passes.

**6\. Data contract**

***Inputs***

* Platform credentials, payload schemas.

***Outputs***

* Live ChannelIntegrations; verified capture.

**7\. Quality bar and metric**

* Each channel tested.

* Payloads normalised.

* Attribution intact.

**Metric:** Channels live with verified capture; lead volume per channel.

**8\. Failure modes and escalation**

* A channel test fails: keep it offline, surface the mapping issue.

* Credential expiry: prompt re-auth, do not silently drop leads.

**9\. Example**

Meta, Google and the web forms are connected and each passes a test lead into the pipeline with the right source tag before any spend starts.

## **MKT-LG-04   Lead parsing and enrichment**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: parse\_lead, enrich\_lead  
resources: capture\_pipeline, enrichment\_sources  
entities: Lead, Activity  
upstream: MKT-LG-03, MKT-AD-11  |  downstream: MKT-LG-05, MKT-LG-06  
metric: parse success rate; enrichment coverage

**1\. Outcome**

Normalise raw inbound leads into the standard schema and enrich them with available context, so scoring and routing work on clean, comparable data.

**2\. Definition of done**

* Each raw lead parsed into the standard fields.

* Enriched where sources allow (location, language, buyer-type signals).

* Parse and enrichment results logged; low-confidence fields flagged.

**3\. Trigger and preconditions**

**Trigger:** A raw lead enters the pipeline.

**Preconditions:** Capture live; parsing rules and enrichment sources configured.

**4\. Procedure**

1. \[D\] Agent | parse the raw payload into the standard schema | (parse\_lead) | autonomous.

2. \[D\] Agent | enrich with available context | (enrich\_lead) | autonomous.

3. \[D\] System | flag low-confidence or missing fields | autonomous.

4. \[D\] System | pass the clean Lead to dedup and scoring | autonomous.

**5\. Judgment and guardrails**

* Parse first, never block on enrichment. A clean identifier with thin context still routes, enrichment is a bonus, not a gate.

* Flag confidence. A guessed buyer type should be marked as inferred so scoring weights it correctly.

* Respect privacy in enrichment, use legitimate sources only.

***Hard limits***

* Never discard a lead for failing enrichment.

* No enrichment from sources that breach privacy rules.

**6\. Data contract**

***Inputs***

* Raw lead payloads, enrichment sources.

***Outputs***

* Parsed, enriched Leads with confidence flags.

**7\. Quality bar and metric**

* Parsed to schema.

* Enriched where possible.

* Confidence flagged.

**Metric:** Parse success rate; enrichment coverage; downstream scoring quality.

**8\. Failure modes and escalation**

* Unparseable payload: capture raw, flag for manual review, do not drop.

* Enrichment source down: proceed without it, flag the gap.

**9\. Example**

A WhatsApp lead with a name and number is parsed, enriched with country from the dialling code, and the buyer type is left flagged as unknown for qualification to resolve.

## **MKT-LG-05   Lead deduplication**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous), gated merge on ambiguity  
tools: detect\_duplicate, merge\_lead  
resources: contact\_graph  
entities: Lead, Contact, Activity  
upstream: MKT-LG-04  |  downstream: MKT-LG-06, SAL-LH-\*  
metric: duplicate rate caught; false-merge rate (target zero)

**1\. Outcome**

Detect when an inbound lead is the same person as an existing Lead or Contact and merge correctly, so one buyer is one record across channels and time.

**2\. Definition of done**

* Each new lead checked against existing records.

* Clear matches merged, preserving all source attributions and activity.

* Ambiguous matches flagged for a human, never auto-merged.

**3\. Trigger and preconditions**

**Trigger:** A parsed lead is ready to route.

**Preconditions:** Parsing done; contact graph available.

**4\. Procedure**

1. \[D\] Agent | match on identifiers (phone, email) then on weaker signals | (detect\_duplicate) | autonomous.

2. \[D\] System | merge clear matches, keeping every source and activity | (merge\_lead) | autonomous.

3. \[J\] Agent | flag ambiguous matches for human decision | gate.

4. \[D\] System | preserve a multi-touch history on the merged record | autonomous.

**5\. Judgment and guardrails**

* A buyer enquiring twice from two channels is one person with two touches. Merge the record, keep both attributions, that multi-touch history is sales signal.

* Merge confidently only on strong identifiers. On weak signals, flag, never auto-merge, a wrong merge is hard to undo and erodes trust.

* Never lose attribution in a merge. The second source is data, not noise.

***Hard limits***

* No auto-merge on ambiguous matches.

* Never discard source attribution or activity in a merge.

**6\. Data contract**

***Inputs***

* New lead, existing contact graph.

***Outputs***

* Merged records with full history; flags on ambiguous cases.

**7\. Quality bar and metric**

* Clear matches merged.

* Attribution and activity preserved.

* Ambiguous cases flagged not merged.

**Metric:** Duplicate rate caught; false-merge rate, target zero.

**8\. Failure modes and escalation**

* Two records merged in error: support an unmerge path, log it.

* Ambiguous flood: tune the match thresholds.

**9\. Example**

A buyer who downloaded the brochure last week now submits a viewing request. The agent recognises the email, merges, and the rep sees one Contact with two touches and rising intent.

## **MKT-LG-06   Lead qualification scoring**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous), gated routing rules  
tools: score\_lead  
resources: persona, availability, engagement\_signals  
entities: Lead, Opportunity  
upstream: MKT-LG-05  |  downstream: MKT-LG-08, MKT-FU-01, SAL-LH-\*  
metric: score-to-conversion correlation

**1\. Outcome**

Score each lead for fit and intent so the sales team and the outreach sequences act on the best leads first, not in arrival order.

**2\. Definition of done**

* Each lead scored on fit (buyer-type, property-type, budget) and intent (engagement signals, source).

* Score drives routing and ranking.

* Scoring rationale visible to the rep.

**3\. Trigger and preconditions**

**Trigger:** A deduped lead is ready, or engagement updates.

**Preconditions:** Personas and availability known; engagement signals flowing.

**4\. Procedure**

1. \[D\] Agent | score fit against personas and available inventory | (score\_lead) | autonomous.

2. \[D\] Agent | score intent from engagement and source quality | autonomous.

3. \[D\] System | attach the score and rationale, update on new signals | autonomous.

4. \[D\] System | feed the score to routing and ranking | autonomous.

**5\. Judgment and guardrails**

* Score fit and intent separately. A high-fit low-intent lead needs nurture, a low-fit high-intent lead may not be worth a rep's time, the two axes mean different actions.

* Anchor fit to real inventory. A perfect investor profile with no matching units left is not a high score.

* Show the rationale. A score a rep cannot interrogate is a score they will ignore.

***Hard limits***

* Scoring informs, routing rules are developer-set, not silently changed.

* No discriminatory scoring inputs.

**6\. Data contract**

***Inputs***

* Personas, availability, engagement, source quality.

***Outputs***

* Lead scores with rationale; routing inputs.

**7\. Quality bar and metric**

* Fit and intent scored.

* Anchored to inventory.

* Rationale visible.

**Metric:** Correlation between score and eventual conversion.

**8\. Failure modes and escalation**

* Score not predicting conversion: recalibrate weights against closed data.

* Rep distrust: expose and explain the rationale.

**9\. Example**

A lead matching the investor persona, with budget fit and two unit-page revisits, scores high on both axes and jumps the queue for speed-to-contact.

## **MKT-LG-07   Source attribution**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: attribute\_source  
resources: tracking, utm\_scheme  
entities: Lead, Opportunity, Campaign  
upstream: MKT-AD-12, MKT-LG-03  |  downstream: MKT-RP-01, MKT-RP-02  
metric: attribution completeness on leads and deals

**1\. Outcome**

Stamp every lead with permanent, accurate source data at creation so the cost ratio and channel reporting are trustworthy end to end.

**2\. Definition of done**

* Source captured at lead creation from UTMs, channel and referrer.

* Attribution carried to the Opportunity and into reporting.

* Source never overwritten by later touches.

**3\. Trigger and preconditions**

**Trigger:** Lead creation.

**Preconditions:** UTM scheme and tracking live.

**4\. Procedure**

1. \[D\] System | capture source from UTMs, channel and referrer at creation | (attribute\_source) | autonomous.

2. \[D\] System | store first-touch source permanently, record later touches separately | autonomous.

3. \[D\] System | carry attribution into the Opportunity and reporting | autonomous.

**5\. Judgment and guardrails**

* First-touch source is permanent. Later touches are recorded as additional signal, they never overwrite origin.

* Attribution is the backbone of the cost ratio. If source is unreliable, the headline metric is unreliable.

***Hard limits***

* Never overwrite the original source.

* No personal data in tracking parameters.

**6\. Data contract**

***Inputs***

* UTMs, channel, referrer.

***Outputs***

* Permanent source on Leads and Opportunities.

**7\. Quality bar and metric**

* Source set at creation.

* Preserved through to the deal.

* Multi-touch recorded without overwriting origin.

**Metric:** Attribution completeness on leads and closed deals.

**8\. Failure modes and escalation**

* Missing UTMs from a channel: fall back to channel-level attribution, flag the gap.

* Attribution lost downstream: trace and fix the pipeline.

**9\. Example**

A lead created from the launch Google campaign keeps that origin even after later WhatsApp touches, so the eventual sale credits the right channel in the cost ratio.

## **MKT-LG-08   Waitlist activation and ranking**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 ranking, gated outreach  
tools: rank\_waitlist, prepare\_outreach  
resources: lead\_score, availability, campaign\_brief  
entities: Lead (waitlist), Activity, OutreachSequence  
upstream: MKT-LG-01, MKT-LG-06  |  downstream: MKT-FU-02  
metric: waitlist-to-reservation conversion; rank-to-conversion correlation

**1\. Outcome**

At launch, rank the waitlist by lead score and activate it in priority order through a developer-approved exclusive window, so the warmest demand converts first.

**2\. Definition of done**

* Waitlist ranked by lead score, recency as tiebreaker.

* Tiered outreach prepared for the exclusive window.

* Outreach runs only after developer approval, respecting business-hours rules per channel.

**3\. Trigger and preconditions**

**Trigger:** Launch reached and the exclusive window opens.

**Preconditions:** Waitlist tagged and scored; exclusive-window settings in the brief.

**4\. Procedure**

1. \[D\] Agent | rank the waitlist by score, breaking ties by recency | (rank\_waitlist) | autonomous.

2. \[D\] Agent | prepare tiered outreach for the window | (prepare\_outreach) | autonomous.

3. \[J\] Developer | approve the activation | gate.

4. \[D\] System | release outreach in priority order, email immediate, WhatsApp and SMS held to business hours | autonomous after approval.

**5\. Judgment and guardrails**

* Rank by fit and intent, not by signup order. First in line is not the same as most likely to buy.

* The exclusive window is the waitlist's payoff, honour it. Early access is the promise that drove registration.

* Respect channel timing. Email can go immediately, messaging waits for business hours, a 3am WhatsApp damages the brand.

***Hard limits***

* Outreach requires developer approval.

* Business-hours rule holds for WhatsApp and SMS.

* Never contact a suppressed or opted-out lead.

**6\. Data contract**

***Inputs***

* Scored waitlist, availability, window settings.

***Outputs***

* Ranked waitlist; tiered outreach; activation log.

**7\. Quality bar and metric**

* Ranked by score with recency tiebreak.

* Outreach gated on approval.

* Channel timing respected.

**Metric:** Waitlist-to-reservation conversion; correlation of rank with conversion.

**8\. Failure modes and escalation**

* Approval delayed past window open: hold, alert, do not self-activate.

* High-rank leads unresponsive: cascade to the next tier.

**9\. Example**

At launch the top 40 scored waitlist leads get an immediate email and a business-hours WhatsApp inviting a priority viewing, ahead of the public open, after the developer approves the activation.

## **MKT-LG-09   Partner and referral channel setup**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 build, gated access  
tools: connect\_partner\_channel, configure\_partner\_access  
resources: visibility\_config, channel\_integrations  
entities: ChannelIntegration (partner), Lead, Partner  
upstream: MKT-WB-04  |  downstream: MKT-LG-04  
metric: partner-sourced lead volume and quality

**1\. Outcome**

Bring broker, agent and referral leads into the same pipeline with their own attribution and scoped visibility, so partner activity is tracked and credited like any other channel.

**2\. Definition of done**

* Partner and referral sources connected with partner-level attribution.

* Partner access scoped per the visibility config.

* Partner leads parsed, deduped and scored like any other.

**3\. Trigger and preconditions**

**Trigger:** A partner or referral channel is added.

**Preconditions:** Visibility config set; partner identified and authorised.

**4\. Procedure**

1. \[J\] Developer | authorise the partner and set their access scope | gate.

2. \[D\] Agent | connect the partner feed with partner-level attribution | (connect\_partner\_channel) | autonomous.

3. \[D\] System | apply scoped visibility, held-back content stays hidden | (configure\_partner\_access) | autonomous.

4. \[D\] System | route partner leads through the standard pipeline | autonomous.

**5\. Judgment and guardrails**

* Partner leads are first-class leads with an extra attribute, the partner. Track them in the same pipeline so credit and quality are visible.

* Scope partner visibility off the canonical config. A partner sees what the developer allows, never held-back inventory.

* Watch partner lead quality, volume without conversion is a partner to renegotiate, not celebrate.

***Hard limits***

* Partner access requires developer authorisation and scoping.

* Held-back content never exposed to partners.

**6\. Data contract**

***Inputs***

* Partner authorisation, visibility config, feed format.

***Outputs***

* Connected partner channel; scoped access; attributed partner Leads.

**7\. Quality bar and metric**

* Partner-level attribution.

* Scoped visibility honoured.

* Leads run the standard pipeline.

**Metric:** Partner-sourced lead volume and conversion quality.

**8\. Failure modes and escalation**

* Partner feed malformed: normalise or request a fixed format, do not drop.

* Partner requests held-back access: grant scoped, never loosen the canonical config.

**9\. Example**

A broker is connected with their own attribution and access to public inventory only. Their referred leads flow into the pipeline tagged to them and scored normally.

## **MKT-LG-10   Form-gated brochure download**

category: Marketing  |  subcategory: Lead generation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: configure\_capture\_form, deliver\_asset  
resources: brochure, capture\_pipeline  
entities: LeadForm, Lead, Asset (brochure)  
upstream: MKT-BC-01, MKT-WB-03  |  downstream: MKT-FU-01, MKT-FU-03  
metric: download-to-lead rate; download-to-enquiry rate

**1\. Outcome**

Gate the brochure behind a minimal form so downloads become attributed leads and trigger immediate follow-up, turning a passive asset into a capture point.

**2\. Definition of done**

* Brochure download gated by a minimal form (email, optional phone).

* Download creates an attributed Lead and delivers the file.

* Download triggers speed-to-contact follow-up.

**3\. Trigger and preconditions**

**Trigger:** Brochure published and a visitor requests it.

**Preconditions:** Brochure ready; capture live.

**4\. Procedure**

1. \[D\] Agent | gate the brochure with a minimal form | (configure\_capture\_form) | autonomous.

2. \[D\] System | create an attributed Lead and deliver the file immediately | (deliver\_asset) | autonomous.

3. \[D\] System | trigger speed-to-contact follow-up | autonomous.

**5\. Judgment and guardrails**

* Keep the gate light. Email alone may be the right trade, a heavy form on a brochure kills downloads.

* A download is a real intent signal. Wire it straight into speed-to-contact, do not let it sit.

* Deliver instantly. Making someone wait for a gated file they just gave their email for is a bad first impression.

***Hard limits***

* Capture is atomic, deliver the file even if optional fields fail.

* No personal data in the download URL.

**6\. Data contract**

***Inputs***

* Brochure, form spec, capture pipeline.

***Outputs***

* Attributed Leads; delivered brochures; follow-up triggers.

**7\. Quality bar and metric**

* Light gate.

* Lead attributed and file delivered instantly.

* Follow-up triggered.

**Metric:** Download-to-lead rate; download-to-enquiry conversion.

**8\. Failure modes and escalation**

* Delivery fails: retry, send a backup link, do not lose the lead.

* Gate too heavy: reduce to email only.

**9\. Example**

A visitor enters their email, gets the brochure in their inbox within seconds, becomes an attributed Lead, and receives a personal follow-up within the speed-to-contact window.

# **Follow-up and nurture**

## **MKT-FU-01   Speed-to-contact first touch**

category: Marketing  |  subcategory: Follow-up and nurture  
maturity: ideal  |  autonomy: Pattern 1 (autonomous within boundary), gated content rules  
tools: send\_first\_touch, log\_activity  
resources: lead, email\_integration, messaging\_integration  
entities: Lead, Activity, OutreachSequence  
upstream: MKT-LG-04, MKT-LG-10  |  downstream: SAL-LH-\*, MKT-FU-03  
metric: median time-to-first-contact; speed-to-contact conversion lift

**1\. Outcome**

Contact every new lead as fast as the channel allows, because speed-to-first-contact is the single biggest predictor of conversion in off-plan sales. Minutes matter.

**2\. Definition of done**

* Every new lead receives a first touch within the target window.

* Email goes immediately; WhatsApp and SMS respect business hours.

* First touch is personalised to source and interest, and logged.

**3\. Trigger and preconditions**

**Trigger:** A new lead is created or a high-intent event fires.

**Preconditions:** Lead captured and parsed; channels live; content rules set.

**4\. Procedure**

1. \[D\] System | detect the new lead and choose the channel by preference and time | autonomous.

2. \[D\] Agent | send a personalised first touch, immediate by email | (send\_first\_touch) | autonomous within boundary.

3. \[D\] System | hold WhatsApp and SMS to business hours, queue if out of hours | autonomous.

4. \[D\] System | log the touch and hand off to the rep or sequence | (log\_activity) | autonomous.

**5\. Judgment and guardrails**

* Speed is the lever. A lead contacted in five minutes converts far better than one contacted in an hour, design for minutes, not same-day.

* Personalise to the source and interest, a generic blast wastes the speed advantage. Reference what they enquired about.

* Respect channel timing. Email is fine instantly at any hour, messaging waits for business hours, the speed goal never overrides the brand-damage of a 3am message.

***Hard limits***

* Business-hours rule holds for WhatsApp and SMS, never override it for speed.

* Never contact an opted-out or suppressed lead.

* Content stays within the developer-approved rules, no unapproved claims or pricing.

**6\. Data contract**

***Inputs***

* Lead, source, interest, channel preferences, content rules.

***Outputs***

* Logged first-touch outreach; rep or sequence handoff.

**7\. Quality bar and metric**

* First touch within the target window.

* Channel timing respected.

* Personalised and logged.

**Metric:** Median time-to-first-contact; conversion lift of fast versus slow contact.

**8\. Failure modes and escalation**

* Out of hours for messaging: send the email now, queue the message for opening hours.

* Channel send fails: fall back to the next channel, do not skip the touch.

* No rep available: the automated first touch still fires, rep follows up.

**9\. Example**

A brochure download at 11pm gets an immediate, personalised email referencing the unit type, and a WhatsApp follow-up queued for 9am the next morning, both logged on the Lead.

## **MKT-FU-02   Waitlist outreach sequence**

category: Marketing  |  subcategory: Follow-up and nurture  
maturity: ideal  |  autonomy: Pattern 1 run, gated activation  
tools: run\_sequence, log\_activity  
resources: waitlist\_ranking, email\_integration, messaging\_integration  
entities: OutreachSequence, Lead (waitlist), Activity  
upstream: MKT-LG-08  |  downstream: SAL-LH-\*  
metric: waitlist response rate; exclusive-window conversion

**1\. Outcome**

Run the multi-step outreach that activates the ranked waitlist through the exclusive window, so priority leads are worked in order with timely, channel-appropriate touches.

**2\. Definition of done**

* A tiered sequence runs over the exclusive window: priority invite, reminder, last-call.

* Steps respect channel timing and stop on response.

* Every step logged; responders handed to reps.

**3\. Trigger and preconditions**

**Trigger:** Developer approves waitlist activation (LG-08).

**Preconditions:** Waitlist ranked; sequence approved; channels live.

**4\. Procedure**

1. \[J\] Developer | approve the sequence and window | gate.

2. \[D\] System | send the priority invite in rank order | (run\_sequence) | autonomous after approval.

3. \[D\] System | send reminders and last-call to non-responders, respecting timing | autonomous.

4. \[D\] System | stop on response, hand the lead to a rep, log every step | (log\_activity) | autonomous.

**5\. Judgment and guardrails**

* Work the ranking. The top tier gets the first and most personal touch, the window is their reward.

* Stop on engagement. A lead who replies should move to a human, not get the next automated reminder.

* Respect timing and frequency, the exclusive window is a courtesy, do not turn it into a barrage.

***Hard limits***

* Activation requires developer approval.

* Business-hours rule for messaging.

* Stop immediately on response or opt-out.

**6\. Data contract**

***Inputs***

* Ranked waitlist, sequence design, channels.

***Outputs***

* Running sequence; logged touches; rep handoffs.

**7\. Quality bar and metric**

* Runs in rank order.

* Timing respected.

* Stops on response and hands off.

**Metric:** Waitlist response rate; conversion during the exclusive window.

**8\. Failure modes and escalation**

* Low response on tier one: cascade to the next tier sooner.

* Lead replies mid-sequence: halt automation, route to a rep.

**9\. Example**

Top-tier waitlist leads get a personal priority invite on day one, a reminder on day two if silent, and a last-call before public open, with anyone who replies handed straight to a rep.

## **MKT-FU-03   Nurture sequence (email, WhatsApp, SMS)**

category: Marketing  |  subcategory: Follow-up and nurture  
maturity: ideal  |  autonomy: Pattern 1 run, gated activation  
tools: run\_sequence, log\_activity  
resources: lead\_score, segment, content\_library  
entities: OutreachSequence, Lead, Activity  
upstream: MKT-FU-01, MKT-LG-06  |  downstream: SAL-LH-\*, MKT-FU-04  
metric: nurture-to-engaged rate; nurture-to-viewing rate

**1\. Outcome**

Keep leads who are not yet ready warm with segmented, multi-channel nurture, so interest matures into a viewing instead of going cold.

**2\. Definition of done**

* Leads enrolled in a nurture track by segment and score.

* Sequenced value-led touches across email, WhatsApp and SMS.

* Sequence adapts to engagement and stops on conversion or opt-out.

**3\. Trigger and preconditions**

**Trigger:** A lead is qualified but not sales-ready, or a rep enrols them.

**Preconditions:** Segments and content ready; channels live; consent in place.

**4\. Procedure**

1. \[D\] System | enrol the lead in the right track by segment and score | autonomous.

2. \[D\] Agent | deliver value-led touches in sequence, channel by preference | (run\_sequence) | autonomous.

3. \[D\] System | branch on engagement, escalate hot leads to a rep | autonomous.

4. \[D\] System | stop on conversion or opt-out, log every touch | (log\_activity) | autonomous.

**5\. Judgment and guardrails**

* Nurture is value, not nagging. Each touch should give the buyer a reason (new release, progress, finish options), not just ask again.

* Segment properly. An investor and an end-user need different nurture, one sequence for all underperforms.

* Escalate on heat. Rising engagement means hand to a human, do not keep a warming lead in automation.

***Hard limits***

* Consent and opt-out respected on every channel.

* Business-hours rule for messaging.

* Stop on conversion.

**6\. Data contract**

***Inputs***

* Segment, score, content library, consent.

***Outputs***

* Running nurture; engagement branching; rep escalations.

**7\. Quality bar and metric**

* Segmented enrolment.

* Value-led, multi-channel.

* Escalates hot leads and stops on conversion.

**Metric:** Nurture-to-engaged rate; nurture-to-viewing rate.

**8\. Failure modes and escalation**

* Disengagement: slow cadence or move to re-engagement (FU-04).

* Hot lead stuck in nurture: tighten the escalation trigger.

**9\. Example**

A budget-fit but undecided lead gets a finish-options email, a construction-progress update, then a WhatsApp invite to a viewing, and is handed to a rep when they click through twice.

## **MKT-FU-04   Stale and cold lead re-engagement**

category: Marketing  |  subcategory: Follow-up and nurture  
maturity: ideal  |  autonomy: Pattern 2 (assist), manager-gated  
tools: prepare\_reengagement, run\_sequence  
resources: lead\_history, availability, segment  
entities: OutreachSequence, Lead, Activity  
upstream: MKT-FU-03  |  downstream: SAL-LH-\*  
metric: reactivation rate; cost per reactivated lead

**1\. Outcome**

Win back leads who went quiet using a fresh reason to re-engage, recovering pipeline value already paid for, under manager oversight to protect the brand.

**2\. Definition of done**

* Stale and cold leads identified by inactivity thresholds.

* A re-engagement angle prepared (new release, price update, last units).

* Campaign runs only after manager approval; non-responders retired cleanly.

**3\. Trigger and preconditions**

**Trigger:** Inactivity threshold reached, or a relevant new event (release, price change).

**Preconditions:** Lead history available; a genuine re-engagement reason exists.

**4\. Procedure**

1. \[D\] Agent | identify stale and cold leads by inactivity | autonomous.

2. \[J\] Agent | prepare a re-engagement angle tied to a real event | (prepare\_reengagement) | proposes.

3. \[J\] Manager | approve the campaign | gate.

4. \[D\] System | run the sequence, retire persistent non-responders, log outcomes | (run\_sequence) | autonomous after approval.

**5\. Judgment and guardrails**

* Re-engagement needs a real reason. A new release or remaining-units message works, a 'just checking in' does not.

* Manager-gated on purpose. Mass-messaging dormant leads carries brand risk, a human signs it off.

* Retire cleanly. A lead who ignores re-engagement should exit the active pipeline, not be messaged forever.

***Hard limits***

* Manager approval required before a re-engagement campaign runs.

* Consent and opt-out respected.

* No re-engagement without a genuine hook.

**6\. Data contract**

***Inputs***

* Lead history, inactivity thresholds, new events.

***Outputs***

* Approved re-engagement sequence; reactivations; retirements.

**7\. Quality bar and metric**

* Targets identified by inactivity.

* Angle tied to a real event.

* Manager-approved; non-responders retired.

**Metric:** Reactivation rate; cost per reactivated lead versus a fresh lead.

**8\. Failure modes and escalation**

* No genuine hook: do not run, wait for a real event.

* High opt-out: the angle is weak or the audience wrong, stop and reassess.

**9\. Example**

When three penthouses remain, the manager approves a re-engagement message to dormant high-budget leads, and a handful re-enter the pipeline for viewings.

## **MKT-FU-05   Confirmation and acknowledgment automations**

category: Marketing  |  subcategory: Follow-up and nurture  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: send\_transactional, log\_activity  
resources: email\_integration, messaging\_integration  
entities: Lead, Activity  
upstream: MKT-LG-01, MKT-LG-10, SAL-PP-\*  |  downstream: MKT-FU-01  
metric: confirmation delivery rate; bounce rate

**1\. Outcome**

Send immediate, reliable confirmations for every buyer action (waitlist signup, brochure request, viewing booking) so people know they were heard and the brand feels responsive.

**2\. Definition of done**

* Each qualifying action triggers an immediate, on-brand confirmation on the right channel.

* Confirmations set expectations for what happens next.

* Delivery logged; failures retried.

**3\. Trigger and preconditions**

**Trigger:** Any qualifying buyer action.

**Preconditions:** Email and messaging integrations live; templates ready.

**4\. Procedure**

1. \[D\] System | detect the action and select the confirmation and channel | autonomous.

2. \[D\] Agent | send the on-brand confirmation with clear next steps | (send\_transactional) | autonomous.

3. \[D\] System | log delivery, retry on failure | (log\_activity) | autonomous.

**5\. Judgment and guardrails**

* Confirmations are transactional and should be instant on any channel, they are expected, so business-hours holds do not apply.

* Set expectations. A good confirmation says what happens next and when, reducing follow-up anxiety.

* Keep them clean and on-brand, this is often the buyer's first message from the developer.

***Hard limits***

* Never send a confirmation for an action that did not happen.

* Honour suppression for marketing content, transactional confirmations follow their own rules.

**6\. Data contract**

***Inputs***

* Action event, templates, channels.

***Outputs***

* Delivered confirmations; delivery logs.

**7\. Quality bar and metric**

* Every qualifying action confirmed immediately.

* Next steps stated.

* Delivery logged and retried on failure.

**Metric:** Confirmation delivery rate; bounce rate.

**8\. Failure modes and escalation**

* Delivery bounces: retry, flag a bad contact for cleanup.

* Duplicate triggers: dedupe so a buyer gets one confirmation, not three.

**9\. Example**

A viewing booking instantly sends an email and WhatsApp confirmation with the date, address and what to bring, both logged on the Lead.

## **MKT-FU-06   Developer email list blast**

category: Marketing  |  subcategory: Follow-up and nurture  
maturity: ideal  |  autonomy: Pattern 2 (assist), gated send  
tools: compose\_blast, send\_blast  
resources: developer\_list, email\_template, segment  
entities: Lead, Contact, Activity, Campaign (email)  
upstream: OPS-ON-\*  |  downstream: MKT-FU-01  
metric: open and click rate; blast-sourced leads

**1\. Outcome**

Send a launch or update email to the developer's existing list so warm owned audience is activated, with capture wired so responders enter the pipeline properly.

**2\. Definition of done**

* The developer's list imported with consent confirmed.

* An on-brand blast composed and segmented.

* Sent after approval; responses captured as attributed leads.

**3\. Trigger and preconditions**

**Trigger:** Launch, or a milestone worth announcing to the owned list.

**Preconditions:** Developer list available with consent; email template ready.

**4\. Procedure**

1. \[D\] Agent | import and segment the developer list, confirm consent | autonomous.

2. \[J\] Agent | compose the on-brand blast | (compose\_blast) | proposes.

3. \[J\] Developer | approve recipients and content | gate.

4. \[D\] System | send, capture responses as attributed leads, route to speed-to-contact | (send\_blast) | autonomous after approval.

**5\. Judgment and guardrails**

* The owned list is warm and cheap, treat it as a priority channel at launch, not an afterthought.

* Confirm consent before sending. A developer's old list may not be cleanly opted in, blasting it risks deliverability and compliance.

* Wire capture. A blast that drives replies into an inbox no one tracks wastes the response, route them into the pipeline.

***Hard limits***

* Sending requires developer approval of recipients and content.

* Consent and opt-out enforced.

* No sending to an unconsented list.

**6\. Data contract**

***Inputs***

* Developer list, consent status, template, segments.

***Outputs***

* Sent blast; attributed responder Leads; follow-up triggers.

**7\. Quality bar and metric**

* Consent confirmed.

* On-brand and segmented.

* Approved before send; responses captured.

**Metric:** Open and click rate; leads sourced from the blast.

**8\. Failure modes and escalation**

* Consent unclear: hold, run a re-permission step, do not blast.

* High bounce: clean the list before the next send.

**9\. Example**

At launch the developer's 2,000-contact list gets a segmented announcement, and every reply and click becomes an attributed lead routed straight into speed-to-contact.

# **Reporting and optimisation**

## **MKT-RP-01   Cost ratio benchmark report**

category: Marketing  |  subcategory: Reporting and optimisation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: generate\_cost\_ratio\_report  
resources: spend\_data, revenue\_data, campaign\_brief, attribution  
entities: Report, Campaign, Opportunity  
upstream: MKT-AD-12, MKT-LG-07  |  downstream: MKT-AD-10, developer decisions  
metric: cost ratio versus the developer's agency benchmark

**1\. Outcome**

Report the headline metric: total marketing plus internal sales cost as a percentage of revenue closed, against the developer's configurable agency-commission benchmark. This is the number that proves Bricly's value.

**2\. Definition of done**

* Total marketing and internal sales cost computed for the period.

* Expressed as a percentage of revenue closed, attributed by source.

* Compared to the agency benchmark (typically 5 to 10 percent of GDV), with the saving shown.

**3\. Trigger and preconditions**

**Trigger:** Reporting cadence, or on demand.

**Preconditions:** Spend and revenue data flowing; attribution complete; benchmark set in the brief.

**4\. Procedure**

1. \[D\] Agent | aggregate all marketing and internal sales cost for the period | (generate\_cost\_ratio\_report) | autonomous.

2. \[D\] Agent | compute cost as a percentage of attributed revenue closed | autonomous.

3. \[D\] Agent | compare to the agency benchmark and quantify the saving | autonomous.

4. \[D\] System | present the report with channel-level breakdown | autonomous.

**5\. Judgment and guardrails**

* This is the metric that anchors every demo and every renewal. It must be exact and defensible, a soft number here undermines the whole pitch.

* Include internal sales cost, not just ad spend. The honest comparison to an agency commission is total cost to close, not media alone.

* Break down by channel so the developer sees where the ratio is won and lost, feeding the optimisation cycle.

***Hard limits***

* Never overstate the saving, the benchmark is the developer's real agency rate, not a flattering default.

* Attribution must be complete before the ratio is trusted.

**6\. Data contract**

***Inputs***

* Spend, internal sales cost, attributed revenue, benchmark.

***Outputs***

* Cost ratio report with benchmark comparison and channel breakdown.

**7\. Quality bar and metric**

* Total cost as a percentage of revenue closed.

* Benchmarked against the developer's agency rate.

* Channel breakdown included.

**Metric:** The cost ratio itself, tracked against the benchmark over time.

**8\. Failure modes and escalation**

* Incomplete attribution: flag the gap, do not publish a misleading ratio.

* Revenue lag: report on closed revenue, note pipeline separately.

**9\. Example**

For the quarter, total marketing and internal sales cost is 3.1 percent of revenue closed against a 6 percent agency benchmark, a saving the report quantifies in euros and by channel.

## **MKT-RP-02   Campaign performance report**

category: Marketing  |  subcategory: Reporting and optimisation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: generate\_performance\_report  
resources: performance\_data, lead\_quality, attribution  
entities: Report, Campaign  
upstream: MKT-AD-04, MKT-AD-12  |  downstream: MKT-AD-10  
metric: report-to-action rate; decision latency

**1\. Outcome**

Give the developer a clear, periodic read on campaign performance tied to qualified leads and cost, so decisions are made on outcomes, not vanity metrics.

**2\. Definition of done**

* Performance reported per channel and campaign: spend, leads, qualified leads, cost per qualified lead, conversion.

* Tied to lead quality, not just volume.

* Trends and recommendations surfaced.

**3\. Trigger and preconditions**

**Trigger:** Reporting cadence, or on demand.

**Preconditions:** Performance and lead-quality data flowing; attribution in place.

**4\. Procedure**

1. \[D\] Agent | aggregate performance per channel and campaign | (generate\_performance\_report) | autonomous.

2. \[D\] Agent | join to lead-quality and conversion data | autonomous.

3. \[D\] Agent | surface trends and link to optimisation recommendations | autonomous.

4. \[D\] System | present in plain language | autonomous.

**5\. Judgment and guardrails**

* Report outcomes, not vanity. Cost per qualified lead and conversion matter, impressions and clicks are context at most.

* Tie to lead quality. A cheap-lead channel that never closes should look bad in the report, not good.

* Make it decision-ready. A report that does not point to an action is overhead.

***Hard limits***

* No vanity metrics presented as success.

* Attribution complete before reporting performance.

**6\. Data contract**

***Inputs***

* Performance data, lead quality, conversion, attribution.

***Outputs***

* Channel and campaign performance report with recommendations.

**7\. Quality bar and metric**

* Tied to qualified leads and cost.

* Quality-aware.

* Points to actions.

**Metric:** Share of reports leading to a decision; decision latency.

**8\. Failure modes and escalation**

* Data gaps: flag them, do not paper over with vanity numbers.

* Report ignored: tighten to the few metrics that drive action.

**9\. Example**

The weekly report shows Meta delivering cheaper qualified leads than Google this period, with a recommendation to shift budget, ready for the developer's decision.

## **MKT-RP-03   Lead quality feedback loop**

category: Marketing  |  subcategory: Reporting and optimisation  
maturity: ideal  |  autonomy: Pattern 1 (autonomous)  
tools: sync\_lead\_outcomes  
resources: opportunity\_outcomes, lead\_score, attribution  
entities: Lead, Opportunity, Campaign, Report  
upstream: SAL-PP-\*  |  downstream: MKT-LG-06, MKT-AD-10  
metric: scoring accuracy improvement; channel quality ranking

**1\. Outcome**

Feed real sales outcomes back into scoring and targeting so the system learns which sources and signals actually produce buyers, closing the loop between marketing and sales.

**2\. Definition of done**

* Closed and lost outcomes joined back to source, score and campaign.

* Channel and audience quality ranked by real conversion, not lead volume.

* Scoring weights and targeting refined from the feedback.

**3\. Trigger and preconditions**

**Trigger:** Opportunities reach a terminal state (reserved, lost).

**Preconditions:** Outcomes captured in the CRM; attribution intact.

**4\. Procedure**

1. \[D\] System | join terminal outcomes to source, score and campaign | (sync\_lead\_outcomes) | autonomous.

2. \[D\] Agent | rank channels and audiences by actual conversion | autonomous.

3. \[D\] Agent | propose scoring and targeting refinements | autonomous.

4. \[D\] System | feed the loop into scoring and optimisation | autonomous.

**5\. Judgment and guardrails**

* Conversion is the truth, lead volume is the lie. A channel's worth is the buyers it produces, this loop is how the system learns that.

* Refine scoring against closed data continuously. A model that never learns from outcomes drifts from reality.

* This loop is what makes the cost ratio improve over time, it steers spend toward what actually closes.

***Hard limits***

* No discriminatory factors enter scoring through the loop.

* Refinements to routing rules are surfaced, not silently applied.

**6\. Data contract**

***Inputs***

* Terminal outcomes, source, score, campaign.

***Outputs***

* Channel quality ranking; scoring and targeting refinements.

**7\. Quality bar and metric**

* Outcomes joined to source and score.

* Channels ranked by real conversion.

* Scoring refined from closed data.

**Metric:** Improvement in scoring accuracy; channel quality ranking stability.

**8\. Failure modes and escalation**

* Thin outcome data early: wait for volume before retraining weights.

* A channel looks good on volume but bad on conversion: downweight it in targeting.

**9\. Example**

After a quarter, the loop shows the investor LinkedIn audience produced few but high-converting buyers, so its leads are scored up and budget follows.

## **MKT-RP-04   Budget alert handling**

category: Marketing  |  subcategory: Reporting and optimisation  
maturity: ideal  |  autonomy: Pattern 3 (alerts, never acts on spend)  
tools: monitor\_budget, raise\_alert  
resources: spend\_data, campaign\_brief  
entities: Campaign, Alert, AuditEvent  
upstream: MKT-AD-06, MKT-AD-10  |  downstream: developer decisions  
metric: alert lead time; overspend incidents (target zero)

**1\. Outcome**

Watch spend against the plan and alert the developer before budget problems happen, so pacing issues are caught early and the developer always controls the response.

**2\. Definition of done**

* Spend monitored against the brief's budget and pacing.

* Threshold breaches (overspend pace, underspend, anomalies) alert the developer with context.

* Recommended responses offered; the developer decides; alerts logged.

**3\. Trigger and preconditions**

**Trigger:** Spend crosses a pacing threshold or shows an anomaly.

**Preconditions:** Spend data live; budget and thresholds set in the brief.

**4\. Procedure**

1. \[D\] System | monitor spend against budget and pacing continuously | (monitor\_budget) | autonomous.

2. \[D\] Agent | on a breach, alert the developer with context and options | (raise\_alert) | flags, does not act.

3. \[J\] Developer | decide the response | gate.

4. \[D\] System | apply the approved response, log the alert and decision | autonomous after approval.

**5\. Judgment and guardrails**

* Alert early, with enough lead time to act before the overspend is locked in. A same-day alert on a blown budget is too late.

* The agent never adjusts spend on its own, it surfaces the problem and the options, the developer decides. Spend is always a gated action.

* Give context, not just a number. An alert should say what is happening, why, and the realistic options.

***Hard limits***

* Never adjust budget or pause spend autonomously.

* Every alert and decision is logged.

**6\. Data contract**

***Inputs***

* Spend data, budget, pacing thresholds.

***Outputs***

* Budget alerts with options; logged decisions.

**7\. Quality bar and metric**

* Breaches alerted with lead time and context.

* Options offered.

* Developer decides; all logged.

**Metric:** Alert lead time; overspend incidents, target zero.

**8\. Failure modes and escalation**

* Alert ignored and overspend looms: escalate the alert, still do not act unilaterally.

* False alarms: tune thresholds to reduce noise.

**9\. Example**

Three days into a flight, pacing projects a 20 percent overspend. The agent alerts the developer with the cause and three options, the developer picks a throttle, and the change and decision are logged.

