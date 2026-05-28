# 11 - Settings

Power-user controls. Four sub-screens accessed from a left sub-nav within
Settings. Settings live OUTSIDE the project shell (URL `/settings/...`
rather than `/p/.../settings`) because rate cards and cloud pricing are
organization-level, not project-level.

## Settings shell

```
+----------------------------------------------------------------------------+
| LOGO  | Settings                                                user menu  |   <- simplified top rail
+-------+--------------------------------------------------------------------+
|       |                                                                    |
| Rate  |             ============= SETTINGS WORKSPACE ============          |
| Cards |                                                                    |
|       |                                                                    |
| Cloud |                                                                    |
| Pricing                                                                    |
|       |                                                                    |
| Role  |                                                                    |
| Catlog                                                                     |
|       |                                                                    |
| Prefs |                                                                    |
|       |                                                                    |
+-------+--------------------------------------------------------------------+
|       | [← Back to project]                                                |
+-------+--------------------------------------------------------------------+
```

The "Back to project" link returns to whichever project the user was in
before entering settings.

---

## 11a - Rate Cards

```
+----------------------------------------------------------------------------+
|                                                                            |
|  RATE CARDS                                            [+ New rate card]   |
|                                                                            |
|  +------------------------------------------------------------------+      |
|  | • Standard 2026 Q1   v1.0   active                          [⋮] |      |
|  |   Last updated 2026-01-15 · 348 entries · 6 geographies         |      |
|  |   [Set as default] [Duplicate] [Export]                          |      |
|  +------------------------------------------------------------------+      |
|  | (i) ILLUSTRATIVE Default Rate Card   illustrative              |      |
|  |     Shipped with the calculator. Edit before using in real    |      |
|  |     engagements.                                                |      |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  ENTRIES - Standard 2026 Q1                                                |
|                                                                            |
|  Filter: [Role ▼] [Level ▼] [Geo ▼]   Search: [_____]   [Import CSV]      |
|                                                                            |
|  +------------------------------------------------------------------+      |
|  | Role               | Level    | Geography     | Bill | Cost     |     |
|  +--------------------+----------+---------------+------+----------|     |
|  | Software Engineer  | Associate| US-Onshore    | $145 | $ 92    |     |
|  | Software Engineer  | Pro      | US-Onshore    | $185 | $115    |     |
|  | Software Engineer  | Senior   | US-Onshore    | $245 | $158    |     |
|  | Software Engineer  | Pro      | India-Offshore| $ 65 | $ 38    |     |
|  | ... 344 more ...                                                  |     |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  GEOGRAPHY COVERAGE                                                        |
|  US-Onshore        ████████████  78 entries                                |
|  CA-Onshore        ████          22 entries                                |
|  EU-Onshore        ██████        38 entries                                |
|  LATAM-Nearshore   ████████      62 entries                                |
|  India-Offshore    ████████████  84 entries                                |
|  Philippines-Off.  ██████        45 entries                                |
|                                                                            |
+----------------------------------------------------------------------------+
```

### Rate card edits

Click any cell -> inline edit. Bumping a rate writes an audit entry on the
rate card (rate cards have their own audit history). Changes don't
retroactively affect existing projects - projects snapshot the rate at the
time of resource creation. The user can opt to "refresh from rate card" on
a per-resource basis from the Resource Planner.

### Adding entries

Either inline (`[+ Add row]` at the bottom of the table) or by importing a
CSV. Import has a column-mapping step.

---

## 11b - Cloud Pricing

```
+----------------------------------------------------------------------------+
|                                                                            |
|  CLOUD PRICING TABLES                                                      |
|                                                                            |
|  Provider tabs: [AWS] [Azure] [GCP - phase 2]                              |
|                                                                            |
|  AWS · us-east-1 (default region)            [Switch region ▼] [Import]    |
|                                                                            |
|  +------------------------------------------------------------------+      |
|  | Category    | Service    | SKU         | Unit cost  | Per         |     |
|  +-------------+------------+-------------+------------+-------------|     |
|  | Compute     | EC2        | t3.medium   | $   30.66  | inst-mo     |     |
|  | Compute     | EC2        | m6i.large   | $   71.00  | inst-mo     |     |
|  | Compute     | EC2        | m6i.xlarge  | $  142.00  | inst-mo     |     |
|  | Compute     | EC2        | m6i.xlarge  | $  105.50  | inst-mo (R1)|     |
|  | Compute     | EC2        | m6i.xlarge  | $   80.00  | inst-mo (R3)|     |
|  | Compute     | Lambda     | -           | $    0.20  | M-requests  |     |
|  | Database    | RDS Aurora | db.r6g.large| $  185.00  | inst-mo (R1)|     |
|  | ... 80 more ...                                                    |     |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  +------------------------------------------------------------------+      |
|  | (i) Phase 1: these are illustrative defaults. Edit any cell to  |      |
|  |     override. Phase 2: a "Refresh from AWS API" button replaces |      |
|  |     this table with live pricing.                                |      |
|  +------------------------------------------------------------------+      |
|                                                                            |
|  ENVIRONMENT MULTIPLIERS (defaults for new line items)                     |
|  Dev      [0.30]   Test     [0.40]   Staging [0.60]   Prod [1.00]          |
|                                                                            |
+----------------------------------------------------------------------------+
```

