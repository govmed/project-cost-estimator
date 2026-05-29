# M4b — Scenarios Compare Grid

M4b adds the side-by-side Compare view on top of M4a's CRUD page. The
**Scenarios** screen now has checkboxes per row; tick 2-4 scenarios and
the Compare grid below renders one card per scenario with deltas
relative to the first one selected.

## What got added/changed

```
sow-calc/
+-- src/
|   +-- hooks/
|   |   +-- useAllScenarioTotals.ts                   <- NEW: per-scenario engine totals
|   +-- ui/
|       +-- pages/
|       |   +-- ScenariosPage.tsx                     <- UPDATED: checkboxes + Compare grid
|       +-- components/scenarios/
|           +-- ScenarioMetricRow.tsx                 <- NEW: labeled metric with delta
|           +-- ScenarioCompareCard.tsx               <- NEW: one column of the grid
+-- tests/ui/
    +-- scenarios.test.tsx                            <- UPDATED: heading is now "Scenarios & Compare"
    +-- scenarios-compare.test.tsx                    <- NEW: 9 Compare tests
```

No new npm dependencies.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M4b.json

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

npm test       # expect 145/145
npm run dev
```

Click **Scenarios** in the left rail.

## What you'll see

The Scenarios table from M4a, plus:
- A leftmost **checkbox column** for picking 2-4 scenarios to compare.
- Below the table, a **Compare ({N} of 4 max)** section:
  - 0 selected: "Tick scenarios above to compare them side-by-side."
  - 1 selected: "One scenario selected. Tick one more..."
  - 2-4 selected: side-by-side cards in a responsive grid.
- A **Clear selection** button appears when anything is selected.
- The page title is now "**Scenarios & Compare**" (was just "Scenarios" in M4a).

## Try these (the demos that prove M4b)

### 1. Compare Base Case to Onshore-Only
Tick **Base Case**, then tick **Onshore-Only (Conservative)**. Two cards
appear side-by-side. Base Case is the baseline (no deltas); Onshore-Only
shows deltas for every metric. The selection labels show `BASE` next
to the first checkbox and `+1` next to the second.

> **Note about the seed:** the Onshore-Only scenario in the seed is
> intentionally empty (0 resources, 0 cloud, 0 other-costs) - so its
> Final Price is $0 and deltas are −100%. That's a real seed gap; the
> M4b UI is doing exactly what you'd expect with that input. Clone Base
> Case to a new scenario and edit it down to see meaningful deltas.

### 2. Make a meaningful comparison
- On the Scenarios page, click `+ Clone active scenario` to make a copy of Base Case.
- Rename it to "Aggressive Margin".
- Click "View" on the clone to switch active, then go to **Project Setup**.
- Change Target Margin from 25% to 40%, Enter.
- Come back to Scenarios. Tick both Base Case and Aggressive Margin.
- The Compare grid now shows real deltas — Aggressive Margin has a
  higher Final Price (the math: higher margin = higher price for same cost).

### 3. Watch the delta colors
The component is direction-aware:
- **Final Price / Total Cost / Subtotals**: positive deltas are red
  (more expensive), negative are green (cheaper).
- **Realized Margin**: positive deltas are green (better margin),
  negative are red.
- **Hours / Blended Rate / Run-Rate**: neutral (muted color either way) -
  these are facts, not "good/bad" outcomes.

### 4. Try 3 scenarios at once
Clone another scenario. Now you have 3+. Tick three; the grid shows
3 cards in a row. All deltas are still relative to the first selected.

### 5. Hit the 4-scenario cap
Clone until you have 5+. The grid maxes out at 4 selections — the 5th
checkbox becomes disabled.

### 6. Test selection order
Tick scenarios in different orders. The baseline is always whichever
you ticked **first**. Untick + retick changes the baseline. Use this
to flip which scenario is the reference point.

### 7. Selection survives store changes
Tick 2-3 scenarios. Rename one of them. The grid updates the card
header in place — selection survives the rename.

If you **delete** a selected scenario via its ✕ button, the deleted
one falls out of the grid automatically.

## Design decisions

**The baseline is the first selected, not always the "base" scenario.**
This is intentional — the analytical question is "how does X compare to
Y?" and the user picks both X and Y. The project's base scenario is a
canonical reference, but in compare you often want to see one
alternative-vs-another (e.g., "Onshore vs Offshore" without involving
Base Case at all).

**Cards include "Run-Rate / month" as neutral.** Run-rate is steady-state
operational cost after the project completes. Higher run-rate isn't
strictly bad (more SaaS = more capability) so I deliberately didn't
color it red/green. Same logic for blended rate.

**One scenario alone doesn't render a card.** A single column with no
deltas isn't really a "comparison" — it's just a smaller version of the
Dashboard. So with one selection we show a tip asking for one more.

**Cards don't have inline rename/clone/delete.** Those actions live in
the table row above. Putting them in the card too would just clutter
the comparison view; the user is in "looking, not editing" mode.

## What's deliberately not here yet

- **Granular drill-down** ("which resources differ between these
  scenarios?"). M5 — once we have the assumption ledger and audit log
  pages, the drill-downs make sense there too.
- **Diff highlight intensity** (color saturation by delta magnitude).
  The current colored deltas are clear enough.
- **Charts in the Compare view.** Recharts upgrades land in M4c, then
  it'll be easy to add a side-by-side burn curve.
- **Save a compare selection as a "view".** M5.
- **Share link for a compare configuration.** M5 export work.

## Where things stand

- ✅ M1a/M1b — scaffold + chrome + dashboard
- ✅ M2a/M2b/M2c — Resource Planner end-to-end
- ✅ M3a/M3b — Cloud Planner end-to-end
- ✅ M3c — Other Costs + Project Setup
- ✅ M4a — Scenarios CRUD
- ✅ **M4b** — Compare grid ← you are here
- → M4c — Recharts-based Dashboard upgrade (burn curve chart, sensitivity bars)
- → M4d — M&A overlay (TSA/carve-out modeling)

Commit:
```powershell
git add .
git commit -m "M4b: Scenarios Compare grid (2-4 scenarios with deltas)"
```
