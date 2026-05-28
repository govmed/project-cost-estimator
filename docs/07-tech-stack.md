# Deliverable #7 - Tech Stack Recommendation

This document recommends a concrete stack for Phase 1, with one
paragraph of justification per major choice and explicit trade-offs
where I'd be willing to be overruled.

The stack is shaped by what we already built in #3 and #4 (TypeScript
strict, ES modules, Vitest, pure calc engine) and what the wireframes
in #5 demand (URL-as-state, inline editing, scenario switching, keyboard
shortcuts, copy-paste from Excel, dense data tables).

Where the Gainwell environment is a constraint (Microsoft shop, Azure
hosting available, Entra ID for SSO), I've leaned Azure on infra and
auth without compromising the frontend tech choices, since those are
mostly orthogonal to cloud provider.

## Summary

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript 5.x, `strict: true` | Already decided in #3/#4; non-negotiable for a defensible calc model |
| Framework | React 18 | Largest ecosystem, easiest to staff, mature DX |
| Build tool | Vite 5 | Fast dev server, ESM-native, minimal config |
| Routing | React Router 6 | Stable default; TanStack Router viable upgrade later |
| State (client) | Zustand + URL state | Lean, undo-friendly, persist middleware built-in |
| State (server) | TanStack Query (Phase 2) | Adds caching, retries, optimistic UI when backend lands |
| Forms | React Hook Form + Zod | Inline edit needs minimal; formal forms need schema |
| Styling | Tailwind CSS 3 | Utility-first works well for dense planners |
| Components | shadcn/ui (Radix primitives + Tailwind) | Owned code, accessible, no library bloat |
| Charts | Recharts (default) + Visx (escape hatch) | Declarative for dashboards; flexible for the rest |
| Icons | Lucide React | Outline icons matching the wireframes, single tree-shakeable import |
| Tables | TanStack Table (headless) | Resource Planner is too dense for naive `<table>` |
| Persistence (P1) | localStorage via thin wrapper | <5MB is fine; swap to IndexedDB later behind same interface |
| Validation | Zod | Shared schemas between forms, import/export, future API |
| Date / time | Native `Intl` + date-fns when needed | Tree-shakeable, no Moment.js bloat |
| Money / decimals | Native `number` (Phase 1) | Engine already uses; revisit if rounding becomes contentious |
| Testing (unit) | Vitest | Already in place from #4 |
| Testing (component) | Vitest + Testing Library + jsdom | Same runner, low cognitive overhead |
| Testing (e2e) | Playwright | Cross-browser, deterministic, screenshot diffs for chrome |
| Lint / format | ESLint + Prettier + lint-staged + husky | Standard; pick a Tailwind plugin |
| CI/CD | Azure DevOps Pipelines (or GitHub Actions) | Either works; pick what your org already uses |
| Hosting (P1) | Azure Static Web Apps | Free tier, Entra ID integration, fits the shop |
| Auth (P2) | Entra ID (OIDC) via MSAL | Aligns with Gainwell SSO |
| Backend (P2) | Node 20 + Fastify + Postgres | Lets us share the calc engine TS code between client and server |
| Distribution (alt) | Tauri desktop wrapper | Optional, if "no cloud" is required for sensitive engagements |

---

## Frontend framework: React 18

React wins on three axes that matter here: **ecosystem** (every library
mentioned below works first-class with React), **hiring** (the broadest
talent pool, especially for consulting firms staffing a build), and
**maturity** (the patterns are well-understood, so a new contributor
ramps in days). Vue 3 is a fine alternative if your team is already
fluent — the composition API is arguably nicer for a state-heavy app
like this — but for a foundation that has to live for years and rotate
through contributors, React is the safer default. Svelte and Solid are
more delightful to write but ecosystem gaps (chart libraries, accessible
component libraries) become tax payments on a build like this.

**Trade-off:** React's re-render model can hurt performance in a
spreadsheet-dense planner. We mitigate with virtualized rendering for
long tables (TanStack Table + react-virtual) and judicious memoization.
If that becomes painful, Solid is the easiest jump because its API
is intentionally React-shaped.

## Build tool: Vite 5

Vite is the default now and for good reason. ESM-native dev server
starts in under a second; HMR is sub-100ms. Production builds via
Rollup are tree-shaken and ready for static hosting. The config is
short — what we ship below is barely 20 lines. Webpack is legacy at
this point; Turbopack is still maturing. There's nothing about this
product that argues for either.

## Routing: React Router 6

