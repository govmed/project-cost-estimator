# 05 - Other Costs

Licenses, hardware, T&E, training, subcontractors. Lower-density than the
labor or cloud planners because the volume is typically lower (5-20 lines
vs. 50+ for resources/cloud), but the variety of pricing units makes
inline editing trickier.

Single dense table with an inline-detail expansion pattern.

## Layout

```
+----------------------------------------------------------------------------+
|                                                                            |
|  [+ Add cost item ▼]   Filter: [Category ▼] [Run-rate ▼]   Total: $113,250 |
|                                                                            |
|  +------------------------------------------------------------------+      |
|  | Category    | Name                  | Qty | Unit cost | Unit     | Total |
|  +-------------+-----------------------+-----+-----------+----------+-------|
|  | SaaS        | Datadog APM Pro       | 25  | $   31.00 | per-u/mo | $7.75K|
|  |             | 25 users × 10 months  |     |           |          |  RR ✓ |
|  +-------------+-----------------------+-----+-----------+----------+-------|
|  | SaaS        | GitHub Ent + Copilot  | 20  | $   40.00 | per-u/mo | $8.00K|
|  |             | 20 users × 10 months  |     |           |          |       |
|  +-------------+-----------------------+-----+-----------+----------+-------|
|  | Travel      | Onshore SME travel    |  8  | $4,500.00 | one-time | $36.0K|
|  |             | 8 trips, no phase pin |     |           |          |       |
|  +-------------+-----------------------+-----+-----------+----------+-------|
|  | Training    | Client team workshops |  1  | $12,000.00| one-time | $12.0K|
|  |             | Pinned to Hypercare   |     |           |          |       |
|  +-------------+-----------------------+-----+-----------+----------+-------|
|  | Subcontract | Security & pen test   |  1  | $45,000.00| one-time | $49.5K|
|  |             | Test phase · 10% mkup |     |           |          |       |
|  +------------------------------------------------------------------+      |
|  | TOTALS                                                          $113.25K|
|  +------------------------------------------------------------------+      |
|                                                                            |
|  BREAKDOWN BY CATEGORY              RUN-RATE CONTRIBUTION                  |
|  +-----------------------------+   +--------------------------------+      |
|  | SaaS subscription   $15.75K |   | Datadog (RR)        $7.75K/yr  |      |
|  | Travel              $36.00K |   |                                |      |
|  | Training            $12.00K |   | Annual run-rate     $7.75K     |      |
|  | Subcontractor       $49.50K |   |                                |      |
|  +-----------------------------+   +--------------------------------+      |
|                                                                            |
+----------------------------------------------------------------------------+
```

When a row is clicked, it expands inline:

```
+------------------------------------------------------------------+
| > Datadog APM Pro                              Category: [SaaS Subscription ▼]|
|                                                                  |
|   Vendor      [Datadog___________]                               |
|                                                                  |
|   Unit cost   [$ 31.00] per [PerUserPerMonth (v)]                |
|   User count  [    25]                                           |
|   Quantity    [    25]   (auto-equals userCount for this unit)   |
|                                                                  |
|   Markup      [   0.0]%                                          |
|   Phase       [(all phases) (v)]   Scope: 10 months              |
|                                                                  |
|   [x] Include in run-rate                                        |
|                                                                  |
|   COMPUTATION                                                    |
|     $31 × 25 users × 10 months = $7,750                          |
|     (no markup, recurring → included in burn curve monthly)       |
|                                                                  |
|   Notes  [Engineering + ops seats. Renews annually._______]      |
|                                                                  |
|   [Delete] [Duplicate]                                           |
+------------------------------------------------------------------+
```

## Zone explanations

### Main table
Each row is two lines: the headline + a contextual subtitle that varies
by pricing unit:
- OneTime → "8 trips, no phase pin" or "Pinned to {phase}"
- PerMonth / PerYear / PerUserPerMonth → "{quantity} × {months} months"
- PerHour → "{hours} hours"
- With markup → suffix "{X}% mkup"

The `RR ✓` indicator next to a Total cell flags items that flow into the
run-rate projection.

### Expanded detail
Inline, not a side panel. The pricing unit dropdown changes which other
fields are relevant - `userCount` shows only for `PerUser` and
`PerUserPerMonth`. The COMPUTATION callout shows the math live.

### Breakdown by category
Compact list. Click a category name -> filters the main table to that
category.

### Run-rate contribution
Shows only items flagged `includeInRunRate: true`. Useful sanity check
because it's easy to forget which licenses continue post-go-live.

## Adding a cost

`[+ Add cost item ▼]` opens a categorized menu:
- License (defaults to SaaSSubscription / PerUserPerMonth)
- Hardware (Hardware / OneTime)
- Travel (TravelExpense / OneTime)
- Training (Training / OneTime)
- Subcontractor (Subcontractor / OneTime + markup field exposed)
- Custom (blank)

The shortcut presets get the user to "right shape, fill in numbers" fast.

## Interactions

- Inline edit on table cells where possible (Qty, Unit cost).
- Pricing unit and category edits open in the expanded row.
- `Markup` field is hidden in the table view; only visible in expanded
  detail. The subtitle line shows the markup percentage when non-zero.
- Phase picker shows "all phases" as the default. Selecting a phase shifts
  the cost to that phase's months only.

## Scenario switching behavior

Full re-render. Filter/sort state preserved. Expanded row collapses
because the row may not exist in the new scenario.

## States

**Empty:** centered CTA with the six preset choices, plus a "Skip" link
("Skip - this project has no non-labor / non-cloud costs"). Skipping
doesn't disable the screen; it just dismisses the empty-state prompt.

**Error:** PerUser and PerUserPerMonth rows without a `userCount` show with
an inline warning ("Set user count to compute total").

## Keyboard

- `n` or `+` - opens the Add menu
- `/` - focus search
- `Tab` / `Shift+Tab` - move between editable cells
- `Enter` - expand / collapse the focused row
- `Del` - delete row (confirmation)