---

## 11c - Role Catalog

```
+----------------------------------------------------------------------------+
|                                                                            |
|  ROLE CATALOG                                              [+ New role]    |
|                                                                            |
|  System roles cannot be deleted. Custom roles can.                         |
|                                                                            |
|  ENGINEERING                                                               |
|  Software Engineer · Front-End Engineer · Back-End Engineer ·              |
|  Full-Stack Engineer · Mobile Engineer · Data Engineer · ML Engineer ·     |
|  Data Scientist · DBA · DevOps Engineer · SRE · Platform Engineer          |
|                                                                            |
|  ARCHITECTURE                                                              |
|  Solution Architect · Application Architect · Enterprise Architect ·       |
|  Cloud Architect · Data Architect · Security Architect ·                   |
|  Technical Lead · Functional Area Lead                                     |
|                                                                            |
|  PRODUCT & DELIVERY                                                        |
|  Product Owner · Scrum Master · Project Manager · Program Manager ·        |
|  Delivery Manager · Engagement Lead                                        |
|                                                                            |
|  ANALYSIS                                                                  |
|  Business Analyst · Functional Consultant                                  |
|                                                                            |
|  QUALITY                                                                   |
|  QA Engineer · Test Lead · Automation Engineer · Performance Tester ·      |
|  Release Manager                                                           |
|                                                                            |
|  DESIGN                                                                    |
|  UX Designer · UI Designer · Content Designer                              |
|                                                                            |
|  SECURITY & COMPLIANCE                                                     |
|  Security Engineer · Compliance Lead                                       |
|                                                                            |
|  CHANGE & SUPPORT                                                          |
|  Operational Change Manager · Organizational Change Manager · Training Lead |
|  Technical Writer · Support L1 · Support L2 · Support L3 · Vendor Manager  |
|                                                                            |
|  CUSTOM ROLES                                                              |
|  (none yet)   [+ Add custom role]                                          |
|                                                                            |
+----------------------------------------------------------------------------+
```

A custom role is just a name + a category. Once added, it appears in the
Resource Planner role picker. Rate cards need entries for the role to be
useful (the system prompts for entries on first use of a custom role).

---

## 11d - Preferences

```
+----------------------------------------------------------------------------+
|                                                                            |
|  PREFERENCES                                                               |
|                                                                            |
|  REGION & UNITS                                                            |
|  Default currency       [USD (v)]                                          |
|  Decimal separator      (•) Period (1,234.56)  ( ) Comma (1.234,56)        |
|  Date format            (•) 2026-05-27   ( ) 5/27/2026  ( ) 27/05/2026     |
|  First day of week      (•) Monday  ( ) Sunday                             |
|                                                                            |
|  CALCULATION DEFAULTS                                                      |
|  Default hours/week     [ 40 ]                                             |
|  Default utilization    [ 85 ]%                                            |
|  Default margin         [ 25 ]%                                            |
|  Default contingency    [ 10 ]%                                            |
|  Default mgmt reserve   [  3 ]%                                            |
|  Weeks per month        [ 4.345 ]   (i) used in burn curve math            |
|                                                                            |
|  GUARDRAIL THRESHOLDS                                                      |
|  Minimum margin         [ 15 ]%                                            |
|  Minimum onshore lead   [ 1 ] FTE per $X cost                              |
|  Max offshore for PCI   [ 30 ]%                                            |
|  Min utilization        [ 70 ]%                                            |
|  Max utilization        [ 95 ]%                                            |
|                                                                            |
|  DISPLAY                                                                   |
|  Theme                  (•) Light  ( ) Dark  ( ) System                    |
|  Density                ( ) Comfortable  (•) Compact                       |
|  Show illustrative warnings  [x]                                           |
|                                                                            |
|  DATA                                                                      |
|  [Export all data as JSON]                                                 |
|  [Import data from JSON]                                                   |
|  [Clear all data] (irreversible)                                           |
|                                                                            |
+----------------------------------------------------------------------------+
```

## States

Settings screens don't have a meaningful empty state - the catalogs and
preferences always have content (defaults shipped with the app). Loading
is rare. Error state for import failures is inline.

## Keyboard

- `g 1` / `g 2` / `g 3` / `g 4` - jump between settings sub-screens
- `/` - focus the search in tables that have one
- `Ctrl+S` - explicit save (most fields save on blur, this is for
  reassurance)
