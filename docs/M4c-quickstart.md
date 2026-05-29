# M4c — Recharts Dashboard

M4c replaces the Dashboard's flat breakdown lists with real charts:

1. **Monthly Burn Curve** — stacked area (Resource / Cloud / Other) with cumulative line on right axis
2. **Headcount Over Time** — line chart with peak FTE reference line
3. **Cost Stack by Phase** — horizontal stacked bar, one row per phase
4. **By Geography / Cloud Provider / Cloud Category** — small horizontal bar lists
5. **Run-Rate** — 4-cell grid (Monthly / Y1 / Y2 / Y3)

KPI tiles at the top are unchanged. The page is **lazy-loaded** so
Recharts (the chart library) ships in its own bundle and doesn't
slow the initial load of other screens.

## What got added/changed

```
sow-calc/
+-- package.json                                  <- UPDATED: recharts ^3.8.1 added
+-- src/
|   +-- ui/
|       +-- routes.tsx                            <- UPDATED: Dashboard lazy-loaded
|       +-- pages/
|       |   +-- DashboardPage.tsx                 <- REWRITTEN: composed of charts
|       +-- components/dashboard/                 <- NEW DIRECTORY
|           +-- MonthlyBurnChart.tsx              <- NEW: stacked area + cumulative line
|           +-- HeadcountChart.tsx                <- NEW: FTE line with peak reference
|           +-- CostByPhaseChart.tsx              <- NEW: horizontal stacked bar
|           +-- BreakdownBars.tsx                 <- NEW: small CSS bar list
+-- tests/ui/dashboard.test.tsx                  <- NEW: 8 tests
```

**Dependency added**: `recharts ^3.8.1`. Apply step includes `npm install`.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M4c.json

cd .\sow-calc

# BOM sweep
Get-ChildItem -Path . -Recurse -Include *.json,*.ts,*.tsx,*.css,*.html -ErrorAction SilentlyContinue |
    Where-Object { -not $_.FullName.Contains('node_modules') } |
    ForEach-Object {
        $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
            $content = [System.Text.Encoding]::UTF8.GetString($bytes[3..($bytes.Length - 1)])
            [System.IO.File]::WriteAllText($_.FullName, $content, (New-Object System.Text.UTF8Encoding $false))
            Write-Host "Stripped: $($_.FullName)" -ForegroundColor Green
        }
    }

# Install the new dep (Recharts)
npm install

