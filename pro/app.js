/* PharmaDash Pro — متابعة الأصناف والأطباء
   كل البيانات تُحفظ على الجهاز (IndexedDB) — لا شيء يُرفع لأي خادم. */
(function(){
'use strict';

/* ───────── ثوابت ───────── */
const BRANCHES = { T1:'التعاون الأول', T2:'التعاون الثاني', T3:'التعاون الثالث' };
const SALES_BRANCH_MAP = { 'صيدلية 1':'T1', 'صيدلية 18':'T2', 'صيدلية 7':'T3' };
const PUREHERB_KEYMAP = { 'PURE OMEGA':'pure_omega','PUREFEEL':'purefeel','CENTROZON W':'centrozon_w','CENTROZON':'centrozon','ZINCOLIVE':'zincolive','BONEFRIEND':'bonefriend','ARGIGROW':'argigrow' };
const PRODUCTS = [
  ...PRIVATE_LABEL.map(p=>({ key:p.key, name:p.name, form:p.form, brand:'nostri' })),
  ...PUREHERB_PRODUCTS.map(p=>{ const name=p.name.replace(/\s+(Syrup|Tablet)?\s*\d.*$/,''); return { key:PUREHERB_KEYMAP[p.key], name, form:p.name.slice(name.length).trim(), brand:'herb' }; })
];
const PROD = Object.fromEntries(PRODUCTS.map(p=>[p.key,p]));
const BRAND = { nostri:{ label:'NOSTRI · Private Label', color:'var(--nostri)', cls:'nostri' }, herb:{ label:'PureHerb', color:'var(--herb)', cls:'herb' } };

function productKeyOf(service){
  const pl = findPrivateLabelProduct(service); if(pl) return pl.key;
  const ph = findPureHerbProduct(service); if(ph) return PUREHERB_KEYMAP[ph.key] || null;
  return null;
}
const keyOf = v => PharmaCore.normalizeEntityKey(v);
const esc = escapeHtml;
const n0 = v => fmt(Math.round(v||0));
const today = () => PharmaCore.localDateKey ? PharmaCore.localDateKey(new Date()) : new Date().toISOString().slice(0,10);

/* ───────── أيقونات ───────── */
const I = (p)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
const ICON = {
  home:I('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
  pill:I('<rect x="2" y="8" width="20" height="8" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/>'),
  doc:I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  data:I('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  back:I('<polyline points="9 18 15 12 9 6"/>'),
  search:I('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/>'),
  upload:I('<path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M4 21h16"/>'),
  plus:I('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  star:I('<polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.5 5.5 21 7.5 13.5 2 9 9 9"/>'),
  target:I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  trash:I('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'),
  save:I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>')
};

/* ───────── التخزين (IndexedDB) ───────── */
const Store = (()=>{
  let dbp = null;
  function open(){
    if(dbp) return dbp;
    dbp = new Promise((res,rej)=>{
      const r = indexedDB.open('pharmadash-pro',1);
      r.onupgradeneeded = ()=>{ const db=r.result;
        ['uploads','visits'].forEach(s=>{ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'}); });
        if(!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); };
      r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error);
    });
    return dbp;
  }
  async function tx(store, mode, fn){
    const db = await open();
    return new Promise((res,rej)=>{ const t=db.transaction(store,mode); const s=t.objectStore(store);
      const out = fn(s); t.oncomplete=()=>res(out && 'result' in out ? out.result : out); t.onerror=()=>rej(t.error); });
  }
  return {
    all:(s)=>tx(s,'readonly',st=>st.getAll()),
    put:(s,v)=>tx(s,'readwrite',st=>{ st.put(v); }),
    del:(s,id)=>tx(s,'readwrite',st=>{ st.delete(id); }),
    clear:(s)=>tx(s,'readwrite',st=>{ st.clear(); }),
    get:(k)=>tx('kv','readonly',st=>st.get(k)),
    set:(k,v)=>tx('kv','readwrite',st=>{ st.put(v,k); })
  };
})();

/* ───────── الحالة ───────── */
const S = {
  uploads:[], sales:[],
  f:{ branch:'ALL', period:'ALL' },
  ix:null, full:null,
  docQuery:'', docSort:'mine', docOnlyMine:false, drugQuery:'', showAllDrugs:false
};
try{ const f=JSON.parse(localStorage.getItem('pdp-filter')); if(f&&f.branch) S.f=f; }catch(e){}

async function loadAll(){
  try{
    S.uploads = await Store.all('uploads');
    S.sales = (await Store.get('sales')) || [];
  }catch(e){ toast('تعذّر فتح التخزين المحلي — ستعمل الجلسة بدون حفظ'); }
  rebuild();
}

/* ───────── بناء الفهارس ───────── */
function inPeriod(date, p){
  if(p==='ALL') return true;
  if(!date) return false;
  if(p.startsWith('M:')) return date.slice(0,7)===p.slice(2);
  if(p.startsWith('D:')) return date===p.slice(2);
  return true;
}
function buildIndex(uploads){
  const doctors=new Map(), drugs=new Map(), products=new Map(), sections=new Map();
  const pkCache=new Map(); const patients=new Set(); let rows=0, mine=0;
  const dates=new Set();
  PRODUCTS.forEach(p=>products.set(p.key,{ key:p.key, total:0, doctors:new Map(), sections:new Map(), branches:new Map(), dates:new Map(), patients:new Set(), closed:0, canceled:0, names:new Map() }));
  const bump=(m,k,name,extra)=>{ let o=m.get(k); if(!o){ o={key:k,name,count:0,...(extra||{})}; m.set(k,o);} o.count++; return o; };
  for(const u of uploads){
    const date=u.date||''; if(date) dates.add(date);
    for(const r of u.rows){
      const [doctor,service,section,patient,status]=r;
      const dk=keyOf(doctor), gk=keyOf(service), sk=keyOf(section);
      let pk=pkCache.get(gk); if(pk===undefined){ pk=service?productKeyOf(service):null; pkCache.set(gk,pk); }
      const pid=patient? u.branch+'|'+patient : '';
      rows++; if(pk) mine++; if(pid) patients.add(pid);
      const st=PharmaCore.normalizeStatus(status);
      if(dk){
        let d=doctors.get(dk);
        if(!d){ d={key:dk,name:doctor,section:section||'',branches:new Map(),total:0,mine:0,drugs:new Map(),prods:new Map(),patients:new Set(),dates:new Map(),lastMine:''}; doctors.set(dk,d); }
        d.total++; if(section&&!d.section) d.section=section;
        bump(d.branches,u.branch,BRANCHES[u.branch]);
        if(gk) bump(d.drugs,gk,service,{pk});
        if(pid) d.patients.add(pid);
        const dd=d.dates.get(date)||{t:0,m:0}; dd.t++; if(pk) dd.m++; d.dates.set(date,dd);
        if(pk){ d.mine++; d.prods.set(pk,(d.prods.get(pk)||0)+1); if(date>d.lastMine) d.lastMine=date; }
      }
      if(gk){
        let g=drugs.get(gk);
        if(!g){ g={key:gk,name:service,pk,total:0,doctors:new Map(),sections:new Map(),branches:new Map(),dates:new Map(),patients:new Set(),closed:0,canceled:0}; drugs.set(gk,g); }
        fill(g);
      }
      if(pk){ const p=products.get(pk); fill(p); bump(p.names,gk,service); }
      if(sk){
        let s=sections.get(sk); if(!s){ s={key:sk,name:section,total:0,mine:0,doctors:new Set(),prods:new Map()}; sections.set(sk,s); }
        s.total++; if(dk) s.doctors.add(dk); if(pk){ s.mine++; s.prods.set(pk,(s.prods.get(pk)||0)+1); }
      }
      function fill(o){
        o.total++;
        if(dk) bump(o.doctors,dk,doctor);
        if(sk) bump(o.sections,sk,section);
        bump(o.branches,u.branch,BRANCHES[u.branch]);
        if(date) o.dates.set(date,(o.dates.get(date)||0)+1);
        if(pid) o.patients.add(pid);
        if(st==='Closed') o.closed++; else if(st==='Canceled') o.canceled++;
      }
    }
  }
  return { doctors, drugs, products, sections, rows, mine, patients:patients.size, dates:[...dates].sort(), uploads:uploads.length };
}
function rebuild(){
  const f=S.f;
  const ups=S.uploads.filter(u=>(f.branch==='ALL'||u.branch===f.branch)&&inPeriod(u.date,f.period));
  S.ix=buildIndex(ups);
  S.full=buildIndex(S.uploads);
}
function salesFor(pk){
  const f=S.f; let units=0, amount=0, any=false; const byBranch=new Map();
  for(const e of S.sales){
    if(pk && e.product!==pk) continue;
    if(f.branch!=='ALL' && e.branch!==f.branch) continue;
    if(!inPeriod(e.date,f.period)) continue;
    units+=e.units; amount+=e.amount; any=true;
    byBranch.set(e.branch,(byBranch.get(e.branch)||0)+e.units);
  }
  return any?{units,amount,byBranch}:null;
}

/* ───────── أدوات العرض ───────── */
function initials(name){
  const w=String(name||'').replace(/^(DR\.?|DOCTOR|د\.?|دكتور)\s+/i,'').trim().split(/\s+/).filter(Boolean);
  return ((w[0]||'?')[0]+((w[1]||'')[0]||'')).toUpperCase();
}
function sorted(map){ return [...map.values()].sort((a,b)=>b.count-a.count); }
function hbars(items,{max,cls='',link}={}){
  if(!items.length) return '<p class="muted small">لا توجد بيانات</p>';
  const m=max||Math.max(...items.map(i=>i.count),1);
  return '<div class="hbars">'+items.map(i=>{
    const inner='<span class="n">'+esc(i.name)+'</span><span class="t"><i style="width:'+(i.count/m*100).toFixed(1)+'%"></i></span><span class="c num">'+fmt(i.count)+'</span>';
    return link? '<a class="hb '+cls+'" href="'+link(i)+'">'+inner+'</a>' : '<div class="hb '+cls+'">'+inner+'</div>';
  }).join('')+'</div>';
}
function trendCols(datesMap){
  const entries=[...datesMap.entries()].filter(([d])=>d).sort((a,b)=>a[0]<b[0]?-1:1);
  if(entries.length<2) return '';
  let pts=entries;
  if(entries.length>14){
    const byM=new Map(); entries.forEach(([d,c])=>byM.set(d.slice(0,7),(byM.get(d.slice(0,7))||0)+c));
    pts=[...byM.entries()];
    if(pts.length<2) pts=entries.slice(-14);
  }
  pts=pts.slice(-14);
  const m=Math.max(...pts.map(p=>p[1]),1);
  return '<div class="cols">'+pts.map(([d,c])=>'<div class="col"><b class="num">'+fmt(c)+'</b><i style="height:'+(c/m*100).toFixed(1)+'%"></i><span>'+esc(fmtDate(d))+'</span></div>').join('')+'</div>';
}
const MONTHS=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function fmtDate(d){
  if(!d) return '—';
  const [y,m,dd]=d.split('-');
  if(!dd) return MONTHS[+m-1]+' '+y.slice(2);
  return (+dd)+' '+MONTHS[+m-1].slice(0,3);
}
function fmtDateLong(d){ if(!d) return '—'; const [y,m,dd]=d.split('-'); return (+dd)+' '+MONTHS[+m-1]+' '+y; }
function prodChip(pk,count){
  const p=PROD[pk]; if(!p) return '';
  return '<a class="chip '+BRAND[p.brand].cls+'" href="#/product/'+pk+'">'+esc(p.name)+(count!=null?' · <span class="num">'+fmt(count)+'</span>':'')+'</a>';
}
function kpi(label,value,hint){ return '<div class="card kpi"><div class="l">'+label+'</div><div class="v num">'+value+'</div>'+(hint?'<div class="h">'+hint+'</div>':'')+'</div>'; }
function rate(o){ const dec=o.closed+o.canceled; return dec?Math.round(o.closed/dec*100)+'%':'—'; }
const docHref = k => '#/doctor/'+encodeURIComponent(k);
const drugHref = k => '#/drug/'+encodeURIComponent(k);
function noData(){
  return '<div class="card empty"><div class="ei">'+ICON.upload+'</div><h2>ابدأ برفع ملف الكتابات</h2>'
    +'<p>ارفع تقرير الروشتات (Excel أو CSV أو PDF) لأي تعاون، وبعدها اضغط على أي صنف أو طبيب لتشوف كل تفاصيله.</p>'
    +'<a class="btn pri" href="#/data">'+ICON.upload+' رفع ملف</a></div>';
}
function filterNote(){
  const f=S.f; if(f.branch==='ALL'&&f.period==='ALL') return '';
  return '<span class="chip brand">'+(f.branch==='ALL'?'كل التعاونات':BRANCHES[f.branch])+(f.period==='ALL'?'':' · '+esc(periodLabel(f.period)))+'</span>';
}
function periodLabel(p){ if(p==='ALL') return 'كل الفترات'; if(p.startsWith('M:')) return fmtDate(p.slice(2)); return fmtDateLong(p.slice(2)); }

/* ───────── الصفحات ───────── */
const PAGES = {
  home:{ title:'الرئيسية', icon:'home', nav:true },
  products:{ title:'أصنافي', icon:'pill', nav:true },
  doctors:{ title:'الأطباء', icon:'doc', nav:true },
  data:{ title:'البيانات', icon:'data', nav:true }
};

function renderHome(){
  const ix=S.ix;
  if(!S.uploads.length) return noData();
  const docsMine=[...ix.doctors.values()].filter(d=>d.mine>0);
  const share=ix.rows?(ix.mine/ix.rows*100).toFixed(1)+'%':'—';
  const sold=salesFor(null);
  let h='<div class="stack">';
  h+='<div class="grid g4">'
    +kpi('كتابات أصنافي',fmt(ix.mine),'من '+fmt(ix.rows)+' كتابة · '+share)
    +kpi('أطباء بيكتبوا أصنافي',fmt(docsMine.length),'من '+fmt(ix.doctors.size)+' طبيب')
    +kpi(sold?'مبيعات فعلية (علبة)':'الأصناف المكتوبة',sold?fmt(sold.units):fmt([...ix.products.values()].filter(p=>p.total).length)+' / '+PRODUCTS.length, sold?'حسب ملف المبيعات':'صنف اتكتب على الأقل مرة')
    +kpi('عدد المرضى',fmt(ix.patients),'في الفترة المختارة')
    +'</div>';

  // أصنافي
  h+='<div class="card"><h3>'+ICON.pill+' أصنافي <span class="sub">اضغط على الصنف لتفاصيله</span></h3>'+productTiles(true)+'</div>';

  // أعلى الأطباء
  const top=docsMine.sort((a,b)=>b.mine-a.mine).slice(0,8);
  h+='<div class="grid g2"><div class="card"><h3>'+ICON.star+' أكثر الأطباء كتابةً لأصنافي <a class="sub" href="#/doctors">الكل ›</a></h3>'+doctorRows(top,'mine')+'</div>';
  const secs=[...ix.sections.values()].filter(s=>s.mine).sort((a,b)=>b.mine-a.mine).slice(0,8).map(s=>({name:s.name,count:s.mine}));
  h+='<div class="card"><h3>'+ICON.target+' أصنافي حسب القسم</h3>'+hbars(secs,{cls:'mine'})+'</div></div>';
  return h+'</div>';
}

function productTiles(compact){
  const ix=S.ix;
  let h='';
  ['nostri','herb'].forEach(b=>{
    const list=PRODUCTS.filter(p=>p.brand===b).map(p=>({p,o:ix.products.get(p.key)})).sort((a,c)=>c.o.total-a.o.total);
    h+='<div class="section-title" style="margin:'+(h?'16px':'0')+' 2px 10px">'+BRAND[b].label+'</div><div class="grid '+(compact?'g4':'g3')+'">';
    list.forEach(({p,o})=>{
      h+='<a class="card ptile'+(o.total?'':' zero')+'" href="#/product/'+p.key+'"><span class="stripe" style="background:'+BRAND[b].color+'"></span>'
        +'<div><div class="pn">'+esc(p.name)+'</div><div class="pf">'+esc(p.form)+'</div></div>'
        +'<div class="pv"><b class="num">'+fmt(o.total)+'</b><span>كتابة</span></div>'
        +'<div class="muted small">'+fmt(o.doctors.size)+' طبيب · '+fmt(o.patients.size)+' مريض</div></a>';
    });
    h+='</div>';
  });
  return h;
}

function doctorRows(list,mode){
  if(!list.length) return '<p class="muted small">لا توجد نتائج</p>';
  const max=Math.max(...list.map(d=>mode==='mine'?d.mine:d.total),1);
  return '<div class="list">'+list.map((d,i)=>{
    const v=mode==='mine'?d.mine:d.total;
    return '<a class="row" href="'+docHref(d.key)+'"><span class="mini-av'+(d.mine?' on':'')+'">'+esc(initials(d.name))+'</span>'
      +'<span class="rm"><div class="rt">'+esc(d.name)+'</div><div class="rs">'+esc(d.section||'—')+' · '+[...d.branches.values()].map(b=>esc(b.name)).join('، ')+'</div>'
      +'<div class="bar'+(mode==='mine'?' mine':'')+'"><i style="width:'+(v/max*100).toFixed(1)+'%"></i></div></span>'
      +'<span class="rv num">'+fmt(d.mine)+'<small>من '+fmt(d.total)+'</small></span></a>';
  }).join('')+'</div>';
}

function renderProducts(){
  if(!S.uploads.length) return noData();
  const ix=S.ix;
  let h='<div class="stack"><div class="card">'+productTiles(false)+'</div>';
  h+='<div class="card"><h3>'+ICON.search+' كل الأدوية المكتوبة <span class="sub">'+fmt(ix.drugs.size)+' دواء</span></h3>'
    +'<div class="search" style="margin-bottom:10px">'+ICON.search+'<input id="drugQ" placeholder="ابحث عن أي دواء (منافس أو صنفك)…" value="'+escapeAttr(S.drugQuery)+'"></div><div id="drugList"></div></div>';
  return h+'</div>';
}
function drugListHtml(){
  const q=keyOf(S.drugQuery);
  let list=[...S.ix.drugs.values()];
  if(q) list=list.filter(d=>d.key.includes(q));
  list.sort((a,b)=>b.total-a.total);
  const shown=list.slice(0,S.showAllDrugs?400:25);
  const max=Math.max(...shown.map(d=>d.total),1);
  let h='<div class="list">'+shown.map((d,i)=>'<a class="row" href="'+(d.pk?'#/product/'+d.pk:drugHref(d.key))+'"><span class="rk num">'+(i+1)+'</span><span class="rm"><div class="rt">'+esc(d.name)+(d.pk?' <span class="chip mine">صنفي</span>':'')+'</div><div class="rs">'+fmt(d.doctors.size)+' طبيب · '+fmt(d.patients.size)+' مريض</div><div class="bar'+(d.pk?' mine':'')+'"><i style="width:'+(d.total/max*100).toFixed(1)+'%"></i></div></span><span class="rv num">'+fmt(d.total)+'</span></a>').join('')+'</div>';
  if(!shown.length) h='<p class="muted small">لا توجد نتائج</p>';
  if(list.length>shown.length) h+='<div style="text-align:center;margin-top:10px"><button class="btn sm" data-act="moreDrugs">عرض المزيد ('+fmt(list.length-shown.length)+')</button></div>';
  return h;
}

function renderItem(o,{isMine,title,sub}){
  if(!o) return '<div class="card empty"><h2>غير موجود</h2><p>هذا العنصر غير موجود في البيانات الحالية — جرّب تغيير الفلتر.</p></div>';
  const docs=sorted(o.doctors);
  const sold=isMine?salesFor(o.key):null;
  let h='<div class="stack"><div class="card hero"><div class="avatar" style="'+(isMine?'background:var(--mine-soft);color:var(--mine)':'')+'">'+ICON.pill+'</div><div style="min-width:0"><h2>'+esc(title)+'</h2><div class="meta">'+sub+filterNote()+'</div></div></div>';
  h+='<div class="grid g4">'+kpi('مرات الكتابة',fmt(o.total))+kpi('عدد الأطباء',fmt(o.doctors.size))+kpi('عدد المرضى',fmt(o.patients.size))
    +(sold?kpi('مبيعات فعلية',fmt(sold.units)+' علبة',o.total?'تحويل '+Math.round(sold.units/o.total*100)+'% من الكتابات':''):kpi('نسبة الصرف',rate(o),'مصروف ÷ (مصروف + ملغي)'))+'</div>';
  if(!o.total) return h+'<div class="card empty"><h2>لم يُكتب في الفترة المختارة</h2><p>جرّب «كل الفترات» أو تعاون آخر.</p></div></div>';
  h+='<div class="card"><h3>'+ICON.doc+' مين بيكتبه؟ <span class="sub">'+fmt(docs.length)+' طبيب</span></h3><div class="list">'
    +docs.map((d,i)=>{ const doc=S.ix.doctors.get(d.key);
      return '<a class="row" href="'+docHref(d.key)+'"><span class="rk num">'+(i+1)+'</span><span class="mini-av on">'+esc(initials(d.name))+'</span><span class="rm"><div class="rt">'+esc(d.name)+'</div><div class="rs">'+esc(doc&&doc.section||'—')+(doc?' · '+[...doc.branches.values()].map(b=>esc(b.name)).join('، '):'')+'</div><div class="bar mine"><i style="width:'+(d.count/docs[0].count*100).toFixed(1)+'%"></i></div></span><span class="rv num">'+fmt(d.count)+'<small>'+Math.round(d.count/o.total*100)+'%</small></span></a>'; }).join('')
    +'</div></div>';
  h+='<div class="grid g2"><div class="card"><h3>فين بيتكتب؟ — الأقسام</h3>'+hbars(sorted(o.sections).slice(0,10),{cls:isMine?'mine':''})+'</div>'
    +'<div class="card"><h3>حسب التعاون</h3>'+hbars(sorted(o.branches),{cls:isMine?'mine':''})
    +(sold&&sold.byBranch.size?'<div class="section-title" style="margin:14px 0 8px">مبيعات فعلية (علبة)</div>'+hbars([...sold.byBranch.entries()].map(([b,c])=>({name:BRANCHES[b],count:c}))):'')+'</div></div>';
  const tr=trendCols(o.dates);
  if(tr) h+='<div class="card"><h3>الكتابات عبر الوقت</h3>'+tr+'</div>';
  if(isMine&&o.names&&o.names.size>1) h+='<div class="card"><h3>الأسماء كما وردت في التقارير</h3>'+hbars(sorted(o.names))+'</div>';
  return h+'</div>';
}

function renderDoctors(){
  if(!S.uploads.length) return noData();
  return '<div class="stack"><div class="search">'+ICON.search+'<input id="docQ" placeholder="ابحث باسم الطبيب أو القسم…" value="'+escapeAttr(S.docQuery)+'"></div>'
    +'<div class="filters"><div class="seg" id="docSort">'
    +[['mine','الأكثر كتابة لأصنافي'],['total','إجمالي الكتابات']].map(([k,l])=>'<button data-sort="'+k+'" class="'+(S.docSort===k?'on':'')+'">'+l+'</button>').join('')
    +'</div><button class="chip pick'+(S.docOnlyMine?' on':'')+'" data-act="onlyMine">بيكتب أصنافي فقط</button></div>'
    +'<div class="card" id="docList"></div></div>';
}
function docListHtml(){
  const q=keyOf(S.docQuery);
  let list=[...S.ix.doctors.values()];
  if(q) list=list.filter(d=>d.key.includes(q)||keyOf(d.section).includes(q));
  if(S.docOnlyMine) list=list.filter(d=>d.mine>0);
  if(S.docSort==='mine') list.sort((a,b)=>b.mine-a.mine||b.total-a.total);
  else list.sort((a,b)=>b.total-a.total);
  const n=list.length; list=list.slice(0,200);
  return '<h3>'+fmt(n)+' طبيب'+(n>200?' <span class="sub">أول 200 — استخدم البحث</span>':'')+'</h3>'+doctorRows(list,S.docSort==='total'?'total':'mine');
}

function renderDoctor(dk){
  const d=S.ix.doctors.get(dk)||S.full.doctors.get(dk);
  if(!d) return '<div class="card empty"><h2>الطبيب غير موجود</h2><p>غيّر الفلتر أو ارجع لقائمة الأطباء.</p></div>';
  const inFilter=!!S.ix.doctors.get(dk);
  const name=d.name;
  let h='<div class="stack"><div class="card hero"><div class="avatar">'+esc(initials(name))+'</div><div style="min-width:0;flex:1"><h2>'+esc(name)+'</h2><div class="meta">'
    +'<span class="chip">'+esc(d.section||'بدون قسم')+'</span>'+[...d.branches.values()].map(b=>'<span class="chip">'+esc(b.name)+'</span>').join('')+filterNote()+'</div></div></div>';
  if(!inFilter) h+='<div class="tip"><span class="ti" style="background:var(--warn-soft);color:var(--warn)">!</span><div><b>لا كتابات لهذا الطبيب في الفلتر الحالي</b><p>المعروض من كل الفترات وكل التعاونات.</p></div></div>';
  const share=d.total?Math.round(d.mine/d.total*100):0;
  h+='<div class="grid g4">'+kpi('إجمالي كتاباته',fmt(d.total),fmt(d.drugs.size)+' دواء مختلف')+kpi('كتابات أصنافي',fmt(d.mine),share+'% من كتاباته')
    +kpi('عدد المرضى',fmt(d.patients.size))+kpi('أصنافي اللي كتبها',fmt(d.prods.size)+' / '+PRODUCTS.length)+'</div>';

  // أصنافي
  const mineList=[...d.prods.entries()].map(([pk,c])=>({key:pk,name:PROD[pk].name,count:c})).sort((a,b)=>b.count-a.count);
  h+='<div class="grid g2"><div class="card"><h3>'+ICON.star+' أصنافي اللي بيكتبها</h3>'
    +(mineList.length?hbars(mineList,{cls:'mine',link:i=>'#/product/'+i.key}):'<p class="muted small">لم يكتب أي صنف من أصنافك بعد.</p>')+'</div>';
  // لسه ما كتبهاش — مرتبة بحسب كتابة زملائه في نفس القسم
  const sec=S.ix.sections.get(keyOf(d.section))||S.full.sections.get(keyOf(d.section));
  const missing=PRODUCTS.filter(p=>!d.prods.has(p.key)).map(p=>({p,peer:sec?(sec.prods.get(p.key)||0):0})).sort((a,b)=>b.peer-a.peer);
  h+='<div class="card"><h3>'+ICON.target+' أصناف لسه ما كتبهاش</h3><p class="muted small" style="margin-bottom:10px">مرتبة حسب كتابة زملائه في نفس القسم — الأعلى فرصة أقرب.</p><div class="chips">'
    +missing.map(({p,peer})=>'<a class="chip '+(peer?'warn':'')+'" href="#/product/'+p.key+'">'+esc(p.name)+(peer?' · زملاؤه '+fmt(peer):'')+'</a>').join('')+'</div></div></div>';

  // كل أدويته
  const drugs=sorted(d.drugs);
  h+='<div class="card"><h3>'+ICON.pill+' كل الأدوية اللي بيكتبها <span class="sub">'+fmt(drugs.length)+' دواء</span></h3><div class="list">'
    +drugs.slice(0,S.showAllDrugs?500:20).map((g,i)=>'<a class="row" href="'+(g.pk?'#/product/'+g.pk:drugHref(g.key))+'"><span class="rk num">'+(i+1)+'</span><span class="rm"><div class="rt">'+esc(g.name)+(g.pk?' <span class="chip mine">صنفي</span>':'')+'</div><div class="bar'+(g.pk?' mine':'')+'"><i style="width:'+(g.count/drugs[0].count*100).toFixed(1)+'%"></i></div></span><span class="rv num">'+fmt(g.count)+'<small>'+Math.round(g.count/d.total*100)+'%</small></span></a>').join('')
    +'</div>'+(drugs.length>20&&!S.showAllDrugs?'<div style="text-align:center;margin-top:10px"><button class="btn sm" data-act="moreDrugs">عرض كل الأدوية ('+fmt(drugs.length)+')</button></div>':'')+'</div>';
  const tr=trendCols(new Map([...d.dates.entries()].map(([k,v])=>[k,v.m])));
  if(tr) h+='<div class="card"><h3>كتابات أصنافي عبر الوقت</h3>'+tr+'</div>';
  return h+'</div>';
}

function renderData(){
  const ups=[...S.uploads].sort((a,b)=>(b.date||'')<(a.date||'')?-1:1);
  let h='<div class="stack"><div class="card"><h3>'+ICON.upload+' رفع ملف كتابات (روشتات)</h3>'
    +'<p class="muted small" style="margin-bottom:12px">Excel أو CSV أو PDF — نفس تقارير النظام. لو اخترت أكثر من ملف مرة واحدة يتحسبوا كلهم لنفس اليوم.</p>'
    +'<div class="grid g3"><div class="field"><label>التعاون</label><select id="upBranch">'+Object.entries(BRANCHES).map(([k,l])=>'<option value="'+k+'"'+(S.f.branch===k?' selected':'')+'>'+l+'</option>').join('')+'</select></div>'
    +'<div class="field"><label>تاريخ التقرير</label><input type="date" id="upDate" value="'+today()+'"></div>'
    +'<div class="field"><label>&nbsp;</label><button class="btn pri" data-act="pickFiles">'+ICON.upload+' اختر الملفات</button></div></div></div>';
  h+='<div class="card"><h3>الملفات المرفوعة <span class="sub">'+fmt(ups.length)+'</span></h3>'
    +(ups.length?'<div class="wrap-x"><table class="tbl"><thead><tr><th>التاريخ</th><th>التعاون</th><th>الملف</th><th>كتابات</th><th>أصنافي</th><th></th></tr></thead><tbody>'
      +ups.map(u=>{ const mine=u.rows.reduce((s,r)=>s+(productKeyOf(r[1])?1:0),0);
        return '<tr><td class="num">'+esc(u.date||'—')+'</td><td>'+esc(BRANCHES[u.branch])+'</td><td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(u.name)+'</td><td class="num">'+fmt(u.rows.length)+'</td><td class="num">'+fmt(mine)+'</td><td><button class="chip bad" data-act="delUpload" data-id="'+escapeAttr(u.id)+'">حذف</button></td></tr>'; }).join('')
      +'</tbody></table></div>':'<p class="muted small">لم تُرفع ملفات بعد.</p>')+'</div>';
  h+='<div class="grid g2"><div class="card"><h3>ملف المبيعات (اختياري)</h3><p class="muted small" style="margin-bottom:12px">ملف JSON من داشبورد المبيعات — يضيف «المبيعات الفعلية» بجانب الكتابات في صفحة كل صنف.'+(S.sales.length?' <b>محمّل: '+fmt(S.sales.length)+' سطر.</b>':'')+'</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="pickSales">'+ICON.upload+' رفع ملف المبيعات</button>'+(S.sales.length?'<button class="btn danger" data-act="clearSales">إزالة</button>':'')+'</div></div>';
  h+='<div class="card"><h3>نسخة احتياطية</h3><p class="muted small" style="margin-bottom:12px">البيانات محفوظة في هذا المتصفح فقط. خُد نسخة احتياطية عشان تنقلها لجهاز تاني.</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="backup">'+ICON.save+' تنزيل نسخة</button><button class="btn" data-act="restore">'+ICON.upload+' استرجاع نسخة</button><button class="btn danger" data-act="wipe">'+ICON.trash+' مسح الكل</button></div></div></div>';
  return h+'</div>';
}

/* ───────── التوجيه ───────── */
let jsonMode='sales';
function route(){
  const hash=location.hash.replace(/^#\/?/,'')||'home';
  const [page,...rest]=hash.split('/'); const arg=decodeURIComponent(rest.join('/'));
  const view=document.getElementById('view');
  let title='', back=false, html='';
  S.showAllDrugs = S._lastHash===hash ? S.showAllDrugs : false; S._lastHash=hash;
  if(page==='product'){ const p=PROD[arg]; back=true; title=p?p.name:'صنف';
    html=p?renderItem(S.ix.products.get(arg),{isMine:true,title:p.name,sub:'<span class="chip '+BRAND[p.brand].cls+'">'+BRAND[p.brand].label+'</span><span class="chip">'+esc(p.form)+'</span>'}):renderItem(null,{}); }
  else if(page==='drug'){ const g=S.ix.drugs.get(arg); back=true; title='دواء';
    html=renderItem(g,{isMine:false,title:g?g.name:'',sub:'<span class="chip">ليس من أصنافي</span>'}); }
  else if(page==='doctor'){ back=true; title='الطبيب'; html=renderDoctor(arg); }
  else { const P=PAGES[page]||PAGES.home; title=P.title;
    html=({home:renderHome,products:renderProducts,doctors:renderDoctors,data:renderData}[page]||renderHome)(); }
  document.getElementById('title').innerHTML=(back?'<button class="back" data-act="back" aria-label="رجوع">'+ICON.back+'</button>':'')+'<span>'+esc(title)+'</span>';
  view.innerHTML=html;
  const active=back?({product:'products',drug:'products',doctor:'doctors'})[page]:(PAGES[page]?page:'home');
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===active));
  renderFilters(page);
  if(document.getElementById('drugList')) document.getElementById('drugList').innerHTML=drugListHtml();
  if(document.getElementById('docList')) document.getElementById('docList').innerHTML=docListHtml();
}
function renderFilters(page){
  const el=document.getElementById('filters');
  if(page==='data'||!S.uploads.length){ el.innerHTML=''; return; }
  const dates=[...new Set(S.uploads.map(u=>u.date).filter(Boolean))].sort().reverse();
  const months=[...new Set(dates.map(d=>d.slice(0,7)))];
  el.innerHTML='<div class="seg">'+[['ALL','الكل'],...Object.entries(BRANCHES).map(([k,l])=>[k,l.replace('التعاون ','')])].map(([k,l])=>'<button data-branch="'+k+'" class="'+(S.f.branch===k?'on':'')+'">'+l+'</button>').join('')+'</div>'
    +'<select class="sel" id="periodSel"><option value="ALL">كل الفترات</option>'
    +(months.length>1?'<optgroup label="شهر">'+months.map(m=>'<option value="M:'+m+'"'+(S.f.period==='M:'+m?' selected':'')+'>'+fmtDate(m)+'</option>').join('')+'</optgroup>':'')
    +'<optgroup label="يوم">'+dates.map(d=>'<option value="D:'+d+'"'+(S.f.period==='D:'+d?' selected':'')+'>'+fmtDateLong(d)+'</option>').join('')+'</optgroup></select>';
}
function setFilter(k,v){ S.f[k]=v; try{ localStorage.setItem('pdp-filter',JSON.stringify(S.f)); }catch(e){} rebuild(); route(); }

/* ───────── رفع الملفات ───────── */
async function onRxFiles(files){
  files=[...files]; if(!files.length) return;
  const branch=document.getElementById('upBranch').value, date=document.getElementById('upDate').value||today();
  const all=[], names=[];
  try{
    for(let i=0;i<files.length;i++){
      const f=files[i]; const ext=validateUploadFile(f);
      loading('جارٍ قراءة '+(files.length>1?'('+(i+1)+'/'+files.length+') ':'')+f.name+'…');
      const rows= ext==='.pdf'? await parsePDF(f,{}) : ext==='.csv'? await parseCSV(f,{}) : await parseExcel(f,{});
      validateParsedRows(rows);
      rows.forEach(r=>all.push([r.doctor,r.service,r.section,r.patient,r.status]));
      names.push(f.name);
    }
    const u={ id:'u'+Date.now(), name:names.length>1?names[0]+' + '+(names.length-1)+' ملف':names[0], branch, date, rows:all, added:new Date().toISOString() };
    S.uploads.push(u);
    try{ await Store.put('uploads',u); }catch(err){ toast('تحذير: الملف اتقرا لكن ما اتحفظش على الجهاز'); }
    rebuild(); loading(); route();
    const mine=all.filter(r=>productKeyOf(r[1])).length;
    toast('تم ✓ '+fmt(all.length)+' كتابة — منها '+fmt(mine)+' لأصنافك');
  }catch(err){ loading(); alert('تعذّر قراءة الملف:\n'+(err&&err.message||err)); }
}
function onJson(file){
  const rd=new FileReader();
  rd.onload=async()=>{
    let json; try{ json=JSON.parse(rd.result); }catch(e){ alert('ملف JSON غير صالح'); return; }
    if(jsonMode==='restore'){
      if(!json||json.app!=='pharmadash-pro'){ alert('هذه ليست نسخة احتياطية من PharmaDash Pro'); return; }
      if(!confirm('استرجاع النسخة سيستبدل كل البيانات الحالية. متابعة؟')) return;
      await Store.clear('uploads');
      for(const u of json.uploads||[]) await Store.put('uploads',u);
      await Store.set('sales',json.sales||[]);
      await loadAll(); route(); toast('تم استرجاع النسخة ✓'); return;
    }
    const arr=Array.isArray(json)?json:['entries','data','records','rows','items','sales'].map(k=>json&&json[k]).find(Array.isArray);
    if(!arr){ alert('لم أجد بيانات مبيعات في الملف'); return; }
    const num=v=>{ const n=Number(v); return Number.isFinite(n)&&n>0?n:0; };
    const entries=arr.filter(e=>e&&/^\d{4}-\d{2}-\d{2}$/.test(String(e.date||''))&&SALES_BRANCH_MAP[e.pharmacy]&&PROD[e.product])
      .map(e=>({ date:e.date, branch:SALES_BRANCH_MAP[e.pharmacy], product:e.product, units:num(e.units), amount:e.amount!=null?num(e.amount):num(e.price)*num(e.units) }));
    if(!entries.length){ alert('الملف لا يحتوي سطور مبيعات صالحة (date / pharmacy / product / units)'); return; }
    S.sales=entries; try{ await Store.set('sales',entries); }catch(e){}
    route(); toast('تم تحميل '+fmt(entries.length)+' سطر مبيعات ✓');
  };
  rd.readAsText(file);
}
function download(name,text,type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }

/* ───────── واجهة عامة ───────── */
let toastT;
function toast(msg){ let t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); } t.textContent=msg; clearTimeout(toastT); toastT=setTimeout(()=>t.remove(),2600); }
function loading(msg){ let l=document.querySelector('.loading'); if(!msg){ if(l) l.remove(); return; } if(!l){ l=document.createElement('div'); l.className='loading'; l.innerHTML='<div></div>'; document.body.appendChild(l); } l.firstChild.textContent=msg; }

function buildNav(){
  const items=Object.entries(PAGES).filter(([,p])=>p.nav);
  document.getElementById('sideNav').innerHTML=items.map(([k,p])=>'<a href="#/'+k+'" data-nav="'+k+'">'+ICON[p.icon]+'<span>'+p.title+'</span></a>').join('');
  document.getElementById('tabBar').innerHTML=items.map(([k,p])=>'<a href="#/'+k+'" data-nav="'+k+'">'+ICON[p.icon]+'<span>'+p.title+'</span></a>').join('');
}
function initTheme(){
  try{ const t=localStorage.getItem('pdp-theme'); if(t) document.documentElement.dataset.theme=t; }catch(e){}
  document.getElementById('themeBtn').onclick=()=>{
    const cur=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    const next=cur==='dark'?'light':'dark'; document.documentElement.dataset.theme=next;
    try{ localStorage.setItem('pdp-theme',next); }catch(e){}
  };
}

document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-branch]'); if(b){ setFilter('branch',b.dataset.branch); return; }
  const s=e.target.closest('[data-sort]'); if(s){ S.docSort=s.dataset.sort; route(); return; }
  const a=e.target.closest('[data-act]'); if(!a) return;
  const act=a.dataset.act;
  if(act==='back'){ if(history.length>1) history.back(); else location.hash='#/home'; }
  else if(act==='onlyMine'){ S.docOnlyMine=!S.docOnlyMine; route(); }
  else if(act==='moreDrugs'){ S.showAllDrugs=true; route(); }
  else if(act==='pickFiles') document.getElementById('fileInput').click();
  else if(act==='pickSales'){ jsonMode='sales'; document.getElementById('jsonInput').click(); }
  else if(act==='restore'){ jsonMode='restore'; document.getElementById('jsonInput').click(); }
  else if(act==='clearSales'){ S.sales=[]; try{ await Store.set('sales',[]); }catch(err){} route(); }
  else if(act==='delUpload'){ if(!confirm('حذف هذا الملف من البيانات؟')) return; S.uploads=S.uploads.filter(u=>u.id!==a.dataset.id); try{ await Store.del('uploads',a.dataset.id); }catch(err){} rebuild(); route(); }
  else if(act==='backup'){ download('pharmadash-pro-backup-'+today()+'.json',JSON.stringify({app:'pharmadash-pro',v:1,exported:new Date().toISOString(),uploads:S.uploads,sales:S.sales}),'application/json'); }
  else if(act==='wipe'){ if(!confirm('مسح كل الملفات من هذا الجهاز؟ لا يمكن التراجع.')) return; await Store.clear('uploads'); await Store.set('sales',[]); S.f={branch:'ALL',period:'ALL'}; await loadAll(); route(); }
});
document.addEventListener('change',e=>{
  if(e.target.id==='periodSel') setFilter('period',e.target.value);
  else if(e.target.id==='fileInput'){ onRxFiles(e.target.files); e.target.value=''; }
  else if(e.target.id==='jsonInput'){ if(e.target.files[0]) onJson(e.target.files[0]); e.target.value=''; }
});
document.addEventListener('input',e=>{
  if(e.target.id==='docQ'){ S.docQuery=e.target.value; document.getElementById('docList').innerHTML=docListHtml(); }
  else if(e.target.id==='drugQ'){ S.drugQuery=e.target.value; document.getElementById('drugList').innerHTML=drugListHtml(); }
});
window.addEventListener('hashchange',()=>{ route(); window.scrollTo(0,0); });

buildNav(); initTheme();
loadAll().then(()=>{
  // لو الفلتر المحفوظ لم يعد موجودًا في البيانات
  if(S.f.period!=='ALL' && !S.uploads.some(u=>inPeriod(u.date,S.f.period))){ S.f.period='ALL'; rebuild(); }
  route();
});
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
