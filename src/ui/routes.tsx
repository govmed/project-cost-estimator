/**
 * Routes.
 *
 * /                        -> redirect to the seed project's dashboard
 * /p/:projectId           -> AppShell with nested screen routes
 *   /dashboard            -> DashboardPage (real)
 *   /resources            -> ResourcePlannerPage (real, M2a read-only)
 *   /setup ... /audit     -> PageStub placeholders
 *
 * The project is loaded into the store by App.tsx before any /p route renders.
 */

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/ui/layout/AppShell';
import { ResourcePlannerPage } from '@/ui/pages/ResourcePlannerPage';
import { CloudPlannerPage } from '@/ui/pages/CloudPlannerPage';
import { OtherCostsPlannerPage } from '@/ui/pages/OtherCostsPlannerPage';
import { ProjectSetupPage } from '@/ui/pages/ProjectSetupPage';
import { ScenariosPage } from '@/ui/pages/ScenariosPage';
import { MAModePage } from '@/ui/pages/MAModePage';
import { PageStub } from '@/ui/pages/PageStub';

// Lazy-load the Dashboard so Recharts ships in its own chunk and isn't
// pulled in unless the user actually visits /dashboard.
const DashboardPage = lazy(() =>
  import('@/ui/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);

function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-6 text-muted-fg">Loading dashboard…</div>
  );
}

const SEED_PROJECT_ID = 'proj_vtx_modernization_2026';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/p/${SEED_PROJECT_ID}/dashboard`} replace />} />
      <Route path="/p/:projectId" element={<AppShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<DashboardLoading />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route path="resources" element={<ResourcePlannerPage />} />
        <Route path="setup" element={<ProjectSetupPage />} />
        <Route path="cloud" element={<CloudPlannerPage />} />
        <Route path="other-costs" element={<OtherCostsPlannerPage />} />
        <Route path="ma-mode" element={<MAModePage />} />
        <Route path="scenarios" element={<ScenariosPage />} />
        <Route
          path="assumptions"
          element={
            <PageStub
              title="Assumption Ledger"
              purpose="Every assumption with risk, source, and linked entities."
              milestone="M5"
            />
          }
        />
        <Route
          path="export"
          element={
            <PageStub
              title="Export Center"
              purpose="XLSX, CSV, PDF, share link, JSON."
              milestone="M5"
            />
          }
        />
        <Route
          path="audit"
          element={
            <PageStub
              title="Audit Log"
              purpose="Change history, filterable, with before/after diffs."
              milestone="M5"
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
