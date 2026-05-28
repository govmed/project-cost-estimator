# Deliverable #4 - Calculation Logic

The engine is a pure function: given a `Project` and a `Scenario`, it returns
a `ScenarioTotals` tree containing every derived number the UI displays.
Same inputs always produce same outputs - no clocks, no I/O, no globals.

```
calculate(project, scenario) -> ScenarioTotals
```

This makes the engine fully testable: a fixed seed JSON produces a fixed
output, regression-tested on every commit.

## Pricing math (the convention that matters)

The engine uses **gross-margin / margin-on-price** convention. This is what
deal teams mean when they say "25% margin":

```
baseCost      = resourcesSubtotal + cloudSubtotal + otherCostsSubtotal
contingency   = baseCost x contingencyPct / 100
mgmtReserve   = baseCost x managementReservePct / 100
totalCost     = baseCost + contingency + mgmtReserve

targetPrice   = totalCost / (1 - targetMarginPct/100)        <-- margin on price
finalPrice    = targetPrice x (1 - discountPct/100)

realizedMargin    = finalPrice - totalCost
realizedMarginPct = realizedMargin / finalPrice x 100
```

If you discount aggressively (discount > margin), `realizedMargin` goes
negative. The engine reports this honestly. That's the whole point - the
calculator's job is to tell you when you're underwater, not hide it.

## FX

Every `Money` carries its own currency. Before any sum, every value is
normalized to the project's `baseCurrency` using `project.fxRates`.

Convention: `fxRates: { EUR: 0.93 }` means "1 USD = 0.93 EUR". So to convert
FROM EUR TO USD, divide by the rate:

```
amountInBase = m.amount / fxRates[m.currency]
```

If a `Money` is already in the base currency, no conversion happens.

## Resource calculations

For each resource, hours and money are computed per phase:

```
allocPct       = resource.allocations[phase] ?? defaultAllocationPct
hoursInPhase   = phase.durationWeeks
               x resource.hoursPerWeek
               x (allocPct / 100)
               x (resource.utilizationPct / 100)
internalCost   = hoursInPhase x internalCostRate (in base currency)
billedAmount   = hoursInPhase x billRate         (in base currency)
```

