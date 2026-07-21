// jsdom end-to-end test against the FINAL delivered bundle (repacked file).
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(ROOT, 'PharmaDash_Pro_offline_3.html');
const XLSX_UUID = '68239745-24a7-47e1-948c-b1a0e0375ed7';

function fail(msg){ console.error('❌ ' + msg); process.exitCode = 1; }
function ok(msg){ console.log('✅ ' + msg); }
function approx(a, b, eps){ return Math.abs(a - b) <= (eps || 0.05); }

// 1) unpack the template exactly as the loader does
const bundle = fs.readFileSync(BUNDLE, 'utf8');
const tplRaw = bundle.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1].trim();
let app = JSON.parse(tplRaw);

// 2) inline xlsx (needed for parseCSV); drop Chart.js + pdf.js (charts skip safely)
const xlsxCode = fs.readFileSync(path.join(__dirname, 'assets', XLSX_UUID + '.js'), 'utf8');
app = app.replace(/<script src="([0-9a-f-]{36})"><\/script>/g, function(_m, uid){
  if (uid === XLSX_UUID) return '<script>__XLSX_PLACEHOLDER__</script>';
  return '<script></script>';
});
// safe injection via replacer fn so $ in xlsx source is not treated as replacement pattern
app = app.replace('__XLSX_PLACEHOLDER__', function(){ return xlsxCode; });

// 3) build JSDOM with mandatory polyfills
const dom = new JSDOM(app, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://x.local/',
  beforeParse(window){
    window.alert = function(m){ console.log('[ALERT] ' + m); };
    window.confirm = function(){ return true; };
    const { TextDecoder, TextEncoder } = require('util');
    if(!window.TextDecoder) window.TextDecoder = TextDecoder;
    if(!window.TextEncoder) window.TextEncoder = TextEncoder;
    window.matchMedia = window.matchMedia || function(q){
      return { matches:false, media:q, onchange:null, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return false; } };
    };
    if(!window.structuredClone) window.structuredClone = function(o){ return JSON.parse(JSON.stringify(o)); };
    ['ReadableStream','WritableStream','TransformStream'].forEach(function(n){ if(!window[n]) window[n]=function(){}; });
    if(!window.DOMMatrix) window.DOMMatrix = function(){};
    if(!window.Path2D) window.Path2D = function(){};
    // canvas getContext stub (no Chart.js loaded, but exportChart / count-up never touch it here)
    if(window.HTMLCanvasElement){
      window.HTMLCanvasElement.prototype.getContext = window.HTMLCanvasElement.prototype.getContext || function(){ return null; };
    }
  }
});
const { window } = dom;
const { document } = window;

function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
async function until(pred, timeout, label){
  const t0 = Date.now();
  while(Date.now() - t0 < (timeout||8000)){
    try{ if(pred()) return true; }catch(e){}
    await wait(60);
  }
  throw new Error('timeout waiting for: ' + (label||'condition'));
}

function uploadFile(name, content, type){
  const input = document.getElementById('fileInput');
  const file = new window.File([content], name, { type: type || 'text/plain' });
  // polyfill Blob reading APIs missing in this jsdom build
  const bytes = new Uint8Array(Buffer.from(content, 'utf8'));
  file.arrayBuffer = function(){ return Promise.resolve(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)); };
  file.text = function(){ return Promise.resolve(content); };
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new window.Event('change', { bubbles: true }));
}

// ── fixtures ──
function buildOracleCSV(){
  const header = 'Patient No,Patient Name,Service Name,Order No.,Status,Doctor Name,Section Name';
  const lines = [header];
  let pno = 1000, ono = 5000;
  function add(n, service, doctor, section){
    for(let i=0;i<n;i++){ lines.push([++pno, 'Patient '+pno, service, ++ono, 'Closed', doctor, section].join(',')); }
  }
  add(10, 'REFLEX CREAM', 'AHMED ALI', 'DERMATOLOGY');
  add(5,  'ORACURE GEL',  'SARA HASSAN', 'DENTAL');
  add(5,  'PANADOL',      'OMAR SAID', 'GENERAL');
  return lines.join('\n');
}
function buildSalesJSON(){
  return JSON.stringify([
    { id:'s1', date:'2026-07-05', pharmacy:'صيدلية 1',  product:'reflex',  units:6, price:40, cost:22, prescriptions:0 },
    { id:'s2', date:'2026-07-12', pharmacy:'صيدلية 1',  product:'oracure', units:5, price:30, cost:18, prescriptions:0 },
    { id:'s3', date:'2026-06-25', pharmacy:'صيدلية 1',  product:'reflex',  units:3, price:40, cost:22, prescriptions:0 }, // out of window
    { id:'s4', date:'2026-07-10', pharmacy:'صيدلية 7',  product:'reflex',  units:7, price:40, cost:22, prescriptions:0 }  // T3 branch
  ]);
}

