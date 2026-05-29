/**
 * NewProjectWizardPage tests (M5c).
 *
 * Three-step flow:
 *   Basics → Pricing → Phases → Confirm
 *
 * Each step has Next/Back nav. The Create button on step 4 calls the
 * factory + setProject, then navigates to the new project's Setup screen.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';

describe('NewProjectWizardPage (M5c)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', '/new');
  });

  afterEach(() => cleanup());

  it('renders the heading and step indicator', async () => {
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'New Project', level: 1 }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/1\. Basics/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Pricing/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Phases/)).toBeInTheDocument();
    expect(screen.getByText(/4\. Confirm/)).toBeInTheDocument();
  });

  it('Next is disabled on Basics until name + client are entered', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'New Project', level: 1 }));

    const next = screen.getByRole('button', { name: /Next/i });
    expect(next).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/Acme Modernization/i), 'My Project');
    expect(next).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/Acme Inc/i), 'My Client');
    expect(next).toBeEnabled();
  });

  it('advances through all four steps and creates a project', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'New Project', level: 1 }));

    // Basics
    await user.type(screen.getByPlaceholderText(/Acme Modernization/i), 'My Project');
    await user.type(screen.getByPlaceholderText(/Acme Inc/i), 'Acme Co');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Pricing - defaults are valid
    expect(screen.getByRole('heading', { name: /Pricing/, level: 2 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Phases - defaults are valid
    expect(screen.getByRole('heading', { name: /Phases/, level: 2 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Confirm - shows summary
    expect(screen.getByRole('heading', { name: /Ready to create/i })).toBeInTheDocument();
    expect(screen.getByText(/My Project/)).toBeInTheDocument();
    expect(screen.getByText(/Acme Co/)).toBeInTheDocument();

    // Create
    const beforeId = useProjectStore.getState().project?.id;
    await user.click(screen.getByRole('button', { name: /Create Project/i }));

    await waitFor(() => {
      const afterId = useProjectStore.getState().project?.id;
      expect(afterId).not.toBe(beforeId);
      expect(useProjectStore.getState().project?.name).toBe('My Project');
    });
  });

  it('Back button returns to the previous step', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'New Project', level: 1 }));

    await user.type(screen.getByPlaceholderText(/Acme Modernization/i), 'Test');
    await user.type(screen.getByPlaceholderText(/Acme Inc/i), 'Test');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    expect(screen.getByRole('heading', { name: /Pricing/, level: 2 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByRole('heading', { name: /Project Basics/, level: 2 })).toBeInTheDocument();
  });

  it('Phases step lets you add and remove phases', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'New Project', level: 1 }));

    // Skip basics + pricing
    await user.type(screen.getByPlaceholderText(/Acme Modernization/i), 'Test');
    await user.type(screen.getByPlaceholderText(/Acme Inc/i), 'Test');
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Standard 6 phases pre-filled
    expect(screen.getByLabelText(/Phase 1 name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phase 6 name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Phase 7 name/i)).not.toBeInTheDocument();

    // Add a phase
    await user.click(screen.getByRole('button', { name: /\+ Add phase/i }));
    expect(screen.getByLabelText(/Phase 7 name/i)).toBeInTheDocument();

    // Remove the new phase
    await user.click(screen.getByRole('button', { name: /Remove phase New Phase/i }));
    expect(screen.queryByLabelText(/Phase 7 name/i)).not.toBeInTheDocument();
  });

  it('Confirm step warns if an existing project will be replaced', async () => {
    // Seed the store first
    useProjectStore.getState().setProject(
      // minimal dummy project so existingProject is truthy
      {
        id: 'proj_existing' as any,
        name: 'Existing',
        client: 'X',
        version: '1.0.0',
        status: 'draft',
        engagementType: 'FixedFee',
        engagementContext: 'Modernization',
        baseCurrency: 'USD',
        fxRates: { USD: 1, EUR: 0.93, GBP: 0.79, INR: 83.5, CAD: 1.36, AUD: 1.52, BRL: 5.1 },
        targetMarginPct: 25,
        discountPct: 0,
        contingencyPct: 0,
        managementReservePct: 0,
        phases: [],
        activeScenarioId: 'sc_x' as any,
        baseScenarioId: 'sc_x' as any,
        ownerId: 'u' as any,
        orgId: 'o' as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
      [],
    );

    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'New Project', level: 1 }));

    // Step through
    await user.type(screen.getByPlaceholderText(/Acme Modernization/i), 'New Test');
    await user.type(screen.getByPlaceholderText(/Acme Inc/i), 'New Client');
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Confirm shows the warning
    expect(screen.getByText(/will replace it/i)).toBeInTheDocument();
  });

  it('LeftRail "+ New Project" link navigates here', async () => {
    // Start at the seed dashboard
    window.history.pushState({}, '', '/p/proj_vtx_modernization_2026/dashboard');
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('heading', { name: 'Dashboard', level: 1 }));

    await user.click(screen.getByRole('link', { name: /New Project/ }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'New Project', level: 1 })).toBeInTheDocument(),
    );
  });
});

describe('Populated Onshore-Only scenario (M5c)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', '/p/proj_vtx_modernization_2026/scenarios');
  });

  afterEach(() => cleanup());

  it('Onshore-Only now has 12 resources matching Base count', async () => {
    render(<App />);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument(),
    );

    const state = useProjectStore.getState();
    const base = state.scenarios.find((s) => s.isBase)!;
    const onshore = state.scenarios.find((s) => !s.isBase)!;
    expect(base.resources.length).toBe(12);
    expect(onshore.resources.length).toBe(12);
  });

  it('Onshore-Only resources are all US-Onshore', async () => {
    render(<App />);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument(),
    );

    const onshore = useProjectStore
      .getState()
      .scenarios.find((s) => !s.isBase)!;
    const geos = new Set(onshore.resources.map((r) => r.geography));
    expect(geos.size).toBe(1);
    expect(geos.has('US-Onshore')).toBe(true);
  });

  it('Onshore-Only has 1 framing assumption', async () => {
    render(<App />);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument(),
    );

    const onshore = useProjectStore
      .getState()
      .scenarios.find((s) => !s.isBase)!;
    expect(onshore.assumptions.length).toBe(1);
    expect(onshore.assumptions[0].topic).toMatch(/onshore/i);
  });
});
