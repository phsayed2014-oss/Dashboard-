// General-safety pass: full nav round-trip + theme toggle = zero console errors,
// plus localStorage survival of STATE.sales across a fresh JSDOM (same url).
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(ROOT, 'PharmaDash_Pro_offline_3.html');
const XLSX_UUID = '68239745-24a7-47e1-948c-b1a0e0375ed7';

const bundle = fs.readFileSync(BUNDLE, 'utf8');
const tplRaw = bundle.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1].trim();
let appBase = JSON.parse(tplRaw);
const xlsxCode = fs.readFileSync(path.join(__dirname, 'assets', XLSX_UUID + '.js'), 'utf8');
appBase = appBase.replace(/<script src="([0-9a-f-]{36})"><\/script>/g, function(_m, uid){
  return uid === XLSX_UUID ? '<script>__XLSX__</script>' : '<script></script>';
}).replace('__XLSX__', function(){ return xlsxCode; });

const errors = [];
function makeDom(sharedStorage){
  const vc = new VirtualConsole();
  vc.on('jsdomError', function(e){ errors.push('jsdomError: ' + (e.message||e)); });
  const dom = new JSDOM(appBase, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://x.local/', virtualConsole: vc,
    beforeParse(window){
      window.alert = function(){}; window.confirm = function(){ return true; };
      const { TextDecoder, TextEncoder } = require('util');
      window.TextDecoder = window.TextDecoder || TextDecoder;
      window.TextEncoder = window.TextEncoder || TextEncoder;
      window.matchMedia = function(q){ return { matches:false, media:q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return false; } }; };
      if(!window.structuredClone) window.structuredClone = function(o){ return JSON.parse(JSON.stringify(o)); };
      ['ReadableStream','WritableStream','TransformStream'].forEach(function(n){ if(!window[n]) window[n]=function(){}; });
      if(!window.DOMMatrix) window.DOMMatrix = function(){};
      if(!window.Path2D) window.Path2D = function(){};
      window.HTMLCanvasElement.prototype.getContext = function(){ return null; };
      if(sharedStorage){
        Object.keys(sharedStorage).forEach(function(k){ try{ window.localStorage.setItem(k, sharedStorage[k]); }catch(e){} });
      }
    }
  });
  // window.onerror captures thrown script errors
  dom.window.addEventListener('error', function(e){ if(e && (e.error||e.message)) errors.push('window.error: ' + (e.error && e.error.stack || e.message)); });
  return dom;
}

function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

(async function(){
  // ── run 1: seed sales + walk every nav item + toggle theme ──
  const dom = makeDom(null);
  const { window } = dom; const { document } = window;
  await wait(400);

  // seed a sales file directly through the public import path (JSON upload)
  const input = document.getElementById('fileInput');
  const salesJson = JSON.stringify([{ id:'s1', date:'2026-07-05', pharmacy:'صيدلية 1', product:'reflex', units:6, price:40, cost:22, prescriptions:0 }]);
  const f = new window.File([salesJson], 'sales.json', { type:'application/json' });
  Object.defineProperty(input, 'files', { value:[f], configurable:true });
  input.dispatchEvent(new window.Event('change', { bubbles:true }));
  await wait(400);

  const navKeys = Array.prototype.map.call(document.querySelectorAll('.nav-item'), function(n){ return n.dataset.k; });
  console.log('nav items ('+navKeys.length+'): ' + navKeys.join(', '));
  for(const k of navKeys){
    const item = document.querySelector('.nav-item[data-k="'+k+'"]');
    item.dispatchEvent(new window.Event('click', { bubbles:true }));
    await wait(70);
  }
  // toggle theme (twice)
  const tbtn = document.getElementById('themeToggle') || document.querySelector('[id*="heme"],[class*="heme"]');
  const themeBtnCandidates = ['themeBtn','themeToggle','theme'];
  let tb = null;
  themeBtnCandidates.forEach(function(id){ if(!tb) tb = document.getElementById(id); });
  if(!tb){ // find button that toggles data-theme by scanning for one with 'theme' in outerHTML
    tb = Array.prototype.find.call(document.querySelectorAll('button'), function(b){ return /theme|الوضع|داكن|فاتح/i.test(b.getAttribute('title')||'') || /theme/i.test(b.id); });
  }
  if(tb){ tb.dispatchEvent(new window.Event('click',{bubbles:true})); await wait(120); tb.dispatchEvent(new window.Event('click',{bubbles:true})); await wait(120); console.log('theme toggled via #' + (tb.id||'(button)')); }
  else console.log('(theme button not located — skipping toggle)');

  // re-walk nav once more in the (possibly) dark theme
  for(const k of navKeys){
    document.querySelector('.nav-item[data-k="'+k+'"]').dispatchEvent(new window.Event('click', { bubbles:true }));
    await wait(50);
  }

  const seeded = {};
  for(let i=0;i<window.localStorage.length;i++){ const key=window.localStorage.key(i); seeded[key]=window.localStorage.getItem(key); }

  // ── run 2: fresh JSDOM, same url, seeded localStorage → STATE.sales must restore ──
  const dom2 = makeDom(seeded);
  const w2 = dom2.window; const d2 = w2.document;
  await wait(400);
  // navigate to rxsales; since sales restored, it should NOT show the "no sales file" empty card
  const rx = d2.querySelector('.nav-item[data-k="rxsales"]');
  rx.dispatchEvent(new w2.Event('click', { bubbles:true }));
  await wait(300);
  const stub2 = d2.querySelector('[data-panel="__stub"]');
  const restored = /sales\.json/.test(stub2.textContent) || /إدخال مبيعات/.test(stub2.textContent);
  const showsEmpty = /لا يوجد ملف مبيعات/.test(stub2.textContent);

  console.log('\n--- results ---');
  console.log(restored && !showsEmpty ? '✅ STATE.sales restored from localStorage after reload' : '❌ sales NOT restored (empty='+showsEmpty+')');
  console.log(errors.length === 0 ? '✅ zero console/script errors across full nav round-trip + theme toggle' : '❌ '+errors.length+' errors:\n' + errors.slice(0,10).join('\n'));

  process.exitCode = (errors.length===0 && restored && !showsEmpty) ? 0 : 1;
  console.log(process.exitCode ? '\n=== SAFETY: FAIL ===' : '\n=== SAFETY: PASS ===');
})();
