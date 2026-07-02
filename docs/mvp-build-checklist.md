# MVP Build Checklist

This checklist translates the locked MVP scope into a prototype-first build sequence.

## 1. Source-of-truth setup

- [ ] Treat `docs/source/Bricly-MVP.md` as the controlling v1 spec
- [ ] Mark ideal-product docs as reference-only for MVP implementation
- [ ] Normalize brand naming across the repo: `Brickly` vs `Bricly`
- [ ] Freeze the MVP glossary for entities, stages, and labels

## 2. MVP product model

- [ ] Define the 15 MVP entities as actual prototype objects
- [ ] Define the 14 locked MVP pipeline stages and branch states
- [ ] Define allowed transitions between stages
- [ ] Define v1 unit states and their visible labels
- [ ] Define approval-request types in v1
- [ ] Define payment milestone types in v1
- [ ] Define document categories in v1
- [ ] Define workspace tag behavior and constraints

## 3. Roles and permissions

- [ ] Define screen-level permissions for sales rep
- [ ] Define screen-level permissions for sales manager
- [ ] Define screen-level permissions for developer admin
- [ ] Decide whether ops is a separate role in the MVP prototype or folded into manager views
- [ ] Decide whether marketing gets any v1 prototype surface beyond read-only reporting

## 4. CRM information architecture

- [ ] Finalize left-rail navigation for the MVP only
- [ ] Remove or defer non-MVP areas from the prototype nav
- [ ] Define workspace-level vs project-level surfaces
- [ ] Define the default dashboard per role
- [ ] Define the empty states for a new workspace

## 5. Core CRM screens

- [ ] Project list
- [ ] Project detail
- [ ] Unit inventory list
- [ ] Unit detail
- [ ] Leads inbox
- [ ] Contacts list
- [ ] Contact detail
- [ ] Opportunities list
- [ ] Opportunity detail
- [ ] Pipeline board
- [ ] Approvals queue
- [ ] Calendar or appointment view
- [ ] Documents surface
- [ ] Payment milestone surface
- [ ] Basic settings surface

## 6. Core workflows

- [ ] Lead capture into CRM
- [ ] Lead routing and assignment
- [ ] Opportunity stage progression
- [ ] Unit hold request and approval
- [ ] Reservation request and approval
- [ ] Price exception request and approval
- [ ] Unit inventory updates and cross-opportunity effects
- [ ] Activity logging
- [ ] Appointment scheduling
- [ ] Document upload and checklist behavior
- [ ] Payment milestone manual updates

## 7. Studio Wizard in MVP form

- [ ] Brief intake screen
- [ ] Request status screen
- [ ] Delivered assets gallery
- [ ] Opportunity-linked custom request flow
- [ ] Internal concierge fulfillment status model
- [ ] File delivery write-back into CRM documents or assets

## 8. Dashboards and reporting

- [ ] Sales rep dashboard with next actions and appointments
- [ ] Sales manager dashboard with pipeline health and approvals
- [ ] Developer dashboard with project and revenue rollups
- [ ] Define KPI cards from the MVP success criteria
- [ ] Defer ideal-state analytics that depend on non-MVP entities

## 9. AI and automation boundaries

- [ ] Define what is actually automated in v1
- [ ] Define what is concierge or manual in v1
- [ ] Define WhatsApp command-parser entry points
- [ ] Define audit trail behavior for agent-assisted actions
- [ ] Stub future AI surfaces without pretending the backend exists

## 10. Technical planning needed before implementation

- [ ] Choose frontend stack
- [ ] Choose backend stack
- [ ] Choose database and ORM
- [ ] Choose auth model
- [ ] Choose file storage model
- [ ] Choose deployment model
- [ ] Choose notification providers
- [ ] Choose calendar integration strategy

## 11. Prototype quality gates

- [ ] Every MVP screen traces back to the locked MVP doc
- [ ] No screen assumes deferred entities without a stubbed manual fallback
- [ ] All major stage transitions have a visible state model
- [ ] Inventory and opportunity relationships are coherent in the UI
- [ ] Studio Wizard screens clearly indicate concierge fulfillment where applicable

## 12. Suggested first implementation slice

- [ ] Project list and project detail
- [ ] Unit inventory and status changes
- [ ] Leads inbox and contacts list
- [ ] Opportunities list and detail
- [ ] Pipeline board
- [ ] Approval queue
- [ ] Minimal Studio Wizard request flow
