# Brief 04 — Persona-Split Navigation (prefix `pn`) — DO AFTER 01 & 02

**Goal:** Make the anti-CRM thesis visible in the product: reps get a 5-item focused nav; managers/ops keep the full CRM. Read `00-README-shared-context.md` first.

## Build

1. **Role-aware sidebar:** implement `pnRenderNav(role)` that runs on every role switch (hook into the existing R/M/O switcher handler):
   - `role === 'rep'` → sidebar shows exactly: **Today** (Home with the morning brief), **WhatsApp** (Brief 01 page), **Present** (launches `pmOpen()`), **My Deals** (new page below), **Contacts**. Keep the R/M/O switcher and user card.
   - `role === 'mgr' | 'op'` → render the current full nav **unchanged** (Studio section still op-only).
   - Do not fork the sidebar HTML permanently — rebuild its contents from a config array so the full nav can be restored byte-identically. Preserve `navIdx`/active-state behavior or replace it safely for both modes.
2. **"My Deals" page (`p-mydeals`):** simplified list of the rep's opportunities sorted by urgency score:
   - hold expiring (stage `hold`, `daysInStage` near 14) > task overdue (from `oppExtData` tasks) > stale (`daysInStage > 5`) > rest
   - each row: contact, unit(s), one-line next step, urgency chip (`.pill` colors), and two inline actions: **Present** (`pmOpenFromOpp(id)`) and **WhatsApp** (opens Brief 01 thread; prefill composer if supported)
   - clicking the row body opens the full opp detail (existing page)
   - footer link: "Full pipeline view →" (`go('pipeline')`)
3. **Regression guarantee:** manager flows must remain identical — approvals queue, dashboards, all pages reachable. Role switching back and forth must not duplicate nav items or break active states.

## Demo script (all must pass)
1. Switch to R → nav collapses to the 5 rep items, Today shows the morning brief
2. My Deals sorts OPP-1042 (hold) to the top with an urgency chip
3. Row actions work: Present opens the showroom for that buyer; WhatsApp opens the thread
4. Switch to M → full nav returns; Approvals + dashboard intact
5. Switch R → M → R repeatedly → no duplicated items, no console errors
