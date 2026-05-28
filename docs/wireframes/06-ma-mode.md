# 06 - M&A Mode

Visible only when `engagementContext` is `MAIntegration`, `MACarveOut`, or
`TSA`. Top of screen shows the active sub-mode; the rest of the screen
adapts to it. The math here is intentionally a Phase 2+ build (data model
supports it; engine doesn't compute it yet), so the screen also functions
as a planning surface where assumptions get captured even before the math
runs.

## Layout: TSA mode

```
+----------------------------------------------------------------------------+
|                                                                            |
|  M&A MODE: TSA           [Switch mode: TSA | Carve-out | Integration]      |
|                                                                            |
|  TSA OVERVIEW                                                              |
|  +----------------------------------------------------------------+        |
|  | Duration            [ 18 ] months                              |        |
|  | Exit ramp           [  8 ]% reduction per quarter (cost-plus)  |        |
|  |                                                                |        |
|  | (i) Exit ramp models the gradual cost reduction as the buyer   |        |
|  |     migrates off TSA services. 8%/quarter = ~50% by month 18.  |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  SERVICE TOWERS                                          [+ Add tower]     |
|  +----------------------------------------------------------------+        |
|  | Tower            | Resources | Cloud  | Other  | Month 1 cost  |        |
|  +------------------+-----------+--------+--------+---------------+        |
|  | Infrastructure   |   3 res   | $8K    | $0     | $42,500       |        |
|  | Applications     |   5 res   | $5K    | $2K    | $68,200       |        |
|  | Data             |   2 res   | $4K    | $0     | $31,700       |        |
|  | Security         |   1 res   | $0     | $4K    | $19,800       |        |
|  +------------------+-----------+--------+--------+---------------+        |
|  | Total Month 1                                  | $162,200      |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  RAMP-DOWN PROJECTION                                                      |
|  $200K |█                                                                  |
|        |██                                                                 |
|        |███                                                                |
|        |████                                                               |
|        |█████                                                              |
|     $0 +-----------------------------------------                          |
|        M1   M3   M6   M9   M12  M15  M18                                   |
|        ($162K)              ($82K)        ($60K → exit)                    |
|                                                                            |
|  RUN-OUT TOTAL: ~$2.1M over 18 months                                      |
|                                                                            |
+----------------------------------------------------------------------------+
```

## Layout: Carve-out mode

```
+----------------------------------------------------------------------------+
|                                                                            |
|  M&A MODE: CARVE-OUT     [Switch mode: TSA | Carve-out | Integration]      |
|                                                                            |
|  SEPARATION COSTS                                                          |
|  +----------------------------------------------------------------+        |
|  | Stand-up multiplier  [  1.4 ]×   (one-time setup cost factor)  |        |
|  |                                                                |        |
|  | Applied to: resource cost in Discovery + Design + Build phases |        |
|  |                                                                |        |
|  | (i) Standing up a new entity requires duplicate work that won't |        |
|  |     exist post-Day-1. Industry typical: 1.3-1.6× for tech.     |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  DIS-SYNERGIES                                                             |
|  +----------------------------------------------------------------+        |
|  | Annual dis-synergy   [  3.2 ]%   of parent run-rate            |        |
|  |                                                                |        |
|  | (i) Loss of shared services efficiency post-separation.        |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  ONE-TIME SEPARATION COSTS                          [+ Add cost line]      |
|  +----------------------------------------------------------------+        |
|  | TSA exit fee to seller     $   500,000                         |        |
|  | Brand & marketing reset    $   220,000                         |        |
|  | New SSO + identity stack   $   180,000                         |        |
|  | Office space buildout      $   140,000                         |        |
|  +----------------------------------------------------------------+        |
|  | Subtotal:                  $ 1,040,000                         |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  IMPACT SUMMARY                                                            |
|  Base project:    $2,369,903   (from main calculator)                      |
|  Carve-out mult:  +$  X,XXX    (stand-up × phases × multiplier)            |
|  Separation:      +$1,040,000                                              |
|  Y1 dis-synergy:  +$  X,XXX    (placeholder; depends on run-rate)          |
|  ──────────────────────────                                                |
|  All-in Y1:       $X,XXX,XXX                                               |
|                                                                            |
+----------------------------------------------------------------------------+
```

## Layout: Integration mode

```
+----------------------------------------------------------------------------+
|                                                                            |
|  M&A MODE: INTEGRATION   [Switch mode: TSA | Carve-out | Integration]      |
|                                                                            |
|  SYNERGY TARGETS                                                           |
|  +----------------------------------------------------------------+        |
|  | Target annual synergy    $ 4,500,000  (run-rate)               |        |
|  | Realization timeline     [ 24 ] months to full realization     |        |
|  | Curve                    (•) S-curve  ( ) Linear  ( ) Step     |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  ONE-TIME INTEGRATION COSTS                         [+ Add cost line]      |
|  +----------------------------------------------------------------+        |
|  | Integration program PMO  $   650,000                           |        |
|  | Data migration & cleanup $   480,000                           |        |
|  | Branding harmonization   $   180,000                           |        |
|  | Severance / RIF reserves $ 1,200,000                           |        |
|  +----------------------------------------------------------------+        |
|  | Subtotal:                $ 2,510,000                           |        |
|  +----------------------------------------------------------------+        |
|                                                                            |
|  REALIZATION CURVE                                                         |
|  $4.5M |                                ████████                           |
|        |                       ████████████████                            |
|        |              ████████████████████████                             |
|        |     █████████████████████████████████                             |
|     $0 +-------------------------------                                    |
|        M1   M6   M12  M18  M24                                             |
|                                                                            |
|  CUMULATIVE NET POSITION                                                   |
|        ┌──── breakeven at month 14 ────┐                                   |
|        |    realized synergy >          |                                  |
|        |    one-time integration cost   |                                  |
|        └────────────────────────────────┘                                  |
|                                                                            |
+----------------------------------------------------------------------------+
```

## Zone explanations

### Mode switcher
Top right. Switching modes preserves what data is shared (one-time cost
lines have a similar shape across all three) but swaps the math-specific
inputs (exit ramp vs. stand-up multiplier vs. synergy target).

### TSA
- Duration + exit ramp drive a declining cost projection
- Service towers organize the cost lines (Infrastructure / Apps / Data / Security)
- Each tower can reference resources, cloud, and other costs from the
  base scenario - tagging items with a tower for reporting

### Carve-out
- Stand-up multiplier applies a one-time multiplier to the in-build phases
- Dis-synergy is an ongoing annual cost
- One-time separation cost lines are a list (very similar shape to Other Costs)
- Impact summary at the bottom rolls everything up

### Integration
- Synergy target + realization curve project the upside
- One-time integration cost lines are the offset
- Cumulative net position chart shows where breakeven hits (the punchline
  for a CFO conversation)

## Engine status

The data model has `Scenario.maData` for all three modes. The calc engine
in Deliverable #4 **does not yet compute the M&A overlay math** - this
screen captures the inputs and renders the projections, but the rollup
into top-rail KPIs is a deferred Phase 2 feature.

Until then, the screen has a small banner at the top:
```
(i) M&A overlay math is in preview. Numbers shown here are projections
    based on your inputs; they don't yet flow into the top-rail KPIs.
    [Read more]
```

## Interactions

- Edits to inputs immediately update the projection charts.
- One-time cost lines behave like Other Costs rows - same expand pattern.
- Switching mode warns if there's unsaved data in the current mode
  ("Switching to Carve-out will hide your TSA service towers. They will
  be preserved and shown when you return to TSA mode.").

## Scenario switching behavior

`maData` lives on Scenario. Switching scenarios re-renders the entire screen
with the new scenario's M&A configuration. A scenario that has no `maData`
shows the empty state with a "Configure {mode}" CTA.

## States

**Empty (no maData on this scenario):**
```
                M&A Mode is enabled but not configured.

                Pick a sub-mode to start:
                [Configure TSA]
                [Configure Carve-out]
                [Configure Integration]
```

**Hidden:** if `engagementContext` is none of the three M&A types, this
left-rail item doesn't appear at all.

## Keyboard

- `m t` - switch to TSA
- `m c` - switch to Carve-out
- `m i` - switch to Integration
- `n` or `+` - add a cost line in the current mode
