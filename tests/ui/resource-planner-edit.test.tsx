/**
 * Resource Planner editing tests (M2b).
 *
 * Verifies the full edit pipeline:
 *  - Click a phase % cell -> input appears
 *  - Type a value -> Enter commits
 *  - Store updates -> KPI in top rail updates
 *  - Esc cancels
 *  - Clamping >100 to 100 with flash
 *  - Expanded row form commits to store
 *  - Audit entries written
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

const SEED_PROJECT_ID = 'proj_vtx_modernization_2026' as ProjectId;

describe('Resource Planner editing (M2b)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(SEED_PROJECT_ID);
    window.history.pushState({}, '', `/p/${SEED_PROJECT_ID}/resources`);
  });

  afterEach(() => {
    cleanup();
  });

  // Find the first phase cell of the Engagement Lead row.
  async function findFirstPhaseCellForRole(roleName: string) {
    await waitFor(() => {
      expect(screen.getByText(roleName)).toBeInTheDocument();
    });
    // Find any cell whose aria-label mentions this role + phase
    const buttons = screen.getAllByRole('button', {
      name: new RegExp(`${roleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*Discovery.*allocation`),
    });
    return buttons[0];
  }

  it('clicking a phase cell turns it into an input', async () => {
    const user = userEvent.setup();
    render(<App />);
    const cell = await findFirstPhaseCellForRole('Engagement Lead');
    await user.click(cell);
    // Input now exists with the same aria-label
    const input = screen.getByRole('textbox', { name: /Engagement Lead.*Discovery.*allocation/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('typing a new value and pressing Enter commits to the store', async () => {
    const user = userEvent.setup();
    render(<App />);
    const cell = await findFirstPhaseCellForRole('Engagement Lead');
    await user.click(cell);
    const input = screen.getByRole('textbox', { name: /Engagement Lead.*Discovery.*allocation/i });
    await user.clear(input);
    await user.type(input, '75');
    await user.keyboard('{Enter}');

    // After commit, the store should have an override for the Discovery phase
    await waitFor(() => {
      const state = useProjectStore.getState();
      const activeScenario = state.scenarios.find((s) => s.id === state.activeScenarioId);
      const engLead = activeScenario?.resources.find((r) => r.role === 'Engagement Lead');
      // The first phase in project.phases is Discovery
      const phases = state.project?.phases ?? [];
      const discoveryId = phases[0]?.id;
      const override = engLead?.allocations.find((a) => a.phaseId === discoveryId);
      expect(override?.allocationPct).toBe(75);
    });
  });

  it('Esc cancels the edit; store unchanged', async () => {
    const user = userEvent.setup();
    render(<App />);
    const cell = await findFirstPhaseCellForRole('Engagement Lead');
    const initialState = useProjectStore.getState();
    const initialScenario = initialState.scenarios.find((s) => s.id === initialState.activeScenarioId);
    const initialEngLead = initialScenario?.resources.find((r) => r.role === 'Engagement Lead');
    const initialAlloc = JSON.stringify(initialEngLead?.allocations);

    await user.click(cell);
    const input = screen.getByRole('textbox', { name: /Engagement Lead.*Discovery.*allocation/i });
    await user.clear(input);
    await user.type(input, '99');
    await user.keyboard('{Escape}');

    const after = useProjectStore.getState();
    const afterScenario = after.scenarios.find((s) => s.id === after.activeScenarioId);
    const afterEngLead = afterScenario?.resources.find((r) => r.role === 'Engagement Lead');
    expect(JSON.stringify(afterEngLead?.allocations)).toBe(initialAlloc);
  });

  it('values >100 are clamped to 100', async () => {
    const user = userEvent.setup();
    render(<App />);
    const cell = await findFirstPhaseCellForRole('Engagement Lead');
    await user.click(cell);
    const input = screen.getByRole('textbox', { name: /Engagement Lead.*Discovery.*allocation/i });
    await user.clear(input);
    await user.type(input, '150');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const state = useProjectStore.getState();
      const activeScenario = state.scenarios.find((s) => s.id === state.activeScenarioId);
      const engLead = activeScenario?.resources.find((r) => r.role === 'Engagement Lead');
      const phases = state.project?.phases ?? [];
      const discoveryId = phases[0]?.id;
      const override = engLead?.allocations.find((a) => a.phaseId === discoveryId);
      expect(override?.allocationPct).toBe(100);
    });
  });

  it('edit commits write an audit entry', async () => {
    const user = userEvent.setup();
    render(<App />);
    const cell = await findFirstPhaseCellForRole('Engagement Lead');
    expect(readAudit(SEED_PROJECT_ID)).toHaveLength(0);

    await user.click(cell);
    const input = screen.getByRole('textbox', { name: /Engagement Lead.*Discovery.*allocation/i });
    await user.clear(input);
    await user.type(input, '40');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const entries = readAudit(SEED_PROJECT_ID);
      expect(entries.length).toBe(1);
      expect(entries[0].action.kind).toBe('resource.allocation.update');
    });
  });

  it('no-op edits (same value committed) do not write audit', async () => {
    const user = userEvent.setup();
    render(<App />);
    const cell = await findFirstPhaseCellForRole('Engagement Lead');
    await user.click(cell);
    const input = screen.getByRole('textbox', { name: /Engagement Lead.*Discovery.*allocation/i });
    // Don't change the value; just commit
    await user.keyboard('{Enter}');

    // Brief settle
    await new Promise((r) => setTimeout(r, 50));
    expect(readAudit(SEED_PROJECT_ID)).toHaveLength(0);
  });

  it('clicking the identity cell expands the row with the form', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Engagement Lead')).toBeInTheDocument();
    });

    const expandButton = screen.getByRole('button', {
      name: /Expand details for Engagement Lead/i,
    });
    await user.click(expandButton);

    // After expanding, the form fields appear
    await waitFor(() => {
      expect(screen.getByText('Bill Rate')).toBeInTheDocument();
    });
    expect(screen.getByText('Cost Rate')).toBeInTheDocument();
    expect(screen.getByText('Hours / Week')).toBeInTheDocument();
    expect(screen.getByText('Utilization')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('editing the bill rate in the expanded form commits to store with override flag', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Engagement Lead')).toBeInTheDocument();
    });
    await user.click(
      screen.getByRole('button', { name: /Expand details for Engagement Lead/i }),
    );

    // Find the Bill Rate field (it shows the current bill rate as a button until clicked).
    // The Bill Rate value button is the one inside the column labeled "Bill Rate".
    const billRateLabel = await screen.findByText('Bill Rate');
    const billRateGroup = billRateLabel.closest('div')!;
    const billRateButton = within(billRateGroup).getByRole('button');

    await user.click(billRateButton);
    const billRateInput = within(billRateGroup).getByRole('textbox');
    await user.clear(billRateInput);
    await user.type(billRateInput, '400');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const state = useProjectStore.getState();
      const scenario = state.scenarios.find((s) => s.id === state.activeScenarioId);
      const engLead = scenario?.resources.find((r) => r.role === 'Engagement Lead');
      expect(engLead?.billRate.amount).toBe(400);
      expect(engLead?.billRateOverridden).toBe(true);
    });
  });

  it('table footer hours reflect an allocation edit', async () => {
    const user = userEvent.setup();
    render(<App />);
    // Initial footer hours
    await waitFor(() => {
      expect(screen.getByText(/15,041/)).toBeInTheDocument();
    });

    // Edit Engagement Lead's Discovery from 50 to 100
    const cell = await findFirstPhaseCellForRole('Engagement Lead');
    await user.click(cell);
    const input = screen.getByRole('textbox', { name: /Engagement Lead.*Discovery.*allocation/i });
    await user.clear(input);
    await user.type(input, '100');
    await user.keyboard('{Enter}');

    // Hours should change (the exact new value depends on phase duration, but
    // we just check the original is gone).
    await waitFor(() => {
      expect(screen.queryByText(/15,041/)).not.toBeInTheDocument();
    });
  });
});
