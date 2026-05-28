# Deliverable #5 - Wireframes & Screen Descriptions

Text-described layouts for the 10 primary screens (from Deliverable #2) plus
the persistent chrome and first-run flow. Each screen has its own file in
`docs/wireframes/`. This file is the index plus the cross-cutting concerns
(design language, chrome, keyboard shortcuts, states).

## Screens covered

| #  | File | Purpose |
|---|---|---|
| 01 | wireframes/01-dashboard.md         | Headline KPIs, burn curve, top variances - the exec view |
| 02 | wireframes/02-project-setup.md     | Define the engagement: type, phases, contingency, FX |
| 03 | wireframes/03-resource-planner.md  | Build the labor cost: role x level x geo x allocation |
| 04 | wireframes/04-cloud-planner.md     | AWS + Azure line items with pricing model & ramp |
| 05 | wireframes/05-other-costs.md       | Licenses, hardware, T&E, training, subcontractors |
| 06 | wireframes/06-ma-mode.md           | TSA / Carve-out / Integration overlays (conditional) |
| 07 | wireframes/07-scenarios-compare.md | Side-by-side: 2-4 scenarios on one screen |
| 08 | wireframes/08-assumption-ledger.md | Every assumption listed, with status and impact |
| 09 | wireframes/09-export-center.md     | XLSX / CSV / PDF / share link |
| 10 | wireframes/10-audit-log.md         | Change history, filterable |
| 11 | wireframes/11-settings.md          | Rate cards, cloud pricing tables, role catalog |

---

## Design language

### Typography
- **Labels and prose:** system sans-serif (San Francisco / Segoe UI / Inter)
- **Monetary numbers:** monospace digits (tabular numerals), right-aligned in tables
- **IDs, code, paths:** monospace (Fira Code or SF Mono)
- **Hierarchy:** 3 sizes max in any one screen - oversized for headline KPIs, body, small for metadata

### Number formatting
- **USD:** `$1,234,567` - dollar sign, thousand separators, no currency suffix
- **Other currency:** `EUR 1,234,567` - currency code prefix
- **Percentages:** `25.0%` (one decimal place by default), `-3.2%` (always carry sign for variances)
- **Round amounts > $100K** display without cents in chrome and KPIs. Detail rows keep cents.
- **Negative margin** rendered red with a leading minus, e.g. `-$45,000` and `-3.2%`

### Color
Minimal palette. Status colors only earn their place when they communicate state.
- **Neutral:** grays for chrome, borders, text. The interface is mostly gray and white.
- **Accent:** one brand accent (default blue) for primary buttons and links.
- **Status:**
  - Green = good (positive margin, validated assumption, on track)
  - Amber = warning (guardrail triggered, contingency below recommended, stale FX)
  - Red = problem (negative margin, missing required input, audit flag)
- **Dark mode** is optional; default is light because spreadsheet-style work reads better on light backgrounds.

### Spacing
- Generous in dashboard, M&A mode, settings.
- Tight in planners (this is where you work; density matters).
- Tables have row-hover highlighting so you don't lose your place in long lists.

### Iconography
- Outline icons (not filled) for navigation.
- A small `i` icon next to defaults the user hasn't overridden = "this is a default, click to see source."
- A small pencil icon next to overridden values = "this was edited; click to revert."
- A small warning triangle for guardrail breaches; clicking opens the guardrail in the right rail.

---

## Persistent chrome (visible on every project screen)

```
+----------------------------------------------------------------------------+
| LOGO  | Vertex Retail Modernization v1.0.0  [DRAFT]   ...    user menu (v) |   <- top rail
| BAR   |  Scenario: [Base Case (v)]  [+ Clone]  [Compare]                   |
|       |  $2.37M price | $1.78M cost | 25.0% margin | $145/hr blended       |
|       |                          [Export ↓]  [Audit ●3]                    |
+-------+----------------------------------------------------------------------+
|       |                                                                    |
| Left  |             ============= WORKSPACE ============                   |
| Rail  |                                                                    |
|       |  (Whichever screen is selected from the left rail renders here)    |
|       |                                                                    |
|       |                                                                    |
+-------+--------------------------------------------------+-----------------+
                                                           | Right rail      |
                                                           | (slides in when |
                                                           |  a number is    |
                                                           |  clicked - the  |
                                                           |  defensibility  |
                                                           |  panel)         |
                                                           +-----------------+
```

### Top rail (sticky to top of viewport)

Three rows when expanded; collapses to one row on narrow viewports.

**Row 1:** Project name + version + status pill + user menu.
- Status pill: DRAFT (gray), UNDER REVIEW (amber), APPROVED (green), ARCHIVED (faded gray).
- Click status pill -> dropdown to change it (writes an audit entry).
- User menu has: Settings, Sign out, Help.

**Row 2:** Scenario chooser + clone + compare.
- Dropdown lists every scenario in this project with a marker for the base.
- `[+ Clone]` -> opens a one-field modal ("Name your new scenario"), creates a deep copy of the current scenario, switches view to it. The new scenario's `parentScenarioId` points to the source.
- `[Compare]` -> jumps to the Scenarios & Compare screen with the current scenario pre-selected.

**Row 3:** Four headline KPIs.
- Final Price | Total Cost | Realized Margin% | Effective Blended Rate
- All four are live-updated as you edit anywhere in the workspace.
- Each is clickable -> opens the right rail with the formula.

**Right of KPIs:** Export button + Audit indicator.
- Export jumps to Export Center pre-filtered to current scenario.
- Audit indicator shows a dot + count when there are unreviewed audit entries since last visit.

### Left rail (navigation)

```
+--------+
| ★      |  Dashboard
| ✎      |  Project Setup
| 👥     |  Resources             [12]
| ☁      |  Cloud                 [ 8]
| $      |  Other Costs           [ 5]
| ⌫      |  M&A Mode              ← only shown if engagement is M&A
| ⇄      |  Scenarios             [ 2]
| ✓      |  Assumptions       (!) [ 4]   ← (!) means unreviewed
| ↓      |  Export
| 🕒     |  Audit Log
+--------+
| ⚙      |  Settings
+--------+
```

- Item count badges show how many items live in that section.
- A `(!)` dot indicates the section has validation warnings or unreviewed items.
- M&A Mode appears only if `project.engagementContext` is `MAIntegration`, `MACarveOut`, or `TSA`.
- Collapse toggle at bottom-left -> rail collapses to icons only, doubling workspace width.

### Right rail (defensibility panel)

Slides in from the right when the user clicks any number, anywhere.

```
+--------------------------------------+
| Where does this come from?        × |
|                                      |
| $1,470,580                           |
| Resources Subtotal                   |
|                                      |
| FORMULA                              |
|   Sum of internal cost across all   |
|   resources, converted to USD.       |
|                                      |
| INPUTS (12 resources)                |
|   Engagement Lead .....   $90,440    |
|   Project Manager .....  $186,560    |
|   Solution Architect ..  $128,520    |
|   ... 9 more                         |
|                                      |
| LINKED ASSUMPTIONS                   |
|   - 45% offshore ratio   [medium]    |
|   - 85% utilization      [low]       |
|                                      |
| [Jump to Resource Planner →]         |
+--------------------------------------+
```

This is what makes the calculator defensible. Every number is one click from
its own derivation. The exec asking "why is this $1.5M?" gets the answer in
the same view.

The panel scrolls independently of the workspace, doesn't block interaction
with the workspace behind it, and dismisses with Esc or the × button.

---

## Keyboard shortcuts (global)

A small overlay accessed with `?` lists everything; here are the essentials.

| Key | Action |
|---|---|
| `?` | Show shortcut overlay |
| `g d` | Go to Dashboard |
| `g r` | Go to Resources |
| `g c` | Go to Cloud |
| `g s` | Go to Scenarios |
| `g a` | Go to Assumptions |
| `s` then number | Switch to scenario N (1, 2, ...) |
| `c c` | Clone current scenario |
| `e` | Export (jumps to Export Center) |
| `/` | Focus the page's search/filter input if present |
| `Esc` | Close right rail; cancel inline edit |
| `Enter` | Confirm inline edit |
| `Tab` / `Shift+Tab` | Next / previous editable cell in a table |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo last edit (writes paired audit entries) |
| `Ctrl+/` | Toggle line item comment / note |

Two-key sequences (`g d`, `c c`) use a 1-second timeout. We're not building Vim, but
power users will thank us.

---

## Cross-cutting states

Every screen must define how it looks in four states. The state catalog:

### Empty state
The first time a user lands on the screen and there's no data. Show:
- A friendly headline ("No resources yet")
- A one-line explanation of what this screen is for
- A primary CTA ("+ Add your first resource")
- Maybe an illustration if we feel like it, but don't block

### Populated state
The standard view. This is what 95% of the wireframes describe.

### Loading state
Skeleton rows that match the eventual layout. No spinners-in-space - skeletons preserve
spatial expectation. Loading on this app is rare (it's a local-first model with cached
state) so this is mostly relevant for the very first paint and for Export rendering.

### Error state
- Inline next to the affected field for validation errors ("Bill rate must be > 0")
- Banner across the top of workspace for engine errors ("Cannot total: scenario has a resource with EUR rate but no EUR FX rate set")
- Never a full-screen error page. Always preserve the surrounding context.

Each per-screen wireframe specifies these where they differ from defaults.

---

## What scenario switching does

A primary navigation concept. When the user picks a different scenario from
the top-rail dropdown:

- **Workspace numbers re-render** from the new scenario's data.
- **Filter and sort state on the current screen is preserved.** (If I'm
  filtered to "offshore only" on the Resource Planner and switch scenarios,
  I stay filtered to offshore on the new scenario.)
- **Right rail closes** automatically - the previously-clicked number may
  not exist in the new scenario.
- **The URL updates** so the back button takes you to the previous scenario.
- **The four KPIs in the top rail animate** to the new values (subtle - just
  a fade swap, no theatrical counting).

This makes "what would happen if we used onshore-only?" a one-click question
during a meeting. That's the whole point.

---

## Right-rail equivalents on mobile

The product is optimized for laptop. On mobile (read-only-friendly, per
Deliverable #2), the right rail becomes a bottom sheet that slides up from
the bottom edge instead of in from the right. Same content, same dismiss
behavior. The left rail collapses to a hamburger menu. The top rail
collapses to one row: project name + scenario chooser + KPI carousel.

The planners (Resource, Cloud, Other Costs) become read-only on mobile.
Editing requires a tablet or larger.
