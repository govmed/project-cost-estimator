# 07 - Scenarios & Compare

The strategic surface. Two modes: List (manage scenarios) and Compare
(side-by-side analysis). The compare mode is the killer feature for live
pricing meetings.

## Layout: List mode

```
+----------------------------------------------------------------------------+
|                                                                            |
|  SCENARIOS                                       [+ New scenario ▼]        |
|                                                                            |
|  +------------------------------------------------------------------+      |
|  | (BASE) Base Case                            $2,369,903   25.0% > |      |
|  |        Recommended sourcing mix             [Set active ✓]       |      |
|  |        Created 2026-05-27 · 12 res · 8 cloud                     |      |
|  +------------------------------------------------------------------+      |
|  | Onshore-Only (Conservative)                 $XXX,XXX    XX.X% > |      |
|  |        Compliance-driven variant             [Set active]         |      |
|  |        Cloned from Base Case · 2026-05-27 · 0 res · 0 cloud      |      |
|  |        (i) Stub - resources not yet copied                       |      |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  [Compare 2 selected →]                                                    |
|                                                                            |
+----------------------------------------------------------------------------+
```

## Layout: Compare mode (2 scenarios)

```
+----------------------------------------------------------------------------+
|                                                                            |
|  COMPARE                                              [Back to list]       |
|  Selected: Base Case ⇄ Onshore-Only        [+ Add scenario] [Pivot rows ▼] |
|                                                                            |
|  +------------------------------------------------+----------+----------+  |
|  |                                                | BASE CASE| ONSHORE  |  |
|  +------------------------------------------------+----------+----------+  |
|  | HEADLINES                                                              |
|  | Final price                                    | $2.37M   | $3.95M ▲ |  |
|  | Total cost                                     | $1.78M   | $2.96M ▲ |  |
|  | Realized margin %                              | 25.0%    | 25.0%    |  |
|  | Effective blended rate                         | $145/hr  | $238/hr ▲|  |
|  +------------------------------------------------+----------+----------+  |
|  | COMPOSITION                                                            |
|  | Resources subtotal                             | $1.47M   | $2.50M ▲ |  |
|  |   onshore                                      | 52%      | 100%   ▲ |  |
|  |   nearshore                                    | 23%      | 0%     ▼ |  |
|  |   offshore                                     | 25%      | 0%     ▼ |  |
|  | Cloud subtotal                                 | $17K     | $17K     |  |
|  | Other costs subtotal                           | $113K    | $113K    |  |
|  +------------------------------------------------+----------+----------+  |
|  | TIMELINE                                                                |
|  | Project duration                               | 10 mo    | 10 mo    |  |
|  | Peak FTE                                       | 10.9     | 6.2    ▼ |  |
|  | Total billable hours                           | 15,041   | 9,820  ▼ |  |
|  +------------------------------------------------+----------+----------+  |
|  | COMMERCIALS                                                            |
|  | Target margin                                  | 25.0%    | 25.0%    |  |
|  | Contingency                                    | 8.0%     | 6.0%   ▼ |  |
|  | Mgmt reserve                                   | 3.0%     | 3.0%     |  |
|  | Discount applied                               | 0.0%     | 0.0%     |  |
|  +------------------------------------------------+----------+----------+  |
|  | DELTA                                                                  |
|  | Base case → Onshore-Only:  +$1.58M  (+66.7%)                          |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  BURN COMPARISON                                                           |
|  $500K |                                                                   |
|        |              Onshore                                              |
|        |         ████████████                                              |
|        |    ███████████████████ ████                                       |
|        |   █████████████████████████ ██  ← Onshore  ────                   |
|        |   ████████████████████████████  ← Base     ━━━━                   |
|     $0 +────────────────────────────────                                   |
|        M1  M2  M3  M4  M5  M6  M7  M8  M9  M10                             |
|                                                                            |
|  EXPORT COMPARISON                                                         |
|  [Download PDF report]  [Copy as table to clipboard]  [Generate share link]|
|                                                                            |
+----------------------------------------------------------------------------+
```

## Layout: Compare mode (3-4 scenarios)

Same shape, but the value columns become narrower. The screen forces
horizontal scroll past 4 columns; the row labels stay sticky to the left.

## Zone explanations

### List mode
One card per scenario. Active scenario is marked (BASE / ACTIVE). Each card
shows:
- Name + short description
- Final price + realized margin %
- Created date + resource/cloud counts
- A `>` to navigate into that scenario (sets it active)

`[+ New scenario ▼]` dropdown:
- Empty scenario
- Clone from {current scenario}
- Clone from {pick scenario}
- From template

Selecting 2-4 scenarios (checkboxes on cards) unlocks the `[Compare]` button.

### Compare mode

**Row groups** organized by topic:
- Headlines (price, cost, margin, rate)
- Composition (subtotals, sourcing mix)
- Timeline (duration, peak FTE, hours)
- Commercials (margin, contingency, discount)

Each row spans all selected scenario columns. The first non-base scenario
gets a delta indicator (▲ red for "higher", ▼ green for "lower") relative
to the leftmost (base) column. Indicators are reversed for things where
higher-is-better (margin %).

**Pivot rows dropdown** lets the user change the row groups:
- Default (above)
- By phase (one row per phase × cost component)
- By geography
- By cloud category
- By assumption (shows which assumptions differ between scenarios)

**Delta footer** summarizes the headline price difference between scenarios.

**Burn comparison chart** overlays the burn curves of all selected scenarios.

### Export from compare
PDF report is pre-formatted for executive consumption. Copy-as-table works
into Excel and into chat tools (Slack, Teams). Share link encodes the
selection and pivot in the URL.

## Interactions

- **In list mode:** check boxes on 2-4 scenarios, click `[Compare]`.
- **In compare mode:** click any cell -> right rail explains that
  scenario's value for that row (with the formula chain).
- **Pivot dropdown** rebuilds rows without leaving the screen.
- **Drag column headers** to reorder which scenario is the reference.

## Scenario switching behavior

This screen IS the scenario switcher. Switching the active scenario via
the top-rail dropdown will still work, but doesn't affect the compare view.

## States

**Empty (only one scenario exists):**
```
            You have one scenario.

            Compare needs at least two.
            [+ Clone Base Case to get started]
```

**Loading:** skeletons in the comparison table. Burn chart shows skeleton.

**Error:** if a scenario fails to calculate (engine error), its column
shows `--` in every cell with a "Fix in Project Setup" CTA above the
column header.

## Keyboard

- `c` then `c` - clone current scenario (same as top-rail Clone)
- `Tab` between cards in list mode; Space to toggle selection
- In compare: arrow keys to navigate cells; `p` opens the pivot menu
- `e` - export comparison PDF
