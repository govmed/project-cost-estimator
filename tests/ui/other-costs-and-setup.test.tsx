/**
 * Other Costs Planner + Project Setup tests (M3c).
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

function activeScenarioOtherCostCount(): number {
  const state = useProjectStore.getState();
  const sc = state.scenarios.find((s) => s.id === state.activeScenarioId);
  return sc?.otherCostLineItems.length ?? 0;
}

describe('Other Costs Planner (M3c)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(PROJECT_ID);
    window.history.pushState({}, '', `/p/${PROJECT_ID}/other-costs`);
  });

  afterEach(() => cleanup());

  it('renders the heading and seed line item count', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Other Costs', level: 1 })).toBeInTheDocument();
    });
    // Seed has 5 other-cost line items
    expect(screen.getByText(/5 line items/)).toBeInTheDocument();
  });

  it('default-selects the first line item and shows its detail', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/5 line items/)).toBeInTheDocument();
    });
    // Detail pane shows section headers
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Scope')).toBeInTheDocument();
    expect(screen.getByText(/Engine output/)).toBeInTheDocument();
  });

  it('Add line item opens the modal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/5 line items/)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /\+ Add line item/i }));
    expect(
      screen.getByRole('dialog', { name: /Add Other-Cost Line Item/i }),
    ).toBeInTheDocument();
  });

  it('completes an add: fills name + unit cost + clicks Add', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/5 line items/)).toBeInTheDocument());
    const before = activeScenarioOtherCostCount();

    await user.click(screen.getByRole('button', { name: /\+ Add line item/i }));
    const dialog = screen.getByRole('dialog');

    // Name is the first input. Fill it.
    const nameInput = within(dialog).getByPlaceholderText(/Splunk Enterprise/i);
    await user.type(nameInput, 'Test License');

    // Unit cost - find the input whose label is "Unit Cost (USD)"
    const unitCostLabel = within(dialog).getByText(/Unit Cost \(USD\)/i);
    const unitCostInput = unitCostLabel.parentElement?.querySelector('input') as HTMLInputElement;
    await user.clear(unitCostInput);
    await user.type(unitCostInput, '500');

    // Confirm
    await user.click(within(dialog).getByRole('button', { name: 'Add line item' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(activeScenarioOtherCostCount()).toBe(before + 1);

    const entries = readAudit(PROJECT_ID);
    expect(entries.some((e) => e.action.kind === 'otherCost.add')).toBe(true);
  });

  it('editing Quantity in the detail commits to store', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/5 line items/)).toBeInTheDocument());

    const qtyLabel = screen.getByText('Quantity');
    const qtyContainer = qtyLabel.closest('div')!;
    const qtyButton = within(qtyContainer).getByRole('button');
    await user.click(qtyButton);

    const input = within(qtyContainer).getByRole('textbox');
    await user.clear(input);
    await user.type(input, '15');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const state = useProjectStore.getState();
      const scenario = state.scenarios.find((s) => s.id === state.activeScenarioId);
      expect(scenario?.otherCostLineItems[0].quantity).toBe(15);
    });
  });

  it('delete requires two clicks; duplicate creates a copy', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/5 line items/)).toBeInTheDocument());
    const before = activeScenarioOtherCostCount();

    // Delete first (so duplicate's "(copy)" suffix doesn't create two matching buttons)
    const del = screen.getByRole('button', { name: /Delete Datadog APM Pro/i });
    await user.click(del);
    expect(activeScenarioOtherCostCount()).toBe(before);
    await user.click(screen.getByRole('button', { name: /Confirm delete Datadog APM Pro/i }));
    await waitFor(() => expect(activeScenarioOtherCostCount()).toBe(before - 1));

    // Then duplicate a different item (GitHub Enterprise + Copilot from seed)
    const dup = screen.getByRole('button', { name: /Duplicate GitHub Enterprise/i });
    await user.click(dup);
    await waitFor(() => expect(activeScenarioOtherCostCount()).toBe(before));
  });
});

describe('Project Setup (M3c)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(PROJECT_ID);
    window.history.pushState({}, '', `/p/${PROJECT_ID}/setup`);
  });

  afterEach(() => cleanup());

  it('renders all four sections', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Project Setup', level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Identity', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Commercials', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Phases', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'FX Rates', level: 2 })).toBeInTheDocument();
  });

  it('editing the project name commits to store and audits', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Project Setup', level: 1 })).toBeInTheDocument();
    });

    // Find the "Project Name" field
    const nameLabel = screen.getByText('Project Name');
    const nameContainer = nameLabel.parentElement!;
    const nameButton = within(nameContainer).getByRole('button');
    await user.click(nameButton);

    const input = within(nameContainer).getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Renamed Project');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const state = useProjectStore.getState();
      expect(state.project?.name).toBe('Renamed Project');
    });
    const entries = readAudit(PROJECT_ID);
    expect(
      entries.some(
        (e) =>
          e.action.kind === 'project.field.update' &&
          'field' in e.action &&
          e.action.field === 'name',
      ),
    ).toBe(true);
  });

  it('editing target margin updates the project', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Commercials', level: 2 })).toBeInTheDocument();
    });

    const marginLabel = screen.getByText('Target Margin');
    const marginContainer = marginLabel.parentElement!;
    const marginButton = within(marginContainer).getByRole('button');
    await user.click(marginButton);

    const input = within(marginContainer).getByRole('textbox');
    await user.clear(input);
    await user.type(input, '40');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const state = useProjectStore.getState();
      expect(state.project?.targetMarginPct).toBe(40);
    });
  });

  it('adding a phase appends a row', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Phases', level: 2 })).toBeInTheDocument();
    });

    const before = useProjectStore.getState().project?.phases.length ?? 0;
    await user.click(screen.getByRole('button', { name: '+ Add phase' }));
    await waitFor(() => {
      expect(useProjectStore.getState().project?.phases.length).toBe(before + 1);
    });
  });

  it('FX rates: base currency is greyed out, others editable', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'FX Rates', level: 2 })).toBeInTheDocument();
    });
    // The FX table shows "1.0000" for the base currency row.
    expect(screen.getByText('1.0000')).toBeInTheDocument();
    // Other currencies appear as table cells. EUR appears in both the base
    // currency note and the FX table - scope to the FX section.
    const fxHeading = screen.getByRole('heading', { name: 'FX Rates', level: 2 });
    const fxSection = fxHeading.closest('section')!;
    expect(within(fxSection).getByText('EUR')).toBeInTheDocument();
    expect(within(fxSection).getByText('INR')).toBeInTheDocument();
  });
});
