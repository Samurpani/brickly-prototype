# Flow: Buyer Customisation

**[MVP·concierge] request path; self-serve [v1.1]** — Source: `source/bricly-flow-buyer-customisation.md` (9-stage ideal flow from first meeting to specification lock).

## The thesis

Personalisation is the wedge: a buyer who has seen *their* apartment — their finishes, their layout, their furniture — in a photoreal render is emotionally committed before the offer. The v2 prototype carries this everywhere: Personalise takeover, Present Mode Unit Studio, "✦ Generate custom render" buttons, finish/layout/add-on configurators with live pricing.

## v1 flow (concierge, ~24h SLA)

1. **Capture the want** — during a viewing or Present session, rep configures the unit (finishes/layout/add-ons) or just notes the buyer's direction.
2. **Request** — "Generate custom render" / Personalise routes to a **Studio personalisation brief** (Wizard brief type: *Personalisation*), pre-filled with unit + configuration + buyer context. This is a v1 stretch goal (HIGH priority per the locked scope) — if not built by end of M2, the fallback is the rep filing the wizard brief manually.
3. **Fulfilment** — concierge produces the render(s) externally; status Requested → In production → Delivered (~24h SLA).
4. **Delivery** — render lands in the Asset library + as a Document on the opportunity; rep sends it via the feed/WhatsApp; logged as a comm.
5. **CRM effect** — configuration + configured price stored on the opp's unit link; feeds the offer conversation in Negotiating.

## Deferred from the ideal flow

| Ideal stage | v1 status |
|---|---|
| Live in-meeting generation | [v1.1] — the flagship of Studio generation |
| Buyer-facing configurator link (buyer configures at home) | [v1.1] with buyer packs/microsites |
| Specification lock → change-order workflow after POS | [v1.2] |
| Upgrade pricing engine (developer-margin rules on add-ons) | [v1.1] — v1 uses flat configurator deltas as seeded in the prototype |
| Snagging/handover spec verification | [Post-MVP] |

## Why concierge-first is honest here

The configurator UI, price math, and request path are real product; only the render production is human. Every fulfilled brief documents exactly what v1.1 must generate — the concierge queue is the spec-writing machine.
