# CRM Styling

The v2 prototype loads `prototypes/crm-design-system.css` after its embedded
styles. This stylesheet maps the existing CRM components to Bricly DS 1.2.

Page header anatomy, variants and interaction rules are specified in
[page-header.md](page-header.md).

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

The shared `.fd-operator` header uses a 260 x 36px border box, 8px padding,
4px corners and the Surface Container Low background. Its label is Inter
500 12px/16px with -0.15px tracking and On Surface text. The popover is 278px
wide including 8px padding and its border, constrained on narrow screens.
The header describes the current selection rule; its chevron is decorative,
not a new operator picker. The original `.fm-label` text remains unchanged
inside it because field shortcuts match that text to open the correct group.
Filter options retain their own typography, with 36px minimum rows and
selection shown by the checkbox or checkmark rather than a filled row.
Sort rows retain their existing dimensions and have no operator header.

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

## Development, Unit and Deal Entry

The v2 prototype loads `prototypes/admin-workflows.js` after its core CRM
scripts. It reuses the CRM tokens and native dialog behavior for staged forms.
Owner is the Admin persona for these workflows. Permission checks run both at
entry and at submission; switching personas closes an open workflow.

| Surface | Action | Access | Result |
| --- | --- | --- | --- |
| Developments overview | Add development | Owner, Manager | Setup request under an existing agreement |
| Development detail | Edit development | Owner | Details and render library updated on Save |
| Development detail / Units overview | Add unit | Owner | Off-market draft, or explicitly published unit |
| Unit detail | Edit unit | Owner | Specifications, media and mapping updated on Save |
| Deals overview | Add deal: existing opportunity | Owner, Manager, own opportunities for Rep | POS conversion with existing history retained |
| Deals overview | Add deal: external | Owner, Manager | Historical or ongoing signed-POS deal with source attribution |

### Development Intake

Development details and setup contact -> source files/links and missing-data
notes -> existing-agreement review and confirmation. Submission creates a
`Submitted - scope review` request, not a live development and not a charge.
Scope outside the agreement requires separate approval before fulfillment.
Drafts and submitted requests can be reopened from the overview request list.

### Unit Readiness and Editing

Unit details -> mapping -> images/unit floorplan -> review. A unit must belong
to an existing development and have a unique unit reference. Saving a draft
keeps it `off_market`. Publishing requires the same Owner to confirm either
the marker on the appropriate floor drawing or a no-floorplan exemption with
a reason. A unit-specific PDF/image is distinct from its position on the
development's floor drawing. Replacing a shared drawing invalidates stored
mapping confirmations and takes affected available units off market.

The unit editor stages uploads and changes until Save. List-price edits do
not rewrite signed deal prices. Development/unit identity keys remain read-only;
the current demo joins records by development name and unit reference. Moving
a live unit or renaming those identities requires a separate migration flow.

### Deal Entry

Choose source -> buyer and contracted unit -> dated milestones/evidence ->
confirm inventory effects. Linking converts only the selected contracted unit;
the previous shortlist is retained as conversion metadata. Existing contacts
are reused; matching phone, email or name blocks accidental new contacts.
An existing deal on the same unit blocks another entry. Reconciliation of
held/reserved/sold external inventory requires an explicit reason.

POS entry reserves the unit. Recorded final deed marks it sold and removes it
from other open opportunity shortlists, adding activity for those reps. Final
deed and commission receipt are independent facts. External entry does not
invent buyer receipts, bank/notary milestones, selling history or consent.
Unknown evidence can be noted for later collection. Deal drafts are resumable.

### Prototype Boundary

All workflow data, draft lists, audit entries and uploaded object URLs are
held in the current browser session and are lost on reload. No setup request
is sent to Bricly, no agreement entitlement is verified, and no payment is
taken. Production needs durable workspace-scoped storage, authenticated server
authorization, upload scanning/storage, a setup fulfillment queue, agreement
coverage validation and transactional uniqueness/inventory checks. The local
role checks are prototype behavior, not a server security boundary.

## Validation

Run `npx playwright test tests/crm-design-system.spec.cjs` for light/dark
component geometry, mobile overflow, drawers, navigation and filtering.
Run `npx playwright test tests/present-mode.spec.cjs -g 'single-surface safety'`
to check that Present still isolates the underlying CRM.

Browser screenshots were inspected with Inter loaded. These checks establish
component styling and functional coverage, not a zero-difference full-page
pixel match: prototype content and retained icons differ from the references.