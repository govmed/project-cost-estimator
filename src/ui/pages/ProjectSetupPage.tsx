/**
 * ProjectSetupPage - the project-level settings screen.
 *
 * Sections:
 *  - Identity: name, client, sowReference, version, status, engagement type/context
 *  - Commercials: target margin, discount, contingency, management reserve, base currency (display only)
 *  - Phases: the phase list (editable, add/delete, ordered)
 *  - FX Rates: currency-to-baseCurrency table
 *
 * Each field commits via the store; engine recalculates immediately. The
 * Final Price KPI in the top rail reflects commercials changes live.
 */

import { useProjectStore } from '@/data/store';
import type { ProjectStatus, EngagementType, EngagementContext } from '@/types/project';
import { EditableField } from '@/ui/components/planner/EditableField';
import { EditableSelect } from '@/ui/components/cloud/EditableSelect';
import { PhasesEditor } from '@/ui/components/setup/PhasesEditor';
import { FxRatesEditor } from '@/ui/components/setup/FxRatesEditor';

const STATUSES: readonly ProjectStatus[] = ['draft', 'underReview', 'approved', 'archived'];
const ENGAGEMENT_TYPES: readonly EngagementType[] = [
  'FixedFee',
  'TimeAndMaterials',
  'CappedTM',
  'Milestone',
  'OutcomeBased',
];
const ENGAGEMENT_CONTEXTS: readonly EngagementContext[] = [
  'NewBuild',
  'Migration',
  'Modernization',
  'MAIntegration',
  'MACarveOut',
  'TSA',
  'RunOperate',
];

export function ProjectSetupPage() {
  const project = useProjectStore((s) => s.project);
  const updateProjectField = useProjectStore((s) => s.updateProjectField);

  if (!project) {
    return <div className="px-8 py-12 text-muted-fg">No project loaded.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Project Setup</h1>
        <p className="text-sm text-muted-fg">
          Project-level settings. Edits commit immediately and propagate to all
          scenarios. Commercials changes update the Final Price KPI in real time.
        </p>
      </div>

      {/* Identity */}
      <Section title="Identity" subtitle="Name, client, version, engagement type and context.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EditableField
            label="Project Name"
            value={project.name}
            kind="text"
            onCommit={(v) => updateProjectField({ kind: 'name', value: String(v) })}
          />
          <EditableField
            label="Client"
            value={project.client}
            kind="text"
            onCommit={(v) => updateProjectField({ kind: 'client', value: String(v) })}
          />
          <EditableField
            label="SOW Reference"
            value={project.sowReference ?? ''}
            kind="text"
            onCommit={(v) => updateProjectField({ kind: 'sowReference', value: String(v) })}
          />
          <EditableField
            label="Version"
            value={project.version}
            kind="text"
            onCommit={(v) => updateProjectField({ kind: 'version', value: String(v) })}
          />
          <EditableSelect<ProjectStatus>
            label="Status"
            value={project.status}
            options={STATUSES}
            onCommit={(v) => updateProjectField({ kind: 'status', value: v })}
          />
          <EditableSelect<EngagementType>
            label="Engagement Type"
            value={project.engagementType}
            options={ENGAGEMENT_TYPES}
            onCommit={(v) => updateProjectField({ kind: 'engagementType', value: v })}
          />
          <EditableSelect<EngagementContext>
            label="Engagement Context"
            value={project.engagementContext}
            options={ENGAGEMENT_CONTEXTS}
            onCommit={(v) => updateProjectField({ kind: 'engagementContext', value: v })}
          />
        </div>
      </Section>

      {/* Commercials */}
      <Section
        title="Commercials"
        subtitle="Target margin, discount, contingency, management reserve. These drive Final Price."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <EditableField
            label="Target Margin"
            value={project.targetMarginPct}
            kind="number"
            min={-100}
            max={99}
            suffix="%"
            onCommit={(v) => updateProjectField({ kind: 'targetMarginPct', value: Number(v) })}
          />
          <EditableField
            label="Discount"
            value={project.discountPct}
            kind="number"
            min={0}
            max={100}
            suffix="%"
            onCommit={(v) => updateProjectField({ kind: 'discountPct', value: Number(v) })}
          />
          <EditableField
            label="Contingency"
            value={project.contingencyPct}
            kind="number"
            min={0}
            max={100}
            suffix="%"
            onCommit={(v) => updateProjectField({ kind: 'contingencyPct', value: Number(v) })}
          />
          <EditableField
            label="Management Reserve"
            value={project.managementReservePct}
            kind="number"
            min={0}
            max={100}
            suffix="%"
            onCommit={(v) => updateProjectField({ kind: 'managementReservePct', value: Number(v) })}
          />
        </div>
        <div className="mt-3 text-xs text-muted-fg">
          Base currency: <span className="font-mono">{project.baseCurrency}</span>{' '}
          <span className="text-muted-fg/70">(changing the base currency requires re-establishing all FX rates; not editable here in Phase 1)</span>
        </div>
      </Section>

      {/* Phases */}
      <Section
        title="Phases"
        subtitle="Project timeline. Order and durations drive the engine. Editing here updates every scenario."
      >
        <PhasesEditor phases={project.phases} />
      </Section>

      {/* FX Rates */}
      <Section
        title="FX Rates"
        subtitle={`Foreign exchange rates relative to ${project.baseCurrency}. Used to convert non-${project.baseCurrency} costs.`}
      >
        <FxRatesEditor baseCurrency={project.baseCurrency} fxRates={project.fxRates} />
      </Section>

      <p className="mt-4 text-xs text-muted-fg">
        Every edit creates an audit entry in{' '}
        <span className="font-mono">sow-calc:audit:{project.id}</span>. The Audit Log
        screen lands in M5.
      </p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="mb-3 text-sm text-muted-fg">{subtitle}</p>}
      {children}
    </section>
  );
}
