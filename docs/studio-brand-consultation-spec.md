# Studio Brand Consultation — Conversational Flow Spec

**Surface:** Bricly Studio · AI consultation chat (chat-as-wizard)
**Scope:** From consultation open through brand candidate selection → one Active BrandKit.
**Covers SOPs:** MKT-BR-01 (brand consultation), MKT-BR-03 (art direction), MKT-BR-02 (brand kit generation & selection), MKT-RN-01 (Phase 0 hero shots, surfaced in-flow), Brand Direction Moodboard Curation SOP (two-stage selection model).
**Out of scope:** MKT-BR-05 (corporate inheritance), MKT-RN-02+ (final render sets), publishing of any kind.

---

## 1. Purpose

The developer never fills a branding form and never faces a blank page. A single conversational session takes them from "we know your project" to a locked brand brief and a chosen brand identity, using the agency's real method: verbal identity first, then a broad→narrow visual funnel (choose the world, refine the taste), then art direction proven against real images of their building.

The chat **is** the moodboard. Every locked decision collapses into a receipt card in the stream, so scrolling up reads as the developer's own accumulated brand board and audit trail.

### SOP mapping

| Beat | Name | SOP source |
|---|---|---|
| B1 | Arrival + context replay | MKT-BR-01 preconditions |
| B2 | Story mining | MKT-BR-01 §4.1 |
| B3 | Naming | MKT-BR-01 §4.2, §5 (3 name categories, byline, building names) |
| B4 | Personas | MKT-BR-01 §4.3, §5 (inventory-anchored) |
| B5 | Tone of voice | MKT-BR-01 §4.4 |
| B6 | Stage 1 — choose the world | Curation SOP §2–4, MKT-BR-01 §4.5 |
| B7 | Stage 2 — refine the taste | Curation SOP §5 |
| B8 | Phase 0 renders + art direction | MKT-RN-01, MKT-BR-03 |
| B9 | Brand brief lock | MKT-BR-01 DoD, serialised BrandProfile |
| B10 | Generation + candidate selection | MKT-BR-02 |

---

## 2. The ten interaction laws

These are non-negotiable design laws. Every screen, card, and agent line must comply.

1. **Never ask what you already know.** Onboarding data is replayed for confirmation, never re-asked.
2. **Typing is always optional.** Every agent question ships with chip answers. Freeform input is available but never required.
3. **One decision per moment.** Broad→narrow. No decision is presented before its dependencies are locked.
4. **Every lock produces a receipt.** Locked decisions collapse into compact receipt cards in the stream — tappable to reopen. The stream is the moodboard and the audit trail.
5. **Soft escapes on taste, hard gates on structure.** "Neither, show me more" exists on taste questions (photography, lifestyle). Hard gates exist only on: name, direction, brief lock, candidate selection.
6. **The funnel never leaks.** Stage 2 poles both live inside the chosen direction. A Heritage developer can never reach Urban photography through a binary.
7. **Fallbacks shrink the question.** When the developer is stuck, degrade to a smaller, more concrete question — never to a blank input.
8. **The agent always says why.** Every proposal carries a one-line rationale tied to the developer's own words ("You said buyers here are mostly overseas — this direction reads internationally").
9. **Everything is editable until the brief locks (B9).** Post-lock edits reopen the brief with an explicit warning about downstream impact.
10. **Minimal persistent chrome.** A thin 10-node progress spine and an insight rail. Nothing else competes with the conversation.

---

## 3. UI direction

Deliberately **not** Bricly's product branding. This flow is a set piece — futurist, minimal, cinematic.

