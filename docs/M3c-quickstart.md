# M3c — Other Costs + Project Setup → M3 Complete

M3c closes M3. With this milestone, you can build a complete estimate
from scratch: **resources + cloud + other costs + project settings**.
The tool can replace a spreadsheet end-to-end on a real engagement.

## What got added/changed

```
sow-calc/
+-- src/
|   +-- data/
|   |   +-- store.ts                                  <- UPDATED: 9 new actions
|   |   +-- audit-log.ts                              <- UPDATED: 9 new action kinds
|   +-- ui/
|       +-- routes.tsx                                <- UPDATED: /setup, /other-costs wired
|       +-- pages/
|       |   +-- OtherCostsPlannerPage.tsx             <- NEW: list/detail planner
|       |   +-- ProjectSetupPage.tsx                  <- NEW: settings page
|       +-- components/other-costs/
|       |   +-- OtherCostCategoryBadge.tsx            <- NEW: 12-category color badges
|       |   +-- OtherCostList.tsx                     <- NEW: grouped list pane
|       |   +-- OtherCostDetail.tsx                   <- NEW: editable detail pane
|       |   +-- AddOtherCostModal.tsx                 <- NEW: no-catalog add form
|       +-- components/setup/
|           +-- PhasesEditor.tsx                      <- NEW: phase table with add/delete
|           +-- FxRatesEditor.tsx                     <- NEW: currency-to-rate grid
+-- tests/ui/other-costs-and-setup.test.tsx          <- NEW: 11 tests
```

No new npm dependencies.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M3c.json

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

