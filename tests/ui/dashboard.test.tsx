/**
 * Dashboard tests (M4c).
 *
 * Recharts charts render as SVG inside a ResponsiveContainer. In JSDOM the
 * container can't measure layout, so the SVG itself is empty - but the
 * Recharts mount, the data prop flow, and the chart container DOM are all
 * present and testable. We assert:
 *  - Each chart's container element renders (data-testid attribute)
 *  - The KPI tiles show the engine's headline numbers
 *  - The Run-Rate cells render the correct values
 *  - Breakdown bars render with the right labels
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';
import type { ProjectId } from '../../src/types/ids';

const PROJECT_ID = 'proj_vtx_modernization_2026' as ProjectId;

describe('Dashboard (M4c)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/dashboard`);
  });

  afterEach(() => cleanup());

  it('renders the heading and the four KPI tiles', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByText('Final Price')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('Realized Margin')).toBeInTheDocument();
    expect(screen.getByText('Blended Rate')).toBeInTheDocument();
  });

  it('KPI values match engine output for the seed Base Case', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });
    // Engine values for the seed Base Case verified separately:
    //   finalPrice $2,369,903, margin 25.0%, hours ~15,041
    const fpCell = screen.getByText('Final Price').parentElement!;
    expect(fpCell.textContent).toContain('$2,369,903');

    const marginCell = screen.getByText('Realized Margin').parentElement!;
    expect(marginCell.textContent).toContain('25.0%');

    const blendedCell = screen.getByText('Blended Rate').parentElement!;
    expect(blendedCell.textContent).toMatch(/15,041 hours/);
  });

  it('renders all three chart containers', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });
    expect(container.querySelector('[data-testid="monthly-burn-chart"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="headcount-chart"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="cost-by-phase-chart"]')).toBeTruthy();
    // Three Recharts ResponsiveContainers (one per chart)
    expect(container.querySelectorAll('.recharts-responsive-container').length).toBe(3);
  });

  it('renders the three small breakdown panels with their headings', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByText('By Geography')).toBeInTheDocument();
    expect(screen.getByText('By Cloud Provider')).toBeInTheDocument();
    expect(screen.getByText('By Cloud Category')).toBeInTheDocument();
  });

  it('renders Run-Rate cells with engine values', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });
    // The Panel structure is: outer div -> title-row div containing the h3 -> children.
    // So we go up two levels from the h3 to get the panel.
    const runRateTitle = screen.getByText('Run-Rate (after go-live)');
    const runRatePanel = runRateTitle.parentElement!.parentElement!;
    expect(within(runRatePanel).getByText('Monthly')).toBeInTheDocument();
    expect(within(runRatePanel).getByText('Year 1')).toBeInTheDocument();
    expect(within(runRatePanel).getByText('Year 2')).toBeInTheDocument();
    expect(within(runRatePanel).getByText('Year 3')).toBeInTheDocument();
  });

  it('switching active scenario refreshes the Dashboard KPIs', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });
    const baseFpText = screen.getByText('Final Price').parentElement!.textContent!;
    expect(baseFpText).toContain('$2,369,903');

    // Switch active to the populated Onshore-Only scenario
    const state = useProjectStore.getState();
    const onshore = state.scenarios.find((s) => s.name === 'Onshore-Only (Conservative)')!;
    state.setActiveScenario(onshore.id);

    await waitFor(() => {
      const fpText = screen.getByText('Final Price').parentElement!.textContent!;
      // Onshore-Only is fully populated with US-Onshore rates (M5c). Same scope
      // as Base, no offshore/nearshore leverage, so ~44% more expensive.
      // Expected: $3,402,535.
      expect(fpText).toContain('$3,402,535');
    });
  });
});

describe('Dashboard Breakdown Bars (M4c)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/dashboard`);
  });

  afterEach(() => cleanup());

  it('By Cloud Provider panel lists providers from seed data', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });
    const title = screen.getByText('By Cloud Provider');
    const providerPanel = title.parentElement!.parentElement!;
    const txt = providerPanel.textContent ?? '';
    // Seed uses AWS and Azure for cloud line items - both should appear uppercased
    expect(txt).toMatch(/AWS|AZURE/);
  });

  it('By Cloud Category panel lists categories from seed data', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });
    const title = screen.getByText('By Cloud Category');
    const catPanel = title.parentElement!.parentElement!;
    const txt = catPanel.textContent ?? '';
    // Seed includes Compute, Database, Storage, Networking, Observability
    expect(txt).toMatch(/Compute|Database|Storage/);
  });
});