- **Canvas:** near-black `#0a0a0b`. High-contrast off-white type `#f2f0ea`. One accent colour — which **adapts to the chosen direction's palette after B6** (the UI itself takes on the brand: a core magic moment). Pre-B6 accent: a neutral electric `#c8c2ff` or similar.
- **Type:** one grotesk family (Space Grotesk or Inter, Google Fonts), large scale contrast (agent statements ~22–28px, receipts ~13px), generous air.
- **Chat ≠ bubbles.** Agent messages are typeset statements set directly on the canvas — no grey bubble chrome. The user acts mostly through cards, chips, and sliders; their typed messages (when they occur) render as smaller right-aligned lines.
- **Motion:** everything enters with intent. Cards assemble, text types, palettes wash. 200–400ms, ease-out curves, no gratuitous bounce. Respect `prefers-reduced-motion`.
- **Progress spine:** 10 hairline nodes down the right edge. Filled = locked, pulsing = current, hollow = ahead. Tapping a filled node scrolls to that receipt.
- **Insight rail:** a thin top strip where extracted insight chips (from B2) accumulate ("1920s salt-pan frontage", "overseas buyers", "beats The Quad on outdoor space"). The agent visibly *uses* these later (Law 8).

### Magic moment checklist

| Beat | Moment |
|---|---|
| B1 | Project dossier self-assembles line by line from onboarding data |
| B3 | Chosen name morphs live through three wordmark typefaces |
| B5 | Sample headline rewrites in real time as tone sliders move — using the locked project name |
| B6 | Direction boards assemble tile-by-tile; picking one triggers a full-screen colour wash and the whole UI re-skins to that palette |
| B7 | A brand spine at the screen edge grows a node with each this-or-that pick |
| B8 | Art-direction brief types itself line by line; striking a line rewrites just that line |
| B9 | All receipt cards fly together into one assembling Brand Brief artefact |
| B10 | Chosen candidate "activates" — applies itself across mockups in a full-screen takeover |

---

## 4. The flow — three acts, ten beats

### ACT I — WORDS (verbal identity, ~6 min)

---

#### B1 · Arrival + context replay

**Agent opening (sample):**
> "Before we design anything, let's make sure I've read your project right."

**Card — Project Dossier.** Assembles itself line by line (300ms stagger): project location, unit count and mix, tier, developer name, any uploaded files. Each fact is inline-editable (tap → edit in place).

**Actions:** `That's right →` (primary) · tap any fact to correct.

**Lock condition:** confirmation. Produces the first receipt card.

**Fallback:** missing facts render as glowing empty slots. The agent asks about them **one at a time**, chip-first ("Roughly how many units? `<12` `12–30` `30+`"). Never a form.

---

#### B2 · Story mining

Three questions **maximum**, asked one at a time, each with suggestion chips:

1. *"What's the story of this site — anything about the location, history, or surroundings worth building on?"* — chips: `Old town` `Seafront` `Former industrial` `New quarter` `Nothing notable`
2. *"Who do you picture buying here?"* — chips: `Local upgraders` `Overseas investors` `First-time buyers` `Downsizers` `Mixed`
3. *"Any nearby project you want this to beat?"* — chips: `Yes, let me name it` `No direct rival`

**Magic:** each answer is reflected back as an **insight chip** that flies to the insight rail. These chips are quoted verbatim in later rationales (Law 8).

**Fallback:** a persistent `Not sure` chip on every question. Choosing it makes the agent offer a researched hypothesis to confirm or deny:
> "Sliema Creek used to be the fishing harbour — most buyers there now are professionals returning from abroad. Sound right for your site?" `Yes` / `Not quite — it's more…`

Never leave the developer facing an empty input.

**Lock condition:** all three answered (or hypothesised + confirmed). Receipt: "Story · 3 insights".

---

#### B3 · Naming

**Agent (sample):**
> "Names first — everything else hangs off it. I've gone three ways: from the place, from the building, and from everything together."

**Card — Name Constellations.** Three labelled groups per MKT-BR-01 §5, three names each, every name with a one-line rationale:

- **From the place** — area, location, history, surroundings research
- **From the building** — the type and character of the project
- **From the whole picture** — all project details combined

**Magic:** tapping a name renders it instantly as a live wordmark specimen that morphs through three typefaces (serif → grotesk → display) so the developer *feels* the name, not just reads it.

