// Near-expiry comparison must show each product ONCE (no duplicate inventory batches).
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(ROOT, 'PharmaDash_Pro_offline_3.html');
const XLSX_UUID = '68239745-24a7-47e1-948c-b1a0e0375ed7';

function fail(m){ console.error('❌ ' + m); process.exitCode = 1; }
function ok(m){ console.log('✅ ' + m); }

const bundle = fs.readFileSync(BUNDLE, 'utf8');
let app = JSON.parse(bundle.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1].trim());
const xlsxCode = fs.readFileSync(path.join(__dirname, 'assets', XLSX_UUID + '.js'), 'utf8');
app = app.replace(/<script src="([0-9a-f-]{36})"><\/script>/g, function(_m, uid){ return uid===XLSX_UUID ? '<script>__X__</script>' : '<script></script>'; })
         .replace('__X__', function(){ return xlsxCode; });

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
  }
});
const { window } = dom; const { document } = window;
function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
async function until(pred, timeout, label){ const t0=Date.now(); while(Date.now()-t0<(timeout||12000)){ try{ if(pred()) return true; }catch(e){} await wait(70); } throw new Error('timeout: '+(label||'')); }

function attach(file, content){ const b=new Uint8Array(Buffer.from(content,'utf8')); file.arrayBuffer=function(){ return Promise.resolve(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)); }; file.text=function(){ return Promise.resolve(content); }; return file; }
// Oracle CSV that prescribes ZETRON (a near-expiry item), varying counts per period
function csv(zetronCount){
  const L=['Patient No,Patient Name,Service Name,Order No.,Status,Doctor Name,Section Name'];
  let p=2000,o=9000; for(let i=0;i<zetronCount;i++) L.push([++p,'P'+p,'ZETRON 200MG/5ML SUSPENTION','ORD'+(++o),'Closed','DR A','PED'].join(','));
  return L.join('\n');
}
function upload(name, content){ const inp=document.getElementById('fileInput'); const f=attach(new window.File([content],name,{type:'text/csv'}),content); Object.defineProperty(inp,'files',{value:[f],configurable:true}); inp.dispatchEvent(new window.Event('change',{bubbles:true})); }

(async function(){
  try{
    await until(function(){ return document.getElementById('fileInput') && window.XLSX; }, 12000, 'boot');
    ok('booted');

    // period 1 (older) then period 2 (newer) on T1 → enables comparison
    upload('01-06_to_30-06.csv', csv(5));
    const bb = document.getElementById('branchBody');
    await until(function(){ return /نظرة عامة/.test(bb.textContent) && !/جارٍ تحليل/.test(bb.textContent); }, 12000, 'p1');
    upload('01-07_to_31-07.csv', csv(33));
    await until(function(){ return /نظرة عامة/.test(bb.textContent) && !/جارٍ تحليل/.test(bb.textContent); }, 12000, 'p2');
    ok('two Oracle periods loaded on T1 (comparison enabled)');

    // open أصناف قرب الانتهاء
    document.querySelector('.nav-item[data-k="expiry"]').dispatchEvent(new window.Event('click', {bubbles:true}));
    const stub = document.querySelector('[data-panel="__stub"]');
    await until(function(){ return /قريب الانتهاء/.test(stub.textContent) && stub.querySelector('#neBody tr'); }, 9000, 'expiry cmp');
    // switch to "كل الأصناف" so every near-expiry product is listed (not just written ones)
    const allChip = Array.prototype.find.call(stub.querySelectorAll('#neChips .chip'), function(c){ return c.dataset.f==='all'; });
    if(allChip){ allChip.dispatchEvent(new window.Event('click', {bubbles:true})); await wait(200); }
    ok('near-expiry comparison rendered');

    // collect product names in the comparison table
    const rows = Array.prototype.map.call(stub.querySelectorAll('#neBody tr'), function(tr){
      const nameCell = tr.querySelector('td:nth-child(2) strong');
      return nameCell ? nameCell.textContent.trim() : null;
    }).filter(Boolean);
    console.log('   comparison rows:', rows.length);

    const counts = {};
    rows.forEach(function(n){ counts[n] = (counts[n]||0)+1; });
    const dups = Object.keys(counts).filter(function(n){ return counts[n]>1; });
    if(dups.length===0) ok('no duplicate product rows in comparison (each product appears once)');
    else fail('duplicate products still present: ' + JSON.stringify(dups.slice(0,5).map(function(n){ return n+' ×'+counts[n]; })));

    // the exact product from the screenshot (15 inventory batches → must be 1 row)
    const TARGET = 'ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE';
    const zetron225 = rows.filter(function(n){ return n === TARGET; });
    if(zetron225.length===1) ok('«'+TARGET+'» appears exactly once (was 15 inventory batches)');
    else fail(TARGET + ' rows = ' + zetron225.length + ' expected 1');
    // (a second, genuinely different product "ZETRON ...15ML/Bottle" may also appear once — that is correct)
    const zetronAll = rows.filter(function(n){ return /ZETRON/i.test(n); });
    console.log('   distinct ZETRON products shown: ' + zetronAll.length + ' → ' + JSON.stringify(zetronAll));

    console.log(process.exitCode ? '\n=== NEAR-EXPIRY: SOME CHECKS FAILED ===' : '\n=== NEAR-EXPIRY: ALL CHECKS PASSED ===');
  }catch(err){
    fail('exception: ' + (err && err.stack || err));
    console.log('\n=== NEAR-EXPIRY: ERRORED ===');
  }
})();
