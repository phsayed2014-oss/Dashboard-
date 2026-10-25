/* PharmaDash Pro — محرّك قراءة الملفات (منقول كما هو من PharmaDash Pro 3.5) */
/* ══════════════════════════════════════════════════════
   DATA ENGINE — reused, proven parser + analytics
   (PharmaCore + PDF/Excel/CSV parsing + aggregation +
    Private Label / PureHerb product matching)
══════════════════════════════════════════════════════ */

/* ---- PharmaCore ---- */
var PharmaCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/core/index.mjs
  var index_exports = {};
  __export(index_exports, {
    MAX_PDF_PAGES: () => MAX_PDF_PAGES,
    MAX_SNAPSHOT_BYTES: () => MAX_SNAPSHOT_BYTES,
    MAX_SNAPSHOT_ROWS: () => MAX_SNAPSHOT_ROWS,
    MAX_UPLOAD_BYTES: () => MAX_UPLOAD_BYTES,
    MAX_UPLOAD_ROWS: () => MAX_UPLOAD_ROWS,
    SNAPSHOT_SCHEMA_VERSION: () => SNAPSHOT_SCHEMA_VERSION,
    assessRows: () => assessRows,
    countRxHeaderMatches: () => countRxHeaderMatches,
    deduplicateExactRows: () => deduplicateExactRows,
    escapeSpreadsheetFormula: () => escapeSpreadsheetFormula,
    localDateKey: () => localDateKey,
    matchesCatalogProduct: () => matchesCatalogProduct,
    normalizeEntityKey: () => normalizeEntityKey,
    normalizeProductText: () => normalizeProductText,
    normalizeRxRow: () => normalizeRxRow,
    normalizeStatus: () => normalizeStatus,
    normalizeWhitespace: () => normalizeWhitespace,
    periodDateScore: () => periodDateScore,
    rowFingerprint: () => rowFingerprint,
    sanitizeExportRow: () => sanitizeExportRow,
    selectPeriodRange: () => selectPeriodRange,
    sortPeriods: () => sortPeriods,
    validateRxRow: () => validateRxRow,
    validateSnapshot: () => validateSnapshot
  });
  var SNAPSHOT_SCHEMA_VERSION = 2;
  var MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
  var MAX_UPLOAD_ROWS = 5e5;
  var MAX_PDF_PAGES = 1e4;
  var MAX_SNAPSHOT_ROWS = 2e6;
  var MAX_SNAPSHOT_BYTES = 150 * 1024 * 1024;
  var ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
  function stripControlCharacters(value) {
    return [...value].map((character) => {
      const code = character.codePointAt(0);
      return code <= 31 || code >= 127 && code <= 159 ? " " : character;
    }).join("");
  }
  function normalizeWhitespace(value) {
    return stripControlCharacters(
      String(value ?? "").normalize("NFKC").replace(/\u00A0/g, " ")
    ).replace(/\s+/g, " ").trim();
  }
  function normalizeEntityKey(value) {
    return normalizeWhitespace(value).replace(ARABIC_DIACRITICS, "").replace(/\u0640/g, "").replace(/[أإآ]/g, "\u0627").replace(/ى/g, "\u064A").toLocaleUpperCase("en-US");
  }
  function normalizeStatus(value) {
    const status = normalizeEntityKey(value);
    if (status.includes("CLOS") || status.includes("\u0645\u063A\u0644\u0642")) return "Closed";
    if (status.includes("CANC") || status.includes("\u0645\u0644\u063A\u064A") || status.includes("\u0645\u0644\u063A\u0649")) return "Canceled";
    if (status.includes("NEW") || status.includes("\u062C\u062F\u064A\u062F")) return "New";
    if (status.includes("OPEN") || status.includes("\u0645\u0641\u062A\u0648\u062D")) return "Opened";
    if (status.includes("PEND") || status.includes("\u0645\u0639\u0644\u0642")) return "Pending";
    if (status.includes("ACTIV") || status.includes("\u0646\u0634\u0637")) return "Active";
    return normalizeWhitespace(value) || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F";
  }
  var RX_COLUMN_ALIASES = {
    doctor: ["doctor", "doctorname", "physician", "physicianname", "\u0627\u0633\u0645 \u0627\u0644\u0637\u0628\u064A\u0628", "\u0627\u0633\u0645\u0627\u0644\u0637\u0628\u064A\u0628", "\u0627\u0644\u0637\u0628\u064A\u0628"],
    service: ["service", "servicename", "medication", "medicationname", "drug", "drugname", "\u0627\u0633\u0645 \u0627\u0644\u062E\u062F\u0645\u0629", "\u0627\u0633\u0645\u0627\u0644\u062E\u062F\u0645\u0629", "\u0627\u0644\u062F\u0648\u0627\u0621", "\u0627\u0644\u0635\u0646\u0641"],
    section: ["section", "sectionname", "specialty", "speciality", "department", "\u0627\u0633\u0645 \u0627\u0644\u0642\u0633\u0645", "\u0627\u0633\u0645\u0627\u0644\u0642\u0633\u0645", "\u0627\u0644\u0642\u0633\u0645", "\u0627\u0644\u062A\u062E\u0635\u0635"],
    patient: ["patient", "patientno", "patientnumber", "mrn", "\u0631\u0642\u0645 \u0627\u0644\u0645\u0631\u064A\u0636", "\u0631\u0642\u0645\u0627\u0644\u0645\u0631\u064A\u0636"],
    patientName: ["patientname", "\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u064A\u0636", "\u0627\u0633\u0645\u0627\u0644\u0645\u0631\u064A\u0636"],
    orderNo: ["orderno", "ordernumber", "orderid", "\u0631\u0642\u0645 \u0627\u0644\u0627\u0645\u0631", "\u0631\u0642\u0645\u0627\u0644\u0627\u0645\u0631", "\u0631\u0642\u0645 \u0627\u0644\u0623\u0645\u0631", "\u0631\u0642\u0645\u0627\u0644\u0623\u0645\u0631", "\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628", "\u0631\u0642\u0645\u0627\u0644\u0637\u0644\u0628"],
    status: ["status", "orderstatus", "\u0627\u0644\u062D\u0627\u0644\u0629", "\u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628"]
  };
  function headerKey(value) {
    return normalizeEntityKey(value).replace(/[^A-Z0-9\u0600-\u06FF]/g, "");
  }
  var RX_ALIAS_KEYS = Object.fromEntries(
    Object.entries(RX_COLUMN_ALIASES).map(([field, aliases]) => [
      field,
      new Set([field, ...aliases].map(headerKey))
    ])
  );
  function countRxHeaderMatches(headers) {
    const keys = new Set((headers || []).map(headerKey));
    return Object.values(RX_ALIAS_KEYS).filter((aliases) => [...aliases].some((alias) => keys.has(alias))).length;
  }
  function normalizeRxRow(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const values = new Map(Object.entries(raw).map(([key, value]) => [headerKey(key), value]));
    const read = (field) => {
      for (const alias of RX_ALIAS_KEYS[field]) {
        if (!values.has(alias)) continue;
        const value = normalizeWhitespace(values.get(alias));
        if (value) return value;
      }
      return "";
    };
    const row = {
      doctor: read("doctor"),
      service: read("service"),
      section: read("section").replace(/OPTHALMOLOGY/gi, "OPHTHALMOLOGY"),
      patient: read("patient"),
      patientName: read("patientName"),
      orderNo: read("orderNo"),
      status: normalizeStatus(read("status"))
    };
    return row.doctor || row.service ? row : null;
  }
  function rowFingerprint(row) {
    return ["doctor", "service", "section", "patient", "patientName", "orderNo", "status"].map((field) => normalizeEntityKey(row?.[field])).join("");
  }
  function deduplicateExactRows(rows) {
    const seen = /* @__PURE__ */ new Set();
    const unique = [];
    for (const row of rows || []) {
      const fingerprint = rowFingerprint(row);
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      unique.push(row);
    }
    return { rows: unique, removed: Math.max(0, (rows || []).length - unique.length) };
  }
  function assessRows(rows, meta = {}) {
    const list = rows || [];
    const missing = { doctor: 0, service: 0, section: 0, patient: 0, patientName: 0, orderNo: 0, status: 0 };
    const fingerprints = /* @__PURE__ */ new Set();
    let duplicates = 0;
    let unknownStatuses = 0;
    for (const row of list) {
      for (const field of Object.keys(missing)) {
        if (!normalizeWhitespace(row?.[field]) || field === "status" && row.status === "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F") missing[field] += 1;
      }
      const fingerprint = rowFingerprint(row);
      if (fingerprints.has(fingerprint)) duplicates += 1;
      else fingerprints.add(fingerprint);
      if (!["Closed", "Canceled", "New", "Opened", "Pending", "Active"].includes(row?.status)) unknownStatuses += 1;
    }
    const sourceRows = Number(meta.sourceRows ?? list.length);
    const rejectedRows = Number(meta.rejectedRows ?? Math.max(0, sourceRows - list.length));
    const denominator = Math.max(1, sourceRows);
    const penalty = rejectedRows / denominator * 30 + missing.doctor / denominator * 20 + missing.service / denominator * 25 + missing.section / denominator * 8 + missing.patient / denominator * 5 + missing.status / denominator * 5 + duplicates / denominator * 7;
    const score = Math.max(0, Math.round(100 - penalty));
    const warnings = [];
    if (rejectedRows) warnings.push(`${rejectedRows} \u0635\u0641 \u0644\u0645 \u064A\u064F\u0642\u0628\u0644 \u0623\u062B\u0646\u0627\u0621 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0644\u0641`);
    if (missing.doctor) warnings.push(`${missing.doctor} \u0635\u0641 \u0628\u062F\u0648\u0646 \u0637\u0628\u064A\u0628`);
    if (missing.service) warnings.push(`${missing.service} \u0635\u0641 \u0628\u062F\u0648\u0646 \u062F\u0648\u0627\u0621`);
    if (missing.section) warnings.push(`${missing.section} \u0635\u0641 \u0628\u062F\u0648\u0646 \u062A\u062E\u0635\u0635`);
    if (duplicates) warnings.push(`${duplicates} \u0635\u0641 \u0645\u0643\u0631\u0631 \u062A\u0645\u0627\u0645\u064B\u0627`);
    if (unknownStatuses) warnings.push(`${unknownStatuses} \u062D\u0627\u0644\u0629 \u063A\u064A\u0631 \u0642\u064A\u0627\u0633\u064A\u0629`);
    if (meta.source === "pdf" && Number(meta.fallbackPages || 0) > 0) {
      warnings.push(`${Number(meta.fallbackPages)} \u0635\u0641\u062D\u0629 PDF \u0627\u0633\u062A\u064F\u062E\u062F\u0645 \u0644\u0647\u0627 \u062A\u062E\u0637\u064A\u0637 \u0623\u0639\u0645\u062F\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u061B \u0631\u0627\u062C\u0639 \u0639\u064A\u0646\u0629 \u0645\u0646 \u0627\u0644\u0646\u062A\u0627\u0626\u062C`);
    }
    return {
      source: meta.source || "unknown",
      pages: Number(meta.pages || 0),
      sourceRows,
      acceptedRows: list.length,
      rejectedRows,
      missing,
      duplicates,
      unknownStatuses,
      score,
      warnings
    };
  }
  var MONTHS = /* @__PURE__ */ new Map([
    ["\u064A\u0646\u0627\u064A\u0631", 1],
    ["JANUARY", 1],
    ["JAN", 1],
    ["\u0641\u0628\u0631\u0627\u064A\u0631", 2],
    ["FEBRUARY", 2],
    ["FEB", 2],
    ["\u0645\u0627\u0631\u0633", 3],
    ["MARCH", 3],
    ["MAR", 3],
    ["\u0627\u0628\u0631\u064A\u0644", 4],
    ["APRIL", 4],
    ["APR", 4],
    ["\u0645\u0627\u064A\u0648", 5],
    ["MAY", 5],
    ["\u064A\u0648\u0646\u064A\u0648", 6],
    ["\u064A\u0648\u0646\u064A\u0647", 6],
    ["JUNE", 6],
    ["JUN", 6],
    ["\u064A\u0648\u0644\u064A\u0648", 7],
    ["\u064A\u0648\u0644\u064A\u0647", 7],
    ["JULY", 7],
    ["JUL", 7],
    ["\u0627\u063A\u0633\u0637\u0633", 8],
    ["AUGUST", 8],
    ["AUG", 8],
    ["\u0633\u0628\u062A\u0645\u0628\u0631", 9],
    ["SEPTEMBER", 9],
    ["SEP", 9],
    ["\u0627\u0643\u062A\u0648\u0628\u0631", 10],
    ["OCTOBER", 10],
    ["OCT", 10],
    ["\u0646\u0648\u0641\u0645\u0628\u0631", 11],
    ["NOVEMBER", 11],
    ["NOV", 11],
    ["\u062F\u064A\u0633\u0645\u0628\u0631", 12],
    ["DECEMBER", 12],
    ["DEC", 12]
  ]);
  function periodDateScore(label) {
    const source = normalizeEntityKey(label).replace(/_/g, " ");
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
  function sortPeriods(periods) {
    return [...periods || []].sort((a, b) => {
      const aScore = periodDateScore(a?.label);
      const bScore = periodDateScore(b?.label);
      if (aScore && bScore && aScore !== bScore) return aScore - bScore;
      if (aScore !== bScore) return aScore ? -1 : 1;
      return Number(a?.id || 0) - Number(b?.id || 0);
    });
  }
  function selectPeriodRange(periods) {
    const sorted = sortPeriods(periods);
    if (!sorted.length) return { oldest: null, newest: null, sorted };
    const dated = sorted.filter((period) => periodDateScore(period?.label) > 0);
    const candidates = dated.length ? dated : sorted;
    return { oldest: candidates[0], newest: candidates.at(-1), sorted };
  }
  function localDateKey(date = /* @__PURE__ */ new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function escapeSpreadsheetFormula(value) {
    if (typeof value !== "string") return value;
    const normalized = value.replace(/^\s+/, "");
    return /^[=+\-@]/.test(normalized) ? `'${value}` : value;
  }
  function sanitizeExportRow(row, { anonymize = false } = {}) {
    const safe = {};
    for (const [key, value] of Object.entries(row || {})) {
      if (anonymize && !["doctor", "service", "section", "status", "patient", "patientName", "orderNo"].includes(key)) {
        continue;
      }
      if (anonymize && ["patient", "patientName", "orderNo"].includes(key)) {
        safe[key] = "";
      } else {
        safe[key] = escapeSpreadsheetFormula(value);
      }
    }
    return safe;
  }
  function normalizeProductText(value) {
    return normalizeEntityKey(value).replace(/[^A-Z0-9\u0600-\u06FF.]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function numericTokens(value) {
    return [...normalizeProductText(value).matchAll(/\d+(?:\.\d+)?/g)].map((match) => String(Number(match[0]))).filter((token, index, all) => all.indexOf(token) === index);
  }
  function matchesCatalogProduct(drugName, product) {
    const drug = normalizeProductText(drugName);
    const canonical = normalizeProductText(product?.name || product || "");
    const short = normalizeProductText(product?.short || canonical.split(" ")[0] || "");
    if (!drug || !canonical || !short) return false;
    const brandTokens = short.split(" ").filter(Boolean);
    if (!brandTokens.every((token) => drug.split(" ").includes(token))) return false;
    const expectedNumbers = numericTokens(canonical);
    const actualNumbers = new Set(numericTokens(drug));
    return expectedNumbers.every((token) => actualNumbers.has(token));
  }
  function validateRxRow(row) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    return ["doctor", "service", "section", "patient", "patientName", "orderNo", "status"].every((key) => row[key] == null || ["string", "number"].includes(typeof row[key])) && Boolean(normalizeWhitespace(row.doctor) || normalizeWhitespace(row.service));
  }
  function validateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return { valid: false, error: "invalid-root" };
    }
    if (!snapshot.periods || typeof snapshot.periods !== "object") {
      return { valid: false, error: "invalid-periods" };
    }
    if (Number(snapshot.v || 1) > SNAPSHOT_SCHEMA_VERSION) {
      return { valid: false, error: "unsupported-version" };
    }
    let totalRows = 0;
    for (const branch of ["T1", "T2", "T3"]) {
      const periods = snapshot.periods[branch];
      if (periods != null && !Array.isArray(periods)) return { valid: false, error: `invalid-${branch}` };
      for (const period of periods || []) {
        if (!period || typeof period !== "object" || !Array.isArray(period.rows)) {
          return { valid: false, error: `invalid-period-${branch}` };
        }
        if (period.rows.length > MAX_UPLOAD_ROWS || !period.rows.every(validateRxRow)) {
          return { valid: false, error: `invalid-rows-${branch}` };
        }
        totalRows += period.rows.length;
        if (totalRows > MAX_SNAPSHOT_ROWS) return { valid: false, error: "snapshot-too-large" };
      }
    }
    if (snapshot.dt != null) {
      if (typeof snapshot.dt !== "object" || Array.isArray(snapshot.dt)) return { valid: false, error: "invalid-daily-store" };
      for (const [date, branches] of Object.entries(snapshot.dt)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !branches || typeof branches !== "object") {
          return { valid: false, error: "invalid-daily-date" };
        }
        for (const branch of ["T1", "T2", "T3"]) {
          const entry = branches[branch];
          if (entry == null) continue;
          if (!entry || typeof entry !== "object" || !Array.isArray(entry.rows) || entry.rows.length > MAX_UPLOAD_ROWS || !entry.rows.every(validateRxRow)) {
            return { valid: false, error: `invalid-daily-${branch}` };
          }
          totalRows += entry.rows.length;
          if (totalRows > MAX_SNAPSHOT_ROWS) return { valid: false, error: "snapshot-too-large" };
        }
      }
    }
    return { valid: true, version: Number(snapshot.v || 1), totalRows };
  }
  return __toCommonJS(index_exports);
})();

