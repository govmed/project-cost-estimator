/**
 * PDF exporter (M5b).
 *
 * Produces a formal cost-estimate PDF suitable for handing to a CFO or
 * client procurement. Layout:
 *
 *   Cover  — project name, client, scenario, date, final price
 *   Page 2 — Headline KPIs table
 *   Page 3 — By Phase breakdown
 *   Page 4 — Resources summary (top 20 by cost)
 *   Page 5 — Top assumptions (by risk)
 *
 * Uses jspdf + jspdf-autotable. Both dynamically imported so they ship
 * in the same lazy chunk as the rest of /export. Together they add
 * ~250KB raw / ~85KB gzipped.
 */

import type { ScenarioTotals } from '@/engine/types';
import type { Scenario } from '@/types/scenario';
import type { Project } from '@/types/project';

export interface PdfExportInput {
  project: Project;
  scenario: Scenario;
  totals: ScenarioTotals;
}

/**
 * Build a PDF as a Blob. Dynamic-imports jspdf so this module's static
 * imports don't pull jspdf into the bundle.
 */
export async function buildPdfExport(input: PdfExportInput): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // -------- Cover page --------
  renderCover(doc, input);

  // -------- KPI table --------
  doc.addPage();
  renderKpis(doc, autoTable, input);

  // -------- By Phase --------
  doc.addPage();
  renderByPhase(doc, autoTable, input);

  // -------- Resources --------
  doc.addPage();
  renderResources(doc, autoTable, input);

  // -------- Assumptions --------
  if (input.scenario.assumptions.length > 0) {
    doc.addPage();
    renderAssumptions(doc, autoTable, input);
  }

  return doc.output('blob');
}

type JsPdfType = import('jspdf').jsPDF;
type AutoTableFn = typeof import('jspdf-autotable').autoTable;

// -----------------------------------------------------------------
// Page renderers
// -----------------------------------------------------------------

