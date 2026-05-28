# 08 - Assumption Ledger

The defensibility surface. Every assumption listed with status, risk level,
linked entities, and review state. This is what gets printed and brought
into the deal room.

## Layout

```
+----------------------------------------------------------------------------+
|                                                                            |
|  ASSUMPTIONS                                              [+ New assumption]|
|  4 total · 3 unreviewed · 2 high/medium risk                               |
|                                                                            |
|  Filter: [Status ▼] [Risk ▼] [Source ▼]    Sort: [Risk desc ▼]             |
|                                                                            |
|  +------------------------------------------------------------------+      |
|  | (?) HIGH RISK · UNREVIEWED                                       |      |
|  +------------------------------------------------------------------+      |
|  |                                                                  |      |
|  +------------------------------------------------------------------+      |
|  | (!) MEDIUM RISK                                                  |      |
|  +------------------------------------------------------------------+      |
|  | OFFSHORE RATIO                                          [Review] |      |
|  |   Assuming 45% offshore (India) for Build and Test phases.       |      |
|  |   Requires client comfort with offshore for non-PII workloads.   |      |
|  |   Switch to onshore-only adds ~$1.4M.                            |      |
|  |                                                                  |      |
|  |   Source:   Assumed         Risk: Medium       Created: 2026-05-27|     |
|  |   Affects:  Full-Stack x4 (Pro India)  QA x2 (Pro India)         |      |
|  |   Impact:   ~$1.4M if invalidated                                |      |
|  +------------------------------------------------------------------+      |
|  | CLOUD SIZING (PRE-DISCOVERY)                            [Review] |      |
|  |   EC2 / AKS instance counts based on industry benchmarks         |      |
|  |   for similar-scale e-commerce platforms. Refine after Discovery.|      |
|  |                                                                  |      |
|  |   Source:   Industry benchmark   Risk: Medium                    |      |
|  |   Affects:  EC2 m6i.xlarge (prod)  AKS D4s_v5 (prod)             |      |
|  |   Impact:   ±20% on cloud subtotal                               |      |
|  +------------------------------------------------------------------+      |
|  | (✓) LOW RISK · UNREVIEWED                                        |      |
|  +------------------------------------------------------------------+      |
|  | 1-YEAR RESERVED PRICING ON PROD COMPUTE                 [Review] |      |
|  |   1yr reserved for prod EC2 + RDS + AKS. Saves ~30% vs on-demand,|      |
|  |   requires client commitment at deploy.                          |      |
|  |                                                                  |      |
|  |   Source:   Assumed         Risk: Low                            |      |
|  |   Affects:  EC2 m6i.xlarge  RDS Aurora  AKS D4s_v5               |      |
|  +------------------------------------------------------------------+      |
|  | 8% CONTINGENCY                                          [Review] |      |
|  |   Standard mid-confidence contingency. Bump to 12% if client     |      |
|  |   refuses fixed scope on integration components.                 |      |
|  |                                                                  |      |
|  |   Source:   Assumed         Risk: Low                            |      |
|  |   Affects:  Project (all phases)                                 |      |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  TOOLS                                                                     |
|  [Print as appendix]  [Bulk mark validated]  [Bulk request client confirm] |
|                                                                            |
+----------------------------------------------------------------------------+
```

## The review modal (opens when [Review] is clicked)

```
+----------------------------------------------------------+
| Review assumption                                     ×  |
|                                                          |
| Topic:        Offshore ratio                             |
|                                                          |
| Source:       (•) Assumed                                |
|               ( ) Validated (internal data)              |
|               ( ) Client confirmed                       |
|               ( ) Industry benchmark                     |
|                                                          |
| Risk:         (•) Medium  ( ) High  ( ) Low              |
|                                                          |
| Evidence URL  [_________________________________]        |
|               (optional - doc, email, ticket)            |
|                                                          |
| Notes         [____________________________________      |
|                ____________________________________]     |
|                                                          |
| [Cancel]                                  [Save review]  |
+----------------------------------------------------------+
```

## Zone explanations

### Risk groups
Assumptions group by risk level. Within each group, unreviewed items sort
first. The high-risk group is visually distinguished with a red strip on
the left edge; medium with amber; low with neutral.

### Counts at top
At-a-glance summary: total / unreviewed / high+medium risk. Hover any
number to see what it counts.

### Assumption cards
Each card shows:
- **Headline** in caps - short topic name
- **Description** - the full assumption text
- **Source**, **Risk**, **Created** metadata
- **Affects** - linked entities; each is clickable to jump to that entity
- **Impact** - optional free-text estimate of dollar impact if invalidated

### Tools strip
- **Print as appendix** generates a PDF of just the assumption ledger,
  suitable for stapling to the SOW response.
- **Bulk mark validated** opens a multi-select to validate many at once.
- **Bulk request client confirm** opens an email composer with all flagged
  assumptions formatted as a list for the client.

## Creating assumptions

`[+ New assumption]` opens an inline form:
- Topic (short title)
- Description (full text)
- Source / Risk (radios)
- Linked entities - multi-select; the picker lists every resource, cloud
  item, other-cost item, and the project itself
- Evidence URL

The Resource Planner, Cloud Planner, and Other Costs screens also have
"Add as assumption" buttons in expanded row details - those create an
assumption pre-linked to that entity.

## Interactions

- **Click affected entity name** -> right rail showing the entity, with a
  link to navigate to it.
- **Click [Review]** -> opens review modal.
- **Right-click an assumption** -> context menu (Edit, Delete, Duplicate
  to other scenario).

## Scenario switching behavior

Assumptions live on Scenario. Switching shows the new scenario's
assumptions. If a scenario was cloned, assumptions are copied too (with
new IDs) and remain editable independently.

## States

**Empty:** centered with friendly text:
```
            No assumptions captured yet.

            (i) Assumptions are how this calculator
                stays defensible. Tag your
                staffing, sourcing, sizing, and
                commercial decisions here.

            [+ Add first assumption]
            [Auto-suggest from current scenario]
```

The "Auto-suggest" button scans the scenario and proposes assumptions for
things that almost always need defending (offshore ratio > 30%, contingency
< 10%, reserved cloud pricing, etc.). The user accepts or declines each.

**Loading:** skeleton cards.

**Error:** an assumption with broken `linkedEntities` (e.g., a resource
that was deleted) shows the linked entity name struck-through with a
"Fix link" button.

## Keyboard

- `n` or `+` - new assumption
- `/` - focus search
- `1` / `2` / `3` - filter to High / Medium / Low risk
- `Esc` - close review modal
- `Enter` in review modal - save
