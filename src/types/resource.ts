/**
 * Resource — a person or fractional headcount allocated to the project.
 *
 * A Resource is always scoped to a Scenario (not to the Project directly).
 * This is why scenario cloning is cheap: copy the resources array, mutate
 * one rate or allocation, and you've forked the cost model.
 */

import { ResourceId, ScenarioId, PhaseId } from './ids';
import { Money } from './money';

/** Skill level / seniority bands. Each gets its own bill rate. */
export type SkillLevel =
  | 'Associate'      // 0-3 years
  | 'Professional'   // 3-7 years
  | 'Senior'         // 7-12 years
  | 'Advisor'        // 12+ years, specialist
  | 'Principal';     // executive-tier, partner-track

/** Sourcing geography. Drives rate card lookup. */
export type Geography =
  | 'US-Onshore'
  | 'CA-Onshore'
  | 'EU-Onshore'
  | 'UK-Onshore'
  | 'LATAM-Nearshore'
  | 'EE-Nearshore'      // Eastern Europe
  | 'India-Offshore'
  | 'Philippines-Offshore'
  | 'Vietnam-Offshore';

/**
 * Role catalog — the canonical list. New roles can be added; this is a const
 * array so we can derive a type from it.
 */
export const ROLE_CATALOG = [
  // Engineering
  'Software Engineer',
  'Front-End Engineer',
  'Back-End Engineer',
  'Full-Stack Engineer',
  'Mobile Engineer',
  'Data Engineer',
  'ML Engineer',
  'Data Scientist',
  'DBA',
  'DevOps Engineer',
  'SRE',
  'Platform Engineer',
  // Architecture
  'Solution Architect',
  'Application Architect',
  'Enterprise Architect',
  'Cloud Architect',
  'Data Architect',
  'Security Architect',
  'Technical Lead',
  'Functional Area Lead',
  // Product & Delivery
  'Product Owner',
  'Scrum Master',
  'Project Manager',
  'Program Manager',
  'Delivery Manager',
  'Engagement Lead',
  // Analysis
  'Business Analyst',
  'Functional Consultant',
  // Quality
  'QA Engineer',
  'Test Lead',
  'Automation Engineer',
  'Performance Tester',
  'Release Manager',
  // Design
  'UX Designer',
  'UI Designer',
  'Content Designer',
  // Security & Compliance
  'Security Engineer',
  'Compliance Lead',
  // Change & Support
  'Operational Change Manager',
  'Organizational Change Manager',
  'Training Lead',
  'Technical Writer',
  'Support L1',
  'Support L2',
  'Support L3',
  'Vendor Manager',
] as const;

export type Role = (typeof ROLE_CATALOG)[number];

/**
 * Per-phase allocation override. If `allocations` is empty on a Resource,
 * the resource is allocated uniformly across all phases at `defaultAllocationPct`.
 */
export interface ResourceAllocation {
  phaseId: PhaseId;
  allocationPct: number;           // 0-100
}

export interface Resource {
  readonly id: ResourceId;
  scenarioId: ScenarioId;

  role: Role;
  skillLevel: SkillLevel;
  geography: Geography;

  /** Default allocation if `allocations` is empty. 0-100. */
  defaultAllocationPct: number;

  /** Optional per-phase overrides. Empty = uniform across all phases. */
  allocations: ResourceAllocation[];

  /** Bill rate per hour. Loaded from rate card, overridable inline. */
  billRate: Money;
  /** Internal cost rate per hour. Used for margin calculation. */
  internalCostRate: Money;

  /** Assumed billable hours per week. Default 40, often 36 with utilization. */
  hoursPerWeek: number;
  /** Utilization assumption, 0-100. Default 80. */
  utilizationPct: number;

  /** Optional - name a specific person, or leave for generic "an X". */
  name?: string;
  notes?: string;

  /** Set to true if the bill rate has been edited away from rate-card default. */
  billRateOverridden: boolean;
}
