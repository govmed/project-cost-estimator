# M1b - Chrome + Routing

The app now looks like the wireframes. Persistent top rail, left rail
navigation, and routing between all 10 screens (Dashboard is real;
the rest are labeled stubs that fill in during M2-M5).

## What got added/changed

```
sow-calc/
+-- package.json                        <- UPDATED: adds react-router-dom
+-- src/
|   +-- App.tsx                         <- REWRITTEN: now the router root
|   +-- hooks/
|   |   +-- useScenarioTotals.ts        <- shared memoized engine hook
|   +-- ui/
|       +-- routes.tsx                  <- route definitions (10 screens)
|       +-- layout/
|       |   +-- AppShell.tsx            <- chrome wrapper (top + left + outlet)
|       |   +-- TopRail.tsx             <- header: name, status, scenario, KPIs
|       |   +-- LeftRail.tsx            <- navigation with counts + collapse
|       |   +-- ScenarioChooser.tsx     <- scenario switch dropdown
|       |   +-- nav-items.ts            <- nav definitions (rail + routes)
|       +-- components/
|       |   +-- StatusPill.tsx          <- draft/review/approved indicator
|       |   +-- KpiStrip.tsx            <- the 4 KPIs in the top rail
|       +-- pages/
|           +-- DashboardPage.tsx       <- real-ish dashboard (KPIs + breakdowns)
|           +-- PageStub.tsx            <- placeholder for unbuilt screens
+-- tests/ui/app.test.tsx              <- UPDATED: 6 chrome/routing tests
```

## What you do

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M1b.json

cd .\sow-calc

# BOM sweep (Windows PowerShell may add BOMs on write)
Get-ChildItem -Path . -Recurse -Include *.json,*.ts,*.tsx,*.css,*.html -ErrorAction SilentlyContinue |
    Where-Object { -not $_.FullName.Contains('node_modules') } |
    ForEach-Object {
        $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
            $content = [System.Text.Encoding]::UTF8.GetString($bytes[3..($bytes.Length - 1)])
            [System.IO.File]::WriteAllText($_.FullName, $content, (New-Object System.Text.UTF8Encoding $false))
            Write-Host "Stripped BOM: $($_.FullName)" -ForegroundColor Green
        }
    }

# react-router-dom is a new dependency, so reinstall
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install

# Tests: 43 engine + 6 chrome = 49 total
npm test

# Run it
npm run dev
```

Open `http://localhost:5173/`.

## What you should see

- **Top rail** (two rows):
  - Row 1: project name, version, DRAFT pill, client name
  - Row 2: scenario dropdown (left), four KPIs (center), Export/Audit buttons (right)
- **Left rail**: 10 navigation items with count badges (Resources 12, Cloud 8, Other Costs 5, Assumptions 4). A collapse toggle at the bottom.
- **Dashboard** (default landing): big KPI cards + four breakdown panels (by geography, by cloud provider, by phase, run-rate) - all live engine output.

## Try these

1. **Switch scenarios.** Use the dropdown in the top rail. Switch from
   "Base Case" to "Onshore-Only" - the KPIs and dashboard update. (The
   onshore-only scenario is a stub with empty resources, so its numbers
   will be near-zero - that's expected; it was intentionally left
   unpopulated in the seed.)
2. **Click around the nav.** Every item routes. Dashboard is real; the
   others show a labeled placeholder telling you which milestone builds
   them.
3. **Collapse the left rail.** The "« Collapse" button at the bottom
   shrinks it to icons.
4. **Note the M&A Mode item is absent.** Because the seed engagement is
   "Modernization", the M&A nav item correctly hides. It would appear
   for a TSA/Carve-Out/Integration engagement.

## What's still not here

- **Right rail defensibility panel** (click a number -> see its formula) - M1c
- **Clone / Compare buttons** next to the scenario chooser - M1c
- **First-run flow** (start blank vs start with example) - M1c
- **Status pill being clickable** to change status - M2
- **Any editing** - M2 (Resource Planner)

After M1c, M1 is complete. Then M2 is the Resource Planner - the first
screen where you click a cell, type a number, and watch the price change.

## Note on the React Router warnings

The app opts into React Router's v7 future flags (`v7_startTransition`,
`v7_relativeSplatPath`), so you won't see the deprecation warnings in
the console. This also means the eventual upgrade to React Router 7 will
be smoother.
