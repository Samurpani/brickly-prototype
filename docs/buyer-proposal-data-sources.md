# Buyer proposal: where every section gets its data

**For:** engineers building the buyer proposal page (the custom link `bricly.mt/p/{token}`) · **Template:** Signature (template 1) · **Live prototype:** [prototypes/v3/proposal/index.html](../prototypes/v3/proposal/index.html) · **Plan:** [buyer-proposal-plan.md](buyer-proposal-plan.md)

This doc covers the page section by section. For each section it lists every field shown, its path in the `PROPOSAL` object ([proposal-data.js](../prototypes/v3/proposal/proposal-data.js)) and the CRM record it comes from. Where the CRM has no field yet, it is marked **NEW**.

## 0. How the data flows

```
CRM records (opportunity, contact, rep, developer, development, units, media, level plans, payment plans, settings)
  → Rep builds the pack (Custom pack wizard: custom-pack.js · crOpen / cpUnitDetails)
  → Publish = freeze one immutable snapshot  →  the PROPOSAL object (one issue, one version)
  → Link minted: bricly.mt/p/{token}  (client-share.js · swLink)
  → Buyer page renders ONLY from the snapshot. No live CRM queries.
  → Engagement events → opportunity timeline (cpEngLine)
```

Rules that apply everywhere:

- **Snapshot, not live.** Every field below is copied into the issue when the rep publishes. Prices, availability and copy stay frozen until the rep reissues. The two exceptions are in §11.
- **Derived values are computed on the page, not stored.** Yields, € payment amounts, price per m², handover date and "lowest price" are calculated in [proposal.js](../prototypes/v3/proposal/proposal.js) from the stored values. Do not store them twice.
- **Images:** approved media only (`UM`, renders flagged approved/kept). Never request new renders for a proposal (`CP_DEFAULTS.renders`).
- **Never on the page:** budget and financing details unless the rep chooses to show them (`CP_DEFAULTS.profile`), internal notes, the commission or other buyers.
- **Brand:** the developer brand frames the page. Each development uses its own brand inside its box, panel and comparison column. Tokens come from `BRANDS` ([present-v3-data.js](../prototypes/v3/present-v3-data.js)). The page derives `--on-accent` itself for contrast.

### Source records used below

| Short name | What it is | Prototype reference |
| --- | --- | --- |
| **Issue** | The published pack: id, version, token, dates, template, letter, selected units | `crState` in custom-pack.js, `swAssets` / `swLink` in [client-share.js](../prototypes/v3/client-share.js) |
| **Opportunity** | The deal in progress: buyer type, requirements, how they reached us | `oppCur`, `buyerTypeFor(o)` in [Bricly_OS_Prototype_v3.html](../prototypes/v3/Bricly_OS_Prototype_v3.html) |
| **Contact** | The buyer's name | Contact record on the opportunity |
| **Rep** | The assigned sales rep: name, role, phone, WhatsApp, email | User profile of the opportunity owner |
| **Developer** | The account: name, brand, cover image, track record | Developer settings + `BRANDS` |
| **Development** | One building or project | Development record (`DEV(id)`), development editor ([dev-editor.js](../prototypes/v3/dev-editor.js) · `deState(d).live`) |
| **Unit** | One home | Unit record (`UN(id)`) |
| **UM** | Unit renders and views, tagged by room, layout and finish | [unit-media.js](../prototypes/v3/unit-media.js) |
| **LP** | Where the unit sits on its level | [level-plans.js](../prototypes/v3/level-plans.js) |
| **Meet intel** | What the buyer said in meetings and calls | [meet-intel.js](../prototypes/v3/meet-intel.js) |
| **Standards** | Pack standards: expiry, price wording, legal footer | `CP_STD`, `CP_DEFAULTS` in [custom-pack.js](../prototypes/v3/custom-pack.js) |
| **COMMERCE** | Currency and area unit per development | [present-v3-data.js](../prototypes/v3/present-v3-data.js) |

---

## 1. Link preview and page head

Shown in WhatsApp/email previews and the browser tab. File: [index.html](../prototypes/v3/proposal/index.html).

