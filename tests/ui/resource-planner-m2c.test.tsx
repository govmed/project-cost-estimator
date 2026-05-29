/**
 * Resource Planner M2c tests.
 *
 * Add, delete, duplicate, filters, search, guardrails strip.
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

function activeScenarioResourceCount(): number {
  const state = useProjectStore.getState();
  const sc = state.scenarios.find((s) => s.id === state.activeScenarioId);
  return sc?.resources.length ?? 0;
}

describe('Resource Planner M2c — add resource', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(SEED_PROJECT_ID);
    window.history.pushState({}, '', `/p/${SEED_PROJECT_ID}/resources`);
  });

  afterEach(() => cleanup());

  it('Add resource button opens the modal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /\+ Add resource/i }));
    expect(screen.getByRole('dialog', { name: /Add Resource/i })).toBeInTheDocument();
  });

  it('Esc closes the modal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /\+ Add resource/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('completes an add: pick role + level + geo, click Add resource', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());
    const beforeCount = activeScenarioResourceCount();

    await user.click(screen.getByRole('button', { name: /\+ Add resource/i }));
    const dialog = screen.getByRole('dialog');

    // Pick a role
    await user.selectOptions(within(dialog).getByLabelText(/Role/i), 'Data Engineer');
    // Pick a level - default selection should populate options
    await user.selectOptions(within(dialog).getByLabelText(/Skill Level/i), 'Senior');
    // Pick a geo
    await user.selectOptions(within(dialog).getByLabelText(/Geography/i), 'US-Onshore');

    // Rate preview should now be visible
    expect(within(dialog).getByText(/From rate card/i)).toBeInTheDocument();

    // Click confirm
    await user.click(within(dialog).getByRole('button', { name: 'Add resource' }));

    // Modal closes; store has one more resource
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(activeScenarioResourceCount()).toBe(beforeCount + 1);

    // Audit entry written
    const entries = readAudit(SEED_PROJECT_ID);
    expect(entries.some((e) => e.action.kind === 'resource.add')).toBe(true);
  });

  it('Add button is disabled until all three pickers are populated', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /\+ Add resource/i }));
    const dialog = screen.getByRole('dialog');

    const addBtn = within(dialog).getByRole('button', { name: 'Add resource' });
    expect(addBtn).toBeDisabled();

    await user.selectOptions(within(dialog).getByLabelText(/Role/i), 'Data Engineer');
    expect(addBtn).toBeDisabled();

    await user.selectOptions(within(dialog).getByLabelText(/Skill Level/i), 'Senior');
    expect(addBtn).toBeDisabled();

    await user.selectOptions(within(dialog).getByLabelText(/Geography/i), 'US-Onshore');
    expect(addBtn).not.toBeDisabled();
  });
});

describe('Resource Planner M2c — delete and duplicate', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(SEED_PROJECT_ID);
    window.history.pushState({}, '', `/p/${SEED_PROJECT_ID}/resources`);
  });

  afterEach(() => cleanup());

  it('duplicate appends a copy with the same role', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());
    const before = activeScenarioResourceCount();

    // Duplicate button for Engagement Lead
    const dup = screen.getByRole('button', { name: /Duplicate Engagement Lead/i });
    await user.click(dup);

    await waitFor(() => expect(activeScenarioResourceCount()).toBe(before + 1));

    // Two Engagement Lead rows now
    const matches = screen.getAllByText('Engagement Lead');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('delete requires two clicks (confirmation pattern)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());
    const before = activeScenarioResourceCount();

    const del = screen.getByRole('button', { name: /Delete Engagement Lead/i });
    await user.click(del);
    // Still present (one click = confirm prompt)
    expect(activeScenarioResourceCount()).toBe(before);
    // Button label changed
    expect(screen.getByRole('button', { name: /Confirm delete Engagement Lead/i })).toBeInTheDocument();

    // Click again to actually delete
    await user.click(screen.getByRole('button', { name: /Confirm delete Engagement Lead/i }));
    await waitFor(() => expect(activeScenarioResourceCount()).toBe(before - 1));
  });
});

describe('Resource Planner M2c — filters and search', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', `/p/${SEED_PROJECT_ID}/resources`);
  });

  afterEach(() => cleanup());

  it('search by role name filters the table', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());

    // All 12 resources visible -> footer says "Totals (12 resources)"
    expect(screen.getByText(/Totals \(12 resources\)/)).toBeInTheDocument();

    const searchBox = screen.getByPlaceholderText(/Search role, name, notes/i);
    await user.type(searchBox, 'Architect');

    // Non-architect rows hidden
    await waitFor(() => {
      expect(screen.queryByText('Engagement Lead')).not.toBeInTheDocument();
    });
    // Footer now shows "Totals (2 resources)" with " of 12" suffix.
    // The text is split across nodes, so use a function matcher on the cell.
    const footerCell = screen.getByText((_, el) =>
      el?.tagName.toLowerCase() === 'td' &&
      el.textContent?.includes('Totals (2 resources)') === true &&
      el.textContent?.includes('of 12') === true,
    );
    expect(footerCell).toBeInTheDocument();
  });

  it('Geography filter chip filters by region', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());

    // Click the India-Offshore chip
    const chip = screen.getByRole('button', { name: 'India-Offshore', pressed: false });
    await user.click(chip);

    await waitFor(() => {
      // Engagement Lead is US-Onshore, should be hidden
      expect(screen.queryByText('Engagement Lead')).not.toBeInTheDocument();
    });
    // chip is now pressed
    expect(screen.getByRole('button', { name: 'India-Offshore', pressed: true })).toBeInTheDocument();
  });

  it('Clear filters restores all rows', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());

    const searchBox = screen.getByPlaceholderText(/Search role, name, notes/i);
    await user.type(searchBox, 'Architect');
    await waitFor(() => {
      expect(screen.queryByText('Engagement Lead')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => {
      expect(screen.getByText('Engagement Lead')).toBeInTheDocument();
    });
  });
});

describe('Resource Planner M2c — guardrails strip', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', `/p/${SEED_PROJECT_ID}/resources`);
  });

  afterEach(() => cleanup());

  it('shows the Guardrails section', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());
    // The Guardrails section header is present
    expect(screen.getByRole('heading', { name: /Guardrails/i })).toBeInTheDocument();
  });

  it('shows "all clear" on the seed base scenario', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Engagement Lead')).toBeInTheDocument());
    // Seed base scenario is well-balanced enough to pass all 3 rules
    await waitFor(() => {
      expect(screen.getByText(/all clear/i)).toBeInTheDocument();
    });
  });
});
