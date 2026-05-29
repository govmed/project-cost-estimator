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
        <Route
          path="setup"
          element={
            <PageStub
              title="Project Setup"
              purpose="Define the engagement: type, phases, contingency, FX rates."
              milestone="M3"
            />
          }
        />
        <Route
          path="cloud"
          element={
            <PageStub
              title="Cloud Planner"
              purpose="AWS and Azure line items with pricing model and ramp curve."
              milestone="M3"
            />
          }
        />
        <Route
          path="other-costs"
          element={
            <PageStub
              title="Other Costs"
              purpose="Licenses, hardware, travel, training, subcontractors."
              milestone="M3"
            />
          }
        />
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
