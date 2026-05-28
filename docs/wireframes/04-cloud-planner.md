# 04 - Cloud Planner

AWS and Azure (and future providers) line items. Less dense than the Resource
Planner because cloud has fewer rows per scenario but each row has more
configurable fields. Two-pane: list on left, detail on right.

## Layout

```
+----------------------------------------------------------------------------+
|                                                                            |
|  [+ Add line item ▼]  Filter: [Provider ▼] [Category ▼] [Env ▼]            |
|  Showing 8 of 8 items. Subtotal: $17,456                                   |
|                                                                            |
|  +------------------------------------------+--------------------------+   |
|  |  ROW LIST                                |  ROW DETAIL              |   |
|  |                                          |                          |   |
|  |  AWS                                     |  EC2 m6i.xlarge          |   |
|  |  +------------------------------------+  |  AWS Compute · us-east-1 |   |
|  |  | EC2 m6i.xlarge   prod   Res 1yr    |  |                          |   |
|  |  |   8 inst-mo  @ $105.50  $844/mo  > | <-- selected, expanded     |   |
|  |  +------------------------------------+  |                          |   |
|  |  | EC2 m6i.large    dev    OnDemand   |  |  Service                 |   |
|  |  |   6 inst-mo  @ $71.00   $149/mo    |  |  [EC2 (v)]               |   |
|  |  +------------------------------------+  |  SKU                     |   |
|  |  | RDS Aurora       prod   Res 1yr    |  |  [m6i.xlarge ____]       |   |
|  |  |   2 inst-mo  @ $285.00  $570/mo    |  |  Region                  |   |
|  |  +------------------------------------+  |  [us-east-1 (v)]         |   |
|  |  | S3 Standard      prod   OnDemand   |  |                          |   |
|  |  |   4 TB-mo    @ $23.00   $92/mo     |  |  Environment             |   |
|  |  +------------------------------------+  |  ( ) dev   ( ) test      |   |
|  |  | CloudFront       prod   OnDemand   |  |  ( ) staging  (•) prod   |   |
|  |  |   10 TB-mo   @ $85.00   $850/mo    |  |  ( ) dr                  |   |
|  |  +------------------------------------+  |  Env multiplier  [1.00]  |   |
|  |  | CloudWatch+XRay  prod   OnDemand   |  |                          |   |
|  |  |   1 stack    @ $450.00  $450/mo    |  |  Pricing model           |   |
|  |  +------------------------------------+  |  [Reserved 1yr (v)] (i)  |   |
|  |                                          |                          |   |
|  |  Azure                                   |  Unit cost     Quantity  |   |
|  |  +------------------------------------+  |  [$ 105.50 ]   [   8 ]   |   |
|  |  | AKS D4s_v5       prod   Res 1yr    |  |  Unit name [instance-month]| |
|  |  |   6 node-mo  @ $118.00  $708/mo    |  |                          |   |
|  |  +------------------------------------+  |  STEADY STATE            |   |
|  |  | Blob Storage     prod   OnDemand   |  |  $105.50 × 8 × 1.00 =    |   |
|  |  |   3 TB-mo    @ $21.00   $63/mo     |  |   $844.00 / month        |   |
|  |  +------------------------------------+  |                          |   |
|  |                                          |  Ramp curve              |   |
|  |  AWS subtotal:    $13,668                |  ( ) flat                |   |
|  |  Azure subtotal:  $ 3,788                |  ( ) linear              |   |
|  |  ─────────────────────                   |  (•) step                |   |
|  |  Total:           $17,456                |  ( ) sCurve              |   |
|  |                                          |  ( ) frontLoaded         |   |
|  |                                          |  ( ) backLoaded          |   |
|  |                                          |  Start at: [Deploy (v)]  |   |
|  |                                          |                          |   |
|  |                                          |  RAMP PREVIEW            |   |
|  |                                          |                          |   |
|  |                                          |  $844 |          ██████  |   |
|  |                                          |       |          ██████  |   |
|  |                                          |   $0  +-----------       |   |
|  |                                          |        M1 M2 M3 M4 M5... |   |
|  |                                          |        4 months × $844 = |   |
|  |                                          |        $3,376 over phase |   |
|  |                                          |                          |   |
|  |                                          |  [x] Include in run-rate |   |
|  |                                          |                          |   |
|  |                                          |  Description             |   |
|  |                                          |  [Prod application tier_]|   |
|  |                                          |                          |   |
|  |                                          |  [Delete] [Duplicate]    |   |
|  +------------------------------------------+--------------------------+   |
|                                                                            |
+----------------------------------------------------------------------------+
```

