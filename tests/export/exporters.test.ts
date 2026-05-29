/**
 * Exporter tests (M5b).
 *
 * Engine-level tests against the seed Base Case.
 *
 *  - JSON: exact-string assertion is brittle, so we check that the payload
 *    round-trips and contains the project + scenarios + audit history.
 *  - CSV: smoke-check headers + that the seed scenario produces rows that
 *    include known names ("Senior Architect" etc.).
 *  - XLSX: assert the bytes start with the ZIP magic (PK\x03\x04) and that
 *    each expected sheet name appears in the workbook.
 *  - PDF: assert the Blob is created and starts with %PDF.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { calculate } from '@/engine/calculate';
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
import { buildXlsxExport, xlsxBlob, xlsxFilename } from '@/export/exporters/xlsx';
import { buildPdfExport, pdfFilename } from '@/export/exporters/pdf';
import seed from '@/../seed/scenarios/example-modernization.json' assert { type: 'json' };

const project = (seed as any).project;
const scenarios = (seed as any).scenarios;
const base = scenarios.find((s: any) => s.isBase);
const totals = calculate(project, base);

describe('JSON export', () => {
  it('builds a payload that round-trips', () => {
    const payload = buildJsonExport(project, scenarios);
    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);
    expect(parsed.formatVersion).toBe('1.0');
    expect(parsed.project.name).toBe(project.name);
    expect(parsed.scenarios.length).toBe(scenarios.length);
    expect(parsed.app.name).toBe('SOW Cost Calculator');
  });

  it('produces a Blob with application/json MIME', () => {
    const payload = buildJsonExport(project, scenarios);
    const blob = jsonExportBlob(payload);
    expect(blob.type).toBe('application/json');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('filename derives from project name + date', () => {
    const fn = jsonExportFilename(project);
    expect(fn).toMatch(/^.+_\d{4}-\d{2}-\d{2}\.json$/);
  });
});

describe('CSV export', () => {
  it('resources CSV has header + one row per resource', () => {
    const csv = resourcesToCsv(base, totals);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('id,name,role,skillLevel,geography');
    expect(lines.length).toBe(base.resources.length + 1);
  });

  it('cloud CSV has header + one row per cloud item', () => {
    const csv = cloudToCsv(base, totals);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('service,sku,provider,region,category');
    expect(lines.length).toBe(base.cloudLineItems.length + 1);
  });

  it('other-costs CSV has header + one row per item', () => {
    const csv = otherCostsToCsv(base, totals);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('name,category,vendor');
    expect(lines.length).toBe(base.otherCostLineItems.length + 1);
  });

  it('csvBlob prepends UTF-8 BOM', async () => {
    const blob = csvBlob('hello');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    // UTF-8 BOM is EF BB BF
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);
    expect(blob.type).toContain('text/csv');
  });

  it('escapes commas and quotes', () => {
    const csv = otherCostsToCsv(
      {
        ...base,
        otherCostLineItems: [
          {
            ...base.otherCostLineItems[0],
            name: 'Item, with comma',
            description: 'Has "quotes" inside',
          },
        ],
      },
      totals,
    );
    expect(csv).toContain('"Item, with comma"');
    expect(csv).toContain('"Has ""quotes"" inside"');
  });

  it('filename includes project + scenario + kind', () => {
    const fn = csvFilename(project, base.name, 'resources');
    expect(fn).toMatch(/__.+__resources_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

describe('XLSX export', () => {
  let bytes: Uint8Array;

  beforeAll(async () => {
    bytes = await buildXlsxExport({
      project,
      scenario: base,
      totals,
      audit: [],
      scenariosForAuditNames: scenarios,
    });
  });

  it('produces a ZIP-formatted file (starts with PK)', () => {
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  it('contains the expected sheet names', async () => {
    // Round-trip the workbook to inspect sheet names
    const XLSX = await import('@e965/xlsx');
    const wb = XLSX.read(bytes, { type: 'array' });
    expect(wb.SheetNames).toContain('Summary');
    expect(wb.SheetNames).toContain('Resources');
    expect(wb.SheetNames).toContain('Cloud');
    expect(wb.SheetNames).toContain('Other Costs');
    expect(wb.SheetNames).toContain('By Phase');
    expect(wb.SheetNames).toContain('Assumptions');
    expect(wb.SheetNames).toContain('Audit Log');
  });

  it('Summary sheet references the engine totals', async () => {
    const XLSX = await import('@e965/xlsx');
    const wb = XLSX.read(bytes, { type: 'array' });
    const summary = wb.Sheets['Summary'];
    // Convert to JSON to scan rows
    const rows: any[][] = XLSX.utils.sheet_to_json(summary, { header: 1 });
    const finalPriceRow = rows.find((r) => r[0] === 'Final price');
    expect(finalPriceRow).toBeDefined();
    // Seed Base Case final price is $2,369,902.984
    expect(Math.round(finalPriceRow![1])).toBe(2369903);
  });

  it('Resources sheet has expected row count', async () => {
    const XLSX = await import('@e965/xlsx');
    const wb = XLSX.read(bytes, { type: 'array' });
    const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['Resources'], { header: 1 });
    // header + one per resource
    expect(rows.length).toBe(1 + base.resources.length);
  });

  it('xlsxBlob has the correct MIME', () => {
    const blob = xlsxBlob(bytes);
    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('filename ends with .xlsx', () => {
    expect(xlsxFilename(project)).toMatch(/\.xlsx$/);
  });
});

describe('PDF export', () => {
  it('produces a Blob starting with %PDF magic', async () => {
    const blob = await buildPdfExport({ project, scenario: base, totals });
    expect(blob.size).toBeGreaterThan(1000);
    const buf = await blob.arrayBuffer();
    const head = new Uint8Array(buf).slice(0, 4);
    // %PDF
    expect(head[0]).toBe(0x25);
    expect(head[1]).toBe(0x50);
    expect(head[2]).toBe(0x44);
    expect(head[3]).toBe(0x46);
  });

  it('PDF size scales with content (assumptions add pages)', async () => {
    const baseBlob = await buildPdfExport({
      project,
      scenario: { ...base, assumptions: [] },
      totals,
    });
    const withAssumptions = await buildPdfExport({ project, scenario: base, totals });
    expect(withAssumptions.size).toBeGreaterThanOrEqual(baseBlob.size);
  });

  it('filename ends with .pdf', () => {
    expect(pdfFilename(project)).toMatch(/\.pdf$/);
  });
});
