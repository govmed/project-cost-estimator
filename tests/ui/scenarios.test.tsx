/**
 * Scenarios page tests (M4a).
 *
 * Covers the scenario list + CRUD actions: clone, rename, delete, set-base.
 * Compare grid is M4b — out of scope here.
 *
 * Notes on selectors:
 *  - Scenario names appear in the page table AND in the top-rail scenario
 *    dropdown, so every text match is at least 2x. Tests use getAllByText
 *    when checking name presence.
 *  - The seed has two scenarios: "Base Case" and "Onshore-Only (Conservative)".
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';
import { readAudit, clearAudit } from '../../src/data/audit-log';
import type { ProjectId } from '../../src/types/ids';

const PROJECT_ID = 'proj_vtx_modernization_2026' as ProjectId;

function scenarioCount(): number {
  return useProjectStore.getState().scenarios.length;
}

describe('Scenarios page (M4a)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(PROJECT_ID);
    window.history.pushState({}, '', `/p/${PROJECT_ID}/scenarios`);
  });

  afterEach(() => cleanup());

  it('renders the heading and both seed scenarios', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });
    // Seed: Base Case + Onshore-Only (Conservative). Each name appears in the
    // table row AND in the top-rail dropdown.
    expect(screen.getAllByText('Base Case').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Onshore-Only (Conservative)').length).toBeGreaterThanOrEqual(1);
  });

  it('cloning the active scenario creates a new one', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });
    const before = scenarioCount();

    await user.click(screen.getByRole('button', { name: /\+ Clone active scenario/i }));

    await waitFor(() => expect(scenarioCount()).toBe(before + 1));
    expect(
      readAudit(PROJECT_ID).some((e) => e.action.kind === 'scenario.clone'),
    ).toBe(true);
  });

  it('cloned scenario has independent resource IDs (no shared refs with source)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ Clone active scenario/i }));
    await new Promise((r) => setTimeout(r, 50));

    const scenarios = useProjectStore.getState().scenarios;
    const base = scenarios.find((s) => s.isBase)!;
    const cloned = scenarios[scenarios.length - 1];
    expect(cloned.id).not.toBe(base.id);
    expect(cloned.isBase).toBe(false);
    expect(cloned.parentScenarioId).toBe(base.id);

    // No resource ID overlap between base and cloned
    const baseIds = new Set(base.resources.map((r) => r.id));
    for (const r of cloned.resources) {
      expect(baseIds.has(r.id)).toBe(false);
      expect(r.scenarioId).toBe(cloned.id);
    }
  });

  it('per-row clone action also creates a clone', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });
    const before = scenarioCount();

    // The Onshore-Only row has its own Clone button
    await user.click(
      screen.getByRole('button', { name: /Clone Onshore-Only \(Conservative\)/i }),
    );
    await waitFor(() => expect(scenarioCount()).toBe(before + 1));
  });

  it('renaming a scenario via the inline rename commits + audits', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });

    // The name in the table is a button with title="Click to rename"
    const nameButtons = screen.getAllByTitle('Click to rename');
    const onshoreBtn = nameButtons.find((b) => b.textContent === 'Onshore-Only (Conservative)');
    expect(onshoreBtn).toBeDefined();
    await user.click(onshoreBtn!);

    const input = screen.getByRole('textbox', { name: /Rename Onshore-Only/i });
    await user.clear(input);
    await user.type(input, 'Renamed Scenario');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const renamed = useProjectStore
        .getState()
        .scenarios.find((s) => s.name === 'Renamed Scenario');
      expect(renamed).toBeDefined();
    });
    expect(
      readAudit(PROJECT_ID).some((e) => e.action.kind === 'scenario.rename'),
    ).toBe(true);
  });

  it('Esc cancels a rename without committing', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });

    const nameButtons = screen.getAllByTitle('Click to rename');
    const onshoreBtn = nameButtons.find((b) => b.textContent === 'Onshore-Only (Conservative)');
    await user.click(onshoreBtn!);

    const input = screen.getByRole('textbox', { name: /Rename Onshore-Only/i });
    await user.clear(input);
    await user.type(input, 'Garbage');
    await user.keyboard('{Escape}');

    // Original name still present
    const stillThere = useProjectStore
      .getState()
      .scenarios.find((s) => s.name === 'Onshore-Only (Conservative)');
    expect(stillThere).toBeDefined();
    const garbage = useProjectStore.getState().scenarios.find((s) => s.name === 'Garbage');
    expect(garbage).toBeUndefined();
  });

  it('set-as-base flips isBase between scenarios + updates project.baseScenarioId', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });

    // The non-base scenario row has a "Set X as base scenario" button
    await user.click(
      screen.getByRole('button', { name: /Set Onshore-Only \(Conservative\) as base scenario/i }),
    );

    await waitFor(() => {
      const state = useProjectStore.getState();
      const onshore = state.scenarios.find((s) => s.name === 'Onshore-Only (Conservative)');
      const baseCase = state.scenarios.find((s) => s.name === 'Base Case');
      expect(onshore?.isBase).toBe(true);
      expect(baseCase?.isBase).toBe(false);
      expect(state.project?.baseScenarioId).toBe(onshore?.id);
    });
    expect(
      readAudit(PROJECT_ID).some((e) => e.action.kind === 'scenario.setBase'),
    ).toBe(true);
  });

  it('cannot delete the base scenario (no Delete button rendered for it)', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });
    // No "Delete Base Case" button (base is protected)
    expect(
      screen.queryByRole('button', { name: /^Delete Base Case$/i }),
    ).not.toBeInTheDocument();
  });

  it('deleting a non-base scenario needs two clicks and removes it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });

    // Clone first so we have a deletable extra scenario
    await user.click(screen.getByRole('button', { name: /\+ Clone active scenario/i }));
    await waitFor(() => expect(scenarioCount()).toBe(3));

    // First click = confirm prompt
    const delBtn = await screen.findByRole('button', {
      name: /Delete Base Case \(copy\)/i,
    });
    await user.click(delBtn);
    expect(scenarioCount()).toBe(3);

    // Second click = real delete
    await user.click(
      screen.getByRole('button', { name: /Confirm delete Base Case \(copy\)/i }),
    );
    await waitFor(() => expect(scenarioCount()).toBe(2));
    expect(
      readAudit(PROJECT_ID).some((e) => e.action.kind === 'scenario.delete'),
    ).toBe(true);
  });

  it('deleting the active scenario falls back to base as active', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scenarios', level: 1 })).toBeInTheDocument();
    });

    // Clone, then set the clone as active via setActiveScenario
    await user.click(screen.getByRole('button', { name: /\+ Clone active scenario/i }));
    await new Promise((r) => setTimeout(r, 50));
    const clone = useProjectStore
      .getState()
      .scenarios.find((s) => s.name === 'Base Case (copy)');
    expect(clone).toBeDefined();
    useProjectStore.getState().setActiveScenario(clone!.id);
    expect(useProjectStore.getState().activeScenarioId).toBe(clone!.id);

    // Delete the active scenario
    const delBtn = await screen.findByRole('button', {
      name: /Delete Base Case \(copy\)/i,
    });
    await user.click(delBtn);
    await user.click(
      screen.getByRole('button', { name: /Confirm delete Base Case \(copy\)/i }),
    );

    // Active should have fallen back to base
    await waitFor(() => {
      const state = useProjectStore.getState();
      expect(state.activeScenarioId).toBe(state.project?.baseScenarioId);
    });
  });
});
