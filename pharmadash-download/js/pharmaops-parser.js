/**
 * PharmaOps Parser — browser module (mirrors pharmaops/parser Python port).
 * UI redesigns must NOT edit this file; change Python + this module only.
 */
(function (global) {
  'use strict';

  function normalizeRow(r) {
    const map = {};
    Object.keys(r).forEach(k => { map[k.replace(/\s+/g, '').toLowerCase()] = k; });
    const get = (...keys) => {
      for (const k of keys) {
        const key = map[k.toLowerCase()];
        if (key !== undefined) {
          const v = r[key];
          if (v !== '' && v != null) return String(v).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
      return '';
    };
    const doctor = get('doctorname', 'اسمالطبيب');
    const service = get('servicename', 'اسمالخدمة');
    const section = get('sectionname', 'اسمالقسم');
    const patient = get('patientno', 'رقمالمريض');
    const patientName = get('patientname', 'اسمالمريض');
    const orderNo = get('orderno', 'رقمالأمر');
    const status = get('status', 'الحالة');
    if (!doctor && !service) return null;
    return { doctor, service, section, patient, patientName, orderNo, status };
  }

  async function parseExcel(file) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sh = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sh, { defval: '', raw: true }).map(normalizeRow).filter(Boolean);
  }

  async function parseCSV(file) {
    const text = await file.text();
    const wb = XLSX.read(text, { type: 'string' });
    const sh = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sh, { defval: '' }).map(normalizeRow).filter(Boolean);
  }

  async function parseJSON(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.rows)) {
      return data.rows.map(r => normalizeRow(r) || r).filter(r => r && (r.doctor || r.service));
    }
    throw new Error('JSON غير صالح — يجب أن يحتوي على rows[]');
  }

  async function parsePDF(file) {
    if (!global.pdfjsLib) global.pdfjsLib = global['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const SEC_WORDS = ['GASTROENTEROLOGY', 'ENDOCRINOLOGY', 'OPHTHALMOLOGY', 'OPTHALMOLOGY', 'RHEUMATOLOGY', 'PULMONOLOGY', 'PARACITIONER', 'DERMATOLOGY', 'ORTHOPAEDIC', 'PSYCHIATRY', 'OBSTETRICS', 'PAEDIATRIC', 'CARDIOLOGY', 'NEPHROLOGY', 'NEUROLOGY', 'ONCOLOGY', 'INTERNAL', 'UROLOGY', 'GENERAL', 'SURGERY', 'DENTAL', 'RADIOLOGY', 'GYNECOLOGY', 'MEDICINE', 'ENT'];
    const COL_P = [0, 75], COL_PN = [75, 243], COL_SVC = [243, 476], COL_ORD = [476, 535], COL_ST = [535, 596], COL_DS = [596, 1200];
    function g(ws, r) { return ws.filter(w => w.x >= r[0] && w.x < r[1]).map(w => w.s).join(' ').trim(); }
    function splitDS(txt) {
      const words = txt.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const w = words[i], wu = w.toUpperCase();
        if (SEC_WORDS.includes(wu)) continue;
        for (const sec of SEC_WORDS) {
          const idx = wu.indexOf(sec);
          if (idx > 0) {
            const d = words.slice(0, i).join(' ') + ' ' + w.slice(0, idx);
            const s = w.slice(idx) + ' ' + words.slice(i + 1).join(' ');
            return { doctor: d.trim(), section: s.trim() };
          }
        }
      }
      for (let i = 0; i < words.length; i++) {
        if (SEC_WORDS.includes(words[i].toUpperCase())) {
          return { doctor: words.slice(0, i).join(' ').trim(), section: words.slice(i).join(' ').trim() };
        }
      }
      return { doctor: txt.trim(), section: '' };
    }
    const rows = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const c = await page.getTextContent();
      const lmap = {};
      c.items.forEach(it => {
        const y = Math.round(it.transform[5] / 3) * 3;
        if (!lmap[y]) lmap[y] = [];
        lmap[y].push({ x: it.transform[4], s: it.str.trim() });
      });
      Object.keys(lmap).map(Number).sort((a, b) => b - a).forEach(y => {
        const ws = lmap[y].filter(w => w.s).sort((a, b) => a.x - b.x);
        if (!ws.length) return;
        const first = ws[0].s;
        if (/Patient No|Medication Orders|From Date|To Date|Doctor Name/.test(ws.map(w => w.s).join(' '))) return;
        if (!/^\d{5,7}$/.test(first)) return;
        const ds = splitDS(g(ws, COL_DS));
        const row = {
          patient: g(ws, COL_P), patientName: g(ws, COL_PN), service: g(ws, COL_SVC),
          orderNo: g(ws, COL_ORD), status: g(ws, COL_ST), doctor: ds.doctor, section: ds.section
        };
        if (row.section) row.section = row.section.toUpperCase().replace('OPTHALMOLOGY', 'OPHTHALMOLOGY');
        if (row.status) {
          const su = row.status.toUpperCase();
          row.status = su.includes('CLOS') ? 'Closed' : su.includes('CANC') ? 'Canceled' : su.includes('NEW') ? 'New' : su.includes('OPEN') ? 'Opened' : su.includes('PEND') ? 'Pending' : row.status;
        }
        if (row.service || row.doctor) rows.push(row);
      });
    }
    if (!rows.length) throw new Error('لم أتمكن من تحليل الـ PDF — تأكد من أن الملف من Oracle Reports');
    return rows;
  }

  async function ingestFile(file) {
    const n = file.name.toLowerCase();
    if (n.endsWith('.xlsx') || n.endsWith('.xls')) return parseExcel(file);
    if (n.endsWith('.csv')) return parseCSV(file);
    if (n.endsWith('.pdf')) return parsePDF(file);
    if (n.endsWith('.json')) return parseJSON(file);
    throw new Error('صيغة غير مدعومة — xlsx/csv/pdf/json فقط');
  }

  const api = { normalizeRow, parseExcel, parseCSV, parsePDF, parseJSON, ingestFile };
  global.PharmaOpsParser = api;

  // Backward-compatible globals for existing dashboard code
  global.normalizeRow = normalizeRow;
  global.parseExcel = parseExcel;
  global.parseCSV = parseCSV;
  global.parsePDF = parsePDF;
  global.parseJSON = parseJSON;
  global.ingestPharmaFile = ingestFile;
})(typeof window !== 'undefined' ? window : globalThis);
