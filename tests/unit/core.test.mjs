import { describe, expect, it } from 'vitest';
import {
  escapeSpreadsheetFormula,
  assessRows,
  deduplicateExactRows,
  localDateKey,
  matchesCatalogProduct,
  normalizeEntityKey,
  normalizeRxRow,
  normalizeStatus,
  periodDateScore,
  sanitizeExportRow,
  selectPeriodRange,
  validateSnapshot,
} from '../../src/core/index.mjs';

describe('normalization', () => {
  it('normalizes whitespace and Arabic variants without losing the display value', () => {
    expect(normalizeEntityKey('  د.  أحمد\u00a0إبراهيم  ')).toBe('د. احمد ابراهيم');
  });

  it('maps English and Arabic statuses to canonical values', () => {
    expect(normalizeStatus('CLOSED')).toBe('Closed');
    expect(normalizeStatus('ملغى')).toBe('Canceled');
    expect(normalizeStatus('جديد')).toBe('New');
  });

  it('maps common English and Arabic report headers into one row model', () => {
    expect(normalizeRxRow({
      'اسم الطبيب': ' د. أحمد ',
      'اسم الخدمة': ' Drug A ',
      'اسم القسم': 'OPTHALMOLOGY',
      'رقم المريض': 12345,
      'الحالة': 'مغلق',
    })).toEqual({
      doctor: 'د. أحمد',
      service: 'Drug A',
      section: 'OPHTHALMOLOGY',
      patient: '12345',
      patientName: '',
      orderNo: '',
      status: 'Closed',
    });
  });
});

describe('period ordering', () => {
  it('understands Arabic, numeric, English and quarter labels', () => {
    expect(periodDateScore('مايو 2026')).toBe(202605);
    expect(periodDateScore('2026-04')).toBe(202604);
    expect(periodDateScore('March 2026')).toBe(202603);
    expect(periodDateScore('Q1 2026')).toBe(202603);
    expect(periodDateScore('الربع 2 2026')).toBe(202606);
  });

  it('chooses chronological oldest/newest regardless of upload order', () => {
    const april = { id: 3, label: 'أبريل 2026' };
    const june = { id: 1, label: 'يونيو 2026' };
    const may = { id: 2, label: 'مايو 2026' };
    const range = selectPeriodRange([june, april, may]);
    expect(range.oldest).toBe(april);
    expect(range.newest).toBe(june);
  });
});

describe('privacy and export safety', () => {
  it('neutralizes spreadsheet formulas', () => {
    expect(escapeSpreadsheetFormula('=HYPERLINK("https://bad")')).toBe('\'=HYPERLINK("https://bad")');
    expect(escapeSpreadsheetFormula('+1+1')).toBe("'+1+1");
    expect(escapeSpreadsheetFormula('Doctor A')).toBe('Doctor A');
  });

  it('can anonymize patient fields', () => {
    expect(sanitizeExportRow({
      doctor: 'Dr A',
      patient: '123',
      patientName: 'Patient',
      orderNo: '=CMD()',
    }, { anonymize: true })).toEqual({
      doctor: 'Dr A',
      patient: '',
      patientName: '',
      orderNo: '',
    });
  });
});

describe('catalog product matching', () => {
  it('separates products with the same brand but different strengths or packs', () => {
    const tablet10 = { short: 'JARDIANCE', name: 'JARDIANCE Coated tablet 10MG/1Tablet, 30Tablet' };
    const tablet25 = { short: 'JARDIANCE', name: 'JARDIANCE Coated tablet 25MG/1Tablet, 30Tablet' };
    expect(matchesCatalogProduct('JARDIANCE COATED TABLET 10MG 1 TABLET 30 TABLET', tablet10)).toBe(true);
    expect(matchesCatalogProduct('JARDIANCE COATED TABLET 10MG 1 TABLET 30 TABLET', tablet25)).toBe(false);

    const bottle225 = { short: 'AZI-ONCE', name: 'AZI-ONCE 200 mg/5 ml Suspension, 22.5 ML/BOTT' };
    const bottle30 = { short: 'AZI-ONCE', name: 'AZI-ONCE 200 mg/5 ml Suspension, 30 ML/BOTT' };
    expect(matchesCatalogProduct('AZI ONCE 200 MG 5 ML SUSPENSION 22.5 ML', bottle225)).toBe(true);
    expect(matchesCatalogProduct('AZI ONCE 200 MG 5 ML SUSPENSION 22.5 ML', bottle30)).toBe(false);
  });
});

describe('snapshot validation', () => {
  it('accepts a valid snapshot', () => {
    const snapshot = {
      v: 2,
      periods: {
        T1: [{ id: 1, label: 'مايو 2026', rows: [{ doctor: 'Dr A', service: 'Drug' }] }],
        T2: [],
        T3: [],
      },
      dt: {},
    };
    expect(validateSnapshot(snapshot)).toEqual({ valid: true, version: 2 });
  });

  it('rejects malformed rows', () => {
    const snapshot = {
      periods: {
        T1: [{ id: 1, label: 'x', rows: [{ doctor: {}, service: 'Drug' }] }],
        T2: [],
        T3: [],
      },
    };
    expect(validateSnapshot(snapshot).valid).toBe(false);
  });
});

describe('data quality', () => {
  it('reports missing fields and exact duplicate rows without deleting automatically', () => {
    const row = normalizeRxRow({ doctorName: 'Dr A', serviceName: 'Drug A', patientNo: '1', status: 'Closed' });
    const quality = assessRows([row, { ...row }], { source: 'pdf', sourceRows: 3, rejectedRows: 1, pages: 2 });
    expect(quality).toMatchObject({
      source: 'pdf',
      pages: 2,
      acceptedRows: 2,
      rejectedRows: 1,
      duplicates: 1,
    });
    expect(quality.warnings.length).toBeGreaterThan(0);
    expect(deduplicateExactRows([row, { ...row }])).toEqual({ rows: [row], removed: 1 });
  });
});

describe('local dates', () => {
  it('does not convert local midnight through UTC', () => {
    const local = new Date(2026, 4, 7, 0, 15);
    expect(localDateKey(local)).toBe('2026-05-07');
  });
});
