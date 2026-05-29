# M5a — Assumption Ledger + Audit Log

M5a wires two left-rail items that have been stubbed since M1b:
**Assumption Ledger** and **Audit Log**. Both are essentially
"render existing data" milestones — assumptions have been a field on
`Scenario` since #3 (data model), and audit entries have been logged
for 22 manifests now. M5a finally surfaces them.

This sets up M5 in 4 sub-milestones (per the M5 plan):

- **M5a (this milestone)** — Assumption Ledger + Audit Log
- **M5b** — Export Center (XLSX / CSV / PDF / JSON)
- **M5c** — First-run wizard + populated Onshore-Only seed
- **M5d** — M1c right-rail defensibility panel + polish items

## What got added/changed

```
sow-calc/
+-- src/
|   +-- data/
|   |   +-- store.ts                                  <- UPDATED: 4 assumption actions
|   |   +-- audit-log.ts                              <- UPDATED: 4 new audit kinds
|   +-- ui/
|       +-- routes.tsx                                <- UPDATED: /assumptions, /audit wired
|       +-- pages/
|       |   +-- AssumptionLedgerPage.tsx              <- NEW
|       |   +-- AuditLogPage.tsx                      <- NEW
|       +-- components/
|           +-- assumptions/                          <- NEW DIRECTORY
|           |   +-- AssumptionSourceBadge.tsx         <- NEW
|           |   +-- AssumptionRiskBadge.tsx           <- NEW
|           |   +-- AddAssumptionModal.tsx            <- NEW
|           +-- audit/                                <- NEW DIRECTORY
|               +-- AuditActionLabel.ts               <- NEW: 28-action-kind renderer
|               +-- AuditCategoryBadge.tsx            <- NEW
+-- tests/ui/assumptions-and-audit.test.tsx          <- NEW: 14 tests
```

No new dependencies.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M5a.json

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

