# Deliverable #9 - Risks & Defensibility Notes

What this calculator's outputs will get challenged on in a deal room,
and what to do about it. Written from the perspective of the person
on the other side of the table - the CFO, the buy-side advisor, the
procurement lead - whose job is to find weak points in your number.

There are three kinds of risk in this document:

1. **Lines of attack** - specific challenges a sharp counterparty will
   raise against any SOW estimate, and how this calculator helps you
   defend (or fails to).
2. **Foundation weaknesses** - places where the calculator itself is
   vulnerable to criticism. The honest disclosure of "here's what we
   built thin, on purpose."
3. **Process risks** - failure modes that no tool can fix. The user
   has to do the work.

The order matters. The dealmaker reads top to bottom and asks "do I
have an answer for each of these?"

---

## Part 1: Lines of attack on the number

### Attack #1: "Your rates are above market"

The most common, the easiest to throw, and the hardest to refute with
hand-waving. Sharp counterparties have their own rate cards or
benchmark data from competing bidders. If your Senior Cloud Architect
is at $325/hr and theirs is at $275/hr from another vendor, you have
about thirty seconds to justify the gap or lose credibility.

**How the calculator helps:**
- The **Rate Card** entity records which rate card and which version
  was used, snapshotted at project creation. You can say "this is our
  Standard 2026 Q1 card, last refreshed January 15th" - not "uh, I
  think those are roughly current."
- Every per-resource rate carries a `billRateOverridden` flag. If you
  edited the rate to be above the card, the calculator knows, and an
  audit entry records why and when. You can show the conversation
  trail.
- The **Settings > Rate Cards** screen shows the rate card's
  geography coverage and entry count. Saying "we have 1,953 entries
  covering 9 geographies" sounds (and is) more rigorous than "we use
  industry standards."

**What the calculator can't do for you:**
- Bench your rate card against published industry surveys. That's a
  procurement / commercial team function. The calculator records WHAT
  you charged, not whether it's market.
- Refute a competitor's rate. If procurement says "vendor B quoted us
  $245/hr for the same role" - that's a sales conversation, not a math
  problem.

**Defensive move:** open the Settings > Rate Cards screen, show them
the version date, the spread across geographies, and the fact that
overrides are logged. Then pivot to value: "our rate reflects our
loaded cost plus margin, and you can see the margin transparently
right here" - point at the Dashboard margin KPI.

### Attack #2: "Your offshore mix is too aggressive"

The single most-challenged number in any modernization SOW. A 45%
offshore Senior Engineer bench is great for the price; it's also where
deals fall apart on capability concerns, regulatory pushback, or
client comfort. Procurement will probe: "what's the offshore
percentage, who reviews their work, what's the security posture?"

**How the calculator helps:**
- The **By Geography** breakdown on the Dashboard shows offshore vs
  nearshore vs onshore percentages as both dollar and headcount. No
  hiding it.
- The **Resource Planner > Geography Mix** card surfaces the same
  numbers in the work surface.
- **Guardrails** specifically flag high-offshore configurations on
  regulated workloads. The user sees the warning BEFORE the client
  does. (This is configurable in Settings > Preferences > Guardrail
  Thresholds.)