**Secondary decisions, after name pick:**
- Toggle: **"By {Developer Name}"** under the logo — on/off with live preview on the wordmark specimen.
- **Multi-block only:** building names proposed as a coherent family derived from the locked project name ("Block A → *The Salt House*, Block B → *The Net Loft*"). Approve as a set or rename individually.

**Lock condition:** hard gate. Name approved (nominal lock per SOP).

**Fallbacks:**
- **Rejects all nine:** agent asks exactly two constraint questions — *"What should it sound like?"* (chips: `Shorter` `More local` `More international` `More literal` `More abstract`) and *"Anything to avoid?"* (free chip entry) — then regenerates **one** new set of nine. Never force a choice; if the second set also fails, capture constraints on the brief and flag for human naming support.
- **Developer types their own name:** agent validates lightly (meaning check, pronunciation, "reads well next to 'By {Developer}'") and proceeds. It never argues with a name the developer owns.

---

#### B4 · Personas

**Agent (sample):**
> "Based on your mix — six two-beds, three penthouses — and what you told me about buyers, here's who we're really selling to."

**Card set — 2–4 Persona Cards.** Each card is concrete per SOP §5: buyer type, budget band, motivation — **and pinned to actual inventory**: "→ targets your 6 two-beds, €380–420k". No demographic clichés.

**Interactions:** cards are directly editable — tap the budget band to slide it, tap motivation to swap from alternatives, dismiss a persona, or `+ add one more` (agent proposes, never a blank form).

**Hard rule:** a persona with no matching units is flagged by the agent itself: "This persona has nothing to buy — drop it or adjust the band?"

**Lock condition:** developer confirms the set. Receipt: "Personas · 2" with mini avatars.

**Fallback (thin market input):** the agent asks **one targeted question per gap** ("I don't know enough about penthouse buyers here — are they end-users or investors?") rather than inventing. Per SOP §8.

---

#### B5 · Tone of voice

**Card — Tone Spectrum.** Three sliders, pre-positioned by the agent from everything so far (with its one-line why):

- warm ↔ restrained
- confident ↔ understated
- local ↔ international

**Magic:** live sample copy — one headline and one body line — rewrites in real time as sliders move. The headline uses the **actual locked project name**: moving the "warm" slider changes *"The Salt House. Life at the water's edge."* into *"The Salt House. Precision living, Sliema Creek."*

**Actions:** `This is our voice →` locks tone onto the BrandKit. Receipt shows final slider positions + the approved headline.

**Act I complete.** The spine shows 5 filled nodes. Agent marks the transition:
> "That's the words locked. Now let's find what this looks like."

---

### ACT II — WORLDS (visual identity, ~5 min)

---

#### B6 · Stage 1 — choose the world

**Interstitial (2s):** *"I've read everything you told me. Building your directions…"* — shimmer, then boards assemble tile-by-tile.

**Selection logic (agent-side, per Curation SOP §4):** filter the six master directions (Heritage/Timeless, Modern Minimal, Warm Organic, Coastal/Resort, Urban/Metropolitan, Bold/Statement) down to **three**, in this order: project type rules directions in/out → tier tunes execution → location pulls palette → vibe tiebreaks. **Never show all six.**

**Card — Direction Boards.** Three full-bleed immersive boards, one viewport each, swipe/arrow between them. Each board follows the fixed anatomy (Curation SOP §6): name + keywords, palette strip **with hex values**, type specimen (display + body), photography treatment, material close-ups, render treatment, logo feel, hero image, positioning line — plus the agent's one-line **"why this fits your project"** quoting the developer's own insight chips (Law 8).

**Wildcard:** a quiet `Show me something unexpected` button reveals a fourth board from the remaining three directions — for stretching the developer's thinking, never shown by default.

**Action:** `This is the world →` on exactly one board.

**Magic (the pivotal one):** picking a board triggers a full-screen colour wash in that direction's palette — and **the entire UI re-skins**: accent colour, receipt cards, spine, chips all adopt the chosen world. From this moment the product feels like *their* brand.

**Lock condition:** hard gate. Direction locked. Receipt: mini board thumbnail + direction slug.

