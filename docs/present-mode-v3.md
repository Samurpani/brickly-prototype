# Present Mode v3

Prototype: [prototypes/v3/Bricly_OS_Prototype_v3.html](../prototypes/v3/Bricly_OS_Prototype_v3.html). v3 is a self-contained copy of v2; v2 links are unchanged.

Sources: Figma *Bricly DS 1.2* flow (node 15055:10531), Glass V2 components and themes (node 15037:10388), the Availability List and Unit Page v2 designs.

## Entry points
| From | Opens |
|---|---|
| Sidebar **Present** (`prOpenLobby`) | Welcome → Loading Developments → Gallery |
| Development (`prOpenDev`, Developments toolbar, development peek, hub) | Loading {development} → Presentation |
| Unit (`prOpen`) | Loading {development} → Unit page |
| Opportunity (`qaPresent`, `PM.presentOpportunity`) | Presentation of the opportunity's developments, with the opportunity already linked |

The pre-presentation questions are not part of v3 yet.

## Flow
1. **Gallery** (Glass V2 Dark, Light or System): carousel or grid, Filters (location, bedrooms, type, price histogram, features). Opening Filters zooms the showcase out into a tile view of every development. Tiles that stop matching blur and fade as you filter, including live while you drag the price range. Applying (the *Show* button, Esc, clicking outside, or clicking a matching tile) zooms back into the first match, or the tile you clicked, in the full-screen showcase. Also: ✓ to queue, ↗ Overview, Presentation Queue (drag to reorder), Ask Bricly AI (simulated; it sets filters), Search, and **Present selection**.
2. **Presentation**: each development loads its own brand (colours, display face, logo; see `BRANDS` in `present-v3-data.js`). It runs as a full-screen slideshow with no scrolling. Use ↑/↓, ←/→, Page Up/Down, the mouse wheel, a swipe or the stepper to move between slides; each slide plays its own entrance. The development's logo slide is its loading screen and moves on to the Introduction by itself. Navigation uses dark glass chips: Home, Development switcher, Page switcher and *N Selected*. The slides are Introduction, Lifestyle (draggable carousel), Amenities, Location (hoverable points), Residences (grouped as Maisonettes, Apartments, Penthouses and Duplexes, each with a render and *from* prices by bedroom), Units and Availability (list or By floor, **+** adds to the selection), Gallery (opens a lightbox) and Plans.
3. **Unit page**: Plan (pan, zoom, rotate), Renders (room switcher, plus a layout / finish / style picker), Views, and Finishes. The glass detail card shows Details, Room schedule and Where it sits. **Add to selection** carries the layout, finish and style. The finish changes the price. Renders and Views tabs only show when the unit has content for them.
4. **Selected units** panel: available across developments. Tick up to four units to **Compare**.
5. **Compare** → **Finish presentation** → buyer-safe **Thank you** screen. The rep confirms *Screen turned away* before any CRM data shows.
6. **Checkout** (rep only): link to an existing opportunity, a contact, or a new buyer (this creates the contact and opportunity). Units, finishes and activity are written to the opportunity. The **share link** is created automatically. Copy, WhatsApp and email (simulated), PDF and Preview are available, with toggles for prices and the comparison.
7. **Buyer link** (`#present=<id>`): the selection, grouped by development in each brand, with an optional comparison.

