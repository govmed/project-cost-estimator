# M1a - UI Scaffold + Project Shell

The first build milestone. The toolchain works end-to-end:
React mounts, Tailwind styles render, Zustand store holds project
state, the seed scenario loads, and the engine computes real KPIs
that display in a browser.

## What got installed

```
sow-calc/
+-- index.html                      <- Vite entry point
+-- vite.config.ts                  <- Vite + jsdom test config (replaces vitest.config.ts)
+-- tsconfig.json                   <- App-side TS config (replaces engine-only)
+-- tailwind.config.ts              <- Design tokens
+-- postcss.config.js               <- Required for Tailwind
+-- package.json                    <- Now includes React, Vite, Tailwind, Zustand
+-- src/
|   +-- main.tsx                    <- React mount
|   +-- App.tsx                     <- Bare layout: project name + 4 KPIs
|   +-- vite-env.d.ts               <- Vite type declarations
|   +-- ui/
|   |   +-- format.ts               <- Money / percent formatters
|   |   +-- styles/
|   |       +-- tokens.css          <- CSS variables (light + dark)
|   |       +-- index.css           <- Tailwind directives
|   +-- data/
|       +-- storage.ts              <- Storage interface (Phase 2 seam)
|       +-- local-storage-provider.ts <- localStorage implementation
|       +-- store.ts                <- Zustand project store
|       +-- seed-loader.ts          <- Loads example-modernization.json
+-- tests/
    +-- setup/
    |   +-- global-setup.ts         <- jest-dom matchers
    +-- ui/
        +-- app.test.tsx            <- App smoke test (3 tests)
```

## What you do now

```powershell
cd C:\dev\cost\sow-calc

# Wipe the old engine-only node_modules (the new package.json adds React + friends)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Delete the obsolete vitest.config.ts - vite.config.ts now hosts the test config
Remove-Item -Force vitest.config.ts -ErrorAction SilentlyContinue

# Install the new dep tree
npm install

# Tests should pass: 43 engine + 3 component = 46 total
npm test

# Start the dev server
npm run dev
```

When `npm run dev` runs, it'll print something like:
```
  VITE v5.4.21  ready in 312 ms

  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173/` in your browser. You should see:

- The project name (**Vertex Retail - Commerce Platform Modernization**)
- Client + version + DRAFT status
- "Scenario: Base Case" in the corner
- Four KPI cards: Final Price ~$2.37M, Total Cost ~$1.78M, Realized Margin 25.0%, Blended Rate ~$144/hr
- A "Foundation proof" box explaining what you're looking at

Open DevTools Console and run:
```javascript
Object.keys(localStorage).filter(k => k.startsWith('sow-calc:'))
```
You should see `sow-calc:project:proj_vtx_modernization_2026` and a matching
summary key. Reload the page - the data persists because of the
LocalStorageProvider wiring.

## What deliberately isn't here yet

- **No top rail with KPIs and scenario chooser** - that's M1b
- **No left rail with 10 nav items** - that's M1b
- **No routing** - that's M1b
- **No right rail defensibility panel** - that's M1c
- **No editing of anything** - that's M2

M1a is "the toolchain works." If you can see real KPIs in the browser
and the tests pass, the foundation is fully proven on your machine
and we can iterate on chrome with confidence.

## If something fails

| Symptom | Likely fix |
|---|---|
| `npm install` errors | Make sure Node 20+ and the BOM-stripped package.json |
| Tests fail with module errors | Wipe node_modules, reinstall |
| Browser shows blank page | Check DevTools console for errors; common cause is Tailwind not loading - confirm postcss.config.js is present |
| KPIs show `$0` or `--` | Seed loader failed; check console for JSON parse errors (BOM!) |
| Build fails (`npm run build`) | TypeScript error - run `npm run typecheck` to see exactly what |

## What's next

**M1b** lands the persistent chrome: top rail with the 4 KPIs you
already see (but in the right place), scenario chooser, left rail with
10 navigation items, and a router with stub pages for each. After M1b
the app starts feeling like the wireframes.

**M1c** lands the right-rail defensibility panel and the first-run
flow.

Together M1a + M1b + M1c = M1 complete per Deliverable #8.
