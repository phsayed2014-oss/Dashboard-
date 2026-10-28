/* PharmaDash Pro — متابعة Private Label: كتابات الأطباء مقابل مبيعات الصيدلية
   كل البيانات تُحفظ على الجهاز (IndexedDB) — لا شيء يُرفع لأي خادم. */
(function(){
'use strict';

/* ───────── ثوابت ───────── */
const BRANCHES = { T1:'صيدلية 1', T2:'صيدلية 18', T3:'صيدلية 7' };
const PHARMACY_TO_BRANCH = { '1':'T1', '18':'T2', '7':'T3' };
const PUREHERB_KEYMAP = { 'PURE OMEGA':'pure_omega','PUREFEEL':'purefeel','CENTROZON W':'centrozon_w','CENTROZON':'centrozon','ZINCOLIVE':'zincolive','BONEFRIEND':'bonefriend','ARGIGROW':'argigrow' };
const PRODUCTS = [
  ...PRIVATE_LABEL.map(p=>({ key:p.key, name:p.name, form:p.form.replace(' · ',' '), brand:'n' })),
  ...PUREHERB_PRODUCTS.map(p=>{ const name=p.name.replace(/\s+(Syrup|Tablet)?\s*\d.*$/,''); return { key:PUREHERB_KEYMAP[p.key], name, form:p.name.slice(name.length).trim(), brand:'h' }; })
];
const PROD = Object.fromEntries(PRODUCTS.map(p=>[p.key,p]));
const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function productKeyOf(service){
  const pl=findPrivateLabelProduct(service); if(pl) return pl.key;
  const ph=findPureHerbProduct(service); if(ph){ const k=PUREHERB_KEYMAP[ph.key]||null; if(!(k==='argigrow'&&/TABL/i.test(service))) return k; }
  return null;
}
const keyOf = v => PharmaCore.normalizeEntityKey(v);
const esc = escapeHtml;
const ymd = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const todayISO = () => ymd(new Date());
function addDays(iso,n){ const [y,m,d]=iso.split('-').map(Number); return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10); }
function monthEnd(ym){ const [y,m]=ym.split('-').map(Number); return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10); }
function prevMonth(ym){ const [y,m]=ym.split('-').map(Number); return m===1?(y-1)+'-12':y+'-'+String(m-1).padStart(2,'0'); }
const fmtDay = d => { if(!d) return '—'; const [,m,dd]=d.split('-'); return (+dd)+' '+MONTHS[+m-1]; };
const fmtMonth = ym => { const [y,m]=ym.split('-'); return MONTHS[+m-1]+' '+y; };
const pctChange = (cur,prev) => prev>0 ? Math.round((cur-prev)/prev*100) : null;
const tone = c => c==null?'var(--faint)':c>=80?'var(--sale)':c>=40?'var(--warn)':'var(--leak)';
const slug = k => k.replace(/_/g,'-');
function idOf(str){ let h=5381; for(const ch of str) h=((h<<5)+h+ch.codePointAt(0))>>>0; return h.toString(36); }
function initials(name){
  const w=String(name||'').replace(/^(DR\.?|DOCTOR|د\.?|دكتور)\s+/i,'').trim().split(/\s+/).filter(Boolean);
  return ((w[0]||'?')[0]+((w[1]||'')[0]||'')).toUpperCase();
}

/* ───────── أيقونات ───────── */
const ICON={
  pill:'<path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z"/><path d="m8.5 8.5 7 7"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  leak:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M9 14h6"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  chart:'<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-6"/>',
  upload:'<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>',
  back:'<path d="m9 18 6-6-6-6"/>', go:'<path d="m15 18-6-6 6-6"/>',
  down:'<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  box:'<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
  save:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'
};
const svg=(k,w=2)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON[k]+'</svg>';

const SECTIONS=[
  {id:'products', t:'Private Label',     d:'اتكتب كام واتباع كام لكل صنف',          k:'k-sale', i:'pill'},
  {id:'matrix',   t:'الأطباء × الأصناف', d:'مين بيكتب إيه — والخانات الفاضية فرص', k:'k-rx',   i:'grid'},
  {id:'leakage',  t:'اتكتب وما اتباعش',  d:'كتابات Private Label اللي ما وصلتش للبيع',     k:'k-leak', i:'leak'},
  {id:'alerts',   t:'التنبيهات',          d:'أصناف نزلت وأطباء بطّلوا',             k:'k-warn', i:'bell'},
  {id:'timeline', t:'الخط الزمني',        d:'شهر قصاد شهر',                        k:'k-time', i:'chart'},
  {id:'upload',   t:'رفع الملفات',        d:'كتابات أو مبيعات — PDF أو Excel',      k:'k-up',   i:'upload'}
];

