# Page Header Component

Canonical spec for page headers in the Bricly OS prototype (`prototypes/Bricly_OS_Prototype_v2.html` + `prototypes/crm-design-system.css`). Two variants, applied consistently across the CRM shell.

## Variants & page mapping

| Variant | Used on | Anatomy |
| --- | --- | --- |
| **Page Header 2** (overview/gallery) | Opportunities, Deals, Units, Developments, Contacts (+ Chats & tasks follows the same rows minus metrics) | Heading → Metrics (optional) → Tabs row → Chip row |
| **Page Header** (record/detail) | Opportunity, Deal, Unit, Development, Contact detail; Custom pack wizard | Back link → Heading (identity left, status/price right) → Controls row (tabs and/or actions) |

Excluded: Today (bespoke layout) and the Studio shell (separate design surface).

## Anatomy — Page Header 2

Rows appear in this order inside `.wrap`; each slot is optional but must keep its position when present.

1. **Heading** — `.crm-page-heading` with `.page-title` (+ optional `.page-sub`). Margin-bottom 24px.
2. **Metrics** — `.crm-page-metrics` stat strip (`.ct-stat` / `.csum` / `.dv-stat`). Left-border separators, padding 6px 12px, value 16/24, label 13/20 with 4px gap. Clickable stats (Units, Contacts) keep their `.on` filter state. Margin-bottom 24px.
3. **Tabs row** — `.crm-page-controls`: `.tabs` left, `.toolbar` right (search, sort icons, view toggle, action buttons). Margin-bottom 12px.
4. **Chip row** — `.filter-row.crm-page-filters`: Sort chip (with divider), filter shortcut chips, Clear all, anchored menus. Margin-bottom 24px.

## Anatomy — Page Header (record)

1. `.btn-back` link to the parent list.
2. `.crm-page-heading` as `.row-between`: identity (avatar/title/sub + badges) left, status pill or price block right.
3. `.crm-page-controls`: tabs and/or `.toolbar` of actions (`.qa-btn`, `.cr-actions`).

## Tokens

Confirmed from Figma Dev Mode:

- Page gutter: 32px top / **104px** inline (breakpoints: 48px ≤1400, 24px ≤1100, 16px ≤700 via `--crm-gutter`).
- Title: Inter 26/36, weight 400, letter-spacing −0.25px, `--on-surface`.
- Metric stat: padding 6px 12px, column, 4px gap, flex 1.
- Active tab: 4px radius, background `--sc` (#EFECE7). Dashboard `.seg button.on` matches.
- Toolbar action buttons: min-height 28, min-width 68 (`.crm-page-controls :is(.btn-primary, .btn-ghost, .ask-btn, .qa-btn)`); tool icon buttons 28×28.

Derived (not in Dev Mode export): subcopy 14/22 `--on-variant`; metric label 13/20; tabs-row → chip-row gap 12px.

## Interaction spec (identical wherever present)

- **Search**: magnifier `.tool[title="Search"]` toggles an inline `.pipe-search-wrap` / `.hist-search` input; opening focuses the input, closing clears the query and re-renders. Same pattern on Opportunities, Deals, Units, Developments, Contacts, Chats & tasks.
- **Sort icons**: two `.tool` buttons in every toolbar — "Sort" opens the same `SORT_PAGES` menu as the Sort chip (`sortOpen(key,event)`); "Reverse sort order" flips the active rule's direction (`sortFlip(key)`).
- **Tabs**: single-select, re-render list. Counts render as muted `<span>` where designed (Deals non-all tabs, Contacts all tabs). Developments tabs map status: Available (Selling/Final Units), Sold (Sold out), Draft, Coming Soon.
- **Filter chips**: multi-select popovers stay open on pick; chip shows `Label: value` for one value, count badge for 2+; Clear all appears when any filter is active.

## Modularity rules

- Current page contents are the source of truth: do not add or remove controls when applying the header component — only normalize position, sizing, and behavior.
- Slots collapse when unused (e.g., no metrics on Opportunities/Developments, no tabs on Deal detail).
- Right-slot record content (unit price block, deal status pill) is preserved as-is.

## Validation

- Syntax: `node -e '…vm.Script…'` → "Syntax OK: 17 scripts".
- Suites: `npx playwright test tests/crm-design-system.spec.cjs` and `tests/present-mode.spec.cjs`.

See also: [CRM-Design-System.md](CRM-Design-System.md).
