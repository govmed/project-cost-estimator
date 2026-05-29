# M5c — First-Run Wizard, Onshore-Only Seed, Bootstrap BOM Fix

M5c ships three things:

1. **Onshore-Only (Conservative) scenario is now populated** — 12 US-Onshore
   resources, all 8 cloud line items, all 5 other-cost line items, plus 1
   framing assumption. The "Conservative" comparison now has data to
   compare against.
2. **First-run wizard** at `/new` — a 3-step (+ confirm) UI for creating
   a new project from scratch. "+ New Project" entry point in the LeftRail.
3. **bootstrap.ps1 BOM fix** — no more BOM-stripping sweep needed after
   `npm run dev` failures. PowerShell now writes UTF-8 without BOM.

## What got added/changed

```
sow-calc/
+-- scripts/bootstrap.ps1                            <- UPDATED: UTF-8 no-BOM writes
+-- seed/scenarios/example-modernization.json        <- UPDATED: Onshore-Only populated
+-- src/
|   +-- data/
|   |   +-- project-factory.ts                       <- NEW: createProjectFromWizard()
|   +-- ui/
|       +-- routes.tsx                               <- UPDATED: /new route
|       +-- layout/LeftRail.tsx                      <- UPDATED: "+ New Project" link
|       +-- pages/
|           +-- NewProjectWizardPage.tsx             <- NEW
+-- tests/
    +-- data/project-factory.test.ts                 <- NEW: 18 tests
    +-- ui/new-project-wizard.test.tsx              <- NEW: 10 tests
    +-- ui/dashboard.test.tsx                        <- UPDATED: assertion for populated Onshore
    +-- ui/export.test.tsx                           <- UPDATED: assertion for populated Onshore
```

No new dependencies.

## Apply

This manifest **fixes the bootstrap script itself**, so you'll see the BOM
sweep step is no longer needed in future quickstarts. For this one
application, however, the script you're running is still the old version —
so you'll still need to run the sweep one last time after applying.

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M5c.json

cd .\sow-calc

# Final BOM sweep (this is the last time you should need this; the
# updated bootstrap.ps1 included in this manifest writes UTF-8 without BOM).
Get-ChildItem -Path . -Recurse -Include *.json,*.ts,*.tsx,*.css,*.html,*.js -ErrorAction SilentlyContinue |
    Where-Object { -not $_.FullName.Contains('node_modules') } |
    ForEach-Object {
        $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
            $content = [System.Text.Encoding]::UTF8.GetString($bytes[3..($bytes.Length - 1)])
            [System.IO.File]::WriteAllText($_.FullName, $content, (New-Object System.Text.UTF8Encoding $false))
            Write-Host "Stripped: $($_.FullName)" -ForegroundColor Green
        }
    }

# Optional: replace your setup\bootstrap.ps1 with the fixed version
# (so future manifest applications use the new script without BOM emission).
Copy-Item -Path .\scripts\bootstrap.ps1 -Destination ..\setup\bootstrap.ps1 -Force
Write-Host "Replaced setup\bootstrap.ps1 with fixed version" -ForegroundColor Cyan

