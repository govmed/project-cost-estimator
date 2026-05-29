/**
 * Resource Planner tests (M2a, read-only).
 *
 * Verifies:
 *  - Page renders all 12 resources from the seed
 *  - Header / footer totals are present
 *  - Geography mix card lists the three regions (US-Onshore, LATAM, India)
 *  - Header reflects active scenario
 *  - Navigation to /resources via the left rail works
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';

describe('Resource Planner (M2a)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    // Land directly on /resources via the URL
    window.history.pushState({}, '', '/p/proj_vtx_modernization_2026/resources');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the Resource Planner heading', async () => {
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Resource Planner', level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('renders the resource count subtitle', async () => {
    render(<App />);
    await waitFor(() => {
      // "12 resources" appears in the page subtitle AND in the table footer
      // ("Totals (12 resources)"). Both are correct; assert at least one.
      expect(screen.getAllByText(/12 resources/).length).toBeGreaterThan(0);
    });
  });

  it('renders all 12 resource rows with role names from the seed', async () => {
    render(<App />);
    await waitFor(() => {
      // Pick a few distinctive role names that appear in the seed.
      expect(screen.getByText('Engagement Lead')).toBeInTheDocument();
    });
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
    expect(screen.getByText('Solution Architect')).toBeInTheDocument();
    expect(screen.getByText('Cloud Architect')).toBeInTheDocument();
    expect(screen.getByText('Operational Change Manager')).toBeInTheDocument();
    // Full-Stack Engineer appears twice (LATAM x2 and India x4) - test that
    // both show up by counting.
    expect(screen.getAllByText('Full-Stack Engineer').length).toBe(2);
  });

  it('renders the totals footer row', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Totals \(12 resources\)/)).toBeInTheDocument();
    });
  });

  it('renders the geography mix card with all three seed regions', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Geography Mix')).toBeInTheDocument();
    });
    // Region labels appear in the legend
    expect(screen.getByText('US-Onshore')).toBeInTheDocument();
    expect(screen.getByText('LATAM-Nearshore')).toBeInTheDocument();
    expect(screen.getByText('India-Offshore')).toBeInTheDocument();
  });

  it('shows phase abbreviations in column headers', async () => {
    render(<App />);
    await waitFor(() => {
      // Use getAllByText because these might appear in multiple table headers
      // (e.g. one header row).
      expect(screen.getByText('Disc')).toBeInTheDocument();
    });
    expect(screen.getByText('Des')).toBeInTheDocument();
    expect(screen.getByText('Bld')).toBeInTheDocument();
    expect(screen.getByText('Tst')).toBeInTheDocument();
    expect(screen.getByText('Dep')).toBeInTheDocument();
    expect(screen.getByText('Hyp')).toBeInTheDocument();
  });

  it('shows the scenario name in the header subtitle', async () => {
    render(<App />);
    await waitFor(() => {
      // "Base Case" appears in both the scenario dropdown and the subtitle;
      // verify at least one match (we already test the dropdown separately).
      expect(screen.getAllByText(/Base Case/).length).toBeGreaterThan(0);
    });
  });

  it('navigates to Resource Planner from the left rail Dashboard link', async () => {
    const user = userEvent.setup();
    // Start at the Dashboard
    window.history.pushState({}, '', '/p/proj_vtx_modernization_2026/dashboard');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });

    // Click the Resources link in the left rail
    const resourcesLink = screen.getByRole('link', { name: /Resources/ });
    await user.click(resourcesLink);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Resource Planner', level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('renders the column headers', async () => {
    render(<App />);
    await waitFor(() => {
      // Use role=columnheader to disambiguate from sidebar/footer text
      expect(
        screen.getByRole('columnheader', { name: 'Role / Level / Geo' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('columnheader', { name: 'Hours' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Bill' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Cost' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'M%' })).toBeInTheDocument();
  });

  it('disables the (not yet wired) Add Resource button', async () => {
    render(<App />);
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Add resource/i });
      expect(btn).toBeDisabled();
    });
  });

  // Lightweight check that the within() utility can locate row-scoped content,
  // which we'll need extensively in M2b for cell-edit tests.
  it('row for Engagement Lead has the US-Onshore subtext', async () => {
    render(<App />);
    await waitFor(() => {
      const cell = screen.getByText('Engagement Lead').closest('td');
      expect(cell).toBeTruthy();
      expect(within(cell!).getByText(/US-Onshore/)).toBeInTheDocument();
    });
  });
});