/* ---- Private Label products ---- */
const PRIVATE_LABEL=[
  {key:'reflex',    name:'Reflex',      form:'Massage Emulgel · 100ML',cls:'pp1'},{key:'rizer',     name:'Rizer',       form:'Apply Cream · 75ML',     cls:'pp2'},{key:'oracure',   name:'Oracure',     form:'Mouth Wash · 300ML',     cls:'pp3'},{key:'intimo',    name:'Intimo',      form:'Vaginal Wash · 250ML',   cls:'pp4'},{key:'nostriderm',name:'Nostriderm',  form:'Ointment · 50ML',        cls:'pp5'},{key:'nostricure',name:'Nostricure',  form:'Oral Gel · 30ML',        cls:'pp6'},
];
function phraseMatch(value,phrase){
  const text=PharmaCore.normalizeProductText(value),target=PharmaCore.normalizeProductText(phrase);
  if(!text||!target)return false;
  return (' '+text+' ').includes(' '+target+' ') || text.replace(/\s/g,'').includes(target.replace(/\s/g,''));
}
function findPrivateLabelProduct(service){return PRIVATE_LABEL.find(p=>phraseMatch(service,p.key))||null;}

/* ---- file/row validation ---- */
function validateUploadFile(file){
  if(!file||!file.name)throw new Error('لم يتم اختيار ملف');
  const ext=(file.name.toLowerCase().match(/\.[^.]+$/)||[''])[0];
  if(!['.xlsx','.xls','.csv','.pdf'].includes(ext))throw new Error('صيغة غير مدعومة — استخدم xlsx أو xls أو csv أو pdf');
  if(!file.size)throw new Error('الملف فارغ');
  if(file.size>PharmaCore.MAX_UPLOAD_BYTES)throw new Error('حجم الملف أكبر من الحد الآمن (50MB)');
  return ext;
}
function validateParsedRows(rows){
  if(!rows||!rows.length)throw new Error('لم يتم العثور على بيانات صالحة في الملف');
  if(rows.length>PharmaCore.MAX_UPLOAD_ROWS)throw new Error('عدد الصفوف أكبر من الحد المدعوم (500,000 صف)');
  const meta=rows._parseMeta||{};
  if(meta.source==='pdf'&&meta.sourceRows>20&&rows.length/meta.sourceRows<.2){
    throw new Error('نسبة الصفوف المقروءة من PDF منخفضة جداً — راجع تخطيط الأعمدة أو استخدم PDF نصياً واضحاً');
  }
  if(rows.some(row=>Object.values(row).some(value=>String(value||'').includes('\uFFFD')))){
    throw new Error('ترميز النص غير صالح — احفظ الملف بصيغة UTF-8 أو Excel ثم أعد الرفع');
  }
}

