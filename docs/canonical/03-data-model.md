# 03 — Data Model

**Status:** Canonical · Updated 2026-08-13 · Ground truth: v2 prototype JS data structures, reconciled with `source/Bricly-MVP.md` (15-entity locked MVP) and `source/bricly-data-model.md` (32-entity ideal model)

How to read this doc: the **prototype** demonstrates the product with lightweight JS structures; the **MVP entity model** (locked) is what the dev team implements; the **ideal model** is where each entity grows. Column 1 is what you can see running; column 2 is what you build.

---

## 1. Entity overview — three-way mapping

| Prototype structure | MVP entity (build this) | Ideal-model entity | Scope |
|---|---|---|---|
| implicit (single workspace) | **Workspace** | Workspace | [MVP] |
| `DEVS[]` | **Project** | Project (+ Building) | [MVP] (Building: Post-MVP) |
| `UNITS[]` | **Unit** | Unit | [MVP] |
| `CONTACTS[]` | **Contact** | Contact | [MVP] |
| `OPPS[]` + `EXT{}` | **Opportunity** | Opportunity (+ Offer) | [MVP] (Offer entity: Post-MVP; offer data lives on Opportunity in v1) |
| `EXT[].comms[]` | **Activity** | Activity + AuditEvent (collapsed) | [MVP] |
| `PERSONAS[].day[]`, `cvBuildEvents()` | **Appointment** | Appointment | [MVP] |
| blocker/approval strings in `EXT` | **ApprovalRequest** | ApprovalRequest | [MVP] |
| `curPersona`, `o.rep` names | **User** | User | [MVP] |
| `STAGES[]` (board) | **Pipeline** + **PipelineStage** | Pipeline (configurable) | [MVP] (hardcoded keys, renameable labels) |
| `EXT[].payments[]` | **PaymentMilestone** | PaymentPlan + PaymentMilestone | [MVP] (PaymentPlan entity cut) |
| `EXT[].docs[]` + `DOC_CHAINS` | **Document** | Document + Asset | [MVP] (Asset entity: v1.1) |
| toast/bell (simulated) | **Notification** | Notification | [MVP] |
| `o.tags`, contact tags | **WorkspaceTag** | WorkspaceTag | [MVP] |
| `S_PROJECTS`/brief wizard state | **StudioRequest** (fulfilment queue) | Brief + Asset + BrandKit + ConsultationSession | [MVP·concierge] — one simple entity in v1; splits into the ideal entities in v1.1 |
| `AU_WORKFLOWS[]`, `AU_TEMPLATES[]` | — (v1.2) | Campaign-adjacent automation engine | [v2-full] UI exists; engine is v1.2 |
| `MK_CAMPAIGNS[]` | — (v1.1+) | Campaign | [v2-full] UI exists |
| `prState`, `getExt(o).unitConfigs` | — (persist as JSON on Opportunity in v1 if Present ships) | ConsultationSession / personalised pack | [v2-full] |
| `trState` (tray), `cmpState` | — (client-side only) | — | [v2-full] |
| not in prototype | — | Partner, ConstraintModel, Persona, FinishPackage, ContentBackbone, Microsite, Commission, SyncEvent, Offer, + post-sale 5 (Reservation, Contract, CompletionMilestone, PurchaserPortalAccess, CollaborationSpace) | [Post-MVP] — 17 deferred entities per locked MVP |

## 2. Core entities in detail (as demonstrated by the prototype)

### 2.1 Unit (`UNITS`, 38 records)
```
{ id:'#CM9802', dev:'dolphin', type:'Apartment|Maisonette|Penthouse|Studio',
  floor, beds, baths, sqm, ext, price, status:'available'|'hold'|'sold',
  ready:'Q4 2026', views:[...feature tags] }
```
- MVP adds: `Reserved` and `Off_Market` states (prototype collapses reserved into hold), workspace-renameable status display labels, multi-valued tags, file refs.
- Unit IDs are shared with opportunities (`o.units`) — a unit knows its deals via live scan (`unDealsFor`), i.e. the join lives on Opportunity.

