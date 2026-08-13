# Documentation Review Log

Every discrepancy found during the 2026-08-13 canonical-doc audit. Items marked **[NEEDS SAM]** require a founder decision or verification. Numbers were never altered — only logged here.

Legend: 💰 financial/number issue · ⚠️ product-reference issue · 🔮 vision-vs-built drift · ✅ resolved during audit

---

## 1. Financial / numeric issues (not changed, verify before sharing)

| # | Doc | Issue | Status |
|---|-----|-------|--------|
| F1 | `source/Bricly-MVP.md` | 💰 The PL v19 change memo states Bricly-MVP.md was "updated… corrected to v19", but the uploaded copy **still contains the stale v14 figures**: references `Bricly_Investor_PL_v14.xlsx` (§3, §13), the "3 active clients at M6, 11 at M8, 24 at M10" ramp (§1), "~112 customers for €5M ARR" (§13.2), and "effective 19 months runway" (§3). v19 says: 10 customers Y1, €100k blended committed ACV, €5M ARR at ~M33, seed round needed M9–M12. | **[NEEDS SAM]** — either the corrected Bricly-MVP.md wasn't the one uploaded, or the correction was never saved. The canonical `02-mvp-scope.md` uses v19 figures. |
| F2 | `source/Bricly-MVP.md` §3 | 💰 Pricing description ("annual platform license + per-development fee + per-unit fee + generation allowance, €25k minimum") is the **v14-era wording**. The final model (`bricly-pricing-plan-final.md`) has **no per-unit fee** — it is a size-banded recurring per-development fee (€20k floor) + one-time activation fee. | **[NEEDS SAM]** — confirm final wording; canonical docs use pricing-plan-final. |
| F3 | `source/bricly-pricing-plan.md` (v18) | 💰 Superseded by `bricly-pricing-plan-final.md` (v19 lineage) per the final doc's own footer. Contains the retired €166k blended ACV / 53x LTV:CAC / 1.6-month payback numbers that the v19 memo explicitly retires as "would have failed investor diligence". | Marked superseded in 00-INDEX. **Do not upload v18 to the Claude project.** |
| F4 | `source/bricly-pl-v19-change-memo.md` | 💰 Notes the pitch deck still contains a "raised over half a million dollars" slide conflicting with the €300k pre-seed. Outside this repo's scope but re-flagged here. | **[NEEDS SAM]** |
| F5 | `source/bricly-capability-surface.md` | Internal count drift: several tool groups list more named tools than their stated count (e.g. BrandKit says 4, lists 5; Asset says 5, lists 7). Total "154" may not reconcile exactly. Cosmetic — the MVP surface (~62) is what matters now. | Logged only. |

## 2. Product-reference issues (aligned in canonical docs)

