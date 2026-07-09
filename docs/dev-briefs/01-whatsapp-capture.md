# Brief 01 — WhatsApp Conversational Capture (prefix `wa`)

**Goal:** Prototype the "WhatsApp is the rep's CRM" surface — a simulated WhatsApp thread where a rep's voice note/message becomes structured CRM records with one tap. Read `00-README-shared-context.md` first.

## Build

1. **Entry:** new sidebar nav item "WhatsApp" (visible for role `rep` and `mgr`), page id `p-whatsapp`, wired through `go()` (add `navIdx` entry + breadcrumb label + render call). Also a floating pill button on the Home page ("💬 WhatsApp Assistant").
2. **UI:** a phone-frame chat thread centered on the page ("Bricly Assistant" header with online dot). WhatsApp-like bubbles (rep = green-tinted/right, assistant = white/left) restyled to the Bricly warm palette. Composer at bottom: text input + send + mic button. Enter key sends.
3. **Simulated voice notes:** the mic button reveals 3 canned voice-note chips (fake waveform bars + duration label). Sending one posts a "voice note" bubble followed by its transcript. Canned transcript #1: *"Just showed Mike Gatt the maisonette at Dolphin Court, he loves the terrace, wants a hold on CM9802, needs finance, follow up Thursday."* Create two more covering other intents.
4. **Parser `waParse(text)`:** rule-based (regex/keywords). Intents:
   - `log_activity` — a viewing/call/meeting happened
   - `request_hold` — unit + contact identified
   - `create_task` — "follow up <day>" etc.
   - `update_unit` — "mark CM9804 available/sold"
   - `get_brief` — "what's on today / anything urgent"
   Entity extraction: match names against `pipelineCards[].contact`, unit ids against `allProps[].id` (accept with or without `#CM` prefix), developments against dev names.
5. **Structured cards in-thread:** assistant replies with parsed preview cards (Activity, Hold Request, Task — each showing extracted fields) with **✓ Confirm / ✎ Edit** buttons. Edit uses `showQuickInput`. On Confirm, mutate the real data:
   - activity → `opp.activity.unshift({t:'Just now', v:…})`
   - hold → `opp.holdApproval = 'Waiting manager approval'` (+ activity entry) — must then appear in the existing Approvals queue for the manager role
   - task → `oppExtData[opp.id].tasks.push({done:false, text, due, priority:'high'})` (create ext skeleton if missing)
   - unit update → change `allProps` status, toast
6. **`get_brief`:** digest bubble — holds expiring (derive from `daysInStage` vs 14-day expiry), open tasks due today, next appointment — with quick-action buttons (open opp, open WhatsApp composer prefilled).
7. **Polish:** typing indicator (3 animated dots ~700ms) before each assistant reply.

## Demo script (all must pass)
1. Rep role → WhatsApp → mic → send canned viewing note
2. Assistant returns 3 cards (activity + hold request + task) → Confirm all
3. Open OPP-1042 → activity + task present; switch to M role → Approvals queue shows the hold request
4. Type "mark CM9804 available" → unit card → confirm → Properties page reflects it
5. Type "anything urgent today?" → brief digest renders with working buttons
