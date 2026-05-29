/**
 * App smoke test (M1b).
 *
 * Verifies the chrome and routing render correctly:
 *  - App mounts, loads seed
 *  - Top rail shows project name + KPIs
 *  - Left rail shows navigation items
 *  - Dashboard (default route) renders engine output
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';

describe('App (M1b chrome + routing)', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    // Reset URL to root so the router lands on the default redirect.
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
  });

  it('mounts and loads the seed project name in the top rail', async () => {
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByText('Vertex Retail - Commerce Platform Modernization'),
      ).toBeInTheDocument();
    });
  });

  it('renders the left rail navigation items', async () => {
    render(<App />);
    await waitFor(() => {
      // "Dashboard" appears as both a nav link and the page heading, so query
      // the nav link specifically by its role.
      expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Resources/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cloud/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Scenarios/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Assumptions/ })).toBeInTheDocument();
  });

  it('hides the M&A Mode nav item because the seed is a Modernization (no M&A)', async () => {
    // The seed engagementContext is "Modernization", so M&A Mode should be hidden.
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: /M&A Mode/ })).not.toBeInTheDocument();
  });

  it('renders the dashboard with engine KPIs by default', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByText('Final Price')).toBeInTheDocument();
    expect(screen.getByText('Realized Margin')).toBeInTheDocument();
  });

  it('renders the scenario chooser with both seed scenarios', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Base Case \(base\)/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Onshore-Only/ })).toBeInTheDocument();
  });

  it('shows nav count badges (12 resources, 8 cloud, 5 other)', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Resources/ })).toBeInTheDocument();
    });
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
