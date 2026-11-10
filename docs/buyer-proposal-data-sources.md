# Buyer proposal: screen by screen

**What this is:** the page a buyer opens from the link a rep sends (`bricly.mt/p/{token}`).
**Who it's for:** developers building it.
**For each screen you get:** a screenshot, what it does, and where every piece of data comes from.

- Live prototype: [open the proposal](https://samurpani.github.io/brickly-prototype/prototypes/v3/proposal/)
- Code: [proposal-data.js](../prototypes/v3/proposal/proposal-data.js) (the data) · [proposal.js](../prototypes/v3/proposal/proposal.js) (the screens)
- Full plan: [buyer-proposal-plan.md](buyer-proposal-plan.md)

> **NEW** = the CRM doesn't store this yet. It needs building.

---

## Contents

1. [The 4 rules](#1-the-4-rules)
2. [How the link works](#2-how-the-link-works)
3. [How the buyer moves through the page](#3-how-the-buyer-moves-through-the-page)
4. [Screens](#4-screens)
   - [4.1 Intro](#41-intro) · [4.2 Cover](#42-cover) · [4.3 Letter](#43-letter) · [4.4 Your selection](#44-your-selection) · [4.5 Side by side](#45-side-by-side) · [4.6 Built on trust](#46-built-on-trust) · [4.7 Next step](#47-next-step) · [4.8 Footer](#48-footer) · [4.9 Top bar and floating button](#49-top-bar-and-floating-button)
5. [Development panel](#5-development-panel)
6. [Home panel](#6-home-panel)
7. [Reserving a home](#7-reserving-a-home)
8. [Buyer type changes the page](#8-buyer-type-changes-the-page)
9. [What the rep sees (tracking)](#9-what-the-rep-sees-tracking)
10. [Where data comes from: the CRM records](#10-where-data-comes-from-the-crm-records)
11. [What needs building (NEW fields)](#11-what-needs-building-new-fields)

---

## 1. The 4 rules

1. **Freeze it.** When the rep sends, everything is copied into a snapshot. The page reads only the snapshot. It never queries the CRM.
2. **Only 2 things stay live:** the reservation state and whether a home is still available.
3. **Calculate, don't store.** Yields, € payment amounts, price per m², "lowest price" and handover date are worked out on the page from the stored numbers.
4. **Brand from tokens.** The developer's brand wraps the page. Each development's box, panel and comparison column use that development's own brand (`BRANDS`).

---

## 2. How the link works

![Diagram](proposal-screens/flow-link.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
flowchart LR
  A[CRM records] --> B[Rep builds the pack<br/>Custom pack wizard]
  B --> C[Rep presses Send]
  C --> D[Snapshot frozen<br/>= one issue, one version]
  D --> E[Link created<br/>bricly.mt/p/token]
  E --> F[Sent by WhatsApp or email]
  F --> G[Buyer opens the link]
  G --> H[Page renders from the snapshot]
  H --> I[Buyer actions sent back<br/>to the opportunity timeline]
```

</details>

| Step | Where it lives today |
| --- | --- |
| Rep builds the pack | [custom-pack.js](../prototypes/v3/custom-pack.js) (`crOpen`, `cpUnitDetails`) |
| Link created and sent | [client-share.js](../prototypes/v3/client-share.js) (`swLink`, `swAssets`) |
| Expiry (30 days), price wording, legal text | `CP_STD` in custom-pack.js |
| Buyer actions on the timeline | `cpEngLine` in custom-pack.js |

---

## 3. How the buyer moves through the page

The page is short. Details open in a **side panel** so the buyer never loses their place.

![Diagram](proposal-screens/flow-journey.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
flowchart TD
  Intro[Intro<br/>~2 seconds] --> Cover
  Cover --> Letter
  Letter --> Selection[Your selection]
  Selection --> Compare[Side by side]
  Compare --> Trust[Built on trust]
  Trust --> Next[Next step]
  Next --> Footer[Downloads and legal]

  Selection -- tap a development --> DevPanel[[Development panel]]
  Selection -- tap a home --> HomePanel[[Home panel]]
  Compare -- tap a home --> HomePanel
  DevPanel -- tap a home --> HomePanel
  HomePanel -- Reserve this home --> Reserve[[Reserve sheet]]
  Next -- Reserve this home --> Reserve
  Float([Floating button]) -.-> Reserve
```

</details>

---

## 4. Screens

### 4.1 Intro

![Intro](proposal-screens/01-intro.jpg)

**What it does:** plays for about 2 seconds, then fades into the page. Tapping skips it. A returning visitor sees "Welcome back" and a shorter version.

| On screen | Comes from |
| --- | --- |
| Background colour, logo | Developer brand (`BRANDS`) |
| "Mike" | Contact: first name |
| "Prepared by Sam Borg" | Rep: name |
| "Welcome back" | The browser has seen this link before |

---

### 4.2 Cover

![Cover](proposal-screens/02-cover.jpg)

**What it does:** shows the buyer that this was made for them: their brief on the left, their goals on the right.

| On screen | Comes from |
| --- | --- |
| Photo | Developer settings: cover image **NEW** |
| Logo | Developer brand |
| PR-1001-2 · date | Issue: number + version, send date |
| Mike Gatt | Contact |
| Looking for | Opportunity: requirements (typology, outdoor space) |
| Budget | Opportunity: budget range. **Hidden by default.** The rep must turn it on |
| Handover | Opportunity: move-in date wanted |
| Purpose | Opportunity: buyer type (see [§8](#8-buyer-type-changes-the-page)) |
| Areas | Opportunity: preferred areas |
| Your goals (5 rows) | Opportunity `requirements[]` from meeting notes **NEW**. Top line = what the buyer said. Bottom line = the rep's short answer |
| Prepared by · Contact | Rep |
| Developments | Development names in the issue |
| Prices valid until | Send date + 30 days (`CP_STD.expiry`) |

**Rule:** the title says "Your requests" instead of "Your goals" when the buyer came from an enquiry.

---

### 4.3 Letter

![Letter](proposal-screens/03-letter.jpg)

**What it does:** a short personal note from the rep.

| On screen | Comes from |
| --- | --- |
| SB · Sam Borg · role | Rep profile (photo **NEW**, optional) |
| First line | Picked from how the buyer reached us (below) |
| Paragraphs | Rep writes them in the pack builder. 80 words or fewer |
| Signature | Rep first name |

![Diagram](proposal-screens/flow-letter-opening.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
flowchart LR
  L[Last touchpoint on<br/>the opportunity] --> V{Type?}
  V -- Viewing --> A["Mike, thank you for coming to see<br/>Dolphin Court on Saturday."]
  V -- Call --> B["Mike, thanks for the call on Saturday."]
  V -- Enquiry --> C["Mike, thanks for getting in touch<br/>about Dolphin Court."]
```

</details>

---

### 4.4 Your selection

![Your selection](proposal-screens/04-selection.jpg)

**What it does:** one box per development, in that development's brand. Its homes sit inside the box.

| On screen | Comes from |
| --- | --- |
| Box colours, logo | Development brand (`BRANDS`) |
| "2 homes · Handover Q2 2027" | Counted from the issue · last milestone in the programme |
| Development photo | Development hero image (approved) |
| "72% built" | Development: construction progress |
| Home photo | Unit media (`UM`): first approved render for the chosen layout and finish |
| Status pill | See below |
| Name · beds · m² · level · view | Unit record |
| Price | Unit price **when the link was sent**, in the development's currency (`COMMERCE`) |

![Diagram](proposal-screens/flow-home-status.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
flowchart LR
  S{Home status} --> R[Reserved for you]
  S --> Q[Reservation requested]
  S --> H[On hold for you]
  S --> A[Available]
```

</details>

Order of checks: reserved for this buyer → buyer sent a request → unit is on hold → available.

---

### 4.5 Side by side

| Homes | Developments |
| --- | --- |
| ![Compare homes](proposal-screens/05-compare-homes.jpg) | ![Compare developments](proposal-screens/06-compare-developments.jpg) |

**What it does:** compares the homes or the developments. Hidden if there's only one home and one development. The best value in each row is highlighted.

**Homes tab:** the rows depend on the buyer type ([§8](#8-buyer-type-changes-the-page)).

| Row | Comes from |
| --- | --- |
| Price, internal area, terrace, floor, view | Unit record |
| Handover | Development programme |
| Estimated rent, occupancy | Development investment data **NEW** |
| Gross yield | Calculated: mid rent × 12 ÷ price |
| Price per m² | Calculated: price ÷ m² |

**Developments tab:**

| Row | Comes from |
| --- | --- |
| Location, homes, floors, amenities | Development record |
| Handover, build progress | Development programme and progress |
| Close by | Development places nearby, filtered by buyer type **NEW** |
| Price per m² today | Development market data **NEW** |
| Your homes here | Counted from the issue, with the lowest price |

---

### 4.6 Built on trust

![Built on trust](proposal-screens/07-trust.jpg)

**What it does:** shows why this developer can be trusted with a deposit.

| On screen | Comes from |
| --- | --- |
| 4 numbers (years, developments, homes, on time %) | Developer track record **NEW** |
| Delivered projects (photo, name, place, year) | Developer portfolio **NEW** |
| 4 promises (deposit, price, warranty, contact) | Developer settings **NEW**. Admin edits them. Reps can't |

---

### 4.7 Next step

This section changes with the reservation state. It's one of the 2 live things on the page.

| 1. Nothing reserved | 2. Request sent | 3. Reserved |
| --- | --- | --- |
| ![Choose a home](proposal-screens/08-next-step.jpg) | ![Confirming](proposal-screens/15-next-requested.jpg) | ![Book promise of sale](proposal-screens/16-next-reserved.jpg) |

![Diagram](proposal-screens/flow-next-step-states.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
stateDiagram-v2
  [*] --> NothingReserved
  NothingReserved --> RequestSent: Buyer sends a reserve request
  RequestSent --> Reserved: Rep confirms in the CRM
  Reserved --> [*]: Promise of sale booked
  NothingReserved: Choose a home + Reserve this home
  RequestSent: Rep is confirming (button disabled)
  Reserved: Book your promise of sale
```

</details>

| On screen | Comes from |
| --- | --- |
| State | **Live:** reservation state on the opportunity or deal |
| Home list | Homes in the issue. The held home is picked by default |
| Deposit amount | Calculated: price × first payment stage % |
| Rep card: WhatsApp, Call, Email | Rep profile |

---

### 4.8 Footer

![Footer](proposal-screens/09-footer.jpg)

| On screen | Comes from |
| --- | --- |
| Downloads (PDF, plans, spec, price list) | Files generated with the issue |
| Legal text | `CP_STD` legal footer (account setting, locked) + valid-until date |
| "Issue v2 · date · valid until" | Issue |

---

### 4.9 Top bar and floating button

![Top bar and floating button](proposal-screens/10-top-bar-and-floating-action.jpg)

**Top bar:** appears after the cover. It shows the logo, "Prepared for Mike Gatt" and "Talk to Sam". The thin line underneath fills as the buyer scrolls.

**Floating button:** appears after the cover and hides when the Next step section is on screen. Its label follows the deal:

![Diagram](proposal-screens/flow-floating-button.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
flowchart LR
  X{State} -- Reserved --> P[Book promise of sale]
  X -- Request sent --> T[Contact Sam]
  X -- A home is on hold --> H[Reserve unit<br/>opens that home's reserve sheet]
  X -- Otherwise --> O[Reserve unit<br/>scrolls to Next step]
```

</details>

---

## 5. Development panel

Opens when the buyer taps a development. The panel uses the development's brand. The strip at the top switches to any development or home in the proposal.

![Diagram](proposal-screens/flow-development-panel.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
flowchart LR
  O[Overview] --> A[Amenities] --> L[Location] --> P[Progress] --> H[Your homes]
  H -- tap a home --> HP[[Home panel]]
```

</details>

| Overview | Amenities |
| --- | --- |
| ![Overview](proposal-screens/11-dev-overview.jpg) | ![Amenities](proposal-screens/11-dev-amenities.jpg) |
| **Location** | **Progress** |
| ![Location](proposal-screens/11-dev-location.jpg) | ![Progress](proposal-screens/11-dev-progress.jpg) |
| **Your homes** | |
| ![Your homes](proposal-screens/11-dev-homes.jpg) | |

| Tab | On screen | Comes from |
| --- | --- | --- |
| Overview | Photo | Development media (approved) |
| | One-line tagline | Development **NEW** |
| | 4 facts (homes, floors, distance, handover) | Development record |
| | Story | Development description |
| Amenities | Name + photo | Development amenities |
| Location | Title | Fixed text per buyer type |
| | Places + travel time + photo | Development places nearby, each tagged with the buyer types it suits **NEW**. Only matching places show |
| Progress | % built, stage | Development progress |
| | Site photo + date taken | Progress photos **NEW** |
| | Timeline | Programme milestones **NEW** |
| Your homes | Home cards | Same as [§4.4](#44-your-selection) |

---

## 6. Home panel

Opens when the buyer taps a home. The bottom bar always shows the price, availability, **Ask Sam** and **Reserve this home**.

![Diagram](proposal-screens/flow-home-panel.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
flowchart LR
  O[Overview] --> R[Renders and views] --> F[Floor plan] --> B[In the building] --> P[Payment plan] --> I[Investment or Value<br/>only for investors]
  P -.-> RS[[Reserve this home]]
```

</details>

| Overview | Renders and views |
| --- | --- |
| ![Overview](proposal-screens/12-home-overview.jpg) | ![Renders and views](proposal-screens/12-home-views.jpg) |
| **Floor plan** | **In the building** |
| ![Floor plan](proposal-screens/12-home-plan.jpg) | ![In the building](proposal-screens/12-home-position.jpg) |
| **Payment plan** | **Investment** |
| ![Payment plan](proposal-screens/12-home-payment.jpg) | ![Investment](proposal-screens/12-home-investment.jpg) |

| Tab | On screen | Comes from |
| --- | --- | --- |
| Header | Development · level · name | Development, unit |
| Overview | Photo | Unit media (`UM`) |
| | Status | Same as [§4.4](#44-your-selection) |
| | Beds, baths, m², terrace, aspect, view | Unit record |
| | Rep's note on this home | Pack builder, per home **NEW** |
| Renders and views | Gallery | Unit media (`UM`): approved renders for the chosen layout and finish only |
| | Caption (layout · finish) | The rep's choice in the pack builder |
| | Views from the home | Unit media tagged as views |
| Floor plan | Drawing | Unit floor plan file. The prototype draws a generic one |
| | Room sizes | Unit room schedule |
| | Specification | The chosen finish pack |
| In the building | Which level | Unit level + development floor count |
| | Where on the level | Level plans (`LP`) |
| Payment plan | Stages (%, label, date) | Development payment plan + programme dates **NEW** |
| | € per stage | Calculated: price × % |
| Investment | Rent range, occupancy, service charge | Development investment data **NEW** |
| | Gross and net yield | Calculated. Net = (mid rent × 12 × occupancy − fees) ÷ price |
| Value (growth buyers) | Price per m² at launch and today | Development market data **NEW** |
| Bottom bar | Price | Unit price when sent |
| | "On hold until…" or "4 of 18 remain" | Unit hold record, or the live inventory count. **Real data only** |

---

## 7. Reserving a home

| Reserve sheet | After sending |
| --- | --- |
| ![Reserve](proposal-screens/13-reserve.jpg) | ![Sent](proposal-screens/14-reserve-sent.jpg) |

![Diagram](proposal-screens/flow-reserve.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
sequenceDiagram
  actor Buyer
  participant Page as Proposal page
  participant CRM
  actor Rep
  Buyer->>Page: Reserve this home
  Page->>Buyer: Sheet with 4 steps + name, channel, message
  Buyer->>Page: Send reservation request
  Page->>CRM: Reservation request (home, name, channel, message)
  CRM->>Rep: Task on the opportunity + notification
  Page->>Buyer: "Request sent. Sam will confirm by Friday"
  Rep->>CRM: Confirms and reserves
  CRM-->>Page: State is now Reserved
  Page->>Buyer: Book your promise of sale
```

</details>

| On screen | Comes from |
| --- | --- |
| Photo, price, beds, m², hold date | Unit, hold record |
| Step 3 deposit | Calculated: price × first payment stage % |
| Step 4 handover | Unit handover |
| Full name | Contact (pre-filled, editable) |

**Rule:** sending is a **request**. It never reserves on its own. The rep confirms.

---

## 8. Buyer type changes the page

The opportunity's buyer type picks the wording, the comparison rows and one extra home tab. Everything else stays the same.

![Diagram](proposal-screens/flow-buyer-type.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
flowchart TD
  T{Buyer type} --> F[First home]
  T --> I[Investment · rental]
  T --> G[Investment · growth]
  T --> S[Second home]
  T --> R[Relocation]
  I --> IT[+ Investment tab<br/>rent, yield, occupancy]
  G --> GT[+ Value tab<br/>price per m² over time]
```

</details>

| Buyer type | CRM value | Compare rows | Location title |
| --- | --- | --- | --- |
| First home | First home | price, size, terrace, floor, view, handover | Everyday life, close by |
| Investment · rental | Investment property + `investGoal = rental` **NEW** | price, rent, yield, occupancy, price/m², handover | What keeps rental demand high |
| Investment · growth | Investment property + `investGoal = growth` **NEW** | price, price/m², floor, view, handover | What's driving the area |
| Second home | Second home | price, view, terrace, floor, handover | Your days here |
| Relocation | Relocation | price, size, floor, handover | Schools, health and your commute |

---

## 9. What the rep sees (tracking)

Every action is sent to the opportunity timeline. In the prototype, open **Prototype → What Sam sees**.

![Diagram](proposal-screens/flow-tracking.jpg)

<details><summary>Diagram source (Mermaid)</summary>

```mermaid
flowchart LR
  B[Buyer action] --> E[Event] --> T[Opportunity timeline] --> N[Rep notification<br/>+ suggested next step]
```

</details>

| Event | When |
| --- | --- |
| Opened / Returned to proposal | The intro finishes |
| Viewed · {section} | A section is a third on screen (logged once) |
| Opened · {development or home} | A panel opens |
| Panel tab · Gallery · Compare | Taps |
| Reserve opened · Reservation requested | Reserve sheet |
| Asked about · {home} | "Ask Sam" |
| Downloaded · {file} | A download |
| WhatsApp / Call / Email tapped | Rep card |

---

## 10. Where data comes from: the CRM records

Which record feeds which screen (✓ = used):

| Record ↓ / Screen → | Intro | Cover | Letter | Selection | Compare | Trust | Next step | Footer | Dev panel | Home panel |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Opportunity | | ✓ | ✓ | ✓ | ✓ | | ✓ | | ✓ | ✓ |
| Contact | ✓ | ✓ | ✓ | | | | | ✓ | | |
| Rep | ✓ | ✓ | ✓ | | | | ✓ | | | ✓ |
| Developer | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | |
| Development | | ✓ | | ✓ | ✓ | | | | ✓ | ✓ |
| Unit | | | | ✓ | ✓ | | ✓ | | ✓ | ✓ |
| Unit media | | | | ✓ | ✓ | | | | ✓ | ✓ |
| Level plans | | | | | | | | | | ✓ |
| Pack standards | | ✓ | | | | | | ✓ | | |
| Issue | | ✓ | ✓ | ✓ | | | | ✓ | | ✓ |

| Record | What it gives | Prototype reference |
| --- | --- | --- |
| Issue | Number, version, link, dates, letter, chosen homes, layout and finish | `crState` (custom-pack.js), `swAssets` (client-share.js) |
| Opportunity | Buyer type, brief, goals, how they reached us, reservation state | `oppCur`, `buyerTypeFor` ([Bricly_OS_Prototype_v3.html](../prototypes/v3/Bricly_OS_Prototype_v3.html)) |
| Contact | Name | Contact on the opportunity |
| Rep | Name, role, phone, WhatsApp, email | Opportunity owner |
| Developer | Name, brand, cover, track record, promises | `BRANDS` ([present-v3-data.js](../prototypes/v3/present-v3-data.js)) |
| Development | Brand, photos, facts, story, amenities, places nearby, progress, programme, market data | `DEV(id)`, `deState(d).live` ([dev-editor.js](../prototypes/v3/dev-editor.js)) |
| Unit | Beds, baths, m², level, aspect, view, price, status, hold, rooms, spec | `UN(id)` |
| Unit media | Renders and views by room, layout and finish | `UM` ([unit-media.js](../prototypes/v3/unit-media.js)) |
| Level plans | Where the home sits on its level | `LP` ([level-plans.js](../prototypes/v3/level-plans.js)) |
| Pack standards | Expiry, price wording, legal footer, hide budget | `CP_STD`, `CP_DEFAULTS` ([custom-pack.js](../prototypes/v3/custom-pack.js)) |
| Currency and area unit | € / m² per development | `COMMERCE` (present-v3-data.js) |

---

## 11. What needs building (NEW fields)

| Field | Stored on | Used in |
| --- | --- | --- |
| Cover image | Developer settings | Cover |
| Track record, delivered projects, promises | Developer | Built on trust |
| Tagline | Development | Development panel |
| Places nearby, tagged by buyer type | Development | Compare, development panel |
| Programme milestones with dates | Development | Selection, panels, payment plan |
| Progress photos with date | Development | Development panel |
| Payment plan (stages and %) | Development | Home panel, reserve, next step |
| Rent, occupancy, service charge (with source and date) | Development, per typology | Compare, Investment tab |
| Price per m² at launch and today | Development | Compare, Value tab |
| Goals: `requirements[]` with what answers them | Opportunity (from meeting notes) | Cover |
| `investGoal` (rental or growth) | Opportunity | Buyer type |
| Rep note per home | Issue | Home panel |
| Rep photo (optional) | Rep profile | Letter |
| Secure 22-character link token | Issue | Link |
| Template name | Issue | Page layout |