Resource totals roll up across phases. Margin per resource is computed at
the per-resource level for transparency (so the UI can show "this senior
architect is your highest-margin role").

**Convention note:** the engine treats `utilizationPct` as applying to BOTH
the bill side and the cost side. A 100% allocated, 85% utilized engineer
produces 0.85 FTE worth of both billable work and internal cost. If you
want to model "we pay them for 100% of their time but only bill 85%", set
`utilizationPct = 100` and bake the discount into `billRate` instead. This
keeps the formula clean; the data model can carry whichever convention
your org uses.

## Cloud calculations

Each cloud line item has:

```
steadyStateMonthly = unitCost x quantity x environmentMultiplier
```

The `rampCurve` describes what fraction of steady-state is incurred in
each project month. Six curves are supported:

| curve | shape |
|---|---|
| flat | 100% every month from day 1 |
| linear | 0% at month 0, 100% at last month, linear in between |
| sCurve | logistic centered at midpoint - slow start, steep middle, plateau |
| step | 0% before rampStartPhaseId begins, 100% after |
| frontLoaded | 100% at start, declining linearly to ~0 at end |
| backLoaded | 10% baseline for first 2/3, ramps to 100% in final third |

```
projectTotal = sum over months of (steadyStateMonthly x rampFactor[month])
runRateMonthly = if includeInRunRate then steadyStateMonthly else 0
```

The `pricingModel` field (`Reserved1yr`, `OnDemand`, etc.) is stored for
**traceability only** - the unit cost is assumed to already reflect that
pricing model. The engine does NOT apply a discount multiplier based on
pricing model, because cloud pricing data sources already publish reserved
and on-demand as separate quotes. Applying a multiplier would double-count.

## Other-cost calculations

Each line item's total depends on its `pricingUnit`:

| pricingUnit | formula |
|---|---|
| OneTime | unitCost x quantity |
| PerMonth | unitCost x quantity x monthsInScope |
| PerYear | (unitCost / 12) x quantity x monthsInScope |
| PerUser | unitCost x quantity x userCount |
| PerUserPerMonth | unitCost x userCount x monthsInScope |
| PerHour | unitCost x quantity (quantity is hours) |

Then markup applies: `total *= (1 + markupPct/100)`.

If `phaseId` is set, `monthsInScope` is the duration of that phase.
Otherwise it's the full project duration.

The burn-curve distribution depends on whether the cost is recurring or
one-shot:
- **OneTime / PerUser / PerHour**: drop the whole amount in the first
  month of scope (typically the phase's first month).
- **Recurring**: spread evenly across the scope's month range.

## Burn curve assembly

The monthly burn curve combines all three cost streams:

```
for each month m:
  resourceCost[m] = sum over (resource, phase) of (perPhase.internalCost / phaseMonths)
                    for resources whose phase covers month m
  cloudCost[m]   = sum over cloud items of (steadyState x rampFactor(m))
  otherCost[m]   = sum over other items of (their monthly contribution)
  total[m]       = resourceCost[m] + cloudCost[m] + otherCost[m]
  cumulative[m]  = cumulative[m-1] + total[m]
```

Each project month is assigned to exactly one phase using the midpoint of
the month's week-range (`phaseAtMonth`). This is the key correctness
property: months never belong to two phases simultaneously, so per-phase
rollups never double-count cloud or other-cost burns.

A trailing partial month (when project weeks don't divide evenly into
months) gets assigned to the last phase rather than being orphaned.

## Headcount curve

```
for each month m:
  phase = phaseAtMonth(m)
  for each resource:
    alloc = allocationForPhase(resource, phase)
    fte = (alloc / 100) x (utilizationPct / 100)
    totalFTE[m] += fte
    byGeography[resource.geography][m] += fte
```

FTE > 1 is valid: a "team" resource representing 4 offshore developers
will have allocation 400%, contributing 4.0 FTE.

## Effective blended rate

Defined as the resource-portion of final price divided by total billable
hours:

```
totalBillableHours = sum over resources of totalHours
resourceShareOfBase = resourcesSubtotal / baseCost
resourcePortionOfPrice = finalPrice x resourceShareOfBase
effectiveBlendedRate = resourcePortionOfPrice / totalBillableHours
```

This is "what would a flat hourly rate look like that produces the same
client price for the same labor mix" - a single number for negotiation.

## Run-rate projection

For items flagged `includeInRunRate`, the steady-state monthly cost extends
beyond project end:

```
runRateMonthly = sum over (cloud + other) of (item.runRateMonthly)
runRateYearN   = runRateMonthly x 12   (for N = 1, 2, 3)
```

This is what the client pays AFTER go-live, not part of the project price.
The UI presents it as separate "operate" cost.

## Reporting roll-ups

The engine produces several breakdowns for the dashboard:

- `byPhase` - resource / cloud / other / total cost per phase + average FTE
- `byGeography` - resource cost grouped by sourcing geography
- `byCloudProvider` - cloud cost grouped by provider (aws / azure / etc.)
- `byCloudCategory` - cloud cost grouped by category (Compute / Storage / ...)

All breakdowns sum to their respective subtotals - tested as an invariant.

## What's tested

```
tests/engine/fx.test.ts            6 tests - currency conversion, mixed sums
tests/engine/ramp-curves.test.ts   7 tests - every ramp curve, edge cases
tests/engine/resource.test.ts      8 tests - hours, cost, margin, FX
tests/engine/pricing.test.ts       6 tests - contingency, margin, discount,
                                              negative-margin edge case
tests/engine/calculate.test.ts    16 tests - end-to-end against seed
                                              JSON, internal consistency,
                                              determinism
                                  ---
                                   43 tests, all green
```

The integration test asserts:
- baseCost = resources + cloud + other (no rounding loss)
- totalCost = baseCost + contingency + reserve
- byPhase sums to baseCost (no per-phase double-counting)
- byGeography sums to resourcesSubtotal
- byCloudProvider sums to cloudSubtotal
- burn curve cumulative matches monthly sum
- determinism: two runs produce identical outputs

## Honesty notes

**1. The seed scenario produces ~$2.37M final price, not $4-5M.**
My Deliverable #3 commentary overstated the size; the seed itself is
internally consistent and realistic for a mid-cap modernization, just
sized at the smaller end of mid-cap. Real numbers: ~15,000 billable hours
over 10 months, peak ~11 FTE, $145/hr blended rate.

**2. Floating-point arithmetic.** Internal accumulators are JS `number`
(IEEE-754 doubles). The engine rounds at *presentation* time, not at
*storage* time, so a $100M project might accumulate a few cents of FP
drift. Tests assert `toBeCloseTo` rather than `toBe` for this reason.
A future refactor to `bigint` minor units (cents) is on the table if
client-facing rounding becomes contentious.

**3. Run-rate is intentionally simple.** Year 1, 2, 3 all use the same
monthly figure - no inflation, no scale-up curve. Real run-rate modeling
gets into multi-year hosting commitments, retired equipment, growth
assumptions. Phase 2 problem.

**4. The "M&A overlay" math is not implemented yet.** The data model has
`maData` (TSA exit ramp, carve-out separation costs, synergy targets),
but the engine ignores it for now. That's a deliberate Deliverable #5+
problem - it needs UX before math.

## Files in this deliverable

```
docs/04-calculation-logic.md                          <- this narrative
src/engine/types.ts                                   <- output types
src/engine/fx.ts                                      <- currency normalization
src/engine/time.ts                                    <- phase / month math
src/engine/calculations/resource.ts                   <- per-resource
src/engine/calculations/cloud.ts                      <- ramp curves
src/engine/calculations/other-costs.ts                <- pricing units
src/engine/calculations/burn-curve.ts                 <- monthly + FTE curves
src/engine/calculations/totals.ts                     <- pricing math + rollups
src/engine/calculate.ts                               <- entry point
src/engine/index.ts                                   <- barrel
tests/engine/*.test.ts                                <- 43 tests
tests/fixtures/example-modernization.json             <- seed (copied from #3)
package.json                                          <- npm scripts
tsconfig.json                                         <- TypeScript strict
vitest.config.ts                                      <- test runner
```

## How to run locally

```bash
cd sow-calc
npm install
npm test
```

You should see `Tests  43 passed (43)` on a clean install.