| Field | Example | PROPOSAL path | Source |
| --- | --- | --- | --- |
| Page title | "A private proposal for Mike · Seashore Developments" | `buyer.first`, `developer.name` | Contact (first name only), Developer |
| `og:title` | "…for Mike · Dolphin Court and Onyx Rise" | `buyer.first`, `developments[].name` | Contact, Development |
| `og:description` | "Prepared by Sam Borg, Seashore Developments" | `rep.name`, `developer.name` | Rep, Developer |
| `og:image` | Development hero | `developments[0].hero` | **NEW:** generated per issue (1200×630, 300 KB or less) |
| `noindex`, `no-referrer` | — | — | Fixed. Always on |

## 2. Intro (loading screen)

`intro()` in proposal.js. Plays for about 2 seconds, then opens the page.

| Field | PROPOSAL path | Source |
| --- | --- | --- |
| Background and colours | `developer.brand` | `BRANDS[developer]` |
| Logo (image, or text + sub-line) | `developer.brand.logo` | `BRANDS[developer].logo` |
| "This proposal is for" / "Welcome back" | — | Fixed copy. "Welcome back" when the device has seen this token before (`localStorage` key `bricly.proposal.seen.{token}`) |
| Buyer first name | `buyer.first` | Contact |
| "Prepared by {rep}" | `rep.name` | Rep |

## 3. Top bar and floating action

| Field | PROPOSAL path | Source |
| --- | --- | --- |
| Logo | `developer.brand.logo` | `BRANDS` |
| "Prepared for {first last}" | `buyer.first`, `buyer.last` | Contact |
| "Talk to {rep first name}" | `rep.name` | Rep |
| Floating action label | derived (`fabState`) | Reserved → "Book promise of sale". Request sent → "Contact {rep}". A unit with `status:'held'` → "Reserve unit" for that unit. Otherwise → "Reserve unit" (scrolls to the next step) |

## 4. Cover

`SECTIONS.cover`. Left: one image. Right: the buyer brief.

| Field | Example | PROPOSAL path | Source |
| --- | --- | --- | --- |
| Cover image | Lounge photo | `developer.cover` (falls back to `developer.hero`) | **NEW:** Developer settings: one cover image per developer account |
| Logo | Seashore Developments | `developer.brand.logo` | `BRANDS` |
| Proposal number | PR-1001-2 | `id` | Issue: `{pack id}-{version}` |
| Issue date | 10 November 2026 | `issued` | Issue: publish date |
| Buyer name | Mike Gatt | `buyer.first`, `buyer.last` | Contact |
| Looking for | Two-bedroom apartment with a terrace | `profile.looking` | Opportunity requirements (typology, outdoor space) |
| Budget | €280,000 – €380,000 | `profile.budget` | Opportunity budget range. Hidden by default (`CP_DEFAULTS.profile`). The rep must opt in to show it |
| Handover | Before summer 2027 | `profile.handover` | Opportunity: move-in / handover requirement |
| Purpose | Investment · rental income | derived: `PROPOSAL_PERSONAS[buyer.type].purpose` | Opportunity buyer type (see §12) |
| Areas | Grand Harbour or central Malta | `profile.areas` | Opportunity: preferred locations |
| "Your goals" list (5 rows) | "Two bedrooms and a terrace → All three homes" | `requirements[].ask`, `.answer`, `.to` | **NEW:** `requirements[]` with `answeredBy` on the opportunity, filled from Meet intel. `ask` is the buyer's words. `answer` is the rep's short reply. `to` is the panel and tab that answers it (`u-{unitId}`, `d-{devId}-{tab}`) |
| Title "Your goals" / "Your requests" | derived from `context.kind` | "Your requests" when the buyer came from an enquiry |
| Prepared by | `rep.name` | Rep |
| Developments | `developments[].name` | Development |
| Prices valid until | `validUntil` | Issue: publish date + `CP_STD.expiry` (30 days) |
| Contact | `rep.phone` | Rep |

## 5. Letter

`SECTIONS.letter`.

