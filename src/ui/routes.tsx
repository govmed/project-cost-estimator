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

import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/ui/layout/AppShell';
import { DashboardPage } from '@/ui/pages/DashboardPage';
import { ResourcePlannerPage } from '@/ui/pages/ResourcePlannerPage';
import { CloudPlannerPage } from '@/ui/pages/CloudPlannerPage';
import { OtherCostsPlannerPage } from '@/ui/pages/OtherCostsPlannerPage';
import { ProjectSetupPage } from '@/ui/pages/ProjectSetupPage';
import { PageStub } from '@/ui/pages/PageStub';

const SEED_PROJECT_ID = 'proj_vtx_modernization_2026';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/p/${SEED_PROJECT_ID}/dashboard`} replace />} />
      <Route path="/p/:projectId" element={<AppShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="resources" element={<ResourcePlannerPage />} />
        <Route path="setup" element={<ProjectSetupPage />} />
        <Route path="cloud" element={<CloudPlannerPage />} />
        <Route path="other-costs" element={<OtherCostsPlannerPage />} />
        <Route
          path="ma-mode"
          element={
            <PageStub
              title="M&A Mode"
              purpose="TSA, carve-out, and integration overlays."
              milestone="M4 (UI) / Phase 2 (math)"
            />
          }
        />
        <Route
          path="scenarios"
          element={
            <PageStub
              title="Scenarios & Compare"
              purpose="Side-by-side comparison of 2-4 scenarios."
              milestone="M4"
            />
          }
        />
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
