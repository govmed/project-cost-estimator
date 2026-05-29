# M3b — Cloud Planner: Editable + Add from Catalog

The Cloud Planner stops being a viewer. Every field in the detail pane
edits in place; "+ Add from catalog" opens a picker that pulls from the
AWS and Azure pricing seeds; delete and duplicate live in the list rows.

## What got added/changed

```
sow-calc/
+-- src/
|   +-- data/
|   |   +-- store.ts                                  <- UPDATED: 4 cloud actions
|   |   +-- audit-log.ts                              <- UPDATED: 4 new action kinds
|   |   +-- cloud-catalog-lookup.ts                   <- NEW: lazy-loaded catalogs
|   +-- ui/
|       +-- pages/CloudPlannerPage.tsx                <- UPDATED: wires modal + auto-select
|       +-- components/cloud/
|           +-- AddCloudLineItemModal.tsx             <- NEW: picker flow
|           +-- CloudLineItemDetail.tsx               <- UPDATED: editable fields
|           +-- CloudLineItemList.tsx                 <- UPDATED: row actions
|           +-- EditableSelect.tsx                    <- NEW: enum dropdown
|           +-- EditableToggle.tsx                    <- NEW: boolean toggle
+-- tests/ui/
    +-- cloud-planner.test.tsx                        <- UPDATED: assertions for M3b
    +-- cloud-planner-m3b.test.tsx                    <- NEW: 9 edit tests
```

No new npm dependencies.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M3b.json

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

npm test       # expect 115/115
npm run dev
```

Click **Cloud** in the left rail.

## What you'll see vs. M3a

The Cloud Planner header has an **enabled** "+ Add from catalog" button
(was disabled). Selecting any item on the left shows a detail pane that
looks the same but where every field is now click-to-edit. Hovering a
list row reveals duplicate / delete icons on the right.

## Try these (the demos that prove this milestone)

### 1. Edit a quantity, watch everything recompute
Click the Quantity value in the detail pane (it's the second-to-last
field in the Pricing section). It becomes an input. Type `20`, press
Enter. Watch:
- The detail pane's Monthly at Steady State recomputes
- The list row's `$XXX/mo` updates
- The provider subtotal card updates
- The header's Project total updates
- The top-rail Final Price KPI updates

### 2. Add an item from the catalog
Click `+ Add from catalog`. Modal opens.
- Pick **aws** (briefly shows "Loading aws catalog…", then category dropdown appears)
- Pick **Compute**
- Pick e.g. **EC2 · c7i.2xlarge · OnDemand · $0.34/instance-hour**
- Environment defaults to **prod** with multiplier **1.00** (from the catalog)
- Quantity 1, optional description
- Preview shows: `$0.34/instance-hour × 1.00 × 1 = $0.34/month`
- Click **Add line item**

Modal closes; the new item appears in the list AND is auto-selected.
The detail pane shows the catalog values, ready for further editing.

### 3. Switch environment in the modal
Open the modal, pick aws → Compute → any entry. Change Environment from
**prod** to **dev**. The Env Multiplier auto-changes to whatever the AWS
catalog defines for dev (typically 0.3). This is the "dev is 30% of prod"
modeling per the data model.

### 4. Edit the pricing model
On any list item, click into the detail. Click the Pricing Model
field — it becomes a dropdown. Pick "Spot". The change commits.
Notice the engine's Monthly does NOT change automatically: per the
data model, unitCost stores already-discounted pricing. Spot pricing
is its own catalog entry; switching models is documentation only.
(If you want spot pricing, add it as a new line item.)

### 5. Duplicate and delete
Hover any row in the list. Two icons appear on the right: ⎘ (duplicate)
and ✕ (delete). Duplicate creates an identical row right below. Delete
needs two clicks (the second one says "Confirm?").

### 6. Toggle Include in Run-Rate
In the Environment section, the "Include in Run-Rate" toggle. Flip it on
for a dev item — the Run-Rate Monthly value in Engine Output changes
from $0 to its monthly value. Flip it off — drops back to $0.

### 7. Switch scenarios
Top-rail dropdown to Onshore-Only. Your edits to Base Case are
preserved. Edits to Onshore-Only are independent.

### 8. See the audit log
DevTools console:
```javascript
JSON.parse(localStorage.getItem('sow-calc:audit:proj_vtx_modernization_2026'))
```
Every cloud action shows up: `cloud.add`, `cloud.delete`,
`cloud.duplicate`, and `cloud.field.update` entries with the field
name, old value, new value.

## How the catalog flow works

The full AWS catalog is 16KB minified (~3KB gzipped), Azure is similar.
Both lazy-load on first modal open. The catalog defines:
- The set of `{service, sku, pricingModel, unitCost}` tuples available
- Per-environment multiplier defaults (e.g. dev=0.3, prod=1.0)
- The region for the file (e.g. us-east-1 for AWS, eastus for Azure)

When you confirm the modal, the store builds a new `CloudLineItem` with:
- `unitCost` from the catalog entry (currency from the catalog)
- `environmentMultiplier` from the catalog's defaults for the chosen env
- `quantity`, `description`, `environment` from the form
- `includeInRunRate` defaults to true if environment is "prod"
- `rampCurve` defaults to "flat"
- All other fields editable post-add via the detail pane

## What's deliberately not here

- **GCP / Oracle / Other** providers: no catalog files in Phase 1. The
  picker only offers AWS and Azure. You can still add a custom GCP item
  programmatically; the UI just doesn't have a catalog flow for it.
- **Region picker:** the region comes from the catalog file (one per
  provider). To model multi-region, edit the region field on the
  resulting item in the detail pane.
- **Catalog search:** dropdowns only. With ~115 AWS SKUs and 98 Azure
  SKUs, filtering by category gets you to a manageable list. A search
  box would be nicer; deferred.
- **Recharts ramp chart with phase-boundary annotations:** still using
  the CSS bar chart from M3a. Genuinely good enough for M3.
- **Tests for the modal's loading state:** the lazy import resolves
  fast enough in jsdom that the "Loading catalog…" message is barely
  observable; I didn't try to test that frame.

## Where M3 stands

- ✅ **M3a** — Cloud Planner read-only
- ✅ **M3b** — Cloud Planner editable ← you are here
- → **M3c** — Other Costs planner + Project Setup screen → **closes M3**

After M3c, a user can build a complete estimate from scratch — resources
+ cloud + other costs + project settings — and the tool replaces a
spreadsheet end-to-end. That's the "first real engagement" milestone
from #8.

## What this milestone really means

Before M3b, cloud was something you looked at. After M3b, cloud is
something you *model*. The list/detail layout (vs the table-style
Resource Planner) is intentional — cloud line items have a lot of
attached metadata that needs space to breathe, and you're typically
working one item at a time ("OK, scale up the prod RDS"). The Resource
Planner's matrix view is right for resources; the cloud's list/detail
is right for cloud. Two different shapes for two different problems.
