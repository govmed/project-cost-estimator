# M5d-3 — Polish Bundle: Test Determinism, project.create Audit, Assumption Entity Linking

M5d-3 closes out M5 with four polish items. None of them adds new
capability surfaces; each one fixes a friction point you'd hit if you
actually used the app in anger.

## The four polish items

### 1. Single-fork test pool (test determinism on Windows)

The full suite was passing on the build sandbox but failing
intermittently for you on Windows — 6-8 random tests would fail per
run, all "navigates to X" or "renders heading" style. Root cause:
Vitest's default parallel scheduler spawns N worker processes and
they race on shared module state (Zustand stores, localStorage,
`window.history`). On Linux with fewer cores and slower I/O the races
serialize themselves; on a fast Windows box they don't.

Fix: `vite.config.ts` now sets `test.pool = 'forks'` with
`poolOptions.forks.singleFork = true`. Tests run serially in one
worker. **Tradeoff:** the full suite goes from ~60s parallel to ~95s
serial on Windows. Acceptable price for zero flakes.

### 2. setTimeout cleanup in AssumptionLedgerPage

When you clicked Delete on an assumption row, the confirm-delete
state would auto-reset after 3 seconds via an inline `setTimeout`.
The timer wasn't cancelled on component unmount, so in tests the
3-second callback would fire into a torn-down React tree and emit
`ReferenceError: window is not defined`. Latent since M5a.

Fix: moved the timer into a `useEffect` with cleanup. The effect
fires the 3s timer when `confirmDelete` flips true; if the component
unmounts (test ends, scenario switches, row gets filtered out), the
cleanup function calls `clearTimeout`. No more unhandled errors at
the end of the test run.

### 3. `project.create` audit kind

The wizard creates a new project but emitted no audit entry. Open
the new project's Audit Log right after creation and it was empty
until you made your first edit. The history started halfway through
the story.

Fix:
- New `'project.create'` variant on the `AuditAction` union with
  fields `name`, `client`, `engagementType`, `engagementContext`.
- New case in `AuditActionLabel.ts` rendering as **"Project
  created"** with a summary like *"Acme Modernization for Acme Inc.
  (Modernization, Fixed Fee)"* under the `project` category.
- Wizard calls `appendAudit(project.id, baseScenarioId, { kind:
  'project.create', ... })` right after `setProject()`.

New projects now have a non-empty audit log from the moment they're
created.

### 4. AssumptionLinksCell — navigable entity links

Until now the "Links" column in the Assumption Ledger just showed a
muted count: "2", "3". The data was there
(`Assumption.linkedEntities[]`) but invisible. You'd think "Offshore
ratio affects 2 things" and have no way to see which two.

Fix: built `AssumptionLinksCell.tsx`. Renders the count as a small
button. Clicking opens a popover that lists each linked entity as a
navigable chip:

```
┌─ LINKED ENTITIES ──────────────┐
│ [resource]  Lead Engineer  →   │
│ [resource]  Senior FSE     →   │
└────────────────────────────────┘
```

Each chip shows the entity type as a small tag plus the friendly
name (looked up from the active scenario's data). Clicking navigates
to the screen that owns that kind of entity (Resource Planner /
Cloud Planner / Other Costs / Project Setup / Scenarios). Closing
behaviors: outside click, Escape key, navigation.

Also populated the Onshore-Only assumption's `linkedEntities` (it
was empty in M5c — it now links to all 12 onshore resources).

## What got added/changed

```
sow-calc/
+-- vite.config.ts                                       <- UPDATED: pool=forks/singleFork
+-- seed/scenarios/example-modernization.json            <- UPDATED: Onshore links
+-- src/
|   +-- data/
|   |   +-- audit-log.ts                                 <- UPDATED: project.create kind
|   +-- ui/
|       +-- components/
|       |   +-- assumptions/
|       |   |   +-- AssumptionLinksCell.tsx              <- NEW
|       |   +-- audit/
|       |       +-- AuditActionLabel.ts                  <- UPDATED: new label case
|       +-- pages/
|           +-- AssumptionLedgerPage.tsx                 <- UPDATED: setTimeout fix + cell
|           +-- NewProjectWizardPage.tsx                 <- UPDATED: emits audit
+-- tests/ui/m5d3-polish.test.tsx                        <- NEW: 8 tests
```

No new dependencies.

## Apply

```powershell
cd C:\dev\cost
powershell -ExecutionPolicy Bypass -File .\setup\bootstrap.ps1 -Target .\sow-calc -Manifest .\manifests\claude-manifest-M5d-3.json

cd .\sow-calc
npm test       # expect 275/275 - and it should be deterministic this time
npm run dev
```

If you previously stuck `--no-file-parallelism` in `package.json`'s
test script as a workaround, you can revert that — the
`vite.config.ts` change handles it permanently.

## Things to try

1. **Test stability.** Run `npm test` three times in a row. All
   three should return 275/275 with the same timing characteristics
   (~95s each on Windows). Previously you'd see different tests
   failing on each run.

