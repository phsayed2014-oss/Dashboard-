// End-to-end test of the REAL report PDF through the app's real rxReadPdfLines/rxParsePdfReport.
// pdfjsLib = the genuine pdfjs-dist (not a stub) operating on the real file bytes.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const realPdfjs = require('pdfjs-dist/legacy/build/pdf.js');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(ROOT, 'PharmaDash_Pro_offline_3.html');
const XLSX_UUID = '68239745-24a7-47e1-948c-b1a0e0375ed7';
const REAL_PDF = process.argv[2] || '/root/.claude/uploads/69715230-574c-55a9-b161-947111767547/ce7b40b9-21072026.pdf';

function fail(m){ console.error('❌ ' + m); process.exitCode = 1; }
function ok(m){ console.log('✅ ' + m); }

const bundle = fs.readFileSync(BUNDLE, 'utf8');
let app = JSON.parse(bundle.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1].trim());
const xlsxCode = fs.readFileSync(path.join(__dirname, 'assets', XLSX_UUID + '.js'), 'utf8');
app = app.replace(/<script src="([0-9a-f-]{36})"><\/script>/g, function(_m, uid){ return uid===XLSX_UUID ? '<script>__X__</script>' : '<script></script>'; })
         .replace('__X__', function(){ return xlsxCode; });

const pdfBytes = new Uint8Array(fs.readFileSync(REAL_PDF));

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
    window.pdfjsLib = realPdfjs;   // genuine library, real bytes
  }
});
const { window } = dom; const { document } = window;
function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
async function until(pred, timeout, label){ const t0=Date.now(); while(Date.now()-t0<(timeout||15000)){ try{ if(pred()) return true; }catch(e){} await wait(80); } throw new Error('timeout: '+(label||'')); }

(async function(){
  try{
    await until(function(){ return document.getElementById('fileInput') && window.XLSX; }, 12000, 'boot');
    ok('booted');

    // go to rxsales empty card → open picker
    document.querySelector('.nav-item[data-k="rxsales"]').dispatchEvent(new window.Event('click', {bubbles:true}));
    await until(function(){ return document.getElementById('rxPick'); }, 8000, 'empty');
    document.getElementById('rxPick').dispatchEvent(new window.Event('click', {bubbles:true}));
    const salesInput = Array.prototype.find.call(document.querySelectorAll('input[type=file]'), function(el){ return !el.id; });

    // feed the REAL pdf
    const file = new window.File([pdfBytes], '21072026.pdf', { type:'application/pdf' });
    file.arrayBuffer = function(){ return Promise.resolve(pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset+pdfBytes.byteLength)); };
    Object.defineProperty(salesInput, 'files', { value:[file], configurable:true });
    salesInput.dispatchEvent(new window.Event('change', {bubbles:true}));

    await until(function(){ const h=document.getElementById('rxImportHost'); return h && /مراجعة التقارير/.test(h.textContent); }, 20000, 'modal');
    const host = document.getElementById('rxImportHost');
    ok('real PDF parsed → review modal shown');

    const mtext = host.textContent;
    if(/مبيعات الأصناف/.test(mtext)) ok('type = SALES (مبيعات الأصناف)'); else fail('type wrong');
    const phSel = host.querySelector('.rx-imp-ph');
    const phVal = phSel ? phSel.value : '';
    if(phVal==='صيدلية 18') ok('pharmacy detected = صيدلية 18 (التعاون الثاني / T2)'); else fail('pharmacy = "'+phVal+'" expected صيدلية 18');
    const dateVal = (host.querySelector('.rx-imp-date')||{}).value;
    if(dateVal==='2026-07-21') ok('date detected = 2026-07-21'); else fail('date = "'+dateVal+'" expected 2026-07-21');

    // rows
    const rows = Array.prototype.map.call(host.querySelectorAll('.rx-imp-report table.data tbody tr'), function(tr){
      const t = Array.prototype.map.call(tr.querySelectorAll('td'), function(td){ return td.textContent.trim(); });
      return { name:t[1], units:t[2], amount:t[3], cost:t[4] };
    });
    console.log('   parsed rows:', JSON.stringify(rows));
    function findRow(n){ return rows.find(function(r){ return new RegExp(n,'i').test(r.name); }); }
    const rf = findRow('Reflex'), ns = findRow('Nostriderm'), oc = findRow('Oracure');
    if(rf && rf.units==='1' && rf.amount==='65' && rf.cost==='6') ok('Reflex: units 1 · amount 65 · cost 6'); else fail('Reflex row: '+JSON.stringify(rf));
    if(ns && ns.units==='2' && ns.amount==='130' && ns.cost==='12') ok('Nostriderm: units 2 · amount 130 · cost 12'); else fail('Nostriderm row: '+JSON.stringify(ns));
    if(oc && oc.units==='1' && oc.amount==='35' && oc.cost==='7') ok('Oracure: units 1 · amount 35 · cost 7 (6.75→7)'); else fail('Oracure row: '+JSON.stringify(oc));
    if(rows.length===3) ok('exactly 3 product rows (totals row skipped)'); else fail('row count='+rows.length+' expected 3');

    // apply and confirm entries land as T2 sales
    host.querySelector('.rx-imp-apply').dispatchEvent(new window.Event('click', {bubbles:true}));
    await wait(400);
    const saved = window.localStorage.getItem('pharmaDash.sales.v1');
    if(saved){
      const s = JSON.parse(saved);
      const e = s.entries.find(function(x){ return x.product==='reflex'; });
      if(e && e.branch==='T2' && Math.round(e.unitPrice)===65 && Math.round(e.unitCost)===6 && e.units===1)
        ok('applied → reflex entry {branch T2, unitPrice 65, unitCost 6, units 1} persisted');
      else fail('applied entry wrong: '+JSON.stringify(e));
    } else fail('nothing persisted after apply');

    console.log(process.exitCode ? '\n=== REAL PDF: SOME CHECKS FAILED ===' : '\n=== REAL PDF: ALL CHECKS PASSED ===');
  }catch(err){
    fail('exception: ' + (err && err.stack || err));
    console.log('\n=== REAL PDF: ERRORED ===');
  }
})();
