/**
 * AuditActionLabel - given an AuditAction, produce:
 *  - a short headline ("Resource added")
 *  - a one-line summary ("Senior Architect, $250/hr")
 *  - a category tag for filtering
 *
 * This avoids per-row JSON dumps; the UI stays readable even with
 * hundreds of entries.
 */

import type { AuditAction } from '@/data/audit-log';

export type AuditCategory =
  | 'resource'
  | 'cloud'
  | 'otherCost'
  | 'project'
  | 'phase'
  | 'scenario'
  | 'ma'
  | 'assumption';

export interface AuditLabel {
  headline: string;
  summary: string;
  category: AuditCategory;
}

export function labelForAuditAction(action: AuditAction): AuditLabel {
  switch (action.kind) {
    // Resources
    case 'resource.allocation.update':
      return {
        headline: 'Resource allocation changed',
        summary: `${action.oldPct}% → ${action.newPct}% (phase ${action.phaseId})`,
        category: 'resource',
      };
    case 'resource.rate.update':
      return {
        headline: `Resource ${action.field} changed`,
        summary: `$${action.oldAmount} → $${action.newAmount}`,
        category: 'resource',
      };
    case 'resource.utilization.update':
      return {
        headline: 'Utilization changed',
        summary: `${action.oldPct}% → ${action.newPct}%`,
        category: 'resource',
      };
    case 'resource.hoursPerWeek.update':
      return {
        headline: 'Hours/week changed',
        summary: `${action.oldHours}h → ${action.newHours}h`,
        category: 'resource',
      };
    case 'resource.name.update':
      return {
        headline: 'Resource renamed',
        summary: `“${action.oldName}” → “${action.newName}”`,
        category: 'resource',
      };
    case 'resource.notes.update':
      return {
        headline: 'Resource notes updated',
        summary: action.newNotes ? action.newNotes.slice(0, 80) : '(cleared)',
        category: 'resource',
      };
    case 'resource.add':
      return {
        headline: 'Resource added',
        summary: action.resource.name || action.resource.role || '(new resource)',
        category: 'resource',
      };
    case 'resource.delete':
      return {
        headline: 'Resource deleted',
        summary: action.resource.name || action.resource.role || '(deleted resource)',
        category: 'resource',
      };
    case 'resource.duplicate':
      return {
        headline: 'Resource duplicated',
        summary: action.resource.name || '(duplicate)',
        category: 'resource',
      };

    // Cloud
    case 'cloud.add':
      return {
        headline: 'Cloud line item added',
        summary: `${action.item.service ?? '(unnamed)'} (${action.item.provider})`,
        category: 'cloud',
      };
    case 'cloud.delete':
      return {
        headline: 'Cloud line item deleted',
        summary: `${action.item.service ?? '(unnamed)'} (${action.item.provider})`,
        category: 'cloud',
      };
    case 'cloud.duplicate':
      return {
        headline: 'Cloud line item duplicated',
        summary: action.item.service ?? '(duplicate)',
        category: 'cloud',
      };
    case 'cloud.field.update':
      return {
        headline: `Cloud ${action.field} changed`,
        summary: `${stringify(action.oldValue)} → ${stringify(action.newValue)}`,
        category: 'cloud',
      };

    // Other costs
    case 'otherCost.add':
      return {
        headline: 'Other-cost line item added',
        summary: `${action.item.name} (${action.item.category})`,
        category: 'otherCost',
      };
    case 'otherCost.delete':
      return {
        headline: 'Other-cost line item deleted',
        summary: `${action.item.name} (${action.item.category})`,
        category: 'otherCost',
      };
    case 'otherCost.duplicate':
      return {
        headline: 'Other-cost line item duplicated',
        summary: action.item.name,
        category: 'otherCost',
      };
    case 'otherCost.field.update':
      return {
        headline: `Other-cost ${action.field} changed`,
        summary: `${stringify(action.oldValue)} → ${stringify(action.newValue)}`,
        category: 'otherCost',
      };

    // Project / phase / FX
    case 'project.field.update':
      return {
        headline: `Project ${action.field} changed`,
        summary: `${stringify(action.oldValue)} → ${stringify(action.newValue)}`,
        category: 'project',
      };
    case 'project.fx.update':
      return {
        headline: `FX rate ${action.currency} changed`,
        summary: `${action.oldRate} → ${action.newRate}`,
        category: 'project',
      };
    case 'phase.add':
      return {
        headline: 'Phase added',
        summary: action.phase.name,
        category: 'phase',
      };
    case 'phase.delete':
      return {
        headline: 'Phase deleted',
        summary: action.phase.name,
        category: 'phase',
      };
    case 'phase.field.update':
      return {
        headline: `Phase ${action.field} changed`,
        summary: `${stringify(action.oldValue)} → ${stringify(action.newValue)}`,
        category: 'phase',
      };

    // Scenario lifecycle
    case 'scenario.clone':
      return {
        headline: 'Scenario cloned',
        summary: action.name,
        category: 'scenario',
      };
    case 'scenario.delete':
      return {
        headline: 'Scenario deleted',
        summary: action.name,
        category: 'scenario',
      };
    case 'scenario.rename':
      return {
        headline: 'Scenario renamed',
        summary: `“${action.oldName}” → “${action.newName}”`,
        category: 'scenario',
      };
    case 'scenario.setBase':
      return {
        headline: 'Base scenario changed',
        summary: 'Promoted to project base',
        category: 'scenario',
      };

    // M&A
    case 'scenario.maData.set':
      return {
        headline: `M&A overlay set: ${action.mode}`,
        summary: 'preview-only math',
        category: 'ma',
      };
    case 'scenario.maData.clear':
      return {
        headline: 'M&A overlay cleared',
        summary: '',
        category: 'ma',
      };

    // Assumptions
    case 'assumption.add': {
      const topic = readField(action.assumption, 'topic') ?? '(new assumption)';
      return {
        headline: 'Assumption added',
        summary: topic,
        category: 'assumption',
      };
    }
    case 'assumption.update':
      return {
        headline: `Assumption ${action.field} changed`,
        summary: `${stringify(action.oldValue)} → ${stringify(action.newValue)}`,
        category: 'assumption',
      };
    case 'assumption.delete': {
      const topic = readField(action.assumption, 'topic') ?? '(deleted)';
      return {
        headline: 'Assumption deleted',
        summary: topic,
        category: 'assumption',
      };
    }
    case 'assumption.review':
      return {
        headline: 'Assumption reviewed',
        summary: '',
        category: 'assumption',
      };

    case 'project.create':
      return {
        headline: 'Project created',
        summary: `${action.name} for ${action.client} (${action.engagementContext}, ${action.engagementType})`,
        category: 'project',
      };

    default: {
      // Exhaustiveness check: if a new action.kind is added this will fail to compile
      const _exhaustive: never = action;
      void _exhaustive;
      return {
        headline: 'Unknown action',
        summary: '',
        category: 'project',
      };
    }
  }
}

function stringify(v: unknown): string {
  if (v === null) return '(null)';
  if (v === undefined) return '(undefined)';
  if (typeof v === 'string') {
    return v.length > 60 ? `“${v.slice(0, 60)}…”` : `“${v}”`;
  }
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return JSON.stringify(v).slice(0, 80);
}

/** Safely read a string field from an unknown payload (audit log entries are
 *  stored as `unknown` to keep the union type flat). */
function readField(payload: unknown, field: string): string | null {
  if (payload && typeof payload === 'object' && field in payload) {
    const v = (payload as Record<string, unknown>)[field];
    return typeof v === 'string' ? v : null;
  }
  return null;
}