Stable, familiar, well-documented. URL parameters and search params are
first-class, which we need because the wireframes treat the URL as state
(`/p/proj_123/resources?scenario=base&phase=build&filter=offshore`).
TanStack Router has better type safety for search params and would be
the better long-term call, but React Router is what most engineers
already know and the migration path is straightforward. Pick whichever
your team prefers — both fit.

## State management: Zustand + URL state

For client-side state we have three concerns: project/scenario data
(persisted across sessions), UI state (which scenario is active, which
filter is applied — encoded in the URL), and derived state (the engine
outputs). Zustand handles the persistent project store cleanly with its
built-in `persist` middleware backed by our storage adapter. URL state
is a small custom hook over `useSearchParams`. Derived engine outputs
are pure-function results from `calculate()` — memoize at the component
boundary and re-run when inputs change.

Redux Toolkit is the more featured alternative and its dev tools are
excellent for debugging a complex state tree, but the boilerplate vs.
Zustand isn't worth it for a single-user, mostly-local app. Jotai's
atomic model is conceptually clean but doesn't slot as naturally into
the persist-the-whole-project pattern. If a contributor strongly prefers
Redux, switching is a contained refactor.

**Server-side state (Phase 2):** when we add a backend, TanStack Query
on top of Zustand for the "what's on disk" vs "what's on the server"
distinction. Zustand for project state; TanStack Query for fetching
shared rate cards, audit history, user/auth state.

## Component library: shadcn/ui

shadcn/ui is not a library you import; it's a CLI that drops accessible
components built on Radix primitives and Tailwind into your codebase.
**You own the code.** This matters for a long-lived corporate tool
because (a) accessibility is built in via Radix, (b) styling is fully
under your control via Tailwind, (c) there's no dependency to manage or
get blocked by, and (d) when a component needs to do something
unconventional (like the right-rail defensibility panel from the
wireframes), you edit the component rather than fighting a library API.

The downside is you maintain those components. For a foundation build,
this is a feature: the team learns the codebase by reading and
editing the building blocks, not by mining library docs. MUI is the
heavier alternative if Material Design is your aesthetic; Mantine and
Chakra are middle-ground. None of them give you ownership.

## Styling: Tailwind CSS 3

Tailwind shines on dense data tables (Resource Planner) where you need
fine-grained spacing, alignment, and conditional styling per cell. The
utility-first model also keeps component code self-contained — no
separate CSS files to navigate when fixing a layout. We pair Tailwind
with CSS variables for theming (dark mode, brand colors). The wireframes
already imply a tabular-numerals + monospace-numbers pattern; Tailwind's
`font-mono` and `tabular-nums` classes handle that natively.

If your team has strong opinions against Tailwind (some do), CSS Modules
is the cleanest alternative. styled-components / Emotion are runtime
overhead we don't need.

## Charts: Recharts (default) + Visx (escape hatch)

Recharts is declarative React-flavored D3 — perfect for the dashboard
burn curve, by-phase / by-geography / by-cloud-provider breakdowns, and
the compare-screen overlays. It handles 95% of what the wireframes need
with minimal code. For anything custom (the M&A Mode cumulative-position
chart with a breakeven annotation, for instance), Visx exposes the
lower-level D3 primitives without giving up React composability.

Chart.js is faster for very large datasets (10K+ points) but canvas-based
charts are harder to test and accessibility is a known weakness. Tremor
is a great dashboard kit if you want everything pre-styled, but it
constrains your design more than a calculator with this much variety
can tolerate.

## Icons: Lucide React

Outline icons matching the wireframe aesthetic (no filled icons), single
package, tree-shakeable. ~600 icons covers everything we need. Heroicons
is the alternative; both are fine.

## Tables: TanStack Table (headless)

The Resource Planner needs: column resizing, sorting, multi-column
filtering, row selection, virtualization at 200+ rows, sticky headers,
inline cell editing, keyboard navigation, and clipboard paste from
Excel. A naive `<table>` won't get there. TanStack Table (formerly
react-table v8) is headless — it provides the row/column logic; we
render with our own components. Pair with `@tanstack/react-virtual` for
the long lists.

This is the one place where doing it from scratch would visibly hurt
the build. The other planners (Cloud, Other Costs) are less dense and
can use simpler approaches.

## Persistence (Phase 1): localStorage via thin wrapper

A real project — 50 resources, 100 cloud line items, 20 other-cost
lines, 30 assumptions, 200 audit entries — serializes to ~200KB. With
5 scenarios that's 1MB. localStorage's 5-10MB ceiling is comfortable.
**Wrap behind a `Storage` interface from day one:**