npm test       # expect 194/194
npm run dev
```

## What you'll see

### Assumption Ledger (left rail item)
The seed Base Case has 4 assumptions; the page surfaces them in a table:
- Topic (inline-renameable: click the topic, type, Enter)
- Description (full text; evidence URL link if set)
- Source dropdown (assumed / validated / clientConfirmed / industryBenchmark) with a colored badge
- Risk dropdown (low / medium / high) with a colored badge
- Links count (the `linkedEntities[]` field; not yet navigable — that's M5d)
- Reviewed timestamp (or "never" — the four seed assumptions are unreviewed)
- Actions: ✓ Review, ✕ Delete (two-click confirm)

Above the table:
- A subtitle: "4 assumptions in Base Case · 4 unreviewed"
- A `+ Add assumption` button → opens a modal
- Filter chips: by Source and by Risk Level

Onshore-Only (Conservative) has 0 assumptions; switching to it via the
top-rail dropdown shows the empty state with a CTA.

### Audit Log (left rail item)
A reverse-chronological list of every change you've made anywhere in the
app. Each entry:
- Timestamp
- Category badge (resource / cloud / otherCost / project / phase / scenario / ma / assumption)
- Human-readable headline ("Resource added", "Cloud line item deleted", "Scenario renamed", etc.)
- Summary line ("Senior Architect, $250/hr", "EC2-prod (aws)", "'Base Case' → 'Aggressive'")
- Scenario name on the right
- Click to expand → raw JSON of the audit entry

Above the list:
- Scenario filter dropdown (single-select; "All scenarios" by default)
- Category chip group (8 categories)
- Search box (substring match on headline + summary)
- "Clear" button when any filter is active

Paginated at 100 entries; "Load 100 more" at the bottom if there are more.

The 28 audit action kinds you've been logging silently across M2b → M4d
now have proper human-readable labels. They map to the 8 categories
shown in the chip group.

## Try these (demos that prove M5a)

### 1. Rename an assumption
Open Assumption Ledger. Click on "Offshore ratio". It becomes an input.
Type "Offshore ratio (50/50 → 70/30 onshore)". Enter. The topic updates.

Switch to Audit Log. You see "Assumption topic changed" near the top
with the before/after.

### 2. Mark some as reviewed
On the Assumption Ledger, click ✓ Review on three of the four
assumptions. The "4 unreviewed" subtitle drops to "1 unreviewed". The
Reviewed column shows today's date in green.

### 3. Add a new assumption
Click `+ Add assumption`. Fill in:
- Topic: "FX rate volatility"
- Description: "Assuming USD/EUR stays within ±5% of current rate for project duration"
- Source: clientConfirmed
- Risk Level: medium
- Evidence URL (optional): your contract URL

Submit. The new row appears in the table. Audit log shows "Assumption added".

### 4. Filter by source
Click the "clientConfirmed" chip. Only your new assumption is shown.
Click "Clear filters" to reset.

### 5. Use the Audit Log to inspect history
Switch to **Audit Log**. You see all the actions you've taken so far —
adding the assumption, renaming, marking reviewed.

Click the "scenario" category chip — only scenario actions remain.

Click an entry to expand. You see the full JSON of the audit entry,
including the action kind, scenario ID, and (for updates) before/after
values.

### 6. Generate audit history quickly
Go to Resources. Edit a few allocations and bill rates. Go to Cloud.
Add a line item. Go back to Audit Log and click Refresh. Every
change is now logged with the right category, headline, and JSON.

### 7. Search
On the Audit Log, type "billRate" in the search box. Only bill-rate
changes remain visible. Try "EC2", "Discovery", "Datadog" — substring
match works against both the headline and summary.

## Design decisions

**Audit entries are renderered, not refactored.** The audit log has 28
action kinds logged across 22 milestones. I added a single
`labelForAuditAction()` function that switches on `action.kind` and
produces a human-readable label + summary + category for each. This
keeps the existing audit data format frozen — no migration needed for
any user's existing audit history.

**TypeScript exhaustiveness check on `labelForAuditAction`.** The
default case uses a `never` cast so adding a new audit kind without
updating the renderer fails to compile. Defensive: when M5b adds export
actions, this catches the gap.

**Refresh button on the Audit Log.** The audit log reads from
localStorage. The store doesn't push audit entries to React state (they'd
be expensive). Instead the page reads on mount + when `project.updatedAt`
changes (a reasonable proxy for "you did something"). A manual Refresh
button is there for cases where the cross-tab sync would matter — could
get more sophisticated with a storage event listener in M5b.

**Pagination at 100 entries.** Audit log caps at 1,000 entries with FIFO.
Rendering all 1,000 as DOM nodes would be slow. 100-at-a-time with a
"Load more" button is fast and feels natural.

**Filter chips, not multi-select dropdowns.** Categories are 8 short
labels; chips show the full list at a glance and the active state is
visually obvious. Better than a dropdown for this size.

**Inline edits on Assumption rows for source + risk only.** Topic
renames inline (click → edit → Enter). Description edits would need a
larger input — defer to a detail pane or modal in a follow-up. For
now, edit description via deleting + re-adding (or via the audit log
which preserves the original).

**Add modal, not inline new row.** The new-assumption flow needs 5
inputs which would crowd a table row. A modal is cleaner.

## What's deliberately not here

- **Linked-entity navigation** ("this assumption affects 3 resources →
  jump to them"). Defer to M5d's defensibility panel, which is the
  natural home for this.
- **Bulk operations** (mark all as reviewed, filter-delete). Could add
  per-page bulk-action toolbar later.
- **Diff visualization** in the Audit Log (before/after side-by-side).
  Today expanded entries show JSON. A nicer diff renderer is polish.
- **Export of the audit log.** M5b's export work.
- **Cross-tab live sync.** Audit log refreshes on project change but
  not on background tab updates. A `storage` event listener would fix
  this — small enhancement.
- **Per-assumption description editor** (full textarea inline). Deferred
  to a detail pane.

## Where things stand

- ✅ M1a/M1b — scaffold + chrome + dashboard
- ✅ M2a/M2b/M2c — Resource Planner end-to-end
- ✅ M3a/M3b — Cloud Planner end-to-end
- ✅ M3c — Other Costs + Project Setup
- ✅ M4a — Scenarios CRUD
- ✅ M4b — Compare grid
- ✅ M4c — Recharts Dashboard
- ✅ M4d — M&A overlay (M4 closed)
- ✅ **M5a** — Assumption Ledger + Audit Log ← **you are here**
- → M5b — Export Center
- → M5c — First-run wizard + Onshore-Only seed data
- → M5d — Defensibility panel + polish

Commit:
```powershell
git add .
git commit -m "M5a: Assumption Ledger + Audit Log screens"
```
