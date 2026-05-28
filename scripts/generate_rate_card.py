"""
Rate card generator.

Produces a consistent, principled rate card JSON from:
  1. Base rates per (skillLevel, geography) - the floor for a "generic" role
  2. Role multipliers - how this role compares to the base
  3. Level availability per role - some roles don't exist at all levels

The result is internally consistent (a Senior Cloud Architect always
costs more than a Pro Cloud Architect) and easy to refresh by editing
the inputs at the top of this script.

This script is committed alongside the JSON so future updates are
auditable.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

# -----------------------------------------------------------------------------
# BASE RATES per (skillLevel, geography) - bill rate per hour, USD.
# These are mid-points of typical industry ranges for a generic "Software
# Engineer" role. Other roles scale relative to this via role_multiplier.
#
# Source: composite of publicly available Q1-2026 industry surveys
# (illustrative midpoints, not market quotes for any specific firm).
# -----------------------------------------------------------------------------
BASE_BILL_RATES = {
    # (level, geography): bill rate per hour
    ("Associate", "US-Onshore"):           150,
    ("Professional", "US-Onshore"):        195,
    ("Senior", "US-Onshore"):              255,
    ("Advisor", "US-Onshore"):             325,
    ("Principal", "US-Onshore"):           400,

    ("Associate", "CA-Onshore"):           140,
    ("Professional", "CA-Onshore"):        180,
    ("Senior", "CA-Onshore"):              235,
    ("Advisor", "CA-Onshore"):             300,
    ("Principal", "CA-Onshore"):           370,

    ("Associate", "EU-Onshore"):           155,
    ("Professional", "EU-Onshore"):        200,
    ("Senior", "EU-Onshore"):              260,
    ("Advisor", "EU-Onshore"):             330,
    ("Principal", "EU-Onshore"):           405,

    ("Associate", "UK-Onshore"):           160,
    ("Professional", "UK-Onshore"):        205,
    ("Senior", "UK-Onshore"):              265,
    ("Advisor", "UK-Onshore"):             335,
    ("Principal", "UK-Onshore"):           410,

    ("Associate", "LATAM-Nearshore"):       90,
    ("Professional", "LATAM-Nearshore"):   125,
    ("Senior", "LATAM-Nearshore"):         160,
    ("Advisor", "LATAM-Nearshore"):        205,
    ("Principal", "LATAM-Nearshore"):      255,

    ("Associate", "EE-Nearshore"):          95,
    ("Professional", "EE-Nearshore"):      130,
    ("Senior", "EE-Nearshore"):            165,
    ("Advisor", "EE-Nearshore"):           210,
    ("Principal", "EE-Nearshore"):         260,

    ("Associate", "India-Offshore"):        50,
    ("Professional", "India-Offshore"):     70,
    ("Senior", "India-Offshore"):           95,
    ("Advisor", "India-Offshore"):         130,
    ("Principal", "India-Offshore"):       170,

    ("Associate", "Philippines-Offshore"):  45,
    ("Professional", "Philippines-Offshore"): 65,
    ("Senior", "Philippines-Offshore"):     85,
    ("Advisor", "Philippines-Offshore"):   115,
    ("Principal", "Philippines-Offshore"): 150,

    ("Associate", "Vietnam-Offshore"):      45,
    ("Professional", "Vietnam-Offshore"):   62,
    ("Senior", "Vietnam-Offshore"):         82,
    ("Advisor", "Vietnam-Offshore"):       110,
    ("Principal", "Vietnam-Offshore"):     145,
}

# -----------------------------------------------------------------------------
# COST-TO-BILL RATIO per geography.
# Internal cost rate as a fraction of bill rate.
# Offshore tends to have tighter margins (higher cost ratio) because the
# absolute rates are lower so overhead dominates.
# -----------------------------------------------------------------------------
COST_RATIO = {
    "US-Onshore":            0.62,
    "CA-Onshore":            0.63,
    "EU-Onshore":            0.62,
    "UK-Onshore":            0.62,
    "LATAM-Nearshore":       0.60,
    "EE-Nearshore":          0.60,
    "India-Offshore":        0.58,
    "Philippines-Offshore":  0.58,
    "Vietnam-Offshore":      0.58,
}

# -----------------------------------------------------------------------------
# ROLE MULTIPLIERS - how each role's rate scales vs. the base "Software
# Engineer". 1.00 means same as base. > 1.0 = premium, < 1.0 = discount.
# -----------------------------------------------------------------------------
ROLE_MULTIPLIERS = {
    # Engineering (base = 1.00)
    "Software Engineer":           1.00,
    "Front-End Engineer":          1.00,
    "Back-End Engineer":           1.00,
    "Full-Stack Engineer":         1.02,  # slight premium for breadth
    "Mobile Engineer":             1.05,
    "Data Engineer":               1.08,
    "ML Engineer":                 1.20,
    "Data Scientist":              1.15,
    "DBA":                         1.05,
    "DevOps Engineer":             1.08,
    "SRE":                         1.12,
    "Platform Engineer":           1.10,

    # Architecture (premium)
    "Solution Architect":          1.30,
    "Application Architect":       1.25,
    "Enterprise Architect":        1.40,
    "Cloud Architect":             1.30,
    "Data Architect":              1.28,
    "Security Architect":          1.35,
    "Technical Lead":              1.15,
    "Functional Area Lead":        1.15,

    # Product & Delivery
    "Product Owner":               1.10,
    "Scrum Master":                1.00,
    "Project Manager":             1.10,
    "Program Manager":             1.25,
    "Delivery Manager":            1.20,
    "Engagement Lead":             1.35,

    # Analysis
    "Business Analyst":            0.85,
    "Functional Consultant":       1.00,

    # Quality
    "QA Engineer":                 0.75,
    "Test Lead":                   1.00,
    "Automation Engineer":         0.95,
    "Performance Tester":          1.00,
    "Release Manager":             1.05,

    # Design
    "UX Designer":                 1.00,
    "UI Designer":                 0.95,
    "Content Designer":            0.85,

    # Security & Compliance (premium)
    "Security Engineer":           1.20,
    "Compliance Lead":             1.15,

    # Change & Support
    "Operational Change Manager":  1.15,
    "Organizational Change Manager": 1.20,
    "Training Lead":               0.95,
    "Technical Writer":            0.75,
    "Support L1":                  0.55,
    "Support L2":                  0.70,
    "Support L3":                  0.90,
    "Vendor Manager":              1.05,
}

# -----------------------------------------------------------------------------
# LEVEL AVAILABILITY - which (role, level) combinations exist.
# Not every role makes sense at every level. Support L1 doesn't have a
# Principal; Engagement Lead doesn't have an Associate.
# -----------------------------------------------------------------------------
# Default: all 5 levels for all roles. Below are the exceptions.
ROLE_LEVEL_EXCLUSIONS = {
    "Engagement Lead":      ["Associate"],
    "Enterprise Architect": ["Associate", "Professional"],
    "Program Manager":      ["Associate"],
    "Compliance Lead":      ["Associate"],
    "Support L1":           ["Advisor", "Principal"],
    "Support L2":           ["Principal"],
    "Solution Architect":   ["Associate"],
    "Cloud Architect":      ["Associate"],
    "Data Architect":       ["Associate"],
    "Security Architect":   ["Associate"],
    "Application Architect": ["Associate"],
}

ALL_LEVELS = ["Associate", "Professional", "Senior", "Advisor", "Principal"]
ALL_GEOGRAPHIES = list(COST_RATIO.keys())


def round_to_nearest_5(x: float) -> int:
    """Round to nearest $5 - matches how real rate cards are published."""
    return int(round(x / 5) * 5)


def generate_entries():
    entries = []
    for role, mult in ROLE_MULTIPLIERS.items():
        excluded_levels = ROLE_LEVEL_EXCLUSIONS.get(role, [])
        for level in ALL_LEVELS:
            if level in excluded_levels:
                continue
            for geo in ALL_GEOGRAPHIES:
                base_bill = BASE_BILL_RATES[(level, geo)]
                bill = round_to_nearest_5(base_bill * mult)
                cost = round_to_nearest_5(bill * COST_RATIO[geo])
                entries.append({
                    "role": role,
                    "skillLevel": level,
                    "geography": geo,
                    "billRate":          {"amount": bill, "currency": "USD"},
                    "internalCostRate":  {"amount": cost, "currency": "USD"},
                })
    return entries


def main():
    entries = generate_entries()
    rate_card = {
        "_comment": (
            "ILLUSTRATIVE RATE CARD. Numbers are derived from publicly available "
            "industry survey midpoints and a principled role-multiplier model. "
            "They are NOT market quotes for any specific firm or engagement. "
            "EDIT BEFORE USE in any real SOW. See docs/06-seed-data.md for "
            "methodology and refresh strategy."
        ),
        "_modelVersion": "1.0",
        "_generatedAt": datetime.now(timezone.utc).isoformat(),
        "id": "rc_standard_2026_q1",
        "name": "Standard 2026 Q1 (Illustrative)",
        "version": "1.0.0",
        "description": (
            "Foundation rate card covering 45 roles x 5 levels x 9 geographies. "
            "Generated from base-rate table and role-multiplier model. "
            f"Total entries: {len(entries)}."
        ),
        "ownerOrgId": "org_demo",
        "effectiveFrom": "2026-01-01",
        "isIllustrative": True,
        "entries": entries,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    out = Path("seed/rate-cards/standard-2026-q1.json")
    out.write_text(json.dumps(rate_card, indent=2), encoding="utf-8")

    # Summary
    print(f"Wrote {out}")
    print(f"  Entries: {len(entries)}")
    print(f"  Roles:   {len(ROLE_MULTIPLIERS)}")
    print(f"  Levels:  {len(ALL_LEVELS)}")
    print(f"  Geos:    {len(ALL_GEOGRAPHIES)}")
    print(f"  Size:    {out.stat().st_size:,} bytes")

    # Quick spot checks
    print("\n  Spot checks:")
    sample_pairs = [
        ("Software Engineer", "Senior", "US-Onshore"),
        ("Software Engineer", "Senior", "India-Offshore"),
        ("Cloud Architect", "Advisor", "US-Onshore"),
        ("Support L1", "Associate", "Philippines-Offshore"),
        ("Engagement Lead", "Principal", "US-Onshore"),
    ]
    for r, l, g in sample_pairs:
        match = next((e for e in entries if e["role"] == r and e["skillLevel"] == l and e["geography"] == g), None)
        if match:
            print(f"    {r:30s} {l:14s} {g:22s}  bill ${match['billRate']['amount']:>4d}  cost ${match['internalCostRate']['amount']:>4d}")


if __name__ == "__main__":
    main()