```ts
interface Storage {
  load(projectId: ProjectId): Promise<Project | null>;
  save(project: Project): Promise<void>;
  list(): Promise<ProjectSummary[]>;
  delete(projectId: ProjectId): Promise<void>;
}
```

A `LocalStorageProvider` implements this in Phase 1. A
`BackendApiProvider` replaces it in Phase 2. No component code changes.
If we hit the localStorage ceiling earlier than expected, an
`IndexedDbProvider` (via Dexie or `idb-keyval`) slots in identically.

The audit log gets its own bucket — appending to a 1MB project blob on
every keystroke would be expensive. Audit entries stream into a
separate `audit:{projectId}` key, capped at 1,000 entries with eviction
of the oldest.

## Forms / validation: React Hook Form + Zod

Most editing in this app is **inline** — click a cell, type, blur. Those
don't need form library overhead. For the formal screens (Project
Setup, New Project Wizard, Settings sub-screens, Review-Assumption
modal), React Hook Form gives us uncontrolled performance and Zod gives
us schema validation that's shared with import/export and (Phase 2) the
backend API. The same Zod schema validates a manifest, a form, and a
POST body — one source of truth.

## Date / time: Native `Intl` + date-fns when needed

Native `Intl.DateTimeFormat` handles 90% of the formatting needs.
date-fns covers the arithmetic (add weeks, find phase boundaries) and
is tree-shakeable per-function so it doesn't bloat the bundle. Avoid
Moment.js (deprecated, large). Luxon is fine but a heavier import.

## Money / decimals: native `number` (Phase 1)

The engine in #4 already uses IEEE-754 doubles. For project sizes up
to ~$100M, FP drift is sub-cent. The engine rounds at presentation
time, not storage time, so the drift doesn't compound.

If client-facing rounding becomes contentious — and it will eventually,
when a CFO points at a discrepancy — Phase 2 swaps in `bigint` minor
units (cents). All monetary math goes through `add/subtract/scale/toBase`
helpers in `src/engine/fx.ts`, so this is a contained refactor.
**decimal.js** is the third option and is overkill for these magnitudes.

## Testing

| Layer | Tool | What it tests |
|---|---|---|
| Unit | Vitest | Engine math, helpers, calc-by-calc invariants (already in place from #4) |
| Component | Vitest + RTL + jsdom | Renders, interactions, state transitions |
| Integration | Vitest | Compose engine + state + components for a small flow |
| E2E | Playwright | "Create project → add resources → switch scenarios → export" |
| Visual | Playwright screenshots | Chrome / planners / dashboard pixel diff per PR |

Vitest is already there. RTL pairs natively. Playwright over Cypress
because it's faster, multi-browser, has better debugging, and runs on
Linux CI without X11 hassles.

## Lint / format / pre-commit

Standard config: ESLint with `@typescript-eslint`,
`eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`,
`eslint-plugin-tailwindcss`. Prettier for formatting. lint-staged +
husky to run on commit. The `.prettierrc` and `.eslintrc.json` shipped
with the build templates below.

## CI/CD

Two pipelines:

**`verify`** runs on every PR: install, typecheck, lint, unit tests,
component tests, build production bundle, Playwright smoke suite (just
the critical paths to keep PR feedback fast).

**`deploy`** runs on merge to main: same as verify plus full Playwright
suite, then deploy to staging via Azure Static Web Apps. Promotion to
production is manual approval.

Azure DevOps Pipelines is the natural fit at Gainwell; if your team
prefers GitHub Actions, the YAML translates one-to-one. Both have
free-for-private-repo tiers that comfortably handle this build.

## Hosting (Phase 1)

**Azure Static Web Apps.** Free tier supports custom domains, automatic
HTTPS, deployment from Azure DevOps, and (when we add auth) integrated
Entra ID. Static-only is exactly what a Phase 1 SPA needs.

Alternatives if you're not in Azure: Vercel (zero config, slick DX),
Netlify (similar), CloudFront + S3 (more control, more config),
GitHub Pages (free, fine for prototypes, no auth).

For some engagements (PHI, classified data) the right answer might be
**no cloud hosting at all** — distribute the built bundle as a zip the
user opens locally, or wrap it as a Tauri desktop app (~10MB native
binary, no Electron bloat). The local-first persistence design supports
this directly.

## Phase 2 backend: Node 20 + Fastify + Postgres

When we add multi-user, shared rate cards, and approval workflow, the
backend lives behind the `Storage` interface from above. Node 20 +
Fastify because:
- **We can share the calc engine TypeScript code between client and
  server.** The same `calculate()` function that runs in the browser
  validates the math server-side before quote approval. That's a real
  win — no calc drift between client and server.
- Fastify over Express for performance, typed plugins, and JSON schema
  validation (pairs with Zod).
- Postgres for relational data (projects, scenarios, audit log,
  rate cards). JSONB columns for the entity payloads — we don't need
  full normalization for this volume.

If your shop is .NET-only and that's a hill, ASP.NET Core minimal APIs
+ SQL Server is the equivalent stack. You lose the shared-engine
benefit (calc has to be reimplemented or called via a process boundary)
but everything else maps. This is a real trade-off; I'd push to keep
the engine code shared if at all possible.

## Phase 2 auth: Entra ID via MSAL

For internal Gainwell use, OIDC against Entra ID is the obvious choice.
MSAL.js handles the flow client-side; the backend validates JWTs.
Auth0 / Clerk are alternatives for external-facing deployments. Both
swap in without touching the data model — `Project.ownerId` and
`Project.orgId` are already typed as branded strings.

## Distribution alternative: Tauri

For engagements where the calculator can't touch a cloud (federal data,
sensitive M&A diligence), Tauri wraps the same SPA as a native desktop
app: ~10MB binary, no Electron bloat, file-system access, signed
installers per OS. The Phase 1 local-first architecture supports this
directly — no code change, just a new build target. Worth mentioning
because in M&A advisory it comes up.