- The **Assumption Ledger** is designed for exactly this kind of
  challenge. "Offshore ratio" is one of the auto-suggested assumptions
  the calculator proposes on project creation. Capturing the
  assumption with risk level, evidence, and source ("client confirmed
  in 2026-04-12 call") is the difference between "we think it's fine"
  and "here's our documented position."
- The **Scenarios** feature is the killer here. The dealmaker should
  have an "onshore-only" or "reduced offshore" scenario ready BEFORE
  the meeting. When the challenge comes: "we anticipated that - here
  are the three scenarios with different mixes, here's the price
  delta for each." That moves the conversation from defense to
  negotiation.

**What the calculator can't do for you:**
- Convince the client that your offshore team is capable. That's
  references, case studies, and meeting their people.
- Anticipate every regulatory wrinkle (HIPAA on the work, GDPR on the
  data path, ITAR on the code base). The user has to know the
  engagement's regulatory footprint and configure the guardrails
  accordingly.

**Defensive move:** never present a single scenario when offshore is
involved. Always have at least two scenarios on hand - the offshore-
heavy "best price" and the onshore-only "conservative" - so you're
not negotiating against your own number.

### Attack #3: "Your contingency is too low (or too high)"

Either direction is an attack. Too low and you're "padding the
margin in disguise" or "naive about risk." Too high and "you don't
understand the scope" or "you're hiding sandbagging."

**How the calculator helps:**
- Contingency is a project-level setting that flows into the math
  transparently. The Dashboard shows the contingency dollar amount
  separately from base cost. No hiding it.
- The **Assumption Ledger** auto-suggests "{N}% contingency" as an
  assumption with source / risk - forcing the user to articulate
  WHY 8% (or 12%, or 5%).
- Scenarios can carry different contingencies via `ScenarioOverrides`.
  You can show "base case with 8%, conservative with 12%" side by
  side.

**What the calculator can't do for you:**
- Justify the SPECIFIC percentage. Industry benchmarks vary by
  engagement type (fixed fee modernizations: 8-15%; M&A integrations:
  10-20%; greenfield with vague scope: 15-25%). The user has to know
  these and pick a defensible number.

**Defensive move:** in any high-contingency scenario, have a one-
liner ready for WHY: "we're at 12% because the integration scope
includes the client's legacy mainframe and we haven't been allowed
into their data center yet." The Assumption Ledger field is the
right place to write that one-liner BEFORE the meeting.

### Attack #4: "Your cloud costs are wishful thinking"

Cloud is the wild west of SOW math. Sharp counterparties know that
cloud estimates done pre-Discovery are nearly always wrong - usually
under, sometimes over by 3x. They'll probe: "what's the assumed user
load, are these reserved or on-demand, what's the data transfer
volume?"

**How the calculator helps:**
- Each `CloudLineItem` carries its `pricingModel` (Reserved 1yr,
  OnDemand, etc.) explicitly. You can answer "reserved 1yr for prod,
  on-demand for non-prod" without guessing.
- `environmentMultiplier` makes dev/test/staging/prod sizing visible
  per line item.
- `rampCurve` and `rampStartPhaseId` show the spend doesn't all hit
  on day 1 - useful for cash-flow conversations.
- The **Run-Rate** card separates project-duration cost from
  steady-state operational cost. This is where you head off the
  "what's the year-2 ongoing cost?" question that surprises
  unprepared bidders.
- The **Assumption Ledger** auto-suggests "Cloud sizing
  (pre-Discovery)" as an assumption when cloud line items exceed a
  threshold. Captures the sizing basis explicitly: "industry
  benchmarks for similar-scale e-commerce platforms, refine post-
  Discovery."

**What the calculator can't do for you:**
- Predict actual load. If the client says "we expect 1M monthly
  active users" and you sized for 100K, that's a discovery gap, not
  a math problem.
- Account for cost optimization the customer might or might not
  invest in (rightsizing, Savings Plans, idle resource cleanup).
- The seed pricing catalog from #6 is illustrative. Real engagements
  need real pricing - either from the customer's existing AWS/Azure
  account or a fresh quote.

**Defensive move:** present cloud as a confidence range, not a
point estimate. Use scenarios: "base case assumes the workload sizes
in line with industry benchmarks; high-bound scenario assumes 2x
that. Real number comes out of Discovery." Pre-Discovery cloud is
NEVER defendable as precise; smart procurement teams know this and
respect honesty about it.

### Attack #5: "Your timeline is too short / too long"

A 10-month modernization for what looks like a 14-month scope is
"unrealistic and will run over." A 14-month effort for a 10-month
scope is "padded for billable hours." Both attacks come in pricing
discussions.

**How the calculator helps:**
- The **Project Setup > Phases** section makes the timeline explicit:
  Discovery 4wk, Design 6wk, Build 16wk, etc. You can defend each
  number against industry benchmarks (Discovery for a modernization
  of this scale: 3-6 weeks; Build for this complexity: 12-20 weeks).
- The **Headcount Curve** on the Dashboard shows realistic FTE
  ramp - calling out "peak 11 FTE in Build" gives the counterparty
  something concrete to push on.
- Scenarios with different durations can be priced side-by-side:
  "compressed 8-month variant adds 22% to price, here's the math."

**What the calculator can't do for you:**
- Justify the duration of a specific phase. That's project management
  expertise. The Phase definitions are inputs; the calculator just
  computes against them.

**Defensive move:** never present a timeline without the headcount
curve. "We're at 10 months with peak 11 FTE in Build" is much harder
to attack than "we're at 10 months." If they want 8 months, the
headcount goes to 15 FTE - which they may or may not want to pay for.

### Attack #6: "Your margin is too high"

Direct, often hostile. "We can see you're charging us 25% margin -
we need 15%." This isn't really a math attack, it's a commercial
negotiation, but the calculator gets used either as ammunition or
as defense.

**How the calculator helps:**
- The pricing math is explicit. Margin is visible on the Dashboard
  KPI. There's no hiding it; pretending otherwise would be a worse
  position.
- The **Effective Blended Rate** KPI converts the whole thing to a
  single dollars-per-hour number, useful in negotiations because
  competitors can be compared on that metric.
- Discount field is project-level. Procurement loves discounts; the
  calculator can model "what if we apply a 5% discount" and show the
  resulting realized margin instantly.
- **Critically:** the calculator will show a NEGATIVE realized
  margin if the discount exceeds the target margin. This is the
  guardrail that stops "let's just discount more" from quietly
  becoming "we're losing money on this deal."

**What the calculator can't do for you:**
- Decide whether the margin is the right margin for the engagement.
  That's commercial strategy.

**Defensive move:** be ready to show the realized margin after
discount in real time during the meeting. "If we accept your 10%
discount, our realized margin goes to 16.7% - we can do that. If we
accept 15%, it's 11.8% which is below our floor."

### Attack #7: "How did you size this without Discovery?"

A legitimate question that the calculator can answer well if used
properly. Pre-Discovery SOWs are common but always wobbly.

**How the calculator helps:**
- The **Assumption Ledger** auto-suggests sizing-related assumptions
  with risk level. A pre-Discovery estimate should have 5-15
  assumptions documented; an estimate with 0 assumptions is itself
  a red flag.
- Scenarios let you present multiple sizings explicitly: "base case
  assumes 5 microservices, high-bound assumes 9, low-bound assumes
  3."
- The "(?)" badges on defaults vs the "(✎)" on overrides surface
  exactly which numbers were typed in vs. inferred.

**What the calculator can't do for you:**
- Make a pre-Discovery estimate accurate. It's not. The calculator
  can only make it transparent.

**Defensive move:** open the Assumption Ledger and read the assumptions
out loud. "Here's the 11 things we assumed; if Discovery invalidates
3 of them by more than X%, we'd re-baseline." That's a much stronger
position than defending the point estimate.

### Attack #8: "What's your downside scenario?"

A pro move. The buyer wants to know what happens if things go wrong -
not the happy path. Less-prepared bidders fumble this.

**How the calculator helps:**
- The **Scenarios + Compare** feature exists exactly for this.
  Cloning the base, increasing contingency to 15%, switching offshore
  resources to onshore, adding a 6-month extension - all are
  one-minute operations.
- The **Compare Mode** side-by-side view is exactly the artifact a
  prepared bidder shows when this question comes up.

**What the calculator can't do for you:**
- Generate the scenarios automatically. The user has to think about
  what could go wrong and model it.

**Defensive move:** show up with at least three scenarios saved:
"Base case", "Conservative" (pessimistic sizing), and "Stretch"
(client-friendly aggressive case). When the question comes, switch
to Compare and walk through them.

---

## Part 2: Foundation weaknesses (honest disclosure)

These are places where the calculator itself can be challenged, and
where the user needs to know the answer in advance.

### Weakness #1: All seed data is illustrative

This is the biggest one and worth stating loudly. The rate card
(`standard-2026-q1.json`), the AWS pricing catalog
(`aws-us-east-1.json`), and the Azure pricing catalog
(`azure-eastus.json`) are all marked `isIllustrative: true` and
labeled "EDIT BEFORE USE." They are starting points, not market
quotes.

**If challenged:** "These are foundation defaults shipped with the
tool. The rate card actually used here is [name], last updated
[date], maintained by [team]. Want to see the source-of-truth
document?" Have that document ready - in `seed/rate-cards/` if it's
been replaced, or in your commercial team's drive.

**If the seed is the only thing in the file:** that's a process
failure that has to be fixed before any real engagement uses the
tool. The Phase 1 plan in #8 doesn't include a "replace illustrative
data" milestone because it's a customer-onboarding step, not a build
step. Don't deploy with illustrative data live.

### Weakness #2: Floating-point arithmetic

Internal math uses IEEE-754 doubles. For project sizes up to ~$100M,
the drift is sub-cent. But if a sharp counterparty hand-recomputes
your bill rate × hours and gets a result that differs from yours by
$0.04, they'll ask why.

**If challenged:** "We round at presentation time, not at storage
time, so internal accumulators may differ from your spot-check by
fractions of a cent. Want to see the unrounded values?" Then in
Phase 2, the foundation supports swapping to bigint minor units
(cents) without rewriting the engine - the math goes through helpers
in `src/engine/fx.ts` exactly so that swap is contained.

**If asked "why didn't you use exact math from day 1?":** because at
realistic project scales it doesn't matter, and bigint adds friction
to every line of math code. The trade-off is documented in #4.

### Weakness #3: M&A overlay math isn't implemented yet

The data model from #3 has `Scenario.maData` for TSA, Carve-Out, and
Integration sub-modes. The wireframes in #5 show all three screens.
**The calc engine from #4 doesn't compute the overlay math yet.**

**If challenged:** the M&A Mode screen has a banner explicitly saying
"M&A overlay math is in preview. Numbers shown here are projections
based on your inputs; they don't yet flow into the top-rail KPIs."
The user shouldn't be surprised by this; the wireframe pattern
surfaces it.

**Phase 2 work:** implement the M&A overlay calc functions, wire
them into `calculate()`, add tests. Probably 1-2 engineer-weeks.

### Weakness #4: Cloud pricing is single-region only

`aws-us-east-1.json` and `azure-eastus.json`. Real engagements
often involve multi-region deployments, and cloud prices vary by
region (us-east-1 is cheap; some Asia regions are 30-40% higher).

**If challenged:** "Phase 1 ships us-east-1 and eastus catalogs. For
this engagement, the team adjusted the unit prices per line item
based on the actual deployment region. The overrides are visible -
click any line item and the `unitCostOverridden` flag is set."

**Phase 2 work:** ship region-specific catalog files and let the
Cloud Planner switch by region. Or wire the live AWS Pricing API /
Azure Retail Prices API per the architecture seam already in place.

### Weakness #5: No live competitor / benchmark data

The calculator can compare scenarios but can't compare your bid to
competitors or to industry benchmarks. If procurement says "vendor
B is 15% cheaper for the same scope," your tool can't help directly.

**If challenged:** this is what scenarios are for. "Let me model
their scope assumptions and we'll see where the gap actually is" -
then clone the base, adjust resources / cloud to match what you
think their pricing implies, and see what falls out. It's not
automatic, but it's structured.

### Weakness #6: Phase 1 has no real authentication

Local-first, single-user. If two people on the same team use the
same machine, the second user sees the first user's projects. The
audit log identifies actions by whatever user-ID is in local
storage, which is trivially editable.

**If challenged:** "Phase 1 is designed for single-user offline use.
Multi-user deployment is Phase 2 with Entra ID integration. For
sensitive engagements, distribute as a desktop app (Tauri build
target supported by the foundation) or use isolated machines."

The Phase 2 backend is where this gets real - the foundation has the
right hooks (`ownerId`, `orgId`, audit `userId`) but they aren't
enforced in Phase 1.

### Weakness #7: Audit log is local and capped

Audit log lives in localStorage, capped at 1,000 entries with FIFO
eviction. For a complex project with many revisions, you'll cycle
through entries before you reach the deal room.

**If challenged:** "Phase 1 audit log is for in-session review and
short-term auditability. Long-term compliance audit lives in the
exported JSON / XLSX which the user persists outside the app." This
is true but slightly hand-wavy; Phase 2 pushes audit to a backend
with no cap.

### Weakness #8: No "lock the version" feature

Once a SOW is approved internally, you want to be sure the numbers
in the proposal match the numbers in the calculator on the day the
proposal is signed. Phase 1 has versioning on the Project
(`version: "1.0.0"`) but no enforcement - someone could edit a
"v1.0.0 - approved" project after the fact.

**If challenged:** "We snapshot to JSON / XLSX at every approval
milestone and the export is the system of record. The calculator is
the working copy." That's an honest answer but reveals a Phase 2 gap:
an "Approved" status pill should ideally make the project read-only
or at least require a clone-to-edit flow.

**Phase 2 work:** implement the status state machine properly so
APPROVED locks editing, REVIEW shows pending changes, etc. The
wireframes hint at this (top-rail status pill) but Phase 1 doesn't
fully enforce.

### Weakness #9: Utilization convention can be misread

The engine applies `utilizationPct` to BOTH the bill and cost sides
(an 85% utilized engineer produces 85% of billable work AND 85% of
billable cost). Some firms use utilization to mean "we pay 100% but
bill 85%" - a different convention.

**If challenged:** documented in #4 with the recommendation:
"set utilizationPct = 100 and bake the discount into bill rate
instead." But if a contributor uses the calculator without reading
the docs, they could mis-model. The Assumption Ledger pattern helps:
capture utilization convention as an explicit assumption per project.

### Weakness #10: No multi-currency UI yet

The data model supports multiple currencies (every Money carries a
currency code). The engine handles FX conversion. The UI in Phase 1
defaults to USD with a single override field on Project Setup -
mixed-currency scenarios work in the data but aren't well-supported
in the editing experience.

**If challenged:** "Phase 1 is USD-primary. Mixed-currency
engagements work but require manual rate management. Phase 2 brings
the multi-currency UI - currency picker per resource, live FX
indicators, etc."

---

## Part 3: Process risks (no tool can fix)

These are failure modes the calculator doesn't address. Listing them
because pretending tooling solves everything is itself a
defensibility risk.

### Process risk #1: Garbage in, garbage out

The calculator is precise about whatever you put in. If you under-
estimate the headcount needed for Build by 30%, the calculator
confidently produces a 30%-too-low number. The Assumption Ledger
helps - documenting assumptions makes errors discoverable - but it
can't validate the assumptions themselves.

**Mitigation:** peer review the staffing plan and the cloud sizing
before the SOW goes out. The calculator's export formats make this
review easier (XLSX detail sheets, the Assumption Ledger PDF
appendix), but the review itself is human work.

### Process risk #2: Stale rate cards

A rate card is a living document. Q1 numbers are usually wrong by
Q3. The calculator records WHICH version was used at project
creation, but it doesn't refresh proactively.

**Mitigation:** quarterly rate card refresh, with a sweep across
in-flight projects to flag any that are still pricing against an
expired card. This is a commercial team responsibility, not a tool
feature.

### Process risk #3: Scope creep silently inflating the estimate

The calculator handles whatever scope is captured as resources +
cloud + other costs. If the scope expands during pricing
conversations - a "small" addition here, a "while we're at it" there -
the estimate moves accordingly. Without explicit scope tracking,
the user might not notice they're 20% above the original ask.

**Mitigation:** capture scope as an Assumption ("this estimate
covers commerce platform modernization only; analytics replatforming
is out of scope and quoted separately"). The Audit Log captures
every edit; reviewing it periodically catches "wait, when did this
become a $7M estimate?"

### Process risk #4: The "live in a meeting" failure mode

The calculator is designed for live scenario flex in a meeting -
clone, tweak, present. The risk: an unprepared user does math on
the fly in front of the client, makes a typo, presents a number
that's wildly wrong, and embarrasses themselves and the firm.

**Mitigation:** never present a scenario that hasn't been at least
visually sanity-checked. The Dashboard's headline KPIs make this a
30-second check. The Guardrails strip flags obvious problems. But
the user has to look at them.

### Process risk #5: Misunderstanding the run-rate

The Run-Rate KPI shows monthly steady-state cost AFTER go-live. It
specifically excludes project-duration spend and only includes items
flagged `includeInRunRate`. Users sometimes confuse this with
"what's our total cost over 3 years?" - which it isn't (that would
be project cost PLUS three years of run-rate, not just run-rate).

**Mitigation:** the wireframes show the run-rate card with explicit
"Monthly: $X / Annual: $Y" labels and a "Comprises:" breakdown. The
defensibility right-rail panel reinforces the definition. But if a
user prints just the KPI and slides it into a deck out of context,
they'll be challenged. Always show run-rate alongside project cost.

---

## How to use this document

Three audiences:

**For the deal lead** about to walk into a pricing meeting:
- Read Part 1, decide which attacks are likely for THIS specific
  client, and make sure you have at least one scenario / assumption
  / data point ready for each.

**For the build team** asking "is what we built defensible?":
- Read Part 2. Decide which weaknesses are blockers for your first
  deployment and address them in the Phase 1 polish milestone (M6).
  Document the others openly.

**For the engagement lead** running the pricing process:
- Read Part 3. Most of these are process failures that no tool
  fixes - put process around them: peer review, quarterly rate card
  refresh, scope capture as assumptions, sanity-check before
  presenting.

---

## A note on honesty as defense

The strongest defensibility move isn't a clever feature in a
calculator. It's a posture: be transparent about what you assumed,
what's locked vs flexible, where the risk lives, and what you don't
yet know.

A SOW estimate that says "we're 80% confident in the labor sizing,
60% confident in the cloud sizing pre-Discovery, and we've ranged
both - here are three scenarios" beats a SOW estimate that says
"$5,237,419.42, take it or leave it." The first invites a
conversation. The second invites attack.

The calculator is built for the first posture. Use it that way.

---

## What we did, end-to-end

This is the last deliverable. Looking back at the foundation:

- ✓ #1 - Clarifying questions + assumptions
- ✓ #2 - Information architecture (10 screens + chrome)
- ✓ #3 - Data model (TypeScript types + seed JSON, strict-compile clean)
- ✓ #4 - Calculation engine (43 tests passing, math invariants asserted)
- ✓ #5 - Wireframes (12 files, every screen with empty/loading/error states)
- ✓ #6 - Seed data (1,953 rate card entries, 213 cloud SKUs)
- ✓ #7 - Tech stack recommendation (with concrete config templates)
- ✓ #8 - Phase 1 build plan (6 milestones, ~14 engineer-weeks)
- ✓ #9 - Risks & defensibility notes (this document)

What the team has now: a foundation that compiles strict, tests
deterministically, exports to a reproducible local environment via
the bootstrap script, and includes enough design specificity that the
UI build can start with no further design work blocking.

What the team still needs to do: build the UI (Phase 1, M1-M6),
replace the illustrative seed data with real rate cards and pricing,
stand up the Phase 2 backend when multi-user becomes necessary, and
implement the M&A overlay math when M&A engagements come into scope.

The foundation is shaped so all of those are additive, not
re-architectures.

Last note: every number this tool produces is one click from its
derivation. That's the single defensibility property worth optimizing
above all others. Hold the line on it as the UI gets built.