2. **Create a project, then audit it.** Click "+ New Project" →
   step through with any name → Create. Click Audit Log in the left
   rail. You see one entry: "Project created — *Your Name* for
   *Your Client* (Modernization, Fixed Fee)". This is the new
   `project.create` kind. Make any edit (change a project setup
   field, add a resource), and that entry's still on top in
   reverse-chrono.

3. **Defensibility via assumption.** Go to Assumption Ledger
   (Base Case active). The "Links" column now shows clickable
   numbers. Click the "2" on the **Offshore ratio** row. A popover
   appears listing two `resource` chips. Click one — you land on
   Resource Planner. Now the assumption's downstream is browsable.

4. **Onshore-Only links.** Switch active to Onshore-Only via the
   top-rail. Open Assumption Ledger. The single assumption shows
   "12" in the Links column. Click — popover lists all 12 onshore
   resources by friendly name. Click any of them — Resource Planner.

5. **Delete with confidence.** Hover any assumption row's trash
   icon. Click once — it turns into a "Click again to confirm"
   state. Either click again (deletes), or wait 3 seconds (reverts).
   If you navigate away mid-3-second window, no error is logged —
   the timer is cancelled cleanly.

## Design decisions

**Single-fork via `vite.config.ts`, not a separate `vitest.config.ts`.**
This codebase already configures Vitest through the `test` block in
`vite.config.ts`. Splitting the config across two files would be
needlessly DRY-violating. The `pool` and `poolOptions` settings sit
right alongside the existing `environment`, `include`, `setupFiles`
entries.

**No new "global setup reset" hook between test files.** I
considered shipping a Zustand-reset and localStorage-clear setup
that runs before each test file, which would let us keep parallel
scheduling. Two reasons not to: (a) the failure mode is rare enough
on Linux that we wouldn't notice regressions before users do; (b)
the setup is fragile — every new top-level module that holds state
becomes another reset target. Single-fork is dumber and more
robust.

**`project.create` audit kind is emitted by the wizard, not by
`setProject`.** `setProject` is also used by the seed-loader (every
app boot) and the future JSON re-import path; neither should write
audit entries automatically. The wizard is the only place "create"
is the user's intent.

**AssumptionLinksCell uses a small popover, not an expanded row.**
Two alternatives: (a) expand the row to show inline chips, (b) open
a side panel. Both make the table layout shift, which is jarring
when you're scanning. A popover anchored to the count is the
lightest interaction; the table stays still.

**Entity navigation doesn't deep-link to the specific row.**
Clicking a resource chip lands you on `/resources` — not
`/resources#res_xyz`. Per-row anchors would require auto-scroll
logic in each Planner page. Deferred to a future polish; the
current behavior is "see all resources for this scenario", which is
useful enough.

**Friendly names looked up at render time, not stored on the
LinkedEntity.** I considered storing `displayName` alongside the
`id` so renderers don't need a lookup. Decided against — names can
change (resource renames, scenario renames), and stale display
strings are worse than a 50-line lookup function. The cell looks up
every render; the cost is negligible.

## What's deliberately not here

These items from the menu didn't make the cut for M5d-3 — keeping
the manifest small. They're polish, not blockers:

- **Audit log diff visualization.** Currently the audit log shows
  the change summary ("Allocation 50% → 75%") inline in the
  summary line. A proper before/after side-by-side panel for
  complex changes (resource.add showing the full resource object)
  is more involved.
- **M&A overlay charts.** The wireframe shows breakeven curves
  over the timeline. We ship a table. Adding the chart needs new
  Recharts data wrangling and chart components.
- **Cross-tab live sync.** A `window.addEventListener('storage',
  ...)` so two tabs of the same project mirror each other in
  real-time. Useful for screen-sharing demos.
- **JSON re-import.** Read a JSON export back to seed a new
  project. Needs schema validation, ID collision handling.
- **Per-row deep-linking** for assumption entity chips (see above).
- **Audit log filters by category.** Currently it's reverse-chrono
  only.

## Where things stand

- ✅ M1a/b · M2a/b/c · M3a/b/c · M4a/b/c/d · M5a · M5b · M5c · M5d-1 · M5d-2
- ✅ **M5d-3 — Polish bundle** ← **you are here**
- 🎉 **M5 complete**

**The SOW Cost Calculator is feature-complete for its first release.**

End-to-end flow: create a project (wizard) → fill it in (Resources /
Cloud / Other Costs / Project Setup screens) → model alternatives
(Scenarios + Compare) → defend the numbers (Defensibility panel on
every KPI + Assumption Ledger with navigable links) → audit your
edits (Audit Log) → export deliverables (XLSX / PDF / CSV / JSON).

268 tests passing deterministically. ~115KB gzipped main bundle.
Lazy chunks for the heavy export and dashboard paths.

Commit:
```powershell
git add .
git commit -m "M5d-3: test determinism, project.create audit, assumption entity links"
```
