# 09 - Export Center

Where the model leaves the app. Four export targets, each with options.
Single column, top-to-bottom: pick target, set options, generate.

## Layout

```
+----------------------------------------------------------------------------+
|                                                                            |
|  EXPORT                                                                    |
|  Scenario: [Base Case (v)]    Add comparisons: [+ Add scenario]            |
|                                                                            |
|  +------------------------------------------------------------------+      |
|  | [ XLSX ]  [ CSV ]  [ PDF ]  [ Share Link ]   [ JSON ]           |      |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  XLSX - Excel Workbook                                                     |
|  +------------------------------------------------------------------+      |
|  | Includes:                                                        |      |
|  |   [x] Summary sheet (KPIs + assumptions)                         |      |
|  |   [x] Resource detail (one row per resource per phase)           |      |
|  |   [x] Cloud detail (line items + monthly burn)                   |      |
|  |   [x] Other costs detail                                         |      |
|  |   [x] Monthly burn curve (single combined sheet)                 |      |
|  |   [x] Assumption ledger                                          |      |
|  |   [ ] Audit log (last 100 entries)                               |      |
|  |   [ ] Formulas preserved (where possible)                        |      |
|  |                                                                  |      |
|  | Layout:                                                          |      |
|  |   (•) Standard (one sheet per section)                           |      |
|  |   ( ) Compact (single sheet, sections stacked)                   |      |
|  |                                                                  |      |
|  | Branding:                                                        |      |
|  |   [x] Cover page with project metadata                           |      |
|  |   [ ] Company logo:  [No logo set - upload in Settings]          |      |
|  |                                                                  |      |
|  | Filename: [Vertex_Retail_Modernization_v1.0.0_BaseCase.xlsx___]  |      |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  [Generate XLSX]                                                           |
|                                                                            |
|  RECENT EXPORTS                                                            |
|  +------------------------------------------------------------------+      |
|  | Vertex_..._BaseCase_v1.0.0.xlsx       2026-05-27 19:51    [⤓]   |      |
|  | Vertex_..._comparison.pdf             2026-05-27 14:22    [⤓]   |      |
|  | Vertex_..._BaseCase_v0.9.3.csv        2026-05-26 11:08    [⤓]   |      |
|  +------------------------------------------------------------------+      |
|                                                                            |
+----------------------------------------------------------------------------+
```

## When PDF is selected

```
+------------------------------------------------------------------+
| PDF - Executive Summary                                          |
+------------------------------------------------------------------+
| Length:                                                          |
|   (•) Executive (2-3 pages)                                      |
|   ( ) Standard (5-8 pages with detail tables)                    |
|   ( ) Full (everything: every line item, burn detail, audit log) |
|                                                                  |
| Sections:                                                        |
|   [x] Cover                                                      |
|   [x] Headline KPIs + burn curve                                 |
|   [x] By phase / By geography / By cloud                         |
|   [x] Top assumptions                                            |
|   [x] Run-rate projection                                        |
|   [ ] Per-resource detail                                        |
|   [ ] Per-cloud-line-item detail                                 |
|                                                                  |
| (i) Phase 1 uses browser print-stylesheet. A branded PDF         |
|     generator with custom templates is Phase 2.                  |
|                                                                  |
| Filename: [Vertex_Retail_Modernization_ExecSummary.pdf________]  |
+------------------------------------------------------------------+
```

## When CSV is selected

```
+------------------------------------------------------------------+
| CSV - Raw Data                                                   |
+------------------------------------------------------------------+
| Export type:                                                     |
|   (•) Burn curve (months × cost components)                      |
|   ( ) Resource detail (resource × phase)                         |
|   ( ) Cloud line items                                           |
|   ( ) Other cost line items                                      |
|   ( ) Assumption ledger                                          |
|   ( ) All as ZIP of separate CSVs                                |
|                                                                  |
| Delimiter:    (•) Comma   ( ) Tab   ( ) Semicolon                |
| Decimal:      (•) Period  ( ) Comma                              |
+------------------------------------------------------------------+
```

## When Share Link is selected

```
+------------------------------------------------------------------+
| Share Link                                                       |
+------------------------------------------------------------------+
| Link encodes the current scenario as URL parameters. Anyone with |
| the link can open it in the calculator (read-only by default).   |
|                                                                  |
| (i) Phase 1: client-side state only. The link contains the full  |
|     scenario data and may be long (~50KB compressed). Phase 2    |
|     adds short URLs backed by a shared store.                    |
|                                                                  |
| Permissions:                                                     |
|   (•) Read-only                                                  |
|   ( ) Allow scenario edits in the recipient's session            |
|     (recipient's edits do not modify the source)                 |
|                                                                  |
| Link:                                                            |
| [https://sow-calc/p/proj_vtx.../s/sc_base?data=...     ] [Copy]  |
|                                                                  |
| Expiration: ( ) Never  (•) 30 days  ( ) 7 days                   |
+------------------------------------------------------------------+
```

## When JSON is selected

```
+------------------------------------------------------------------+
| JSON - Machine-readable export                                   |
+------------------------------------------------------------------+
| Format:                                                          |
|   (•) Full scenario (project + scenario, ready to re-import)     |
|   ( ) Calc engine output (ScenarioTotals only)                   |
|   ( ) Both                                                       |
|                                                                  |
| (i) Useful for backup, sharing with developers, or piping into   |
|     other tools.                                                 |
|                                                                  |
| Filename: [Vertex_Retail_Modernization_v1.0.0.json___________]   |
+------------------------------------------------------------------+
```

## Zone explanations

### Format tabs (top)
One-click to switch between target formats. The form below adapts to the
selected format.

### Format-specific options
Each format has its own set of checkboxes / radios. Sane defaults so the
user can hit "Generate" without thinking.

### Filename
Pre-filled with `{ProjectName}_{ScenarioName}_v{Version}.{ext}`, editable
before generation.

### Recent exports
Last 10 exports persisted in local storage. Click `[⤓]` to re-download the
same file (if the underlying data hasn't changed, it's the cached blob;
if it has, the user is prompted to regenerate).

## Interactions

- `[Generate XLSX]` etc. triggers the export. Progress shown inline
  (spinner + "Generating..." text). XLSX/PDF typically finish in <1s for
  reasonable models.
- For PDF, the print-stylesheet approach in Phase 1 actually opens a
  browser print dialog. The Phase 2 server-side generator is a drop-in
  replacement.
- Once generated, the file is saved to the recent-exports list AND
  downloaded to the user's downloads folder.

## Scenario switching behavior

The scenario picker at the top is the source of what gets exported -
independent of the top-rail active scenario, because the user often wants
to export a non-active scenario. Adding scenarios to the picker (via the
`+ Add scenario` button) creates a comparison export.

## States

**Loading (during generation):** the format options form is disabled with
a "Generating..." overlay. Cancel button to abort long-running generation.

**Error:** if export fails (e.g., trying to PDF an empty scenario), inline
error in the options form. No modal.

## Keyboard

- `1` / `2` / `3` / `4` / `5` - jump between format tabs
- `Enter` (when focus is on options form) - generate
- `Esc` (during generation) - cancel
