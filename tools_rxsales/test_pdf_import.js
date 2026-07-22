// PDF sales-report import test (mirrors the sales dashboard's report import).
// Only the external pdfjsLib is stubbed; all parsing/merge/render is the real code.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(ROOT, 'PharmaDash_Pro_offline_3.html');
const XLSX_UUID = '68239745-24a7-47e1-948c-b1a0e0375ed7';

function fail(m){ console.error('❌ ' + m); process.exitCode = 1; }
function ok(m){ console.log('✅ ' + m); }
function approx(a,b,e){ return Math.abs(a-b) <= (e||0.1); }

const bundle = fs.readFileSync(BUNDLE, 'utf8');
let app = JSON.parse(bundle.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1].trim());
const xlsxCode = fs.readFileSync(path.join(__dirname, 'assets', XLSX_UUID + '.js'), 'utf8');
app = app.replace(/<script src="([0-9a-f-]{36})"><\/script>/g, function(_m, uid){ return uid===XLSX_UUID ? '<script>__X__</script>' : '<script></script>'; })
         .replace('__X__', function(){ return xlsxCode; });

// fake supplier SALES report lines (one text item per line, distinct y)
const REPORT_LINES = [
  'صيدلية رقم 1',
  '05-07-2026',
  'القيمة بسعر البيع القيمة بالتكلفة الكمية الحالية الكمية المباعة الصنف',
  '240 132 10 6 REFLEX MASSAGE EMULGEL 100ML',   // amount240 cost132 units6 -> unit 40 / 22
  '150 90 12 5 ORACURE MOUTH WASH 300ML',         // amount150 cost90  units5 -> unit 30 / 18
  '999 500 20 8 PANADOL TABLET'                    // not a supplier product -> ignored
];
const FAKE_ITEMS = REPORT_LINES.map(function(s,i){ return { str:s, transform:[1,0,0,1, 0, 800 - i*20] }; });

const dom = new JSDOM(app, {
  runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.local/',
  beforeParse(window){
    window.alert = function(m){ console.log('[ALERT] '+m); };
    window.confirm = function(){ return true; };
    const { TextDecoder, TextEncoder } = require('util');
    window.TextDecoder = window.TextDecoder || TextDecoder;
    window.TextEncoder = window.TextEncoder || TextEncoder;
    window.matchMedia = function(q){ return { matches:false, media:q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return false; } }; };
    if(!window.structuredClone) window.structuredClone = function(o){ return JSON.parse(JSON.stringify(o)); };
    ['ReadableStream','WritableStream','TransformStream'].forEach(function(n){ if(!window[n]) window[n]=function(){}; });
    if(!window.DOMMatrix) window.DOMMatrix = function(){};
    if(!window.Path2D) window.Path2D = function(){};
    window.HTMLCanvasElement.prototype.getContext = function(){ return null; };
    // stub the external PDF library only
    window.pdfjsLib = {
      getDocument: function(){ return { promise: Promise.resolve({
        numPages:1,
        getPage: function(){ return Promise.resolve({ getTextContent: function(){ return Promise.resolve({ items: FAKE_ITEMS }); } }); }
      }) }; }
    };
  }
});
const { window } = dom; const { document } = window;

function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
async function until(pred, timeout, label){
  const t0 = Date.now();
  while(Date.now()-t0 < (timeout||9000)){ try{ if(pred()) return true; }catch(e){} await wait(60); }
  throw new Error('timeout: ' + (label||''));
}
function attach(file, content){
  const bytes = new Uint8Array(Buffer.from(content, 'utf8'));
  file.arrayBuffer = function(){ return Promise.resolve(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength)); };
  file.text = function(){ return Promise.resolve(content); };
  return file;
}
function oracleCSV(){
  const L = ['Patient No,Patient Name,Service Name,Order No.,Status,Doctor Name,Section Name'];
  let p=1000,o=5000; function add(n,s,doc,sec){ for(let i=0;i<n;i++) L.push([++p,'P'+p,s,++o,'Closed',doc,sec].join(',')); }
  add(10,'REFLEX CREAM','AHMED ALI','DERMATOLOGY'); add(5,'ORACURE GEL','SARA HASSAN','DENTAL'); add(5,'PANADOL','OMAR SAID','GENERAL');
  return L.join('\n');
}
function kpiMap(scope){ const m={}; scope.querySelectorAll('.kpi-grid .kpi').forEach(function(k){ const l=(k.querySelector('.kpi-label')||{}).textContent||''; const n=k.querySelector('.kpi-num'); m[l.trim()]={ text:(n&&n.textContent||'').trim(), to:n?parseFloat(n.getAttribute('data-to')):NaN }; }); return m; }