**Fallback (none fit):** agent asks what's off via chips (`Too cold` `Too busy` `Too traditional` `Too safe`) and swaps the weakest board for the nearest-neighbour direction from the unshown three. One swap round; if still nothing, capture the feedback and flag for curation review — never brute-force a pick.

---

#### B7 · Stage 2 — refine the taste

**Agent (sample):**
> "We're inside {direction} now. Four quick feels — for each, just tell me which is closer. There's no wrong answer, and you're not picking your logo yet."

**Card — This-or-That pairs.** Four pairs, one at a time, split-screen. Hover/tap a side to preview it enlarged. Each pair turns on **one variable only**, and — hard requirement, Law 6 — **both poles are styled inside the locked direction**:

| Axis | Pole A | Pole B | Soft escape |
|---|---|---|---|
| Logo & mark | Wordmark-led | Symbol-led | — |
| Photography | People-led | Architecture-led | ✓ "Neither — show me two more" |
| Lifestyle | Quiet & aspirational | Social & energetic | ✓ "Neither — show me two more" |
| Render | Warm & lifestyle | Cool & editorial | — |

Framing is always *"which feels closer"*, never *"pick your X"* (Curation SOP §5).

**Magic:** after each pick, a mini **brand-profile spine** at the screen edge grows a labelled node — the developer watches their taste profile physically build.

**Lock condition:** four poles chosen (or inferred, below). Receipt: 4-node axis summary.

**Fallback (double escape):** two consecutive soft escapes on one axis → the agent switches to freeform inference: *"Describe the photo you'd want on the brochure cover."* It infers the pole from the answer, states its inference ("That's people-led — presence and life. Locking that in."), and lets the developer overrule with one tap.

---

### ACT III — PROOF (~5 min, + async in MVP)

---

#### B8 · Phase 0 renders + art direction

**Card — Render Reveal.** 2–3 neutral, constraint-strict hero shots of **their building** (MKT-RN-01: no brand applied, honest massing and materials) slow-reveal as a gallery:
> "This is your building, before any brand. Tell me what resonates."

**Interactions:** reaction chips on each image (`the light` `the angle` `the mood` `the materials`) plus freeform. Multiple reactions welcome.