| Field | PROPOSAL path | Source |
| --- | --- | --- |
| Rep monogram, name, role | `rep.initials`, `rep.name`, `rep.role` | Rep profile. **NEW:** rep photo (optional, replaces the monogram) |
| Opening line | derived from `context` | Fixed sentence per channel, filled from the opportunity's last touchpoint. `context.kind`: `viewing` ("thank you for coming to see {place} on {day}"), `call` ("thanks for the call on {day}") or `request` ("thanks for getting in touch about {place}"). `day` and `place` come from the last completed appointment, call or enquiry |
| Body paragraphs | `letter[]` | Issue message, written or edited by the rep in the pack builder (`st.msg`). 80 words or fewer |
| Signature | first word of `rep.name` | Rep |

## 6. The properties you're interested in

`SECTIONS.selection`. There is one box per development, drawn in that development's brand.

| Field | PROPOSAL path | Source |
| --- | --- | --- |
| Box colours and logo | `developments[].brand` | `BRANDS[development]` |
| "{n} homes · Handover {date}" | count of `units` where `unit.dev === dev.id`, last `timeline[].d` | Derived |
| Development image | `developments[].hero` | Development hero image (approved media) |
| "{place} · {pct}% built" | `developments[].place`, `.progress.pct` | Development: location, construction progress |
| **Home card:** image | `units[].renders[0]` | `UM`: the first approved render for the unit's chosen layout and finish |
| Home card: status pill | derived (`statusOf`) | Unit status + this buyer's actions: "On hold for you" (`status:'held'`), "Available", "Reservation requested", "Reserved for you" |
| Home card: name | `units[].name` | Unit |
| Home card: "2 bed · 88 m² · Level 2" | `units[].beds`, `.sqm`, `.floor` | Unit |
| Home card: view | `units[].view` | Unit (view attribute) |
| Home card: price | `units[].price` | Unit list price **at publish time**, formatted using the development's currency from `COMMERCE` |

## 7. Side by side (Homes / Developments)

`SECTIONS.compare` and `cmpBody()`. Hidden when there is only one home and one development.

**Homes tab:** the rows shown depend on the buyer type, from `PROPOSAL_PERSONAS[type].compare`. The best value in a row is highlighted.

| Row key | Label | Value | Source |
| --- | --- | --- | --- |
| `price` | Price | `unit.price` | Unit |
| `size` | Internal area | `unit.sqm` | Unit |
| `ext` | Terrace | `unit.ext` | Unit (external area) |
| `floor` | Floor | `unit.floor` | Unit |
| `view` | View | `unit.view` | Unit |
| `handover` | Handover | `unit.handover` | Development programme (handover milestone) |
| `rent` | Estimated rent | `unit.invest.rent[min,max]` | **NEW:** Development investment data (rental estimate per typology, with source and date) |
| `yield` | Estimated gross yield* | derived: mid rent × 12 ÷ price | Computed |
| `occ` | Estimated occupancy* | `unit.invest.occ` | **NEW:** Development investment data |
| `pricem2` | Price per m² | derived: price ÷ sqm | Computed |

**Developments tab:**

| Row | Value | Source |
| --- | --- | --- |
| Location | `dev.place` | Development |
| Handover | last `dev.timeline[].d` | Development programme |
| Build progress | `dev.progress.pct`, `.stage` | Development: construction progress |
| Homes in the building / Floors | `dev.facts[]` where the label is "Homes" / "Floors" | Development: total units, number of floors |
| Amenities | `dev.amenities[].n` | Development amenities |
| Close by | first 2 of `dev.life[]` that match the buyer type | Development POIs (see §8) |
| Price per m² today | `dev.market.now` | **NEW:** Development market data |
| Your homes here | count of the development's homes and the lowest price | Derived |

## 8. Development panel (opens from a development card)

`devTabs()`. Each heading below is a tab in the panel.

