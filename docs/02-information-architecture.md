# Deliverable #2 - Information Architecture

## Design principle driving the IA

The product has two modes of use that pull in opposite directions:

- **Building mode** - slow, careful, mid-week, "I need to scope this $5M SOW properly." Wants depth, lots of inputs, justification fields, audit trail.
- **Pricing-meeting mode** - fast, live, "the partner just asked what happens if we shift 30% offshore." Wants instant scenario flex, a few headline numbers, defensibility one click away.

A single linear wizard fails both. So the IA is built around a **persistent left rail (project nav)** + **persistent top rail (scenario chooser + KPIs)** + **central workspace that swaps based on what you're editing**. The scenario chooser is *always visible* because that's the dealmaker's primary axis of comparison.

## Top-level sitemap

```
/                                   Landing - recent projects, "new project" CTA
/p/:projectId                       Project shell (everything below lives inside)
    /dashboard                      Headline KPIs, burn curve, top variances
    /setup                          Project setup - engagement type, phases, contingency, FX
    /resources                      Resource Planner - role x level x geo x time
    /cloud                          Cloud Planner - AWS + Azure line items
    /other-costs                    Licenses, hardware, T&E, training, subcontractors
    /ma-mode                        M&A overlays (TSA / carve-out / integration) - conditional
    /scenarios                      Scenario list + side-by-side compare
    /assumptions                    Assumption ledger - every editable default in one place
    /export                         Export center - XLSX / CSV / PDF / share link
    /audit                          Change log (who changed what, when, why)
/settings                           Rate cards, cloud pricing tables, role catalog
    /rate-cards
    /cloud-pricing
    /role-catalog
    /preferences                    Currency, units, defaults
```

## The 10 primary screens, one line each

| # | Screen | Purpose | Primary user action |
|---|---|---|---|
| 1 | **Dashboard** | The one screen an exec sees | Read totals, drill into any number |
| 2 | **Project Setup** | Define the engagement | Pick engagement type, set phases, set contingency/margin |
| 3 | **Resource Planner** | Build the labor cost | Add resources, set allocation across phases |
| 4 | **Cloud Planner** | Build the infra cost | Add AWS/Azure line items, choose pricing model & ramp |
| 5 | **Other Costs** | Everything not labor or cloud | Add license/HW/T&E line items |
| 6 | **M&A Mode** *(conditional)* | Deal-specific overlays | Configure TSA tower, carve-out separation costs, or synergy targets |
| 7 | **Scenarios & Compare** | Side-by-side analysis | Clone current scenario, edit lever, compare 2-4 side-by-side |
| 8 | **Assumption Ledger** | Defensibility | Inspect every default, mark assumptions as "validated" |
| 9 | **Export Center** | Get the model out | Generate XLSX / print PDF / copy share link |
| 10 | **Audit Log** | Change history | Filter by user/date, see before/after for any field |

Plus three settings screens (rate cards, cloud pricing, role catalog) for power users who manage source-of-truth data.

## Persistent UI chrome (visible on every project screen)

**Top rail:**
- Project name + version + "draft / under review / approved" status pill
- **Scenario chooser** (dropdown of saved scenarios + "Clone" button) - *always one click away*
- 4 headline KPIs that live-update: Total Price, Total Cost, Margin %, Effective Blended Rate
- Export button (jumps to export center pre-filtered to current scenario)
- Audit indicator (dot + count of unreviewed changes)

**Left rail:**
- The 10 screen links above
- Each link shows a small dot if that section has validation warnings (missing inputs, guardrail breaches)
- Collapsible - for laptop work the rail collapses to icons only

**Right rail (contextual, slides in):**
- When you click any number in the workspace, a "Where does this come from?" panel slides in showing the formula, inputs, and source assumptions
- This is the **defensibility surface** - it's how an analyst answers "why is this $47K?" without leaving the screen

## Navigation logic & state

- **URL is the state.** `/p/proj_123/resources?scenario=base&phase=build&filter=offshore` - fully shareable, fully bookmarkable, browser back button works as expected
- **Scenarios are first-class.** Switching scenarios doesn't reload the page or lose your filter context - only the numbers re-render
- **Modal usage is rare.** Only used for destructive confirmations (delete scenario, reset to defaults) and the first-run wizard. Everything else is inline editing or right-rail panels
- **Guardrail warnings live where they fire.** A 100%-offshore architect on a regulated workload throws a yellow warning *on the resource row*, not in some separate "issues" tab

## What's *not* in Phase 1 (and where the seams are)

| Deferred capability | Where the seam lives in the IA |
|---|---|
| Multi-user collaboration | URL + state model is already shareable; add `presence` overlay later |
| Approval workflow | The status pill in the top rail already shows draft/review/approved - wire it to a backend in Phase 2 |
| Live AWS/Azure pricing | Cloud Planner reads from a `PricingProvider` interface; today it's static JSON, tomorrow it's an API |
| SSO | Project landing already has an "owned by" concept; auth layer slots in front of `/` |
| Comments/annotations on numbers | Right rail (defensibility panel) is the natural home - add a comment thread tab |

## Trade-off named

I considered putting **Scenarios** as the top-level concept (you pick a scenario *first*, then it has resources/cloud/etc. inside it). I rejected that because in practice users think project-first ("the Acme migration") and scenarios-second ("...what if we do it onshore?"). The current IA reflects that mental model: project shell wraps everything, scenarios are a switch *inside* the project.

## Open questions (non-blocking)

1. M&A Mode as one screen with a mode toggle vs. three separate top-level entries (TSA / Carve-out / Integration)?
2. Audit Log as standalone screen vs. embedded filter on each section?

Defaults stand until you say otherwise.