/* ---- fmt ---- */
const fmt=n=>(n==null||isNaN(n))?'—':Number(n).toLocaleString('en-US');

/* ---- pct ---- */
const pct=(a,b)=>b>0?(a*100/b):0;

/* ---- text/entity helpers ---- */
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escapeAttr(s){return escapeHtml(s).replace(/'/g,'&#39;');}
/* أرقام المرضى قد تتكرر بين أنظمة الفروع؛ لذلك الهوية المجمعة = الفرع + الرقم. */
function patientIdentityKey(branch,patient){
  const id=PharmaCore.normalizeWhitespace(patient);
  return id?branch+'|'+id:'';
}
function entityKey(value){return PharmaCore.normalizeEntityKey(value);}
function sameEntity(a,b){return entityKey(a)===entityKey(b);}

/* ---- aggregate + parsers (excel/csv/pdf) ---- */
function createAggregateState(){
  return{docMap:new Map(),drugMap:new Map(),secMap:new Map(),patients:new Set(),statusCounts:{},orders:new Set()};
}
function aggregateRow(state,r){
    const {docMap,drugMap,secMap,patients,statusCounts,orders}=state;
    const doctorKey=PharmaCore.normalizeEntityKey(r.doctor),drugKey=PharmaCore.normalizeEntityKey(r.service),sectionKey=PharmaCore.normalizeEntityKey(r.section),patientKey=PharmaCore.normalizeEntityKey(r.patient);
    if(patientKey) patients.add(patientKey);
    if(r.orderNo) orders.add(PharmaCore.normalizeEntityKey(r.orderNo));
    const st=PharmaCore.normalizeStatus(r.status);statusCounts[st]=(statusCounts[st]||0)+1;
    if(doctorKey){
      let d=docMap.get(doctorKey);if(!d){d={name:r.doctor,section:r.section,total:0,drugs:new Map(),patients:new Set(),status:{}};docMap.set(doctorKey,d);}
      d.total++;if(r.section&&!d.section)d.section=r.section;
      if(drugKey){const item=d.drugs.get(drugKey)||{name:r.service,count:0};item.count++;d.drugs.set(drugKey,item);}
      if(patientKey)d.patients.add(patientKey);d.status[st]=(d.status[st]||0)+1;
    }
    if(drugKey){
      let dr=drugMap.get(drugKey);if(!dr){dr={name:r.service,total:0,doctors:new Map(),patients:new Map(),sections:new Map(),status:{}};drugMap.set(drugKey,dr);}
      dr.total++;
      if(doctorKey){const item=dr.doctors.get(doctorKey)||{name:r.doctor,count:0};item.count++;dr.doctors.set(doctorKey,item);}
      if(patientKey)dr.patients.set(patientKey,(dr.patients.get(patientKey)||0)+1);
      if(sectionKey){const item=dr.sections.get(sectionKey)||{name:r.section,count:0};item.count++;dr.sections.set(sectionKey,item);}
      dr.status[st]=(dr.status[st]||0)+1;
    }
    if(sectionKey){
      let s=secMap.get(sectionKey);if(!s){s={name:r.section,total:0,doctors:new Set(),drugs:new Set(),patients:new Set()};secMap.set(sectionKey,s);}
      s.total++;if(doctorKey)s.doctors.add(doctorKey);if(drugKey)s.drugs.add(drugKey);if(patientKey)s.patients.add(patientKey);
    }
}
function finalizeAggregate(state,totalRows){
  const {docMap,drugMap,secMap,patients,statusCounts,orders}=state;
  return{
    doctors:[...docMap.values()].map(d=>({name:d.name,section:d.section,total:d.total,uniqueDrugs:d.drugs.size,patients:d.patients.size,status:d.status,drugs:[...d.drugs.values()].sort((a,b)=>b.count-a.count)})).sort((a,b)=>b.total-a.total),
    drugs:[...drugMap.values()].map(d=>({name:d.name,total:d.total,doctorCount:d.doctors.size,patients:d.patients.size,status:d.status,repeatPatients:[...d.patients.values()].filter(c=>c>1).length,sections:[...d.sections.values()].sort((a,b)=>b.count-a.count),doctors:[...d.doctors.values()].sort((a,b)=>b.count-a.count)})).sort((a,b)=>b.total-a.total),
    sections:[...secMap.values()].map(s=>({name:s.name,total:s.total,doctors:s.doctors.size,drugs:s.drugs.size,patients:s.patients.size})).sort((a,b)=>b.total-a.total),
    totalRows,totalPatients:patients.size,statusCounts,totalOrders:orders.size
  };
}
function aggregate(rows){
  const state=createAggregateState();
  for(const row of rows||[])aggregateRow(state,row);
  return finalizeAggregate(state,(rows||[]).length);
}
function yieldToBrowser(){return new Promise(resolve=>setTimeout(resolve,0));}
function throwIfCancelled(options){
  if(options?.shouldCancel?.()){
    const error=new Error('تم إلغاء المعالجة لأن ملفاً أحدث بدأ');
    error.name='AbortError';
    throw error;
  }
}
async function aggregateAsync(rows,onProgress,shouldCancel){
  const list=rows||[],state=createAggregateState(),chunk=5000;
  for(let start=0;start<list.length;start+=chunk){
    if(shouldCancel?.())throwIfCancelled({shouldCancel});
    const end=Math.min(start+chunk,list.length);
    for(let i=start;i<end;i++)aggregateRow(state,list[i]);
    if(onProgress)onProgress(end/list.length);
    if(end<list.length)await yieldToBrowser();
  }
  return finalizeAggregate(state,list.length);
}
function attachParseMeta(rows,meta){Object.defineProperty(rows,'_parseMeta',{value:meta,enumerable:false,configurable:true});return rows;}
async function normalizeParsedRows(rawRows,source,options){
  if((rawRows||[]).length>PharmaCore.MAX_UPLOAD_ROWS)throw new Error('عدد الصفوف أكبر من الحد المدعوم (500,000 صف)');
  const sourceList=rawRows||[],rows=[],chunk=5000;
  for(let start=0;start<sourceList.length;start+=chunk){
    throwIfCancelled(options);
    const end=Math.min(start+chunk,sourceList.length);
    for(let i=start;i<end;i++){const row=normalizeRow(sourceList[i]);if(row)rows.push(row);}
    options?.onProgress?.(end/sourceList.length);
    if(end<sourceList.length)await yieldToBrowser();
  }
  return attachParseMeta(rows,{source,...(options?.meta||{}),sourceRows:(rawRows||[]).length,rejectedRows:Math.max(0,(rawRows||[]).length-rows.length)});
}
function selectWorkbookData(wb,options){
  for(const sheetName of wb.SheetNames||[]){
    throwIfCancelled(options);
    const sheet=wb.Sheets[sheetName];
    if(!sheet||!sheet['!ref'])continue;
    let range;
    try{range=XLSX.utils.decode_range(sheet['!ref']);}catch(_){continue;}
    if(range.e.r-range.s.r>PharmaCore.MAX_UPLOAD_ROWS+50)throw new Error('عدد صفوف ورقة Excel أكبر من الحد المدعوم (500,000 صف)');
    const previewRange={s:{r:range.s.r,c:range.s.c},e:{r:Math.min(range.e.r,range.s.r+24),c:range.e.c}};
    const preview=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,blankrows:true,range:previewRange});
    const headerOffset=preview.findIndex(row=>PharmaCore.countRxHeaderMatches(row)>=2);
    if(headerOffset<0)continue;
    const headerRow=range.s.r+headerOffset;
    if(range.e.r-headerRow>PharmaCore.MAX_UPLOAD_ROWS)throw new Error('عدد صفوف ورقة Excel أكبر من الحد المدعوم (500,000 صف)');
    const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false,range:headerRow});
    if(rows.length)return{rows,sheetName};
  }
  throw new Error('لم أجد ورقة تحتوي أعمدة الطبيب والدواء — راجع أسماء الأعمدة في الملف');
}
async function parseExcel(file,options){
  const buf=await file.arrayBuffer();throwIfCancelled(options);options?.onProgress?.(.08);await yieldToBrowser();
  const wb=XLSX.read(buf,{type:'array'});throwIfCancelled(options);options?.onProgress?.(.28);
  if(!wb.SheetNames.length)throw new Error('ملف Excel لا يحتوي أوراقاً');
  const selected=selectWorkbookData(wb,options);options?.onProgress?.(.4);
  return normalizeParsedRows(selected.rows,'excel',{...options,meta:{sheet:selected.sheetName},onProgress:p=>options?.onProgress?.(.4+p*.6)});
}
function decodeDelimitedText(buffer){
  const bytes=new Uint8Array(buffer);
  let text;
  if(bytes[0]===0xFF&&bytes[1]===0xFE)text=new TextDecoder('utf-16le').decode(bytes.subarray(2));
  else if(bytes[0]===0xFE&&bytes[1]===0xFF)text=new TextDecoder('utf-16be').decode(bytes.subarray(2));
  else{
    const source=bytes[0]===0xEF&&bytes[1]===0xBB&&bytes[2]===0xBF?bytes.subarray(3):bytes;
    try{text=new TextDecoder('utf-8',{fatal:true}).decode(source);}
    catch(_){text=new TextDecoder('windows-1256').decode(source);}
  }
  if(text.includes('\uFFFD'))throw new Error('تعذر تحديد ترميز CSV — احفظه بصيغة UTF-8 ثم أعد الرفع');
  return text;
}
async function parseCSV(file,options){
  const buffer=await file.arrayBuffer();throwIfCancelled(options);
  const text=decodeDelimitedText(buffer);options?.onProgress?.(.1);await yieldToBrowser();
  const wb=XLSX.read(text,{type:'string'});throwIfCancelled(options);options?.onProgress?.(.3);
  if(!wb.SheetNames.length)throw new Error('ملف CSV فارغ');
  const selected=selectWorkbookData(wb,options);options?.onProgress?.(.4);
  return normalizeParsedRows(selected.rows,'csv',{...options,meta:{encoding:'auto'},onProgress:p=>options?.onProgress?.(.4+p*.6)});
}
function normalizeRow(r){return PharmaCore.normalizeRxRow(r);}
async function parsePDF(file,options){
  if(!window.pdfjsLib) window.pdfjsLib=window['pdfjs-dist/build/pdf'];
  if(!window.pdfjsLib)throw new Error('تعذر تحميل قارئ PDF — تحقق من الاتصال ثم أعد المحاولة');
  if(!window.pdfjsWorker && window['pdfjs-dist/build/pdf.worker']) window.pdfjsWorker=window['pdfjs-dist/build/pdf.worker'];
  try{ pdfjsLib.GlobalWorkerOptions.workerSrc = window.pdfjsWorker ? '' : 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }catch(e){}
  const buf=await file.arrayBuffer();throwIfCancelled(options);
  const loadingTask=pdfjsLib.getDocument({data:buf});
  let pdf=null;
  try{
    pdf=await loadingTask.promise;throwIfCancelled(options);
    if(pdf.numPages>PharmaCore.MAX_PDF_PAGES)throw new Error('عدد صفحات PDF ('+pdf.numPages.toLocaleString('en-US')+') أكبر من الحد المدعوم ('+PharmaCore.MAX_PDF_PAGES.toLocaleString('en-US')+' صفحة). قسّم التقرير إلى ملفين أو أكثر (مثلاً نصف الفترة لكل ملف) وارفعهم بالترتيب، أو صدّره كـ Excel.');
    const ENGLISH_SPECIALTIES=['GASTROENTEROLOGY','ENDOCRINOLOGY','OPHTHALMOLOGY','OPTHALMOLOGY','RHEUMATOLOGY','PULMONOLOGY','FAMILY MEDICINE','GENERAL PRACTITIONER','PARACITIONER','DERMATOLOGY','ORTHOPAEDIC','PSYCHIATRY','OBSTETRICS','PAEDIATRIC','CARDIOLOGY','NEPHROLOGY','NEUROLOGY','ONCOLOGY','INTERNAL MEDICINE','UROLOGY','GENERAL','SURGERY','DENTAL','RADIOLOGY','GYNECOLOGY','MEDICINE','ENT'];
    const SPECIALTIES=[...ENGLISH_SPECIALTIES,'الطب العام','طب عام','الباطنة','باطنة','العظام','عظام','الاطفال','الأطفال','اطفال','أطفال','العيون','عيون','الانف والاذن','الأنف والأذن','النسا والولادة','نساء وولادة','الجلدية','جلدية','النفسية','نفسية','المسالك','مسالك','الاسنان','الأسنان','اسنان','أسنان','الجراحة','جراحة','القلب','قلب','الكلى','كلى','المخ والاعصاب','مخ واعصاب'].sort((a,b)=>b.split(/\s+/).length-a.split(/\s+/).length);
    const DEFAULT_COLS={patient:[-Infinity,75],patientName:[75,243],service:[243,476],orderNo:[476,535],status:[535,596],doctorSection:[596,Infinity]};
    const HEADER_ALIASES=[
      ['patient',/PATIENT\s*(NO|NUMBER)|رقم\s*المريض|المريض\s*رقم/i],
      ['patientName',/PATIENT\s*NAME|اسم\s*المريض|المريض\s*اسم/i],
      ['service',/SERVICE\s*NAME|MEDICATION|DRUG\s*NAME|اسم\s*(الخدمة|الدواء|الصنف)/i],
      ['orderNo',/ORDER\s*(NO|NUMBER)|رقم\s*(الأمر|الطلب)/i],
      ['status',/STATUS|الحالة|حالة\s*الطلب/i],
      ['doctorSection',/DOCTOR\s*NAME|PHYSICIAN|اسم\s*الطبيب|الطبيب\s*اسم/i],
      ['section',/SECTION|SPECIAL(TY|ITY)|DEPARTMENT|القسم|التخصص/i],
    ];
    function joinCell(ws,range){
      if(!range)return'';
      return ws.filter(word=>word.x>=range[0]&&word.x<range[1]).sort((a,b)=>a.order-b.order).map(word=>word.s).join(' ').replace(/\s+/g,' ').trim();
    }
    function findHeader(ws,re){
      const sequences=[
        [...ws].sort((a,b)=>a.order-b.order),
        [...ws].sort((a,b)=>a.x-b.x),
        [...ws].sort((a,b)=>b.x-a.x),
      ];
      let best=null;
      for(const sequence of sequences){
        for(let start=0;start<sequence.length;start++){
          for(let size=1;size<=Math.min(4,sequence.length-start);size++){
            const words=sequence.slice(start,start+size),text=words.map(word=>word.s).join(' ');
            if(re.test(text)){
              const candidate={x:words.reduce((sum,word)=>sum+word.x,0)/words.length,size,length:text.length};
              if(!best||candidate.size<best.size||(candidate.size===best.size&&candidate.length<best.length))best=candidate;
            }
          }
        }
      }
      return best;
    }
    function headerFields(ws){
      return HEADER_ALIASES.map(([key,re])=>{const found=findHeader(ws,re);return found?{key,x:found.x}:null;}).filter(Boolean);
    }
    function detectColumns(lines){
      for(const ws of lines){
        const found=headerFields(ws),keys=new Set(found.map(item=>item.key));
        if(!keys.has('patient')||!keys.has('service')||!keys.has('doctorSection'))continue;
        found.sort((a,b)=>a.x-b.x);
        const cols={};
        found.forEach((item,index)=>{
          const previous=found[index-1],next=found[index+1];
          cols[item.key]=[previous?(previous.x+item.x)/2:-Infinity,next?(item.x+next.x)/2:Infinity];
        });
        return{cols,detected:true};
      }
      return{cols:DEFAULT_COLS,detected:false};
    }
    function isHeaderLine(ws){
      const keys=new Set(headerFields(ws).map(item=>item.key));
      return keys.size>=2&&(keys.has('patient')||keys.has('service')||keys.has('doctorSection'));
    }
    function isFooterLine(ws){
      /* أسطر تذييل تقارير Oracle المتكرّرة في كل صفحة (ترقيم/عنوان/طابع الطباعة) — ليست بيانات */
      const text=ws.map(word=>word.s).join(' ');
      return /Page\s+\d+\s+of\s+\d+/i.test(text)||/Printed\s+By\s*:/i.test(text)||/P\.?\s*O\.?\s*Box/i.test(text);
    }
    function normalizeDigits(value){
      return String(value||'').replace(/[٠-٩]/g,d=>'0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]).replace(/[۰-۹]/g,d=>'0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
    }
    function splitDoctorSection(text){
      const clean=PharmaCore.normalizeWhitespace(text),words=clean.split(/\s+/).filter(Boolean);
      for(let index=1;index<words.length;index++){
        for(const specialty of SPECIALTIES){
          const size=specialty.split(/\s+/).length;
          if(entityKey(words.slice(index,index+size).join(' '))===entityKey(specialty)){
            return{doctor:words.slice(0,index).join(' '),section:words.slice(index).join(' ')};
          }
        }
      }
      for(let index=0;index<words.length;index++){
        const upper=words[index].toUpperCase();
        for(const specialty of ENGLISH_SPECIALTIES.filter(item=>!item.includes(' ')&&item.length>=5)){
          if(upper.length>specialty.length+1&&upper.endsWith(specialty)){
            const splitAt=words[index].length-specialty.length;
            return{doctor:[...words.slice(0,index),words[index].slice(0,splitAt)].join(' ').trim(),section:[words[index].slice(splitAt),...words.slice(index+1)].join(' ').trim()};
          }
        }
      }
      return{doctor:clean,section:''};
    }
    function appendValue(current,next){return next?PharmaCore.normalizeWhitespace((current?current+' ':'')+next):current;}
    const rows=[];let textItemCount=0,rejectedRows=0,sourceRows=0,layoutDetectedPages=0,fallbackPages=0;
    for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
      throwIfCancelled(options);
      const page=await pdf.getPage(pageNumber),content=await page.getTextContent();
      textItemCount+=content.items.length;
      const lineMap={};
      content.items.forEach((item,order)=>{
        const y=Math.round(item.transform[5]/2)*2;
        if(!lineMap[y])lineMap[y]=[];
        const text=String(item.str||'').trim();
        if(text)lineMap[y].push({x:item.transform[4],s:text,order});
      });
      const lines=Object.keys(lineMap).map(Number).sort((a,b)=>b-a).map(y=>({y,words:lineMap[y]})).filter(line=>line.words.length);
      const layout=detectColumns(lines.map(line=>line.words)),cols=layout.cols;
      if(layout.detected)layoutDetectedPages++;else fallbackPages++;
      let pending=null;
      const finalizePending=()=>{
        if(!pending)return;
        sourceRows++;
        const split=cols.section?{doctor:pending.doctorSection,section:pending.section}:splitDoctorSection(pending.doctorSection);
        const row=normalizeRow({patient:pending.patient,patientName:pending.patientName,service:pending.service,orderNo:pending.orderNo,status:pending.status,doctor:split.doctor,section:split.section});
        if(row&&row.doctor&&row.service)rows.push(row);else rejectedRows++;
        pending=null;
        if(rows.length>PharmaCore.MAX_UPLOAD_ROWS)throw new Error('عدد الصفوف أكبر من الحد المدعوم (500,000 صف)');
      };
      for(const line of lines){
        const ws=line.words;
        if(isHeaderLine(ws)||isFooterLine(ws))continue;
        const cells={
          patient:joinCell(ws,cols.patient),
          patientName:joinCell(ws,cols.patientName),
          service:joinCell(ws,cols.service),
          orderNo:joinCell(ws,cols.orderNo),
          status:joinCell(ws,cols.status),
          doctorSection:joinCell(ws,cols.doctorSection),
          section:joinCell(ws,cols.section),
        };
        /* عمود «رقم المريض» قد يلتقط الرقم واسم المريض معاً؛ نأخذ المعرِّف الأول
           كبداية صفّ جديد ونحوّل بقية النص إلى اسم المريض بدل رفض الصف كاملاً */
        const patientCell=normalizeDigits(cells.patient).trim();
        const patientLead=patientCell.split(/\s+/)[0]||'';
        if(patientCell){
          if(/^[\p{L}\p{N}][\p{L}\p{N}._/-]{0,31}$/u.test(patientLead)){
            finalizePending();
            const patientRest=patientCell.slice(patientLead.length).trim();
            pending={...cells,patient:patientLead,patientName:patientRest?appendValue(patientRest,cells.patientName):cells.patientName,lastY:line.y};
            continue;
          }
          /* الخلية تبدأ بنص غير معرِّف — عاملها كتكملة سطر ملتفّ إن وُجد صفّ قيد التجميع */
          if(pending&&Math.abs(pending.lastY-line.y)<=24){
            ['patientName','service','orderNo','status','doctorSection','section'].forEach(field=>{pending[field]=appendValue(pending[field],cells[field]);});
            pending.patientName=appendValue(pending.patientName,patientCell);
            pending.lastY=line.y;
            continue;
          }
          sourceRows++;rejectedRows++;continue;
        }
        if(pending&&Math.abs(pending.lastY-line.y)<=24){
          ['patientName','service','orderNo','status','doctorSection','section'].forEach(field=>{pending[field]=appendValue(pending[field],cells[field]);});
          pending.lastY=line.y;
        }
      }
      finalizePending();
      options?.onProgress?.(pageNumber/pdf.numPages);
      if(pageNumber<pdf.numPages&&pageNumber%3===0)await yieldToBrowser();
    }
    if(!textItemCount)throw new Error('ملف PDF عبارة عن صور ممسوحة ولا يحتوي نصاً قابلاً للاستخراج. استخدم PDF نصي من Oracle أو شغّل OCR أولاً');
    if(!rows.length){
      if(textItemCount<Math.max(20,pdf.numPages*5)||!layoutDetectedPages)throw new Error('PDF لا يحتوي طبقة نص كاملة أو تخطيطه غير معروف. شغّل OCR أو صدّر تقرير PDF نصياً من النظام');
      throw new Error('لم أتمكن من تحليل صفوف PDF — تأكد من وجود أعمدة Patient No وService Name وDoctor Name');
    }
    return attachParseMeta(rows,{source:'pdf',pages:pdf.numPages,sourceRows,rejectedRows,textItemCount,layoutDetectedPages,fallbackPages});
  }finally{
    try{if(pdf)await pdf.destroy();else await loadingTask.destroy();}catch(_){}
  }
}


