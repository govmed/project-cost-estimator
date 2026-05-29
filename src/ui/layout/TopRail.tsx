/**
 * TopRail - persistent header.
 *
 * Row 1: project name + version + status pill
 * Row 2: scenario chooser (left) + KPI strip (center) + Export/Audit (right)
 *
 * M1b renders Export/Audit as visual stubs (no behavior yet).
 */

import { useProjectStore } from '@/data/store';
import { StatusPill } from '@/ui/components/StatusPill';
import { KpiStrip } from '@/ui/components/KpiStrip';
import { ScenarioChooser } from './ScenarioChooser';

export function TopRail() {
  const project = useProjectStore((s) => s.project);
  if (!project) return null;

  return (
    <header className="border-b border-border bg-muted/30">
      {/* Row 1 */}
      <div className="flex items-center justify-between px-6 py-2.5">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">{project.name}</span>
          <span className="text-xs text-muted-fg">v{project.version}</span>
          <StatusPill status={project.status} />
        </div>
        <div className="text-xs text-muted-fg">{project.client}</div>
      </div>

      {/* Row 2 */}
      <div className="flex items-center justify-between border-t border-border/60 px-6 py-2">
        <ScenarioChooser />
        <KpiStrip />
        <div className="flex items-center gap-2">
          <StubButton label="Export" />
          <StubButton label="Audit" badge={3} />
        </div>
      </div>
    </header>
  );
}

function StubButton({ label, badge }: { label: string; badge?: number }) {
  return (
    <button
      type="button"
      className="relative rounded-md border border-border px-3 py-1 text-sm text-muted-fg hover:bg-muted disabled:opacity-60"
      title={`${label} (coming in a later milestone)`}
    >
      {label}
      {badge !== undefined && (
        <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">
          {badge}
        </span>
      )}
    </button>
  );
}
