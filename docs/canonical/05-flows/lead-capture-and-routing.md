# Flow: Lead Capture & Routing

**[MVP] partial** — v1 ships capture Tiers 1 + 4 with simple routing. Source: `source/bricly-flow-lead-capture.md` (10-stage, 5-tier ideal flow).

## Capture tiers

| Tier | Channel | v1 |
|---|---|---|
| 1 | Hosted lead form per project (name, phone, email, unit interest, budget, consent) | **[MVP]** |
| 2 | Ad platform webhooks (Meta/Google lead forms) | [v1.2] — v1: concierge imports CSVs from members' ad funnels |
| 3 | Inbound WhatsApp/email parsed by LLM | [v1.2] |
| 4 | Manual / walk-in / referral entry by rep | **[MVP]** — new-contact drawer + new-opportunity drawer |
| 5 | Partner/agency submission with attribution | [v1.2] with Partner entity |

## v1 pipeline (per lead)

1. **Capture** → Contact created (or matched) + Opportunity in **New Lead**.
2. **Dedupe** [MVP]: phone-number uniqueness is a hard block; on match, attach to existing Contact instead of creating (source flow's fuzzy email/name matching → [v1.1]).
3. **Source recording** [MVP]: source field on Contact/Opp (Website, Walk-in, Referral, Agency, Portal — the values seeded in the prototype). Full UTM/attribution chain → [v1.2] with Marketing workspace.
4. **Routing** [MVP]: simple round-robin among active reps on the project, manager can reassign (bulk-assign in Contacts). Rules-based routing (language, budget band, load balancing) → [v1.1]; ML scoring → [Post-MVP].
5. **Notification** [MVP]: assigned rep notified (bell + WhatsApp ping if connected); appears in board New Lead column and rep dashboard.
6. **First touch**: manual in v1 — the board card shows next-action "Make first contact"; overdue turns red. Auto-first-touch messages → [v1.2 automations] (the "New Lead Auto-Qualify" workflow template in the prototype's Automations module is the design for this).

## ⚠️ No Leads inbox in v2

The ideal flow (and the locked MVP screen list) assumes a leads triage surface. The v2 prototype has none — leads land directly as New Lead opportunities on the board. **v1 follows the prototype**: the board's New Lead column *is* the inbox. If triage-before-opportunity turns out to matter (junk leads polluting the board), add a "Leads" filter view rather than a new module. Logged as REVIEW-LOG P-item / build decision in `04-ui-surface.md` §5.

## Deferred stages from the ideal flow

Qualification conversation automation (tiered questions, budget elicitation), Cold/recycle pool with re-engagement drips ("Re-engagement Drip" automation template), speed-to-lead SLA clocks, agency attribution windows — [v1.2 / Post-MVP].
