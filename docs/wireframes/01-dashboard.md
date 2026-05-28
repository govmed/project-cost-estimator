# 01 - Dashboard

The screen an exec sees. The one screen Claude designs to be a printout-able
artifact in its own right. Headline KPIs, burn curve, geography mix,
phase breakdown, top variances, top assumptions.

## Layout

```
+----------------------------------------------------------------------------+
|                                                                            |
|  HEADLINE KPIs                                                             |
|  +---------------+ +---------------+ +---------------+ +---------------+   |
|  | FINAL PRICE   | | TOTAL COST    | | MARGIN        | | BLENDED RATE  |   |
|  |               | |               | |               | |               |   |
|  |   $2,369,903  | |   $1,777,427  | |     25.0%     | |    $145/hr    |   |
|  |               | |               | |               | |               |   |
|  | vs base: +0%  | | vs base: +0%  | | target: 25.0% | | 15,041 hours  |   |
|  +---------------+ +---------------+ +---------------+ +---------------+   |
|                                                                            |
|  MONTHLY BURN                                              [view phases]   |
|  $400K |                                ██                                  |
|        |                          ██   ███   ██                            |
|        |                     ██  ████ ████ ████ ██                          |
|        |                   ██████████████████████  ██                       |
|        |              ██  ██████████████████████████████ ██                |
|        |         ██████████████████████████████████████████████            |
|     $0 +----------------------------------------------------------+        |
|        Month 1  2   3   4   5   6   7   8   9   10                         |
|        [Disc] [Design][--------- Build ----------][Test][Dep][--Hyper--]   |
|                                                                            |
|  ┌──────────────────────────┐ ┌──────────────────────────────────────┐    |
|  | BY PHASE                 | | BY GEOGRAPHY                         |    |
|  |                          | |                                      |    |
|  | Discovery     $141K      | | US-Onshore         52%   $760K       |    |
|  | Design        $275K  ▓▓▓ | | LATAM-Nearshore    23%   $338K       |    |
|  | Build         $662K  ▓▓▓▓▓▓▓▓▓ | India-Offshore  25%   $373K     |    |
|  | Test          $227K  ▓▓▓ |                                       |    |
|  | Deploy        $146K      | | (Stacked bar showing the breakdown   |    |
|  | Hypercare     $191K      |  for visual reference)                 |    |
|  +--------------------------+ +--------------------------------------+    |
|                                                                            |
|  ┌──────────────────────────┐ ┌──────────────────────────────────────┐    |
|  | BY CLOUD PROVIDER        | | TOP ASSUMPTIONS                      |    |
|  | AWS         $13K  (78%)  | | (!) Offshore ratio        medium    >|    |
|  | Azure       $4K   (22%)  | | (?) Cloud sizing          medium    >|    |
|  |                          | | (✓) Reserved pricing      low       >|    |
|  | Compute    $9.4K         | | (✓) 8% contingency        low       >|    |
|  | Storage    $1.4K         | |                                      |    |
|  | Database   $3.1K         | | [View all 4 assumptions →]           |    |
|  | Networking $3.6K         | |                                      |    |
|  +--------------------------+ +--------------------------------------+    |
|                                                                            |
|  ┌────────────────────────────────────────────────────────────────────┐   |
|  | RUN-RATE (after go-live)                                           |   |
|  | Monthly:  $1,160      Annual: $13,920                              |   |
|  | Comprises: Datadog ($930) + Cloud prod ($230)                      |   |
|  +────────────────────────────────────────────────────────────────────+   |
|                                                                            |
+----------------------------------------------------------------------------+
```

## Zone explanations

### KPIs (top strip)
Four cards, each large enough to read across a meeting room. The "vs base"
field on price/cost shows the delta from the base scenario (since this *is*
the base, it shows "+0%"). On a non-base scenario it shows e.g. "+12.4%".

Margin card shows realized vs target. Green if realized >= target; amber if
within 3pp; red if below. The seed has realized = target so it's green.

Blended rate card also shows total billable hours - useful sanity check.

### Monthly burn chart
Stacked area or stacked bar showing resource + cloud + other per month.
A thin phase band underneath the x-axis labels phases by color. Cumulative
overlay available via toggle in the chart header (small icon, top right of
the chart).

### By phase / by geography (left column)
Compact tables with subtle progress bars (the `▓▓▓` glyphs are
representative - the real UI uses Tailwind/SVG bars). Click any row -> jump
to that phase / geography filter in the relevant planner.

### By cloud provider / top assumptions (right column)
Cloud rolls up by provider AND by category - both views shown stacked.

Top assumptions shows up to 4 risk-ranked items. Icons:
- `(!)` amber for medium risk, unvalidated
- `(?)` gray for low confidence
- `(✓)` green for validated / client confirmed
- Click any row -> jumps to Assumption Ledger filtered to that one.

### Run-rate card (bottom)
Optional, only shown if the scenario has any `includeInRunRate: true`
items. Shows monthly and annual steady-state cost plus a one-line
breakdown of what comprises it.

## Interactions

- **Click any number** -> right rail opens with formula and inputs.
- **Click a chart bar / wedge** -> filters down (e.g., clicking the Build
  phase on the by-phase table jumps to the Resource Planner with phase
  filter = Build).
- **Drag-resize the burn chart vertically** if the user has a lot of months
  and wants a taller view.
- **Hover a phase band** -> tooltip with phase totals.

## Scenario switching behavior

- Every number on this screen updates.
- The right rail closes if open (a number on the old scenario may not exist).
- The burn-chart phase bands re-render (phases live on Project, not Scenario,
  so they don't change - but the per-month totals shift).
- "vs base" deltas in the KPI cards update.

## States

**Empty:** new scenario with no resources/cloud/other yet. Show a sparse
version of this layout where every KPI is `$0` with a CTA pointing to the
relevant planner: "Add resources to begin estimating →".

**Loading:** skeleton rectangles in place of every KPI card and the chart.
Skeletons match the eventual heights so the layout doesn't jump.

**Error:** if the engine returns an error (e.g., missing FX rate), show a
banner across the top of workspace with the engine message and a "Fix in
Project Setup" button. The KPI cards show `--` rather than misleading $0.

## Keyboard

- `1`/`2`/`3`/`4` - focus KPI cards
- `b` - jump focus to burn chart, then arrow keys to scrub months
- Tab order: KPIs (left to right) -> burn chart -> bottom-left table -> bottom-right table