## Sales layer (`present-v3-sales.js`)
Built from the product review of off-plan practice (Dubai, Florida, EU/Malta): what buyers need before reserving, and what the developer needs back.
- **Market terms**: each development has its own currency and area unit (`COMMERCE` in `present-v3-data.js`; Miami in USD and sq ft, Malta in EUR and m²). Always format through `P.fmt(n, unitOrDev)`, `P.ar(m2, unitOrDev)` and `P.ppa(...)`. A display currency (Local, €, $, £, AED) converts approximately, marked ≈.
- **Hide prices live**: *Hide prices* in the Pages panel, or Shift+P. Shows *Price on request* everywhere the buyer can see. Checkout (rep only) always shows prices.
- **Payment & ownership slide**, plus *Payment plan* and *Ownership costs* on the unit card: stages with amounts, deposit protection (escrow, or the notary on the promise of sale), completion and grace period, service charges or HOA dues, estimated yield and the developer's track record.
- **Hold for 48 hours** on the unit page. The unit goes *On hold* for everyone (other tabs update live), with a countdown, release, and *Send reservation agreement* (simulated) in checkout. Holds lapse automatically.
- **Live inventory**: statuses are re-checked every second. A selected unit sold or reserved elsewhere is flagged once, and left out when the share link is created.
- **Resume**: the session is snapshotted on every change. A reload within 30 minutes restores the presentation where it was.
- **Illustration labels**: *Artist's impression* on renders, *Indicative plan* and *Indicative view* labels, plus a contract disclaimer on the buyer link.
- **Consent**: a new buyer's WhatsApp and email consent is captured at creation. Sends stay disabled until consent is recorded; recording verbal consent is logged.
- **Link expiry and price validity**: 7, 14 or 30 days. Expired links ask the buyer to contact their advisor. The buyer link opens in the presentation language.
- **Signals**: time per slide and per unit, opens, compares, finishes chosen and holds. Shown in checkout (rep only) and written to the opportunity. **Presentation insights** (gallery settings) aggregates interest across presentations to inform pricing. Buyer-link opens and time per unit are recorded back to checkout.
- **Live view**: *Share a live view* (Pages panel) creates `#present-live=<session>`. Viewers follow slide by slide, read-only. Rep-only screens show *One moment*.
- **Partner mode**: *Partner presentation link* (gallery settings) creates `#present-partner=<id>` for brokers. Partners see only the chosen developments and no CRM, and finish by registering their client. The client is created with source *Partner: name* and protected for 90 days.
- **Walkthrough slide**: a cinematic preview slot for a 3D tour.
- **Compare → close**: a *Residences* / *Payments & value* tab (stage amounts, ownership costs, rent and yield side by side). *Choose this one* on a residence opens **Secure your residence**: hold 48 hours, buyer details (entered by the buyer, no CRM lists), reservation agreement, book the promise of sale or contract signing (moves the opportunity to *Contract Booked*), then send the proposal.
- **Unavailable residences** (sold, reserved, held for someone else) can't be added to a selection; the + becomes a disabled marker.
- **Close** (×) sits top right on every Present Mode screen; the session is saved and can be resumed.
- **Amenities** is a slider: the list on the left selects the slide; each amenity has a render and a line for the rep (`amenityItems` in `present-v3-data.js`).
- **Payment & ownership** right column: *Timeline and Details of the Project* (milestones from `COMMERCE.timeline`), revealed after the payment steps.
- **Presenter preferences**: quick start (shorter intro), language for buyer-facing labels (EN, FR, DE, IT, 中文), and **buyer focus** (Investor brings Payment & ownership and availability forward).
- **White-label welcome**: the company (or partner) brand leads; *Powered by Bricly* is a quiet credit. The gallery's queue pill now reads *N in presentation*.

Prototype limits: holds, live view, partner links and buyer engagement work across tabs of the same browser (localStorage and BroadcastChannel); WhatsApp, email and the reservation agreement are simulated; exchange rates and yields are indicative.

## Unit renders and views (from Edit development)
Everything on the unit page comes from the development's **published** content in Edit development. Nothing is hard-coded per unit. The model lives in `unit-media.js` (`UM`):

- **Interiors catalogue** (ED06): rooms, layouts, finish packs and styles. Rooms and layouts have a rule (every unit, 1+/2+/3+ bedrooms, outdoor space), so each unit gets its own list automatically. Each pack lists the styles it offers.
- **Render**: a Media asset with `cat:'Render'`, a `room`, and optional `layouts` / `packs` / `styles` tags (an empty list means any). It's scoped through `units` / `types` (both empty means the whole development).
- **View**: a Media asset with `cat:'View'`, a direction (`orient`), the room it's seen from (`room`) and an optional floor range (`fmin` / `fmax`).

Editing: in the unit drawer, **Renders** shows one row per room with a *Preview as a buyer sees it* bar (layout, finish, style). Upload into a room to open the tagging sheet, which defaults to all units of the same type. Filenames such as `kitchen_riviera_coastal_2-bed.jpg` pre-fill the tags, both there and in bulk uploads (Media, Uploads). **Views** lists the views that apply, plus library views to link.

Resolution (`UM.pick`): unit-specific renders beat type renders, which beat development renders, and exact tags sort before "any". If no render exists for the buyer's chosen option in a room, that room keeps showing the default option, so the images don't change. The render picker only offers options that have their own renders. Buyers can still pick any finish on the Finishes tab.

## Level plans (where a unit sits on its floor)
Model in `level-plans.js` (`LP`). A **level plan** is one drawing covering a floor range, with labelled unit outlines. Units match automatically: either the outline label equals the unit reference (`CM1207` → `#CM1207`), or it equals the digits after the floor number (`03` on floor 32 → `AP.3203`). Exceptions are fixed in the unit drawer's **Location** tab, which is stored in the draft as `placements[unitId]`:
- Pick an outline. If it's taken, swap the two units.
- Draw an outline for this unit only.
- Mark the unit as not on a plan (a reason is required).
- Reset to automatic.

ED05 lists the plans, their floor ranges and the units that need placing. Present's **By floor** view draws units on their published outlines. Review flow: `docs/flows/level-plans/index.html`.

## Files
`present-v3.css` (Glass V2 tokens and screens) and the scripts, in load order: `unit-media.js` and `level-plans.js` (loaded before `dev-editor.js`), `present-v3-data.js` (brands, Miami Tropic inventory and content), `present-v3.js` (state, shell, entries), `-gallery`, `-brochure`, `-unit`, `-checkout`, `-sales`. Storage keys: `bricly.present.v3` (sessions, holds, inventory, links, partners) and `bricly.present.prefs` (quick start, language, currency).

Tests: `npx playwright test tests/present-v3.spec.cjs tests/present-v3-sales.spec.cjs --reporter=line`
