/**
 * RateCard — a versioned table of bill rates and internal costs.
 *
 * Rate cards are external to any specific project — they're the
 * organization's price list. A Resource is created by:
 *   1. Picking a role + level + geography
 *   2. The system looks up the matching RateCardEntry
 *   3. The entry's rates become the Resource's defaults
 *   4. The user can override per-resource without affecting the rate card
 *
 * Multiple rate cards can coexist (e.g., "Standard 2026 Q1", "Federal 2026").
 * Projects record which rate card was used as a snapshot for auditability.
 */

import { RateCardId, OrgId } from './ids';
import { Role, SkillLevel, Geography } from './resource';
import { Money } from './money';

export interface RateCardEntry {
  role: Role;
  skillLevel: SkillLevel;
  geography: Geography;
  /** Per-hour bill rate the client sees. */
  billRate: Money;
  /** Per-hour internal cost. Used for margin calculation. */
  internalCostRate: Money;
  /** Optional - notes for this specific combination (e.g., "rare skill premium"). */
  notes?: string;
}

export interface RateCard {
  readonly id: RateCardId;
  name: string;
  /** Semver. Bump for any change. */
  version: string;
  description?: string;

  ownerOrgId: OrgId;

  /** Effective date range. effectiveTo undefined = current. */
  effectiveFrom: string;          // ISO date
  effectiveTo?: string;

  entries: RateCardEntry[];

  /** If true, this card is marked as ILLUSTRATIVE and warns on use. */
  isIllustrative: boolean;

  createdAt: string;
  updatedAt: string;
}
