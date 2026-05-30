# SOW Cost Calculator — User Guide

A local-first calculator for building, comparing, and defending Statement-of-Work cost estimates. Runs entirely in your browser — no account, no server, no data leaves your machine.

---

## Getting started

### Option A: Open as a web app (dev build)

1. Install [Node.js 20+](https://nodejs.org) if you don't have it.
2. In a terminal:
   ```
   cd sow-calc
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

The Vertex Retail example project loads automatically. Use it to explore the tool before building your own estimate.

### Option B: Build a static bundle

```
npm run build
```

This produces a `dist/` folder you can host on any static server (Azure Static Web Apps, Vercel, Netlify, or open `dist/index.html` directly in Chrome).

---

## The ten screens

| Screen | What it's for |
|---|---|
| **Dashboard** | Headline KPIs, burn curve, phase and geography breakdowns. Start here to read the totals. |
| **Resource Planner** | Add, edit, and allocate labor resources across phases. This is where most of the money is. |
| **Cloud Planner** | AWS and Azure line items with pricing model and ramp curve per item. |
| **Other Costs** | Licenses, travel, training, subcontractors. Flat line items with per-unit pricing. |
| **Project Setup** | Engagement type, phases, margin, contingency, FX rates. |
| **M&A Mode** | TSA, carve-out, and integration overlays for deal-specific cost modeling. |
| **Scenarios** | Clone the base, edit a lever, compare 2–4 scenarios side by side. |
| **Assumption Ledger** | Every editable default in one place. Capture the "why" behind each number here. |
| **Export Center** | Download XLSX (multi-sheet), CSV, PDF summary, or full JSON. |
| **Audit Log** | Every change to the project, with before/after values. |

---

## Creating your first estimate

### 1. Start a new project

Click **+ New Project** in the left rail. The three-step wizard asks for:
- Project name, client, currency, engagement type
- Target margin %, contingency %, management reserve %
- Phases (pre-filled with Discovery → Design → Build → Test → Deploy → Hypercare; edit durations)

### 2. Build the staffing plan

Go to **Resource Planner → + Add resource**.

- Pick a role, skill level, and geography. The rate card pre-fills bill and cost rates.
- Set the default allocation % (100% = one full-time person; 400% = a team of four).
- Use the phase allocation columns to vary the allocation per phase.
- Tab between cells to edit inline. Enter commits, Esc cancels.

**Geography mix** at the bottom shows your onshore/nearshore/offshore split live.

**Guardrails** flag common problems: too-aggressive offshore on a regulated workload, bill rate far below card, missing onshore lead.

### 3. Add cloud costs

Go to **Cloud Planner → + Add from catalog**.

Select a provider (AWS / Azure), service, and SKU. Configure:
- Environment and multiplier (e.g., dev at 35% of prod sizing)
- Pricing model (On-Demand, Reserved 1yr, Reserved 3yr)
- Ramp curve (flat, linear, S-curve, step, front-loaded, back-loaded)
- Include in run-rate (checked = continues after go-live)

The ramp curve preview updates live as you edit.

### 4. Add other costs

Go to **Other Costs → + Add cost**.

Categories: SaaS Subscription, Travel & Expense, Training, Hardware, Subcontractor.

Pricing units: One-Time, Per Month, Per Year, Per User, Per User/Month, Per Hour. The form adjusts to show the relevant fields for each unit type.

### 5. Run scenarios

Go to **Scenarios → Clone** to create a copy of the base case. Edit one lever (swap offshore resources to onshore, increase contingency, reduce timeline). Return to **Scenarios → Compare** to see the price delta side by side.

Come to a pricing meeting with at least two scenarios ready: a "best price" case and a "conservative" case. When the client asks "what if we go onshore-only?", you switch to the prepared scenario rather than recalculating live.

### 6. Capture assumptions

Go to **Assumption Ledger → + Add assumption**.

For each uncertain number (offshore ratio, cloud sizing, contingency level), write:
- A short topic line ("8% contingency")
- A one-paragraph description explaining why ("standard mid-confidence; bump to 12% if scope includes the mainframe integration")
- A source: Assumed / Validated / Client Confirmed / Industry Benchmark
- A risk level: Low / Medium / High

In a deal room, opening the Assumption Ledger and reading the assumptions aloud is more defensible than pointing at a spreadsheet.

### 7. Export

Go to **Export Center** and choose a format:

| Format | Best for |
|---|---|
| **XLSX** | Handing the model to a finance team; separate sheets per section |
| **CSV** | Data import into other tools; one file per section |
| **PDF** | Executive summary; 2–3 pages, print-ready |
| **JSON** | Saving a snapshot; re-importable to continue work |

---

## Keyboard shortcuts (Resource Planner)

| Key | Action |
|---|---|
| `n` | Add new resource |
| `/` | Focus search box |
| `Tab` | Move to next editable cell |
| `Enter` | Commit inline edit |
| `Esc` | Cancel inline edit |
| `Del` | Delete selected row (with confirmation) |
| `Ctrl+D` | Duplicate selected row |

---

## Where numbers come from

Click any headline KPI in the top rail or on the Dashboard to open the **Defensibility Drawer**. It shows the formula behind the number, the inputs that feed it, and which assumptions are linked. This is the surface you use in a meeting when someone asks "why is this $5M?"

---

## Data and privacy

All data is stored in your browser's `localStorage`. Nothing is sent to any server. A typical project (50 resources, 100 cloud items, 5 scenarios) is well under 1 MB — localStorage's 5–10 MB limit is comfortable.

To move a project between machines: export to JSON on one machine, open the app on the other machine, and use **+ New Project → Import JSON** (or paste the JSON into the import field when starting a blank project).

To back up your work: export to JSON regularly. The export is the system of record.

---

## Seed data disclaimer

The rate card (`Standard 2026 Q1`) and cloud pricing catalogs shipped with the tool are **illustrative placeholders**. The rates are realistic starting points, not market quotes. Before using the tool for a real engagement:

1. Go to **Settings → Rate Cards** and verify the rates match your current pricing.
2. Go to **Settings → Cloud Pricing** and verify the cloud unit costs reflect your deployment region.

If you see a yellow "Illustrative data" banner in Settings, the seed data has not been replaced.

---

## Troubleshooting

**The app shows a blank screen.**
Clear localStorage: open browser DevTools → Application → Local Storage → clear all `sow-calc:*` keys, then reload.

**My changes were lost after reload.**
The project saves to localStorage automatically. If the browser was in a private/incognito window, localStorage is cleared when the window closes. Use JSON export to persist work across sessions.

**Numbers look wrong after I edited a rate.**
The engine recalculates on every change. If the KPI strip in the top rail shows a different number than the Dashboard, try switching scenarios and back — that forces a re-render.

**I can't open the export file.**
XLSX files require Excel 2016+ or Google Sheets. PDFs require any modern PDF reader. If the download doesn't start, check that your browser isn't blocking downloads from `localhost`.