/* ---- PureHerb products ---- */
const PUREHERB_PRODUCTS = [
  {key:'PURE OMEGA',aliases:['PURE OMEGA','PUREOMEGA','PURE OMEGA 3'],name:'Pure Omega-3 Syrup 240ML',code:'1-03-186-084'},
  {key:'PUREFEEL',aliases:['PUREFEEL','PURE FEEL'],name:'PureFeel Tablet 30Tab',code:'1-03-187-269'},
  {key:'CENTROZON W',aliases:['CENTROZON WOMEN','CENTROZON W'],name:'Centrozon Women 30Tab',code:'1-03-187-267'},
  {key:'CENTROZON',aliases:['CENTROZON'],exclude:['WOMEN'],name:'Centrozon Tablet 30Tab',code:'1-03-187-270'},
  {key:'ZINCOLIVE',aliases:['ZINCOLIVE','ZINC OLIVE'],name:'Zincolive Syrup 150ML',code:'1-03-186-085'},
  {key:'BONEFRIEND',aliases:['BONEFRIEND','BONE FRIEND'],name:'BoneFriend Tablet 30Tab',code:'1-03-187-268'},
  {key:'ARGIGROW',aliases:['ARGIGROW','ARGI GROW'],name:'ArgiGrow Syrup 150ML',code:'1-03-186-083'}
];
function findPureHerbProduct(service){
  const text=PharmaCore.normalizeProductText(service);if(!text)return null;
  return PUREHERB_PRODUCTS.find(p=>{
    if((p.exclude||[]).some(x=>phraseMatch(text,x)))return false;
    return (p.aliases||[p.key]).some(x=>phraseMatch(text,x));
  })||null;
}

