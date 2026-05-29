/**
 * M5a tests - Assumption Ledger + Audit Log.
 *
 * Selector notes:
 *  - The page heading is the only h1; safe to use exact name match.
 *  - The Add Assumption modal's submit button is named "Add assumption" via role.
 *  - The audit log entries render as <li> elements containing the headline text;
 *    we test by looking for known headline strings after triggering actions.
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

function activeAssumptions() {
  const state = useProjectStore.getState();
  const sc = state.scenarios.find((s) => s.id === state.activeScenarioId);
  return sc?.assumptions ?? [];
}

// --------------- ASSUMPTION LEDGER ---------------

describe('AssumptionLedgerPage (M5a)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(PROJECT_ID);
    window.history.pushState({}, '', `/p/${PROJECT_ID}/assumptions`);
  });

  afterEach(() => cleanup());

  it('renders the heading and the four seed assumptions', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Assumption Ledger', level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByText(/4 assumptions in Base Case/)).toBeInTheDocument();
    // Topic strings appear in the table
    expect(screen.getByText(/Offshore ratio/)).toBeInTheDocument();
    expect(screen.getByText(/Cloud sizing pre-Discovery/)).toBeInTheDocument();
  });

  it('shows "unreviewed" count for fresh seed assumptions', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Assumption Ledger', level: 1 })).toBeInTheDocument();
    });
    // All 4 seed assumptions have no lastReviewedAt
    expect(screen.getByText(/4 unreviewed/)).toBeInTheDocument();
  });

  it('+ Add assumption opens the modal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Assumption Ledger', level: 1 }));

    await user.click(screen.getByRole('button', { name: /\+ Add assumption/i }));
    expect(screen.getByRole('dialog', { name: /Add Assumption/i })).toBeInTheDocument();
  });

  it('adds a new assumption from the modal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Assumption Ledger', level: 1 }));
    const before = activeAssumptions().length;

    await user.click(screen.getByRole('button', { name: /\+ Add assumption/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(
      within(dialog).getByPlaceholderText(/Offshore ratio/i),
      'New Test Assumption',
    );
    await user.type(
      within(dialog).getByPlaceholderText(/Full statement/i),
      'A description',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Add assumption' }));

    await waitFor(() => {
      expect(activeAssumptions().length).toBe(before + 1);
    });
    expect(
      readAudit(PROJECT_ID).some((e) => e.action.kind === 'assumption.add'),
    ).toBe(true);
  });

  it('mark reviewed sets lastReviewedAt and audits', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Assumption Ledger', level: 1 }));

    // Each unreviewed assumption has a "Mark X as reviewed" button.
    // Pick the Offshore ratio one.
    const btn = screen.getByRole('button', { name: /Mark Offshore ratio as reviewed/i });
    await user.click(btn);

    await waitFor(() => {
      const a = activeAssumptions().find((a) => a.topic === 'Offshore ratio');
      expect(a?.lastReviewedAt).toBeTruthy();
    });
    expect(
      readAudit(PROJECT_ID).some((e) => e.action.kind === 'assumption.review'),
    ).toBe(true);
  });

  it('delete needs two clicks', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Assumption Ledger', level: 1 }));
    const before = activeAssumptions().length;

    const del = screen.getByRole('button', { name: /Delete assumption Offshore ratio/i });
    await user.click(del);
    expect(activeAssumptions().length).toBe(before);
    await user.click(
      screen.getByRole('button', { name: /Confirm delete assumption Offshore ratio/i }),
    );
    await waitFor(() => expect(activeAssumptions().length).toBe(before - 1));
  });

  it('inline rename of a topic commits and audits', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Assumption Ledger', level: 1 }));

    const topicBtn = screen.getByRole('button', { name: 'Offshore ratio' });
    await user.click(topicBtn);
    const input = screen.getByRole('textbox', { name: /Rename assumption Offshore ratio/i });
    await user.clear(input);
    await user.type(input, 'Offshore ratio updated');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(
        activeAssumptions().some((a) => a.topic === 'Offshore ratio updated'),
      ).toBe(true);
    });
    expect(
      readAudit(PROJECT_ID).some(
        (e) =>
          e.action.kind === 'assumption.update' &&
          'field' in e.action &&
          e.action.field === 'topic',
      ),
    ).toBe(true);
  });

  it('changing source via the row select commits', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Assumption Ledger', level: 1 }));

    const select = screen.getByRole('combobox', { name: /Source for Offshore ratio/i });
    await user.selectOptions(select, 'clientConfirmed');

    await waitFor(() => {
      const a = activeAssumptions().find((a) => a.topic === 'Offshore ratio');
      expect(a?.source).toBe('clientConfirmed');
    });
  });

  it('risk filter narrows the list', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Assumption Ledger', level: 1 }));

    // Seed has 2 'medium' and 2 'low' risk assumptions
    expect(screen.getByText(/4 assumptions/)).toBeInTheDocument();

    // Click the "high" risk chip - no high-risk seed -> 0 visible
    const highChip = screen.getByRole('button', { name: 'high', pressed: false });
    await user.click(highChip);

    expect(screen.getByText(/showing 0 of 4/i)).toBeInTheDocument();
  });
});

// --------------- AUDIT LOG ---------------

describe('AuditLogPage (M5a)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(PROJECT_ID);
    window.history.pushState({}, '', `/p/${PROJECT_ID}/audit`);
  });

  afterEach(() => cleanup());

  it('renders the heading and empty state with no entries', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Audit Log', level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByText(/No audit entries yet/i)).toBeInTheDocument();
  });

  it('shows entries after store actions', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Audit Log', level: 1 })).toBeInTheDocument();
    });
    // Now that the project is loaded, trigger an audit-emitting action.
    const state = useProjectStore.getState();
    state.renameScenario(state.scenarios[0].id, 'Renamed Base');

    // The page refreshes when project.updatedAt changes (useEffect dependency).
    await waitFor(() => {
      expect(screen.getByText(/Scenario renamed/i)).toBeInTheDocument();
    });
  });

  it('category filter narrows visible entries', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Audit Log', level: 1 })).toBeInTheDocument();
    });
    const state = useProjectStore.getState();
    state.renameScenario(state.scenarios[0].id, 'Renamed');
    state.updateProjectField({ kind: 'targetMarginPct', value: 30 });

    await waitFor(() => {
      expect(screen.getByText(/Scenario renamed/i)).toBeInTheDocument();
      expect(screen.getByText(/Project targetMarginPct changed/i)).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Click scenario category chip - only scenario entries should remain
    await user.click(screen.getByRole('button', { name: 'scenario', pressed: false }));

    expect(screen.getByText(/Scenario renamed/i)).toBeInTheDocument();
    expect(screen.queryByText(/Project targetMarginPct/i)).not.toBeInTheDocument();
  });

  it('expanding an entry reveals the raw JSON', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Audit Log', level: 1 })).toBeInTheDocument();
    });
    const state = useProjectStore.getState();
    state.renameScenario(state.scenarios[0].id, 'Renamed');

    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByText(/Scenario renamed/i)).toBeInTheDocument();
    });
    // Find the renaming entry and click to expand
    const entry = screen.getByText(/Scenario renamed/i).closest('button')!;
    await user.click(entry);

    // The expanded view shows JSON containing the action kind
    await waitFor(() => {
      expect(screen.getByText(/"kind": "scenario.rename"/)).toBeInTheDocument();
    });
  });

  it('search box filters by headline substring', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Audit Log', level: 1 })).toBeInTheDocument();
    });
    const state = useProjectStore.getState();
    state.renameScenario(state.scenarios[0].id, 'Renamed');
    state.updateProjectField({ kind: 'targetMarginPct', value: 30 });

    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByText(/Scenario renamed/i)).toBeInTheDocument();
    });

    const search = screen.getByPlaceholderText(/Search/i);
    await user.type(search, 'renamed');

    expect(screen.getByText(/Scenario renamed/i)).toBeInTheDocument();
    expect(screen.queryByText(/Project targetMarginPct/i)).not.toBeInTheDocument();
  });
});
