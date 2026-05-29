# M5d-2 — Defensibility on Every Surface

M5d-2 finishes the defensibility-panel wiring. Every clickable KPI in the
app now opens the right-rail drawer. Architecture also got a small
refactor: the drawer is mounted once in AppShell instead of per-page,
with state lifted to a small Zustand store.

## Newly clickable in M5d-2

- **Dashboard** — Total Cost, Realized Margin, Blended Rate tiles
  (Final Price was already wired in M5d-1)
- **Top rail KpiStrip** — all four KPIs (Price, Cost, Margin, Blended)
  on every project route
- **Compare grid cards** — Final Price, Total Cost, Realized Margin
  rows in each scenario card. Each opens defensibility scoped to *that*
  scenario, not the active one.

Already wired in M5d-1 (and still works):
- Dashboard Final Price tile
- Resource Planner Bill column cells

## What got added/changed

```
sow-calc/
+-- src/
|   +-- data/
|   |   +-- defensibility-store.ts                       <- NEW
|   |   +-- kpi-provenance-types.ts                      <- UPDATED: optional scenarioId
|   +-- ui/
|       +-- hooks/
|       |   +-- useKpiProvenance.ts                      <- UPDATED: target by scenarioId
|       +-- components/
|       |   +-- KpiStrip.tsx                             <- UPDATED: 4 clickable KPIs
|       |   +-- defensibility/
|       |   |   +-- GlobalDefensibilityDrawer.tsx        <- NEW
|       |   +-- scenarios/
|       |       +-- ScenarioMetricRow.tsx                <- UPDATED: optional onValueClick
|       |       +-- ScenarioCompareCard.tsx              <- UPDATED: wires 3 KPI rows
|       +-- layout/
|       |   +-- AppShell.tsx                             <- UPDATED: mounts global drawer
|       +-- pages/
|           +-- DashboardPage.tsx                        <- UPDATED: store, all 4 tiles
|           +-- ResourcePlannerPage.tsx                  <- UPDATED: store
+-- tests/ui/defensibility-additional-surfaces.test.tsx  <- NEW: 9 tests
```

No new dependencies.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M5d-2.json

