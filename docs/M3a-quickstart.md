# M3a — Cloud Planner (read-only)

The Cloud screen renders. Click any line item on the left, see its full
details on the right, watch the ramp curve preview show the monthly burn
shape.

## What's new

```
sow-calc/
+-- src/
|   +-- ui/
|       +-- routes.tsx                                <- UPDATED: Cloud route -> CloudPlannerPage
|       +-- pages/
|       |   +-- CloudPlannerPage.tsx                  <- NEW: list/detail layout
|       +-- components/cloud/
|           +-- CloudProviderBadge.tsx                <- NEW: AWS/Azure/GCP indicator
|           +-- CloudLineItemList.tsx                 <- NEW: grouped list pane
|           +-- CloudLineItemDetail.tsx               <- NEW: detail pane
|           +-- RampCurvePreview.tsx                  <- NEW: CSS bar chart
+-- tests/ui/cloud-planner.test.tsx                  <- NEW: 12 tests
```

No new npm dependencies — the ramp chart uses pure CSS instead of pulling
in Recharts. Recharts can swap in later when the Dashboard burn curve
needs richer chart features.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M3a.json

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

npm test     # expect 106/106
npm run dev
```

Click **Cloud** in the left rail.

## What you'll see

**Header:** "Cloud Planner" with `8 line items · Base Case · Project total $XXX`

**Provider subtotal cards** (one per provider — AWS and Azure for the seed)

**Two-pane main area:**

- **Left:** the 8 cloud line items, grouped under "AWS" and "Azure" headers.
  Each row shows the service name, SKU, category · environment · qty,
  pricing model, and monthly steady-state cost. The first item is
  selected by default; selected row has a subtle highlight.

- **Right:** detail pane for the selected item with:
  - Provider badge + category + service name + SKU
  - **Pricing** section: pricing model, region, unit cost, quantity,
    environment, env multiplier
  - **Engine output** section: effective unit cost (with env multiplier
    applied), monthly at steady state, project duration cost, run-rate
    monthly
  - **Ramp curve** preview: small bar chart of monthly burn across
    project months, with peak and total labels underneath

## Try these

1. **Click around the list.** Selection changes the detail pane and
   ramp curve. The detail panel updates instantly.

2. **Look at the env multipliers.** The dev EC2 (m6i.large) has
   `environmentMultiplier: 0.3` per the seed pricing defaults — so the
   "Engine output" section shows the effective unit cost being 30% of
   the listed unit cost.

3. **Switch scenarios.** Top-rail dropdown: Base Case → Onshore-Only.
   The Onshore-Only scenario in the seed has its own (different) cloud
   line items copied at creation. Switching shows different items.

4. **Notice the "Reserved1yr" indicator.** The prod EC2 row in the seed
   uses Reserved pricing — visible both in the list (after the qty)
   and in the detail pane's Pricing Model field.

5. **The "run-rate" badge** on the right of list items marks the rows
   flagged `includeInRunRate: true`. Compare against the Run-Rate
   Monthly value in the detail pane — items without the badge show $0
   there.

## What's deliberately not here yet (M3b / M3c)

- **"+ Add from catalog" button is disabled.** M3b adds the picker
  that reads from `seed/cloud-pricing/aws-us-east-1.json` and
  `azure-eastus.json` and pre-fills a new line item.
- **Editing.** No fields are editable in M3a. M3b makes them all
  editable using the same EditableField pattern as the Resource
  Planner expanded row.
- **Delete / duplicate.** M3b.
- **Other Costs Planner.** M3c builds the structurally similar
  table for licenses, hardware, travel, training, subcontractors.
- **Project Setup screen** (phases, contingency, FX rates). M3c.
- **Recharts-based ramp chart** with phase boundary annotations.
  M3a ships a CSS bar chart; a later milestone may swap to Recharts
  when the Dashboard's monthly burn chart needs the same component.

## Where M3 stands

- ✅ **M3a** — Cloud Planner read-only (you are here)
- → **M3b** — Cloud Planner editable + Add from catalog + delete / duplicate
- → **M3c** — Other Costs planner + Project Setup screen

After M3c, a user can build a complete estimate from scratch — resources
+ cloud + other costs — and the tool replaces a spreadsheet end-to-end
for a real engagement.
