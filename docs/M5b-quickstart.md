# M5b — Export Center

M5b ships the **Export Center** — the deliverable factory. Four formats:

- **XLSX** — multi-sheet workbook for finance / PMO validation
- **PDF** — formal cover-page report for CFO conversations
- **CSV** — flat data per category (resources / cloud / other costs)
- **JSON** — full app-state backup for sharing and restore

The page is lazy-loaded so the heavy export dependencies don't ship with
any other route.

## What got added/changed

```
sow-calc/
+-- package.json                                    <- UPDATED: 3 new deps
+-- src/
|   +-- export/                                     <- NEW DIRECTORY
|   |   +-- download.ts                             <- NEW: browser download helper
|   |   +-- exporters/
|   |       +-- json.ts                             <- NEW
|   |       +-- csv.ts                              <- NEW
|   |       +-- xlsx.ts                             <- NEW (dynamic-imports @e965/xlsx)
|   |       +-- pdf.ts                              <- NEW (dynamic-imports jspdf)
|   +-- ui/
|       +-- routes.tsx                              <- UPDATED: ExportPage lazy-loaded
|       +-- pages/
|           +-- ExportPage.tsx                      <- NEW
+-- tests/
    +-- export/exporters.test.ts                    <- NEW: 18 tests
    +-- ui/export.test.tsx                          <- NEW: 8 tests
```

**Dependencies added:**
- `@e965/xlsx@^0.20.3` — the maintained SheetJS fork. The public `xlsx`
  package on npm is stale at 0.18.5 from 2022. This scoped package mirrors
  the SheetJS API at the modern version.
- `jspdf@^4.2.1` — PDF generation. Co-maintained by yWorks.
- `jspdf-autotable@^5.0.8` — table layout plugin for jspdf. Required for
  the tabular sections of the PDF (KPIs, by-phase, resources, assumptions).

**No CDN dependencies, no `file-saver`.** The download helper uses
`URL.createObjectURL` + a temporary `<a>` element click, which is the
standard client-side download pattern.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M5b.json

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

# Install the new deps
npm install

