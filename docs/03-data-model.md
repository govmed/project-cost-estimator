# Deliverable #3 - Data Model

## The shape, in one breath

```
Project (metadata only)
  +-- phases[]
  +-- scenarios[]
        +-- resources[]              (labor cost)
        +-- cloudLineItems[]         (AWS / Azure spend)
        +-- otherCostLineItems[]     (licenses, T&E, subcontractors, etc.)
        +-- assumptions[]            (defensibility ledger)
        +-- overrides{}              (per-scenario margin / contingency / FX)
        +-- maData?{}                (optional M&A overlay)

RateCard (org-level, separate from any project)
  +-- entries[]                      (role x level x geo -> bill rate + cost rate)

AuditEntry (write-only log, one row per field change)
```

## The single most important design choice

**Project owns no cost data. Scenarios do.**

I considered making the Project the canonical source and treating scenarios as overlays of deltas. I rejected that for three reasons:

1. **Deltas get gnarly fast.** What is "the delta" when a scenario clones the base, edits a rate, removes one resource, and adds two? You end up writing a structural diff algorithm just to render the screen.
2. **Compare becomes structural diff anyway.** If a scenario is a snapshot, comparing two scenarios is "for each entity, did it change?" — straightforward.
3. **Storage is cheap, clarity is expensive.** A typical project has 3-5 scenarios with maybe 50 entities each. Even with full copies, that's ~250 small objects per project. Not a concern.

So: the Project holds metadata (name, client, engagement type, margins, phases, FX rates), and points to a list of Scenarios. The Scenarios hold the cost data. Switching scenarios in the UI just changes which scenario is in view. Cloning is a deep copy. Comparing is a diff.

## Entity-by-entity, why each exists

### `Project`
The container. Holds engagement metadata, currency settings, phases, and the list of scenarios. **No cost data lives here.** It points to one `baseScenarioId` (the canonical estimate) and one `activeScenarioId` (whatever the user is currently editing).

### `Phase`
Ordered chunks of the project timeline (Discovery, Design, Build, Test, Deploy, Hypercare). Uses *relative* timing (`durationWeeks`, `offsetWeeks`) rather than absolute dates so the project can be slipped or compressed by changing one field. A default 6-phase template ships in `DEFAULT_PHASE_TEMPLATE`.

### `Scenario`
The cost-data-bearing entity. Owns its resources, cloud line items, other costs, and assumptions. Exactly one scenario per project has `isBase: true`. `parentScenarioId` records the clone lineage. `overrides` lets a scenario locally override project-level margin/contingency/FX without mutating the project. Optional `maData` is populated only for M&A engagements.

### `Resource`
A person or fractional headcount. Tied to a single scenario. Key fields:
- `role` x `skillLevel` x `geography` → looked up against the active rate card
- `defaultAllocationPct` + optional per-phase `allocations[]` overrides
- `billRate` and `internalCostRate` as `Money` (auto-filled from the rate card, overridable inline — `billRateOverridden: true` flags it)
- `hoursPerWeek` + `utilizationPct` so the calc engine can convert allocation to billable hours

**A "team" is modeled as one Resource with a higher allocation %.** E.g., 4 offshore developers = one Resource with `defaultAllocationPct: 400`. The seed scenario does this for `res_dev_pro_x4` and `res_qa_pro_x2`. The alternative (one Resource per person) is supported but verbose. The UI will offer both modes.

### `CloudLineItem`
One row = one service in one environment at one pricing model. Multi-environment (dev/test/staging/prod) is modeled as separate rows, not a multiplier on one row, so each environment can be independently sized.

The `pricingModel` field (`OnDemand`, `Reserved1yr`, `Reserved3yr`, etc.) is for **traceability only** — the `unitCost` is assumed to already reflect the chosen pricing model. The calc engine does NOT apply a discount multiplier based on pricing model. This matters because cloud pricing data sources already publish reserved/on-demand as separate quotes, so applying a multiplier on top would double-count.

`rampCurve` describes how spend phases in across project months. Six curves cover the realistic shapes: flat, linear, sCurve, step, frontLoaded, backLoaded.

`includeInRunRate: boolean` flags which line items continue into steady-state operation. Dev/test environments typically don't; prod and observability typically do.

### `OtherCostLineItem`
Deliberately flat. Categories drive reporting roll-ups, but every line is just `unitCost x quantity x months`, with `pricingUnit` describing what quantity means (OneTime, PerMonth, PerYear, PerUser, PerUserPerMonth, PerHour). Markups for partner pass-through go in `markupPct`.

### `RateCard` + `RateCardEntry`
Organization-level, separate from any project. Multiple cards can coexist (e.g., "Standard 2026 Q1", "Federal 2026"). Each entry is keyed by `(role, skillLevel, geography)`. When a resource is added, the UI looks up the entry and pre-fills the resource's `billRate` and `internalCostRate`. The user can then override per-resource. **The rate card itself is never mutated by a project** — it's a price book.

