# Flow: Agent-Initiated Actions (MCP)

**[Post-MVP — v1.1 server; contract drafted now]** — Source: `source/bricly-flow-agent-initiated.md` (MCP flows where external agents act on the workspace). Full contract: `06-integrations-and-ai.md` §3.

## v1 posture

No MCP server is exposed in v1. The **WhatsApp command parser** delivers the rep-facing subset of the same intents (log activity, request hold, create task, update unit status, get brief, send brochure) through deterministic parsing — same guards, same approval gates. The Settings → WhatsApp/MCP page ships in v1 as connection management for the parser; the MCP server card is design-ahead UI.

## v1.1 exposure

Endpoint `mcp.bricly.io/v1`, per-workspace auth tokens, per-tool enable toggles. Initial tool set = the 6 tools in the prototype (verbatim descriptions in `06-integrations-and-ai.md`), backed by the same API surface the app uses (~37 Tools / ~21 Resources). Guards carried from the ideal flow: role-scoped tokens, approval gates always apply (an agent can *request* a hold, never grant one), immutable activity logging with agent attribution, rate limits.

## Autonomy ladder (vision recap)

Pattern 1 (system side effects — in v1) → Pattern 2 (agent proposes, human decides — v1.1 MCP) → Pattern 3 (agent acts in bounded domains, human audits) → Pattern 4 (agent staff: Remy/Ella/Cole/Nora — vision). See `06-integrations-and-ai.md` §1.

---

# Flow: Re-Launch & Pivot

**[Post-MVP]** — Source: `source/bricly-flow-relaunch-pivot.md` (7 trigger scenarios: stalled sell-through, price repositioning, phase releases, target-buyer pivot, brand refresh, distressed timeline, market shift).

Not applicable to the founding cohort (projects are in initial launch). Becomes relevant post-v1.1 when Studio can regenerate asset systems quickly and the Marketing workspace can measure sell-through pacing. The prototype's "Price-Drop Announcement" and "Waitlist Activation" automation templates are early fragments of this flow. No v1 build items.
