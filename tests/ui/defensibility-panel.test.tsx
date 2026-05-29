/**
 * Defensibility panel tests (M5d-1).
 *
 * Two surfaces wired in M5d-1:
 *   - Dashboard's Final Price tile
 *   - Resource Planner's Bill column cell (per-resource billed)
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';
import type { ProjectId } from '../../src/types/ids';

const PROJECT_ID = 'proj_vtx_modernization_2026' as ProjectId;

describe('DefensibilityDrawer - Dashboard Final Price (M5d-1)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/dashboard`);
  });

  afterEach(() => cleanup());

  it('Final Price tile is rendered as a clickable button', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    ).toBeInTheDocument();
  });

  it('clicking Final Price opens the drawer with the right title and value', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: 'Dashboard', level: 1 }),
    );

    expect(screen.queryByTestId('defensibility-drawer')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('defensibility-drawer')).toBeInTheDocument(),
    );
    const drawer = screen.getByTestId('defensibility-drawer');
    expect(within(drawer).getByRole('heading', { name: 'Final Price' })).toBeInTheDocument();
    // $2,369,903 appears in the hero AND in the highlighted last math row.
    // Both are correct - just assert at least one.
    expect(within(drawer).getAllByText('$2,369,903').length).toBeGreaterThanOrEqual(1);
  });

  it('drawer shows the math section with formula rows', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));

    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));

    // Headings within the math section
    expect(within(drawer).getByText('Math')).toBeInTheDocument();
    expect(within(drawer).getByText('Resources subtotal')).toBeInTheDocument();
    expect(within(drawer).getByText('Cloud subtotal')).toBeInTheDocument();
    expect(within(drawer).getByText('Other costs subtotal')).toBeInTheDocument();
    expect(within(drawer).getByText('Base cost')).toBeInTheDocument();
    // "Contingency (8%)" appears in math row label AND maybe inputs detail
    expect(within(drawer).getAllByText(/Contingency/).length).toBeGreaterThanOrEqual(1);
    expect(within(drawer).getAllByText(/Management reserve/).length).toBeGreaterThanOrEqual(1);
    expect(within(drawer).getByText('Total cost')).toBeInTheDocument();
  });

  it('drawer shows the assumptions section with seed assumptions', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));

    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));

    // Seed Base Case has 4 assumptions
    expect(within(drawer).getByText(/Assumptions \(4\)/)).toBeInTheDocument();
    expect(within(drawer).getByText('Offshore ratio')).toBeInTheDocument();
  });

  it('drawer shows the source inputs as navigable links', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));

    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));

    expect(within(drawer).getByText('Source inputs')).toBeInTheDocument();
    // Each input row should be a button (navigable)
    expect(within(drawer).getByRole('button', { name: /Resources/ })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: /Cloud/ })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: /Other costs/ })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: /Pricing levers/ })).toBeInTheDocument();
  });

  it('clicking an input link navigates and closes the drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));

    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    const link = within(drawer).getByRole('button', { name: /Resources/ });
    await user.click(link);

    await waitFor(() => {
      expect(screen.queryByTestId('defensibility-drawer')).not.toBeInTheDocument();
      // Now on Resource Planner page
      expect(
        screen.getByRole('heading', { name: /Resource Planner/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('Escape key closes the drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));

    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );
    await waitFor(() => screen.getByTestId('defensibility-drawer'));

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByTestId('defensibility-drawer')).not.toBeInTheDocument(),
    );
  });

  it('close button closes the drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));

    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));

    await user.click(within(drawer).getByRole('button', { name: /Close/i }));

    await waitFor(() =>
      expect(screen.queryByTestId('defensibility-drawer')).not.toBeInTheDocument(),
    );
  });

  it('drawer reflects scenario switches without remounting stale data', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));

    // Open drawer on Base Case
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );
    let drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(within(drawer).getAllByText('$2,369,903').length).toBeGreaterThanOrEqual(1);

    // Close, then switch to Onshore-Only (M5c made it populated)
    await user.keyboard('{Escape}');
    const state = useProjectStore.getState();
    const onshore = state.scenarios.find((s) => s.name === 'Onshore-Only (Conservative)')!;
    state.setActiveScenario(onshore.id);

    // Reopen on the new scenario
    await user.click(
      screen.getByRole('button', { name: /Show defensibility for Final Price/i }),
    );
    drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));
    expect(within(drawer).getAllByText('$3,402,535').length).toBeGreaterThanOrEqual(1);
  });
});

describe('DefensibilityDrawer - Resource Bill cell (M5d-1)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/resources`);
  });

  afterEach(() => cleanup());

  it('opens drawer with resource-specific math when a Bill cell is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: /Resource Planner/i, level: 1 }),
    );

    // Find any Bill cell button
    const billButtons = screen.getAllByRole('button', {
      name: /Show defensibility for resource bill amount/i,
    });
    expect(billButtons.length).toBeGreaterThan(0);

    await user.click(billButtons[0]);
    const drawer = await waitFor(() => screen.getByTestId('defensibility-drawer'));

    // Math should mention Bill rate, Total hours, and Billed amount
    expect(within(drawer).getByText('Bill rate')).toBeInTheDocument();
    expect(within(drawer).getByText('Total hours')).toBeInTheDocument();
    expect(within(drawer).getByText('Billed amount')).toBeInTheDocument();
  });
});
