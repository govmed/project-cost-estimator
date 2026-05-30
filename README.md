# SOW Cost Calculator

A local-first web app for building, comparing, and defending Statement-of-Work cost estimates. Runs entirely in the browser — no account, no server, no data leaves your machine.

[![CI](https://github.com/govmed/project-cost-estimator/actions/workflows/ci.yml/badge.svg)](https://github.com/govmed/project-cost-estimator/actions/workflows/ci.yml)

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

The Vertex Retail example project loads automatically.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on port 5173 |
| `npm run build` | Production bundle → `dist/` |
| `npm test` | Run 275 Vitest unit + component tests |
| `npm run typecheck` | TypeScript strict check, no emit |
| `npm run e2e` | Playwright e2e suite (requires `npx playwright install` once) |
| `npm run e2e:ui` | Playwright UI mode |

## Stack

| Concern | Choice |
|---|---|
| Language | TypeScript 5 strict |
| Framework | React 18 + Vite 5 |
| Routing | React Router 6 |
| State | Zustand + URL params |
| Styling | Tailwind CSS 3 + shadcn/ui primitives |
| Charts | Recharts |
| Tables | TanStack Table (headless) |
| Persistence | localStorage (Storage interface — swap to backend in Phase 2) |
| Testing | Vitest + Testing Library + Playwright |

## Architecture

The **calculation engine** (`src/engine/`) is a pure function:

```ts
calculate(project, scenario) → ScenarioTotals
```

No I/O, no globals, fully deterministic. All 275 tests run against it. The UI imports the engine; the engine never imports the UI. This means the same engine code can run server-side in Phase 2 without modification.

**Scenarios own all cost data** — Project holds only metadata. Cloning a scenario is a deep copy. Comparing two scenarios is a diff. Switching scenarios in the UI is a state swap, not a refetch.

## Project structure

```
src/
  engine/          Pure calc engine — no React deps
  types/           TypeScript data model (branded IDs, Money type)
  data/            Zustand store, localStorage provider, audit log
  ui/
    components/    Reusable UI components
    layout/        AppShell, TopRail, LeftRail
    pages/         One file per screen
  export/          XLSX, CSV, PDF, JSON exporters
seed/
  rate-cards/      Illustrative rate card (replace before real use)
  cloud-pricing/   AWS us-east-1 + Azure eastus catalogs
  scenarios/       Vertex Retail example project
tests/
  engine/          43 unit tests for the calc engine
  ui/              232 component tests
  e2e/             15 Playwright critical-path tests
docs/              Design deliverables #1–#9
```

## For end users

See **[USER_GUIDE.md](USER_GUIDE.md)** for a non-developer getting-started guide covering all ten screens, keyboard shortcuts, scenario workflows, and export formats.

## Phase status

| Phase | Status |
|---|---|
| Phase 1 — Local-first SPA | ✅ Complete (`v1.0.0-phase1`) |
| Phase 2 — Backend, multi-user, SSO | Not started |

Phase 2 seams are already in place: `Storage` interface (swap `LocalStorageProvider` for `BackendApiProvider`), `Project.ownerId`/`orgId`, `Project.status` state machine, `PricingProvider` adapter for live AWS/Azure APIs, and the engine is pure TS that can run server-side unchanged.

## Seed data disclaimer

The shipped rate card and cloud pricing catalogs are **illustrative placeholders** — realistic starting points, not market quotes. Replace them before using the tool in a real engagement. Any catalog marked `isIllustrative: true` shows a warning banner in Settings.

## License

Internal tool — not licensed for public distribution.
