/**
 * Welcome coachmark shown on first visit to the dashboard.
 * Dismissed state is persisted in localStorage so it doesn't show again.
 */

import { useState } from 'react';

const KEY = 'sow-calc:coachmark-dismissed';

export function useCoachmarkDismissed() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  function dismiss() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // ignore storage errors
    }
    setDismissed(true);
  }

  return { dismissed, dismiss };
}

export function WelcomeCoachmark({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start justify-between gap-4 rounded-lg border border-accent/40 bg-accent/5 px-5 py-4"
    >
      <div>
        <p className="text-sm font-medium text-foreground">
          Welcome to SOW Cost Calculator
        </p>
        <p className="mt-1 text-sm text-muted-fg">
          You're looking at the Vertex Retail example project. Explore the{' '}
          <strong>Resource Planner</strong>, add cloud costs, clone scenarios, and export to XLSX or
          PDF. Click any headline KPI to see the derivation behind it.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss welcome message"
        className="shrink-0 rounded px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Got it
      </button>
    </div>
  );
}
