# SOW Cost Calculator — Conversation History

**Generated:** 2026-05-29
**Project:** SOW Cost Calculator (Gainwell Technologies dealmaker tool)
**Purpose:** Single-file historical record of the design + implementation conversation.

---

## How to read this file

This document is a **best-available reconstruction** of the conversation
that built the SOW Cost Calculator and planned its backend. It is not a
forensic transcript.

### What you have here, by section

| Section | Content | Fidelity |
|---|---|---|
| 1 — Initial prompt | Your opening turn from the original conversation | **Reconstructed from summary.** The literal text is in your browser's chat history; this is a paraphrase. |
| 2 — Foundation deliverables (#1–#9) | Nine pre-implementation design deliverables (clarifying questions, IA, data model, calc logic, wireframes, seed data, tech stack, build plan, risks) | **Reconstructed as summaries.** Each deliverable shipped as its own manifest (`claude-manifest-02.json` through `claude-manifest-09.json`); the markdown files inside are the authoritative records. |
| 3 — Milestone implementation log (M1a–M5d-3) | 18 implementation milestones, one section each | **Reconstructed.** The per-milestone quickstart documents (`docs/M*-quickstart.md`) are the authoritative records. Section 3 here is a one-paragraph summary of each. |
| 4 — Backend planning conversation | "Act as the Principal Backend Architect..." through B0 ratification | **High fidelity.** This part is fresh in working memory; the prose is near-verbatim with light editorial cleanup. |
| 5 — Decisions ledger | Every architectural decision pulled out: defaults you accepted, defaults you overrode | Synthesized from the conversation, references back to turns where each was decided. |

### Authoritative records elsewhere

Three places have higher-fidelity records than this file:

1. **Your browser's chat history at claude.ai.** Scroll back through it for the verbatim conversation. This file is a summary; the chat UI has the originals.
2. **The per-milestone quickstart docs in `docs/`.** Each shipped milestone has its own quickstart (`M1a-quickstart.md`, `M5d-3-quickstart.md`, etc.) covering what got built, what got caught during the build, what shipped, and honest disclosures. Those documents are the authoritative milestone records.
3. **The session transcript at `/mnt/transcripts/`.** During the conversation, context-window compaction produced a transcript file capturing the implementation work. It's referenced by the running session but not exported here.

### Why some sections are higher-fidelity than others

The conversation ran long enough that context-window compaction was applied
mid-stream. The early milestone work (roughly M1a through M5b) got
summarized into a journal entry so the model could keep working without
losing track of architectural decisions. The summaries preserve **what was
decided** and **what got built** but lose the **literal back-and-forth**.

The backend planning conversation (Section 4) happened after the most
recent compaction and is fresh in working memory, so it's reproduced with
high fidelity. Section 4 is the part of this file most worth reading
verbatim; Sections 2 and 3 are best treated as summaries pointing back to
the authoritative quickstart docs.

---

## Section 1 — Initial prompt

**[Reconstructed from summary. Original text in your browser's chat history.]**

The conversation opened with a long prompt from you (the user) framing
yourself as a deal architect at **Gainwell Technologies** — a US public-sector
technology company serving Medicaid and Medicare programs. The prompt
described the problem:

- You build statements of work for client engagements, including SaaS
  implementations and modernizations.
- Modeling cost estimates today is painful — spreadsheets that break, no
  scenario comparison, no audit history, no defensibility when a CFO asks
  "how did you get that number?"
- You wanted a web app that would let you (and eventually other dealmakers)
  model SOW cost estimates end-to-end, defend the numbers, and produce
  client-ready deliverables.

The prompt asked for nine specific deliverables before any implementation:

1. Clarifying questions
2. Information architecture
3. Data model
4. Calculation logic
5. Wireframes
6. Seed data
7. Tech stack
8. Phase-1 build plan
9. Risks and defensibility

The prompt explicitly framed itself as wanting a thinking partner, not a
prompt-to-code generator. The implementation work would come later, after
the design was sound.

---

## Section 2 — Foundation deliverables (#1–#9)

**[Reconstructed as summaries. The shipped manifests
`claude-manifest-02.json` through `claude-manifest-09.json` are
authoritative.]**

Each deliverable shipped as a standalone document in the project's `docs/`
directory:

- **`docs/01-clarifying-questions.md`** — Substantive design questions:
  multi-tenancy posture, FX handling, scenario semantics, audit log
  retention, defensibility model, M&A overlay scope, geography taxonomy,
  rate-card data source. Each question came with reasoning about why the
  answer mattered.

- **`docs/02-information-architecture.md`** — Page-by-page IA with
  navigation, the project + scenario hierarchy, top-rail KPIs, left-rail
  navigation, dashboard composition.

- **`docs/03-data-model.md`** — The full data model in TypeScript-style
  type declarations. `Project`, `Scenario`, `Phase`, `Resource`,
  `CloudLineItem`, `OtherCostLineItem`, `Assumption`, `AuditEntry`. Money
  as `{ amount, currency }`. Branded ID types for type safety.
  Discriminated unions for enum-ish fields.

- **`docs/04-calculation-logic.md`** — The cost engine specification.
  Resource cost = bill rate × hours × allocation, totaled across phases.
  Cloud cost = monthly × environment multiplier × duration. Other cost as
  a flat sum. Base cost = resources + cloud + other. Contingency and
  management reserve applied to base. Final price = (total cost) / (1 −
  target margin). FX conversion on read. Burn curve generation. Phase
  breakdown. M&A overlay math (TSA, CarveOut, Integration modes).

- **`docs/05-wireframes.md`** — ASCII wireframes for every screen.
  Dashboard, Resource Planner, Cloud Planner, Other Costs, Project Setup,
  Scenarios & Compare, M&A Mode, Assumption Ledger, Audit Log, Export
  Center.

- **`docs/06-seed-data.md`** — A complete seed scenario: "Vertex Retail —
  Commerce Platform Modernization, 2026." 12 resources spread across
  US-Onshore, LATAM-Nearshore, India-Offshore. 8 cloud line items (AWS and
  Azure). 5 other costs. Six phases (Discovery 4w, Design 6w, Build 16w,
  Test 6w, Deploy 4w, Hypercare 8w). 4 assumptions with linked entities.
  Computed: $2,369,903 final price, 15,041 hours, 25% margin.

- **`docs/07-tech-stack.md`** — Vite + React + TypeScript + Tailwind +
  Zustand + react-router. Vitest + Testing Library for testing.
  Per-package version pinning. localStorage for persistence. No backend
  in scope at this phase.

- **`docs/08-phase1-build-plan.md`** — 18-milestone implementation plan:
  M1a (scaffold) through M5d-x (polish). Each milestone sized to one
  reviewable manifest. Manifest-based deployment workflow described.

- **`docs/09-risks-and-defensibility.md`** — Risks: model drift, manual
  data entry errors, FX volatility, scenario explosion, etc. Defensibility
  strategies: assumption ledger, audit log, per-KPI provenance panel,
  source data attribution.

The conversation pattern through this section: you asked for each
deliverable, I delivered a substantial document with reasoning, you ratified
or pushed back, we iterated, then it shipped as a manifest.

---

## Section 3 — Milestone implementation log

**[Reconstructed. Per-milestone quickstart docs in `docs/` are
authoritative.]**

The full implementation ran across 18 milestones. Each shipped as a
manifest applied via `bootstrap.{py,ps1}`. Per-milestone quickstart
documents (`docs/M*-quickstart.md`) capture the authoritative record of
what got built, what got caught during the build, and what shipped.

### M1a — Scaffold + chrome

Vite + React + TypeScript + Tailwind + Zustand + react-router. TopRail
with KPIs and scenario chooser. LeftRail with 10 nav items.
Placeholder Dashboard page. Stage zero of the build.

### M1b — Dashboard + dummy data wiring

The Dashboard came online with the KPI tiles and breakdown panels driven
by the seed data. The TopRail KPIs updated as scenarios were switched.

### M2a — Resource Planner read-only

TanStack Table rendering the seed's 12 resources. Per-phase allocation
cells, computed totals row, geography mix bar. Read-only — no editing
yet.

### M2b — Resource Planner editing

Inline editable cells for bill rate, cost rate, hours/week, utilization,
per-phase allocations. Every edit writes an audit entry. Engine
recomputes on every change.

### M2c — Resource lifecycle

Add Resource modal driven by rate card. Duplicate, delete, notes.
Filters by geography and skill level. Guardrails panel (margin warnings,
allocation totals).

### M3a — Cloud Planner read-only

AWS + Azure catalogs lazy-loaded (avoided shipping 300KB of catalog data
on the main bundle). Cloud line items with environment multipliers and
pricing models.

### M3b — Cloud Planner editing

Same editing pattern as resources. Add/edit/duplicate/delete cloud line
items. SKU lookup from catalogs.

### M3c — Other Costs + Project Setup

Other-cost line items (licenses, training, T&E). Project Setup screen
for project metadata, FX rates table, contingency/reserve/margin levers,
phase editing. M3 closed.

### M4a — Scenarios CRUD

Multi-scenario support. Clone, rename, delete. Switch active scenario via
top-rail dropdown. Onshore-Only scenario seeded as empty placeholder.

### M4b — Compare grid

Side-by-side scenario comparison cards. Delta visualization (Final Price,
Total Cost, Realized Margin) with directional coloring.

### M4c — Recharts Dashboard

Replaced the placeholder Dashboard tiles with real charts: Monthly Burn,
Headcount Curve, Cost by Phase. Recharts 3.8.1 lazy-loaded as its own
chunk.

### M4d — M&A overlay

The M&A Mode page with TSA, CarveOut, and Integration modes. Per-mode
math for one-time cost, recurring cost, realized synergy, net impact,
breakeven month. Closes M4.

### M5a — Assumption Ledger + Audit Log

The Assumption Ledger page (assumptions table with source and risk
badges, add/edit/delete/review actions). The Audit Log page (reverse-chrono
view of every change with category, headline, summary). 28 audit action
kinds.

### M5b — Export Center

XLSX (multi-sheet workbook), PDF (cover + KPIs + tables), CSV (per-data-
type), JSON (full backup). Lazy-loaded — heavy export dependencies
(@e965/xlsx, jspdf, jspdf-autotable) don't ship on the main bundle.

### M5c — First-run wizard + populated Onshore-Only seed + bootstrap fix

Three-step wizard (Basics → Pricing → Phases) + Confirm step for
creating new projects from scratch. Populated the Onshore-Only scenario
with US-Onshore resources matching the Base Case's roles ($3,402,535 vs
Base's $2,369,903, +43.6% delta, same scope and hours). Fixed
`bootstrap.ps1` to write UTF-8 without BOM (was breaking
`postcss.config.js` parsing).

### M5d-1 — Defensibility panel core

The right-rail defensibility drawer. Clickable Final Price tile on
Dashboard + clickable Bill cells on Resource Planner. Drawer renders
math + assumptions + source-input links for the clicked KPI.

### M5d-2 — Defensibility on every surface

Wired the rest: Dashboard's Total Cost / Margin / Blended Rate tiles,
top-rail's four KPIs (on every project route), Compare grid cards. Lifted
drawer state to a Zustand store mounted in AppShell so it's a single
instance app-wide.

### M5d-3 — Polish bundle

Four items: single-fork test pool (fixed Windows flakiness), setTimeout
cleanup in AssumptionLedgerPage (eliminated an unhandled error during
test teardown), `project.create` audit kind (wizard now writes an audit
entry on project creation), AssumptionLinksCell (linked-entity navigation
from the Assumption Ledger). 275/275 tests passing deterministically.

---

## Section 4 — Backend planning conversation

**[High fidelity. Near-verbatim from working memory.]**

This is the conversation that produced the B0 Architecture Decision
Record. It started after M5d-3 shipped, when you indicated you wanted to
extend the application beyond its current localStorage-only persistence.

### Turn 1 — Original backend prompt (you)

You opened with a substantial prompt asking me to act as Principal Backend
Architect and build a backend for what you described as "a completed
frontend UI for a Project Costing & Resource Estimation Application." The
prompt asked for:

- A PostgreSQL DDL schema with tables for `projects`, `resources/roles`,
  and `project_allocations`, with `NUMERIC` for money, foreign keys,
  cascading rules, indexes
- A FastAPI backend with SQLAlchemy, connection pooling via env vars,
  specific endpoints (`GET /projects/{id}/cost-summary`, `POST
  /allocations`, `GET /resources`), Pydantic validation, HTTP exception
  handling
- CORS configuration and a standard directory layout

### Turn 2 — Reflection on the mismatch (me)

I flagged that the prompt's described data model didn't match what we'd
built. The frontend has a far richer model than "projects + roles +
allocations" — it has scenarios, phases, cloud line items, other costs,
assumptions, audit log, FX rates, M&A overlays — and a complete
calculation engine. Building the literal schema in the prompt would mean
shipping a backend that can't store ~80% of what the frontend produces.

I laid out three paths:

- **Path A:** Build the generic schema you asked for, treating it as a
  new application unrelated to what we built.
- **Path B:** Build a backend that fits the SOW Calculator's actual data
  model — tables matching the existing types, endpoints preserving
  scenario semantics.
- **Path C:** Hybrid sketch.

And three calculation models:

1. **Backend computes:** port the engine to Python.
2. **Frontend computes, backend stores:** the existing TS engine remains
   authoritative; backend persists raw inputs.
3. **Both compute** with drift checks.

I recommended **Path B with calculation option 2** because it preserves the
existing engine, gives you persistence without forcing a rewrite, and
matches the data model we actually have.

I asked for decisions on five questions before writing code: path,
calculation model, auth model, deployment target, migrations approach.

### Turn 3 — "I did not know that" (you)

You replied that you hadn't known the SPA persisted to localStorage.
Brief, surprised. Asked me to explain what that meant.

### Turn 4 — localStorage explainer (me)

I explained:

- The SPA uses browser localStorage as its only persistence layer.
- `sow-calc:project:<id>` holds the full state JSON. `sow-calc:audit:<id>`
  holds the audit log.
- On boot, the SPA reads from localStorage. If nothing's there, falls back
  to the seed.
- Edits auto-save via Zustand store mutations.

I laid out the tradeoffs:

- Good: zero-infrastructure, instant load, per-browser isolation.
- Limitations: per-browser per-device, no sharing, no cross-device history,
  risk of data loss from cleared browser data, no admin visibility.

Then three scenarios where the backend question is answered differently:

- Only user, same machine: backend probably unnecessary
- Sharing with teammates: marginal; export-import works clunkily
- Multiple users, system of record, compliance: backend essential

My recommendation: try the tool as-is first; if real-use friction shows
"localStorage isn't enough," then build the backend. Don't build for
problems you don't have.

### Turn 5 — "Make it a production-ready website on EC2" (you)

You committed: production-ready, EC2 deployment.

### Turn 6 — Three options for "production on EC2" (me)

I explained that "production on EC2" is a destination with several routes:

- **Option 1:** Static SPA on EC2 or S3+CloudFront. No backend, no
  database. Just deployed to a real URL. $0-15/month, half a day to ship.
- **Option 2:** SPA + thin backend storing JSON blobs. ~$40-80/month, 3
  milestones, 1-2 weeks.
- **Option 3:** Full relational backend with schema decomposition. Same
  cost as Option 2, but 4-5 milestones, 3-4 weeks.

I recommended **starting with Option 1**, using the tool for an actual
engagement, then deciding whether Option 2 was needed.

I asked five practical questions: AWS account ownership, domain status,
TLS approach, auth requirements, data migration story.

### Turn 7 — "Standalone or Entra ID enabled, config switch" (you)

You said the app needed to support both standalone deployment and Entra ID
integration, switchable by configuration.

### Turn 8 — What config-switchable auth means (me)

I reflected the requirement back. Three points stood out:

- You need a backend (auth state has to live somewhere server-trusted).
- The data model needs `user_id` on every editable row.
- Authorization is separate from authentication.
- Entra ID has corp-policy implications (tenant app registration, IT team
  involvement).
- The pattern: auth middleware abstraction selecting standalone vs Entra
  at startup; the rest of the app is mode-agnostic.

I sketched the updated milestone plan:

- B0 — Architecture Decision Record (no code)
- B1 — Backend skeleton + standalone auth
- B2 — Frontend save/load + JSON re-import
- B3 — Auth-backend abstraction + Entra implementation
- B4 — Production hardening
- B5 — Schema decomposition (optional)

I asked: AWS account, OIDC tenant access, domain, backend language, DB
hosting, data migration, runtime vs build-time auth switch.

### Turn 9 — "At build time we'd specify Standalone or Broker Identity Enabled using OIDC" (you)

You corrected my framing. Not "Entra ID specifically" — **OIDC broker**.
Entra is one provider; the code should work against any OIDC IdP.

### Turn 10 — Reflection on OIDC framing (me)

I agreed this was the right framing. By treating the integration as OIDC
generally:

- Same code works against any provider.
- Local development is easier (Keycloak in Docker).
- Customer deployment flexibility.
- Entra becomes "the OIDC provider for this production deployment," not a
  special case.

I noted that token claims vary by provider (group memberships in
particular) and your authorization layer needs adapter code that knows how
to extract roles from a given provider's tokens.

I explained build-time vs runtime selection tradeoffs and recommended
**runtime** (one image, env-var switch, simpler ops).

### Turn 11 — "Standalone with security access credentials" (you)

You said: start with standalone auth.

### Turn 12 — What standalone means (me)

I reflected back four styles of standalone:

1. Single shared password
2. Local username/password per user
3. Local users + roles
4. API keys

I assumed Style 2 was what you meant. I explained what you'd get
(login screen, users table, bcrypt, JWT, `current_user` dependency, audit
log identity) and what you wouldn't (strong password policy, MFA, SSO,
email reset, account lockout).

I asked six decisions:

1. Self-service or admin-provisioned?
2. Roles in v1 — flat, two roles, or three?
3. Project ownership and sharing model?
4. JWT lifetime and refresh story?
5. Where does the signing secret live?
6. HTTPS in development?

### Turn 13 — Your answers (you)

You answered:

1. Admin-provisioned
2. **Three roles**
3. **Per-user with explicit sharing**
4. (Defaults)
5. Env var on EC2
6. HTTPS using an existing cert on the machine

And on the meta-questions: yes you have a domain, AWS region is us-west-2.

### Turn 14 — Reflection on what choices 2 and 3 cost (me)

I flagged that you'd pulled two B4 items into B1. The cost:

- Three roles = role check on every endpoint
- Per-user sharing = second table + permission checks become joins
- Combined = real authorization layer, doubles B1's size

I offered to defer sharing to B4. Asked you to confirm or override.

I sketched the role/share/ownership policy questions explicitly:

- Can viewer be granted write-share? (default: no — role is ceiling)
- Can a non-admin user share their project? (default: yes)
- Can ownership be transferred? (default: deferred)

I explained HTTPS implications of having an existing cert (not Caddy +
Let's Encrypt; nginx with pre-PEM-mounted cert; renewal is your problem).

I flagged the bootstrap admin exception (the first admin has to come from
somewhere; env-var seed on first start; rule has a documented exception).

I updated the milestone plan: B0 ratification first, then B1, etc.

### Turn 15 — Your follow-ups (you)

You said:

- "I understand B1 just got bigger — can B1 be broken out to B1.a, B1.b, B1.c, B1.d etc?"
- Confirmed sketch (viewer-as-ceiling, owner can share, transfer deferred)
- env vars (bootstrap admin)
- PEM (cert format)

### Turn 16 — Splitting B1 (me)

I sketched the right way to split B1: each sub-milestone end-to-end,
runnable, with tests. Wrong ways: by layer, by table, easy-first.

I proposed seven sub-milestones:

- B1.a — Hello FastAPI from Docker on EC2 (deployment proof)
- B1.b — Database + users table + bootstrap admin
- B1.c — Login flow + JWT + current_user dependency
- B1.d — Three-role authorization + admin user management
- B1.e — Projects table + ownership + CRUD endpoints
- B1.f — Project shares + audit log table
- (B1.g came later, after the workflow conversation)

I surfaced four secondary design questions:

- Single-role vs multi-role join table?
- Soft-delete in B1?
- Audit retention?
- Two audit streams or unified?

And two housekeeping questions: repo layout, EC2 state.

### Turn 17 — Your answers (you)

You answered:

- Single role
- "No soft-delete just have a status of deactivate"
- Audit retention deferred to B4 — agreed
- Two audit streams not unified — agreed
- Monorepo
- "All I know is us-west-2 — I don't know any more than that"

### Turn 18 — Reflection on those answers (me)

I parsed your "deactivate not delete" carefully:

- Users get an `is_active` flag, never hard-deleted from the app
- Inactive users can't log in but persist for audit-log integrity

I asked whether the same pattern applied to projects. (My default: projects
can be deleted; only users follow deactivate-not-delete.)

I explained that "all I know is us-west-2" meant B0 should not over-specify
AWS architecture — single EC2 + Docker Compose, defer the VPC/RDS/IaC
conversation. I produced the EC2 pre-flight checklist (7 items for you to
investigate when you got onto the actual instance).

### Turn 19 — "What do you think about these status codes?" (you)

You proposed a five-state estimate lifecycle:

- Draft / Opportunity / In-Progress
- Pending Review / Submitted
- Quoted / Sent
- Approved / Accepted
- Rejected / Cancelled

With semantics matching the deal lifecycle (review gates, read-only-after-
quoted, terminal states).

### Turn 20 — State machine analysis (me)

I unpacked what you were proposing:

- Not just five enum values — a state machine with transition rules and
  per-status permission overrides
- Each state has rules: who can edit content, who can transition, what
  the next legal states are

I drew the state diagram and proposed transition rules with role/share
gating. I called out specific questions:

- Reviewer = anyone with write-share, or a separate role?
- Can creator transition Pending Review → Quoted? (the most consequential
  rule)
- Quoted as read-only with no revision flow?
- Reasons required on which transitions?

I noted this was bigger than what I'd scoped for B1; suggested it
deserved its own sub-milestone (B1.g) added to the split.

### Turn 21 — Your answers (you)

You answered:

1. Confirmed (state machine matches)
2. Keep simple (reviewer = editor with write-share + admin)
3. Yes — creator cannot self-promote Pending Review → Quoted
4. Yes — Quoted fully read-only
5. Required — for all transitions

### Turn 22 — Clarifying questions 3 and 5 (me)

I worried "yes" was ambiguous on question 3 (yes-to-my-default-which-was-
no, or yes-creator-CAN-self-promote). And on question 5 I asked whether
"required" meant all transitions or just back-transitions/cancellations.

### Turn 23 — Clarifications (you)

You replied: A (creator cannot self-promote) and All (reasons required on
all transitions).

### Turn 24 — B0 ready to write (me)

I summarized what I heard:

- State machine confirmed with implicit Draft→Cancelled, Pending
  Review→Cancelled additions
- Reviewer = editor with write-share + admin (simple model)
- Creator cannot self-promote Pending Review → Quoted (strict reading)
- Quoted fully read-only, no revision flow in B1
- Reasons required on all transitions

I committed to B0 next turn. 14 sections, ~10-12 pages.

I made two structural decisions:

- B1 grew from B1.a–f to B1.a–g (status workflow gets its own sub-milestone)
- Cleanup utility moves to B1.g (depends on terminal statuses being meaningful)

### Turn 25 — "Let's do it" (you)

Go-ahead to write B0.

### Turn 26 — B0 delivered (me)

I produced the full B0 Architecture Decision Record. Sections covered:

1. Purpose and scope
2. Glossary
3. Authentication architecture (standalone + future-OIDC, AuthBackend
   protocol)
4. Authorization model (three roles + ownership + sharing + status-aware
   permissions)
5. User lifecycle (admin-provisioned, deactivate-not-delete, bootstrap
   exception)
6. Project lifecycle (five-status state machine, transitions, reasons,
   cleanup utility, terminal-status retention)
7. Data persistence (JSONB blob through B1, decomposition deferred)
8. Audit logging (two streams, retention deferred)
9. Deployment topology (single EC2 us-west-2, Docker Compose, nginx + PEM)
10. Backup posture (external, integration TBD, fallback documented)
11. Secret management (env vars in B1, SSM-ready for B5)
12. Repo layout (monorepo, `backend/` as sibling)
13. EC2 pre-flight checklist (7 items)
14. B1 sub-milestone breakdown (B1.a–g, sized)
15. Out of scope (explicit deferrals)
16. Open issues (blocked-on items)

I flagged ambiguities and one inconsistency I noticed while writing
(approved→draft transitions — I'd written admin-only in both §4 and §6
and made sure they agreed). I gave you a last-chance prompt to soften the
creator-cannot-self-promote rule if you wanted; you didn't push back.

### Turn 27 — "Create a script and a markdown" (you)

You asked for two artifacts:

- A script that creates the necessary folders
- A markdown file with all the prompts and responses for historical
  reference

### Turn 28 — Clarifying the asks (me)

For the script: I asked about scope (whole B0 tree with stubs vs.
directories + READMEs only), PowerShell + Python or just one, layout
confirmation.

For the conversation export: I was honest about what I had access to —
context compaction had happened, so the earliest exchanges were
summarized, not preserved verbatim. I offered three options:

- A: Faithful reconstruction with fidelity markers
- B: Summarized changelog
- C: Just backend-planning-onward (most recent, highest fidelity)

I asked three questions to lock the scope.

### Turn 29 — Your answers (you)

1. Monorepo confirmed
2. Yes (Option A)
3. Script and markdown for download, not a manifest

### Turn 30 — Final clarifications (me)

For the script: I asked one more time about stub files (Dockerfile,
pyproject.toml as TODOs?) vs. directories-and-READMEs-only. I asked
whether the script's `-Target` should default to `./sow-calc` (matching
your existing bootstrap pattern) or use the current working directory.

For the export: I re-stated the fidelity expectations one more time and
let you confirm Option A.

### Turn 31 — "Let's go for it" (you)

Confirmed.

### Turn 32 — This turn (me)

Writing the script (PowerShell + Python, both idempotent, both with verify
mode, no stub files, default target `./sow-calc`) and this markdown
document. Both as downloadable files.

---

## Section 5 — Decisions ledger

A compressed list of every architectural decision made in the conversation
that B0 ratifies, with pointers back to where each was decided.

### Foundation decisions (from M-milestone era)

| Decision | Value | Where decided |
|---|---|---|
| Frontend stack | Vite + React + TypeScript + Tailwind + Zustand + react-router | docs/07-tech-stack.md |
| Persistence | localStorage only | docs/07-tech-stack.md |
| Test runner | Vitest | docs/07-tech-stack.md |
| Money representation | `{ amount: number; currency: CurrencyCode }` — no floats; integer cents not used | docs/03-data-model.md |
| Currencies | 7: USD, EUR, GBP, INR, CAD, AUD, BRL | docs/03-data-model.md |
| Calculation engine | TypeScript, deterministic, in-browser | docs/04-calculation-logic.md |
| Phase order | 1-indexed `order`, plus cumulative `offsetWeeks` | docs/03-data-model.md |
| Resource allocation | per-phase, percentage of `defaultAllocationPct` | docs/03-data-model.md |

### Backend platform decisions (B0)

| # | Decision | Value | Where decided |
|---|---|---|---|
| 1 | Backend stack | FastAPI + SQLAlchemy + Alembic | Turn 6, Turn 8 |
| 2 | Database | Postgres in a Docker container (RDS deferred) | Turn 14 |
| 3 | Deployment target | Single EC2 instance in us-west-2 | Turn 5, Turn 13 |
| 4 | Auth modes | Standalone (B1) + OIDC (B3) | Turn 7, Turn 9 |
| 5 | Auth mode selection | Runtime (env var `AUTH_MODE`) | Turn 10 |
| 6 | Auth backend abstraction | `AuthBackend` protocol from B1 | Turn 8 |
| 7 | Standalone auth style | Local username/password per user (Style 2) | Turn 11, Turn 12 |
| 8 | User provisioning | Admin-only, no public signup | Turn 13 (Q1) |
| 9 | Roles | Three: admin / editor / viewer, single role per user | Turn 13 (Q2), Turn 17 |
| 10 | Project ownership | Per-user with explicit sharing | Turn 13 (Q3) |
| 11 | Share model | (project_id, user_id, permission: read\|write), grantor recorded | Turn 14 |
| 12 | Role-vs-share | Role is the ceiling; write-share on viewer = read effectively | Turn 14 |
| 13 | Ownership transfer | Deferred to B4 | Turn 14 |
| 14 | User lifecycle | Deactivate via `is_active=false`, never hard-delete | Turn 17 |
| 15 | Bootstrap admin | Env-var seed on first start, documented exception | Turn 14 |
| 16 | JWT | HS256, 24h, no refresh in B1 | Turn 12 |
| 17 | JWT secret | Env var on EC2 in B1, SSM-ready for B5 | Turn 13 (Q5) |
| 18 | HTTPS | nginx + existing PEM cert, no Caddy/Let's Encrypt | Turn 13 (Q6) |
| 19 | Project status | Five values: draft / pending_review / quoted / approved / cancelled_rejected | Turn 19, Turn 21 |
| 20 | State machine | Documented transition table with role + status gates | Turn 20, Turn 21 |
| 21 | Reviewer model | Editor with write-share + admin (simple, no separate role) | Turn 21 (Q2) |
| 22 | Self-promotion ban | Creator cannot transition Pending Review onward — needs different actor | Turn 21 (Q3), Turn 23 |
| 23 | Quoted read-only | Fully read-only, no revision flow in B1 | Turn 21 (Q4) |
| 24 | Transition reasons | Required on all transitions | Turn 21 (Q5), Turn 23 |
| 25 | Project deletion | No UI button; cleanup utility with YAML config deletes Cancelled/Rejected projects past retention | Turn 19, Turn 20 |
| 26 | Approved retention | Approved projects never auto-deleted | Turn 20 |
| 27 | Data persistence | `projects.state_json` as JSONB blob through B1 | Turn 6, B0 §7 |
| 28 | Schema decomposition | Deferred to B5, gated on a real query need | B0 §7, §15 |
| 29 | Calculation authority | Frontend engine remains authoritative; backend stores raw inputs only | Turn 6 |
| 30 | Audit streams | Two streams (client-side in state_json + server-mediated `audit_entries`), not unified | Turn 16, Turn 17 |
| 31 | Audit retention | Deferred to B4 | Turn 17 |
| 32 | Migrations | Alembic from day one, no `Base.metadata.create_all()` | B0 §7 |
| 33 | Repo layout | Monorepo, `backend/` as sibling to existing `src/` | Turn 17, Turn 29 |
| 34 | Backup posture | External system handles backups; integration TBD; pg_dump fallback documented | Turn 16, Turn 18 |
| 35 | B1 split | Seven sub-milestones (B1.a through B1.g) | Turn 16, Turn 24 |
| 36 | OIDC tenant for development | Keycloak in Docker for B3; real Entra registration as separate workstream | Turn 10 |
| 37 | Out-of-scope deferrals | MFA, email password reset, account lockout, password complexity, ownership transfer, revision/versioning, cross-project reporting, multi-instance/HA, AWS IaC, CRM integration | B0 §15 |

### Where each decision lives in B0

- Section 2 (Glossary): decisions 1-2, 8-14, 19, 21
- Section 3 (Authentication): decisions 4-7, 16-18, 36
- Section 4 (Authorization): decisions 9-13, 22
- Section 5 (User lifecycle): decisions 8, 14-15
- Section 6 (Project lifecycle): decisions 19-26
- Section 7 (Data persistence): decisions 27-29, 32
- Section 8 (Audit logging): decisions 30-31
- Section 9 (Deployment): decisions 3, 18
- Section 10 (Backup): decision 34
- Section 11 (Secrets): decision 17
- Section 12 (Repo): decision 33
- Section 14 (B1 split): decision 35
- Section 15 (Out of scope): decision 37

---

## Closing notes

This file is a working artifact, not a contract. If anything in it
contradicts B0 (`docs/B0-architecture.md`), B0 is authoritative — it's the
ratified version of these decisions.

If you spot something wrong in Section 4 (the verbatim-ish part), say so
and I'll correct. The conversation went through enough turns that I may
have misremembered a small detail.

Sections 2 and 3 are deliberately thin — the per-milestone quickstart
documents in `docs/M*-quickstart.md` are the authoritative records of what
got built. If you need to know what changed in a specific milestone, read
the corresponding quickstart.

The most useful sections for future-you are:

- **Section 5 (Decisions ledger)** — a single-page reference for "what did
  we decide and why?"
- **Section 4 (Backend planning conversation)** — the rationale for the B0
  architecture, in narrative form
- **B0 itself (`docs/B0-architecture.md`)** — the ratified architecture

— End of conversation history —