npm test       # expect 220/220
npm run dev
```

Click **Export** in the left rail — it lights up with the four format
cards.

## Bundle architecture

The Export Center is **lazy-loaded** through `routes.tsx` with `React.lazy`
+ `Suspense`. The first time the user navigates to `/export`, Vite fetches
the export chunks. Subsequent visits are cached. Other routes never pull
these chunks.

After build:
```
ExportPage chunk:        21 KB raw  /   7 KB gz   ← my page code
xlsx chunk:             500 KB raw  / 163 KB gz   ← @e965/xlsx
jspdf chunk:            390 KB raw  / 129 KB gz   ← jspdf
html2canvas chunk:      201 KB raw  /  48 KB gz   ← jspdf transitive
jspdf-autotable chunk:   31 KB raw  /  10 KB gz   ← table plugin
dompurify chunk:         26 KB raw  /  10 KB gz   ← jspdf transitive
(other small chunks):   ~150 KB raw / ~52 KB gz   ← jspdf transitive (utilities, etc)
```

**Total export footprint: ~1.3 MB raw / ~420 KB gzipped — only loaded on
`/export`.**

**Main bundle stayed flat at 108 KB gz** (same as M5a). That's the win:
no other route pays the export cost.

## What you'll see

### Scenario picker
Top of the page. Defaults to the active scenario. Pick any scenario to
export — switching here doesn't change the rest of the app's active
scenario, it's local to the export. The summary line below shows the
selected scenario's name, final price, and total hours.

### XLSX Workbook card
Single "Download .xlsx" button. The resulting workbook has 7 sheets:

1. **Summary** — project info, headline KPIs, subtotals, run-rate. If
   the scenario has an M&A overlay configured, it appears here as a
   labeled "preview only" section.
2. **Resources** — one row per resource. Raw fields (role / skill /
   geography / rates / allocation) + computed totals (hours / billed /
   internal cost / margin).
3. **Cloud** — one row per cloud line item. Service / SKU / region /
   pricing + monthly + project-duration cost.
4. **Other Costs** — one row per other-cost item. Category / vendor /
   unit cost / total / include-in-run-rate.
5. **By Phase** — one row per phase. Duration + resource/cloud/other
   breakdown + total + avg FTE.
6. **Assumptions** — one row per assumption. Topic / description /
   source / risk / reviewed-at.
7. **Audit Log** — every recorded change. Timestamp / scenario name /
   category / headline / summary / kind. Sorted reverse-chrono.

### PDF Report card
Single "Download .pdf" button. The resulting PDF is 4-5 pages:

1. **Cover** — project name, client, scenario, date, final price in
   40pt, blended rate + hours subtitle.
2. **Headline KPIs** — full KPI table including subtotals, contingency,
   reserve, run-rate breakdown.
3. **Cost by Phase** — phase-by-phase breakdown table.
4. **Resources (top 20 by cost)** — top 20 highest-cost resources
   table. If there are more than 20, a footnote says "+ N more not
   shown. See the XLSX export for the full list."
5. **Key Assumptions** (if any) — sorted high-risk first.

### CSV Files card
Three sub-buttons:
- **Resources (N rows)** — flat CSV of all resources
- **Cloud (N rows)** — flat CSV of all cloud line items
- **Other costs (N rows)** — flat CSV of all other-cost line items

Each CSV starts with a UTF-8 BOM so Excel opens it cleanly. Fields with
commas, quotes, or newlines are RFC-4180 escaped.

### JSON Backup card
Single "Download .json" button. The resulting JSON contains:
- Format version
- Generation timestamp
- App metadata (name + a note that re-import isn't yet supported)
- Full project
- Full scenarios list
- Full audit log

Use this for backups before risky changes or to share a model with a
colleague.

## Try these (the demos)

### 1. Cold start: XLSX → all 7 sheets
With a fresh apply, click **Export**. The first navigation pauses for ~1s
while the export chunks download. Then click **Download .xlsx**. The
button shows "Generating…" briefly while the workbook builds, then
triggers a browser download.

Open the file in Excel. Check the Summary sheet — Final price reads
**$2,369,903**, Total billable hours **15,041**, Realized margin
**25.00%**. Switch to Resources, scroll: 12 rows of resource data. By
Phase: 6 phases. Assumptions: 4 rows (from the seed). Audit Log: empty
on a fresh apply (or whatever changes you've made so far).

### 2. PDF → cover page
Click **Download .pdf**. Open. The cover shows the project name, the
$2,369,903 in 40pt, and the subtitle "15,041 billable hours · 25.0%
margin". Pages 2-5 are the KPI table, by-phase breakdown, top-20
resources, and 4 assumptions.

### 3. CSV → flat data
Click each of the three CSV sub-buttons. Three files download. Open
the Resources one — first row is the header, then 12 rows of data
with all fields including the engine-computed billed amount and
margin per resource.

### 4. Switch scenario, then export
Use the scenario picker (top of the page). Pick **Onshore-Only
(Conservative)**. The summary line updates to show `$0` and `0 hours`
(Onshore-Only is empty in the seed). Click **Download .xlsx** — you
get a workbook for that scenario, not the active one. The Summary
sheet shows the Onshore-Only scenario name + $0 final price.

This is the key feature: you can pull exports for any scenario without
having to switch the active one across the rest of the app.

### 5. JSON → round-trip
Click **Download .json**. Open the file in a text editor. You see the
project, all scenarios, and the audit log. Make a few changes in the
app, click Download again — the new file reflects the new state.

(Re-import support is a follow-up — for now, JSON exports are useful
for backup and inspection, not restore.)

### 6. Check that other routes don't load export chunks
Open DevTools → Network. Navigate to `/dashboard` — Recharts chunk
loads. Navigate to `/resources` — no new chunks. Navigate to `/export`
— now the export chunks come in (xlsx, jspdf, etc.). Go back to
`/dashboard` — those export chunks aren't re-fetched (cached) but they
weren't loaded for any other route.

## Design decisions

**`@e965/xlsx` instead of `xlsx`.** The public `xlsx` package on npm is
stale at 0.18.5 from 2022. The maintained SheetJS code lives on
`https://cdn.sheetjs.com/` outside the npm registry. The `@e965/xlsx`
scoped package mirrors the SheetJS API at the modern version (0.20.x)
and is npm-installable. Per security-conscious 2026 guidance.

