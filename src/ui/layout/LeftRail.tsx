/**
 * LeftRail - persistent navigation.
 *
 * Lists the nav items, highlights the active route, shows count badges,
 * and collapses to icons-only via a toggle. M&A Mode item only appears
 * when the engagement context calls for it.
 */

import { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { NAV_ITEMS } from './nav-items';

export function LeftRail() {
  const [collapsed, setCollapsed] = useState(false);
  const { projectId } = useParams();
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);

  const activeScenario = selectActiveScenario({ scenarios, activeScenarioId });
  const engagementContext = project?.engagementContext ?? '';

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.visible || item.visible(engagementContext),
  );

  return (
    <nav
      className={clsx(
        'flex flex-col border-r border-border bg-muted/20 transition-all',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <div className="flex-1 py-2">
        {visibleItems.map((item) => {
          const count = item.count ? item.count(activeScenario) : null;
          return (
            <NavLink
              key={item.path}
              to={`/p/${projectId}/${item.path}`}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'border-l-2 border-accent bg-accent/10 font-medium text-foreground'
                    : 'border-l-2 border-transparent text-muted-fg hover:bg-muted hover:text-foreground',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="w-5 text-center text-base leading-none">{item.glyph}</span>
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {count !== null && count !== undefined && (
                    <span className="rounded bg-muted px-1.5 text-xs text-muted-fg">
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="border-t border-border px-4 py-2 text-left text-xs text-muted-fg hover:bg-muted"
      >
        {collapsed ? '»' : '« Collapse'}
      </button>
    </nav>
  );
}