| Tab | Field | PROPOSAL path | Source |
| --- | --- | --- | --- |
| Overview | Hero image | `dev.open` (falls back to `dev.hero`) | Development media (approved) |
| | Tagline | `dev.tagline` | **NEW:** Development: one-line positioning |
| | Facts (4) | `dev.facts[] {v, l, plain}` | Development: total units, floors, a headline distance, handover year |
| | Story | `dev.story` | Development description (marketing copy) |
| Amenities | Name + image | `dev.amenities[] {n, img}` | Development amenities + amenity media |
| Location | Section title | `PROPOSAL_PERSONAS[type].lifeTitle` | Fixed per buyer type |
| | Places close by | `dev.life[] {n, d, img, for[]}` | **NEW:** Development POIs tagged by persona. `for` holds the buyer types it suits (`all`, `first`, `investment`, `growth`, `second`, `relocation`). Only matching places are shown |
| Progress | % built, stage | `dev.progress.pct`, `.stage` | Development construction progress |
| | Site photo + date | `dev.progress.photo`, `.date` | **NEW:** Progress photos with the date taken |
| | Timeline | `dev.timeline[] {l, d, done, now}` | **NEW:** Development programme milestones |
| Your homes | Home cards | units in this development | As in §6 |

## 9. Home panel (opens from a home card)

`unitTabs()` + `unitFoot()`. The panel uses the development's brand.

| Tab | Field | PROPOSAL path | Source |
| --- | --- | --- | --- |
| Header | "{development} · Level {n}", name | `dev.name`, `unit.floor`, `unit.name` | Development, Unit |
| Overview | Main image | `unit.renders[0]` | `UM` |
| | Status pill | derived (`statusOf`) | See §6 |
| | Bedrooms, bathrooms, internal, terrace, aspect, view | `unit.beds`, `.baths`, `.sqm`, `.ext`, `.aspect`, `.view` | Unit |
| | Rep's note on this home | `unit.note` | **NEW:** Per-unit note in the pack builder (rep-written, can be drafted from Meet intel) |
| Renders and views | Gallery | `unit.renders[]` | `UM`: assets for this unit, filtered by the chosen layout and finish. Approved only |
| | Caption | `unit.layout`, `unit.finish` | The layout and finish the rep chose in the pack builder (`c.layout`, `c.pack`) |
| | Views from this home | `unit.views[] {img, l}` | `UM`: assets tagged as views |
| Floor plan | Drawing | derived (`plan()`) from `unit.rooms` | Prototype draws a generic plan. **Production:** the unit's floor plan file (SVG/PDF) from the unit record |
| | Room sizes | `unit.rooms[] [name, size]` | Unit room schedule |
| | Specification | `unit.spec[]` | Spec of the chosen finish pack |
| In the building | Level stack | `unit.floor`, number of floors from `dev.facts` | Unit, Development |
| | Position on the level | `unit.plate` (cell index), `dev.plate {perRow, face}` | `LP`: the unit's placement on its level outline. The prototype uses a simple grid |
| Payment plan | Stages | `unit.pay[] {pct, label, when}` | **NEW:** Development payment plan template + dates from the programme |
| | € per stage | derived: `price × pct` | Computed |
| Investment (investment buyers only) | Rent range, occupancy, service charge | `unit.invest {rent, occ, fees}` | **NEW:** Development investment data, per typology |
| | Gross / net yield | derived (`gross`, `net`) | Computed. Net = (mid rent × 12 × occupancy − fees) ÷ price |
| Value (growth buyers only) | Price per m² at launch / today | `dev.market.launch`, `.now` | **NEW:** Development market data (price history) |
| | This home per m², change since launch | derived | Computed |
| Footer | Price | `unit.price` | Unit (frozen) |
| | Availability line | `unit.hold` or `dev.remaining` | Held: hold expiry from the unit hold record. Otherwise: live inventory count ("4 of 18 two-bedroom homes remain"). **Real data only** |
| | Ask {rep} / Reserve this home | — | Actions (see §11) |

## 10. Built on trust

`SECTIONS.developer`.

| Field | PROPOSAL path | Source |
| --- | --- | --- |
| Heading "Why buy from {name}" | `developer.name` (first word) | Developer |
| Stats (4) | `developer.stats[] {v, l, s}` | **NEW:** Developer track record: years building, developments delivered, homes handed over, % handed over on time |
| Delivered projects | `developer.delivered[] {name, place, year, img}` | **NEW:** Developer portfolio (past developments) |
| Promises | `developer.promises[] [title, text]` | **NEW:** Developer settings: deposit protection, price guarantee, warranty, single contact. Edited by the developer admin, locked for reps |

