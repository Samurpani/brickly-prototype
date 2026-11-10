# Buyer proposals: plan, building blocks and lo-fi wireframes

**Status:** Plan, for review before visual design · **Scope:** the buyer-facing page behind every link a rep sends (custom pack, Present Mode follow-up, "Send unit details", collateral to an opportunity or buyer) · **Supersedes:** [dev-briefs/03-buyer-microsite.md](dev-briefs/03-buyer-microsite.md) for v3

## 0. Decisions (10 Nov 2026) and the built example

| Decision | Effect on this plan |
| --- | --- |
| Templates are reusable visual styles. An account picks its style in **Settings on the developer's page** | No per-proposal auto-selection. All templates render the same sections; only the layout and styling change. Developers swap brand tokens and logo only |
| Market-specific content is out of scope for now | B12 Cost of owning and B13 Moving here are parked. Legal text is a single editable footer |
| No rep video | B01 is a written letter only |
| Reserve sits on each home | Every home section ends with price, availability and **Reserve this home**. It sends a request; it does not reserve automatically |
| A proposal is always **one developer**, but can cover **several developments**, each with its own branding | The proposal shell (intro, letter, brief, comparison, trust, next step) uses the developer brand. Each development is a chapter in its own brand. This is part of every template, not a separate template |

**Built example (template 1, Signature):** [prototypes/v3/proposal/index.html](../prototypes/v3/proposal/index.html). The proposal is for Mike Gatt, from Seashore Developments, with two developments (Dolphin Court and Onyx Rise) and three homes. Use the **Prototype** button to switch buyer type, how the buyer reached us, the reservation state and the template. You can also turn motion off and replay the intro. It also shows the engagement events Sam would see. Test: [tests/proposal.spec.cjs](../tests/proposal.spec.cjs). **Where each section gets its data:** [buyer-proposal-data-sources.md](buyer-proposal-data-sources.md).

| File | Role |
| --- | --- |
| [proposal-data.js](../prototypes/v3/proposal/proposal-data.js) | The content model for one published issue. Every template reads this object |
| [proposal.js](../prototypes/v3/proposal/proposal.js) | The section library (`SECTIONS`, `CHAPTER`) and the template registry (`TEMPLATES`). A template is a section order, a chapter order and a CSS class |
| [proposal-base.css](../prototypes/v3/proposal/proposal-base.css) | Shared by all templates: brand variables, type, motion system, intro, top bar, mobile dock, reserve sheet, reduced motion |
| [t-signature.css](../prototypes/v3/proposal/t-signature.css) | Signature layout only. New templates add a `t-<name>.css` file and one `TEMPLATES` entry |

**Canonical structure (Signature, revision 3):** the page stays short. Development and home details open in a side panel.

