# 08 — Business Docs (pointer, not a copy)

**Status:** Canonical pointer · Updated 2026-08-13

Per Sam's instruction, business/financial documents are **not rewritten** in the canonical set — numbers are never altered here. This README says which source docs are current, which are superseded, and which numbers are flagged.

## Current (authoritative) business docs — in `../source/`

| Doc | Status |
|---|---|
| `bricly-pricing-plan-final.md` | ✅ Current pricing: size-banded recurring (≤50 units €20k/yr · 51–150 €35k · 151–300 €60k · 300+ custom), activation packages (Launch €15k / Load + personalisation €7k / Load CRM-only €4k), onboarding €5k, Performance retainer €2–6k/mo + €1.5–3k per-close bonus, credits ~€0.10, ~30 customers to €5M ARR |
| `bricly-pl-v19-change-memo.md` | ✅ Current financial model deltas: cohort revenue engine, €100k blended committed ACV, phased activation recognition, concierge margin ramp 35→55→70%, 10 customers Y1, honest ~8x LTV:CAC, seed €500–750k at M9–M12 |
| Marketing SOPs / Collateral Standard | ✅ Current operating docs (product references verified against v2) |

## Superseded — do NOT use or upload

| Doc | Why |
|---|---|
| `bricly-pricing-plan.md` (v18) | Superseded by `-final`. Exclude from the Claude project (REVIEW-LOG F3). |

## ⚠️ Known number conflicts (all [NEEDS SAM] — REVIEW-LOG F1–F5)

- **F1/F2:** `Bricly-MVP.md` still carries stale v14 figures (v14 P&L refs, "3 at M6 / 11 at M8 / 24 at M10" ramp, "112 customers for €5M", "19 months runway") and v14-era per-unit pricing wording, despite the v19 memo claiming correction. Canonical docs use v19 throughout; the MVP doc's *scope* remains valid.
- **F4:** pitch deck "half a million" slide conflicts with the model.
- **F5:** capability-surface count drift between docs (154 vs earlier counts) — canonical uses 154 (72T/63R/19P) ideal, ~62 for MVP.

## Distribution note

REVIEW-LOG **D3** (pending Sam): exclude `08-business/` context and `docs/source/` financials from the public prototype mirror.