(async function(){
  try{
    await until(function(){ return document.getElementById('fileInput') && window.XLSX; }, 12000, 'boot');
    ok('booted');

    // 1) Oracle CSV → T1
    const inp = document.getElementById('fileInput');
    const csv = attach(new window.File([oracleCSV()], '01-07_to_20-07.csv', {type:'text/csv'}), oracleCSV());
    Object.defineProperty(inp, 'files', { value:[csv], configurable:true });
    inp.dispatchEvent(new window.Event('change', {bubbles:true}));
    const bb = document.getElementById('branchBody');
    await until(function(){ return /نظرة عامة/.test(bb.textContent) && !/جارٍ تحليل/.test(bb.textContent); }, 12000, 'csv');
    ok('Oracle CSV parsed (T1)');

    // 2) open rxsales empty card, trigger sales-file picker
    const stub = document.querySelector('[data-panel="__stub"]');
    document.querySelector('.nav-item[data-k="rxsales"]').dispatchEvent(new window.Event('click', {bubbles:true}));
    await until(function(){ return document.getElementById('rxPick'); }, 8000, 'empty card');
    document.getElementById('rxPick').dispatchEvent(new window.Event('click', {bubbles:true}));

    // find the dynamically-created sales input (file input without an id)
    const salesInput = Array.prototype.find.call(document.querySelectorAll('input[type=file]'), function(el){ return !el.id; });
    if(!salesInput){ fail('sales input not created'); throw new Error('no input'); }
    ok('sales file picker created');

    // 3) feed a PDF report
    const pdf = attach(new window.File(['%PDF-fake'], 'sales-report-t1.pdf', {type:'application/pdf'}), '%PDF-fake');
    Object.defineProperty(salesInput, 'files', { value:[pdf], configurable:true });
    salesInput.dispatchEvent(new window.Event('change', {bubbles:true}));

    // 4) review modal appears
    await until(function(){ return document.getElementById('rxImportHost') && /مراجعة التقارير/.test(document.getElementById('rxImportHost').textContent); }, 9000, 'modal');
    const host = document.getElementById('rxImportHost');
    const mtext = host.textContent;
    if(/مبيعات الأصناف/.test(mtext)) ok('report auto-detected as SALES type'); else fail('type badge wrong');
    if(/صيدلية 1/.test(mtext)) ok('pharmacy detected (صيدلية 1)'); else fail('pharmacy not detected');
    const dateInput = host.querySelector('.rx-imp-date');
    if(dateInput && dateInput.value==='2026-07-05') ok('date parsed 05-07-2026 → 2026-07-05'); else fail('date wrong: '+(dateInput&&dateInput.value));
    const rowCbs = host.querySelectorAll('.rx-imp-row');
    if(rowCbs.length===2) ok('2 supplier products parsed (PANADOL ignored)'); else fail('parsed rows='+rowCbs.length+' expected 2');
    const reflexTr = Array.prototype.find.call(host.querySelectorAll('.rx-imp-report table.data tbody tr'), function(tr){ return /Reflex/i.test(tr.textContent); });
    if(reflexTr){
      const c = Array.prototype.map.call(reflexTr.querySelectorAll('td'), function(td){ return td.textContent.trim(); });
      // [checkbox, name, units, amount, cost]
      if(c[2]==='6' && c[3]==='240' && c[4]==='132') ok('reflex figures shown in modal (units 6 · amount 240 · cost 132)');
      else fail('reflex modal cells: '+JSON.stringify(c));
    } else fail('reflex row missing in modal');

    // 5) apply → merge → rxsales
    host.querySelector('.rx-imp-apply').dispatchEvent(new window.Event('click', {bubbles:true}));
    await until(function(){ return /نافذة المطابقة/.test(stub.textContent) && /كتابات الفترة/.test(stub.textContent); }, 9000, 'rxsales rendered');
    await wait(1200);
    ok('applied import → rxsales rendered');

    // 6) same fixture numbers as the JSON path
    const K = kpiMap(stub);
    function ck(label, val, txt){ const k=K[label]; if(!k){ fail('KPI missing '+label); return; } if(!approx(k.to,val)) fail('KPI '+label+'='+k.to+' exp '+val); else ok('KPI '+label+' = '+k.to+(txt?(' ("'+k.text+'")'):'')); if(txt && k.text!==txt) fail('KPI '+label+' text "'+k.text+'" exp "'+txt+'"'); }
    ck('كتابات الفترة', 15, '15');
    ck('وحدات مصروفة', 11, '11');
    ck('معدل التحويل', 73.3333, '73.3%');
    ck('فجوة التسرب (وحدات)', 4, '4');
    ck('إيراد مُهدَر (ج.م)', 160, '160');
    ck('هامش مُهدَر (ج.م)', 72, '72');

    // 7) persisted
    if(window.localStorage.getItem('pharmaDash.sales.v1')) ok('PDF-imported sales persisted to localStorage'); else fail('not persisted');

    console.log(process.exitCode ? '\n=== PDF IMPORT: SOME CHECKS FAILED ===' : '\n=== PDF IMPORT: ALL CHECKS PASSED ===');
  }catch(err){
    fail('exception: ' + (err && err.stack || err));
    console.log('\n=== PDF IMPORT: ERRORED ===');
  }
})();
