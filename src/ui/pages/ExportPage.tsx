/**
 * ExportPage - M5b.
 *
 * The Export Center. Four format cards (XLSX, CSV, PDF, JSON) plus a
 * scenario selector. Each card has its own download flow:
 *
 *   - XLSX: single-button. Builds a multi-sheet workbook for the selected
 *     scenario, downloads it.
 *   - CSV: three sub-buttons (Resources / Cloud / Other Costs), one CSV
 *     per data type.
 *   - PDF: single-button. Builds a formal cover-page-style PDF.
 *   - JSON: single-button. Exports the full project + all scenarios + audit
 *     log as a single .json file.
 *
 * Lazy-loaded via the route so the heavy export deps (xlsx, jspdf) only
 * land when the user navigates here.
 *
 * Per-card state machine: idle -> generating -> success | error. Errors
 * show inline with a "Try again" hint.
 */

import { useMemo, useState } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import { calculate } from '@/engine/calculate';
import { readAudit } from '@/data/audit-log';
import { downloadBlob } from '@/export/download';
import {
  buildJsonExport,
  jsonExportBlob,
  jsonExportFilename,
} from '@/export/exporters/json';
import {
  resourcesToCsv,
  cloudToCsv,
  otherCostsToCsv,
  csvBlob,
  csvFilename,
} from '@/export/exporters/csv';
import {
  buildXlsxExport,
  xlsxBlob,
  xlsxFilename,
} from '@/export/exporters/xlsx';
import {
  buildPdfExport,
  pdfFilename,
} from '@/export/exporters/pdf';

type CardStatus = 'idle' | 'generating' | 'success' | 'error';