## Zone explanations

### Row list (left pane)
Grouped by provider (AWS, Azure, ...). Each row shows:
- Service name + key spec (instance type, region)
- Environment + pricing model
- Quantity × unit cost × env multiplier = monthly steady-state cost

The row that's currently selected has a `>` indicator and is highlighted.
Clicking a row loads it into the detail pane.

Subtotals per provider, plus grand total. Each subtotal is clickable to
open in the right rail.

### Row detail (right pane)
Full editor for the selected line item. Sections from top to bottom:

1. **Identification** - service, SKU, region
2. **Environment** - radio + multiplier (multiplier defaults to 1.0; user
   can set dev=0.35 etc.)
3. **Pricing model** - dropdown with `(i)` icon explaining the model is
   for traceability only (the unit cost is already model-specific)
4. **Unit cost + quantity + unit name** - the three numbers that compute
   steady-state cost. Steady-state shown live below.
5. **Ramp curve** - radio for the 6 curves. Step shows an additional
   "Start at" phase picker. Live ramp preview chart below.
6. **Run-rate toggle** - checkbox: "Include in run-rate"
7. **Description** - free text
8. **Destructive actions** - delete, duplicate

### Steady state callout
A bordered callout in the detail pane showing the math live:
```
unitCost × quantity × envMultiplier = monthlyAmount
$105.50  × 8        × 1.00          = $844.00 / month
```
This is the defensibility moment - the user sees exactly how the steady-state
number is derived without leaving the field.

### Ramp preview
A miniature bar chart showing the per-month spend across project months
using the current ramp curve. Updates in real time as the user changes the
curve, environment multiplier, or quantity.

## Adding a line item

`[+ Add line item ▼]` opens a small menu:
- From AWS catalog (opens a service picker keyed to the current seed/active
  cloud pricing table)
- From Azure catalog (same, for Azure)
- Custom (blank line item, fill in by hand)
- From template (saved templates like "standard prod stack")

Picking from a catalog pre-fills service, SKU, default region, default
unit cost. The user then sets quantity and ramp.

## Interactions

- Click any row -> loads into detail pane (single-pane on narrow viewports;
  detail slides over the list).
- Drag-and-drop to reorder rows within a provider group.
- Ctrl+D in the list duplicates the selected row.
- Edit any field in the detail pane -> steady-state and ramp preview update
  immediately.

## Scenario switching behavior

- Full re-render of both panes.
- If the previously selected line item exists in the new scenario (same ID
  due to clone), it stays selected. Otherwise the first row is selected.
- Filter and provider grouping state preserved.

## States

**Empty:** detail pane is hidden. List pane shows:
```
            No cloud line items yet.

            [+ Add from AWS catalog]
            [+ Add from Azure catalog]
            [+ Add custom]

            (i) Defaults are illustrative.
            See Settings > Cloud Pricing.
```

**Loading:** skeleton rows in the list; detail pane shows empty placeholder.

**Error:** if a line item references a service no longer in the catalog,
that row gets an amber bg and a "Resolve service" CTA. The row still
contributes to totals using the stored unit cost.

## Keyboard

- `n` or `+` - opens the "Add line item" menu
- `/` - focus filter row's search if shown
- Up/Down arrows in the list - navigate rows
- `Enter` on a list row - jump focus into detail pane
- `Esc` from detail pane - return focus to list
- `Ctrl+D` - duplicate selected row
- `Del` - delete selected row (confirmation)
