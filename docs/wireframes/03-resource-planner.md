# 03 - Resource Planner

The labor cost workhorse. Spreadsheet-dense. This is where users spend the
most time, often live in a pricing meeting. Performance, keyboard-efficiency,
and inline-edit speed are non-negotiable.

## Layout

```
+----------------------------------------------------------------------------+
|                                                                            |
|  [+ Add resource]    Filter: [Geo ▼] [Phase ▼] [Level ▼]    Search: [___]  |
|  Showing 12 of 12 resources                          Group by: [Role ▼]    |
|                                                                            |
|  +------------------------------------------------------------------+      |
|  | Role/Lvl/Geo  | Disc Des Bld Tst Dep Hyp | Hours | Bill  | Cost  | M%   |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | Engagement L  |  50  50  50  50  50  50 |   748 |$213K  | $146K | 32%  |
|  | Senior US-On  |                          |       |       |       |      |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | Project Mgr   | 100 100 100 100 100 100 | 1,496 |$321K  | $209K | 35%  |
|  | Senior US-On  |                          |       |       |       |      |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | Solution Arch | 100 100  50  25  25  10 |   765 |$249K  | $164K | 34%  |
|  | Advisor US-On |                          |       |       |       |      |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | Cloud Arch    |  75 100  50  25  50  25 |   687 |$189K  | $124K | 35%  |
|  | Senior US-On  |                          |       |       |       |      |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | Business Anal |  ⋯⋯⋯ collapsed ⋯⋯⋯       |   ⋯⋯⋯ |  ⋯⋯⋯  |  ⋯⋯⋯  |  ⋯⋯⋯ |
|  | Pro    US-On  |                          |       |       |       |      |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | Tech Lead     |   0 100 100 100 100  50 | 1,407 |$204K  | $127K | 38%  |
|  | Senior LATAM  |                          |       |       |       |      |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | Full-Stack x2 |   0 100 200 200 100  50 | 1,989 |$229K  | $143K | 37%  |
|  | Senior LATAM  |                          |       |       |       |      |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | Full-Stack x4 |   0 100 400 400 200   0 | 3,277 |$213K  | $125K | 41%  |
|  | Pro India     |                          |       |       |       |      |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | ... 4 more rows ...                                                     |
|  +---------------+--------------------------+-------+-------+-------+------|
|  | TOTALS                                  | 15,041|$2.18M | $1.47M| 33%  |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  GEOGRAPHY MIX                                       UTILIZATION SUMMARY   |
|  US-Onshore        52%  ███████████                  Avg utilization: 85%  |
|  LATAM-Nearshore   23%  █████                        Min: 85%   Max: 90%   |
|  India-Offshore    25%  ██████                                             |
|                                                                            |
|  GUARDRAILS                                                                |
|  (!) None active. Add Security Architect to flag PCI compliance.           |
|                                                                            |
+----------------------------------------------------------------------------+
```

## Zone explanations

### Resource table (the main grid)
One row per resource (or resource-team like "Full-Stack x4"). Columns:

| col | content | inline edit? |
|---|---|---|
| Role / Level / Geo | Role name, level, geography on two lines | Click any -> dropdown picker |
| Phase % columns | One column per phase (Disc, Des, Bld, ...). Cell shows allocation % for that phase. | Yes - tab between cells, type number |
| Hours | Computed billable hours across all phases | No (derived) |
| Bill | Computed billed amount | No (derived) |
| Cost | Computed internal cost | No (derived) |
| M% | Computed margin % | No (derived) |

The bill rate and cost rate are NOT in the visible columns by default
because they're set once per resource and rarely edited. They appear in the
expanded row (click the role to expand) and in the right rail when any
number is clicked.

**Expanded row** (one click on the role cell):
```
+------------------------------------------------------------------+
| > Full-Stack Engineer (Senior, LATAM-Nearshore)            x2 [✎]|
|   Bill rate:      $115/hr  [from rate card · override]            |
|   Internal cost:   $72/hr  [from rate card · override]            |
|   Hours/week:        40    Utilization: 85%                       |
|   Allocations:    Disc 0  Des 100  Bld 200  Tst 200  Dep 100  Hyp 50 |
|   Notes:          2 senior engineers, combined FTE.               |
|                                                                   |
|   [Delete resource] [Duplicate] [Add as assumption]               |
+------------------------------------------------------------------+
```

The notes field is free text. The "Add as assumption" button is one of the
key defensibility hooks - it creates an Assumption linked to this resource
asking the user to validate the staffing decision.

### Filters and grouping
- **Filter chips** (Geo / Phase / Level) - dropdown checklists.
- **Search** - free text against role name, geography, notes.
- **Group by** - Role (default), Geography, Skill Level, Phase. Group headers
  show subtotals (Hours / Bill / Cost / M%).

### Geography mix (bottom-left)
Real-time stacked bar showing the cost mix by geography. Hovering shows the
exact percentage and dollar amount. This is what gets challenged in deal
rooms ("are you 50% offshore? we won't accept that") so it's prominent.

### Utilization summary (bottom-right)
Average across all resources plus min/max. If any resource is set to a
utilization the firm flags as unrealistic (default thresholds: <70% or
>95%), this card turns amber and lists the offenders.

### Guardrails (bottom strip)
Real-time validation against firm rules. Examples:
- "100% offshore on a PCI workload" -> amber with "[Add onshore lead]" CTA
- "No Security Architect on a regulated workload" -> amber
- "Bill rate $250 below the rate card by 15%" -> amber with "[Justify]"
- "Senior Architect allocated <25% in Discovery" -> info

Each guardrail has an action: ignore (writes an assumption), fix (jumps to
the relevant field), or dismiss permanently (adds to this scenario's
ignore-list).

## Interactions

- **Click any phase % cell** -> inline editable, `Enter` confirms, `Tab`
  moves to the next cell. Total/Hours/Bill/Cost/M% recompute live.
- **Click the role cell** -> expands the row to show full detail.
- **Right-click any row** -> context menu: Duplicate, Delete, Move to
  scenario X, Convert to assumption.
- **Drag-select multiple cells** -> bulk-edit (e.g., select 4 cells, type
  100, all four are set).
- **Paste from Excel** -> if the user copies a block of % values from
  Excel, paste into the table fills the corresponding cells.

The bulk-edit and paste-from-Excel behaviors are critical - real users
move staffing plans in and out of Excel constantly.

## Scenario switching behavior

- The entire table re-renders with the new scenario's resources.
- Filter and grouping state preserved.
- Selected row (if any) is forgotten - the resource may not exist in the new
  scenario.
- Geography mix and guardrails recompute.

## States

**Empty:** large CTA in the table area:
```
            No resources yet for this scenario.

            [+ Add your first resource]
            or
            [Copy resources from another scenario →]
```

**Loading:** skeleton rows matching the table layout, 6-8 placeholder rows.

**Error:** if a resource references a Role that's been removed from the
catalog, that row shows with an amber background and a "Resolve role"
button next to the Role cell.

## Keyboard

- `n` or `+` - add new resource
- `/` - focus search
- `f g` - open Geography filter
- `f p` - open Phase filter
- `f l` - open Level filter
- Arrow keys - navigate cells in the table
- `Enter` - edit current cell, `Esc` to cancel
- `Tab` / `Shift+Tab` - next / previous cell
- `Ctrl+D` - duplicate current row
- `Del` - delete current row (with confirmation)
- `Ctrl+C` / `Ctrl+V` - copy / paste cell range (compatible with Excel)
