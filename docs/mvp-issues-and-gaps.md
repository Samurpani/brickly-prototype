# MVP Issues And Gaps

This document records the main product-definition issues I see before prototyping the MVP in earnest.

## 1. MVP truth vs ideal-state docs are mixed

Severity: High

The repo contains a locked MVP spec, but most of the surrounding flow, UI, data-model, and capability docs describe the ideal product rather than v1.

Impact:
- Easy to overbuild the prototype
- Easy to design screens around deferred entities
- Easy to spend time on the automated Studio instead of the concierge MVP

Action:
- Use `docs/source/Bricly-MVP.md` as the only controlling scope doc for v1
- Treat the other docs as future-state references unless explicitly narrowed

## 2. Pipeline definitions conflict across documents

Severity: High

The ideal sales flow and UI docs reference stage structures that do not cleanly match the locked MVP stage model.

Examples:
- ideal flow uses concepts like `Viewing Held`, `Reserved`, `Sold`, and `Handed_Over`
- MVP defines 14 locked stages centered on `New Lead`, `Qualified`, `Contacted`, `Viewing Booked`, `Negotiating`, `Hold`, `Reservation`, `Promise of Sale Signed`, `Final Contract Signed`, and `Closed Won`, plus branch states

Impact:
- Prototype screens can easily adopt the wrong pipeline
- Opportunity transitions and dashboard logic will drift

Action:
- Normalize all prototype work to the MVP stage model first
- Only map ideal-state stages later if needed for v1.1+

## 3. Studio expectations are inconsistent

Severity: High

The MVP doc says the Studio Wizard ships in v1 as a concierge-fulfilled interface. The onboarding, launch-package, SOP, and capability docs describe a much more automated Studio with BrandKit, ConstraintModel, Asset generation, and approval chains.

Impact:
- Risk of prototyping a generation engine instead of a concierge workflow
- Risk of building UI dependencies on non-MVP entities

Action:
- In the MVP prototype, represent Studio as request intake, status, delivery, and manual fulfillment states
- Keep future automation behind placeholder or admin-only concepts

## 4. The ideal UI surface is too broad for v1 prototyping

Severity: High

`docs/source/bricly-ui-surface.md` is useful directionally, but it assumes many entities and modules that are deferred from the MVP.

Examples:
- campaign-heavy marketing views
- commission views
- microsite management
- personalized pack operations backed by non-MVP data structures
- post-sale and buyer portal patterns

Impact:
- Navigation and screen plans can sprawl quickly
- The prototype can look coherent while being wrong on scope

Action:
- Carve a reduced MVP navigation and screen inventory before UI build-out

## 5. MVP screen inventory is not yet explicit

Severity: Medium

The MVP doc defines jobs, flows, and entities, but it does not define a canonical screen list or prototype map.

Impact:
- Multiple valid interpretations of what to build first
- Risk of mismatched UI depth across modules

Action:
- Use `docs/mvp-build-checklist.md` as the immediate planning scaffold
- Convert it into a concrete screen map before building the main app shell

## 6. Role permissions are not finalized at screen level

Severity: Medium

The docs describe roles conceptually, but not all MVP screen-level permissions are nailed down.

Examples needing explicit v1 decisions:
- whether ops is separate from manager
- how much marketing can see in v1
- whether developer views are read-only or operational on every screen

Impact:
- Prototype behavior may imply policy decisions that are still open

Action:
- Freeze role-by-screen access rules before interactive prototyping gets deep

## 7. Technical architecture is still undefined

Severity: Medium

There is enough product definition to prototype, but not enough engineering definition to build the real system without more decisions.

Missing decisions include:
- frontend framework
- backend architecture
- auth
- database
- storage
- providers for notifications and calendar integration

Impact:
- Fine for UI prototyping
- Not fine for implementation sequencing or API planning yet

Action:
- Keep current work at product-prototype level until architecture is chosen

## 8. AI boundaries need sharper MVP definitions

Severity: Medium

The docs are AI-heavy by design, but v1 does not operationalize all those agent behaviors.

Areas that need tighter MVP boundaries:
- which actions are truly automated in v1
- what the WhatsApp command parser actually supports in v1
- what is logged as agent activity versus manual activity
- what audit trail is visible in the prototype

Impact:
- Easy to fake a much more autonomous product than the MVP actually is

Action:
- Prototype explicit manual and concierge fallbacks for every AI-assisted surface

## 9. Naming is inconsistent across the repo

Severity: Low

The working repo folder and starter project use `Brickly`, while the imported strategy and product docs consistently use `Bricly`.

Impact:
- Brand inconsistency in prototypes and docs
- Potential confusion when naming the product in UI work

Action:
- Pick one canonical spelling before further prototype design

## 10. The prototype references are useful but not yet normalized

Severity: Low

The imported HTML prototypes and supporting docs are valuable references, but they are not yet translated into a current MVP screen plan.

Impact:
- Useful inspiration, but not yet directly actionable as a system map

Action:
- Review the imported prototype files against the MVP checklist before reusing patterns in the app shell

## Bottom line

There is enough here to start prototyping the MVP now.

The main risk is not missing information. The main risk is following the richer ideal-state docs too literally and accidentally prototyping v1.1 or the long-term platform instead of the locked v1 product.
