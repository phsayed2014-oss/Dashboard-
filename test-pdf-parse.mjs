import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const PDF_PATH = process.argv[2] || '/home/ubuntu/.cursor/projects/workspace/uploads/_____________________16-05-2026__a09f.pdf';

const SEC_WORDS = ['GASTROENTEROLOGY','ENDOCRINOLOGY','OPHTHALMOLOGY','OPTHALMOLOGY','RHEUMATOLOGY','PULMONOLOGY','PARACITIONER','DERMATOLOGY','ORTHOPAEDIC','PSYCHIATRY','OBSTETRICS','PAEDIATRIC','CARDIOLOGY','NEPHROLOGY','NEUROLOGY','ONCOLOGY','INTERNAL','UROLOGY','GENERAL','SURGERY','DENTAL','RADIOLOGY','GYNECOLOGY','MEDICINE','ENT'];
const COL_P = [0, 75], COL_PN = [75, 243], COL_SVC = [243, 471], COL_ORD = [471, 535], COL_ST = [535, 596], COL_DS = [596, 1200];

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

async function parsePDFBuffer(buf) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
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
  return { rows, numPages: pdf.numPages };
}

function aggregate(rows) {
  const docMap = new Map(), drugMap = new Map(), secMap = new Map();
  const patients = new Set();
  const statusCounts = {};
  const normStatus = (s) => {
    const u = (s || '').toUpperCase();
    if (u.includes('CLOS')) return 'Closed';
    if (u.includes('CANC')) return 'Canceled';
    if (u.includes('NEW')) return 'New';
    if (u.includes('OPEN')) return 'Opened';
    if (u.includes('PEND')) return 'Pending';
    if (u.includes('ACTIV')) return 'Active';
    return s || 'غير محدد';
  };
  rows.forEach(r => {
    if (r.patient) patients.add(r.patient);
    const st = normStatus(r.status);
    statusCounts[st] = (statusCounts[st] || 0) + 1;
    if (r.doctor) {
      let d = docMap.get(r.doctor);
      if (!d) { d = { name: r.doctor, section: r.section, total: 0, drugs: new Map() }; docMap.set(r.doctor, d); }
      d.total++;
      if (r.section && !d.section) d.section = r.section;
      if (r.service) d.drugs.set(r.service, (d.drugs.get(r.service) || 0) + 1);
    }
    if (r.service) {
      let dr = drugMap.get(r.service);
      if (!dr) { dr = { name: r.service, total: 0 }; drugMap.set(r.service, dr); }
      dr.total++;
    }
    if (r.section) {
      let s = secMap.get(r.section);
      if (!s) { s = { name: r.section, total: 0 }; secMap.set(r.section, s); }
      s.total++;
    }
  });
  return {
    doctors: [...docMap.values()].sort((a, b) => b.total - a.total),
    drugs: [...drugMap.values()].sort((a, b) => b.total - a.total),
    sections: [...secMap.values()].sort((a, b) => b.total - a.total),
    totalRows: rows.length,
    totalPatients: patients.size,
    statusCounts
  };
}

function buildSmartInsightsData(rows) {
  const docMap = new Map();
  let grandTotal = rows.length;
  rows.forEach(r => {
    if (!r.doctor) return;
    if (!docMap.has(r.doctor)) docMap.set(r.doctor, { name: r.doctor, total: 0 });
    docMap.get(r.doctor).total++;
  });
  const allDocs = [...docMap.values()].sort((a, b) => b.total - a.total);
  const avgTotal = allDocs.length ? allDocs.reduce((s, d) => s + d.total, 0) / allDocs.length : 0;
  return { grandTotal, doctors: allDocs.length, topDoctor: allDocs[0], avgTotal };
}

async function samplePage(buf, pageNum = 1) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  const page = await pdf.getPage(pageNum);
  const c = await page.getTextContent();
  const lines = {};
  c.items.forEach(it => {
    const y = Math.round(it.transform[5]);
    if (!lines[y]) lines[y] = [];
    lines[y].push({ x: Math.round(it.transform[4]), s: it.str.trim() });
  });
  const ys = Object.keys(lines).map(Number).sort((a, b) => b - a).slice(0, 25);
  return ys.map(y => lines[y].filter(w => w.s).sort((a, b) => a.x - b.x).map(w => `[${w.x}]${w.s}`).join(' '));
}

async function main() {
  console.log('PDF:', PDF_PATH);
  const buf = fs.readFileSync(PDF_PATH);
  console.log('Size:', (buf.length / 1024).toFixed(1), 'KB');

  console.log('\n--- Sample page 1 lines (first 15) ---');
  const sample = await samplePage(buf, 1);
  sample.slice(0, 15).forEach((l, i) => console.log(String(i + 1).padStart(2), l.slice(0, 200)));

  const { rows, numPages } = await parsePDFBuffer(buf);
  console.log('\n--- Parse result ---');
  console.log('Pages:', numPages);
  console.log('Rows parsed:', rows.length);
  if (!rows.length) {
    console.error('FAIL: No rows extracted');
    process.exit(1);
  }

  const agg = aggregate(rows);
  console.log('Doctors:', agg.doctors.length);
  console.log('Drugs:', agg.drugs.length);
  console.log('Sections:', agg.sections.length);
  console.log('Patients:', agg.totalPatients);
  console.log('Status:', agg.statusCounts);
  console.log('Top 5 doctors:', agg.doctors.slice(0, 5).map(d => `${d.name} (${d.total})`).join(' | '));
  console.log('Top 5 drugs:', agg.drugs.slice(0, 5).map(d => `${d.name.slice(0, 40)} (${d.total})`).join(' | '));
  console.log('Top 5 sections:', agg.sections.slice(0, 5).map(s => `${s.name} (${s.total})`).join(' | '));

  const missingDoctor = rows.filter(r => !r.doctor).length;
  const missingService = rows.filter(r => !r.service).length;
  const missingSection = rows.filter(r => r.doctor && !r.section).length;
  console.log('\n--- Quality checks ---');
  console.log('Missing doctor:', missingDoctor, `(${(missingDoctor / rows.length * 100).toFixed(1)}%)`);
  console.log('Missing service:', missingService, `(${(missingService / rows.length * 100).toFixed(1)}%)`);
  console.log('Missing section (with doctor):', missingSection, `(${(missingSection / rows.length * 100).toFixed(1)}%)`);

  const insights = buildSmartInsightsData(rows);
  console.log('\n--- Smart Insights preview ---');
  console.log('Grand total:', insights.grandTotal);
  console.log('Doctors for insights:', insights.doctors);
  console.log('Top doctor:', insights.topDoctor?.name, insights.topDoctor?.total);

  const sampleRows = rows.slice(0, 3);
  console.log('\n--- Sample rows ---');
  sampleRows.forEach((r, i) => console.log(i + 1, JSON.stringify(r)));

  const pass = rows.length > 100 && agg.doctors.length > 5 && agg.drugs.length > 5;
  console.log('\n=== OVERALL:', pass ? 'PASS ✓' : 'FAIL ✗', '===');
  process.exit(pass ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(2); });