1. **Intro (loading screen):** one solid colour (the developer's dark brand colour). Only the text animates in: the logo in spaced capitals, a short rule, "This proposal is for", the buyer's first name in italic serif rising into view, then "Prepared by Sam". It fades into the proposal after about 2 seconds.
2. **Cover, an editorial split:**
   - Left: one cover image, set per developer account (`developer.cover`).
   - Right: a paper page on a hairline grid with small monospaced labels:
     - a top row with the logo, the proposal number and the date
     - "Prepared for" and the buyer's name, in a mid-size serif with tight letter spacing
     - the numbered buyer profile (Looking for · Budget · Handover · Purpose · Areas) beside the numbered **Your goals** list ("Your requests" for an enquiry), which is not clickable
     - a footer row: Prepared by · Developments · Prices valid until · Contact
   - The top bar stays hidden until the reader scrolls past the cover.
3. **Letter:** the opening line follows how the buyer reached us (viewing, call or enquiry).
4. **The properties you're interested in:** **one rounded box per development**, in that development's brand. The box holds the development card and its home cards, so it is always clear which homes belong to which development.
5. **Side by side:** a toggle between **Homes** and **Developments**.
6. **Built on trust.**
7. **Your next step:** depends on the state. Nothing reserved: choose a home, then **Reserve this home**. Request sent: confirming. Reserved: **Book your promise of sale**.
8. **Downloads and legal footer.**

**Floating call to action:** a small black-glass button, centred at the bottom. It follows the scroll and hides while "Your next step" is on screen. One tap. It says **Reserve unit**, or **Contact Sam** after a request, or **Book promise of sale** once a home is reserved.

**Side panel:** the header is a **switcher** with every development and its homes, divided by a line. Buyers move between developments and homes without going back. The panel re-themes to each development's brand. Tabs:

- Development: Overview · Amenities · Location · Progress · Your homes.
- Home: Overview · Renders and views · Floor plan · In the building · Payment plan · Investment or Value.

The home's footer keeps the price, status, **Ask Sam** and **Reserve this home**. The panel is full screen on mobile.

Corners are small and crisp. There are 4 radius tokens: `--r-lg` 10px for panels and boxes, `--r-md` 6px for cards and images, `--r-sm` 4px, and `--r-pill` 3px for buttons and tags.

## 1. The problem in one line

The CRM can already build, version, send, track, renew and revoke a personalised pack. The **page the buyer opens** has no defined design. This plan defines it: one block library, five layout templates, one personalised intro, one link model. Developers only change the brand tokens and the logo.

## 2. What already exists (we build on it, we do not replace it)

| Need | Already in v3 | File |
| --- | --- | --- |
| Builder: units, layout/finish options, message, next step, checks | Custom pack wizard (`crOpen`, `cpUnitDetails`) | [custom-pack.js](../prototypes/v3/custom-pack.js) |
| Send, versions, delivery attempts, expiry, renew, revoke, engagement line | Shared with client (`swAssets`, `swLink`) | [client-share.js](../prototypes/v3/client-share.js) |
| Per-developer brand: `bg surface ink muted accent tint line`, display font, text font, logo | `BRANDS` | [present-v3-data.js](../prototypes/v3/present-v3-data.js) |
| Buyer type: First home · Investment property · Second home · Relocation | `CR_BUYER_TYPES`, `buyerTypeFor` | [Bricly_OS_Prototype_v3.html](../prototypes/v3/Bricly_OS_Prototype_v3.html) |
| What the buyer said: transcript, objections, follow-ups | Meeting intelligence | [meet-intel.js](../prototypes/v3/meet-intel.js) |
| Renders per room / layout / finish, approved only | Unit media (`UM`) | [unit-media.js](../prototypes/v3/unit-media.js) |
| Unit position on the floor plate | Level plans (`LP`) | [level-plans.js](../prototypes/v3/level-plans.js) |
| Pack standards: price wording, 30-day expiry, legal footer, hide budget/financing | `CP_STD`, `CP_DEFAULTS` | [custom-pack.js](../prototypes/v3/custom-pack.js) |

**Gaps to close:** the buyer page itself; template choice; persona-aware content; an investor sub-goal; real (unguessable) link tokens (the prototype uses a 5-character hash); section-level engagement; link preview cards.

## 3. Research: what moves an off-plan sale forward

Sources: research summary, 10 Nov 2026. Legal points marked **verify** need a primary-source check before we publish copy.

### 3.1 Off-plan buyers buy a promise, so trust comes before beauty

- **Delivery risk is the main blocker in every market.** Buyers need proof that the developer will finish the building and that the deposit is safe. How the deposit is protected depends on the market: escrow released at construction milestones (Dubai RERA), a bank guarantee on staged deposits (Spain, Ley 57/1968), or warranty plus solicitor-held deposits (UK NHBC/NHQC). For Malta, describe the promise-of-sale deposit and how it is held (**verify**).
- **Payment plans are the main affordability lever.** Post-handover plans (for example 60/40) drive off-plan conversion in Dubai. In UK agency brochures, the payment plan always has its own section.
- **The motivation depends on the buyer:**

| Buyer | Pushes them forward | Holds them back |
| --- | --- | --- |
| First home / owner-occupier | Space, light, a finished spec, a payment plan that fits, first-time-buyer relief | Snagging fear, affordability, waiting for handover |
| Family / relocation | Schools, commute, neighbourhood safety, community | An unknown area, timing the move to handover, residency paperwork |
| Rental investor | Yield, rental demand, low vacancy, management options, costs | Financing caps, uncertain service charges, oversupply |
| Capital-growth investor | Price at launch vs at completion, phase releases, scarcity, resale/assignment rights | Delivery delays, resale restrictions |
| Overseas investor | Currency, residency route, remote buying (power of attorney, e-sign) | Moving money abroad, trust from a distance |
| Second / holiday home | Lifestyle, views, sea and sun, lock-up-and-leave, short-let options | Running costs, management while away, licensing |

- **Residency messaging is time-sensitive.** Spain ended its Golden Visa in April 2025. Portugal removed real estate from its Golden Visa in October 2023. Dubai's 10-year visa (AED 2m) still applies. Show residency content only from a dated, market-specific source (Malta MPRP: **verify**).

### 3.2 What top developers and agencies send

- UK agencies (Knight Frank, Savills, Berkeley) use the same order: cover, welcome letter, overview, imagery, plans, location and lifestyle, comparables, **payment and terms**, named adviser. Knight Frank turned static brochures into interactive web experiences. Berkeley shows the buying journey as a stage tracker.
- Dubai developers (Emaar, Sobha, Damac) run the whole journey online: choose a unit, see live inventory, reserve, then track milestone payments.
- Common personalisation: buyer name, a short video from the rep, only the units discussed, a side-by-side comparison, one named contact.

### 3.3 What lifts conversion

- Interactive proposals close more often than static PDFs. Published figures: 36% vs 20% as a benchmark, and 30% → 60% in one Qwilr case study.
- A personalised rep video doubled one company's win rate (13% → 26%, GetAccept). Video drove 4× more booked meetings (Vidyard).
- One clear call to action converts much better than many: about 13.5% with one CTA vs about 2.1% with five or more.
- Interactive calculators lift conversion by 30–50%. Keep forms to 3 fields or fewer.
- **Real** deadlines (hold expiry, price validity) lift action. Fake urgency loses trust.
- Section-level view tracking is standard in DocSend, Proposify and Showpad. Reps use it to time their follow-up.

### 3.4 What reads as luxury

- Restraint and pacing, not lots of effects. Fade the logo in rather than showing a spinner. Use large, well-spaced type and full-bleed imagery. Tell the story in chapters (place → architecture → home → investment). Tie motion to scrolling, not to autoplay loops.
- Mobile first: 74–89% of property browsing is on a phone. The first open is usually from a WhatsApp link on a weak connection.
- Budgets: LCP 2.5 s or less, first view 1.5 MB or less. Respect `prefers-reduced-motion`. Every link needs its own 1200×630 preview image, because the WhatsApp preview is the real first impression.

### 3.5 Compliance (hard product rules, not optional copy)

- Never say yield or growth is guaranteed. Every projected figure needs a disclaimer **next to the figure**, not only in the footer, plus a stored source (ASA/CAP in the UK, the EU Unfair Commercial Practices Directive, and Dubai RERA, which bans "guaranteed ROI" outright).
- Show permit or registration numbers wherever a market requires them (for example the RERA permit in Dubai).
- An ROI-led page can count as a financial promotion in the UK (FCA). Investment blocks must carry a risk line.
- Tracking needs consent in the UK and EU. Strictly necessary first-party analytics only, with a disclosure the first time the buyer opens the link (**verify** with ICO guidance).

## 4. Product principles for the buyer page

1. **Written for one person.** The buyer's name, what they asked for and the homes they liked come first. Generic development marketing comes second.
2. **Answer before you sell.** Every requirement and objection from the conversation appears with its answer.
3. **Prove the promise.** Every proposal includes developer track record, construction progress and deposit protection.
4. **One next step.** Each screen has one primary action: the next step the rep set in the builder.
5. **Honest scarcity.** Show real availability and real hold or price-validity dates only. No fake timers.
6. **Same data, different stage.** Templates change order, density and emphasis. They never change the data, prices or legal wording (Buyer pack standards stay locked).
7. **Brand-swappable by tokens only.** A template must work with any `BRANDS` palette, fonts and logo, and pass WCAG AA automatically.

## 5. The building blocks (content model)

Every template is an ordered set of these blocks. Each block lists its data source and when it appears.

| # | Block | Shows | Data source | Rule |
| --- | --- | --- | --- | --- |
| B00 | **Personal intro** | "A private proposal for {First name}", prepared by {Rep}, developer logo, development name(s) | Opportunity, rep, `BRANDS` | Always |
| B01 | **Letter from your adviser** | Rep photo or monogram, short note (80 words or fewer) | Builder message (`st.msg`) | Always. No video |
| B02 | **What you told us** | 3–5 requirements in the buyer's own terms ("South-facing", "Room for a home office", "Handover before Sept 2027"), each linked to where it is answered | Meeting intel + opportunity requirements | When a conversation exists. Budget and financing stay hidden (`CP_DEFAULTS.profile`) |
| B03 | **Your homes** | Unit cards: hero render, beds/baths, size, floor, aspect, price wording, availability | Units in the issue + `UM` + `LP` | Always |
| B04 | **Home in depth** | Render gallery in the chosen layout and finish, floor plan, position on the floor, view from the unit, room sizes | `UM` (approved only), `LP`, builder config | One per unit |
| B05 | **Side by side** | Compare 2–4 homes on the factors this buyer cares about | Issue units + buyer type | 2+ units (already a pack standard) |
| B06 | **The development** | Architecture, amenities, the idea behind it, 3–5 headline facts | Development record | Always, once per development |
| B07 | **Life here** | Neighbourhood chapter filtered by buyer type (see §6) | Development POIs | Always |
| B08 | **Built on trust** | Developer track record, delivered projects, construction progress photos with date, deposit protection, warranty | Developer record | Always (off-plan) |
| B09 | **Timeline** | Today → milestones → handover, with "you are here" | Development programme | Always (off-plan) |
| B10 | **Payment plan** | Milestones as € amounts and dates for the selected home, interactive per unit | Payment plan + unit price | Always, unless "price on request" |
| B11 | **Investment view** | Estimated rent range, gross/net yield, comparables, occupancy, management options. Disclaimer next to every figure | Development investment data | Investment property, or Second home when short-let is allowed |
| B12 | **Cost of owning** | Taxes, notary, fees, service charge estimate, first-buyer relief if eligible | Market cost table | First home, Investment, Relocation |
| B13 | **Moving here** | Residency route, schools, healthcare, relocation partners | Market content (dated) | Relocation, or an overseas investor with a residency goal |
| B14 | **Your questions, answered** | Objections and open questions from the conversation, each with an approved answer | Meeting intel objections + follow-ups | When any exist |
| B15 | **Specification** | Finishes in the chosen pack, appliances, smart home, energy rating | Spec + chosen pack | Always (short), full spec in downloads |
| B16 | **Availability** | "3 of 12 two-bed homes remain", hold or price-validity date | Live inventory, hold, `CP_STD` | Always. Real data only |
| B17 | **Next step** | One primary CTA (the next step from the builder) + rep card (call, WhatsApp) | Builder `st.next`, rep | Always. Repeated in a sticky footer on mobile |
| B18 | **Downloads** | The matching PDF of this issue, floor plans, price list, spec | Issue outputs | Always |
| B19 | **Legal footer** | Price validity, "images are indicative", projection disclaimers, permits, privacy and tracking notice | `CP_STD` + market | Always. Locked |

### Never show on the buyer page

Budget, financing notes, internal notes, negotiation room or discounts, commission, other buyers' interest or names, raw transcript text (only short, approved paraphrases), unapproved renders, units that are no longer available (unless offered as an alternative), guaranteed returns, fake countdowns, and on the link preview, any price or surname.

## 6. Personalisation rules by buyer type

`CR_BUYER_TYPES` stays as it is. **Add one field for investors:** `investGoal` = Rental income · Capital growth · Residency. It changes the investment block.

| Block emphasis | First home | Investment: rental | Investment: growth | Second home | Relocation |
| --- | --- | --- | --- | --- | --- |
| Hero message | "A home made for how you live" | "Income from day one of handover" | "Buy at launch, own at completion" | "Your place in the sun" | "Your new life in {place}" |
| Life here (B07) | Shops, parks, transport, gyms | Rental demand drivers: employers, university, transport | Infrastructure pipeline, area regeneration | Sea, marinas, dining, beaches, airport time | Schools, healthcare, international community, commute |
| Investment view (B11) | Hidden | Full: rent range, net yield, occupancy, management | Launch vs current price per m², phase releases, resale rights | Short-let potential only, if licensed | Hidden |
| Cost of owning (B12) | Full, with first-buyer relief | Full, net of costs | Summary | Running costs and management | Full |
| Moving here (B13) | Hidden | Hidden | Residency only if the goal is residency | Hidden | Full |
| Payment plan (B10) default view | Monthly feel ("what each stage means") | Cash flow vs rental start | Capital deployed vs value at completion | Simple milestones | Milestones aligned to move date |
| Comparison factors (B05) | Size, light, storage, outdoor space | Yield, price per m², rentability | Price per m², floor premium, view | View, terrace, lock-up-and-leave | Bedrooms, schools catchment, handover date |

## 7. The five templates

> **Superseded in part by §0.** Templates are now visual styles that the account chooses in developer Settings, so auto-selection no longer applies. Multiple developments are handled in every template, so Collection is no longer a separate template. Signature is built. The other four styles will be rebuilt from its section structure. Candidates: Residence (room by room), Investor Brief (numbers first), Cinematic (full-screen, horizontal) and Monograph (minimal, type-led).

All five use the same blocks and tokens. They differ in **narrative, order and density**.

| # | Template | Best for | Feel |
| --- | --- | --- | --- |
| T1 | **Signature** | 1 development, 1–3 homes, early to mid stage. The default | Editorial, long scroll, full-bleed chapters, like a luxury magazine |
| T2 | **Residence** | 1 home, owner-occupier, after a viewing | Room by room, intimate, "a day in your home" |
| T3 | **Investor Brief** | Investment property (any goal) | Numbers first, calm data, charts, still luxury |
| T4 | **Collection** | 2+ developments, or 4+ homes | Gallery of chapters, one per development, then a shared comparison |
| T5 | **Decision Room** | Late stage: home on hold, second appointment done, reservation next | Short, checklist-led, everything needed to say yes |

### Auto-selection (first match wins)

1. A unit is on hold for this buyer, or the stage is Negotiating → **T5 Decision Room**
2. 2+ developments in the issue, or 4+ homes → **T4 Collection**
3. Buyer type is Investment property → **T3 Investor Brief**
4. Exactly 1 home and the buyer type is First home, Relocation or Second home → **T2 Residence**
5. Otherwise → **T1 Signature**

### 7.1 Block order per template

| Block | T1 Signature | T2 Residence | T3 Investor | T4 Collection | T5 Decision |
| --- | --- | --- | --- | --- | --- |
| B00 Intro | 1 | 1 | 1 | 1 | 1 |
| B01 Letter | 2 | 2 | 2 | 2 | 2 |
| B02 What you told us | 3 | 3 | 3 (as "Your brief") | 3 | 3 (as "Agreed so far") |
| B06 Development | 4 | 8 | 7 | 4× per dev | — (link) |
| B07 Life here | 5 | 7 | 6 (demand) | 4× per dev | — |
| B03 Your homes | 6 | — (single) | 4 | 4× per dev | 4 (held home) |
| B04 Home in depth | 7 | 4 (lead) | 8 | on tap | 5 (short) |
| B05 Side by side | 8 | — | 5 | 5 (across devs) | — |
| B11 Investment | persona | persona | 5 (lead) | persona | persona (summary) |
| B15 Specification | 9 | 5 | 10 | on tap | 6 |
| B14 Questions answered | 10 | 6 | 9 | 6 | 7 |
| B08 Trust | 11 | 9 | 8 | 7 | 8 |
| B09 Timeline | 12 | 10 | 9 | 8 | 9 |
| B10 Payment plan | 13 | 11 | 6 | 9 | 10 (lead CTA) |
| B12 Costs / B13 Moving | persona | persona | 11 | persona | 11 |
| B16 Availability | 14 | 12 | 12 | 10 | 4 (with hold date) |
| B17 Next step | 15 + sticky | 13 + sticky | 13 + sticky | 11 + sticky | 12 + sticky |
| B18 Downloads · B19 Legal | end | end | end | end | end |

## 8. Lo-fi wireframes (mobile first, 390 px)

Desktop uses the same order. Imagery widens to 12 columns and text sits in a 6-column measure.

### 8.1 B00 Personal intro (shared by all templates)

```
┌──────────────────────────────┐      Sequence (≈3.2 s, skippable with a tap)
│                              │      0.0  brand bg; hairline draws across, 600 ms
│                              │      0.4  developer logo fades in + rises 8 px
│        [ DEV LOGO ]          │      1.0  "A private proposal for" letter-spaced, fades in
│  ──────────────────────────  │      1.4  "Mike" in display serif, line-mask reveal
│   A PRIVATE PROPOSAL FOR     │      2.0  "Prepared by Sam Borg · 10 November 2026"
│                              │      2.4  hero render fades in behind at 6% → 100%,
│          Mike                │           slow scale 1.06 → 1.00 over 6 s
│                              │      3.2  "Begin" (or a scroll cue) appears; content
│   Prepared by Sam Borg       │           preloads during the sequence
│   10 November 2026           │
│                              │      Return visits: 0.8 s short version
│          ( Begin )           │      ("Welcome back, Mike").
│                              │      Reduced motion: static card, crossfade only.
│  Dolphin Court · Paola       │
└──────────────────────────────┘
```

The intro also covers loading: it shows while the first chapter loads, so the buyer never sees a spinner.

Link preview (WhatsApp/iMessage): `og:title` "A private proposal for Mike · Dolphin Court", `og:image` = branded 1200×630 card with logo, development name and render. No price, no surname.

### 8.2 T1 Signature (editorial, 1 development)

```
[B00 Intro]
┌──────────────────────────────┐
│ (rep photo)  Sam Borg        │  B01 Letter: 80 words, signature,
│ "Mike, after Saturday's      │  optional ▶ 0:48 video
│  viewing I've put together…" │
│ ▶ Play Sam's message  0:48   │
├──────────────────────────────┤
│ WHAT YOU TOLD US             │  B02: chips → tap scrolls to the answer
│ ◦ South-facing  → Unit 4B    │
│ ◦ Home office   → Layout B   │
│ ◦ Move by 2027  → Timeline   │
├──────────────────────────────┤
│ [ FULL-BLEED RENDER ]        │  B06 chapter opener: display headline,
│ "Living by the harbour"      │  3 headline facts that count up
│ 48 homes · 6 floors · 2027   │
├──────────────────────────────┤
│ LIFE HERE  [map strip]       │  B07, filtered by buyer type
│ 4 min · Waterfront  ...      │
├──────────────────────────────┤
│ YOUR HOMES                   │  B03: horizontal swipe cards
│ ┌────────┐ ┌────────┐        │
│ │ render │ │ render │  →     │
│ │ 4B·2bd │ │ 5A·2bd │        │
│ │ €385k  │ │ €402k  │        │
│ └────────┘ └────────┘        │
├──────────────────────────────┤
│ B04 Home in depth (per unit) │  gallery · plan (lines draw on scroll)
│ B05 Side by side             │  · floor position · view
│ B15 Spec · B14 Questions     │
│ B08 Trust · B09 Timeline     │
│ B10 Payment plan             │
│ B16 "3 of 12 remain"         │
├──────────────────────────────┤
│ [ Book a second viewing ]    │  B17: sticky after B03
└──────────────────────────────┘
```

### 8.3 T2 Residence (one home, room by room)

```
[B00 Intro → hero = the unit's best render]
B01 Letter · B02 What you told us
┌──────────────────────────────┐
│ UNIT 4B · 2 BED · 92 m²      │  B04 leads: "Morning" → kitchen render,
│ ── Morning ────────────────  │  "Afternoon" → living render,
│ [ kitchen render, chosen     │  "Evening" → terrace + view photo.
│   finish: Riviera ]          │  Each room: render · size · 1 line of copy
│ Kitchen · 4.2 × 3.1 m        │
│ ── Evening ────────────────  │
│ [ terrace + view ]           │
├──────────────────────────────┤
│ [ PLAN ] tap a room →        │  Interactive plan; position on the floor
│ highlights in the gallery    │  plate (LP) with the sun path
├──────────────────────────────┤
│ B15 Spec in your finish      │
│ B14 Questions · B07 Life here│
│ B06 Development · B08 Trust  │
│ B09 Timeline · B10 Payment   │
│ B12 Costs (first home)       │
└──────────────────────────────┘
```

### 8.4 T3 Investor Brief (numbers first)

```
[B00 Intro, then a "Your brief" card]
┌──────────────────────────────┐
│ YOUR BRIEF                   │  B02 as an investment mandate:
│ Goal: rental income          │  goal, horizon, preferred size
│ Horizon: 5–7 years           │  (no budget shown)
├──────────────────────────────┤
│ AT A GLANCE (per home)       │  B03 + B11: KPI tiles that count up
│ ┌──────┐┌──────┐┌──────┐     │
│ │€1.6k │││4.9%  ││2027  │     │  Est. rent / month · est. gross yield ·
│ │/month││gross*││handov│     │  handover. *Disclaimer line directly below
│ └──────┘└──────┘└──────┘     │
│ *Estimate, not guaranteed.   │
├──────────────────────────────┤
│ B05 Compare: yield · €/m² ·  │  Table, best value highlighted in accent
│ floor · service charge       │
├──────────────────────────────┤
│ B10 Cash flow                │  Bar timeline: deposits out (ink),
│ ▇ ▇   ▇        ░░░░░░░░      │  rent in (accent, from handover);
│ pay   pay      rent →        │  slider: price · rent · occupancy
├──────────────────────────────┤
│ B07 Rental demand drivers    │  Employers, university, transport
│ B08 Trust · B09 Timeline     │  + comparables with dates and sources
│ B12 Costs · B13 (residency)  │
└──────────────────────────────┘
```

### 8.5 T4 Collection (2+ developments)

```
[B00 Intro: "A private collection for Mike", both logos (or the agency
 logo if developers differ)]
B01 Letter · B02 What you told us
┌──────────────────────────────┐
│ CHAPTER I                    │  Each development = its own chapter,
│ [ full-bleed render ]        │  in that developer's own tokens
│ Dolphin Court · Paola        │  (the page re-themes between chapters
│ "Harbour living"             │  with a 600 ms colour crossfade)
│ 2 homes for you →            │
├──────────────────────────────┤
│ CHAPTER II                   │
│ [ full-bleed render ]        │
│ Mercury · St Julian's        │
│ 1 home for you →             │
├──────────────────────────────┤
│ SIDE BY SIDE                 │  B05 across developments, factors
│ Dolphin 4B │ Mercury 12C     │  chosen by buyer type
│ handover…  │ handover…       │
├──────────────────────────────┤
│ B14 Questions · B08 Trust     │  Trust, timeline and payment plan
│ (per developer, tabbed)      │  shown per developer in tabs
│ B17 One next step            │
└──────────────────────────────┘
```

Rule: when developers differ, the shell (intro, letter, comparison, next step) uses the **agency/sales brand**; each development chapter uses its own developer brand.

### 8.6 T5 Decision Room (ready to reserve)

```
[B00 short intro, 1.5 s]
┌──────────────────────────────┐
│ Mike, Unit 4B is held for    │  B16 leads: real hold expiry
│ you until Fri 14 Nov, 18:00  │  (date, not a ticking timer)
├──────────────────────────────┤
│ AGREED SO FAR                │  B02: what was agreed in the second
│ ✓ Layout B, Riviera finish   │  appointment
│ ✓ Parking space P12          │
│ ◦ Handover Q3 2027           │
├──────────────────────────────┤
│ TO RESERVE                   │  Steps: 1 confirm · 2 deposit (€) ·
│ 1 ── 2 ── 3 ── 4             │  3 promise of sale · 4 notary.
│ What you need: ID, proof of  │  What happens to the deposit
│ address, deposit €38,500     │  (B08 protection, inline)
├──────────────────────────────┤
│ B10 Payment schedule (dates) │
│ B14 Last questions answered  │
│ B18 Documents to review      │
├──────────────────────────────┤
│ [ I'd like to reserve ]      │  Primary CTA starts the reservation
│  Call Sam · WhatsApp Sam     │  request. It does not reserve
└──────────────────────────────┘  automatically
```

## 9. Luxury and motion system (for the visual phase)

- **Pace:** one idea per screen. A lot of whitespace. Images fill the full bleed. Copy is short.
- **Type:** brand display font for headlines (≥ 40 px on mobile), brand text font for body (17 px, 1.6 line height), letter-spaced small caps for labels.
- **Motion tokens:** `fast 240 ms` (hover, taps) · `base 600 ms` (reveals) · `slow 1200 ms` (chapter openers) · easing `cubic-bezier(.2,.7,.1,1)`.
- **Micro-animations used throughout:** headlines revealed through a line mask · images settle from 1.06 to 1.00 scale · hairline rules draw across · floor-plan strokes draw on scroll · key numbers count up once · tap on a requirement chip glides to its answer · chapter colour crossfade (T4) · CTA has a soft accent glow on first appearance only.
- **Never:** autoplay video with sound, parallax that fights scrolling, looping effects, motion that blocks reading.
- **Reduced motion:** every effect falls back to a 200 ms opacity fade.
- **Performance:** LCP 2.5 s or less on 4G. First view 1.5 MB or less (AVIF/WebP, responsive sizes). Fonts subset and preloaded. Gallery lazy-loaded.
- **Brand safety:** templates read only the `BRANDS` tokens. The system checks contrast and derives an `onAccent` colour (ink or white) so any palette passes AA. A logo can be an image or text with a sub-line, as today.

## 10. How the custom link works

### 10.1 Flow

```
Rep: Send pack / Send unit details / Present follow-up
  → Builder (existing) gathers units, options, message, next step
  → System picks template (§7) + persona blocks (§6) → rep previews and can switch
  → Publish issue vN = an immutable snapshot (content + prices + template + brand version)
  → Link minted: bricly.mt/p/{token}  → sent by WhatsApp or email (existing)
Buyer opens → intro → page renders from the snapshot (no live CRM queries)
  → engagement events → opportunity timeline, rep notification, next-best-action
```

### 10.2 Link rules

| Topic | Rule |
| --- | --- |
| Token | 128-bit random, base62 (~22 characters). Never derived from IDs. One per recipient. The prototype's 5-character hash is display only |
| Version | The link opens the current published version (existing behaviour). Every version is an immutable snapshot |
| Expiry | Default 30 days (`CP_STD.expiry`). Renew and revoke as already built. An expired link shows a branded "This proposal has expired. Ask Sam for a fresh link" page with a contact button |
| Sensitive packs | Optional passcode or one-time code sent to the buyer's phone or email. Automatic for T5 (reservation details) |
| Second viewer | A spouse or adviser gets their own link (own token and tracking), not a forwarded one. A forwarded open on a new device is logged as "opened on a new device" |
| Price changes | Prices are frozen in the snapshot with "valid until". If a home is repriced, the live page shows a calm notice and the rep gets a task to reissue (existing stale logic) |
| Unit sold or held by someone else | The card switches to "No longer available". Up to 2 alternatives are suggested if the rep allowed it |
| Indexing | `noindex, nofollow`, `Referrer-Policy: no-referrer`, no third-party scripts |
| Preview card | `og:title`, `og:image` (1200×630, 300 KB or less) generated per issue, with first name only |
| Privacy | A first-open notice explains that the page tells the rep which sections were viewed. First-party, strictly necessary analytics only. Respect the opt-out |
| PDF | The same issue renders to a PDF with the same template, minus motion and the interactive calculator |

### 10.3 Engagement fed back to the CRM

Events: opened (device, return visit), intro completed, video played (%), section dwell, home viewed, plan or gallery opened, calculator used (inputs kept private, only "used" is stored), download, CTA tapped, question asked.

Signals to the rep: *"Mike opened your proposal 3× · 4 min on Unit 4B's payment plan · played your video"* → a suggested next action (for example "Call about the payment plan today"). This extends the existing `cpEngLine` and the timeline.

## 11. Data additions needed

| Field | Where | Why |
| --- | --- | --- |
| `investGoal` (rental · growth · residency) | Opportunity | Drives B11/B13 |
| `requirements[]` with `answeredBy` (block or unit) | Opportunity (from meet-intel) | B02 chips |
| `approvedAnswers[]` for objections | Meet-intel follow-ups, rep-approved | B14 |
| Developer track record, delivered projects, deposit-protection text, progress photos with date | Development / developer record | B08 |
| Programme milestones | Development | B09, B10 dates |
| Rental estimates, comparables, sources, date | Development (investment data) | B11, with evidence for compliance |
| POIs tagged by persona | Development | B07 filtering |
| Market content: costs, residency, legal footer, permit numbers | Settings per market | B12, B13, B19 |
| Rep photo and optional video | Rep profile / per issue | B01 |
| `template` + `templateAuto` | Pack issue | Reproducible snapshots |
| Agency brand tokens | Settings | T4 shell when developers differ |

## 12. Next steps

1. **Review this plan:** block list, persona rules, five templates and auto-selection.
2. **Visual phase:** for each template, design hi-fi mobile (390) and desktop (1440) in **two brands** (for example Dolphin Court and Mercury) to prove token-only reskinning. Add the intro motion spec as a timed storyboard, and a block component sheet.
3. **Edge states:** no conversation yet, price on request, unit sold, expired or revoked link, passcode screen, one render only, no video, reduced motion.
4. **Prototype in v3:** a `proposal-*.js` module that renders a published issue from `crState` + `BRANDS`, opened from "Client preview" in Shared with client and from Review & send.
5. **Developer handoff package** in the existing handoff style: tokens, block specs, motion tokens, link API, events schema and acceptance tests.

## 13. Open questions

- Resolved on 10 Nov: markets (parked), video (out), reserve (on each home, as a request), mixed developers (never). See §0.
- Should passcodes be on by default for every proposal, or off?
- What does the template picker in developer Settings show: a live preview using that developer's brand, or static thumbnails?