cd .\sow-calc
npm test       # expect 267/267
npm run dev
```

## What you'll see

### The 7 clickable surfaces

After applying M5d-2, **clickability** is consistent everywhere a KPI
appears:

| Where | KPIs |
|---|---|
| Dashboard tiles | Final Price · Total Cost · Realized Margin · Blended Rate |
| Top rail (every project route) | Price · Cost · Margin · Blended |
| Resource Planner Bill column | Per-resource billed amount |
| Compare grid cards | Final Price · Total Cost · Realized Margin (per card) |

Hover any of them — the surface lights up with a subtle border or
background change. Click — the drawer slides in from the right.

### Per-scenario provenance

The Compare cards are the new capability. Each card represents a
*different* scenario. Click the Final Price line on the Onshore-Only
card — the drawer opens showing **that scenario's** math
($3,402,535 from M5c's populated seed), not the active scenario's.

Same for Total Cost and Realized Margin. The defensibility is
scenario-scoped: you can defend the Aggressive scenario's numbers
without switching to it.

### The drawer travels

In M5d-1 the drawer lived inside each page's render tree. If you
clicked a "go to Resources" link inside the drawer, it closed
(navigation tore down its parent). In M5d-2 the drawer is mounted in
AppShell, so navigating between project routes doesn't unmount it.
You can:

- Open Final Price from the Dashboard
- Click "Resources" in Source Inputs → drawer closes, you're on
  Resource Planner
- Click the top-rail Price KPI → drawer reopens with the same Final
  Price provenance

The state lives in `useDefensibilityStore`. Pages don't manage it.

## Try these

1. **Compare-scope defensibility.** Go to Scenarios & Compare. Tick
   both scenarios. Click the Final Price value on the Onshore-Only
   card. The drawer opens with title "Final Price", value $3,402,535,
   and the full math waterfall using Onshore-Only's resources. Now
   close (Escape), and click the Final Price value on the Base Case
   card. Drawer reopens with $2,369,903 and Base's math. Same KPI
   kind, different scenario, different numbers.

2. **Top-rail consistency.** Click Price in the top rail from
   Dashboard, then from Resource Planner, then from Cloud, then from
   Other Costs, then from Project Setup. Same drawer every time, same
   data (it's the active scenario's Final Price).

3. **Margin tile color matches drawer color.** When margin drops below
   15% (try setting Target Margin to 10% in Project Setup and
   contingency to 0%), the top-rail Margin number turns red. Click it
   — the drawer header shows the same value in red? No — the drawer
   uses its own styling. The mismatch is acceptable; the tile color
   is the alert, the drawer is the explanation.

4. **The drawer is single-instance.** Open Final Price on Dashboard.
   Without closing, click Total Cost on Dashboard. The drawer
   *re-renders* with Total Cost provenance — no flicker, no
   double-mount. Single instance is the new behavior; M5d-1 would
   have created a fresh drawer.

## Design decisions

**Zustand store for drawer state, not React context.** I considered a
context provider in AppShell, but Zustand's selector specificity
prevents the whole tree from re-rendering when openKpi changes — only
GlobalDefensibilityDrawer subscribes. Context would re-render
everything under the provider every time the drawer opens or closes.

**`KpiKind` carries an optional `scenarioId`, not a separate field.**
Adding scenarioId to every variant kept the discriminated union
exhaustive-checkable and avoided a parallel "context" parameter. The
hook reads `kind.scenarioId ?? activeScenarioId` and computes totals
on the fly if the target isn't the active scenario (Compare-grid
case).

**The single drawer instance lives in AppShell.** Mounted after the
flex layout so it overlays correctly without disturbing focus or
keyboard navigation order in the page. It's invisible (returns null
from the inner DefensibilityDrawer) when no KPI is open, so it
doesn't affect layout or accessibility tree when closed.

**Compare cards don't wire run-rate, FTE, or hours rows.** They
*could* — but those metrics don't have a meaningful "how did this
number come about" beyond their inputs, and the provenance shape
would mostly be a single line ("sum of resource hours = X"). The
three big-money KPIs are the ones a finance person actually needs to
defend.

**Per-page state was removed cleanly.** Both DashboardPage and
ResourcePlannerPage previously had `useState<KpiKind>` + their own
drawer mount. After M5d-2 both pages just call
`useDefensibilityStore(s => s.open)` and hand it the kind. No drawer
JSX in either file.

## What's deliberately not here

- **Audit log diff visualization.** Reserved for M5d-3 polish.
- **`project.create` audit kind.** Same.
- **Live drawer reactivity** — opening the drawer captures provenance
  at click time. If you edit a resource while the drawer is open, the
  drawer's numbers stay stale until reopened. Zustand makes live
  reactivity easy (the hook would re-fire on store changes) but I
  preferred deterministic snapshot behavior for the demo.
- **Assumption filtering by linkedEntities.** All assumptions still
  show on every drawer. Real filtering needs `linkedEntities[]`
  populated in seed assumptions — deferred to a future polish bundle.

## Where things stand

- ✅ M1a/M1b · M2a/b/c · M3a/b/c · M4a/b/c/d · M5a · M5b · M5c · M5d-1
- ✅ **M5d-2** — Defensibility on remaining surfaces ← **you are here**
- → M5d-3 — Polish bundle

**The defensibility story is complete.** Every numbered KPI surface in
the app is clickable; every click yields a "why this number" panel
with math + assumptions + source inputs. The tool is now both a
calculator and a defense brief generator.

Commit:
```powershell
git add .
git commit -m "M5d-2: Defensibility panel on every KPI surface"
```