### 2.2 Development / Project (`DEVS`, 5 records)
```
{ id:'dolphin', name:'Dolphin Court', loc:'Paola', lat, lng, tag, photo,
  completion:'Q4 2026', about, dist:[[label, time]...], amen:[...],
  media:{ renders:{ext:[], int:[]}, photos:[{img,cap,tag:'Lifestyle'|'Location'}] },
  files:[{n,s,d}] }
```
Demo set: Dolphin Court (Paola), Mercury (St Julian's), La Lex (Sliema), Verdala (Rabat), Onyx Rise (Mriehel).
- MVP Project adds: states Draft/Active/Sold_Out/Archived, lead-capture URL fields, payment-milestone defaults.

### 2.3 Opportunity (`OPPS`, 21 records + `EXT` enrichment)
Board-level record:
```
{ id:'OPP-1001', lead:'Mike Gatt', dev, units:['#CM9802'], stage,
  budget (client estimate), value (offer), rep, source, tags:[],
  next:{d,t,label}, closed:{step:0-5, bank, deed, comm, paid, stalled?} }
```
`EXT[oppId]` rich journey data (`getExt(o)` synthesises fallback from board stage via `STAGE2J`):
```
{ jstage, done:[], next:{label,due,overdue}, date:{label,value,in,tone},
  blocker, offer:{amt,status,plan:'10/20/70',deposit}, buyer:{email,phone,type},
  comms:[{ch:'wa'|'sms'|'em'|'note'|'sys', dir, who, t, text, pinned?}],
  keyDates:[], payments:[{label,amt,due,status}],
  docs:[{id,g:'KYC'|..., label, flow:'sign'|'kyc'|'file', status, file, hist:[]}],
  bids:[], unitConfigs:{[unitId]:{fin,lay,adds,price}} }
```
- **`money(o)` rule:** display Budget (~approx) before commitment, Offer from `COMMIT_STAGES` (Negotiating, Reservation, Closed Won) — carry this into the real model as a derived display rule, not two stored "values".
- MVP Opportunity adds: multi-rep co-agency array, commission splits, contract status flags.

### 2.4 The stage model — board vs journey ⚠️ (most important design fact)

The prototype presents **one state machine in two projections**:

**Board columns** (`STAGES`, 7): `New Lead → Qualified → Contacted → Viewing Booked → Negotiating → Reservation → Closed Won`

**Buyer journey** (`JOURNEY`, 12 stages, 2 phases):
| Phase | Stages | Notes |
|---|---|---|
| **A — Selling** | lead → qualified → viewing_booked → viewing_held → negotiating | ends at the ◆ **"Offer accepted" gate** |
| **B — Deal** | hold → reservation → kyc → pos → payments → deed → handover | "Deal Room" UI unlocks in Phase B |

Each journey stage carries: `label`, `phase`, `cta` (primary next action), `req[]` (checklist), `guide` (one-line coaching), optional `dateLabel` (Viewing / Offer expiry / Hold expires / POS target / Final deed deadline / Next payment / Deed date / Delivery). Maps: `STAGE2J` (board→journey) and `J2STAGE` (journey→board).

**Reconciliation with the locked MVP's "14 stages":** the MVP's 10 forward stages + 4 branch states (Closed Lost, Paused, Cold, Unreachable) ≈ the 12 journey stages + lifecycle field. Differences: the journey adds `viewing_held`, `kyc`, `payments`, `deed` as explicit stages and drops `Contacted` as separate (folded into qualified). **Recommendation for the build: implement the 12-stage journey as the internal state machine (hardcoded keys, renameable labels) + a `lifecycle` branch field (active/paused/cold/lost/unreachable), and render the board as a configurable column grouping.** This satisfies both docs and matches what users saw in the prototype.

**Post-sale tracker:** Closed Won opps get `o.closed` with a 5-step completion stepper (`CLOSED_STEPS`): POS signed → Bank approval → Notary searches → Final deed → Commission paid. In the MVP model this is PaymentMilestone + contract flags + (v1.2) Commission.

### 2.5 Contact (`CONTACTS`, 32 records)
19 derived from opportunities (buyers) + 13 explicit network records (notary, agency partners, suppliers, cold/DNC demo leads). Fields: identity, type, status, source, rep, budget, tags, finance status, consent/DNC flag, linked deals.
- MVP: universal person record, 8 schema states (5 wired in UI), `opt_out` boolean, preference_profile, WorkspaceTag-powered tagging. The prototype's "network contacts" foreshadow the Partner entity **[Post-MVP]** — in v1 they're just Contacts with a type tag.

### 2.6 Documents (`EXT[].docs` + `DOC_CHAINS`)
Three lifecycle chains: `sign`: required→uploaded→sent→viewed→agreed→signed · `kyc`: required→received→verified · `file`: required→filed. Every transition appends to `hist[]` (audit) and emits a `sys` comm. Default seed = 6 docs per opp (`DOC_DEFAULTS`). This is a good v1 spec for Document state machines — keep the per-flow chains and audit rows.

### 2.7 Automations (`AU_WORKFLOWS` — UI is v2-full, engine is v1.2)
```
{ id, name, trigger:'New Lead Captured'|'Tag Added'|'Viewing Completed'|'Price Drop'|'No Reply After 3 Days'|'Hold Expiring Soon',
  steps:['Send WhatsApp','Wait 1 Day','Send Email','Notify Rep','Change Pipeline Stage',...],
  active:n, channel, status:bool, integration:'whatsapp'|'email'|'meta' }
```
Linear step lists only — no branching (deliberate scope cut). Integration key links to Settings cards ("Used by N automations").

### 2.8 Studio request (prototype Studio workspace)
Brief wizard output: brief type (Launch Package / Asset Request / Brand Consultation / Personalisation) + development + services + buyer context + style direction + timeline. Delivery statuses: **Requested → In production → Delivered** (+ Revision Requested in the MVP doc). v1 = single `StudioRequest` entity + internal fulfilment queue; v1.1 splits into Brief/Asset/BrandKit/ConsultationSession per the ideal model.

## 3. Relationships (v1)

```
Workspace 1─* User, Project, Contact, WorkspaceTag
Project   1─* Unit, Document
Contact   1─* Opportunity, Activity, Appointment, Document
Opportunity *─* Unit (units[] array; primary unit first)
Opportunity 1─* Activity(comms), PaymentMilestone, Document, ApprovalRequest
Opportunity ─1 Pipeline stage (12-key state machine + lifecycle)
StudioRequest ─1 Project, ─? Opportunity/Unit (personalisation), 1─* Document (delivered assets)
ApprovalRequest ─1 target (Unit hold/reservation, price exception)
```

Cross-propagation rule (from Sale & Inventory Update flow, **[MVP]**): when a Unit → Sold, it is removed from all other opportunities' shortlists, counters update, affected reps notified.

## 4. State machines summary (v1)

| Entity | States |
|---|---|
| Unit | Available → Held → Reserved → Sold (+ Off_Market) — hold/reserve transitions gated by ApprovalRequest |
| Opportunity journey | 12 keys above + lifecycle: active/paused/cold/lost/unreachable |
| ApprovalRequest | Pending → Approved / Rejected (types: hold, reservation, price_exception) |
| Document | per-flow chains (§2.6) |
| StudioRequest | Requested → In Production → Delivered (→ Revision Requested → In Production) |
| PaymentMilestone | Pending → Paid (manual updates only in v1) |
| Project | Draft → Active → Sold_Out → Archived |

## 5. What the ideal model adds later (pointer)

v1.1: Asset, Brief, BrandKit, Persona, ConstraintModel (CAD-to-JSON), Microsite, Marketing-Lead surfaces. v1.2: Partner, Commission, automation engine, DocuSign/Stripe. v2+: post-sale layer (Reservation, Contract, CompletionMilestone, PurchaserPortalAccess, CollaborationSpace), ConsultationSession, forecasting. Full definitions: `source/bricly-data-model.md`.
