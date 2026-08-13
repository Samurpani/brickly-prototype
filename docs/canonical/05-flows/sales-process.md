# Flow: Sales Process

**[MVP]** — the operating core. Source: `source/bricly-flow-sales-process.md` (16-stage ideal flow) → remapped to the v2 prototype's 12-stage journey. This is the flow the Opportunity detail screen *is*.

## The journey (as built in v2)

**Phase A — Selling** (board + journey bar; Deal Room locked)

| # | Stage | Rep does (CTA) | Checklist (req) | Screen |
|---|---|---|---|---|
| 1 | New Lead | Make first contact | Contact details captured · Lead source recorded | Board New Lead column; opp hero |
| 2 | Qualified | Book a viewing | Budget confirmed · Timeline confirmed · Finance status known | Opp hero + checklist popover |
| 3 | Viewing Booked | Confirm viewing (date: Viewing) | Appointment set · Units to show selected · Reminder sent | Calendar event auto-derived from `next` |
| 4 | Viewing Held | Send follow-up pack | Feedback captured · Units shortlisted | Feed log; [v1.1: Present session save does this automatically] |
| 5 | Negotiating | Log offer round (date: Offer expiry) | Offer on the table · Counter position agreed | Offer rail card appears; money pill flips Budget→Offer |

**◆ Gate: Offer accepted** — crossing fires the phase transition (confetti in prototype); Phase A dims; Deal Room unlocks.

**Phase B — Deal**

| # | Stage | Rep/ops does | Checklist | Screen |
|---|---|---|---|---|
| 6 | Hold | Chase hold approval (date: Hold expires, 14d) | Manager approval · Unit off market | ApprovalRequest → manager; blocker card on opp; unit → Held |
| 7 | Reservation | Collect deposit (date: POS target) | Reservation form signed · Deposit received | Deal Room payments; unit → Reserved |
| 8 | KYC | Request outstanding docs | Passport/ID · Proof of address · Source of funds | Documents tab, kyc chain (required→received→verified) |
| 9 | POS Signed | Schedule notary (date: Final deed deadline) | POS signed at notary · Payment plan agreed · 1% duty paid | Contract flag; Deal Room key dates ("Konvenju sets the deadline") |
| 10 | Payments | Send payment reminder (date: Next payment) | All milestones invoiced · Receipts filed | Payment schedule w/ outstanding (10/20/70 pattern) |
| 11 | Final Deed | Prepare completion pack (date: Deed date) | Balance settled · Bank sanction letter · Deed appointment booked | Closed tracker stepper begins |
| 12 | Handover | Book handover walkthrough (date: Delivery) | Snag list closed · Keys & certificates delivered | Completing sets Closed Won; unit → Sold |

**After close [v1.1]:** the opp renders the "owns" view — Deal Archive (frozen read-only), contact becomes an owner with portfolio card; "New opportunity" starts a repeat-client deal.

## Mechanics carried from the ideal flow

- **Stage advance** = `ojAdvance` pattern: complete checklist → CTA advances journey, syncs board stage, resets next action/blocker, logs a system feed item. [MVP: manual transitions only — no evidence-based auto-advance, that's the Remy vision]
- **Approval gates** [MVP]: hold, reservation, price exception create ApprovalRequests; manager decides (dashboard queue / bell); unit state changes only on approval.
- **Cross-propagation** [MVP]: unit Sold → removed from other opps' shortlists (see `sale-and-inventory-update.md`).
- **SLA nudges** [Post-MVP]: no auto-nudges in v1; manager dashboard surfaces stale deals instead. Overdue next actions render red on board cards [MVP].
- **Post-sale portal, snagging, CollaborationSpace** (ideal stages 14–16): **[Post-MVP]** — v1 ends at handover + logging.

## What the ideal flow has that v1 doesn't

Automated first touch (stage 4), automated qualification conversation (stage 5, agent A11), personalised buyer pack composition, in-meeting Studio, auto-Cold transitions — all **[Post-MVP]**; lead-side automation starts in v1.2 with the automations engine.
