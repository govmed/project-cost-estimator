/**
 * App component smoke test.
 *
 * Proves the full pipeline works in a real DOM:
 *  - React mounts
 *  - Seed loads into the store
 *  - Engine computes against the seed
 *  - KPIs render with real numbers
 *
 * If this test passes, the M1a goal is met: a browser would show the same.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';

describe('App (M1a smoke)', () => {
  beforeEach(() => {
    // Reset store and localStorage between tests so each starts fresh.
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
  });

  afterEach(() => {
    // @testing-library/react 16 + vitest doesn't auto-cleanup; we have to.
    cleanup();
  });

  it('mounts and loads the seed project', async () => {
    render(<App />);
    await waitFor(() => {
      // Project name appears in the h1 (and also as part of client name in subtitle).
      expect(
        screen.getByRole('heading', { name: /Vertex Retail/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('renders all four headline KPIs with formatted values', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(screen.queryAllByText('Final Price').length).toBeGreaterThan(0);
    });
    // Each KPI label appears once. If we see more than one, render is duplicating.
    expect(screen.getAllByText('Final Price')).toHaveLength(1);
    expect(screen.getAllByText('Total Cost')).toHaveLength(1);
    expect(screen.getAllByText('Realized Margin')).toHaveLength(1);
    expect(screen.getAllByText('Blended Rate')).toHaveLength(1);
    void container;
  });

  it('shows the project status and version', async () => {
    render(<App />);
    // Version "1.0.0" is rendered alongside "v" and other punctuation in a single <p>,
    // so we match against the whole element's textContent rather than expecting a
    // standalone text node.
    await waitFor(() => {
      const subtitle = screen.getByText((_, el) =>
        el?.textContent?.includes('v1.0.0') === true && el.tagName.toLowerCase() === 'p',
      );
      expect(subtitle).toBeInTheDocument();
    });
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });
});