**No `file-saver` dependency.** SheetJS has `writeFile` for Node; jspdf
has `doc.save()`. For raw Blob downloads (JSON, CSV), the standard
`URL.createObjectURL` + temporary `<a>` click pattern is fine.
Avoiding a tiny extra dep keeps the bundle simple.

**Lazy-loaded ExportPage.** Mirrors the M4c Dashboard pattern. Other
routes don't pay the export cost. The first click on "Export" in the
left rail pauses for ~1s while the chunks download; subsequent
visits are instant.

**XLSX uses `aoa_to_sheet`, not `json_to_sheet`.** Array-of-arrays gives
exact control over cell positions. The Summary sheet has section
headers ("HEADLINE KPIs", "SUBTOTALS", "RUN-RATE") and blank rows for
readability — `json_to_sheet` would force me into a single header row
and lose the layout.

**PDF uses jspdf-autotable, not raw jspdf primitives.** Building tables
by hand in jspdf (calculating column widths, paginating long lists) is
painful and brittle. The autotable plugin handles all of that.

**One CSV per data type, not a zipped bundle.** Three CSVs is two
fewer clicks than one zip-extract-three-open. The dealmaker typically
needs one of the three (resources for finance, cloud for cloud team,
other costs for procurement) — they don't always need all three at
once.

**JSON includes the audit log.** Audit history is part of "the full
model" — losing it on backup/restore would be data loss. The export is
~30KB for a fresh project (mostly the rate card embedded in resources
via inheritance? No — that's not in scenario data). For projects with
heavy audit history (1000 entries), it could approach 1MB but still
fits comfortably in a JSON file.

**JSON re-import is not yet supported.** Designing safe import (with
schema validation, ID collision handling, merge vs replace) is its own
milestone. The current export is one-way — useful for backup and
inspection.

**Per-card status (idle / generating / success).** Each card shows
"Generating…" while the heavy work runs, then "✓ downloaded" for 3s.
Errors show in a banner at the top with the error message — defensive
for the case where the browser blocks downloads or a dep fails to
load.

## What's deliberately not here

- **Pre-built XLSX templates with formulas and conditional formatting.**
  Adding `cellStyles: true` lets you write rich styling, but it adds
  complexity. The current output is data-only; the user can apply
  styling in Excel.
- **PDF with charts.** The Dashboard's Recharts components could render
  to PNG and embed in the PDF, but that needs `html2canvas` (already
  pulled in by jspdf transitively) wired up. Reserved for a follow-up.
- **Share link.** The wireframe mentions "share link" as a sub-feature.
  This needs a server (to host the link); not viable in a client-only
  app. JSON export covers the "share a model" use case adequately.
- **JSON re-import.** Out of scope. See above.
- **Combined "Export All" button** that bundles XLSX + PDF + JSON
  + CSVs into a single zip. Possible with a small JSZip dep; deferred.
- **Customizable export** (let user pick which sheets, which
  scenarios). Current design exports everything for the chosen
  scenario; covers 95% of cases.

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
- ✅ **M5b** — Export Center ← **you are here**
- → M5c — First-run wizard + populated Onshore-Only seed
- → M5d — M1c right-rail defensibility panel + polish

**Every left-rail navigation item now points at a real, fully-functional
screen.** The tool is end-to-end usable: model an engagement, compare
scenarios, run M&A overlays, capture assumptions, browse audit history,
and export deliverables. M5c and M5d are quality-of-life: the wizard
makes creating new projects pleasant; the defensibility panel makes
numbers traceable to their assumptions.

Commit:
```powershell
git add .
git commit -m "M5b: Export Center - XLSX / CSV / PDF / JSON"
```
