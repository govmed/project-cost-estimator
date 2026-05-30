/**
 * Routes.
 *
 * /                        -> redirect to the seed project's dashboard
 * /new                     -> NewProjectWizardPage
 * /p/:projectId            -> AppShell with nested screen routes
 *   /dashboard             -> DashboardPage
 *   /resources             -> ResourcePlannerPage
 *   /setup                 -> ProjectSetupPage
 *   /cloud                 -> CloudPlannerPage
 *   /other-costs           -> OtherCostsPlannerPage
 *   /ma-mode               -> MAModePage
 *   /scenarios             -> ScenariosPage
 *   /assumptions           -> AssumptionLedgerPage
 *   /export                -> ExportPage (lazy — heavy deps)
 *   /audit                 -> AuditLogPage
 *
 * Each screen is wrapped in an ErrorBoundary so a single-screen crash
 * does not take down the app. (M6)
 */

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/ui/layout/AppShell';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';
import { ResourcePlannerPage } from '@/ui/pages/ResourcePlannerPage';
import { CloudPlannerPage } from '@/ui/pages/CloudPlannerPage';
import { OtherCostsPlannerPage } from '@/ui/pages/OtherCostsPlannerPage';
import { ProjectSetupPage } from '@/ui/pages/ProjectSetupPage';
import { ScenariosPage } from '@/ui/pages/ScenariosPage';
import { MAModePage } from '@/ui/pages/MAModePage';
import { AssumptionLedgerPage } from '@/ui/pages/AssumptionLedgerPage';
import { AuditLogPage } from '@/ui/pages/AuditLogPage';
import { NewProjectWizardPage } from '@/ui/pages/NewProjectWizardPage';

const DashboardPage = lazy(() =>
  import('@/ui/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);

const ExportPage = lazy(() =>
  import('@/ui/pages/ExportPage').then((m) => ({ default: m.ExportPage })),
);

function ScreenLoader({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-6 text-muted-fg" aria-busy="true">
      Loading {label}…
    </div>
  );
}

const SEED_PROJECT_ID = 'proj_vtx_modernization_2026';

function Guarded({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return <ErrorBoundary screenName={name}>{children}</ErrorBoundary>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/p/${SEED_PROJECT_ID}/dashboard`} replace />} />
      <Route
        path="/new"
        element={
          <Guarded name="New Project">
            <NewProjectWizardPage />
          </Guarded>
        }
      />
      <Route path="/p/:projectId" element={<AppShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Guarded name="Dashboard">
              <Suspense fallback={<ScreenLoader label="dashboard" />}>
                <DashboardPage />
              </Suspense>
            </Guarded>
          }
        />
        <Route
          path="resources"
          element={
            <Guarded name="Resource Planner">
              <ResourcePlannerPage />
            </Guarded>
          }
        />
        <Route
          path="setup"
          element={
            <Guarded name="Project Setup">
              <ProjectSetupPage />
            </Guarded>
          }
        />
        <Route
          path="cloud"
          element={
            <Guarded name="Cloud Planner">
              <CloudPlannerPage />
            </Guarded>
          }
        />
        <Route
          path="other-costs"
          element={
            <Guarded name="Other Costs">
              <OtherCostsPlannerPage />
            </Guarded>
          }
        />
        <Route
          path="ma-mode"
          element={
            <Guarded name="M&A Mode">
              <MAModePage />
            </Guarded>
          }
        />
        <Route
          path="scenarios"
          element={
            <Guarded name="Scenarios">
              <ScenariosPage />
            </Guarded>
          }
        />
        <Route
          path="assumptions"
          element={
            <Guarded name="Assumption Ledger">
              <AssumptionLedgerPage />
            </Guarded>
          }
        />
        <Route
          path="export"
          element={
            <Guarded name="Export Center">
              <Suspense fallback={<ScreenLoader label="export center" />}>
                <ExportPage />
              </Suspense>
            </Guarded>
          }
        />
        <Route
          path="audit"
          element={
            <Guarded name="Audit Log">
              <AuditLogPage />
            </Guarded>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
