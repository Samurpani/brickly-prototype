# Brickly AI Context Brief

This file is the fast-entry brief for implementation work in this repo. It summarizes the imported Bricly planning docs without replacing them.

## Product shape

Brickly is currently a prototype repo for Bricly, a developer-focused real estate operating system. The near-term shipped product is not the full ideal platform; it is a CRM-led MVP with a concierge-fulfilled Studio Wizard.

## MVP truth

Source of truth: `source/Bricly-MVP.md`

Key points:
- v1 is for the first 10 founding members.
- The primary success sequence is activation, operational backbone, then Studio asset delivery.
- The CRM is the system of record in v1.
- The Studio Wizard is visible in v1, but asset generation is concierge-fulfilled rather than AI-automated.
- The automated generation engine, constraint model workflows, and agent-heavy Studio behavior belong mostly to v1.1+.

## What ships in v1

From the MVP doc:
- CRM core for projects, units, contacts, opportunities, activities, appointments, approvals, documents, payment milestones, users, notifications, and tags.
- Hosted lead capture per project.
- Manager visibility and dashboards.
- WhatsApp command parsing for some inventory and activity workflows.
- A lightweight Studio Wizard surface for intake, status, and delivery.

## What does not ship in v1

Still important for architecture, but mostly deferred:
- Full Studio generation pipeline
- ConstraintModel as an operational product surface
- BrandKit, Persona, Asset, Campaign, Microsite, Offer, Commission, and other ideal-model entities
- Post-sale portal and broader developer OS expansion

## Ideal-product direction

Primary sources:
- `source/bricly-data-model.md`
- `source/bricly-capability-surface.md`
- `source/bricly-ideas-and-features.md`

The long-term direction is a developer OS spanning pre-launch, sales, and eventually post-sale. The moat is the source of truth plus orchestration, not rebuilding every specialist vertical tool.

## Important flows

Primary sources:
- `source/bricly-flow-launch-package.md`
- `source/bricly-flow-sales-process.md`
- `source/bricly-flow-lead-capture-and-routing.md`
- `source/Bricly Marketing SOPs.md`

Important product ideas captured in the docs:
- Launch-package generation is sequential and depends on brand, render, and content-backbone stages.
- Brand and marketing work is heavily workflow-driven and approval-gated.
- Sales, lead routing, and inventory state are core operational flows.

## Repo guidance

Use this repo as both:
- the prototype surface for Brickly UI work
- the versioned home for source planning docs and imported prototypes

When implementing features, anchor decisions to the MVP doc first. Use the ideal-model docs to protect future extensibility, not to overbuild the current slice.
