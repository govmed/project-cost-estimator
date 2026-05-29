/**
 * Defensibility panel - additional surfaces (M5d-2).
 *
 * M5d-1 wired Dashboard Final Price + Resource Bill.
 * M5d-2 adds:
 *   - Dashboard's other 3 KPI tiles (Total Cost, Realized Margin, Blended Rate)
 *   - Top-rail KpiStrip (4 KPIs)
 *   - Compare grid card metric rows (Final Price, Total Cost, Realized Margin)
 *
 * Architecture refactor: drawer mounted once in AppShell, state lives in
 * useDefensibilityStore. The drawer's data-testid is still
 * `defensibility-drawer` (set when rendering), so M5d-1 tests pass through
 * unchanged.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';
import { useDefensibilityStore } from '../../src/data/defensibility-store';
import type { ProjectId } from '../../src/types/ids';

const PROJECT_ID = 'proj_vtx_modernization_2026' as ProjectId;

function resetAll() {
  useProjectStore.getState().reset();
  useDefensibilityStore.getState().close();
  if (typeof localStorage !== 'undefined') localStorage.clear();
}

describe('Defensibility - Dashboard remaining KPI tiles (M5d-2)', () => {
  beforeEach(() => {
    resetAll();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/dashboard`);
  });
  afterEach(() => cleanup());

  it('Total Cost tile opens drawer with Total Cost provenance', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: 'Dashboard', level: 1 }),
    );
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Total Cost/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(
      within(drawer).getByRole('heading', { name: 'Total Cost' }),
    ).toBeInTheDocument();
    expect(within(drawer).getAllByText('$1,777,427').length).toBeGreaterThanOrEqual(1);
  });

  it('Realized Margin tile opens drawer with margin provenance', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Realized Margin/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(
      within(drawer).getByRole('heading', { name: 'Realized Margin' }),
    ).toBeInTheDocument();
    // 25.0% from the seed
    expect(within(drawer).getAllByText('25.0%').length).toBeGreaterThanOrEqual(1);
  });

  it('Blended Rate tile opens drawer with blended-rate provenance', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Blended Rate/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(
      within(drawer).getByRole('heading', { name: 'Effective Blended Rate' }),
    ).toBeInTheDocument();
    expect(within(drawer).getByText('Total billable hours')).toBeInTheDocument();
  });
});

describe('Defensibility - Top-rail KpiStrip (M5d-2)', () => {
  beforeEach(() => {
    resetAll();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/dashboard`);
  });
  afterEach(() => cleanup());

  it('top-rail Price KPI opens Final Price drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for top-rail Price/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(
      within(drawer).getByRole('heading', { name: 'Final Price' }),
    ).toBeInTheDocument();
  });

  it('top-rail Margin KPI opens margin drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for top-rail Margin/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(
      within(drawer).getByRole('heading', { name: 'Realized Margin' }),
    ).toBeInTheDocument();
  });

  it('top-rail KPIs are available on a non-dashboard route', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/resources`);
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: /Resource Planner/i, level: 1 }),
    );
    // Top-rail KPI button still works
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for top-rail Price/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(
      within(drawer).getByRole('heading', { name: 'Final Price' }),
    ).toBeInTheDocument();
  });
});

describe('Defensibility - Compare grid (M5d-2)', () => {
  beforeEach(() => {
    resetAll();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/scenarios`);
  });
  afterEach(() => cleanup());

  it('Compare card Final Price opens drawer for that scenario', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
    );

    // Tick both scenarios into the compare grid
    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
      if (!(cb as HTMLInputElement).checked) {
        await user.click(cb);
      }
    }

    // After ticking, Compare cards render. Find the "Show defensibility for Final Price"
    // buttons - there are two (one per scenario card).
    const finalPriceButtons = await waitFor(() => {
      const btns = screen.getAllByRole('button', {
        name: /Show defensibility for Final Price/i,
      });
      expect(btns.length).toBeGreaterThanOrEqual(2);
      return btns;
    });

    // Click the Onshore-Only card's Final Price (it's the second card; baseline is first)
    await user.click(finalPriceButtons[1]);

    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(
      within(drawer).getByRole('heading', { name: 'Final Price' }),
    ).toBeInTheDocument();
    // Onshore-Only price (M5c populated): $3,402,535
    expect(within(drawer).getAllByText('$3,402,535').length).toBeGreaterThanOrEqual(1);
  });

  it('Compare card Total Cost opens drawer with Total Cost provenance', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
    );

    // Tick all scenarios
    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
      if (!(cb as HTMLInputElement).checked) {
        await user.click(cb);
      }
    }

    const totalCostButtons = await waitFor(() => {
      const btns = screen.getAllByRole('button', {
        name: /Show defensibility for Total Cost/i,
      });
      expect(btns.length).toBeGreaterThanOrEqual(2);
      return btns;
    });

    await user.click(totalCostButtons[0]);
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(
      within(drawer).getByRole('heading', { name: 'Total Cost' }),
    ).toBeInTheDocument();
  });
});

describe('Defensibility - drawer survives navigation (M5d-2)', () => {
  beforeEach(() => {
    resetAll();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/dashboard`);
  });
  afterEach(() => cleanup());

  it('drawer state lives in store; opening from one page and clicking a link to another keeps the drawer mountable from there', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));

    // Open from Dashboard
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));

    // Click the Resources input link - navigates and closes
    await user.click(within(drawer).getByRole('button', { name: /^Resources/ }));
    await waitFor(() => {
      expect(screen.queryByTestId('defensibility-drawer')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /Resource Planner/i, level: 1 }),
      ).toBeInTheDocument();
    });

    // From Resource Planner, top-rail KPI still works (drawer mounted in AppShell)
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for top-rail Price/i }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('defensibility-drawer')).toBeInTheDocument(),
    );
  });
});