npm test       # expect 248/248
npm run dev
```

## What you'll see

### Onshore-Only scenario, now populated

Open **Scenarios & Compare**. Tick both Base Case and Onshore-Only. The
compare cards show:

- **Base Case**: $2,369,903 · 15,041 hours · 25.00% margin
- **Onshore-Only (Conservative)**: $3,402,535 · 15,041 hours · 25.00% margin
- Final Price delta: **+43.6%** ($1,032,632 more)

Same scope. Same hours. Same margin target. The +44% delta is pure
geography — Onshore-Only uses US rates for the roles Base sources from
India/LATAM. The roles affected:

| Role                  | Base geo / rate         | Onshore-Only geo / rate |
|-----------------------|-------------------------|-------------------------|
| Technical Lead        | LATAM-Nearshore $145/hr | US-Onshore $295/hr      |
| Full-Stack (Senior)   | LATAM-Nearshore $115/hr | US-Onshore $260/hr      |
| Full-Stack (Pro x4)   | India-Offshore $65/hr   | US-Onshore $200/hr      |
| DevOps (Senior)       | LATAM-Nearshore $135/hr | US-Onshore $275/hr      |
| QA (Pro)              | India-Offshore $55/hr   | US-Onshore $145/hr      |

Switch the active scenario to Onshore-Only via the top-rail dropdown.
Dashboard charts re-render with the higher numbers. Burn curve shifts
up. Headcount peak stays at ~11 FTE (allocations unchanged).

The Onshore-Only scenario also has 1 framing assumption ("100% US onshore
staffing"), visible in the Assumption Ledger when Onshore is active.

### "+ New Project" entry point in the LeftRail

Top of the left rail, above all the existing nav items, there's now a
"+ New Project" link. Always visible, regardless of which screen you're
on. Clicking it navigates to `/new` outside the project context.

### The wizard

Three input steps + a confirm step:

**Step 1 — Basics**
- Project name (required)
- Client (required)
- Base currency (USD / EUR / GBP / INR / CAD / AUD / BRL)
- Engagement type (Fixed Fee / T&M / Capped T&M / Milestone / Outcome-Based)
- Engagement context (New build / Migration / Modernization / M&A
  Integration / M&A Carve-out / TSA / Run & Operate)

Next is disabled until name + client both have content.

**Step 2 — Pricing**
- Target margin % (defaults to 25)
- Contingency % (defaults to 8)
- Management reserve % (defaults to 0)

A "Quick math" box at the bottom shows what these settings produce for
a $1M base cost. Try the defaults: $1M base × 1.08 contingency / (1 − 0.25)
= **$1,440,000**.

**Step 3 — Phases**
- Pre-filled with the six standard phases (Discovery 4w / Design 6w /
  Build 16w / Test 6w / Deploy 4w / Hypercare 8w = 44 weeks total)
- Edit names and durations inline
- Add or remove phases
- "Reset to defaults" link in the top-right

**Step 4 — Confirm**
- Read-only summary of all inputs
- If a project is already loaded, a yellow warning banner notes that
  creating the new project will replace it in this browser session
- "Create Project" button commits via the factory + `setProject`, then
  navigates to `/p/<newId>/setup`

## The bootstrap.ps1 BOM fix

The bug: PowerShell 5.1's `Set-Content -Encoding UTF8` writes a BOM. The
package.json, tsconfig.json, postcss.config.js, and any other file that
gets parsed by tools using `JSON.parse` or strict JS parsers chokes on
the leading `\uFEFF` byte.

The fix: a new helper at line 122 of bootstrap.ps1:

```powershell
function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}
```

The `$false` constructor argument means "no BOM". All four file-writing
call sites (placeholder files in `Invoke-Init`, the `.sync/state.json`
in `Invoke-Init`, the manifest content in `Invoke-ApplyManifest`, and
the `.sync/last-applied.json`) now route through this helper instead
of `Set-Content -Encoding UTF8`.

**To activate the fix for future manifest applications**, replace the
copy in `C:\dev\cost\setup\` with the one this manifest dropped in
`sow-calc\scripts\`:

```powershell
Copy-Item -Path C:\dev\cost\sow-calc\scripts\bootstrap.ps1 `
          -Destination C:\dev\cost\setup\bootstrap.ps1 -Force
```

After this, future manifest applications won't introduce BOMs and you
won't need the sweep step. The quickstarts will still include the sweep
as a defensive belt-and-suspenders for one or two more milestones, then
drop it.

## Try these (demos)

### 1. The Onshore-Only comparison
1. Land on the dashboard with Base Case active. Note $2,369,903 final
   price.
2. Top-rail scenario dropdown → switch to **Onshore-Only (Conservative)**.
3. Watch the dashboard re-render: final price jumps to $3,402,535.
   Burn curve shifts up. Cost-by-phase bars all grow.
4. Click **Scenarios & Compare**. Tick both. Compare cards show the
   +43.6% delta.

### 2. Create a new project from scratch
1. Click **+ New Project** (top of the left rail).
2. **Basics**: enter "Acme Modernization", "Acme Inc.". USD. Fixed Fee.
   Modernization. → Next.
3. **Pricing**: keep defaults (25 / 8 / 0). Note the quick math:
   $1M → $1,440,000. → Next.
4. **Phases**: edit "Build" to 20 weeks. Add a phase called
   "Pilot" before Build with 2 weeks. → Next.
5. **Confirm**: review the summary. Notice the warning about replacing
   the existing seed project.
6. Click **Create Project**.
7. You land on Project Setup for the new project. URL is
   `/p/proj_acme_modernization_<timestamp>/setup`. Top rail says
   "Acme Modernization". Base Case scenario is empty.

### 3. The wizard creates a project that round-trips through Export
1. Create a new project (steps above).
2. Add a couple of resources via Resource Planner.
3. Go to Export → Download .json.
4. Open the JSON. The project is there, the scenarios are there, the
   audit log shows the wizard didn't create any audit entries
   (intentional — the new-project event isn't audited, only
   subsequent edits are).

### 4. Back navigation preserves input
1. Start the wizard. Type "Test" + "Client" → Next.
2. Set target margin to 35 → Next.
3. Click **Back**. Margin is still 35. **Back** again. Name still
   "Test", client still "Client". Wizard state survives navigation.