| # | Doc | Issue | Resolution |
|---|-----|-------|------------|
| P1 | `source/Present-Mode-Overview.md` | ⚠️ Describes the **legacy** Present Mode (three.js 3D model, `pm*` namespace, orange/cream theme, `Bricly_CRM_Prototype.html` demo link). The v2 prototype has a rebuilt Present Mode (`pr*`, no three.js, olive/Sandstone tokens, same 5-stage flow). | Rewritten as `canonical/05-flows/present-mode.md` against v2. Old doc kept in source as history. |
| P2 | `source/Bricly-MVP.md` §8 | ⚠️ Nav list ("Home · Pipeline · Leads · Opportunities · Contacts · Projects · Properties · Approvals · Activity · Team…") predates the v2 prototype IA. v2 nav: Today · Chat · Dashboard · Opportunities · Units · Developments · Contacts · Present · Automations · Calendar · Reports · Settings, plus Studio & Marketing workspaces via the workspace switcher. | Canonical `04-ui-surface.md` documents the v2 IA; `02-mvp-scope.md` maps old names → new. |
| P3 | `source/Bricly-MVP.md` §5 | ⚠️ "14 stages" pipeline (10 forward + 4 branch). The v2 prototype models this as a 7-column board + a **12-stage buyer journey** (2 phases split by the "Offer accepted" gate) + lifecycle branch states. Same underlying state machine, different presentation. | Mapping table in `03-data-model.md` §4. Not a contradiction, but docs must stop describing a flat 14-column kanban. |
| P4 | All 7 `source/bricly-flow-*.md` + onboarding flow | 🔮 Written against the ideal product ("MVP scoping is a separate exercise") and reference screens that don't exist in v2 (Leads inbox, Approvals queue page, Conversations tab, Partner portal). | Remapped to v2 screens in `canonical/05-flows/` with [MVP] / [v2-full] / [Post-MVP] tags on every step. Source flows kept as vision reference. |
| P5 | `source/bricly-ui-surface.md` | 🔮 Ideal-product screen list (5 dashboard variants, Partners, Team, Approvals queue). v2 implements a different, leaner IA with 4 personas and 3 workspaces. | Superseded for build purposes by `canonical/04-ui-surface.md`. |
| P6 | `source/bricly-data-model.md` | 🔮 32-entity ideal model. v2 prototype demonstrates ~13 of them concretely; locked MVP is 15 entities. | `canonical/03-data-model.md` gives the three-way mapping (prototype structure → MVP entity → ideal entity). |
| P7 | `source/bricly-ideas-and-features.md` | ⚠️ "Bricly OS" is framed as a future idea (Status: Exploring). The prototype and workspace switcher are now literally named "Bricly OS" — the naming has converged; the *full-lifecycle* OS (pre-development stages) remains vision. | Noted in `01-product-overview.md`. |
| P8 | `source/Bricly Marketing SOPs.md` / `Bricly_Marketing_Collateral_Production_Standard.md` | ⚠️ Reference CRM/Studio surfaces generically; consistent with v2's Marketing workspace (Campaigns/Leads & attribution/Budget/Connections) and Automations marketing templates. Minor: SOPs mention "browse-phase PurchaserPortalAccess" and reserve-with-PSP flows that are Post-MVP. | No text changes made (marketing ops docs, numbers untouched). Post-MVP references flagged in 00-INDEX. |
| P9 | `source/Bricly_CRM-_Product_Vision.md` | Note: this is a transcription of founder notes (July 2026) incl. the "agent staff" (Remy/Ella/Cole/Nora) and the dream-scenario narrative. Fully vision-tier; nothing in v2 or MVP contradicts it, but none of the agent staff is buildable in v1. | Positioned as the north-star doc in 00-INDEX; canonical docs cite it for direction only. |

## 3. Ground-truth findings from the v2 prototype (documented, not issues)

| # | Finding |
|---|---------|
| G1 | ✅ The v2 prototype **contains the Studio Wizard**: a "Bricly Studio" workspace (owner-gated) with a 7-step brief wizard (Brief type → Development → Services → Buyer context → Style direction → Timeline → Review & submit), brief types Launch Package / Asset Request / Brand Consultation / Personalisation, and asset statuses Requested → In production → Delivered. This matches the locked MVP's concierge Wizard almost exactly — the prototype and Bricly-MVP.md agree more than the earlier audit assumed. |
| G2 | ✅ v2 also contains a "Bricly Marketing" workspace (Overview / Campaigns / Leads & attribution / Budget / Connections) — this goes **beyond** the locked MVP (Marketing Lead role was deferred to v1.1). Tagged [Post-MVP UI, demo-quality] in the scope doc. |
| G3 | ✅ MCP tool contract exists in the prototype (Settings → Integrations → WhatsApp/MCP): 6 tools — `log_activity`, `request_hold`, `create_task`, `update_unit_status`, `get_brief`, `send_brochure`. Locked MVP defers the MCP *server* to v1.1 but requires the WhatsApp command parser (same grammar) in v1. Documented in `06-integrations-and-ai.md`. |
| G4 | Prototype dataset: 5 developments (Dolphin Court, Mercury, La Lex, Verdala, Onyx Rise), 38 units, 21 opportunities, 32 contacts (19 derived + 13 network), 5 seeded automations. Development names differ slightly from the legacy prototype (De Rohan → Onyx Rise; Verdala Terraces → Verdala). |

## 4. Open decisions

| # | Decision | Status |
|---|----------|--------|
| D1 | Fulfilment model: **Option B chosen by Sam (2026-08-13)** — v2 UI is the design truth; Studio/generation is concierge-fulfilled behind it for the first cohort. | ✅ Decided; baked into 02-mvp-scope.md and 07-dev-handoff.md. |
| D2 | MVP module cut proposed in `02-mvp-scope.md` §3. | **[NEEDS SAM]** — review and sign off. |
| D3 | Keep business/financial docs (08-business pointers, pricing, PL memo) **out of the public GitHub Pages mirror** (`brickly-prototype` repo is public). | **[NEEDS SAM]** — recommended; rsync currently copies all of Brickly/. Add `--exclude 'docs/canonical/08-business'` and `--exclude 'docs/source'` to the publish command. |
| D4 | Empty-at-first-paste `Bricly_CRM-_Product_Vision.md` now has content (279 lines) — confirmed OK. | ✅ |
