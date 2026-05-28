# 10 - Audit Log

Change history. Filterable by user, date, entity, field. Read-only.
Linear timeline; latest first by default.

## Layout

```
+----------------------------------------------------------------------------+
|                                                                            |
|  AUDIT LOG                                                                 |
|  Showing 47 entries · 12 in last 24h · 3 unreviewed                        |
|                                                                            |
|  Filter:  [User ▼]  [Entity ▼]  [Date ▼]  [Field ▼]   Search: [______]    |
|  Sort:    (•) Newest first  ( ) Oldest first                               |
|                                                                            |
|  TODAY                                                                     |
|  +------------------------------------------------------------------+      |
|  | 19:51  tmorales2     Updated  Resource  res_eng_lead              |     |
|  |        billRate.amount    $275 -> $285                            |     |
|  |        Reason: "Rate card refreshed Q2 2026"                      |     |
|  +------------------------------------------------------------------+      |
|  | 19:43  tmorales2     Created  Assumption                          |     |
|  |        topic: "Offshore ratio"  risk: medium  source: assumed     |     |
|  +------------------------------------------------------------------+      |
|  | 19:22  tmorales2     Updated  Project    proj_vtx_...             |     |
|  |        contingencyPct    10.0 -> 8.0                              |     |
|  |        Reason: "Reduced - Discovery now in scope under fixed fee" |     |
|  +------------------------------------------------------------------+      |
|  | 14:08  tmorales2     Created  CloudLineItem  cli_aws_observ_      |     |
|  |        service: "CloudWatch + X-Ray"  quantity: 1                 |     |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  YESTERDAY                                                                 |
|  +------------------------------------------------------------------+      |
|  | 16:45  tmorales2     Cloned   Scenario  sc_onshore_only           |     |
|  |        From: Base Case                                            |     |
|  +------------------------------------------------------------------+      |
|  | 09:12  tmorales2     Updated  Resource  res_dev_pro_x4            |     |
|  |        allocations.ph_build  300 -> 400                           |     |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  EARLIER                                                                   |
|  +------------------------------------------------------------------+      |
|  | 2026-05-20 ...                                                    |     |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  [Load older entries]                                                      |
|                                                                            |
|  TOOLS                                                                     |
|  [Export as CSV]  [Mark all reviewed]                                      |
|                                                                            |
+----------------------------------------------------------------------------+
```

## When an entry is clicked, the right rail opens with the diff:

```
+--------------------------------------+
| Change detail                      × |
|                                      |
| 19:51 · tmorales2                    |
| Updated Resource res_eng_lead        |
|                                      |
| Field: billRate.amount               |
|                                      |
| BEFORE                               |
|   $275                               |
|                                      |
| AFTER                                |
|   $285                               |
|                                      |
| Delta:   +$10 (+3.6%)                |
|                                      |
| Reason:                              |
|   "Rate card refreshed Q2 2026"      |
|                                      |
| Impact (estimated):                  |
|   Engagement Lead billed amount:     |
|     $213,180 -> $220,932             |
|     +$7,752                          |
|                                      |
| [Jump to entity →]                   |
| [Revert this change]                 |
+--------------------------------------+
```

## Zone explanations

### Date groups
Entries group by relative day: Today, Yesterday, Earlier. Within Earlier,
sub-groups by week. Sticky date headers as the user scrolls.

### Entry row
Each row is ONE field change. A single user action that changes multiple
fields (e.g., editing a row in the Resource Planner) produces one audit
entry per field, displayed as a group.

Row content:
- Time / user
- Action (Created / Updated / Deleted / Cloned / Imported)
- Entity type + entity ID (truncated for readability; full ID on hover)
- The field that changed and its before/after summary (e.g., `$275 -> $285`)
- Optional reason (user-supplied)

### Filters
- **User** - dropdown of users who have entries (Phase 1: probably just
  the current user)
- **Entity** - dropdown of entity types
- **Date** - quick presets (Today, This week, This month) + custom range
- **Field** - dropdown of fields that have changes (e.g., billRate,
  contingencyPct, etc.)
- **Search** - free text against entity ID, reason, before/after values

### Right rail (Change detail)
- BEFORE / AFTER values formatted appropriately for the field type
- Delta (computed for numeric fields)
- Reason (the user-supplied justification, if any)
- Impact estimate - if the field affects calculations, an estimate of the
  dollar impact across the active scenario
- **Jump to entity** navigates to the relevant planner with the entity
  selected
- **Revert this change** writes an inverse audit entry (does not delete
  the original entry - the log is append-only)

### Tools strip
- **Export as CSV** - filterable export of the audit log for compliance
- **Mark all reviewed** - resets the "unreviewed" indicator in the top rail

## Interactions

- Click any entry -> right rail with detail.
- Filter chips update the list immediately (client-side, all entries are
  in memory).
- Right-click an entry -> context menu (Jump, Revert, Copy as JSON).

## Scenario switching behavior

The audit log shows entries across **all scenarios** by default. A toggle
at the top (next to the sort radios) restricts to the active scenario.
Project-level changes (e.g., contingencyPct) always show regardless of
scenario filter.

## States

**Empty:** for a new project with no changes yet:
```
            No changes yet.

            Every edit you make is recorded here -
            who, what, when, before, after.
```

**Loading:** skeleton entries.

**Error:** entries are written by the persistence layer; if a write
fails, a banner appears at the top of the workspace ("Audit log write
failed - your last change may not be recorded. Retry?"). Phase 1 uses
local storage so this is rare; Phase 2 with a backend will see it more.

## Keyboard

- `/` - focus search
- Up/Down arrows - navigate entries
- `Enter` on entry - open in right rail
- `j` - jump to entity from open entry
- `r` - revert from open entry (with confirmation)
- `Esc` - close right rail
