/**
 * M&A Mode UI tests (M4d).
 *
 * Coverage:
 *  - Empty state with no maData
 *  - Mode buttons render
 *  - Picking a mode initializes maData with defaults + renders the form
 *  - Mode switching replaces maData
 *  - Clear-overlay button removes maData
 *  - Inputs commit to the store
 *  - Impact Summary panel renders engine output
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';
import { readAudit, clearAudit } from '../../src/data/audit-log';
import type { ProjectId } from '../../src/types/ids';

const PROJECT_ID = 'proj_vtx_modernization_2026' as ProjectId;

function activeScenarioMaData() {
  const state = useProjectStore.getState();
  const sc = state.scenarios.find((s) => s.id === state.activeScenarioId);
  return sc?.maData;
}

describe('MAModePage (M4d)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(PROJECT_ID);
    window.history.pushState({}, '', `/p/${PROJECT_ID}/ma-mode`);
  });

  afterEach(() => cleanup());

  it('renders heading and preview banner', async () => {
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Preview math/i)).toBeInTheDocument();
  });

  it('shows the empty state when scenario has no maData', async () => {
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/not yet configured/i)).toBeInTheDocument();
  });

  it('renders three mode buttons', async () => {
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'TSA' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carve-out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Integration' })).toBeInTheDocument();
  });

  it('clicking TSA initializes maData with TSA defaults', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });
    expect(activeScenarioMaData()).toBeUndefined();

    await user.click(screen.getByRole('button', { name: 'TSA' }));

    await waitFor(() => {
      const md = activeScenarioMaData();
      expect(md).toBeDefined();
      expect(md!.mode).toBe('TSA');
      expect(md!.tsaDurationMonths).toBeGreaterThan(0);
    });
    // Form is rendered now
    expect(screen.getByText(/TSA Overview/i)).toBeInTheDocument();
    // Audit entry
    expect(
      readAudit(PROJECT_ID).some((e) => e.action.kind === 'scenario.maData.set'),
    ).toBe(true);
  });

  it('clicking Carve-out initializes carve-out defaults and renders the form', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Carve-out' }));
    await waitFor(() => {
      const md = activeScenarioMaData();
      expect(md?.mode).toBe('CarveOut');
      expect(md?.separationOneTimeCostMultiplier).toBeDefined();
    });
    expect(screen.getByText(/Separation Costs/i)).toBeInTheDocument();
  });

  it('clicking Integration initializes integration defaults and renders the form', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Integration' }));
    await waitFor(() => {
      const md = activeScenarioMaData();
      expect(md?.mode).toBe('Integration');
      expect(md?.synergyRealizationMonths).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Synergy Targets/i)).toBeInTheDocument();
  });

  it('switching modes replaces maData', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'TSA' }));
    await waitFor(() => expect(activeScenarioMaData()?.mode).toBe('TSA'));

    await user.click(screen.getByRole('button', { name: 'Integration' }));
    await waitFor(() => expect(activeScenarioMaData()?.mode).toBe('Integration'));
  });

  it('Clear overlay removes maData entirely', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'TSA' }));
    await waitFor(() => expect(activeScenarioMaData()?.mode).toBe('TSA'));

    await user.click(screen.getByRole('button', { name: /Clear overlay/i }));

    await waitFor(() => expect(activeScenarioMaData()).toBeUndefined());
    // Empty state returns
    expect(screen.getByText(/not yet configured/i)).toBeInTheDocument();
    // Audit
    expect(
      readAudit(PROJECT_ID).some((e) => e.action.kind === 'scenario.maData.clear'),
    ).toBe(true);
  });

  it('Impact Summary renders when overlay produces output', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'TSA' }));
    // TSA defaults give 12-month duration + 8% ramp. With the seed run-rate
    // ($~36k/mo - small because Onshore-Only is empty but base has real data),
    // the overlay produces a non-empty monthly projection.
    await waitFor(() => {
      expect(
        screen.getByTestId('overlay-impact-summary'),
      ).toBeInTheDocument();
    });
    // Tiles
    expect(screen.getByText(/^One-time$/)).toBeInTheDocument();
    expect(screen.getByText(/^Recurring$/)).toBeInTheDocument();
    expect(screen.getByText(/^Net impact$/)).toBeInTheDocument();
    // Month table heading
    expect(screen.getByText(/Monthly projection/i)).toBeInTheDocument();
  });

  it('Integration with synergy shows breakeven status', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Integration' }));
    await waitFor(() => expect(activeScenarioMaData()?.mode).toBe('Integration'));

    // Update via store directly to set realistic numbers
    const activeId = useProjectStore.getState().activeScenarioId!;
    useProjectStore.getState().updateMAData(activeId, {
      mode: 'Integration',
      synergyTargetAnnual: 6_000_000,
      synergyRealizationMonths: 18,
      oneTimeIntegrationCost: 2_000_000,
    });

    await waitFor(() => {
      const summary = screen.getByTestId('overlay-impact-summary');
      // Breakeven info should appear somewhere in the summary
      expect(within(summary).getByText(/[Bb]reakeven/)).toBeInTheDocument();
    });
  });

  it('Integration with no synergy shows "no breakeven" warning', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /M&A Mode/, level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Integration' }));
    const activeId = useProjectStore.getState().activeScenarioId!;
    useProjectStore.getState().updateMAData(activeId, {
      mode: 'Integration',
      synergyTargetAnnual: 100_000, // tiny
      synergyRealizationMonths: 12,
      oneTimeIntegrationCost: 10_000_000, // huge
    });

    await waitFor(() => {
      const summary = screen.getByTestId('overlay-impact-summary');
      expect(within(summary).getByText(/No breakeven/i)).toBeInTheDocument();
    });
  });
});