npm test       # expect 126/126
npm run dev
```

Open the app and try **Other Costs** and **Project Setup** in the left rail.

## What you'll see

### Other Costs (left rail item)
List/detail layout like Cloud Planner. Seed has 5 items grouped by category:
- Datadog APM Pro (SaaSSubscription)
- GitHub Enterprise + Copilot (SaaSSubscription)
- Onshore SME travel (TravelExpense)
- Client team enablement workshops (Training)
- Third-party security & pen test (Subcontractor)

Project total in subtitle: **$113,250**.

Each item shows category badge, name, vendor, unit cost × pricing unit ×
qty in the row, with total dollars on the right. Hover to reveal
duplicate/delete actions. Click to load into the detail pane.

The detail pane has four sections plus a burn chart:
- **Identity**: name, category, vendor, description
- **Pricing**: unit cost, quantity, pricing unit, user count (if applicable), markup %
- **Scope**: phase assignment, include-in-run-rate toggle
- **Engine output** (read-only): total cost, run-rate monthly
- **Monthly burn**: same CSS bar chart as Cloud

### Project Setup
Single-page form with four sections:
- **Identity**: project name, client, SOW reference, version, status,
  engagement type, engagement context
- **Commercials**: target margin %, discount %, contingency %,
  management reserve %, base currency (display only)
- **Phases**: editable table with order, name, offset (weeks), duration
  (weeks), delete per row, + Add phase at the bottom
- **FX Rates**: USD-to-others table (base currency fixed at 1.0)

## Try these (the M3c demos)

### 1. Edit an Other Cost
Click **Datadog APM Pro**. In the detail pane, click Quantity. Change
`12` to `24`. Enter. Watch:
- The row's right-hand total updates
- The "Project total $113,250" subtitle updates
- The top-rail Final Price KPI updates

### 2. Add a license
Click **+ Add line item**. Modal opens.
- Category: SaaSSubscription
- Name: "Snyk"
- Vendor: "Snyk Inc."
- Unit Cost: 24
- Quantity: 30
- Pricing Unit: PerUserPerMonth
- User Count: 30 (the field appears when you pick PerUser/PerUserPerMonth)
- Phase: (spread across whole project) or pick a specific one
- Check "Include in steady-state Run-Rate projections"
- Click **Add line item**

Modal closes. New row appears in the SaaSSubscription group and is
auto-selected in the detail pane.

### 3. Change the target margin
Click **Project Setup**. Click the **Target Margin** value (currently
`25%`). Change to `40`. Enter. Watch the top-rail Final Price KPI jump.

The engine's pricing math is: `finalPrice = totalCost / (1 - margin/100)`,
so 40% margin on the same cost stack pushes price up substantially.

### 4. Add a phase
On Project Setup, scroll to Phases. Click **+ Add phase**. A new row
appears with name "New Phase", duration 4 weeks, starting after the
last phase. Edit the name to "Hypercare", change duration, etc.

### 5. Edit FX rates
Scroll to FX Rates. EUR currently at 0.93 (per seed). Click it, change
to 0.95, Enter. Any resource priced in EUR re-converts and downstream
totals shift.

### 6. See the audit log
DevTools console:
```javascript
JSON.parse(localStorage.getItem('sow-calc:audit:proj_vtx_modernization_2026'))
```

You'll now see action kinds for every domain:
- `resource.allocation.update`, `resource.rate.update`, `resource.add`, etc.
- `cloud.add`, `cloud.field.update`, `cloud.delete`, etc.
- `otherCost.add`, `otherCost.field.update`, etc.
- `project.field.update`, `project.fx.update`
- `phase.add`, `phase.delete`, `phase.field.update`

Everything you change is captured. M5 will render this as a proper
Audit Log screen.

## A note on "spread vs phase-scoped" other costs

When you create an other-cost line item, the **Phase** field is optional:
- **No phase** (`(spread across whole project)`): the engine spreads
  the cost evenly across the project duration. Best for SaaS licenses
  that run for the whole engagement.
- **A specific phase**: the cost is scoped to that phase only. Best for
  one-time costs like a security audit during Hardening, or training
  during Cutover.

This matches the data model: `phaseId?: PhaseId` from #3, and the
engine's existing burn-curve logic handles both shapes.

## What deliberately didn't land in M3c

- **Other Costs guardrails** (e.g. "license cost > X% of resource cost").
  Mirror of the resource guardrails strip. Could land here; deferred to
  keep M3c shippable.
- **Phase reordering by drag-and-drop.** You can edit the `order` field
  directly; the table re-sorts on commit. Drag-and-drop is a polish item.
- **Wizard for creating a new project from scratch.** The Setup screen
  edits the existing project. Creating new projects is M5's first-run
  experience.
- **Base currency editing.** Switching the base currency requires
  re-establishing all FX rates and re-pricing any non-base resource —
  too risky for a click. Phase 2.
- **Other Costs guardrails strip**, **markup-aware preview**,
  **per-user math preview in the modal** — all defensible polish items
  for a later pass.

## Where things stand

**M3 is complete.** A user can now do everything required to model a
full engagement:

- ✅ **M1a/M1b** — App scaffold + chrome + dashboard
- ✅ **M2a/M2b/M2c** — Resource Planner (read-only → editable → full lifecycle)
- ✅ **M3a/M3b** — Cloud Planner (read-only → editable + catalog)
- ✅ **M3c** — Other Costs + Project Setup ← **you are here**

**What's left:**

- **M4** — Scenarios & Compare screen (side-by-side scenarios), M&A overlay (TSA/carve-out modeling), richer Dashboard charts (Recharts-based burn curve, sensitivity bars)
- **M5** — Export Center (XLSX/CSV/PDF/JSON), Assumption Ledger, Audit Log screen, first-run wizard, M1c right-rail defensibility panel

## What this milestone really means

Before M3c, the tool could show a complete estimate from seed data and
let you edit pieces of it. After M3c, **you can build a complete
estimate from scratch.** Start with a blank Other Costs list. Add
licenses one by one. Tune the target margin. Adjust the phase timeline.
Watch every number you've defined add up to a defensible Final Price.

That's the difference between "verifies your spreadsheet" and "replaces
your spreadsheet."

Commit M3c first:

```powershell
git add .
git commit -m "M3c: Other Costs planner + Project Setup screen — M3 complete"
```
