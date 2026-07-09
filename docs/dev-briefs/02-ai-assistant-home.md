# Brief 02 — Functional AI Assistant on Home (prefix `ai`)

**Goal:** Promote the Home "CRM Assistant" hero from decorative to functional — the rep's daily brief + natural-language command bar that actually mutates prototype state. Read `00-README-shared-context.md` first.

## Build

1. The existing Home page (`#p-home`) has a prompt textbox (`#home-…` hero with input and Send button) + 4 suggestion chips. Keep the layout; make it functional. Responses render in a conversation area (`#ai-log`) that appears below the hero, pushing the KPI cards down. Enter key submits.
2. **Command parsing `aiParse(text)`** — rule-based intents. If Brief 01's `waParse` exists, reuse/share helpers rather than duplicating entity extraction. Intents:
   - **"show holds expiring"** → list card of opps in stage `hold` sorted by `daysInStage` desc, each row clickable → `activeOppId = id; go('opp-detail')`
   - **"draft a follow-up to {name}"** → generated message card using the opp's real context (units, stage, nextStep) with **Copy** (navigator.clipboard, best-effort) and **"Send via WhatsApp"** (toast; if Brief 01 exists, deep-link into the WhatsApp thread with the draft prefilled)
   - **"book a viewing {day} {time}"** → appointment preview card → Confirm → toast + activity entry on the resolved opp
   - **"how is my pipeline"** → summary card: opportunity count + € total by stage group (compute from `pipelineCards`), plus top 3 needs-action rows
   - **"present to {name}"** → resolve contact → `pmOpenFromOpp(opp.id)`
   - fallback → helpful card listing example commands as clickable chips
3. **Morning brief card** — auto-renders on Home load when `role === 'rep'`: greeting, 3 urgent items (hold expiring soonest, task due, stalest opp by `daysInStage > 5`), each with a one-tap action button. Renders above the KPI grid.
4. Wire the 4 existing suggestion chips to real intents (replace their current toast/no-op handlers).
5. All state changes go through existing data structures + `toast`; activity entries must appear in opp detail afterwards.

## Demo script (all must pass)
1. Rep role → Home shows morning brief with 3 urgent items
2. Type "show holds expiring" → card lists OPP-1042 → click row → opp detail opens
3. Back to Home → "draft a follow-up to Mike" → message card renders with real unit/stage context
4. "present to Sarah Borg" → Present Mode opens on her opportunity (Exit returns)
5. "how is my pipeline" → totals are consistent with the Pipeline page