## 11. Your next step, the reserve sheet and the footer

`SECTIONS.next`, `openReserve()`, `SECTIONS.footer`.

| Field | PROPOSAL path | Source |
| --- | --- | --- |
| State | `reserved` + the requests sent in this session | **Live, not snapshot:** reservation state from the opportunity/deal. Nothing reserved → pick a home. Request sent → confirming. Reserved → book the promise of sale |
| Home picker | `units[]`; the default is the held unit | Issue units |
| Deposit text | `unit.pay[0].pct × unit.price` | Payment plan, computed |
| Rep card: WhatsApp, call, email | `rep.whatsapp`, `rep.phone`, `rep.email` | Rep profile |
| Reserve sheet: steps | `unit.pay[0]`, `unit.handover`, `unit.hold` | Payment plan, programme, hold |
| Reserve sheet: name | `buyer.first`, `buyer.last` | Contact (pre-filled, editable) |
| Reserve request (output) | name, channel, message, unit id | **Writes to the CRM:** creates a reservation request task on the opportunity for the rep. It does not reserve automatically |
| Downloads | `downloads[] [name, detail]` | Issue outputs: proposal PDF, floor plans, spec, price list |
| Legal text | `legal` | `CP_STD` legal footer (account setting, locked for reps) + the issue's valid-until date |
| Footer line | `buyer`, `version`, `issued`, `validUntil` | Issue |

**Live exceptions to the snapshot:** (1) reservation state and (2) unit availability ("No longer available" if the home is sold or held for someone else). Everything else stays frozen.

## 12. Buyer type (persona) mapping

`buyer.type` picks the persona copy in `PROPOSAL_PERSONAS`: purpose, Location title and compare rows. It also decides which extra home tab appears (Investment or Value).

| `buyer.type` | CRM buyer type (`CR_BUYER_TYPES`) | Extra |
| --- | --- | --- |
| `first` | First home | — |
| `investment` | Investment property | **NEW** `investGoal = rental` |
| `growth` | Investment property | **NEW** `investGoal = growth` |
| `second` | Second home | — |
| `relocation` | Relocation | — |

## 13. Engagement events (page → CRM)

`track()` in proposal.js. In the prototype these show under **Prototype → What Sam sees**. In production they post to the opportunity timeline and feed `cpEngLine`.

| Event | When |
| --- | --- |
| `Opened proposal` / `Returned to proposal` | Intro finishes |
| `Viewed · {section}` | A page section or panel tab is 35% or more in view (each one is logged once) |
| `Opened · {development or home}` | A panel opens |
| `Panel tab · {tab}`, `Gallery · {unit}`, `Compare · {tab}` | Taps |
| `Reserve opened · {unit}`, `Reservation requested · {unit}` | Reserve sheet |
| `Asked about · {unit}` | "Ask {rep}" |
| `Downloaded · {file}` | Downloads |
| `WhatsApp tapped`, `Call tapped`, `Email tapped` | Rep card |
| `Floating action · {label}`, `Promise of sale booking opened` | Calls to action |

## 14. Checklist of new data (gaps to build)

| Field | Lives on | Used in |
| --- | --- | --- |
| Cover image | Developer settings | §4 |
| Track record stats, delivered projects, promises | Developer record | §10 |
| Tagline | Development | §8 |
| POIs tagged by persona, with travel time and image | Development | §7, §8 |
| Programme milestones with dates | Development | §6, §8, §9 |
| Progress photos with the date taken | Development | §8 |
| Payment plan template (stages and %) | Development | §9, §11 |
| Rental estimates, occupancy, service charge (with source and date) | Development, per typology | §7, §9 |
| Price per m² history (launch and today) | Development | §7, §9 |
| `requirements[]` with `answeredBy` | Opportunity (from Meet intel) | §4 |
| `investGoal` | Opportunity | §12 |
| Per-unit rep note | Pack issue | §9 |
| Rep photo (optional) | Rep profile | §5 |
| Unguessable 22-character token | Pack issue | Link |
| `template` | Pack issue | Rendering |