The `isIllustrative` flag is critical: Phase 1 ships default rate cards marked illustrative, and the UI shows a banner until the user uploads or curates their own.

### `Assumption`
The defensibility layer. Every editable default the user accepts CAN be tagged as an assumption. Every override they make CAN be tagged as one. The Assumption Ledger screen lists them all with `source` (assumed / validated / clientConfirmed / industryBenchmark) and `riskLevel`. `linkedEntities` records which resources or line items each assumption affects, so the user can ask "show me everything that depends on the offshore ratio assumption" and get a list.

This is what makes the number defensible in a deal room. The exec who challenges "why $5.2M?" can drill in and see every assumption behind it.

### `AuditEntry`
One row per field change. Written by the persistence layer on every mutation. `before` and `after` are `unknown` (JSON values) so the audit log can render changes regardless of field type. Phase 1 stores these locally; Phase 2 pushes them to a backend with a real user identity.

### `Money` + `CurrencyCode`
**Every monetary field in the model is a `Money`, never a raw `number`.** Costs slightly more verbose code at every site, but multi-currency comes for free and the calc engine can catch "you tried to add USD to INR" at the function boundary instead of silently producing a $40M total that should have been $480K.

### Branded ID types
`ProjectId`, `ScenarioId`, `ResourceId`, etc. are all `string` at runtime but distinct types at compile time. Passing a `ResourceId` where a `ScenarioId` is expected is a type error. Zero runtime cost. Catches a real class of bug across a model with this many ID-typed foreign-key fields.

## Where the seams live

| Future capability | Where it slots in without rework |
|---|---|
| Live AWS/Azure pricing | `CloudLineItem.unitCost` is already a Money. A `PricingProvider` adapter (separate module) populates it from seed JSON today; live API tomorrow. No model change. |
| Multi-tenant / SSO | `Project.ownerId` and `orgId` are already present. Auth layer wraps the persistence layer. |
| Approval workflow | `Project.status` is already `draft \| underReview \| approved \| archived`. Wire state transitions to a backend service. |
| Inline comments / annotations | Add a `Comment[]` array on each entity, or — cleaner — a separate `Comments` collection keyed by `(entityType, entityId)`. Either way the model doesn't need to change shape today. |
| User-defined custom fields | Each entity gets an optional `customFields: Record<string, unknown>`. Add when the first customer asks. |
| Templates / playbooks | A `ProjectTemplate` entity is a `Project` minus IDs and dates, plus a name. New projects can instantiate from one. |

## What's in the seed scenario (`example-modernization.json`)

A populated, realistic mid-cap cloud modernization for a fictional retailer (Vertex Retail). The numbers exercise every entity:

- **12 resources** across all 4 skill levels, 4 geographies, mixed phase allocations
- **8 cloud line items** spanning AWS + Azure, multiple categories, multiple environments, multiple pricing models, multiple ramp curves
- **5 other-cost lines** across SaaS, travel, training, and a subcontractor (with markup)
- **4 assumptions** of varying risk and source, with linked entities
- **2 scenarios** — base case + an "onshore-only" variant (clone stub) to prove the multi-scenario structure works

The illustrative totals are roughly $4-5M services + $200K cloud over 10 months, which is in-band for a real mid-cap modernization. **Every number is a placeholder** — the JSON has a top-level `_comment` saying so.

## Quick sanity check you can run later

Once we have the calc engine (Deliverable #4), pointing it at this JSON should produce:
- Per-resource billed amount, cost, and margin
- Per-phase headcount + cost
- Cloud monthly burn that ramps according to each line item's curve
- Project-level total price, total cost, margin %, blended rate
- A breakdown by geography that shows the ~30/25/45 onshore/nearshore/offshore mix

If the engine can't read this JSON and produce those outputs, the model has a hole. This file is the regression test for the data model.

## Files in this deliverable

```
docs/03-data-model.md                         <- this narrative
src/types/money.ts                            <- Money + currency
src/types/ids.ts                              <- branded ID types
src/types/project.ts                          <- Project + Phase + enums
src/types/resource.ts                         <- Resource + Role + Geography
src/types/cloud.ts                            <- CloudLineItem
src/types/other-costs.ts                      <- OtherCostLineItem
src/types/scenario.ts                         <- Scenario + ScenarioOverrides + MAModeData
src/types/rate-card.ts                        <- RateCard + RateCardEntry
src/types/assumption.ts                       <- Assumption + AuditEntry
src/types/index.ts                            <- barrel export
seed/scenarios/example-modernization.json     <- the regression-test scenario
```

All TypeScript files compile cleanly under `--strict`. The seed JSON parses and structurally matches the types.

## Status

Ready for Deliverable #4 (Calculation Logic). Nothing in #3 should need to change for #4 to be writable — the engine takes a Scenario, returns derived totals, end of story.