## Seams already in place

These design decisions in #3 and #4 make the stack choices above
viable. Keep them intact:

- **Calc engine is pure TypeScript** with no React or DOM dependencies.
  It already passes 43 tests. The UI imports it; never the other way
  around.
- **Money is always typed.** `{amount, currency}`, never raw `number`.
  This is what makes the bigint-cents refactor safe.
- **IDs are branded types.** Compile-time prevents passing a
  `ResourceId` where a `ScenarioId` is expected.
- **All cost data lives on Scenario, not Project.** Scenario switching
  is a state swap, not a refetch. Clone is a deep copy.
- **The pricing catalog has an adapter shape.** Live AWS/Azure APIs
  drop in as a new `PricingProvider` implementation.
- **Audit log is append-only and lives in its own storage bucket.**

## What I'd push back on

If the implementing team says "let's also add X," here's where I'd
push back:

- **GraphQL backend.** This is a single-user / small-team tool with
  predictable data shapes. REST + Zod schemas is enough. GraphQL is
  overhead.
- **A redux ecosystem.** The state is small; Zustand + URL state is
  enough. Redux + sagas/thunks + reselect would be 10x the boilerplate.
- **A full CMS for rate cards.** Rate cards are JSON files committed
  to a repo. Editing in code review is the right governance for this
  data. A "Rate Card admin UI" is Phase 3 if at all.
- **Server-side rendering.** This is a local-first SPA. SSR adds
  complexity without benefit — there's nothing to render before user
  data loads.
- **A custom design system from scratch.** shadcn/ui + Tailwind is
  enough. Build a design system when you have a second product, not
  before.

## Concrete starting point

The config templates that ship with this deliverable:

```
config-templates/
  package.json.template         <- Full deps for the UI build (atop the engine package.json)
  vite.config.ts.template       <- Vite with path aliases and test config
  tailwind.config.ts.template   <- Tailwind with the design tokens from wireframes
  tsconfig.app.json.template    <- App-side tsconfig (separate from engine tests)
  .eslintrc.json.template       <- Strict ESLint config
  .prettierrc.template          <- Prettier config
```

These are templates (`*.template` suffix) so they don't conflict with
the engine's working `package.json` from #4. When UI work begins, drop
the templates into place (rename, merge with existing files), `npm
install`, and you have a buildable UI scaffold with the chosen stack.

## Cost of being wrong

If we picked one of these wrong, what's the recovery cost?

| If wrong about... | Recovery cost |
|---|---|
| React vs other framework | High - rewrite all UI |
| Zustand vs Redux | Medium - contained refactor of the store; engine is unaffected |
| shadcn/ui vs another component lib | Medium-low - we own the components anyway |
| Tailwind vs CSS modules | Low - mechanical refactor |
| Recharts vs Visx | Low - swap chart libraries one file at a time |
| localStorage vs IndexedDB | None - hidden behind the `Storage` interface |
| Azure SWA vs Vercel | None - both serve the same static bundle |
| Vitest vs Jest | None - already in place, easy swap if needed |
| Node backend vs .NET backend | Medium - we lose the shared-engine benefit going .NET |

Most choices are reversible. The two big ones (framework, backend
language) are the ones where I'd want to be sure before the team
commits.
