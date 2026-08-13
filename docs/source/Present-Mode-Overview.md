# Bricly Present Mode — Project Resource

> An interactive, agent-led buyer showroom built into the Bricly CRM prototype. Present Mode turns a laptop or iPad into a car-showroom-style experience for presenting developments to potential buyers — 3D building models, cinematic renders, live unit customisation, and a one-tap handoff back into the CRM.

**Live demo:** https://samurpani.github.io/brickly-prototype/prototypes/Bricly_CRM_Prototype.html
**Repository:** https://github.com/Samurpani/brickly-prototype

> All data in the prototype is fictional. The repo is public so the link can be shared freely.

---

## 1. What it is

Present Mode is a full-screen "takeover" experience an agent launches during a consultation with a buyer. Instead of scrolling a spreadsheet of units, the agent walks the buyer through developments visually and interactively, then saves the session and sends a branded follow-up — all without leaving the CRM.

Think of it as the difference between handing someone a brochure and walking them around a showroom.

---

## 2. How an agent starts it

There are two entry points:

| From | How | What happens |
|------|-----|--------------|
| **An opportunity** | Open any opportunity → **Quick actions → ▶ Present to buyer** | Pre-loads the buyer's name, their development, and flags their shortlisted units as "ON FILE" |
| **The Studio** | Switch to the Operations role → Studio → **▶ Present mode** tab | Starts a fresh presentation with no buyer pre-loaded |

Pressing **Exit ✕** (top-right) or `Esc` returns to the CRM at any time.

---

## 3. The five stages

Present Mode is a guided flow shown as a step tracker along the top: **Developments → Showroom → Unit studio → Compare → Save & send.** The agent can move forward or jump back at any point.

### Stage 1 — Developments (the consultation screen)
A split screen designed for a live conversation with the buyer.

- **Left:** large **+/− filters** the agent adjusts as the buyer talks — bedrooms, max budget, locations, and must-have features (sea views, terrace, parking, pool, gym…). Development cards update instantly, and non-matching developments dim out.
- **Right:** a stylised **live map of Malta**. Matching developments appear as pulsing pins with their "from" price; as the filters change, the map re-lights in front of the buyer.
- **Tap any card or map pin** to step into that development's showroom.
- If launched from an opportunity, the buyer's best-fit development is badged **★ Recommended**.

### Stage 2 — Showroom (the 3D model)
The centrepiece. The left side shows the building; the right side is a live inventory and highlights panel.

- **Interactive 3D model** — drag to orbit 360°, scroll to zoom. Units are colour-coded (available / on hold / sold). **Hover** a unit for a price-and-spec tooltip; **click** it to fly in and open it.
- **Benefit hotspots** pinned to the building (pool deck, harbour views, gym…) expand into story cards.
- **Day / Dusk lighting** toggle for atmosphere.
- **◇ Interactive ↔ ✦ Cinematic** toggle — switch the model for full-screen, high-production concept renders (dusk exterior, pool deck, lobby, aerial) the buyer can flick through.
- **Right panel tabs:**
  - **Units** — the full inventory with quick filters plus an **⚙ advanced filter** panel (bedrooms, bathrooms, features).
  - **Highlights** — location distances, lifestyle photography, selling-point cards, and nearby schools.
- **"More about the project"** button slides up a swipeable story sheet with modules for Location, Schools & family, Lifestyle, Why {development}, The numbers (yield / growth / ready date), and a concept gallery.

### Stage 3 — Unit studio (live customisation)
Clicking a unit opens its own studio, where the buyer configures it live:

- **Interactive floor plan** that redraws as the layout changes (open vs. closed kitchen, study conversion).
- **Finish palettes** (Signature Oak, Nordic Stone, Urban Slate) that swap the render photo instantly.
- **Upgrade packs** (furniture, smart home, premium appliances).
- A **price ticker** updates in real time as options change, and the unit can be **added to the buyer's shortlist**.

### Stage 4 — Compare
A side-by-side view of every shortlisted unit — each carrying the exact configuration and price the buyer chose — so they can weigh options at a glance.

### Stage 5 — Save & send (the handoff)
Wraps the session and pushes everything back into the CRM:

- **Associate with an opportunity** (existing or newly created).
- **Save the session** — the shortlist, configurations, viewed units, and a note all land on the opportunity file, with an activity entry.
- **Generate a branded buyer link** — a shareable microsite URL that also appears in the opportunity's Marketing Collateral.
- **Generate a personalised brochure** — routed into the Studio fulfilment flow.
- **Finish** drops the agent straight onto the opportunity record.

---

## 4. Presenter conveniences

- **Hide prices** toggle — blur all pricing for sensitive moments in a conversation.
- **Buyer chip** — shows who's being presented to, and pre-loads their shortlist.
- **Keyboard `Esc`** steps back one level at a time (closes a card → closes the sheet → exits cinematic → previous stage).
- **Touch-friendly** — designed for iPad use: large tap targets, arrow buttons on the story sheet rather than relying on scroll.

---

## 5. What's real vs. representative in the prototype

Present Mode is a working prototype, so a few things are illustrative:

- **Real:** the 3D model (generated live from the unit data), all filtering and matching logic, live price calculation, shortlist, session save, and the CRM handoff — these all genuinely work.
- **Representative:** the photography is licensed **stock imagery used as placeholders** (in `prototypes/assets/present/`). Swapping in real project photos is a drop-in replacement — same filenames, no code changes. Behind every photo is a generated illustration that shows automatically if an image is ever missing.
- **Representative:** cinematic "renders" and the live render preview are styled concept images, not final CGI.
- The floor plan is an interactive schematic (so it can react to layout changes), not a to-scale architectural drawing.

---

## 6. Technical notes (for the build team)

- **Where it lives:** built into `prototypes/Bricly_CRM_Prototype.html` as a self-contained full-screen overlay. All code is namespaced `pm*` (CSS classes and JS functions).
- **3D engine:** [three.js](https://threejs.org) (r128), loaded on demand from a CDN. The building is generated procedurally from the unit data — no 3D asset files required.
- **Imagery:** 22 stock photos in `prototypes/assets/present/`, layered over SVG fallback scenes.
- **No build step:** it's a single HTML file — open it in any modern browser (or the live link) to run it.
- **Design language:** warm, light "clay showroom" aesthetic — cream backgrounds, white glass cards, an orange→amber accent, and a dark charcoal for primary actions.

---

## 7. Roadmap ideas (not yet built)

- Replace placeholder stock imagery with real development photography and CGI renders.
- Feed the "from" prices and availability from live inventory rather than the prototype dataset.
- Make the branded buyer link a real, trackable microsite.
- Wire the brochure generator into the actual Studio fulfilment pipeline.
- Add per-development real floor-plan data behind the interactive schematic.

---

*Document prepared as a project resource for the Bricly team. For the interactive experience, open the live demo link at the top of this page.*
