/**
 * M5d-3 polish tests.
 *
 * Covers:
 *  1. project.create audit kind written by the wizard
 *  2. AssumptionLinksCell - popover opens, lists entities, navigates
 *
 * The vite.config.ts single-fork change is exercised implicitly by every
 * test run; no test needed for it. The setTimeout cleanup fix is verified
 * by the absence of the previous unhandled-error stack trace at the end of
 * a full suite run.
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

describe('project.create audit kind (M5d-3)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', '/new');
  });
  afterEach(() => cleanup());

  it('wizard creating a project writes a project.create audit entry', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: 'New Project', level: 1 }),
    );

    // Walk the wizard
    await user.type(screen.getByPlaceholderText(/Acme Modernization/i), 'M5d3 Test Project');
    await user.type(screen.getByPlaceholderText(/Acme Inc/i), 'M5d3 Test Client');
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Create Project/i }));

    // Wait for navigation
    await waitFor(() => {
      const proj = useProjectStore.getState().project;
      expect(proj?.name).toBe('M5d3 Test Project');
    });

    const project = useProjectStore.getState().project!;
    const log = readAudit(project.id);
    expect(log.length).toBeGreaterThan(0);
    const createEntry = log.find((e) => e.action.kind === 'project.create');
    expect(createEntry).toBeDefined();
    if (createEntry && createEntry.action.kind === 'project.create') {
      expect(createEntry.action.name).toBe('M5d3 Test Project');
      expect(createEntry.action.client).toBe('M5d3 Test Client');
    }

    // Clean up the audit log we just wrote so other tests don't see it
    clearAudit(project.id);
  });

  it('audit log screen renders the project.create entry with a project category', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: 'New Project', level: 1 }),
    );

    await user.type(screen.getByPlaceholderText(/Acme Modernization/i), 'Audit Render Test');
    await user.type(screen.getByPlaceholderText(/Acme Inc/i), 'Test Client');
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Create Project/i }));

    await waitFor(() => {
      const proj = useProjectStore.getState().project;
      expect(proj?.name).toBe('Audit Render Test');
    });
    const project = useProjectStore.getState().project!;

    // Navigate to the audit log
    window.history.pushState({}, '', `/p/${project.id}/audit`);
    // Trigger a route change so React Router re-renders
    window.dispatchEvent(new PopStateEvent('popstate'));

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /Audit Log/i, level: 1 }),
      ).toBeInTheDocument(),
    );

    // Look for the project.create entry label
    expect(screen.getByText('Project created')).toBeInTheDocument();
    expect(screen.getByText(/Audit Render Test for Test Client/)).toBeInTheDocument();

    clearAudit(project.id);
  });
});

describe('AssumptionLinksCell (M5d-3)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', `/p/${SEED_PROJECT_ID}/assumptions`);
  });
  afterEach(() => cleanup());

  it('renders the link count as a clickable button', async () => {
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: /Assumption Ledger/i, level: 1 }),
    );

    // The "Offshore ratio" assumption has 2 linked entities
    const offshoreRow = screen.getByText('Offshore ratio').closest('tr')!;
    const linkBtn = within(offshoreRow).getByRole('button', {
      name: /Show 2 linked entities/i,
    });
    expect(linkBtn).toBeInTheDocument();
    expect(linkBtn.textContent).toBe('2');
  });

  it('clicking the link count opens a popover with entity chips', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: /Assumption Ledger/i, level: 1 }),
    );

    const offshoreRow = screen.getByText('Offshore ratio').closest('tr')!;
    const linkBtn = within(offshoreRow).getByRole('button', {
      name: /Show 2 linked entities/i,
    });
    await user.click(linkBtn);

    const popover = await waitFor(() =>
      screen.getByTestId('assumption-links-popover'),
    );
    expect(within(popover).getByText('Linked entities')).toBeInTheDocument();
    // Each chip starts with the entity type label
    const typeLabels = within(popover).getAllByText('resource');
    expect(typeLabels.length).toBe(2);
  });

  it('clicking an entity chip navigates to the right screen and closes the popover', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: /Assumption Ledger/i, level: 1 }),
    );

    // Open popover for the cloud-sizing assumption (links to cloud items)
    const cloudRow = screen.getByText('Cloud sizing pre-Discovery').closest('tr')!;
    const linkBtn = within(cloudRow).getByRole('button', {
      name: /Show 2 linked entities/i,
    });
    await user.click(linkBtn);

    const popover = await waitFor(() =>
      screen.getByTestId('assumption-links-popover'),
    );

    // Click the first cloud entity chip
    const chips = within(popover).getAllByRole('button');
    await user.click(chips[0]);

    // Popover closes + we land on the Cloud Planner
    await waitFor(() => {
      expect(screen.queryByTestId('assumption-links-popover')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /Cloud Planner/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('Escape key closes an open popover', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: /Assumption Ledger/i, level: 1 }),
    );

    const row = screen.getByText('Offshore ratio').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /Show 2 linked entities/i }));
    await waitFor(() => screen.getByTestId('assumption-links-popover'));

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByTestId('assumption-links-popover')).not.toBeInTheDocument(),
    );
  });

  it('Onshore-Only assumption now shows 12 linked resources', async () => {
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: /Assumption Ledger/i, level: 1 }),
    );

    // Switch active to Onshore-Only
    const state = useProjectStore.getState();
    const onshore = state.scenarios.find((s) => !s.isBase)!;
    state.setActiveScenario(onshore.id);

    await waitFor(() => {
      const row = screen.getByText(/100% US onshore staffing/i).closest('tr')!;
      const btn = within(row).getByRole('button', { name: /Show 12 linked entities/i });
      expect(btn).toBeInTheDocument();
    });
  });

  it('zero linked entities renders a muted "0", not a button', async () => {
    // Add an assumption with no links via the store
    render(<App />);
    await waitFor(() =>
      screen.getByRole('heading', { name: /Assumption Ledger/i, level: 1 }),
    );

    const state = useProjectStore.getState();
    const baseScenario = state.scenarios.find((s) => s.isBase)!;
    state.addAssumption(baseScenario.id, {
      topic: 'Linkless test assumption',
      description: 'has no entities',
      source: 'assumed',
      riskLevel: 'low',
      linkedEntities: [],
    });

    await waitFor(() => {
      const row = screen.getByText('Linkless test assumption').closest('tr')!;
      // The cell shows "0" but it's not a button
      const linkCell = within(row).getAllByText('0').find((el) => el.tagName === 'SPAN');
      expect(linkCell).toBeDefined();
    });
  });
});
