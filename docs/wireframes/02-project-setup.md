# 02 - Project Setup

Where the engagement is defined. Three logical sections: identity, commercials,
phases. Single column for readability - this isn't a screen the user comes
back to often, but when they do they read top to bottom.

## Layout

```
+----------------------------------------------------------------------------+
|                                                                            |
|  IDENTITY                                                                  |
|  +----------------------------------------------------------------+        |
|  | Project name    | Vertex Retail - Commerce Platform Mod.   ✎  |        |
|  | Client          | Vertex Retail Holdings, Inc.             ✎  |        |
|  | SOW reference   | VTX-SOW-2026-014                         ✎  |        |
|  | Version         | 1.0.0                                    ✎  |        |
|  | Status          | [DRAFT (v)]                                   |        |
|  | Owner           | tmorales2@gainwell.com                       |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  ENGAGEMENT                                                                |
|  +----------------------------------------------------------------+        |
|  | Type            | ( ) Fixed Fee        (•) T&M Capped           |        |
|  |                 | ( ) T&M (open)       ( ) Milestone            |        |
|  |                 | ( ) Outcome-based                              |        |
|  |                                                                  |        |
|  | Context         | [Modernization (v)]                           |        |
|  |                 | Selection here may enable M&A Mode in left rail. |       |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  COMMERCIALS                                                               |
|  +----------------------------------------------------------------+        |
|  | Base currency   | [USD (v)]    FX as of [2026-05-27 (v)]        |        |
|  |                                                                  |        |
|  | Target margin   | [ 25.0 ] %     (i) margin on price            |        |
|  | Discount        | [  0.0 ] %     (i) applied to target price    |        |
|  | Contingency     | [  8.0 ] %     (i) applied to base cost        |        |
|  | Mgmt reserve    | [  3.0 ] %                                     |        |
|  |                                                                  |        |
|  | FX RATES (1 USD = X)                              [edit rates →] |        |
|  |   EUR  0.93   GBP 0.79   INR 83.50   CAD 1.36   AUD 1.51        |        |
|  |   BRL  5.05                                                      |        |
|  |   (?) Last refresh: manual entry 2026-05-27                      |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  PHASES                                              [+ Add phase]         |
|  +----------------------------------------------------------------+        |
|  | #  Name           Duration  Offset   Cumulative                  |        |
|  | 1  Discovery       4 wk      0 wk      4 wk     [ ✎ ] [ ⋮ ]      |        |
|  | 2  Design          6 wk      4 wk     10 wk     [ ✎ ] [ ⋮ ]      |        |
|  | 3  Build          16 wk     10 wk     26 wk     [ ✎ ] [ ⋮ ]      |        |
|  | 4  Test            6 wk     22 wk     28 wk     [ ✎ ] [ ⋮ ]      |        |
|  | 5  Deploy          4 wk     28 wk     32 wk     [ ✎ ] [ ⋮ ]      |        |
|  | 6  Hypercare       8 wk     32 wk     40 wk     [ ✎ ] [ ⋮ ]      |        |
|  |                                                                  |        |
|  | Total: 40 weeks   (~10 months)                                   |        |
|  |                                                                  |        |
|  | [Reset to standard 6-phase template]                             |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  ADVANCED                                                  [collapsed >]   |
|  +----------------------------------------------------------------+        |
|  | (Click to expand: org / owner / created-at / project ID for API |        |
|  |  use / archive controls)                                         |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
+----------------------------------------------------------------------------+
```

## Zone explanations

### Identity
Read-mostly metadata. Every field has an inline pencil to edit. Status
dropdown opens with the four state choices; changing it writes an audit
entry tagged with the user and timestamp.

### Engagement
Type uses radio buttons because it's a single choice with mutually exclusive
implications (Fixed Fee + Outcome-based are very different commercial
models). Context is a dropdown because it's a longer list and not all
options affect math equally.

Selecting M&A Integration / Carve-out / TSA here causes the M&A Mode item
to appear in the left rail.

### Commercials
The four percentages stack vertically for easy scan. Each has an `(i)` info
icon that hovers to explain the convention (e.g., margin = gross margin on
price, the formula `price = cost / (1 - margin)`).

FX rates show inline. Click `[edit rates →]` to open a modal-overlay form
with all currencies, including the option to add a new one. "Last refresh"
indicator nudges users toward keeping rates current. In Phase 2, a "Pull
latest from {provider}" button can sit next to that line.

### Phases
The most operational part of the screen. Each phase has duration and offset;
offset auto-computes from prior phase by default, but is editable for
projects that have parallel phases (e.g., Hypercare starts before Deploy
ends in some shops).

Pencil icon opens an inline editor for that row. Three-dot menu has: Insert
before, Insert after, Delete (with confirmation if any resource is
allocated to it).

"Reset to standard 6-phase template" is destructive - shows a confirmation
modal listing what would be lost.

### Advanced
Collapsed by default. Has the seldom-touched fields: project ID for API
integration, archive controls, org/owner reassignment.

## Interactions

- All numeric fields support inline editing with `Enter` to confirm, `Esc`
  to cancel.
- Editing a phase duration immediately re-runs the engine and updates the
  top-rail KPIs - useful for "what if we add 4 weeks to Build" scenarios.
- Reordering phases is drag-and-drop on the row's left edge.

## Scenario switching behavior

**Project Setup is project-wide, not scenario-specific.** Most fields here
don't change when you switch scenarios. The exception is the four
commercial percentages (margin, discount, contingency, mgmt reserve), which
*can* be overridden per scenario.

When a scenario has overrides, the affected fields show with a small "(s)"
badge meaning "scenario override active" - hovering says "Current scenario
overrides this; click to edit override or revert to project default."

## States

**Empty:** new project. Identity prefilled from the "New Project" wizard;
phases prefilled from the default template; all commercials at firm
defaults. The user can immediately move on to Resource Planner; nothing
on this screen is strictly required to start estimating.

**Loading:** never. This screen reads from local state.

**Error:** validation inline. Engagement context that requires M&A data
but no `maData` exists yet shows an amber banner with "Configure M&A Mode →".
