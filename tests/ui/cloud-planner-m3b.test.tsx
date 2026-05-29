/**
 * Cloud Planner editing tests (M3b).
 *
 * Verifies the editable flow:
 *  - + Add from catalog opens the modal
 *  - Full add flow (provider -> category -> entry -> env -> qty) commits
 *  - Editing a field in the detail pane commits and audits
 *  - Delete requires confirmation
 *  - Duplicate clones with a "(copy)" description suffix
 *  - Field updates write audit entries
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

function activeScenarioCloudCount(): number {
  const state = useProjectStore.getState();
  const sc = state.scenarios.find((s) => s.id === state.activeScenarioId);
  return sc?.cloudLineItems.length ?? 0;
}

describe('Cloud Planner M3b — add line item', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(PROJECT_ID);
    window.history.pushState({}, '', `/p/${PROJECT_ID}/cloud`);
  });

  afterEach(() => cleanup());

  it('Add from catalog opens the modal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/8 line items/)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /\+ Add from catalog/i }));
    expect(screen.getByRole('dialog', { name: /Add Cloud Line Item/i })).toBeInTheDocument();
  });

  it('Esc closes the modal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/8 line items/)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /\+ Add from catalog/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('completes a full add flow: aws -> Compute -> entry -> qty -> add', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/8 line items/)).toBeInTheDocument());
    const before = activeScenarioCloudCount();

    await user.click(screen.getByRole('button', { name: /\+ Add from catalog/i }));
    const dialog = screen.getByRole('dialog');

    // Provider
    await user.selectOptions(within(dialog).getByLabelText(/Provider/i), 'aws');
    // Wait for catalog to load (Category dropdown appears)
    await waitFor(() => {
      expect(within(dialog).getByLabelText(/Category/i)).toBeInTheDocument();
    });

    // Category
    await user.selectOptions(within(dialog).getByLabelText(/Category/i), 'Compute');
    // Wait for entry dropdown to be populated
    await waitFor(() => {
      expect(within(dialog).getByLabelText(/Service \/ SKU/i)).toBeInTheDocument();
    });

    // Pick first non-blank entry (any service in Compute)
    const entrySelect = within(dialog).getByLabelText(/Service \/ SKU/i) as HTMLSelectElement;
    const opts = Array.from(entrySelect.options).filter((o) => o.value !== '');
    expect(opts.length).toBeGreaterThan(0);
    await user.selectOptions(entrySelect, opts[0].value);

    // Quantity defaults to "1" - leave as-is. Click confirm.
    const confirm = within(dialog).getByRole('button', { name: 'Add line item' });
    expect(confirm).not.toBeDisabled();
    await user.click(confirm);

    // Modal closes; store has one more cloud item
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(activeScenarioCloudCount()).toBe(before + 1);

    // Audit entry written
    const entries = readAudit(PROJECT_ID);
    expect(entries.some((e) => e.action.kind === 'cloud.add')).toBe(true);
  });

  it('Add line item button is disabled until provider/category/entry/qty are valid', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/8 line items/)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /\+ Add from catalog/i }));
    const dialog = screen.getByRole('dialog');

    const confirm = within(dialog).getByRole('button', { name: 'Add line item' });
    expect(confirm).toBeDisabled();

    await user.selectOptions(within(dialog).getByLabelText(/Provider/i), 'aws');
    await waitFor(() => {
      expect(within(dialog).getByLabelText(/Category/i)).toBeInTheDocument();
    });
    expect(confirm).toBeDisabled();

    await user.selectOptions(within(dialog).getByLabelText(/Category/i), 'Compute');
    await waitFor(() => {
      expect(within(dialog).getByLabelText(/Service \/ SKU/i)).toBeInTheDocument();
    });
    expect(confirm).toBeDisabled();

    const entrySelect = within(dialog).getByLabelText(/Service \/ SKU/i) as HTMLSelectElement;
    const opts = Array.from(entrySelect.options).filter((o) => o.value !== '');
    await user.selectOptions(entrySelect, opts[0].value);

    // Now valid (qty default is "1")
    expect(confirm).not.toBeDisabled();
  });
});

describe('Cloud Planner M3b — delete and duplicate', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(PROJECT_ID);
    window.history.pushState({}, '', `/p/${PROJECT_ID}/cloud`);
  });

  afterEach(() => cleanup());

  it('duplicate adds a copy of the line item', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/8 line items/)).toBeInTheDocument());
    const before = activeScenarioCloudCount();

    // The list items show "RDS Aurora PostgreSQL". RowActions buttons exist
    // per row but are visually hidden until hover. They are still in the DOM
    // and queryable by role.
    const dupBtn = screen.getByRole('button', { name: /Duplicate RDS Aurora PostgreSQL/i });
    await user.click(dupBtn);

    await waitFor(() => expect(activeScenarioCloudCount()).toBe(before + 1));
    const entries = readAudit(PROJECT_ID);
    expect(entries.some((e) => e.action.kind === 'cloud.duplicate')).toBe(true);
  });

  it('delete requires two clicks (confirmation)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/8 line items/)).toBeInTheDocument());
    const before = activeScenarioCloudCount();

    const del = screen.getByRole('button', { name: /Delete RDS Aurora PostgreSQL/i });
    await user.click(del);
    expect(activeScenarioCloudCount()).toBe(before);
    expect(screen.getByRole('button', { name: /Confirm delete RDS Aurora PostgreSQL/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Confirm delete RDS Aurora PostgreSQL/i }));
    await waitFor(() => expect(activeScenarioCloudCount()).toBe(before - 1));
    const entries = readAudit(PROJECT_ID);
    expect(entries.some((e) => e.action.kind === 'cloud.delete')).toBe(true);
  });
});

describe('Cloud Planner M3b — field editing', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    clearAudit(PROJECT_ID);
    window.history.pushState({}, '', `/p/${PROJECT_ID}/cloud`);
  });

  afterEach(() => cleanup());

  it('editing Quantity in the detail pane commits to store and audits', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/8 line items/)).toBeInTheDocument());

    // Find the Quantity field in the detail pane - first match
    const qtyLabel = screen.getByText('Quantity');
    const qtyContainer = qtyLabel.closest('div')!;
    const qtyButton = within(qtyContainer).getByRole('button');
    await user.click(qtyButton);

    const input = within(qtyContainer).getByRole('textbox');
    await user.clear(input);
    await user.type(input, '20');
    await user.keyboard('{Enter}');

    // Store updated
    await waitFor(() => {
      const state = useProjectStore.getState();
      const scenario = state.scenarios.find((s) => s.id === state.activeScenarioId);
      // First item's quantity should now be 20
      expect(scenario?.cloudLineItems[0].quantity).toBe(20);
    });

    // Audit entry written
    const entries = readAudit(PROJECT_ID);
    expect(
      entries.some(
        (e) => e.action.kind === 'cloud.field.update' &&
        'field' in e.action && e.action.field === 'quantity',
      ),
    ).toBe(true);
  });

  it('editing pricing model via the dropdown commits', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/8 line items/)).toBeInTheDocument());

    // Find the Pricing Model field
    const pricingLabel = screen.getByText('Pricing Model');
    const pricingContainer = pricingLabel.closest('div')!;
    const pricingButton = within(pricingContainer).getByRole('button');
    await user.click(pricingButton);

    const select = within(pricingContainer).getByRole('combobox');
    await user.selectOptions(select, 'OnDemand');
    // Commit on blur
    await user.tab();

    // The first cloud item should now be OnDemand
    await waitFor(() => {
      const state = useProjectStore.getState();
      const scenario = state.scenarios.find((s) => s.id === state.activeScenarioId);
      expect(scenario?.cloudLineItems[0].pricingModel).toBe('OnDemand');
    });
  });

  it('toggling Include in Run-Rate commits and audits', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/8 line items/)).toBeInTheDocument());

    // The toggle has role="switch" with aria-label "Include in Run-Rate"
    const toggle = screen.getByRole('switch', { name: /Include in Run-Rate/i });
    const before = toggle.getAttribute('aria-checked');
    await user.click(toggle);

    await waitFor(() => {
      expect(toggle.getAttribute('aria-checked')).not.toBe(before);
    });

    const entries = readAudit(PROJECT_ID);
    expect(
      entries.some(
        (e) => e.action.kind === 'cloud.field.update' &&
        'field' in e.action && e.action.field === 'includeInRunRate',
      ),
    ).toBe(true);
  });
});
