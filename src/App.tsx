/**
 * App - the router root.
 *
 * Responsibilities:
 *  - Load the seed project into the store on first mount (if empty)
 *  - Wrap everything in BrowserRouter
 *  - Render the route tree
 *
 * The actual screens and chrome live under AppShell (see routes.tsx).
 */

import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useProjectStore } from '@/data/store';
import { loadSeed } from '@/data/seed-loader';
import { AppRoutes } from '@/ui/routes';

export function App() {
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);

  useEffect(() => {
    if (!project) {
      const seed = loadSeed();
      setProject(seed.project, seed.scenarios);
    }
  }, [project, setProject]);

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-fg">
        Loading…
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  );
}