/* ───────── التخزين (IndexedDB) ───────── */
const Store=(()=>{
  let dbp=null;
  function open(){
    if(dbp) return dbp;
    dbp=new Promise((res,rej)=>{
      // لو التخزين ما ردّش خلال 6 ثواني (بعض المتصفحات/الإطارات بتمنعه) نكمّل من غير حفظ
      setTimeout(()=>rej(new Error('التخزين المحلي مش بيرد')),6000);
      const r=indexedDB.open('pharmadash-pro',1);
      r.onblocked=()=>rej(new Error('التخزين مقفول من نسخة تانية مفتوحة — اقفل التابات التانية'));
      r.onupgradeneeded=()=>{ const db=r.result;
        ['uploads','visits'].forEach(s=>{ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'}); });
        if(!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); };
      r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
    });
    return dbp;
  }
  async function tx(store,mode,fn){
    const db=await open();
    return new Promise((res,rej)=>{ const t=db.transaction(store,mode); const out=fn(t.objectStore(store));
      t.oncomplete=()=>res(out&&'result' in out?out.result:out); t.onerror=()=>rej(t.error); });
  }
  return {
    all:s=>tx(s,'readonly',st=>st.getAll()),
    put:(s,v)=>tx(s,'readwrite',st=>{ st.put(v); }),
    del:(s,id)=>tx(s,'readwrite',st=>{ st.delete(id); }),
    clear:s=>tx(s,'readwrite',st=>{ st.clear(); }),
    get:k=>tx('kv','readonly',st=>st.get(k)),
    set:(k,v)=>tx('kv','readwrite',st=>{ st.put(v,k); })
  };
})();

/* ───────── الحالة ───────── */
const S={ uploads:[], sales:[], f:{ mode:'month', month:'', branch:'ALL' }, ix:null, brand:'all', tlProduct:'ALL', ready:false, allFiles:false };
try{ const f=JSON.parse(localStorage.getItem('pdp-filter2')); if(f&&f.mode) S.f=Object.assign(S.f,f); }catch(e){}
function saveFilter(){ try{ localStorage.setItem('pdp-filter2',JSON.stringify(S.f)); }catch(e){} }

async function loadAll(){
  S.storageOk=true;
  try{ S.uploads=await Store.all('uploads'); S.sales=(await Store.get('sales'))||[];
    // الإصدار 4.2 كان بيضيف أصناف من التقارير لوحده — اتلغى، والقائمة ثابتة (13 صنف)
    if(((await Store.get('products'))||[]).length){ await Store.set('products',[]); S.sales=S.sales.filter(e=>PROD[e.product]); await Store.set('sales',S.sales); } }
  catch(e){ S.storageOk=false; S.storageErr=String(e&&e.message||e); toast('تعذّر فتح التخزين المحلي — البيانات مش هتتحفظ بعد قفل الصفحة'); }
  // النسخ القديمة كانت بتحفظ يوم واحد (date) — بقت فترة (from/to)
  S.uploads.forEach(u=>{ if(!u.from){ u.from=u.to=u.date||todayISO(); } });
  S.sales.forEach(e=>{ if(!e.from){ e.from=e.to=e.date; } });
  S.ready=true; safeRebuild();
}
function safeRebuild(){ try{ rebuild(); S.err=null; }catch(e){ S.err=e; console.error(e); } }

/* ───────── الفترات ─────────
   كل ملف (كتابات أو مبيعات) بيغطي فترة من/إلى. أي فترة بتختارها بتاخد من كل ملف
   نصيب الأيام اللي جواها بس (بافتراض إن أيام الملف متساوية). */
const dayDiff=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/864e5);
const lenOf=r=>dayDiff(r.from,r.to)+1;
function overlap(r,W){ if(!W) return 0; const f=r.from>W.from?r.from:W.from, t=r.to<W.to?r.to:W.to; return f>t?0:dayDiff(f,t)+1; }
const frac=(r,W)=>overlap(r,W)/lenOf(r);
function eachDay(from,to,fn){ for(let d=from,g=0;d<=to&&g<800;d=addDays(d,1),g++) fn(d); }
function dataRange(){
  let a='', b='';
  S.uploads.forEach(u=>{ if(!a||u.from<a) a=u.from; if(!b||u.to>b) b=u.to; });
  S.sales.forEach(e=>{ if(!a||e.from<a) a=e.from; if(!b||e.to>b) b=e.to; });
  return { first:a||todayISO(), last:b||todayISO() };
}
function dataMonths(){
  const s=new Set(); const add=r=>{ for(let m=r.from.slice(0,7),g=0;m<=r.to.slice(0,7)&&g<60;g++){ s.add(m); const [y,mm]=m.split('-').map(Number); m=mm===12?(y+1)+'-01':y+'-'+String(mm+1).padStart(2,'0'); } };
  S.uploads.forEach(add); S.sales.forEach(add); return [...s].sort();
}
function windowOf(){
  const {first,last}=dataRange(); const f=S.f;
  if(f.mode==='day'){ const p=addDays(last,-1); return { from:last, to:last, prev:{from:p,to:p}, label:fmtDay(last), cmp:'عن '+fmtDay(p) }; }
  if(f.mode==='week'){
    const from=addDays(last,-6);
    return { from, to:last, prev:{from:addDays(from,-7),to:addDays(from,-1)}, label:'آخر 7 أيام', cmp:'عن الـ 7 أيام اللي قبلها' };
  }
  if(f.mode==='all') return { from:first, to:last, prev:null, label:'كل الفترة', cmp:'' };
  const months=dataMonths();
  const ym=months.includes(f.month)?f.month:(months[months.length-1]||todayISO().slice(0,7));
  const to=last.slice(0,7)===ym?last:monthEnd(ym);
  const days=+to.slice(8,10); const pm=prevMonth(ym);
  const pTo=pm+'-'+String(Math.min(days,+monthEnd(pm).slice(8,10))).padStart(2,'0');
  return { from:ym+'-01', to, prev:{from:pm+'-01',to:pTo}, label:fmtMonth(ym), cmp:'عن نفس الأيام من '+MONTHS[+pm.slice(5,7)-1], ym };
}

/* ───────── بناء الفهرس ───────── */
const aggCache=new WeakMap();
function aggOf(u){
  let a=aggCache.get(u); if(a) return a;
  a={ prod:{}, canc:{}, docs:new Map() };
  for(const r of u.rows){
    const service=r[1], doctor=r[0]; const pk=service?productKeyOf(service):null; const dk=keyOf(doctor); const gk=keyOf(service);
    if(pk){ a.prod[pk]=(a.prod[pk]||0)+1; if(PharmaCore.normalizeStatus(r[4])==='Canceled') a.canc[pk]=(a.canc[pk]||0)+1; }
    if(!dk) continue;
    let d=a.docs.get(dk); if(!d){ d={name:doctor,section:r[2]||'',total:0,mine:0,prods:{},drugs:new Map()}; a.docs.set(dk,d); }
    d.total++; if(r[2]&&!d.section) d.section=r[2];
    if(gk){ const g=d.drugs.get(gk)||{name:service,count:0,pk}; g.count++; d.drugs.set(gk,g); }
    if(pk){ d.mine++; d.prods[pk]=(d.prods[pk]||0)+1; }
  }
  aggCache.set(u,a); return a;
}
const R=v=>Math.round(v);
function rebuild(){
  const W=windowOf(); const B=S.f.branch; const {last}=dataRange();
  const okB=b=>B==='ALL'||b===B; let approx=false;
  const prod={}; PRODUCTS.forEach(p=>prod[p.key]={ key:p.key, brand:p.brand, w:0, wPrev:0, s:0, sPrev:0, amount:0, canceled:0,
      wB:{T1:0,T2:0,T3:0}, sB:{T1:0,T2:0,T3:0}, sPrevB:{T1:0,T2:0,T3:0}, wCovB:{T1:0,T2:0,T3:0}, stock:{}, docs:new Map(), dailyW:new Map(), dailyS:new Map() });
  const doctors=new Map(); const months=new Map();
  const mon=ym=>{ let m=months.get(ym); if(!m){ m={w:0,s:0,pw:{},ps:{}}; months.set(ym,m);} return m; };
  const sparkTo=W.to, sparkFrom=addDays(sparkTo,-29), SP={from:sparkFrom,to:sparkTo};
  const a7={from:addDays(last,-6),to:last}, p7={from:addDays(last,-13),to:addDays(last,-7)};
  const r14={from:addDays(last,-13),to:last}, o28={from:addDays(last,-41),to:addDays(last,-14)};
  const alertW={}, alertS={}; PRODUCTS.forEach(p=>{ alertW[p.key]={c:0,p:0}; alertS[p.key]={c:0,p:0}; });
  const docStop=new Map(); let salesA=false, salesP=false;
  const spread=(map,r,v)=>{ const n=lenOf(r); const f=r.from>SP.from?r.from:SP.from, t=r.to<SP.to?r.to:SP.to; if(f<=t) eachDay(f,t,d=>map.set(d,(map.get(d)||0)+v/n)); };
  const toMonths=(r,fn)=>{ const n=lenOf(r); const byM={}; eachDay(r.from,r.to,d=>{ const m=d.slice(0,7); byM[m]=(byM[m]||0)+1; }); Object.keys(byM).forEach(m=>fn(mon(m),byM[m]/n)); };

  // أيام فيها ملف مبيعات (لكل صيدلية ولكل شركة) داخل الفترة — التحويل بيتحسب عليها بس
  const covDays={};
  S.sales.forEach(e=>{ if(!okB(e.branch)||!PROD[e.product]) return;
    const f=e.from>W.from?e.from:W.from, t=e.to<W.to?e.to:W.to; if(f>t) return;
    const k=e.branch+'|'+PROD[e.product].brand; const set=covDays[k]||(covDays[k]=new Set()); eachDay(f,t,d=>set.add(d)); });
  const covPrev=new Set(); S.sales.forEach(e=>{ if(okB(e.branch)&&PROD[e.product]&&overlap(e,W.prev)) covPrev.add(e.branch+'|'+PROD[e.product].brand); });
  const covFrac=(u,brand)=>{ const set=covDays[u.branch+'|'+brand]; if(!set) return 0; const f=u.from>W.from?u.from:W.from, t=u.to<W.to?u.to:W.to; if(f>t) return 0; let n=0; eachDay(f,t,d=>{ if(set.has(d)) n++; }); return n/lenOf(u); };

  for(const u of S.uploads){
    if(!okB(u.branch)) continue;
    const a=aggOf(u); const fw=frac(u,W), fp=frac(u,W.prev); if(fw>0&&fw<1) approx=true;
    const cf={n:fw?covFrac(u,'n'):0,h:fw?covFrac(u,'h'):0};
    for(const pk in a.prod){ const c=a.prod[pk], P=prod[pk];
      P.w+=c*fw; P.wB[u.branch]+=c*fw; P.wCovB[u.branch]+=c*cf[P.brand]; P.wPrev+=c*fp; P.canceled+=(a.canc[pk]||0)*fw;
      spread(P.dailyW,u,c); toMonths(u,(m,f)=>{ m.w+=c*f; m.pw[pk]=(m.pw[pk]||0)+c*f; });
      alertW[pk].c+=c*frac(u,a7); alertW[pk].p+=c*frac(u,p7); }
    const fr14=frac(u,r14), fo28=frac(u,o28);
    a.docs.forEach((d,dk)=>{
      if(fw>0){
        let doc=doctors.get(dk);
        if(!doc){ doc={ key:dk, id:idOf(dk), name:d.name, section:d.section, total:0, mine:0, prods:new Map(), drugs:new Map(), branches:new Set() }; doctors.set(dk,doc); }
        doc.total+=d.total*fw; doc.mine+=d.mine*fw; doc.branches.add(u.branch); if(!doc.section) doc.section=d.section;
        d.drugs.forEach((g,gk)=>{ const x=doc.drugs.get(gk)||{name:g.name,count:0,pk:g.pk}; x.count+=g.count*fw; doc.drugs.set(gk,x); });
        for(const pk in d.prods){ const c=d.prods[pk]; const pp=doc.prods.get(pk)||{w:0}; pp.w+=c*fw; doc.prods.set(pk,pp);
          const P=prod[pk]; const x=P.docs.get(dk)||{name:d.name,w:0,wB:{T1:0,T2:0,T3:0},wCovB:{T1:0,T2:0,T3:0}};
          x.w+=c*fw; x.wB[u.branch]+=c*fw; x.wCovB[u.branch]+=c*cf[P.brand]; P.docs.set(dk,x); }
      }
      if(fr14||fo28) for(const pk in d.prods){ const k=dk+'|'+pk; const x=docStop.get(k)||{name:d.name,dk,pk,recent:0,old:0}; x.recent+=d.prods[pk]*fr14; x.old+=d.prods[pk]*fo28; docStop.set(k,x); }
    });
  }
  const latestSeg={};
  for(const e of S.sales){
    if(!okB(e.branch)||!PROD[e.product]) continue;
    const P=prod[e.product]; const fw=frac(e,W); if(fw>0&&fw<1) approx=true;
    P.s+=e.units*fw; P.sB[e.branch]+=e.units*fw; P.amount+=(e.amount||0)*fw; const fpv=frac(e,W.prev); P.sPrev+=e.units*fpv; P.sPrevB[e.branch]+=e.units*fpv;
    spread(P.dailyS,e,e.units); toMonths(e,(m,f)=>{ m.s+=e.units*f; m.ps[e.product]=(m.ps[e.product]||0)+e.units*f; });
    const fa=frac(e,a7), fp=frac(e,p7); if(fa) salesA=true; if(fp) salesP=true; alertS[e.product].c+=e.units*fa; alertS[e.product].p+=e.units*fp;
    if(e.stock!=null){ const k=e.product+'|'+e.branch; if(!latestSeg[k]||e.to>latestSeg[k].to) latestSeg[k]=e; }
  }
  Object.values(latestSeg).forEach(e=>{ prod[e.product].stock[e.branch]={qty:e.stock,at:e.to}; });

  // تقريب الأرقام بعد التوزيع على الأيام
  const hasSales=Object.keys(covDays).length>0;
  const cov=[...new Set(Object.keys(covDays).map(k=>k.split('|')[0]))];
  let W_=0,S_=0,WC=0,LOST=0,Wp=0,Sp=0,SC=0,SPC=0;
  PRODUCTS.forEach(p=>{ const P=prod[p.key];
    ['w','wPrev','s','sPrev','amount','canceled'].forEach(k=>P[k]=R(P[k]));
    ['T1','T2','T3'].forEach(b=>{ P.wB[b]=R(P.wB[b]); P.sB[b]=R(P.sB[b]); P.wCovB[b]=R(P.wCovB[b]); });
    P.dailyW.forEach((v,k)=>P.dailyW.set(k,R(v))); P.dailyS.forEach((v,k)=>P.dailyS.set(k,R(v)));
    const covB=b=>!!covDays[b+'|'+p.brand];
    P.covered=['T1','T2','T3'].filter(covB);
    P.wCov=P.covered.reduce((a,b)=>a+P.wCovB[b],0);
    P.lostB={T1:0,T2:0,T3:0}; P.covered.forEach(b=>{ P.lostB[b]=Math.max(0,P.wCovB[b]-P.sB[b]); });
    P.lost=P.covered.reduce((a,b)=>a+P.lostB[b],0);
    P.conv=P.covered.length&&P.wCov>0?Math.round(P.s/P.wCov*100):null;
    // مقارنة المبيعات: بس الصيدليات اللي ليها ملف مبيعات للشركة دي في الفترتين
    const both=P.covered.filter(b=>covPrev.has(b+'|'+p.brand));
    P.sCmp=R(both.reduce((a,b)=>a+P.sB[b],0)); P.sPrevCmp=R(both.reduce((a,b)=>a+P.sPrevB[b],0));
    P.trend=hasSales?(both.length?pctChange(P.sCmp,P.sPrevCmp):null):pctChange(P.w,P.wPrev);
    W_+=P.w; S_+=P.s; WC+=P.wCov; LOST+=P.lost; Wp+=P.wPrev; Sp+=P.sPrev; SC+=P.sCmp; SPC+=P.sPrevCmp;
  });
  doctors.forEach(d=>{ d.total=R(d.total); d.mine=R(d.mine); d.prods.forEach((x,k)=>{ x.w=R(x.w); if(!x.w) d.prods.delete(k); }); d.drugs.forEach((x,k)=>{ x.count=R(x.count); if(!x.count) d.drugs.delete(k); }); });
  months.forEach(m=>{ m.w=R(m.w); m.s=R(m.s); for(const k in m.pw) m.pw[k]=R(m.pw[k]); for(const k in m.ps) m.ps[k]=R(m.ps[k]); });

  // الفاقد لكل طبيب (تقديري): نصيبه من فاقد الصنف في نفس الصيدلية
  const leak=[];
  PRODUCTS.forEach(p=>{ const P=prod[p.key];
    P.docs.forEach((x,dk)=>{ let est=0; P.covered.forEach(b=>{ if(P.wCovB[b]>0) est+=x.wCovB[b]*P.lostB[b]/P.wCovB[b]; });
      x.w=R(x.w); ['T1','T2','T3'].forEach(b=>x.wB[b]=R(x.wB[b])); x.lost=Math.min(x.w,R(est));
      if(!x.w){ P.docs.delete(dk); return; }
      if(x.lost>0) leak.push({dk,id:idOf(dk),name:x.name,pk:p.key,w:x.w,lost:x.lost,branches:Object.keys(x.wB).filter(b=>x.wB[b]>0)}); });
  });
  leak.sort((a,b)=>b.lost-a.lost||b.w-a.w);

  // التنبيهات
  const alerts=[];
  PRODUCTS.forEach(p=>{
    const s={c:R(alertS[p.key].c),p:R(alertS[p.key].p)}, w={c:R(alertW[p.key].c),p:R(alertW[p.key].p)};
    if(salesA&&salesP&&s.p>=5&&s.c<=s.p*.75) alerts.push({sev:2,c:'leak',i:'down',t:p.name+' مبيعاته نزلت '+Math.round((1-s.c/s.p)*100)+'%',p:'آخر 7 أيام '+s.c+' علبة مقابل '+s.p+' في الأسبوع اللي قبله.'+(w.c>=w.p&&w.p>0?' الكتابات ثابتة أو زادت، يعني المشكلة غالبًا في البيع أو التوفر.':''),pk:p.key});
    if(w.p>=5&&w.c<=w.p*.75) alerts.push({sev:2,c:'leak',i:'down',t:p.name+' كتاباته نزلت '+Math.round((1-w.c/w.p)*100)+'%',p:'آخر 7 أيام '+w.c+' كتابة مقابل '+w.p+' في الأسبوع اللي قبله.',pk:p.key});
    const P=prod[p.key]; if(P.conv!=null&&P.wCov>=10&&P.conv<40) alerts.push({sev:1,c:'warn',i:'box',t:p.name+' بيتكتب ومش بيتباع',p:'في '+W.label+' اتكتب '+P.wCov+' مرة واتباع '+P.s+' علبة بس ('+P.conv+'%). راجع التوفر في الصيدلية.',pk:p.key});
  });
  [...docStop.values()].filter(x=>R(x.old)>=3&&x.recent<0.5).sort((a,b)=>b.old-a.old).slice(0,8).forEach(x=>{
    alerts.push({sev:0,c:'rx',i:'user',t:x.name+' بطّل يكتب '+PROD[x.pk].name,p:'كتبه '+R(x.old)+' مرة في الأسابيع اللي فاتت، وما كتبهوش ولا مرة في آخر 14 يوم.',id:idOf(x.dk)});
  });
  alerts.sort((a,b)=>b.sev-a.sev);

  S.ix={ W, prod, doctors, leak, alerts, months, hasSales, cov, last, approx,
    totals:{w:W_,s:S_,wc:WC,lost:LOST,wPrev:Wp,sPrev:Sp,sCmp:SC,sPrevCmp:SPC,conv:hasSales&&WC>0?Math.round(S_/WC*100):null} };
}

/* ───────── رسومات صغيرة ───────── */
function ring(size,stroke,parts){
  const r=(size-stroke)/2, C=2*Math.PI*r; let off=0;
  let h='<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="currentColor" stroke-opacity=".14" stroke-width="'+stroke+'"/>';
  parts.forEach(p=>{ const v=Math.max(0,Math.min(1,p.v)); if(!v) return;
    h+='<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+p.c+'" stroke-width="'+stroke+'" stroke-linecap="round" stroke-dasharray="'+(C*v).toFixed(1)+' '+C.toFixed(1)+'" stroke-dashoffset="'+(-off).toFixed(1)+'"/>'; off+=C*v; });
  return '<svg viewBox="0 0 '+size+' '+size+'" aria-hidden="true">'+h+'</svg>';
}
function spark(vals,c){
  if(vals.length<2||!vals.some(v=>v)) return '<svg class="spark" viewBox="0 0 96 28" aria-hidden="true"></svg>';
  const m=Math.max(...vals,1), n=vals.length-1, pts=vals.map((v,i)=>[i*96/n,26-v/m*22]);
  return '<svg class="spark" viewBox="0 0 96 28" aria-hidden="true"><path d="M0 28 L'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L')+' L96 28Z" fill="'+c+'" fill-opacity=".14"/><polyline fill="none" stroke="'+c+'" stroke-width="2" points="'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+'"/><circle cx="'+pts[n][0].toFixed(1)+'" cy="'+pts[n][1].toFixed(1)+'" r="2.6" fill="'+c+'"/></svg>';
}
function series(map,to,days){ const out=[]; for(let i=days-1;i>=0;i--) out.push(map.get(addDays(to,-i))||0); return out; }
function trendTag(t){ if(t==null) return '<span class="trend flat">—</span>';
  return '<span class="trend '+(t>0?'up':t<0?'down':'flat')+'">'+(t>0?'▲ ':t<0?'▼ ':'')+Math.abs(t)+'%</span>'; }
function delta(t){ if(t==null) return '<div class="d flat">—</div>'; return '<div class="d '+(t>0?'up':t<0?'down':'flat')+'">'+(t>0?'▲ ':t<0?'▼ ':'')+Math.abs(t)+'%</div>'; }
function niceMax(v){ const step=Math.pow(10,Math.floor(Math.log10(Math.max(v,1)/4))); const unit=[1,2,2.5,5,10].map(x=>x*step).find(u=>u*4>=v)||step*10; return unit*4; }
const heatLv=v=>v===0?0:v<3?1:v<6?2:v<10?3:4;
const hasData=()=>S.uploads.length>0||S.sales.length>0;

/* ───────── الشاشات ───────── */
function periodControls(hero){
  const months=dataMonths().reverse();
  const cls=hero?'pill':'chip'; const curM=S.ix.W.ym||months[0]||'';
  let h=[['day','اليوم'],['week','آخر 7 أيام']].map(([k,l])=>'<button class="'+cls+(S.f.mode===k?' on':'')+'" data-mode="'+k+'">'+l+'</button>').join('');
  h+='<select class="'+cls+(S.f.mode==='month'?' on':'')+'" id="monthSel" aria-label="الشهر">'+(months.length?months:[curM]).map(m=>'<option value="'+m+'"'+(S.f.mode==='month'&&m===curM?' selected':'')+'>'+(m?fmtMonth(m):'الشهر')+'</option>').join('')+'</select>';
  h+='<button class="'+cls+(S.f.mode==='all'?' on':'')+'" data-mode="all">الكل</button>';
  h+=(hero?'':'<span class="sep"></span>')+branchSelect(cls);
  return h;
}
const branchSelect=cls=>'<select class="'+cls+(S.f.branch!=='ALL'?' on':'')+'" id="branchSel" aria-label="الصيدلية"><option value="ALL">كل الصيدليات ▾</option>'+Object.entries(BRANCHES).map(([k,l])=>'<option value="'+k+'"'+(S.f.branch===k?' selected':'')+'>'+l+'</option>').join('')+'</select>';

function home(){
  const ix=S.ix, T=ix.totals;
  let h='<section class="hero"><div class="hero-in"><div><div class="hello">Dr. Elsayed Hassan · '+esc(ix.W.label)+(S.f.branch!=='ALL'?' · '+BRANCHES[S.f.branch]:'')+'</div>';
  if(!hasData()){
    h+='<h1>ارفع ملفات الكتابات والمبيعات، وهتلاقي متابعة Private Label هنا</h1><a class="cta" href="#upload">'+svg('upload')+' رفع الملفات</a></div>'
      +'<div class="ring-wrap" style="color:var(--hero-muted)">'+ring(200,16,[])+'<div class="ring-c"><b class="num">—</b><span>نسبة التحويل</span></div></div></div></section>';
  } else {
    h+='<h1><span dir="ltr">Private Label</span> اتكتب <span class="num">'+fmt(T.w)+'</span> مرة'+(ix.hasSales?' واتباع منه <em class="num">'+fmt(T.s)+'</em> علبة':'')+'</h1>'
      +'<div class="pills">'+periodControls(true)+'</div><div class="hstats">'
      +'<div class="hs"><div class="l"><i style="background:var(--rx)"></i>كتابات</div><div class="v num">'+fmt(T.w)+'</div>'+delta(pctChange(T.w,T.wPrev))+'</div>'
      +'<div class="hs"><div class="l"><i style="background:var(--sale)"></i>مبيعات</div><div class="v num">'+(ix.hasSales?fmt(T.s):'—')+'</div>'+(ix.hasSales?delta(pctChange(T.sCmp,T.sPrevCmp)):'<div class="d flat">ارفع المبيعات</div>')+'</div>'
      +'<div class="hs"><div class="l"><i style="background:var(--leak)"></i>ما اتباعش</div><div class="v num">'+(ix.hasSales?fmt(T.lost):'—')+'</div><div class="d flat">'+(ix.hasSales&&T.wc?Math.round(T.lost/T.wc*100)+'% من الكتابات':'')+'</div></div>'
      +'</div></div>'
      +'<div class="ring-wrap" style="color:var(--hero-muted)">'+ring(200,16,ix.hasSales&&T.wc?[{v:Math.min(T.s,T.wc)/T.wc,c:'var(--sale)'},{v:T.lost/T.wc,c:'var(--leak)'}]:[])
      +'<div class="ring-c"><b class="num">'+(T.conv==null?'—':T.conv+'%')+'</b><span>نسبة التحويل</span></div></div></div>';
    const partial=ix.hasSales&&ix.cov.length<(S.f.branch==='ALL'?3:1);
    const notes=[]; if(ix.W.cmp) notes.push('الأسهم = التغيير '+esc(ix.W.cmp));
    if(partial) notes.push('التحويل محسوب لـ '+ix.cov.map(b=>BRANCHES[b]).join(' و')+' بس (اللي ليها مبيعات)');
    if(ix.approx) notes.push('فيه ملفات بتغطي فترة أطول من اللي اخترتها، فأخدنا منها نصيب الأيام دي بالتقريب');
    if(notes.length) h+='<div class="hero-note">'+notes.join(' · ')+'</div>';
    h+='</section>';
  }
  const P=Object.values(ix.prod);
  const writers=[...ix.doctors.values()].filter(d=>d.mine>0).sort((a,b)=>b.mine-a.mine);
  const mths=[...ix.months.keys()].sort();
  const mv=m=>ix.hasSales?ix.months.get(m).s:ix.months.get(m).w;
  const val={
    products:ix.hasSales?[P.filter(p=>p.conv!=null&&p.conv>=80).length+' من '+PRODUCTS.length,'صنف تحويله أخضر']:[P.filter(p=>p.w).length+' من '+PRODUCTS.length,'صنف اتكتب في الفترة'],
    matrix:[fmt(writers.length),'طبيب بيكتب Private Label'],
    leakage:ix.hasSales?[fmt(T.lost),'كتابة ما اتباعتش']:['—','محتاج ملف مبيعات'],
    alerts:[fmt(ix.alerts.length), ix.alerts.length?'تنبيه محتاج نظرة':'مفيش تنبيهات'],
    timeline:[fmt(mths.length),'شهر فيه بيانات'],
    upload:[fmt(S.uploads.length+new Set(S.sales.map(e=>e.branch+e.from+e.to+PROD[e.product].brand)).size),'ملف محفوظ']
  };
  const extra={
    products:'<div class="dots">'+PRODUCTS.map(p=>'<i style="background:'+tone(ix.prod[p.key].conv)+'" title="'+esc(p.name)+'"></i>').join('')+'</div>',
    matrix:writers.length?'<div class="mini-heat">'+writers.slice(0,5).flatMap(d=>PRODUCTS.map(p=>'<i style="background:var(--h'+heatLv((d.prods.get(p.key)||{w:0}).w)+')"></i>')).join('')+'</div>':'',
    timeline:mths.length>1?spark(mths.slice(-8).map(mv),'var(--time)'):''
  };
  h+='<div class="sec-h"><h2>الأقسام</h2><span>اضغط على أي قسم</span></div><div class="hub">';
  SECTIONS.forEach(s=>{
    h+='<a class="tile" href="#'+s.id+'"><span class="go">'+svg('go')+'</span>'+(s.id==='alerts'&&ix.alerts.length?'<span class="badge num">'+ix.alerts.length+'</span>':'')
      +'<span class="ic '+s.k+'">'+svg(s.i,1.8)+'</span><div><div class="tt">'+s.t+'</div><div class="td">'+s.d+'</div></div>'
      +'<div class="tv"><b class="num">'+val[s.id][0]+'<small>'+val[s.id][1]+'</small></b>'+(extra[s.id]||'')+'</div></a>';
  });
  return h+'</div>';
}
function head(id,sub){
  const s=SECTIONS.find(x=>x.id===id);
  return '<div class="bar"><a class="back" href="#home" aria-label="رجوع">'+svg('back')+'</a><span class="ic '+s.k+'">'+svg(s.i,1.8)+'</span><div><h2>'+s.t+'</h2><p>'+sub+'</p></div></div>';
}
const strip=()=>'<div class="fstrip">'+periodControls(false)+'</div>';
const needData=()=>'<div class="panel empty"><b>مفيش بيانات لسه</b>ارفع ملفات الكتابات والمبيعات من <a href="#upload" style="color:var(--rx)">رفع الملفات</a>.</div>';

function products(){
  const ix=S.ix;
  let h=head('products',ix.hasSales?'اللون = نسبة التحويل · أخضر ٨٠٪ وأكتر · أصفر ٤٠–٨٠٪ · أحمر أقل من ٤٠٪':'ارفع ملف المبيعات علشان تظهر نسبة التحويل');
  if(!hasData()) return h+needData();
  h+=strip()+'<div class="fstrip">'+[['all','الكل'],['n','NOSTRI'],['h','PureHerb']].map(([k,l])=>'<button class="chip'+(S.brand===k?' on':'')+'" data-brand="'+k+'">'+l+'</button>').join('')+'</div><div class="pgrid">';
  const to=ix.W.to==='9999-12-31'?ix.last:ix.W.to;
  PRODUCTS.filter(p=>S.brand==='all'||p.brand===S.brand).forEach(p=>{ const P=ix.prod[p.key], col=tone(P.conv);
    h+='<a class="pcard" href="#product-'+slug(p.key)+'"><div class="top"><div><div class="pn">'+esc(p.name)+'</div><div class="pf">'+esc(p.form)+'</div></div><span class="brand '+(p.brand==='n'?'b-n':'b-h')+'">'+(p.brand==='n'?'NOSTRI':'PUREHERB')+'</span></div>'
      +'<div class="pmid"><div class="gauge" style="color:'+col+'">'+ring(78,8,P.conv!=null?[{v:P.conv/100,c:col}]:[])+'<b class="num">'+(P.conv==null?'—':P.conv+'%')+'</b></div>'
      +'<div class="pnums"><span><i style="background:var(--rx)"></i>اتكتب <b>'+fmt(P.w)+'</b></span><span><i style="background:var(--sale)"></i>اتباع <b>'+(ix.hasSales?fmt(P.s):'—')+'</b></span></div></div>'
      +'<div class="pfoot">'+(ix.W.prev?trendTag(P.trend):'<span></span>')+spark(series(ix.hasSales?P.dailyS:P.dailyW,to,30),ix.hasSales?'var(--sale)':'var(--rx)')+'</div></a>';
  });
  return h+'</div>';
}
function productPage(key){
  const ix=S.ix, p=PROD[key]; if(!p) return products();
  const P=ix.prod[key], col=tone(P.conv);
  let h='<div class="bar"><a class="back" href="#products" aria-label="رجوع">'+svg('back')+'</a><span class="ic k-sale">'+svg('pill',1.8)+'</span><div><h2>'+esc(p.name)+'</h2><p>'+esc(p.form)+' · '+(p.brand==='n'?'NOSTRI':'PureHerb')+'</p></div></div>'+strip();
  h+='<div class="stack"><div class="panel dgrid"><div class="gauge" style="width:150px;height:150px;color:'+col+'">'+ring(150,14,P.conv!=null?[{v:P.conv/100,c:col}]:[])+'<b class="num" style="font-size:34px">'+(P.conv==null?'—':P.conv+'%')+'</b></div>'
    +'<div class="bars"><div class="pnums" style="flex-direction:row;flex-wrap:wrap;gap:8px 22px;font-size:14px"><span><i style="background:var(--rx)"></i>اتكتب <b>'+fmt(P.w)+'</b></span><span><i style="background:var(--sale)"></i>اتباع <b>'+(ix.hasSales?fmt(P.s):'—')+'</b></span><span><i style="background:var(--leak)"></i>ما اتباعش <b>'+(ix.hasSales?fmt(P.lost):'—')+'</b></span>'+(P.canceled?'<span>ملغي في التقرير <b>'+fmt(P.canceled)+'</b></span>':'')+'</div>'
    +'<div class="small muted">حسب الصيدلية — الشريط الأزرق كتابات والأخضر مبيعات</div>';
  const mx=Math.max(1,...Object.keys(BRANCHES).map(b=>Math.max(P.wB[b],P.sB[b])));
  Object.entries(BRANCHES).forEach(([b,l])=>{ if(S.f.branch!=='ALL'&&S.f.branch!==b) return;
    const st=P.stock[b];
    h+='<div class="brow"><span>'+l+(st?'<br><span class="small muted">مخزون '+fmt(st.qty)+' ('+fmtDay(st.at)+')</span>':'')+'</span><span style="display:grid;gap:3px"><span class="t"><i style="width:'+(P.wB[b]/mx*100)+'%;background:var(--rx)"></i></span><span class="t"><i style="width:'+(P.sB[b]/mx*100)+'%;background:var(--sale)"></i></span></span><b class="num">'+P.wB[b]+' / '+(P.covered.includes(b)?P.sB[b]:'—')+'</b></div>'; });
  h+='</div></div>';
  const docs=[...P.docs.entries()].map(([dk,x])=>({dk,...x})).sort((a,b)=>b.w-a.w);
  h+='<div class="panel"><h3>مين بيكتبه؟ <span class="small muted">'+fmt(docs.length)+' طبيب</span></h3>';
  if(!docs.length) h+='<div class="empty">ما اتكتبش في الفترة دي.</div>';
  else { const m=docs[0].w; h+='<div class="bars">'+docs.slice(0,25).map(x=>{ const lost=ix.hasSales?(x.lost||0):0, ok=x.w-lost;
    return '<a class="brow" href="#doctor-'+idOf(x.dk)+'"><span>'+esc(x.name)+'</span><span class="t"><i style="width:'+(ok/m*100)+'%;background:'+(ix.hasSales?'var(--sale)':'var(--rx)')+'"></i><i style="width:'+(lost/m*100)+'%;background:var(--leak);opacity:.75"></i></span><b class="num">'+x.w+'</b></a>'; }).join('')+'</div>'
    +(ix.hasSales?'<div class="legend"><span><i style="background:var(--sale)"></i>اتباع (تقديري)</span><span><i style="background:var(--leak)"></i>ما اتباعش (تقديري)</span><span>الرقم = عدد الكتابات</span></div>':''); }
  h+='</div>';
  const to=ix.W.to==='9999-12-31'?ix.last:ix.W.to; const days=[]; for(let i=29;i>=0;i--) days.push(addDays(to,-i));
  h+='<div class="panel"><h3>آخر 30 يوم لحد '+fmtDay(to)+'</h3>'+dayChart(days,P.dailyW,P.dailyS,ix.hasSales)+'</div></div>';
  return h;
}
function dayChart(days,wMap,sMap,withSales){
  const Wv=days.map(d=>wMap.get(d)||0), Sv=days.map(d=>sMap.get(d)||0);
  const mx=niceMax(Math.max(4,...Wv,...Sv)); const w=760,hgt=172,x0=36,bw=(w-x0)/days.length;
  let g='';[0,.5,1].forEach(f=>{ const y=150-f*130; g+='<line x1="'+x0+'" x2="'+w+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)"/><text x="'+(x0-6)+'" y="'+(y+4)+'" font-size="11" fill="var(--faint)" text-anchor="end">'+Math.round(mx*f)+'</text>'; });
  days.forEach((d,i)=>{ const x=x0+i*bw, hw=Wv[i]/mx*130, hs=Sv[i]/mx*130;
    if(hw) g+='<rect x="'+(x+bw*.12).toFixed(1)+'" y="'+(150-hw).toFixed(1)+'" width="'+(bw*(withSales?.36:.76)).toFixed(1)+'" height="'+hw.toFixed(1)+'" rx="2" fill="var(--rx)"/>';
    if(withSales&&hs) g+='<rect x="'+(x+bw*.52).toFixed(1)+'" y="'+(150-hs).toFixed(1)+'" width="'+(bw*.36).toFixed(1)+'" height="'+hs.toFixed(1)+'" rx="2" fill="var(--sale)"/>';
    const lastI=i===days.length-1; if(i%5===4&&i<days.length-3||lastI) g+='<text x="'+(lastI?w:x+bw/2).toFixed(1)+'" y="168" font-size="10.5" fill="var(--muted)" text-anchor="'+(lastI?'end':'middle')+'">'+fmtDay(d)+'</text>'; });
  return '<div class="tl"><svg viewBox="0 0 '+w+' '+hgt+'" role="img" aria-label="الكتابات والمبيعات يوميًا">'+g+'</svg></div><div class="legend"><span><i style="background:var(--rx)"></i>كتابات</span>'+(withSales?'<span><i style="background:var(--sale)"></i>مبيعات</span>':'')+'</div>';
}
function matrix(){
  const ix=S.ix;
  let h=head('matrix','كل خانة = كام مرة الدكتور كتب الصنف في '+esc(ix.W.label));
  if(!hasData()) return h+needData();
  h+=strip();
  const docs=[...ix.doctors.values()].filter(d=>d.mine>0).sort((a,b)=>b.mine-a.mine);
  if(!docs.length) return h+'<div class="panel empty"><b>مفيش كتابات Private Label في الفترة دي</b>جرّب فترة أطول.</div>';
  h+='<div class="panel"><div class="heat"><table><tr><th class="dn"></th>'+PRODUCTS.map(p=>'<th><a href="#product-'+slug(p.key)+'">'+esc(p.name)+'</a></th>').join('')+'</tr>';
  docs.slice(0,60).forEach(d=>{ h+='<tr><td class="dn"><a href="#doctor-'+d.id+'">'+esc(d.name)+'</a></td>'+PRODUCTS.map(p=>{ const v=(d.prods.get(p.key)||{w:0}).w, lv=heatLv(v);
    return '<td><div class="c" style="background:var(--h'+lv+');color:'+(lv>=3?'var(--surface)':'var(--muted)')+'">'+(v||'')+'</div></td>'; }).join('')+'</tr>'; });
  h+='</table></div><div class="legend">أقل <i style="background:var(--h0)"></i><i style="background:var(--h1)"></i><i style="background:var(--h2)"></i><i style="background:var(--h3)"></i><i style="background:var(--h4)"></i> أكتر · الخانة الفاضية = ما كتبش الصنف · اضغط على اسم الدكتور لكل أدويته'+(docs.length>60?' · معروض أول 60 طبيب':'')+'</div></div>';
  return h;
}
function doctorPage(id){
  const ix=S.ix; const d=[...ix.doctors.values()].find(x=>x.id===id);
  let h='<div class="bar"><a class="back" href="#matrix" aria-label="رجوع">'+svg('back')+'</a><span class="ic k-rx">'+svg('user',1.8)+'</span><div><h2>'+(d?esc(d.name):'الطبيب')+'</h2><p>'+(d?esc(d.section||'—')+' · '+[...d.branches].map(b=>BRANCHES[b]).join('، '):'')+'</p></div></div>'+strip();
  if(!d) return h+'<div class="panel empty"><b>الطبيب ما كتبش في الفترة دي</b>جرّب «الكل».</div>';
  h+='<div class="stack"><div class="panel"><h3>Private Label اللي بيكتبه <span class="small muted">'+fmt(d.mine)+' من '+fmt(d.total)+' كتابة ('+(d.total?Math.round(d.mine/d.total*100):0)+'%)</span></h3>';
  const mine=[...d.prods.entries()].sort((a,b)=>b[1].w-a[1].w);
  if(mine.length){ const m=mine[0][1].w; h+='<div class="bars">'+mine.map(([pk,x])=>'<a class="brow" href="#product-'+slug(pk)+'"><span>'+esc(PROD[pk].name)+'</span><span class="t"><i style="width:'+(x.w/m*100)+'%;background:var(--sale)"></i></span><b class="num">'+x.w+'</b></a>').join('')+'</div>'; }
  else h+='<div class="empty">ما كتبش أي صنف Private Label في الفترة دي.</div>';
  const missing=PRODUCTS.filter(p=>!d.prods.has(p.key));
  if(missing.length) h+='<div class="small muted" style="margin:14px 0 8px">ما كتبهاش:</div><div class="dchips">'+missing.map(p=>'<a class="dchip '+(p.brand==='n'?'b-n':'b-h')+'" href="#product-'+slug(p.key)+'">'+esc(p.name)+'</a>').join('')+'</div>';
  h+='</div>';
  const drugs=[...d.drugs.values()].sort((a,b)=>b.count-a.count).slice(0,20);
  if(drugs.length) h+='<div class="panel"><h3>كل الأدوية اللي بيكتبها <span class="small muted">'+fmt(d.drugs.size)+' دواء</span></h3><div class="bars">'
    +drugs.map(g=>'<div class="brow"><span>'+esc(g.name)+'</span><span class="t"><i style="width:'+(g.count/drugs[0].count*100)+'%;background:'+(g.pk?'var(--sale)':'var(--rx)')+'"></i></span><b class="num">'+g.count+'</b></div>').join('')
    +'</div><div class="legend"><span><i style="background:var(--sale)"></i>Private Label</span><span><i style="background:var(--rx)"></i>أدوية تانية</span></div></div>';
  return h+'</div>';
}
function leakage(){
  const ix=S.ix;
  let h=head('leakage','الكتابات اللي ما قابلهاش بيع في نفس الصيدلية — مرتبة من الأكبر');
  if(!hasData()) return h+needData();
  h+=strip();
  if(!ix.hasSales) return h+'<div class="panel empty"><b>محتاج ملف مبيعات للفترة دي</b>القسم ده بيقارن الكتابات بالمبيعات. ارفع تقرير المبيعات من <a href="#upload" style="color:var(--rx)">رفع الملفات</a>.</div>';
  const byP=PRODUCTS.map(p=>({p,P:ix.prod[p.key]})).filter(x=>x.P.lost>0).sort((a,b)=>b.P.lost-a.P.lost);
  h+='<div class="two"><div class="panel"><h3>حسب الصنف</h3>'+(byP.length?byP.map(({p,P})=>'<a class="lrow" href="#product-'+slug(p.key)+'"><span class="av k-leak"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON.pill+'</svg></span><div><div class="n">'+esc(p.name)+'</div><div class="s">'+P.covered.filter(b=>P.lostB[b]>0).map(b=>BRANCHES[b]+': اتكتب '+P.wB[b]+' واتباع '+P.sB[b]).join(' · ')+'</div><div class="lbar"><i style="width:'+(P.lost/Math.max(1,P.wCov)*100)+'%;background:var(--leak)"></i></div></div><div class="big num" style="color:var(--leak)">'+P.lost+'<small>ما اتباعش</small></div></a>').join(''):'<div class="empty">كل الكتابات اتباعت.</div>')+'</div>';
  h+='<div class="panel"><h3>حسب الطبيب <span class="small muted">تقديري</span></h3>'+(ix.leak.length?ix.leak.slice(0,15).map(l=>'<a class="lrow" href="#doctor-'+l.id+'"><span class="av k-leak">'+esc(initials(l.name))+'</span><div><div class="n">'+esc(l.name)+'</div><div class="s">'+esc(PROD[l.pk].name)+' · '+l.branches.map(b=>BRANCHES[b]).join('، ')+' · كتب '+l.w+'</div><div class="lbar"><i style="width:'+(l.lost/l.w*100)+'%;background:var(--leak)"></i></div></div><div class="big num" style="color:var(--leak)">'+l.lost+'<small>ما اتباعش</small></div></a>').join(''):'<div class="empty">مفيش فاقد.</div>')+'</div></div>';
  h+='<p class="small muted" style="margin-top:12px">تقرير المبيعات ما بيقولش البيعة جاية من أنهي روشتة، فنصيب كل طبيب من الفاقد محسوب بنسبة كتاباته من الصنف في نفس الصيدلية.</p>';
  return h;
}
function alertsPage(){
  const ix=S.ix;
  let h=head('alerts','محسوبة على آخر 7 و14 يوم لحد '+fmtDay(ix.last));
  if(!hasData()) return h+needData();
  h+='<div class="fstrip">'+branchSelect('chip')+'</div>';
  if(!ix.alerts.length) return h+'<div class="panel empty"><b>مفيش تنبيهات دلوقتي</b>مفيش صنف نزل بشكل واضح ولا دكتور بطّل يكتب.</div>';
  return h+'<div class="alerts">'+ix.alerts.map(a=>'<a class="alert" href="'+(a.pk?'#product-'+slug(a.pk):'#doctor-'+a.id)+'"><span class="ic k-'+a.c+'">'+svg(a.i,1.9)+'</span><div><b>'+esc(a.t)+'</b><p>'+esc(a.p)+'</p></div></a>').join('')+'</div>';
}
function timeline(){
  const ix=S.ix;
  let h=head('timeline','الكتابات والمبيعات شهر بشهر');
  const mths=[...ix.months.keys()].sort();
  if(!mths.length) return h+needData();
  h+='<div class="fstrip">'+branchSelect('chip')+'</div>';
  h+='<div class="fstrip"><button class="chip'+(S.tlProduct==='ALL'?' on':'')+'" data-tlp="ALL">كل الأصناف</button>'+PRODUCTS.map(p=>'<button class="chip'+(S.tlProduct===p.key?' on':'')+'" data-tlp="'+p.key+'">'+esc(p.name)+'</button>').join('')+'</div>';
  const pk=S.tlProduct, ms=mths.slice(-12);
  const Wv=ms.map(m=>pk==='ALL'?ix.months.get(m).w:(ix.months.get(m).pw[pk]||0)), Sv=ms.map(m=>pk==='ALL'?ix.months.get(m).s:(ix.months.get(m).ps[pk]||0));
  const hasS=Sv.some(v=>v>0); const Cv=ms.map((m,i)=>hasS&&Wv[i]?Math.round(Sv[i]/Wv[i]*100):null);
  const nice=niceMax(Math.max(4,...Wv,...Sv));
  const n=ms.length, x=i=>n===1?413:70+i*(690/(n-1)), y=v=>200-v/nice*175, yc=v=>200-Math.min(v,150)/150*175;
  let g='';[0,.25,.5,.75,1].forEach(f=>g+='<line x1="56" x2="770" y1="'+y(nice*f)+'" y2="'+y(nice*f)+'" stroke="var(--line)"/><text x="46" y="'+(y(nice*f)+4)+'" font-size="11" fill="var(--faint)" text-anchor="end">'+Math.round(nice*f)+'</text>');
  if(hasS&&n>1) g+='<path d="M'+x(0).toFixed(1)+' 200 '+Sv.map((v,i)=>'L'+x(i).toFixed(1)+' '+y(v).toFixed(1)).join(' ')+' L'+x(n-1).toFixed(1)+' 200Z" fill="var(--sale)" fill-opacity=".12"/>';
  const pl=(a,f,c,dash)=>{ const pts=a.map((v,i)=>v==null?null:[x(i),f(v)]).filter(Boolean); return (pts.length>1?'<polyline fill="none" stroke="'+c+'" stroke-width="3" stroke-linejoin="round" '+(dash?'stroke-dasharray="6 5"':'')+' points="'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+'"/>':'')+pts.map((p,i)=>'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(i===pts.length-1?5.5:3.5)+'" fill="'+c+'"/>').join(''); };
  g+=pl(Wv,y,'var(--rx)')+(hasS?pl(Sv,y,'var(--sale)')+pl(Cv,yc,'var(--warn)',1):'');
  g+=ms.map((m,i)=>'<text x="'+x(i).toFixed(1)+'" y="222" font-size="12" fill="var(--muted)" text-anchor="middle">'+MONTHS[+m.slice(5,7)-1]+'</text>').join('');
  h+='<div class="panel tl"><svg viewBox="0 0 790 232" role="img" aria-label="الخط الزمني">'+g+'</svg><div class="legend"><span><i style="background:var(--rx)"></i>كتابات</span>'+(hasS?'<span><i style="background:var(--sale)"></i>مبيعات</span><span><i style="background:var(--warn)"></i>نسبة التحويل (مقياس منفصل، الخط المتقطع)</span>':'')+'</div>'
    +'<div class="scroll-x"><table class="tbl" style="margin-top:14px"><tr><th>الشهر</th><th>كتابات</th><th>مبيعات</th><th>التحويل</th><th>التغيير</th></tr>'
    +ms.map((m,i)=>{ const partial=m===ix.last.slice(0,7)&&ix.last<monthEnd(m); const t=i&&!partial?pctChange(hasS?Sv[i]:Wv[i],hasS?Sv[i-1]:Wv[i-1]):null; return '<tr><td>'+fmtMonth(m)+(partial?' <span class="small muted">(لحد '+(+ix.last.slice(8,10))+')</span>':'')+'</td><td class="num">'+fmt(Wv[i])+'</td><td class="num">'+(hasS?fmt(Sv[i]):'—')+'</td><td class="num">'+(Cv[i]==null?'—':Cv[i]+'%')+'</td><td>'+(t!=null?trendTag(t):'')+'</td></tr>'; }).reverse().join('')
    +'</table></div></div>';
  return h;
}
function upload(){
  let h=head('upload','حط الملفات وخلاص — البرنامج بيعرف نوعها والصيدلية والفترة');
  h+='<button class="drop" id="dropZone" data-act="pick"><span class="ic k-rx">'+svg('upload',1.8)+'</span><b>اسحب الملفات هنا أو اضغط للاختيار</b><p>تقارير الكتابات أو المبيعات (NOSTRI أو PureHerb)، PDF أو Excel، أكتر من ملف مرة واحدة. قبل الحفظ هتشوف البرنامج فهم إيه، وتقدر تعدّل.</p></button>';
  const rx=[...S.uploads].sort((a,b)=>b.to<a.to?-1:1);
  const sg=new Map(); S.sales.forEach(e=>{ const k=e.branch+'|'+e.from+'|'+e.to+'|'+PROD[e.product].brand; const g=sg.get(k)||{branch:e.branch,from:e.from,to:e.to,brand:PROD[e.product].brand,units:0,n:0,key:k}; g.units+=e.units; g.n++; sg.set(k,g); });
  const sl=[...sg.values()].sort((a,b)=>a.to<b.to?1:-1);
  const lim=S.allFiles?9999:10;
  h+='<div class="two" style="margin-top:14px"><div class="panel"><h3>ملفات الكتابات <span class="small muted">'+rx.length+'</span></h3>'
    +(rx.length?'<div class="scroll-x"><table class="tbl"><tr><th>الفترة</th><th>الصيدلية</th><th>كتابات</th><th>Private Label</th><th></th></tr>'+rx.slice(0,lim).map(u=>'<tr><td>'+esc(rangeLabel(u.from,u.to))+'</td><td>'+esc(BRANCHES[u.branch]||'')+'</td><td class="num">'+fmt(u.rows.length)+'</td><td class="num">'+fmt(Object.values(aggOf(u).prod).reduce((a,b)=>a+b,0))+'</td><td><button class="btn sm danger" data-act="delRx" data-id="'+escapeAttr(u.id)+'">حذف</button></td></tr>').join('')+'</table></div>':'<div class="empty">لسه ما رفعتش كتابات.</div>')+'</div>'
    +'<div class="panel"><h3>ملفات المبيعات <span class="small muted">'+sl.length+'</span></h3>'
    +(sl.length?'<div class="scroll-x"><table class="tbl"><tr><th>الفترة</th><th>الصيدلية</th><th>الشركة</th><th>علب</th><th></th></tr>'+sl.slice(0,lim).map(g=>'<tr><td>'+esc(rangeLabel(g.from,g.to))+'</td><td>'+esc(BRANCHES[g.branch])+'</td><td><span class="brand '+(g.brand==='n'?'b-n':'b-h')+'">'+(g.brand==='n'?'NOSTRI':'PUREHERB')+'</span></td><td class="num">'+fmt(g.units)+'</td><td><button class="btn sm danger" data-act="delSales" data-k="'+escapeAttr(g.key)+'">حذف</button></td></tr>').join('')+'</table></div>':'<div class="empty">لسه ما رفعتش مبيعات.</div>')+'</div></div>';
  if(!S.allFiles&&(rx.length>10||sl.length>10)) h+='<div style="text-align:center;margin-top:10px"><button class="btn sm" data-act="allFiles">عرض كل الملفات</button></div>';
  h+='<div class="panel" style="margin-top:14px"><h3>نسخة احتياطية</h3><p class="small muted" style="margin-bottom:12px">البيانات محفوظة في المتصفح ده بس. نزّل نسخة علشان تنقلها لجهاز تاني أو تحتفظ بيها.</p><div class="row-actions"><button class="btn" data-act="backup">'+svg('save')+' تنزيل نسخة</button><button class="btn" data-act="restore">'+svg('upload')+' استرجاع نسخة</button><button class="btn danger" data-act="wipe">'+svg('trash')+' مسح الكل</button></div></div>';
  return h;
}

/* ───────── التوجيه ───────── */
function route(){
  if(!S.ready) return;
  const id=(location.hash||'#home').slice(1);
  let html;
  try{
    if(S.err) throw S.err;
    if(id.startsWith('product-')) html=productPage(id.slice(8).replace(/-/g,'_'));
    else if(id.startsWith('doctor-')) html=doctorPage(id.slice(7));
    else html=({products,matrix,leakage,alerts:alertsPage,timeline,upload}[id]||home)();
    if(!S.storageOk) html='<div class="panel" style="margin-bottom:14px;border-color:var(--warn)"><b>البيانات مش بتتحفظ على الجهاز ده</b><p class="small muted">'+esc(S.storageErr||'')+' — الملفات اللي ترفعها هتفضل لحد ما تقفل الصفحة بس. جرّب تفتح الملف من متصفح Chrome عادي (مش من داخل واتساب أو تطبيق تاني).</p></div>'+html;
  }catch(e){ html=errorPanel(e); }
  document.getElementById('app').innerHTML=html;
}
function errorPanel(e){
  return '<div class="panel empty" style="text-align:start"><b>حصلت مشكلة في عرض الصفحة</b><p class="small muted" style="margin:6px 0 12px">صوّر الرسالة دي وابعتها: <code dir="ltr">'+esc(String(e&&e.stack||e).split('\n').slice(0,3).join(' | '))+'</code></p>'
    +'<div class="row-actions"><a class="btn" href="#upload">رفع الملفات</a><button class="btn danger" data-act="wipe">مسح البيانات والبدء من جديد</button></div></div>';
}
function setF(k,v){ S.f[k]=v; saveFilter(); safeRebuild(); route(); }

/* ───────── قراءة الملفات: تحديد النوع والصيدلية والفترة ───────── */
/* أكواد الأصناف كما في تقارير "مبيعات أصناف مورد" — الأدق في المطابقة */
const PRODUCT_CODES={ '1-02-066-034':'reflex','2-09-031-483':'rizer','1-12-109-038':'oracure','1-14-166-032':'intimo','1-09-118-050':'nostriderm','1-09-066-046':'nostricure' };
PUREHERB_PRODUCTS.forEach(p=>{ if(p.code) PRODUCT_CODES[p.code]=PUREHERB_KEYMAP[p.key]; });
const SALES_KW=[
  {key:'reflex',kw:'REFLEX'},{key:'rizer',kw:'RIZER'},{key:'oracure',kw:'ORACURE'},
  {key:'intimo',kw:'INTIMO'},{key:'nostriderm',kw:'NOSTRIDERM'},{key:'nostricure',kw:'NOSTRICURE'},
  {key:'pure_omega',kw:'PURE OMEGA'},{key:'pure_omega',kw:'PUREOMEGA'},{key:'purefeel',kw:'PUREFEEL'},{key:'purefeel',kw:'PURE FEEL'},
  {key:'centrozon_w',kw:'CENTROZON WOMEN'},{key:'centrozon_w',kw:'CENTROZON W'},{key:'centrozon',kw:'CENTROZON'},
  {key:'zincolive',kw:'ZINCOLIVE'},{key:'zincolive',kw:'ZINC OLIVE'},{key:'bonefriend',kw:'BONEFRIEND'},{key:'bonefriend',kw:'BONE FRIEND'},
  {key:'argigrow',kw:'ARGIGROW'},{key:'argigrow',kw:'ARGI GROW'}
];
function salesKw(text){
  const up=String(text||'').normalize('NFKC').toUpperCase();
  const k=SALES_KW.find(p=>up.includes(p.kw)); if(!k) return null;
  const at=up.indexOf(k.kw);
  const code=Object.keys(PRODUCT_CODES).find(c=>up.includes(c));
  if(code) return {key:PRODUCT_CODES[code],at};
  if(k.key==='argigrow'&&/TABL/.test(up)) return null;   // ArgiGrow أقراص مش من أصناف Private Label
  return {key:k.key,at};
}
const toNum=v=>{ if(typeof v==='number') return v; const n=Number(String(v==null?'':v).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,٬\s]/g,'')); return Number.isFinite(n)?n:NaN; };
const SALES_HEAD={
  units:/^(الكمي[ةه]|كمي[ةه]|الكمي[ةه] المباع[ةه]|الكمي[ةه]المباع[ةه]|المباع|عدد|العدد|qty|quantity|units?|sold qty|sales qty)$/i,
  amount:/^(القيم[ةه]|قيم[ةه]|المبيعات|قيم[ةه] المبيعات|القيم[ةه] بسعر البيع|اجمالي|الاجمالي|إجمالي|الإجمالي|الصافي|صافي المبيعات|net|net sales|amount|total|value|sales|sales value)$/i,
  stock:/^(الكمي[ةه] الحالي[ةه]|الرصيد|المخزون|stock|on hand|balance)$/i,
  cost:/^(التكلف[ةه]|تكلف[ةه]|القيم[ةه] بالتكلف[ةه]|cost|total cost)$/i
};
function toISO(d,m,y){ d=+d; m=+m; if(m>12&&d<=12){ const t=d; d=m; m=t; } if(m<1||m>12||d<1||d>31) return ''; return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'); }
function datesIn(s){
  const out=[];
  for(const m of String(s).matchAll(/(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})/g)){ const iso=toISO(m[1],m[2],m[3]); if(iso) out.push(iso); }
  for(const m of String(s).matchAll(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/g)){ const iso=toISO(m[3],m[2],m[1]); if(iso) out.push(iso); }
  return out;
}
function guessMeta(text,fileName){
  let branch=null;
  const pm=text.match(/(?:صيدلي[ةه]|pharmacy)\s*(?:رقم|no\.?|#)?\s*(\d+)/i)||String(fileName||'').match(/(?:صيدلي[ةه]|ph|pharmacy)\s*[-_ ]?(\d+)/i);
  if(pm&&PHARMACY_TO_BRANCH[pm[1]]) branch=PHARMACY_TO_BRANCH[pm[1]];
  // تقارير الكتابات بتكتب رقم التعاون في آخر الصفحة: "-Co.3"
  if(!branch){ const cm=text.match(/\bCo\.?\s*([123])\b/)||text.match(/التعاون\s*(الأول|الثاني|الثالث)/); if(cm) branch={'1':'T1','2':'T2','3':'T3','الأول':'T1','الثاني':'T2','الثالث':'T3'}[cm[1]]; }
  // الفترة: "من تاريخ … الى تاريخ …" في الملف، من غير تاريخ الطباعة
  const body=text.split('\n').filter(l=>!/Printing Date|Print Date|تاريخ الطباع[ةه]/i.test(l)).join('\n');
  let ds=[...new Set(datesIn(body))].sort(), sure=ds.length>0, from='', to='';
  if(ds.length){ from=ds[0]; to=ds[ds.length-1]; }
  else {
    const nm=String(fileName||'').replace(/_/g,' '); const fd=[...new Set(datesIn(nm))].sort();
    if(fd.length>=2){ from=fd[0]; to=fd[fd.length-1]; }
    else if(fd.length===1){ to=fd[0]; from=/till|until|حتى|لحد|الى|إلى/i.test(nm)?to.slice(0,8)+'01':to; }
    else { from=to=todayISO(); }
  }
  return { branch:branch||(S.f.branch!=='ALL'?S.f.branch:'T1'), branchSure:!!branch, from, to, dateSure:sure };
}
async function pdfLines(file){
  if(!window.pdfjsLib) window.pdfjsLib=window['pdfjs-dist/build/pdf'];
  if(!window.pdfjsLib) throw new Error('تعذّر تحميل قارئ PDF — تأكد من الاتصال بالإنترنت وجرّب تاني');
  try{ if(!pdfjsLib.GlobalWorkerOptions.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }catch(e){}
  const doc=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise; const lines=[];
  try{
    for(let i=1;i<=doc.numPages;i++){
      const content=await (await doc.getPage(i)).getTextContent(); const byY={};
      content.items.forEach(it=>{ if(!it.str) return; const y=Math.round(it.transform[5]); (byY[y]=byY[y]||[]).push({s:it.str,x:it.transform[4]}); });
      Object.keys(byY).map(Number).sort((a,b)=>b-a).forEach(y=>{ const l=byY[y].sort((a,b)=>a.x-b.x).map(t=>t.s).join(' ').replace(/\s+/g,' ').trim(); if(l) lines.push(l.normalize('NFKC')); });
    }
  } finally { try{ await doc.destroy(); }catch(e){} }
  return lines;
}
const CODE_RE=/\b(\d-\d{2}-\d{3}-\d{3})\b/;
function addSale(map,key,v){ const r=map.get(key)||{product:key,units:0,amount:0,cost:0,stock:null}; r.units+=v.units||0; r.amount+=v.amount||0; r.cost+=v.cost||0; if(v.stock!=null) r.stock=(r.stock||0)+v.stock; map.set(key,r); }
/* PDF "مبيعات أصناف مورد": الأرقام قبل اسم الصنف بالترتيب: القيمة بسعر البيع · بالتكلفة · الكمية الحالية · الكمية المباعة */
function salesFromLines(lines){
  const rows=new Map();
  lines.forEach(line=>{
    let key=null, at=-1; const cm=line.match(CODE_RE);
    if(cm){ const pre=line.slice(0,cm.index); at=(pre.match(/^[\s\d.,]*/)||[''])[0].length;
      key=PRODUCT_CODES[cm[1]]||null; if(!key) return; }   // كود مش من أصناف Private Label
    if(!key){ const k=salesKw(line); if(!k) return; key=k.key; at=k.at; }
    const nums=(line.slice(0,at).match(/\d[\d,]*(?:\.\d+)?/g)||[]).map(toNum).filter(n=>!isNaN(n));
    if(nums.length<2) return;
    addSale(rows,key,{units:Math.round(nums[nums.length-1]),amount:Math.round(nums[0]),cost:nums.length>=3?Math.round(nums[1]):0,stock:nums.length>=4?Math.round(nums[nums.length-2]):null}); });
  return [...rows.values()];
}
function salesFromGrid(grids){
  const rows=new Map();
  grids.forEach(grid=>{ let cols=null;
    grid.forEach((row,ri)=>{ const cells=row.map(c=>String(c==null?'':c).trim());
      if(!cols){ const c={}; cells.forEach((v,i)=>{ const h=(v+' '+String((grid[ri+1]||[])[i]||'')).replace(/\s+/g,' ').trim(); for(const k in SALES_HEAD) if(c[k]==null&&(SALES_HEAD[k].test(v.replace(/\s+/g,' '))||SALES_HEAD[k].test(h))) c[k]=i; }); if(c.units!=null){ cols=c; return; } }
      let k=null; const ci=cells.findIndex(c=>CODE_RE.test(c));
      if(ci>=0){ const key=PRODUCT_CODES[cells[ci].match(CODE_RE)[1]]; if(!key) return; k={key}; }   // كود مش من أصناف Private Label
      if(!k) k=salesKw(cells.join(' ')); if(!k) return;
      if(cols){ const u=toNum(row[cols.units]); if(isNaN(u)) return;
        addSale(rows,k.key,{units:Math.round(u),amount:cols.amount!=null?Math.round(toNum(row[cols.amount])||0):0,cost:cols.cost!=null?Math.round(toNum(row[cols.cost])||0):0,stock:cols.stock!=null&&!isNaN(toNum(row[cols.stock]))?Math.round(toNum(row[cols.stock])):null}); }
      else { const nums=row.filter(c=>c!==''&&!salesKw(c)&&!CODE_RE.test(String(c))&&!/[A-Za-z]/.test(String(c))).map(toNum).filter(n=>!isNaN(n)&&n<1e7); if(!nums.length) return;
        addSale(rows,k.key,{units:Math.round(nums.length===1?nums[0]:nums[nums.length-1]),amount:nums.length>1?Math.round(nums[0]):0}); }
    }); });
  return [...rows.values()];
}
async function analyzeFile(f){
  const name=f.name||'ملف'; const ext=(name.toLowerCase().match(/\.[^.]+$/)||[''])[0];
  if(!['.pdf','.xlsx','.xls','.csv'].includes(ext)) throw new Error('صيغة غير مدعومة — استخدم PDF أو Excel');
  if(f.size>PharmaCore.MAX_UPLOAD_BYTES) throw new Error('الملف أكبر من 50MB');
  if(ext==='.pdf'){
    const lines=await pdfLines(f); const text=lines.join('\n');
    const looksSales=/مبيعات|الكمي[ةه] المباع[ةه]|بسعر البيع/.test(text)&&salesFromLines(lines).length>0;
    if(!looksSales&&/Service Name|Medication Orders|Doctor Name|اسم الطبيب|اسم الخدم[ةه]/i.test(text)){
      const rows=await parsePDF(f,{}); validateParsedRows(rows);
      return { name, kind:'rx', rows:rows.map(r=>[r.doctor,r.service,r.section,r.patient,r.status]), ...guessMeta(text,name) };
    }
    const sales=salesFromLines(lines);
    if(!sales.length) throw new Error('ما لقيتش أعمدة كتابات ولا أي صنف Private Label في الملف');
    return { name, kind:'sales', sales, ...guessMeta(text,name) };
  }
  const buf=await f.arrayBuffer();
  const wb= ext==='.csv' ? XLSX.read(decodeDelimitedText(buf),{type:'string'}) : XLSX.read(buf,{type:'array'});
  const grids=wb.SheetNames.map(n=>XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:'',raw:true}));
  const text=grids.map(g=>g.slice(0,40).map(r=>r.join(' ')).join('\n')).join('\n');
  let selected=null; try{ selected=selectWorkbookData(wb,{}); }catch(e){}
  if(selected){
    const rows=await normalizeParsedRows(selected.rows,ext==='.csv'?'csv':'excel',{}); validateParsedRows(rows);
    return { name, kind:'rx', rows:rows.map(r=>[r.doctor,r.service,r.section,r.patient,r.status]), ...guessMeta(text,name) };
  }
  const sales=salesFromGrid(grids);
  if(!sales.length) throw new Error('ما لقيتش أعمدة كتابات (الطبيب والدواء) ولا أي صنف Private Label في الملف');
  return { name, kind:'sales', sales, ...guessMeta(text,name) };
}
async function onFiles(list){
  const files=[...list]; if(!files.length) return;
  const json=files.find(f=>/\.json$/i.test(f.name)); if(json){ restoreFrom(json); return; }
  const out=[];
  for(let i=0;i<files.length;i++){
    loading('جارٍ قراءة '+(files.length>1?'('+(i+1)+'/'+files.length+') ':'')+files[i].name+'…');
    try{ out.push(await analyzeFile(files[i])); }catch(err){ out.push({name:files[i].name,kind:'error',error:String(err&&err.message||err)}); }
  }
  loading(); review(out);
}
const rangeLabel=(a,b)=>a===b?fmtDay(a)+' '+a.slice(0,4):'من '+fmtDay(a)+' لـ '+fmtDay(b)+' '+b.slice(0,4);
function review(items){
  const m=document.createElement('div'); m.className='modal';
  const ok=items.some(x=>x.kind==='rx'||x.kind==='sales');
  items.forEach(x=>x.include=x.kind==='rx'||x.kind==='sales');
  const sel=(i,b)=>'<select id="rv-b'+i+'" data-i="'+i+'" data-f="branch">'+Object.entries(BRANCHES).map(([k,l])=>'<option value="'+k+'"'+(b===k?' selected':'')+'>'+l+'</option>').join('')+'</select>';
  m.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-label="مراجعة الملفات"><h3>راجع الملفات قبل الحفظ</h3><p class="small muted">البرنامج حدّد نوع كل ملف والصيدلية والفترة اللي بيغطيها. لو حاجة مش مظبوطة عدّلها. أي ملف قديم لنفس الصيدلية بيغطي نفس الأيام هيتشال ويحل محله الجديد.</p>'
    +items.map((x,i)=>{
      const badge=x.kind==='rx'?'<span class="ftype k-rx">كتابات</span>':x.kind==='sales'?'<span class="ftype k-sale">مبيعات</span>':'<span class="ftype k-leak">مش مفهوم</span>';
      let body='';
      if(x.kind==='error') body='<p class="small" style="color:var(--leak)">'+esc(x.error)+'</p>';
      else {
        const warn=t=>'<span style="color:var(--warn)"> — '+t+'</span>';
        body='<div class="fields three"><div class="field"><label for="rv-b'+i+'">الصيدلية'+(x.branchSure?'':warn('اتأكد'))+'</label>'+sel(i,x.branch)+'</div>'
          +'<div class="field"><label for="rv-f'+i+'">من'+(x.dateSure?'':warn('اتأكد'))+'</label><input type="date" id="rv-f'+i+'" data-i="'+i+'" data-f="from" value="'+escapeAttr(x.from)+'"></div>'
          +'<div class="field"><label for="rv-t'+i+'">إلى</label><input type="date" id="rv-t'+i+'" data-i="'+i+'" data-f="to" value="'+escapeAttr(x.to)+'"></div></div>';
        if(x.kind==='rx'){ const mine=x.rows.filter(r=>productKeyOf(r[1])).length; body+='<p class="small muted" style="margin-top:10px">'+fmt(x.rows.length)+' كتابة، منها <b style="color:var(--ink)">'+fmt(mine)+'</b> Private Label</p>'; }
        else body+='<div class="dchips" style="margin-top:10px">'+x.sales.map(s=>'<span class="dchip '+(PROD[s.product].brand==='n'?'b-n':'b-h')+'">'+esc(PROD[s.product].name)+' · '+fmt(s.units)+' علبة</span>').join('')+'</div>';
      }
      return '<div class="fcard"><div class="fhead">'+badge+'<b>'+esc(x.name)+'</b>'+(x.kind!=='error'?'<label class="small muted" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="rv-c'+i+'" checked data-i="'+i+'" data-f="include"> حفظ</label>':'')+'</div>'+body+'</div>';
    }).join('')
    +'<div class="sheet-actions"><button class="btn" data-x>إلغاء</button>'+(ok?'<button class="btn pri" data-ok>حفظ</button>':'')+'</div></div>';
  document.body.appendChild(m);
  m.addEventListener('change',e=>{ const t=e.target, x=items[+t.dataset.i]; if(!x) return; if(t.dataset.f==='include') x.include=t.checked; else x[t.dataset.f]=t.value; });
  m.addEventListener('click',async e=>{
    if(e.target===m||e.target.closest('[data-x]')){ m.remove(); return; }
    if(!e.target.closest('[data-ok]')) return;
    const bad=items.find(x=>x.include&&(!/^\d{4}-\d{2}-\d{2}$/.test(x.from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(x.to||'')||x.from>x.to));
    if(bad){ toast('راجع الفترة في '+bad.name+': «من» لازم تكون قبل «إلى»'); return; }
    const ovl=(a,b)=>a.from<=b.to&&b.from<=a.to;
    const rxGroups=new Map(); let nRx=0,nS=0; let sales=S.sales.slice();
    items.forEach(x=>{ if(!x.include) return;
      if(x.kind==='rx'){ const k=x.branch+'|'+x.from+'|'+x.to; const g=rxGroups.get(k)||{branch:x.branch,from:x.from,to:x.to,rows:[],names:[]}; g.rows.push(...x.rows); g.names.push(x.name); rxGroups.set(k,g); }
      if(x.kind==='sales'){
        sales=sales.filter(o=>!(o.branch===x.branch&&x.sales.some(s=>s.product===o.product)&&ovl(o,x)));
        x.sales.forEach(s=>sales.push({branch:x.branch,product:s.product,from:x.from,to:x.to,units:s.units,amount:s.amount,cost:s.cost,stock:s.stock,file:x.name}));
        nS++; } });
    try{
      for(const g of rxGroups.values()){
        const old=S.uploads.filter(u=>u.branch===g.branch&&ovl(u,g));
        for(const o of old) await Store.del('uploads',o.id);
        S.uploads=S.uploads.filter(u=>!old.includes(u));
        const u={ id:'u'+Date.now()+Math.random().toString(36).slice(2,6), name:g.names.join(' + '), branch:g.branch, from:g.from, to:g.to, rows:g.rows, mine:g.rows.filter(r=>productKeyOf(r[1])).length, added:new Date().toISOString() };
        S.uploads.push(u); await Store.put('uploads',u); nRx++;
      }
      if(nS){ S.sales=sales; await Store.set('sales',S.sales); }
    }catch(err){ toast('اتقرا بس ما اتحفظش على الجهاز: '+(err&&err.message||err)); }
    // اعرض الفترة اللي اترفعت
    const lastTo=items.filter(x=>x.include&&x.to).map(x=>x.to).sort().pop();
    if(lastTo&&S.f.mode!=='all'){ S.f.mode='month'; S.f.month=lastTo.slice(0,7); saveFilter(); }
    m.remove(); safeRebuild(); route();
    toast('اتحفظ ✓'+(nRx?' '+nRx+' ملف كتابات':'')+(nRx&&nS?' و':'')+(nS?' '+nS+' ملف مبيعات':''));
  });
}
function restoreFrom(file){
  const rd=new FileReader();
  rd.onload=()=>{
    let json; try{ json=JSON.parse(rd.result); }catch(e){ toast('ملف JSON غير صالح'); return; }
    if(!json||json.app!=='pharmadash-pro'){ toast('ده مش نسخة احتياطية من PharmaDash Pro'); return; }
    confirmBox('استرجاع النسخة هيستبدل كل البيانات الحالية بـ '+(json.uploads||[]).length+' ملف كتابات و'+(json.sales||[]).length+' سطر مبيعات.','استرجاع',async()=>{
      await Store.clear('uploads'); for(const u of json.uploads||[]) await Store.put('uploads',u);
      await Store.set('sales',json.sales||[]); await loadAll(); route(); toast('اتسترجعت النسخة ✓'); });
  };
  rd.readAsText(file);
}
function confirmBox(msg,okLabel,fn){
  const m=document.createElement('div'); m.className='modal';
  m.innerHTML='<div class="sheet" role="dialog" aria-modal="true" style="max-width:420px"><h3>متأكد؟</h3><p class="muted" style="margin-top:6px">'+esc(msg)+'</p><div class="sheet-actions"><button class="btn" data-x>إلغاء</button><button class="btn pri" data-ok>'+esc(okLabel)+'</button></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click',e=>{ if(e.target===m||e.target.closest('[data-x]')) m.remove(); else if(e.target.closest('[data-ok]')){ m.remove(); fn(); } });
}
function download(name,text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'application/json'})); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }

/* ───────── واجهة عامة ───────── */
let toastT;
function toast(msg){ let t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; t.setAttribute('role','status'); document.body.appendChild(t); } t.textContent=msg; clearTimeout(toastT); toastT=setTimeout(()=>t.remove(),2800); }
function loading(msg){ let l=document.querySelector('.loading'); if(!msg){ if(l) l.remove(); return; } if(!l){ l=document.createElement('div'); l.className='loading'; l.innerHTML='<div></div>'; document.body.appendChild(l); } l.firstChild.textContent=msg; }

document.addEventListener('click',e=>{
  const md=e.target.closest('[data-mode]'); if(md){ setF('mode',md.dataset.mode); return; }
  const br=e.target.closest('[data-brand]'); if(br){ S.brand=br.dataset.brand; route(); return; }
  const tp=e.target.closest('[data-tlp]'); if(tp){ S.tlProduct=tp.dataset.tlp; route(); return; }
  const a=e.target.closest('[data-act]'); if(!a) return;
  const act=a.dataset.act;
  if(act==='pick') document.getElementById('fileInput').click();
  else if(act==='restore') document.getElementById('restoreInput').click();
  else if(act==='allFiles'){ S.allFiles=true; route(); }
  else if(act==='backup') download('pharmadash-pro-backup-'+todayISO()+'.json',JSON.stringify({app:'pharmadash-pro',v:3,exported:new Date().toISOString(),uploads:S.uploads,sales:S.sales}));
  else if(act==='delRx') confirmBox('حذف ملف الكتابات ده؟','حذف',async()=>{ S.uploads=S.uploads.filter(u=>u.id!==a.dataset.id); try{ await Store.del('uploads',a.dataset.id); }catch(err){} safeRebuild(); route(); });
  else if(act==='delSales') confirmBox('حذف ملف المبيعات ده؟','حذف',async()=>{ S.sales=S.sales.filter(x=>x.branch+'|'+x.from+'|'+x.to+'|'+PROD[x.product].brand!==a.dataset.k); try{ await Store.set('sales',S.sales); }catch(err){} safeRebuild(); route(); });
  else if(act==='wipe') confirmBox('مسح كل الكتابات والمبيعات من الجهاز ده؟ مش هينفع ترجعها إلا من نسخة احتياطية.','مسح الكل',async()=>{ try{ await Store.clear('uploads'); await Store.set('sales',[]); }catch(err){} S.uploads=[]; S.sales=[]; safeRebuild(); route(); toast('اتمسح كل حاجة'); });
});
document.addEventListener('change',e=>{
  if(e.target.id==='monthSel'){ S.f.month=e.target.value; setF('mode','month'); }
  else if(e.target.id==='branchSel') setF('branch',e.target.value);
  else if(e.target.id==='fileInput'){ onFiles(e.target.files); e.target.value=''; }
  else if(e.target.id==='restoreInput'){ if(e.target.files[0]) restoreFrom(e.target.files[0]); e.target.value=''; }
});
['dragover','dragenter'].forEach(ev=>document.addEventListener(ev,e=>{ if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){ e.preventDefault(); const z=document.getElementById('dropZone'); if(z) z.classList.add('over'); } }));
document.addEventListener('dragleave',e=>{ const z=document.getElementById('dropZone'); if(z&&!z.contains(e.relatedTarget)) z.classList.remove('over'); });
document.addEventListener('drop',e=>{ if(!e.dataTransfer||!e.dataTransfer.files.length) return; e.preventDefault(); const z=document.getElementById('dropZone'); if(z) z.classList.remove('over'); onFiles(e.dataTransfer.files); });
window.addEventListener('hashchange',()=>{ route(); window.scrollTo(0,0); });

try{ const t=localStorage.getItem('pdp-theme'); if(t) document.documentElement.dataset.theme=t; }catch(e){}
document.getElementById('themeBtn').onclick=()=>{
  const cur=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const next=cur==='dark'?'light':'dark'; document.documentElement.dataset.theme=next;
  try{ localStorage.setItem('pdp-theme',next); }catch(e){}
};
window.addEventListener('error',e=>{ if(e.message) toast('خطأ: '+e.message); });
window.addEventListener('unhandledrejection',e=>{ const r=e.reason; toast('خطأ: '+(r&&r.message||r)); loading(); });
loadAll().then(route,err=>{ S.ready=true; S.err=err; route(); });
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
