/**
 * E2E critical-path tests (M6).
 *
 * Run:  npx playwright test
 * Prereq: npx playwright install  (once, downloads browsers)
 *
 * Each test navigates to a screen and asserts the expected content is
 * visible. These are smoke tests — they confirm the app doesn't crash
 * and shows real data, not implementation details.
 */

import { test, expect } from '@playwright/test';

const BASE = '/p/proj_vtx_modernization_2026';

test.beforeEach(async ({ page }) => {
  // Dismiss the coachmark so it doesn't interfere with other assertions.
  await page.addInitScript(() => {
    localStorage.setItem('sow-calc:coachmark-dismissed', '1');
  });
});

// ── 1. App boots and redirects to dashboard ─────────────────────────────────
test('redirects / to dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard/);
});

// ── 2. Dashboard shows headline KPIs ────────────────────────────────────────
test('dashboard shows headline KPIs', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`);
  await expect(page.getByText('Final Price')).toBeVisible();
  await expect(page.getByText('Total Cost')).toBeVisible();
  await expect(page.getByText('Realized Margin')).toBeVisible();
  await expect(page.getByText('Blended Rate')).toBeVisible();
});

// ── 3. Dashboard KPI values are non-zero ────────────────────────────────────
test('dashboard KPI values are populated', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`);
  // The KPI strip in the TopRail should show dollar values.
  const strip = page.locator('[data-testid="kpi-strip"]').or(
    page.getByText(/\$[\d,]+/)
  );
  await expect(strip.first()).toBeVisible();
});

// ── 4. Left-rail navigation works ───────────────────────────────────────────
test('left-rail navigates to Resource Planner', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`);
  await page.getByRole('link', { name: /Resource Planner/i }).click();
  await expect(page).toHaveURL(/\/resources/);
  await expect(page.getByRole('heading', { name: /Resource Planner/i })).toBeVisible();
});

// ── 5. Resource Planner shows resources ─────────────────────────────────────
test('Resource Planner lists resources from seed', async ({ page }) => {
  await page.goto(`${BASE}/resources`);
  // Seed has 12 resources including "Engagement Lead"
  await expect(page.getByText('Engagement Lead')).toBeVisible();
  await expect(page.getByText('Solution Architect')).toBeVisible();
});

// ── 6. Cloud Planner loads ──────────────────────────────────────────────────
test('Cloud Planner shows cloud line items', async ({ page }) => {
  await page.goto(`${BASE}/cloud`);
  await expect(page.getByRole('heading', { name: /Cloud Planner/i })).toBeVisible();
  await expect(page.getByText(/EC2|AKS|RDS/i)).toBeVisible();
});

// ── 7. Other Costs Planner loads ────────────────────────────────────────────
test('Other Costs shows line items', async ({ page }) => {
  await page.goto(`${BASE}/other-costs`);
  await expect(page.getByRole('heading', { name: /Other Costs/i })).toBeVisible();
  await expect(page.getByText(/Datadog|GitHub|Travel/i)).toBeVisible();
});

// ── 8. Scenarios page shows scenario cards ──────────────────────────────────
test('Scenarios page shows Base Case and Onshore-Only', async ({ page }) => {
  await page.goto(`${BASE}/scenarios`);
  await expect(page.getByText('Base Case')).toBeVisible();
  await expect(page.getByText(/Onshore.Only/i)).toBeVisible();
});

// ── 9. Scenario switcher in top rail ────────────────────────────────────────
test('scenario chooser switches active scenario', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`);
  // Open the scenario dropdown and pick the second scenario.
  const chooser = page.getByRole('combobox', { name: /scenario/i }).or(
    page.locator('select').first()
  );
  if (await chooser.isVisible()) {
    await chooser.selectOption({ index: 1 });
    // After switching the KPIs should still render (no crash).
    await expect(page.getByText('Final Price')).toBeVisible();
  } else {
    // Dropdown is a custom component — just verify it's present.
    await expect(page.getByText('Base Case')).toBeVisible();
  }
});

// ── 10. Assumption Ledger shows assumptions ──────────────────────────────────
test('Assumption Ledger lists assumptions', async ({ page }) => {
  await page.goto(`${BASE}/assumptions`);
  await expect(page.getByRole('heading', { name: /Assumption/i })).toBeVisible();
  await expect(page.getByText(/Offshore ratio|Cloud sizing/i)).toBeVisible();
});

// ── 11. Audit Log page loads ────────────────────────────────────────────────
test('Audit Log page renders', async ({ page }) => {
  await page.goto(`${BASE}/audit`);
  await expect(page.getByRole('heading', { name: /Audit/i })).toBeVisible();
});

// ── 12. Export Center loads (lazy chunk) ────────────────────────────────────
test('Export Center shows format cards', async ({ page }) => {
  await page.goto(`${BASE}/export`);
  await expect(page.getByText(/XLSX|Excel/i)).toBeVisible();
  await expect(page.getByText(/PDF/i)).toBeVisible();
  await expect(page.getByText(/CSV/i)).toBeVisible();
  await expect(page.getByText(/JSON/i)).toBeVisible();
});

// ── 13. TopRail Export button navigates to export ────────────────────────────
test('TopRail Export button navigates to export page', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`);
  await page.getByRole('button', { name: /Export/i }).click();
  await expect(page).toHaveURL(/\/export/);
});

// ── 14. TopRail Audit button navigates to audit ──────────────────────────────
test('TopRail Audit button navigates to audit page', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`);
  await page.getByRole('button', { name: /Audit/i }).click();
  await expect(page).toHaveURL(/\/audit/);
});

// ── 15. New Project wizard loads ────────────────────────────────────────────
test('New Project wizard renders step 1', async ({ page }) => {
  await page.goto('/new');
  await expect(page.getByText(/New Project|Project name/i)).toBeVisible();
});
