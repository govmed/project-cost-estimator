# M5d-1 — Defensibility Panel (Core)

M5d-1 introduces the **right-rail Defensibility panel**: click any explained
KPI to slide open a panel that shows the math, the assumptions, and the
source inputs behind that number.

Two surfaces wired in M5d-1:
- **Dashboard's Final Price tile**
- **Resource Planner's Bill column** (per-resource billed amount)

The remaining surfaces (Total Cost / Margin / Blended Rate, Compare grid,
top-rail KPIs) ship in M5d-2 alongside any polish items.

## What got added/changed

```
sow-calc/
+-- src/
|   +-- data/
|   |   +-- kpi-provenance-types.ts                      <- NEW
|   +-- ui/
|       +-- hooks/
|       |   +-- useKpiProvenance.ts                      <- NEW
|       +-- components/
|       |   +-- defensibility/
|       |   |   +-- DefensibilityDrawer.tsx              <- NEW
|       |   +-- planner/
|       |       +-- ResourceTable.tsx                    <- UPDATED: Bill cell clickable
|       +-- pages/
|           +-- DashboardPage.tsx                        <- UPDATED: Final Price clickable
|           +-- ResourcePlannerPage.tsx                  <- UPDATED: mounts drawer
+-- tests/ui/defensibility-panel.test.tsx                <- NEW: 10 tests
```

No new dependencies.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M5d-1.json

cd .\sow-calc

# The BOM sweep is no longer required after M5c's bootstrap fix (assuming you
# copied scripts/bootstrap.ps1 to setup/). Run as defensive belt-and-suspenders
# if you'd like, but it should always find zero files to strip.

npm test       # expect 258/258
npm run dev
```

## What you'll see

### Dashboard — Final Price tile

The Final Price KPI tile now has a hover state (border lights up, background
shades). Click it. A panel slides in from the right. Header reads **"Why this
number / Final Price"**. Then:

**Hero**
- `$2,369,903` (the displayed value)
- "Total cost grossed up to hit the target margin. Includes contingency and
  management reserve."

**Math** (table)
- Resources subtotal · $1,475,690
- + Cloud subtotal · $144,810
- + Other costs subtotal · $25,500
- = Base cost · $1,646,000
- + Contingency (8%) · $131,680
- + Management reserve (0%) · $0
- = Total cost · $1,777,427
- ÷ (1 − 25% margin) · 75.0%
- **= Final Price · $2,369,903** (highlighted row)

**Assumptions (4)**
Each seed assumption rendered as a card with topic + source badge + risk
badge + description. Editing them on the Assumption Ledger updates this
view live (the hook re-projects whenever scenario state changes).

**Source inputs** (navigable)
- Resources → /resources
- Cloud → /cloud
- Other costs → /other-costs
- Pricing levers → /setup

Clicking any input link navigates to that screen and closes the drawer.

### Resource Planner — Bill column

Each Bill cell is now a button. Click any one of them. A drawer opens for
**that specific resource's billed amount**. The math is per-resource:

- Bill rate · $325 (for Solution Architect)
- × Total hours · 1,200
- = Billed amount · $390,000

The header shows the resource's display name (or role/skill fallback). The
inputs section links back to Resource Planner for detail edits.

### Closing the drawer

Three ways:
1. **Backdrop click** — anywhere outside the panel
2. **Escape key**
3. **The X button** in the top-right of the drawer

## Try these

1. **Open Final Price, then change Target Margin.** Open the drawer with
   Final Price at 25%. Don't close it. Switch to a different tab, edit
   target margin to 35% in Project Setup, come back to the Dashboard — the
   drawer's value will be stale until you reopen. (The drawer renders
   provenance at click time; it doesn't subscribe to live updates. M5d-2
   may add live reactivity if it matters.)

2. **Compare scenarios via the drawer.** Open Final Price on Base Case
   ($2,369,903). Close. Switch active scenario to Onshore-Only via the
   top-rail. Reopen Final Price — now shows $3,402,535. Same math
   structure, different numbers. The drawer is scenario-aware.

3. **Navigate from inputs.** Open Final Price. Click "Resources" in the
   Source inputs section. You land on Resource Planner with the drawer
   gone. From there, click any Bill cell to open the drawer again,
   scoped to that resource.

4. **Resource bill defensibility.** On Resource Planner, click the Bill
   for "Solution Architect" — drawer opens showing $325 × hours = the
   billed amount, the scenario's assumptions, and the source-input link
   back to the resource detail.

## Design decisions

**One provenance shape, many KPI kinds.** The `KpiKind` discriminated union
lets `useKpiProvenance` dispatch and return a consistent `KpiProvenance`
shape — math + assumptions + inputs. Adding new KPIs is type-safe
(exhaustiveness check on `never` in the default case).

**`amount` in formula rows is a union, not always Money.** Some lines are
percentages (`÷ (1 − 25% margin)`) or counts (hours). The renderer's
`formatAmount` switches on the shape.

**No live subscription.** Provenance is recomputed when `openKpi` changes,
not when scenario state mutates. If the user edits something while the
drawer is open, they'll need to reopen for the new numbers. Live updates
are doable (the hook already uses `useMemo` over store state) but I left
them out to avoid surprise re-renders mid-read.

**Assumptions aren't filtered yet.** All scenario assumptions show on
every drawer. Real entity linkage would filter to just the assumptions
that touch this KPI's inputs (e.g., Final Price's drawer would show the
"8% contingency" assumption but not "1-year reserved pricing on prod
compute" — unless cloud costs feed Final Price, which they do, so maybe
both). Proper filtering requires entity-level linking in
`Assumption.linkedEntities[]`. Deferred to M5d-2.

**Drawer uses `position: fixed` overlay, not a portal.** Simpler, no extra
library needed. The drawer's z-index is 40 (above other content, below
any future modal layer at 50). Backdrop is a sibling `<div>`, also
click-to-close.

**Bill cell isn't a `<a>` tag.** It opens a drawer, not a navigation. A
button with hover underline conveys interactivity without lying about
the destination.

## What's deliberately not here (yet)

- **Total Cost / Margin / Blended Rate / Run-Rate tiles aren't clickable.**
  M5d-2 wires them.
- **Compare grid cards** — same. M5d-2.
- **Top-rail KPIs** — same. M5d-2.
- **Live drawer reactivity** — see above.
- **Assumption filtering by linked entities** — deferred.
- **Drawer-from-anywhere** — there's no global "Defensibility" command;
  you have to be on a page that exposes a clickable surface.
- **Print / share / export-drawer-state** — none of these. The drawer is
  a read-only popup.

## Where things stand

- ✅ M1a/M1b — scaffold + chrome + dashboard
- ✅ M2a/M2b/M2c — Resource Planner
- ✅ M3a/M3b/M3c — Cloud Planner + Other Costs + Project Setup
- ✅ M4a/M4b/M4c/M4d — Scenarios + Compare + Dashboard + M&A overlay
- ✅ M5a — Assumption Ledger + Audit Log
- ✅ M5b — Export Center
- ✅ M5c — Wizard + Onshore seed + bootstrap fix
- ✅ **M5d-1** — Defensibility panel core ← **you are here**
- → M5d-2 — Defensibility on remaining surfaces + polish

Commit:
```powershell
git add .
git commit -m "M5d-1: Defensibility panel core (Dashboard Final Price + Resource Bill)"
```
