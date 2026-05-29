# M2c — Resource Planner: Add / Delete / Duplicate, Filters, Guardrails

M2 closes. The Resource Planner now does what a dealmaker actually needs:
add resources from the rate card, delete with safety, duplicate to clone
similar roles, narrow the view with filters and search, and see defensibility
warnings inline.

## What's new

```
sow-calc/
+-- src/
|   +-- data/
|   |   +-- store.ts                                  <- UPDATED: add/delete/duplicate
|   |   +-- audit-log.ts                              <- UPDATED: new action kinds
|   |   +-- rate-card-lookup.ts                       <- NEW: lazy-loaded rate card
|   +-- engine/
|   |   +-- guardrails/
|   |       +-- resource-guardrails.ts                <- NEW: 3 pure-function rules
|   +-- ui/
|       +-- pages/ResourcePlannerPage.tsx             <- UPDATED: filters + add + guardrails
|       +-- components/planner/
|           +-- ResourceTable.tsx                     <- UPDATED: actions column
|           +-- AddResourceModal.tsx                  <- NEW: role/level/geo picker
|           +-- RowActions.tsx                        <- NEW: duplicate + delete
|           +-- PlannerFilters.tsx                    <- NEW: filter chips + search
|           +-- GuardrailsStrip.tsx                   <- NEW: warning display
+-- tests/
    +-- engine/resource-guardrails.test.ts            <- NEW: 14 unit tests
    +-- ui/resource-planner.test.tsx                  <- UPDATED: assertions for new state
    +-- ui/resource-planner-m2c.test.tsx              <- NEW: 11 M2c tests
```

No new npm dependencies.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M2c.json

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

# No new dependencies - skip the install/reinstall dance
npm test       # expect 94/94
npm run dev
```

Click Resources in the left rail.

## What you'll see vs. M2b

**Up top, an enabled "+ Add resource" button** (was disabled).

**A filter strip below the header**: search box on the left, Geo and Level
chips, a "Clear filters" link on the right when any are active.

**A new Actions column on each row**: a duplicate icon (⎘) and a delete
icon (✕). Delete needs two clicks to confirm.

**A Guardrails section below**, next to the Geography Mix card. The seed
shows "all clear" — the base scenario passes all three rules.

## Try these (the M2c demos)

### 1. Add a resource
Click `+ Add resource`. Modal opens. Briefly shows "Loading rate card…"
then the Role dropdown populates with all 46 roles from the rate card.

- Pick **Data Scientist**
- Pick **Senior**
- Pick **EU-Onshore**

The "From rate card" preview appears with the bill and cost rates. Click
**Add resource**. Modal closes, a new row appears at the bottom of the
table, and the top-rail Final Price KPI jumps by ~$280K (a Senior Data
Scientist isn't cheap).

### 2. Duplicate a resource
Find Engagement Lead. Click the duplicate icon (⎘) on the right. A second
"Engagement Lead" row appears below it, with the same allocations and
rates. The KPIs update.

### 3. Delete with confirmation
Click the ✕ next to the duplicated Engagement Lead. The button changes
to "Confirm?" in red. Click it again to actually delete. (If you click
elsewhere or wait 3 seconds, the confirm state resets — accidental
clicks won't delete.)

### 4. Filter by geography
Click the **India-Offshore** chip. The table now shows only India
resources (4 in the seed). The footer reads "Totals (4 resources) of 12".
Top-rail KPIs are unchanged — they always reflect the full scenario,
because filters are visual, not destructive.

Click the chip again to deselect.

### 5. Filter by level
Click **Senior**. Only Senior resources show.

### 6. Search
Type "Architect" in the search box. The two architects (Solution and Cloud)
remain; everything else hides.

### 7. Clear filters
Click "Clear filters" on the right of the strip. Everything comes back.

### 8. Watch the guardrails fire
Add 5 India-Offshore Associates (just rapid-fire the modal):
- Software Engineer × Associate × India-Offshore
- ...repeat...

Now Onshore drops below 50% of cost. The guardrail strip turns amber:
"Offshore-heavy mix" warning appears, citing the offshore percentage and
referencing Attack #2 from #9.

Delete a couple of high-cost US-Onshore resources to drop the margin
below 15%, and the "Margin below floor" guardrail fires.

### 9. See the audit log
Open DevTools console:

```javascript
JSON.parse(localStorage.getItem('sow-calc:audit:proj_vtx_modernization_2026'))
```

Every add, delete, duplicate, allocation-edit, and rate-edit is logged
with timestamps, before/after values, and the full resource object on
add/delete (so M5's Audit Log screen can offer "undo" later).

## How filters interact with the engine

Important to understand: **filters are visual only**. The engine
calculates against ALL resources in the active scenario. The top-rail
KPIs, the dashboard, the geography mix card — all show full-scenario
numbers. The footer of the filtered table shows the filtered subset
("Totals (4 resources) of 12") so you can do "what if I just look at
offshore" reasoning without losing the full picture.

This matches how a dealmaker actually thinks: "filter to see all the
offshore resources" is a viewing operation, not a scope change.

## The three guardrails

| Rule | Fires when | Severity | Defends against |
|---|---|---|---|
| `offshore_heavy` | Offshore > 50% of resource cost | warn | Attack #2: "Your offshore mix is too aggressive" |
| `margin_below_floor` | Realized margin < 15% (or < 0% = bad) | warn / bad | Attack #6: "discount went too far" |
| `missing_onshore_lead` | No Senior+ in US/CA/EU/UK | warn | Attack #2: client expects onshore POC |

All thresholds (50%, 15%, "Senior+") are hardcoded for M2c. Settings >
Preferences in a future milestone will make them configurable per project.

## Performance note

The rate card JSON is ~540KB. I lazy-load it on first modal open so the
initial page bundle stays small (87KB gzipped, was about to push 102KB).
First time you open Add Resource, a "Loading rate card…" message shows
for a fraction of a second. Subsequent opens are instant.

If you want to pre-warm the cache, the browser will cache the chunk after
the first open, so subsequent loads are free.

## Where M2 stands

- ✅ **M2a** — read-only table
- ✅ **M2b** — inline editing
- ✅ **M2c** — add / delete / duplicate / filters / guardrails ← **you are here**
- → **M2 complete**

Next is **M3: Cloud Planner + Other Costs**. That's the milestone where
a user can build a complete estimate from scratch — resources + cloud
+ other costs — and the tool replaces a spreadsheet for the first time
on a real engagement.

Or, alternatively, **M1c** (right-rail defensibility panel + Clone/Compare
buttons + first-run flow) — the M1 work you skipped. That panel would
make every number in the Resource Planner one click from its derivation,
which is the single most-important defensibility property per #9.

Your call.
