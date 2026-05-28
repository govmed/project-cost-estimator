# Deliverable #8 - Phase-1 Build Plan

What ships first to be useful. What's deferred and where the seams sit.
Definition-of-done per milestone so a team knows when to stop polishing
and ship.

## The shape of the plan

Phase 1 = "minimum useful calculator that a single user can run scenarios
on, defend, and export, in a meeting." Not a multi-user product. Not a
hosted SaaS. The bet is: get one user to "I'd rather use this than my
spreadsheet" before chasing the harder features.

Six milestones, sized roughly equally, in a strict order. Each milestone
ends with a demoable artifact and a hand-on-heart "we could ship it
here" exit criterion. Skipping ahead is allowed only if the team finds a
milestone unnecessary - never if they find it inconvenient.

| # | Milestone | Demoable artifact | Why this order |
|---|---|---|---|
| M0 | Engine + types proven (DONE) | `npm test` shows 43/43 | Foundation for everything |
| M1 | UI scaffold + chrome + project shell | App boots, project loads from JSON, chrome renders | Frames every other screen |
| M2 | Resource Planner end-to-end | Add resources, edit allocations, see live KPIs update | The screen users spend 80% of their time on |
| M3 | Cloud + Other Costs planners | Full estimate buildable from scratch in the UI | First "we replaced the spreadsheet" moment |
| M4 | Scenarios + Dashboard + Compare | Side-by-side comparison drives a real meeting | The strategic surface |
| M5 | Assumption Ledger + Audit + Export | Estimate is defensible and exportable | First "we used this for a real deal" moment |
| M6 | Polish, accessibility, performance | App is presentable to a non-friendly user | Closes Phase 1 |

After M6, Phase 1 ships. Phase 2 (backend, multi-user, live cloud APIs,
SSO) starts from a known-good foundation.

## Effort estimates: read these honestly

