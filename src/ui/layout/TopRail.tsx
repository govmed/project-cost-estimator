/**
 * TopRail - persistent header.
 *
 * Row 1: project name + version + status pill
 * Row 2: scenario chooser (left) + KPI strip (center) + Export/Audit (right)
 *
 * M6: Export and Audit buttons now navigate to real routes.
 *     Added aria-label to header landmark.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '@/data/store';
import { readAudit } from '@/data/audit-log';
import { StatusPill } from '@/ui/components/StatusPill';
import { KpiStrip } from '@/ui/components/KpiStrip';
import { ScenarioChooser } from './ScenarioChooser';

export function TopRail() {
  const project = useProjectStore((s) => s.project);
  const { projectId } = useParams();
  const navigate = useNavigate();

  if (!project) return null;

  const auditCount = (() => {
    try {
      return readAudit(project.id).length;
    } catch {
      return 0;
    }
  })();

  function goExport() {
    navigate(`/p/${projectId ?? project!.id}/export`);
  }

  function goAudit() {
    navigate(`/p/${projectId ?? project!.id}/audit`);
  }

  return (
    <header aria-label="Application header" className="border-b border-border bg-muted/30">
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
          <NavButton label="Export" onClick={goExport} />
          <NavButton
            label="Audit"
            badge={auditCount > 0 ? Math.min(auditCount, 999) : undefined}
            onClick={goAudit}
          />
        </div>
      </div>
    </header>
  );
}

function NavButton({
  label,
  badge,
  onClick,
}: {
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={badge !== undefined ? `${label} (${badge} entries)` : label}
      className="relative rounded-md border border-border px-3 py-1 text-sm text-muted-fg hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
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
