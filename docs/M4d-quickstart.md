# M4d — M&A Overlay

M4d wires the previously-stubbed **M&A Mode** route to a real screen with
three sub-modes: **TSA**, **Carve-out**, and **Integration**. Each mode
captures the inputs that matter for that engagement context and shows
the engine-computed impact (one-time cost, recurring cost, realized
synergy where applicable, net impact, breakeven month).

**Preview math, by design.** The overlay output does NOT roll into the
top-rail Final Price. This matches the original wireframe's intent:
"Numbers shown here are projections based on your inputs; they don't
yet flow into the top-rail KPIs." Adding the overlay to Final Price is
a Phase-2 decision the dealmaker should make explicitly per scenario.

## What got added/changed

```
sow-calc/
+-- src/
|   +-- engine/
|   |   +-- ma-overlay.ts                          <- NEW: TSA / CarveOut / Integration math
|   |   +-- calculate.ts                           <- UPDATED: wires overlay into ScenarioTotals
|   |   +-- types.ts                               <- UPDATED: maOverlay?: MAOverlayTotals
|   +-- data/
|   |   +-- store.ts                               <- UPDATED: updateMAData action
|   |   +-- audit-log.ts                           <- UPDATED: 2 new action kinds
|   +-- ui/
|       +-- routes.tsx                             <- UPDATED: /ma-mode -> MAModePage
|       +-- pages/
|       |   +-- MAModePage.tsx                     <- NEW: composes the page
|       +-- components/ma/                         <- NEW directory
|           +-- TSAForm.tsx                        <- NEW
|           +-- CarveOutForm.tsx                   <- NEW
|           +-- IntegrationForm.tsx                <- NEW
|           +-- OverlayImpactSummary.tsx           <- NEW
+-- tests/
    +-- engine/ma-overlay.test.ts                  <- NEW: 16 engine tests
    +-- ui/ma-mode.test.tsx                        <- NEW: 11 UI tests
```

**No new dependencies.** Engine math is pure TS.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M4d.json

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

npm test       # expect 180/180
npm run dev
```

Click **M&A Mode** in the left rail.

## The math (three modes)

### TSA — Transition Services Agreement
A seller's run-out cost while the buyer migrates off shared services.

- **Inputs:** duration in months, exit ramp % per quarter
- **Math:** month 1 cost = base scenario's `runRateMonthly`.
  Each subsequent quarter applies the exit ramp as a compounding reduction.
  E.g. 8% per quarter → month 1-3 at 100%, months 4-6 at 92%, months 7-9 at 92×0.92=84.6%, etc.
- **Output:** monthly projection over the TSA duration, total recurring cost (the run-out total).
- **No synergy concept** — TSA is pure cost.

### Carve-out — separating an entity
The cost of standing up a new entity and ongoing efficiency losses.

- **Inputs:** stand-up multiplier (typically 1.3-1.6 for tech), annual dis-synergy % (typically 2-5)
- **Math:**
  - **Stand-up extra** = `(multiplier − 1) × resourcesSubtotal`. Charged to month 0 as a one-time hit.
  - **Annual dis-synergies** = `annualPct × monthlyRunRate × 12`. Spread evenly across 12 months post-Day-1.
- **Output:** 12-month projection, one-time + recurring totals.
- **No synergy concept** — carve-out is cost-only.

### Integration — combining two entities
Realized synergies (recurring upside) minus one-time integration cost.

- **Inputs:** annual synergy target ($), realization months, one-time integration cost ($)
- **Math:**
  - **Synergy realization** follows an S-curve (cubic ease: `3t² − 2t³` where `t = month / realizationMonths`).
    Beyond realization, synergy stays at the full monthly target.
  - **One-time cost** is charged to month 0.
- **Output:** projection over `max(36, realizationMonths + 12)` months.
  Cumulative net (one-time cost − cumulative synergy) crosses zero at the **breakeven month** — the punchline for the CFO conversation.

## Try these

### 1. Empty state
Open M&A Mode. You see the heading, the preview-math banner, the three mode buttons, and a "not yet configured" message. The active scenario doesn't have `maData` yet.

### 2. Pick TSA
Click **TSA**. Defaults appear (12 months, 8% per quarter). The TSA Overview form renders. Below it, the Impact Summary shows:
- One-time: $0 (TSA has no one-time costs in the model)
- Recurring: small, because Base Case's run-rate is modest (the seed mostly has project-only costs, not steady-state). Try cranking `Duration` to 24 months — recurring goes up.
- Monthly projection table shows each month's cost dropping as the exit ramp compounds.

### 3. Pick Carve-out
Click **Carve-out**. Defaults: 1.4× multiplier, 3% dis-synergy.

Impact Summary shows:
- **One-time: $588,232** — that's 40% of the seed's $1.47M resources subtotal (the engine uses `resourcesSubtotal` as the in-build approximation).
- Recurring: $1,620 over 12 months (small because run-rate is small).
- Net impact: $589,852 net cost.

Change the multiplier to 1.6 — the one-time tile jumps to ~$882K.

### 4. Pick Integration
Click **Integration**. Defaults: $0 synergy target, 24 months, $0 one-time. The Impact Summary shows zeros.

Now enter realistic numbers:
- Annual synergy target: $6,000,000
- Realization timeline: 18 months
- One-time integration cost: $2,000,000

Click out of the input (or press Enter). The Impact Summary lights up:
- One-time: $2,000,000
- Realized synergy: ~$9.5M over the 36-month horizon
- **Breakeven reached at month ~12** — after this, cumulative synergy exceeds the integration cost
- Net impact: net **benefit** of ~$7.5M

The monthly projection table shows synergy ramping up via the S-curve until month 18, then flat at $500K/month.

### 5. Try a "no breakeven" case
Set synergy target to $100,000 and one-time cost to $10,000,000. Now the cumulative synergy never overtakes the cost — the Impact Summary banner shows "No breakeven within the 36-month horizon."

### 6. Switch modes
Click TSA, then Carve-out, then Integration. Each switch replaces the previous mode's `maData` entirely (by design — the wireframe calls this out explicitly). Click **Clear overlay** to remove it.

### 7. Confirm preview-only behavior
Change the Final Price KPI in the top rail. Now configure any M&A overlay. Final Price doesn't change. That's the preview-only contract — verified by an engine test:
> "finalPrice is unaffected by maData (overlay is preview only)"

### 8. Audit trail
DevTools console:
```javascript
JSON.parse(localStorage.getItem('sow-calc:audit:proj_vtx_modernization_2026'))
  .filter(e => e.action.kind.startsWith('scenario.maData'))
