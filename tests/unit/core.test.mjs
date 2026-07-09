import { describe, expect, it } from 'vitest';
import {
  escapeSpreadsheetFormula,
  localDateKey,
  normalizeEntityKey,
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

describe('local dates', () => {
  it('does not convert local midnight through UTC', () => {
    const local = new Date(2026, 4, 7, 0, 15);
    expect(localDateKey(local)).toBe('2026-05-07');
  });
});