**Fallback (can't articulate):** forced this-or-that on two contrasting crops of the same shot (per MKT-BR-03 §8) — warm late light vs cool morning; tight detail vs wide context. Infer the direction from picks.

**Then — the Art Direction Brief.** The agent composes it **live, line by line**, as a typed-out card (MKT-BR-03 §5: specific beats poetic):

- Mood — e.g. "warm minimalism, unhurried"
- Light — "late-afternoon, low contrast"
- Palette intent — tied to the locked direction's hex values
- Materials — "natural stone, oak, linen"
- Composition — tied to the personas ("investor pack frames the building; lifestyle pack frames the life")
- **Avoid** — explicit exclusions, as prominent as the pursuits ("no cool blue tones, no busy staging")

**Interaction:** strike any line → the agent rewrites **just that line** and re-types it. Approve attaches the brief to the BrandKit.

**MVP note — resumable session:** in v1 the renders are concierge-made and async. If renders aren't ready when B7 completes, the session concludes Act II with:
> "Your hero shots are being prepared — I'll bring you back the moment they land."
A task is created for the render team (MKT-RN-01 MVP procedure). On return, the chat restores fully — receipt rail, insight chips, spine state — and resumes at B8. The spec treats B1–B7 as *session one* and B8–B10 as *session two* when async; a single sitting when renders pre-exist.

---

#### B9 · Brand brief receipt + lock

**The magic moment of the flow.** Every receipt card in the stream animates out of its position and flies into a single assembling **Brand Brief** artefact:

name · byline · building names · personas · tone · direction · four axis picks · art direction

Rendered as one elegant serialised object — with a subtle **"view as JSON"** flip for the data-minded (this is literally the BrandProfile object, §6).

**Gate copy (consequence explicit):**
> "This brief becomes the DNA of every asset — renders, website, brochure, ads. Lock it?"
> `Lock the brief →` · `Something's off`

**Fallback / edit path:** tapping any element in the brief jumps back to that beat's card, reopens it for editing, then returns to the brief with the edited node pulsing on the spine. (Law 9: after lock, the same path works but shows a downstream-impact warning.)

---

#### B10 · Generation handoff + candidate selection (MKT-BR-02)

**Handoff:** locking triggers a full-screen generative sequence — four blurred identity silhouettes forming from particles of the chosen palette.
*MVP reality:* a concierge task with the full BrandProfile is created for the design team; the developer sees the same UI and is notified when candidates land (may be hours/days — the resumable-session mechanics from B8 apply). *Prototype:* time-compressed to ~6s.

**Card set — Four Candidates.** Per MKT-BR-02 §5, the four differ in **direction, not just colour** (e.g. within Coastal: airy-editorial, heritage-maritime, crisp-modern, soft-resort). Each card: logo suite, palette, type pairing, and **one applied mockup** (site hoarding or brochure cover) so the developer judges the brand in the world, not in a vacuum.

**Interactions:**
- **Compare mode:** select any two candidates → side-by-side, synchronized mockup views.
- `This one →` on a candidate.

**Magic — activation:** the pick triggers a full-screen takeover where the chosen brand applies itself sequentially across mockups — hoarding, brochure, sign, favicon — ending on:
> "{Name} is live. Everything Studio makes from here is on-brand."
BrandKit set to Active (the only one — MKT-BR-02 hard limit: developer selection required, no auto-promotion).

**Fallbacks:**
- **Likes none:** structured feedback — *"Which is closest?"* + what's-off chips (`Logo` `Colours` `Type` `Overall feel`) + freeform. **One** regeneration round with feedback applied. If that fails too, escalate to a human designer **with the feedback attached** — the agent says so honestly: "I'm handing this to our design team with everything you've told me."
- **Wants to mix two:** explicit `Merge these two` action produces a labelled **fifth candidate** ("Candidate E — A's mark, B's palette"). Never silently blend (MKT-BR-02 §8).

---

## 5. Card component inventory

Twelve components. Every card has three states: **active** (in play), **receipt** (locked, collapsed, tappable to reopen), **editing** (reopened).

| # | Component | Used in | Key interactions |
|---|---|---|---|
| 1 | Project Dossier | B1 | line-by-line assembly, inline fact edit, empty-slot glow |
| 2 | Question + Chips | B2, fallbacks | chip select, freeform, `Not sure` hypothesis path |
| 3 | Insight Chip (rail) | B2→ | flies to rail, quoted in later rationales |
| 4 | Name Constellation | B3 | 3 groups × 3 names, tap → live wordmark morph, byline toggle |
| 5 | Persona Card | B4 | slide budget band, swap motivation, dismiss/add, inventory pin |
| 6 | Tone Spectrum | B5 | 3 sliders, live copy rewrite with locked name |
| 7 | Direction Board | B6 | full-bleed, swipe/arrow, fixed anatomy slots, why-line, pick → colour wash + UI re-skin |
| 8 | This-or-That Pair | B7, B8 fallback | split-screen, hover enlarge, soft escape, spine node growth |
| 9 | Render Gallery | B8 | slow reveal, per-image reaction chips |
| 10 | Art Direction Brief | B8 | line-by-line typing, strike-a-line rewrite, avoid list |
| 11 | Brand Brief artefact | B9 | receipts fly in, JSON flip, element-tap edit jump, lock gate |
| 12 | Candidate Card | B10 | applied mockup, compare any two, pick → activation takeover, merge action |

Persistent chrome: **progress spine** (10 nodes, right edge) and **insight rail** (top).

---

## 6. BrandProfile JSON contract

The serialised output of the consultation. Direction slugs, axes, and poles map **one-to-one** onto the curation SOP §9 file-naming convention, so the moodboard library feeds the chat and the chat's output feeds generation without translation.

```json
{
  "project_id": "prj_0192",
  "name": "The Salt House",
  "byline": true,
  "building_names": ["The Salt House", "The Net Loft"],
  "personas": [
    {
      "label": "Overseas investor",
      "budget_band_eur": [250000, 400000],
      "buyer_type": "investor",
      "motivation": "yield + holiday use",
      "inventory_match": ["2-bed x6"]
    },
    {
      "label": "Local upgrader",
      "budget_band_eur": [400000, 600000],
      "buyer_type": "end_user",
      "motivation": "seafront lifestyle upgrade",
      "inventory_match": ["3-bed x3", "penthouse x1"]
    }
  ],
  "tone_of_voice": {
    "warm_restrained": 0.3,
    "confident_understated": 0.6,
    "local_international": 0.7,
    "approved_headline": "The Salt House. Life at the water's edge."
  },
  "direction": "coastal",
  "axes": {
    "logo": "wordmark",
    "photography": "architecture",
    "lifestyle": "quiet",
    "render": "warm"
  },
  "art_direction": {
    "mood": "warm minimalism, unhurried",
    "light": "late-afternoon, low contrast",
    "palette_intent": ["#F5F1E8", "#2E5266", "#C9B99B"],
    "materials": ["limestone", "pale oak", "linen"],
    "composition": "calm uncluttered framing; investor shots favour the building, lifestyle shots favour the terrace",
    "avoid": ["cool blue tones", "busy staging", "aerial-only hero shots"]
  },
  "moodboard_refs": {
    "stage1_board": "coastal/stage1",
    "stage2_picks": [
      "coastal_stage2_logo_wordmark_01.jpg",
      "coastal_stage2_photo_architecture_01.jpg",
      "coastal_stage2_lifestyle_quiet_01.jpg",
      "coastal_stage2_render_warm_01.jpg"
    ]
  },
  "insights": [
    "former fishing harbour frontage",
    "buyers: overseas professionals returning",
    "rival: The Quad — beat it on outdoor space"
  ],
  "locked_at": null,
  "session": { "resumable": true, "completed_beats": ["B1","B2","B3","B4","B5","B6","B7"] }
}
```

**Downstream consumption — state this explicitly so axis picks are never decorative:**
- `direction` + `axes` + `art_direction` compose the prompt scaffold in **MKT-RN-04** (render prompt engineering) — e.g. `photography: architecture` becomes a hard framing constraint, `render: warm` sets the light treatment, `avoid[]` becomes prompt negatives.
- The full object is the input contract for **MKT-BR-02** candidate generation (or the concierge design-team task in MVP).
- `moodboard_refs` resolve against the curated library folders (`/brand-directions/[direction]/…`).

---

## 7. MVP (concierge) vs Final (automated) deltas

| Beat | MVP (v1, concierge-fulfilled) | Final product |
|---|---|---|
| B1–B7 | Fully agent-driven, identical UX | Same |
| B8 renders | Human-made per MKT-RN-01 MVP procedure; agent creates the render task with full context; **session pauses** after B7 and resumes on delivery | Generated + vision-verified in-flow, minutes not days |
| B8 art direction | Same conversational UX either way | Same |
| B10 generation | Concierge design task carries the BrandProfile; developer notified on candidate delivery; generative UI is honest theatre over an async process | `generate_brand_candidates` runs live |
| B10 regen round | Feedback goes to the design team | Feedback re-prompts generation, then escalates |
| Quality gate | Human designer is the vision-verify | `vision_verify` + human escalation path |

**Resumable session requirements (both pauses):** full state restore — stream, receipts, insight rail, spine, adapted UI palette. Re-entry message summarises where things stand in one line. The BrandProfile `session.completed_beats` field drives restoration.

---

## 8. Failure-mode matrix

Every SOP §8 item, mapped to its conversational handling:

| Failure (SOP) | Beat | Handling |
|---|---|---|
| Developer rejects all name options (BR-01) | B3 | 2 constraint questions → one regen set → capture constraints + human naming flag. Never force. |
| Thin market input (BR-01) | B2/B4 | One targeted question per gap; hypothesis-confirm pattern; never invent personas. |
| Persona without inventory (BR-01 §5) | B4 | Agent self-flags: "nothing to buy — drop or adjust?" |
| No direction fits (curation SOP) | B6 | What's-off chips → one nearest-neighbour swap → capture + curation review flag. |
| Neither pole lands (curation SOP §5) | B7 | Soft escape (two more) → on double escape, freeform describe-and-infer with stated inference + one-tap overrule. |
| Developer can't articulate render preference (BR-03) | B8 | Forced this-or-that on contrasting crops; infer and state the direction. |
| Renders not ready / all fail verification (RN-01) | B8 | Session pauses with honest status; internal escalation; never show unverified renders as reference. |
| Developer likes no candidate (BR-02) | B10 | Closest + what's-off feedback → one regen round → human designer escalation with feedback attached. |
| Developer wants to mix two candidates (BR-02) | B10 | Explicit labelled fifth merged candidate. Never silently blend. |
| Post-lock edit request | B9+ | Brief reopens with downstream-impact warning; changed nodes pulse; downstream assets flagged stale. |

---

## 9. Placeholder library plan (unblocks the prototype)

The curated 6-direction, ~110-image library (Curation SOP §7) does not exist yet. The prototype must not wait for it:

- Each of the six directions is defined **in data** with its real palette hex values, type pairing, and keywords from Curation SOP §3.
- Board imagery is **composed, not sourced**: CSS gradients, SVG material textures, and typographic specimens built from the direction's own palette + Google Fonts. Boards still follow the full anatomy slot structure, so Max's curated photography drops into the same slots later with zero structural change.
- Stage 2 pair "images" are styled compositions per pole (e.g. photography-people = silhouette figures in the direction palette; photography-architecture = geometric facade forms in the same palette) — enough to make the binary *feel* real.
- Phase 0 renders are stylised SVG/gradient building illustrations of the demo project (neutral, unbranded, per RN-01 rules).

When the real library ships, swap the composed visuals for `moodboard_refs` file paths — the naming convention (§6) already matches.

---

## 10. Prototype build notes

**File:** `Brickly/prototypes/Bricly_Brand_Consultation_Prototype.html` — single self-contained file. Inline CSS/JS. Google Fonts allowed. No build step, no external JS dependencies. Must run from `file://` with zero console errors.

**Demo seed:** 24-unit seafront block in Sliema, Malta (matches MKT-BR-01 §9 example): 6×2-bed, 3×3-bed, 1 penthouse (plus remaining mix), mid-to-upper tier, developer "Falzon Group". B1 dossier prefilled from this.

**Direction filtering for the demo:** seafront + Malta + mid-upper tier → present **Coastal/Resort, Warm Organic, Modern Minimal**; wildcard = Bold/Statement; Heritage and Urban excluded by project type/location.

**Must implement:**
1. All ten beats, end-to-end, with a simulated agent: scripted branching, realistic typing/appearance delays (never dump a wall of content at once).
2. **All fallback paths reachable** — reject-all names, `Not sure` hypothesis, none-fit direction swap, double soft-escape inference, can't-articulate render crops, likes-no-candidates regen, merge-two fifth candidate.
3. Every magic moment in §3's checklist.
4. Receipt-card collapse + reopen-to-edit for every lock; progress spine; insight rail.
5. UI re-skin on B6 pick (CSS custom properties swapped to the chosen direction's palette).
6. The B9 brief with working "view as JSON" flip rendering the live BrandProfile object.
7. B10 compare mode (any two side-by-side) and activation takeover.
8. Time-compressed async moments (interstitials ~2s, generation ~6s) — no real network calls.
9. `prefers-reduced-motion` fallbacks (fade instead of fly/assemble).

**Out of scope for the prototype:** real AI, persistence beyond the session (in-memory state fine; `sessionStorage` optional for resume demo), mobile layout (desktop-first, ≥1200px).
