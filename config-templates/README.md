# Config templates

These files are templates for the UI build phase. They are intentionally
named with a `.template` suffix so they don't conflict with the
engine-only configs already in place from Deliverable #4.

## How to use them

When you're ready to begin the UI build:

```powershell
cd .\sow-calc

# Back up the engine-only configs
Rename-Item .\package.json .\package.engine-only.json
Rename-Item .\tsconfig.json .\tsconfig.engine-only.json

# Promote the templates
Copy-Item .\config-templates\package.json.template      .\package.json
Copy-Item .\config-templates\tsconfig.app.json.template .\tsconfig.json
Copy-Item .\config-templates\vite.config.ts.template    .\vite.config.ts
Copy-Item .\config-templates\tailwind.config.ts.template .\tailwind.config.ts
Copy-Item .\config-templates\.eslintrc.json.template    .\.eslintrc.json
Copy-Item .\config-templates\.prettierrc.template       .\.prettierrc

# Install the full dependency tree
npm install
```

After installation, you can verify the engine tests still pass:

```powershell
npm test
```

If they do, the foundation is intact and you can begin building UI on
top of it. Reference the wireframes in `docs/wireframes/` and the data
model in `docs/03-data-model.md` for what to build first.

## Notes on each file

| File | Purpose |
|---|---|
| `package.json.template` | Full dependency tree for the recommended stack (React 18, Vite 5, shadcn/ui dependencies, etc.). Note: this REPLACES the engine-only package.json from #4. Keep a backup. |
| `vite.config.ts.template` | Vite with path aliases (`@/engine`, `@/types`), chunk splitting, and jsdom test environment. |
| `tailwind.config.ts.template` | Design tokens from the wireframes - status colors via CSS variables, KPI font sizes, rail widths. |
| `tsconfig.app.json.template` | Strict TS config with JSX and DOM. Replaces the engine tsconfig once UI work begins. |
| `.eslintrc.json.template` | ESLint with React + Tailwind + a11y plugins. |
| `.prettierrc.template` | Prettier with Tailwind class sorting. |

## What's NOT in the templates

These were considered and intentionally left out:

- **shadcn/ui components themselves.** They get added via the shadcn CLI
  per-component as you need them. Don't bulk-import.
- **A Playwright config.** Add when you start writing e2e tests; the
  default `npx playwright init` output is fine.
- **Husky / lint-staged setup.** The package.json includes the deps and
  the lint-staged config block, but you'll run `npx husky init` once to
  wire up the git hooks.
- **CSS files.** The design tokens (CSS variables that back the Tailwind
  color names) go in `src/ui/styles/tokens.css` once you create them.
  A starter template wasn't worth shipping because the actual values
  depend on your brand color choices.