### 5. Bootstrap fix verification
After applying M5c and replacing your `setup\bootstrap.ps1`, drop a
trivial manifest into `C:\dev\cost\manifests\` and apply it. Then
check `package.json`:

```powershell
$bytes = [System.IO.File]::ReadAllBytes('.\package.json')
"First 3 bytes: $($bytes[0..2] -join ' ')"
# Expected: "First 3 bytes: 123 13 10"  (i.e., '{' followed by CR/LF)
# Pre-fix would have shown: "239 187 191"
```

No BOM. Done.

## Design decisions

**Onshore-Only is a complete clone with rate substitution, not a sparse
diff.** It would be elegant to express Onshore-Only as "Base Case with
geography overrides" but the data model doesn't support partial overrides
between scenarios. Each scenario stores its own complete resource list.
The factory pattern in M5a's `cloneScenario` (which copies + remaps IDs)
is the precedent. I wrote a one-off Python script to produce the
populated seed; the script lives in the dev history but isn't shipped.

**Wizard validates per-step, not on submit.** Basics' Next button is
disabled until name + client are entered. Pricing's checks numeric
validity. Phases' checks each row has a name + duration ≥ 1. Confirm
is always reachable once all three input steps pass. The Create button
itself is only enabled if every check passes — defense in depth.

**Wizard doesn't audit project creation.** The audit log resets for the
new project (different `projectId` key in localStorage). The wizard
itself doesn't emit any audit entries. The user's first audit entry
will be whatever they do first on the new project. Arguably we should
emit a `project.create` audit kind so the history is auditable from
day 1; defer to a future milestone.

**The "+ New Project" link is in the LeftRail, not on the TopRail.**
The TopRail is project-scoped (scenario dropdown, KPIs). The LeftRail
already has the visual affordance for navigation. "+" prefix mirrors
the `+ Add resource`, `+ Add cloud line item` patterns elsewhere.

**FX rates default via USD pivot.** For non-USD base currencies, the
factory converts via USD: `rate(X, Y) = rate(USD, Y) / rate(USD, X)`.
Rates as of mid-2026; user refines on Project Setup if precision matters.

**`createProjectFromWizard` is pure.** Takes input → returns project +
scenarios. No store calls, no localStorage, no audit. That's the wizard
page's job. Keeps the factory unit-testable without React.

**Bootstrap fix uses `[System.IO.File]::WriteAllText` with explicit
encoding object.** `Set-Content -Encoding UTF8` on PowerShell 5.1
writes UTF-8 with BOM. PowerShell 7+ writes without BOM for the same
parameter — but most Windows boxes still run 5.1 by default. Using the
.NET API directly with `New-Object System.Text.UTF8Encoding $false`
sidesteps PowerShell's encoding parameter entirely and works on both.

## What's deliberately not here

- **Multiple-project switcher.** Once you create a new project, the old
  one is gone (the warning step makes this clear). A full project list
  + switcher needs localStorage indexing and a list UI; deferred.
- **JSON re-import.** The Export Center emits JSON; the wizard doesn't
  yet read JSON to seed a new project. A nice path for "I have a model
  someone sent me" — deferred.
- **Wizard templates.** "M&A Carve-out template" or "Greenfield SaaS
  template" with pre-filled resources/cloud/other-costs would speed
  things up. Not in scope; the wizard creates an empty base scenario
  the user fills in via the existing screens.
- **Linked-entity navigation from Assumption Ledger.** The Onshore-Only
  assumption could deep-link to the affected resources. Deferred to
  M5d's defensibility panel.
- **`project.create` audit kind.** No audit entry is emitted when a
  project is created. Each project has its own audit log keyed by
  projectId, so the "history" of a project starts with whatever you
  do first.

## Where things stand

- ✅ M1a/M1b — scaffold + chrome + dashboard
- ✅ M2a/M2b/M2c — Resource Planner end-to-end
- ✅ M3a/M3b — Cloud Planner end-to-end
- ✅ M3c — Other Costs + Project Setup
- ✅ M4a — Scenarios CRUD
- ✅ M4b — Compare grid
- ✅ M4c — Recharts Dashboard
- ✅ M4d — M&A overlay (M4 closed)
- ✅ M5a — Assumption Ledger + Audit Log
- ✅ M5b — Export Center
- ✅ **M5c** — First-run wizard + Onshore-Only seed + bootstrap fix ← **you are here**
- → M5d — M1c right-rail defensibility panel + polish

**Project creation is now possible end-to-end via the UI.** No more
"the seed is the only project". The Onshore-Only comparison is
meaningful in the Compare grid. The bootstrap script no longer requires
manual BOM sweeping.

Commit:
```powershell
git add .
git commit -m "M5c: New-project wizard, populated Onshore-Only seed, bootstrap BOM fix"
```
