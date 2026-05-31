/**
 * App — router root + auth gate.
 *
 * B2.b: In oidc mode, shows LoginPage until the user is authenticated.
 * Keeps the token in sync with the storage provider via initStorageToken().
 * In standalone mode, behaviour is identical to Phase 1.
 */

import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useProjectStore } from '@/data/store';
import { initStorageToken } from '@/data/store';
import { setGlobalToken } from '@/data/api-cloud-catalog';
import { loadSeed } from '@/data/seed-loader';
import { AppRoutes } from '@/ui/routes';
import { useAuth } from '@/auth/useAuth';
import { LoginPage } from '@/auth/LoginPage';
import { AUTH_MODE } from '@/auth/oidc-config';

export function App() {
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);

  // Keep the storage provider's token and global API token in sync.
  useEffect(() => {
    if (AUTH_MODE === 'oidc') {
      initStorageToken(accessToken);
      setGlobalToken(accessToken);
    }
  }, [accessToken]);

  // In OIDC mode — show login screen while loading or not authenticated.
  if (AUTH_MODE === 'oidc') {
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-background text-muted-fg">
          Loading…
        </div>
      );
    }
    if (!isAuthenticated) {
      return <LoginPage />;
    }
  }

  // Seed loader — only in standalone mode (backend provides project list in oidc mode).
  if (AUTH_MODE === 'standalone' && !project) {
    const seed = loadSeed();
    setProject(seed.project, seed.scenarios);
  }

  if (!project && AUTH_MODE === 'standalone') {
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
