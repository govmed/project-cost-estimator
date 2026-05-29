# M2b — Resource Planner: Inline Editing

The tool stops being a viewer.

Click any phase % cell in the Resource Planner. Type a new number.
Press Enter or Tab to commit. Watch the top-rail KPIs, the footer
totals, the geography mix card, and the dashboard all recompute in
real time.

## What got added/changed

```
sow-calc/
+-- src/
|   +-- data/
|   |   +-- store.ts                                  <- UPDATED: edit actions
|   |   +-- audit-log.ts                              <- NEW: audit queue (M5 reads)
|   +-- hooks/
|   |   +-- useActiveScenarioId.ts                    <- NEW: small selector
|   +-- ui/
|       +-- pages/ResourcePlannerPage.tsx             <- UPDATED: passes scenarioId
|       +-- components/planner/
|           +-- ResourceTable.tsx                     <- UPDATED: editable cells + expand
|           +-- EditableNumericCell.tsx               <- NEW: phase % click-to-edit
|           +-- EditableField.tsx                     <- NEW: form-style edit field
|           +-- ResourceRowExpanded.tsx               <- NEW: expanded-row form
+-- tests/ui/resource-planner-edit.test.tsx          <- NEW: 9 editing tests
```

No new npm dependencies.

## What you do

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M2b.json

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

# No new deps - but always safe to do this anyway
npm test       # expect 69/69
npm run dev
```

Click **Resources** in the left rail.

## Try these (the demos that prove the milestone)

### 1. Edit a phase allocation
Click on Engagement Lead's `50` in the Discovery column. The cell becomes
an input. Type `100` and press Enter. The cell updates, the row's Hours/
Bill/Cost/Margin recompute, the footer totals change, the top-rail Final
Price KPI changes, and the geography mix bar shifts slightly. All in one
edit, no save button.

### 2. Try clamping
Click any phase cell. Type `150` and press Enter. The cell clamps to
`100` and flashes amber for half a second to signal the adjustment.
The store has the clamped value.

### 3. Esc cancels
Click a cell, type a garbage value, press Esc. The cell reverts.
Store unchanged. Nothing logged to audit.

### 4. Expand a row
Click the row identity cell (the role name area, or the triangle on
the left). The row expands to show a form with editable Name, Bill
Rate, Cost Rate, Hours/Week, Utilization, and Notes. All commit the
same way (Enter/Tab/blur to save, Esc to cancel).

### 5. Override a bill rate
Expand Engagement Lead. Click the Bill Rate. Change `425` to `500`.
Enter. A small `EDITED (OFF RATE CARD)` badge appears underneath —
that's the `billRateOverridden` flag from the data model, surfaced
visually. The dashboard's Resources Subtotal updates accordingly.

### 6. Persistence still works
Edit a value. Reload the page. Your edit survives — it's in
localStorage at `sow-calc:project:proj_vtx_modernization_2026`.

### 7. See the audit log
Open DevTools console. Paste:

```javascript
JSON.parse(localStorage.getItem('sow-calc:audit:proj_vtx_modernization_2026'))
```

You'll see an array of audit entries, one per edit, with:
- `timestamp` (when)
- `action.kind` (what changed: `resource.allocation.update`,
  `resource.rate.update`, etc.)
- `action.oldPct` / `action.newPct` (before/after)
- `resourceId` and `phaseId` (which one)

This is the queue M5's Audit Log screen will read from.

### 8. Switch scenarios mid-edit
Edit something. Switch to "Onshore-Only" in the top-rail dropdown.
Switch back. Your edit is preserved on the Base Case scenario; the
Onshore-Only scenario is independent.

## What's deliberately not here yet

- **+ Add resource button is disabled** — that's M2c. Requires the
  role/level/geo picker + rate card lookup flow.
- **Delete / duplicate** — M2c.
- **Filters / search / group-by** — M2c.
- **Guardrails strip** — M2c.
- **Cell-to-cell arrow key navigation** — call it M2c-stretch; Tab/Enter/Esc
  inside a cell work, but moving between cells without clicking does not.
- **Copy-paste from Excel** — deferred; it's its own engineering rabbit hole.
- **Right-rail "where does this come from?" panel** — was M1c; will land later.

## Where M2 stands

- ✅ **M2a** — read-only table with engine output
- ✅ **M2b** — inline editing (you're here)
- → **M2c** — add/delete/duplicate, filters, search, guardrails

After M2c, M2 is complete and the Resource Planner is feature-rich enough
for a real engagement. After M3 (Cloud + Other Costs planners), users can
build a full estimate from scratch.

## A note on what M2b really proves

Before this milestone you had a visualizer: numbers came out of the
engine and rendered. That's useful for verification but doesn't change
your job.

Now you have a *modeling tool*. The path from "Engagement Lead's Discovery
should be 75%, not 50%" → "what does that do to the price?" is now one
edit and zero seconds. Across 12 resources × 6 phases × 2 scenarios,
that's the difference between an afternoon in Excel and 20 seconds.