function renderCover(doc: JsPdfType, { project, scenario, totals }: PdfExportInput) {
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Cost Estimate', 60, 60);

  doc.setFontSize(24);
  doc.setTextColor(20);
  doc.text(project.name, 60, 120);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Client: ${project.client}`, 60, 145);
  doc.text(`Scenario: ${scenario.name}`, 60, 165);
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, 60, 185);

  // Large final price block
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text('FINAL PRICE', 60, 280);

  doc.setFontSize(40);
  doc.setTextColor(20);
  doc.text(formatMoney(totals.finalPrice.amount, totals.finalPrice.currency), 60, 325);

  doc.setFontSize(11);
  doc.setTextColor(100);
  const subline = `${Math.round(totals.totalBillableHours).toLocaleString()} billable hours · ${totals.realizedMarginPct.toFixed(1)}% margin`;
  doc.text(subline, 60, 350);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'Internal estimate. Subject to change pending discovery, statement of work, and contracting.',
    60,
    750,
  );
}

function renderKpis(doc: JsPdfType, autoTable: AutoTableFn, input: PdfExportInput) {
  const { totals } = input;
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text('Headline KPIs', 60, 60);

  const rows: [string, string][] = [
    ['Final Price', formatMoney(totals.finalPrice.amount, totals.finalPrice.currency)],
    ['Target Price', formatMoney(totals.targetPrice.amount, totals.finalPrice.currency)],
    ['Total Cost', formatMoney(totals.totalCost.amount, totals.finalPrice.currency)],
    ['  Resources subtotal', formatMoney(totals.resourcesSubtotal.amount, totals.finalPrice.currency)],
    ['  Cloud subtotal', formatMoney(totals.cloudSubtotal.amount, totals.finalPrice.currency)],
    ['  Other costs subtotal', formatMoney(totals.otherCostsSubtotal.amount, totals.finalPrice.currency)],
    ['  Contingency', formatMoney(totals.contingencyAmount.amount, totals.finalPrice.currency)],
    ['  Management reserve', formatMoney(totals.managementReserveAmount.amount, totals.finalPrice.currency)],
    ['Realized Margin', formatMoney(totals.realizedMargin.amount, totals.finalPrice.currency)],
    ['Realized Margin %', `${totals.realizedMarginPct.toFixed(2)}%`],
    ['Total Billable Hours', Math.round(totals.totalBillableHours).toLocaleString()],
    ['Effective Blended Rate', `${formatMoney(totals.effectiveBlendedRate.amount, totals.finalPrice.currency)}/hr`],
    ['Run-Rate Monthly', formatMoney(totals.runRateMonthly.amount, totals.finalPrice.currency)],
    ['Run-Rate Year 1', formatMoney(totals.runRateYear1.amount, totals.finalPrice.currency)],
    ['Run-Rate Year 2', formatMoney(totals.runRateYear2.amount, totals.finalPrice.currency)],
    ['Run-Rate Year 3', formatMoney(totals.runRateYear3.amount, totals.finalPrice.currency)],
  ];

  autoTable(doc, {
    startY: 80,
    head: [['Metric', 'Value']],
    body: rows,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: { 1: { halign: 'right', cellWidth: 200 } },
  });
}

function renderByPhase(doc: JsPdfType, autoTable: AutoTableFn, input: PdfExportInput) {
  const { totals } = input;
  doc.setFontSize(16);
  doc.text('Cost by Phase', 60, 60);

  const rows = totals.byPhase.map((p) => [
    p.phaseName,
    `${p.durationWeeks} wk`,
    formatMoney(p.resourceCost.amount, totals.finalPrice.currency),
    formatMoney(p.cloudCost.amount, totals.finalPrice.currency),
    formatMoney(p.otherCost.amount, totals.finalPrice.currency),
    formatMoney(p.totalCost.amount, totals.finalPrice.currency),
    p.fteAverage.toFixed(1),
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['Phase', 'Duration', 'Resources', 'Cloud', 'Other', 'Total', 'Avg FTE']],
    body: rows,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
  });
}

function renderResources(doc: JsPdfType, autoTable: AutoTableFn, input: PdfExportInput) {
  const { scenario, totals } = input;
  doc.setFontSize(16);
  doc.text('Resources (top 20 by cost)', 60, 60);

  const totalsById = new Map(totals.resources.map((t) => [t.resourceId, t]));
  const joined = scenario.resources
    .map((r) => {
      const t = totalsById.get(r.id);
      return {
        name: r.name ?? `${r.role} (${r.skillLevel})`,
        geography: r.geography,
        billRate: r.billRate.amount,
        hours: t?.totalHours ?? 0,
        billed: t?.billedAmount.amount ?? 0,
        cost: t?.internalCost.amount ?? 0,
      };
    })
    .sort((a, b) => b.billed - a.billed)
    .slice(0, 20);

  const rows = joined.map((r) => [
    r.name,
    r.geography,
    `${formatMoney(r.billRate, totals.finalPrice.currency)}/hr`,
    Math.round(r.hours).toLocaleString(),
    formatMoney(r.billed, totals.finalPrice.currency),
    formatMoney(r.cost, totals.finalPrice.currency),
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['Resource', 'Geo', 'Bill Rate', 'Hours', 'Billed', 'Internal Cost']],
    body: rows,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  if (scenario.resources.length > 20) {
    const lastY = (doc as any).lastAutoTable?.finalY ?? 80;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `+ ${scenario.resources.length - 20} more resources not shown. See the XLSX export for the full list.`,
      60,
      lastY + 20,
    );
  }
}

function renderAssumptions(doc: JsPdfType, autoTable: AutoTableFn, input: PdfExportInput) {
  const { scenario } = input;
  doc.setFontSize(16);
  doc.text('Key Assumptions', 60, 60);

  // Sort: high risk first, then medium, then low
  const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...scenario.assumptions].sort(
    (a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel],
  );

  const rows = sorted.map((a) => [
    a.topic,
    a.riskLevel.toUpperCase(),
    a.source,
    a.description,
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['Topic', 'Risk', 'Source', 'Description']],
    body: rows,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 80 },
      3: { cellWidth: 260 },
    },
  });
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

function formatMoney(amount: number, currency: string): string {
  // Mirror src/ui/format.ts behavior: USD as $X,XXX.XX, others with code.
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  if (currency === 'USD') return `$${formatted}`;
  return `${currency} ${formatted}`;
}

export function pdfFilename(project: Project): string {
  const safeName = project.name.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60);
  const date = new Date().toISOString().slice(0, 10);
  return `${safeName}_${date}.pdf`;
}
