/**
 * Scenarios Compare grid tests (M4b).
 *
 * Tests focus on the Compare grid behavior:
 *  - Selection via checkboxes (0, 1, 2-4)
 *  - Baseline = first selected
 *  - Cards render with proper deltas vs baseline
 *  - "Clear selection" wipes the grid
 *  - >4 disables further checkboxes
 *  - Selection survives unrelated state changes
 *
 * Selectors note: scenario names appear in the table, in the top-rail
 * dropdown, AND now in the Compare cards. Card headings are <h3> -
 * that's the most specific scope, so tests use level 3 headings to
 * verify a card was rendered.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';
import type { ProjectId } from '../../src/types/ids';

const PROJECT_ID = 'proj_vtx_modernization_2026' as ProjectId;

describe('Scenarios Compare grid (M4b)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.history.pushState({}, '', `/p/${PROJECT_ID}/scenarios`);
  });

  afterEach(() => cleanup());

  it('renders the heading "Scenarios & Compare"', async () => {
    render(<App />);
    await waitFor(() => {
      // Specific full title - distinguishes from M4a's "Scenarios"
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('default state shows the "select to compare" tip', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Tick scenarios above to compare/i)).toBeInTheDocument();
    });
    // Compare counter shows 0 of 4
    expect(screen.getByText(/Compare \(0 of 4 max\)/)).toBeInTheDocument();
  });

  it('selecting one scenario shows the "select one more" tip', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('checkbox', { name: /Select Base Case/i }));

    expect(screen.getByText(/One scenario selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare \(1 of 4 max\)/)).toBeInTheDocument();
    // No cards yet
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('selecting two scenarios renders two Compare cards', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('checkbox', { name: /Select Base Case/i }));
    await user.click(
      screen.getByRole('checkbox', { name: /Select Onshore-Only \(Conservative\)/i }),
    );

    // Two <h3> headings = two cards
    const cards = screen.getAllByRole('heading', { level: 3 });
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toBe('Base Case');
    expect(cards[1].textContent).toBe('Onshore-Only (Conservative)');

    // Compare counter
    expect(screen.getByText(/Compare \(2 of 4 max\)/)).toBeInTheDocument();
  });

  it('baseline card shows no deltas; second card shows deltas vs first', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('checkbox', { name: /Select Base Case/i }));
    await user.click(
      screen.getByRole('checkbox', { name: /Select Onshore-Only \(Conservative\)/i }),
    );

    const cards = screen.getAllByRole('heading', { level: 3 });
    const baselineCard = cards[0].closest('[data-testid^="compare-card-"]')!;
    const secondCard = cards[1].closest('[data-testid^="compare-card-"]')!;

    // Baseline shows zero delta markers (no +/- percentages)
    // We check by looking at the Final Price metric in the baseline; it should
    // have only the value, no parenthesized percentage.
    const baselineFinalPriceLabel = within(baselineCard as HTMLElement).getByText(
      'Final Price',
    );
    const baselineFinalPriceRow = baselineFinalPriceLabel.parentElement!;
    // No "+X%" or "-X%" text in the baseline row
    expect(baselineFinalPriceRow.textContent).not.toMatch(/[+-]\d+\.\d%/);

    // Second card has a delta - either positive or negative
    const secondFinalPriceLabel = within(secondCard as HTMLElement).getByText(
      'Final Price',
    );
    const secondFinalPriceRow = secondFinalPriceLabel.parentElement!;
    expect(secondFinalPriceRow.textContent).toMatch(/[+-]/);
  });

  it('clearing selection removes all cards', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('checkbox', { name: /Select Base Case/i }));
    await user.click(
      screen.getByRole('checkbox', { name: /Select Onshore-Only \(Conservative\)/i }),
    );
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(screen.queryAllByRole('heading', { level: 3 }).length).toBe(0);
    expect(screen.getByText(/Tick scenarios above to compare/i)).toBeInTheDocument();
  });

  it('cannot select more than 4 scenarios (5th checkbox is disabled)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument();
    });

    // Need 5 scenarios; clone the seed's 2 up to 5 by hitting + Clone 3 times
    const cloneBtn = screen.getByRole('button', { name: /\+ Clone active scenario/i });
    await user.click(cloneBtn);
    await user.click(cloneBtn);
    await user.click(cloneBtn);
    await waitFor(() => {
      expect(useProjectStore.getState().scenarios.length).toBe(5);
    });

    // Re-query checkboxes after the new rows appear
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(5);

    // Select the first 4
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);
    await user.click(checkboxes[3]);

    // 5th checkbox now disabled
    expect(checkboxes[4]).toBeDisabled();

    // Compare counter caps at 4
    expect(screen.getByText(/Compare \(4 of 4 max\)/)).toBeInTheDocument();
  });

  it('selection index labels show BASE / +1 / +2 in click order', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('checkbox', { name: /Select Onshore-Only \(Conservative\)/i }),
    );
    await user.click(screen.getByRole('checkbox', { name: /Select Base Case/i }));

    // First clicked = Onshore-Only = BASE
    // Second clicked = Base Case = +1
    expect(screen.getByText('BASE')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('deleting a selected scenario removes it from the grid', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Scenarios & Compare', level: 1 }),
      ).toBeInTheDocument();
    });

    // Clone so we have a deletable extra
    await user.click(screen.getByRole('button', { name: /\+ Clone active scenario/i }));
    await waitFor(() => {
      expect(useProjectStore.getState().scenarios.length).toBe(3);
    });

    // Select Base Case + the new clone for compare
    await user.click(
      screen.getByRole('checkbox', { name: /^Select Base Case for compare$/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /Select Base Case \(copy\)/i }),
    );
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBe(2);

    // Delete the clone (two clicks)
    await user.click(
      screen.getByRole('button', { name: /Delete Base Case \(copy\)/i }),
    );
    await user.click(
      screen.getByRole('button', { name: /Confirm delete Base Case \(copy\)/i }),
    );

    // After delete, only one scenario remains selected. The grid shows the
    // "select one more" tip instead of a lone baseline card (since one card
    // alone has no deltas to display - not useful as a "compare").
    await waitFor(() => {
      expect(screen.getByText(/One scenario selected/i)).toBeInTheDocument();
    });
    // No card headings remain
    expect(screen.queryAllByRole('heading', { level: 3 }).length).toBe(0);
  });
});