Numbers below are in engineer-weeks for a small team of 2-3 senior
TypeScript/React engineers familiar with the stack. Multiply by ~1.5
if the team is unfamiliar with shadcn/ui or Vite. Multiply by ~2 if
the team is junior or part-time. These estimates assume the
foundation (Deliverables #3-#7) is already in place - which it is.

These are NOT contractual estimates. They're for sequencing and
expectation-setting. Treat anything outside +/- 30% as a signal to
revisit scope, not push harder.

---

## M0 - Engine + types proven (already shipped, 0 weeks remaining)

**Status:** done in Deliverables #3 and #4. 43 tests pass. Seed data
shipped in #6.

**Why it matters:** every milestone below imports from `@/engine` and
`@/types`. The engine being pure, deterministic, and tested is what
lets UI work proceed in parallel with everything else.

**Exit criterion:** `npm test` shows green from a clean checkout.

---

## M1 - UI scaffold + chrome + project shell (~2 weeks)

**Goal:** the app boots in a browser. A project loads from JSON. The
persistent chrome (top rail, left rail, right rail) renders. Navigating
between the 10 screens works, even if each screen body is a stub.

**Tasks:**
1. Promote the config templates from #7. `npm install` brings in the
   full UI dep tree. Confirm engine tests still pass.
2. Vite + React 18 boots a "Hello SOW Calc" page.
3. Tailwind tokens wired up. `src/ui/styles/tokens.css` defines the
   CSS variables; dark mode toggle works (even if dark mode is ugly
   for now).
4. Routing: `/`, `/p/:projectId/dashboard`, and 9 other screen routes
   with stub bodies.
5. **Top rail** with: project name, status pill (read-only for now),
   scenario chooser (functional - dropdown switches scenarios), KPI
   strip showing live values from `calculate()`, Export and Audit
   buttons (stubs).
6. **Left rail** with all 10 screen links + section counts. Selected
   route highlighted. Collapse-to-icons toggle works.
7. **Right rail** scaffold (slides in when toggled, dismisses with Esc).
   Empty content for now.
8. **Project store** via Zustand with `persist` middleware writing to
   localStorage. Storage interface (Phase 2 seam) abstracts the
   underlying mechanism.
9. **Seed import:** loading `seed/scenarios/example-modernization.json`
   produces a working Project in the store. Reload preserves state.
10. **First-run flow:** brand-new visitor sees a "Start with example" or
    "Start blank" choice.

**Definition of done:**
- App boots, persists across reloads.
- Navigating the 10 left-rail items works.
- The chrome looks like the wireframes (not pixel-perfect, but
  structurally right).
- KPIs in the top rail show real numbers from `calculate()` against
  the loaded seed.
- A truly empty state (no project) shows the first-run choice.

**Anti-goals:** any actual editing. Any screen body beyond a stub. The
right-rail content. Export. Audit. Dashboard charts.

**Risks at this milestone:**
- shadcn/ui CLI integration friction if the team hasn't used it.
- Tailwind tokens harder than expected to map from the wireframe text
  descriptions. Allow a day for design tweaks.

---

## M2 - Resource Planner end-to-end (~3 weeks)

**Goal:** the densest, most-used screen, working. A user can add,
edit, delete resources; change allocations per phase; and watch the
top-rail KPIs update live. The right-rail "where does this come from?"
panel works for any clicked number.

**Tasks:**
1. **TanStack Table** wired up with the column layout from the
   wireframe. Virtualization on for >50 rows (it's <50 in the seed,
   but enable now so it's never a refactor).
2. **Inline cell editing** on the phase allocation %s. Tab moves
   between cells. Enter commits, Esc cancels.
3. **Expanded row** with bill rate, cost rate, hours/week, utilization,
   notes. All editable.
4. **Add resource** flow: opens a small form (role + level + geo +
   name), looks up the rate card entry, prefills bill/cost.
5. **Delete resource** with confirmation. Writes an audit entry
   (audit log itself comes in M5; the entry just goes into a queue).
6. **Filtering** (Geo / Phase / Level chips) + search + grouping.
7. **Geography mix bar** at the bottom updates live.
8. **Utilization summary card** at the bottom.
9. **Guardrails strip** with at least three guardrails wired: 100%
   offshore on a regulated workload, bill rate below rate card by N%,
   missing onshore lead.
10. **Right-rail defensibility panel** for any clicked number. Shows
    formula, inputs, and links. This is the screen that proves the
    pattern; subsequent screens reuse the same panel component.
11. **Keyboard shortcuts:** the planner-specific ones (n, /, arrows,
    Tab, Enter, Del, Ctrl+D).
12. **Copy-paste from Excel:** select cells, copy from Excel, paste -
    fills the allocation matrix. This is the killer feature for real
    users.

**Definition of done:**
- A user can build the staffing plan for the seed scenario from
  scratch by typing.
- KPIs in the top rail update on every meaningful edit.
- Right-rail panel works on the Resources Subtotal KPI, on per-row
  Bill/Cost/Margin, and on the geography mix.
- All keyboard shortcuts in the wireframe work.
- Paste-from-Excel populates allocation cells.
- A non-trivial user-acceptance: a real PM can recreate one of their
  recent SOWs in this UI in under 30 minutes.

**Anti-goals:** cloud planner. Other costs. Scenario compare. M&A.
Export. Audit log UI (queue audit entries but don't render them yet).

**Risks at this milestone:**
- Inline editing performance with virtualization is tricky. Budget a
  full week for "make the table not janky."
- Copy-paste from Excel has many edge cases (different delimiters,
  formula vs. value, hidden columns). Decide upfront which formats
  to support; reject others with a clear message.

---

## M3 - Cloud + Other Costs planners (~2.5 weeks)

**Goal:** a user can build a full estimate from scratch in the UI -
labor, cloud, and other costs - and see realistic totals. This is the
first milestone where the calculator could replace a spreadsheet for a
real engagement.

**Tasks:**
1. **Cloud Planner two-pane layout** (list + detail).
2. **Cloud catalog picker:** the "Add from AWS catalog" / "Add from
   Azure catalog" flow reads from the seed pricing JSON shipped in
   #6.
3. **Cloud line item detail form** with all fields from the wireframe.
4. **Ramp curve preview** chart in the detail pane. Live updates as
   inputs change. Recharts.
5. **Include-in-run-rate toggle** affects the run-rate KPI on the
   dashboard (which is still stub but the data hook is real).
6. **Other Costs table** with inline expansion pattern from the
   wireframe.
7. **Pricing-unit-aware editing** in Other Costs (PerUser shows
   userCount; PerHour relabels quantity as hours, etc.).
8. **Markup field** in Other Costs detail.
9. **Defensibility panel** works on cloud and other-cost numbers, same
   pattern as M2.
10. **Project Setup screen** functional: identity, engagement type,
    phases, commercials. Most editing here is project-wide (vs.
    scenario-specific) - exercise the distinction.
11. **Settings > Cloud Pricing** and **Settings > Rate Cards** -
    read-only view of the seed catalogs (editing them is Phase 2).
12. **Settings > Preferences** functional - currency, decimal format,
    guardrail thresholds.

**Definition of done:**
- A user can build a complete estimate (resources + cloud + other
  costs) for a fictional engagement of their choice in under an hour.
- Totals match what `calculate()` produces on the seed scenario when
  the same inputs are entered.
- The top-rail KPIs and dashboard run-rate card show realistic numbers.

**Anti-goals:** scenarios beyond the active one. Assumption ledger.
Audit UI. Export. M&A Mode.

**Risks at this milestone:**
- Cloud catalog UX: 115 SKUs is a lot to navigate. Spend half a day
  on the picker before you commit to a design.
- Ramp curve preview chart performance with many line items.
- Other Costs pricing-unit-conditional fields are easy to mis-spec.
  Pair on this; write the validation tests first.

---

## M4 - Scenarios + Dashboard + Compare (~2 weeks)

**Goal:** scenarios are usable as a first-class concept. Dashboard
renders. Side-by-side compare drives a real pricing conversation.

**Tasks:**
1. **Scenarios screen (list mode):** cards per scenario, mark base,
   set active, delete, clone.
2. **Clone scenario:** deep copy via `structuredClone`, new IDs
   generated, `parentScenarioId` recorded.
3. **Scenario chooser in top rail** fully wired - switching updates
   all visible screens without losing filter state.
4. **Dashboard screen** with all four zones from the wireframe:
   headline KPIs, monthly burn chart, by-phase / by-geo tables,
   by-cloud / top-assumptions tables, run-rate card.
5. **Recharts integration** for the burn curve. Stacked bars or area.
   Phase band underneath the X axis.
6. **Compare mode:** 2-4 scenarios in side-by-side columns. Row
   groups (headlines / composition / timeline / commercials).
   Pivot dropdown (by phase, by geography, by cloud category, by
   assumption).
7. **Delta indicators** between non-base columns and the base.
8. **Burn comparison chart** overlay across selected scenarios.
9. **Scenario overrides** functional: a scenario can override margin,
   contingency, discount, mgmt reserve. Engine already supports this;
   the UI exposes it on the Project Setup screen with the "(s)" badge.

**Definition of done:**
- A user can clone the base, change one input (e.g., flip a resource
  from offshore to onshore), and see the price delta in the top rail
  immediately.
- Compare mode shows 2-4 scenarios in a readable, scannable layout.
- Dashboard charts render against any scenario, with no engine errors.

**Anti-goals:** anything M&A. Audit history. Export. Polish.

**Risks at this milestone:**
- Recharts learning curve if team is new to it. Chart styling can
  eat days. Don't perfect; ship working.
- Compare mode column layout on narrower screens. Decide on horizontal
  scroll vs. column reduction.

---

## M5 - Assumption Ledger + Audit + Export (~2.5 weeks)

**Goal:** the calculator is defensible and exportable. A user can hand
the output to a CFO or a deal lead and answer "why is this $5M?"

**Tasks:**
1. **Assumption Ledger screen** as per wireframe: cards grouped by
   risk, filters, sort.
2. **Add assumption** flow + the "Add as assumption" button on
   Resource / Cloud / Other Costs rows.
3. **Review modal** for assumptions: source, risk, evidence URL.
4. **Auto-suggest assumptions** scanning the active scenario for
   common defensibility hooks (offshore ratio, low contingency,
   reserved pricing, etc.). User accepts or rejects each.
5. **Audit Log screen** rendering the queued audit entries from M2/M3.
6. **Audit detail right-rail** with before/after diff.
7. **Audit log storage in its own localStorage bucket** with the
   1000-entry cap and oldest-first eviction.
8. **Revert from audit entry** functional - writes an inverse entry.
9. **Export Center scaffold** with all 5 format tabs.
10. **XLSX export** using SheetJS. Standard layout: one sheet per
    section, formulas preserved where possible.
11. **CSV export** for burn curve, resource detail, cloud detail,
    other costs, assumptions. Single CSV or ZIP of separate ones.
12. **PDF export via browser print stylesheet** - the 2-3 page exec
    summary. Phase 2 will swap in a server-side generator.
13. **JSON export** (full project + scenario, round-trip importable).
14. **Share link** via URL-encoded scenario data (long URL, fine for
    Phase 1).
15. **Recent exports list** in the Export Center.

**Definition of done:**
- A user can produce a PDF, XLSX, and CSV from any scenario.
- The PDF prints to 2-3 pages of usable summary.
- The XLSX has separate sheets and is openable in Excel and Google
  Sheets without warnings.
- A new conversation can paste a JSON export and pick up where the
  prior one left off.
- Every meaningful field edit produces an audit entry; the audit log
  renders it; clicking it shows before/after.
- A user can run through "build estimate -> capture 5 assumptions ->
  export PDF" in one session and the output is presentable.

**Anti-goals:** M&A Mode. Polish. Performance optimization. Anything
multi-user.

**Risks at this milestone:**
- XLSX with preserved formulas is harder than it sounds. If preserving
  formulas is taking too long, ship values-only and defer formulas.
- PDF via print-stylesheet has cross-browser quirks. Test in Chrome,
  Edge, and Safari early.
- Share link URLs hit URL-length limits at large projects. Document
  the limit; recommend JSON export for large projects.

---

## M6 - Polish, accessibility, performance (~2 weeks)

**Goal:** the app is presentable to a non-friendly user. No crashes on
edge cases. WCAG AA compliant. Fast enough that nobody complains.

**Tasks:**
1. **Accessibility audit:** keyboard-navigate every screen, no
   trapped focus, all interactive elements reachable, color contrast
   meets AA, ARIA labels on icon-only buttons. Axe DevTools clean
   on every screen.
2. **Performance pass:** Resource Planner virtualization confirmed
   under 200+ rows. Calc engine memoization on `calculate()`. Bundle
   size under 1MB gzipped.
3. **Empty / loading / error states** filled in on every screen per
   the wireframe state catalog.
4. **Cross-browser smoke:** Chrome, Edge, Safari, Firefox. Mobile
   read-only on iOS Safari and Android Chrome.
5. **Onboarding tooltip / coachmark** sequence for first-time users
   (lightweight - no library, just CSS).
6. **Error boundary** wrapping each screen so a single-screen crash
   doesn't take down the app.
7. **Guardrails strip** filled out with the full set of rules from
   Settings > Preferences thresholds.
8. **First Playwright e2e suite:** 10-15 scenarios covering critical
   paths.
9. **Bundle analysis** to confirm no dead deps.
10. **README + getting-started** doc for an internal user (separate
    from the existing developer README).

**Definition of done:**
- A non-developer can install the app, load the example, build a
  basic scenario, export a PDF, and not see anything broken.
- Axe DevTools shows zero serious violations.
- First-paint TTI under 2 seconds on a typical corporate laptop.
- Playwright suite passes on Chrome, Edge, Firefox.
- The README explains how an end user (not a developer) gets started.

**Anti-goals:** new features. Backend. Auth. Multi-user.

---

## What's deferred to Phase 2 (and where the seams already are)

| Deferred capability | Phase 1 seam already in place |
|---|---|
| **Multi-user / SSO** | `Storage` interface; `Project.ownerId` / `orgId` already typed; auth wraps the persistence layer in Phase 2 |
| **Live AWS / Azure pricing APIs** | `CloudPricingCatalog` type from #6; Phase 2 adds `AwsPricingApiProvider` / `AzureRetailPricesProvider` adapters behind the same interface |
| **Approval workflow** | `Project.status` is already `draft / underReview / approved / archived`; just wire to a backend state machine |
| **Server-side calc validation** | Engine is pure TS in `src/engine/`; Phase 2 backend imports and runs the same code |
| **Backend storage in Postgres** | `Storage` interface; swap `LocalStorageProvider` for `BackendApiProvider`. The data model is already JSON-shaped; goes into JSONB columns directly |
| **Comments / annotations** | Right rail (defensibility panel) is the natural home; add a comment thread tab to that component |
| **Custom rate card editing UI** | Phase 1 ships rate cards as version-controlled JSON; full editing UI lands in Phase 2 |
| **M&A Mode engine math** | `Scenario.maData` already in the data model; UI captures inputs in Phase 1; engine computes overlay in Phase 2 |
| **Custom fields** | Add `customFields: Record<string, unknown>` to entities when the first customer asks |
| **Templates / playbooks** | A `ProjectTemplate` is just a `Project` minus IDs + dates; trivial to add later |
| **Audit log retention beyond 1,000 entries** | Phase 2 pushes audit to backend; the local cap is a Phase 1 storage decision |
| **Branded PDF generator** | Phase 1 uses print stylesheet; Phase 2 swaps to a Puppeteer-based generator with branded templates |

---

## What's deferred to Phase 3 or later

These are explicitly NOT on the Phase 2 roadmap. Including for clarity.

- **Mobile editing.** Read-only on mobile is enough.
- **Real-time collaboration** (multiple cursors, Liveblocks-style).
  This is a different product.
- **AI-assisted estimation** (LLM suggests resources based on a brief).
  Tempting but unproven; defer until the basic workflow is stable.
- **Native desktop app.** The Tauri option from #7 is on the table
  if a specific engagement demands no-cloud distribution. Otherwise
  defer.
- **Localization beyond English.** Multi-currency is supported in the
  model; UI strings are not yet i18n-ready. Defer until there's
  a non-English-speaking user.
- **A marketplace of pre-built scenarios** (sector-specific templates).
  Cool idea, Phase 3+.

---

## Sequencing decisions worth surfacing

Three places where I deliberately ordered things differently than a
reasonable team might:

**1. Resource Planner before Cloud Planner.**
Both are "user can edit a thing." Resources is harder because of the
density and inline editing, but it's also where users live. Cracking
the inline-edit and right-rail patterns on Resources means Cloud and
Other Costs are easier copies. A team that does Cloud first might
end up redoing patterns when they hit Resources.

**2. Dashboard AFTER planners, not before.**
The temptation is to ship a Dashboard early because it's the
demo-worthy screen. Resist. A dashboard without real data is a lie.
M4 lands Dashboard once Resources and Cloud and Other Costs all
produce real numbers, and the dashboard is then a victory lap, not a
mock.

**3. Audit AFTER scenarios, not concurrent with editing.**
M2/M3 queue audit entries but don't render them. M5 renders. The
alternative (audit UI in every milestone) sounds disciplined but
slows everything down. Queueing now and rendering later is the right
trade.

---

## What kills Phase 1

Three failure modes worth naming so the team can spot them early.

**1. Scope inflation in M2.**
The Resource Planner is the highest-risk milestone because it's the
densest screen and inline editing is genuinely hard. The temptation
will be to "also add bulk operations / undo / drag reorder / template
roles / etc." while we're in there. Resist. Ship the seven things in
M2 and move on. Add bonus features in M6 if time allows.

**2. Polish before completion.**
Avoid pixel-perfecting the Dashboard in M4 while the Audit Log in
M5 still doesn't exist. M6 exists specifically as a polish budget.
Use it then.

**3. "Just add a backend" mid-Phase-1.**
Once the calculator is working, someone WILL ask "can two people
edit at once?" The answer is "in Phase 2, by design." Adding multi-
user mid-Phase-1 doubles the timeline and introduces auth, conflict
resolution, real-time sync, and a backend - all at once. Hold the
line.

---

## Phase 1 total: ~14 engineer-weeks

For a team of 2 senior engineers: ~7 calendar weeks at full
allocation, or ~10-12 calendar weeks with the usual overhead
(meetings, code review, the occasional vacation, hiring help, the
inevitable scope creep). For a team of 3: ~5-6 calendar weeks at
full allocation, but coordination overhead means the marginal
engineer adds less than 50% throughput.

Honest expectation: **plan for 12-14 calendar weeks** if you want a
hand-on-heart "this is presentable to a real user" Phase 1. Less than
that and you're shipping M4 or M5 and calling it done; more than
that and scope has crept.

---

## When to declare Phase 1 complete

These criteria - all of them, simultaneously:

1. The example scenario from #3 produces a believable PDF export.
2. A non-developer can rebuild that scenario from scratch in the UI
   in under 60 minutes.
3. Cloning a scenario, swapping the offshore ratio, and showing the
   delta takes under 30 seconds.
4. Every number on the Dashboard is one click away from its
   derivation in the right rail.
5. Every meaningful edit produces an audit entry that can be reviewed
   and reverted.
6. The 43 engine tests still pass plus at least 30 new component
   tests and 10 Playwright e2e tests.
7. Axe DevTools shows zero serious violations.
8. The app loads in under 2 seconds on a typical corporate laptop.

If 7/8 of these are true, you're 90% there. Don't ship until 8/8.
The user who finds the broken one is the user who never comes back.

---

## What this plan deliberately doesn't contain

- A Gantt chart. The order matters; the dates depend on the team and
  there's no point committing to a Gantt before you have the team.
- Per-task hour estimates. Engineer-weeks is the right resolution
  for this stage; finer estimates pretend to a precision we don't have.
- A specific scrum / kanban methodology. Pick what your team likes.
  The milestones above work as epics; tasks within each map to
  stories or kanban cards equivalently.
- Detailed UX research / user testing plans. M2 says "real PM can
  recreate a recent SOW in 30 minutes" - that's the test. Run it
  with one user, iterate, repeat. No need for a research program at
  Phase 1.
- A separate QA team. Engineers test their own work; Playwright
  catches regressions; an extra QA pass at M6 is fine but not
  structural.

---

## Files in this deliverable

Just this narrative doc. No code, no JSON. The next deliverable (#9)
will close out with risks and defensibility notes; that's also
narrative-only.