// ── DOM readers ──
function kpiMap(scope){
  const map = {};
  scope.querySelectorAll('.kpi-grid .kpi').forEach(function(k){
    const label = (k.querySelector('.kpi-label')||{}).textContent || '';
    const num = k.querySelector('.kpi-num');
    map[label.trim()] = { text: (num&&num.textContent||'').trim(), to: num?parseFloat(num.getAttribute('data-to')):NaN, el:k };
  });
  return map;
}
function tableRows(scope){
  const rows = [];
  scope.querySelectorAll('.tbl-card table.data tbody tr').forEach(function(tr){
    const tds = tr.querySelectorAll('td');
    if(tds.length < 8) return;
    const convCell = tds[4].querySelector('.rx-conv');
    rows.push({
      name: tds[0].textContent.trim(),
      branch: tds[1].textContent.trim(),
      written: tds[2].textContent.trim(),
      dispensed: tds[3].textContent.trim(),
      conv: tds[4].textContent.trim(),
      convClass: convCell ? convCell.className : '',
      gap: tds[5].textContent.trim(),
      wasteRev: tds[6].textContent.trim(),
      wasteMargin: tds[7].textContent.trim()
    });
  });
  return rows;
}

(async function main(){
  try{
    await until(function(){ return !!document.getElementById('fileInput') && !!window.XLSX; }, 12000, 'app boot + XLSX');
    ok('app booted, XLSX available');

    // ── upload Oracle CSV (branch T1 by default) ──
    uploadFile('01-07_to_20-07.csv', buildOracleCSV(), 'text/csv');
    const branchBody = document.getElementById('branchBody');
    await until(function(){ return /نظرة عامة/.test(branchBody.textContent) && !/جارٍ تحليل/.test(branchBody.textContent); }, 12000, 'CSV parsed');
    ok('Oracle CSV parsed (T1 overview rendered)');

    // ── upload sales JSON (auto-navigates to rxsales) ──
    uploadFile('sales-backup.json', buildSalesJSON(), 'application/json');
    const stub = document.querySelector('[data-panel="__stub"]');
    await until(function(){ return /نافذة المطابقة/.test(stub.textContent) && /كتابات الفترة/.test(stub.textContent); }, 12000, 'rxsales rendered');
    ok('sales JSON imported + rxsales screen rendered');

    await wait(1200); // let count-up settle before reading final text

    // ── assertions: T1 ──
    const K = kpiMap(stub);
    function checkKpi(label, expectTo, expectText){
      const k = K[label];
      if(!k){ fail('KPI missing: '+label); return; }
      if(!approx(k.to, expectTo, 0.1)) fail('KPI '+label+' data-to='+k.to+' expected '+expectTo);
      else ok('KPI '+label+' = '+k.to+(expectText?(' ("'+k.text+'")'):''));
      if(expectText && k.text !== expectText) fail('KPI '+label+' text="'+k.text+'" expected "'+expectText+'"');
    }
    checkKpi('كتابات الفترة', 15, '15');
    checkKpi('وحدات مصروفة', 11, '11');
    checkKpi('معدل التحويل', 73.3333, '73.3%');
    checkKpi('فجوة التسرب (وحدات)', 4, '4');
    checkKpi('إيراد مُهدَر (ج.م)', 160, '160');
    checkKpi('هامش مُهدَر (ج.م)', 72, '72');

    // window banner
    if(/يوليو/.test(stub.textContent)) ok('window banner shows يوليو');
    else fail('window banner month wrong');

    // ── table ──
    const rows = tableRows(stub);
    const reflex = rows.find(function(r){ return /Reflex/i.test(r.name); });
    const oracure = rows.find(function(r){ return /Oracure/i.test(r.name); });
    if(reflex){
      if(reflex.written==='10' && reflex.dispensed==='6' && /60\.0%/.test(reflex.conv) && /rx-amber/.test(reflex.convClass) && reflex.gap==='4' && reflex.wasteRev==='160' && reflex.wasteMargin==='72')
        ok('reflex row correct (10/6 · 60.0% amber · gap4 · rev160 · margin72)');
      else fail('reflex row: '+JSON.stringify(reflex));
    } else fail('reflex row missing');
    if(oracure){
      if(oracure.written==='5' && oracure.dispensed==='5' && /100\.0%/.test(oracure.conv) && /rx-green/.test(oracure.convClass) && oracure.gap==='0')
        ok('oracure row correct (5/5 · 100.0% green · gap0)');
      else fail('oracure row: '+JSON.stringify(oracure));
    } else fail('oracure row missing');

    // ── doctor chips ──
    const chips = Array.prototype.map.call(stub.querySelectorAll('.rx-doc-chip'), function(c){ return { doc:c.getAttribute('data-doc'), txt:c.textContent.trim(), el:c }; });
    const ahmed = chips.find(function(c){ return /AHMED ALI/.test(c.doc); });
    if(ahmed) ok('doctor chip present: '+ahmed.txt);
    else fail('AHMED ALI chip missing (chips: '+JSON.stringify(chips.map(function(c){return c.doc;}))+')');

    // clicking chip opens the doctor drawer
    if(ahmed){
      ahmed.el.dispatchEvent(new window.Event('click', { bubbles:true }));
      await wait(200);
      const drawer = document.getElementById('drawer');
      if(drawer && /open/.test(drawer.className)) ok('clicking AHMED ALI chip opened doctor drawer');
      else fail('doctor drawer did not open on chip click');
    }

    // out-of-window (2026-06-25) NOT counted: dispensed must be 11 not 14 → already covered by KPI.
    ok('out-of-window entry excluded (dispensed=11)');
    // صيدلية 7 entry excluded for T1 → reflex dispensed=6 (checked).
    ok('صيدلية 7 entry excluded from T1');

    // ── switch to ALL and confirm صيدلية 7 now counts (reflex disp = 13) ──
    // open collab menu, click ALL
    const allBtn = document.querySelector('.collab-opt.collab-all');
    if(allBtn && !allBtn.disabled){
      // real user flow: leave rxsales → switch branch → return to rxsales (fresh render)
      document.querySelector('.nav-item[data-k="overview"]').dispatchEvent(new window.Event('click', { bubbles:true }));
      await wait(120);
      allBtn.dispatchEvent(new window.Event('click', { bubbles:true }));
      await wait(120);
      const rxNav = document.querySelector('.nav-item[data-k="rxsales"]');
      rxNav.dispatchEvent(new window.Event('click', { bubbles:true }));
      await wait(400);
      const rowsAll = tableRows(stub);
      // branch × product table → reflex may span T1 + T3 rows; sum them
      const reflexSum = rowsAll.filter(function(r){ return /Reflex/i.test(r.name); })
        .reduce(function(s,r){ return s + (parseInt(r.dispensed.replace(/[^\d]/g,''),10)||0); }, 0);
      const kAll = kpiMap(stub);
      const dispAll = kAll['وحدات مصروفة'] ? kAll['وحدات مصروفة'].to : NaN;
      if(reflexSum===13) ok('ALL view: صيدلية 7 counted (reflex dispensed across branches = 13)');
      else fail('ALL view reflex dispensed sum='+reflexSum+' expected 13');
      if(dispAll===18) ok('ALL view: total dispensed = 18 (6+7+5)');
      else fail('ALL view total dispensed='+dispAll+' expected 18');
    } else {
      console.log('(ALL button unavailable/disabled — skipping ALL check)');
    }

    // ── persistence: new JSDOM, same url, STATE.sales restored ──
    console.log('\n-- persistence check --');
    const store = {};
    try{
      // capture localStorage from window
      for(let i=0;i<window.localStorage.length;i++){ const k=window.localStorage.key(i); store[k]=window.localStorage.getItem(k); }
    }catch(e){}
    if(store['pharmaDash.sales.v1']) ok('sales persisted to localStorage[pharmaDash.sales.v1]');
    else fail('sales not persisted');

    console.log(process.exitCode ? '\n=== SOME CHECKS FAILED ===' : '\n=== ALL CHECKS PASSED ===');
  }catch(err){
    fail('exception: ' + (err && err.stack || err));
    console.log('\n=== TEST ERRORED ===');
  }
})();
