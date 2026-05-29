/**
 * ExportPage UI tests (M5b).
 *
 * JSDOM doesn't ship URL.createObjectURL, so we polyfill it and intercept
 * the temporary anchor's .click() to capture the download attempt. This
 * gives us a clean assertion: "the user clicked Download .json and we
 * tried to download a file with this filename."
 *
 * The actual blob contents are validated separately in
 * tests/export/exporters.test.ts.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { useProjectStore } from '../../src/data/store';
import type { ProjectId } from '../../src/types/ids';

const PROJECT_ID = 'proj_vtx_modernization_2026' as ProjectId;

interface CapturedDownload {
  filename: string;
  href: string;
}

let captured: CapturedDownload[] = [];
let origAnchorClick: () => void;
let origCreateObjectURL: typeof URL.createObjectURL | undefined;

beforeEach(() => {
  captured = [];

  // Polyfill createObjectURL / revokeObjectURL (jsdom doesn't ship them)
  if (typeof URL.createObjectURL !== 'function') {
    origCreateObjectURL = undefined;
    (URL as any).createObjectURL = (b: Blob) => `blob:test-${b.size}-${b.type}`;
    (URL as any).revokeObjectURL = () => {};
  } else {
    origCreateObjectURL = URL.createObjectURL;
  }

  origAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) {
      captured.push({ filename: this.download, href: this.href });
    } else {
      origAnchorClick.call(this);
    }
  };

  useProjectStore.getState().reset();
  if (typeof localStorage !== 'undefined') localStorage.clear();
  window.history.pushState({}, '', `/p/${PROJECT_ID}/export`);
});

afterEach(() => {
  HTMLAnchorElement.prototype.click = origAnchorClick;
  cleanup();
});

async function renderAndWait() {
  render(<App />);
  await waitFor(
    () => {
      expect(
        screen.getByRole('heading', { name: 'Export Center', level: 1 }),
      ).toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}

describe('ExportPage (M5b)', () => {
  it('renders the heading and the four format cards', async () => {
    await renderAndWait();
    expect(screen.getByText('XLSX Workbook')).toBeInTheDocument();
    expect(screen.getByText('PDF Report')).toBeInTheDocument();
    expect(screen.getByText('CSV Files')).toBeInTheDocument();
    expect(screen.getByText('JSON Backup')).toBeInTheDocument();
  });

  it('shows the active scenario summary', async () => {
    await renderAndWait();
    // The summary line is unique because of "Currently exporting:" prefix
    const summary = screen.getByText(/Currently exporting/).parentElement!;
    expect(summary.textContent).toContain('Base Case');
    expect(summary.textContent).toContain('$2,369,903');
  });

  it('clicking Download .json captures a download with .json filename', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole('button', { name: /Download \.json/ }));
    await waitFor(() => expect(captured.length).toBeGreaterThan(0));
    expect(captured[0].filename).toMatch(/\.json$/);
  });

  it('clicking a CSV sub-button captures a CSV download', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByTestId('export-csv-resources'));
    await waitFor(() => expect(captured.length).toBeGreaterThan(0));
    expect(captured[0].filename).toMatch(/resources_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('XLSX flow goes idle -> generating -> success', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    const btn = screen.getByRole('button', { name: /Download \.xlsx/ });
    await user.click(btn);
    // XLSX uses dynamic import. Wait for either success state or download capture.
    await waitFor(() => expect(captured.length).toBeGreaterThan(0), { timeout: 8000 });
    expect(captured[0].filename).toMatch(/\.xlsx$/);
  });

  it('PDF flow downloads a .pdf', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    const btn = screen.getByRole('button', { name: /Download \.pdf/ });
    await user.click(btn);
    await waitFor(() => expect(captured.length).toBeGreaterThan(0), { timeout: 8000 });
    expect(captured[0].filename).toMatch(/\.pdf$/);
  });

  it('switching scenario in the picker changes the summary', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    // Initially Base Case is showing in the summary
    const summary = screen.getByText(/Currently exporting/).parentElement!;
    expect(summary.textContent).toContain('$2,369,903');

    // The export-page scenario picker is inside a panel that also has the label
    // "Scenario to export". Pick it by name to disambiguate from the top-rail.
    const exportSection = screen.getByText('Scenario to export').parentElement!;
    const picker = exportSection.querySelector('select') as HTMLSelectElement;
    expect(picker).toBeTruthy();
    await user.selectOptions(picker, 'sc_onshore_only');

    // Onshore-Only is now populated with US-Onshore rates (M5c). Same scope
    // as Base, ~44% more expensive. Expected final price: $3,402,535.
    await waitFor(() => {
      const updatedSummary = screen.getByText(/Currently exporting/).parentElement!;
      expect(updatedSummary.textContent).toContain('Onshore-Only');
      expect(updatedSummary.textContent).toContain('$3,402,535');
    });
  });

  it('switching scenario and clicking CSV exports the chosen scenario', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    const exportSection = screen.getByText('Scenario to export').parentElement!;
    const picker = exportSection.querySelector('select') as HTMLSelectElement;
    await user.selectOptions(picker, 'sc_onshore_only');
    await user.click(screen.getByTestId('export-csv-resources'));
    await waitFor(() => expect(captured.length).toBeGreaterThan(0));
    expect(captured[0].filename).toContain('Onshore-Only');
  });
});
