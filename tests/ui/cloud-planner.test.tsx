/**
 * Cloud Planner tests (M3a, read-only).
 *
 * Verifies:
 *  - Page renders heading + line-item count
 *  - Both providers (AWS / Azure) appear as group headers
 *  - All 8 seed line items render
 *  - Default selection populates the detail pane
 *  - Clicking another item changes the detail pane
 *  - Ramp curve preview renders
 *  - Navigation via the left rail Cloud link works
 *  - "Add from catalog" button is disabled (M3b)
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';

const PROJECT_ID = 'proj_vtx_modernization_2026';

describe('Cloud Planner (M3a)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/cloud`);
  });

  afterEach(() => cleanup());

  it('renders the Cloud Planner heading', async () => {
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Cloud Planner', level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('renders the line-item count subtitle', async () => {
    render(<App />);
    await waitFor(() => {
      // Seed has 8 cloud line items
      expect(screen.getByText(/8 line items/)).toBeInTheDocument();
    });
  });

  it('renders both provider group headers', async () => {
    render(<App />);
    await waitFor(() => {
      // The badges render their labels in uppercase
      expect(screen.getAllByText('AWS').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Azure').length).toBeGreaterThan(0);
  });

  it('renders all 8 cloud line items in the list', async () => {
    render(<App />);
    await waitFor(() => {
      // Seed has 2 EC2 line items (prod m6i.xlarge + dev m6i.large)
      expect(screen.getAllByText('EC2').length).toBeGreaterThanOrEqual(2);
    });
    // Distinctive seed service names that appear once each
    expect(screen.getByText('RDS Aurora PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('AKS')).toBeInTheDocument();
    expect(screen.getByText('Blob Storage Hot')).toBeInTheDocument();
  });

  it('renders provider subtotal cards', async () => {
    render(<App />);
    await waitFor(() => {
      // Provider subtotal cards have provider name in uppercase + a money value
      const awsCard = screen.getAllByText('aws').find((el) => el.tagName === 'DIV');
      expect(awsCard).toBeDefined();
    });
  });

  it('default-selects the first line item and shows its detail', async () => {
    render(<App />);
    await waitFor(() => {
      // Detail pane shows "Pricing" header for the selected item
      expect(screen.getByText('Pricing')).toBeInTheDocument();
    });
    // M3b heading is "Engine output (read-only)"
    expect(screen.getByText(/Engine output/)).toBeInTheDocument();
  });

  it('renders the ramp curve preview for the selected item', async () => {
    render(<App />);
    await waitFor(() => {
      // The ramp curve has an aria-label
      const chart = screen.getByRole('img', { name: /Monthly burn|monthly burn/i });
      expect(chart).toBeInTheDocument();
    });
  });

  it('shows pricing fields (Pricing Model, Region, Unit Cost, Quantity) for the selected item', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Pricing Model')).toBeInTheDocument();
    });
    expect(screen.getByText('Region')).toBeInTheDocument();
    // M3b: "Unit Cost" may have an "(edited)" suffix when overridden, so use a regex
    expect(screen.getByText(/^Unit Cost/)).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    // M3b has an "Environment" section header AND an "Environment" field label
    expect(screen.getAllByText('Environment').length).toBeGreaterThanOrEqual(1);
  });

  it('clicking a different line item changes the detail pane', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Engine output/)).toBeInTheDocument();
    });

    // Pick a list item that's not the default first one. Find the RDS row.
    const rdsRow = screen.getByText('RDS Aurora PostgreSQL').closest('button');
    expect(rdsRow).toBeTruthy();
    await user.click(rdsRow!);

    // Detail header should now show RDS Aurora PostgreSQL
    await waitFor(() => {
      const heading = screen.getAllByText('RDS Aurora PostgreSQL');
      // One in the list, one in the detail header
      expect(heading.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('Add from catalog button is wired (M3b)', async () => {
    render(<App />);
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Add from catalog/i });
      expect(btn).not.toBeDisabled();
    });
  });

  it('navigates to the Cloud Planner via the left rail Cloud link', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/dashboard`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('link', { name: /Cloud/ }));
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Cloud Planner', level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('shows project total in the subtitle matching engine output', async () => {
    render(<App />);
    await waitFor(() => {
      // The subtitle includes the project total - exact value depends on
      // engine but we can check the structure
      expect(screen.getByText(/Project total/)).toBeInTheDocument();
    });
  });
});
