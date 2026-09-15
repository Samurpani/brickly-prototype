# CRM Styling

The v2 prototype loads `prototypes/crm-design-system.css` after its embedded
styles. This stylesheet maps the existing CRM components to Bricly DS 1.2.

## Sources

- Figma file `HcWhi0kT0jK5RYoGDjt6g2`, Components page `6917:2148`.
- User-supplied variables export (`variables2.json`, export format 1.0.4),
  component sheets, and light/dark Opportunities references, supplied 2026-09-14.
- Retrieved Figma geometry for table cells, buttons, navigation, labels and cards.

The `--crm-*` properties hold the theme colours and elevation values used by
the CRM. Existing semantic aliases are rebound inside the CRM and its overlays;
the legacy root aliases remain available to Studio, Marketing and Present.
Unused exported tokens are not duplicated into the runtime stylesheet.

## Scope

Shared navigation, headers, controls, forms, tables, cards, semantic labels,
drawers, dialogs, toasts and responsive layouts use the new stylesheet.
Record content, routes and event handlers are retained.
The eleven matching CRM sidebar icons use the supplied 20px SVG exports as
CSS masks, inheriting the row colour in both themes and interaction states.
Home maps to Today, Pipeline to Opportunities, and Script to Reports.
Present and Automations retain their existing icons because no matching
sidebar exports were supplied. Other existing UI icons are unchanged.
The supplied individual SVG/PNG library is available under
`prototypes/assets/icons/` for subsequent component updates; original asset
names and artwork are preserved, including the `Settigs.svg` filename.
Do not change the exported inverse colour pair without design confirmation.

Component source dimensions are CSS pixels. Screenshots embedded in chat may
be scaled. Narrow-view adaptations use wrapping controls, an icon navigation
rail, stacked detail panels and independently scrollable boards and journeys.
These adaptations are not separate Figma mobile layouts.

## Page Headers

Standard CRM list and record pages follow the supplied header references:

1. `.crm-page-heading`: identity, title and optional subtitle.
2. `.crm-page-metrics`: optional unframed metrics with left dividers.
3. `.crm-page-controls`: tabs or view modes on the left, tools and actions on the right.
4. `.crm-page-filters`: compact field shortcuts and removable active-filter chips.

Controls wrap on narrow screens; filters never share a row with page tabs.
Field shortcuts reuse each page's existing options and handlers, and now open
an inline popover everywhere (Opportunities, Deals, Units, Contacts, Chats,
Developments) — the old Deals slide-in filter drawer was retired in favour of
the same anchored popover used elsewhere. The Studio Asset Library also uses
this system (its two plain selects were replaced by field-shortcut chips and
a sort trigger), styled via the same tokens under `#studioApp` even though the
rest of the Studio/Marketing/Present shell stays outside this migration.
Do not add dummy actions, unsupported filter fields or inactive view switches
just to fill the header. Today and New Chat retain their conversational layouts;
Settings retains section navigation, and the custom-pack wizard retains its
workflow controls while sharing the title styling.

### Sort (`.sort-trigger`, `.sort-menu`)

Every page above also gets a shared single-choice sort control: the first
`.crm-filter-field` in the row is the sort trigger (`sortOpen(pageKey, event)`),
showing a leading up/down-arrows icon and reading "Sort" by default or
"Sort: {Property}" once customised. A thin vertical divider (drawn via the
trigger's `::before`, targeted with `[id$="-sort-trigger"]`) separates it from
the field chips. Its popover
(`.filter-menu.sort-menu`) is one flat list of `.fd-item` radio rows — two per
property ("{Property}: {Asc label}" / "{Property}: {Desc label}") with the
active choice checkmarked on the right. Picking a row applies it and closes
the menu. The engine lives in `SORT_PAGES` (`sortRegister`/`sortComparator`/
`sortPick`): each page registers its own sortable properties and exactly one
rule is applied before render. The Units table headers still call `unSortBy`,
which writes the same single rule.

### Filter dropdown contents (`.fd-item`, `.fd-list`, `.fd-search`)

Filter menu bodies no longer use free-standing `.fm-opt` pills; each
`.fm-group` renders a `.fd-list` of `.fd-item` rows via the shared `fdGroup()`
helper — a checkbox on the left for multi-select fields, a checkmark on the
right for single-select fields. A `.fd-search` box is added automatically once
a field has 8+ options (e.g. Units' "View & features"). Selecting fields keep
their existing single- vs multi-select semantics; nothing was reclassified.
Each `.crm-filter-field` shortcut reflects its active state per the design
system via the shared `crmSyncFilterChips()` helper: one value renders inline
("Label: value"), two or more render the plain label plus a filled circular
`.crm-ff-count` badge placed after the chevron (`order: 1`), and the active
chip keeps a white surface with a dark `--on-surface` border. "Clear all" is
plain `.fclear` text. The development detail Availability tab uses the same
chip system (`#dvu-filter-row`, `dvuOpenFilters`/`dvuPick`/`dvuClearF`) with
single-select semantics; its table-header sorting (`dvSortBy`) is unchanged.

## Grouped Resource Panels

Use one existing `.dcard` for a hub of related assets so its background,
border, padding and radius match adjacent CRM panels in both themes. Do not
override the panel surface or introduce nested cards for resource categories.

- `.crm-resource-group`: a labelled category; separate groups with a divider.
- `.crm-resource-row`: a stable-height resource with a shared hover/focus surface.
- `.crm-resource-primary`: a native link or button spanning the icon, label,
    metadata and open indicator. Keep Share and Edit as sibling buttons, never
    nested controls. Use accessible names and tooltips on icon-only actions.
- Missing resources open the link editor for authorised users; otherwise the
    primary action is disabled. Sharing remains disabled until a published URL
    exists. Hover must not imply an action on a disabled resource.
- On narrow screens, wrap labels and metadata while keeping action sizes stable.

The development Marketing & Sales Hub is the reference implementation. Group
Website, Instagram and Facebook under Online presence; brochures, availability
and commercial terms under Sales documents; floor plans, imagery and Present
Mode under Visuals & presentations.

## Validation

Run `npx playwright test tests/crm-design-system.spec.cjs` for light/dark
component geometry, mobile overflow, drawers, navigation and filtering.
Run `npx playwright test tests/present-mode.spec.cjs -g 'single-surface safety'`
to check that Present still isolates the underlying CRM.

Browser screenshots were inspected with Inter loaded. These checks establish
component styling and functional coverage, not a zero-difference full-page
pixel match: prototype content and retained icons differ from the references.