```
Every mode change and clear is logged with full before/after payloads.

## Design decisions worth flagging

**Preview-only by design.** The biggest architectural choice in M4d. The original prompt and the wireframe both call out that M&A overlay shouldn't auto-flow into the headline price — a dealmaker needs to look at the math separately and decide whether/how to incorporate it. So `ScenarioTotals.finalPrice` is unaffected; `ScenarioTotals.maOverlay` is a separate optional field. **Existing tests don't break** because the seed scenarios have no `maData`.

**No charts in M4d.** The wireframe shows ramp-down projections and breakeven curves. I shipped the monthly projection as a 24-row table instead. Reasons:
- The Dashboard's Recharts chunk is lazy-loaded so reaching for chart components from MA would either pull Recharts (~117KB gz) into the MA route or require a code split for the MA page itself.
- The numeric table gives the same information at a glance.
- M4d turn budget was already wide.
A future "M4d-charts" follow-up of ~50 lines could lift the existing chart components into the MA page.

**TSA uses run-rate as the per-month base, not per-tower.** The wireframe shows a per-tower table (Infrastructure / Applications / Data / Security) with month-1 costs per tower. Implementing that requires a new data structure on `MAModeData` and per-tower attribution from the base scenario's items. M4d uses a single rolled-up monthly cost = base `runRateMonthly` as a sensible default. Towers are a follow-up.

**Switching modes wipes the previous mode's inputs.** Per the wireframe ("Switching to Carve-out will hide your TSA service towers"). The audit log preserves the previous payload, so it could be recovered. The wireframe's "preserved and shown when you return" behavior is a small enhancement: keep per-mode state in `MAModeData` but track an active mode separately. Defer.

**Stand-up extra is computed from `resourcesSubtotal`.** The wireframe says "applied to: resource cost in Discovery + Design + Build phases" — meaning the in-build phases specifically. M4d uses the total `resourcesSubtotal`, which over-counts a little if the user has Hypercare resources (they're not "build" work). Engine could expose `byPhase[].resourceCost` summed across "in-build" phases — a small enhancement. For most projects the difference is negligible.

**Carve-out timeline is fixed at 12 months.** Year-1 dis-synergies is the standard dealmaker frame. Multi-year run-out is a follow-up.

## What's deliberately not here

- **Charts** (ramp-down, breakeven, synergy realization curve) — described in the wireframe
- **TSA per-tower breakdown** with cost attribution from base scenario
- **Mode switching that preserves per-mode state** rather than wiping
- **Multiple one-time cost lines on the MA page itself** — the wireframe shows a `[+ Add cost line]` button. For M4d, users add one-time separation / integration costs as Other Costs line items on the Other Costs screen instead.
- **Synergy curve choice** (linear / s-curve / step) — defaulted to s-curve only
- **MA overlay shown on the Compare grid** — would be a small addition to ScenarioCompareCard
- **MA overlay applied to Final Price** as an explicit opt-in toggle per scenario — Phase 2

## Where things stand

- ✅ M1a / M1b — scaffold + chrome + dashboard
- ✅ M2a / M2b / M2c — Resource Planner end-to-end
- ✅ M3a / M3b — Cloud Planner end-to-end
- ✅ M3c — Other Costs + Project Setup (M3 closed)
- ✅ M4a — Scenarios CRUD
- ✅ M4b — Compare grid
- ✅ M4c — Recharts Dashboard
- ✅ **M4d** — M&A overlay ← **you are here, M4 closed**
- → M5 — Export Center (XLSX / CSV / PDF / JSON), Assumption Ledger, Audit Log screen, first-run wizard, M1c right-rail defensibility panel

**M4 is complete.** Every left-rail navigation item now points at a real screen with real data. The tool can model a multi-scenario engagement, compare alternatives side-by-side, visualize the project's spend pattern, and overlay M&A math on top.

Commit:
```powershell
git add .
git commit -m "M4d: M&A overlay - TSA / Carve-out / Integration math + UI"
```
