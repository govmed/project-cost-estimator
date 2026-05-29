/**
 * AppShell - the persistent chrome wrapper.
 *
 * Layout:
 *   +---------------------------------------+
 *   |             TopRail                   |
 *   +--------+------------------------------+
 *   | Left   |                              |
 *   | Rail   |   <Outlet /> (current page)  |
 *   |        |                              |
 *   +--------+------------------------------+
 *
 * The right rail (defensibility panel) comes in M1c.
 */

import { Outlet } from 'react-router-dom';
import { TopRail } from './TopRail';
import { LeftRail } from './LeftRail';

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopRail />
      <div className="flex flex-1 overflow-hidden">
        <LeftRail />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
