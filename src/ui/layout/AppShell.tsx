/**
 * AppShell - the persistent chrome wrapper.
 *
 * M6: Added aria-label to main landmark.
 */

import { Outlet } from 'react-router-dom';
import { TopRail } from './TopRail';
import { LeftRail } from './LeftRail';
import { GlobalDefensibilityDrawer } from '@/ui/components/defensibility/GlobalDefensibilityDrawer';

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopRail />
      <div className="flex flex-1 overflow-hidden">
        <LeftRail />
        <main
          id="main-content"
          aria-label="Main content"
          className="flex-1 overflow-auto"
        >
          <Outlet />
        </main>
      </div>
      <GlobalDefensibilityDrawer />
    </div>
  );
}
