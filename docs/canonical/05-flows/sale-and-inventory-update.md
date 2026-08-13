# Flow: Sale & Inventory Update

**[MVP]** (simplified) — the cross-cutting flow for every Unit state or attribute change. Source: `source/Bricly_-_Sale_and_Inventory_Update.md` (full 10-stage SyncEvent propagation engine) → cut to the v1 reality: **no external surfaces to sync in v1**, so propagation is internal-only.

## Status change types

| Type | Examples | v1 |
|---|---|---|
| Forward transitions | Available → Held → Reserved → Sold | [MVP] approval-gated |
| Reverse transitions | Hold release, POS collapse → Available; manual override | [MVP] manager-only |
| Attribute changes | Price, ready date, features (no state change) | [MVP] |
| Bulk/batch | Price change across a floor; import updates | [MVP] simple bulk edit; no batch engine |
| Manual override | Force any state with reason | [MVP] manager-only, logged |

## v1 propagation (what actually happens on a change)

1. **Approval gate first** (where required — see below): change request creates an ApprovalRequest; nothing mutates until approved.
2. **Unit record updates**; status pill changes everywhere it renders (Units table, dev Availability, Visual Search dots, unit peek/detail, Present Mode inventory).
3. **Cross-Opportunity propagation**: Unit → Sold removes it from every other opportunity's `units[]` shortlist; affected reps notified with a suggested alternative conversation.
4. **Counters update**: development availability bars, Units stats cards, Reports inventory KPIs — all live-derived in the prototype (`unDealsFor`, `rpKPIs`), which is the correct v1 model: derive, don't denormalise.
5. **Activity + audit**: system feed item on the bound opportunity; immutable Activity row (state-change flag).
6. **Notification fan-out** [MVP hardcoded triggers]: rep (own deals), manager (all gates), owner (Sold). Workspace-configurable policy is [v2].

## Approval gates [MVP]

| Transition | Gate |
|---|---|
| Available → Held | Manager approval (hold request; 14-day default expiry — "Hold expires" key date on the opp) |
| Held → Reserved | Manager approval + reservation form + deposit recorded |
| Price below floor / exception | Manager approval (price_exception) |
| Reverse transitions | Manager decision, reason required |
| → Sold | Follows from deed completion in the sales flow; no separate gate |

WhatsApp `update_unit_status` and `request_hold` commands route through the same gates — the parser never bypasses approvals.

## Deferred from the ideal flow

- **SyncEvent entity + timing tiers** (real-time / near-real-time / generative regeneration T+5min–24h): [v1.1] — arrives with Studio generation and Microsites, when there are external surfaces (websites, brochures, ads) to keep in sync.
- **Approval-gated external propagation** (paid media updates): [v1.2] with ad integrations.
- **Personalised buyer pack reconciliation** (silent update vs rep alert at hard gates): [v1.1] with buyer packs.
- **Agent autonomy Patterns 2–4**: [Post-MVP]. v1 is Pattern 1 only (system side effects).
