# M4a — Scenarios CRUD

M4a wires the **Scenarios** screen in the left rail. You can now clone,
rename, delete, and re-base scenarios. Side-by-side compare lands in
M4b next.

This ships smaller than originally planned: M4 was going to be one
big drop with Compare, Recharts dashboard, and M&A overlay all at once.
That was too much for a single milestone to verify properly, so it's
now split:

- **M4a (this milestone)** — Scenarios list + CRUD
- **M4b** — Compare grid (2-4 scenarios side-by-side with deltas)
- **M4c** — Recharts-based Dashboard upgrade
- **M4d** — M&A overlay

## What got added/changed

```
sow-calc/
+-- src/
|   +-- data/
|   |   +-- store.ts                                  <- UPDATED: 4 scenario actions
|   |   +-- audit-log.ts                              <- UPDATED: 4 scenario action kinds
|   +-- ui/
|       +-- routes.tsx                                <- UPDATED: /scenarios route
|       +-- pages/
|           +-- ScenariosPage.tsx                     <- NEW: list + CRUD
+-- tests/ui/scenarios.test.tsx                      <- NEW: 10 tests
```

No new npm dependencies.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M4a.json

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

npm test       # expect 136/136
npm run dev
```

Click **Scenarios** in the left rail.

## What you'll see

A single table listing all scenarios with these columns:
- **Scenario** name (inline-renameable), with `base` and `active` badges
- **Final Price** (from engine, per-scenario)
- **Margin**, **Hours**
- **R / C / O** — counts of Resources / Cloud line items / Other-cost line items
- **Actions** — View, Set as base (★), Clone (⎘), Delete (✕)

Above the table: a `+ Clone active scenario` button as the primary CTA.

The seed gives you two scenarios:
- **Base Case** ($2.37M, 36.2% margin, 15,041 hours)
- **Onshore-Only (Conservative)** (different numbers — that's the point of having alternatives)

## Try these (the demos that prove M4a)

### 1. Clone a scenario
Click `+ Clone active scenario`. A new row appears: "Base Case (copy)"
with the same numbers as Base Case (because we deep-copied everything).
The clone has a small `⎘` icon indicating it was cloned from another scenario.

### 2. Verify the clone is independent
Click "View" on the clone. The Dashboard / Resources / Cloud / Other Costs
screens now reflect the clone. Edit something — say, delete a resource
in the Resource Planner. Switch back to Base Case (via the top-rail
scenario dropdown). Base Case is unchanged. The clone is truly a copy,
not a shared reference.

This was the riskiest part of M4a — getting deep-copy right. The store
generates fresh IDs for every nested item (resources, cloud, other
costs, assumptions) and rewrites each item's `scenarioId` to the new
scenario. Confirmed by automated test.

### 3. Rename inline
Click the scenario name in the first column. It becomes an input. Type
"Aggressive Margin" and press Enter. The name updates everywhere
(table, top-rail dropdown, audit log).

### 4. Set as base
Click the ★ on a non-base scenario. The `base` badge moves to that row.
This flips `isBase` on both scenarios and updates `project.baseScenarioId`.

### 5. Delete with confirmation
Click ✕ on the clone. The button changes to "Confirm?". Click again to
actually delete. (Wait 3 seconds and it reverts — accidental clicks don't delete.)

### 6. Try to delete the base scenario
You can't. The base scenario row has no ✕ button. This is by design —
deleting your base would orphan all downstream calculations.

### 7. Delete the active scenario
Set a clone as active (via "View" or the top-rail dropdown). Then come
back to Scenarios and delete it. The store automatically falls back to
the base as active — no broken state.

### 8. Audit trail
DevTools console:
```javascript
JSON.parse(localStorage.getItem('sow-calc:audit:proj_vtx_modernization_2026'))
  .filter(e => e.action.kind.startsWith('scenario.'))
```

Every clone/rename/delete/set-base is logged with before/after info.
The clone entry includes the full new scenario object — enough to
undo, when M5 builds undo.

## Design decisions worth flagging

**Compare is deferred to M4b.** The previous attempt at M4a tried to
ship CRUD + Compare in one milestone and the test surface got muddied.
This is cleaner: CRUD is small and easy to verify; Compare builds on
top with confidence.

**Clone always copies an existing scenario.** No "blank new scenario"
button. A from-scratch wizard is M5 territory (first-run experience).
For now: clone something close to what you want, then edit.

**Set-as-base is one click, no confirm.** It's reversible (click ★ on
the original to flip back) and doesn't lose any data — just changes
which scenario is the "canonical" one for the project. Adding a confirm
would be friction without value.

**The Scenarios link in the left rail used to say "Scenarios & Compare".**
M4a renames the page to just "Scenarios" since Compare isn't here yet.
M4b will rename it back.

## Where things stand

- ✅ M1a/M1b — scaffold + chrome + dashboard
- ✅ M2a/M2b/M2c — Resource Planner end-to-end
- ✅ M3a/M3b — Cloud Planner end-to-end
- ✅ M3c — Other Costs + Project Setup (M3 closed)
- ✅ **M4a** — Scenarios CRUD ← you are here
- → M4b — Compare grid
- → M4c — Recharts dashboard
- → M4d — M&A overlay

Commit:
```powershell
git add .
git commit -m "M4a: Scenarios list + CRUD (clone, rename, delete, set-base)"
```