export function ExportPage() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const activeTotals = useScenarioTotals();

  const activeScenario = useMemo(
    () => selectActiveScenario({ scenarios, activeScenarioId }),
    [scenarios, activeScenarioId],
  );

  // Which scenario to export. Defaults to the active one but the user can pick any.
  const [exportScenarioId, setExportScenarioId] = useState<string | null>(null);
  const effectiveScenarioId = exportScenarioId ?? activeScenarioId;
  const exportScenario =
    scenarios.find((s) => s.id === effectiveScenarioId) ?? activeScenario;

  // Compute totals for the chosen export scenario (which may differ from active).
  const exportTotals = useMemo(() => {
    if (!project || !exportScenario) return null;
    if (exportScenario.id === activeScenarioId) return activeTotals;
    return calculate(project, exportScenario);
  }, [project, exportScenario, activeScenarioId, activeTotals]);

  // Per-card status
  const [xlsxStatus, setXlsxStatus] = useState<CardStatus>('idle');
  const [pdfStatus, setPdfStatus] = useState<CardStatus>('idle');
  const [jsonStatus, setJsonStatus] = useState<CardStatus>('idle');
  const [csvResourcesStatus, setCsvResourcesStatus] = useState<CardStatus>('idle');
  const [csvCloudStatus, setCsvCloudStatus] = useState<CardStatus>('idle');
  const [csvOtherStatus, setCsvOtherStatus] = useState<CardStatus>('idle');

  const [error, setError] = useState<string | null>(null);

  if (!project || !exportScenario || !exportTotals) {
    return <div className="px-8 py-12 text-muted-fg">No active scenario.</div>;
  }

  // ---------- handlers ----------

  async function handleXlsx() {
    setError(null);
    setXlsxStatus('generating');
    try {
      const bytes = await buildXlsxExport({
        project: project!,
        scenario: exportScenario!,
        totals: exportTotals!,
        audit: readAudit(project!.id),
        scenariosForAuditNames: scenarios,
      });
      downloadBlob(xlsxBlob(bytes), xlsxFilename(project!));
      setXlsxStatus('success');
      setTimeout(() => setXlsxStatus('idle'), 3000);
    } catch (e) {
      setXlsxStatus('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handlePdf() {
    setError(null);
    setPdfStatus('generating');
    try {
      const blob = await buildPdfExport({
        project: project!,
        scenario: exportScenario!,
        totals: exportTotals!,
      });
      downloadBlob(blob, pdfFilename(project!));
      setPdfStatus('success');
      setTimeout(() => setPdfStatus('idle'), 3000);
    } catch (e) {
      setPdfStatus('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleJson() {
    setError(null);
    setJsonStatus('generating');
    try {
      const payload = buildJsonExport(project!, scenarios);
      downloadBlob(jsonExportBlob(payload), jsonExportFilename(project!));
      setJsonStatus('success');
      setTimeout(() => setJsonStatus('idle'), 3000);
    } catch (e) {
      setJsonStatus('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleCsv(
    kind: 'resources' | 'cloud' | 'other-costs',
    setStatus: (s: CardStatus) => void,
  ) {
    setError(null);
    setStatus('generating');
    try {
      let text: string;
      if (kind === 'resources') text = resourcesToCsv(exportScenario!, exportTotals!);
      else if (kind === 'cloud') text = cloudToCsv(exportScenario!, exportTotals!);
      else text = otherCostsToCsv(exportScenario!, exportTotals!);
      downloadBlob(csvBlob(text), csvFilename(project!, exportScenario!.name, kind));
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // ---------- render ----------

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Export Center</h1>
        <p className="text-sm text-muted-fg">
          Generate downloads for the selected scenario. Heavy formats (XLSX, PDF)
          load their dependencies the first time you click — there may be a small
          pause on the first download.
        </p>
      </div>

      {/* Scenario picker */}
      <div className="mb-6 rounded-lg border border-border bg-background p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-fg">
            Scenario to export
          </label>
          <select
            value={effectiveScenarioId ?? ''}
            onChange={(e) => setExportScenarioId(e.target.value)}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.id === activeScenarioId ? ' (active)' : ''}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-muted-fg">
          Currently exporting: <span className="font-medium">{exportScenario.name}</span>{' '}
          · final price{' '}
          <span className="font-mono">
            ${Math.round(exportTotals.finalPrice.amount).toLocaleString()}
          </span>
          {' · '}
          {Math.round(exportTotals.totalBillableHours).toLocaleString()} hours
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-status-bad/30 bg-status-bad/5 px-3 py-2 text-sm text-status-bad">
          <span className="font-medium">Export failed:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* XLSX */}
        <FormatCard
          title="XLSX Workbook"
          subtitle="Excel-compatible multi-sheet workbook"
          description="Summary KPIs, resources, cloud, other costs, by-phase, assumptions, and the full audit log on separate sheets. The signature client deliverable."
          status={xlsxStatus}
          onDownload={handleXlsx}
          downloadLabel="Download .xlsx"
          testId="export-xlsx"
        />

        {/* PDF */}
        <FormatCard
          title="PDF Report"
          subtitle="Formal cost estimate for sharing"
          description="Cover page, headline KPIs, by-phase breakdown, top resources, and key assumptions. CFO-readable; suitable for client procurement."
          status={pdfStatus}
          onDownload={handlePdf}
          downloadLabel="Download .pdf"
          testId="export-pdf"
        />

        {/* CSV */}
        <div
          className="rounded-lg border border-border bg-background p-5"
          data-testid="export-csv"
        >
          <h3 className="text-base font-semibold">CSV Files</h3>
          <p className="text-xs text-muted-fg">Flat data per category</p>
          <p className="mt-3 text-sm text-muted-fg">
            Three separate CSVs — Resources, Cloud line items, Other costs. Each row
            has the raw fields plus the engine-computed totals. UTF-8 with BOM so
            Excel opens them cleanly.
          </p>
          <div className="mt-4 flex flex-col gap-1.5">
            <CsvSubButton
              label={`Resources (${exportScenario.resources.length} rows)`}
              status={csvResourcesStatus}
              onClick={() => handleCsv('resources', setCsvResourcesStatus)}
              testId="export-csv-resources"
            />
            <CsvSubButton
              label={`Cloud (${exportScenario.cloudLineItems.length} rows)`}
              status={csvCloudStatus}
              onClick={() => handleCsv('cloud', setCsvCloudStatus)}
              testId="export-csv-cloud"
            />
            <CsvSubButton
              label={`Other costs (${exportScenario.otherCostLineItems.length} rows)`}
              status={csvOtherStatus}
              onClick={() => handleCsv('other-costs', setCsvOtherStatus)}
              testId="export-csv-other"
            />
          </div>
        </div>

        {/* JSON */}
        <FormatCard
          title="JSON Backup"
          subtitle="Complete app state for backup / sharing"
          description="Everything: project, all scenarios, audit history. Round-trip safe (re-import support is a future enhancement). Use this to share a model with a colleague or stash a backup before risky changes."
          status={jsonStatus}
          onDownload={handleJson}
          downloadLabel="Download .json"
          testId="export-json"
        />
      </div>

      <p className="mt-6 text-xs text-muted-fg">
        Bundle note: this page lazy-loads the export deps (xlsx, jspdf) so they
        don't slow other screens. First click may pause briefly while the chunk
        downloads.
      </p>
    </div>
  );
}

// -----------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------

function FormatCard({
  title,
  subtitle,
  description,
  status,
  onDownload,
  downloadLabel,
  testId,
}: {
  title: string;
  subtitle: string;
  description: string;
  status: CardStatus;
  onDownload: () => void;
  downloadLabel: string;
  testId: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5" data-testid={testId}>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-xs text-muted-fg">{subtitle}</p>
      <p className="mt-3 text-sm text-muted-fg">{description}</p>
      <button
        type="button"
        onClick={onDownload}
        disabled={status === 'generating'}
        className="mt-4 rounded bg-accent px-3 py-1.5 text-sm text-accent-fg hover:bg-accent/90 disabled:opacity-50"
      >
        {status === 'generating' ? 'Generating…' : downloadLabel}
      </button>
      {status === 'success' && (
        <span className="ml-2 text-xs text-status-good">✓ downloaded</span>
      )}
    </div>
  );
}

function CsvSubButton({
  label,
  status,
  onClick,
  testId,
}: {
  label: string;
  status: CardStatus;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === 'generating'}
      data-testid={testId}
      className="flex items-center justify-between rounded border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
    >
      <span>{label}</span>
      <span className="text-xs text-muted-fg">
        {status === 'generating' ? '…' : status === 'success' ? '✓' : '↓'}
      </span>
    </button>
  );
}
