export const SNAPSHOT_SCHEMA_VERSION = 2;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOAD_ROWS = 500_000;

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;

export function normalizeWhitespace(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\u00A0/g, ' ')
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeEntityKey(value) {
  return normalizeWhitespace(value)
    .replace(ARABIC_DIACRITICS, '')
    .replace(/\u0640/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .toLocaleUpperCase('en-US');
}

export function normalizeStatus(value) {
  const status = normalizeEntityKey(value);
  if (status.includes('CLOS') || status.includes('مغلق')) return 'Closed';
  if (status.includes('CANC') || status.includes('ملغي') || status.includes('ملغى')) return 'Canceled';
  if (status.includes('NEW') || status.includes('جديد')) return 'New';
  if (status.includes('OPEN') || status.includes('مفتوح')) return 'Opened';
  if (status.includes('PEND') || status.includes('معلق')) return 'Pending';
  if (status.includes('ACTIV') || status.includes('نشط')) return 'Active';
  return normalizeWhitespace(value) || 'غير محدد';
}

const MONTHS = new Map([
  ['يناير', 1], ['JANUARY', 1], ['JAN', 1],
  ['فبراير', 2], ['FEBRUARY', 2], ['FEB', 2],
  ['مارس', 3], ['MARCH', 3], ['MAR', 3],
  ['ابريل', 4], ['APRIL', 4], ['APR', 4],
  ['مايو', 5], ['MAY', 5],
  ['يونيو', 6], ['يونيه', 6], ['JUNE', 6], ['JUN', 6],
  ['يوليو', 7], ['يوليه', 7], ['JULY', 7], ['JUL', 7],
  ['اغسطس', 8], ['AUGUST', 8], ['AUG', 8],
  ['سبتمبر', 9], ['SEPTEMBER', 9], ['SEP', 9],
  ['اكتوبر', 10], ['OCTOBER', 10], ['OCT', 10],
  ['نوفمبر', 11], ['NOVEMBER', 11], ['NOV', 11],
  ['ديسمبر', 12], ['DECEMBER', 12], ['DEC', 12],
]);

export function periodDateScore(label) {
  const source = normalizeEntityKey(label);
  if (!source) return 0;

  let year = Number(source.match(/\b(20\d{2})\b/)?.[1] || 0);
  let month = 0;

  const yearMonth = source.match(/\b(20\d{2})[/-](0?[1-9]|1[0-2])\b/);
  const monthYear = source.match(/\b(0?[1-9]|1[0-2])[/-](20\d{2})\b/);
  if (yearMonth) {
    year = Number(yearMonth[1]);
    month = Number(yearMonth[2]);
  } else if (monthYear) {
    month = Number(monthYear[1]);
    year = Number(monthYear[2]);
  }

  if (!month) {
    for (const [token, value] of [...MONTHS.entries()].sort((a, b) => b[0].length - a[0].length)) {
      if (source.includes(token)) {
        month = value;
        break;
      }
    }
  }

  if (!month) {
    const quarter = source.match(/(?:Q|ربع\s*)([1-4])/);
    if (quarter) month = Number(quarter[1]) * 3;
  }

  return year && month ? year * 100 + month : 0;
}

export function sortPeriods(periods) {
  return [...(periods || [])].sort((a, b) => {
    const aScore = periodDateScore(a?.label);
    const bScore = periodDateScore(b?.label);
    if (aScore && bScore && aScore !== bScore) return aScore - bScore;
    if (aScore !== bScore) return aScore ? -1 : 1;
    return Number(a?.id || 0) - Number(b?.id || 0);
  });
}

export function selectPeriodRange(periods) {
  const sorted = sortPeriods(periods);
  if (!sorted.length) return { oldest: null, newest: null, sorted };
  return { oldest: sorted[0], newest: sorted.at(-1), sorted };
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function escapeSpreadsheetFormula(value) {
  if (typeof value !== 'string') return value;
  const normalized = value.replace(/^\s+/, '');
  return /^[=+\-@]/.test(normalized) ? `'${value}` : value;
}

export function sanitizeExportRow(row, { anonymize = false } = {}) {
  const safe = {};
  for (const [key, value] of Object.entries(row || {})) {
    if (anonymize && ['patient', 'patientName', 'orderNo'].includes(key)) {
      safe[key] = '';
    } else {
      safe[key] = escapeSpreadsheetFormula(value);
    }
  }
  return safe;
}

export function validateRxRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
  return ['doctor', 'service', 'section', 'patient', 'patientName', 'orderNo', 'status']
    .every((key) => row[key] == null || ['string', 'number'].includes(typeof row[key]))
    && Boolean(normalizeWhitespace(row.doctor) || normalizeWhitespace(row.service));
}

export function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return { valid: false, error: 'invalid-root' };
  }
  if (!snapshot.periods || typeof snapshot.periods !== 'object') {
    return { valid: false, error: 'invalid-periods' };
  }
  for (const branch of ['T1', 'T2', 'T3']) {
    const periods = snapshot.periods[branch];
    if (periods != null && !Array.isArray(periods)) return { valid: false, error: `invalid-${branch}` };
    for (const period of periods || []) {
      if (!period || typeof period !== 'object' || !Array.isArray(period.rows)) {
        return { valid: false, error: `invalid-period-${branch}` };
      }
      if (period.rows.length > MAX_UPLOAD_ROWS || !period.rows.every(validateRxRow)) {
        return { valid: false, error: `invalid-rows-${branch}` };
      }
    }
  }
  return { valid: true, version: Number(snapshot.v || 1) };
}