npm test       # expect 153/153
npm run dev
```

Open the app — the Dashboard is the landing page.

## What you'll see

### KPI tiles (unchanged from before)
Final Price ($2,369,903), Total Cost ($1,777,427), Realized Margin (25.0%),
Blended Rate ($/hour with hour count subtitle).

### Monthly Burn Curve (top-left)
A stacked area chart spanning the project's 10 months. Three layers:
- **Indigo** — resource cost (the bulk of spend)
- **Cyan** — cloud cost
- **Amber** — other costs (licenses, training, etc.)

A black/foreground-color line on the secondary right axis shows the
**cumulative total** climbing from $0 to ~$1.78M (total project cost
before reserves and markup).

Hover a column to see exact dollars for that month per category. The
tooltip totals on the right show resource/cloud/other broken out.

### Headcount Over Time (top-right)
Green line of total FTE per month. A dashed horizontal reference line
marks the peak (~10.9 FTE for the seed). Each dot is a discrete month.

This is the chart a delivery PM watches to know when to hire and when
to demobilize.

### Cost Stack by Phase (full-width middle)
Horizontal stacked bars, one per phase (Discovery, Design, Build, Test,
Deploy, Hypercare). Bar length = total cost for that phase, broken into
the same three colored layers as the burn curve.

Build is the longest bar — that's where most of the resource cost
concentrates.

### Three breakdown panels (3-column grid)
- **By Geography** — resource cost share by location (indigo bars)
- **By Cloud Provider** — AWS / Azure share (sky blue bars)
- **By Cloud Category** — Compute / Database / Storage / Networking /
  Observability (cyan bars)

Each panel sorts entries by value descending. Each row shows the
dollar amount, percentage share of total, and a bar whose width is
relative to the largest entry.

### Run-Rate (bottom)
Four cells: Monthly / Year 1 / Year 2 / Year 3. These are the
steady-state operational costs after go-live (cloud services and any
SaaS licenses you flagged as "include in run-rate"). Useful for the
client conversation: "Year 1 burn is $X for the project; after that
your monthly run-rate is $Y."

## Try these (the demos that prove M4c)

### 1. Charts update live as you edit
Open Dashboard. Note the burn curve shape. Now click **Resources**, edit
one of the senior architects' utilization down from 85% to 50%, Enter.
Come back to Dashboard. The burn curve dipped. Total Cost dropped.
Headcount peak shifted.

This is the whole point of having charts driven by engine output:
every input change ripples through visually.

### 2. Switch scenarios mid-page
From Dashboard, open the top-rail scenario dropdown and switch to
**Onshore-Only (Conservative)**. Every chart and KPI updates. The
charts will be empty/zero because the Onshore-Only scenario is
intentionally empty in the seed.

Switch back to **Base Case** — the charts re-populate.

### 3. Compare side-by-side
Click **Scenarios** in the left rail. Clone Base Case, rename it to
"Aggressive", switch to it, edit Target Margin to 40%. Come back to
Scenarios, tick both Base Case and Aggressive. The Compare cards
show the deltas. Open Dashboard for either; the burn shape is the
same (same cost profile) but Final Price KPI is different (40%
margin pushes price higher).

### 4. Check the lazy load
Open DevTools → Network tab. Reload `/dashboard`. You'll see two
JS chunks load: the main bundle (~100KB gz) and a separate
`DashboardPage-*.js` chunk (~117KB gz). Now reload `/resources` — only
the main bundle loads. Recharts (the heavy library) only ships when
the user actually visits Dashboard.

This matters because Recharts + d3 are ~400KB raw. Bundling them with
everything else would slow every screen's initial load. The lazy
boundary keeps the main bundle close to its M4b size.

## Design decisions

**Why a stacked area for burn, not separate lines?** Stacking shows the
total height (cumulative spend per month) at a glance while still
preserving the breakdown. Separate lines make you do arithmetic to see
total spend.

**Why a secondary axis for cumulative?** Cumulative cost can be 10×
larger than any single-month value by the end of the project. Without a
secondary axis the per-month layers would be squashed against the
x-axis.

**Why horizontal bars for By Phase?** Phase names ("Discovery", "Build",
"Hypercare") are wide labels. Vertical bars would force angled labels
or truncation. Horizontal also reads left-to-right as project time.

**Why a CSS bar list for the small breakdowns, not Recharts?** The
breakdowns (Geography / Provider / Category) have 3-7 entries each.
A full Recharts bar chart for those would be overkill — and the
absolute dollar amounts are more important than the visual ranking,
which a CSS bar already gives you. Cheaper, cleaner, no extra chart
machinery.

**Why no Headcount-by-Geography chart?** The HeadcountMonth.byGeography
breakdown is in the engine output. A stacked area would be useful, but
it duplicates information the By Geography panel already shows in
aggregate, and the "when do I hire" question is mostly about the total
line. Polish item if requested.

**Why no sensitivity panel?** The original M4 plan included a small
"what if margin → X%" sensitivity bar. The engine doesn't expose a
sensitivity API yet — that's a small calculation hook to add, plus
its own UI. Pushed to M4d or later.

## What's deliberately not here

- **Sensitivity panel** — small bars showing what Final Price becomes
  at different margin / discount points. Engine API needed first.
- **Headcount stacked by geography** — single line is the primary
  signal; geography breakdown is in its own panel.
- **Burn-curve overlay across scenarios** — would be a nice add on the
  Compare grid (M4b) too. Maybe M4d.
- **Sticky chart legend** — when scrolling past a chart, the legend
  disappears. Could pin it. Polish.
- **Chart export / download** — Recharts can output SVG/PNG.
  Belongs with the Export Center in M5.
- **Recharts color theming** — the chart colors (indigo, cyan, amber,
  green) are hardcoded. They don't pull from the design tokens. Could
  wire those through but the current palette is intentional and
  readable on both light and dark.

## Where things stand

- ✅ M1a/M1b — scaffold + chrome + dashboard
- ✅ M2a/M2b/M2c — Resource Planner end-to-end
- ✅ M3a/M3b — Cloud Planner end-to-end
- ✅ M3c — Other Costs + Project Setup
- ✅ M4a — Scenarios CRUD
- ✅ M4b — Compare grid
- ✅ **M4c** — Recharts Dashboard ← **you are here**
- → M4d — M&A overlay (TSA / carve-out modeling)
- → M5 — Export Center, Assumption Ledger, Audit Log, first-run wizard

Commit:
```powershell
git add .
git commit -m "M4c: Recharts dashboard - burn curve, headcount, by-phase, breakdowns"
```
