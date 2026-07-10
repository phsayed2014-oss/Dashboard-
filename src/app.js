/* ╔═══════════════════════════════════════════════════════════════════╗
   ║                  PharmaDash — الإدارة التجارية              ║
   ║                                          ║
   ╠═══════════════════════════════════════════════════════════════════╣
   ║  📑 فهرس الأقسام — للبحث السريع عن أي وظيفة                         ║
   ║                                                                     ║
   ║  ── الأساسيات (Core) ──                                            ║
   ║   • aggregate()          → تجميع البيانات من الصفوف                ║
   ║   • renderActive()       → توجيه التبويبات (أهم دالة)              ║
   ║   • renderBranchPicker() → اختيار الفرع                            ║
   ║                                                                     ║
   ║  ── العرض الرئيسي (Main Views) ──                                  ║
   ║   • renderOverview()     → الصفحة الرئيسية (نظرة عامة مدموجة)      ║
   ║   • renderDocs()         → جدول الأطباء                            ║
   ║   • renderDrugs()        → جدول الأدوية                            ║
   ║   • renderSecs()         → التخصصات                                ║
   ║   • renderFeatured()     → منتجات Private Label                    ║
   ║   • renderTargeted()     → أصناف أوفرستوك                       ║
   ║                                                                     ║
   ║  ── التحليلات المتقدمة (Analytics) ──                              ║
   ║   • renderPareto()       → باريتو 80/20                            ║
   ║   • renderSpecialty()    → تحليل التخصصات                          ║
   ║   • renderLoyalty()      → ولاء الأطباء                            ║
   ║   • renderBasket()       → Doctor Dependency Risk                  ║
   ║   • renderTrends()       → اتجاه الأطباء                           ║
   ║   • renderDrugIntel()    → تحليل الأدوية (رحلة الدواء)             ║
   ║                                                                     ║
   ║  ── المتابعة الميدانية (Field Tools) ──                           ║
   ║   • renderTargetTrack()  → متابعة أصناف الأوفرستوك عبر الزمن               ║
   ║                                                                     ║
   ║  ── المقارنات (Comparisons) ──                                     ║
   ║   • renderCompare()      → مقارنة الفروع                           ║
   ║   • renderTimeComp()     → المقارنة الزمنية                        ║
   ║                                                                     ║
   ║  ── النظام (System) ──                                             ║
   ║   • doLogin()            → تسجيل الدخول                            ║
   ║   • saveData()           → الحفظ التلقائي (يشمل الفترات)           ║
   ║   • loadSavedData()      → استعادة البيانات                        ║
   ║                                                                     ║
   ║  لإضافة قسم جديد:                                               ║
   ║   1. اكتب دالة renderXXX()                                         ║
   ║   2. أضف سطر في renderActive():  if(at==='xxx')renderXXX();return; ║
   ║   3. أضف عنصر sidebar + panel في الـ HTML                          ║
   ║   4. أضف 'xxx' لقائمة noBranch لو القسم يجمع كل الفروع             ║
   ╚═══════════════════════════════════════════════════════════════════╝ */

/* ── CANVAS BG ── */
(function(){
  const cv=document.getElementById('bgCanvas'),ctx=cv.getContext('2d');
  let W,H,orbs=[],raf=0,running=false;
  const COLS=['#6c63ff','#00d4a0','#ff4d6d','#d97706','#06b6d4','#7c3aed'];
  function resize(){W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;}
  function init(){orbs=COLS.map((col,i)=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*300+180,col,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,phase:i*(Math.PI*2/COLS.length)}));}
  function draw(){
    if(!running)return;
    ctx.clearRect(0,0,W,H);
    orbs.forEach(o=>{
      o.x+=o.vx+Math.sin(Date.now()*.0003+o.phase)*.3;o.y+=o.vy+Math.cos(Date.now()*.0004+o.phase)*.3;
      if(o.x<-o.r) o.x=W+o.r;if(o.x>W+o.r) o.x=-o.r;if(o.y<-o.r) o.y=H+o.r;if(o.y>H+o.r) o.y=-o.r;
      const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r);g.addColorStop(0,o.col+'55');g.addColorStop(1,o.col+'00');
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    });raf=requestAnimationFrame(draw);
  }
  function start(){if(running||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;running=true;draw();}
  function stop(){running=false;if(raf)cancelAnimationFrame(raf);raf=0;}
  resize();init();start();
  window.addEventListener('resize',debounce(()=>{resize();init();},150));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
})();

/* ── PRIVATE LABEL PRODUCTS ── */
const PRIVATE_LABEL=[
  {key:'reflex',    name:'Reflex',      form:'Massage Emulgel · 100ML',cls:'pp1'},{key:'rizer',     name:'Rizer',       form:'Apply Cream · 75ML',     cls:'pp2'},{key:'oracure',   name:'Oracure',     form:'Mouth Wash · 300ML',     cls:'pp3'},{key:'intimo',    name:'Intimo',      form:'Vaginal Wash · 250ML',   cls:'pp4'},{key:'nostriderm',name:'Nostriderm',  form:'Ointment · 50ML',        cls:'pp5'},{key:'nostricure',name:'Nostricure',  form:'Oral Gel · 30ML',        cls:'pp6'},
];
function phraseMatch(value,phrase){
  const text=PharmaCore.normalizeProductText(value),target=PharmaCore.normalizeProductText(phrase);
  if(!text||!target)return false;
  return (' '+text+' ').includes(' '+target+' ') || text.replace(/\s/g,'').includes(target.replace(/\s/g,''));
}
function findPrivateLabelProduct(service){return PRIVATE_LABEL.find(p=>phraseMatch(service,p.key))||null;}

const BRANCHES=['T1','T2','T3'];
const BRANCH_LABELS={T1:'التعاون الأول',T2:'التعاون الثاني',T3:'التعاون الثالث'};
const STATE={data:{T1:null,T2:null,T3:null},active:null,periods:{T1:[],T2:[],T3:[]},quality:{T1:null,T2:null,T3:null}};
function readEmbeddedBusiness(key){
  const value=window.__PHARMADASH_SHARED__&&window.__EMBEDDED_RX__?.business?.[key];
  if(value==null)return null;
  try{return JSON.parse(JSON.stringify(value));}catch(_){return null;}
}
function saveEmbeddedBusiness(key,value){
  if(!window.__PHARMADASH_SHARED__||!window.__EMBEDDED_RX__)return false;
  if(!window.__EMBEDDED_RX__.business)window.__EMBEDDED_RX__.business={};
  window.__EMBEDDED_RX__.business[key]=JSON.parse(JSON.stringify(value));
  return true;
}
/* التابات التي تجمع كل الفروع ولا تحتاج مُنتقي الفرع */
const NO_BRANCH_TABS=['featured','targeted','compare','timecomp','pareto','loyalty','basket','trends','drugintel','targettrack','nearexpiry','pureherb','dailytrack','agedmeds'];
let _pendingBranch=null,_pendingMode=null; /* upload state */
const _uploadVersion={T1:0,T2:0,T3:0};
let _dtUploadVersion=0;
function cancelActiveUploads(){
  BRANCHES.forEach(branch=>{_uploadVersion[branch]++;_upHide(branch);});
  _dtUploadVersion++;
}
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
const SOURCE_TEMPLATE=(function(){let h='<!DOCTYPE html>\n'+document.documentElement.outerHTML;const o='<scr'+'ipt id="embedded-rx-data">',c='<'+'/scr'+'ipt>';const i=h.indexOf(o);if(i>=0){const j=h.indexOf(c,i);if(j>=0) h=h.substring(0,i)+h.substring(j+c.length);}return h;})();

/* Live Clock */
(function(){
  const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const months=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  function updateClock(){
    const d=new Date();
    const el=document.getElementById('todayDate');
    if(!el) return;
    const hh=String(d.getHours()).padStart(2,'0');
    const mm=String(d.getMinutes()).padStart(2,'0');
    const ss=String(d.getSeconds()).padStart(2,'0');
    el.innerHTML=
      '<span>'+days[d.getDay()]+' '+d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear()+'</span>'+
      '<span class="dot-sep">●</span>'+
      '<span style="font-variant-numeric:tabular-nums;letter-spacing:.5px;">'+hh+':'+mm+':'+ss+'</span>'+
      '<span class="dot-sep">●</span>'+
      '<span>الإدارة التجارية - قطاع الصيدليات</span>';
  }
  updateClock();
  setInterval(updateClock,1000);
})();

/* Theme */
if((localStorage.getItem('rx-theme')||'light')==='light') document.documentElement.setAttribute('data-theme','light');
setTimeout(function(){if(typeof updateThemeIcon==='function')updateThemeIcon();},100);


const fmt=n=>(n==null||isNaN(n))?'—':Number(n).toLocaleString('en-US');
/* debounce — يؤخّر تنفيذ الدالة حتى يتوقف المستخدم عن الكتابة (يمنع تجمّد المتصفح) */
function debounce(fn,wait){let t;return function(...args){clearTimeout(t);t=setTimeout(()=>fn.apply(this,args),wait||250);};}
const pct=(a,b)=>b>0?(a*100/b):0;
const PALETTE=['#6c63ff','#00d4a0','#ff4d6d','#d97706','#06b6d4','#7c3aed','#db2777','#3b82f6','#84cc16','#ef4444','#f59e0b','#22d3ee','#6d28d9','#f472b6','#14b8a6','#60a5fa'];
let charts={};

function toast(msg,type){type=type||'success';const t=document.getElementById('toast'),i=document.getElementById('toastIco'),m=document.getElementById('toastMsg');t.className='toast show '+type;i.textContent=type==='success'?'✓':(type==='error'?'✕':'ℹ');m.textContent=msg;setTimeout(()=>t.classList.remove('show'),3500);}
const lb=document.getElementById('loadingBar');let _loadCount=0;
function showLoad(){_loadCount++;lb.classList.add('show');lb.setAttribute('aria-hidden','false');}
function hideLoad(){_loadCount=Math.max(0,_loadCount-1);if(!_loadCount){lb.classList.remove('show');lb.setAttribute('aria-hidden','true');}}
const modalBg=document.getElementById('modalBg'),modalBody=document.getElementById('modalBody');
let _appShellUnlocked=false,_blockingUiOpen=false,_mobileSidebarOpen=false;
function syncAppShellAccessibility(unlocked){
  if(typeof unlocked==='boolean')_appShellUnlocked=unlocked;
  const sidebar=document.getElementById('mainSidebar'),main=document.getElementById('mainContent'),login=document.getElementById('loginScreen');
  const shellBlocked=!_appShellUnlocked||_blockingUiOpen;
  if(sidebar)sidebar.toggleAttribute('inert',shellBlocked);
  if(main)main.toggleAttribute('inert',shellBlocked||_mobileSidebarOpen);
  if(login){
    login.toggleAttribute('inert',_appShellUnlocked);
    login.setAttribute('aria-hidden',String(_appShellUnlocked));
  }
  document.getElementById('skipLink')?.setAttribute('tabindex',_appShellUnlocked?'0':'-1');
}
function setBlockingUi(open){_blockingUiOpen=!!open;syncAppShellAccessibility();}
let _modalReturnFocus=null;
function openModal(label){
  if(!modalBg.classList.contains('show'))_modalReturnFocus=document.activeElement;
  const dialog=modalBg.querySelector('[role="dialog"]');
  if(label)dialog.setAttribute('aria-label',label);
  modalBg.classList.add('show');modalBg.setAttribute('aria-hidden','false');
  setBlockingUi(true);
  requestAnimationFrame(()=>document.getElementById('modalClose').focus());
}
function closeModal(){
  if(!modalBg.classList.contains('show'))return;
  if(modalBody.querySelector('#dtDropZone'))_dtUploadVersion++;
  modalBg.classList.remove('show');modalBg.setAttribute('aria-hidden','true');
  modalBg.querySelector('.modal')?.classList.remove('wide');
  destroyChartsWithin(modalBg);
  setBlockingUi(false);
  if(_modalReturnFocus&&document.contains(_modalReturnFocus))_modalReturnFocus.focus();
  _modalReturnFocus=null;
}
function trapDialogTab(event,container){
  if(event.key!=='Tab')return;
  const focusable=[...container.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden&&el.getClientRects().length);
  if(!focusable.length){event.preventDefault();container.focus?.();return;}
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}
document.getElementById('modalClose').onclick=closeModal;
modalBg.addEventListener('click',e=>{if(e.target===modalBg)closeModal();});
document.addEventListener('keydown',e=>{
  const login=document.getElementById('loginScreen');
  if(!_appShellUnlocked){
    if(e.key==='Tab')trapDialogTab(e,login);
    return;
  }
  if(!modalBg.classList.contains('show')){
    const share=document.getElementById('plShareOverlay')||document.getElementById('phShareOverlay');
    const period=document.getElementById('periodPopup');
    if(e.key==='Escape'){
      if(document.getElementById('plShareOverlay'))closePLShareCard();
      else if(document.getElementById('phShareOverlay'))closePHShareCard();
      else if(period?.classList.contains('open'))cancelAddPeriod();
      else if(_mobileSidebarOpen)closeSidebar();
    }
    else if(share)trapDialogTab(e,share);
    else if(period?.classList.contains('open'))trapDialogTab(e,period);
    return;
  }
  if(e.key==='Escape'){e.preventDefault();closeModal();return;}
  trapDialogTab(e,modalBg);
});
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escapeAttr(s){return escapeHtml(s).replace(/'/g,'&#39;');}
/* أرقام المرضى قد تتكرر بين أنظمة الفروع؛ لذلك الهوية المجمعة = الفرع + الرقم. */
function patientIdentityKey(branch,patient){
  const id=PharmaCore.normalizeWhitespace(patient);
  return id?branch+'|'+id:'';
}
function entityKey(value){return PharmaCore.normalizeEntityKey(value);}
function sameEntity(a,b){return entityKey(a)===entityKey(b);}
function rankBadge(i){const c=i===0?'gold':(i===1?'silver':(i===2?'bronze':'normal'));return '<span class="rank '+c+'">'+(i+1)+'</span>';}
function barRow(v,m){const p=m>0?(v*100/m):0;return '<div class="bar-cell"><div class="bar" style="width:'+p+'%;"></div><div class="v">'+p.toFixed(1)+'%</div></div>';}
function enhanceAccessibility(root){
  const base=root&&root.querySelectorAll?root:document;
  const interactive=[...(base.matches?.('tr.clickable,[onclick]:not(button):not(a):not(input):not(select)')?[base]:[]),...base.querySelectorAll('tr.clickable,[onclick]:not(button):not(a):not(input):not(select)')];
  interactive.forEach(el=>{
    if(el.dataset.a11yReady)return;
    el.dataset.a11yReady='1';el.setAttribute('role','button');el.tabIndex=0;
    el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();el.click();}});
  });
  base.querySelectorAll('th:not([scope])').forEach(th=>th.setAttribute('scope','col'));
  base.querySelectorAll('input:not([aria-label]),select:not([aria-label])').forEach(el=>{const label=el.placeholder||el.title;if(label)el.setAttribute('aria-label',label.replace(/[🔎📅]/gu,'').trim());});
  base.querySelectorAll('svg:not([aria-hidden])').forEach(svg=>svg.setAttribute('aria-hidden','true'));
  base.querySelectorAll('canvas:not([role])').forEach(canvas=>{canvas.setAttribute('role','img');const title=canvas.closest('.card')?.querySelector('.card-title')?.textContent?.trim();canvas.setAttribute('aria-label',title||'رسم بياني للبيانات المعروضة');});
  base.querySelectorAll('.panel').forEach(panel=>{panel.setAttribute('role','region');panel.setAttribute('aria-hidden',panel.classList.contains('active')?'false':'true');});
}
enhanceAccessibility(document);
new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)enhanceAccessibility(node);}))).observe(document.body,{childList:true,subtree:true});
document.querySelector('nav[aria-label="التنقل الرئيسي"]')?.addEventListener('keydown',event=>{
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const items=[...document.querySelectorAll('.sb-nav-item')],current=items.indexOf(document.activeElement);if(current<0)return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?items.length-1:(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
  items[next].focus();
});

BRANCHES.forEach(b=>{
  const btn=document.querySelector('[data-upload="'+b+'"]'),inp=document.getElementById('file-'+b);
  const card=document.querySelector('.branch-card[data-branch="'+b+'"]');

  // Click to upload
  btn.onclick=()=>{_pendingMode=null;_pendingBranch=null;restorePeriodFocus();inp.click();};

  // Drag & Drop
  card.addEventListener('dragover',e=>{e.preventDefault();e.stopPropagation();card.classList.add('dragover');});
  card.addEventListener('dragleave',e=>{if(!card.contains(e.relatedTarget)) card.classList.remove('dragover');});
  card.addEventListener('drop',e=>{
    e.preventDefault();e.stopPropagation();
    card.classList.remove('dragover');
    const file=e.dataTransfer.files[0];
    if(file){
      if(_pendingMode==='period'&&_pendingBranch===b){
        const label=inp._pendingLabel||'فترة '+(STATE.periods[b].length+1);
        inp._pendingLabel=null;_pendingMode=null;_pendingBranch=null;restorePeriodFocus();
        handlePeriodFile(b,label,file);
      } else {
        handleFile(b,file);
      }
    }
  });

  inp.onchange=e=>{
    if(!e.target.files[0]) return;
    const file=e.target.files[0];
    inp.value='';
    if(_pendingMode==='period'&&_pendingBranch===b){
      const label=inp._pendingLabel||'فترة '+(STATE.periods[b].length+1);
      inp._pendingLabel=null;_pendingMode=null;_pendingBranch=null;restorePeriodFocus();
      handlePeriodFile(b,label,file);
    } else {
      handleFile(b,file);
    }
  };
  inp.addEventListener('cancel',()=>{
    if(_pendingMode==='period'&&_pendingBranch===b){
      inp._pendingLabel=null;_pendingMode=null;_pendingBranch=null;restorePeriodFocus();
    }
  });
});

async function handleFile(branch,file){
  const version=++_uploadVersion[branch];
  _upShow(branch, file.name);
  showLoad();
  try{
    let rows;const ext=validateUploadFile(file);
    const parseOptions={shouldCancel:()=>version!==_uploadVersion[branch],onProgress:p=>_upSet(branch,15+Math.round(p*40))};
    await _upTick(branch,15);
    if(ext==='.xlsx'||ext==='.xls')rows=await parseExcel(file,parseOptions);
    else if(ext==='.csv')rows=await parseCSV(file,parseOptions);
    else rows=await parsePDF(file,parseOptions);
    if(version!==_uploadVersion[branch])return;
    await _upTick(branch,60);
    validateParsedRows(rows);
    const prepared=await aggregateAsync(rows,p=>_upSet(branch,60+Math.round(p*25)),()=>version!==_uploadVersion[branch]);
    if(version!==_uploadVersion[branch])return;
    await _upTick(branch,85);
    if(version!==_uploadVersion[branch])return;
    setBranchData(branch,rows,file.name,'',prepared);
    if(!STATE.active) STATE.active=branch;
    await _upTick(branch,100);
    setTimeout(()=>{if(version===_uploadVersion[branch])_upHide(branch);},500);
    renderAll();
    saveData();
    const q=STATE.quality[branch];
    toast('✓ '+BRANCH_LABELS[branch]+' — '+fmt(rows.length)+' وصفة'+(q?' · جودة '+q.score+'%':''));
    if(q&&q.warnings.length)setTimeout(()=>toast('راجع لوحة جودة البيانات: '+q.warnings[0],'warn'),900);
  }catch(e){
    if(version===_uploadVersion[branch]){console.error(e);_upHide(branch);toast(e.message||'فشل القراءة','error');}
  }finally{hideLoad();}
}
/* Upload progress helpers — pure DOM, no HTML strings */
function _upShow(b,name){
  const el=document.getElementById('uprog-'+b);
  if(!el) return;
  const nm=document.getElementById('uprog-'+b+'-name');
  const fill=document.getElementById('uprog-'+b+'-fill');
  const pct=document.getElementById('uprog-'+b+'-pct');
  if(nm) nm.textContent=(name||'').slice(0,35)||'جاري المعالجة...';
  if(fill) fill.style.width='0%';
  if(pct) pct.textContent='0%';
  el.setAttribute('aria-valuenow','0');
  el.classList.add('show');
}
function _upTick(b,v){
  return new Promise(r=>{
    _upSet(b,v);
    setTimeout(r,80);
  });
}
function _upSet(b,v){
  const value=Math.max(0,Math.min(100,Math.round(v))),overlay=document.getElementById('uprog-'+b),fill=document.getElementById('uprog-'+b+'-fill'),pct=document.getElementById('uprog-'+b+'-pct');
  if(fill)fill.style.width=value+'%';
  if(pct)pct.textContent=value+'%';
  overlay?.setAttribute('aria-valuenow',String(value));
}
function _upHide(b){
  const el=document.getElementById('uprog-'+b);
  if(el){el.classList.remove('show');el.setAttribute('aria-valuenow','0');}
}
function setBranchData(branch,rows,name,date,preparedAggregate){
  const d=preparedAggregate||aggregate(rows);d.rows=rows;d.reportName=name;d.reportDate=date;STATE.data[branch]=d;
  invalidateGlobalSearch();
  STATE.quality[branch]=PharmaCore.assessRows(rows,rows._parseMeta||{});
  const meta=document.getElementById('meta-'+branch);meta.className='meta status-loaded';meta.textContent='✓ '+fmt(rows.length)+' وصفة · '+name.slice(0,40);
  document.querySelector('.branch-card[data-branch="'+branch+'"]').classList.add('has-data');
  const btn=document.querySelector('[data-upload="'+branch+'"]');btn.textContent='🔄 إعادة';btn.classList.add('reupload');
  /* sync periods */
  const lbl=name.replace(/\.[^.]+$/,'').slice(0,30)||'البيانات الرئيسية';
  const ei=STATE.periods[branch].findIndex(p=>p._main);
  const en={id:Date.now(),label:lbl,rows,data:d,parseMeta:rows._parseMeta||null,_main:true};
  if(ei>=0) STATE.periods[branch][ei]=en; else STATE.periods[branch].unshift(en);
  /* مصدر الحقيقة واحد: كل اللوحات تعرض أحدث فترة زمنياً، لا آخر عملية رفع فقط. */
  if(typeof rebuildBranchFromPeriods==='function') rebuildBranchFromPeriods(branch);
  if(typeof _restoreBranchUI==='function') _restoreBranchUI(branch);
  if(typeof renderPeriodBadges==='function') renderPeriodBadges(branch);
}
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
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const buf=await file.arrayBuffer();throwIfCancelled(options);
  const loadingTask=pdfjsLib.getDocument({data:buf});
  let pdf=null;
  try{
    pdf=await loadingTask.promise;throwIfCancelled(options);
    if(pdf.numPages>PharmaCore.MAX_PDF_PAGES)throw new Error('عدد صفحات PDF أكبر من الحد المدعوم (1,000 صفحة)');
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
      for(const sequence of sequences){
        for(let start=0;start<sequence.length;start++){
          for(let size=1;size<=Math.min(4,sequence.length-start);size++){
            const words=sequence.slice(start,start+size),text=words.map(word=>word.s).join(' ');
            if(re.test(text))return{x:words.reduce((sum,word)=>sum+word.x,0)/words.length};
          }
        }
      }
      return null;
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
        if(isHeaderLine(ws))continue;
        const cells={
          patient:joinCell(ws,cols.patient),
          patientName:joinCell(ws,cols.patientName),
          service:joinCell(ws,cols.service),
          orderNo:joinCell(ws,cols.orderNo),
          status:joinCell(ws,cols.status),
          doctorSection:joinCell(ws,cols.doctorSection),
          section:joinCell(ws,cols.section),
        };
        const patientToken=normalizeDigits(cells.patient).replace(/\s+/g,'');
        if(patientToken){
          finalizePending();
          if(!/^[\p{L}\p{N}][\p{L}\p{N}._/-]{0,31}$/u.test(patientToken)){sourceRows++;rejectedRows++;continue;}
          pending={...cells,patient:patientToken,lastY:line.y};
          continue;
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

/* التنقل يتم عبر الشريط الجانبي (sidebarNav)؛ مستمعو #tabs القديمة أُزيلوا */

function renderBranchPicker(){
  const box=document.getElementById('branchPicker');const loaded=BRANCHES.filter(b=>STATE.data[b]);
  if(!STATE.active&&loaded.length) STATE.active=loaded[0];
  box.innerHTML=BRANCHES.map(b=>{const has=!!STATE.data[b],isActive=b===STATE.active;return '<button class="btn" data-pick="'+b+'" '+(has?'':'disabled')+' style="'+(isActive?'background:var(--grad-p);color:#fff;border-color:transparent;':'')+'">'+BRANCH_LABELS[b]+(has?' ✓':'')+'</button>';}).join('');
  box.querySelectorAll('[data-pick]').forEach(btn=>{btn.onclick=()=>{STATE.active=btn.dataset.pick;renderBranchPicker();updateDataContext();renderActive();};});
}
function updateDataContext(){
  const el=document.getElementById('dataContext');if(!el)return;
  const loaded=BRANCHES.filter(b=>STATE.data[b]);if(!loaded.length){el.textContent='لا توجد بيانات';el.title='';return;}
  const aggregateScope=NO_BRANCH_TABS.includes(window._activePanel||'overview');
  if(aggregateScope){
    const labels=loaded.map(b=>periodOldestNewest(STATE.periods[b]||[]).newest?.label).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
    const total=loaded.reduce((sum,b)=>sum+(STATE.data[b]?.totalRows||0),0);
    el.textContent='كل الفروع · '+(labels.join(' / ')||'أحدث فترة')+' · '+fmt(total)+' وصفة';
  }else{
    const b=STATE.active&&STATE.data[STATE.active]?STATE.active:loaded[0],latest=periodOldestNewest(STATE.periods[b]||[]).newest;
    el.textContent=BRANCH_LABELS[b]+' · '+(latest?.label||STATE.data[b].reportName||'أحدث فترة')+' · '+fmt(STATE.data[b].totalRows)+' وصفة';
  }
  el.title=el.textContent;
}
function renderDataQualityPanel(){
  const panel=document.getElementById('dataQualityPanel');if(!panel)return;
  const branches=BRANCHES.filter(b=>STATE.data[b]&&STATE.quality[b]);
  if(!branches.length){panel.hidden=true;panel.innerHTML='';return;}
  panel.hidden=false;
  const sourceLabels={pdf:'PDF',excel:'Excel',csv:'CSV',saved:'محفوظ',unknown:'غير محدد'};
  panel.innerHTML=`
    <div class="dq-head">
      <div><div style="font-size:13px;font-weight:900;">جودة البيانات بعد الرفع</div><div style="font-size:10px;color:var(--text-muted);margin-top:3px;">راجع التحذيرات قبل مشاركة الأرقام أو اتخاذ قرار</div></div>
      <button class="btn" type="button" onclick="downloadDataQualityReport()">تنزيل تقرير الجودة</button>
    </div>
    <div class="dq-grid">${branches.map(b=>{
      const q=STATE.quality[b],cls=q.score>=90?'good':q.score>=70?'warn':'bad';
      return `<article class="dq-branch">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div><b style="font-size:12px;">${BRANCH_LABELS[b]}</b><div style="font-size:9px;color:var(--text-muted);margin-top:2px;">${sourceLabels[q.source]||escapeHtml(q.source)}${q.pages?' · '+q.pages+' صفحة':''}</div></div>
          <span class="dq-score ${cls}" title="درجة اكتمال وجودة البيانات">${q.score}%</span>
        </div>
        <div class="dq-metrics">
          <div class="dq-metric"><b>${fmt(q.acceptedRows)}</b><span>مقبول</span></div>
          <div class="dq-metric"><b>${fmt(q.rejectedRows)}</b><span>مرفوض</span></div>
          <div class="dq-metric"><b>${fmt(q.duplicates)}</b><span>مكرر</span></div>
        </div>
        ${q.warnings.length?`<ul class="dq-warnings">${q.warnings.slice(0,4).map(w=>`<li>${escapeHtml(w)}</li>`).join('')}</ul>`:'<div style="font-size:10px;color:var(--teal-l);margin-top:8px;">✓ لا توجد مشاكل رئيسية مكتشفة</div>'}
        ${q.duplicates?`<button class="btn" type="button" style="margin-top:8px;width:100%;font-size:10px;" onclick="removeExactDuplicates('${b}')">إزالة التكرار التام (${fmt(q.duplicates)})</button>`:''}
      </article>`;
    }).join('')}</div>`;
}
function downloadDataQualityReport(){
  const report={generatedAt:new Date().toISOString(),branches:{}};
  BRANCHES.forEach(b=>{if(STATE.quality[b])report.branches[b]=STATE.quality[b];});
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pharmadash-data-quality-'+PharmaCore.localDateKey()+'.json';
  document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href);},1000);
}
function removeExactDuplicates(branch){
  const latest=PharmaCore.selectPeriodRange(STATE.periods[branch]||[]).newest;if(!latest)return;
  const result=PharmaCore.deduplicateExactRows(latest.rows||[]);if(!result.removed){toast('لا يوجد تكرار تام');return;}
  if(!confirm('سيتم حذف '+result.removed+' صف مكرر تماماً من أحدث فترة في '+BRANCH_LABELS[branch]+'. متابعة؟'))return;
  latest.rows=result.rows;latest.data=aggregate(result.rows);
  rebuildBranchFromPeriods(branch);renderAll();saveData();
  toast('تم حذف '+result.removed+' صف مكرر');
}
function renderAll(){
  renderBranchPicker();
  renderDataQualityPanel();
  updateDataContext();
  renderActive();
  updateSummaryBar();
  setTimeout(()=>document.querySelectorAll('tbody').forEach(tb=>{
    [...tb.querySelectorAll('tr')].forEach((tr,i)=>{tr.style.animationDelay=Math.min(i*10,180)+'ms';tr.classList.add('row-animate');});
  }),60);
}
/* ══════════════════════════════════════════
   SECTION: قسم الأدوية آجل — مقارنة أول 6 أشهر 2025/2026
   مصدر البيانات: تقرير "التعاون - المجمعات الثلاثة - مدمج بالتخصص"
   (بيانات ثابتة مُستخرجة ومُدقَّقة يدويًا — ليست من رفع ملف Oracle)
══════════════════════════════════════════ */
const AGEDMEDS_KEY = 'pharmdash_agedmeds_v1';
const AGEDMEDS_DEFAULT = {
  months: ['يناير','فبراير','مارس','أبريل','مايو','يونيو'],
  y2025: {
    T1: [1135979,1028298,917551,1085674,1094024,879284],
    T2: [429455,386933,333147,415888,391615,323443],
    T3: [145145,132920,117940,125151,126656,100746]
  },
  y2026: {
    T1: [970771,907554,810618,972413,881684,890640],
    T2: [425180,390494,355893,443495,401348,391121],
    T3: [112755,109078,97881,106537,94487,96426]
  },
  june2026Confirmed: 1378187,
  specialties2025: [["الطب العام",2419631],["الباطنة",2394220],["العظام",759043],["الاطفال",757865],["العيون",444877],["الانف والاذن",387332],["النسا والولادة",343652],["النفسية",311816],["الجلدية",306911],["الاسنان",279427]],
  specialties2026: [["الطب العام",1866550],["الباطنة",1755057],["العظام",697791],["الاطفال",539580],["العيون",418948],["الانف والاذن",284985],["النسا والولادة",283150],["الجلدية",261722],["النفسية",218604],["المسالك",179390]]
};
let AGEDMEDS_DATA = loadAgedMedsData();

function loadAgedMedsData(){
  const embedded=readEmbeddedBusiness('agedMeds');
  if(embedded&&embedded.y2025&&embedded.y2026&&embedded.months)return embedded;
  try{
    const raw = localStorage.getItem(AGEDMEDS_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && parsed.y2025 && parsed.y2026 && parsed.months) return parsed;
    }
  }catch(e){}
  return JSON.parse(JSON.stringify(AGEDMEDS_DEFAULT));
}
function saveAgedMedsData(data){
  AGEDMEDS_DATA = data;
  if(saveEmbeddedBusiness('agedMeds',data))return;
  try{ localStorage.setItem(AGEDMEDS_KEY, JSON.stringify(data)); }catch(e){}
}
function parseAgedMedsNum(v){
  return Math.max(0, Math.round(parseFloat(String(v).replace(/[^\d.]/g,''))||0));
}
function syncAgedMedsJuneConfirmed(){
  AGEDMEDS_DATA.june2026Confirmed = agedMedsTotals('y2026')[5];
}
function agedMedsInputStyle(){
  return 'width:100%;min-width:72px;max-width:110px;padding:4px 8px;text-align:left;direction:ltr;font-family:Inter,Alexandria,sans-serif;font-size:12px;font-weight:700;background:var(--bg-glass2);border:1px solid rgba(37,99,235,.25);border-radius:6px;color:var(--text);';
}
function agedMedsCell(year, branch, monthIdx){
  const v = AGEDMEDS_DATA[year][branch][monthIdx];
  const label=(year==='y2025'?'2025':'2026')+' '+AGEDMEDS_DATA.months[monthIdx]+' '+branch;
  return '<td class="num" style="padding:4px 6px;"><input type="text" inputmode="numeric" class="agedmeds-inp" aria-label="'+escapeAttr(label)+'" value="'+v+'" onchange="updateAgedMedsCell(\''+year+'\',\''+branch+'\','+monthIdx+',this.value)" onkeydown="if(event.key===\'Enter\'){this.blur();}" style="'+agedMedsInputStyle()+'"></td>';
}
function agedMedsSpecialtyNames(){
  const names=new Map();
  [...(AGEDMEDS_DATA.specialties2025||[]),...(AGEDMEDS_DATA.specialties2026||[])].forEach(row=>{const key=entityKey(row[0]);if(key&&!names.has(key))names.set(key,row[0]);});
  return [...names.values()];
}
function agedMedsSpecCell(year, specIdx, value, name){
  return '<td class="num" style="padding:4px 6px;"><input type="text" inputmode="numeric" class="agedmeds-inp" aria-label="'+escapeAttr(name+' '+year.slice(1))+'" value="'+value+'" onchange="updateAgedMedsSpec(\''+year+'\','+specIdx+',this.value)" onkeydown="if(event.key===\'Enter\'){this.blur();}" style="'+agedMedsInputStyle()+'"></td>';
}
function updateAgedMedsCell(year, branch, monthIdx, raw){
  AGEDMEDS_DATA[year][branch][monthIdx] = parseAgedMedsNum(raw);
  if(year==='y2026' && monthIdx===5) syncAgedMedsJuneConfirmed();
  saveAgedMedsData(AGEDMEDS_DATA);
  renderAgedMeds();
}
function updateAgedMedsSpec(year, specIdx, raw){
  const n = parseAgedMedsNum(raw);
  const name=agedMedsSpecialtyNames()[specIdx],list=AGEDMEDS_DATA[year==='y2025'?'specialties2025':'specialties2026'];
  const match=list.find(function(row){return sameEntity(row[0],name);});
  if(match)match[1]=n;
  else list.push([name,n]);
  saveAgedMedsData(AGEDMEDS_DATA);
  renderAgedMeds();
}
function resetAgedMedsData(){
  if(!confirm('استعادة الأرقام الافتراضية؟ سيتم حذف كل التعديلات المحفوظة.')) return;
  AGEDMEDS_DATA = JSON.parse(JSON.stringify(AGEDMEDS_DEFAULT));
  saveAgedMedsData(AGEDMEDS_DATA);
  renderAgedMeds();
  toast('تمت استعادة الأرقام الافتراضية ✓');
}

function agedMedsTotals(year){
  const d = AGEDMEDS_DATA[year];
  return AGEDMEDS_DATA.months.map((_,i)=> d.T1[i]+d.T2[i]+d.T3[i]);
}

function renderAgedMeds() {
  AGEDMEDS_DATA = loadAgedMedsData();
  const container = document.getElementById('agedmeds-content');
  const m = AGEDMEDS_DATA.months;
  const tot25 = agedMedsTotals('y2025');
  const tot26 = agedMedsTotals('y2026');
  const sum25 = tot25.reduce((a,b)=>a+b,0);
  const sum26 = tot26.reduce((a,b)=>a+b,0);
  const growth = ((sum26-sum25)/sum25*100);
  const growthColor = growth>=0 ? 'var(--teal-l)' : 'var(--rose-l)';
  const growthSign = growth>=0 ? '+' : '';

  const branchSum25 = {T1:AGEDMEDS_DATA.y2025.T1.reduce((a,b)=>a+b,0),T2:AGEDMEDS_DATA.y2025.T2.reduce((a,b)=>a+b,0),T3:AGEDMEDS_DATA.y2025.T3.reduce((a,b)=>a+b,0)};
  const branchSum26 = {T1:AGEDMEDS_DATA.y2026.T1.reduce((a,b)=>a+b,0),T2:AGEDMEDS_DATA.y2026.T2.reduce((a,b)=>a+b,0),T3:AGEDMEDS_DATA.y2026.T3.reduce((a,b)=>a+b,0)};

  const branchRows = ['T1','T2','T3'].map(function(b){
    const g = ((branchSum26[b]-branchSum25[b])/branchSum25[b]*100);
    const gc = g>=0 ? 'var(--teal-l)' : 'var(--rose-l)';
    return '<tr><td style="font-weight:800;">'+b+'</td><td class="num">'+fmt(branchSum25[b])+'</td><td class="num">'+fmt(branchSum26[b])+'</td><td class="num" style="color:'+gc+';font-weight:800;">'+(g>=0?'+':'')+g.toFixed(1)+'%</td></tr>';
  }).join('');

  const monthRows = m.map(function(name,i){
    const v25=tot25[i], v26=tot26[i];
    const g=((v26-v25)/v25*100);
    const gc = g>=0 ? 'var(--teal-l)' : 'var(--rose-l)';
    const isJune = (i===5);
    return '<tr'+(isJune?' style="background:rgba(217,119,6,.07);"':'')+'>'+
      '<td style="font-weight:700;">'+name+(isJune?' <span class="tag amber" style="font-size:9px;margin-right:4px;">مُدخَل يدوي</span>':'')+'</td>'+
      agedMedsCell('y2025','T1',i)+agedMedsCell('y2025','T2',i)+agedMedsCell('y2025','T3',i)+'<td class="num" style="font-weight:800;">'+fmt(v25)+'</td>'+
      agedMedsCell('y2026','T1',i)+agedMedsCell('y2026','T2',i)+agedMedsCell('y2026','T3',i)+'<td class="num" style="font-weight:800;">'+fmt(v26)+'</td>'+
      '<td class="num" style="color:'+gc+';font-weight:800;">'+(g>=0?'+':'')+g.toFixed(1)+'%</td></tr>';
  }).join('');

  const specRows = agedMedsSpecialtyNames().map(function(name, idx){
    const match25=AGEDMEDS_DATA.specialties2025.find(function(row){return sameEntity(row[0],name);});
    const match26=AGEDMEDS_DATA.specialties2026.find(function(row){return sameEntity(row[0],name);});
    const v25=match25?match25[1]:0,v26=match26?match26[1]:0;
    const g = v25>0 ? ((v26-v25)/v25*100) : 0;
    const gc = g>=0 ? 'var(--teal-l)' : 'var(--rose-l)';
    return '<tr><td style="font-weight:700;">'+escapeHtml(name)+'</td>'+agedMedsSpecCell('y2025',idx,v25,name)+agedMedsSpecCell('y2026',idx,v26,name)+'<td class="num" style="color:'+gc+';font-weight:800;">'+(g>=0?'+':'')+g.toFixed(1)+'%</td></tr>';
  }).join('');

  container.innerHTML =
    '<div class="card" style="margin-bottom:16px;">'+
      '<div class="card-head"><div class="card-title"><span class="dot"></span> الأدوية آجل — مقارنة أول 6 أشهر (2025 مقابل 2026)</div>'+
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+
          '<span class="tag amber" style="font-size:10px;">✏️ الأرقام قابلة للتعديل</span>'+
          '<button type="button" onclick="resetAgedMedsData()" style="padding:6px 12px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);color:var(--text-muted);font-weight:700;font-size:11px;cursor:pointer;font-family:inherit;">↺ استعادة الافتراضي</button>'+
        '</div></div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">'+
        '<div style="background:linear-gradient(135deg,rgba(37,99,235,.12),rgba(37,99,235,.04));border:1px solid rgba(37,99,235,.3);border-radius:var(--r-lg);padding:18px;text-align:center;">'+
          '<div style="font-size:11px;font-weight:800;color:var(--violet-l);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">إجمالي H1 2025</div>'+
          '<div style="font-size:30px;font-weight:900;font-family:\'Inter\',\'Alexandria\',sans-serif;color:var(--violet-l);">'+fmt(sum25)+'</div>'+
          '<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">ريال — يناير إلى يونيو</div>'+
        '</div>'+
        '<div style="background:linear-gradient(135deg,rgba(13,148,136,.12),rgba(13,148,136,.04));border:1px solid rgba(13,148,136,.3);border-radius:var(--r-lg);padding:18px;text-align:center;">'+
          '<div style="font-size:11px;font-weight:800;color:var(--teal-l);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">إجمالي H1 2026</div>'+
          '<div style="font-size:30px;font-weight:900;font-family:\'Inter\',\'Alexandria\',sans-serif;color:var(--teal-l);">'+fmt(sum26)+'</div>'+
          '<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">ريال — يناير إلى يونيو</div>'+
        '</div>'+
        '<div style="background:linear-gradient(135deg,rgba(217,119,6,.12),rgba(217,119,6,.04));border:1px solid rgba(217,119,6,.3);border-radius:var(--r-lg);padding:18px;text-align:center;">'+
          '<div style="font-size:11px;font-weight:800;color:var(--amber-l);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">الفرق</div>'+
          '<div style="font-size:30px;font-weight:900;font-family:\'Inter\',\'Alexandria\',sans-serif;color:'+growthColor+';">'+fmt(sum26-sum25)+'</div>'+
          '<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">ريال</div>'+
        '</div>'+
        '<div style="background:linear-gradient(135deg,rgba(220,38,38,.12),rgba(220,38,38,.04));border:1px solid rgba(220,38,38,.3);border-radius:var(--r-lg);padding:18px;text-align:center;">'+
          '<div style="font-size:11px;font-weight:800;color:var(--rose-l);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">نسبة النمو</div>'+
          '<div style="font-size:30px;font-weight:900;font-family:\'Inter\',\'Alexandria\',sans-serif;color:'+growthColor+';">'+growthSign+growth.toFixed(1)+'%</div>'+
          '<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">2026 مقابل 2025</div>'+
        '</div>'+
      '</div>'+
      '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;margin-bottom:20px;">'+
        '<div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;">📊 الاتجاه الشهري — إجمالي الفروع الثلاثة</div>'+
        '<div style="position:relative;height:280px;"><canvas id="agedMedsChart"></canvas></div>'+
      '</div>'+
      '<div class="grid-2" style="gap:16px;margin-bottom:20px;">'+
        '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">'+
          '<div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;">🏢 إجمالي H1 حسب الفرع</div>'+
          '<table><thead><tr><th>الفرع</th><th>2025</th><th>2026</th><th>النمو</th></tr></thead><tbody>'+branchRows+'</tbody></table>'+
        '</div>'+
        '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">'+
          '<div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;">💊 أعلى التخصصات مساهمة (H1)</div>'+
          '<div style="max-height:220px;overflow-y:auto;"><table><thead><tr><th>التخصص</th><th>2025</th><th>2026*</th><th>النمو</th></tr></thead><tbody>'+specRows+'</tbody></table></div>'+
          '<div style="font-size:10px;color:var(--text-dim);margin-top:8px;">* 2026 يشمل يناير–مايو فقط (تفصيل يونيو بالتخصص غير متاح بعد)</div>'+
        '</div>'+
      '</div>'+
      '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">'+
        '<div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">📋 التفصيل الشهري الكامل</div>'+
        '<div style="overflow-x:auto;"><table><thead><tr><th rowspan="2" style="vertical-align:middle;">الشهر</th><th colspan="4" style="text-align:center;">2025</th><th colspan="4" style="text-align:center;">2026</th><th rowspan="2" style="vertical-align:middle;">النمو</th></tr><tr><th>T1</th><th>T2</th><th>T3</th><th>إجمالي</th><th>T1</th><th>T2</th><th>T3</th><th>إجمالي</th></tr></thead><tbody>'+monthRows+'</tbody></table></div>'+
        '<div style="font-size:10.5px;color:var(--text-dim);margin-top:10px;line-height:1.7;">'+
          '✏️ اضغط على أي رقم في الجدول لتعديله — التغييرات تُحفظ تلقائيًا وتُحدَّث الإجماليات والرسم.<br>'+
          '✓ يونيو 2026: الأرقام مُدخَلة يدويًا (إجمالي: '+fmt(AGEDMEDS_DATA.june2026Confirmed)+' ريال). ملفات الوصفات المرفوعة لا تحتوي مبالغ المبيعات، لذلك لا تستبدل هذه القيم تلقائيًا.<br>'+
          'ملحوظة: عمود "الأدوية" في التقرير الأصلي يمثل بالكامل الجزء "الآجل" من الإيراد (تم التحقق حسابيًا من أن اجمالي الايراد مع/بدون أدوية آجل يتطابقان تمامًا مع طرح هذا العمود).'+
        '</div>'+
      '</div>'+
    '</div>';

  setTimeout(function(){
    destroyChart('agedMedsChart');
    const ctx = document.getElementById('agedMedsChart');
    if(!ctx) return;
    const c = chartColors();
    charts['agedMedsChart'] = new Chart(ctx,{
      type:'bar',
      data:{
        labels:m,
        datasets:[
          {label:'2025',data:tot25,backgroundColor:'rgba(124,58,237,.55)',borderColor:'#7c3aed',borderWidth:1,borderRadius:6},
          {label:'2026',data:tot26,backgroundColor:'rgba(13,148,136,.65)',borderColor:'#0d9488',borderWidth:1,borderRadius:6}
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'top',labels:{color:c.text,font:{family:'IBM Plex Sans Arabic',size:12}}},tooltip:tt(c)},
        scales:{
          x:{ticks:{color:c.text,font:{family:'IBM Plex Sans Arabic',size:11}},grid:{display:false}},
          y:{ticks:{color:c.text,font:{family:'Inter',size:11},callback:function(v){return fmt(v);}},grid:{color:c.grid}}
        }
      }
    });
  },40);
}


function renderActive(){
  const at=window._activePanel||(document.querySelector('.tab.active')?.dataset.panel)||'overview';
  /* ── SECTION ROUTING: panels that don't need branch picker ── */
  document.getElementById('branchPickerCard').style.display=NO_BRANCH_TABS.includes(at)?'none':'block';

  /* ── NO-BRANCH panels ── */
  if(at==='featured'){renderFeatured();return;} /* FIX: تجديد كل كروت القسم عند الفتح بما فيها الجدول المجمّع */
  if(at==='targeted'){renderTargeted();return;}
  if(at==='compare'){renderCompare();return;}
  if(at==='timecomp'){renderTimeComp();return;}
/* ── SECTION 10: Pareto Analysis ── */

  if(at==='pareto'){renderPareto();return;}
  /* ── SECTION 12: Doctor Loyalty ── */
  if(at==='loyalty'){renderLoyalty();return;}
  /* ── SECTION 13: Drug Basket ── */
  if(at==='basket'){renderBasket();return;}
  /* ── SECTION 14: Alerts Center ── */
  /* ── SECTION 15: Doctor Trend Analysis ── */
  if(at==='targettrack'){renderTargetTrack();return;}
  if(at==='drugintel'){renderDrugIntel();return;}
  if(at==='nearexpiry'){renderNearExpiry();return;}
    if(at==='pureherb'){renderPureHerb();return;}
  if(at==='dailytrack'){renderDailyTrack();return;}
  if(at==='trends'){renderTrends();return;}
  if(at==='agedmeds'){renderAgedMeds();return;}
  /* ── SECTION 16: AI Smart Recommendations ── */

  /* ── BRANCH-DEPENDENT panels ── */
  const loadedBranches = BRANCHES.filter(b=>STATE.data[b]);
  let d = STATE.active ? STATE.data[STATE.active] : null;
  // نظرة عامة: لو مفيش فرع نشط، استخدم أول فرع متاح (تعمل كصفحة مجمّعة)
  if(!d && at==='overview' && loadedBranches.length) d = STATE.data[loadedBranches[0]];
  if(!d){
    const el=document.getElementById(at+'-content');
    if(el)el.innerHTML='<div class="card"><div class="no-data"><div><div class="ico">📤</div><h2>ارفع أول ملف لبدء التحليل</h2><p style="color:var(--text-dim)">اضغط على زرار "رفع" بجانب أي فرع</p></div></div></div>';
    return;
  }
  /* ── SECTION 1: Overview (الصفحة الرئيسية المدموجة) ── */
  if(at==='overview')renderOverview(d);
  /* ── SECTION 5: Doctors ── */
  else if(at==='doctors')renderDoctorsHub(d);
  /* ── SECTION 6: Drugs ── */
  else if(at==='drugs')renderDrugsHub(d);
  /* ── SECTION 7: Sections ── */
  else if(at==='sections')renderSectionsHub(d);
  /* ── Visit Card ── */
  else if(at==='visitcard')renderVisitCard(d);
  var _bDoc=document.getElementById('badgeDoctors')||document.getElementById('sb-badge-doctors');
  var _bDrg=document.getElementById('badgeDrugs')||document.getElementById('sb-badge-drugs');
  var _bSec=document.getElementById('badgeSections')||document.getElementById('sb-badge-sections');
  if(_bDoc)_bDoc.textContent=fmt(d.doctors.length);
  if(_bDrg)_bDrg.textContent=fmt(d.drugs.length);
  if(_bSec)_bSec.textContent=fmt(d.sections.length);
}

/* ══════════════════════════════════════════
   GAUGE — مقياس نصف دائري لمعدل الصرف
   ───────────────────────────────────────────
   لتعديل حدود النسب والألوان والتقييم،
      عدّل في GAUGE_BANDS أدناه فقط.
══════════════════════════════════════════ */
const GAUGE_BANDS = [
  { upTo: 75,  color: '#dc2626', label: 'يحتاج تحسين' },   // 0–75 أحمر
  { upTo: 90,  color: '#d97706', label: 'أداء جيد' },       // 75–90 برتقالي
  { upTo: 100, color: '#0d9488', label: 'أداء ممتاز' },     // 90–100 أخضر
];

function gaugeSVG(pct){
  pct = Math.max(0, Math.min(100, pct));
  /* حلقة دائرية بسيطة (stroke-dasharray) — مضمونة 100% */
  const band = GAUGE_BANDS.find(b=>pct<=b.upTo) || GAUGE_BANDS[GAUGE_BANDS.length-1];
  const R=70, C=2*Math.PI*R, dash=(pct/100)*C;
  const sz=170;
  return `
    <div style="text-align:center;flex-shrink:0;">
      <svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
        <circle cx="${sz/2}" cy="${sz/2}" r="${R}" fill="none" stroke="var(--border)" stroke-width="16"/>
        <circle cx="${sz/2}" cy="${sz/2}" r="${R}" fill="none" stroke="${band.color}" stroke-width="16"
          stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${(C-dash).toFixed(1)}"
          transform="rotate(-90 ${sz/2} ${sz/2})" style="transition:stroke-dasharray .6s ease;"/>
        <text x="${sz/2}" y="${sz/2-4}" fill="${band.color}" font-size="38" font-weight="900" text-anchor="middle" dominant-baseline="middle" font-family="Inter,Alexandria,sans-serif">${pct.toFixed(0)}%</text>
        <text x="${sz/2}" y="${sz/2+24}" fill="var(--text-muted)" font-size="12" text-anchor="middle" dominant-baseline="middle">معدل الصرف</text>
      </svg>
      <div style="font-size:13px;font-weight:800;color:${band.color};margin-top:6px;">${band.label}</div>
    </div>`;
}

/* ── Hero النظرة العامة ── */
function injectOverviewHero(d){
  try{
    var c = document.getElementById('overview-content');
    if(!c || !d) return;
    var old = document.getElementById('pdHero');
    if(old) old.remove();
    var hr = new Date().getHours();
    var greet = (hr < 12) ? 'صباح الخير' : (hr < 17) ? 'مساء الخير' : 'مساء النور';
    var dateStr;
    try{ dateStr = new Date().toLocaleDateString('ar-EG-u-nu-latn',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }
    catch(e){ dateStr = new Date().toLocaleDateString('en-GB'); }
    var rows = d.rows || [];
    var pl = 0;
    for(var i=0;i<rows.length;i++){
      var s = rows[i].service; if(!s) continue;
      if(findPrivateLabelProduct(s))pl++;
    }
    var h = '<div class="pd-hero" id="pdHero">'
      + '<div class="pd-hero-hi">' + greet + '، د. السيد 👋</div>'
      + '<div class="pd-hero-date">' + dateStr + ' · ' + BRANCH_LABELS[STATE.active] + '</div>'
      + '<div class="pd-hero-chips">'
      + '<span class="pd-chip">📝 الكتابات <b style="color:var(--violet-l);">' + fmt(rows.length) + '</b></span>'
      + '<span class="pd-chip">⭐ كتابات PL <b style="color:var(--teal-l);">' + fmt(pl) + '</b></span>'
      + '<span class="pd-chip">👨‍⚕️ الأطباء <b style="color:#d97706;">' + fmt((d.doctors||[]).length) + '</b></span>'
      + '</div></div>';
    c.insertAdjacentHTML('afterbegin', h);
  }catch(e){}
}
function renderOverview(d){
  renderOverviewCore(d);
  injectOverviewHero(d);
}
function renderOverviewCore(d){
  const avg=d.doctors.length?Math.round(d.totalRows/d.doctors.length):0;const top=d.doctors[0];

  /* ── Global aggregate across all branches ── */
  const loaded=BRANCHES.filter(b=>STATE.data[b]);
  const globalDocMap=new Map(),globalDrugMap=new Map(),globalSecMap=new Map(),globalPatientSet=new Set();
  let globalTotal=0;
  loaded.forEach(b=>{
    const bd=STATE.data[b];globalTotal+=bd.totalRows;
    bd.doctors.forEach(doc=>{const k=entityKey(doc.name);let g=globalDocMap.get(k)||{name:doc.name,total:0};g.total+=doc.total;globalDocMap.set(k,g);});
    bd.drugs.forEach(dr=>{const k=entityKey(dr.name);let g=globalDrugMap.get(k)||{name:dr.name,total:0};g.total+=dr.total;globalDrugMap.set(k,g);});
    bd.sections.forEach(s=>{const k=entityKey(s.name);let g=globalSecMap.get(k)||{name:s.name,total:0};g.total+=s.total;globalSecMap.set(k,g);});
    (bd.rows||[]).forEach(r=>{const k=patientIdentityKey(b,r.patient);if(k)globalPatientSet.add(k);});
  });
  const globalDocs=[...globalDocMap.values()].sort((a,b)=>b.total-a.total);
  const globalDrugs=[...globalDrugMap.values()].sort((a,b)=>b.total-a.total);
  const globalSecs=[...globalSecMap.values()].sort((a,b)=>b.total-a.total);
  const isMulti=loaded.length>1;

  /* ── Trend: compare across periods ── */
  const trendBranch=isMulti?null:(STATE.active&&STATE.data[STATE.active]?STATE.active:(loaded[0]||null));
  function getPeriodTrend(branch,fn){
    const range=periodOldestNewest(STATE.periods[branch]||[]);
    if(!range.oldest||!range.newest||range.oldest===range.newest)return null;
    const a=fn(range.oldest.data),b2=fn(range.newest.data);
    return a>0?((b2-a)/a*100).toFixed(1):null;
  }
  function trendBadge(val){
    if(val===null)return '';
    const n=parseFloat(val),cls=n>0?'up':n<0?'dn':'eq',arrow=n>0?'↑':n<0?'↓':'→';
    return `<div class="kpi-trend ${cls}">${arrow} ${Math.abs(n)}%</div>`;
  }

  /* ── Sparkline data ── */
  function sparkPts(branch,fn){const p=PharmaCore.sortPeriods(STATE.periods[branch]||[]);return p.length>=2?p.map(x=>fn(x.data)):[];}
  const sp1=trendBranch?sparkPts(trendBranch,x=>x.totalRows):[];
  const sp2=trendBranch?sparkPts(trendBranch,x=>x.doctors.length):[];

  const scopeTag=isMulti
    ?`<span class="tag" style="background:rgba(0,212,160,.12);color:var(--teal-l);font-size:10px;border:1px solid rgba(0,212,160,.25);margin-right:8px;">مجمّع كل الفروع</span>`
    :`<span class="tag" style="background:rgba(37,99,235,.12);color:var(--violet-l);font-size:10px;border:1px solid rgba(37,99,235,.25);margin-right:8px;">${BRANCH_LABELS[STATE.active]}</span>`;

  const items=[
    {cls:'k1',ico:'Rx',label:'إجمالي الكتابات',val:fmt(isMulti?globalTotal:d.totalRows),foot:isMulti?'كل الفروع':BRANCH_LABELS[STATE.active],
      trend:trendBranch?getPeriodTrend(trendBranch,x=>x.totalRows):null,spark:'sp-1'},{cls:'k2',ico:'Dr',label:'عدد الأطباء',val:fmt(isMulti?globalDocMap.size:d.doctors.length),foot:'أطباء كتبوا وصفات',
      trend:trendBranch?getPeriodTrend(trendBranch,x=>x.doctors.length):null,spark:'sp-2'},{cls:'k3',ico:'Md',label:'الأدوية الفريدة',val:fmt(isMulti?globalDrugMap.size:d.drugs.length),foot:'صنف مختلف',trend:null,spark:null},{cls:'k4',ico:'Dp',label:'الأقسام',val:fmt(isMulti?globalSecMap.size:d.sections.length),foot:'قسم/تخصص',trend:null,spark:null},{cls:'k5',ico:'Pt',label:'المرضى',val:fmt(isMulti?globalPatientSet.size:d.totalPatients),foot:isMulti?'مريض/فرع فريد':'مريض فريد',trend:null,spark:null},{cls:'k6',ico:'Av',label:'متوسط/طبيب',val:fmt(avg),foot:top?'الأعلى: '+top.name.slice(0,22):'—',trend:null,spark:null}
  ];

  const kpis='<div class="kpi-grid">'+items.map(it=>`
    <div class="kpi ${it.cls}">
      <div class="kpi-head"><div class="kpi-label">${it.label}</div><div class="kpi-ico" style="font-size:11px;font-weight:800;letter-spacing:-.5px;">${it.ico}</div></div>
      <div class="kpi-value" data-raw="${it.val.replace(/[^0-9]/g,'')}">${it.val}</div>
      ${it.trend?trendBadge(it.trend):''}
      <div class="kpi-foot">${escapeHtml(it.foot)}</div>
      ${it.spark?`<div class="kpi-sparkline"><canvas id="${it.spark}"></canvas></div>`:''}
    </div>`).join('')+'</div>';

  const ch='<div class="grid-2">'
    +'<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> أعلى 10 أطباء '+scopeTag+'</div>'
    +'<div class="view-toggle"><button class="vt-btn active" onclick="switchDocView(\'bar\',this)">بار</button><button class="vt-btn" onclick="switchDocView(\'bubble\',this)">فقاعات</button></div>'
    +'</div><div id="docChartWrap"><div class="chart-box"><canvas id="cTopDocs"></canvas></div></div></div>'
    +'<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> أعلى 10 أدوية '+scopeTag+'</div></div><div class="chart-box"><canvas id="cTopDrugs"></canvas></div></div>'
    +'</div><div class="grid-2">'
    +'<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> توزيع الأقسام '+scopeTag+'</div></div><div class="chart-box"><canvas id="cSecs"></canvas></div></div>'
    +'<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> توزيع الحالات</div></div><div class="chart-box"><canvas id="cStatus"></canvas></div></div>'
    +'</div>';

  /* ── إضافات مدموجة من الصفحة الرئيسية ── */
  // Status Strip
  const _lastUpd = new Date().toLocaleString('ar-EG',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'});
  const _totPeriods = loaded.reduce((s,b)=>s+(STATE.periods[b]||[]).length,0);
  // اسم الفترة المعروضة (للفرع المعروض حالياً)
  let _shownPeriod = '';
  if (_totPeriods > 0) {
    const _sb = isMulti ? loaded[0] : (STATE.active || loaded[0]);
    const _ps = STATE.periods[_sb] || [];
    if (_ps.length) {
      const _range = periodOldestNewest(_ps);
      _shownPeriod = _range.newest ? _range.newest.label : '';
    }
  }
  // dropdown اختيار الفرع المعروض
  const _branchDropdown = `<select onchange="if(this.value==='all'){STATE.active=null;}else{STATE.active=this.value;} renderBranchPicker&&renderBranchPicker(); renderActive();"
      style="padding:5px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);color:var(--text);font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;">
      <option value="all" ${!STATE.active?'selected':''}>كل الفروع</option>
      ${loaded.map(b=>`<option value="${b}" ${STATE.active===b?'selected':''}>${escapeHtml(BRANCH_LABELS[b]||b)}</option>`).join('')}
    </select>`;
  const statusStrip = `
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:10px 18px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:14px;font-size:12px;">
      <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;color:var(--teal-l);">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--teal);box-shadow:0 0 8px var(--teal);"></span>البيانات محمّلة
      </span>
      <span style="color:var(--text-muted);">|</span>
      <span style="color:var(--text-dim);font-weight:700;">تعرض:</span>
      ${_branchDropdown}
      ${_shownPeriod?`<span class="pill bg-action c-action" style="font-size:11px;">📅 ${escapeHtml(_shownPeriod)}</span>`:''}
      <span style="color:var(--text-muted);">|</span>
      <span style="color:var(--text-dim);">👨‍⚕️ ${fmt(globalDocMap.size)} طبيب${isMulti?' (إجمالي)':''}</span>
      ${_totPeriods>1?`<span style="color:var(--text-dim);">📅 ${fmt(_totPeriods)} فترات (للمقارنة)</span>`:''}
      <span style="margin-right:auto;color:var(--text-muted);font-size:11px;">آخر تحديث: ${_lastUpd}</span>
    </div>`;

  // Conversion Analysis (status across all rows of scope)
  let _closed=0,_canceled=0,_new=0;
  const _scopeRows = isMulti ? loaded.flatMap(b=>STATE.data[b].rows||[]) : (d.rows||[]);
  _scopeRows.forEach(r=>{const u=(r.status||'').toUpperCase();if(u.includes('CLOS'))_closed++;else if(u.includes('CANC'))_canceled++;else if(u.includes('NEW'))_new++;});
  const _conv = (_closed+_canceled)>0?(_closed/(_closed+_canceled)*100).toFixed(1):null;
  const conversionCard = (_closed+_canceled+_new)>0 ? `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-head"><div class="card-title"><span class="dot"></span> حالة الوصفات ومعدل الصرف</div></div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;">
        ${_conv!==null?gaugeSVG(parseFloat(_conv)):''}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
          <div style="background:rgba(13,148,136,.1);border:1px solid rgba(13,148,136,.3);border-radius:var(--r-md);padding:14px;text-align:center;">
            <div style="font-size:11px;font-weight:800;color:var(--teal-l);margin-bottom:6px;">✅ مُغلقة (صُرفت)</div>
            <div style="font-size:24px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--teal-l);">${fmt(_closed)}</div>
          </div>
          <div style="background:rgba(2,132,199,.1);border:1px solid rgba(2,132,199,.3);border-radius:var(--r-md);padding:14px;text-align:center;">
            <div style="font-size:11px;font-weight:800;color:var(--sky-l);margin-bottom:6px;">🆕 جديدة</div>
            <div style="font-size:24px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--sky-l);">${fmt(_new)}</div>
          </div>
          <div style="background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.3);border-radius:var(--r-md);padding:14px;text-align:center;">
            <div style="font-size:11px;font-weight:800;color:var(--rose-l);margin-bottom:6px;">❌ ملغاة</div>
            <div style="font-size:24px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--rose-l);">${fmt(_canceled)}</div>
          </div>
        </div>
      </div>
    </div>` : '';

  // Branch summary (only when multi-branch)
  let branchSummary = '';
  if (isMulti) {
    let rows_bs = '';
    loaded.forEach(b => {
      const bd = STATE.data[b];
      rows_bs += '<div style="padding:12px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:8px;cursor:pointer;" onclick="STATE.active=\''+b+'\';renderBranchPicker();renderActive();">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
        + '<div style="font-size:13px;font-weight:800;">'+escapeHtml(BRANCH_LABELS[b]||b)+'</div>'
        + '<div style="font-size:15px;font-weight:900;font-family:\'Inter\',\'Alexandria\',sans-serif;color:var(--violet-l);">'+fmt(bd.totalRows)+'</div>'
        + '</div>'
        + '<div style="display:flex;gap:14px;font-size:11px;color:var(--text-dim);">'
        + '<span>👨‍⚕️ '+fmt(bd.doctors.length)+' طبيب</span>'
        + '<span>💊 '+fmt(bd.drugs.length)+' صنف</span>'
        + '<span>🧑 '+fmt(bd.totalPatients)+' مريض</span>'
        + '</div></div>';
    });
    branchSummary = '<div class="card" style="margin-bottom:16px;"><div class="card-head"><div class="card-title"><span class="dot"></span> ملخص الفروع</div></div>' + rows_bs + '</div>';
  }

  // Export buttons header
  const exportBar = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
      <div style="font-size:18px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;">نظرة عامة ${scopeTag}</div>
      <div style="display:flex;gap:8px;">
        <button onclick="exportHomePDF()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:rgba(220,38,38,.12);border:1px solid rgba(220,38,38,.3);border-radius:var(--r-md);color:var(--rose-l);font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;">📄 PDF</button>
        <button onclick="exportHomeExcel()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:rgba(13,148,136,.12);border:1px solid rgba(13,148,136,.3);border-radius:var(--r-md);color:var(--teal-l);font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;">📊 Excel</button>
      </div>
    </div>`;

  /* ══════════════════════════════════════════
     لوحة التركيز اليومية — أهم إجراءات الآن
  ══════════════════════════════════════════ */
  let focusPanel = '';
  (function(){
    const dmap = new Map();
    const scopeBranches = isMulti ? loaded : [STATE.active||loaded[0]];
    scopeBranches.forEach(b=>{
      (STATE.data[b]?STATE.data[b].doctors:[]).forEach(doc=>{
        const key=entityKey(doc.name);
        if(!dmap.has(key))dmap.set(key,{name:doc.name,section:doc.section||'—',total:0,pl:0});
        const r=dmap.get(key);r.total+=doc.total;
        (doc.drugs||[]).forEach(dr=>{if(findPrivateLabelProduct(dr.name))r.pl+=dr.count;});
      });
    });
    const allD=[...dmap.values()];
    const golden = allD.filter(d=>d.pl===0 && d.total>=15).sort((a,b)=>b.total-a.total).slice(0,3);
    const grow = allD.filter(d=>d.pl>0 && (d.pl/d.total)<0.1 && d.total>=20).sort((a,b)=>b.total-a.total).slice(0,2);

    if(golden.length || grow.length){
      let cards='';
      golden.forEach(d=>{
        cards+=`<div onclick="showDoctorMulti('${escapeAttr(d.name)}')" style="cursor:pointer;flex:1;min-width:220px;">
          <div class="card-gradient-red" style="padding:18px;border-radius:var(--r-lg);box-shadow:0 8px 28px rgba(220,38,38,.25);">
            <div class="flex-between" style="margin-bottom:10px;">
              <span style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;opacity:.85;">🎯 فرصة ذهبية</span>
              <span class="num-font" style="font-size:26px;font-weight:900;">${fmt(d.total)}</span>
            </div>
            <div style="font-size:14px;font-weight:800;margin-bottom:4px;">${escapeHtml(d.name)}</div>
            <div style="font-size:11px;opacity:.8;">${escapeHtml(d.section)}</div>
            <div style="font-size:11px;font-weight:700;margin-top:10px;opacity:.9;border-top:1px solid rgba(255,255,255,.2);padding-top:8px;">← زُره واعرض عليه البدائل</div>
          </div>
        </div>`;
      });
      grow.forEach(d=>{
        cards+=`<div onclick="showDoctorMulti('${escapeAttr(d.name)}')" style="cursor:pointer;flex:1;min-width:220px;">
          <div class="card-gradient-amber" style="padding:18px;border-radius:var(--r-lg);box-shadow:0 8px 28px rgba(217,119,6,.2);">
            <div class="flex-between" style="margin-bottom:10px;">
              <span style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;opacity:.85;">📈 فرصة رفع</span>
              <span class="num-font" style="font-size:26px;font-weight:900;">${(d.pl/d.total*100).toFixed(0)}%</span>
            </div>
            <div style="font-size:14px;font-weight:800;margin-bottom:4px;">${escapeHtml(d.name)}</div>
            <div style="font-size:11px;opacity:.8;">${escapeHtml(d.section)} · ${fmt(d.pl)} PL من ${fmt(d.total)}</div>
            <div style="font-size:11px;font-weight:700;margin-top:10px;opacity:.9;border-top:1px solid rgba(255,255,255,.2);padding-top:8px;">← نسبة PL منخفضة، فيه مجال</div>
          </div>
        </div>`;
      });
      focusPanel = `
        <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,rgba(219,39,119,.06),rgba(37,99,235,.03));">
          <div class="card-head"><div class="card-title"><span class="dot"></span> ركّز اليوم على</div>
            <span style="font-size:11px;color:var(--text-dim);">أهم فرص Private Label الآن</span>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">${cards}</div>
        </div>`;
    }
  })();



  document.getElementById('overview-content').innerHTML = statusStrip + focusPanel + kpis + conversionCard + ch + branchSummary + exportBar;

  /* Animate counters */
  document.querySelectorAll('.kpi-value[data-raw]').forEach(el=>{
    const target=parseInt(el.dataset.raw)||0;if(!target)return;
    let cur=0;const dur=700,start=performance.now();
    (function tick(now){
      const p=Math.min((now-start)/dur,1);
      const ease=1-Math.pow(1-p,3);
      el.textContent=fmt(Math.round(cur+target*ease));
      if(p<1)requestAnimationFrame(tick);else el.textContent=fmt(target);
    })(performance.now());
  });

  /* Sparklines */
  if(sp1.length>=2)drawSparklineFull('sp-1',sp1,'#2563eb');
  if(sp2.length>=2)drawSparklineFull('sp-2',sp2,'#0d9488');

  /* Anomaly detection */
  const allTotals=d.doctors.map(x=>x.total);
  const docAvg=allTotals.length?allTotals.reduce((a,b)=>a+b,0)/allTotals.length:0;
  if(top&&top.total>docAvg*3&&docAvg>0){
    const kEl=document.querySelector('.kpi.k6 .kpi-foot');
    if(kEl)kEl.innerHTML+=` <span class="anomaly-badge">⚠ قيمة شاذة</span>`;
  }

  const docsData=isMulti?globalDocs.slice(0,10):d.doctors.slice(0,10);
  const drugsData=isMulti?globalDrugs.slice(0,10):d.drugs.slice(0,10);
  const secsData=isMulti?globalSecs.slice(0,12):d.sections.slice(0,12);

  // رسم الـ charts: requestAnimationFrame مزدوج يضمن اكتمال الـ DOM
  const _sc={};(d.rows||[]).forEach(r=>{const k=r.status||'غير محدد';_sc[k]=(_sc[k]||0)+1;});
  const _docsData=docsData, _drugsData=drugsData, _secsData=secsData, _scData=_sc;
  function _drawOverviewCharts(){
    if((window._activePanel||'overview')!=='overview')return;
    ['cTopDocs','cTopDrugs','cSecs','cStatus'].forEach(id=>destroyChart(id));
    drawBar('cTopDocs',_docsData.map(x=>({label:x.name.slice(0,18),v:x.total})),'#6c63ff',i=>showDoctorMulti(_docsData[i].name));
    drawBar('cTopDrugs',_drugsData.map(x=>({label:x.name.slice(0,22),v:x.total})),'#00d4a0',i=>showDrug(_drugsData[i].name));
    drawDoughnut('cSecs',_secsData.map(s=>({label:s.name,v:s.total})));
    drawPolar('cStatus',Object.entries(_scData).map(([k,v])=>({label:k,v})));
  }
  // رسم مزدوج: rAF أول يضمن innerHTML جاهز، rAF تاني يضمن layout
  requestAnimationFrame(()=>requestAnimationFrame(_drawOverviewCharts));

  // Store for bubble toggle
  window._v8DocsData = docsData;
  window._v8DrugsData = drugsData;
}
function chartColors(){const l=document.documentElement.getAttribute('data-theme')==='light';return{text:l?'#1e293b':'#94a3b8',grid:l?'rgba(30,41,59,0.07)':'rgba(255,255,255,0.05)',ttBg:l?'rgba(255,255,255,0.96)':'rgba(10,15,35,0.96)',ttFg:l?'#1e293b':'#e8eeff'};}
if(window.Chart){try{Chart.defaults.font.family="'IBM Plex Sans Arabic',sans-serif";}catch(e){}}
function tt(c){return{backgroundColor:c.ttBg,titleColor:c.ttFg,bodyColor:c.ttFg,borderColor:'rgba(108,99,255,0.35)',borderWidth:1,padding:12,titleFont:{family:'IBM Plex Sans Arabic',weight:'700'},bodyFont:{family:'IBM Plex Sans Arabic'},cornerRadius:10};}
function destroyChart(n){if(charts[n]){try{charts[n].destroy();}catch(e){}delete charts[n];}}
function destroyChartsWithin(root){
  Object.keys(charts).forEach(key=>{const canvas=charts[key]?.canvas;if(canvas&&root?.contains(canvas))destroyChart(key);});
}
function pruneChartsForPanel(panel){
  Object.keys(charts).forEach(key=>{
    const canvas=charts[key]?.canvas;
    if(!canvas?.isConnected){destroyChart(key);return;}
    const owner=canvas.closest?.('.panel');
    if(owner&&owner.id!=='panel-'+panel)destroyChart(key);
  });
}
function setChartSummary(canvas,data){
  const title=canvas.closest('.card')?.querySelector('.card-title')?.textContent?.trim()||'رسم بياني';
  const summary=(data||[]).slice(0,12).map(item=>item.label+': '+fmt(item.v)).join('، ');
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',title+(summary?' — '+summary:''));
}
function drawBar(id,data,color,onClick){
  destroyChart(id);const ctx=document.getElementById(id);if(!ctx) return;const c=chartColors();
  setChartSummary(ctx,data);
  const gctx=ctx.getContext('2d');const grad=gctx.createLinearGradient(0,0,400,0);grad.addColorStop(0,color);grad.addColorStop(1,color+'44');
  charts[id]=new Chart(ctx,{type:'bar',data:{labels:data.map(x=>x.label),datasets:[{data:data.map(x=>x.v),backgroundColor:grad,borderColor:color,borderWidth:1,borderRadius:6,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,onClick:(e,els)=>{if(els&&els.length&&onClick) onClick(els[0].index);},plugins:{legend:{display:false},tooltip:tt(c)},scales:{x:{ticks:{color:c.text,font:{family:'IBM Plex Sans Arabic',size:12}},grid:{color:c.grid}},y:{ticks:{color:c.text,font:{family:'IBM Plex Sans Arabic',size:12}},grid:{color:c.grid}}}}});
}
function drawDoughnut(id,data){
  destroyChart(id);const ctx=document.getElementById(id);if(!ctx) return;const c=chartColors();
  setChartSummary(ctx,data);
  charts[id]=new Chart(ctx,{type:'doughnut',data:{labels:data.map(s=>s.label),datasets:[{data:data.map(s=>s.v),backgroundColor:data.map((_,i)=>PALETTE[i%PALETTE.length]),borderColor:'rgba(0,0,0,0.12)',borderWidth:2,hoverOffset:14}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'right',labels:{color:c.text,font:{family:'IBM Plex Sans Arabic',size:11},boxWidth:11,padding:9}},tooltip:tt(c)}}});
}
function drawPolar(id,data){
  destroyChart(id);const ctx=document.getElementById(id);if(!ctx) return;const c=chartColors();
  setChartSummary(ctx,data);
  charts[id]=new Chart(ctx,{type:'polarArea',data:{labels:data.map(s=>s.label),datasets:[{data:data.map(s=>s.v),backgroundColor:data.map((_,i)=>PALETTE[i%PALETTE.length]+'cc'),borderColor:'rgba(255,255,255,0.08)',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,scales:{r:{ticks:{color:c.text,backdropColor:'transparent'},grid:{color:c.grid},angleLines:{color:c.grid}}},plugins:{legend:{position:'right',labels:{color:c.text,font:{family:'IBM Plex Sans Arabic',size:12}}},tooltip:tt(c)}}});
}
function renderDocs(d){
  const max=d.doctors[0]?d.doctors[0].total:1;
  document.getElementById('doctors-content').innerHTML='<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> الأطباء — '+BRANCH_LABELS[STATE.active]+'</div><input class="input" id="docSearch" placeholder="🔎 ابحث..." style="max-width:280px;"></div><div class="table-wrap" style="max-height:600px;overflow-y:auto;"><table><thead><tr><th style="width:60px;">#</th><th>الطبيب</th><th>القسم</th><th>الكتابات</th><th>الأدوية</th><th>المرضى</th><th style="width:180px;">النسبة</th></tr></thead><tbody id="docTbl"></tbody></table></div><button class="btn table-more" id="docMore" type="button"></button></div>';
  const index=d.doctors.map(row=>({row,key:entityKey(row.name+' '+(row.section||''))}));let current=d.doctors,limit=200;
  function fill(reset){
    if(reset)limit=200;
    const body=document.getElementById('docTbl'),shown=current.slice(0,limit);
    body.innerHTML=shown.map((x,i)=>'<tr class="clickable" data-doc="'+escapeAttr(x.name)+'"><td>'+rankBadge(i)+'</td><td><strong>'+escapeHtml(x.name)+'</strong></td><td><span class="tag blue">'+escapeHtml(x.section||'—')+'</span></td><td class="num">'+fmt(x.total)+'</td><td class="num">'+fmt(x.uniqueDrugs)+'</td><td class="num">'+fmt(x.patients)+'</td><td>'+barRow(x.total,max)+'</td></tr>').join('');
    body.querySelectorAll('tr[data-doc]').forEach(tr=>tr.onclick=()=>showDoctor(tr.dataset.doc));
    const more=document.getElementById('docMore');more.hidden=shown.length>=current.length;more.textContent='عرض المزيد ('+fmt(shown.length)+' من '+fmt(current.length)+')';
  }
  fill(true);
  document.getElementById('docMore').onclick=()=>{limit+=200;fill(false);};
  const search=document.getElementById('docSearch');search.addEventListener('input',debounce(()=>{const q=entityKey(search.value);current=q?index.filter(x=>x.key.includes(q)).map(x=>x.row):d.doctors;fill(true);},220));
}
function renderDrugs(d){
  const max=d.drugs[0]?d.drugs[0].total:1;
  document.getElementById('drugs-content').innerHTML='<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> الأدوية — '+BRANCH_LABELS[STATE.active]+'</div><input class="input" id="drugSearch" placeholder="🔎 ابحث..." style="max-width:280px;"></div><div class="table-wrap" style="max-height:600px;overflow-y:auto;"><table><thead><tr><th style="width:60px;">#</th><th>الدواء</th><th>الكتابات</th><th>الأطباء</th><th>المرضى</th><th style="width:180px;">النسبة</th></tr></thead><tbody id="drugTbl"></tbody></table></div><button class="btn table-more" id="drugMore" type="button"></button></div>';
  const index=d.drugs.map(row=>({row,key:entityKey(row.name)}));let current=d.drugs,limit=200;
  function fill(reset){
    if(reset)limit=200;
    const body=document.getElementById('drugTbl'),shown=current.slice(0,limit);
    body.innerHTML=shown.map((x,i)=>'<tr class="clickable" data-drug="'+escapeAttr(x.name)+'"><td>'+rankBadge(i)+'</td><td><strong>'+escapeHtml(x.name)+'</strong></td><td class="num">'+fmt(x.total)+'</td><td class="num">'+fmt(x.doctorCount)+'</td><td class="num">'+fmt(x.patients)+'</td><td>'+barRow(x.total,max)+'</td></tr>').join('');
    body.querySelectorAll('tr[data-drug]').forEach(tr=>tr.onclick=()=>showDrug(tr.dataset.drug));
    const more=document.getElementById('drugMore');more.hidden=shown.length>=current.length;more.textContent='عرض المزيد ('+fmt(shown.length)+' من '+fmt(current.length)+')';
  }
  fill(true);
  document.getElementById('drugMore').onclick=()=>{limit+=200;fill(false);};
  const search=document.getElementById('drugSearch');search.addEventListener('input',debounce(()=>{const q=entityKey(search.value);current=q?index.filter(x=>x.key.includes(q)).map(x=>x.row):d.drugs;fill(true);},220));
}
function renderSecs(d){
  const max=d.sections[0]?d.sections[0].total:1;
  document.getElementById('sections-content').innerHTML='<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> الأقسام — '+BRANCH_LABELS[STATE.active]+'</div></div><div class="table-wrap"><table><thead><tr><th style="width:60px;">#</th><th>القسم</th><th>الأطباء</th><th>الكتابات</th><th>الأدوية</th><th>المرضى</th><th style="width:180px;">النسبة</th></tr></thead><tbody>'+d.sections.map((s,i)=>'<tr><td>'+rankBadge(i)+'</td><td><strong>'+escapeHtml(s.name)+'</strong></td><td class="num">'+fmt(s.doctors)+'</td><td class="num">'+fmt(s.total)+'</td><td class="num">'+fmt(s.drugs)+'</td><td class="num">'+fmt(s.patients)+'</td><td>'+barRow(s.total,max)+'</td></tr>').join('')+'</tbody></table></div></div>';
}
function renderDocDash(d){
  document.getElementById('docDash-content').innerHTML='<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> لوحة الطبيب — '+BRANCH_LABELS[STATE.active]+'</div><select class="select" id="docPicker" style="max-width:340px;">'+d.doctors.map(x=>'<option>'+escapeHtml(x.name)+'</option>').join('')+'</select></div><div id="docDashBody"></div></div>';
  const sel=document.getElementById('docPicker');sel.onchange=()=>fillDocDash(d,sel.value);if(d.doctors.length) fillDocDash(d,d.doctors[0].name);
}
function fillDocDash(d,name){
  const x=d.doctors.find(z=>sameEntity(z.name,name));if(!x) return;const top=x.drugs.slice(0,15);
  document.getElementById('docDashBody').innerHTML='<div class="detail-grid"><div class="detail-card"><div class="l">القسم</div><div class="v" style="font-size:18px;">'+escapeHtml(x.section||'—')+'</div></div><div class="detail-card"><div class="l">الكتابات</div><div class="v">'+fmt(x.total)+'</div></div><div class="detail-card"><div class="l">الأدوية</div><div class="v">'+fmt(x.uniqueDrugs)+'</div></div><div class="detail-card"><div class="l">المرضى</div><div class="v">'+fmt(x.patients)+'</div></div></div><div class="mini-head"><h3>أعلى 15 دواء يكتبه</h3></div><div class="table-wrap" style="max-height:380px;overflow-y:auto;"><table><thead><tr><th style="width:50px;">#</th><th>الدواء</th><th>الكتابات</th><th>النسبة</th></tr></thead><tbody>'+top.map((y,i)=>'<tr><td>'+rankBadge(i)+'</td><td>'+escapeHtml(y.name)+'</td><td class="num">'+fmt(y.count)+'</td><td class="num">'+pct(y.count,x.total).toFixed(1)+'%</td></tr>').join('')+'</tbody></table></div>';
}
function renderDrugDash(d){
  document.getElementById('drugDash-content').innerHTML='<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> بحث بالدواء — '+BRANCH_LABELS[STATE.active]+'</div><input class="input" id="drugQuery" placeholder="🔎 اكتب اسم الدواء..." style="max-width:340px;"></div><div id="drugDashBody"><div class="empty"><div class="empty-ico">⌕</div><h3>اكتب اسم دواء بالأعلى</h3></div></div></div>';
  document.getElementById('drugQuery').oninput=e=>fillDrugDash(d,e.target.value);
}
function fillDrugDash(d,q){
  const box=document.getElementById('drugDashBody');const ql=q.trim().toLowerCase();
  if(!ql){box.innerHTML='<div class="empty"><div class="empty-ico">⌕</div><h3>اكتب اسم دواء بالأعلى</h3></div>';return;}
  const matches=d.drugs.filter(x=>x.name.toLowerCase().includes(ql)).slice(0,20);
  if(!matches.length){box.innerHTML='<div class="empty"><div class="empty-ico">🚫</div><h3>لا توجد نتائج</h3></div>';return;}
  const top=matches[0],docs=top.doctors.slice(0,10);
  box.innerHTML='<div class="mini-head"><h3>أعلى دواء مطابق: <span class="tag amber">'+escapeHtml(top.name)+'</span></h3></div><div class="detail-grid"><div class="detail-card"><div class="l">الكتابات</div><div class="v">'+fmt(top.total)+'</div></div><div class="detail-card"><div class="l">الأطباء</div><div class="v">'+fmt(top.doctorCount)+'</div></div><div class="detail-card"><div class="l">المرضى</div><div class="v">'+fmt(top.patients)+'</div></div><div class="detail-card"><div class="l">أعلى طبيب</div><div class="v" style="font-size:16px;">'+escapeHtml(docs[0]?docs[0].name:'—')+'</div></div></div><div class="grid-2"><div><div class="mini-head"><h3>أعلى 10 أطباء</h3></div><div class="table-wrap"><table><thead><tr><th style="width:50px;">#</th><th>الطبيب</th><th>الكتابات</th><th>النسبة</th></tr></thead><tbody>'+docs.map((dr,i)=>'<tr class="clickable" data-doc="'+escapeAttr(dr.name)+'"><td>'+rankBadge(i)+'</td><td>'+escapeHtml(dr.name)+'</td><td class="num">'+fmt(dr.count)+'</td><td class="num">'+pct(dr.count,top.total).toFixed(1)+'%</td></tr>').join('')+'</tbody></table></div></div><div><div class="mini-head"><h3>الأدوية المطابقة ('+matches.length+')</h3></div><div class="table-wrap" style="max-height:380px;overflow-y:auto;"><table><thead><tr><th style="width:50px;">#</th><th>الدواء</th><th>الكتابات</th></tr></thead><tbody>'+matches.map((m,i)=>'<tr class="clickable" data-drug="'+escapeAttr(m.name)+'"><td>'+rankBadge(i)+'</td><td>'+escapeHtml(m.name)+'</td><td class="num">'+fmt(m.total)+'</td></tr>').join('')+'</tbody></table></div></div></div>';
  box.querySelectorAll('tr[data-doc]').forEach(tr=>tr.onclick=()=>showDoctor(tr.dataset.doc));
  box.querySelectorAll('tr[data-drug]').forEach(tr=>tr.onclick=()=>showDrug(tr.dataset.drug));
}

/* ══ PRIVATE LABEL RENDER ══ */
/* ══════════════════════════════════════════
   PL SALES TARGET — متابعة هدف مبيعات Private Label
   ───────────────────────────────────────────
   • الهدف الافتراضي: 60,000 ريال (قابل للتعديل)
   • رقم المبيعات المحقق: إدخال يدوي، يُحفظ تلقائياً
   • العرض: gauge + شريط تقدّم + متبقٍ
══════════════════════════════════════════ */
const PL_TARGET_KEY = 'pharmdash_pl_target_v1';

function loadPLTarget(){
  const embedded=readEmbeddedBusiness('plTarget');if(embedded)return embedded;
  try{ const r=localStorage.getItem(PL_TARGET_KEY); if(r) return JSON.parse(r); }catch(e){}
  return { target:60000, achieved:0, month:'مايو 2026', currency:'ريال' };
}
function savePLTarget(t){
  if(saveEmbeddedBusiness('plTarget',t))return;
  try{ localStorage.setItem(PL_TARGET_KEY, JSON.stringify(t)); }catch(e){}
}

function renderPLTarget(){
  const box = document.getElementById('plTargetCard');
  if(!box) return;
  const t = loadPLTarget();
  const pct = t.target>0 ? Math.min(100, (t.achieved/t.target*100)) : 0;
  const remaining = Math.max(0, t.target - t.achieved);
  const over = t.achieved > t.target;
  const pace = plPaceInfo(remaining);

  // لون حسب نسبة التحقيق
  let color, statusLabel;
  if(pct>=100){ color='#0d9488'; statusLabel='🎉 تحقق الهدف!'; }
  else if(pct>=75){ color='#84cc16'; statusLabel='قريب من الهدف'; }
  else if(pct>=50){ color='#d97706'; statusLabel='في المنتصف'; }
  else if(pct>=25){ color='#fb923c'; statusLabel='يحتاج دفعة'; }
  else { color='#dc2626'; statusLabel='البداية'; }

  box.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(219,39,119,.08),rgba(37,99,235,.04));border:1.5px solid rgba(219,39,119,.25);border-radius:var(--r-lg);padding:20px;">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px;margin-bottom:18px;">
        <div>
          <div style="font-size:15px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;display:flex;align-items:center;gap:8px;">
            مستهدف مبيعات Private Label
            <span class="pill bg-pl c-pl" style="font-size:10px;">${escapeHtml(t.month)}</span>
          </div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:3px;">${statusLabel}</div>
        </div>
        <button onclick="editPLTarget()" style="padding:7px 14px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);color:var(--text-muted);font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;">✏️ تعديل الأرقام</button>
      </div>

      <div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:center;">
        <!-- Gauge -->
        <div style="text-align:center;flex-shrink:0;">
          ${plGaugeSVG(pct, color)}
        </div>

        <!-- التفاصيل -->
        <div>
          <!-- شريط التقدّم -->
          <div style="margin-bottom:16px;">
            <div class="flex-between" style="margin-bottom:6px;">
              <span style="font-size:12px;font-weight:700;color:var(--text-muted);">التقدّم نحو الهدف</span>
              <span class="num-font" style="font-size:14px;font-weight:900;color:${color};">${pct.toFixed(1)}%</span>
            </div>
            <div style="height:12px;background:var(--border);border-radius:6px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${color}aa,${color});border-radius:6px;transition:width .6s ease;"></div>
            </div>
          </div>

          <!-- بطاقات المقارنة — Calculator Compare-Card Style -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div class="compare-card compare-card-muted">
              <div>
                <div class="c-title">المحقّق حتى الآن</div>
                <div class="c-price" style="color:var(--teal-l);">${fmt(t.achieved)}</div>
                <div class="c-sub">${escapeHtml(t.currency)}</div>
              </div>
              <div style="font-size:28px;opacity:.2;">✅</div>
            </div>
            <div class="compare-card compare-card-muted">
              <div>
                <div class="c-title">المستهدف الشهري</div>
                <div class="c-price" style="color:var(--text);">${fmt(t.target)}</div>
                <div class="c-sub">${escapeHtml(t.currency)}</div>
              </div>
              <div style="font-size:28px;opacity:.2;">🎯</div>
            </div>
            <div class="compare-card ${over?'card-gradient-teal':'card-gradient-amber'}">
              <div>
                <div class="c-title">${over?'تجاوزت الهدف بـ':'المتبقّي للهدف'}</div>
                <div class="c-price">${fmt(over?t.achieved-t.target:remaining)}</div>
                <div class="c-sub">${over?'احتفل! 🎉':'اقترب أكثر 💪'}</div>
              </div>
              <div style="font-size:28px;opacity:.25;">${over?'🏆':'⚡'}</div>
            </div>
            <div class="compare-card compare-card-muted">
              <div>
                <div class="c-title">المطلوب يومياً للحاق الهدف</div>
                <div class="c-price" style="color:${over?'var(--teal-l)':'#d97706'};">${over?'✓ تم':fmt(Math.ceil(pace.perDay))}</div>
                <div class="c-sub">${pace.days} يوم عمل متبقٍ (بدون الجمعة)</div>
              </div>
              <div style="font-size:28px;opacity:.2;">📆</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

/* gauge نصف دائري للهدف */
function plGaugeSVG(pct, color){
  pct=Math.max(0,Math.min(100,pct));
  /* حلقة دائرية كاملة (stroke-dasharray) — مضمونة 100% */
  const R=64, C=2*Math.PI*R, dash=(pct/100)*C, sz=156;
  return `
    <svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
      <circle cx="${sz/2}" cy="${sz/2}" r="${R}" fill="none" stroke="var(--border)" stroke-width="14"/>
      <circle cx="${sz/2}" cy="${sz/2}" r="${R}" fill="none" stroke="${color}" stroke-width="14"
        stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${(C-dash).toFixed(1)}"
        transform="rotate(-90 ${sz/2} ${sz/2})" style="transition:stroke-dasharray .6s ease;"/>
      <text x="${sz/2}" y="${sz/2-4}" fill="${color}" font-size="34" font-weight="900" text-anchor="middle" dominant-baseline="middle" font-family="Inter,Alexandria,sans-serif">${pct.toFixed(0)}%</text>
      <text x="${sz/2}" y="${sz/2+22}" fill="var(--text-dim)" font-size="11" text-anchor="middle" dominant-baseline="middle">من الهدف</text>
    </svg>`;
}

/* تعديل الأرقام */
function editPLTarget(){
  const t = loadPLTarget();
  const achieved = prompt('رقم المبيعات المحقّق (بالريال):', t.achieved);
  if(achieved===null) return;
  const target = prompt('المستهدف (بالريال):', t.target);
  if(target===null) return;
  const month = prompt('الشهر:', t.month);
  if(month===null) return;
  const nt = {
    target: parseFloat(String(target).replace(/[^\d.]/g,''))||60000,
    achieved: parseFloat(String(achieved).replace(/[^\d.]/g,''))||0,
    month: month||t.month,
    currency: t.currency||'ريال'
  };
  savePLTarget(nt);
  renderPLTarget();
  toast('تم تحديث المستهدف ✓');
}


/* ══════════════════════════════════════════
   مستهدف مبيعات PureHerb — إدخال يدوي، يُحفظ تلقائياً
   نفس نمط مستهدف Private Label (gauge + شريط تقدّم + متبقٍ)
══════════════════════════════════════════ */
const PH_TARGET_KEY = 'pharmdash_ph_target_v1';

function loadPHTarget(){
  const embedded=readEmbeddedBusiness('phTarget');if(embedded)return embedded;
  try{ const r=localStorage.getItem(PH_TARGET_KEY); if(r) return JSON.parse(r); }catch(e){}
  return { target:20000, achieved:0, month:'يونيو 2026', currency:'ريال' };
}
function savePHTarget(t){
  if(saveEmbeddedBusiness('phTarget',t))return;
  try{ localStorage.setItem(PH_TARGET_KEY, JSON.stringify(t)); }catch(e){}
}

function renderPHTarget(){
  const box = document.getElementById('phTargetCard');
  if(!box) return;
  const t = loadPHTarget();
  const pct = t.target>0 ? Math.min(100, (t.achieved/t.target*100)) : 0;
  const remaining = Math.max(0, t.target - t.achieved);
  const over = t.achieved > t.target;
  const pace = plPaceInfo(remaining);

  let color, statusLabel;
  if(pct>=100){ color='#0d9488'; statusLabel='🎉 تحقق الهدف!'; }
  else if(pct>=75){ color='#84cc16'; statusLabel='قريب من الهدف'; }
  else if(pct>=50){ color='#d97706'; statusLabel='في المنتصف'; }
  else if(pct>=25){ color='#fb923c'; statusLabel='يحتاج دفعة'; }
  else { color='#7c3aed'; statusLabel='البداية'; }

  box.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(124,58,237,.08),rgba(109,40,217,.04));border:1.5px solid rgba(124,58,237,.25);border-radius:var(--r-lg);padding:20px;">
      <div class="flex-between" style="flex-wrap:wrap;gap:12px;margin-bottom:18px;">
        <div>
          <div style="font-size:15px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;display:flex;align-items:center;gap:8px;">
            مستهدف مبيعات PureHerb
            <span style="font-size:10px;background:rgba(124,58,237,.12);color:#7c3aed;padding:2px 9px;border-radius:99px;font-weight:800;">${escapeHtml(t.month)}</span>
          </div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:3px;">${statusLabel}</div>
        </div>
        <button onclick="editPHTarget()" style="padding:7px 14px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);color:var(--text-muted);font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;">✏️ تعديل الأرقام</button>
      </div>

      <div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:center;">
        <div style="text-align:center;flex-shrink:0;">
          ${plGaugeSVG(pct, color)}
        </div>
        <div>
          <div style="margin-bottom:16px;">
            <div class="flex-between" style="margin-bottom:6px;">
              <span style="font-size:12px;font-weight:700;color:var(--text-muted);">التقدّم نحو الهدف</span>
              <span class="num-font" style="font-size:14px;font-weight:900;color:${color};">${pct.toFixed(1)}%</span>
            </div>
            <div style="height:12px;background:var(--border);border-radius:6px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${color}aa,${color});border-radius:6px;transition:width .6s ease;"></div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;">
            <div class="compare-card compare-card-muted">
              <div>
                <div class="c-title">المحقّق حتى الآن</div>
                <div class="c-price" style="color:var(--teal-l);">${fmt(t.achieved)}</div>
                <div class="c-sub">${escapeHtml(t.currency)}</div>
              </div>
              <div style="font-size:28px;opacity:.2;">✅</div>
            </div>
            <div class="compare-card compare-card-muted">
              <div>
                <div class="c-title">المستهدف الشهري</div>
                <div class="c-price" style="color:var(--text);">${fmt(t.target)}</div>
                <div class="c-sub">${escapeHtml(t.currency)}</div>
              </div>
              <div style="font-size:28px;opacity:.2;">🎯</div>
            </div>
            <div class="compare-card ${over?'card-gradient-teal':'card-gradient-amber'}">
              <div>
                <div class="c-title">${over?'تجاوزت الهدف بـ':'المتبقّي للهدف'}</div>
                <div class="c-price">${fmt(over?t.achieved-t.target:remaining)}</div>
                <div class="c-sub">${over?'احتفل! 🎉':'اقترب أكثر 💪'}</div>
              </div>
              <div style="font-size:28px;opacity:.25;">${over?'🏆':'⚡'}</div>
            </div>
            <div class="compare-card compare-card-muted">
              <div>
                <div class="c-title">المطلوب يومياً للحاق الهدف</div>
                <div class="c-price" style="color:${over?'var(--teal-l)':'#7c3aed'};">${over?'✓ تم':fmt(Math.ceil(pace.perDay))}</div>
                <div class="c-sub">${pace.days} يوم عمل متبقٍ (بدون الجمعة)</div>
              </div>
              <div style="font-size:28px;opacity:.2;">📆</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function editPHTarget(){
  const t = loadPHTarget();
  const achieved = prompt('رقم مبيعات PureHerb المحقّق (بالريال):', t.achieved);
  if(achieved===null) return;
  const target = prompt('مستهدف مبيعات PureHerb (بالريال):', t.target);
  if(target===null) return;
  const month = prompt('الشهر:', t.month);
  if(month===null) return;
  const nt = {
    target: parseFloat(String(target).replace(/[^\d.]/g,''))||20000,
    achieved: parseFloat(String(achieved).replace(/[^\d.]/g,''))||0,
    month: month||t.month,
    currency: t.currency||'ريال'
  };
  savePHTarget(nt);
  renderPHTarget();
  toast('تم تحديث مستهدف PureHerb ✓');
}


/* ══════════════════════════════════════════
   مقارنة Private Label — بالعدد (تلقائي) + بالمبلغ (يدوي)
══════════════════════════════════════════ */
const PL_AMOUNT_KEY = 'pharmdash_pl_amounts_v1';

function loadPLAmounts(){
  const embedded=readEmbeddedBusiness('plAmounts');if(embedded)return embedded;
  try{ const r=localStorage.getItem(PL_AMOUNT_KEY); if(r){ const a=JSON.parse(r); if(a.unitsBefore===undefined)a.unitsBefore=0; if(a.unitsAfter===undefined)a.unitsAfter=0; return a; } }catch(e){}
  return { before:0, after:0, unitsBefore:0, unitsAfter:0, beforeLabel:'الفترة السابقة', afterLabel:'الفترة الحالية' };
}
function savePLAmounts(a){if(saveEmbeddedBusiness('plAmounts',a))return;try{ localStorage.setItem(PL_AMOUNT_KEY, JSON.stringify(a)); }catch(e){} }

function renderPLComparison(){
  const box = document.getElementById('plComparisonCard');
  if(!box) return;

  const loaded = BRANCHES.filter(b=>STATE.data[b]);

  // الفروع اللي عندها فترتين (للمقارنة بالعدد)
  const eligible = loaded.filter(b => datedComparisonPeriods(STATE.periods[b]).length >= 2);
  // الفرع المختار (افتراضي: الكل لو فيه أكتر من فرع مؤهّل)
  if(window._plCompBranch===undefined) window._plCompBranch = 'all';
  const sel = window._plCompBranch;

  // دالة تجمع المقارنة لفرع واحد أو الكل
  function gather(branchScope){
    const prod = {}; PRIVATE_LABEL.forEach(p=>prod[p.key]={name:p.name,before:0,after:0});
    const beforeLabels=new Set(),afterLabels=new Set();let has=false;
    const branches = branchScope==='all' ? eligible : [branchScope];
    branches.forEach(b=>{
      const periods=datedComparisonPeriods(STATE.periods[b]);if(periods.length<2)return;
      has=true;
      const oldest=periods[0],newest=periods.at(-1);
      beforeLabels.add(oldest.label);afterLabels.add(newest.label);
      PRIVATE_LABEL.forEach(p=>{
        prod[p.key].before+=(oldest.data.drugs||[]).filter(d=>findPrivateLabelProduct(d.name)?.key===p.key).reduce((s,d)=>s+d.total,0);
        prod[p.key].after+=(newest.data.drugs||[]).filter(d=>findPrivateLabelProduct(d.name)?.key===p.key).reduce((s,d)=>s+d.total,0);
      });
    });
    return {prod,beforeLabel:[...beforeLabels].join(' · '),afterLabel:[...afterLabels].join(' · '),has};
  }

  const g = gather(sel);
  const hasPeriods = g.has;
  const prodCompare = g.prod;
  const beforeLabel = g.beforeLabel, afterLabel = g.afterLabel;
  const totalBefore = Object.values(prodCompare).reduce((s,p)=>s+p.before,0);
  const totalAfter = Object.values(prodCompare).reduce((s,p)=>s+p.after,0);
  const countChange = totalBefore>0 ? ((totalAfter-totalBefore)/totalBefore*100) : (totalAfter>0?100:0);

  // المبلغ + الحبات (يدوي)
  const amt = loadPLAmounts();
  const amtChange = amt.before>0 ? ((amt.after-amt.before)/amt.before*100) : (amt.after>0?100:0);
  const unitsChange = amt.unitsBefore>0 ? ((amt.unitsAfter-amt.unitsBefore)/amt.unitsBefore*100) : (amt.unitsAfter>0?100:0);

  // فلتر الفروع
  let branchFilter = '';
  if(eligible.length > 1){
    branchFilter = `<select onchange="window._plCompBranch=this.value;renderPLComparison();" style="padding:6px 12px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);color:var(--text);font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">
      <option value="all" ${sel==='all'?'selected':''}>كل الفروع</option>
      ${eligible.map(b=>`<option value="${b}" ${sel===b?'selected':''}>${escapeHtml(BRANCH_LABELS[b]||b)}</option>`).join('')}
    </select>`;
  }

  // قسم العدد
  let countSection;
  if(hasPeriods){
    const upC = countChange>=0;
    const detailRows = PRIVATE_LABEL.map(p=>prodCompare[p.key]).filter(p=>p.before>0||p.after>0).sort((a,b)=>(b.after-b.before)-(a.after-a.before));
    countSection = `
      <div style="margin-bottom:20px;">
        <div class="flex-between" style="margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <span style="font-size:13px;font-weight:800;">📊 المقارنة بالعدد (كتابات)</span>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            ${branchFilter}
            <span class="pill bg-success" style="font-size:10px;color:var(--teal-l);">${escapeHtml(beforeLabel)}</span>
            <span>←</span>
            <span class="pill bg-action" style="font-size:10px;color:var(--violet-l);">${escapeHtml(afterLabel)}</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">
          <div class="kpi-box-c bg-success"><div class="kpi-label c-success">قبل</div><div class="kpi-num c-success">${fmt(totalBefore)}</div></div>
          <div class="kpi-box-c bg-action"><div class="kpi-label c-action">بعد</div><div class="kpi-num c-action">${fmt(totalAfter)}</div></div>
          <div class="kpi-box-c ${upC?'bg-success':'bg-danger'}"><div class="kpi-label ${upC?'c-success':'c-danger'}">التغيّر</div><div class="kpi-num ${upC?'c-success':'c-danger'}">${upC?'↑':'↓'} ${Math.abs(countChange).toFixed(0)}%</div></div>
        </div>
        ${detailRows.length?`
        <canvas id="plCompChart" height="${Math.max(120, detailRows.length*42)}" style="margin-bottom:14px;max-height:300px;"></canvas>
        <div style="overflow-x:auto;">
          <table>
            <thead><tr><th>المنتج</th><th>قبل</th><th>بعد</th><th>التغيّر</th></tr></thead>
            <tbody>
              ${detailRows.map(p=>{const ch=p.before>0?((p.after-p.before)/p.before*100):(p.after>0?100:0);const up=p.after>=p.before;
                return `<tr><td style="font-weight:700;">${escapeHtml(p.name)}</td><td class="num-font" style="color:var(--text-muted);">${fmt(p.before)}</td><td class="num-font" style="font-weight:800;color:${up?'var(--teal-l)':'var(--rose-l)'};">${fmt(p.after)}</td><td><span style="font-weight:800;color:${up?'var(--teal-l)':'var(--rose-l)'};">${up?'↑':'↓'} ${Math.abs(ch).toFixed(0)}%</span></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`:'<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px;">لا توجد كتابات PL في الفترات</div>'}
      </div>`;
  } else {
    countSection = `<div style="margin-bottom:20px;padding:14px 16px;background:rgba(2,132,199,.06);border:1px solid rgba(2,132,199,.2);border-radius:var(--r-md);"><span style="font-size:12.5px;color:var(--text-dim);line-height:1.6;">📊 <b>المقارنة بالعدد:</b> ارفع فترتين زمنيتين (شهرين) عبر زر "+ فترة" لعرض مقارنة كتابات المنتجات قبل/بعد تلقائياً.</span></div>`;
  }

  // قسم المبلغ + الحبات (يدوي)
  const upA = amtChange>=0, upU = unitsChange>=0;
  const amtSection = `
    <div style="padding-top:18px;border-top:1px solid var(--border);">
      <div class="flex-between" style="margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <span style="font-size:13px;font-weight:800;">💰 المقارنة بالمبلغ والكمية (يدوي)</span>
        <button onclick="editPLAmounts()" style="padding:6px 13px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);color:var(--text-muted);font-weight:700;font-size:11px;cursor:pointer;font-family:inherit;">✏️ تعديل البيانات</button>
      </div>
      <!-- المبلغ -->
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">💵 المبلغ (ريال)</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
        <div class="kpi-box-c bg-success"><div class="kpi-label c-success">${escapeHtml(amt.beforeLabel)}</div><div class="kpi-num c-success">${fmt(amt.before)}</div><div style="font-size:10px;color:var(--text-dim);margin-top:2px;">ريال</div></div>
        <div class="kpi-box-c bg-action"><div class="kpi-label c-action">${escapeHtml(amt.afterLabel)}</div><div class="kpi-num c-action">${fmt(amt.after)}</div><div style="font-size:10px;color:var(--text-dim);margin-top:2px;">ريال</div></div>
        <div class="kpi-box-c ${upA?'bg-success':'bg-danger'}"><div class="kpi-label ${upA?'c-success':'c-danger'}">التغيّر</div><div class="kpi-num ${upA?'c-success':'c-danger'}">${(amt.before>0||amt.after>0)?(upA?'↑':'↓')+' '+Math.abs(amtChange).toFixed(0)+'%':'—'}</div></div>
      </div>
      <!-- الكمية بالحبات -->
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">💊 الكمية المباعة (حبة/عبوة)</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        <div class="kpi-box-c bg-success"><div class="kpi-label c-success">${escapeHtml(amt.beforeLabel)}</div><div class="kpi-num c-success">${fmt(amt.unitsBefore)}</div><div style="font-size:10px;color:var(--text-dim);margin-top:2px;">وحدة</div></div>
        <div class="kpi-box-c bg-action"><div class="kpi-label c-action">${escapeHtml(amt.afterLabel)}</div><div class="kpi-num c-action">${fmt(amt.unitsAfter)}</div><div style="font-size:10px;color:var(--text-dim);margin-top:2px;">وحدة</div></div>
        <div class="kpi-box-c ${upU?'bg-success':'bg-danger'}"><div class="kpi-label ${upU?'c-success':'c-danger'}">التغيّر</div><div class="kpi-num ${upU?'c-success':'c-danger'}">${(amt.unitsBefore>0||amt.unitsAfter>0)?(upU?'↑':'↓')+' '+Math.abs(unitsChange).toFixed(0)+'%':'—'}</div></div>
      </div>
    </div>`;

  box.innerHTML = `
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="dot"></span> مقارنة أداء Private Label</div></div>
      ${countSection}
      ${amtSection}
    </div>`;

  // ارسم الشارت بعد ما الـ canvas يتحط في DOM
  if(hasPeriods){
    const detailRows = PRIVATE_LABEL.map(p=>prodCompare[p.key]).filter(p=>p.before>0||p.after>0).sort((a,b)=>(b.after-b.before)-(a.after-a.before));
    if(detailRows.length){
      setTimeout(()=>{
        const cv=document.getElementById('plCompChart');
        if(!cv||typeof Chart==='undefined'||!cv.closest('.panel')?.classList.contains('active')) return;
        destroyChart('plCompChart');
        charts.plCompChart = new Chart(cv.getContext('2d'),{
          type:'bar',
          data:{
            labels: detailRows.map(p=>p.name),
            datasets:[
              {label:beforeLabel||'قبل', data:detailRows.map(p=>p.before), backgroundColor:'rgba(13,148,136,.55)', borderRadius:5},{label:afterLabel||'بعد', data:detailRows.map(p=>p.after), backgroundColor:'rgba(37,99,235,.85)', borderRadius:5},
            ]
          },
          options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{legend:{labels:{color:'#9aa7c4',font:{family:'IBM Plex Sans Arabic'}}}},
            scales:{
              y:{ticks:{color:'#9aa7c4'},grid:{color:'rgba(255,255,255,.05)'}},
              x:{ticks:{color:'#cbd5e1',font:{family:'IBM Plex Sans Arabic',size:11}},grid:{display:false}}
            }
          }
        });
      },60);
    }
  }
}

function editPLAmounts(){
  const a = loadPLAmounts();
  const beforeLabel = prompt('اسم الفترة السابقة:', a.beforeLabel); if(beforeLabel===null) return;
  const before = prompt('مبلغ مبيعات الفترة السابقة (ريال):', a.before); if(before===null) return;
  const unitsBefore = prompt('الكمية المباعة في الفترة السابقة (حبة/عبوة):', a.unitsBefore); if(unitsBefore===null) return;
  const afterLabel = prompt('اسم الفترة الحالية:', a.afterLabel); if(afterLabel===null) return;
  const after = prompt('مبلغ مبيعات الفترة الحالية (ريال):', a.after); if(after===null) return;
  const unitsAfter = prompt('الكمية المباعة في الفترة الحالية (حبة/عبوة):', a.unitsAfter); if(unitsAfter===null) return;
  const num=v=>parseFloat(String(v).replace(/[^\d.]/g,''))||0;
  const na = {
    before:num(before), after:num(after),
    unitsBefore:num(unitsBefore), unitsAfter:num(unitsAfter),
    beforeLabel:beforeLabel||a.beforeLabel, afterLabel:afterLabel||a.afterLabel
  };
  savePLAmounts(na);
  renderPLComparison();
  toast('تم تحديث بيانات المقارنة ✓');
}


/* ══════════════════════════════════════════
   جدول الأطباء المجمّع — كل طبيب × كل منتجات PL
   لو طبيب كتب أكتر من منتج، تتجمّع في صف واحد
══════════════════════════════════════════ */

/* ════ فلترة الجدول المجمّع + بطاقة المشاركة ════ */
function plAggApply(){
  var st = window._plAgg; if(!st) return;
  var body = document.getElementById('plAggBody'); if(!body) return;
  var qEl = document.getElementById('plAggSearch');
  var pEl = document.getElementById('plAggProd');
  var q = qEl ? qEl.value.trim().toLowerCase() : '';
  var pk = pEl ? pEl.value : '';
  var list = st.docs.filter(function(d){
    if(q && d.name.toLowerCase().indexOf(q) === -1) return false;
    if(pk && !(d.perProduct[pk] > 0)) return false;
    return true;
  });
  if(pk){ list = list.slice().sort(function(a,b){ return (b.perProduct[pk]||0) - (a.perProduct[pk]||0); }); }
  body.innerHTML = plAggRowsHTML(list, st.prodColors, pk);
  var cn = document.getElementById('plAggCount');
  if(cn) cn.textContent = 'عرض ' + list.length + ' من ' + st.docs.length + ' طبيب';
}
function plAggRowsHTML(list, prodColors, pkFilter){
  if(!list.length){
    return '<tr><td colspan="10" style="text-align:center;padding:26px;color:var(--text-muted);">لا توجد نتائج مطابقة للفلتر</td></tr>';
  }
  var h = '';
  for(var i=0;i<list.length;i++){
    var d = list[i];
    var rk = (i===0) ? 'gold' : (i===1) ? 'silver' : (i===2) ? 'bronze' : 'normal';
    h += '<tr onclick="showDoctorMulti(\'' + escapeAttr(d.name) + '\')" style="cursor:pointer;">'
       + '<td><span class="rank ' + rk + '">' + (i+1) + '</span></td>'
       + '<td><div style="font-weight:700;font-size:12.5px;line-height:1.5;min-width:170px;max-width:280px;white-space:normal;word-break:break-word;">' + escapeHtml(d.name) + '</div>'
       + '<div style="font-size:10px;color:var(--text-muted);">' + escapeHtml(d.section) + '</div></td>';
    for(var p=0;p<PRIVATE_LABEL.length;p++){
      var key = PRIVATE_LABEL[p].key;
      var c = d.perProduct[key] || 0;
      var dim = (pkFilter && pkFilter !== key) ? 'opacity:.35;' : '';
      if(c > 0){
        h += '<td style="text-align:center;' + dim + '"><span style="display:inline-block;min-width:26px;padding:3px 8px;border-radius:8px;background:' + prodColors[key] + '22;color:' + prodColors[key] + ';font-weight:800;font-size:12px;font-family:\'Inter\',\'Alexandria\',sans-serif;">' + c + '</span></td>';
      } else {
        h += '<td style="text-align:center;' + dim + '"><span style="color:var(--text-muted);opacity:.3;">·</span></td>';
      }
    }
    h += '<td style="text-align:center;"><span class="num-font" style="font-size:15px;font-weight:900;color:var(--teal-l);">' + fmt(d.total) + '</span></td>'
       + '<td style="text-align:center;"><button class="btn" style="padding:4px 11px;font-size:13px;" onclick="event.stopPropagation();showPLShareCard(\'' + escapeAttr(d.name) + '\')">📤</button></td>'
       + '</tr>';
  }
  return h;
}

function currentReportPeriodLabel(){
  const branches=BRANCHES.filter(b=>STATE.data[b]);
  const labels=branches.map(b=>periodOldestNewest(STATE.periods[b]||[]).newest).filter(Boolean);
  if(labels.length) return labels.map(p=>p.label).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
  return new Date().toLocaleDateString('ar-EG',{month:'long',year:'numeric'});
}
function showPLShareCard(name){
  var st = window._plAgg; if(!st) return;
  var isLight = document.documentElement.getAttribute('data-theme') === 'light';
  var _bg = isLight ? 'linear-gradient(150deg,#f8f9fc,#ffffff 60%,#f0f2ff)' : 'linear-gradient(150deg,#171c33,#0d1226 60%,#101a2e)';
  var _border = isLight ? 'rgba(37,99,235,.2)' : 'rgba(96,165,250,.35)';
  var _shadow = isLight ? '0 30px 80px rgba(0,0,0,.12)' : '0 30px 80px rgba(0,0,0,.6)';
  var _overlay = isLight ? 'rgba(255,255,255,.75)' : 'rgba(5,8,18,.82)';
  var _nameColor = isLight ? '#0f172a' : '#fff';
  var _secColor = isLight ? '#64748b' : '#8b95b5';
  var _chipBg = isLight ? 'rgba(15,23,42,.04)' : 'rgba(255,255,255,.06)';
  var _chipBorder = isLight ? 'rgba(15,23,42,.1)' : 'rgba(255,255,255,.12)';
  var _chipName = isLight ? '#0f172a' : '#fff';
  var _totalLabel = isLight ? '#334155' : '#cdd5f0';
  var _thanksColor = isLight ? '#475569' : '#9aa7c4';
  var _dateColor = isLight ? '#94a3b8' : '#6b7494';
  var _closeBg = isLight ? 'rgba(15,23,42,.06)' : 'rgba(255,255,255,.08)';
  var _closeColor = isLight ? '#475569' : '#cdd5f0';
  var _dashed = isLight ? 'rgba(15,23,42,.12)' : 'rgba(255,255,255,.15)';
  var d = null;
  for(var i=0;i<st.docs.length;i++){ if(sameEntity(st.docs[i].name,name)){ d = st.docs[i]; break; } }
  if(!d) return;
  closePLShareCard();
  var chips = '';
  for(var p=0;p<PRIVATE_LABEL.length;p++){
    var pk = PRIVATE_LABEL[p].key;
    var c = d.perProduct[pk] || 0;
    if(!c) continue;
    chips += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:14px;background:' + _chipBg + ';border:1px solid ' + _chipBorder + ';margin-bottom:9px;">'
      + '<span style="font-family:\'Inter\',sans-serif;font-weight:800;font-size:24px;color:' + st.prodColors[pk] + ';min-width:36px;">' + c + '</span>'
      + '<span style="font-weight:900;font-size:18px;color:' + _chipName + ';text-align:center;flex:1;letter-spacing:.3px;">' + escapeHtml(PRIVATE_LABEL[p].name) + '</span>'
      + '<span style="width:12px;height:12px;border-radius:50%;background:' + st.prodColors[pk] + ';flex-shrink:0;"></span></div>';
  }
  /* ── منتجات PureHerb ضمن نفس بطاقة المشاركة ── */
  var ph = getPureHerbForDoctor(d.name);
  var phColors = ['#7c3aed','#a855f7','#c084fc','#8b5cf6','#9333ea','#6d28d9','#a78bfa'];
  var phChips = '';
  for(var q=0;q<ph.items.length;q++){
    var phc = phColors[q % phColors.length];
    phChips += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:14px;background:' + _chipBg + ';border:1px solid ' + _chipBorder + ';margin-bottom:9px;">'
      + '<span style="font-family:\'Inter\',sans-serif;font-weight:800;font-size:24px;color:' + phc + ';min-width:36px;">' + ph.items[q].count + '</span>'
      + '<span style="font-weight:900;font-size:18px;color:' + _chipName + ';text-align:center;flex:1;letter-spacing:.3px;">' + escapeHtml(ph.items[q].name) + '</span>'
      + '<span style="width:12px;height:12px;border-radius:50%;background:' + phc + ';flex-shrink:0;"></span></div>';
  }
  var phSection = ph.items.length
    ? '<div style="display:flex;align-items:center;gap:8px;margin:4px 0 10px;"><span style="height:1px;flex:1;background:' + _dashed + ';"></span><span style="font-size:11px;font-weight:800;letter-spacing:2px;color:#a855f7;font-family:\'Inter\',sans-serif;">PUREHERB</span><span style="height:1px;flex:1;background:' + _dashed + ';"></span></div>' + phChips
    : '';
  var grandTotal = (d.total || 0) + ph.total;
  var ov = document.createElement('div');
  window._shareReturnFocus=document.activeElement;
  ov.id = 'plShareOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:' + _overlay + ';backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:18px;';
  ov.onclick = function(e){ if(e.target === ov) closePLShareCard(); };
  ov.innerHTML = '<div role="dialog" aria-modal="true" aria-label="بطاقة مشاركة NOSTRI" tabindex="-1" style="width:100%;max-width:430px;border-radius:22px;padding:26px 24px;background:' + _bg + ';border:1px solid ' + _border + ';box-shadow:' + _shadow + ';">'
    + '<div style="position:relative;text-align:center;padding:2px 0 4px;">'
    + '<span style="font-size:24px;font-weight:900;letter-spacing:5px;font-family:\'Inter\',sans-serif;background:linear-gradient(90deg,#60a5fa,#14b8a6);-webkit-background-clip:text;background-clip:text;color:transparent;">NOSTRI</span>'
    + '<button type="button" aria-label="إغلاق بطاقة المشاركة" onclick="closePLShareCard()" style="position:absolute;left:0;top:50%;transform:translateY(-50%);border:none;background:' + _closeBg + ';color:' + _closeColor + ';border-radius:9px;padding:5px 12px;cursor:pointer;font-family:inherit;font-size:12px;">إغلاق ✕</button></div>'
    + '<div style="font-size:20px;font-weight:900;color:' + _nameColor + ';margin-top:14px;line-height:1.5;text-align:center;">' + escapeHtml(d.name) + '</div>'
    + '<div style="font-size:12px;color:' + _secColor + ';margin-bottom:18px;text-align:center;">' + escapeHtml(d.section) + '</div>'
    + chips
    + phSection
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px dashed ' + _dashed + ';">'
    + '<span style="font-weight:800;color:' + _totalLabel + ';font-size:13.5px;">إجمالي كتابات منتجاتنا</span>'
    + '<span style="font-family:\'Inter\',sans-serif;font-weight:700;font-size:26px;color:#14b8a6;">' + fmt(grandTotal) + '</span></div>'
    + '<div style="text-align:center;margin-top:16px;font-size:12.5px;color:' + _thanksColor + ';">شكراً لثقتكم ودعمكم لمنتجاتنا 🌟</div>'
    + '<div style="text-align:center;margin-top:10px;font-size:9.5px;color:' + _dateColor + ';">التقرير الدوري لرئيس مجلس الإدارة — ' + escapeHtml(currentReportPeriodLabel()) + '</div>'
    + '</div>';
  document.body.appendChild(ov);
  setBlockingUi(true);
  ov.querySelector('[role="dialog"]').focus();
}
function closePLShareCard(){
  var ov = document.getElementById('plShareOverlay');
  if(!ov)return;
  ov.remove();
  setBlockingUi(false);
  if(window._shareReturnFocus&&document.contains(window._shareReturnFocus))window._shareReturnFocus.focus();
  window._shareReturnFocus=null;
}
/* عدّ كتابات منتجات PureHerb لطبيب معيّن عبر كل الفروع المرفوعة (نفس نطاق NOSTRI) */
function getPureHerbForDoctor(name){
  var res = { items: [], total: 0 };
  if(typeof PUREHERB_PRODUCTS === 'undefined') return res;
  var counts = {};
  PUREHERB_PRODUCTS.forEach(function(p){ counts[p.key] = 0; });
  BRANCHES.forEach(function(b){
    var d = STATE.data[b];
    if(!d || !d.rows) return;
    d.rows.forEach(function(r){
      if(!sameEntity(r.doctor,name)||!r.service)return;
      var p=findPureHerbProduct(r.service);if(p)counts[p.key]++;
    });
  });
  PUREHERB_PRODUCTS.forEach(function(p){
    if(counts[p.key] > 0){ res.items.push({ name: p.name, count: counts[p.key], key: p.key }); res.total += counts[p.key]; }
  });
  return res;
}

/* ════════ PureHerb — جدول الأطباء + بطاقة المشاركة (على نمط Private Label) ════════ */
var PH_COLORS = ['#7c3aed','#a855f7','#c026d3','#9333ea','#8b5cf6','#6d28d9','#a78bfa'];
function phColor(i){ return PH_COLORS[i % PH_COLORS.length]; }

function renderPHDoctorsAgg(){
  var box = document.getElementById('phDoctorsAgg');
  if(!box) return;
  var loaded = BRANCHES.filter(function(b){ return STATE.data[b]; });
  if(!loaded.length){ box.innerHTML=''; return; }
  /* تجميع: طبيب -> {name, section, perProduct:{key:count}, total} — أول منتج مطابق يفوز (نفس منطق PL) */
  var docMap = new Map();
  loaded.forEach(function(b){
    var rows = STATE.data[b] ? STATE.data[b].rows : [];
    rows.forEach(function(r){
      if(!r.service || !r.doctor) return;
      var matched=findPureHerbProduct(r.service);
      if(!matched) return;
      var doctorKey=entityKey(r.doctor);
      if(!docMap.has(doctorKey))docMap.set(doctorKey,{name:r.doctor,section:r.section||'—',perProduct:{},total:0});
      var d=docMap.get(doctorKey);
      d.perProduct[matched.key] = (d.perProduct[matched.key]||0) + 1;
      d.total++;
    });
  });
  var docs = [...docMap.values()].sort(function(a,b){ return b.total-a.total; });
  window._phAgg = { docs: docs };
  if(!docs.length){
    box.innerHTML = '<div class="card"><div style="text-align:center;padding:30px;color:var(--text-muted);"><div style="font-size:36px;margin-bottom:10px;">📋</div><div>لا يوجد أطباء كتبوا أصناف PureHerb بعد</div></div></div>';
    return;
  }
  var totalW = docs.reduce(function(s,d){ return s+d.total; },0);
  var multi = docs.filter(function(d){ return Object.keys(d.perProduct).length>1; }).length;
  var legend = PUREHERB_PRODUCTS.map(function(p,i){
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:var(--text-dim);"><span style="width:10px;height:10px;border-radius:3px;background:'+phColor(i)+';"></span>'+escapeHtml(p.name)+'</span>';
  }).join('');
  var headCols = PUREHERB_PRODUCTS.map(function(p,i){
    return '<th style="text-align:center;min-width:62px;"><span style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;"><span style="width:8px;height:8px;border-radius:2px;background:'+phColor(i)+';"></span><span style="font-size:10px;">'+escapeHtml(p.name)+'</span></span></th>';
  }).join('');
  var prodOpts = PUREHERB_PRODUCTS.map(function(p){ return '<option value="'+escapeAttr(p.key)+'">'+escapeHtml(p.name)+'</option>'; }).join('');
  box.innerHTML =
    '<div class="card">'
    + '<div class="card-head" style="flex-wrap:wrap;gap:10px;"><div class="card-title"><span class="dot" style="background:#7c3aed;"></span> الأطباء — أصناف PureHerb</div>'
    + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">'
    + '<span class="price-tag">'+fmt(docs.length)+' طبيب</span>'
    + '<span class="price-tag" style="color:#a855f7;background:rgba(124,58,237,.1);border-color:rgba(124,58,237,.25);">'+fmt(totalW)+' كتابة</span>'
    + (multi?'<span class="price-tag" style="color:var(--violet-l);background:rgba(37,99,235,.1);border-color:rgba(37,99,235,.25);">'+multi+' يكتب أكثر من منتج</span>':'')
    + '</div></div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;padding:10px 14px;background:var(--bg-glass2);border-radius:var(--r-md);">'+legend+'</div>'
    + '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">'
    + '<input class="input" id="phAggSearch" placeholder="🔎 ابحث باسم الطبيب…" style="min-width:220px;flex:1;max-width:340px;" oninput="phAggApply()">'
    + '<select class="select" id="phAggProd" style="min-width:175px;" onchange="phAggApply()"><option value="">كل المنتجات</option>'+prodOpts+'</select>'
    + '<span id="phAggCount" style="font-size:11px;color:var(--text-dim);font-weight:700;"></span>'
    + '</div>'
    + '<div style="overflow-x:auto;"><table style="min-width:760px;"><thead><tr><th style="width:30px;">#</th><th>الطبيب</th>'+headCols+'<th style="text-align:center;">الإجمالي</th><th style="text-align:center;width:52px;">مشاركة</th></tr></thead><tbody id="phAggBody"></tbody></table></div>'
    + '</div>';
  phAggApply();
}
function phAggApply(){
  var st = window._phAgg; if(!st) return;
  var body = document.getElementById('phAggBody'); if(!body) return;
  var qEl = document.getElementById('phAggSearch');
  var pEl = document.getElementById('phAggProd');
  var q = qEl ? qEl.value.trim().toLowerCase() : '';
  var pk = pEl ? pEl.value : '';
  var list = st.docs.filter(function(d){
    if(q && d.name.toLowerCase().indexOf(q) === -1) return false;
    if(pk && !(d.perProduct[pk] > 0)) return false;
    return true;
  });
  if(pk){ list = list.slice().sort(function(a,b){ return (b.perProduct[pk]||0) - (a.perProduct[pk]||0); }); }
  body.innerHTML = phAggRowsHTML(list, pk);
  var cn = document.getElementById('phAggCount');
  if(cn) cn.textContent = 'عرض ' + list.length + ' من ' + st.docs.length + ' طبيب';
}
function phAggRowsHTML(list, pkFilter){
  if(!list.length) return '<tr><td colspan="12" style="text-align:center;padding:26px;color:var(--text-muted);">لا توجد نتائج مطابقة للفلتر</td></tr>';
  var h = '';
  for(var i=0;i<list.length;i++){
    var d = list[i];
    var rk = (i===0)?'gold':(i===1)?'silver':(i===2)?'bronze':'normal';
    h += '<tr onclick="showDoctorMulti(\''+escapeAttr(d.name)+'\')" style="cursor:pointer;">'
       + '<td><span class="rank '+rk+'">'+(i+1)+'</span></td>'
       + '<td><div style="font-weight:700;font-size:12.5px;line-height:1.5;min-width:170px;max-width:280px;white-space:normal;word-break:break-word;">'+escapeHtml(d.name)+'</div>'
       + '<div style="font-size:10px;color:var(--text-muted);">'+escapeHtml(d.section)+'</div></td>';
    for(var p=0;p<PUREHERB_PRODUCTS.length;p++){
      var key = PUREHERB_PRODUCTS[p].key;
      var c = d.perProduct[key] || 0;
      var col = phColor(p);
      var dim = (pkFilter && pkFilter !== key) ? 'opacity:.35;' : '';
      if(c>0){
        h += '<td style="text-align:center;'+dim+'"><span style="display:inline-block;min-width:26px;padding:3px 8px;border-radius:8px;background:'+col+'22;color:'+col+';font-weight:800;font-size:12px;font-family:\'Inter\',\'Alexandria\',sans-serif;">'+c+'</span></td>';
      } else {
        h += '<td style="text-align:center;'+dim+'"><span style="color:var(--text-muted);opacity:.3;">·</span></td>';
      }
    }
    h += '<td style="text-align:center;"><span class="num-font" style="font-size:15px;font-weight:900;color:#a855f7;">'+fmt(d.total)+'</span></td>'
       + '<td style="text-align:center;"><button class="btn" style="padding:4px 11px;font-size:13px;" onclick="event.stopPropagation();showPHShareCard(\''+escapeAttr(d.name)+'\')">📤</button></td>'
       + '</tr>';
  }
  return h;
}
function showPHShareCard(name){
  var isLight = document.documentElement.getAttribute('data-theme') === 'light';
  var _bg = isLight ? 'linear-gradient(150deg,#faf8ff,#ffffff 60%,#f5f0ff)' : 'linear-gradient(150deg,#1e1633,#100a26 60%,#180f2e)';
  var _border = isLight ? 'rgba(124,58,237,.2)' : 'rgba(168,85,247,.35)';
  var _shadow = isLight ? '0 30px 80px rgba(0,0,0,.12)' : '0 30px 80px rgba(0,0,0,.6)';
  var _overlay = isLight ? 'rgba(255,255,255,.75)' : 'rgba(5,8,18,.82)';
  var _nameColor = isLight ? '#0f172a' : '#fff';
  var _secColor = isLight ? '#64748b' : '#8b95b5';
  var _chipBg = isLight ? 'rgba(15,23,42,.04)' : 'rgba(255,255,255,.06)';
  var _chipBorder = isLight ? 'rgba(15,23,42,.1)' : 'rgba(255,255,255,.12)';
  var _chipName = isLight ? '#0f172a' : '#fff';
  var _totalLabel = isLight ? '#334155' : '#cdd5f0';
  var _thanksColor = isLight ? '#475569' : '#9aa7c4';
  var _dateColor = isLight ? '#94a3b8' : '#6b7494';
  var _closeBg = isLight ? 'rgba(15,23,42,.06)' : 'rgba(255,255,255,.08)';
  var _closeColor = isLight ? '#475569' : '#cdd5f0';
  var _dashed = isLight ? 'rgba(15,23,42,.12)' : 'rgba(255,255,255,.15)';
  var section = '';
  if(window._phAgg){ for(var si=0; si<window._phAgg.docs.length; si++){ if(sameEntity(window._phAgg.docs[si].name,name)){ section = window._phAgg.docs[si].section; break; } } }
  var ph = getPureHerbForDoctor(name);
  if(!ph.items.length){ toast('لا توجد كتابات PureHerb لهذا الطبيب','error'); return; }
  closePHShareCard();
  var chips = '';
  for(var q=0;q<ph.items.length;q++){
    var pc = phColor(q);
    chips += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:14px;background:'+_chipBg+';border:1px solid '+_chipBorder+';margin-bottom:9px;">'
      + '<span style="font-family:\'Inter\',sans-serif;font-weight:800;font-size:24px;color:'+pc+';min-width:36px;">'+ph.items[q].count+'</span>'
      + '<span style="font-weight:900;font-size:18px;color:'+_chipName+';text-align:center;flex:1;letter-spacing:.3px;">'+escapeHtml(ph.items[q].name)+'</span>'
      + '<span style="width:12px;height:12px;border-radius:50%;background:'+pc+';flex-shrink:0;"></span></div>';
  }
  var ov = document.createElement('div');
  window._shareReturnFocus=document.activeElement;
  ov.id = 'phShareOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:'+_overlay+';backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:18px;';
  ov.onclick = function(e){ if(e.target === ov) closePHShareCard(); };
  ov.innerHTML = '<div role="dialog" aria-modal="true" aria-label="بطاقة مشاركة PureHerb" tabindex="-1" style="width:100%;max-width:430px;border-radius:22px;padding:26px 24px;background:'+_bg+';border:1px solid '+_border+';box-shadow:'+_shadow+';">'
    + '<div style="position:relative;text-align:center;padding:2px 0 4px;">'
    + '<span style="font-size:24px;font-weight:900;letter-spacing:4px;font-family:\'Inter\',sans-serif;background:linear-gradient(90deg,#a855f7,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent;">PUREHERB</span>'
    + '<button type="button" aria-label="إغلاق بطاقة المشاركة" onclick="closePHShareCard()" style="position:absolute;left:0;top:50%;transform:translateY(-50%);border:none;background:'+_closeBg+';color:'+_closeColor+';border-radius:9px;padding:5px 12px;cursor:pointer;font-family:inherit;font-size:12px;">إغلاق ✕</button></div>'
    + '<div style="font-size:20px;font-weight:900;color:'+_nameColor+';margin-top:14px;line-height:1.5;text-align:center;">'+escapeHtml(name)+'</div>'
    + '<div style="font-size:12px;color:'+_secColor+';margin-bottom:18px;text-align:center;">'+escapeHtml(section)+'</div>'
    + chips
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px dashed '+_dashed+';">'
    + '<span style="font-weight:800;color:'+_totalLabel+';font-size:13.5px;">إجمالي كتابات PureHerb</span>'
    + '<span style="font-family:\'Inter\',sans-serif;font-weight:700;font-size:26px;color:#a855f7;">'+fmt(ph.total)+'</span></div>'
    + '<div style="text-align:center;margin-top:16px;font-size:12.5px;color:'+_thanksColor+';">شكراً لثقتكم ودعمكم لمنتجاتنا 🌟</div>'
    + '<div style="text-align:center;margin-top:10px;font-size:9.5px;color:'+_dateColor+';">التقرير الدوري لرئيس مجلس الإدارة — '+escapeHtml(currentReportPeriodLabel())+'</div>'
    + '</div>';
  document.body.appendChild(ov);
  setBlockingUi(true);
  ov.querySelector('[role="dialog"]').focus();
}
function closePHShareCard(){var ov=document.getElementById('phShareOverlay');if(!ov)return;ov.remove();setBlockingUi(false);if(window._shareReturnFocus&&document.contains(window._shareReturnFocus))window._shareReturnFocus.focus();window._shareReturnFocus=null;}

function renderPLDoctorsAgg(){
  const box = document.getElementById('plDoctorsAgg');
  if(!box) return;
  const loaded = BRANCHES.filter(b=>STATE.data[b]);
  if(!loaded.length){ box.innerHTML=''; return; }

  /* FIX: توحيد النطاق مع باقي قسم PL — كل الفروع المرفوعة دائماً (كان يفلتر خفيةً على الفرع النشط) */
  const scopeBranches = loaded;

  // تجميع: doctor -> { perProduct: {key:count}, total, section }
  const docMap = new Map();
  scopeBranches.forEach(b=>{
    const rows = STATE.data[b] ? STATE.data[b].rows : [];
    rows.forEach(r=>{
      if(!r.service || !r.doctor) return;
      const matched=findPrivateLabelProduct(r.service);
      if(!matched) return;
      const doctorKey=entityKey(r.doctor);
      if(!docMap.has(doctorKey)){
        docMap.set(doctorKey,{name:r.doctor, section:r.section||'—', perProduct:{}, total:0});
      }
      const d = docMap.get(doctorKey);
      d.perProduct[matched.key] = (d.perProduct[matched.key]||0) + 1;
      d.total++;
    });
  });

  const docs = [...docMap.values()].sort((a,b)=>b.total-a.total);

  if(!docs.length){
    box.innerHTML = `<div class="card"><div style="text-align:center;padding:30px;color:var(--text-muted);">
      <div style="font-size:36px;margin-bottom:10px;">📋</div>
      <div>لا يوجد أطباء كتبوا منتجات Private Label بعد في النطاق المحدد</div>
    </div></div>`;
    return;
  }

  // إحصائيات
  const totalPLWrites = docs.reduce((s,d)=>s+d.total,0);
  const multiProductDocs = docs.filter(d=>Object.keys(d.perProduct).length>1).length;

  // ألوان المنتجات
  const prodColors = {reflex:'#2563eb',rizer:'#d97706',oracure:'#0284c7',intimo:'#db2777',nostriderm:'#0d9488',nostricure:'#7c3aed'};
  window._plAgg = { docs: docs, prodColors: prodColors };

  box.innerHTML = `
    <div class="card">
      <div class="card-head" style="flex-wrap:wrap;gap:10px;">
        <div class="card-title"><span class="dot"></span> نظرة عامة</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span class="price-tag">${fmt(docs.length)} طبيب</span>
          <span class="price-tag" style="color:var(--teal-l);background:rgba(13,148,136,.1);border-color:rgba(13,148,136,.25);">${fmt(totalPLWrites)} كتابة PL</span>
          ${multiProductDocs?`<span class="price-tag" style="color:var(--violet-l);background:rgba(37,99,235,.1);border-color:rgba(37,99,235,.25);">${multiProductDocs} يكتب أكثر من منتج</span>`:''}
        </div>
      </div>

      <!-- مفتاح الألوان -->
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;padding:10px 14px;background:var(--bg-glass2);border-radius:var(--r-md);">
        ${PRIVATE_LABEL.map(p=>`<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:var(--text-dim);">
          <span style="width:10px;height:10px;border-radius:3px;background:${prodColors[p.key]};"></span>${escapeHtml(p.name)}
        </span>`).join('')}
      </div>

      <!-- فلترة -->
      <div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">
        <input class="input" id="plAggSearch" placeholder="🔎 ابحث باسم الطبيب…" style="min-width:220px;flex:1;max-width:340px;" oninput="plAggApply()">
        <select class="select" id="plAggProd" style="min-width:175px;" onchange="plAggApply()">
          <option value="">كل المنتجات</option>
          ${PRIVATE_LABEL.map(p=>`<option value="${p.key}">${escapeHtml(p.name)}</option>`).join('')}
        </select>
        <span id="plAggCount" style="font-size:11px;color:var(--text-dim);font-weight:700;"></span>
      </div>

      <!-- الجدول المجمّع -->
      <div style="overflow-x:auto;">
        <table style="min-width:700px;">
          <thead><tr>
            <th style="width:30px;">#</th>
            <th>الطبيب</th>
            ${PRIVATE_LABEL.map(p=>`<th style="text-align:center;min-width:62px;">
              <span style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;">
                <span style="width:8px;height:8px;border-radius:2px;background:${prodColors[p.key]};"></span>
                <span style="font-size:10px;">${escapeHtml(p.name)}</span>
              </span>
            </th>`).join('')}
            <th style="text-align:center;">الإجمالي</th>
            <th style="text-align:center;width:52px;">مشاركة</th>
          </tr></thead>
          <tbody id="plAggBody"></tbody>
        </table>
      </div>
    </div>`;
  plAggApply();
}

function renderFeatured(){
  /* Pills */
  document.getElementById('plPills').innerHTML=PRIVATE_LABEL.map((p,i)=>`
    <div class="pl-pill ${p.cls}">
      <div class="pp-num">${i+1}</div>
      <div class="pp-info">
        <div class="pp-name">${escapeHtml(p.name)}</div>
        <div class="pp-form">${escapeHtml(p.form)}</div>
      </div>
    </div>`).join('');
  renderPLTarget();
  renderPLComparison();
  renderPLDoctorsAgg();
  updateFeaturedGrid();
}

function updateFeaturedGrid(){
  const grid=document.getElementById('featuredGrid');
  const loaded=BRANCHES.filter(b=>STATE.data[b]);
  if(!loaded.length){
    grid.innerHTML='<div class="pl-no-data" style="grid-column:1/-1"><span class="nd-ico">↑</span><h3>لم يتم رفع أي ملف بعد</h3><p>ارفع ملف لفرع واحد على الأقل من الأعلى لبدء التحليل</p></div>';return;
  }
  grid.innerHTML=PRIVATE_LABEL.map((prod,i)=>{
    const docMap=new Map(),matchedNames=new Set(),branchTotals={T1:0,T2:0,T3:0},patientSet=new Set();
    let topDrugName='',topDrugTotal=0;
    loaded.forEach(b=>{
      const d=STATE.data[b];
      const matched=d.drugs.filter(x=>findPrivateLabelProduct(x.name)?.key===prod.key);
      matched.forEach(m=>{
        matchedNames.add(entityKey(m.name));branchTotals[b]+=m.total;
        if(m.total>topDrugTotal){topDrugTotal=m.total;topDrugName=m.name;}
        m.doctors.forEach(dr=>{
          const doctorKey=entityKey(dr.name);let rec=docMap.get(doctorKey);
          if(!rec){const doc=d.doctors.find(z=>sameEntity(z.name,dr.name));rec={name:dr.name,section:doc?doc.section:'',total:0,byBranch:{T1:0,T2:0,T3:0}};docMap.set(doctorKey,rec);}
          rec.total+=dr.count;rec.byBranch[b]+=dr.count;
        });
      });
      d.rows.forEach(r=>{if(findPrivateLabelProduct(r.service)?.key===prod.key){const k=patientIdentityKey(b,r.patient);if(k)patientSet.add(k);}});
    });
    if(!matchedNames.size){
      return `<div class="feat-card c${i+1}"><div class="feat-head"><div class="feat-num">${i+1}</div><div style="flex:1"><div class="feat-title">${escapeHtml(prod.name)}</div><div class="feat-sub">${escapeHtml(prod.form)}</div></div></div><div class="feat-empty">🚫 لا توجد وصفات في البيانات المرفوعة</div></div>`;
    }
    const totalAll=branchTotals.T1+branchTotals.T2+branchTotals.T3;
    const docs=[...docMap.values()].sort((a,b)=>b.total-a.total);
    const breakdown=BRANCHES.map(b=>{if(!STATE.data[b]) return '<span class="b-pill muted">'+BRANCH_LABELS[b]+': —</span>';return '<span class="b-pill '+b.toLowerCase()+'">'+BRANCH_LABELS[b]+': '+fmt(branchTotals[b])+'</span>';}).join('');
    const docRows=docs.slice(0,15).map((d,j)=>{
      const cls=j===0?'gold':(j===1?'silver':(j===2?'bronze':'normal'));
      const tags=BRANCHES.filter(b=>d.byBranch[b]>0).map(b=>'<span class="mini-tag '+b.toLowerCase()+'">'+b+':'+d.byBranch[b]+'</span>').join('');
      return `<div class="feat-doc-row" data-doc="${escapeAttr(d.name)}"><div class="l-side"><div class="rank-mini ${cls}">${j+1}</div><div style="min-width:0"><div class="doc-name">${escapeHtml(d.name)}</div><div class="doc-meta"><span>${escapeHtml(d.section||'—')}</span>${tags}</div></div></div><div class="doc-count">${fmt(d.total)}</div></div>`;
    }).join('');
    return `<div class="feat-card c${i+1}"><div class="feat-head"><div class="feat-num">${i+1}</div><div style="flex:1;min-width:0"><div class="feat-title">${escapeHtml(topDrugName||prod.name)}</div><div class="feat-sub">${matchedNames.size>1?'+'+(matchedNames.size-1)+' صيغ مختلفة':escapeHtml(prod.form)}</div></div></div><div class="feat-breakdown">${breakdown}</div><div class="feat-stats"><div class="feat-stat"><div class="l">إجمالي</div><div class="v">${fmt(totalAll)}</div></div><div class="feat-stat"><div class="l">الأطباء</div><div class="v">${fmt(docs.length)}</div></div><div class="feat-stat"><div class="l">المرضى</div><div class="v">${fmt(patientSet.size)}</div></div></div><div class="feat-docs">${docRows}</div></div>`;
  }).join('');
  grid.querySelectorAll('.feat-doc-row').forEach(el=>el.onclick=()=>showDoctorMulti(el.dataset.doc));

  // ── PRIVATE LABEL GRAND TOTALS BAR ──
  const totalsBar = document.getElementById('plTotalsBar');
  if (loaded.length && totalsBar) {
    // Compute grand totals across all 6 products
    let gtAll = 0, gtT1 = 0, gtT2 = 0, gtT3 = 0, gtDocs = new Set(), gtPats = new Set();
    PRIVATE_LABEL.forEach(prod => {
      loaded.forEach(b => {
        const d = STATE.data[b];
        d.drugs.filter(x=>findPrivateLabelProduct(x.name)?.key===prod.key).forEach(m => {
          if(b==='T1') gtT1 += m.total;
          else if(b==='T2') gtT2 += m.total;
          else if(b==='T3') gtT3 += m.total;
          gtAll += m.total;
          m.doctors.forEach(dr => gtDocs.add(entityKey(dr.name)));
        });
        d.rows.filter(r=>findPrivateLabelProduct(r.service)?.key===prod.key).forEach(r => {
          const k=patientIdentityKey(b,r.patient);if(k)gtPats.add(k);
        });
      });
    });
    totalsBar.style.display = 'block';
    totalsBar.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(0,212,160,.12),rgba(16,185,129,.06));border:1px solid rgba(0,212,160,.3);border-radius:var(--r-lg);padding:18px 24px;">
        <div style="font-size:12px;font-weight:700;color:var(--c-e1);letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px">
          <span style="width:8px;height:8px;border-radius:50%;background:var(--c-e1);display:inline-block;box-shadow:0 0 8px var(--c-e1)"></span>
          إجمالي منتجات الـ Private Label — كل الفروع
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
          <div style="text-align:center;padding:12px;background:var(--bg-glass2);border-radius:var(--r-md);border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-dim);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">إجمالي الكتابات</div>
            <div style="font-size:30px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;background:var(--grad-e);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">${fmt(gtAll)}</div>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(2,132,199,.08);border-radius:var(--r-md);border:1px solid rgba(2,132,199,.25)">
            <div style="font-size:11px;color:#0369a1;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">التعاون الأول</div>
            <div style="font-size:28px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:#0369a1">${fmt(gtT1)}</div>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(0,212,160,.08);border-radius:var(--r-md);border:1px solid rgba(0,212,160,.25)">
            <div style="font-size:11px;color:var(--c-e1);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">التعاون الثاني</div>
            <div style="font-size:28px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--c-e1)">${fmt(gtT2)}</div>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(217,119,6,.08);border-radius:var(--r-md);border:1px solid rgba(217,119,6,.25)">
            <div style="font-size:11px;color:var(--c-a2);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">التعاون الثالث</div>
            <div style="font-size:28px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--c-a2)">${fmt(gtT3)}</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg-glass2);border-radius:var(--r-md);border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-dim);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">الأطباء</div>
            <div style="font-size:28px;font-weight:900;font-family:'Inter','Alexandria',sans-serif">${fmt(gtDocs.size)}</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg-glass2);border-radius:var(--r-md);border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-dim);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">المرضى</div>
            <div style="font-size:28px;font-weight:900;font-family:'Inter','Alexandria',sans-serif">${fmt(gtPats.size)}</div>
          </div>
        </div>
      </div>`;
  } else if (totalsBar) {
    totalsBar.style.display = 'none';
  }
}

function showDoctorMulti(name){
  const blocks=[];let combined={total:0,drugs:new Map()};
  BRANCHES.forEach(b=>{const d=STATE.data[b];if(!d)return;const doc=d.doctors.find(x=>sameEntity(x.name,name));if(!doc)return;combined.total+=doc.total;doc.drugs.forEach(x=>{const k=entityKey(x.name),item=combined.drugs.get(k)||{name:x.name,count:0};item.count+=x.count;combined.drugs.set(k,item);});blocks.push({b,doc});});
  if(!blocks.length) return;
  const sec=blocks[0].doc.section||'—';
  const drugsSorted=[...combined.drugs.values()].sort((a,b)=>b.count-a.count);
  const patientKeys=new Set();
  blocks.forEach(x=>(STATE.data[x.b].rows||[]).forEach(r=>{if(sameEntity(r.doctor,name)){const k=patientIdentityKey(x.b,r.patient);if(k)patientKeys.add(k);}}));
  const totalPats=patientKeys.size;
  const initials=name.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  const avatarColors=['var(--gv)','var(--gt)','var(--ga)','var(--gp)','var(--gs)'];
  const avatarCol=avatarColors[name.length%5];
  const maxDrug=drugsSorted[0]?.count||1;
  const drugColors=['#6c63ff','#00d4a0','#ff4d6d','#d97706','#06b6d4','#7c3aed','#db2777','#3b82f6'];

  // Period sparkline data
  const firstBranch=blocks[0]?.b;
  const sortedDoctorPeriods=PharmaCore.sortPeriods(STATE.periods[firstBranch]||[]).filter(p=>periodDateScore(p.label)>0);
  const sparkPts=sortedDoctorPeriods.map(p=>{const doc=p.data.doctors.find(x=>sameEntity(x.name,name));return doc?doc.total:0;});
  const hasSpark=sparkPts.length>=2;

  // Branch comparison pills
  const colorsB={T1:'var(--sky)',T2:'var(--teal)',T3:'var(--amber)'};
  const branchPills=blocks.map(x=>`<span class="b-pill ${x.b.toLowerCase()}">${BRANCH_LABELS[x.b]}: <strong>${fmt(x.doc.total)}</strong></span>`).join('');

  document.querySelector('.modal').classList.add('wide');
  modalBody.innerHTML=`
    <div class="mini-dash-header">
      <div class="mini-dash-avatar" style="background:${avatarCol};">${initials||'👨'}</div>
      <div style="flex:1;min-width:0;">
        <div class="mini-dash-name">${escapeHtml(name)}</div>
        <div class="mini-dash-meta">${escapeHtml(sec)}</div>
        <div class="mini-branch-pills" style="margin-top:8px;">${branchPills}</div>
      </div>
    </div>

    <div class="mini-dash-kpis">
      <div class="mini-dash-kpi">
        <div class="l">إجمالي الكتابات</div>
        <div class="v" style="color:var(--violet-l);">${fmt(combined.total)}</div>
      </div>
      <div class="mini-dash-kpi">
        <div class="l">الأصناف</div>
        <div class="v" style="color:var(--teal-l);">${fmt(drugsSorted.length)}</div>
      </div>
      <div class="mini-dash-kpi">
        <div class="l">الفروع</div>
        <div class="v" style="color:var(--amber-l);">${fmt(blocks.length)}</div>
      </div>
      <div class="mini-dash-kpi">
        <div class="l">المرضى</div>
        <div class="v" style="color:var(--sky-l);">${fmt(totalPats)}</div>
      </div>
    </div>

    <div class="mini-dash-grid">
      <div class="mini-dash-section">
        <div class="mini-dash-section-title">أعلى الأدوية</div>
        ${drugsSorted.slice(0,10).map((x,i)=>`
          <div class="mini-drug-bar">
            <div class="mini-drug-name" title="${escapeHtml(x.name)}">${escapeHtml(x.name)}</div>
            <div class="mini-drug-track"><div class="mini-drug-fill" style="width:${(x.count/maxDrug*100).toFixed(0)}%;background:${drugColors[i%8]};"></div></div>
            <div class="mini-drug-count" style="color:${drugColors[i%8]};">${fmt(x.count)}</div>
          </div>`).join('')}
      </div>
      <div>
        ${hasSpark?`
        <div class="mini-dash-section" style="margin-bottom:12px;">
          <div class="mini-dash-section-title">مسار الكتابات عبر الفترات</div>
          <div class="mini-spark-container"><canvas id="miniSpark"></canvas></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:4px;">
            ${sortedDoctorPeriods.map(p=>`<span>${escapeHtml(p.label)}</span>`).join('')}
          </div>
        </div>`:''}
        <div class="mini-dash-section">
          <div class="mini-dash-section-title">توزيع الأدوية — Top 5</div>
          <div style="position:relative;height:160px;"><canvas id="miniDoughnut"></canvas></div>
        </div>
      </div>
    </div>

    <div style="margin-top:16px;">
      <div class="mini-head"><h3>قائمة الأدوية الكاملة (${drugsSorted.length} صنف)</h3></div>
      <div class="table-wrap" style="max-height:260px;overflow-y:auto;">
        <table><thead><tr><th style="width:50px;">#</th><th>الدواء</th><th>الكتابات</th><th>النسبة</th></tr></thead>
        <tbody>${drugsSorted.map((x,i)=>`<tr><td>${rankBadge(i)}</td><td>${escapeHtml(x.name)}</td><td class="num">${fmt(x.count)}</td><td class="num">${pct(x.count,combined.total).toFixed(1)}%</td></tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;

  openModal('تفاصيل الطبيب');

  // Draw sparkline
  if(hasSpark) setTimeout(()=>{drawSparklineFull('miniSpark',sparkPts,'#6c63ff');},60);

  // Draw mini doughnut
  setTimeout(()=>{
    const top5=drugsSorted.slice(0,5);
    if(!top5.length) return;
    destroyChart('miniDoughnut');
    const c=chartColors();
    var _mdCtx=document.getElementById('miniDoughnut');if(!_mdCtx)return;
    charts['miniDoughnut']=new Chart(_mdCtx,{
      type:'doughnut',
      data:{labels:top5.map(x=>x.name.slice(0,20)),datasets:[{data:top5.map(x=>x.count),backgroundColor:drugColors.slice(0,5),borderWidth:0,hoverOffset:6}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'right',labels:{color:c.text,font:{family:'IBM Plex Sans Arabic',size:10},boxWidth:10}},tooltip:tt(c)}}
    });
  },80);
}

function showDoctor(name){
  if(!STATE.active) return;const d=STATE.data[STATE.active];if(!d) return;const x=d.doctors.find(z=>sameEntity(z.name,name));if(!x) return;
  showDoctorMulti(name); // use enhanced modal
}
function openDrugDetail(x,scopeLabel,totalRows,scopeClass){
  if(!x)return;
  modalBody.innerHTML='<h2 style="font-size:22px;margin-bottom:6px;font-family:Inter,Alexandria,sans-serif">💊 '+escapeHtml(x.name)+' <span class="tag '+escapeAttr(scopeClass||'')+'" style="font-size:11px;">'+escapeHtml(scopeLabel)+'</span></h2><div class="detail-grid" style="margin-top:16px"><div class="detail-card"><div class="l">الكتابات</div><div class="v">'+fmt(x.total)+'</div></div><div class="detail-card"><div class="l">الأطباء</div><div class="v">'+fmt(x.doctorCount)+'</div></div><div class="detail-card"><div class="l">المرضى</div><div class="v">'+fmt(x.patients)+'</div></div><div class="detail-card"><div class="l">النسبة</div><div class="v">'+pct(x.total,totalRows).toFixed(1)+'%</div></div></div><div class="mini-head"><h3>أعلى الأطباء</h3></div><div class="table-wrap" style="max-height:300px;overflow-y:auto;"><table><thead><tr><th style="width:50px;">#</th><th>الطبيب</th><th>الكتابات</th><th>النسبة</th></tr></thead><tbody>'+x.doctors.slice(0,30).map((y,i)=>'<tr class="clickable" data-doc="'+escapeAttr(y.name)+'"><td>'+rankBadge(i)+'</td><td>'+escapeHtml(y.name)+'</td><td class="num">'+fmt(y.count)+'</td><td class="num">'+pct(y.count,x.total).toFixed(1)+'%</td></tr>').join('')+'</tbody></table></div>';
  modalBody.querySelectorAll('tr[data-doc]').forEach(tr=>tr.onclick=()=>{const doctor=tr.dataset.doc;closeModal();setTimeout(()=>showDoctorMulti(doctor),150);});
  openModal('تفاصيل الدواء');
}
function showDrug(name,branch){
  const selected=branch||STATE.active,d=selected&&STATE.data[selected];if(!d)return;
  const x=d.drugs.find(drug=>sameEntity(drug.name,name));if(!x)return;
  openDrugDetail(x,BRANCH_LABELS[selected],d.totalRows,selected.toLowerCase());
}
function showDrugFromPeriod(name,branch,periodId){
  const period=(STATE.periods[branch]||[]).find(item=>String(item.id)===String(periodId));
  const x=period?.data?.drugs?.find(drug=>sameEntity(drug.name,name));if(!x)return;
  openDrugDetail(x,BRANCH_LABELS[branch]+' · '+period.label,period.data.totalRows,branch.toLowerCase());
}
function showDrugMulti(name){
  const loaded=BRANCHES.filter(branch=>STATE.data[branch]),doctorMap=new Map(),patients=new Set();
  let total=0,totalRows=0,displayName=name;
  loaded.forEach(branch=>{
    const data=STATE.data[branch],drug=data.drugs.find(item=>sameEntity(item.name,name));totalRows+=data.totalRows;
    if(!drug)return;
    displayName=drug.name;total+=drug.total;
    drug.doctors.forEach(doctor=>{const key=entityKey(doctor.name),entry=doctorMap.get(key)||{name:doctor.name,count:0};entry.count+=doctor.count;doctorMap.set(key,entry);});
    data.rows.forEach(row=>{if(sameEntity(row.service,name)&&row.patient)patients.add(patientIdentityKey(branch,row.patient));});
  });
  if(!total)return;
  openDrugDetail({name:displayName,total,doctorCount:doctorMap.size,patients:patients.size,doctors:[...doctorMap.values()].sort((a,b)=>b.count-a.count)},'كل الفروع',totalRows,'');
}

function getExportPrivacyMode(){
  const el=document.getElementById('exportPrivacyMode');
  return el&&el.value==='full'?'full':'anonymized';
}
function confirmSensitiveExport(kind){
  if(getExportPrivacyMode()!=='full') return true;
  return confirm('تحذير خصوصية: '+kind+' سيحتوي أسماء وأرقام المرضى وأرقام الطلبات. هل أنت متأكد أن الوجهة آمنة ومصرّح لها؟');
}
function sanitizeRowsForExport(rows,anonymize){
  return (rows||[]).map(r=>PharmaCore.sanitizeExportRow(r,{anonymize}));
}
function sanitizeDailyStore(store,anonymize){
  const out={};
  Object.keys(store||{}).forEach(date=>{
    out[date]={T1:null,T2:null,T3:null};
    BRANCHES.forEach(b=>{
      const entry=store[date]&&store[date][b];
      if(entry) out[date][b]={...entry,label:anonymize&&entry.label?'تقرير يومي':entry.label,rows:sanitizeRowsForExport(entry.rows,anonymize)};
    });
  });
  return out;
}
function sanitizedPeriodLabel(label,index,anonymize){
  if(!anonymize)return label;
  const score=periodDateScore(label);
  return score?String(Math.floor(score/100))+'-'+String(score%100).padStart(2,'0'):'فترة '+(index+1);
}
function sanitizeParseMeta(meta,anonymize){
  if(!meta||!anonymize)return meta||null;
  const safe={};
  ['source','pages','sourceRows','rejectedRows','textItemCount','layoutDetectedPages','fallbackPages'].forEach(key=>{if(meta[key]!=null)safe[key]=meta[key];});
  return safe;
}
function buildBusinessSnapshot(){
  return{
    agedMeds:AGEDMEDS_DATA,
    plTarget:loadPLTarget(),
    phTarget:loadPHTarget(),
    plAmounts:loadPLAmounts(),
    competitorCustom:getCompCustom(),
  };
}
function redactCredentialsFromSharedTemplate(html){
  const start=html.indexOf('const USERS = {');
  if(start<0) return html;
  const end=html.indexOf('\n};',start);
  if(end<0) return html;
  return html.substring(0,start)+'const USERS = {}; /* credentials intentionally removed from shared file */'+html.substring(end+3);
}
function exportCell(value){return PharmaCore.escapeSpreadsheetFormula(value==null?'':String(value));}

document.getElementById('shareBtn').onclick=()=>{
  const loaded=BRANCHES.filter(b=>STATE.data[b]);
  if(!loaded.length){toast('لا توجد بيانات للمشاركة','error');return;}
  if(!confirmSensitiveExport('ملف المشاركة')) return;
  const anonymize=getExportPrivacyMode()!=='full';
  showLoad();
  try{
    let html=redactCredentialsFromSharedTemplate(SOURCE_TEMPLATE);
    const payload={v:2,active:STATE.active,privacy:{anonymized:anonymize,createdAt:new Date().toISOString()},branches:{},periods:{},dt:sanitizeDailyStore((typeof DT!=='undefined'&&DT.store)?DT.store:{},anonymize),business:buildBusinessSnapshot()};
    BRANCHES.forEach(b=>{const d=STATE.data[b];if(d) payload.branches[b]={rows:sanitizeRowsForExport(d.rows,anonymize),reportName:anonymize?'تقرير '+BRANCH_LABELS[b]:d.reportName,reportDate:anonymize?'':d.reportDate};});
    BRANCHES.forEach(b=>{payload.periods[b]=(STATE.periods[b]||[]).map((p,index)=>({id:p.id,label:sanitizedPeriodLabel(p.label,index,anonymize),rows:sanitizeRowsForExport(p.rows,anonymize),parseMeta:sanitizeParseMeta(p.parseMeta,anonymize),_main:!!p._main}));});
    const closeToken='<'+'/scr'+'ipt>',openToken='<scr'+'ipt id="embedded-rx-data">';
    const json=JSON.stringify(payload).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
    const tag=openToken+'window.__PHARMADASH_SHARED__=true;window.__EMBEDDED_RX__='+json+';'+closeToken;
    const bodyOpen=html.indexOf('<body>');if(bodyOpen<0) throw new Error('body missing');
    html=html.substring(0,bodyOpen+6)+'\n'+tag+'\n'+html.substring(bodyOpen+6);
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rx-dashboard-share-'+(anonymize?'anonymized-':'')+PharmaCore.localDateKey()+'.html';
    document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(a.href);},1000);
    toast('تم إنشاء ملف المشاركة!');
  }catch(e){console.error(e);toast('فشل المشاركة: '+(e.message||''),'error');}
  finally{hideLoad();}
};

async function prepareRestoredPeriods(periods){
  const prepared={T1:[],T2:[],T3:[]};
  for(const b of BRANCHES){
    for(const p of periods[b]||[]){
      prepared[b].push({id:p.id,label:p.label,rows:p.rows,parseMeta:p.parseMeta||null,_main:!!p._main,data:await aggregateAsync(p.rows||[])});
    }
  }
  return prepared;
}
function commitRestoredSnapshot(prepared,dt,active){
  BRANCHES.forEach(b=>{
    STATE.periods[b]=prepared[b]||[];
    if(STATE.periods[b].length){rebuildBranchFromPeriods(b);_restoreBranchUI(b);}
    else{STATE.data[b]=null;STATE.quality[b]=null;_resetBranchUI(b);}
  });
  if(typeof DT!=='undefined')DT.store=dt||{};
  STATE.active=active&&STATE.data[active]?active:(BRANCHES.find(b=>STATE.data[b])||null);
  invalidateGlobalSearch();
}
async function loadEmbedded(){
  if(!window.__EMBEDDED_RX__)return;
  try{
    const d=window.__EMBEDDED_RX__,periods={T1:[],T2:[],T3:[]};
    if(d.periods&&typeof d.periods==='object')BRANCHES.forEach(b=>{periods[b]=d.periods[b]||[];});
    else if(d.branches&&typeof d.branches==='object'){
      BRANCHES.forEach(b=>{const item=d.branches[b];if(item?.rows?.length)periods[b]=[{id:Date.now(),label:item.reportName||BRANCH_LABELS[b],rows:item.rows,_main:true}];});
    }
    const candidate={v:d.v||1,periods,dt:d.dt||{}};
    const validation=PharmaCore.validateSnapshot(candidate);
    if(!validation.valid)throw new Error('ملف المشاركة غير صالح: '+validation.error);
    const prepared=await prepareRestoredPeriods(periods);
    commitRestoredSnapshot(prepared,d.dt||{},d.active);
    function tryRender(n){if(typeof Chart!=='undefined'){renderAll();}else if(n>0)setTimeout(()=>tryRender(n-1),200);else renderAll();}
    tryRender(25);
  }catch(e){console.error('loadEmbedded',e);toast(e.message||'تعذر فتح ملف المشاركة','error');}
}

/* ══ TARGETED PRODUCTS DATA ══ */
function matchesTarget(drugName, prodFullName) {
  const product = (typeof TARGET_PRODUCTS!=='undefined' && TARGET_PRODUCTS.find(p=>p.name===prodFullName)) || {name:prodFullName};
  return PharmaCore.matchesCatalogProduct(drugName,product);
}
const TARGET_PRODUCTS = [{"id": "1-06-059-014", "name": "ARTIZ 10 mg/tablet, 30 TABLET/BOX", "short": "ARTIZ"},{"id": "1-01-187-061", "name": "GLOCLAV Tablet 625MG/1Tablet, 20Tablet/Box", "short": "GLOCLAV"},{"id": "1-01-184-097", "name": "AZI-ONCE 200 mg/5 ml Suspention, 22.5 ML/BOTT", "short": "AZI-ONCE"},{"id": "1-14-166-032", "name": "INTIMO Vaginal Wash 250 ML / CONTAINER", "short": "INTIMO"},{"id": "1-04-020-032", "name": "OMEPREX Capsule 20MG/1Capsule, 28Capsule/Box", "short": "OMEPREX"},{"id": "2-09-031-483", "name": "RIZER apply Cream, 75 ML/TUBE", "short": "RIZER"},{"id": "1-01-020-084", "name": "ZENCIN 250 mg/tablet, 6 TABLET/BOX", "short": "ZENCIN"},{"id": "1-05-028-002", "name": "JARDIANCE Coated tablet 25MG/1Tablet, 30Tablet/", "short": "JARDIANCE"},{"id": "1-05-187-164", "name": "GLUCOPHAGE Tablet 500MG/1Tablet, 50Tablet/Bo", "short": "GLUCOPHAGE"},{"id": "1-04-187-113", "name": "EZORA 20 mg/capsule, 28 CAPSULE/BOX", "short": "EZORA"},{"id": "1-05-028-001", "name": "JARDIANCE Coated tablet 10MG/1Tablet, 30Tablet/", "short": "JARDIANCE"},{"id": "1-05-187-386", "name": "FORMIT XR 750 mg/tablet, 60 TABLET/BOX", "short": "FORMIT"},{"id": "1-09-118-050", "name": "NOSTRIDERM  Ointment , 50 ML/TUBE", "short": "NOSTRIDERM"},{"id": "1-01-187-073", "name": "KLAVOX Tablet 625MG/1Tablet, 20Tablet/Box", "short": "KLAVOX"},{"id": "1-09-113-008", "name": "AVALON SALINOSE 0.9 ml/spray, 30 ML/CONTA", "short": "AVALON"},{"id": "1-04-020-010", "name": "EMILOK Capsule 20MG/1Capsule, 14Capsule/Box", "short": "EMILOK"},{"id": "1-01-184-096", "name": "AZI-ONCE 200 mg/5 ml Suspention, 30 ML/BOTTL", "short": "AZI-ONCE"},{"id": "1-01-187-028", "name": "CIPROMAX Tablet 500MG/1Tablet, 10Tablet/Box", "short": "CIPROMAX"},{"id": "1-06-049-027", "name": "AVALON SALINOSE BABY 0.9 ml/drop, 20 ML/B", "short": "AVALON"},{"id": "1-02-066-034", "name": "REFLEX MASSAGE Emulgel, 100 ML/TUBE", "short": "REFLEX"},{"id": "1-05-020-004", "name": "AMLOPINE Capsule 10MG/1Capsule, 30Capsule/Bo", "short": "AMLOPINE"},{"id": "1-05-020-005", "name": "AMLOPINE Capsule 5MG/1Capsule, 30Capsule/Box", "short": "AMLOPINE"},{"id": "1-01-184-042", "name": "HYMOX FORTE SUSPENTION 250MG/5ML, 100M", "short": "HYMOX"},{"id": "1-07-020-010", "name": "OMNIC Capsule 0.4MG/1Tablet, 30Tablet/Box", "short": "OMNIC"},{"id": "1-02-187-006", "name": "ADOL Tablet 500MG/1Tablet, 24Tablet/Box", "short": "ADOL"},{"id": "1-05-059-004", "name": "ASTATIN Film coated tablet 20MG/1Tablet, 30Tablet", "short": "ASTATIN"},{"id": "1-06-186-099", "name": "ZYRTEC Syrup 1MG/1ML, 75ML/Bottle", "short": "ZYRTEC"},{"id": "1-02-036-003", "name": "VOLTIC  tablet 50MG/1Tablet, 20Tablet/Box", "short": "VOLTIC"},{"id": "1-06-187-016", "name": "CLARA Tablet 10MG/1Tablet, 10Tablet/Box", "short": "CLARA"},{"id": "1-05-187-135", "name": "GLIM Tablet 2MG/1Tablet, 30Tablet/Box", "short": "GLIM"},{"id": "1-05-187-029", "name": "ATORLIP Tablet 10MG/1Tablet, 30Tablet/Box", "short": "ATORLIP"},{"id": "1-09-113-005", "name": "SALINOSE PLUS NASAL SPRAY 0.9ML/1Spray,", "short": "SALINOSE"},{"id": "1-05-187-024", "name": "ASPICARD Tablet 81MG/1Tablet, 120Tablet/Box", "short": "ASPICARD"},{"id": "1-05-059-081", "name": "TOVAST Film coated tablet 20MG/1Tablet, 30Tablet/", "short": "TOVAST"},{"id": "1-06-186-220", "name": "TRIOPAN  Syrup, 100 ML/BOTTLE", "short": "TRIOPAN"},{"id": "1-05-187-030", "name": "ATORLIP Tablet 20MG/1Tablet, 30Tablet/Box", "short": "ATORLIP"},{"id": "1-04-020-041", "name": "RISEK Capsule 20MG/1Capsule, 14Capsule/Box", "short": "RISEK"},{"id": "1-04-020-061", "name": "ACILOC 40 mg/capsule, 14 CAPSULE/BOX", "short": "ACILOC"},{"id": "1-04-020-069", "name": "ACILOC 40 mg/capsule, 28 CAPSULE/BOX", "short": "ACILOC"},{"id": "1-05-187-312", "name": "FORMIT XR Tablet 750MG/1Tablet, 30Tablet/BOX", "short": "FORMIT"},{"id": "1-09-066-046", "name": "NOSTRICURE  Oral Gel, 30 ML/TUBE", "short": "NOSTRICURE"},{"id": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOT", "short": "ZETRON"},{"id": "1-05-059-108", "name": "ROSALUS 20 mg/tablet, 28 TABLET/BOX", "short": "ROSALUS"},{"id": "1-06-110-012", "name": "XYLOMET PED Nasal drops 0.05%/1Drop, 15ML/C", "short": "XYLOMET"},{"id": "1-01-184-072", "name": "WINEX SUSPENTION 100MG/5ML, 60ML/Bottle", "short": "WINEX"},{"id": "1-01-020-039", "name": "JUVAMOX Capsule 500MG/1Capsule, 20Capsule/Bo", "short": "JUVAMOX"},{"id": "1-02-187-197", "name": "SAPOFEN 400 mg/tablet, 30 TABLET/BOX", "short": "SAPOFEN"},{"id": "1-04-187-074", "name": "VERINE SR CAP 200MG/1Capsule, 30Capsule/Box", "short": "VERINE"},{"id": "1-03-187-182", "name": "BIOCAL D 500 mg/tablet, 60 TABLET/BOX", "short": "BIOCAL"},{"id": "1-06-187-087", "name": "RINA EXTRA 122.5 mg/ 30 TABLET/BOX", "short": "RINA"},{"id": "1-01-187-071", "name": "KLAVOX Tablet 1000MG/1Tablet, 14Tablet/Box", "short": "KLAVOX"},{"id": "1-05-059-118", "name": "SORTIVA 50 mg/tablet, 30 TABLET/BOX", "short": "SORTIVA"},{"id": "1-02-187-035", "name": "DICLOMAX Tablet 50MG/1Tablet, 20Tablet/Box", "short": "DICLOMAX"},{"id": "1-05-059-114", "name": "CRESTOR 20 mg/tablet, 28 TABLET/Box", "short": "CRESTOR"},{"id": "1-06-113-043", "name": "CORTRIEF 1 mg/applicator Nasal Spray, APPLICAT", "short": "CORTRIEF"},{"id": "1-05-187-101", "name": "DIOVAN Tablet 80MG/1Tablet, 28Tablet/Box", "short": "DIOVAN"},{"id": "1-06-186-020", "name": "DEFADOL Syrup 160MG/5ML, 145ML/Bottle", "short": "DEFADOL"},{"id": "1-01-020-065", "name": "ZETRON Capsule 250MG/1Capsule, 6Capsule/Box", "short": "ZETRON"},{"id": "1-01-187-056", "name": "FLAZOL Tablet 500MG/1Tablet, 20Tablet/Box", "short": "FLAZOL"},{"id": "1-01-059-003", "name": "AZIMAC Film coated tablet 250MG/1Tablet, 6Tablet", "short": "AZIMAC"},{"id": "1-03-020-192", "name": "TERA-D 50000 mg/capsule, 20 CAPSULE/BOX", "short": "TERA-D"},{"id": "1-02-131-004", "name": "ROXONIN patch 100MG/1PATCH, 7PATCH/BOX", "short": "ROXONIN"},{"id": "1-02-184-002", "name": "PROF SUSPENTION 100MG/5ML, 110ML/Bottle", "short": "PROF"},{"id": "1-06-186-017", "name": "CLARA Syrup 5MG/5ML, 100ML/Bottle", "short": "CLARA"},{"id": "1-06-113-028", "name": "RHINASE NASAL SPRAY 0.05%/1Applicator, 1Ap", "short": "RHINASE"},{"id": "1-05-059-107", "name": "ROSALUS 10 mg/tablet, 28 TABLET/BOX", "short": "ROSALUS"},{"id": "1-02-187-042", "name": "FAST-FLAM Tablet 50MG/1Tablet, 20Tablet/Box", "short": "FAST-FLAM"},{"id": "1-05-187-213", "name": "METFOR Tablet 500MG/1Tablet, 50Tablet/Box", "short": "METFOR"},{"id": "1-01-059-041", "name": "KLARE 500 mg/tablet, 14 TABLET/BOX", "short": "KLARE"},{"id": "1-04-184-013", "name": "DOMPY 0.1 mg/ml Suspention, 200 ML/BOTTLE", "short": "DOMPY"},{"id": "1-05-187-009", "name": "AMARYL Tablet 2MG/1Tablet, 30Tablet/Box", "short": "AMARYL"},{"id": "1-06-186-112", "name": "KAFOSED 5 mg/ml Syrup, 100 ML/BOTTLE", "short": "KAFOSED"},{"id": "1-04-020-033", "name": "OMEPREX Capsule 20MG/1Tablet, 14Tablet/Box", "short": "OMEPREX"},{"id": "1-02-187-169", "name": "PANADREX 500 mg/tablet, 48 TABLET/BOX", "short": "PANADREX"},{"id": "1-03-020-234", "name": "SALMON OIL OMEGA-3 FORTE (1000 mg/capsule", "short": "SALMON"},{"id": "1-05-187-286", "name": "TOVAST Tablet 10MG/1Tablet, 30Tablet/Box", "short": "TOVAST"},{"id": "1-05-187-075", "name": "CONCOR Tablet 5MG/1Tablet, 30Tablet/Box", "short": "CONCOR"},{"id": "1-01-184-049", "name": "KLAVOX SUSPENTION 156MG/5ML, 100ML/Bot", "short": "KLAVOX"},{"id": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "short": "INHIXA"},{"id": "1-02-187-192", "name": "VOLTIC D 50 mg/tablet, 20 TABLET/BOX", "short": "VOLTIC"},{"id": "1-03-187-122", "name": "VITAGLOBIN Tablet /1Tablet, 30Tablet/Box", "short": "VITAGLOBIN"},{"id": "1-06-110-011", "name": "XYLOMET adult Nasal drops 0.1%/1Drop, 15ML/Co", "short": "XYLOMET"},{"id": "1-06-118-029", "name": "AVALON AVOCOM 0.1 %/apply Ointment , 50 GM", "short": "AVALON"},{"id": "1-01-187-138", "name": "FLAGYL 500 mg/tablet, 14 TABLET/BOX", "short": "FLAGYL"},{"id": "1-04-187-063", "name": "SCOPINAL Tablet 10MG/1Tablet, 20Tablet/Box", "short": "SCOPINAL"},{"id": "1-06-031-011", "name": "CORTIDERM Cream 1%/1APPLY, 30 GM/Tube", "short": "CORTIDERM"},{"id": "1-09-031-141", "name": "FUCICORT Cream 2/0.1%/1APPLY, 30GM/Tube", "short": "FUCICORT"},{"id": "1-09-031-133", "name": "FUSIDERM 2 %/apply Cream, 30 GM/TUBE", "short": "FUSIDERM"},{"id": "1-06-059-010", "name": "LEVOZAL Film coated tablet 5MG/1Tablet, 20Tablet", "short": "LEVOZAL"},{"id": "1-01-184-056", "name": "MEGAMOX SUSPENTION 156MG/5ML, 100ML/B", "short": "MEGAMOX"},{"id": "1-05-187-359", "name": "CLAZ MR 60 mg/tablet, 30 TABLET/BOX", "short": "CLAZ"},{"id": "1-05-187-090", "name": "DAONIL Tablet 5MG/1Tablet, 30Tablet/Box", "short": "DAONIL"},{"id": "1-06-186-021", "name": "DEFONASE Syrup 5/50MG/1ML, 100ML/Bottle", "short": "DEFONASE"},{"id": "1-02-020-053", "name": "COXICEL 200 mg/capsule, 30 CAPSULE/BOX", "short": "COXICEL"},{"id": "1-06-187-084", "name": "ZERTAZINE 10 mg/tablet, 20 TABLET/BOX", "short": "ZERTAZINE"},{"id": "1-02-044-003", "name": "PRODEIN PLUS tablet, 20 TABLET/BOX", "short": "PRODEIN"},{"id": "1-06-179-002", "name": "FEVADOL Suppository 100MG/1Suppository, 10Supp", "short": "FEVADOL"},{"id": "1-06-186-229", "name": "DEFADOL 160 mg/5 ml Syrup, 100 ML/BOTTLE", "short": "DEFADOL"},{"id": "1-01-186-004", "name": "FLAZOL Syrup 125MG/5ML, 120ML/Bottle", "short": "FLAZOL"},{"id": "1-03-049-006", "name": "BLUM D 3000 iu/drop, 20 ML/BOTTEL", "short": "BLUM"},{"id": "1-03-136-003", "name": "ORS powder 245MG/1Sachet, 10sachet/Box", "short": "ORS"},{"id": "1-04-186-024", "name": "LAXILOSE 0.67 mg/ml Syrup, 300 ML/BOTTLE", "short": "LAXILOSE"},{"id": "1-06-186-115", "name": "HISTOP 2 mg/5 ml Syrup, 100 ML/BOTTLE", "short": "HISTOP"},{"id": "1-02-186-007", "name": "PROFINAL Syrup 100MG/5ML, 110ML/Bottle", "short": "PROFINAL"},{"id": "1-06-186-085", "name": "SOLVEX Syrup 0.8MG/1ML, 100ML/Bottle", "short": "SOLVEX"},{"id": "1-06-110-015", "name": "DECOZAL PEDIA 0.05 %/drop, 10 ML/CONTAINE", "short": "DECOZAL"},{"id": "1-03-020-021", "name": "PRIMA VIT D Capsule 50000MG/1Capsule, 30Caps", "short": "PRIMA"},{"id": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "short": "ZETRON"},{"id": "1-05-059-028", "name": "IVARIN Film coated tablet 10MG/1Tablet, 30Tablet/Box", "short": "IVARIN"},{"id": "1-06-113-044", "name": "SALINOSE PLUS JET applicator Nasal Spray, 75 ML/CONT", "short": "SALINOSE PLUS JET"},{"id": "1-05-187-038", "name": "BETASERC Tablet 8MG/1Tablet, 100Tablet/Box", "short": "BETASERC"},{"id": "1-03-187-212", "name": "CENTRUM LUTEIN Tablet, 100 TABLET/BOX", "short": "CENTRUM LUTEIN"},{"id": "1-03-020-218", "name": "ARKOCAPS AZINC OPTIMAL Capsule, 60 CAPSULE/BOX", "short": "ARKOCAPS AZINC"},{"id": "1-02-059-020", "name": "UXORATE 120 mg/tablet, 28 TABLET/BOX", "short": "UXORATE"},{"id": "1-03-044-038", "name": "BIOFAR - VITAMIN C 1000 MG EFFERVESCENT TABLET, 20 TABLET/BOX", "short": "BIOFAR VIT-C"}];

function renderTargeted() {
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  const container = document.getElementById('targeted-content');

  // Build aggregated data for each product
  const rows = TARGET_PRODUCTS.map(prod => {
    const branchTotals = {T1:0, T2:0, T3:0};
    const docSet = new Set();
    const patSet = new Set();

    loaded.forEach(b => {
      const d = STATE.data[b];
      d.drugs.filter(x => matchesTarget(x.name, prod.name)).forEach(m => {
        branchTotals[b] += m.total;
        m.doctors.forEach(dr => docSet.add(dr.name));
      });
      d.rows.filter(r => r.service && matchesTarget(r.service, prod.name)).forEach(r => {
        if (r.patient) patSet.add(b + '_' + r.patient);
      });
    });

    const total = branchTotals.T1 + branchTotals.T2 + branchTotals.T3;
    return { ...prod, branchTotals, total, doctors: docSet.size, patients: patSet.size };
  });

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const activeRows = rows.filter(r => r.total > 0);
  const maxTotal = Math.max(...rows.map(r => r.total), 1);

  // Summary stats
  const statsHtml = `
    <div class="tgt-stats-row">
      <div class="tgt-stat"><div class="l">إجمالي الأصناف</div><div class="v">${TARGET_PRODUCTS.length}</div></div>
      <div class="tgt-stat"><div class="l">أصناف بها كتابات</div><div class="v">${activeRows.length}</div></div>
      <div class="tgt-stat"><div class="l">إجمالي الكتابات</div><div class="v">${fmt(grandTotal)}</div></div>
      <div class="tgt-stat"><div class="l">الفروع المرفوعة</div><div class="v">${loaded.length}/3</div></div>
    </div>`;

  // Build search + filter bar
  const searchBar = `
    <div class="tgt-search-bar">
      <input class="input" id="tgtSearch" placeholder="🔎 ابحث في الأصناف..." style="max-width:280px;">
      <select class="select" id="tgtFilter" style="max-width:180px;">
        <option value="all">كل الأصناف</option>
        <option value="active">بها كتابات فقط</option>
        <option value="zero">بدون كتابات</option>
      </select>
    </div>`;

  // Build table
  function buildTable(data) {
    if (!data.length) return '<div class="feat-empty" style="padding:40px">🚫 لا توجد نتائج</div>';
    return `
      <div class="tgt-table-wrap" style="max-height:620px;overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th style="width:50px">#</th>
              <th>الصنف</th>
              <th>رقم الصنف</th>
              <th>التعاون الأول</th>
              <th>التعاون الثاني</th>
              <th>التعاون الثالث</th>
              <th>الإجمالي</th>
              <th style="width:140px">النسبة</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((r, i) => `
              <tr data-prod-idx="${TARGET_PRODUCTS.findIndex(p => p.id === r.id)}" class="tgt-row">
                <td>${rankBadge(i)}</td>
                <td>
                  <div class="tgt-name">${escapeHtml(r.short)}</div>
                  <div class="tgt-id">${escapeHtml(r.name.replace(r.short,'').trim().slice(0,45))}</div>
                </td>
                <td><code style="font-size:11px;color:var(--text-dim)">${escapeHtml(r.id)}</code></td>
                <td class="num">${r.branchTotals.T1 > 0 ? '<span class="branch-mini t1">'+fmt(r.branchTotals.T1)+'</span>' : '<span class="branch-mini zero">—</span>'}</td>
                <td class="num">${r.branchTotals.T2 > 0 ? '<span class="branch-mini t2">'+fmt(r.branchTotals.T2)+'</span>' : '<span class="branch-mini zero">—</span>'}</td>
                <td class="num">${r.branchTotals.T3 > 0 ? '<span class="branch-mini t3">'+fmt(r.branchTotals.T3)+'</span>' : '<span class="branch-mini zero">—</span>'}</td>
                <td class="num" style="font-size:16px;font-weight:800">${fmt(r.total)}</td>
                <td>
                  <div style="font-size:12px;color:var(--text-dim)">${grandTotal > 0 ? pct(r.total, grandTotal).toFixed(1) + '%' : '—'}</div>
                  <div class="tgt-bar"><div class="tgt-bar-fill" style="width:${maxTotal > 0 ? pct(r.total, maxTotal).toFixed(1) : 0}%"></div></div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  container.innerHTML = `
    <div class="card">
      <div class="tgt-header">
        <div class="card-title" style="font-size:17px"><span class="dot"></span> أصناف أوفرستوك — ${TARGET_PRODUCTS.length} صنف · مجمّع من ${loaded.length} فروع</div>
        ${searchBar}
      </div>
      ${!loaded.length ? '<div class="pl-no-data"><span class="nd-ico">↑</span><h3>لا توجد بيانات — يرجى رفع ملف الفرع أولاً</h3><p>ارفع ملف PDF أو Excel من شريط الفروع بالأعلى</p></div>' : ''}
      ${loaded.length ? statsHtml : ''}
      <div id="tgtTableWrap">${buildTable(rows.sort((a,b) => b.total - a.total))}</div>
    </div>`;

  // Search & filter logic
  let currentFilter = 'all', currentQ = '';
  function applyFilter() {
    let data = [...rows];
    if (currentQ) data = data.filter(r => r.name.toLowerCase().includes(currentQ) || r.id.includes(currentQ));
    if (currentFilter === 'active') data = data.filter(r => r.total > 0);
    if (currentFilter === 'zero') data = data.filter(r => r.total === 0);
    data.sort((a, b) => b.total - a.total);
    document.getElementById('tgtTableWrap').innerHTML = buildTable(data);
    attachRowClicks();
  }

  function attachRowClicks() {
    document.querySelectorAll('.tgt-row').forEach(tr => {
      tr.onclick = () => showTargetedProduct(parseInt(tr.dataset.prodIdx));
    });
  }

  document.getElementById('tgtSearch')?.addEventListener('input', e => { currentQ = e.target.value.trim().toLowerCase(); applyFilter(); });
  document.getElementById('tgtFilter')?.addEventListener('change', e => { currentFilter = e.target.value; applyFilter(); });
  attachRowClicks();
}

function showTargetedProduct(idx) {
  const prod = TARGET_PRODUCTS[idx];
  if (!prod) return;
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  const branchTotals = {T1:0,T2:0,T3:0};
  const allDocs = new Map();
  let matchedNames = new Set();

  loaded.forEach(b => {
    const d = STATE.data[b];
    d.drugs.filter(x => matchesTarget(x.name, prod.name)).forEach(m => {
      branchTotals[b] += m.total;
      matchedNames.add(m.name);
      m.doctors.forEach(dr => {
        const doctorKey=entityKey(dr.name);
        let rec = allDocs.get(doctorKey);
        if (!rec) { const doc = d.doctors.find(z => sameEntity(z.name,dr.name)); rec = {name: dr.name, section: doc ? doc.section : '', total: 0, byBranch: {T1:0,T2:0,T3:0}}; allDocs.set(doctorKey, rec); }
        rec.total += dr.count; rec.byBranch[b] += dr.count;
      });
    });
  });

  const totalAll = branchTotals.T1 + branchTotals.T2 + branchTotals.T3;
  const docs = [...allDocs.values()].sort((a, b) => b.total - a.total);

  const branchCards = BRANCHES.map(b => `
    <div class="tgt-modal-branch ${b.toLowerCase()}">
      <div class="lb">${BRANCH_LABELS[b]}</div>
      <div class="vl" style="color:${b==='T1'?'#0369a1':b==='T2'?'var(--c-e1)':'var(--c-a2)'}">${STATE.data[b] ? fmt(branchTotals[b]) : '—'}</div>
    </div>`).join('');

  const namesHtml = matchedNames.size > 1
    ? '<div style="margin:10px 0;display:flex;gap:8px;flex-wrap:wrap">' + [...matchedNames].map(n => `<span class="tag">${escapeHtml(n.slice(0,40))}</span>`).join('') + '</div>'
    : '';

  modalBody.innerHTML = `
    <h2 style="font-size:21px;margin-bottom:4px;font-family:Inter,Alexandria,sans-serif">🎯 ${escapeHtml(prod.short)}</h2>
    <p style="color:var(--text-dim);font-size:13px;margin-bottom:4px">${escapeHtml(prod.name)}</p>
    <code style="font-size:11px;color:var(--text-muted)">${escapeHtml(prod.id)}</code>
    ${namesHtml}
    <div class="tgt-modal-branches">${branchCards}</div>
    <div class="detail-grid" style="grid-template-columns:1fr 1fr 1fr">
      <div class="detail-card"><div class="l">الإجمالي الكلي</div><div class="v">${fmt(totalAll)}</div></div>
      <div class="detail-card"><div class="l">الأطباء</div><div class="v">${fmt(docs.length)}</div></div>
      <div class="detail-card"><div class="l">الصيغ المطابقة</div><div class="v">${matchedNames.size}</div></div>
    </div>
    ${docs.length ? `
    <div class="mini-head"><h3>أعلى الأطباء كتابةً</h3></div>
    <div class="table-wrap" style="max-height:300px;overflow-y:auto">
      <table><thead><tr><th style="width:50px">#</th><th>الطبيب</th><th>القسم</th><th>T1</th><th>T2</th><th>T3</th><th>الإجمالي</th></tr></thead>
      <tbody>${docs.slice(0,30).map((d,i) => `
        <tr>
          <td>${rankBadge(i)}</td>
          <td><strong>${escapeHtml(d.name)}</strong></td>
          <td><span class="tag blue" style="font-size:11px">${escapeHtml(d.section||'—')}</span></td>
          <td class="num">${d.byBranch.T1||'—'}</td>
          <td class="num">${d.byBranch.T2||'—'}</td>
          <td class="num">${d.byBranch.T3||'—'}</td>
          <td class="num" style="font-weight:800">${fmt(d.total)}</td>
        </tr>`).join('')}
      </tbody></table>
    </div>` : '<div class="feat-empty">لا توجد كتابات لهذا الصنف في الفروع المرفوعة</div>'}
  `;
  openModal('تفاصيل الصنف المستهدف');
}

/* ══════════════════════════════════════════
   SECTIONS 10-14 — ADVANCED ANALYTICS
   Each section is self-contained and independently maintainable
══════════════════════════════════════════ */
// ══════════════════════════════════════════
// SECTION 10 — PARETO 80/20 ANALYSIS
// ══════════════════════════════════════════
function renderPareto() {
  const container = document.getElementById('pareto-content');
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  if (!loaded.length) {
    container.innerHTML = `<div class="card"><div class="pl-no-data"><span class="nd-ico">↑</span><h3>لا توجد بيانات — يرجى رفع ملف الفرع أولاً</h3></div></div>`;
    return;
  }

  // Aggregate all doctors across branches
  const docAgg = new Map();
  loaded.forEach(b => {
    STATE.data[b].doctors.forEach(doc => {
      if (!docAgg.has(doc.name)) docAgg.set(doc.name,{ name: doc.name, section: doc.section||'—', total: 0 });
      docAgg.get(doc.name).total += doc.total;
    });
  });

  const allDocsSorted = [...docAgg.values()].sort((a, b) => b.total - a.total);
  const gTotal = allDocsSorted.reduce((s, d) => s + d.total, 0);

  if (!gTotal) {
    container.innerHTML = `<div class="card"><div class="pl-no-data"><span class="nd-ico">—</span><h3>لا توجد بيانات كافية</h3></div></div>`;
    return;
  }

  // Build pareto data with running totals
  let running = 0;
  let paretoIdx = -1;
  const paretoData = allDocsSorted.map((d, i) => {
    running += d.total;
    const indivPct = (d.total / gTotal) * 100;
    const cumPct   = (running / gTotal) * 100;
    if (paretoIdx < 0 && cumPct >= 80) paretoIdx = i;
    return { name: d.name, section: d.section, total: d.total, indivPct, cumPct };
  });

  const top20count  = Math.max(1, Math.ceil(allDocsSorted.length * 0.2));
  const top20total  = allDocsSorted.slice(0, top20count).reduce((s,d) => s+d.total, 0);
  const top20share  = ((top20total / gTotal) * 100).toFixed(1);
  const pareto80n   = paretoIdx + 1;
  const pareto80pct = ((pareto80n / allDocsSorted.length) * 100).toFixed(1);

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-head">
        <div class="card-title"><span class="dot"></span> تحليل باريتو 80/20 — قاعدة الأطباء</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">
        <div style="background:linear-gradient(135deg,rgba(37,99,235,.12),rgba(37,99,235,.04));border:1px solid rgba(37,99,235,.3);border-radius:var(--r-lg);padding:18px;text-align:center;">
          <div style="font-size:11px;font-weight:800;color:var(--violet-l);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">أطباء الـ Top 20%</div>
          <div style="font-size:36px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--violet-l);">${fmt(top20count)}</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">طبيب من أصل ${fmt(allDocsSorted.length)}</div>
        </div>
        <div style="background:linear-gradient(135deg,rgba(13,148,136,.12),rgba(13,148,136,.04));border:1px solid rgba(13,148,136,.3);border-radius:var(--r-lg);padding:18px;text-align:center;">
          <div style="font-size:11px;font-weight:800;color:var(--teal-l);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">حصتهم من الكتابات</div>
          <div style="font-size:36px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--teal-l);">${top20share}%</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">${fmt(top20total)} كتابة</div>
        </div>
        <div style="background:linear-gradient(135deg,rgba(217,119,6,.12),rgba(217,119,6,.04));border:1px solid rgba(217,119,6,.3);border-radius:var(--r-lg);padding:18px;text-align:center;">
          <div style="font-size:11px;font-weight:800;color:var(--amber-l);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">أطباء الـ 80% الكتابات</div>
          <div style="font-size:36px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--amber-l);">${fmt(pareto80n)}</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">${pareto80pct}% من إجمالي الأطباء</div>
        </div>
        <div style="background:linear-gradient(135deg,rgba(220,38,38,.12),rgba(220,38,38,.04));border:1px solid rgba(220,38,38,.3);border-radius:var(--r-lg);padding:18px;text-align:center;">
          <div style="font-size:11px;font-weight:800;color:var(--rose-l);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">إجمالي الكتابات</div>
          <div style="font-size:36px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--rose-l);">${fmt(gTotal)}</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">عبر ${loaded.length} فروع</div>
        </div>
      </div>

      <div class="grid-2" style="gap:16px;margin-bottom:20px;">
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;">📊 منحنى باريتو التراكمي</div>
          <div style="position:relative;height:240px;"><canvas id="paretoChart"></canvas></div>
        </div>
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;">🏆 أعلى 20% أطباء</div>
          <div style="max-height:240px;overflow-y:auto;">
            ${allDocsSorted.slice(0, top20count).slice(0,15).map((d, i) => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;cursor:pointer;" onclick="showDoctorMulti('${escapeAttr(d.name)}')">
                <span class="rank ${i===0?'gold':i===1?'silver':i===2?'bronze':'normal'}">${i+1}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(d.name)}</div>
                  <div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px;"><div style="height:100%;width:${(allDocsSorted[0]&&allDocsSorted[0].total>0?(d.total/allDocsSorted[0].total*100):0).toFixed(0)}%;background:var(--gv);border-radius:2px;"></div></div>
                </div>
                <div style="font-size:13px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--violet-l);min-width:45px;text-align:left;">${fmt(d.total)}</div>
                <div style="font-size:10px;color:var(--text-muted);min-width:35px;text-align:left;">${((d.total/gTotal)*100).toFixed(1)}%</div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
        <div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">📋 جدول الأطباء مع النسب التراكمية</div>
        <div style="max-height:400px;overflow-y:auto;">
          <table>
            <thead><tr><th style="width:50px">#</th><th>الطبيب</th><th>القسم</th><th>الكتابات</th><th>النسبة</th><th>تراكمي</th><th>الشريحة</th></tr></thead>
            <tbody>
              ${paretoData.slice(0, 50).map((d, i) => {
                const segment = d.cumPct <= 50 ? 'A' : d.cumPct <= 80 ? 'B' : 'C';
                const segColor = segment === 'A' ? 'var(--teal)' : segment === 'B' ? 'var(--amber)' : 'var(--rose)';
                const segBg = segment === 'A' ? 'rgba(13,148,136,.12)' : segment === 'B' ? 'rgba(217,119,6,.12)' : 'rgba(220,38,38,.12)';
                return `<tr class="clickable" onclick="showDoctorMulti('${escapeAttr(d.name)}')">
                  <td>${rankBadge(i)}</td>
                  <td style="font-weight:700;">${escapeHtml(d.name)}</td>
                  <td><span class="tag blue" style="font-size:10px">${escapeHtml(d.section||'—')}</span></td>
                  <td class="num">${fmt(d.total)}</td>
                  <td class="num">${d.indivPct.toFixed(1)}%</td>
                  <td class="num" style="color:${d.cumPct<=80?'var(--teal-l)':'var(--text-muted)'};">${d.cumPct.toFixed(1)}%</td>
                  <td><span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:800;color:${segColor};background:${segBg};">شريحة ${segment}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  // Draw Pareto chart
  setTimeout(() => {
    destroyChart('paretoChart');
    const ctx = document.getElementById('paretoChart');
    if (!ctx) return;
    const c = chartColors();
    const labels = paretoData.slice(0, 30).map((_, i) => i + 1);
    const bars = paretoData.slice(0, 30).map(d => d.indivPct);
    const line = paretoData.slice(0, 30).map(d => d.cumPct);
    charts['paretoChart'] = new Chart(ctx,{
      data: {
        labels,
        datasets: [
          { type: 'bar', data: bars, backgroundColor: 'rgba(37,99,235,0.6)', borderColor: 'rgba(37,99,235,0.8)', borderWidth: 1, borderRadius: 3, yAxisID: 'y', label: '% كتابة' },{ type: 'line', data: line, borderColor: '#d97706', backgroundColor: 'rgba(217,119,6,0.08)', borderWidth: 2, pointRadius: 0, tension: 0.4, yAxisID: 'y2', label: 'تراكمي %' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: tt(c) },
        scales: {
          x: { ticks: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 10 } }, grid: { color: c.grid } },
          y: { ticks: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 10 }, callback: v => v.toFixed(1) + '%' }, grid: { color: c.grid } },
          y2: { position: 'right', ticks: { color: '#d97706', font: { family: 'IBM Plex Sans Arabic', size: 10 }, callback: v => v + '%' }, grid: { display: false }, max: 110 }
        }
      }
    });
  }, 60);
}

// ══════════════════════════════════════════
// SECTION 11 — SPECIALTY ANALYSIS
// ══════════════════════════════════════════
function renderSpecialty() {
  const container = document.getElementById('specialty-content');
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  if (!loaded.length) {
    container.innerHTML = `<div class="card"><div class="pl-no-data"><span class="nd-ico">↑</span><h3>لا توجد بيانات — يرجى رفع ملف الفرع أولاً</h3></div></div>`;
    return;
  }

  // Aggregate by section using Sets so the same entity is not counted twice across branches.
  const secMap = new Map();
  const secDrugsMap = new Map();
  loaded.forEach(b => {
    (STATE.data[b].rows||[]).forEach(r=>{
      if(!r.section)return;
      const sectionKey=PharmaCore.normalizeEntityKey(r.section);
      let ex=secMap.get(sectionKey);
      if(!ex){ex={name:r.section,total:0,doctorSet:new Set(),drugSet:new Set(),patientSet:new Set()};secMap.set(sectionKey,ex);}
      ex.total++;
      if(r.doctor)ex.doctorSet.add(PharmaCore.normalizeEntityKey(r.doctor));
      if(r.service)ex.drugSet.add(PharmaCore.normalizeEntityKey(r.service));
      const patientKey=patientIdentityKey(b,r.patient);if(patientKey)ex.patientSet.add(patientKey);
      if(r.service){
        if(!secDrugsMap.has(sectionKey))secDrugsMap.set(sectionKey,new Map());
        const drugMap=secDrugsMap.get(sectionKey);
        const drugKey=PharmaCore.normalizeEntityKey(r.service);
        const current=drugMap.get(drugKey)||{name:r.service,count:0};
        current.count++;drugMap.set(drugKey,current);
      }
    });
  });

  const allSecs = [...secMap.entries()].map(([key,s])=>({
    key,name:s.name,total:s.total,doctors:s.doctorSet.size,drugs:s.drugSet.size,patients:s.patientSet.size
  })).sort((a, b) => b.total - a.total);
  const grandTotal = allSecs.reduce((s, x) => s + x.total, 0);

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-head">
        <div class="card-title"><span class="dot"></span> تحليل التخصصات — ${allSecs.length} تخصص</div>
      </div>

      <div class="grid-2" style="gap:16px;margin-bottom:20px;">
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;">🏥 توزيع الكتابات بالتخصص</div>
          <div style="position:relative;height:280px;"><canvas id="specPieChart"></canvas></div>
        </div>
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;">📊 أعلى التخصصات</div>
          <div style="position:relative;height:280px;"><canvas id="specBarChart"></canvas></div>
        </div>
      </div>

      <div style="max-height:520px;overflow-y:auto;">
        <table>
          <thead><tr><th style="width:50px">#</th><th>التخصص</th><th>الأطباء</th><th>الكتابات</th><th>الأدوية</th><th>المرضى</th><th>متوسط/طبيب</th><th>أشهر دواء</th><th style="width:150px">النسبة</th></tr></thead>
          <tbody>
            ${allSecs.map((s, i) => {
              const avg = s.doctors ? Math.round(s.total / s.doctors) : 0;
              const topDrug = secDrugsMap.get(s.key) ?
                [...secDrugsMap.get(s.key).values()].sort((a, b) => b.count - a.count)[0]?.name : '—';
              const barW = grandTotal ? (s.total / grandTotal * 100).toFixed(1) : 0;
              return `<tr>
                <td>${rankBadge(i)}</td>
                <td style="font-weight:700;">${escapeHtml(s.name)}</td>
                <td class="num">${fmt(s.doctors)}</td>
                <td class="num">${fmt(s.total)}</td>
                <td class="num">${fmt(s.drugs)}</td>
                <td class="num">${fmt(s.patients)}</td>
                <td class="num" style="color:var(--sky-l);">${fmt(avg)}</td>
                <td style="max-width:220px;"><span class="tag" style="font-size:10px;white-space:normal;word-break:break-word;line-height:1.5;display:inline-block;" title="${escapeAttr(topDrug||'')}">${escapeHtml(topDrug||'—')}</span></td>
                <td><div style="display:flex;align-items:center;gap:8px;">
                  <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${barW}%;background:var(--gv);border-radius:3px;"></div>
                  </div>
                  <span style="font-size:11px;font-weight:700;color:var(--text-dim);min-width:35px;">${barW}%</span>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Charts
  setTimeout(() => {
    const c = chartColors();
    destroyChart('specPieChart');
    const ctxP = document.getElementById('specPieChart');
    if (ctxP) {
      charts['specPieChart'] = new Chart(ctxP,{
        type: 'doughnut',
        data: { labels: allSecs.slice(0,10).map(s => s.name), datasets: [{ data: allSecs.slice(0,10).map(s => s.total), backgroundColor: PALETTE.slice(0,10), borderWidth: 0, hoverOffset: 12 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '58%', plugins: { legend: { position: 'right', labels: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 10 }, boxWidth: 10, padding: 8 } }, tooltip: tt(c) } }
      });
    }
    destroyChart('specBarChart');
    const ctxB = document.getElementById('specBarChart');
    if (ctxB) {
      const top8 = allSecs.slice(0, 8);
      const gctx = ctxB.getContext('2d');
      const grad = gctx.createLinearGradient(0,0,500,0); grad.addColorStop(0,'#6c63ff'); grad.addColorStop(1,'#00d4a0');
      charts['specBarChart'] = new Chart(ctxB,{
        type: 'bar',
        data: { labels: top8.map(s => s.name.slice(0,18)), datasets: [{ data: top8.map(s => s.total), backgroundColor: grad, borderRadius: 6, borderSkipped: false }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tt(c) }, scales: { x: { ticks: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 10 } }, grid: { color: c.grid } }, y: { ticks: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 11 } }, grid: { display: false } } } }
      });
    }
  }, 60);
}

// ══════════════════════════════════════════
// SECTION 12 — DOCTOR LOYALTY SCORE
// منطق التصنيف:
//   🏆 مخلص        → كتب PL وعدد PL ≥ 5 وصفة ونسبة ≥ 20%
//   ✅ منتظم        → كتب PL ونسبة 8%–20% أو عدد ≥ 3
//   🔄 يحتاج تطوير → كتب PL لكن نسبة أو عدد منخفض
//   ⚠ لم يكتب بعد → plTotal = 0 تماماً
// ══════════════════════════════════════════
function renderLoyalty() {
  const container = document.getElementById('loyalty-content');
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  if (!loaded.length) {
    container.innerHTML = `<div class="card"><div class="pl-no-data"><span class="nd-ico">↑</span><h3>لا توجد بيانات — يرجى رفع ملف الفرع أولاً</h3></div></div>`;
    return;
  }

  // ── تجميع بيانات الأطباء من كل الفروع ──
  const docAgg = new Map();
  loaded.forEach(b => {
    STATE.data[b].doctors.forEach(d => {
      const doctorKey=entityKey(d.name);
      if (!docAgg.has(doctorKey)) {
        docAgg.set(doctorKey,{ name: d.name, section: d.section||'—', total: 0, branches: new Set(), drugs: new Map() });
      }
      const rec=docAgg.get(doctorKey);
      rec.total += d.total;
      rec.branches.add(b);
      d.drugs.forEach(dr=>{const k=entityKey(dr.name),item=rec.drugs.get(k)||{name:dr.name,count:0};item.count+=dr.count;rec.drugs.set(k,item);});
    });
  });

  // ── حساب نسبة وعدد كتابات Private Label لكل طبيب ──
  const allDocs = [...docAgg.values()].map(d => {
    const drugList=[...d.drugs.values()].sort((a,b)=>b.count-a.count);

    // فصل أدوية PL عن باقي الأدوية
    const plDrugs=drugList.filter(dr=>findPrivateLabelProduct(dr.name));
    const otherDrugs=drugList.filter(dr=>!findPrivateLabelProduct(dr.name));
    const plTotal    = plDrugs.reduce((s, dr) => s + dr.count, 0);
    const plPct      = d.total > 0 ? (plTotal / d.total * 100) : 0;
    const plCount    = plDrugs.length; // عدد أصناف PL مختلفة

    // ── منطق التصنيف الصحيح ──
    // At Risk = صفر كتابات PL خالص
    // يحتاج تطوير = كتب PL لكن قليل (عدد < 3 أصناف أو نسبة < 8%)
    // منتظم = كتب PL بشكل معقول (3+ أصناف أو نسبة 8-20%)
    // مخلص = كتب PL بكثرة (نسبة ≥ 20% + عدد كتابات ≥ 5)
    let tier, tierAr, tierColor, tierBg, tierBorder;
    if (plTotal === 0) {
      tier = 'not_written'; tierAr = 'لم يكتب بعد';
      tierColor = 'var(--rose)'; tierBg = 'rgba(220,38,38,.1)'; tierBorder = 'rgba(220,38,38,.3)';
    } else if (plPct >= 20 && plTotal >= 5) {
      tier = 'loyal'; tierAr = 'مخلص';
      tierColor = 'var(--teal)'; tierBg = 'rgba(13,148,136,.1)'; tierBorder = 'rgba(13,148,136,.3)';
    } else if (plPct >= 8 || plCount >= 3) {
      tier = 'regular'; tierAr = 'منتظم';
      tierColor = 'var(--violet)'; tierBg = 'rgba(37,99,235,.1)'; tierBorder = 'rgba(37,99,235,.3)';
    } else {
      tier = 'developing'; tierAr = 'يحتاج تطوير';
      tierColor = 'var(--amber)'; tierBg = 'rgba(217,119,6,.1)'; tierBorder = 'rgba(217,119,6,.3)';
    }

    return { ...d, drugList, plDrugs, otherDrugs, plTotal, plPct, plCount,
             tier, tierAr, tierColor, tierBg, tierBorder };
  }).sort((a, b) => {
    // ترتيب: مخلص أولاً ثم منتظم ثم يحتاج تطوير ثم لم يكتب
    const order = { loyal:0, regular:1, developing:2, not_written:3 };
    if (order[a.tier] !== order[b.tier]) return order[a.tier] - order[b.tier];
    return b.plTotal - a.plTotal; // داخل نفس الشريحة: الأكثر كتابة أولاً
  });

  // ── عدد كل شريحة ──
  const counts = { loyal:0, regular:0, developing:0, not_written:0 };
  allDocs.forEach(d => counts[d.tier]++);

  // ── إجمالي كتابات PL ──
  const totalPL    = allDocs.reduce((s,d) => s + d.plTotal, 0);
  const totalAll   = allDocs.reduce((s,d) => s + d.total, 0);
  const overallPct = totalAll > 0 ? (totalPL/totalAll*100).toFixed(1) : '0.0';

  // ── تعريف بطاقات الشرائح ──
  const tierDefs = [
    { key:'loyal',       ar:'🏆 مخلص',          color:'var(--teal)',   bg:'rgba(13,148,136,.1)',   border:'rgba(13,148,136,.3)',   desc:'نسبة PL ≥ 20% وعدد كتابات ≥ 5' },{ key:'regular',     ar:'✅ منتظم',           color:'var(--violet)', bg:'rgba(37,99,235,.1)',  border:'rgba(37,99,235,.3)',  desc:'نسبة 8–20% أو 3+ أصناف PL' },{ key:'developing',  ar:'🔄 يحتاج تطوير',    color:'var(--amber)',  bg:'rgba(217,119,6,.1)',  border:'rgba(217,119,6,.3)',  desc:'كتب PL لكن أقل من المستهدف' },{ key:'not_written', ar:'⚠ لم يكتب بعد',    color:'var(--rose)',   bg:'rgba(220,38,38,.1)',   border:'rgba(220,38,38,.3)',   desc:'صفر كتابات Private Label' },
  ];

  container.innerHTML = `
    <div class="card">
      <div class="card-head">
        <div class="card-title"><span class="dot"></span> تصنيف ولاء الأطباء — Private Label</div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="font-size:12px;color:var(--text-dim);">إجمالي كتابات PL:</div>
          <div style="font-size:16px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--teal-l);">${fmt(totalPL)}</div>
          <div style="font-size:12px;color:var(--text-dim);">(${overallPct}% من كل الكتابات)</div>
        </div>
      </div>

      <!-- بطاقات الشرائح الأربع -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:22px;">
        ${tierDefs.map(t => `
          <div style="background:${t.bg};border:1.5px solid ${t.border};border-radius:var(--r-lg);padding:18px 16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div style="font-size:13px;font-weight:800;color:${t.color};">${t.ar}</div>
              <div style="font-size:28px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:${t.color};">${counts[t.key]}</div>
            </div>
            <div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin-bottom:8px;">
              <div style="height:100%;width:${allDocs.length?((counts[t.key]/allDocs.length)*100).toFixed(0):0}%;background:${t.color};border-radius:2px;"></div>
            </div>
            <div style="font-size:10.5px;color:var(--text-dim);line-height:1.5;">${t.desc}</div>
          </div>`).join('')}
      </div>

      <!-- شرح المنطق -->
      <div style="background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);padding:12px 16px;margin-bottom:20px;display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
        <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.4px;text-transform:uppercase;flex-shrink:0;">معيار التصنيف:</div>
        ${[
          { label:'🏆 مخلص',       val:'نسبة PL من كتاباته ≥ 20% + كتب 5 وصفات PL أو أكثر', c:'var(--teal)' },{ label:'✅ منتظم',      val:'نسبة 8–20% أو كتب 3 أصناف PL مختلفة على الأقل',    c:'var(--violet)' },{ label:'🔄 يحتاج تطوير', val:'كتب PL لكن بنسبة أقل من 8% وأصناف أقل من 3',      c:'var(--amber)' },{ label:'⚠ لم يكتب',    val:'لا توجد أي كتابة PL في بياناته',                    c:'var(--rose)' },
        ].map(x => `<div style="display:flex;align-items:center;gap:6px;font-size:11px;">
          <span style="color:${x.c};font-weight:700;">${x.label}</span>
          <span style="color:var(--text-dim);">${x.val}</span>
        </div>`).join('')}
      </div>

      <!-- الشارتات -->
      <div class="grid-2" style="gap:16px;margin-bottom:20px;">
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">🥧 توزيع التصنيفات</div>
          <div style="position:relative;height:200px;"><canvas id="loyaltyPie"></canvas></div>
        </div>
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">📊 نسبة PL لأعلى 15 طبيب</div>
          <div style="position:relative;height:200px;"><canvas id="loyaltyBar"></canvas></div>
        </div>
      </div>

      <!-- جدول الأطباء مجمّع بالشريحة -->
      ${tierDefs.map(t => {
        const group = allDocs.filter(d => d.tier === t.key);
        if (!group.length) return '';
        return `
          <!-- شريحة: ${t.ar} -->
          <div style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:${t.bg};border:1px solid ${t.border};border-radius:var(--r-md) var(--r-md) 0 0;border-bottom:none;">
              <div style="font-size:14px;font-weight:800;color:${t.color};">${t.ar}</div>
              <div style="font-size:12px;color:var(--text-dim);">${group.length} طبيب</div>
              <div style="font-size:11px;color:${t.color};margin-right:auto;">${t.desc}</div>
            </div>
            <div style="border:1px solid ${t.border};border-radius:0 0 var(--r-md) var(--r-md);overflow:hidden;">
              <table>
                <thead>
                  <tr style="background:${t.bg};">
                    <th style="width:44px">#</th>
                    <th>الطبيب</th>
                    <th>القسم</th>
                    <th>كل الكتابات</th>
                    <th>كتابات PL</th>
                    <th>أصناف PL</th>
                    <th>نسبة PL</th>
                    <th>أبرز أصناف PL يكتبها</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.map((d, i) => {
                    const plBar = Math.min(d.plPct, 100).toFixed(0);
                    const topPL = d.plDrugs.slice(0,3).map(dr =>
                      `<span style="display:inline-block;padding:1px 7px;border-radius:999px;font-size:9.5px;font-weight:700;background:${t.bg};border:1px solid ${t.border};color:${t.color};margin:1px;">${escapeHtml(dr.name.slice(0,25))} (${dr.count})</span>`
                    ).join('');
                    return `<tr class="clickable" onclick="showDoctorMulti('${escapeAttr(d.name)}')">
                      <td>${rankBadge(i)}</td>
                      <td style="font-weight:700;">${escapeHtml(d.name)}</td>
                      <td><span class="tag blue" style="font-size:10px">${escapeHtml(d.section)}</span></td>
                      <td class="num">${fmt(d.total)}</td>
                      <td class="num" style="color:${t.color};font-weight:800;">${d.plTotal > 0 ? fmt(d.plTotal) : '<span style="color:var(--text-muted);">—</span>'}</td>
                      <td class="num">${d.plCount > 0 ? fmt(d.plCount) : '<span style="color:var(--text-muted);">—</span>'}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:7px;">
                          <div style="width:55px;height:5px;background:var(--border);border-radius:3px;overflow:hidden;">
                            <div style="height:100%;width:${plBar}%;background:${t.color};border-radius:3px;"></div>
                          </div>
                          <span style="color:${t.color};font-weight:800;font-size:12px;">${d.plPct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style="min-width:160px;">${topPL || '<span style="color:var(--text-muted);font-size:11px;">لا توجد كتابات PL</span>'}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      }).join('')}
    </div>`;

  // ── الشارتات ──
  setTimeout(() => {
    const c = chartColors();

    // Pie chart
    destroyChart('loyaltyPie');
    const ctxPie = document.getElementById('loyaltyPie');
    if (ctxPie) {
      charts['loyaltyPie'] = new Chart(ctxPie,{
        type: 'doughnut',
        data: {
          labels: ['مخلص', 'منتظم', 'يحتاج تطوير', 'لم يكتب بعد'],
          datasets: [{
            data: [counts.loyal, counts.regular, counts.developing, counts.not_written],
            backgroundColor: ['rgba(13,148,136,.75)','rgba(37,99,235,.75)','rgba(217,119,6,.75)','rgba(220,38,38,.75)'],
            borderWidth: 0, hoverOffset: 12
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '58%',
          plugins: { legend: { position: 'bottom', labels: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 11 }, boxWidth: 10, padding: 10 } }, tooltip: tt(c) }
        }
      });
    }

    // Bar chart: top 15 sorted by plPct descending, only those who wrote PL
    destroyChart('loyaltyBar');
    const ctxBar = document.getElementById('loyaltyBar');
    if (ctxBar) {
      const top15pl = allDocs.filter(d => d.plTotal > 0).slice(0, 12);
      charts['loyaltyBar'] = new Chart(ctxBar,{
        type: 'bar',
        data: {
          labels: top15pl.map(d => d.name.split(' ').slice(0,2).join('\n')),
          datasets: [{
            data: top15pl.map(d => +d.plPct.toFixed(1)),
            backgroundColor: top15pl.map(d => {
              const colorMap = {
                'loyal':       'rgba(13,148,136,.85)',
                'regular':     'rgba(37,99,235,.85)',
                'developing':  'rgba(217,119,6,.85)',
                'not_written': 'rgba(220,38,38,.85)'
              };
              return colorMap[d.tier] || 'rgba(37,99,235,.85)';
            }),
            borderColor: top15pl.map(d => {
              const colorMap = {
                'loyal':       '#0d9488',
                'regular':     '#2563eb',
                'developing':  '#d97706',
                'not_written': '#dc2626'
              };
              return colorMap[d.tier] || '#2563eb';
            }),
            borderWidth: 1.5, borderRadius: 6, borderSkipped: false
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { ...tt(c), callbacks: {
              title: items => top15pl[items[0].dataIndex].name,
              label: ctx => [
                ` نسبة PL: ${ctx.raw}%`,
                ` كتابات PL: ${fmt(top15pl[ctx.dataIndex].plTotal)}`,
                ` إجمالي: ${fmt(top15pl[ctx.dataIndex].total)}`,
                ` التصنيف: ${top15pl[ctx.dataIndex].tierAr}`
              ]
            }}
          },
          scales: {
            x: {
              ticks: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 11 }, maxRotation: 35, minRotation: 20 },
              grid: { display: false }
            },
            y: {
              ticks: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 11 }, callback: v => v + '%' },
              grid: { color: c.grid },
              max: 100
            }
          }
        }
      });
    }
  }, 60);
}

// ══════════════════════════════════════════
// SECTION 13 — DOCTOR DEPENDENCY RISK
// يحلل اعتماد الصيدلية على أطباء بعينهم
// ويكشف الأطباء الأعلى خطورة لو انسحبوا
// ══════════════════════════════════════════
function renderBasket() {
  const container = document.getElementById('basket-content');
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  if (!loaded.length) {
    container.innerHTML = `<div class="card"><div class="pl-no-data"><span class="nd-ico">↑</span><h3>لا توجد بيانات — يرجى رفع ملف الفرع أولاً</h3></div></div>`;
    return;
  }

  // ── تجميع بيانات الأطباء من كل الفروع ──
  const docAgg = new Map();
  loaded.forEach(b => {
    STATE.data[b].doctors.forEach(doc => {
      if (!docAgg.has(doc.name)) {
        docAgg.set(doc.name,{ name: doc.name, section: doc.section||'—', total: 0, branches: new Set(), drugs: new Map() });
      }
      const r = docAgg.get(doc.name);
      r.total += doc.total;
      r.branches.add(b);
      doc.drugs.forEach(dr => r.drugs.set(dr.name, (r.drugs.get(dr.name)||0) + dr.count));
    });
  });

  const grandTotal  = [...docAgg.values()].reduce((s,d) => s + d.total, 0);
  const totalDoctors = docAgg.size;

  // ── حساب نسبة كل طبيب وتصنيف الخطورة ──
  const allDocs = [...docAgg.values()].map(d => {
    const drugList = [...d.drugs.entries()].map(([n,c])=>({name:n,count:c})).sort((a,b)=>b.count-a.count);
    const topDrug  = drugList[0] || { name:'—', count:0 };
    const top3     = drugList.slice(0,3);
    const sharePct = grandTotal > 0 ? (d.total / grandTotal * 100) : 0;
    const branchCount = d.branches.size;

    // مستوى الخطورة
    let riskLevel, riskAr, riskColor, riskBg, riskBorder;
    if (sharePct >= 15) {
      riskLevel = 'critical'; riskAr = '🔴 خطر حرج';
      riskColor = '#dc2626'; riskBg = 'rgba(220,38,38,.1)'; riskBorder = 'rgba(220,38,38,.35)';
    } else if (sharePct >= 8) {
      riskLevel = 'high'; riskAr = '🟠 خطر عالٍ';
      riskColor = '#d97706'; riskBg = 'rgba(217,119,6,.1)'; riskBorder = 'rgba(217,119,6,.35)';
    } else if (sharePct >= 4) {
      riskLevel = 'medium'; riskAr = '🟡 خطر متوسط';
      riskColor = '#eab308'; riskBg = 'rgba(234,179,8,.08)'; riskBorder = 'rgba(234,179,8,.3)';
    } else if (sharePct >= 1) {
      riskLevel = 'low'; riskAr = '🟢 خطر منخفض';
      riskColor = '#0d9488'; riskBg = 'rgba(13,148,136,.07)'; riskBorder = 'rgba(13,148,136,.25)';
    } else {
      riskLevel = 'minimal'; riskAr = '⚪ هامشي';
      riskColor = 'var(--text-muted)'; riskBg = 'rgba(255,255,255,.03)'; riskBorder = 'rgba(255,255,255,.08)';
    }

    return { ...d, drugList, topDrug, top3, sharePct, branchCount, riskLevel, riskAr, riskColor, riskBg, riskBorder };
  }).sort((a,b) => b.sharePct - a.sharePct);

  // ── إحصائيات الخطورة ──
  const rCounts = { critical:0, high:0, medium:0, low:0, minimal:0 };
  allDocs.forEach(d => rCounts[d.riskLevel]++);
  const critDocs = allDocs.filter(d => d.riskLevel === 'critical');
  const highDocs  = allDocs.filter(d => d.riskLevel === 'high');
  const critShare = critDocs.reduce((s,d) => s+d.sharePct, 0).toFixed(1);

  // ── ملاحظات: توليد ملاحظات بناءً على البيانات ──
  const insights = [];

  if (critDocs.length > 0) {
    insights.push({
      icon:'⚠️', color:'#dc2626', bg:'rgba(220,38,38,.08)', border:'rgba(220,38,38,.2)',
      title: `اعتماد حرج على ${critDocs.length} طبيب`,
      body: `${critDocs.slice(0,3).map(d=>d.name).join('، ')} يمثلون ${critShare}% من إجمالي الكتابات — أي تغيير في علاقتنا معهم سيؤثر مباشرة على الأداء.`
    });
  }

  // طبيب يكتب دواء واحد فقط (Single-drug dependency)
  const singleDrugDocs = allDocs.filter(d => d.drugs.size === 1 && d.total >= 5);
  if (singleDrugDocs.length) {
    insights.push({
      icon:'💊', color:'#7c3aed', bg:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.2)',
      title: `${singleDrugDocs.length} طبيب يكتب صنفاً واحداً فقط`,
      body: 'أمثلة: ' + singleDrugDocs.slice(0,3).map(d => d.name + ' (كل كتاباته: ' + d.topDrug.name + ')').join('، ') + ' — فرصة لتوسيع سلتهم.'
    });
  }

  // طبيب في فرع واحد بس ونسبته عالية
  const singleBranchHighRisk = allDocs.filter(d => d.branchCount === 1 && d.sharePct >= 5);
  if (singleBranchHighRisk.length) {
    insights.push({
      icon:'🏪', color:'#06b6d4', bg:'rgba(6,182,212,.08)', border:'rgba(6,182,212,.2)',
      title: `${singleBranchHighRisk.length} طبيب مؤثر لكنه مرتبط بفرع واحد فقط`,
      body: `${singleBranchHighRisk.slice(0,3).map(d=>d.name).join('، ')} — لو انتقل أو توقف يتأثر فرع بالكامل. يُنصح بتعزيز العلاقة وتوزيع المخاطر.`
    });
  }

  // أعلى تركز: أعلى 10% أطباء يمثلون كم%
  const top10pct = Math.max(1, Math.ceil(allDocs.length * 0.1));
  const top10share = allDocs.slice(0, top10pct).reduce((s,d) => s + d.sharePct, 0).toFixed(1);
  insights.push({
    icon:'📊', color:'#2563eb', bg:'rgba(37,99,235,.08)', border:'rgba(37,99,235,.2)',
    title: `أعلى 10% من الأطباء (${top10pct} طبيب) يحركون ${top10share}% من الكتابات`,
    body: `هذا التركز ${parseFloat(top10share) >= 60 ? 'مرتفع — يستوجب تنويع قاعدة الأطباء وعدم الاكتفاء بالعلاقات الحالية' : 'معقول ويعكس توزيعاً صحياً نسبياً'}.`
  });

  // أطباء متعددي الفروع = ثروة
  const multiBranch = allDocs.filter(d => d.branchCount >= 2);
  if (multiBranch.length) {
    const mbShare = multiBranch.reduce((s,d) => s+d.sharePct, 0).toFixed(1);
    insights.push({
      icon:'🔗', color:'#0d9488', bg:'rgba(13,148,136,.08)', border:'rgba(13,148,136,.2)',
      title: `${multiBranch.length} طبيب يكتب في ${multiBranch.length > 1 ? 'فروع متعددة' : 'فرعين'} — نقطة قوة`,
      body: `يمثلون ${mbShare}% من الكتابات ومنتشرون في أكثر من فرع — أصول علائقية عالية القيمة يجب الحفاظ عليها.`
    });
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-head">
        <div class="card-title"><span class="dot"></span> تحليل الاعتماد على الأطباء — Doctor Dependency Risk</div>
      </div>

      <!-- KPI بطاقات سريعة -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:22px;">
        ${[
          { label:'🔴 خطر حرج', val: rCounts.critical, sub:'حصة ≥ 15%',      c:'#dc2626', bg:'rgba(220,38,38,.1)',   br:'rgba(220,38,38,.3)' },{ label:'🟠 خطر عالٍ', val: rCounts.high,     sub:'حصة 8–15%',      c:'#d97706', bg:'rgba(217,119,6,.1)',  br:'rgba(217,119,6,.3)' },{ label:'🟡 متوسط',    val: rCounts.medium,   sub:'حصة 4–8%',       c:'#eab308', bg:'rgba(234,179,8,.1)',   br:'rgba(234,179,8,.3)' },{ label:'🟢 منخفض',   val: rCounts.low,      sub:'حصة 1–4%',       c:'#0d9488', bg:'rgba(13,148,136,.1)',   br:'rgba(13,148,136,.3)' },{ label:'⚪ هامشي',    val: rCounts.minimal,  sub:'حصة < 1%',       c:'#94a3b8', bg:'rgba(148,163,184,.08)',br:'rgba(148,163,184,.2)' },
        ].map(k => `
          <div style="background:${k.bg};border:1.5px solid ${k.br};border-radius:var(--r-lg);padding:16px 14px;text-align:center;">
            <div style="font-size:12px;font-weight:800;color:${k.c};margin-bottom:8px;">${k.label}</div>
            <div style="font-size:32px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:${k.c};">${k.val}</div>
            <div style="font-size:10px;color:var(--text-dim);margin-top:5px;">${k.sub}</div>
          </div>`).join('')}
      </div>

      <!-- الشارتات -->
      <div class="grid-2" style="gap:16px;margin-bottom:20px;">
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">🥧 توزيع مستوى الخطورة</div>
          <div style="position:relative;height:220px;"><canvas id="depRiskPie"></canvas></div>
        </div>
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">📊 حجم الاعتماد — أعلى 15 طبيب</div>
          <div style="position:relative;height:220px;"><canvas id="depRiskBar"></canvas></div>
        </div>
      </div>

      <!-- ملاحظات -->
      <div style="margin-bottom:22px;">
        <div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">📌 ملاحظات على البيانات</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${insights.map(ins => `
            <div style="display:flex;gap:14px;align-items:flex-start;padding:14px 18px;background:${ins.bg};border:1px solid ${ins.border};border-radius:var(--r-lg);">
              <div style="font-size:22px;flex-shrink:0;width:40px;height:40px;background:${ins.bg};border:1px solid ${ins.border};border-radius:10px;display:flex;align-items:center;justify-content:center;">${ins.icon}</div>
              <div>
                <div style="font-size:13px;font-weight:800;color:${ins.color};margin-bottom:5px;">${ins.title}</div>
                <div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;">${ins.body}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- جدول الأطباء كامل -->
      <div>
        <div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">📋 جدول الاعتماد الكامل</div>
        <div style="max-height:560px;overflow-y:auto;">
          <table>
            <thead><tr>
              <th style="width:44px">#</th>
              <th>الطبيب</th>
              <th>التخصص</th>
              <th>إجمالي الكتابات</th>
              <th>حصته من المجمع</th>
              <th>أكثر دواء يكتبه</th>
              <th>أبرز 3 أصناف</th>
              <th>الفروع</th>
              <th>مستوى الخطورة</th>
            </tr></thead>
            <tbody>
              ${allDocs.map((d, i) => {
                const barW = Math.min(d.sharePct * 3, 100).toFixed(0);
                const top3tags = d.top3.map(dr =>
                  `<span style="display:inline-block;padding:1px 7px;margin:1px;border-radius:999px;font-size:9px;font-weight:700;background:${d.riskBg};border:1px solid ${d.riskBorder};color:${d.riskColor};">${escapeHtml(dr.name.slice(0,22))} <span style="opacity:.7;">(${dr.count})</span></span>`
                ).join('');
                return `<tr class="clickable" onclick="showDoctorMulti('${escapeAttr(d.name)}')">
                  <td>${rankBadge(i)}</td>
                  <td style="font-weight:700;">${escapeHtml(d.name)}</td>
                  <td><span class="tag blue" style="font-size:10px;">${escapeHtml(d.section)}</span></td>
                  <td class="num" style="font-weight:800;">${fmt(d.total)}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;min-width:130px;">
                      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${barW}%;background:${d.riskColor};border-radius:3px;transition:width .4s;"></div>
                      </div>
                      <span style="font-size:12px;font-weight:900;color:${d.riskColor};min-width:38px;">${d.sharePct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style="max-width:200px;">
                    <div style="font-size:12px;font-weight:700;color:var(--text);">${escapeHtml(d.topDrug.name)}</div>
                    <div style="font-size:10px;color:var(--text-dim);">${fmt(d.topDrug.count)} كتابة</div>
                  </td>
                  <td style="min-width:180px;">${top3tags}</td>
                  <td class="num">${fmt(d.branchCount)}</td>
                  <td><span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;color:${d.riskColor};background:${d.riskBg};border:1px solid ${d.riskBorder};">${d.riskAr}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  // ── الشارتات ──
  setTimeout(() => {
    const c = chartColors();

    // Pie
    destroyChart('depRiskPie');
    const ctxPie = document.getElementById('depRiskPie');
    if (ctxPie) {
      charts['depRiskPie'] = new Chart(ctxPie,{
        type: 'doughnut',
        data: {
          labels: ['خطر حرج','خطر عالٍ','متوسط','منخفض','هامشي'],
          datasets: [{
            data: [rCounts.critical, rCounts.high, rCounts.medium, rCounts.low, rCounts.minimal],
            backgroundColor: ['rgba(220,38,38,.8)','rgba(217,119,6,.8)','rgba(234,179,8,.8)','rgba(13,148,136,.8)','rgba(148,163,184,.5)'],
            borderWidth: 0, hoverOffset: 12
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '58%',
          plugins: { legend: { position:'bottom', labels:{ color:c.text, font:{family:'IBM Plex Sans Arabic',size:11}, boxWidth:10, padding:8 } }, tooltip: tt(c) }
        }
      });
    }

    // Bar: top 15 by share
    destroyChart('depRiskBar');
    const ctxBar = document.getElementById('depRiskBar');
    if (ctxBar) {
      const top15 = allDocs.slice(0, 15);
      charts['depRiskBar'] = new Chart(ctxBar,{
        type: 'bar',
        data: {
          labels: top15.map(d => d.name.split(' ').slice(0,2).join(' ')),
          datasets: [{
            data: top15.map(d => +d.sharePct.toFixed(2)),
            backgroundColor: top15.map(d => d.riskColor + 'cc'),
            borderColor:     top15.map(d => d.riskColor),
            borderWidth: 1.5, borderRadius: 5, borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { ...tt(c), callbacks: {
              title: items => top15[items[0].dataIndex].name,
              label: ctx => [
                ` حصته: ${ctx.raw}% من إجمالي الكتابات`,
                ` إجمالي: ${fmt(top15[ctx.dataIndex].total)} كتابة`,
                ` أكثر دواء: ${top15[ctx.dataIndex].topDrug.name}`,
                ` مستوى الخطورة: ${top15[ctx.dataIndex].riskAr}`
              ]
            }}
          },
          scales: {
            x: { ticks:{ color:c.text, font:{family:'IBM Plex Sans Arabic',size:10}, callback: v => v+'%' }, grid:{ color:c.grid } },
            y: { ticks:{ color:c.text, font:{family:'IBM Plex Sans Arabic',size:11} }, grid:{ display:false } }
          }
        }
      });
    }
  }, 60);
}

// ══════════════════════════════════════════
// SECTION 14 — ALERTS CENTER
// ══════════════════════════════════════════




/* renderHome() removed — merged into "نظرة عامة" (renderOverview) */

// ── تصدير الصفحة الرئيسية ──
function exportHomeExcel() {
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  if (!loaded.length) { toast('ارفع بيانات أولاً', 'error'); return; }

  const docAgg = new Map(), drugAgg = new Map();
  loaded.forEach(b => {
    STATE.data[b].doctors.forEach(d=>{const key=entityKey(d.name),entry=docAgg.get(key)||{name:d.name,total:0};entry.total+=d.total;docAgg.set(key,entry);});
    STATE.data[b].drugs.forEach(d=>{const key=entityKey(d.name),entry=drugAgg.get(key)||{name:d.name,total:0};entry.total+=d.total;drugAgg.set(key,entry);});
  });

  const wb = XLSX.utils.book_new();
  // Doctors sheet
  const docRows=[...docAgg.values()].sort((a,b)=>b.total-a.total).map((entry,i)=>({'الترتيب':i+1,'الطبيب':entry.name,'الكتابات':entry.total}));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(docRows), 'الأطباء');
  // Drugs sheet
  const drugRows=[...drugAgg.values()].sort((a,b)=>b.total-a.total).map((entry,i)=>({'الترتيب':i+1,'الدواء':entry.name,'الكتابات':entry.total}));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(drugRows), 'الأدوية');

  const date = PharmaCore.localDateKey();
  XLSX.writeFile(wb, `PharmaDash-ملخص-${date}.xlsx`);
  toast('تم تحميل ملف Excel');
}

function exportHomePDF() {
  if(!confirmSensitiveExport('ملف PDF المطبوع'))return;
  document.documentElement.dataset.printPrivacy=getExportPrivacyMode();
  window.print();
  setTimeout(()=>delete document.documentElement.dataset.printPrivacy,1000);
  toast('استخدم "حفظ كـ PDF" في نافذة الطباعة');
}


// ══════════════════════════════════════════
// SECTION 17 — DRUG INTELLIGENCE (الأدوية)
// يجمع 3 تحليلات في صفحة واحدة:
//   • معدل الرفض/الإلغاء لكل دواء (Rejection Rate)
//   • الأدوية اليتيمة (طبيب واحد فقط)
//   • رحلة الدواء التفصيلية (Drug Deep-Dive عبر picker)
// ══════════════════════════════════════════
function renderDrugIntel() {
  const container = document.getElementById('drugintel-content');
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  if (!loaded.length) {
    container.innerHTML = `<div class="card"><div class="pl-no-data"><span class="nd-ico">↑</span><h3>لا توجد بيانات — يرجى رفع ملف الفرع أولاً</h3></div></div>`;
    return;
  }

  // ── تجميع الأدوية من كل الفروع ──
  const drugAgg = new Map();
  loaded.forEach(b => {
    STATE.data[b].drugs.forEach(dr => {
      if (!drugAgg.has(dr.name)) {
        drugAgg.set(dr.name,{ name: dr.name, total: 0, doctors: new Map(), sections: new Map(), status: {}, patientCounts: new Map(), branches: new Map() });
      }
      const x = drugAgg.get(dr.name);
      x.total += dr.total;
      x.branches.set(b, (x.branches.get(b) || 0) + dr.total);
      (dr.doctors || []).forEach(doc => x.doctors.set(doc.name, (x.doctors.get(doc.name) || 0) + doc.count));
      (dr.sections || []).forEach(s => x.sections.set(s.name, (x.sections.get(s.name) || 0) + s.count));
      if (dr.status) Object.entries(dr.status).forEach(([k, v]) => x.status[k] = (x.status[k] || 0) + v);
    });
    (STATE.data[b].rows||[]).forEach(r=>{
      const x=drugAgg.get(r.service);if(!x)return;
      const key=patientIdentityKey(b,r.patient);if(key)x.patientCounts.set(key,(x.patientCounts.get(key)||0)+1);
    });
  });

  const allDrugs = [...drugAgg.values()].map(d => {
    const closed = d.status['Closed'] || 0;
    const canceled = d.status['Canceled'] || 0;
    const newO = d.status['New'] || 0;
    const decided = closed + canceled;
    const rejectionRate = decided > 0 ? (canceled / decided * 100) : 0;
    const docCount = d.doctors.size;
    const topDoctor = [...d.doctors.entries()].sort((a, b) => b[1] - a[1])[0];
    const topSection = [...d.sections.entries()].sort((a, b) => b[1] - a[1])[0];
    const plInfo=findPrivateLabelProduct(d.name),isPL=!!plInfo;
    return {
      name: d.name, total: d.total, docCount, closed, canceled, newO, rejectionRate,
      patients: d.patientCounts.size, repeatPatients: [...d.patientCounts.values()].filter(c=>c>1).length, isPL, plName: plInfo ? plInfo.name : null,
      topDoctor: topDoctor ? topDoctor[0] : '—',
      topSection: topSection ? topSection[0] : '—',
      branches: [...d.branches.entries()].map(([n, c]) => ({ name: BRANCH_LABELS[n] || n, count: c })).sort((a, b) => b.count - a.count),
      doctors: [...d.doctors.entries()].map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count),
      sections: [...d.sections.entries()].map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count)
    };
  }).sort((a, b) => b.total - a.total);

  // اليتيمة: طبيب واحد فقط + حجم معقول
  const orphans = allDrugs.filter(d => d.docCount === 1 && d.total >= 3).sort((a, b) => b.total - a.total);
  // عالية الرفض
  const highReject = allDrugs.filter(d => d.rejectionRate >= 5 && (d.closed + d.canceled) >= 3).sort((a, b) => b.rejectionRate - a.rejectionRate);

  const grandTotal = allDrugs.reduce((s, d) => s + d.total, 0);
  const totalCanceled = allDrugs.reduce((s, d) => s + d.canceled, 0);
  const totalClosed = allDrugs.reduce((s, d) => s + d.closed, 0);
  const overallReject = (totalClosed + totalCanceled) > 0 ? (totalCanceled / (totalClosed + totalCanceled) * 100).toFixed(1) : '0.0';

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-head"><div class="card-title"><span class="dot"></span> الأدوية</div></div>

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
        ${[
          { label: 'إجمالي الأصناف', val: fmt(allDrugs.length), icon: '💊', c: 'var(--violet-l)', bg: 'rgba(37,99,235,.1)', br: 'rgba(37,99,235,.25)' },{ label: 'أدوية يتيمة', val: fmt(orphans.length), icon: '📦', c: 'var(--amber-l)', bg: 'rgba(217,119,6,.1)', br: 'rgba(217,119,6,.25)' },{ label: 'عالية الرفض', val: fmt(highReject.length), icon: '⚠️', c: 'var(--rose-l)', bg: 'rgba(220,38,38,.1)', br: 'rgba(220,38,38,.25)' },{ label: 'معدل الرفض العام', val: overallReject + '%', icon: '🔄', c: 'var(--sky-l)', bg: 'rgba(2,132,199,.1)', br: 'rgba(2,132,199,.25)' },
        ].map(k => `
          <div style="background:${k.bg};border:1px solid ${k.br};border-radius:var(--r-lg);padding:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="font-size:11px;font-weight:800;color:${k.c};">${k.label}</div><div style="font-size:18px;">${k.icon}</div>
            </div>
            <div style="font-size:26px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:${k.c};">${k.val}</div>
          </div>`).join('')}
      </div>

      <!-- Drug Deep-Dive Picker -->
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px;">
        <div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">🔍 رحلة الدواء — اختر دواء للتحليل التفصيلي</div>

        <!-- وصول سريع لمنتجات Private Label -->
        <div style="margin-bottom:14px;">
          <div style="font-size:10px;font-weight:800;color:#db2777;letter-spacing:.4px;margin-bottom:8px;">⭐ منتجاتنا الخاصة — وصول سريع</div>
          <div style="display:flex;flex-wrap:wrap;gap:7px;">
            ${(() => {
              return PRIVATE_LABEL.map(p => {
                const found = allDrugs.find(d=>findPrivateLabelProduct(d.name)?.key===p.key);
                const cnt = found ? found.total : 0;
                const active = cnt > 0;
                return `<button onclick="${active ? `showDrugDeepDive('${escapeAttr(found.name)}')` : ''}"
                  style="display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;font-size:12px;font-weight:700;font-family:inherit;cursor:${active ? 'pointer' : 'default'};
                  background:${active ? 'rgba(219,39,119,.12)' : 'var(--bg-glass2)'};border:1px solid ${active ? 'rgba(219,39,119,.35)' : 'var(--border)'};color:${active ? '#f9a8d4' : 'var(--text-muted)'};opacity:${active ? 1 : .5};">
                  ${escapeHtml(p.name)} <span style="font-weight:900;font-family:'Inter','Alexandria',sans-serif;">${active ? fmt(cnt) : '—'}</span>
                </button>`;
              }).join('');
            })()}
          </div>
        </div>

        <input type="text" id="drugIntelSearch" placeholder="ابحث عن أي دواء..." oninput="filterDrugIntelList(this.value)"
          style="width:100%;padding:12px 16px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);color:var(--text);font-family:inherit;font-size:13px;margin-bottom:12px;outline:none;">
        <div id="drugIntelList" style="max-height:200px;overflow-y:auto;"></div>
      </div>

      <div id="drugDeepDive" style="margin-top:16px;"></div>
    </div>

    <!-- أعلى الأدوية رفضاً -->
    ${highReject.length ? `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-head"><div class="card-title"><span class="dot" style="background:var(--rose);"></span> ⚠️ أعلى الأدوية رفضاً/إلغاءً</div>
        <span style="font-size:11px;color:var(--text-dim);">أصناف يُلغى صرفها كثيراً — تستحق المراجعة</span>
      </div>
      <div style="max-height:380px;overflow-y:auto;">
        <table>
          <thead><tr><th style="width:44px">#</th><th>الدواء</th><th>كُتب</th><th>صُرف</th><th>أُلغي</th><th style="width:160px">معدل الرفض</th><th>أكثر من يكتبه</th></tr></thead>
          <tbody>
            ${highReject.slice(0, 25).map((d, i) => `
              <tr class="clickable" onclick="showDrugDeepDive('${escapeAttr(d.name)}')">
                <td>${rankBadge(i)}</td>
                <td style="font-weight:700;max-width:240px;"><div style="white-space:normal;word-break:break-word;line-height:1.4;font-size:12px;">${escapeHtml(d.name)}</div></td>
                <td class="num">${fmt(d.total)}</td>
                <td class="num" style="color:var(--teal-l);">${fmt(d.closed)}</td>
                <td class="num" style="color:var(--rose-l);">${fmt(d.canceled)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                      <div style="height:100%;width:${Math.min(d.rejectionRate, 100).toFixed(0)}%;background:var(--rose);border-radius:3px;"></div>
                    </div>
                    <span style="font-size:12px;font-weight:800;color:var(--rose-l);min-width:42px;">${d.rejectionRate.toFixed(1)}%</span>
                  </div>
                </td>
                <td style="font-size:11px;color:var(--text-dim);">${escapeHtml(d.topDoctor.split(' ').slice(0,2).join(' '))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <!-- الأدوية اليتيمة -->
    ${orphans.length ? `
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="dot" style="background:var(--amber);"></span> 📦 الأدوية اليتيمة — طبيب واحد فقط</div>
        <span style="font-size:11px;color:var(--text-dim);">لو توقف الطبيب يختفي الدواء — خطر تركز</span>
      </div>
      <div style="max-height:380px;overflow-y:auto;">
        <table>
          <thead><tr><th style="width:44px">#</th><th>الدواء</th><th>الكتابات</th><th>الطبيب الوحيد</th><th>التخصص</th><th>المرضى</th></tr></thead>
          <tbody>
            ${orphans.slice(0, 25).map((d, i) => `
              <tr class="clickable" onclick="showDrugDeepDive('${escapeAttr(d.name)}')">
                <td>${rankBadge(i)}</td>
                <td style="font-weight:700;max-width:240px;"><div style="white-space:normal;word-break:break-word;line-height:1.4;font-size:12px;">${escapeHtml(d.name)}</div></td>
                <td class="num" style="font-weight:800;color:var(--amber-l);">${fmt(d.total)}</td>
                <td style="font-size:12px;">${escapeHtml(d.topDoctor)}</td>
                <td><span class="tag blue" style="font-size:10px;">${escapeHtml(d.topSection)}</span></td>
                <td class="num">${fmt(d.patients)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}
  `;

  // حفظ القائمة الكاملة للبحث
  window._drugIntelAll = allDrugs;
  filterDrugIntelList('');
}

// فلترة قائمة الأدوية في الـ picker
function filterDrugIntelList(query) {
  const list = document.getElementById('drugIntelList');
  if (!list || !window._drugIntelAll) return;
  const q = (query || '').toLowerCase().trim();
  const filtered = q ? window._drugIntelAll.filter(d => d.name.toLowerCase().includes(q)) : window._drugIntelAll.slice(0, 30);
  if (!filtered.length) { list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">لا توجد نتائج</div>'; return; }
  list.innerHTML = filtered.slice(0, 50).map(d => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:var(--r-md);cursor:pointer;transition:background var(--t);margin-bottom:3px;" onmouseenter="this.style.background='var(--bg-glass2)'" onmouseleave="this.style.background=''" onclick="showDrugDeepDive('${escapeAttr(d.name)}')">
      <div class="drug-name" style="font-size:12.5px;font-weight:600;flex:1;min-width:0;">${escapeHtml(d.name)}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
        <span style="font-size:11px;color:var(--text-muted);">${d.docCount} طبيب</span>
        <span style="font-size:13px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:var(--violet-l);min-width:40px;text-align:left;">${fmt(d.total)}</span>
      </div>
    </div>`).join('');
}

// رحلة الدواء التفصيلية
function showDrugDeepDive(drugName) {
  const d = (window._drugIntelAll || []).find(x => x.name === drugName);
  if (!d) return;
  const box = document.getElementById('drugDeepDive');
  if (!box) return;

  const decided = d.closed + d.canceled;
  const convRate = decided > 0 ? (d.closed / decided * 100).toFixed(1) : '—';
  const repeatPct = d.patients > 0 ? (d.repeatPatients / d.patients * 100).toFixed(0) : 0;

  // الأدوية المنافسة: نفس التخصص الرئيسي، مرتبة بالحجم
  const mainSection = d.topSection;
  const competitors = (window._drugIntelAll || [])
    .filter(x => x.name !== d.name && x.topSection === mainSection && mainSection !== '—')
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
  const maxCompTotal = Math.max(d.total, ...competitors.map(c => c.total), 1);

  const accent = d.isPL ? '#db2777' : 'var(--violet-l)';
  const accentBg = d.isPL ? 'rgba(219,39,119,.08)' : 'rgba(37,99,235,.08)';
  const accentBorder = d.isPL ? 'rgba(219,39,119,.3)' : 'rgba(37,99,235,.25)';

  box.innerHTML = `
    <div style="background:linear-gradient(135deg,${accentBg},rgba(13,148,136,.03));border:1.5px solid ${accentBorder};border-radius:var(--r-lg);padding:20px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <span style="font-size:11px;color:${accent};font-weight:800;letter-spacing:.5px;">رحلة الدواء</span>
            ${d.isPL ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:999px;font-size:10px;font-weight:800;background:rgba(219,39,119,.15);border:1px solid rgba(219,39,119,.4);color:#f9a8d4;">⭐ منتج خاص — ${escapeHtml(d.plName||'')}</span>` : ''}
          </div>
          <div style="font-size:17px;font-weight:900;line-height:1.4;">${escapeHtml(d.name)}</div>
        </div>
        <div style="font-size:30px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:${accent};">${fmt(d.total)}<span style="font-size:13px;color:var(--text-dim);font-weight:600;"> كتابة</span></div>
      </div>

      <!-- مؤشرات سريعة -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:18px;">
        ${[
          { l: 'الأطباء', v: fmt(d.docCount), c: 'var(--teal-l)' },{ l: 'المرضى', v: fmt(d.patients), c: 'var(--sky-l)' },{ l: 'صُرف فعلاً', v: fmt(d.closed), c: 'var(--teal-l)' },{ l: 'أُلغي', v: fmt(d.canceled), c: 'var(--rose-l)' },{ l: 'معدل الصرف', v: convRate === '—' ? '—' : convRate + '%', c: 'var(--violet-l)' },{ l: 'مرضى متكررون', v: repeatPct + '%', c: 'var(--amber-l)' },
        ].map(x => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:12px;text-align:center;">
            <div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:5px;">${x.l}</div>
            <div style="font-size:19px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:${x.c};">${x.v}</div>
          </div>`).join('')}
      </div>

      <div class="grid-2" style="gap:16px;margin-bottom:16px;">
        <!-- من يكتبه -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.4px;text-transform:uppercase;margin-bottom:12px;">👨‍⚕️ من يكتب هذا الدواء</div>
          ${d.doctors.slice(0, 7).map((doc, i) => `
            <div style="display:flex;align-items:center;gap:9px;margin-bottom:7px;cursor:pointer;" onclick="showDoctorMulti('${escapeAttr(doc.name)}')">
              <span class="rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal'}">${i + 1}</span>
              <div style="flex:1;min-width:0;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(doc.name)}</div>
              <span style="font-size:12px;font-weight:800;color:${accent};">${fmt(doc.count)}</span>
            </div>`).join('')}
        </div>
        <!-- في أي تخصص -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.4px;text-transform:uppercase;margin-bottom:12px;">🏥 في أي تخصص يُكتب</div>
          ${d.sections.slice(0, 7).map((s) => {
            const pct = d.total > 0 ? (s.count / d.total * 100).toFixed(0) : 0;
            return `<div style="margin-bottom:9px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                <span style="font-size:11.5px;font-weight:600;">${escapeHtml(s.name)}</span>
                <span style="font-size:11px;font-weight:800;color:var(--teal-l);">${fmt(s.count)} (${pct}%)</span>
              </div>
              <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:var(--gt);border-radius:2px;"></div></div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="grid-2" style="gap:16px;">
        <!-- توزيع الفروع -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.4px;text-transform:uppercase;margin-bottom:12px;">🏪 التوزيع عبر الفروع</div>
          ${d.branches.map((br) => {
            const pct = d.total > 0 ? (br.count / d.total * 100).toFixed(0) : 0;
            return `<div style="margin-bottom:10px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                <span style="font-size:12px;font-weight:600;">${escapeHtml(br.name)}</span>
                <span style="font-size:12px;font-weight:800;color:var(--sky-l);">${fmt(br.count)} (${pct}%)</span>
              </div>
              <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:var(--gv);border-radius:3px;"></div></div>
            </div>`;
          }).join('')}
        </div>
        <!-- الأدوية المنافسة -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.4px;text-transform:uppercase;margin-bottom:12px;">⚔️ أدوية منافسة في ${escapeHtml(mainSection)}</div>
          ${competitors.length ? `
            <!-- الدواء الحالي أولاً للمقارنة -->
            <div style="margin-bottom:9px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                <span style="font-size:11.5px;font-weight:800;color:${accent};">▸ ${escapeHtml(d.name.slice(0,28))}</span>
                <span style="font-size:11px;font-weight:800;color:${accent};">${fmt(d.total)}</span>
              </div>
              <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${(d.total/maxCompTotal*100).toFixed(0)}%;background:${accent};border-radius:3px;"></div></div>
            </div>
            ${competitors.map(comp => {
              return `<div style="margin-bottom:9px;cursor:pointer;" onclick="showDrugDeepDive('${escapeAttr(comp.name)}')">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                  <span class="drug-name" style="font-size:11px;font-weight:600;color:var(--text-dim);max-width:170px;display:inline-block;">${escapeHtml(comp.name)}</span>
                  <span style="font-size:11px;font-weight:700;color:var(--text-muted);">${fmt(comp.total)}</span>
                </div>
                <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="height:100%;width:${(comp.total/maxCompTotal*100).toFixed(0)}%;background:var(--text-muted);border-radius:2px;"></div></div>
              </div>`;
            }).join('')}
          ` : '<div style="font-size:12px;color:var(--text-muted);padding:12px 0;">لا توجد أدوية أخرى في نفس التخصص</div>'}
        </div>
      </div>
    </div>`;

  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


// ══════════════════════════════════════════
// SECTION 18 — TARGET TRACKING (متابعة أصناف الأوفرستوك)
// يقيس تطور صرف أصناف أوفرستوك عبر الفترات الزمنية
// يعتمد على STATE.periods[branch] = [{label, rows, data}, ...]
// ══════════════════════════════════════════
function renderTargetTrack() {
  const container = document.getElementById('targettrack-content');

  // الفروع اللي عندها فترتين أو أكثر
  const eligible = BRANCHES.filter(b=>datedComparisonPeriods(STATE.periods[b]).length>=2);

  if (!eligible.length) {
    container.innerHTML = `
      <div class="card">
        <div class="pl-no-data" style="padding:48px 20px;text-align:center;">
          <span class="nd-ico" style="font-size:48px;">📊</span>
          <h3 style="margin:14px 0 8px;">متابعة أصناف أوفرستوك عبر الزمن</h3>
          <p style="color:var(--text-dim);font-size:13px;line-height:1.7;max-width:460px;margin:0 auto;">
            لقياس هل زاد صرف أصناف أوفرستوك بعد شغلك مع الأطباء، تحتاج ترفع <b>فترتين على الأقل</b>:<br>
            مثلاً تقرير شهر أبريل (الأساس) وتقرير شهر مايو (الحالي).<br><br>
            اضغط زر <b>"+ فترة"</b> بجانب أي فرع وارفع تقرير كل فترة.
          </p>
        </div>
      </div>`;
    return;
  }

  const branchOpts = eligible.map(b =>
    `<option value="${b}">${BRANCH_LABELS[b]} (${datedComparisonPeriods(STATE.periods[b]).length} فترة مؤرخة)</option>`).join('');

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-head" style="flex-wrap:wrap;gap:10px;">
        <div class="card-title"><span class="dot"></span> 🎯 متابعة أصناف أوفرستوك عبر الزمن</div>
      </div>

      <div class="tc-selector">
        <div class="tc-sel-group">
          <div class="tc-sel-label">الفرع</div>
          <select class="select" id="tt-branch" style="min-width:170px;">${branchOpts}</select>
        </div>
        <div class="tc-sel-group">
          <div class="tc-sel-label">الفترة الأساس (قبل)</div>
          <select class="select" id="tt-base" style="min-width:160px;"></select>
        </div>
        <div class="tc-sel-group">
          <div class="tc-sel-label">الفترة الحالية (بعد)</div>
          <select class="select" id="tt-current" style="min-width:160px;"></select>
        </div>
        <button class="btn" style="background:var(--grad-p);color:#fff;border-color:transparent;align-self:flex-end;" onclick="buildTargetTrack()">قياس التغيّر ←</button>
      </div>

      <!-- فلتر نوع الأصناف -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
        <button class="tt-filter-btn filter-btn-pill on" data-filter="all" onclick="setTargetFilter('all')">كل المستهدف</button>
        <button class="tt-filter-btn filter-btn-pill off" data-filter="pl" onclick="setTargetFilter('pl')">⭐ منتجاتنا الخاصة</button>
        <button class="tt-filter-btn filter-btn-pill off" data-filter="written" onclick="setTargetFilter('written')">المكتوب فقط</button>
      </div>
      <!-- فلتر الحالة -->
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;align-items:center;">
        <span style="font-size:11px;font-weight:700;color:var(--text-muted);">الحالة:</span>
        <button class="tt-status-btn filter-btn-pill on" data-status="all" onclick="setStatusFilter('all')">الكل</button>
        <button class="tt-status-btn filter-btn-pill off" data-status="grew" onclick="setStatusFilter('grew')">📈 نجح</button>
        <button class="tt-status-btn filter-btn-pill off" data-status="dropped" onclick="setStatusFilter('dropped')">📉 تراجع</button>
        <button class="tt-status-btn filter-btn-pill off" data-status="new" onclick="setStatusFilter('new')">🆕 بدأ</button>
        <button class="tt-status-btn filter-btn-pill off" data-status="stopped" onclick="setStatusFilter('stopped')">⛔ توقف</button>
        <button class="tt-status-btn filter-btn-pill off" data-status="stable" onclick="setStatusFilter('stable')">➖ ثابت</button>
      </div>
    </div>

    <div id="tt-result"></div>`;

  function refreshTT() {
    const b = document.getElementById('tt-branch').value;
    const periods=datedComparisonPeriods(STATE.periods[b]);
    const opts = periods.map((p, i) => `<option value="${i}">${escapeHtml(p.label)} (${fmt((p.rows || []).length)})</option>`).join('');
    document.getElementById('tt-base').innerHTML = opts;
    document.getElementById('tt-current').innerHTML = opts;
    if (periods.length >= 2) {
      // الأقدم = أساس، الأحدث = حالي
      document.getElementById('tt-base').value = '0';
      document.getElementById('tt-current').value = String(periods.length - 1);
    }
    buildTargetTrack();
  }
  document.getElementById('tt-branch').addEventListener('change', refreshTT);
  window._ttFilter = 'all';
  window._ttStatus = 'all';
  refreshTT();
}

function setTargetFilter(f) {
  window._ttFilter = f;
  document.querySelectorAll('.tt-filter-btn').forEach(btn => {
    const active = btn.dataset.filter === f;
    btn.classList.toggle('on', active);
    btn.classList.toggle('off', !active);
    btn.style.background=''; btn.style.color=''; btn.style.border='';
  });
  buildTargetTrack();
}

function setStatusFilter(s) {
  window._ttStatus = s;
  document.querySelectorAll('.tt-status-btn').forEach(btn => {
    const active = btn.dataset.status === s;
    btn.classList.toggle('on', active);
    btn.classList.toggle('off', !active);
    btn.style.background=''; btn.style.color=''; btn.style.border='';
  });
  buildTargetTrack();
}

function buildTargetTrack() {
  const branchEl = document.getElementById('tt-branch');
  if (!branchEl) return;
  const branch = branchEl.value;
  const periods=datedComparisonPeriods(STATE.periods[branch]);
  if (!periods || !periods.length) return;

  const iBase = parseInt(document.getElementById('tt-base').value);
  const iCur = parseInt(document.getElementById('tt-current').value);
  const pBase = periods[iBase];
  const pCur = periods[iCur];
  const result = document.getElementById('tt-result');
  if (!pBase || !pCur) return;

  const filter = window._ttFilter || 'all';

  // دالة: تجمع صرف صنف مستهدف في فترة معينة
  function countInPeriod(periodData, prodName) {
    if (!periodData || !periodData.drugs) return { total: 0, doctors: new Map() };
    let total = 0;
    const doctors = new Map();
    periodData.drugs.filter(x => matchesTarget(x.name, prodName)).forEach(m => {
      total += m.total;
      (m.doctors || []).forEach(dr => {const key=entityKey(dr.name);if(key&&!doctors.has(key))doctors.set(key,dr.name);});
    });
    return { total, doctors };
  }

  // احسب لكل صنف مستهدف
  let rows = TARGET_PRODUCTS.map(prod => {
    const base = countInPeriod(pBase.data, prod.name);
    const cur = countInPeriod(pCur.data, prod.name);
    const change = cur.total - base.total;
    const changePct = base.total > 0 ? (change / base.total * 100) : (cur.total > 0 ? 100 : 0);
    const isPL=!!findPrivateLabelProduct(prod.short)||!!findPrivateLabelProduct(prod.name);
    // أطباء جدد بدأوا يكتبوه
    const newDoctors=[...cur.doctors].filter(([key])=>!base.doctors.has(key)).map(([,name])=>name);
    const lostDoctors=[...base.doctors].filter(([key])=>!cur.doctors.has(key)).map(([,name])=>name);
    return {
      id: prod.id, name: prod.name, short: prod.short, isPL,
      baseTotal: base.total, curTotal: cur.total, change, changePct,
      baseDocs: base.doctors.size, curDocs: cur.doctors.size,
      newDoctors, lostDoctors
    };
  });

  // فلترة
  if (filter === 'pl') rows = rows.filter(r => r.isPL);
  if (filter === 'written') rows = rows.filter(r => r.curTotal > 0 || r.baseTotal > 0);

  // فلتر الحالة — احسب حالة كل صف ثم فلتر
  const statusFilter = window._ttStatus || 'all';
  function rowStatus(r){
    if (r.baseTotal === 0 && r.curTotal > 0) return 'new';
    if (r.baseTotal > 0 && r.curTotal === 0) return 'stopped';
    if (r.change > 0) return 'grew';
    if (r.change < 0) return 'dropped';
    if (r.curTotal > 0) return 'stable';
    return 'none';
  }
  if (statusFilter !== 'all') rows = rows.filter(r => rowStatus(r) === statusFilter);

  // ترتيب: الأكثر نمواً أولاً
  rows.sort((a, b) => b.change - a.change);

  // إحصائيات
  const grew = rows.filter(r => r.change > 0).length;
  const dropped = rows.filter(r => r.change < 0).length;
  const stable = rows.filter(r => r.change === 0 && r.curTotal > 0).length;
  const newlyStarted = rows.filter(r => r.baseTotal === 0 && r.curTotal > 0).length;
  const stopped = rows.filter(r => r.baseTotal > 0 && r.curTotal === 0).length;
  const totalBase = rows.reduce((s, r) => s + r.baseTotal, 0);
  const totalCur = rows.reduce((s, r) => s + r.curTotal, 0);
  const totalChangePct = totalBase > 0 ? ((totalCur - totalBase) / totalBase * 100).toFixed(1) : '—';

  result.innerHTML = `
    <!-- ملخص النتيجة -->
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
        <span style="font-size:13px;color:var(--text-dim);">المقارنة:</span>
        <span style="padding:4px 12px;border-radius:999px;background:rgba(13,148,136,.12);border:1px solid rgba(13,148,136,.3);font-size:12px;font-weight:700;color:var(--teal-l);">${escapeHtml(pBase.label)}</span>
        <span style="font-size:16px;">←</span>
        <span style="padding:4px 12px;border-radius:999px;background:rgba(37,99,235,.12);border:1px solid rgba(37,99,235,.3);font-size:12px;font-weight:700;color:var(--violet-l);">${escapeHtml(pCur.label)}</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">
        ${[
          { l: 'إجمالي التغيّر', v: (totalChangePct !== '—' ? (parseFloat(totalChangePct) >= 0 ? '+' : '') + totalChangePct + '%' : '—'), c: totalChangePct !== '—' && parseFloat(totalChangePct) >= 0 ? 'var(--teal-l)' : 'var(--rose-l)', sub: `${fmt(totalBase)} ← ${fmt(totalCur)}` },{ l: '📈 زاد', v: fmt(grew), c: 'var(--teal-l)', sub: 'صنف' },{ l: '📉 نقص', v: fmt(dropped), c: 'var(--rose-l)', sub: 'صنف' },{ l: '🆕 بدأ صرفه', v: fmt(newlyStarted), c: 'var(--violet-l)', sub: 'صنف جديد' },{ l: '⛔ توقف', v: fmt(stopped), c: 'var(--amber-l)', sub: 'صنف' },
        ].map(k => `
          <div style="background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;text-align:center;">
            <div style="font-size:10px;font-weight:800;color:var(--text-muted);letter-spacing:.3px;margin-bottom:7px;">${k.l}</div>
            <div style="font-size:24px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:${k.c};">${k.v}</div>
            <div style="font-size:10px;color:var(--text-dim);margin-top:3px;">${k.sub}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- جدول التفصيل -->
    <div class="card">
      <div class="card-head"><div class="card-title"><span class="dot"></span> تفصيل أصناف أوفرستوك (${rows.length})</div>
        <span style="font-size:11px;color:var(--text-dim);">مرتبة بالأكثر نمواً</span>
      </div>
      <div style="max-height:600px;overflow-y:auto;">
        <table>
          <thead><tr>
            <th style="width:40px">#</th>
            <th>الصنف المستهدف</th>
            <th>قبل</th>
            <th>بعد</th>
            <th style="width:170px">التغيّر</th>
            <th>أطباء (قبل→بعد)</th>
            <th>أطباء جدد</th>
            <th>الحالة</th>
          </tr></thead>
          <tbody>
            ${rows.map((r, i) => {
              let statusLabel, statusColor, statusBg;
              if (r.baseTotal === 0 && r.curTotal > 0) { statusLabel = '🆕 بدأ'; statusColor = 'var(--violet-l)'; statusBg = 'rgba(37,99,235,.12)'; }
              else if (r.baseTotal > 0 && r.curTotal === 0) { statusLabel = '⛔ توقف'; statusColor = 'var(--amber-l)'; statusBg = 'rgba(217,119,6,.12)'; }
              else if (r.change > 0) { statusLabel = '📈 نجح'; statusColor = 'var(--teal-l)'; statusBg = 'rgba(13,148,136,.12)'; }
              else if (r.change < 0) { statusLabel = '📉 تراجع'; statusColor = 'var(--rose-l)'; statusBg = 'rgba(220,38,38,.12)'; }
              else if (r.curTotal > 0) { statusLabel = '➖ ثابت'; statusColor = 'var(--sky-l)'; statusBg = 'rgba(2,132,199,.12)'; }
              else { statusLabel = '— لا صرف'; statusColor = 'var(--text-muted)'; statusBg = 'rgba(255,255,255,.03)'; }

              const changeColor = r.change > 0 ? 'var(--teal-l)' : r.change < 0 ? 'var(--rose-l)' : 'var(--text-muted)';
              const changeIcon = r.change > 0 ? '↑' : r.change < 0 ? '↓' : '';
              const pctText = r.baseTotal === 0 ? (r.curTotal > 0 ? 'جديد' : '—') : (r.changePct >= 0 ? '+' : '') + r.changePct.toFixed(0) + '%';

              return `<tr ${r.curTotal === 0 && r.baseTotal === 0 ? 'style="opacity:.45;"' : ''}>
                <td>${i + 1}</td>
                <td style="max-width:240px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    ${r.isPL ? '<span style="font-size:11px;">⭐</span>' : ''}
                    <span style="font-weight:700;font-size:12px;white-space:normal;word-break:break-word;line-height:1.4;">${escapeHtml(r.short)}</span>
                  </div>
                  <div style="font-size:9.5px;color:var(--text-dim);margin-top:2px;white-space:normal;word-break:break-word;">${escapeHtml(r.name.slice(0, 45))}</div>
                </td>
                <td class="num" style="color:var(--text-muted);">${fmt(r.baseTotal)}</td>
                <td class="num" style="font-weight:800;color:${changeColor};">${fmt(r.curTotal)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:13px;font-weight:900;color:${changeColor};min-width:50px;">${changeIcon} ${r.change >= 0 ? '+' : ''}${fmt(r.change)}</span>
                    <span style="font-size:11px;font-weight:700;color:${changeColor};padding:1px 8px;border-radius:999px;background:${statusBg};">${pctText}</span>
                  </div>
                </td>
                <td class="num" style="font-size:12px;">${r.baseDocs} <span style="color:var(--text-muted);">→</span> ${r.curDocs}</td>
                <td>
                  ${r.newDoctors.length ? `<span style="font-size:11px;color:var(--teal-l);font-weight:700;cursor:help;" title="${escapeAttr(r.newDoctors.join('، '))}">+${r.newDoctors.length} طبيب</span>` : '<span style="color:var(--text-muted);font-size:11px;">—</span>'}
                </td>
                <td><span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;color:${statusColor};background:${statusBg};">${statusLabel}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}


// ══════════════════════════════════════════
// SECTION 19 — SMART TARGET ALERTS (تنبيهات ذكية)
// تنبيهات تلقائية مبنية على المقارنة بين الفترات + الحالة الحالية
// لا تعتمد على أي بيانات خارجية — كل شيء من STATE
// ══════════════════════════════════════════


// ══════════════════════════════════════════
// SECTION 20 — VISIT PLAN (خطة الزيارات)
// يرتّب الأطباء حسب الأولوية لتحديد من تزوره أولاً
// معايير الأولوية:
//   • حجم كتابة عالٍ + لا يكتب Private Label = أولوية قصوى (فرصة)
//   • طبيب نقص نشاطه (مقارنة فترات) = أولوية عالية (إنقاذ)
//   • طبيب كبير ومخلص = صيانة علاقة
// ══════════════════════════════════════════



/* ════ وتيرة المستهدف: أيام العمل المتبقية بدون الجمعة ════ */
function plPaceInfo(remaining){
  var now = new Date();
  var end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  var days = 0;
  var d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while(d <= end){
    if(d.getDay() !== 5) days++;
    d.setDate(d.getDate() + 1);
  }
  var perDay = days > 0 ? (remaining / days) : remaining;
  return { days: days, perDay: perDay };
}

// ══════════════════════════════════════════
// SECTION — CONVERSION OPPORTUNITIES (فرص التحويل)
// لكل تخصص فيه نشاط، يعرض أكبر الأدوية المنافسة (غير PL)
// = الأدوية اللي ممكن تحوّل أطباءها لمنتجاتك الخاصة
// ══════════════════════════════════════════

/* ════════════════════════════════════════════════════
   COMPETITOR CUSTOMIZATION — تحكم يدوي في البدائل
   localStorage: pharmdash_comp_custom_v1 (بيانات صغيرة)
════════════════════════════════════════════════════ */
function getCompCustom(){
  const embedded=readEmbeddedBusiness('competitorCustom');if(embedded&&embedded.add&&embedded.exclude)return embedded;
  try{ var c=JSON.parse(localStorage.getItem('pharmdash_comp_custom_v1')); if(c&&c.add&&c.exclude) return c; }catch(e){}
  return {add:{},exclude:{}};
}
function saveCompCustom(c){
  if(saveEmbeddedBusiness('competitorCustom',c)){window._compCustom=c;return;}
  try{ localStorage.setItem('pharmdash_comp_custom_v1', JSON.stringify(c)); }catch(e){}
  window._compCustom=c;
}
function compIsMatch(def, svc){
  var cust = window._compCustom || (window._compCustom = getCompCustom());
  var ex = cust.exclude[def.key] || [];
  if(ex.indexOf(svc) > -1) return false;
  if(def.match(svc)) return true;
  var add = cust.add[def.key] || [];
  var u = svc.toLowerCase();
  for(var i=0;i<add.length;i++){ if(u.indexOf(String(add[i]).toLowerCase()) > -1) return true; }
  return false;
}
function compCustomChips(key){
  var cust = window._compCustom || (window._compCustom = getCompCustom());
  var adds = cust.add[key] || [];
  var exs = cust.exclude[key] || [];
  if(!adds.length && !exs.length) return '';
  var h = '<div style="margin-bottom:14px;padding:8px 10px;border:1px dashed var(--border-h);border-radius:var(--r-md);display:flex;flex-wrap:wrap;gap:7px;align-items:center;">';
  if(adds.length){
    h += '<span style="font-size:10.5px;color:var(--teal-l);font-weight:800;">بدائل يدوية:</span>';
    for(var i=0;i<adds.length;i++){
      h += '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;background:rgba(13,148,136,.1);border:1px solid rgba(13,148,136,.3);font-size:11px;font-weight:700;">'
         + escapeHtml(adds[i])
         + '<span onclick="removeCompTerm(\'' + key + '\',' + i + ')" style="cursor:pointer;color:var(--rose-l);font-weight:900;">×</span></span>';
    }
  }
  if(exs.length){
    h += '<span style="font-size:10.5px;color:var(--rose-l);font-weight:800;margin-right:6px;">مستبعَد (' + exs.length + '):</span>';
    for(var j=0;j<exs.length;j++){
      h += '<span class="drug-name" style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.25);font-size:10.5px;max-width:230px;">'
         + escapeHtml(exs[j])
         + '<span onclick="restoreComp(\'' + key + '\',' + j + ')" title="إرجاع كبديل" style="cursor:pointer;color:var(--teal-l);font-weight:900;">↩</span></span>';
    }
  }
  h += '</div>';
  return h;
}
function addCompTerm(key){
  var t = prompt('اكتب كلمة أو جزء من اسم الدواء ليُحتسب كبديل منافس\n(مثال: fastum أو deep heat)');
  if(t === null) return;
  t = t.trim();
  if(t.length < 2){ toast('اكتب كلمة من حرفين على الأقل','warn'); return; }
  var c = getCompCustom();
  if(!c.add[key]) c.add[key] = [];
  if(c.add[key].indexOf(t) > -1){ toast('الكلمة موجودة بالفعل','warn'); return; }
  c.add[key].push(t);
  saveCompCustom(c);
  toast('تمت إضافة "' + t + '" كبديل يدوي ✓','success');
  renderActive();
}
function removeCompTerm(key, idx){
  var c = getCompCustom();
  if(c.add[key] && c.add[key][idx] !== undefined){ c.add[key].splice(idx,1); saveCompCustom(c); toast('تم حذف الكلمة','success'); renderActive(); }
}
function excludeComp(key, name){
  var c = getCompCustom();
  if(!c.exclude[key]) c.exclude[key] = [];
  if(c.exclude[key].indexOf(name) === -1) c.exclude[key].push(name);
  saveCompCustom(c);
  toast('تم استبعاد الصنف من بدائل المنتج','success');
  renderActive();
}
function restoreComp(key, idx){
  var c = getCompCustom();
  if(c.exclude[key] && c.exclude[key][idx] !== undefined){ c.exclude[key].splice(idx,1); saveCompCustom(c); toast('تم إرجاع الصنف كبديل','success'); renderActive(); }
}

/* ════════════════════════════════════════════════════
   HUB TABS — دمج الأقسام (الأطباء/الأدوية/الأقسام)
════════════════════════════════════════════════════ */
function hubBar(el, items){
  if(!el) return;
  var h = '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">';
  for(var i=0;i<items.length;i++){
    h += '<button class="filter-btn-pill ' + (items[i].on?'on':'off') + '" onclick="' + items[i].fn + '">' + items[i].label + '</button>';
  }
  h += '</div>';
  el.innerHTML = h;
}
function renderDoctorsHub(d){
  window._docHubD = d;
  var t = window._docHub || 'list';
  hubBar(document.getElementById('docHubBar'), [
    {label:'👨‍⚕️ قائمة الأطباء', on:t==='list', fn:"setDocHub('list')"},{label:'🎯 لوحة طبيب تفصيلية', on:t==='dash', fn:"setDocHub('dash')"}
  ]);
  document.getElementById('doctors-content').style.display = (t==='list')?'block':'none';
  document.getElementById('docDash-content').style.display = (t==='dash')?'block':'none';
  if(t==='list') renderDocs(d); else renderDocDash(d);
}
function setDocHub(t){ window._docHub = t; if(window._docHubD) renderDoctorsHub(window._docHubD); }
function renderDrugsHub(d){
  window._drugHubD = d;
  var t = window._drugHub || 'list';
  hubBar(document.getElementById('drugHubBar'), [
    {label:'💊 قائمة الأدوية', on:t==='list', fn:"setDrugHub('list')"},{label:'🔍 بحث وتحليل دواء', on:t==='search', fn:"setDrugHub('search')"}
  ]);
  document.getElementById('drugs-content').style.display = (t==='list')?'block':'none';
  document.getElementById('drugDash-content').style.display = (t==='search')?'block':'none';
  if(t==='list') renderDrugs(d); else renderDrugDash(d);
}
function setDrugHub(t){ window._drugHub = t; if(window._drugHubD) renderDrugsHub(window._drugHubD); }
function renderSectionsHub(d){
  window._secHubD = d;
  var t = window._secHub || 'table';
  hubBar(document.getElementById('secHubBar'), [
    {label:'🏥 جدول الأقسام', on:t==='table', fn:"setSecHub('table')"},{label:'🧠 تحليل التخصصات', on:t==='spec', fn:"setSecHub('spec')"}
  ]);
  document.getElementById('sections-content').style.display = (t==='table')?'block':'none';
  document.getElementById('specialty-content').style.display = (t==='spec')?'block':'none';
  if(t==='table') renderSecs(d); else renderSpecialty();
}
function setSecHub(t){ window._secHub = t; if(window._secHubD) renderSectionsHub(window._secHubD); }

/* ════════════════════════════════════════════════════
   VISIT CARD — بطاقة زيارة الطبيب (قابلة للطباعة)
════════════════════════════════════════════════════ */
function renderVisitCard(d){
  var c = document.getElementById('visitcard-content');
  var opts = '';
  for(var i=0;i<d.doctors.length;i++){ opts += '<option>' + escapeHtml(d.doctors[i].name) + '</option>'; }
  c.innerHTML = '<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> 🪪 بطاقة زيارة طبيب — ' + BRANCH_LABELS[STATE.active] + '</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
    + '<select class="select" id="vcPicker" style="max-width:320px;">' + opts + '</select>'
    + '<button class="btn" onclick="printVisitCard()">🖨️ طباعة البطاقة</button>'
    + '</div></div><div id="vcBody"></div></div>';
  var sel = document.getElementById('vcPicker');
  sel.onchange = function(){ fillVisitCard(d, sel.value); };
  if(d.doctors.length) fillVisitCard(d, d.doctors[0].name);
}
function fillVisitCard(d, name){
  var x = null, rank = 0;
  for(var i=0;i<d.doctors.length;i++){ if(sameEntity(d.doctors[i].name,name)){ x = d.doctors[i]; rank = i+1; break; } }
  if(!x) return;
  var rows=(d.rows||[]).filter(function(r){return sameEntity(r.doctor,name);});
  // PL لكل منتج
  var plRows = [], plTotal = 0;
  for(var pi=0;pi<PRIVATE_LABEL.length;pi++){
    var pk = PRIVATE_LABEL[pi]; var cnt = 0;
    for(var ri=0;ri<rows.length;ri++){if(findPrivateLabelProduct(rows[ri].service)?.key===pk.key)cnt++;}
    if(cnt > 0){ plRows.push({name: pk.name, form: pk.form, count: cnt}); plTotal += cnt; }
  }
  // فرص البدائل لهذا الطبيب
  var opps = [];
  for(var ci=0;ci<COMP_MAP.length;ci++){
    var pl = COMP_MAP[ci]; var m = {}; var tot = 0;
    for(var rj=0;rj<rows.length;rj++){
      var svc = rows[rj].service; if(!svc) continue;
      var isPL=!!findPrivateLabelProduct(svc);
      if(!isPL && compIsMatch(pl, svc)){ m[svc] = (m[svc]||0)+1; tot++; }
    }
    if(tot > 0){
      var top = Object.keys(m).map(function(k){ return {n:k, c:m[k]}; }).sort(function(a,b){ return b.c - a.c; }).slice(0,3);
      opps.push({key:pl.key, name:pl.name, color:pl.color, bg:pl.bg, border:pl.border, tot:tot, top:top});
    }
  }
  opps.sort(function(a,b){ return b.tot - a.tot; });
  var topDrugs = (x.drugs || []).slice(0,10);

  var h = '';
  // رأس البطاقة
  h += '<div style="padding:18px;border-radius:var(--r-lg);background:linear-gradient(135deg,rgba(37,99,235,.12),rgba(13,148,136,.07));border:1px solid var(--border-h);margin-bottom:16px;">'
     + '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center;">'
     + '<div><div style="font-size:20px;font-weight:900;font-family:\'Inter\',\'Alexandria\',sans-serif;">' + escapeHtml(x.name) + '</div>'
     + '<div style="font-size:12px;color:var(--text-dim);margin-top:4px;">' + escapeHtml(x.section || '—') + ' · ' + BRANCH_LABELS[STATE.active] + ' · الترتيب #' + rank + ' من ' + d.doctors.length + '</div></div>'
     + '<span class="pill" style="background:rgba(13,148,136,.12);border:1px solid rgba(13,148,136,.3);color:var(--teal-l);font-weight:800;">بطاقة ما قبل الزيارة</span>'
     + '</div></div>';
  // KPIs
  h += '<div class="detail-grid">'
     + '<div class="detail-card"><div class="l">إجمالي الكتابات</div><div class="v">' + fmt(x.total) + '</div></div>'
     + '<div class="detail-card"><div class="l">أدوية مختلفة</div><div class="v">' + fmt(x.uniqueDrugs) + '</div></div>'
     + '<div class="detail-card"><div class="l">المرضى</div><div class="v">' + fmt(x.patients) + '</div></div>'
     + '<div class="detail-card"><div class="l">كتابات PL</div><div class="v" style="color:' + (plTotal>0?'var(--teal-l)':'var(--rose-l)') + ';">' + fmt(plTotal) + '</div></div>'
     + '</div>';
  // تاريخه مع PL
  h += '<div class="mini-head"><h3>⭐ تاريخه مع منتجاتك الخاصة</h3></div>';
  if(plRows.length){
    h += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">';
    for(var pr=0;pr<plRows.length;pr++){
      h += '<span style="padding:6px 13px;border-radius:999px;background:rgba(13,148,136,.1);border:1px solid rgba(13,148,136,.3);font-size:12.5px;font-weight:800;">' + escapeHtml(plRows[pr].name) + ' <span style="color:var(--teal-l);">' + fmt(plRows[pr].count) + '</span></span>';
    }
    h += '</div>';
  } else {
    h += '<div style="padding:10px 14px;border-radius:var(--r-md);background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.2);font-size:12.5px;margin-bottom:16px;color:var(--rose-l);font-weight:700;">⚠️ لم يكتب أي منتج Private Label حتى الآن — هذه الزيارة فرصتك الأولى</div>';
  }
  // نقاط الحوار (فرص التحويل)
  h += '<div class="mini-head"><h3>⚔️ نقاط الحوار — يكتب بدائل منافسة</h3></div>';
  if(opps.length){
    for(var oi=0;oi<opps.length;oi++){
      var o = opps[oi];
      var chips = '';
      for(var ti=0;ti<o.top.length;ti++){
        chips += '<span class="drug-name" style="display:inline-block;padding:3px 9px;border-radius:999px;background:var(--bg-glass2);border:1px solid var(--border);font-size:11px;max-width:240px;">' + escapeHtml(o.top[ti].n) + ' <b style="color:' + o.color + ';">' + o.top[ti].c + '</b></span> ';
      }
      h += '<div style="margin-bottom:10px;padding:12px 14px;border-radius:var(--r-md);background:' + o.bg + ';border:1px solid ' + o.border + ';border-right:3px solid ' + o.color + ';">'
         + '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:7px;">'
         + '<span style="font-weight:900;font-size:13px;">' + escapeHtml(o.name) + '</span>'
         + '<span style="font-weight:900;color:' + o.color + ';font-size:13px;">' + fmt(o.tot) + ' كتابة بديلة</span></div>'
         + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:7px;">' + chips + '</div>'
         + '<div style="font-size:12px;font-weight:800;color:var(--teal-l);">→ اعرض عليه التحويل لمنتجك بدل هذه البدائل</div>'
         + '</div>';
    }
  } else {
    h += '<div style="padding:10px 14px;color:var(--text-muted);font-size:12.5px;margin-bottom:12px;">لا يكتب بدائل منافسة معروفة حالياً</div>';
  }
  // أعلى أدويته
  h += '<div class="mini-head"><h3>💊 أعلى 10 أدوية يكتبها</h3></div><div class="table-wrap"><table><thead><tr><th style="width:50px;">#</th><th>الدواء</th><th>الكتابات</th></tr></thead><tbody>';
  for(var td=0;td<topDrugs.length;td++){
    h += '<tr><td>' + rankBadge(td) + '</td><td class="drug-name">' + escapeHtml(topDrugs[td].name) + '</td><td class="num">' + fmt(topDrugs[td].count) + '</td></tr>';
  }
  h += '</tbody></table></div>';
  document.getElementById('vcBody').innerHTML = h;
  window._vcData = {x:x, rank:rank, total:d.doctors.length, plRows:plRows, plTotal:plTotal, opps:opps, topDrugs:topDrugs, branch:BRANCH_LABELS[STATE.active]};
}
function printVisitCard(){
  var v = window._vcData;
  if(!v){ toast('اختر طبيباً أولاً','warn'); return; }
  var w = window.open('', '_blank');
  if(!w){ toast('اسمح بالنوافذ المنبثقة للطباعة','warn'); return; }
  try{w.opener=null;}catch(e){}
  var safeName=escapeHtml(v.x.name),safeSection=escapeHtml(v.x.section||'—'),safeBranch=escapeHtml(v.branch||'');
  var h = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>بطاقة زيارة — ' + safeName + '</title>';
  h += '<style>body{font-family:Tahoma,Arial,sans-serif;color:#111;padding:28px;max-width:760px;margin:0 auto;font-size:13px;line-height:1.7;}'
     + 'h1{font-size:20px;margin:0 0 2px;} .sub{color:#555;font-size:12px;margin-bottom:14px;}'
     + '.kpis{display:flex;gap:10px;margin:14px 0;} .k{flex:1;border:1px solid #ddd;border-radius:10px;padding:10px;text-align:center;}'
     + '.k .l{font-size:11px;color:#666;} .k .v{font-size:19px;font-weight:bold;}'
     + 'h2{font-size:14px;border-bottom:2px solid #333;padding-bottom:4px;margin:18px 0 8px;}'
     + 'table{width:100%;border-collapse:collapse;font-size:12px;} th,td{border:1px solid #ccc;padding:5px 8px;text-align:right;}'
     + 'th{background:#f2f2f2;} .opp{border:1px solid #ccc;border-right:4px solid #555;border-radius:8px;padding:8px 12px;margin-bottom:8px;}'
     + '.pitch{font-weight:bold;color:#0a7;} .warn{color:#c0392b;font-weight:bold;}'
     + '.foot{margin-top:24px;font-size:11px;color:#888;text-align:center;border-top:1px solid #ddd;padding-top:8px;}'
     + '@media print{body{padding:8px;}}'
     + '</style></head><body>';
  h += '<h1>🪪 بطاقة زيارة: ' + safeName + '</h1>';
  h += '<div class="sub">' + safeSection + ' · ' + safeBranch + ' · الترتيب #' + fmt(v.rank) + ' من ' + fmt(v.total) + ' · ' + new Date().toLocaleDateString('en-GB') + '</div>';
  h += '<div class="kpis"><div class="k"><div class="l">الكتابات</div><div class="v">' + fmt(v.x.total) + '</div></div>'
     + '<div class="k"><div class="l">أدوية مختلفة</div><div class="v">' + fmt(v.x.uniqueDrugs) + '</div></div>'
     + '<div class="k"><div class="l">المرضى</div><div class="v">' + fmt(v.x.patients) + '</div></div>'
     + '<div class="k"><div class="l">كتابات PL</div><div class="v">' + fmt(v.plTotal) + '</div></div></div>';
  h += '<h2>⭐ تاريخه مع منتجاتنا</h2>';
  if(v.plRows.length){
    h += '<table><tr><th>المنتج</th><th>الكتابات</th></tr>';
    for(var i=0;i<v.plRows.length;i++){ h += '<tr><td>' + escapeHtml(v.plRows[i].name) + '</td><td>' + fmt(v.plRows[i].count) + '</td></tr>'; }
    h += '</table>';
  } else { h += '<div class="warn">لم يكتب أي منتج Private Label — فرصة أولى</div>'; }
  h += '<h2>⚔️ نقاط الحوار — بدائل يكتبها</h2>';
  if(v.opps.length){
    for(var j=0;j<v.opps.length;j++){
      var o = v.opps[j];
      var tops = '';
      for(var t=0;t<o.top.length;t++){ tops += escapeHtml(o.top[t].n) + ' (' + fmt(o.top[t].c) + ')' + (t<o.top.length-1?' · ':''); }
      h += '<div class="opp"><b>' + escapeHtml(o.name) + '</b> — ' + fmt(o.tot) + ' كتابة بديلة<br>أعلاها: ' + tops + '<br><span class="pitch">→ اعرض التحويل لمنتجنا</span></div>';
    }
  } else { h += '<div>لا يكتب بدائل معروفة</div>'; }
  h += '<h2>💊 أعلى أدويته</h2><table><tr><th>#</th><th>الدواء</th><th>الكتابات</th></tr>';
  for(var k=0;k<v.topDrugs.length;k++){ h += '<tr><td>' + (k+1) + '</td><td>' + escapeHtml(v.topDrugs[k].name) + '</td><td>' + fmt(v.topDrugs[k].count) + '</td></tr>'; }
  h += '</table>';
  h += '<div class="foot"> — PharmaDash</div>';
  h += '</body></html>';
  w.document.write(h);
  w.document.close();
  setTimeout(function(){ try{ w.print(); }catch(e){} }, 450);
}

/* ════════════════════════════════════════════════════
   NEAR EXPIRY — أصناف قرب انتهاء الصلاحية
   بيانات مضمّنة من تقرير Oracle
════════════════════════════════════════════════════ */
const NEAR_EXPIRY_DATA = [{"code": "1-03-187-229", "name": "BLUM-D 50000 iu/tablet, 20 TABLET/BOX", "branch": "T1", "expiry": "2026-06-24", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-05-187-388", "name": "GALVUS MET 50/1000MG/tablet, 60 TABLET/BOX", "branch": "T3", "expiry": "2026-06-30", "qty": 1.0, "cost": 91.96, "total": 91.96},{"code": "1-09-194-012", "name": "NYDA PLUS 100 ml topical spray /1Applicator, 1Applicator/Applicator", "branch": "T3", "expiry": "2026-06-30", "qty": 1.0, "cost": 60.52, "total": 60.52},{"code": "1-09-031-131", "name": "ACRETIN C GEL 30 GM/TUBE", "branch": "T2", "expiry": "2026-07-22", "qty": 2.0, "cost": 28.17, "total": 56.33},{"code": "1-09-031-131", "name": "ACRETIN C GEL 30 GM/TUBE", "branch": "T2", "expiry": "2026-07-22", "qty": 2.0, "cost": 23.47, "total": 46.94},{"code": "1-09-031-067", "name": "HI-QUIN Cream 2%/1APPLY, 30GM/Tube", "branch": "T2", "expiry": "2026-07-22", "qty": 2.0, "cost": 17.43, "total": 34.85},{"code": "1-09-031-131", "name": "ACRETIN C GEL 30 GM/TUBE", "branch": "T3", "expiry": "2026-07-22", "qty": 1.0, "cost": 23.47, "total": 23.47},{"code": "1-09-031-131", "name": "ACRETIN C GEL 30 GM/TUBE", "branch": "T2", "expiry": "2026-07-22", "qty": 1.0, "cost": 23.47, "total": 23.47},{"code": "1-05-059-058", "name": "SELECTA PLUS Film coated tablet 5/12.5MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-07-24", "qty": 6.0, "cost": 12.53, "total": 75.2},{"code": "1-02-036-003", "name": "VOLTIC  tablet 50MG/1Tablet, 20Tablet/Box", "branch": "T1", "expiry": "2026-07-25", "qty": 380.0, "cost": 7.52, "total": 2857.77},{"code": "1-02-036-003", "name": "VOLTIC  tablet 50MG/1Tablet, 20Tablet/Box", "branch": "T1", "expiry": "2026-07-25", "qty": 13.0, "cost": 7.52, "total": 97.77},{"code": "1-08-059-008", "name": "ENTAPRO Film coated tablet 20MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-07-27", "qty": 1.0, "cost": 75.09, "total": 75.09},{"code": "1-09-066-056", "name": "ADZOY 0.3 % / 2.5%/apply Gel, 30 GM/TUBE", "branch": "T1", "expiry": "2026-07-30", "qty": 4.0, "cost": 49.46, "total": 197.86},{"code": "1-03-187-186", "name": "HAEMOVIT Tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-07-30", "qty": 4.0, "cost": 32.5, "total": 130.0},{"code": "1-09-066-056", "name": "ADZOY 0.3 % / 2.5%/apply Gel, 30 GM/TUBE", "branch": "T3", "expiry": "2026-07-30", "qty": 1.0, "cost": 49.46, "total": 49.46},{"code": "1-05-187-090", "name": "DAONIL Tablet 5MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-07-31", "qty": 151.0, "cost": 20.49, "total": 3093.99},{"code": "1-06-118-029", "name": "AVALON AVOCOM 0.1 %/apply Ointment , 50 GM/TUBE", "branch": "T1", "expiry": "2026-07-31", "qty": 55.0, "cost": 9.8, "total": 538.94},{"code": "1-05-187-090", "name": "DAONIL Tablet 5MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-07-31", "qty": 52.0, "cost": 20.49, "total": 1065.48},{"code": "1-05-086-010", "name": "MIXTARD Injection 30IU/1ML, 10ML/Vial", "branch": "T2", "expiry": "2026-07-31", "qty": 35.0, "cost": 54.16, "total": 1895.76},{"code": "1-06-118-029", "name": "AVALON AVOCOM 0.1 %/apply Ointment , 50 GM/TUBE", "branch": "T2", "expiry": "2026-07-31", "qty": 30.0, "cost": 9.8, "total": 293.97},{"code": "1-03-020-229", "name": "ELEVIT Tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 30.0, "cost": 0.0, "total": 0.0},{"code": "1-03-020-229", "name": "ELEVIT Tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 23.0, "cost": 0.0, "total": 0.0},{"code": "1-03-020-229", "name": "ELEVIT Tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-07-31", "qty": 17.0, "cost": 0.0, "total": 0.0},{"code": "1-03-020-045", "name": "GENTAPLEX Capsule /1Capsule, 36Capsule/Box", "branch": "T1", "expiry": "2026-07-31", "qty": 16.0, "cost": 142.92, "total": 2286.67},{"code": "1-03-187-238", "name": "ARKO PHARMA FORCAPIL GROWTH HAIR AND NAILS GUMMIES, 60 TABLET/BOTTEL", "branch": "T2", "expiry": "2026-07-31", "qty": 14.0, "cost": 89.87, "total": 1258.18},{"code": "1-06-085-001", "name": "BUTALIN INHALATION SPRAY 100MCG/1Applicator, 200Inhalation spray/Container", "branch": "T2", "expiry": "2026-07-31", "qty": 14.0, "cost": 9.47, "total": 132.62},{"code": "1-09-118-068", "name": "AVALON AVOMEB EXTERA Ointment , 50 GM/TUBE", "branch": "T2", "expiry": "2026-07-31", "qty": 13.0, "cost": 34.85, "total": 452.35},{"code": "1-04-187-103", "name": "MEBAGEN 200 mg/ml/tablet Extended Release Tab, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 11.0, "cost": 21.13, "total": 232.47},{"code": "1-06-085-001", "name": "BUTALIN INHALATION SPRAY 100MCG/1Applicator, 200Inhalation spray/Container", "branch": "T1", "expiry": "2026-07-31", "qty": 10.0, "cost": 9.47, "total": 94.73},{"code": "1-14-020-003", "name": "VITA ROYAL 1000 MG 30 CAPS", "branch": "T2", "expiry": "2026-07-31", "qty": 8.0, "cost": 66.0, "total": 528.0},{"code": "1-05-086-010", "name": "MIXTARD Injection 30IU/1ML, 10ML/Vial", "branch": "T3", "expiry": "2026-07-31", "qty": 8.0, "cost": 54.16, "total": 433.32},{"code": "1-02-187-062", "name": "JOINTACE CHONDROITIN GLUCOSAMIN Tablet /1Tablet, 60Tablet/Box", "branch": "T2", "expiry": "2026-07-31", "qty": 8.0, "cost": 37.91, "total": 303.31},{"code": "1-09-066-057", "name": "ADZOY 0.1% / 2.5% apply Gel, 30 GM/TUBE", "branch": "T3", "expiry": "2026-07-31", "qty": 8.0, "cost": 0.0, "total": 0.0},{"code": "1-05-086-013", "name": "APIDRA SOLOSTAR 100 iu/ml Injection, 5 VIAL/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 6.0, "cost": 147.04, "total": 882.26},{"code": "1-01-020-076", "name": "DENACIF 300 mg/capsule, 10 CAPSULE", "branch": "T2", "expiry": "2026-07-31", "qty": 6.0, "cost": 24.09, "total": 144.51},{"code": "1-11-049-008", "name": "AZARGA Eye drops 10MG/1Drop, 5ML/Container", "branch": "T3", "expiry": "2026-07-31", "qty": 5.0, "cost": 42.8, "total": 214.0},{"code": "1-01-059-005", "name": "CEFODOX Film coated tablet 200MG/1Tablet, 14Tablet/Box", "branch": "T2", "expiry": "2026-07-31", "qty": 5.0, "cost": 0.0, "total": 0.0},{"code": "1-05-187-338", "name": "TENORYL PLUS 10/10 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 4.0, "cost": 59.13, "total": 236.53},{"code": "1-04-187-103", "name": "MEBAGEN 200 mg/ml/tablet Extended Release Tab, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 4.0, "cost": 21.13, "total": 84.53},{"code": "1-04-187-103", "name": "MEBAGEN 200 mg/ml/tablet Extended Release Tab, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 4.0, "cost": 21.13, "total": 84.53},{"code": "1-06-085-011", "name": "SERETIDE EVOHALER125MG INHALATION SPRAY /1Inhaler, 120Inhaler/Container", "branch": "T2", "expiry": "2026-07-31", "qty": 3.0, "cost": 98.09, "total": 294.27},{"code": "1-14-020-003", "name": "VITA ROYAL 1000 MG 30 CAPS", "branch": "T1", "expiry": "2026-07-31", "qty": 3.0, "cost": 66.0, "total": 198.0},{"code": "1-11-049-033", "name": "TRAVATAN Eye drops 0.004MG/1Drop, 2.5ML/Container", "branch": "T3", "expiry": "2026-07-31", "qty": 3.0, "cost": 38.58, "total": 115.75},{"code": "1-05-187-090", "name": "DAONIL Tablet 5MG/1Tablet, 30Tablet/Box", "branch": "T3", "expiry": "2026-07-31", "qty": 3.0, "cost": 20.49, "total": 61.47},{"code": "1-04-187-103", "name": "MEBAGEN 200 mg/ml/tablet Extended Release Tab, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 3.0, "cost": 17.9, "total": 53.71},{"code": "1-06-083-008", "name": "SERETIDE DISKUS 250MG Inhalation powder /1Inhaler, 60Inhaler/Container", "branch": "T2", "expiry": "2026-07-31", "qty": 2.0, "cost": 109.96, "total": 219.92},{"code": "1-03-187-238", "name": "ARKO PHARMA FORCAPIL GROWTH HAIR AND NAILS GUMMIES, 60 TABLET/BOTTEL", "branch": "T3", "expiry": "2026-07-31", "qty": 2.0, "cost": 89.87, "total": 179.74},{"code": "1-04-059-002", "name": "ASACOL Film coated tablet 400MG/1Tablet, 50Tablet/Box", "branch": "T1", "expiry": "2026-07-31", "qty": 2.0, "cost": 59.31, "total": 118.61},{"code": "1-09-066-047", "name": "SCAR PRO apply Gel, 6 GM/TUBE", "branch": "T2", "expiry": "2026-07-31", "qty": 2.0, "cost": 45.0, "total": 90.0},{"code": "1-08-187-115", "name": "SILOMES 100 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 2.0, "cost": 43.14, "total": 86.28},{"code": "1-04-187-103", "name": "MEBAGEN 200 mg/ml/tablet Extended Release Tab, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 2.0, "cost": 21.13, "total": 42.27},{"code": "1-01-020-083", "name": "KLENDAM 300 mg/capsule, 16 CAPSULE/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 2.0, "cost": 18.6, "total": 37.2},{"code": "1-05-187-393", "name": "LODIAB XR 750 mg/tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 2.0, "cost": 16.94, "total": 33.88},{"code": "1-03-187-238", "name": "ARKO PHARMA FORCAPIL GROWTH HAIR AND NAILS GUMMIES, 60 TABLET/BOTTEL", "branch": "T3", "expiry": "2026-07-31", "qty": 2.0, "cost": 5.18, "total": 10.37},{"code": "1-03-187-238", "name": "ARKO PHARMA FORCAPIL GROWTH HAIR AND NAILS GUMMIES, 60 TABLET/BOTTEL", "branch": "T2", "expiry": "2026-07-31", "qty": 2.0, "cost": 5.18, "total": 10.37},{"code": "1-03-187-238", "name": "ARKO PHARMA FORCAPIL GROWTH HAIR AND NAILS GUMMIES, 60 TABLET/BOTTEL", "branch": "T2", "expiry": "2026-07-31", "qty": 2.0, "cost": 5.18, "total": 10.37},{"code": "1-05-001-001", "name": "SAXENDA Ampoule 6MG/1ML, 5ML/Box", "branch": "T1", "expiry": "2026-07-31", "qty": 1.4, "cost": 645.37, "total": 903.52},{"code": "1-05-168-013", "name": "RYZODEG 100 iu/ml Solution For Injection , 15 ML/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 1.0, "cost": 344.46, "total": 344.46},{"code": "1-08-187-153", "name": "DEBREX 1 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-07-31", "qty": 1.0, "cost": 256.73, "total": 256.73},{"code": "1-03-020-225", "name": "ARCON TISANE PLUS Capsule, 60 CAPSULE/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 1.0, "cost": 125.4, "total": 125.4},{"code": "1-06-085-011", "name": "SERETIDE EVOHALER125MG INHALATION SPRAY /1Inhaler, 120Inhaler/Container", "branch": "T3", "expiry": "2026-07-31", "qty": 1.0, "cost": 98.09, "total": 98.09},{"code": "1-01-187-142", "name": "ZOVIRAX 200 mg/tablet, 25 TABLET/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 1.0, "cost": 64.7, "total": 64.7},{"code": "1-08-187-115", "name": "SILOMES 100 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 1.0, "cost": 43.14, "total": 43.14},{"code": "1-11-049-008", "name": "AZARGA Eye drops 10MG/1Drop, 5ML/Container", "branch": "T3", "expiry": "2026-07-31", "qty": 1.0, "cost": 42.8, "total": 42.8},{"code": "1-11-049-033", "name": "TRAVATAN Eye drops 0.004MG/1Drop, 2.5ML/Container", "branch": "T2", "expiry": "2026-07-31", "qty": 1.0, "cost": 38.58, "total": 38.58},{"code": "1-02-187-062", "name": "JOINTACE CHONDROITIN GLUCOSAMIN Tablet /1Tablet, 60Tablet/Box", "branch": "T2", "expiry": "2026-07-31", "qty": 1.0, "cost": 36.4, "total": 36.4},{"code": "1-09-118-068", "name": "AVALON AVOMEB EXTERA Ointment , 50 GM/TUBE", "branch": "T1", "expiry": "2026-07-31", "qty": 1.0, "cost": 34.85, "total": 34.85},{"code": "1-01-184-085", "name": "MINOCET 125 mg/5 ml Suspention, 80 ML/BOTTLE", "branch": "T2", "expiry": "2026-07-31", "qty": 1.0, "cost": 27.64, "total": 27.64},{"code": "1-01-020-083", "name": "KLENDAM 300 mg/capsule, 16 CAPSULE/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 1.0, "cost": 19.38, "total": 19.38},{"code": "1-04-187-103", "name": "MEBAGEN 200 mg/ml/tablet Extended Release Tab, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-07-31", "qty": 1.0, "cost": 17.9, "total": 17.9},{"code": "1-05-187-393", "name": "LODIAB XR 750 mg/tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 1.0, "cost": 17.28, "total": 17.28},{"code": "1-09-031-011", "name": "AVALON AVOQUIN Cream 1.9%/1Container, 50GM/Container", "branch": "T1", "expiry": "2026-07-31", "qty": 1.0, "cost": 7.02, "total": 7.02},{"code": "1-03-187-238", "name": "ARKO PHARMA FORCAPIL GROWTH HAIR AND NAILS GUMMIES, 60 TABLET/BOTTEL", "branch": "T3", "expiry": "2026-07-31", "qty": 1.0, "cost": 5.18, "total": 5.18},{"code": "1-05-187-338", "name": "TENORYL PLUS 10/10 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-07-31", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-01-020-076", "name": "DENACIF 300 mg/capsule, 10 CAPSULE", "branch": "T2", "expiry": "2026-07-31", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-03-186-051", "name": "CALSYR  Syrup, 100 ML/BOTTLE", "branch": "T2", "expiry": "2026-08-07", "qty": 3.0, "cost": 5.43, "total": 16.29},{"code": "1-03-187-159", "name": "DEVARIN ODT 10 mg/tablet, 4 TABLET/BOX", "branch": "T1", "expiry": "2026-08-07", "qty": 1.0, "cost": 37.47, "total": 37.47},{"code": "1-03-186-051", "name": "CALSYR  Syrup, 100 ML/BOTTLE", "branch": "T2", "expiry": "2026-08-07", "qty": 1.0, "cost": 4.93, "total": 4.93},{"code": "1-09-066-057", "name": "ADZOY 0.1% / 2.5% apply Gel, 30 GM/TUBE", "branch": "T1", "expiry": "2026-08-08", "qty": 23.0, "cost": 15.77, "total": 362.73},{"code": "1-09-066-057", "name": "ADZOY 0.1% / 2.5% apply Gel, 30 GM/TUBE", "branch": "T3", "expiry": "2026-08-08", "qty": 6.0, "cost": 15.77, "total": 94.63},{"code": "1-09-066-057", "name": "ADZOY 0.1% / 2.5% apply Gel, 30 GM/TUBE", "branch": "T2", "expiry": "2026-08-08", "qty": 4.0, "cost": 15.77, "total": 63.08},{"code": "1-01-049-013", "name": "TYMER Eye drops 0.3MG/1Drop, 5ML/Container", "branch": "T1", "expiry": "2026-08-09", "qty": 37.0, "cost": 23.62, "total": 874.12},{"code": "1-01-049-013", "name": "TYMER Eye drops 0.3MG/1Drop, 5ML/Container", "branch": "T2", "expiry": "2026-08-09", "qty": 20.0, "cost": 23.62, "total": 472.5},{"code": "1-06-085-020", "name": "BUDIAIR 200 mcg/applicator Inhalation Spray, 200 INHALATION SPRAY/CONTAINER", "branch": "T3", "expiry": "2026-08-09", "qty": 1.0, "cost": 55.82, "total": 55.82},{"code": "1-09-031-002", "name": "ACRETIN Cream 0.05%/1APPLY, 30GM/Tube", "branch": "T1", "expiry": "2026-08-09", "qty": 1.0, "cost": 12.0, "total": 12.0},{"code": "1-14-086-041", "name": "MERIONAL HG 75 iu/ampoule Injection, 1 AMPOULE/BOX", "branch": "T3", "expiry": "2026-08-12", "qty": 3.0, "cost": 60.0, "total": 180.01},{"code": "1-14-086-041", "name": "MERIONAL HG 75 iu/ampoule Injection, 1 AMPOULE/BOX", "branch": "T1", "expiry": "2026-08-12", "qty": 2.0, "cost": 60.0, "total": 120.0},{"code": "1-05-059-121", "name": "PEXAPAN 5 mg/tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-08-12", "qty": 1.0, "cost": 133.92, "total": 133.92},{"code": "1-05-059-121", "name": "PEXAPAN 5 mg/tablet, 60 TABLET/BOX", "branch": "T3", "expiry": "2026-08-12", "qty": 1.0, "cost": 133.92, "total": 133.92},{"code": "1-05-059-121", "name": "PEXAPAN 5 mg/tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-08-12", "qty": 1.0, "cost": 133.92, "total": 133.92},{"code": "1-08-058-038", "name": "DAMESTA 20 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-08-13", "qty": 3.0, "cost": 56.12, "total": 168.37},{"code": "1-09-066-038", "name": "SURECURE Gel 0.1%/1APPLY, 30GM/Tube", "branch": "T2", "expiry": "2026-08-13", "qty": 2.0, "cost": 11.57, "total": 23.14},{"code": "1-02-187-209", "name": "OXIRA RAPID 8 mg/tablet, 20 TABLET/BOX", "branch": "T2", "expiry": "2026-08-13", "qty": 1.0, "cost": 10.43, "total": 10.43},{"code": "1-04-179-010", "name": "LAXOCODYL 5 mg/suppository, 10 SUPPOSITORY/BOX", "branch": "T3", "expiry": "2026-08-17", "qty": 5.0, "cost": 5.8, "total": 28.98},{"code": "1-05-059-064", "name": "SIMVA Film coated tablet 20MG/1Tablet, 30Tablet/Box", "branch": "T3", "expiry": "2026-08-17", "qty": 2.0, "cost": 31.61, "total": 63.23},{"code": "1-04-187-095", "name": "ACICAL PLUS tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-08-18", "qty": 1.0, "cost": 4.86, "total": 4.86},{"code": "1-06-001-005", "name": "ATROSOL 250 mg/mcg/2 ml Ampoule, 2 oral solution/BOX", "branch": "T1", "expiry": "2026-08-20", "qty": 8.5, "cost": 18.9, "total": 160.65},{"code": "1-06-001-005", "name": "ATROSOL 250 mg/mcg/2 ml Ampoule, 2 oral solution/BOX", "branch": "T3", "expiry": "2026-08-20", "qty": 8.5, "cost": 18.9, "total": 160.65},{"code": "1-06-001-005", "name": "ATROSOL 250 mg/mcg/2 ml Ampoule, 2 oral solution/BOX", "branch": "T2", "expiry": "2026-08-20", "qty": 4.5, "cost": 18.9, "total": 85.05},{"code": "1-04-146-012", "name": "FAWAR LEMON 5 gm/sachet, 6 SACHET/BOX", "branch": "T2", "expiry": "2026-08-24", "qty": 12.0, "cost": 0.0, "total": 0.0},{"code": "1-04-146-012", "name": "FAWAR LEMON 5 gm/sachet, 6 SACHET/BOX", "branch": "T3", "expiry": "2026-08-24", "qty": 8.0, "cost": 0.0, "total": 0.0},{"code": "1-04-146-012", "name": "FAWAR LEMON 5 gm/sachet, 6 SACHET/BOX", "branch": "T1", "expiry": "2026-08-24", "qty": 6.0, "cost": 0.0, "total": 0.0},{"code": "1-07-187-022", "name": "FENSOLIN 10 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-08-26", "qty": 17.0, "cost": 67.64, "total": 1149.92},{"code": "1-05-187-415", "name": "CO-TABUVAN Tablet 80/12.5MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-08-27", "qty": 7.0, "cost": 25.08, "total": 175.53},{"code": "1-05-187-415", "name": "CO-TABUVAN Tablet 80/12.5MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-08-27", "qty": 2.0, "cost": 25.08, "total": 50.15},{"code": "1-09-113-005", "name": "SALINOSE PLUS NASAL SPRAY 0.9ML/1Spray, 20ML/Container", "branch": "T1", "expiry": "2026-08-28", "qty": 23.0, "cost": 15.99, "total": 367.77},{"code": "1-05-187-491", "name": "AMLOVAN-HCT 10/320/25 mg/tablet, 28 TABLET/BOX", "branch": "T1", "expiry": "2026-08-29", "qty": 9.0, "cost": 63.25, "total": 569.28},{"code": "1-05-187-491", "name": "AMLOVAN-HCT 10/320/25 mg/tablet, 28 TABLET/BOX", "branch": "T2", "expiry": "2026-08-29", "qty": 5.0, "cost": 63.25, "total": 316.26},{"code": "1-05-187-491", "name": "AMLOVAN-HCT 10/320/25 mg/tablet, 28 TABLET/BOX", "branch": "T3", "expiry": "2026-08-29", "qty": 2.0, "cost": 63.25, "total": 126.51},{"code": "1-04-186-025", "name": "BABYCOOL ml Syrup, 100 ML/BOTTLE", "branch": "T2", "expiry": "2026-08-30", "qty": 31.0, "cost": 23.4, "total": 725.4},{"code": "1-04-186-025", "name": "BABYCOOL ml Syrup, 100 ML/BOTTLE", "branch": "T3", "expiry": "2026-08-30", "qty": 11.0, "cost": 23.4, "total": 257.4},{"code": "1-04-186-025", "name": "BABYCOOL ml Syrup, 100 ML/BOTTLE", "branch": "T1", "expiry": "2026-08-30", "qty": 6.0, "cost": 23.4, "total": 140.4},{"code": "1-02-186-015", "name": "ADOL 120 mg/5 ml Syrup, 100 ML/BOTTLE", "branch": "T2", "expiry": "2026-08-30", "qty": 3.0, "cost": 2.0, "total": 6.0},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T1", "expiry": "2026-08-31", "qty": 107.0, "cost": 21.81, "total": 2333.38},{"code": "1-06-049-027", "name": "AVALON SALINOSE BABY 0.9 ml/drop, 20 ML/BOTTLE", "branch": "T1", "expiry": "2026-08-31", "qty": 77.0, "cost": 15.3, "total": 1178.1},{"code": "1-14-187-062", "name": "LEVOGAND 100 mcg/tablet, 100 TABLET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 43.0, "cost": 18.25, "total": 784.92},{"code": "1-14-187-062", "name": "LEVOGAND 100 mcg/tablet, 100 TABLET/BOX", "branch": "T3", "expiry": "2026-08-31", "qty": 18.0, "cost": 18.25, "total": 328.57},{"code": "1-04-128-007", "name": "FEMI BIOTIC box Sachets, 20 SACHET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 17.0, "cost": 65.0, "total": 1105.0},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T2", "expiry": "2026-08-31", "qty": 17.0, "cost": 21.8, "total": 370.68},{"code": "1-03-187-230", "name": "CENTRUM IMMUNE Support Capsule, 60 CAPSULE/CONTAINER", "branch": "T1", "expiry": "2026-08-31", "qty": 15.0, "cost": 44.61, "total": 669.12},{"code": "1-03-187-230", "name": "CENTRUM IMMUNE Support Capsule, 60 CAPSULE/CONTAINER", "branch": "T1", "expiry": "2026-08-31", "qty": 14.0, "cost": 55.76, "total": 780.64},{"code": "1-03-187-230", "name": "CENTRUM IMMUNE Support Capsule, 60 CAPSULE/CONTAINER", "branch": "T2", "expiry": "2026-08-31", "qty": 12.0, "cost": 55.76, "total": 669.12},{"code": "1-04-128-007", "name": "FEMI BIOTIC box Sachets, 20 SACHET/BOX", "branch": "T3", "expiry": "2026-08-31", "qty": 11.0, "cost": 65.0, "total": 715.0},{"code": "1-04-128-007", "name": "FEMI BIOTIC box Sachets, 20 SACHET/BOX", "branch": "T2", "expiry": "2026-08-31", "qty": 11.0, "cost": 0.0, "total": 0.0},{"code": "1-14-187-062", "name": "LEVOGAND 100 mcg/tablet, 100 TABLET/BOX", "branch": "T2", "expiry": "2026-08-31", "qty": 9.0, "cost": 18.25, "total": 164.29},{"code": "1-04-186-025", "name": "BABYCOOL ml Syrup, 100 ML/BOTTLE", "branch": "T2", "expiry": "2026-08-31", "qty": 8.0, "cost": 23.4, "total": 187.2},{"code": "1-05-001-002", "name": "OZEMPIC 0.5 mg/ml Ampoule, 4 AMPOULE/BOX", "branch": "T2", "expiry": "2026-08-31", "qty": 7.0, "cost": 365.03, "total": 2555.2},{"code": "1-04-186-025", "name": "BABYCOOL ml Syrup, 100 ML/BOTTLE", "branch": "T1", "expiry": "2026-08-31", "qty": 7.0, "cost": 23.4, "total": 163.8},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T1", "expiry": "2026-08-31", "qty": 7.0, "cost": 21.8, "total": 152.63},{"code": "1-04-166-008", "name": "AMOVAC enema Solution, 120 ML/CONTAINER", "branch": "T1", "expiry": "2026-08-31", "qty": 7.0, "cost": 5.99, "total": 41.9},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T2", "expiry": "2026-08-31", "qty": 6.0, "cost": 26.26, "total": 157.54},{"code": "1-14-187-064", "name": "LEVOGAND 25 mcg/tablet, 100 TABLET/BOX", "branch": "T3", "expiry": "2026-08-31", "qty": 6.0, "cost": 12.54, "total": 75.22},{"code": "1-06-118-003", "name": "AVALON AVOCOM Ointment 0.1%/1APPLY, 30GM/Tube", "branch": "T1", "expiry": "2026-08-31", "qty": 5.0, "cost": 7.01, "total": 35.05},{"code": "1-05-001-002", "name": "OZEMPIC 0.5 mg/ml Ampoule, 4 AMPOULE/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 4.0, "cost": 365.03, "total": 1460.11},{"code": "1-03-187-230", "name": "CENTRUM IMMUNE Support Capsule, 60 CAPSULE/CONTAINER", "branch": "T1", "expiry": "2026-08-31", "qty": 4.0, "cost": 55.76, "total": 223.04},{"code": "1-03-020-229", "name": "ELEVIT Tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 4.0, "cost": 32.5, "total": 130.01},{"code": "1-08-187-010", "name": "DEPAKINE Tablet 500MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-08-31", "qty": 4.0, "cost": 26.83, "total": 107.32},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T1", "expiry": "2026-08-31", "qty": 4.0, "cost": 21.8, "total": 87.22},{"code": "1-07-020-002", "name": "AVODART Capsule 0.5MG/1Capsule, 30Capsule/Box", "branch": "T2", "expiry": "2026-08-31", "qty": 3.0, "cost": 97.31, "total": 291.92},{"code": "1-04-186-025", "name": "BABYCOOL ml Syrup, 100 ML/BOTTLE", "branch": "T1", "expiry": "2026-08-31", "qty": 3.0, "cost": 23.4, "total": 70.2},{"code": "1-06-118-003", "name": "AVALON AVOCOM Ointment 0.1%/1APPLY, 30GM/Tube", "branch": "T2", "expiry": "2026-08-31", "qty": 3.0, "cost": 7.01, "total": 21.03},{"code": "1-08-187-087", "name": "KEPPRA 1000 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-08-31", "qty": 2.0, "cost": 201.49, "total": 402.97},{"code": "1-05-086-013", "name": "APIDRA SOLOSTAR 100 iu/ml Injection, 5 VIAL/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 2.0, "cost": 147.04, "total": 294.09},{"code": "1-05-187-429", "name": "ATACAND PLUS Tablet 16 /12.5MG/1Tablet, 28Tablet/Box", "branch": "T1", "expiry": "2026-08-31", "qty": 2.0, "cost": 66.0, "total": 132.01},{"code": "1-03-187-230", "name": "CENTRUM IMMUNE Support Capsule, 60 CAPSULE/CONTAINER", "branch": "T3", "expiry": "2026-08-31", "qty": 2.0, "cost": 55.76, "total": 111.52},{"code": "1-03-187-230", "name": "CENTRUM IMMUNE Support Capsule, 60 CAPSULE/CONTAINER", "branch": "T2", "expiry": "2026-08-31", "qty": 2.0, "cost": 55.76, "total": 111.52},{"code": "1-09-118-068", "name": "AVALON AVOMEB EXTERA Ointment , 50 GM/TUBE", "branch": "T1", "expiry": "2026-08-31", "qty": 2.0, "cost": 34.85, "total": 69.7},{"code": "1-05-059-063", "name": "SIMVA Film coated tablet 10MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-08-31", "qty": 2.0, "cost": 31.61, "total": 63.23},{"code": "1-05-187-392", "name": "LODIAB XR 1000 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 2.0, "cost": 13.2, "total": 26.4},{"code": "1-04-166-008", "name": "AMOVAC enema Solution, 120 ML/CONTAINER", "branch": "T2", "expiry": "2026-08-31", "qty": 2.0, "cost": 5.99, "total": 11.97},{"code": "1-04-128-007", "name": "FEMI BIOTIC box Sachets, 20 SACHET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 2.0, "cost": 0.0, "total": 0.0},{"code": "1-08-187-087", "name": "KEPPRA 1000 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-08-31", "qty": 1.0, "cost": 201.49, "total": 201.49},{"code": "1-05-086-013", "name": "APIDRA SOLOSTAR 100 iu/ml Injection, 5 VIAL/BOX", "branch": "T3", "expiry": "2026-08-31", "qty": 1.0, "cost": 147.04, "total": 147.04},{"code": "1-09-118-058", "name": "KOZAMOD 5 % Cream, 12 sachet/box", "branch": "T3", "expiry": "2026-08-31", "qty": 1.0, "cost": 109.96, "total": 109.96},{"code": "1-07-020-002", "name": "AVODART Capsule 0.5MG/1Capsule, 30Capsule/Box", "branch": "T3", "expiry": "2026-08-31", "qty": 1.0, "cost": 97.31, "total": 97.31},{"code": "1-08-187-141", "name": "ARYZALERA 15 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 91.78, "total": 91.78},{"code": "1-08-187-141", "name": "ARYZALERA 15 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 91.78, "total": 91.78},{"code": "1-01-187-143", "name": "VALTREX 500 mg/tablet, 10 TABLET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 75.09, "total": 75.09},{"code": "1-07-059-004", "name": "URILAX Film coated tablet 5MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 72.15, "total": 72.15},{"code": "1-08-047-001", "name": "PRISTIQ Extended release tab 50MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-08-31", "qty": 1.0, "cost": 68.27, "total": 68.27},{"code": "1-04-128-007", "name": "FEMI BIOTIC box Sachets, 20 SACHET/BOX", "branch": "T2", "expiry": "2026-08-31", "qty": 1.0, "cost": 65.0, "total": 65.0},{"code": "1-14-187-014", "name": "EUTHYROX Tablet 150MG/1Tablet, 100Tablet/Box", "branch": "T2", "expiry": "2026-08-31", "qty": 1.0, "cost": 29.85, "total": 29.85},{"code": "1-05-187-073", "name": "CONCOR Tablet 10MG/1Tablet, 30Tablet/Box", "branch": "T3", "expiry": "2026-08-31", "qty": 1.0, "cost": 26.55, "total": 26.55},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 26.26, "total": 26.26},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T2", "expiry": "2026-08-31", "qty": 1.0, "cost": 26.26, "total": 26.26},{"code": "1-14-095-001", "name": "SEPTOFORT LOZENGES 2MG/1Tablet, 24Tablet/Box", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 23.1, "total": 23.1},{"code": "1-05-187-392", "name": "LODIAB XR 1000 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 22.42, "total": 22.42},{"code": "1-07-179-004", "name": "NEO HEALAR Suppository /1Suppository, 10Suppository/Box", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 22.25, "total": 22.25},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T2", "expiry": "2026-08-31", "qty": 1.0, "cost": 21.81, "total": 21.81},{"code": "1-09-031-015", "name": "AVALON FOOT Cream /1APPLY, 90GM/Tube", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 21.15, "total": 21.15},{"code": "1-05-105-002", "name": "ISOBID Modified-release capsule, soft 40MG/1Capsule, 20Capsule/Box", "branch": "T2", "expiry": "2026-08-31", "qty": 1.0, "cost": 19.79, "total": 19.79},{"code": "1-05-187-392", "name": "LODIAB XR 1000 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-14-095-001", "name": "SEPTOFORT LOZENGES 2MG/1Tablet, 24Tablet/Box", "branch": "T1", "expiry": "2026-08-31", "qty": 0.5, "cost": 23.1, "total": 11.55},{"code": "1-14-187-030", "name": "NOLVADEX Tablet 10MG/1Tablet, 30Tablet/Box", "branch": "T3", "expiry": "2026-08-31", "qty": 0.3, "cost": 24.25, "total": 8.0},{"code": "1-05-168-015", "name": "TOUJEO SOLOSTAR 300 iu/ml Solution For Injection , 5 PEN/BOX", "branch": "T1", "expiry": "2026-08-31", "qty": 0.2, "cost": 323.95, "total": 64.79},{"code": "1-09-066-011", "name": "DIFFERIN Gel 0.1%/1APPLY, 30GM/Tube", "branch": "T2", "expiry": "2026-09-07", "qty": 18.0, "cost": 15.63, "total": 281.34},{"code": "1-09-031-154", "name": "EMOLIA apply Cream, 100 GM/TUBE", "branch": "T2", "expiry": "2026-09-08", "qty": 1.0, "cost": 14.35, "total": 14.35},{"code": "1-05-187-395", "name": "VAROXA 20 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-09-09", "qty": 3.0, "cost": 160.73, "total": 482.19},{"code": "1-01-049-020", "name": "LOTINIL drop, 5 ML/CONTAINER", "branch": "T3", "expiry": "2026-09-10", "qty": 9.0, "cost": 53.33, "total": 479.99},{"code": "1-06-031-023", "name": "LOCASONE Cream 0.1%/1APPLY, 100GM/Tube", "branch": "T2", "expiry": "2026-09-10", "qty": 9.0, "cost": 20.25, "total": 182.25},{"code": "1-06-031-023", "name": "LOCASONE Cream 0.1%/1APPLY, 100GM/Tube", "branch": "T3", "expiry": "2026-09-10", "qty": 8.0, "cost": 20.25, "total": 162.0},{"code": "1-06-120-002", "name": "SINEO 1 mg/drop, 20 ML/CONTAINER", "branch": "T3", "expiry": "2026-09-10", "qty": 6.0, "cost": 7.16, "total": 42.96},{"code": "1-05-187-405", "name": "CO-DIOVAN  160/25MG/1Tablet, 28Tablet/Box", "branch": "T2", "expiry": "2026-09-11", "qty": 1.0, "cost": 35.41, "total": 35.41},{"code": "1-09-118-047", "name": "VIOTOPIC Ointment 0.3%/1APPLY, 30GM/Tube\"", "branch": "T2", "expiry": "2026-09-12", "qty": 3.0, "cost": 0.0, "total": 0.0},{"code": "1-09-118-047", "name": "VIOTOPIC Ointment 0.3%/1APPLY, 30GM/Tube\"", "branch": "T2", "expiry": "2026-09-12", "qty": 2.0, "cost": 69.08, "total": 138.16},{"code": "1-06-049-012", "name": "OPTIPRED Eye drops 1%/1Drop, 5ML/Container", "branch": "T1", "expiry": "2026-09-14", "qty": 15.0, "cost": 12.04, "total": 180.6},{"code": "1-06-049-012", "name": "OPTIPRED Eye drops 1%/1Drop, 5ML/Container", "branch": "T3", "expiry": "2026-09-14", "qty": 8.0, "cost": 12.04, "total": 96.32},{"code": "1-06-049-012", "name": "OPTIPRED Eye drops 1%/1Drop, 5ML/Container", "branch": "T2", "expiry": "2026-09-14", "qty": 5.0, "cost": 12.04, "total": 60.2},{"code": "1-09-118-047", "name": "VIOTOPIC Ointment 0.3%/1APPLY, 30GM/Tube\"", "branch": "T2", "expiry": "2026-09-16", "qty": 1.0, "cost": 57.57, "total": 57.57},{"code": "1-06-186-110", "name": "IVY-CALM ml Syrup, 120 ML/BOTTLE", "branch": "T2", "expiry": "2026-09-16", "qty": 1.0, "cost": 7.0, "total": 7.0},{"code": "1-03-186-062", "name": "JP SAFFRON 28 mg/capsule, 30 CAPSULE/BOTTLE", "branch": "T1", "expiry": "2026-09-18", "qty": 2.0, "cost": 106.25, "total": 212.5},{"code": "1-03-186-062", "name": "JP SAFFRON 28 mg/capsule, 30 CAPSULE/BOTTLE", "branch": "T2", "expiry": "2026-09-18", "qty": 2.0, "cost": 106.25, "total": 212.5},{"code": "1-03-186-062", "name": "JP SAFFRON 28 mg/capsule, 30 CAPSULE/BOTTLE", "branch": "T3", "expiry": "2026-09-18", "qty": 1.0, "cost": 106.25, "total": 106.25},{"code": "1-05-187-362", "name": "LOXOL 25 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-09-21", "qty": 2.0, "cost": 19.97, "total": 39.93},{"code": "1-14-187-063", "name": "LEVOGAND 50 mcg/tablet, 100 TABLET/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 97.0, "cost": 16.33, "total": 1584.46},{"code": "1-01-184-093", "name": "KLACID 125 mg/5 ml Suspention, 100 ML/BOTTLE", "branch": "T2", "expiry": "2026-09-30", "qty": 27.0, "cost": 31.08, "total": 839.17},{"code": "1-01-049-012", "name": "TOBREX Eye drops 0.3MG/1Drop, 5ML/Container", "branch": "T2", "expiry": "2026-09-30", "qty": 24.0, "cost": 16.66, "total": 399.84},{"code": "1-09-118-061", "name": "TACROZ 0.03 %/apply Ointment , 10 GM/TUBE", "branch": "T1", "expiry": "2026-09-30", "qty": 18.0, "cost": 18.77, "total": 337.86},{"code": "1-14-187-063", "name": "LEVOGAND 50 mcg/tablet, 100 TABLET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 18.0, "cost": 16.33, "total": 294.02},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 17.0, "cost": 10.37, "total": 176.25},{"code": "1-14-187-063", "name": "LEVOGAND 50 mcg/tablet, 100 TABLET/BOX", "branch": "T3", "expiry": "2026-09-30", "qty": 13.0, "cost": 16.33, "total": 212.35},{"code": "1-03-187-198", "name": "NAFEES PHARMA BIOTIN Tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 12.0, "cost": 25.13, "total": 301.51},{"code": "1-14-166-027", "name": "PURGE Solution /1APPLY, 250ML/Container", "branch": "T1", "expiry": "2026-09-30", "qty": 11.0, "cost": 35.91, "total": 395.0},{"code": "1-14-166-027", "name": "PURGE Solution /1APPLY, 250ML/Container", "branch": "T3", "expiry": "2026-09-30", "qty": 11.0, "cost": 35.91, "total": 395.0},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 11.0, "cost": 11.22, "total": 123.43},{"code": "1-11-049-033", "name": "TRAVATAN Eye drops 0.004MG/1Drop, 2.5ML/Container", "branch": "T1", "expiry": "2026-09-30", "qty": 9.0, "cost": 38.58, "total": 347.26},{"code": "1-01-184-093", "name": "KLACID 125 mg/5 ml Suspention, 100 ML/BOTTLE", "branch": "T1", "expiry": "2026-09-30", "qty": 9.0, "cost": 31.08, "total": 279.72},{"code": "1-14-187-062", "name": "LEVOGAND 100 mcg/tablet, 100 TABLET/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 9.0, "cost": 18.07, "total": 162.61},{"code": "1-16-020-019", "name": "MEGAROY Capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 8.0, "cost": 104.3, "total": 834.4},{"code": "1-04-146-011", "name": "EULAX sachet Powder For Oral Soln, 30 SACHET/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 8.0, "cost": 33.1, "total": 264.77},{"code": "1-03-187-198", "name": "NAFEES PHARMA BIOTIN Tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 8.0, "cost": 25.13, "total": 201.01},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 7.0, "cost": 15.71, "total": 109.97},{"code": "1-03-187-254", "name": "ECHILIB CHewable tablet, 20 TABLET/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 7.0, "cost": 0.0, "total": 0.0},{"code": "1-08-187-070", "name": "ZYPREXA Tablet 5MG/1Tablet, 28Tablet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 6.0, "cost": 144.27, "total": 865.62},{"code": "1-01-184-077", "name": "ZINNAT SUSPENTION 125MG/5ML, 70ML/Bottle", "branch": "T2", "expiry": "2026-09-30", "qty": 6.0, "cost": 26.83, "total": 160.99},{"code": "1-01-020-053", "name": "ROXIL Capsule 500MG/1Capsule, 20Capsule/Box", "branch": "T3", "expiry": "2026-09-30", "qty": 6.0, "cost": 0.0, "total": 0.0},{"code": "1-06-113-006", "name": "PHYSIOTHERM ARKO NASAL SPRAY 9MG/1Spray, 100ML/Container", "branch": "T2", "expiry": "2026-09-30", "qty": 5.0, "cost": 30.75, "total": 153.72},{"code": "1-03-187-254", "name": "ECHILIB CHewable tablet, 20 TABLET/BOX", "branch": "T3", "expiry": "2026-09-30", "qty": 5.0, "cost": 0.0, "total": 0.0},{"code": "1-09-194-002", "name": "FORCAPIL TOPICAL SPRAY", "branch": "T2", "expiry": "2026-09-30", "qty": 4.0, "cost": 85.63, "total": 342.52},{"code": "1-01-184-077", "name": "ZINNAT SUSPENTION 125MG/5ML, 70ML/Bottle", "branch": "T1", "expiry": "2026-09-30", "qty": 4.0, "cost": 26.83, "total": 107.33},{"code": "1-01-187-126", "name": "ZOVIRAX Tablet 400MG/1Tablet, 70Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 3.0, "cost": 272.46, "total": 817.37},{"code": "1-05-187-028", "name": "ATACAND Tablet 8MG/1Tablet, 28Tablet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 3.0, "cost": 45.92, "total": 137.76},{"code": "1-14-166-027", "name": "PURGE Solution /1APPLY, 250ML/Container", "branch": "T1", "expiry": "2026-09-30", "qty": 3.0, "cost": 35.91, "total": 107.73},{"code": "1-06-113-006", "name": "PHYSIOTHERM ARKO NASAL SPRAY 9MG/1Spray, 100ML/Container", "branch": "T2", "expiry": "2026-09-30", "qty": 3.0, "cost": 35.75, "total": 107.25},{"code": "1-05-187-192", "name": "LASIX Tablet 40MG/1Tablet, 20Tablet/Box", "branch": "T3", "expiry": "2026-09-30", "qty": 3.0, "cost": 16.83, "total": 50.49},{"code": "1-06-120-001", "name": "FENISTIL Oral drops 1MG/1Drop, 20ML/Container", "branch": "T3", "expiry": "2026-09-30", "qty": 3.0, "cost": 12.04, "total": 36.13},{"code": "1-06-187-081", "name": "FEXODINE 120 mg/tablet, 14 TABLET/BOX", "branch": "T3", "expiry": "2026-09-30", "qty": 3.0, "cost": 8.78, "total": 26.33},{"code": "1-08-187-070", "name": "ZYPREXA Tablet 5MG/1Tablet, 28Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 2.0, "cost": 144.27, "total": 288.54},{"code": "1-04-128-003", "name": "ENTEROGERMINA ORAL VIAL 2billionMG/1Ampoule, 20Ampoule/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 2.0, "cost": 113.01, "total": 226.03},{"code": "1-04-128-003", "name": "ENTEROGERMINA ORAL VIAL 2billionMG/1Ampoule, 20Ampoule/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 2.0, "cost": 113.01, "total": 226.03},{"code": "1-02-146-007", "name": "GLUCAJONE 1000 mg/sachet, 30 SACHET/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 2.0, "cost": 68.6, "total": 137.2},{"code": "1-08-187-054", "name": "SEROXAT CR 12.5 MG 30Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 2.0, "cost": 51.59, "total": 103.17},{"code": "1-08-187-054", "name": "SEROXAT CR 12.5 MG 30Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 2.0, "cost": 51.59, "total": 103.17},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 2.0, "cost": 23.22, "total": 46.44},{"code": "1-09-118-017", "name": "DERMO Ointment /1APPLY, 30GM/Tube", "branch": "T3", "expiry": "2026-09-30", "qty": 2.0, "cost": 22.8, "total": 45.6},{"code": "1-05-187-006", "name": "ALDACTONE Tablet 100MG/1Tablet, 10Tablet/Box", "branch": "T3", "expiry": "2026-09-30", "qty": 2.0, "cost": 20.88, "total": 41.75},{"code": "1-03-186-026", "name": "OSTEOCARE Syrup 100MG/1ML, 200ML/Bottle", "branch": "T3", "expiry": "2026-09-30", "qty": 2.0, "cost": 16.19, "total": 32.38},{"code": "1-03-186-026", "name": "OSTEOCARE Syrup 100MG/1ML, 200ML/Bottle", "branch": "T1", "expiry": "2026-09-30", "qty": 2.0, "cost": 16.19, "total": 32.38},{"code": "1-06-193-001", "name": "DERMOVATE topical solution 0.05%/1Applicator, 1Applicator/Applicator", "branch": "T1", "expiry": "2026-09-30", "qty": 2.0, "cost": 14.18, "total": 28.37},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 2.0, "cost": 11.22, "total": 22.44},{"code": "1-06-187-076", "name": "DESTAMIN 5 mg/tablet, 20 TABLET/BOX", "branch": "T3", "expiry": "2026-09-30", "qty": 2.0, "cost": 7.85, "total": 15.71},{"code": "1-01-020-053", "name": "ROXIL Capsule 500MG/1Capsule, 20Capsule/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 2.0, "cost": 0.0, "total": 0.0},{"code": "1-03-020-190", "name": "QUEEN JELLY ROYAL NIGELLA Capsule, 30 CAPSULE/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 2.0, "cost": 0.0, "total": 0.0},{"code": "1-03-187-254", "name": "ECHILIB CHewable tablet, 20 TABLET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 2.0, "cost": 0.0, "total": 0.0},{"code": "1-14-086-012", "name": "GONAL-F Injection 450IU/1pen, 1ML/Pen", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 495.0, "total": 495.0},{"code": "1-08-187-073", "name": "ZYPREXA Tablet 10MG/1Tablet, 28Tablet/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 259.64, "total": 259.64},{"code": "1-07-187-008", "name": "MINIRIN MELT Tablet 120MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 166.91, "total": 166.91},{"code": "1-03-020-158", "name": "ROVITAL Capsule /1CAPSULE, 30CAPSULE/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 159.43, "total": 159.43},{"code": "1-08-187-070", "name": "ZYPREXA Tablet 5MG/1Tablet, 28Tablet/Box", "branch": "T3", "expiry": "2026-09-30", "qty": 1.0, "cost": 144.27, "total": 144.27},{"code": "1-04-128-003", "name": "ENTEROGERMINA ORAL VIAL 2billionMG/1Ampoule, 20Ampoule/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 113.02, "total": 113.02},{"code": "1-04-128-003", "name": "ENTEROGERMINA ORAL VIAL 2billionMG/1Ampoule, 20Ampoule/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 113.02, "total": 113.02},{"code": "1-06-083-008", "name": "SERETIDE DISKUS 250MG Inhalation powder /1Inhaler, 60Inhaler/Container", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 109.96, "total": 109.96},{"code": "1-06-083-008", "name": "SERETIDE DISKUS 250MG Inhalation powder /1Inhaler, 60Inhaler/Container", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 109.96, "total": 109.96},{"code": "1-16-020-019", "name": "MEGAROY Capsule, 30 CAPSULE/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 104.3, "total": 104.3},{"code": "1-05-187-308", "name": "SEVIKAR HCT Tablet 40/5/25MG/1Tablet, 28Tablet/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 96.48, "total": 96.48},{"code": "1-08-187-049", "name": "SEROQUEL Tablet 100MG/1Tablet, 60Tablet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 95.92, "total": 95.92},{"code": "1-03-020-190", "name": "QUEEN JELLY ROYAL NIGELLA Capsule, 30 CAPSULE/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 87.45, "total": 87.45},{"code": "1-05-187-308", "name": "SEVIKAR HCT Tablet 40/5/25MG/1Tablet, 28Tablet/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 80.4, "total": 80.4},{"code": "1-08-187-053", "name": "SEROXAT CR Tablet 25MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 71.57, "total": 71.57},{"code": "1-02-146-007", "name": "GLUCAJONE 1000 mg/sachet, 30 SACHET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 68.6, "total": 68.6},{"code": "1-05-187-480", "name": "MELIGAMET 50 mg / 850 mg/tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 51.82, "total": 51.82},{"code": "1-08-187-054", "name": "SEROXAT CR 12.5 MG 30Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 51.59, "total": 51.59},{"code": "1-08-187-054", "name": "SEROXAT CR 12.5 MG 30Tablet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 51.59, "total": 51.59},{"code": "1-08-187-054", "name": "SEROXAT CR 12.5 MG 30Tablet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 51.59, "total": 51.59},{"code": "1-08-187-054", "name": "SEROXAT CR 12.5 MG 30Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 51.59, "total": 51.59},{"code": "1-08-187-054", "name": "SEROXAT CR 12.5 MG 30Tablet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 51.59, "total": 51.59},{"code": "1-05-187-028", "name": "ATACAND Tablet 8MG/1Tablet, 28Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 45.92, "total": 45.92},{"code": "1-02-187-191", "name": "MIGROTAN 40 mg/tablet, 4 TABLET/BOX", "branch": "T3", "expiry": "2026-09-30", "qty": 1.0, "cost": 45.38, "total": 45.38},{"code": "1-02-187-191", "name": "MIGROTAN 40 mg/tablet, 4 TABLET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 45.38, "total": 45.38},{"code": "1-14-166-027", "name": "PURGE Solution /1APPLY, 250ML/Container", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 39.5, "total": 39.5},{"code": "1-11-049-033", "name": "TRAVATAN Eye drops 0.004MG/1Drop, 2.5ML/Container", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 38.58, "total": 38.58},{"code": "1-04-146-011", "name": "EULAX sachet Powder For Oral Soln, 30 SACHET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 33.1, "total": 33.1},{"code": "1-06-095-028", "name": "STREPSILS LEMON SUGAR FREE 1 mg/tablet Lozenges, 36 TABLET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 31.98, "total": 31.98},{"code": "1-01-020-053", "name": "ROXIL Capsule 500MG/1Capsule, 20Capsule/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 31.44, "total": 31.44},{"code": "1-01-020-053", "name": "ROXIL Capsule 500MG/1Capsule, 20Capsule/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 31.44, "total": 31.44},{"code": "1-03-187-144", "name": "SUN-D 1000 iu/tablet, 90 TABLET/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 29.47, "total": 29.47},{"code": "1-03-187-236", "name": "NAFEES PHARMA NEUROBIT-B12 (1000 mcg/tablet), 100 TABLET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 26.88, "total": 26.88},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 26.26, "total": 26.26},{"code": "1-03-187-198", "name": "NAFEES PHARMA BIOTIN Tablet, 60 TABLET/BOX", "branch": "T3", "expiry": "2026-09-30", "qty": 1.0, "cost": 25.13, "total": 25.13},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 21.8, "total": 21.8},{"code": "1-09-118-061", "name": "TACROZ 0.03 %/apply Ointment , 10 GM/TUBE", "branch": "T3", "expiry": "2026-09-30", "qty": 1.0, "cost": 18.77, "total": 18.77},{"code": "1-12-109-039", "name": "HY-SENSE Mouth Wash , 300 ML/BOTTLE", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 18.5, "total": 18.5},{"code": "1-14-187-062", "name": "LEVOGAND 100 mcg/tablet, 100 TABLET/BOX", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 18.07, "total": 18.07},{"code": "1-06-049-023", "name": "TOBRADEX Eye drops /1Drop, 5ML/Container", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 17.5, "total": 17.5},{"code": "1-03-186-026", "name": "OSTEOCARE Syrup 100MG/1ML, 200ML/Bottle", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 16.19, "total": 16.19},{"code": "1-03-186-026", "name": "OSTEOCARE Syrup 100MG/1ML, 200ML/Bottle", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 16.19, "total": 16.19},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 15.71, "total": 15.71},{"code": "1-01-059-016", "name": "CLARITT Film coated tablet 250MG/1Tablet, 14Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 14.6, "total": 14.6},{"code": "1-06-193-001", "name": "DERMOVATE topical solution 0.05%/1Applicator, 1Applicator/Applicator", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 14.18, "total": 14.18},{"code": "1-02-059-005", "name": "KETESSE Film coated tablet 25MG/1Tablet, 20Tablet/Box", "branch": "T3", "expiry": "2026-09-30", "qty": 1.0, "cost": 10.83, "total": 10.83},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 10.37, "total": 10.37},{"code": "1-06-186-108", "name": "DESLIN 1 mg/ml Syrup, 150 ML/BOTTLE", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 8.28, "total": 8.28},{"code": "1-16-020-012", "name": "APLEFIT PLUS Capsule, 60 CAPSULE/BOX", "branch": "T1", "expiry": "2026-09-30", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-01-020-053", "name": "ROXIL Capsule 500MG/1Capsule, 20Capsule/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-06-146-002", "name": "CATAFAST SACHETS 50MG/1Sachet, 9sachet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 0.8, "cost": 15.0, "total": 11.7},{"code": "1-06-146-002", "name": "CATAFAST SACHETS 50MG/1Sachet, 9sachet/Box", "branch": "T2", "expiry": "2026-09-30", "qty": 0.4, "cost": 11.11, "total": 4.89},{"code": "1-09-031-152", "name": "AVALON ALPHA PLUS apply Cream, 30 GM/TUBE", "branch": "T2", "expiry": "2026-10-08", "qty": 3.0, "cost": 61.65, "total": 184.95},{"code": "1-09-031-152", "name": "AVALON ALPHA PLUS apply Cream, 30 GM/TUBE", "branch": "T1", "expiry": "2026-10-08", "qty": 1.0, "cost": 61.65, "total": 61.65},{"code": "1-06-049-012", "name": "OPTIPRED Eye drops 1%/1Drop, 5ML/Container", "branch": "T1", "expiry": "2026-10-09", "qty": 17.0, "cost": 12.04, "total": 204.68},{"code": "1-06-049-012", "name": "OPTIPRED Eye drops 1%/1Drop, 5ML/Container", "branch": "T2", "expiry": "2026-10-09", "qty": 12.0, "cost": 12.04, "total": 144.48},{"code": "1-09-118-025", "name": "FUSIBACT Ointment 2%/1APPLY, 15GM/Tube", "branch": "T2", "expiry": "2026-10-10", "qty": 2.0, "cost": 3.0, "total": 5.99},{"code": "1-09-118-025", "name": "FUSIBACT Ointment 2%/1APPLY, 15GM/Tube", "branch": "T3", "expiry": "2026-10-10", "qty": 1.0, "cost": 3.0, "total": 3.0},{"code": "1-06-187-086", "name": "RINOFED COLD&ALLERGY Tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-10-11", "qty": 3.0, "cost": 5.34, "total": 16.01},{"code": "1-08-187-062", "name": "TEGRETOL CR Tablet 400MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-10-11", "qty": 1.0, "cost": 28.91, "total": 28.91},{"code": "1-02-186-016", "name": "EMIDOL 120 mg/5 ml Syrup, 100 ML/BOTTLE", "branch": "T1", "expiry": "2026-10-12", "qty": 185.0, "cost": 0.01, "total": 2.05},{"code": "1-02-186-016", "name": "EMIDOL 120 mg/5 ml Syrup, 100 ML/BOTTLE", "branch": "T2", "expiry": "2026-10-12", "qty": 127.0, "cost": 0.01, "total": 1.41},{"code": "1-08-059-033", "name": "DEBILUR 20 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-10-12", "qty": 1.0, "cost": 149.72, "total": 149.72},{"code": "1-08-059-033", "name": "DEBILUR 20 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-10-12", "qty": 1.0, "cost": 149.72, "total": 149.72},{"code": "1-08-059-033", "name": "DEBILUR 20 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-10-12", "qty": 1.0, "cost": 149.72, "total": 149.72},{"code": "1-02-187-163", "name": "TORICOX 120 mg/tablet, 10 TABLET/BOX", "branch": "T3", "expiry": "2026-10-13", "qty": 3.0, "cost": 8.75, "total": 26.25},{"code": "1-01-187-132", "name": "VULGA XR Tablet 105MG/1Tablet, 30TABLET/BOX", "branch": "T3", "expiry": "2026-10-13", "qty": 2.0, "cost": 94.21, "total": 188.42},{"code": "1-08-187-062", "name": "TEGRETOL CR Tablet 400MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-10-14", "qty": 1.0, "cost": 28.91, "total": 28.91},{"code": "1-04-187-119", "name": "ONDANS 4 mg/tablet, 10 TABLET/BOX", "branch": "T1", "expiry": "2026-10-17", "qty": 16.0, "cost": 52.59, "total": 841.49},{"code": "1-04-187-119", "name": "ONDANS 4 mg/tablet, 10 TABLET/BOX", "branch": "T3", "expiry": "2026-10-17", "qty": 10.0, "cost": 52.59, "total": 525.93},{"code": "1-04-187-119", "name": "ONDANS 4 mg/tablet, 10 TABLET/BOX", "branch": "T2", "expiry": "2026-10-17", "qty": 3.0, "cost": 52.59, "total": 157.78},{"code": "1-04-179-009", "name": "LAXOCODYL 10 mg/suppository, 10 SUPPOSITORY/BOX", "branch": "T2", "expiry": "2026-10-18", "qty": 4.0, "cost": 5.8, "total": 23.21},{"code": "1-04-179-009", "name": "LAXOCODYL 10 mg/suppository, 10 SUPPOSITORY/BOX", "branch": "T3", "expiry": "2026-10-18", "qty": 1.0, "cost": 5.8, "total": 5.8},{"code": "1-01-186-010", "name": "LOVRAK 200MG/5ML/100ML SYRUP 200MG/5ML, 100ML/BOTTLE", "branch": "T1", "expiry": "2026-10-20", "qty": 9.0, "cost": 56.31, "total": 506.8},{"code": "1-01-186-010", "name": "LOVRAK 200MG/5ML/100ML SYRUP 200MG/5ML, 100ML/BOTTLE", "branch": "T2", "expiry": "2026-10-20", "qty": 5.0, "cost": 56.31, "total": 281.55},{"code": "1-01-186-010", "name": "LOVRAK 200MG/5ML/100ML SYRUP 200MG/5ML, 100ML/BOTTLE", "branch": "T3", "expiry": "2026-10-20", "qty": 2.0, "cost": 56.31, "total": 112.62},{"code": "1-02-187-005", "name": "ADOL SINUS Tablet /1Capsule, 20Tablet/Box", "branch": "T3", "expiry": "2026-10-20", "qty": 2.0, "cost": 6.5, "total": 12.99},{"code": "1-03-020-174", "name": "NEMR ROYAL 1000 mg/capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-10-20", "qty": 1.0, "cost": 123.25, "total": 123.25},{"code": "1-09-031-002", "name": "ACRETIN Cream 0.05%/1APPLY, 30GM/Tube", "branch": "T2", "expiry": "2026-10-20", "qty": 1.0, "cost": 12.04, "total": 12.04},{"code": "1-02-187-005", "name": "ADOL SINUS Tablet /1Capsule, 20Tablet/Box", "branch": "T1", "expiry": "2026-10-20", "qty": 1.0, "cost": 6.5, "total": 6.5},{"code": "1-08-186-011", "name": "LUSAM 10MG/ML 200M/BOTTLE SYP", "branch": "T1", "expiry": "2026-10-21", "qty": 5.0, "cost": 65.66, "total": 328.32},{"code": "1-08-186-011", "name": "LUSAM 10MG/ML 200M/BOTTLE SYP", "branch": "T2", "expiry": "2026-10-21", "qty": 3.0, "cost": 65.66, "total": 196.99},{"code": "1-08-186-011", "name": "LUSAM 10MG/ML 200M/BOTTLE SYP", "branch": "T3", "expiry": "2026-10-21", "qty": 2.0, "cost": 65.66, "total": 131.33},{"code": "1-05-187-360", "name": "LODIPAM 10 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-10-21", "qty": 1.0, "cost": 27.35, "total": 27.35},{"code": "1-09-031-152", "name": "AVALON ALPHA PLUS apply Cream, 30 GM/TUBE", "branch": "T2", "expiry": "2026-10-22", "qty": 5.0, "cost": 61.65, "total": 308.25},{"code": "1-08-187-146", "name": "LAZURE 50 mg/tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-10-22", "qty": 3.0, "cost": 92.85, "total": 278.55},{"code": "1-09-031-152", "name": "AVALON ALPHA PLUS apply Cream, 30 GM/TUBE", "branch": "T1", "expiry": "2026-10-23", "qty": 6.0, "cost": 61.65, "total": 369.9},{"code": "1-03-186-061", "name": "JP MACA 500 mg/capsule, 50 CAPSULE/BOTTLE", "branch": "T1", "expiry": "2026-10-23", "qty": 2.0, "cost": 102.0, "total": 204.0},{"code": "1-09-031-152", "name": "AVALON ALPHA PLUS apply Cream, 30 GM/TUBE", "branch": "T2", "expiry": "2026-10-23", "qty": 2.0, "cost": 61.65, "total": 123.3},{"code": "1-09-031-152", "name": "AVALON ALPHA PLUS apply Cream, 30 GM/TUBE", "branch": "T1", "expiry": "2026-10-23", "qty": 1.0, "cost": 61.65, "total": 61.65},{"code": "1-09-031-152", "name": "AVALON ALPHA PLUS apply Cream, 30 GM/TUBE", "branch": "T3", "expiry": "2026-10-23", "qty": 1.0, "cost": 61.65, "total": 61.65},{"code": "1-06-187-008", "name": "BILAXTEN Tablet 20MG/1Tablet, 20Tablet/Box", "branch": "T1", "expiry": "2026-10-24", "qty": 2.0, "cost": 24.79, "total": 49.58},{"code": "1-01-020-034", "name": "GLOMOX Capsule 500MG/1Capsule, 20Capsule/Box", "branch": "T1", "expiry": "2026-10-25", "qty": 2.0, "cost": 11.0, "total": 22.0},{"code": "1-03-164-008", "name": "VITALIFE Soft Gel Cap /1Capsule, 30Capsule/Box", "branch": "T2", "expiry": "2026-10-27", "qty": 2.0, "cost": 27.67, "total": 55.33},{"code": "1-05-059-119", "name": "RAVIXA 75 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-10-28", "qty": 2.0, "cost": 86.86, "total": 173.72},{"code": "1-05-059-119", "name": "RAVIXA 75 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-10-28", "qty": 1.0, "cost": 137.4, "total": 137.4},{"code": "1-05-059-119", "name": "RAVIXA 75 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-10-28", "qty": 1.0, "cost": 137.4, "total": 137.4},{"code": "1-05-059-119", "name": "RAVIXA 75 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-10-28", "qty": 1.0, "cost": 85.87, "total": 85.87},{"code": "1-05-059-119", "name": "RAVIXA 75 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-10-28", "qty": 1.0, "cost": 85.87, "total": 85.87},{"code": "1-01-059-038", "name": "VEDOXIN 500 mg/tablet, 5 TABLET/BOX", "branch": "T2", "expiry": "2026-10-29", "qty": 5.0, "cost": 28.06, "total": 140.29},{"code": "1-05-059-027", "name": "IPRAMAX Film coated tablet 100MG/1Tablet, 60Tablet/Box", "branch": "T2", "expiry": "2026-10-29", "qty": 2.0, "cost": 78.76, "total": 157.51},{"code": "1-03-187-228", "name": "NERVAN 500 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-10-29", "qty": 2.0, "cost": 33.79, "total": 67.58},{"code": "1-03-164-009", "name": "JP VITAMIN D3 Soft Gel Cap 1000IU/1Capsule, 60Capsule/Box", "branch": "T1", "expiry": "2026-10-29", "qty": 2.0, "cost": 27.5, "total": 55.0},{"code": "1-05-059-027", "name": "IPRAMAX Film coated tablet 100MG/1Tablet, 60Tablet/Box", "branch": "T2", "expiry": "2026-10-29", "qty": 1.0, "cost": 79.25, "total": 79.25},{"code": "1-05-187-485", "name": "SITAVIC 50/1000 mg/tablet, 56 TABLET/BOX", "branch": "T3", "expiry": "2026-10-29", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-03-164-009", "name": "JP VITAMIN D3 Soft Gel Cap 1000IU/1Capsule, 60Capsule/Box", "branch": "T1", "expiry": "2026-10-30", "qty": 8.0, "cost": 27.5, "total": 220.0},{"code": "1-03-020-182", "name": "QUERSA Capsule, 60 CAPSULE/BOTTLE", "branch": "T1", "expiry": "2026-10-30", "qty": 2.0, "cost": 125.3, "total": 250.6},{"code": "1-03-020-182", "name": "QUERSA Capsule, 60 CAPSULE/BOTTLE", "branch": "T2", "expiry": "2026-10-30", "qty": 1.0, "cost": 125.3, "total": 125.3},{"code": "1-03-164-009", "name": "JP VITAMIN D3 Soft Gel Cap 1000IU/1Capsule, 60Capsule/Box", "branch": "T2", "expiry": "2026-10-30", "qty": 1.0, "cost": 27.5, "total": 27.5},{"code": "1-05-020-032", "name": "LYPFEN 200 mg/capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-10-30", "qty": 1.0, "cost": 2.35, "total": 2.35},{"code": "1-05-187-287", "name": "TRENTAL Tablet 400MG/1Tablet, 20Tablet/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 51.0, "cost": 22.51, "total": 1148.01},{"code": "1-06-049-023", "name": "TOBRADEX Eye drops /1Drop, 5ML/Container", "branch": "T2", "expiry": "2026-10-31", "qty": 41.0, "cost": 17.5, "total": 717.5},{"code": "1-05-187-115", "name": "FORXIGA Tablet 10MG/1Tablet, 28Tablet/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 19.1, "cost": 110.61, "total": 2109.39},{"code": "1-05-187-287", "name": "TRENTAL Tablet 400MG/1Tablet, 20Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 19.0, "cost": 22.51, "total": 427.69},{"code": "1-03-020-188", "name": "FORCAPIL Capsule, 180 CAPSULE/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 15.0, "cost": 103.86, "total": 1557.84},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 13.0, "cost": 15.71, "total": 204.22},{"code": "1-09-049-047", "name": "ARTELAC COMPLET MDO 24 %/drop, 10 ML/CONTAINER", "branch": "T1", "expiry": "2026-10-31", "qty": 12.0, "cost": 40.33, "total": 483.98},{"code": "1-03-020-073", "name": "MARNYS SALMON OIL VIT E Capsule 60MG/1Capsule, 60Capsule/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 12.0, "cost": 31.61, "total": 379.33},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 12.0, "cost": 10.18, "total": 122.15},{"code": "1-04-020-006", "name": "SENNA ARKO Capsule 180MG/1Capsule, 45Capsule/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 10.0, "cost": 20.79, "total": 207.87},{"code": "1-01-138-028", "name": "CEFAJECT 1000 mg IV /vial Powder For Injection, VIAL", "branch": "T1", "expiry": "2026-10-31", "qty": 9.0, "cost": 34.13, "total": 307.17},{"code": "1-03-020-073", "name": "MARNYS SALMON OIL VIT E Capsule 60MG/1Capsule, 60Capsule/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 9.0, "cost": 31.61, "total": 284.5},{"code": "1-05-182-001", "name": "NOVOMIX 30 FLEXPEN Susp. for inj. pre-filled pen 30IU/1ML, 15ML/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 8.6, "cost": 164.35, "total": 1413.45},{"code": "1-05-001-009", "name": "MOUNJARO 7.5 mg/ml Ampoule, 4 AMPOULE/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 8.0, "cost": 1146.74, "total": 9173.91},{"code": "1-03-146-032", "name": "DOXIDA-M sachet, 30 SACHET/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 8.0, "cost": 166.15, "total": 1329.23},{"code": "1-03-020-073", "name": "MARNYS SALMON OIL VIT E Capsule 60MG/1Capsule, 60Capsule/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 8.0, "cost": 31.61, "total": 252.89},{"code": "1-06-085-015", "name": "SPIRIVA INHALATION SPRAY 18MG/1Inhaler, 30Inhaler/Container", "branch": "T2", "expiry": "2026-10-31", "qty": 7.0, "cost": 123.61, "total": 865.3},{"code": "1-06-085-011", "name": "SERETIDE EVOHALER125MG INHALATION SPRAY /1Inhaler, 120Inhaler/Container", "branch": "T2", "expiry": "2026-10-31", "qty": 7.0, "cost": 98.09, "total": 686.64},{"code": "1-03-146-032", "name": "DOXIDA-M sachet, 30 SACHET/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 6.0, "cost": 166.15, "total": 996.92},{"code": "1-05-001-009", "name": "MOUNJARO 7.5 mg/ml Ampoule, 4 AMPOULE/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 5.0, "cost": 1146.74, "total": 5733.69},{"code": "1-02-146-002", "name": "BONOLIGHT (CARTIBON) SACHETS /1SACHET, 30SACHET/BOX", "branch": "T3", "expiry": "2026-10-31", "qty": 5.0, "cost": 257.05, "total": 1285.23},{"code": "1-03-146-032", "name": "DOXIDA-M sachet, 30 SACHET/BOX", "branch": "T3", "expiry": "2026-10-31", "qty": 5.0, "cost": 166.15, "total": 830.77},{"code": "1-06-085-011", "name": "SERETIDE EVOHALER125MG INHALATION SPRAY /1Inhaler, 120Inhaler/Container", "branch": "T1", "expiry": "2026-10-31", "qty": 5.0, "cost": 98.09, "total": 490.45},{"code": "1-08-186-010", "name": "VIMPAT 2 %/ml Syrup, 200 ML/BOTTLE", "branch": "T1", "expiry": "2026-10-31", "qty": 5.0, "cost": 84.17, "total": 420.85},{"code": "1-02-187-062", "name": "JOINTACE CHONDROITIN GLUCOSAMIN Tablet /1Tablet, 60Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 5.0, "cost": 37.91, "total": 189.57},{"code": "1-02-187-062", "name": "JOINTACE CHONDROITIN GLUCOSAMIN Tablet /1Tablet, 60Tablet/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 5.0, "cost": 36.4, "total": 182.01},{"code": "1-07-118-001", "name": "NEO HEALAR Ointment /1APPLY, 30GM/Tube", "branch": "T2", "expiry": "2026-10-31", "qty": 5.0, "cost": 22.29, "total": 111.46},{"code": "1-03-020-182", "name": "QUERSA Capsule, 60 CAPSULE/BOTTLE", "branch": "T1", "expiry": "2026-10-31", "qty": 4.0, "cost": 125.3, "total": 501.2},{"code": "1-02-187-062", "name": "JOINTACE CHONDROITIN GLUCOSAMIN Tablet /1Tablet, 60Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 4.0, "cost": 36.4, "total": 145.61},{"code": "1-01-184-078", "name": "ZINNAT SUSPENTION 250MG/5ML, 50ML/Bottle", "branch": "T1", "expiry": "2026-10-31", "qty": 4.0, "cost": 34.05, "total": 136.22},{"code": "1-05-086-013", "name": "APIDRA SOLOSTAR 100 iu/ml Injection, 5 VIAL/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 3.0, "cost": 147.04, "total": 441.13},{"code": "1-05-086-013", "name": "APIDRA SOLOSTAR 100 iu/ml Injection, 5 VIAL/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 3.0, "cost": 147.04, "total": 441.13},{"code": "1-09-083-001", "name": "RELVAR ELLIPTA inhalation powder 100/25MCG/1Inhaler, 30doses/Inhaler", "branch": "T1", "expiry": "2026-10-31", "qty": 3.0, "cost": 137.74, "total": 413.23},{"code": "1-03-187-205", "name": "KIDS GUMMY OMEGA+DHA tablet, 60 TABLET/BOX", "branch": "T3", "expiry": "2026-10-31", "qty": 3.0, "cost": 84.0, "total": 252.0},{"code": "1-09-194-012", "name": "NYDA PLUS 100 ml topical spray /1Applicator, 1Applicator/Applicator", "branch": "T1", "expiry": "2026-10-31", "qty": 3.0, "cost": 60.52, "total": 181.57},{"code": "1-09-194-012", "name": "NYDA PLUS 100 ml topical spray /1Applicator, 1Applicator/Applicator", "branch": "T1", "expiry": "2026-10-31", "qty": 3.0, "cost": 60.52, "total": 181.57},{"code": "1-09-194-012", "name": "NYDA PLUS 100 ml topical spray /1Applicator, 1Applicator/Applicator", "branch": "T2", "expiry": "2026-10-31", "qty": 3.0, "cost": 60.52, "total": 181.57},{"code": "1-09-094-027", "name": "HEALCARE 100 mg/g Lotion, 180 ML/CONTAINER", "branch": "T1", "expiry": "2026-10-31", "qty": 3.0, "cost": 34.73, "total": 104.18},{"code": "1-09-094-027", "name": "HEALCARE 100 mg/g Lotion, 180 ML/CONTAINER", "branch": "T3", "expiry": "2026-10-31", "qty": 3.0, "cost": 34.73, "total": 104.18},{"code": "1-01-184-078", "name": "ZINNAT SUSPENTION 250MG/5ML, 50ML/Bottle", "branch": "T2", "expiry": "2026-10-31", "qty": 3.0, "cost": 34.05, "total": 102.16},{"code": "1-03-020-073", "name": "MARNYS SALMON OIL VIT E Capsule 60MG/1Capsule, 60Capsule/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 3.0, "cost": 31.61, "total": 94.83},{"code": "1-03-020-073", "name": "MARNYS SALMON OIL VIT E Capsule 60MG/1Capsule, 60Capsule/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 3.0, "cost": 31.61, "total": 94.83},{"code": "1-09-066-053", "name": "CONTRACTUBEX 1 %/apply Gel, 50 GM/TUBE", "branch": "T3", "expiry": "2026-10-31", "qty": 3.0, "cost": 26.21, "total": 78.64},{"code": "1-07-179-004", "name": "NEO HEALAR Suppository /1Suppository, 10Suppository/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 3.0, "cost": 22.25, "total": 66.76},{"code": "1-07-187-030", "name": "MYFORTIC 360 mg/tablet, 120 TABLET/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 2.0, "cost": 752.82, "total": 1505.64},{"code": "1-07-187-020", "name": "BETMIGA 50 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 2.0, "cost": 159.91, "total": 319.83},{"code": "1-09-118-067", "name": "DAIVOBET apply Ointment , 60 GM/TUBE", "branch": "T2", "expiry": "2026-10-31", "qty": 2.0, "cost": 129.01, "total": 258.01},{"code": "1-04-049-001", "name": "BIOGAIA oral drops 100MILLION/1Drop, 5ML/Container", "branch": "T2", "expiry": "2026-10-31", "qty": 2.0, "cost": 98.26, "total": 196.52},{"code": "1-06-085-011", "name": "SERETIDE EVOHALER125MG INHALATION SPRAY /1Inhaler, 120Inhaler/Container", "branch": "T3", "expiry": "2026-10-31", "qty": 2.0, "cost": 98.09, "total": 196.18},{"code": "1-08-187-015", "name": "FAVERIN Tablet 50MG/1Tablet, 60Tablet/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 2.0, "cost": 72.04, "total": 144.09},{"code": "1-03-146-032", "name": "DOXIDA-M sachet, 30 SACHET/BOX", "branch": "T3", "expiry": "2026-10-31", "qty": 2.0, "cost": 71.9, "total": 143.81},{"code": "1-09-194-012", "name": "NYDA PLUS 100 ml topical spray /1Applicator, 1Applicator/Applicator", "branch": "T2", "expiry": "2026-10-31", "qty": 2.0, "cost": 60.52, "total": 121.04},{"code": "1-09-066-047", "name": "SCAR PRO apply Gel, 6 GM/TUBE", "branch": "T2", "expiry": "2026-10-31", "qty": 2.0, "cost": 45.0, "total": 90.0},{"code": "1-02-187-062", "name": "JOINTACE CHONDROITIN GLUCOSAMIN Tablet /1Tablet, 60Tablet/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 2.0, "cost": 37.91, "total": 75.83},{"code": "1-03-020-073", "name": "MARNYS SALMON OIL VIT E Capsule 60MG/1Capsule, 60Capsule/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 2.0, "cost": 31.61, "total": 63.22},{"code": "1-07-179-004", "name": "NEO HEALAR Suppository /1Suppository, 10Suppository/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 2.0, "cost": 24.0, "total": 48.0},{"code": "1-02-020-040", "name": "PROLAX Capsule 15MG/1Capsule, 30Capsule/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 2.0, "cost": 23.03, "total": 46.06},{"code": "1-09-031-015", "name": "AVALON FOOT Cream /1APPLY, 90GM/Tube", "branch": "T1", "expiry": "2026-10-31", "qty": 2.0, "cost": 21.15, "total": 42.3},{"code": "1-04-020-006", "name": "SENNA ARKO Capsule 180MG/1Capsule, 45Capsule/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 2.0, "cost": 20.79, "total": 41.57},{"code": "1-05-059-105", "name": "RYBELSUS 3 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 415.19, "total": 415.19},{"code": "1-16-020-014", "name": "ARGITEST capsule Tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 203.0, "total": 203.0},{"code": "1-03-146-023", "name": "MOTOVA C Advanced sachet, 30 SACHET/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 188.41, "total": 188.41},{"code": "1-05-086-013", "name": "APIDRA SOLOSTAR 100 iu/ml Injection, 5 VIAL/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 147.04, "total": 147.04},{"code": "1-05-187-345", "name": "$$old$$SYNJARDY 12.5/1000 mg/tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 142.04, "total": 142.04},{"code": "1-03-020-205", "name": "ROYAL JELLY 1000 mg/capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 125.48, "total": 125.48},{"code": "1-03-020-182", "name": "QUERSA Capsule, 60 CAPSULE/BOTTLE", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 125.3, "total": 125.3},{"code": "1-09-066-020", "name": "HEMAGEL Gel /1APPLY, 30GM/Tube", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 113.76, "total": 113.76},{"code": "1-09-066-020", "name": "HEMAGEL Gel /1APPLY, 30GM/Tube", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 113.76, "total": 113.76},{"code": "1-03-020-188", "name": "FORCAPIL Capsule, 180 CAPSULE/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 103.86, "total": 103.86},{"code": "1-04-049-001", "name": "BIOGAIA oral drops 100MILLION/1Drop, 5ML/Container", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 98.26, "total": 98.26},{"code": "1-07-020-002", "name": "AVODART Capsule 0.5MG/1Capsule, 30Capsule/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 97.31, "total": 97.31},{"code": "1-05-187-085", "name": "$$old$$COVERAM Tablet 10 mg / 5 MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 89.31, "total": 89.31},{"code": "1-03-187-205", "name": "KIDS GUMMY OMEGA+DHA tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 84.0, "total": 84.0},{"code": "1-03-187-205", "name": "KIDS GUMMY OMEGA+DHA tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 84.0, "total": 84.0},{"code": "1-08-187-015", "name": "FAVERIN Tablet 50MG/1Tablet, 60Tablet/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 72.04, "total": 72.04},{"code": "1-08-187-023", "name": "LAMICTAL Tablet 50MG/1Tablet, 30Tablet/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 47.67, "total": 47.67},{"code": "1-14-201-005", "name": "HERBA CARE VAGINAL WASH /1ML, 250ML/Container", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 39.5, "total": 39.5},{"code": "1-03-020-156", "name": "EVENING PRIMROSE OIL Capsule /1CAPSULE, 30CAPSULE/BOX", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 38.5, "total": 38.5},{"code": "1-02-187-062", "name": "JOINTACE CHONDROITIN GLUCOSAMIN Tablet /1Tablet, 60Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 37.91, "total": 37.91},{"code": "1-02-187-062", "name": "JOINTACE CHONDROITIN GLUCOSAMIN Tablet /1Tablet, 60Tablet/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 36.4, "total": 36.4},{"code": "1-01-184-087", "name": "DENACIF 125 mg/5 ml Suspention, 50 ML/BOTTLE", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 34.5, "total": 34.5},{"code": "1-03-020-156", "name": "EVENING PRIMROSE OIL Capsule /1CAPSULE, 30CAPSULE/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 31.82, "total": 31.82},{"code": "1-14-187-014", "name": "EUTHYROX Tablet 150MG/1Tablet, 100Tablet/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 30.46, "total": 30.46},{"code": "1-05-187-430", "name": "JALRA 50 mg/tablet, 28 TABLET/BOX", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 30.4, "total": 30.4},{"code": "1-09-049-036", "name": "VIZOL  0.21 %/drop, 10 ML/CONTAINER", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 29.04, "total": 29.04},{"code": "1-09-049-036", "name": "VIZOL  0.21 %/drop, 10 ML/CONTAINER", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 29.04, "total": 29.04},{"code": "1-05-187-287", "name": "TRENTAL Tablet 400MG/1Tablet, 20Tablet/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 22.51, "total": 22.51},{"code": "1-09-031-015", "name": "AVALON FOOT Cream /1APPLY, 90GM/Tube", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 21.15, "total": 21.15},{"code": "1-08-187-142", "name": "DOGMATIL 200 mg/tablet, 12 TABLET/BOX", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 18.75, "total": 18.75},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 15.71, "total": 15.71},{"code": "1-08-187-003", "name": "ANAFRANIL Tablet 10MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 14.92, "total": 14.92},{"code": "1-08-187-003", "name": "ANAFRANIL Tablet 10MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 14.92, "total": 14.92},{"code": "1-01-059-016", "name": "CLARITT Film coated tablet 250MG/1Tablet, 14Tablet/Box", "branch": "T1", "expiry": "2026-10-31", "qty": 1.0, "cost": 14.6, "total": 14.6},{"code": "1-06-187-017", "name": "CLARINASE Tablet 5/120MG/1Tablet, 14Tablet/Box", "branch": "T3", "expiry": "2026-10-31", "qty": 1.0, "cost": 10.18, "total": 10.18},{"code": "1-05-059-047", "name": "LORVAST Film coated tablet 20MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-06-146-002", "name": "CATAFAST SACHETS 50MG/1Sachet, 9sachet/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 0.7, "cost": 15.0, "total": 10.05},{"code": "1-05-182-001", "name": "NOVOMIX 30 FLEXPEN Susp. for inj. pre-filled pen 30IU/1ML, 15ML/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 0.4, "cost": 164.35, "total": 65.74},{"code": "1-06-146-002", "name": "CATAFAST SACHETS 50MG/1Sachet, 9sachet/Box", "branch": "T2", "expiry": "2026-10-31", "qty": 0.3, "cost": 15.0, "total": 4.95},{"code": "1-03-187-169", "name": "RAFOL 5 mg/tablet, 50 TABLET/BOX", "branch": "T2", "expiry": "2026-10-31", "qty": 0.0, "cost": 8.5, "total": 0.17},{"code": "1-03-186-062", "name": "JP SAFFRON 28 mg/capsule, 30 CAPSULE/BOTTLE", "branch": "T1", "expiry": "2026-11-07", "qty": 2.0, "cost": 106.25, "total": 212.5},{"code": "1-03-086-003", "name": "DEPOVIT B12 Injection 1000MG/1Ampoule, 2ML/Ampoule", "branch": "T3", "expiry": "2026-11-07", "qty": 1.0, "cost": 5.03, "total": 5.03},{"code": "1-01-187-129", "name": "VULGA TABLET 55MG/1Tablet, 30TABLET/BOX", "branch": "T2", "expiry": "2026-11-10", "qty": 1.0, "cost": 50.73, "total": 50.73},{"code": "1-04-138-001", "name": "RISEK Powder for injection 40MG/1Vial, 1Vial/Box", "branch": "T1", "expiry": "2026-11-10", "qty": 1.0, "cost": 10.0, "total": 10.0},{"code": "1-04-138-001", "name": "RISEK Powder for injection 40MG/1Vial, 1Vial/Box", "branch": "T2", "expiry": "2026-11-10", "qty": 1.0, "cost": 10.0, "total": 10.0},{"code": "1-06-187-086", "name": "RINOFED COLD&ALLERGY Tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-11-11", "qty": 18.0, "cost": 5.13, "total": 92.35},{"code": "1-06-187-086", "name": "RINOFED COLD&ALLERGY Tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-11-11", "qty": 10.0, "cost": 5.13, "total": 51.31},{"code": "1-06-187-086", "name": "RINOFED COLD&ALLERGY Tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-11-11", "qty": 3.0, "cost": 5.13, "total": 15.39},{"code": "1-05-187-486", "name": "SITAVIC 50/850 mg/tablet, 56 TABLET/BOX", "branch": "T3", "expiry": "2026-11-11", "qty": 2.0, "cost": 0.0, "total": 0.0},{"code": "1-14-086-009", "name": "EPIFASI Injection 5000IU/1Vial, 1Vial/Box", "branch": "T2", "expiry": "2026-11-11", "qty": 1.0, "cost": 20.57, "total": 20.57},{"code": "1-08-059-034", "name": "DEBILUR 40 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-11-12", "qty": 4.0, "cost": 149.72, "total": 598.86},{"code": "1-16-020-017", "name": "GARCIMIUM 1 gm/tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-11-12", "qty": 1.0, "cost": 126.75, "total": 126.75},{"code": "1-03-186-060", "name": "OMEGA MIND 1200 mg/5 ml Syrup, 100 ML/BOTTLE", "branch": "T1", "expiry": "2026-11-13", "qty": 2.0, "cost": 110.5, "total": 221.0},{"code": "1-03-187-146", "name": "BEFOLVIT 5 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-11-14", "qty": 8.0, "cost": 5.11, "total": 40.89},{"code": "1-03-186-060", "name": "OMEGA MIND 1200 mg/5 ml Syrup, 100 ML/BOTTLE", "branch": "T1", "expiry": "2026-11-14", "qty": 1.0, "cost": 110.5, "total": 110.5},{"code": "1-08-187-137", "name": "CARPAZIO 600 mg/tablet, 50 TABLET/BOX", "branch": "T1", "expiry": "2026-11-14", "qty": 1.0, "cost": 59.6, "total": 59.6},{"code": "1-14-138-004", "name": "FOSTIMON Powder for injection 75IU/1ML, 1Vial/Box", "branch": "T1", "expiry": "2026-11-16", "qty": 2.0, "cost": 64.44, "total": 128.87},{"code": "1-05-187-395", "name": "VAROXA 20 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-11-16", "qty": 1.0, "cost": 160.73, "total": 160.73},{"code": "1-14-138-004", "name": "FOSTIMON Powder for injection 75IU/1ML, 1Vial/Box", "branch": "T1", "expiry": "2026-11-16", "qty": 1.0, "cost": 64.44, "total": 64.44},{"code": "1-14-138-004", "name": "FOSTIMON Powder for injection 75IU/1ML, 1Vial/Box", "branch": "T1", "expiry": "2026-11-16", "qty": 1.0, "cost": 64.44, "total": 64.44},{"code": "1-14-138-004", "name": "FOSTIMON Powder for injection 75IU/1ML, 1Vial/Box", "branch": "T2", "expiry": "2026-11-16", "qty": 1.0, "cost": 64.44, "total": 64.44},{"code": "1-14-138-004", "name": "FOSTIMON Powder for injection 75IU/1ML, 1Vial/Box", "branch": "T2", "expiry": "2026-11-16", "qty": 1.0, "cost": 64.44, "total": 64.44},{"code": "1-04-179-010", "name": "LAXOCODYL 5 mg/suppository, 10 SUPPOSITORY/BOX", "branch": "T2", "expiry": "2026-11-17", "qty": 6.0, "cost": 5.8, "total": 34.81},{"code": "1-04-179-010", "name": "LAXOCODYL 5 mg/suppository, 10 SUPPOSITORY/BOX", "branch": "T1", "expiry": "2026-11-17", "qty": 1.0, "cost": 5.8, "total": 5.8},{"code": "1-04-179-010", "name": "LAXOCODYL 5 mg/suppository, 10 SUPPOSITORY/BOX", "branch": "T1", "expiry": "2026-11-17", "qty": 1.0, "cost": 5.8, "total": 5.8},{"code": "1-03-164-009", "name": "JP VITAMIN D3 Soft Gel Cap 1000IU/1Capsule, 60Capsule/Box", "branch": "T1", "expiry": "2026-11-18", "qty": 28.0, "cost": 27.5, "total": 770.0},{"code": "1-03-164-009", "name": "JP VITAMIN D3 Soft Gel Cap 1000IU/1Capsule, 60Capsule/Box", "branch": "T2", "expiry": "2026-11-18", "qty": 17.0, "cost": 27.5, "total": 467.5},{"code": "1-05-059-120", "name": "PEXAPAN 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-11-18", "qty": 2.0, "cost": 133.92, "total": 267.84},{"code": "1-03-164-009", "name": "JP VITAMIN D3 Soft Gel Cap 1000IU/1Capsule, 60Capsule/Box", "branch": "T3", "expiry": "2026-11-18", "qty": 2.0, "cost": 27.5, "total": 55.0},{"code": "1-03-187-041", "name": "ERECTA Tablet 50MG/1Tablet, 4Tablet/Box", "branch": "T3", "expiry": "2026-11-18", "qty": 2.0, "cost": 20.23, "total": 40.46},{"code": "1-05-059-120", "name": "PEXAPAN 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-11-18", "qty": 1.0, "cost": 154.52, "total": 154.52},{"code": "1-05-059-120", "name": "PEXAPAN 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-11-18", "qty": 1.0, "cost": 133.92, "total": 133.92},{"code": "1-05-059-120", "name": "PEXAPAN 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-11-19", "qty": 10.0, "cost": 133.92, "total": 1339.18},{"code": "1-05-059-120", "name": "PEXAPAN 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-11-19", "qty": 5.0, "cost": 133.92, "total": 669.59},{"code": "1-04-120-004", "name": "PICO Oral drops 7.5MG/1Drop, 30ML/Container", "branch": "T1", "expiry": "2026-11-19", "qty": 4.0, "cost": 8.0, "total": 32.0},{"code": "1-07-059-007", "name": "PROHAIR 1 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-11-19", "qty": 3.0, "cost": 30.59, "total": 91.77},{"code": "1-04-120-004", "name": "PICO Oral drops 7.5MG/1Drop, 30ML/Container", "branch": "T2", "expiry": "2026-11-19", "qty": 3.0, "cost": 8.0, "total": 24.0},{"code": "1-04-120-004", "name": "PICO Oral drops 7.5MG/1Drop, 30ML/Container", "branch": "T2", "expiry": "2026-11-19", "qty": 2.0, "cost": 8.3, "total": 16.6},{"code": "1-05-059-120", "name": "PEXAPAN 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T3", "expiry": "2026-11-19", "qty": 1.0, "cost": 133.92, "total": 133.92},{"code": "1-05-059-120", "name": "PEXAPAN 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-11-20", "qty": 13.0, "cost": 133.92, "total": 1740.94},{"code": "1-05-059-120", "name": "PEXAPAN 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-11-20", "qty": 9.0, "cost": 133.92, "total": 1205.27},{"code": "1-06-187-074", "name": "ZOLIX 5 mg/tablet, 20 TABLET/BOX", "branch": "T1", "expiry": "2026-11-20", "qty": 4.0, "cost": 8.96, "total": 35.86},{"code": "1-05-059-120", "name": "PEXAPAN 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T3", "expiry": "2026-11-20", "qty": 3.0, "cost": 133.92, "total": 401.76},{"code": "1-06-187-074", "name": "ZOLIX 5 mg/tablet, 20 TABLET/BOX", "branch": "T2", "expiry": "2026-11-20", "qty": 2.0, "cost": 8.96, "total": 17.93},{"code": "1-05-187-485", "name": "SITAVIC 50/1000 mg/tablet, 56 TABLET/BOX", "branch": "T3", "expiry": "2026-11-20", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-05-187-022", "name": "ARENA Tablet 150MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-11-23", "qty": 1.0, "cost": 29.46, "total": 29.46},{"code": "1-08-059-029", "name": "SETAPRO 10 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-11-24", "qty": 90.0, "cost": 38.83, "total": 3494.7},{"code": "1-08-059-029", "name": "SETAPRO 10 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-11-24", "qty": 4.0, "cost": 38.83, "total": 155.32},{"code": "1-08-059-029", "name": "SETAPRO 10 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-11-24", "qty": 2.0, "cost": 38.83, "total": 77.66},{"code": "1-05-187-286", "name": "TOVAST Tablet 10MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-11-24", "qty": 1.0, "cost": 18.1, "total": 18.1},{"code": "1-03-164-008", "name": "VITALIFE Soft Gel Cap /1Capsule, 30Capsule/Box", "branch": "T2", "expiry": "2026-11-25", "qty": 4.0, "cost": 27.67, "total": 110.67},{"code": "1-08-059-008", "name": "ENTAPRO Film coated tablet 20MG/1Tablet, 30Tablet/Box", "branch": "T3", "expiry": "2026-11-25", "qty": 1.0, "cost": 76.62, "total": 76.62},{"code": "1-08-059-029", "name": "SETAPRO 10 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-11-25", "qty": 1.0, "cost": 38.83, "total": 38.83},{"code": "1-01-184-049", "name": "KLAVOX SUSPENTION 156MG/5ML, 100ML/Bottle", "branch": "T3", "expiry": "2026-11-26", "qty": 5.0, "cost": 8.23, "total": 41.13},{"code": "1-08-059-008", "name": "ENTAPRO Film coated tablet 20MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-11-26", "qty": 1.0, "cost": 76.62, "total": 76.62},{"code": "1-09-031-153", "name": "EMOLIA apply Cream, 200 GM/TUBE", "branch": "T1", "expiry": "2026-11-26", "qty": 1.0, "cost": 22.55, "total": 22.55},{"code": "1-09-031-153", "name": "EMOLIA apply Cream, 200 GM/TUBE", "branch": "T3", "expiry": "2026-11-26", "qty": 1.0, "cost": 22.55, "total": 22.55},{"code": "1-06-049-011", "name": "OPTILONE Eye drops 0.1MG/1Drop, 5ML/Container", "branch": "T1", "expiry": "2026-11-26", "qty": 1.0, "cost": 11.46, "total": 11.46},{"code": "1-04-179-009", "name": "LAXOCODYL 10 mg/suppository, 10 SUPPOSITORY/BOX", "branch": "T1", "expiry": "2026-11-26", "qty": 1.0, "cost": 5.8, "total": 5.8},{"code": "1-03-164-009", "name": "JP VITAMIN D3 Soft Gel Cap 1000IU/1Capsule, 60Capsule/Box", "branch": "T1", "expiry": "2026-11-27", "qty": 9.0, "cost": 27.5, "total": 247.5},{"code": "1-03-164-009", "name": "JP VITAMIN D3 Soft Gel Cap 1000IU/1Capsule, 60Capsule/Box", "branch": "T2", "expiry": "2026-11-27", "qty": 7.0, "cost": 27.5, "total": 192.5},{"code": "1-06-085-019", "name": "BUFOMIX 1 mg/inhaler Inhalation Spray, INHALER", "branch": "T2", "expiry": "2026-11-27", "qty": 3.0, "cost": 105.68, "total": 317.05},{"code": "1-06-085-019", "name": "BUFOMIX 1 mg/inhaler Inhalation Spray, INHALER", "branch": "T2", "expiry": "2026-11-27", "qty": 3.0, "cost": 82.08, "total": 246.23},{"code": "1-03-164-009", "name": "JP VITAMIN D3 Soft Gel Cap 1000IU/1Capsule, 60Capsule/Box", "branch": "T3", "expiry": "2026-11-27", "qty": 1.0, "cost": 27.5, "total": 27.5},{"code": "1-08-187-081", "name": "ZOLINDA Tablet 5MG/1Tablet, 30TABLET/BOX", "branch": "T2", "expiry": "2026-11-29", "qty": 1.0, "cost": 91.78, "total": 91.78},{"code": "1-08-187-081", "name": "ZOLINDA Tablet 5MG/1Tablet, 30TABLET/BOX", "branch": "T2", "expiry": "2026-11-29", "qty": 1.0, "cost": 91.78, "total": 91.78},{"code": "1-03-121-007", "name": "IRO-VIT drop, 30 ML/CONTAINER", "branch": "T1", "expiry": "2026-11-30", "qty": 34.0, "cost": 0.0, "total": 0.0},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T3", "expiry": "2026-11-30", "qty": 24.0, "cost": 21.8, "total": 523.31},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T2", "expiry": "2026-11-30", "qty": 20.0, "cost": 21.8, "total": 436.09},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T3", "expiry": "2026-11-30", "qty": 17.0, "cost": 21.8, "total": 370.68},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T1", "expiry": "2026-11-30", "qty": 16.0, "cost": 21.8, "total": 348.87},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 14.0, "cost": 20.8, "total": 291.14},{"code": "1-01-187-037", "name": "CLARIXIN Tablet 500MG/1Tablet, 14Tablet/Box", "branch": "T3", "expiry": "2026-11-30", "qty": 13.0, "cost": 17.76, "total": 230.9},{"code": "1-03-121-004", "name": "ZINCOVIT drop, 60 ML/CONTAINER", "branch": "T3", "expiry": "2026-11-30", "qty": 12.0, "cost": 0.0, "total": 0.0},{"code": "1-08-020-035", "name": "CITICOLINE Capsule, 30 CAPSULE/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 10.0, "cost": 38.0, "total": 380.0},{"code": "1-03-136-005", "name": "HIDRASEC 30 mg/sachet Powder, 16 SACHET/BOX for children", "branch": "T1", "expiry": "2026-11-30", "qty": 9.9, "cost": 26.03, "total": 258.74},{"code": "1-03-146-033", "name": "DOXIDA-F sachet, 30 SACHET/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 9.0, "cost": 216.0, "total": 1944.0},{"code": "1-03-186-038", "name": "MEGATOP SYRUP /1ML, 125ML/BOTTLE", "branch": "T2", "expiry": "2026-11-30", "qty": 9.0, "cost": 87.0, "total": 783.0},{"code": "1-05-059-130", "name": "JULEEN 100 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 9.0, "cost": 65.17, "total": 586.54},{"code": "1-03-020-226", "name": "OPTIMUM OMEGA-3 1000 mg/capsule, 30 CAPSULE/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 8.0, "cost": 68.5, "total": 548.0},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T1", "expiry": "2026-11-30", "qty": 8.0, "cost": 21.8, "total": 174.44},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 8.0, "cost": 20.8, "total": 166.37},{"code": "1-07-020-037", "name": "DUODART Capsule 0.5/0.4MG/1Capsule, 30Capsule/Box", "branch": "T3", "expiry": "2026-11-30", "qty": 7.0, "cost": 90.09, "total": 630.63},{"code": "1-09-049-047", "name": "ARTELAC COMPLET MDO 24 %/drop, 10 ML/CONTAINER", "branch": "T3", "expiry": "2026-11-30", "qty": 7.0, "cost": 40.33, "total": 282.32},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 7.0, "cost": 23.22, "total": 162.56},{"code": "1-01-118-005", "name": "RIACHOL Ointment 1%/1APPLY, 5GM/Tube", "branch": "T1", "expiry": "2026-11-30", "qty": 7.0, "cost": 7.25, "total": 50.73},{"code": "1-03-121-004", "name": "ZINCOVIT drop, 60 ML/CONTAINER", "branch": "T1", "expiry": "2026-11-30", "qty": 7.0, "cost": 0.0, "total": 0.0},{"code": "1-03-020-045", "name": "GENTAPLEX Capsule /1Capsule, 36Capsule/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 6.0, "cost": 142.92, "total": 857.52},{"code": "1-08-187-030", "name": "MELATONIN Tablet 3MG/1Tablet, 100Tablet/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 6.0, "cost": 109.06, "total": 654.35},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 6.0, "cost": 26.25, "total": 157.52},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 6.0, "cost": 20.66, "total": 123.94},{"code": "1-05-146-029", "name": "DECONE sachet, 20 SACHET/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 5.0, "cost": 75.0, "total": 375.0},{"code": "1-08-020-035", "name": "CITICOLINE Capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 5.0, "cost": 38.0, "total": 190.0},{"code": "1-03-136-005", "name": "HIDRASEC 30 mg/sachet Powder, 16 SACHET/BOX for children", "branch": "T2", "expiry": "2026-11-30", "qty": 5.0, "cost": 26.03, "total": 130.15},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T2", "expiry": "2026-11-30", "qty": 5.0, "cost": 21.8, "total": 109.02},{"code": "1-14-187-024", "name": "LOGYNON Tablet /1Tablet, 21Tablet/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 5.0, "cost": 10.08, "total": 50.42},{"code": "1-03-121-007", "name": "IRO-VIT drop, 30 ML/CONTAINER", "branch": "T3", "expiry": "2026-11-30", "qty": 5.0, "cost": 0.0, "total": 0.0},{"code": "1-03-020-205", "name": "ROYAL JELLY 1000 mg/capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 4.0, "cost": 106.83, "total": 427.32},{"code": "1-03-186-038", "name": "MEGATOP SYRUP /1ML, 125ML/BOTTLE", "branch": "T1", "expiry": "2026-11-30", "qty": 4.0, "cost": 87.0, "total": 348.0},{"code": "1-03-146-028", "name": "URI-PLUS capsule, 30 capsule/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 4.0, "cost": 80.5, "total": 322.0},{"code": "1-03-187-225", "name": "ARKOCAPS CALCOS 500 mg/tablet, 60 TABLET/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 4.0, "cost": 42.76, "total": 171.03},{"code": "1-09-049-047", "name": "ARTELAC COMPLET MDO 24 %/drop, 10 ML/CONTAINER", "branch": "T2", "expiry": "2026-11-30", "qty": 4.0, "cost": 40.33, "total": 161.33},{"code": "1-11-049-015", "name": "COSOPT Eye drops 2/0.5%/1Drop, 5ML/Container", "branch": "T3", "expiry": "2026-11-30", "qty": 4.0, "cost": 38.79, "total": 155.16},{"code": "1-01-059-005", "name": "CEFODOX Film coated tablet 200MG/1Tablet, 14Tablet/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 4.0, "cost": 28.73, "total": 114.93},{"code": "1-03-136-005", "name": "HIDRASEC 30 mg/sachet Powder, 16 SACHET/BOX for children", "branch": "T1", "expiry": "2026-11-30", "qty": 4.0, "cost": 26.03, "total": 104.12},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 4.0, "cost": 22.53, "total": 90.12},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 4.0, "cost": 20.66, "total": 82.63},{"code": "1-01-184-066", "name": "ROXIL SUSPENTION 250MG/5ML, 100ML/Bottle", "branch": "T1", "expiry": "2026-11-30", "qty": 4.0, "cost": 13.67, "total": 54.66},{"code": "1-01-184-066", "name": "ROXIL SUSPENTION 250MG/5ML, 100ML/Bottle", "branch": "T2", "expiry": "2026-11-30", "qty": 4.0, "cost": 13.67, "total": 54.66},{"code": "1-06-186-219", "name": "ZERTAZINE 5 mg/5 ml Syrup, 100 ML/BOTTLE", "branch": "T1", "expiry": "2026-11-30", "qty": 4.0, "cost": 5.09, "total": 20.38},{"code": "1-01-059-003", "name": "AZIMAC Film coated tablet 250MG/1Tablet, 6Tablet/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 4.0, "cost": 0.0, "total": 0.01},{"code": "1-03-020-045", "name": "GENTAPLEX Capsule /1Capsule, 36Capsule/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 3.0, "cost": 142.92, "total": 428.76},{"code": "1-08-187-030", "name": "MELATONIN Tablet 3MG/1Tablet, 100Tablet/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 3.0, "cost": 109.06, "total": 327.17},{"code": "1-05-146-029", "name": "DECONE sachet, 20 SACHET/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 3.0, "cost": 75.0, "total": 225.0},{"code": "1-09-194-019", "name": "AVALON AVOGAIN 5% SPRAY offer (2+1)  50 ML/APPLICATOR", "branch": "T2", "expiry": "2026-11-30", "qty": 3.0, "cost": 72.6, "total": 217.8},{"code": "1-04-186-019", "name": "DIGESTCARE ml Syrup, 125 ML/BOTTLE", "branch": "T1", "expiry": "2026-11-30", "qty": 3.0, "cost": 55.3, "total": 165.9},{"code": "1-08-020-035", "name": "CITICOLINE Capsule, 30 CAPSULE/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 3.0, "cost": 38.0, "total": 114.0},{"code": "1-11-049-015", "name": "COSOPT Eye drops 2/0.5%/1Drop, 5ML/Container", "branch": "T1", "expiry": "2026-11-30", "qty": 3.0, "cost": 35.26, "total": 105.79},{"code": "1-06-085-024", "name": "COMBIWAVE 25/125 mg/inhaler Inhalation Spray, 120 INHALER/CONTAINER", "branch": "T1", "expiry": "2026-11-30", "qty": 3.0, "cost": 31.52, "total": 94.56},{"code": "1-06-085-024", "name": "COMBIWAVE 25/125 mg/inhaler Inhalation Spray, 120 INHALER/CONTAINER", "branch": "T2", "expiry": "2026-11-30", "qty": 3.0, "cost": 31.52, "total": 94.56},{"code": "1-03-136-005", "name": "HIDRASEC 30 mg/sachet Powder, 16 SACHET/BOX for children", "branch": "T1", "expiry": "2026-11-30", "qty": 3.0, "cost": 26.03, "total": 78.09},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T1", "expiry": "2026-11-30", "qty": 3.0, "cost": 21.8, "total": 65.41},{"code": "1-01-059-003", "name": "AZIMAC Film coated tablet 250MG/1Tablet, 6Tablet/Box", "branch": "T3", "expiry": "2026-11-30", "qty": 3.0, "cost": 0.0, "total": 0.01},{"code": "1-05-059-104", "name": "RYBELSUS 7 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 2.0, "cost": 415.19, "total": 830.37},{"code": "1-05-001-004", "name": "OZEMPIC 0.25 mg/ml Ampoule, 4 AMPOULE/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 2.0, "cost": 355.85, "total": 711.71},{"code": "1-05-182-001", "name": "NOVOMIX 30 FLEXPEN Susp. for inj. pre-filled pen 30IU/1ML, 15ML/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 2.0, "cost": 164.35, "total": 328.71},{"code": "1-08-020-034", "name": "OUTRIGHT Capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 2.0, "cost": 133.0, "total": 266.0},{"code": "1-08-020-034", "name": "OUTRIGHT Capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 2.0, "cost": 133.0, "total": 266.0},{"code": "1-08-187-030", "name": "MELATONIN Tablet 3MG/1Tablet, 100Tablet/Box", "branch": "T3", "expiry": "2026-11-30", "qty": 2.0, "cost": 118.96, "total": 237.92},{"code": "1-08-187-030", "name": "MELATONIN Tablet 3MG/1Tablet, 100Tablet/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 2.0, "cost": 118.96, "total": 237.92},{"code": "1-04-065-023", "name": "CONESTAL 2 mg/tablet, 28 TABLET/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 2.0, "cost": 97.54, "total": 195.07},{"code": "1-03-187-155", "name": "OMEGA 3 FORT Capsule, 60 CAPSULE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 2.0, "cost": 79.0, "total": 158.0},{"code": "1-08-020-002", "name": "PASSIFLORE ARKO Capsule 1MG/1Capsule, 45Capsule/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 2.0, "cost": 47.52, "total": 95.03},{"code": "1-08-020-002", "name": "PASSIFLORE ARKO Capsule 1MG/1Capsule, 45Capsule/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 2.0, "cost": 47.52, "total": 95.03},{"code": "1-04-136-007", "name": "FORTIFERRUM sachet Powder, 14 SACHET/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 2.0, "cost": 41.67, "total": 83.34},{"code": "1-09-049-047", "name": "ARTELAC COMPLET MDO 24 %/drop, 10 ML/CONTAINER", "branch": "T1", "expiry": "2026-11-30", "qty": 2.0, "cost": 40.33, "total": 80.66},{"code": "1-04-136-007", "name": "FORTIFERRUM sachet Powder, 14 SACHET/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 2.0, "cost": 39.83, "total": 79.66},{"code": "1-06-085-024", "name": "COMBIWAVE 25/125 mg/inhaler Inhalation Spray, 120 INHALER/CONTAINER", "branch": "T2", "expiry": "2026-11-30", "qty": 2.0, "cost": 31.52, "total": 63.04},{"code": "1-01-184-066", "name": "ROXIL SUSPENTION 250MG/5ML, 100ML/Bottle", "branch": "T1", "expiry": "2026-11-30", "qty": 2.0, "cost": 13.67, "total": 27.33},{"code": "1-03-146-033", "name": "DOXIDA-F sachet, 30 SACHET/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 2.0, "cost": 0.02, "total": 0.04},{"code": "1-03-121-007", "name": "IRO-VIT drop, 30 ML/CONTAINER", "branch": "T2", "expiry": "2026-11-30", "qty": 2.0, "cost": 0.0, "total": 0.0},{"code": "1-05-059-104", "name": "RYBELSUS 7 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 415.19, "total": 415.19},{"code": "1-05-059-105", "name": "RYBELSUS 3 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 415.19, "total": 415.19},{"code": "1-05-059-105", "name": "RYBELSUS 3 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 1.0, "cost": 415.19, "total": 415.19},{"code": "1-05-059-105", "name": "RYBELSUS 3 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 415.19, "total": 415.19},{"code": "1-05-168-008", "name": "TRESIBA FLEX TOUCH Solution for injection 100IU/1ML, 15ML/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 327.23, "total": 327.23},{"code": "1-03-146-033", "name": "DOXIDA-F sachet, 30 SACHET/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 216.0, "total": 216.0},{"code": "1-02-187-138", "name": "ARAVA TABLET 20MG/1Tablet, 30Tablet/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 1.0, "cost": 139.65, "total": 139.65},{"code": "1-02-187-138", "name": "ARAVA TABLET 20MG/1Tablet, 30Tablet/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 139.65, "total": 139.65},{"code": "1-08-187-030", "name": "MELATONIN Tablet 3MG/1Tablet, 100Tablet/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 118.96, "total": 118.96},{"code": "1-04-128-003", "name": "ENTEROGERMINA ORAL VIAL 2billionMG/1Ampoule, 20Ampoule/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 113.02, "total": 113.02},{"code": "1-08-187-030", "name": "MELATONIN Tablet 3MG/1Tablet, 100Tablet/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 109.06, "total": 109.06},{"code": "1-08-187-030", "name": "MELATONIN Tablet 3MG/1Tablet, 100Tablet/Box", "branch": "T3", "expiry": "2026-11-30", "qty": 1.0, "cost": 109.06, "total": 109.06},{"code": "1-03-020-205", "name": "ROYAL JELLY 1000 mg/capsule, 30 CAPSULE/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 106.83, "total": 106.83},{"code": "1-03-020-205", "name": "ROYAL JELLY 1000 mg/capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 106.83, "total": 106.83},{"code": "1-07-020-002", "name": "AVODART Capsule 0.5MG/1Capsule, 30Capsule/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 97.31, "total": 97.31},{"code": "1-07-020-037", "name": "DUODART Capsule 0.5/0.4MG/1Capsule, 30Capsule/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 90.09, "total": 90.09},{"code": "1-03-044-008", "name": "WELLMOV tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 83.3, "total": 83.3},{"code": "1-03-121-004", "name": "ZINCOVIT drop, 60 ML/CONTAINER", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 78.0, "total": 78.0},{"code": "1-05-187-230", "name": "OLMETEC PLUS Tablet 40/25MG/1Tablet, 28Tablet/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 75.91, "total": 75.91},{"code": "1-05-146-029", "name": "DECONE sachet, 20 SACHET/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 1.0, "cost": 75.0, "total": 75.0},{"code": "1-09-194-019", "name": "AVALON AVOGAIN 5% SPRAY offer (2+1)  50 ML/APPLICATOR", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 72.6, "total": 72.6},{"code": "1-09-194-019", "name": "AVALON AVOGAIN 5% SPRAY offer (2+1)  50 ML/APPLICATOR", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 72.6, "total": 72.6},{"code": "1-03-146-033", "name": "DOXIDA-F sachet, 30 SACHET/BOX", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 71.9, "total": 71.9},{"code": "1-08-187-053", "name": "SEROXAT CR Tablet 25MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 71.57, "total": 71.57},{"code": "1-04-187-062", "name": "SALOFALK Tablet 500MG/1Tablet, 50Tablet/Box", "branch": "T3", "expiry": "2026-11-30", "qty": 1.0, "cost": 56.56, "total": 56.56},{"code": "1-06-084-007", "name": "ROLENIUM INHALATION SOLUTION 50/250MCG/1Container, 1Container/Container", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 49.55, "total": 49.55},{"code": "1-06-085-024", "name": "COMBIWAVE 25/125 mg/inhaler Inhalation Spray, 120 INHALER/CONTAINER", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 31.52, "total": 31.52},{"code": "1-05-187-073", "name": "CONCOR Tablet 10MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 26.55, "total": 26.55},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 21.8, "total": 21.8},{"code": "1-01-184-095", "name": "ZETRON 200MG/5ML SUSPENTION 22.5ML/BOTTLE", "branch": "T3", "expiry": "2026-11-30", "qty": 1.0, "cost": 21.8, "total": 21.8},{"code": "1-14-086-036", "name": "INHIXA 40 mg/syringe Injection, 1 SYRINGE/BOX", "branch": "T3", "expiry": "2026-11-30", "qty": 1.0, "cost": 20.8, "total": 20.8},{"code": "1-05-059-018", "name": "CONCOR PLUS Film coated tablet 5MG/1Tablet, 20Tablet/Box", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 14.62, "total": 14.62},{"code": "1-01-184-066", "name": "ROXIL SUSPENTION 250MG/5ML, 100ML/Bottle", "branch": "T3", "expiry": "2026-11-30", "qty": 1.0, "cost": 13.67, "total": 13.67},{"code": "1-06-113-046", "name": "FLUSORT 0.05 % Nasal Spray, APPLICATOR", "branch": "T3", "expiry": "2026-11-30", "qty": 1.0, "cost": 10.5, "total": 10.5},{"code": "1-14-187-024", "name": "LOGYNON Tablet /1Tablet, 21Tablet/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 1.0, "cost": 10.08, "total": 10.08},{"code": "1-03-121-004", "name": "ZINCOVIT drop, 60 ML/CONTAINER", "branch": "T2", "expiry": "2026-11-30", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-05-182-001", "name": "NOVOMIX 30 FLEXPEN Susp. for inj. pre-filled pen 30IU/1ML, 15ML/Box", "branch": "T1", "expiry": "2026-11-30", "qty": 0.6, "cost": 164.35, "total": 98.61},{"code": "1-01-187-023", "name": "CIPRODAR Tablet 500MG/1Tablet, 10", "branch": "WH", "expiry": "2026-12-01", "qty": 26.0, "cost": 0, "total": 418.0},{"code": "1-01-187-039", "name": "CLAVODAR Tablet 625MG/1Tablet, 2", "branch": "WH", "expiry": "2026-12-01", "qty": 25.0, "cost": 0, "total": 254.0},{"code": "1-05-187-312", "name": "FORMIT XR Tablet 750MG/1Tablet, 3", "branch": "WH", "expiry": "2026-12-01", "qty": 676.0, "cost": 0, "total": 7098.0},{"code": "1-01-049-007", "name": "OPTICIN Eye drops 0.3MG/1Drop, 5M CONTAINER", "branch": "WH", "expiry": "2026-12-03", "qty": 22.0, "cost": 0, "total": 268.0},{"code": "1-03-187-204", "name": "OSTERRA 1500/800 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-12-07", "qty": 1.0, "cost": 17.0, "total": 17.0},{"code": "1-04-179-009", "name": "LAXOCODYL 10 mg/suppository, 10 SUPPOSITORY/BOX", "branch": "T1", "expiry": "2026-12-08", "qty": 3.0, "cost": 5.8, "total": 17.39},{"code": "1-08-187-080", "name": "OLENZA TABLET 15MG/1Tablet, 30Tablet/BOX", "branch": "T1", "expiry": "2026-12-09", "qty": 1.0, "cost": 223.93, "total": 223.93},{"code": "1-08-187-080", "name": "OLENZA TABLET 15MG/1Tablet, 30Tablet/BOX", "branch": "T2", "expiry": "2026-12-09", "qty": 1.0, "cost": 223.93, "total": 223.93},{"code": "1-04-065-022", "name": "LAXATROL 50/8.6 mg/tablet, 100 TABLET/BOX", "branch": "T3", "expiry": "2026-12-11", "qty": 5.0, "cost": 25.54, "total": 127.69},{"code": "1-05-187-272", "name": "SORTIVA-H Tablet 100/12.5MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-12-12", "qty": 1.0, "cost": 25.3, "total": 25.3},{"code": "1-05-187-272", "name": "SORTIVA-H Tablet 100/12.5MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-12-12", "qty": 1.0, "cost": 25.3, "total": 25.3},{"code": "1-05-187-492", "name": "BANORIV 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T1", "expiry": "2026-12-16", "qty": 4.0, "cost": 132.32, "total": 529.27},{"code": "1-05-187-492", "name": "BANORIV 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T3", "expiry": "2026-12-16", "qty": 2.0, "cost": 132.32, "total": 264.64},{"code": "1-05-187-492", "name": "BANORIV 2.5 mg/tablet, 60 TABLET/BOX", "branch": "T2", "expiry": "2026-12-16", "qty": 1.0, "cost": 132.32, "total": 132.32},{"code": "1-01-186-010", "name": "LOVRAK 200MG/5ML/100ML SYRUP 200MG/5ML, 100ML/BOTTLE", "branch": "T1", "expiry": "2026-12-17", "qty": 1.0, "cost": 56.31, "total": 56.31},{"code": "1-03-186-040", "name": "SANOVIT IRON ml Syrup, 320 ML/BO", "branch": "WH", "expiry": "2026-12-19", "qty": 9.0, "cost": 0, "total": 144.0},{"code": "1-06-085-002", "name": "CLENIL FORTE INHALATION SPRA", "branch": "WH", "expiry": "2026-12-19", "qty": 2.0, "cost": 0, "total": 129.0},{"code": "1-08-187-100", "name": "ZOLAN 5 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-12-21", "qty": 3.0, "cost": 115.26, "total": 345.78},{"code": "1-09-031-136", "name": "TRIOLITE CREAM apply Cream, 30 GM/TUBE", "branch": "T3", "expiry": "2026-12-21", "qty": 1.0, "cost": 52.58, "total": 52.58},{"code": "1-03-187-228", "name": "NERVAN 500 mg/tablet, 30 TABLET/BOX", "branch": "T1", "expiry": "2026-12-22", "qty": 1.0, "cost": 33.79, "total": 33.79},{"code": "1-03-187-228", "name": "NERVAN 500 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-12-22", "qty": 1.0, "cost": 33.79, "total": 33.79},{"code": "1-02-186-017", "name": "PANADREX 120 mg/5 ml Syrup, 60 ML/BOTTLE", "branch": "T2", "expiry": "2026-12-24", "qty": 9.0, "cost": 2.24, "total": 20.19},{"code": "1-05-059-119", "name": "RAVIXA 75 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-12-24", "qty": 2.0, "cost": 76.71, "total": 153.41},{"code": "1-05-059-119", "name": "RAVIXA 75 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-12-24", "qty": 2.0, "cost": 76.71, "total": 153.41},{"code": "1-05-059-119", "name": "RAVIXA 75 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-12-24", "qty": 1.0, "cost": 85.87, "total": 85.87},{"code": "1-01-187-022", "name": "CIPROCIN Tablet 500MG/1Tablet, 10Tablet/Box", "branch": "T2", "expiry": "2026-12-24", "qty": 1.0, "cost": 14.27, "total": 14.27},{"code": "1-03-164-020", "name": "JP VITAMIN D3 1000 iu/capsule Soft Gel Cap, 90 CAPSULE/BOX", "branch": "T1", "expiry": "2026-12-25", "qty": 1.0, "cost": 41.25, "total": 41.25},{"code": "1-03-164-020", "name": "JP VITAMIN D3 1000 iu/capsule Soft Gel Cap, 90 CAPSULE/BOX", "branch": "T2", "expiry": "2026-12-25", "qty": 1.0, "cost": 41.25, "total": 41.25},{"code": "1-05-059-119", "name": "RAVIXA 75 mg/tablet, 30 TABLET/BOX", "branch": "T2", "expiry": "2026-12-30", "qty": 1.0, "cost": 17.49, "total": 17.49},{"code": "1-11-049-054", "name": "UNI FRESH UD 5 %/drop, 30 SINGLE DOSE/BOX", "branch": "T3", "expiry": "2026-12-30", "qty": 1.0, "cost": 14.33, "total": 14.33},{"code": "2-09-031-484", "name": "IVAPUR A.I. AKNE-SYT tube Cream,", "branch": "WH", "expiry": "2026-12-30", "qty": 2.0, "cost": 0, "total": 99.0},{"code": "1-01-184-084", "name": "SEFARIX 125 mg/5 ml Suspention, 50 ML/BOTTLE", "branch": "T1", "expiry": "2026-12-31", "qty": 50.0, "cost": 17.44, "total": 871.95},{"code": "1-03-187-169", "name": "RAFOL 5 mg/tablet, 50 TABLET/BOX", "branch": "T3", "expiry": "2026-12-31", "qty": 33.0, "cost": 8.52, "total": 281.0},{"code": "1-01-059-039", "name": "NEVOTIC 500 mg/tablet, 7 TABLET/BOX", "branch": "T2", "expiry": "2026-12-31", "qty": 29.0, "cost": 18.03, "total": 522.92},{"code": "1-03-121-006", "name": "LACTEEZ PLUS drop, 30 ML/CONTAINER", "branch": "T1", "expiry": "2026-12-31", "qty": 29.0, "cost": 0.0, "total": 0.0},{"code": "1-06-113-050", "name": "OTRI ALLERGY 0.05 mg/applicator Nasal Spray", "branch": "T1", "expiry": "2026-12-31", "qty": 24.0, "cost": 21.67, "total": 519.98},{"code": "1-03-186-064", "name": "VIDA-IRON  Spray, 60 ML/BOTTLE", "branch": "T1", "expiry": "2026-12-31", "qty": 17.0, "cost": 31.29, "total": 531.9},{"code": "1-09-020-010", "name": "ORATANE 10 mg/capsule, 30 CAPSULE/BOX", "branch": "T1", "expiry": "2026-12-31", "qty": 17.0, "cost": 28.18, "total": 478.98},{"code": "1-06-113-050", "name": "OTRI ALLERGY 0.05 mg/applicator Nasal Spray", "branch": "T2", "expiry": "2026-12-31", "qty": 14.0, "cost": 21.67, "total": 303.32},{"code": "1-06-085-011", "name": "SERETIDE EVOHALER125MG INHALATION SPRAY /1Inhaler, 120Inhaler/Container", "branch": "T1", "expiry": "2026-12-31", "qty": 12.0, "cost": 98.09, "total": 1178.07},{"code": "1-09-118-003", "name": "AVALON AVOMEB EXTRA 75 GM Ointment", "branch": "T2", "expiry": "2026-12-31", "qty": 10.0, "cost": 45.1, "total": 451.0},{"code": "1-03-121-006", "name": "LACTEEZ PLUS drop, 30 ML/CONTAINER", "branch": "T3", "expiry": "2026-12-31", "qty": 10.0, "cost": 0.0, "total": 0.0},{"code": "1-02-187-196", "name": "THIOTACID 600 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-12-31", "qty": 9.0, "cost": 66.0, "total": 594.0},{"code": "1-03-186-064", "name": "VIDA-IRON  Spray, 60 ML/BOTTLE", "branch": "T1", "expiry": "2026-12-31", "qty": 9.0, "cost": 43.02, "total": 387.19},{"code": "1-02-187-138", "name": "ARAVA TABLET 20MG/1Tablet, 30Tablet/BOX", "branch": "T1", "expiry": "2026-12-31", "qty": 7.0, "cost": 139.65, "total": 977.55},{"code": "1-01-059-039", "name": "NEVOTIC 500 mg/tablet, 7 TABLET/BOX", "branch": "T3", "expiry": "2026-12-31", "qty": 7.0, "cost": 0.0, "total": 0.0},{"code": "1-01-059-039", "name": "NEVOTIC 500 mg/tablet, 7 TABLET/BOX", "branch": "T2", "expiry": "2026-12-31", "qty": 7.0, "cost": 0.0, "total": 0.0},{"code": "1-05-146-035", "name": "ACTI-COLLA sachet, 30 SACHET/BOX", "branch": "T2", "expiry": "2026-12-31", "qty": 6.0, "cost": 132.55, "total": 795.3},{"code": "1-06-083-004", "name": "FLIXOTIDE Inhalation powder 125MCG/1Container, 1Container/Container", "branch": "T1", "expiry": "2026-12-31", "qty": 6.0, "cost": 74.31, "total": 445.84},{"code": "1-01-059-003", "name": "AZIMAC Film coated tablet 250MG/1Tablet, 6Tablet/Box", "branch": "T1", "expiry": "2026-12-31", "qty": 6.0, "cost": 10.73, "total": 64.41},{"code": "1-06-186-069", "name": "RHINATHIOL ENF Syrup 2%/1ML, 125ML/Bottle", "branch": "T2", "expiry": "2026-12-31", "qty": 6.0, "cost": 6.96, "total": 41.76},{"code": "1-06-187-081", "name": "FEXODINE 120 mg/tablet, 14 TABLET/BOX", "branch": "T3", "expiry": "2026-12-31", "qty": 6.0, "cost": 0.0, "total": 0.0},{"code": "1-06-085-011", "name": "SERETIDE EVOHALER125MG INHALATION SPRAY /1Inhaler, 120Inhaler/Container", "branch": "T2", "expiry": "2026-12-31", "qty": 4.0, "cost": 98.09, "total": 392.36},{"code": "1-08-065-001", "name": "MIRZAGEN Gastro-resistant coated tablet 30MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-12-31", "qty": 4.0, "cost": 88.07, "total": 352.29},{"code": "1-08-065-001", "name": "MIRZAGEN Gastro-resistant coated tablet 30MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-12-31", "qty": 4.0, "cost": 54.54, "total": 218.17},{"code": "1-02-146-002", "name": "BONOLIGHT (CARTIBON) SACHETS /1SACHET, 30SACHET/BOX", "branch": "T1", "expiry": "2026-12-31", "qty": 4.0, "cost": 0.0, "total": 0.0},{"code": "1-06-085-011", "name": "SERETIDE EVOHALER125MG INHALATION SPRAY /1Inhaler, 120Inhaler/Container", "branch": "T3", "expiry": "2026-12-31", "qty": 3.0, "cost": 98.09, "total": 294.27},{"code": "1-08-065-001", "name": "MIRZAGEN Gastro-resistant coated tablet 30MG/1Tablet, 30Tablet/Box", "branch": "T3", "expiry": "2026-12-31", "qty": 3.0, "cost": 88.07, "total": 264.22},{"code": "1-01-187-142", "name": "ZOVIRAX 200 mg/tablet, 25 TABLET/BOX", "branch": "T1", "expiry": "2026-12-31", "qty": 3.0, "cost": 64.7, "total": 194.09},{"code": "1-09-118-003", "name": "AVALON AVOMEB EXTRA 75 GM Ointment", "branch": "T2", "expiry": "2026-12-31", "qty": 3.0, "cost": 45.1, "total": 135.3},{"code": "1-09-118-068", "name": "AVALON AVOMEB EXTERA Ointment , 50 GM/TUBE", "branch": "T3", "expiry": "2026-12-31", "qty": 3.0, "cost": 34.85, "total": 104.55},{"code": "1-01-059-039", "name": "NEVOTIC 500 mg/tablet, 7 TABLET/BOX", "branch": "T1", "expiry": "2026-12-31", "qty": 3.0, "cost": 18.03, "total": 54.1},{"code": "1-01-059-039", "name": "NEVOTIC 500 mg/tablet, 7 TABLET/BOX", "branch": "T1", "expiry": "2026-12-31", "qty": 3.0, "cost": 0.0, "total": 0.0},{"code": "1-02-187-138", "name": "ARAVA TABLET 20MG/1Tablet, 30Tablet/BOX", "branch": "T2", "expiry": "2026-12-31", "qty": 2.0, "cost": 139.65, "total": 279.3},{"code": "1-03-187-180", "name": "EVERT Capsule, 30 CAPSULE/BOX", "branch": "T3", "expiry": "2026-12-31", "qty": 2.0, "cost": 104.3, "total": 208.6},{"code": "1-02-020-065", "name": "CONCERTA 18 mg/tablet Extended Release Tab, 30 TABLET/BOTTEL", "branch": "T1", "expiry": "2026-12-31", "qty": 2.0, "cost": 97.09, "total": 194.18},{"code": "1-04-187-116", "name": "NEXIUM 10 mg/sachet Granules for oral susp, 28 SACHET/BOX", "branch": "T1", "expiry": "2026-12-31", "qty": 2.0, "cost": 94.87, "total": 189.75},{"code": "1-06-083-004", "name": "FLIXOTIDE Inhalation powder 125MCG/1Container, 1Container/Container", "branch": "T3", "expiry": "2026-12-31", "qty": 2.0, "cost": 74.31, "total": 148.61},{"code": "2-09-149-065", "name": "VAGINECALM GEL CALM tube Gel, 50 ML/TUBE", "branch": "T2", "expiry": "2026-12-31", "qty": 2.0, "cost": 60.87, "total": 121.74},{"code": "2-09-149-065", "name": "VAGINECALM GEL CALM tube Gel, 50 ML/TUBE", "branch": "T1", "expiry": "2026-12-31", "qty": 2.0, "cost": 58.59, "total": 117.19},{"code": "1-09-118-068", "name": "AVALON AVOMEB EXTERA Ointment , 50 GM/TUBE", "branch": "T1", "expiry": "2026-12-31", "qty": 2.0, "cost": 34.85, "total": 69.7},{"code": "1-09-118-068", "name": "AVALON AVOMEB EXTERA Ointment , 50 GM/TUBE", "branch": "T1", "expiry": "2026-12-31", "qty": 2.0, "cost": 34.85, "total": 69.7},{"code": "1-01-184-073", "name": "ZETRON SUSPENTION 200MG/1ML, 15ML/Bottle", "branch": "T2", "expiry": "2026-12-31", "qty": 2.0, "cost": 15.94, "total": 31.89},{"code": "1-02-187-128", "name": "TILAX Tablet 2MG/1Tablet, 30Tablet/Box", "branch": "T3", "expiry": "2026-12-31", "qty": 2.0, "cost": 9.89, "total": 19.78},{"code": "1-06-187-031", "name": "LOHIST Tablet 10MG/1Tablet, 10Tablet/Box", "branch": "T3", "expiry": "2026-12-31", "qty": 2.0, "cost": 4.33, "total": 8.67},{"code": "1-03-121-006", "name": "LACTEEZ PLUS drop, 30 ML/CONTAINER", "branch": "T2", "expiry": "2026-12-31", "qty": 2.0, "cost": 0.0, "total": 0.0},{"code": "1-09-031-044", "name": "ELIDEL Cream 1%/1APPLY, 30GM/Tube", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 102.83, "total": 102.83},{"code": "1-05-187-330", "name": "XIGDUO XR 5/1000 mg/tablet, 56 TABLET/BOX", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 97.4, "total": 97.4},{"code": "1-02-086-028", "name": "METHOTREXATE SPC 2.5 mg/tablet, 100 TABLET/BOX", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 93.48, "total": 93.48},{"code": "1-06-083-004", "name": "FLIXOTIDE Inhalation powder 125MCG/1Container, 1Container/Container", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 74.31, "total": 74.31},{"code": "2-09-149-064", "name": "VAGINECALM ANTIAGING tube Gel, 50 ML/TUBE", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 73.3, "total": 73.3},{"code": "2-09-149-064", "name": "VAGINECALM ANTIAGING tube Gel, 50 ML/TUBE", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 73.29, "total": 73.29},{"code": "1-06-049-003", "name": "ECTOLLERG Eye drops 0.4MG/1Drop, 3ML/Container", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 69.81, "total": 69.81},{"code": "1-06-049-003", "name": "ECTOLLERG Eye drops 0.4MG/1Drop, 3ML/Container", "branch": "T3", "expiry": "2026-12-31", "qty": 1.0, "cost": 69.81, "total": 69.81},{"code": "1-06-049-003", "name": "ECTOLLERG Eye drops 0.4MG/1Drop, 3ML/Container", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 69.81, "total": 69.81},{"code": "1-08-047-001", "name": "PRISTIQ Extended release tab 50MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 68.27, "total": 68.27},{"code": "1-02-187-196", "name": "THIOTACID 600 mg/tablet, 30 TABLET/BOX", "branch": "T3", "expiry": "2026-12-31", "qty": 1.0, "cost": 66.0, "total": 66.0},{"code": "1-01-187-142", "name": "ZOVIRAX 200 mg/tablet, 25 TABLET/BOX", "branch": "T3", "expiry": "2026-12-31", "qty": 1.0, "cost": 64.7, "total": 64.7},{"code": "1-05-187-481", "name": "MELIGAMET 50 mg / 1000 mg/tablet, 60 TABLET/BOX", "branch": "T3", "expiry": "2026-12-31", "qty": 1.0, "cost": 53.7, "total": 53.7},{"code": "1-05-168-004", "name": "HUMULIN 70/30 Solution for injection 70/30MG/1ML, 1Vial/Vial", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 44.63, "total": 44.63},{"code": "1-03-186-064", "name": "VIDA-IRON  Spray, 60 ML/BOTTLE", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 43.02, "total": 43.02},{"code": "1-09-118-068", "name": "AVALON AVOMEB EXTERA Ointment , 50 GM/TUBE", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 34.85, "total": 34.85},{"code": "1-02-066-011", "name": "HEMICLAR Gel /1APPLY, 120ML/Tube", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 32.0, "total": 32.0},{"code": "1-03-186-064", "name": "VIDA-IRON  Spray, 60 ML/BOTTLE", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 31.29, "total": 31.29},{"code": "1-04-187-003", "name": "A-LAX Tablet 20MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 28.8, "total": 28.8},{"code": "1-05-187-326", "name": "LAVISTINA 24 mg/tablet, 50 TABLET/BOX", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 26.81, "total": 26.81},{"code": "1-06-113-050", "name": "OTRI ALLERGY 0.05 mg/applicator Nasal Spray", "branch": "T3", "expiry": "2026-12-31", "qty": 1.0, "cost": 21.67, "total": 21.67},{"code": "1-05-059-047", "name": "LORVAST Film coated tablet 20MG/1Tablet, 30Tablet/Box", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 19.06, "total": 19.06},{"code": "1-04-187-067", "name": "SPASMOLYTE Tablet 20MG/1Tablet, 30Tablet/Box", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 18.37, "total": 18.37},{"code": "1-06-049-023", "name": "TOBRADEX Eye drops /1Drop, 5ML/Container", "branch": "T2", "expiry": "2026-12-31", "qty": 1.0, "cost": 17.5, "total": 17.5},{"code": "1-01-059-003", "name": "AZIMAC Film coated tablet 250MG/1Tablet, 6Tablet/Box", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 10.73, "total": 10.73},{"code": "1-09-118-068", "name": "AVALON AVOMEB EXTERA Ointment , 50 GM/TUBE", "branch": "T1", "expiry": "2026-12-31", "qty": 1.0, "cost": 0.0, "total": 0.0},{"code": "1-01-049-003", "name": "CIPROCIN Eye drops 0.3MG/1Drop, 5 CONTAINER", "branch": "WH", "expiry": "2026-12-31", "qty": 87.0, "cost": 0, "total": 795.0},{"code": "1-03-186-041", "name": "SANOVIT ml Syrup, 320 ML/BOTTL", "branch": "WH", "expiry": "2026-12-31", "qty": 19.0, "cost": 0, "total": 303.0},{"code": "1-05-028-001", "name": "JARDIANCE Coated tablet 10MG/1Ta", "branch": "WH", "expiry": "2026-12-31", "qty": 30.0, "cost": 0, "total": 3951.0},{"code": "1-05-187-163", "name": "GLUCOPHAGE Tablet 1000MG/1Tabl", "branch": "WH", "expiry": "2026-12-31", "qty": 1.0, "cost": 0, "total": 16.0},{"code": "1-07-187-013", "name": "URILAX Tablet 10MG/1Tablet, 30Tab", "branch": "WH", "expiry": "2026-12-31", "qty": 4.0, "cost": 0, "total": 371.0},{"code": "1-14-166-010", "name": "C-LACT Solution /1ML, 220ML/Cont CONTAINER", "branch": "WH", "expiry": "2026-12-31", "qty": 1.0, "cost": 0, "total": 36.0},{"code": "2-09-031-247", "name": "LOUIS WIDMER CARBAMID UREA", "branch": "WH", "expiry": "2026-12-31", "qty": 1.0, "cost": 0, "total": 63.0},{"code": "2-09-031-498", "name": "IVATHERM IVAWHITE WHITENIN", "branch": "WH", "expiry": "2026-12-31", "qty": 4.0, "cost": 0, "total": 396.0},{"code": "2-09-066-098", "name": "CEBELIA L.C.E REGARD container C CONTAINER", "branch": "WH", "expiry": "2026-12-31", "qty": 2.0, "cost": 0, "total": 149.0},{"code": "2-09-204-020", "name": "QV BABY 2 IN 1 SHAMPOO & COND CONTAINER", "branch": "WH", "expiry": "2026-12-31", "qty": 1.0, "cost": 0, "total": 50.0},{"code": "2-14-094-042", "name": "URIAGE DS HAIR REGULATING AN CONTAINER", "branch": "WH", "expiry": "2026-12-31", "qty": 3.0, "cost": 0, "total": 0.0},{"code": "2-14-094-090", "name": "CERAVE HYDRATING CLEANSER ( CONTAINER", "branch": "WH", "expiry": "2026-12-31", "qty": 2.0, "cost": 0, "total": 96.0}];

const NEAR_EXPIRY_SOURCE={label:'تقرير مخزون مضمّن',asOf:null};
function nearExpiryDrugMatches(inventoryName,rxName){
  const inventory=PharmaCore.normalizeProductText(inventoryName),rx=PharmaCore.normalizeProductText(rxName);
  if(!inventory||!rx)return false;
  const brand=inventory.split(' ')[0];
  if(brand.length<3||!rx.split(' ').includes(brand))return false;
  if(PharmaCore.matchesCatalogProduct(rxName,{name:inventoryName,short:brand}))return true;
  const dose=value=>[...PharmaCore.normalizeEntityKey(value).matchAll(/(\d+(?:\.\d+)?)\s*(MG|MCG|G|IU|%)/g)].map(match=>String(Number(match[1]))+match[2]);
  const inventoryDose=dose(inventoryName),rxDose=dose(rxName);
  if(inventoryDose.length&&rxDose.length&&inventoryDose[0]!==rxDose[0])return false;
  const forms=['TABLET','CAPSULE','SYRUP','CREAM','GEL','SPRAY','SUSPENSION','SUSPENTION','OINTMENT','DROPS','PATCH'];
  const inventoryForm=forms.find(form=>inventory.includes(form)),rxForm=forms.find(form=>rx.includes(form));
  return !inventoryForm||!rxForm||inventoryForm===rxForm||(inventoryForm.startsWith('SUSP')&&rxForm.startsWith('SUSP'));
}
function renderNearExpiry(){
  const c = document.getElementById('nearexpiry-content');
  if(!c) return;
  const today = new Date();today.setHours(0,0,0,0);
  const data = NEAR_EXPIRY_DATA;
  
  // Classify urgency
  function getUrgency(dateStr){
    const d = dtParseLocal(dateStr);
    const diff = Math.ceil((d - today) / (1000*60*60*24));
    if(diff < 0) return {level:'expired', label:'منتهي ❌', color:'#ef4444', bg:'rgba(239,68,68,.12)', days:diff};
    if(diff <= 30) return {level:'critical', label:'حرج (أقل من شهر)', color:'#dc2626', bg:'rgba(220,38,38,.12)', days:diff};
    if(diff <= 90) return {level:'warning', label:'تحذير (1-3 أشهر)', color:'#d97706', bg:'rgba(217,119,6,.12)', days:diff};
    if(diff <= 180) return {level:'watch', label:'مراقبة (3-6 أشهر)', color:'#0284c7', bg:'rgba(2,132,199,.12)', days:diff};
    return {level:'ok', label:'آمن (أكثر من 6 أشهر)', color:'#0d9488', bg:'rgba(13,148,136,.12)', days:diff};
  }

  // Enrich data
  const items = data.map(r => ({...r, urgency: getUrgency(r.expiry)}));

  // Stats
  const expired = items.filter(i=>i.urgency.level==='expired');
  const critical = items.filter(i=>i.urgency.level==='critical');
  const warning = items.filter(i=>i.urgency.level==='warning');
  const watch = items.filter(i=>i.urgency.level==='watch');
  const ok = items.filter(i=>i.urgency.level==='ok');
  const totalValue = items.reduce((s,i)=>s+i.total,0);
  const critValue = [...expired,...critical].reduce((s,i)=>s+i.total,0);
  const totalQty = items.reduce((s,i)=>s+i.qty,0);

  // Branch stats
  const branchStats = {};
  ['T1','T2','T3','WH'].forEach(b=>{
    const bi = items.filter(i=>i.branch===b);
    branchStats[b] = {count:bi.length, qty:bi.reduce((s,i)=>s+i.qty,0), value:bi.reduce((s,i)=>s+i.total,0),
      critical: bi.filter(i=>i.urgency.level==='critical'||i.urgency.level==='expired').length};
  });

  // Cross-reference with doctor prescriptions data
  const loaded = BRANCHES.filter(b=>STATE.data[b]);
  const crossRef = new Map();
  if(loaded.length){
    items.forEach(item=>{
      let totalRx = 0, docs = new Set();
      if(loaded.includes(item.branch)){
        const d=STATE.data[item.branch];
        d.drugs.forEach(drug=>{
          if(nearExpiryDrugMatches(item.name,drug.name)){
            totalRx += drug.total;
            drug.doctors.forEach(dr=>docs.add(entityKey(dr.name)));
          }
        });
      }
      if(totalRx>0)crossRef.set(item.branch+'|'+item.code,{rx:totalRx,docs:docs.size});
    });
  }

  // Build HTML
  var h = '';

  // KPIs
  h += '<div class="card"><div class="card-head"><div class="card-title"><span class="dot" style="background:#dc2626"></span> ⏰ أصناف قرب انتهاء الصلاحية</div>'
     + '<span style="font-size:11px;color:var(--text-dim);">'+escapeHtml(NEAR_EXPIRY_SOURCE.label)+' — تاريخ المصدر غير مسجل · ' + items.length + ' صنف</span></div>'
     + '<div style="padding:10px 14px;margin-bottom:14px;border-radius:10px;background:rgba(217,119,6,.08);border:1px solid rgba(217,119,6,.25);color:var(--amber-l);font-size:11px;">راجع الكميات مع نظام المخزون قبل اتخاذ قرار؛ هذه لقطة مضمّنة وليست مزامنة حية.</div>';

  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">';
  h += '<div class="kpi-box-c" style="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.25);"><div class="kpi-label" style="color:#dc2626;">حرج / منتهي</div><div class="kpi-num" style="color:#dc2626;">'+ fmt(expired.length+critical.length) +'</div></div>';
  h += '<div class="kpi-box-c" style="background:rgba(217,119,6,.08);border:1px solid rgba(217,119,6,.25);"><div class="kpi-label" style="color:#d97706;">تحذير</div><div class="kpi-num" style="color:#d97706;">'+ fmt(warning.length) +'</div></div>';
  h += '<div class="kpi-box-c" style="background:rgba(2,132,199,.08);border:1px solid rgba(2,132,199,.25);"><div class="kpi-label" style="color:#0284c7;">مراقبة</div><div class="kpi-num" style="color:#0284c7;">'+ fmt(watch.length) +'</div></div>';
  h += '<div class="kpi-box-c" style="background:var(--bg-glass2);border:1px solid var(--border);"><div class="kpi-label" style="color:var(--text-dim);">إجمالي الأصناف</div><div class="kpi-num">'+ fmt(items.length) +'</div></div>';
  h += '<div class="kpi-box-c" style="background:var(--bg-glass2);border:1px solid var(--border);"><div class="kpi-label" style="color:var(--text-dim);">إجمالي الكمية</div><div class="kpi-num">'+ fmt(totalQty) +'</div></div>';
  h += '<div class="kpi-box-c" style="background:var(--bg-glass2);border:1px solid var(--border);"><div class="kpi-label" style="color:var(--text-dim);">القيمة الإجمالية</div><div class="kpi-num" style="font-size:20px;">'+ fmt(Math.round(totalValue)) +' <small style="font-size:11px;">ر.س</small></div></div>';
  h += '<div class="kpi-box-c" style="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.25);"><div class="kpi-label" style="color:#dc2626;">قيمة الحرج/المنتهي</div><div class="kpi-num" style="font-size:20px;color:#dc2626;">'+fmt(Math.round(critValue))+' <small style="font-size:11px;">ر.س</small></div></div>';
  h += '</div>';

  // Branch breakdown
  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">';
  ['T1','T2','T3','WH'].forEach(b=>{
    const bs = branchStats[b];
    const bcolor = b==='T1'?'#0369a1':(b==='T2'?'#0d9488':(b==='T3'?'#d97706':'#a78bfa'));
    const bname = b==='WH'?'المستودع الرئيسي':(BRANCH_LABELS[b]||b);
    h += '<div style="background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;text-align:center;">'
       + '<div style="font-size:11px;color:'+bcolor+';font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">'+bname+'</div>'
       + '<div style="font-family:\'Inter\',sans-serif;font-size:26px;font-weight:900;margin-bottom:4px;">'+fmt(bs.count)+'</div>'
       + '<div style="font-size:11px;color:var(--text-dim);">'+fmt(bs.qty)+' وحدة · '+fmt(Math.round(bs.value))+' ر.س</div>'
       + (bs.critical?'<div style="font-size:10px;color:#dc2626;margin-top:4px;">⚠ '+bs.critical+' صنف حرج</div>':'')
       + '</div>';
  });
  h += '</div></div>';

  // Urgency distribution chart
  h += '<div class="card"><div class="card-head"><div class="card-title"><span class="dot" style="background:#d97706"></span> توزيع الأصناف حسب مستوى الخطورة</div></div>'
     + '<div style="display:flex;gap:12px;flex-wrap:wrap;">';
  const urgGroups = [
    {items:expired, label:'منتهي', color:'#ef4444', icon:'❌'},{items:critical, label:'حرج', color:'#dc2626', icon:'🔴'},{items:warning, label:'تحذير', color:'#d97706', icon:'🟡'},{items:watch, label:'مراقبة', color:'#0284c7', icon:'🔵'},{items:ok,label:'آمن',color:'#0d9488',icon:'🟢'},
  ];
  urgGroups.forEach(g=>{
    const pct = items.length ? Math.round(g.items.length/items.length*100) : 0;
    h += '<div style="flex:1;min-width:120px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;text-align:center;">'
       + '<div style="font-size:20px;margin-bottom:4px;">'+g.icon+'</div>'
       + '<div style="font-family:\'Inter\',sans-serif;font-size:28px;font-weight:900;color:'+g.color+';">'+g.items.length+'</div>'
       + '<div style="font-size:11px;color:var(--text-dim);margin-top:2px;">'+g.label+' ('+pct+'%)</div>'
       + '<div style="margin-top:8px;height:4px;border-radius:2px;background:rgba(255,255,255,.06);"><div style="height:100%;border-radius:2px;background:'+g.color+';width:'+pct+'%;"></div></div>'
       + '</div>';
  });
  h += '</div></div>';

  // Search & filter + table
  h += '<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> جدول الأصناف التفصيلي</div></div>';
  h += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">'
     + '<input class="input" id="neSearch" placeholder="🔎 ابحث بالاسم أو الكود..." style="flex:1;min-width:200px;" oninput="filterNearExpiry()">'
     + '<select class="select" id="neBranch" style="min-width:130px;" onchange="filterNearExpiry()"><option value="all">كل الفروع</option><option value="T1">التعاون الأول</option><option value="T2">التعاون الثاني</option><option value="T3">التعاون الثالث</option><option value="WH">المستودع الرئيسي</option></select>'
     + '<select class="select" id="neUrgency" style="min-width:140px;" onchange="filterNearExpiry()"><option value="all">كل المستويات</option><option value="expired">منتهي</option><option value="critical">حرج</option><option value="warning">تحذير</option><option value="watch">مراقبة</option><option value="ok">آمن</option></select>'
     + '</div>';

  h += '<div style="overflow-x:auto;"><table class="table"><thead><tr><th>#</th><th>الصنف</th><th>الفرع</th><th>تاريخ الانتهاء</th><th>الأيام المتبقية</th><th>الكمية</th><th>القيمة (ر.س)</th>';
  if(loaded.length) h += '<th>كتابات نفس الفرع</th>';
  h += '<th>الحالة</th></tr></thead><tbody id="neTbody"></tbody></table></div>'
    + '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px;"><span id="neCount" style="font-size:11px;color:var(--text-dim);"></span><button type="button" class="btn table-more" id="neMore" onclick="filterNearExpiry(true)">عرض المزيد</button></div></div>';

  c.innerHTML = h;

  // Store items for filtering
  window.__neItems = items;
  window.__neCrossRef = crossRef;
  window.__neHasRx = loaded.length > 0;
  window.__neLimit = 200;
  filterNearExpiry();
}

function filterNearExpiry(loadMore){
  const items = window.__neItems || [];
  const crossRef = window.__neCrossRef || new Map();
  const hasRx = window.__neHasRx || false;
  const search=entityKey(document.getElementById('neSearch')?.value||'');
  const branch = document.getElementById('neBranch')?.value||'all';
  const urgency = document.getElementById('neUrgency')?.value||'all';

  window.__neLimit=loadMore?(window.__neLimit||200)+200:200;
  let filtered = [...items];
  if(search)filtered=filtered.filter(item=>entityKey(item.name).includes(search)||entityKey(item.code).includes(search));
  if(branch!=='all') filtered = filtered.filter(i=>i.branch===branch);
  if(urgency!=='all') filtered = filtered.filter(i=>i.urgency.level===urgency);

  const tbody = document.getElementById('neTbody');
  if(!tbody) return;

  if(!filtered.length){
    tbody.innerHTML = '<tr><td colspan="'+(hasRx?9:8)+'" style="text-align:center;padding:40px;color:var(--text-dim);">لا توجد نتائج</td></tr>';
    const count=document.getElementById('neCount'),more=document.getElementById('neMore');
    if(count)count.textContent='لا توجد نتائج';
    if(more)more.hidden=true;
    return;
  }

  // Sort: expired first, then critical, then by days
  filtered.sort((a,b)=>a.urgency.days-b.urgency.days);

  const visible=filtered.slice(0,window.__neLimit);
  tbody.innerHTML = visible.map((item,i)=>{
    const u = item.urgency;
    const daysText = u.days < 0 ? '<span style="color:#ef4444;font-weight:700;">منتهي منذ '+Math.abs(u.days)+' يوم</span>' :
                     '<span style="color:'+u.color+';font-weight:700;">'+u.days+' يوم</span>';
    const statusBadge = '<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:'+u.bg+';color:'+u.color+';border:1px solid '+u.color+'22;">'+u.label.split(' ')[0]+'</span>';
    const branchColor = item.branch==='T1'?'#0369a1':(item.branch==='T2'?'#0d9488':(item.branch==='T3'?'#d97706':'#a78bfa'));
    const dateFormatted = item.expiry.split('-').reverse().join('/');
    const crossKey=item.branch+'|'+item.code,rxCell=hasRx?('<td class="num">'+(crossRef.has(crossKey)?'<span style="color:var(--teal-l);font-weight:700;">'+fmt(crossRef.get(crossKey).rx)+'</span> <span style="font-size:10px;color:var(--text-dim);">('+crossRef.get(crossKey).docs+' طبيب)</span>':'<span style="color:var(--text-dim);">—</span>')+'</td>'):'';
    return '<tr>'
      + '<td style="color:var(--text-dim);font-size:11px;">'+(i+1)+'</td>'
      + '<td><strong style="font-size:12px;">'+escapeHtml(item.name.substring(0,55))+'</strong><div style="font-size:10px;color:var(--text-dim);margin-top:2px;">'+escapeHtml(item.code)+'</div></td>'
      + '<td><span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;background:'+branchColor+'15;color:'+branchColor+';border:1px solid '+branchColor+'30;">'+item.branch+'</span></td>'
      + '<td style="font-family:\'Inter\',sans-serif;font-size:12px;">'+dateFormatted+'</td>'
      + '<td class="num">'+daysText+'</td>'
      + '<td class="num" style="font-family:\'Inter\',sans-serif;">'+fmt(item.qty)+'</td>'
      + '<td class="num" style="font-family:\'Inter\',sans-serif;">'+fmt(Math.round(item.total))+'</td>'
      + rxCell
      + '<td>'+statusBadge+'</td>'
      + '</tr>';
  }).join('');
  const count=document.getElementById('neCount'),more=document.getElementById('neMore');
  if(count)count.textContent='عرض '+fmt(visible.length)+' من '+fmt(filtered.length)+' صنف';
  if(more)more.hidden=visible.length>=filtered.length;
}

  /* ══ خريطة البدائل المنافسة لكل منتج Private Label ══
     بناءً على التحديد الدقيق من مدير التطوير                */
  const COMP_MAP = [
    {
      key: 'reflex', name: 'Reflex (مساج/جل)',
      color: '#2563eb', bg: 'rgba(37,99,235,.1)', border: 'rgba(37,99,235,.3)',
      match: n => {
        const u = n.toLowerCase();
        return /voltic|moov|reparil|radian|rofenac/.test(u)
            || (/\bgel\b/.test(u) && !/oral gel|mouth gel|teething|vaginal|mebo|avomeb|tablet|capsule|syrup/.test(u))
            || /massage/.test(u)
            || /diclofenac/.test(u);
      },
      note: 'Voltic Gel · Moov Cream · Reparil · Radian · Diclofenac Gel · Rofenac + أي gel/massage'
    },{
      key: 'oracure', name: 'Oracure (غسول فم)',
      color: '#0284c7', bg: 'rgba(2,132,199,.1)', border: 'rgba(2,132,199,.3)',
      match: n => /mouth\s*wash|mouthwash|\bmw\b|oral\s*rinse|oral\s*wash|dental\s*wash/.test(n.toLowerCase()),
      note: 'Mouth Wash · MW · Oral Rinse · Oral Wash'
    },{
      key: 'intimo', name: 'Intimo (غسول نسائي)',
      color: '#db2777', bg: 'rgba(219,39,119,.1)', border: 'rgba(219,39,119,.3)',
      match: n => /vaginal\s*wash|feminine\s*wash|intimate|vaginal\s*gel|vaginal\s*cream|vagisil|femfresh/.test(n.toLowerCase()),
      note: 'Vaginal Wash · Feminine Wash · Intimate Wash'
    },{
      key: 'rizer', name: 'Rizer (مرطّب)',
      color: '#d97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.3)',
      match: n => /bepanthen|moisturiz|moisturising|emollient|body\s*cream|body\s*lotion|hydrating\s*cream/.test(n.toLowerCase()),
      note: 'Bepanthen · Moisturizing Cream · Hydrating · Emollient'
    },{
      key: 'nostriderm', name: 'Nostriderm (مرهم جلدي)',
      color: '#0d9488', bg: 'rgba(13,148,136,.1)', border: 'rgba(13,148,136,.3)',
      match: n => /mebo|avomeb/.test(n.toLowerCase()),
      note: 'Mebo · Avomeb Extra'
    },{
      key: 'nostricure', name: 'Nostricure (جل تقرحات/تسنين)',
      color: '#7c3aed', bg: 'rgba(124,58,237,.1)', border: 'rgba(124,58,237,.3)',
      match: n => /teething|ulcer|oral\s*gel|mouth\s*gel|gum\s*gel|dentinox|bonjela/.test(n.toLowerCase()),
      note: 'Teething Gel · Ulcer Gel · Oral Gel · Bonjela · Dentinox'
    },
  ];


// ══════════════════════════════════════════
// SECTION 15 — DOCTOR TREND ANALYSIS
// تحليل سلوكي مبني على:
//   1. التواجد في فرع واحد vs متعدد (انتشار)
//   2. تنوع الأدوية (عميق vs ضيق)
//   3. حجم الكتابة النسبي vs المتوسط
//   4. نسبة Private Label
// يعطي تصنيف اتجاهي (Trend) وتوقع (Prediction)
// ══════════════════════════════════════════
function renderBehavioralTrends() {
  const container = document.getElementById('trends-content');
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  if (!loaded.length) {
    container.innerHTML = `<div class="card"><div class="pl-no-data"><span class="nd-ico">↑</span><h3>لا توجد بيانات — يرجى رفع ملف الفرع أولاً</h3></div></div>`;
    return;
  }

  // ── تجميع شامل ──
  const docAgg = new Map();
  loaded.forEach(b => {
    STATE.data[b].doctors.forEach(doc => {
      const doctorKey=entityKey(doc.name);
      if (!docAgg.has(doctorKey)) {
        docAgg.set(doctorKey,{ name: doc.name, section: doc.section || '—', total: 0, branches: new Map(), drugs: new Map() });
      }
      const r=docAgg.get(doctorKey);
      r.total += doc.total;
      r.branches.set(b, (r.branches.get(b) || 0) + doc.total);
      doc.drugs.forEach(dr => r.drugs.set(dr.name, (r.drugs.get(dr.name) || 0) + dr.count));
    });
  });

  const allDocs = [...docAgg.values()];
  const avgTotal = allDocs.length ? allDocs.reduce((s, d) => s + d.total, 0) / allDocs.length : 0;

  // ── حساب مؤشرات السلوك لكل طبيب ──
  const analyzed = allDocs.map(d => {
    const diversityScore = d.drugs.size;
    const volumeRatio    = avgTotal > 0 ? (d.total / avgTotal) : 0;
    const branchSpread   = d.branches.size;
    const plDrugs=[...d.drugs.entries()].filter(([n])=>findPrivateLabelProduct(n));
    const plTotal        = plDrugs.reduce((s, [_, c]) => s + c, 0);
    const plPct          = d.total > 0 ? (plTotal / d.total * 100) : 0;

    // توزيع الكتابات على الفروع — لو متوازن، يعني الطبيب ثابت
    // لو مركز في فرع واحد، الاتجاه ضعيف
    const branchTotals = [...d.branches.values()].sort((a, b) => b - a);
    const topBranchShare = branchTotals[0] / d.total;

    // ── تحديد الاتجاه (Trend) ──
    let trend, trendAr, trendIcon, trendColor, trendBg, prediction, predictionColor;

    // معايير الاتجاه:
    // 📈 Growing  = تنوع عالٍ + حجم فوق المتوسط + انتشار في فروع متعددة
    // 🚀 Star     = حجم 2x فأكثر من المتوسط + تنوع جيد
    // ➖ Stable   = حجم متوسط + سلوك ثابت
    // 📉 Declining = حجم منخفض + تنوع ضعيف + مركز في فرع واحد
    // 🌱 New      = حجم صغير جداً + بداية ظهور

    if (volumeRatio >= 2 && diversityScore >= 4) {
      trend = 'star'; trendAr = '🚀 نجم'; trendIcon = '🚀';
      trendColor = '#0d9488'; trendBg = 'rgba(13,148,136,.1)';
      prediction = 'متوقع نمو متسارع — الطبيب أصل ثمين، يستحق استثمار علاقات إضافي';
      predictionColor = '#0d9488';
    } else if (volumeRatio >= 1.2 && diversityScore >= 3 && branchSpread >= 1) {
      trend = 'growing'; trendAr = '📈 صاعد'; trendIcon = '📈';
      trendColor = '#2563eb'; trendBg = 'rgba(37,99,235,.1)';
      prediction = 'يتوقع زيادة في الكتابة — استمر في تعزيز العلاقة وقدم منتجات جديدة';
      predictionColor = '#2563eb';
    } else if (volumeRatio >= 0.7 && volumeRatio < 1.2 && diversityScore >= 2) {
      trend = 'stable'; trendAr = '➖ ثابت'; trendIcon = '➖';
      trendColor = '#0284c7'; trendBg = 'rgba(2,132,199,.1)';
      prediction = 'الأداء مستقر — حافظ على المستوى وقدم حوافز للنمو';
      predictionColor = '#0284c7';
    } else if (volumeRatio >= 0.3 && (diversityScore < 3 || topBranchShare >= 0.9)) {
      trend = 'declining'; trendAr = '📉 منخفض'; trendIcon = '📉';
      trendColor = '#d97706'; trendBg = 'rgba(217,119,6,.1)';
      prediction = 'متوقع انخفاض إن لم يتم التدخل — راجع علاقتك معه وحدد الأسباب';
      predictionColor = '#d97706';
    } else if (d.total <= 3) {
      trend = 'new'; trendAr = '🌱 جديد'; trendIcon = '🌱';
      trendColor = '#7c3aed'; trendBg = 'rgba(124,58,237,.1)';
      prediction = 'في مرحلة التعرف — استثمر في علاقات أولية لإطلاق الكتابة';
      predictionColor = '#7c3aed';
    } else {
      trend = 'risk'; trendAr = '⚠ في خطر'; trendIcon = '⚠';
      trendColor = '#dc2626'; trendBg = 'rgba(220,38,38,.1)';
      prediction = 'خطر التحول للمنافس — يحتاج تدخل عاجل';
      predictionColor = '#dc2626';
    }

    return { ...d, diversityScore, volumeRatio, branchSpread, plPct, topBranchShare, trend, trendAr, trendIcon, trendColor, trendBg, prediction, predictionColor };
  });

  // ── تجميع كل اتجاه ──
  const trendOrder = { star: 0, growing: 1, stable: 2, new: 3, declining: 4, risk: 5 };
  analyzed.sort((a, b) => {
    if (trendOrder[a.trend] !== trendOrder[b.trend]) return trendOrder[a.trend] - trendOrder[b.trend];
    return b.total - a.total;
  });
  const counts = { star: 0, growing: 0, stable: 0, new: 0, declining: 0, risk: 0 };
  analyzed.forEach(d => counts[d.trend]++);

  const trendDefs = [
    { key: 'star',      ar: '🚀 نجم',     color: '#0d9488', bg: 'rgba(13,148,136,.1)',  border: 'rgba(13,148,136,.3)',  desc: 'حجم ≥ 2x المتوسط + تنوع عالٍ' },{ key: 'growing',   ar: '📈 صاعد',    color: '#2563eb', bg: 'rgba(37,99,235,.1)', border: 'rgba(37,99,235,.3)', desc: 'حجم فوق المتوسط + تنوع جيد' },{ key: 'stable',    ar: '➖ ثابت',    color: '#0284c7', bg: 'rgba(2,132,199,.1)', border: 'rgba(2,132,199,.3)', desc: 'أداء قريب من المتوسط' },{ key: 'new',       ar: '🌱 جديد',    color: '#7c3aed', bg: 'rgba(124,58,237,.1)', border: 'rgba(124,58,237,.3)', desc: 'كتابات قليلة جداً (≤ 3)' },{ key: 'declining', ar: '📉 منخفض',   color: '#d97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.3)', desc: 'حجم منخفض أو مركز في فرع واحد' },{ key: 'risk',      ar: '⚠ في خطر',  color: '#dc2626', bg: 'rgba(220,38,38,.1)',  border: 'rgba(220,38,38,.3)',  desc: 'مؤشرات تراجع واضحة' },
  ];

  container.innerHTML = `
    <div class="card">
      <div class="card-head">
        <div class="card-title"><span class="dot"></span> اتجاه الأطباء — Trend & Prediction Analysis</div>
        <div style="font-size:11px;color:var(--text-dim);">${allDocs.length} طبيب · متوسط الكتابة: ${fmt(Math.round(avgTotal))}</div>
      </div>

      <!-- بطاقات الاتجاهات -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:22px;">
        ${trendDefs.map(t => `
          <div style="background:${t.bg};border:1.5px solid ${t.border};border-radius:var(--r-lg);padding:16px 14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="font-size:12px;font-weight:800;color:${t.color};">${t.ar}</div>
              <div style="font-size:26px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:${t.color};">${counts[t.key]}</div>
            </div>
            <div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;margin-bottom:6px;">
              <div style="height:100%;width:${allDocs.length?((counts[t.key]/allDocs.length)*100).toFixed(0):0}%;background:${t.color};border-radius:2px;"></div>
            </div>
            <div style="font-size:10px;color:var(--text-dim);line-height:1.5;">${t.desc}</div>
          </div>`).join('')}
      </div>

      <!-- شارت ملخص -->
      <div class="grid-2" style="gap:16px;margin-bottom:22px;">
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">🥧 توزيع الاتجاهات</div>
          <div style="position:relative;height:220px;"><canvas id="trendPie"></canvas></div>
        </div>
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;">
          <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;">📊 حجم الكتابة vs المتوسط — أعلى 15</div>
          <div style="position:relative;height:220px;"><canvas id="trendVolume"></canvas></div>
        </div>
      </div>

      <!-- جداول مقسمة بكل اتجاه -->
      ${trendDefs.map(t => {
        const group = analyzed.filter(d => d.trend === t.key);
        if (!group.length) return '';
        return `
          <div style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;gap:10px;padding:11px 16px;background:${t.bg};border:1px solid ${t.border};border-radius:var(--r-md) var(--r-md) 0 0;border-bottom:none;">
              <div style="font-size:14px;font-weight:800;color:${t.color};">${t.ar}</div>
              <div style="font-size:12px;color:var(--text-dim);">${group.length} طبيب</div>
              <div style="font-size:11px;color:${t.color};margin-right:auto;">${t.desc}</div>
            </div>
            <div style="border:1px solid ${t.border};border-radius:0 0 var(--r-md) var(--r-md);overflow:hidden;">
              <table>
                <thead>
                  <tr style="background:${t.bg};">
                    <th style="width:44px">#</th>
                    <th>الطبيب</th>
                    <th>القسم</th>
                    <th>الكتابات</th>
                    <th>vs المتوسط</th>
                    <th>تنوع الأدوية</th>
                    <th>الفروع</th>
                    <th>PL%</th>
                    <th>التوقع</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.map((d, i) => `
                    <tr class="clickable" onclick="showDoctorMulti('${escapeAttr(d.name)}')">
                      <td>${rankBadge(i)}</td>
                      <td style="font-weight:700;">${escapeHtml(d.name)}</td>
                      <td><span class="tag blue" style="font-size:10px;">${escapeHtml(d.section)}</span></td>
                      <td class="num" style="font-weight:800;">${fmt(d.total)}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <span style="color:${t.color};font-weight:800;font-size:12px;">${d.volumeRatio.toFixed(1)}x</span>
                        </div>
                      </td>
                      <td class="num">${d.diversityScore} صنف</td>
                      <td class="num">${d.branchSpread}</td>
                      <td class="num">${d.plPct.toFixed(1)}%</td>
                      <td style="max-width:280px;">
                        <div style="font-size:11.5px;color:var(--text-dim);line-height:1.5;">${escapeHtml(d.prediction)}</div>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      }).join('')}
    </div>`;

  // ── الشارتات ──
  setTimeout(() => {
    const c = chartColors();
    destroyChart('trendPie');
    const ctxPie = document.getElementById('trendPie');
    if (ctxPie) {
      charts['trendPie'] = new Chart(ctxPie,{
        type: 'doughnut',
        data: {
          labels: ['نجم', 'صاعد', 'ثابت', 'جديد', 'منخفض', 'في خطر'],
          datasets: [{
            data: [counts.star, counts.growing, counts.stable, counts.new, counts.declining, counts.risk],
            backgroundColor: ['rgba(13,148,136,.8)','rgba(37,99,235,.8)','rgba(2,132,199,.8)','rgba(124,58,237,.8)','rgba(217,119,6,.8)','rgba(220,38,38,.8)'],
            borderWidth: 0, hoverOffset: 12
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '58%',
          plugins: { legend: { position: 'bottom', labels: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 11 }, boxWidth: 10, padding: 8 } }, tooltip: tt(c) }
        }
      });
    }

    destroyChart('trendVolume');
    const ctxVol = document.getElementById('trendVolume');
    if (ctxVol) {
      const top15 = analyzed.slice(0, 15);
      charts['trendVolume'] = new Chart(ctxVol,{
        type: 'bar',
        data: {
          labels: top15.map(d => d.name.split(' ').slice(0, 2).join(' ')),
          datasets: [{
            data: top15.map(d => +d.volumeRatio.toFixed(2)),
            backgroundColor: top15.map(d => d.trendColor + 'cc'),
            borderColor: top15.map(d => d.trendColor),
            borderWidth: 1.5, borderRadius: 5, borderSkipped: false
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { ...tt(c), callbacks: {
              title: items => top15[items[0].dataIndex].name,
              label: ctx => [
                ' حجم vs المتوسط: ' + ctx.raw + 'x',
                ' كتابات: ' + fmt(top15[ctx.dataIndex].total),
                ' الاتجاه: ' + top15[ctx.dataIndex].trendAr
              ]
            }}
          },
          scales: {
            x: { ticks: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 10 }, maxRotation: 35, minRotation: 20 }, grid: { display: false } },
            y: { ticks: { color: c.text, font: { family: 'IBM Plex Sans Arabic', size: 10 }, callback: v => v + 'x' }, grid: { color: c.grid } }
          }
        }
      });
    }
  }, 60);
}

/* اتجاه زمني حقيقي: يقارن أقدم وآخر فترة مؤرخة لكل فرع، ويستخدم
   التصنيف السلوكي القديم فقط عندما لا تتوفر فترتان صالحـتان للمقارنة. */
function renderTrends(){
  const container=document.getElementById('trends-content');
  const eligible=BRANCHES.map(branch=>{
    const dated=(STATE.periods[branch]||[]).filter(period=>periodDateScore(period.label)>0);
    const range=periodOldestNewest(dated);
    return range.oldest&&range.newest&&range.oldest!==range.newest?{branch,...range}:null;
  }).filter(Boolean);
  if(!eligible.length){
    renderBehavioralTrends();
    if(BRANCHES.some(branch=>STATE.data[branch])){
      container.insertAdjacentHTML('afterbegin','<div class="card" style="padding:13px 16px;border-color:rgba(217,119,6,.3);background:rgba(217,119,6,.07);font-size:12px;color:var(--text-dim);">ارفع فترتين باسم شهر وسنة لنفس الفرع لعرض الاتجاه الزمني. المعروض حالياً تصنيف سلوكي للبيانات الأحدث فقط.</div>');
    }
    return;
  }

  const doctors=new Map(),beforeLabels=new Set(),afterLabels=new Set();
  eligible.forEach(({branch,oldest,newest})=>{
    beforeLabels.add(oldest.label);afterLabels.add(newest.label);
    const oldMap=new Map((oldest.data?.doctors||[]).map(doc=>[entityKey(doc.name),doc]));
    const newMap=new Map((newest.data?.doctors||[]).map(doc=>[entityKey(doc.name),doc]));
    new Set([...oldMap.keys(),...newMap.keys()]).forEach(key=>{
      const oldDoc=oldMap.get(key),newDoc=newMap.get(key);
      let rec=doctors.get(key);
      if(!rec){
        rec={name:newDoc?.name||oldDoc?.name||key,section:newDoc?.section||oldDoc?.section||'—',before:0,after:0,branches:new Set(),latestDrugs:new Set(),plAfter:0};
        doctors.set(key,rec);
      }
      rec.before+=oldDoc?.total||0;rec.after+=newDoc?.total||0;rec.branches.add(branch);
      if(newDoc){
        if(newDoc.section)rec.section=newDoc.section;
        (newDoc.drugs||[]).forEach(drug=>{
          rec.latestDrugs.add(entityKey(drug.name));
          if(findPrivateLabelProduct(drug.name)||findPureHerbProduct(drug.name))rec.plAfter+=drug.count||0;
        });
      }
    });
  });

  const avgAfter=doctors.size?[...doctors.values()].reduce((sum,doc)=>sum+doc.after,0)/doctors.size:0;
  const defs={
    star:{ar:'🚀 نمو قوي',color:'#0d9488',bg:'rgba(13,148,136,.1)',border:'rgba(13,148,136,.3)',desc:'زيادة 50%+ وحجم أعلى من المتوسط',prediction:'حافظ على الزيارة ووسّع مزيج المنتجات.'},
    growing:{ar:'📈 صاعد',color:'#2563eb',bg:'rgba(37,99,235,.1)',border:'rgba(37,99,235,.3)',desc:'زيادة 15% أو أكثر',prediction:'استمر في المتابعة وحدد الأصناف المحركة للنمو.'},
    stable:{ar:'➖ ثابت',color:'#0284c7',bg:'rgba(2,132,199,.1)',border:'rgba(2,132,199,.3)',desc:'التغير بين -15% و+15%',prediction:'حافظ على المستوى واختبر فرصة منتج إضافي.'},
    new:{ar:'🌱 طبيب جديد',color:'#7c3aed',bg:'rgba(124,58,237,.1)',border:'rgba(124,58,237,.3)',desc:'ظهر في أحدث فترة',prediction:'فعّل خطة ترحيب ومتابعة مبكرة.'},
    declining:{ar:'📉 متراجع',color:'#d97706',bg:'rgba(217,119,6,.1)',border:'rgba(217,119,6,.3)',desc:'انخفاض 15% أو أكثر',prediction:'راجع سبب الانخفاض وقارن الأصناف والتخصص.'},
    risk:{ar:'⚠ متوقف',color:'#dc2626',bg:'rgba(220,38,38,.1)',border:'rgba(220,38,38,.3)',desc:'كان نشطاً ولم يظهر في أحدث فترة',prediction:'تدخل عاجل للتحقق من التحول أو توقف الزيارة.'}
  };
  const analyzed=[...doctors.values()].map(doc=>{
    const delta=doc.before>0?((doc.after-doc.before)/doc.before*100):null;
    let trend;
    if(doc.before===0&&doc.after>0)trend='new';
    else if(doc.before>0&&doc.after===0)trend='risk';
    else if(delta>=50&&doc.after>=avgAfter)trend='star';
    else if(delta>=15)trend='growing';
    else if(delta<=-15)trend='declining';
    else trend='stable';
    return {...doc,delta,trend,plPct:doc.after?doc.plAfter/doc.after*100:0,...defs[trend]};
  });
  const order={star:0,growing:1,new:2,stable:3,declining:4,risk:5};
  analyzed.sort((a,b)=>order[a.trend]-order[b.trend]||b.after-a.after);
  const counts=Object.fromEntries(Object.keys(defs).map(key=>[key,analyzed.filter(doc=>doc.trend===key).length]));
  const periodText=[...beforeLabels].join(' / ')+' ← '+[...afterLabels].join(' / ');
  const deltaText=doc=>doc.before===0?'<span style="color:#7c3aed;font-weight:800;">جديد</span>':doc.after===0?'<span style="color:#dc2626;font-weight:800;">توقف</span>':'<span style="color:'+(doc.delta>=0?'#0d9488':'#dc2626')+';font-weight:800;">'+(doc.delta>=0?'↑ ':'↓ ')+Math.abs(doc.delta).toFixed(1)+'%</span>';

  container.innerHTML='<div class="card">'
    +'<div class="card-head"><div class="card-title"><span class="dot"></span> اتجاه الأطباء عبر الفترات</div><div style="font-size:11px;color:var(--text-dim);">'+escapeHtml(periodText)+' · '+eligible.length+' فرع</div></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:20px;">'
    +Object.entries(defs).map(([key,def])=>'<div style="padding:14px;border-radius:var(--r-md);background:'+def.bg+';border:1px solid '+def.border+';"><div style="display:flex;justify-content:space-between;gap:8px;"><strong style="font-size:11px;color:'+def.color+';">'+def.ar+'</strong><span style="font:800 24px Inter;color:'+def.color+';">'+counts[key]+'</span></div><div style="font-size:9.5px;color:var(--text-dim);margin-top:5px;">'+def.desc+'</div></div>').join('')
    +'</div>'
    +'<div class="grid-2" style="gap:16px;margin-bottom:22px;"><div style="height:250px;"><canvas id="trendPie"></canvas></div><div style="height:250px;"><canvas id="trendVolume"></canvas></div></div>'
    +Object.entries(defs).map(([key,def])=>{
      const group=analyzed.filter(doc=>doc.trend===key);if(!group.length)return '';
      return '<div style="margin-bottom:18px;"><div style="padding:10px 14px;background:'+def.bg+';border:1px solid '+def.border+';border-radius:var(--r-md) var(--r-md) 0 0;color:'+def.color+';font-weight:800;">'+def.ar+' · '+group.length+' طبيب</div>'
        +'<div style="overflow-x:auto;border:1px solid '+def.border+';border-top:0;border-radius:0 0 var(--r-md) var(--r-md);"><table><thead><tr><th>#</th><th>الطبيب</th><th>القسم</th><th>الفترة الأقدم</th><th>الفترة الأحدث</th><th>التغير</th><th>الأصناف</th><th>الفروع</th><th>منتجاتنا</th><th>الإجراء المقترح</th></tr></thead><tbody>'
        +group.map((doc,index)=>'<tr '+(doc.after?'class="clickable" data-trend-doc="'+escapeAttr(doc.name)+'"':'')+'><td>'+rankBadge(index)+'</td><td><strong>'+escapeHtml(doc.name)+'</strong></td><td>'+escapeHtml(doc.section)+'</td><td class="num">'+fmt(doc.before)+'</td><td class="num">'+fmt(doc.after)+'</td><td>'+deltaText(doc)+'</td><td class="num">'+fmt(doc.latestDrugs.size)+'</td><td class="num">'+fmt(doc.branches.size)+'</td><td class="num">'+doc.plPct.toFixed(1)+'%</td><td style="font-size:11px;color:var(--text-dim);max-width:230px;">'+escapeHtml(doc.prediction)+'</td></tr>').join('')
        +'</tbody></table></div></div>';
    }).join('')
    +'</div>';
  container.querySelectorAll('[data-trend-doc]').forEach(row=>{row.onclick=()=>showDoctorMulti(row.dataset.trendDoc);});

  setTimeout(()=>{
    if((window._activePanel||'overview')!=='trends')return;
    const c=chartColors(),keys=['star','growing','stable','new','declining','risk'];
    destroyChart('trendPie');
    const pie=document.getElementById('trendPie');
    if(pie)charts.trendPie=new Chart(pie,{type:'doughnut',data:{labels:keys.map(key=>defs[key].ar),datasets:[{data:keys.map(key=>counts[key]),backgroundColor:keys.map(key=>defs[key].color),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:c.text,font:{family:'IBM Plex Sans Arabic',size:10}}},tooltip:tt(c)}}});
    const top=analyzed.slice().sort((a,b)=>b.after-a.after).slice(0,15);
    destroyChart('trendVolume');
    const volume=document.getElementById('trendVolume');
    if(volume)charts.trendVolume=new Chart(volume,{type:'bar',data:{labels:top.map(doc=>doc.name.split(' ').slice(0,2).join(' ')),datasets:[{label:[...beforeLabels].join(' / '),data:top.map(doc=>doc.before),backgroundColor:'rgba(148,163,184,.5)',borderRadius:4},{label:[...afterLabels].join(' / '),data:top.map(doc=>doc.after),backgroundColor:'rgba(37,99,235,.8)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:c.text,font:{family:'IBM Plex Sans Arabic',size:10}}},tooltip:tt(c)},scales:{x:{ticks:{color:c.text,maxRotation:35},grid:{display:false}},y:{ticks:{color:c.text},grid:{color:c.grid}}}}});
  },60);
}

// ══════════════════════════════════════════
// SECTION 16 — AI SMART RECOMMENDATIONS
// توصيات للعمل مبنية على:
//   • تحليل التخصصات × الأدوية
//   • Private Label gaps


/* ── init handled at end of script ── */

/* KPI counters now built into renderOverview */

/* ══ UPGRADE: STICKY SUMMARY BAR ══ */
function updateSummaryBar() {
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  const bar = document.getElementById('summaryBar');
  if (!loaded.length) { bar.classList.remove('visible'); return; }
  let total=0, docs=new Set(), drugs=new Set(), secs=new Set(), pats=new Set();
  loaded.forEach(b => {
    const d = STATE.data[b];
    total += d.totalRows;
    d.doctors.forEach(x=>docs.add(entityKey(x.name)));
    d.drugs.forEach(x=>drugs.add(entityKey(x.name)));
    d.sections.forEach(x=>secs.add(entityKey(x.name)));
    d.rows.forEach(r=>{const key=patientIdentityKey(b,r.patient);if(key)pats.add(key);});
  });
  const avg = docs.size ? Math.round(total / docs.size) : 0;
  document.getElementById('sb-total').textContent = fmt(total);
  document.getElementById('sb-docs').textContent = fmt(docs.size);
  document.getElementById('sb-drugs').textContent = fmt(drugs.size);
  document.getElementById('sb-secs').textContent = fmt(secs.size);
  document.getElementById('sb-pats').textContent = fmt(pats.size);
  document.getElementById('sb-avg').textContent = fmt(avg);
  bar.classList.add('visible');
}

/* ══ UPGRADE: GLOBAL SEARCH ══ */
const gSearch = document.getElementById('globalSearch');
const gDropdown = document.getElementById('searchDropdown');
function setGlobalSearchOpen(open){
  gDropdown.classList.toggle('open',!!open);
  gSearch.setAttribute('aria-expanded',String(!!open));
}

let _searchTimer = null;
let _globalSearchCache=null;
function invalidateGlobalSearch(){_globalSearchCache=null;}
gSearch.addEventListener('input', () => {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(runGlobalSearch, 200); /* debounce 200ms للسرعة */
});
gSearch.addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'){
    const first=gDropdown.querySelector('.sr-item');if(first){event.preventDefault();first.focus();}
  }else if(event.key==='Escape'){
    setGlobalSearchOpen(false);
  }
});
function runGlobalSearch() {
  const q=entityKey(gSearch.value);
  if (!q || q.length < 2) { setGlobalSearchOpen(false); return; }
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  if (!loaded.length) { gDropdown.innerHTML = '<div class="sr-empty">ارفع ملف أولاً</div>'; setGlobalSearchOpen(true); return; }

  if(!_globalSearchCache){
    const docMap=new Map(),drugMap=new Map();
    loaded.forEach(b=>{
      const d=STATE.data[b];
      d.doctors.forEach(doc=>{const key=entityKey(doc.name),r=docMap.get(key)||{name:doc.name,section:doc.section,total:0,key};r.total+=doc.total;docMap.set(key,r);});
      d.drugs.forEach(drug=>{const key=entityKey(drug.name),r=drugMap.get(key)||{name:drug.name,total:0,key};r.total+=drug.total;drugMap.set(key,r);});
    });
    _globalSearchCache={
      docs:[...docMap.values()].sort((a,b)=>b.total-a.total),
      drugs:[...drugMap.values()].sort((a,b)=>b.total-a.total)
    };
  }
  const matchDocs=_globalSearchCache.docs.filter(x=>x.key.includes(q)).slice(0,6);
  const matchDrugs=_globalSearchCache.drugs.filter(x=>x.key.includes(q)).slice(0,6);

  let html = '';
  if (matchDocs.length) {
    html += '<div class="sr-section">👨‍⚕️ الأطباء</div>';
    html += matchDocs.map(d => `<div class="sr-item" role="option" tabindex="-1" data-type="doc" data-name="${escapeAttr(d.name)}">
      <div class="sr-item-icon" style="background:var(--bg-glass2);">👨‍⚕️</div>
      <div class="sr-item-name">${escapeHtml(d.name)}</div>
      <div class="sr-item-val">${escapeHtml(d.section||'')} · ${fmt(d.total)}</div>
    </div>`).join('');
  }
  if (matchDrugs.length) {
    html += '<div class="sr-section">💊 الأدوية</div>';
    html += matchDrugs.map(d => `<div class="sr-item" role="option" tabindex="-1" data-type="drug" data-name="${escapeAttr(d.name)}">
      <div class="sr-item-icon" style="background:var(--bg-glass2);">💊</div>
      <div class="sr-item-name">${escapeHtml(d.name)}</div>
      <div class="sr-item-val">${fmt(d.total)} كتابة</div>
    </div>`).join('');
  }
  if (!html) html = '<div class="sr-empty">لا توجد نتائج</div>';
  gDropdown.innerHTML = html;
  setGlobalSearchOpen(true);

  const resultItems=[...gDropdown.querySelectorAll('.sr-item')];
  resultItems.forEach((el,index) => {
    el.onclick = () => {
      const type = el.dataset.type, name = el.dataset.name;
      setGlobalSearchOpen(false); gSearch.value = '';
      if (type === 'doc') {
        // navigate to docDash tab and show doctor
        window._docHub = 'dash';
        const sbDoc = document.querySelector('.sb-nav-item[data-tab="doctors"]');
        if (sbDoc) sidebarNav(sbDoc, 'doctors');
        setTimeout(() => {
          const sel = document.getElementById('docPicker');
          if (sel) {
            const opt = [...sel.options].find(o => sameEntity(o.text,name));
            if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change')); }
          }
          showDoctorMulti(name);
        }, 200);
      } else {
        // navigate to drugDash tab
        window._drugHub = 'search';
        const sbDrug = document.querySelector('.sb-nav-item[data-tab="drugs"]');
        if (sbDrug) sidebarNav(sbDrug, 'drugs');
        setTimeout(() => {
          const inp = document.getElementById('drugQuery');
          if (inp) { inp.value = name; inp.dispatchEvent(new Event('input')); }
          showDrugMulti(name);
        }, 200);
      }
    };
    el.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();el.click();return;}
      if(event.key==='Escape'){event.preventDefault();setGlobalSearchOpen(false);gSearch.focus();return;}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();
        const next=(index+(event.key==='ArrowDown'?1:-1)+resultItems.length)%resultItems.length;
        resultItems[next].focus();
      }
    });
  });
}

document.addEventListener('click', e => {
  if (!gSearch.contains(e.target) && !gDropdown.contains(e.target)) setGlobalSearchOpen(false);
});

/* ══ UPGRADE: BRANCH COMPARISON TAB ══ */
function renderCompare() {
  const container = document.getElementById('compare-content');
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  if (loaded.length < 2) {
    container.innerHTML = `<div class="card"><div class="pl-no-data"><span class="nd-ico">↑</span><h3>ارفع ملفين على الأقل للمقارنة</h3><p>ارفع بيانات فرعين أو أكثر من الأعلى</p></div></div>`;
    return;
  }
  // Build comparison metrics
  const metrics = loaded.map(b => {
    const d = STATE.data[b];
    const avg = d.doctors.length ? Math.round(d.totalRows / d.doctors.length) : 0;
    const top = d.doctors[0];
    return { b, label: BRANCH_LABELS[b], total: d.totalRows, docs: d.doctors.length, drugs: d.drugs.length, secs: d.sections.length, pats: d.totalPatients, avg, topDoc: top ? top.name : '—', topDocTotal: top ? top.total : 0 };
  });
  const maxTotal = Math.max(...metrics.map(m => m.total));
  const metricDefs = [
    { key:'total', label:'إجمالي الكتابات', color:'var(--violet-l)' },{ key:'docs',  label:'عدد الأطباء',     color:'var(--teal-l)'   },{ key:'drugs', label:'الأصناف الفريدة', color:'var(--amber-l)'  },{ key:'pats',  label:'المرضى',          color:'var(--sky-l)'    },{ key:'avg',   label:'متوسط/طبيب',     color:'var(--rose-l)'   },
  ];

  const colorsB = { T1:'var(--sky)', T2:'var(--teal)', T3:'var(--amber)' };

  let html = `<div class="card" style="margin-bottom:16px;">
    <div class="card-head"><div class="card-title"><span class="dot"></span> مقارنة الفروع — ${loaded.length} فروع</div></div>
    <div style="display:grid;grid-template-columns:repeat(${loaded.length},1fr);gap:12px;margin-bottom:24px;">
    ${metrics.map(m => `
      <div style="background:var(--bg-glass2);border:1px solid var(--border-h);border-radius:var(--r-lg);padding:20px;text-align:center;border-top:3px solid ${colorsB[m.b]||'var(--violet)'};">
        <div style="font-size:11px;font-weight:800;letter-spacing:.5px;color:${colorsB[m.b]||'var(--violet)'};margin-bottom:14px;text-transform:uppercase;">${m.label}</div>
        <div style="font-size:32px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:${colorsB[m.b]||'var(--violet)'};">${fmt(m.total)}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">كتابة إجمالية</div>
        <div style="margin-top:12px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${maxTotal?((m.total/maxTotal)*100).toFixed(1):0}%;background:${colorsB[m.b]||'var(--violet)'};border-radius:2px;transition:width 1s ease;"></div>
        </div>
      </div>`).join('')}
    </div>
    <div class="grid-2" style="gap:16px;">
    ${metricDefs.map(md => `
      <div style="background:var(--bg-glass);border:1px solid var(--border);border-radius:var(--r-md);padding:16px;">
        <div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:.4px;text-transform:uppercase;margin-bottom:12px;">${md.label}</div>
        ${metrics.map(m => {
          const maxV = Math.max(...metrics.map(x => x[md.key]));
          const pct2 = maxV ? ((m[md.key]/maxV)*100).toFixed(1) : 0;
          const isTop = m[md.key] === maxV;
          return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="font-size:11px;font-weight:700;color:${colorsB[m.b]};min-width:80px;">${m.label}</div>
            <div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${pct2}%;background:${colorsB[m.b]};border-radius:4px;"></div>
            </div>
            <div style="font-size:13px;font-weight:800;font-family:'Inter','Alexandria',sans-serif;color:${isTop?md.color:'var(--text-dim)'};min-width:50px;text-align:left;">
              ${fmt(m[md.key])}${isTop?' 🏆':''}
            </div>
          </div>`;
        }).join('')}
      </div>`).join('')}
    </div>
  </div>

  <div class="card">
    <div class="card-head"><div class="card-title"><span class="dot"></span> أعلى الأطباء في كل فرع</div></div>
    <div style="display:grid;grid-template-columns:repeat(${loaded.length},1fr);gap:16px;">
    ${loaded.map(b => {
      const d = STATE.data[b]; const top5 = d.doctors.slice(0,8); const max5 = top5[0]?.total||1;
      return `<div>
        <div style="font-size:11px;font-weight:800;color:${colorsB[b]};letter-spacing:.4px;margin-bottom:12px;text-transform:uppercase;">${BRANCH_LABELS[b]}</div>
        ${top5.map((doc,i)=>`
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;cursor:pointer;" onclick="showDoctorMulti('${escapeAttr(doc.name)}')">
            <span class="rank ${i===0?'gold':i===1?'silver':i===2?'bronze':'normal'}">${i+1}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(doc.name)}</div>
              <div style="height:3px;background:var(--border);border-radius:2px;margin-top:4px;overflow:hidden;">
                <div style="height:100%;width:${(doc.total/max5*100).toFixed(1)}%;background:${colorsB[b]};border-radius:2px;"></div>
              </div>
            </div>
            <div style="font-size:12px;font-weight:800;font-family:'Inter','Alexandria',sans-serif;color:${colorsB[b]};">${fmt(doc.total)}</div>
          </div>`).join('')}
      </div>`;
    }).join('')}
    </div>
  </div>`;

  container.innerHTML = html;
}

/* ملاحظة: مُصدِّر Excel واختصارات لوحة المفاتيح ومستمعو #tabs القديمة
   كانت مُعرَّفة مرتين — أُبقيَت النسخة الموحّدة أدناه فقط (GODMODE V7). */

/* ════════════════════════════════════════════════════
   MULTI-PERIOD SYSTEM
   كل فرع يقدر يرفع أكثر من فترة (مايو، أبريل، Q1...)
   STATE.periods[b] = [{id, label, rows, data}]
   STATE.data[b]    = aggregate من كل الفترات (للتابات العادية)
════════════════════════════════════════════════════ */
STATE.periods = { T1:[], T2:[], T3:[] };

const PERIOD_COLORS = ['pc0','pc1','pc2','pc3','pc4'];
/* _pending vars moved to top */
let _periodReturnFocus=null;
const PERIOD_MONTHS_AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function periodLabelForOffset(offset){
  const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(offset||0));
  return PERIOD_MONTHS_AR[d.getMonth()]+' '+d.getFullYear();
}
function populatePeriodMonthPicker(){
  const grid=document.getElementById('monthPickerGrid');if(!grid)return;
  const colors=[
    {bg:'rgba(37,99,235,.12)',bd:'rgba(37,99,235,.35)',cl:'var(--violet-l)'},
    {bg:'rgba(13,148,136,.12)',bd:'rgba(13,148,136,.35)',cl:'var(--teal-l)'},
    {bg:'rgba(2,132,199,.12)',bd:'rgba(2,132,199,.35)',cl:'var(--sky-l)'},
    {bg:'rgba(217,119,6,.12)',bd:'rgba(217,119,6,.35)',cl:'var(--amber-l)'}
  ];
  grid.replaceChildren();
  let lastYear=null;
  for(let offset=0;offset<18;offset++){
    const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-offset);
    if(d.getFullYear()!==lastYear){
      lastYear=d.getFullYear();
      const heading=document.createElement('div');
      heading.textContent=lastYear+':';heading.style.cssText='width:100%;font-size:10px;font-weight:700;color:var(--text-muted);margin:4px 0 2px;letter-spacing:.5px;';
      grid.appendChild(heading);
    }
    const color=colors[offset%colors.length],label=PERIOD_MONTHS_AR[d.getMonth()]+' '+d.getFullYear();
    const button=document.createElement('button');
    button.type='button';button.textContent=(offset===0?'● ':'')+label;button.dataset.periodLabel=label;button.setAttribute('aria-pressed','false');
    button.style.cssText='padding:'+(offset<12?'6px 12px':'5px 10px')+';border-radius:999px;font-size:'+(offset<12?'11.5px':'10.5px')+';font-weight:'+(offset===0?'800':'600')+';background:'+color.bg+';border:1px solid '+color.bd+';color:'+color.cl+';cursor:pointer;font-family:inherit;'+(offset===0?'box-shadow:0 0 8px '+color.bd+';':'');
    button.addEventListener('click',()=>{
      grid.querySelectorAll('button[aria-pressed]').forEach(x=>x.setAttribute('aria-pressed','false'));
      button.setAttribute('aria-pressed','true');
      document.getElementById('periodNameInput').value=label;
      document.getElementById('periodNameWarn').style.display='none';
    });
    grid.appendChild(button);
  }
}
function restorePeriodFocus(){
  if(_periodReturnFocus&&document.contains(_periodReturnFocus))_periodReturnFocus.focus();
  _periodReturnFocus=null;
}


/* ── مستمعو الرفع (onclick/onchange + السحب والإفلات) مُعرَّفون مرة واحدة أعلى الملف ── */

/* ── Add-period flow ── */
function startAddPeriod(branch) {
  _periodReturnFocus=document.activeElement;
  _pendingBranch = branch;
  const idx = STATE.periods[branch].length;
  const inp = document.getElementById('periodNameInput');
  populatePeriodMonthPicker();
  inp.value = periodLabelForOffset(idx);
  document.getElementById('periodNameWarn').style.display='none';
  const popup=document.getElementById('periodPopup');popup.classList.add('open');popup.setAttribute('aria-hidden','false');
  setBlockingUi(true);
  setTimeout(() => inp.focus(), 120);
}
function cancelAddPeriod() {
  _pendingBranch = null; _pendingMode = null;
  const popup=document.getElementById('periodPopup');popup.classList.remove('open');popup.setAttribute('aria-hidden','true');
  setBlockingUi(false);
  restorePeriodFocus();
}
function confirmAddPeriod() {
  const rawName = document.getElementById('periodNameInput').value.trim();
  const warn = document.getElementById('periodNameWarn');
  if(!rawName||periodDateScore(rawName)===0){
    warn.style.display='block';
    document.getElementById('periodNameInput').focus();
    return;
  }
  warn.style.display='none';
  const name = rawName;
  const popup=document.getElementById('periodPopup');popup.classList.remove('open');popup.setAttribute('aria-hidden','true');
  setBlockingUi(false);
  _pendingMode = 'period';
  const inp = document.getElementById('file-'+_pendingBranch);
  inp._pendingLabel = name;
  inp.click();
}
document.getElementById('periodNameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmAddPeriod();
  if (e.key === 'Escape') cancelAddPeriod();
});
document.getElementById('periodNameInput').addEventListener('input',()=>{document.getElementById('periodNameWarn').style.display='none';});

/* ── Process period file ── */
async function handlePeriodFile(branch, label, file) {
  const version=++_uploadVersion[branch];
  _upShow(branch, label+' — '+file.name);
  showLoad();
  try {
    let rows;const ext=validateUploadFile(file);
    const parseOptions={shouldCancel:()=>version!==_uploadVersion[branch],onProgress:p=>_upSet(branch,15+Math.round(p*45))};
    await _upTick(branch,15);
    if(ext==='.xlsx'||ext==='.xls')rows=await parseExcel(file,parseOptions);
    else if(ext==='.csv')rows=await parseCSV(file,parseOptions);
    else rows=await parsePDF(file,parseOptions);
    if(version!==_uploadVersion[branch])return;
    await _upTick(branch,65);
    validateParsedRows(rows);
    const id = Date.now();
    const agg=await aggregateAsync(rows,p=>_upSet(branch,65+Math.round(p*25)),()=>version!==_uploadVersion[branch]);
    if(version!==_uploadVersion[branch])return;
    const existing=STATE.periods[branch].findIndex(p=>entityKey(p.label)===entityKey(label));
    const entry={id,label,rows,data:agg,parseMeta:rows._parseMeta||null};
    if(existing>=0){
      if(!confirm('الفترة "'+label+'" موجودة بالفعل. استبدالها بالملف الجديد؟')){_upHide(branch);return;}
      if(version!==_uploadVersion[branch])return;
      entry.id=STATE.periods[branch][existing].id;entry._main=!!STATE.periods[branch][existing]._main;
      STATE.periods[branch][existing]=entry;
    }else STATE.periods[branch].push(entry);
    await _upTick(branch,90);
    rebuildBranchFromPeriods(branch);
    if (!STATE.active) STATE.active = branch;
    await _upTick(branch,100);
    setTimeout(()=>{if(version===_uploadVersion[branch])_upHide(branch);},500);
    renderPeriodBadges(branch);
    renderAll();
    saveData();
    const quality=STATE.quality[branch];
    toast('✓ "'+label+'" — '+BRANCH_LABELS[branch]+' ('+fmt(rows.length)+' وصفة'+(quality?' · جودة '+quality.score+'%':'')+')');
    if(quality?.warnings?.length)setTimeout(()=>toast('راجع لوحة جودة البيانات: '+quality.warnings[0],'warn'),900);
  } catch(e) {
    if(version===_uploadVersion[branch]){console.error(e);_upHide(branch);toast(e.message || 'فشل القراءة', 'error');}
  } finally { hideLoad(); }
}

/* ── Rebuild merged STATE.data from all periods ── */
function rebuildBranchFromPeriods(branch) {
  const periods = STATE.periods[branch];
  if (!periods.length) { STATE.data[branch] = null; return; }
  /* البيانات الرئيسية المعروضة في كل الداشبورد = أحدث فترة فقط (مش مجموع كل الفترات)
     الفترات الكاملة تبقى محفوظة في STATE.periods للمقارنة الزمنية فقط */
  const latest = PharmaCore.selectPeriodRange(periods).newest || periods[periods.length - 1];
  const d=latest.data||aggregate(latest.rows||[]);
  d.rows       = latest.rows || [];
  d.reportName = latest.label;
  d.reportDate = '';
  STATE.data[branch] = d;
  invalidateGlobalSearch();
  STATE.quality[branch] = PharmaCore.assessRows(latest.rows || [],latest.parseMeta||{source:'saved'});
}

/* ── Render period badges inside branch card ── */
function renderPeriodBadges(branch) {
  const container = document.getElementById('periods-'+branch);
  if (!container) return;
  const periods = STATE.periods[branch];
  container.innerHTML = periods.map((p, i) => `
    <span class="period-badge ${PERIOD_COLORS[i%5]}">
      ${escapeHtml(p.label)}
      <button class="period-del" onclick="deletePeriod('${branch}',${p.id})" title="حذف">✕</button>
    </span>`).join('');
}

function deletePeriod(branch, id) {
  STATE.periods[branch] = STATE.periods[branch].filter(p => p.id !== id);
  rebuildBranchFromPeriods(branch);
  if (!STATE.data[branch] && STATE.active === branch) {
    STATE.active = BRANCHES.find(b => STATE.data[b]) || null;
  }
  saveData();
  renderPeriodBadges(branch);
  // also update meta text
  const periods = STATE.periods[branch];
  const meta = document.getElementById('meta-'+branch);
  if (!periods.length) {
    meta.className = 'meta';
    meta.textContent = 'لم يتم رفع ملف بعد';
    document.querySelector('.branch-card[data-branch="'+branch+'"]').classList.remove('has-data');
  } else {
    const total = periods.reduce((s,p) => s+(p.rows||[]).length, 0);
    meta.className = 'meta status-loaded';
    meta.textContent = '✓ '+periods.length+' فترة · '+fmt(total)+' وصفة';
  }
  renderAll();
  toast('تم حذف الفترة');
}

/* ════════════════════════════════════════════════════
   renderTimeComp — المقارنة الزمنية الكاملة
════════════════════════════════════════════════════ */
/* يستخرج ترتيب زمني من اسم الفترة (شهر/سنة) — للترتيب التلقائي الصحيح */
function periodDateScore(label){
  return PharmaCore.periodDateScore(label);
}

/* يرجّع أقدم وأحدث فترة مرتّبتين زمنياً (للمقارنات الصحيحة) */
function periodOldestNewest(periods){
  const range=PharmaCore.selectPeriodRange(periods);
  return {oldest:range.oldest,newest:range.newest};
}
function datedComparisonPeriods(periods){
  return PharmaCore.sortPeriods(periods).filter(period=>periodDateScore(period.label)>0);
}

function renderTimeComp() {
  const container = document.getElementById('timecomp-content');
  const anyData=BRANCHES.some(b=>datedComparisonPeriods(STATE.periods[b]).length>=2);
  if (!anyData) {
    container.innerHTML = `<div class="card"><div class="pl-no-data"><span class="nd-ico">📅</span><h3>ارفع فترتين على الأقل</h3><p>اضغط "+ فترة" في أي فرع لإضافة فترة زمنية للمقارنة</p></div></div>`;
    return;
  }

  const eligibleBranches=BRANCHES.filter(b=>datedComparisonPeriods(STATE.periods[b]).length>=2);
  const branchOpts = eligibleBranches.map(b =>
    `<option value="${b}">${BRANCH_LABELS[b]} (${datedComparisonPeriods(STATE.periods[b]).length} فترة مؤرخة)</option>`).join('');

  container.innerHTML = `
    <div class="card">
      <div class="card-head" style="flex-wrap:wrap;gap:10px;">
        <div class="card-title"><span class="dot"></span> المقارنة الزمنية بين الفترات</div>
      </div>
      <div class="tc-selector">
        <div class="tc-sel-group">
          <div class="tc-sel-label">الفرع</div>
          <select class="select" id="tc-branch" style="min-width:170px;">${branchOpts}</select>
        </div>
        <div class="tc-sel-group">
          <div class="tc-sel-label">الفترة الحالية</div>
          <select class="select" id="tc-p1" style="min-width:160px;"></select>
        </div>
        <div class="tc-sel-group">
          <div class="tc-sel-label">الفترة المقارنة</div>
          <select class="select" id="tc-p2" style="min-width:160px;"></select>
        </div>
        <button class="btn" style="background:var(--grad-p);color:#fff;border-color:transparent;align-self:flex-end;" onclick="buildTimeComp()">عرض المقارنة ←</button>
      </div>
      <div id="tc-result" style="padding:16px 20px;"></div>
    </div>`;

  function refreshSelects() {
    const b = document.getElementById('tc-branch').value;
    const periods=datedComparisonPeriods(STATE.periods[b]);
    const opts = periods.map((p,i) => `<option value="${i}">${escapeHtml(p.label)} (${fmt((p.rows||[]).length)})</option>`).join('');
    document.getElementById('tc-p1').innerHTML = opts;
    document.getElementById('tc-p2').innerHTML = '<option value="">— لا مقارنة —</option>' + opts;
    if (periods.length >= 2) {
      document.getElementById('tc-p1').value=String(periods.length-1);
      document.getElementById('tc-p2').value=String(periods.length-2);
    }
    buildTimeComp();
  }
  document.getElementById('tc-branch').addEventListener('change', refreshSelects);
  refreshSelects();
}

function buildTimeComp() {
  const branchEl = document.getElementById('tc-branch');
  const p1El = document.getElementById('tc-p1');
  const p2El = document.getElementById('tc-p2');
  if (!branchEl) return;

  const branch = branchEl.value;
  const i1 = parseInt(p1El.value);
  const i2Val = p2El.value;
  const periods=datedComparisonPeriods(STATE.periods[branch]);
  if (!periods.length) return;

  const p1 = periods[i1];
  const p2 = (i2Val !== '' && parseInt(i2Val) !== i1) ? periods[parseInt(i2Val)] : null;
  const d1 = p1.data;
  const d2 = p2 ? p2.data : null;

  const colC = 'var(--violet-l)';
  const colP = 'var(--teal-l)';

  function delta(cur, prev) {
    if (!prev || prev === 0) return null;
    return ((cur - prev) / prev * 100).toFixed(1);
  }
  function dHtml(cur, prev) {
    const d = delta(cur, prev);
    if (d === null) return '';
    const n = parseFloat(d);
    const cls = n >= 0 ? 'tc-delta-up' : 'tc-delta-dn';
    return `<span class="${cls}">${n>=0?'↑':'↓'} ${Math.abs(n)}%</span>`;
  }

  // KPIs
  const kpis = [
    {label:'الكتابات', cur:d1.totalRows,       prev:d2?.totalRows},{label:'الأطباء',  cur:d1.doctors.length,   prev:d2?.doctors.length},{label:'الأصناف',  cur:d1.drugs.length,     prev:d2?.drugs.length},{label:'المرضى',   cur:d1.totalPatients,    prev:d2?.totalPatients},{label:'متوسط/طبيب', cur:d1.doctors.length?Math.round(d1.totalRows/d1.doctors.length):0,
      prev: d2&&d2.doctors.length?Math.round(d2.totalRows/d2.doctors.length):null},
  ];

  const kpiHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px;">
    ${kpis.map(k => `
      <div style="background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-md);padding:16px;text-align:center;">
        <div style="font-size:10px;font-weight:800;color:var(--text-muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px;">${k.label}</div>
        <div style="font-size:26px;font-weight:900;font-family:'Inter','Alexandria',sans-serif;color:${colC};">${fmt(k.cur)}</div>
        ${k.prev!=null ? `<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">${dHtml(k.cur,k.prev)} vs ${fmt(k.prev)}</div>` : ''}
      </div>`).join('')}
  </div>`;

  // Insights — new/lost/grew/dropped doctors
  let insightsHtml = '';
  if (d2) {
    const d1DocMap=new Map(d1.doctors.map(doctor=>[entityKey(doctor.name),doctor]));
    const d2DocMap=new Map(d2.doctors.map(doctor=>[entityKey(doctor.name),doctor]));
    const newDocs=d1.doctors.filter(doctor=>!d2DocMap.has(entityKey(doctor.name)));
    const lostDocs=d2.doctors.filter(doctor=>!d1DocMap.has(entityKey(doctor.name)));
    const grewDocs=d1.doctors.filter(doctor=>d2DocMap.has(entityKey(doctor.name))&&doctor.total>d2DocMap.get(entityKey(doctor.name)).total)
      .sort((a,b)=>(b.total-d2DocMap.get(entityKey(b.name)).total)-(a.total-d2DocMap.get(entityKey(a.name)).total));
    const droppedDocs=d1.doctors.filter(doctor=>d2DocMap.has(entityKey(doctor.name))&&doctor.total<d2DocMap.get(entityKey(doctor.name)).total)
      .sort((a,b)=>(a.total-d2DocMap.get(entityKey(a.name)).total)-(b.total-d2DocMap.get(entityKey(b.name)).total));

    // Generate unique ID for each insight card for expand toggle
    let _icCardIdx = 0;
    function insightCard(title, color, items, valFn) {
      const cardId = 'ic-' + (++_icCardIdx);
      const PREVIEW = 6;
      const allRows = items.map(d => `
        <div class="tc-insight-row">
          <span style="font-size:11.5px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:6px;" title="${escapeHtml(d.name)}">${escapeHtml(d.name)}</span>
          <span style="font-weight:800;font-size:12px;color:${color};flex-shrink:0;">${valFn(d)}</span>
        </div>`).join('');
      const hasMore = items.length > PREVIEW;
      return `<div class="tc-insight-card" style="border-color:${color}33;">
        <div class="tc-insight-title" style="color:${color};">${title}</div>
        ${items.length ? `
          <div class="tc-rows-wrap" id="${cardId}-rows" style="max-height:${PREVIEW*34}px;overflow:hidden;transition:max-height .35s ease;">
            ${allRows}
          </div>
          ${hasMore ? `
          <button onclick="(function(){
            var w=document.getElementById('${cardId}-rows');
            var b=document.getElementById('${cardId}-btn');
            var expanded=w.dataset.expanded==='1';
            if(expanded){w.style.maxHeight='${PREVIEW*34}px';w.dataset.expanded='0';b.textContent='+ ${items.length-PREVIEW} آخرين ▾';}
            else{w.style.maxHeight=w.scrollHeight+'px';w.dataset.expanded='1';b.textContent='طي القائمة ▴';}
          })()" id="${cardId}-btn"
            style="margin-top:6px;width:100%;background:none;border:1px dashed ${color}44;border-radius:6px;padding:5px 8px;font-size:10.5px;font-weight:700;color:${color};cursor:pointer;font-family:inherit;transition:all .2s;">
            + ${items.length-PREVIEW} آخرين ▾
          </button>` : ''}
        ` : `<div style="font-size:12px;color:var(--text-muted);padding:4px 0;">لا يوجد</div>`}
      </div>`;
    }
    _icCardIdx = 0;

    insightsHtml = `<div class="tc-insights">
      ${insightCard('✨ أطباء جدد', 'var(--teal)', newDocs, d => fmt(d.total))}
      ${insightCard('⚠ أطباء توقفوا', 'var(--rose)', lostDocs, d => fmt(d.total))}
      ${insightCard('📈 الأكثر نمواً', 'var(--violet-l)', grewDocs, d => '+'+fmt(d.total-(d2DocMap.get(entityKey(d.name))?.total||0)))}
      ${insightCard('📉 الأكثر انخفاضاً', 'var(--amber-l)', droppedDocs, d => fmt(d.total-(d2DocMap.get(entityKey(d.name))?.total||0)))}
    </div>`;
  }

  // Doctors table
  const d1Map=new Map(d1.doctors.map(doctor=>[entityKey(doctor.name),doctor]));
  const d2Map=d2?new Map(d2.doctors.map(doctor=>[entityKey(doctor.name),doctor])):new Map();
  const allDocKeys=new Set([...d1Map.keys(),...d2Map.keys()]);
  const docRows=[...allDocKeys]
    .map(key=>{const current=d1Map.get(key)||null,previous=d2Map.get(key)||null;return{name:current?.name||previous?.name||key,d1:current,d2:previous};})
    .sort((a,b) => (b.d1?.total||0) - (a.d1?.total||0));
  const maxCur = Math.max(...docRows.map(r=>r.d1?.total||0), 1);

  const docTableHtml = `
    <div class="mini-head" style="margin-bottom:10px;"><h3>👨‍⚕️ مقارنة الأطباء ${d2?'— '+escapeHtml(p1.label)+' vs '+escapeHtml(p2.label):''}</h3></div>
    <div class="table-wrap" style="max-height:480px;overflow-y:auto;">
      <table>
        <thead><tr>
          <th style="width:50px;">#</th>
          <th>الطبيب</th>
          <th>${escapeHtml(p1.label)}</th>
          ${d2?`<th>${escapeHtml(p2.label)}</th><th>التغيير</th>`:''}
          <th style="width:150px;">النسبة</th>
        </tr></thead>
        <tbody>
        ${docRows.slice(0,80).map((r,i) => {
          const cur  = r.d1?.total || 0;
          const prev = r.d2?.total || 0;
          const d = d2 ? delta(cur, prev) : null;
          const dn = d !== null ? parseFloat(d) : null;
          const tColor = dn===null?'var(--text-muted)':dn>0?'var(--teal)':dn<0?'var(--rose)':'var(--text-muted)';
          const isNew  = d2 && !r.d2 && r.d1;
          const isLost = d2 && !r.d1 && r.d2;
          const barW = (cur/maxCur*100).toFixed(1);
          return `<tr class="clickable" onclick="showDoctorMulti('${escapeAttr(r.name)}')">
            <td>${rankBadge(i)}</td>
            <td>
              <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;" title="${escapeAttr(r.name)}">${escapeHtml(r.name)}</div>
              <div style="font-size:10.5px;color:var(--text-muted);">${escapeHtml(r.d1?.section||r.d2?.section||'')}</div>
            </td>
            <td class="num" style="color:${colC};">${cur>0?fmt(cur):'—'}</td>
            ${d2?`
            <td class="num" style="color:${colP};opacity:.85;">${prev>0?fmt(prev):isNew?'<span style="color:var(--teal);font-size:11px;">جديد</span>':'—'}</td>
            <td class="num" style="color:${tColor};font-size:13px;">
              ${dn!==null?(dn>0?'↑ ':'↓ ')+Math.abs(dn)+'%':isNew?'<span style="color:var(--teal);">✨ جديد</span>':isLost?'<span style="color:var(--rose);">⚠ توقف</span>':'—'}
            </td>`:''}
            <td>${barRow(cur,maxCur)}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>`;

  // Drugs table
  const d1DMap=new Map(d1.drugs.map(drug=>[entityKey(drug.name),drug]));
  const d2DMap=d2?new Map(d2.drugs.map(drug=>[entityKey(drug.name),drug])):new Map();
  const allDrugKeys=new Set([...d1DMap.keys(),...d2DMap.keys()]);
  const drugRows2=[...allDrugKeys]
    .map(key=>{const current=d1DMap.get(key),previous=d2DMap.get(key);return{name:current?.name||previous?.name||key,cur:current?.total||0,prev:previous?.total||0};})
    .sort((a,b) => b.cur - a.cur).slice(0,30);
  const maxDrug = Math.max(...drugRows2.map(r=>r.cur),1);

  const drugTableHtml = `
    <div class="mini-head" style="margin-top:20px;margin-bottom:10px;"><h3>💊 مقارنة الأدوية (Top 30)</h3></div>
    <div class="table-wrap" style="max-height:400px;overflow-y:auto;">
      <table>
        <thead><tr>
          <th style="width:50px;">#</th><th>الدواء</th>
          <th>${escapeHtml(p1.label)}</th>
          ${d2?`<th>${escapeHtml(p2.label)}</th><th>التغيير</th>`:''}
          <th style="width:150px;">النسبة</th>
        </tr></thead>
        <tbody>
        ${drugRows2.map((r,i) => {
          const d = d2 ? delta(r.cur, r.prev) : null;
          const dn = d!==null?parseFloat(d):null;
          const tc = dn===null?'var(--text-muted)':dn>0?'var(--teal)':dn<0?'var(--rose)':'var(--text-muted)';
          return `<tr class="clickable" onclick="showDrugFromPeriod('${escapeAttr(r.name)}','${branch}','${escapeAttr(String(p1.id))}')">
            <td>${rankBadge(i)}</td>
            <td style="font-weight:600;">${escapeHtml(r.name)}</td>
            <td class="num" style="color:${colC};">${r.cur>0?fmt(r.cur):'—'}</td>
            ${d2?`<td class="num" style="color:${colP};opacity:.85;">${r.prev>0?fmt(r.prev):'—'}</td>
            <td class="num" style="color:${tc};">${dn!==null?(dn>0?'↑ ':'↓ ')+Math.abs(dn)+'%':'—'}</td>`:''}
            <td>${barRow(r.cur,maxDrug)}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>`;

  const legendHtml = d2 ? `
    <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;font-weight:700;margin-bottom:16px;">
      <span style="display:flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:2px;background:var(--violet);display:inline-block;"></span>${escapeHtml(p1.label)}</span>
      <span style="display:flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:2px;background:var(--teal);display:inline-block;opacity:.7;"></span>${escapeHtml(p2.label)}</span>
    </div>` : '';

  // ── جدول "كل الفترات" — نظرة شاملة على كل الفترات المرفوعة (مرتّبة زمنياً) ──
  let allPeriodsHtml = '';
  if (periods.length >= 3) {
    const sortedP = [...periods].map((p,idx)=>({p, idx, score:periodDateScore(p.label)}));
    const allDated = sortedP.every(x=>x.score>0);
    if (allDated) sortedP.sort((a,b)=>a.score-b.score); // تصاعدي زمنياً (الأقدم → الأحدث)
    const rowsData = sortedP.map(x => {
      const dd = x.p.data;
      return { label:x.p.label, rx:dd.totalRows||0, docs:dd.doctors.length, drugs:dd.drugs.length, pat:dd.totalPatients||0 };
    });
    const maxRx = Math.max(...rowsData.map(r=>r.rx), 1);
    allPeriodsHtml = `
      <div style="margin-top:22px;padding-top:18px;border-top:1px solid var(--border);">
        <div style="font-size:13px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          📊 كل الفترات (${rowsData.length}) — الاتجاه عبر الزمن
        </div>
        <div style="overflow-x:auto;">
          <table>
            <thead><tr>
              <th>الفترة</th><th>الكتابات</th><th>التغيّر</th><th>الأطباء</th><th>الأصناف</th><th>المرضى</th>
            </tr></thead>
            <tbody>
              ${rowsData.map((r,i)=>{
                const prev = i>0 ? rowsData[i-1].rx : null;
                let chHtml = '<span style="color:var(--text-muted);">—</span>';
                if(prev!==null && prev>0){
                  const ch=((r.rx-prev)/prev*100);
                  const up=ch>=0;
                  chHtml=`<span style="color:${up?'var(--teal-l)':'var(--rose-l)'};font-weight:800;">${up?'↑':'↓'} ${Math.abs(ch).toFixed(1)}%</span>`;
                }
                const barW=(r.rx/maxRx*100).toFixed(0);
                return `<tr>
                  <td style="font-weight:700;">${escapeHtml(r.label)}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span class="num-font" style="font-weight:800;color:var(--violet-l);min-width:48px;">${fmt(r.rx)}</span>
                      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;min-width:60px;"><div style="height:100%;width:${barW}%;background:var(--gv,var(--violet-l));border-radius:3px;"></div></div>
                    </div>
                  </td>
                  <td>${chHtml}</td>
                  <td class="num-font">${fmt(r.docs)}</td>
                  <td class="num-font">${fmt(r.drugs)}</td>
                  <td class="num-font">${fmt(r.pat)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin-top:10px;">💡 التغيّر محسوب مقابل الفترة السابقة لها زمنياً. للمقارنة التفصيلية بين فترتين محددتين، استخدم القوائم بالأعلى.</div>
      </div>`;
  }

  document.getElementById('tc-result').innerHTML = legendHtml + kpiHtml + allPeriodsHtml + insightsHtml + docTableHtml + drugTableHtml;
}

/* ══════════════════════════════════════════
   GODMODE V7 — Keyboard Shortcuts & Final Polish
══════════════════════════════════════════ */

/* ── KEYBOARD SHORTCUTS ── */
document.addEventListener('keydown', e => {
  if(!_appShellUnlocked||modalBg.classList.contains('show')||document.getElementById('plShareOverlay')||document.getElementById('phShareOverlay')||document.getElementById('periodPopup')?.classList.contains('open'))return;
  // Ctrl/Cmd+K → Global Search
  if ((e.ctrlKey||e.metaKey) && e.key==='k') {
    e.preventDefault();
    const gs = document.getElementById('globalSearch');
    if (gs) { gs.focus(); gs.select(); }
    return;
  }
  // Escape → close transient navigation UI
  if (e.key==='Escape') {
    setGlobalSearchOpen(false);
    if(_mobileSidebarOpen)closeSidebar();
    return;
  }
  // ? → toggle hotkey panel
  if (e.key==='?' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName!=='INPUT') {
    const hp=document.getElementById('hotkeyPanel');
    if(hp) hp.classList.toggle('show');
    return;
  }
  // 1-9 → switch primary sidebar sections (when not in an input)
  if (!e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement.tagName!=='INPUT' && document.activeElement.tagName!=='SELECT') {
    const n=parseInt(e.key);
    if (n>=1 && n<=9) {
      const items=[...document.querySelectorAll('.sb-nav-item[data-tab]')];
      if(items[n-1]){e.preventDefault();items[n-1].click();items[n-1].focus();}
    }
  }
});

/* ── EXPORT EXCEL ── */
document.getElementById('exportXlsxBtn').onclick = () => {
  const loaded=BRANCHES.filter(b=>STATE.data[b]);
  if(loaded.length&&!confirmSensitiveExport('ملف Excel'))return;
  const anonymize=getExportPrivacyMode()!=='full';
  showLoad();
  try{
    const wb=XLSX.utils.book_new();
    // Raw data
    const head=['الفرع','الطبيب','القسم','الدواء','الحالة','رقم المريض','اسم المريض','رقم الأمر'];
    const rows=[head];
    loaded.forEach(b=>sanitizeRowsForExport(STATE.data[b].rows,anonymize).forEach(r=>rows.push([BRANCH_LABELS[b],r.doctor,r.section,r.service,r.status,r.patient,r.patientName,r.orderNo].map(exportCell))));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'البيانات');
    // Doctors
    const dh=['الفرع','الطبيب','القسم','الكتابات','الأصناف','المرضى'];
    const dr=[dh];
    loaded.forEach(b=>STATE.data[b].doctors.forEach(d=>dr.push([BRANCH_LABELS[b],exportCell(d.name),exportCell(d.section||''),d.total,d.uniqueDrugs,d.patients])));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(dr),'الأطباء');
    // Drugs
    const drh=['الفرع','الدواء','الكتابات','الأطباء','المرضى'];
    const dru=[drh];
    loaded.forEach(b=>STATE.data[b].drugs.forEach(d=>dru.push([BRANCH_LABELS[b],exportCell(d.name),d.total,d.doctorCount,d.patients])));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(dru),'الأدوية');
    // Private Label
    const plh=['المنتج','T1','T2','T3','الإجمالي'];
    const pld=[plh];
    PRIVATE_LABEL.forEach(prod=>{
      const bt={T1:0,T2:0,T3:0};
      loaded.forEach(b=>STATE.data[b].drugs.filter(x=>findPrivateLabelProduct(x.name)?.key===prod.key).forEach(m=>bt[b]+=m.total));
      pld.push([exportCell(prod.name),bt.T1,bt.T2,bt.T3,bt.T1+bt.T2+bt.T3]);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(pld),'Private Label');
    // PureHerb
    const phd=[['المنتج','T1','T2','T3','الإجمالي']];
    PUREHERB_PRODUCTS.forEach(prod=>{
      const bt={T1:0,T2:0,T3:0};
      loaded.forEach(b=>STATE.data[b].drugs.filter(x=>findPureHerbProduct(x.name)?.key===prod.key).forEach(item=>bt[b]+=item.total));
      phd.push([exportCell(prod.name),bt.T1,bt.T2,bt.T3,bt.T1+bt.T2+bt.T3]);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(phd),'PureHerb');
    // Period history and extraction quality
    const periodRows=[['الفرع','الفترة','عدد الصفوف','المصدر','الصفوف المرفوضة','الملف الرئيسي']];
    BRANCHES.forEach(b=>(STATE.periods[b]||[]).forEach((period,index)=>periodRows.push([
      BRANCH_LABELS[b],exportCell(sanitizedPeriodLabel(period.label,index,anonymize)),period.rows?.length||0,exportCell(period.parseMeta?.source||''),period.parseMeta?.rejectedRows||0,period._main?'نعم':'لا'
    ])));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(periodRows),'الفترات');
    const qualityRows=[['الفرع','النتيجة','المصدر','المقبول','المرفوض','المكرر','التحذيرات']];
    loaded.forEach(b=>{const q=STATE.quality[b];if(q)qualityRows.push([BRANCH_LABELS[b],q.score,exportCell(q.source||''),q.acceptedRows||0,q.rejectedRows||0,q.duplicates||0,exportCell((q.warnings||[]).join(' | '))]);});
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(qualityRows),'جودة البيانات');
    // Inventory and manual aged-medicine reports
    const nearRows=[['المصدر','تاريخ المصدر','الكود','الصنف','الفرع','تاريخ الانتهاء','الكمية','التكلفة','القيمة']];
    NEAR_EXPIRY_DATA.forEach(item=>nearRows.push([exportCell(NEAR_EXPIRY_SOURCE.label),NEAR_EXPIRY_SOURCE.asOf||'غير مسجل',exportCell(item.code),exportCell(item.name),item.branch,item.expiry,item.qty,item.cost,item.total]));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(nearRows),'قرب الانتهاء');
    const agedRows=[['السنة','الشهر','T1','T2','T3','الإجمالي']];
    ['y2025','y2026'].forEach(year=>AGEDMEDS_DATA.months.forEach((month,index)=>{
      const t1=AGEDMEDS_DATA[year].T1[index]||0,t2=AGEDMEDS_DATA[year].T2[index]||0,t3=AGEDMEDS_DATA[year].T3[index]||0;
      agedRows.push([year.slice(1),exportCell(month),t1,t2,t3,t1+t2+t3]);
    }));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(agedRows),'الأدوية الآجلة');
    const agedSpecialtyRows=[['التخصص','2025','2026']];
    agedMedsSpecialtyNames().forEach(name=>{
      const y25=AGEDMEDS_DATA.specialties2025.find(row=>sameEntity(row[0],name))?.[1]||0,y26=AGEDMEDS_DATA.specialties2026.find(row=>sameEntity(row[0],name))?.[1]||0;
      agedSpecialtyRows.push([exportCell(name),y25,y26]);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(agedSpecialtyRows),'الآجلة حسب التخصص');
    const dailyRows=[['التاريخ','الفرع','الكتابات','الأطباء','الأدوية']];
    Object.keys(DT.store||{}).sort().forEach(date=>BRANCHES.forEach(branch=>{const entry=DT.store[date]?.[branch];if(entry)dailyRows.push([date,BRANCH_LABELS[branch],entry.rows?.length||0,entry.docs||0,entry.drugs||0]);}));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(dailyRows),'المتابعة اليومية');
    XLSX.writeFile(wb,'PharmaDash-'+(anonymize?'مجهول-':'')+PharmaCore.localDateKey()+'.xlsx');
    toast('تم التصدير إلى Excel ✓');
  }catch(e){toast('فشل التصدير: '+e.message,'error');}
  finally{hideLoad();}
};

/* ── HOTKEY PANEL HTML ── */
document.body.insertAdjacentHTML('beforeend',`
  <div class="hotkey-panel" id="hotkeyPanel">
    <div style="font-size:12px;font-weight:800;margin-bottom:10px;color:var(--text)">⌨️ اختصارات لوحة المفاتيح</div>
    <div class="hotkey-row"><span class="hotkey-desc">بحث سريع</span><span class="kbd">Ctrl+K</span></div>
    <div class="hotkey-row"><span class="hotkey-desc">غلق / إلغاء</span><span class="kbd">Esc</span></div>
    <div class="hotkey-row"><span class="hotkey-desc">التنقل بين التابات</span><span class="kbd">1-9</span></div>
    <div class="hotkey-row"><span class="hotkey-desc">عرض هذه القائمة</span><span class="kbd">?</span></div>
  </div>`);

/* ══════════════════════════════════════════
   V8 FEATURE ENGINES
══════════════════════════════════════════ */

/* ── 1. BUBBLE CHART — الأطباء ── */
function drawBubble(containerId, doctors, onClick) {
  const wrap = document.getElementById(containerId);
  if (!wrap || !doctors.length) return;
  const W = wrap.offsetWidth || 600, H = 400;
  const max = doctors[0].total, min = Math.min(...doctors.map(d=>d.total));
  const range = max - min || 1;
  const COLORS = ['#6c63ff','#00d4a0','#ff4d6d','#d97706','#06b6d4','#7c3aed','#db2777','#3b82f6','#84cc16','#ef4444','#f59e0b','#22d3ee','#6d28d9'];

  // Get unique sections for y-axis
  const sections = [...new Set(doctors.slice(0,40).map(d=>d.section||'أخرى'))];
  const secIdx = {};sections.forEach((s,i)=>secIdx[s]=i);
  const nSec = sections.length || 1;

  // Bubble layout: x = rank, y = section, r = total
  const top = doctors.slice(0,40);
  const padding = {l:60,r:20,t:20,b:40};
  const plotW = W - padding.l - padding.r;
  const plotH = H - padding.t - padding.b;
  const cols = Math.ceil(Math.sqrt(top.length));

  function rScale(v) { return 10 + ((v - min) / range) * 28; }

  // SVG bubble chart
  const nodes = top.map((d, i) => {
    const sec = d.section || 'أخرى';
    const sy = secIdx[sec] !== undefined ? secIdx[sec] : 0;
    const sx = i % cols;
    const x = padding.l + (sx / cols) * plotW + (plotW / cols / 2);
    const y = padding.t + (sy / nSec) * plotH + (plotH / nSec / 2) + (Math.random() - 0.5) * 14;
    const r = rScale(d.total);
    const col = COLORS[i % COLORS.length];
    return { d, x, y, r, col };
  });

  // Y-axis section labels
  const yLabels = sections.map((s, i) => {
    const y = padding.t + (i / nSec) * plotH + (plotH / nSec / 2);
    return `<text x="${padding.l - 8}" y="${y}" text-anchor="end" dominant-baseline="middle"
      font-size="10" fill="var(--text-muted)" font-family="IBM Plex Sans Arabic">${s.slice(0,14)}</text>`;
  }).join('');

  // Gridlines
  const gridLines = sections.map((_, i) => {
    const y = padding.t + (i / nSec) * plotH;
    return `<line x1="${padding.l}" y1="${y}" x2="${W - padding.r}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
  }).join('');

  const bubbles = nodes.map((n, i) => `
    <g class="bubble-node" data-idx="${i}" style="cursor:pointer;" onclick="__bubbleClick(${i})">
      <circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.col}" opacity="0.82"
        stroke="${n.col}" stroke-width="1.5"/>
      ${n.r > 16 ? `<text x="${n.x}" y="${n.y}" text-anchor="middle" dominant-baseline="middle"
        font-size="${Math.min(10, n.r/2)}" fill="#fff" font-weight="700" font-family="IBM Plex Sans Arabic"
        style="pointer-events:none;">${fmt(n.d.total)}</text>` : ''}
    </g>`).join('');

  wrap.innerHTML = `
    <div class="bubble-tooltip" id="bubbleTip" style="opacity:0;"></div>
    <div class="bubble-wrap">
      <svg class="bubble-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        ${gridLines}${yLabels}${bubbles}
      </svg>
    </div>`;

  // Store data for tooltip + click
  window.__bubbleNodes = nodes;
  window.__bubbleClick = (i) => {
    const n = nodes[i];
    if (n && onClick) onClick(n.d);
  };

  // Tooltip on SVG mousemove
  const svg = wrap.querySelector('.bubble-svg');
  const tip = wrap.querySelector('#bubbleTip');
  svg.addEventListener('mousemove', e => {
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    const hit = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < n.r + 4);
    if (hit) {
      tip.style.opacity = '1';
      tip.style.left = (e.clientX - wrap.getBoundingClientRect().left + 12) + 'px';
      tip.style.top = (e.clientY - wrap.getBoundingClientRect().top - 40) + 'px';
      tip.innerHTML = `<strong>${escapeHtml(hit.d.name)}</strong><br>
        <span style="color:var(--text-dim);font-size:11px;">${escapeHtml(hit.d.section||'')}</span><br>
        <span style="color:var(--teal-l);">الكتابات: ${fmt(hit.d.total)}</span>`;
    } else {
      tip.style.opacity = '0';
    }
  });
  svg.addEventListener('mouseleave', () => { if(tip) tip.style.opacity='0'; });
}

/* View toggle: bar ↔ bubble */
function switchDocView(mode, btn) {
  document.querySelectorAll('.vt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const wrap = document.getElementById('docChartWrap');
  const docs = window._v8DocsData || [];
  if (!wrap || !docs.length) return;
  if (mode === 'bubble') {
    destroyChart('cTopDocs');
    wrap.innerHTML = `<div id="bubbleContainer" style="height:400px;position:relative;"></div>`;
    drawBubble('bubbleContainer', docs, d => showDoctorMulti(d.name));
  } else {
    wrap.innerHTML = `<div class="chart-box"><canvas id="cTopDocs"></canvas></div>`;
    destroyChart('cTopDocs');
    drawBar('cTopDocs', docs.map(x=>({label:x.name.slice(0,18),v:x.total})), '#6c63ff', i=>showDoctorMulti(docs[i].name));
  }
}

/* ── 2. HEATMAP — الأطباء × الأقسام ── */
function renderHeatmap(d, secsData, docsData) {
  const wrap = document.getElementById('heatmapWrap');
  if (!wrap) return;

  // Build section × doctor matrix (top 12 sections, top 15 doctors)
  const topSecs = secsData.slice(0, 10).map(s => s.name);
  const topDocs = docsData.slice(0, 20);
  if (!topSecs.length || !topDocs.length) { wrap.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">لا توجد بيانات كافية</div>'; return; }

  // Build matrix: doc → section → count
  const matrix = {};
  topDocs.forEach(doc => {
    matrix[doc.name] = {};
    topSecs.forEach(sec => { matrix[doc.name][sec] = 0; });
  });

  // Fill from all loaded branches
  const loaded = BRANCHES.filter(b => STATE.data[b]);
  loaded.forEach(b => {
    STATE.data[b].doctors.forEach(doc => {
      if (!matrix[doc.name]) return;
      // Find section totals — use section as key
      if (topSecs.includes(doc.section)) {
        matrix[doc.name][doc.section] = (matrix[doc.name][doc.section] || 0) + doc.total;
      }
    });
  });

  // For each doc, use their overall section
  topDocs.forEach(doc => {
    if (topSecs.includes(doc.section)) {
      // already filled per branch; add total if not set
      if (Object.values(matrix[doc.name]).every(v=>v===0)) {
        matrix[doc.name][doc.section] = doc.total;
      }
    }
  });

  // Compute max for color scale
  let maxVal = 0;
  topDocs.forEach(doc => topSecs.forEach(sec => { maxVal = Math.max(maxVal, matrix[doc.name]?.[sec] || 0); }));
  if (!maxVal) maxVal = 1;

  function cellColor(v) {
    if (!v) return null;
    const t = v / maxVal;
    // interpolate: low=teal dim, high=violet bright
    const r = Math.round(99 + (108 - 99) * t);
    const g = Math.round(102 - 102 * t);
    const b2 = Math.round(241 - (241 - 255) * t);
    const a = 0.15 + t * 0.75;
    return `rgba(${r},${g},${b2},${a})`;
  }

  // Column headers (sections)
  const colHeaders = `<div class="heatmap-label-row">
    <div style="width:120px;"></div>
    ${topSecs.map(s=>`<div class="heatmap-label" title="${escapeHtml(s)}">${s.slice(0,6)}</div>`).join('')}
  </div>`;

  // Rows (doctors)
  const rows = topDocs.map(doc => {
    const cells = topSecs.map(sec => {
      const v = matrix[doc.name]?.[sec] || 0;
      const bg = v ? cellColor(v) : null;
      const style = bg ? `background:${bg};color:${v/maxVal>0.6?'#fff':'var(--text-dim)'};` : '';
      const cls = v ? '' : 'empty';
      return `<div class="heatmap-cell ${cls}" style="${style}"
        onclick="showDoctorMulti('${escapeAttr(doc.name)}')"
        title="${escapeHtml(doc.name)} — ${escapeHtml(sec)}: ${fmt(v)}"
        >${v ? fmt(v) : '·'}</div>`;
    }).join('');
    return `<div class="heatmap-row">
      <div class="heatmap-label row-label" title="${escapeHtml(doc.name)}">${doc.name.split(' ')[0].slice(0,10)}</div>
      ${cells}
    </div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="heatmap-wrap">
      ${colHeaders}
      ${rows}
      <div class="heatmap-legend">
        <span>0</span>
        <div class="heatmap-legend-bar"></div>
        <span>${fmt(maxVal)}</span>
        <span style="margin-right:16px;color:var(--text-muted);">كتابة</span>
      </div>
    </div>`;
}

/* ── 3. SPARKLINE FULL (for mini modal) ── */
function drawSparklineFull(id, data, color) {
  const canvas = document.getElementById(id);
  if (!canvas || data.length < 2) return;
  const W = canvas.parentElement.offsetWidth || 200, H = 80;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,W,H);
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts = data.map((v,i)=>({x:(i/(data.length-1))*W, y:H-((v-min)/range)*(H-12)-6}));
  // gradient fill
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,color+'55');grad.addColorStop(1,color+'08');
  ctx.beginPath();ctx.moveTo(pts[0].x,H);
  pts.forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.lineTo(pts[pts.length-1].x,H);ctx.closePath();
  ctx.fillStyle=grad;ctx.fill();
  // smooth line
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length-1;i++){
    const cx=(pts[i].x+pts[i+1].x)/2, cy=(pts[i].y+pts[i+1].y)/2;
    ctx.quadraticCurveTo(pts[i].x,pts[i].y,cx,cy);
  }
  ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);
  ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.stroke();
  // dots
  pts.forEach((p,i)=>{
    ctx.beginPath();ctx.arc(p.x,p.y,i===pts.length-1?4:2.5,0,Math.PI*2);
    ctx.fillStyle=i===pts.length-1?color:color+'99';ctx.fill();
  });
  // value labels
  ctx.fillStyle=color;ctx.font='bold 10px "IBM Plex Sans Arabic"';ctx.textAlign='center';
  pts.forEach((p,i)=>ctx.fillText(data[i].toLocaleString(),p.x,p.y-8));
}

/* ── THEME: handled by toggleTheme() ── */

/* ══ SIDEBAR NAV ══ */

/* ── Visual polish: spotlight hover on cards ── */
document.addEventListener('pointermove', function(e){
  try{
    var c = e.target && e.target.closest ? e.target.closest('.card') : null;
    if(!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }catch(err){}
},{passive:true});

/* ── Visual polish: KPI count-up animation ── */
function animateNums(root){
  try{
    if(!root) return;
    if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var els = root.querySelectorAll('.kpi-num,.kpi-hero,.compare-val,.sb-val,.detail-card .v');
    els.forEach(function(el){
      var txt = (el.textContent || '').trim();
      if(!/^[\d]+$/.test(txt)) return;
      var target = parseInt(txt.replace(/,/g,''), 10);
      if(!isFinite(target) || target <= 1 || target > 100000000) return;
      if(el._cuRun) return;
      el._cuRun = true;
      var t0 = performance.now(), dur = 620;
      function stepFn(t){
        var pr = Math.min(1, (t - t0) / dur);
        pr = 1 - Math.pow(1 - pr, 3);
        el.textContent = Math.round(target * pr).toLocaleString('en-US');
        if(pr < 1){ requestAnimationFrame(stepFn); } else { el._cuRun = false; }
      }
      requestAnimationFrame(stepFn);
    });
  }catch(err){}
}

function sidebarNav(el, panel) {
  // Track active panel globally
  window._activePanel = panel;
  // Update sidebar active state
  document.querySelectorAll('.sb-nav-item').forEach(i=>{i.classList.remove('active');i.removeAttribute('aria-current');});
  el.classList.add('active');
  el.setAttribute('aria-current','page');
  // Sync hidden tabs + panels
  document.querySelectorAll('.tab').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-selected','false');});
  document.querySelectorAll('.panel').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-hidden','true');});
  const tabBtn = document.querySelector('.tab[data-panel="'+panel+'"]');
  if (tabBtn){tabBtn.classList.add('active');tabBtn.setAttribute('aria-selected','true');}
  const panelEl = document.getElementById('panel-'+panel);
  if(panelEl){panelEl.classList.add('active');panelEl.setAttribute('aria-hidden','false');}
  pruneChartsForPanel(panel);
  document.getElementById('branchPickerCard').style.display =
    (NO_BRANCH_TABS.includes(panel))?'none':'block';
  updateDataContext();
  renderActive();
  try{ setTimeout(function(){ animateNums(document.getElementById('panel-'+panel)); }, 40); }catch(e){}
  // العودة لأعلى الصفحة عند تبديل القسم
  const mainEl = document.querySelector('.main-content') || document.querySelector('main') || window;
  try{ (mainEl.scrollTo ? mainEl : window).scrollTo({top:0, behavior:'instant'}); }catch(e){ window.scrollTo(0,0); }
  // Close mobile sidebar
  if(_mobileSidebarOpen)closeSidebar(false);
}
function toggleSidebar() {
  const sb = document.getElementById('mainSidebar');
  const isMobile = window.matchMedia('(max-width:700px)').matches;
  if(isMobile) {
    if(sb.classList.contains('mobile-open')) { closeSidebar(); } else { openSidebar(); }
  } else {
    sb.classList.toggle('collapsed');
    const expanded=!sb.classList.contains('collapsed'),btn=document.querySelector('.mob-menu-btn');
    btn?.setAttribute('aria-expanded',String(expanded));btn?.setAttribute('aria-label',expanded?'إخفاء قائمة التنقل':'إظهار قائمة التنقل');
  }
}
function openSidebar() {
  if(!_appShellUnlocked)return;
  _mobileSidebarOpen=true;
  document.getElementById('mainSidebar').classList.add('mobile-open');
  const overlay=document.getElementById('sbOverlay');overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');
  syncAppShellAccessibility();
  const btn=document.querySelector('.mob-menu-btn');btn?.setAttribute('aria-expanded','true');btn?.setAttribute('aria-label','إغلاق قائمة التنقل');
  document.querySelector('.sb-nav-item.active')?.focus();
}
function closeSidebar(restoreFocus) {
  const wasOpen=_mobileSidebarOpen;
  _mobileSidebarOpen=false;
  document.getElementById('mainSidebar').classList.remove('mobile-open');
  const overlay=document.getElementById('sbOverlay');overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');
  syncAppShellAccessibility();
  const btn=document.querySelector('.mob-menu-btn');btn?.setAttribute('aria-expanded','false');btn?.setAttribute('aria-label','فتح قائمة التنقل');
  if(wasOpen&&restoreFocus!==false)btn?.focus();
}

/* Sync sidebar badges when tab badges update */
function updateSidebarBadges() {
  const d = STATE.active ? STATE.data[STATE.active] : null;
  if (!d) return;
  const docBadge = document.getElementById('sb-badge-doctors');
  const drBadge  = document.getElementById('sb-badge-drugs');
  const secBadge = document.getElementById('sb-badge-sections');
  if (docBadge) docBadge.textContent = fmt(d.doctors.length);
  if (drBadge)  drBadge.textContent  = fmt(d.drugs.length);
  if (secBadge) secBadge.textContent = fmt(d.sections.length);
}
// Patch renderActive to also update sidebar badges
const __origRenderActiveForBadges = renderActive;
window.renderActive = function() {
  __origRenderActiveForBadges();
  updateSidebarBadges();
};


/* ══════════════════════════════════════════
   LOGIN SYSTEM
══════════════════════════════════════════ */
/* كلمات المرور مخزّنة كـ SHA-256 (hex) حتى لا تظهر النصوص الصريحة في مصدر الصفحة.
   ملاحظة: هذه بوابة عرض على جهة العميل فقط لملف HTML ثابت، وليست حماية خادم حقيقية. */
const USERS = {
  'elsayed':  { hash: '0e8aea9b26ebdc3a3c2d02fd44dd58580cc9a02948f565286e8bf002927b6015', name: 'Dr. Elsayed Hassan',  role: 'مدير تطوير الأعمال' },
  'admin':    { hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', name: 'Admin',               role: 'مدير النظام' },
  'manager':  { hash: '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5', name: 'المدير',              role: 'مدير قطاع الصيدليات' },
};
async function _sha256Hex(s){
  const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
let _dataUnlocked=false,_loginFailures=0,_loginLockedUntil=0;
async function unlockStoredData(){
  if(_dataUnlocked) return;
  _dataUnlocked=true;
  try{
    const restored=await loadSavedData();
    if(restored){renderAll();toast('تم استرجاع البيانات المحفوظة');}
  }catch(e){_dataUnlocked=false;console.error('restore after login',e);toast('تعذر استرجاع البيانات المحفوظة','error');}
}
function lockInMemoryData(){
  cancelActiveUploads();
  _dataUnlocked=false;
  BRANCHES.forEach(b=>{STATE.data[b]=null;STATE.periods[b]=[];STATE.quality[b]=null;if(typeof _resetBranchUI==='function')_resetBranchUI(b);});
  STATE.active=null;
  if(typeof DT!=='undefined')DT.store={};
  Object.keys(charts||{}).forEach(destroyChart);
  invalidateGlobalSearch();
  renderAll();
}


function toggleTheme(){
  const html=document.documentElement;
  const isLight=html.getAttribute('data-theme')==='light';
  if(isLight){
    html.removeAttribute('data-theme');
    try{localStorage.setItem('rx-theme','dark');}catch(e){}
  }else{
    html.setAttribute('data-theme','light');
    try{localStorage.setItem('rx-theme','light');}catch(e){}
  }
  updateThemeIcon();
  renderActive();
}
function updateThemeIcon(){
  var btn=document.getElementById('themeBtn');
  if(!btn) return;
  var isLight=document.documentElement.getAttribute('data-theme')==='light';
  btn.textContent=isLight?'🌙':'☀️';
  btn.title=isLight?'الوضع الداكن':'الوضع الفاتح';
}
function updateUserUI(user){
  if(!user)return;
  const name=document.querySelector('.sb-user-name'),role=document.querySelector('.sb-user-role'),avatar=document.querySelector('.sb-avatar');
  if(name)name.textContent=user.name||user.username||'مستخدم';
  if(role)role.textContent=user.role||'';
  if(avatar)avatar.textContent=PharmaCore.normalizeWhitespace(user.name||user.username).split(' ').slice(0,2).map(part=>part[0]||'').join('').toUpperCase()||'U';
}

async function doLogin() {
  const u = document.getElementById('loginUser').value.trim().toLowerCase();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  const rec = USERS[u];
  if(Date.now()<_loginLockedUntil){
    const seconds=Math.ceil((_loginLockedUntil-Date.now())/1000);
    err.textContent='محاولات كثيرة. حاول بعد '+seconds+' ثانية';
    err.classList.add('show');
    return;
  }
  let ok = false;
  if (rec) { try { ok = (await _sha256Hex(p)) === rec.hash; } catch (e) { console.error('login hash', e); ok = false; } }
  if (ok) {
    _loginFailures=0;_loginLockedUntil=0;
    err.textContent='اسم المستخدم أو كلمة المرور غير صحيحة';
    err.classList.remove('show');
    /* لا نخزّن كلمة المرور — فقط بيانات العرض */
    sessionStorage.setItem('pharmdash_user', JSON.stringify({ username: u, name: rec.name, role: rec.role }));
    updateUserUI({username:u,name:rec.name,role:rec.role});
    const screen = document.getElementById('loginScreen');
    screen.style.transition = 'opacity .4s ease';
    screen.style.opacity = '0';
    setTimeout(() => { screen.style.display = 'none'; }, 400);
    syncAppShellAccessibility(true);
    await unlockStoredData();
    document.getElementById('mainContent')?.focus();
  } else {
    _loginFailures++;
    if(_loginFailures>=5){_loginLockedUntil=Date.now()+30000;_loginFailures=0;err.textContent='محاولات كثيرة. تم الإيقاف 30 ثانية';}
    else err.textContent='اسم المستخدم أو كلمة المرور غير صحيحة';
    err.classList.add('show');
    document.getElementById('loginPass').value = '';
    document.getElementById('loginPass').focus();
  }
}

async function doLogout() {
  sessionStorage.removeItem('pharmdash_user');
  const pendingSave=flushSaveData();
  lockInMemoryData();
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  const screen = document.getElementById('loginScreen');
  closeSidebar(false);
  setSaveStatus('idle','جاهز');
  syncAppShellAccessibility(false);
  screen.style.opacity = '0';
  screen.style.display = 'flex';
  requestAnimationFrame(() => { screen.style.transition = 'opacity .3s ease'; screen.style.opacity = '1';document.getElementById('loginUser')?.focus(); });
  await pendingSave;
}

// Allow Enter key on login
document.addEventListener('DOMContentLoaded', () => {
  ['loginUser','loginPass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  });
  const privacy=document.getElementById('exportPrivacyMode');
  privacy?.addEventListener('change',()=>{
    if(privacy.value==='full'&&!confirm('الوضع الكامل يضم بيانات مرضى حساسة في أي تصدير أو مشاركة. تفعيله؟'))privacy.value='anonymized';
    privacy.classList.toggle('sensitive',privacy.value==='full');
  });
  // Check if already logged in this session
  if (window.__PHARMADASH_SHARED__ || sessionStorage.getItem('pharmdash_user')) {
    document.getElementById('loginScreen').style.display = 'none';
    syncAppShellAccessibility(true);
    try{updateUserUI(window.__PHARMADASH_SHARED__?{name:'عرض مشترك',role:window.__EMBEDDED_RX__?.privacy?.anonymized?'بيانات مجهولة الهوية':'بيانات حساسة'}:JSON.parse(sessionStorage.getItem('pharmdash_user')||'null'));}catch(e){}
    /* استعادة البيانات تتم في معالج window.load عبر loadSavedData() */
  }else{syncAppShellAccessibility(false);document.getElementById('loginUser')?.focus();}
});

/* ══════════════════════════════════════════
   AUTO-SAVE TO localStorage
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   الحفظ/الاستعادة عبر IndexedDB
   ── يخزّن الفترات (rows) + المتابعة اليومية للفرع النشط
   ── IndexedDB يتحمّل الملفات الكبيرة (بلا حد 5MB الخاص بـ localStorage)
   ── الحفظ مؤجَّل (debounced) لتفادي الكتابة المتكررة
══════════════════════════════════════════ */
const _IDB_NAME='pharmdash',_IDB_STORE='kv',_IDB_KEY='state',_IDB_VERSION=2;
let _idbDbPromise=null;
function _idbAvailable(){ try{ return typeof indexedDB!=='undefined' && indexedDB!==null; }catch(e){ return false; } }
function _idbOpen(){
  if(_idbDbPromise)return _idbDbPromise;
  _idbDbPromise=new Promise((res,rej)=>{
    const rq=indexedDB.open(_IDB_NAME,_IDB_VERSION);
    rq.onupgradeneeded=()=>{const db=rq.result;if(!db.objectStoreNames.contains(_IDB_STORE))db.createObjectStore(_IDB_STORE);};
    rq.onsuccess=()=>{
      const db=rq.result;
      db.onversionchange=()=>{db.close();_idbDbPromise=null;};
      res(db);
    };
    rq.onblocked=()=>{_idbDbPromise=null;rej(new Error('قاعدة البيانات مفتوحة في تبويب قديم — أغلق التبويب وأعد المحاولة'));};
    rq.onerror=()=>{_idbDbPromise=null;rej(rq.error||new Error('تعذر فتح التخزين المحلي'));};
  });
  return _idbDbPromise;
}
function _idbPut(key,val){return _idbOpen().then(db=>new Promise((res,rej)=>{const tx=db.transaction(_IDB_STORE,'readwrite');tx.objectStore(_IDB_STORE).put(val,key);tx.oncomplete=()=>res();tx.onabort=tx.onerror=()=>rej(tx.error||new Error('فشل الحفظ المحلي'));}));}
function _idbGet(key){return _idbOpen().then(db=>new Promise((res,rej)=>{const tx=db.transaction(_IDB_STORE,'readonly'),r=tx.objectStore(_IDB_STORE).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error||new Error('فشل قراءة التخزين المحلي'));}));}
function _idbDelete(key){return _idbOpen().then(db=>new Promise((res,rej)=>{const tx=db.transaction(_IDB_STORE,'readwrite');tx.objectStore(_IDB_STORE).delete(key);tx.oncomplete=()=>res();tx.onabort=tx.onerror=()=>rej(tx.error||new Error('فشل مسح التخزين المحلي'));}));}

/* لقطة قابلة للتخزين: الصفوف الخام فقط (الـ aggregate يُعاد حسابه عند الاستعادة) */
function _buildSnapshot(){
  const snap={v:PharmaCore.SNAPSHOT_SCHEMA_VERSION,active:STATE.active,periods:{},dt:(typeof DT!=='undefined'&&DT.store)?DT.store:{}};
  BRANCHES.forEach(b=>{
    snap.periods[b]=(STATE.periods[b]||[]).map(p=>({ id:p.id, label:p.label, rows:p.rows, parseMeta:p.parseMeta||null, _main:!!p._main }));
  });
  return snap;
}
function setSaveStatus(state,text){
  const el=document.getElementById('saveStatus');if(!el)return;
  el.dataset.state=state;el.textContent=text;
}
async function _sealSnapshot(snapshot){
  const sealed={...snapshot,savedAt:new Date().toISOString()};
  const json=JSON.stringify(sealed),bytes=new TextEncoder().encode(json);
  if(bytes.byteLength>PharmaCore.MAX_SNAPSHOT_BYTES)throw new Error('حجم البيانات المحفوظة أكبر من الحد الآمن (150MB)');
  if(typeof crypto!=='undefined'&&crypto.subtle){
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    sealed.integrity={algorithm:'SHA-256',digest:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')};
  }
  return sealed;
}
async function _verifySnapshotIntegrity(snapshot){
  if(!snapshot?.integrity?.digest)return true;
  if(typeof crypto==='undefined'||!crypto.subtle)throw new Error('التحقق من سلامة البيانات يحتاج تشغيل اللوحة عبر HTTPS أو localhost');
  const copy={...snapshot};delete copy.integrity;
  const bytes=new TextEncoder().encode(JSON.stringify(copy));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const actual=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  return actual===snapshot.integrity.digest;
}
function _migrateSnapshot(snapshot){
  const migrated={...snapshot,periods:{...(snapshot.periods||{})}};
  if(!migrated.v||migrated.v===1){
    BRANCHES.forEach(b=>{migrated.periods[b]=(migrated.periods[b]||[]).map(p=>({...p,parseMeta:p.parseMeta||null}));});
    migrated.v=2;
  }
  return migrated;
}
let _saveTimer=null,_saveRevision=0,_lastQueuedRevision=0,_saveChain=Promise.resolve(),_saveErrorShown=false;
function _queueSnapshotWrite(revision){
  const snapshot=_buildSnapshot();
  _lastQueuedRevision=Math.max(_lastQueuedRevision,revision);
  _saveChain=_saveChain.catch(()=>{}).then(async()=>{
    if(revision<_saveRevision)return;
    setSaveStatus('saving','جارٍ الحفظ');
    const sealed=await _sealSnapshot(snapshot);
    await _idbPut(_IDB_KEY,sealed);
    if(revision===_saveRevision)setSaveStatus('saved','محفوظ');
    _saveErrorShown=false;
  }).catch(async e=>{
    console.error('saveData',e);setSaveStatus('error','فشل الحفظ');
    if(!_saveErrorShown){
      _saveErrorShown=true;
      let suffix='';
      try{const est=await navigator.storage?.estimate?.();if(est?.quota)suffix=' ('+Math.round((est.usage||0)/1048576)+' من '+Math.round(est.quota/1048576)+'MB مستخدم)';}catch(_){}
      toast((e?.name==='QuotaExceededError'?'مساحة التخزين غير كافية':'تعذر حفظ البيانات محلياً')+suffix,'error');
    }
  });
  return _saveChain;
}
function saveData(options){
  if(!_idbAvailable()){setSaveStatus('error','التخزين غير متاح');return Promise.resolve();}
  const immediate=options&&options.immediate;
  const revision=++_saveRevision;
  clearTimeout(_saveTimer);
  setSaveStatus('pending','تغييرات غير محفوظة');
  if(immediate||document.visibilityState==='hidden')return _queueSnapshotWrite(revision);
  _saveTimer=setTimeout(()=>{_saveTimer=null;_queueSnapshotWrite(revision);},250);
  return _saveChain;
}
function flushSaveData(){
  if(_saveTimer){clearTimeout(_saveTimer);_saveTimer=null;return _queueSnapshotWrite(_saveRevision);}
  if(_saveRevision>_lastQueuedRevision)return _queueSnapshotWrite(_saveRevision);
  return _saveChain;
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushSaveData();});
window.addEventListener('pagehide',()=>{flushSaveData();});
document.addEventListener('freeze',()=>{flushSaveData();});
/* استعادة واجهة كارت الفرع بعد تحميل الفترات */
function _restoreBranchUI(branch){
  const periods=STATE.periods[branch]||[];
  const meta=document.getElementById('meta-'+branch);
  const card=document.querySelector('.branch-card[data-branch="'+branch+'"]');
  const btn=document.querySelector('[data-upload="'+branch+'"]');
  if(!periods.length){ _resetBranchUI(branch); return; }
  if(card) card.classList.add('has-data');
  if(btn){ btn.textContent='🔄 إعادة'; btn.classList.add('reupload'); }
  if(meta){
    meta.className='meta status-loaded';
    if(periods.length===1){ const total=(periods[0].rows||[]).length; meta.textContent='✓ '+fmt(total)+' وصفة · '+String(periods[0].label||'').slice(0,40); }
    else { const total=periods.reduce((s,p)=>s+(p.rows||[]).length,0); meta.textContent='✓ '+periods.length+' فترة · '+fmt(total)+' وصفة'; }
  }
  if(typeof renderPeriodBadges==='function') renderPeriodBadges(branch);
}
function _resetBranchUI(branch){
  const meta=document.getElementById('meta-'+branch);
  const card=document.querySelector('.branch-card[data-branch="'+branch+'"]');
  const btn=document.querySelector('[data-upload="'+branch+'"]');
  if(meta){ meta.className='meta'; meta.textContent='لم يتم رفع ملف بعد'; }
  if(card) card.classList.remove('has-data');
  if(btn){ btn.textContent='رفع'; btn.classList.remove('reupload'); }
  if(typeof renderPeriodBadges==='function') renderPeriodBadges(branch);
}
async function loadSavedData(){
  if(!_idbAvailable()) return false;
  let snap;
  try{ snap=await _idbGet(_IDB_KEY); }catch(e){ console.error('loadSavedData',e); return false; }
  if(!snap) return false;
  try{
    if(!(await _verifySnapshotIntegrity(snap)))throw new Error('فشل التحقق من سلامة البيانات المحفوظة');
    snap=_migrateSnapshot(snap);
    const validation=PharmaCore.validateSnapshot(snap);
    if(!validation.valid)throw new Error('لقطة التخزين غير صالحة: '+validation.error);
    const prepared=await prepareRestoredPeriods(snap.periods||{});
    commitRestoredSnapshot(prepared,snap.dt||{},snap.active);
    setSaveStatus('saved','محفوظ');
  }catch(e){
    console.error('loadSavedData',e);
    setSaveStatus('error','بيانات تالفة');
    toast((e.message||'تعذر استعادة البيانات المحفوظة')+' — استخدم زر «مسح» لإزالة النسخة التالفة','error');
    return false;
  }
  const hasPeriods=BRANCHES.some(b=>(snap.periods?.[b]||[]).length);
  return hasPeriods || (snap.dt && Object.keys(snap.dt).length>0);
}
async function clearSavedData(){
  try{ if(!confirm('مسح كل البيانات المحفوظة نهائياً؟ لا يمكن التراجع.')) return; }catch(e){}
  cancelActiveUploads();
  clearTimeout(_saveTimer);_saveTimer=null;_saveRevision++;
  try{await _saveChain.catch(()=>{});if(_idbAvailable())await _idbDelete(_IDB_KEY);}catch(e){console.error('clearSavedData',e);toast('تعذر مسح التخزين المحلي','error');return;}
  [AGEDMEDS_KEY,PL_TARGET_KEY,PH_TARGET_KEY,PL_AMOUNT_KEY,'pharmdash_comp_custom_v1'].forEach(key=>{try{localStorage.removeItem(key);}catch(_){}});
  AGEDMEDS_DATA=JSON.parse(JSON.stringify(AGEDMEDS_DEFAULT));
  window._compCustom=null;
  if(window.__PHARMADASH_SHARED__&&window.__EMBEDDED_RX__)window.__EMBEDDED_RX__.business={};
  BRANCHES.forEach(b=>{ STATE.data[b]=null; STATE.periods[b]=[]; STATE.quality[b]=null; _resetBranchUI(b); });
  if(typeof DT!=='undefined') DT.store={};
  STATE.active=null;
  invalidateGlobalSearch();
  clearTimeout(_saveTimer);
  setSaveStatus('idle','جاهز');
  if(typeof renderAll==='function') renderAll();
  toast('تم مسح البيانات المحفوظة');
}

/* ══════════════════════════════════════════
   SEND REPORT
══════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════
   DAILY TRACK — متابعة يومية لكتابات الأطباء
   ─ يخزن ملفات الفروع بتاريخ معين
   ─ يعرض يومي / أسبوعي / شهري + مقارنة الفروع
══════════════════════════════════════════════════════ */

/* تخزين: { "YYYY-MM-DD": { T1: {rows,label,loaded}, T2:…, T3:… } } */
var DT = { store: {}, view: 'daily', selDate: null, selWeek: null, selMonth: null };

/* ── helpers ── */
function dtDateStr(d){ return PharmaCore.localDateKey(d||new Date()); }
function dtToday(){ return dtDateStr(new Date()); }
function dtParseLocal(ds){var p=String(ds||'').split('-').map(Number);return new Date(p[0],(p[1]||1)-1,p[2]||1);}
function dtFmtAr(ds){
  if(!ds) return '—';
  var p=ds.split('-'), mo=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return p[2]+' '+mo[+p[1]-1]+' '+p[0];
}
function dtDayName(ds){
  return ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][dtParseLocal(ds).getDay()];
}
function dtWeekKey(ds){
  var dt=dtParseLocal(ds), day=dt.getDay(), sw=new Date(dt);
  sw.setDate(dt.getDate()-day);
  return dtDateStr(sw);
}
function dtMonthKey(ds){ return ds.slice(0,7); }
function dtAllDates(){ return Object.keys(DT.store).filter(d=>{ var x=DT.store[d]; return x&&(x.T1||x.T2||x.T3); }).sort(); }
function dtBranchColor(b){ return b==='T1'?'var(--violet)':b==='T2'?'var(--teal)':'var(--amber)'; }
function dtBranchLabel(b){ return b==='T1'?'التعاون الأول':b==='T2'?'التعاون الثاني':'التعاون الثالث'; }
function dtAgg(ds){
  var day=DT.store[ds]||{}, a={total:0,docs:new Set(),drugs:new Set(),byB:{}};
  ['T1','T2','T3'].forEach(function(b){
    var x=day[b]; if(!x||!x.loaded) return;
    a.byB[b]={total:(x.rows||[]).length, docs:x.docs||0, drugs:x.drugs||0};
    a.total+=(x.rows||[]).length;
    (x.topDocs||[]).forEach(function(d){ a.docs.add(d.name); });
    (x.topDrugs||[]).forEach(function(d){ a.drugs.add(d.name); });
  });
  return a;
}
function dtProcessRows(rows){
  var docMap={}, drugMap={};
  (rows||[]).forEach(function(r){
    if(r.doctor){ docMap[r.doctor]=(docMap[r.doctor]||0)+1; }
    if(r.service){ drugMap[r.service]=(drugMap[r.service]||0)+1; }
  });
  var topDocs=Object.keys(docMap).map(function(n){ return {name:n,count:docMap[n]}; }).sort(function(a,b){ return b.count-a.count; }).slice(0,20);
  var topDrugs=Object.keys(drugMap).map(function(n){ return {name:n,count:drugMap[n]}; }).sort(function(a,b){ return b.count-a.count; }).slice(0,20);
  return { rows:rows, loaded:true, docs:Object.keys(docMap).length, drugs:Object.keys(drugMap).length, topDocs:topDocs, topDrugs:topDrugs };
}

/* ── Modal لرفع ملف يوم معين ── */
function dtOpenUpload(dateStr){
  _dtUploadVersion++;
  var today=dtToday();
  var ds=dateStr||today;
  var html='<div style="padding:4px 0;">'
    +'<div style="font-size:16px;font-weight:800;margin-bottom:4px;">📅 رفع بيانات يوم</div>'
    +'<div style="font-size:12.5px;color:var(--text-dim);margin-bottom:18px;">اختر التاريخ والفرع ثم ارفع ملف الكتابات (PDF / Excel / CSV)</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">'
    +'<div><div style="font-size:11px;font-weight:700;color:var(--text-dim);margin-bottom:6px;">📆 التاريخ</div>'
    +'<input type="date" id="dtDateInp" value="'+ds+'" max="'+today+'" style="width:100%;padding:9px 12px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-sm);color:var(--text);font-size:13px;font-family:inherit;"></div>'
    +'<div><div style="font-size:11px;font-weight:700;color:var(--text-dim);margin-bottom:6px;">🏥 الفرع</div>'
    +'<select id="dtBranchSel" style="width:100%;padding:9px 12px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:var(--r-sm);color:var(--text);font-size:13px;font-family:inherit;">'
    +'<option value="T1">التعاون الأول (T1)</option>'
    +'<option value="T2">التعاون الثاني (T2)</option>'
    +'<option value="T3">التعاون الثالث (T3)</option>'
    +'</select></div></div>'
    +'<div id="dtDropZone" role="button" tabindex="0" aria-label="رفع ملف المتابعة اليومية" style="border:2px dashed var(--border);border-radius:var(--r-md);padding:32px;text-align:center;cursor:pointer;transition:.2s;background:var(--bg-glass);" '
    +'onclick="document.getElementById(\'dtFileInp\').click()" '
    +'ondragover="event.preventDefault();this.style.borderColor=\'var(--violet)\'" '
    +'ondragleave="this.style.borderColor=\'var(--border)\'" '
    +'ondrop="dtHandleDrop(event)">'
    +'<div style="font-size:32px;margin-bottom:8px;">📄</div>'
    +'<div style="font-size:13px;font-weight:700;color:var(--violet-l);margin-bottom:4px;">اسحب الملف هنا أو اضغط للاختيار</div>'
    +'<div style="font-size:11px;color:var(--text-muted);">PDF · Excel · CSV — كتابات الأطباء</div>'
    +'</div>'
    +'<input type="file" id="dtFileInp" accept=".pdf,.xlsx,.xls,.csv" style="display:none" onchange="dtHandleFile(this.files[0])">'
    +'<div id="dtUpResult" style="display:none;margin-top:12px;padding:12px 16px;background:rgba(13,148,136,.08);border:1px solid rgba(13,148,136,.25);border-radius:var(--r-sm);font-size:12.5px;color:var(--teal-l);"></div>'
    +'<div id="dtUpError" style="display:none;margin-top:12px;padding:12px 16px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.25);border-radius:var(--r-sm);font-size:12.5px;color:var(--rose-l);"></div>'
    +'</div>';
  modalBody.innerHTML=html;openModal('رفع تقرير المتابعة اليومية');
}

function dtHandleDrop(e){
  e.preventDefault();
  document.getElementById('dtDropZone').style.borderColor='var(--border)';
  var f=e.dataTransfer.files[0]; if(f) dtHandleFile(f);
}

async function dtHandleFile(file){
  if(!file) return;
  const version=++_dtUploadVersion;
  var res=document.getElementById('dtUpResult'), err=document.getElementById('dtUpError'),zone=document.getElementById('dtDropZone');
  if(!res||!err||!zone)return;
  res.style.display='none'; err.style.display='none';
  zone.innerHTML='<div style="font-size:24px;animation:spin 1s linear infinite;display:inline-block;">⚙️</div><div id="dtUploadProgress" role="status" aria-live="polite" style="margin-top:8px;font-size:12px;color:var(--text-dim);">جاري القراءة… 0%</div>';
  showLoad();
  try{
    var rows;const ext=validateUploadFile(file);
    const parseOptions={shouldCancel:()=>version!==_dtUploadVersion||!modalBg.classList.contains('show'),onProgress:progress=>{const el=document.getElementById('dtUploadProgress');if(el)el.textContent='جاري القراءة… '+Math.round(progress*100)+'%';}};
    if(ext==='.xlsx'||ext==='.xls') rows=await parseExcel(file,parseOptions);
    else if(ext==='.csv') rows=await parseCSV(file,parseOptions);
    else rows=await parsePDF(file,parseOptions);
    if(version!==_dtUploadVersion||!modalBg.classList.contains('show'))return;
    validateParsedRows(rows);
    var ds=document.getElementById('dtDateInp').value || dtToday();
    var branch=document.getElementById('dtBranchSel').value;
    if(!DT.store[ds]) DT.store[ds]={T1:null,T2:null,T3:null};
    DT.store[ds][branch]=dtProcessRows(rows);
    if(!DT.selDate) DT.selDate=ds;
    saveData();
    renderDailyTrack();
    zone.innerHTML='<div style="font-size:32px;margin-bottom:8px;">📄</div><div style="font-size:13px;font-weight:700;color:var(--violet-l);margin-bottom:4px;">اسحب الملف هنا أو اضغط للاختيار</div><div style="font-size:11px;color:var(--text-muted);">PDF · Excel · CSV — كتابات الأطباء</div>';
    res.textContent='تم رفع '+BRANCH_LABELS[branch]+' — '+dtFmtAr(ds)+' ('+fmt(rows.length)+' كتابة)';
    res.style.display='block';
    toast('✓ '+dtFmtAr(ds)+' '+BRANCH_LABELS[branch]+' — '+fmt(rows.length)+' كتابة');
    setTimeout(closeModal,1500);
  }catch(e){
    if(version===_dtUploadVersion&&err.isConnected){
      zone.innerHTML='<div style="font-size:32px;margin-bottom:8px;">📄</div><div style="font-size:13px;font-weight:700;color:var(--violet-l);margin-bottom:4px;">اسحب الملف هنا أو اضغط للاختيار</div><div style="font-size:11px;color:var(--text-muted);">PDF · Excel · CSV — كتابات الأطباء</div>';
      err.textContent='⚠️ '+e.message; err.style.display='block';
      toast(e.message,'error');
    }
  }finally{hideLoad();}
}

/* ── RENDER MAIN ── */

function renderDailyTrack(){
  var el=document.getElementById('dailytrack-content');
  if(!el) return;
  var dates=dtAllDates();

  /* ── Top Bar ── */
  var html='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">'
    +'<div><div style="font-size:18px;font-weight:800;">📅 متابعة يومية — كتابات الأطباء</div>'
    +'<div style="font-size:12px;color:var(--text-dim);margin-top:3px;">ارفع ملف لكل فرع بتاريخه — قارن اليومي والأسبوعي والشهري</div></div>'
    +'<button onclick="dtOpenUpload(\''+dtToday()+'\')" style="padding:9px 18px;background:var(--grad-p);border:none;border-radius:var(--r-sm);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;">📂 رفع ملف</button>'
    +'</div>';

  /* ── View Tabs ── */
  var views=['daily','weekly','monthly','compare'];
  var vLbls={daily:'📅 يومي',weekly:'📆 أسبوعي',monthly:'📊 شهري',compare:'مقارنة الفروع'};
  html+='<div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;">';
  views.forEach(function(v){
    var on=DT.view===v;
    html+='<button onclick="DT.view=\''+v+'\';renderDailyTrack()" style="padding:7px 16px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;border:1px solid '+(on?'transparent':'var(--border)')+';background:'+(on?'var(--grad-p)':'var(--bg-glass2)')+';color:'+(on?'#fff':'var(--text-dim)')+';">'+vLbls[v]+'</button>';
  });
  html+='</div>';

  if(!dates.length){
    html+='<div style="text-align:center;padding:60px 20px;color:var(--text-muted);">'
      +'<div style="font-size:48px;margin-bottom:12px;">📂</div>'
      +'<div style="font-size:15px;font-weight:700;color:var(--text-dim);margin-bottom:8px;">لا توجد بيانات بعد</div>'
      +'<div style="font-size:13px;margin-bottom:20px;">ارفع ملف كتابات الأطباء لأي فرع لتبدأ المتابعة اليومية</div>'
      +'<button onclick="dtOpenUpload(\''+dtToday()+'\')" style="padding:10px 22px;background:var(--grad-p);border:none;border-radius:var(--r-sm);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">📂 رفع أول ملف</button>'
      +'</div>';
    el.innerHTML=html; return;
  }

  /* ── Calendar strip (آخر 14 يوم) ── */
  if(DT.view==='daily' || DT.view==='compare'){
    var allD=dtAllDates().slice(-14);
    if(!DT.selDate || !DT.store[DT.selDate]) DT.selDate=allD[allD.length-1];
    html+='<div style="overflow-x:auto;padding-bottom:6px;margin-bottom:16px;">'
      +'<div style="display:flex;gap:6px;min-width:max-content;">';
    allD.forEach(function(ds){
      var isOn=ds===DT.selDate;
      var x=DT.store[ds]||{};
      var dots='';
      ['T1','T2','T3'].forEach(function(b){ if(x[b]&&x[b].loaded) dots+='<span style="width:5px;height:5px;border-radius:50%;background:'+dtBranchColor(b)+';display:inline-block;margin:0 1px;"></span>'; });
      html+='<div onclick="DT.selDate=\''+ds+'\';renderDailyTrack()" style="min-width:52px;height:62px;border-radius:10px;border:1.5px solid '+(isOn?'var(--violet)':'var(--border)')+';background:'+(isOn?'var(--grad-p)':'var(--bg-glass)')+';cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:.15s;">'
        +'<div style="font-size:9px;color:'+(isOn?'rgba(255,255,255,.7)':'var(--text-muted)')+';">'+dtDayName(ds).slice(0,3)+'</div>'
        +'<div style="font-size:16px;font-weight:800;color:'+(isOn?'#fff':'var(--text)')+';">'+ds.slice(8)+'</div>'
        +'<div style="display:flex;gap:2px;">'+dots+'</div>'
        +'</div>';
    });
    html+='</div></div>';
  }

  /* ── Views ── */
  if(DT.view==='daily') html+=dtRenderDay(DT.selDate);
  else if(DT.view==='weekly') html+=dtRenderWeekly(dates);
  else if(DT.view==='monthly') html+=dtRenderMonthly(dates);
  else html+=dtRenderCompare(dates);

  el.innerHTML=html;
}

/* ── يومي ── */
function dtRenderDay(ds){
  var day=DT.store[ds]||{};
  var html='<div style="margin-bottom:10px;font-size:13px;font-weight:700;color:var(--text-dim);">'+dtFmtAr(ds)+' — '+dtDayName(ds)+'</div>';

  /* KPI row */
  var totalAll=0; ['T1','T2','T3'].forEach(function(b){ if(day[b]&&day[b].loaded) totalAll+=(day[b].rows||[]).length; });
  if(totalAll>0){
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;">';
    ['T1','T2','T3'].forEach(function(b){
      var x=day[b]; if(!x||!x.loaded){ html+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;opacity:.4;text-align:center;"><div style="font-size:11px;color:var(--text-muted);">'+dtBranchLabel(b)+'</div><div style="font-size:12px;color:var(--text-muted);margin-top:4px;">لا توجد بيانات</div><button onclick="dtOpenUpload(\''+ds+'\')" style="margin-top:8px;padding:4px 10px;background:var(--bg-glass3);border:1px solid var(--border);border-radius:6px;color:var(--text-dim);font-size:11px;cursor:pointer;font-family:inherit;">رفع</button></div>'; return; }
      var cnt=(x.rows||[]).length;
      html+='<div style="background:var(--bg-card);border:1px solid var(--border);border-left:3px solid '+dtBranchColor(b)+';border-radius:var(--r-md);padding:14px;">'
        +'<div style="font-size:11px;font-weight:700;color:'+dtBranchColor(b)+';margin-bottom:8px;">'+dtBranchLabel(b)+'</div>'
        +'<div style="font-size:24px;font-weight:800;color:var(--text);">'+fmt(cnt)+'</div>'
        +'<div style="font-size:10px;color:var(--text-muted);">كتابة</div>'
        +'<div style="display:flex;gap:12px;margin-top:8px;">'
        +'<div><div style="font-size:11px;font-weight:700;">'+x.docs+'</div><div style="font-size:10px;color:var(--text-muted);">طبيب</div></div>'
        +'<div><div style="font-size:11px;font-weight:700;">'+x.drugs+'</div><div style="font-size:10px;color:var(--text-muted);">صنف</div></div>'
        +'</div>'
        +'<button onclick="DT.store[\''+ds+'\'][\''+b+'\']=null;saveData();renderDailyTrack()" style="margin-top:8px;padding:3px 8px;background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.2);border-radius:5px;color:var(--rose-l);font-size:10px;cursor:pointer;font-family:inherit;">✕ حذف</button>'
        +'</div>';
    });
    html+='</div>';

    /* Top docs per branch */
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">';
    ['T1','T2','T3'].forEach(function(b){
      var x=day[b]; if(!x||!x.loaded) return;
      html+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;">'
        +'<div style="font-size:12px;font-weight:700;color:'+dtBranchColor(b)+';margin-bottom:12px;">👨‍⚕️ أطباء '+dtBranchLabel(b)+'</div>';
      var maxC=x.topDocs[0]?x.topDocs[0].count:1;
      x.topDocs.slice(0,10).forEach(function(doc,i){
        var p=Math.round(doc.count/maxC*100);
        html+='<div style="margin-bottom:8px;">'
          +'<div style="display:flex;justify-content:space-between;margin-bottom:3px;">'
          +'<span style="font-size:11.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:75%;">'+escapeHtml(doc.name)+'</span>'
          +'<span style="font-size:11px;font-weight:700;color:'+dtBranchColor(b)+';">'+doc.count+'</span></div>'
          +'<div style="background:var(--bg-glass3);border-radius:3px;height:4px;"><div style="width:'+p+'%;height:100%;background:'+dtBranchColor(b)+';border-radius:3px;"></div></div>'
          +'</div>';
      });
      html+='</div>';
    });
    html+='</div>';

    /* ── PL Card ── */
    html+=dtRenderPLCard(ds);

  } else {
    html+='<div style="text-align:center;padding:40px;color:var(--text-muted);">'
      +'<div style="font-size:36px;margin-bottom:10px;">📂</div>'
      +'<div style="font-size:13px;font-weight:700;color:var(--text-dim);margin-bottom:6px;">لا توجد بيانات لـ '+dtFmtAr(ds)+'</div>'
      +'<button onclick="dtOpenUpload(\''+ds+'\')" style="padding:8px 18px;background:var(--grad-p);border:none;border-radius:var(--r-sm);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">📂 رفع ملف لهذا اليوم</button>'
      +'</div>';
  }
  return html;
}

/* ── أسبوعي ── */
function dtRenderWeekly(dates){
  var weeks={};
  dates.forEach(function(d){ var wk=dtWeekKey(d); if(!weeks[wk]) weeks[wk]=[]; weeks[wk].push(d); });
  var html='';
  Object.keys(weeks).sort().reverse().forEach(function(wk){
    var wds=weeks[wk];
    var we=dtParseLocal(wk); we.setDate(we.getDate()+6);
    var tot={T1:0,T2:0,T3:0,all:0};
    wds.forEach(function(d){ var day=DT.store[d]||{}; ['T1','T2','T3'].forEach(function(b){ if(day[b]&&day[b].loaded){ var c=(day[b].rows||[]).length; tot[b]+=c; tot.all+=c; } }); });
    var maxB=Math.max(tot.T1,tot.T2,tot.T3)||1;
    html+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:16px;margin-bottom:14px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      +'<div><div style="font-size:13px;font-weight:800;">📆 '+dtFmtAr(wk)+' — '+dtFmtAr(dtDateStr(we))+'</div>'
      +'<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">'+wds.length+' أيام · '+fmt(tot.all)+' كتابة إجمالي</div></div>'
      +'<div style="font-size:20px;font-weight:900;color:var(--teal);">'+fmt(tot.all)+'</div></div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">';
    ['T1','T2','T3'].forEach(function(b){
      var p=Math.round(tot[b]/maxB*100);
      html+='<div style="padding:10px;background:var(--bg-glass);border:1px solid var(--border);border-radius:var(--r-sm);">'
        +'<div style="font-size:10px;font-weight:700;color:'+dtBranchColor(b)+';margin-bottom:6px;">'+dtBranchLabel(b)+'</div>'
        +'<div style="font-size:18px;font-weight:800;">'+fmt(tot[b])+'</div>'
        +'<div style="background:var(--bg-glass3);border-radius:3px;height:5px;margin-top:6px;"><div style="width:'+p+'%;height:100%;background:'+dtBranchColor(b)+';border-radius:3px;"></div></div>'
        +'</div>';
    });
    html+='</div>';
    /* أيام الأسبوع */
    html+='<div style="display:flex;gap:5px;flex-wrap:wrap;">';
    wds.forEach(function(d){
      var agg=dtAgg(d);
      html+='<button onclick="DT.view=\'daily\';DT.selDate=\''+d+'\';renderDailyTrack()" '
        +'style="padding:5px 10px;background:var(--bg-glass2);border:1px solid var(--border);border-radius:6px;color:var(--text-dim);font-size:11px;cursor:pointer;font-family:inherit;">'
        +'📅 '+dtFmtAr(d)+' ('+fmt(agg.total)+')</button>';
    });
    html+='</div></div>';
  });
  return html||'<div style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد بيانات أسبوعية</div>';
}

/* ── شهري ── */
function dtRenderMonthly(dates){
  var mos={};
  dates.forEach(function(d){ var mk=dtMonthKey(d); if(!mos[mk]) mos[mk]=[]; mos[mk].push(d); });
  var mnames=['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var html='';
  Object.keys(mos).sort().reverse().forEach(function(mk){
    var mds=mos[mk], yr=mk.slice(0,4), mn=+mk.slice(5,7);
    var tot={T1:0,T2:0,T3:0};
    mds.forEach(function(d){ var day=DT.store[d]||{}; ['T1','T2','T3'].forEach(function(b){ if(day[b]&&day[b].loaded) tot[b]+=(day[b].rows||[]).length; }); });
    var grand=tot.T1+tot.T2+tot.T3;
    html+='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:16px;margin-bottom:14px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      +'<div><div style="font-size:14px;font-weight:800;">📊 '+mnames[mn]+' '+yr+'</div>'
      +'<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">'+mds.length+' أيام مسجلة</div></div>'
      +'<div style="font-size:22px;font-weight:900;color:var(--violet);">'+fmt(grand)+'</div></div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">';
    ['T1','T2','T3'].forEach(function(b){
      html+='<div style="padding:12px;background:var(--bg-glass);border:1px solid var(--border);border-radius:var(--r-sm);text-align:center;">'
        +'<div style="font-size:10px;font-weight:700;color:'+dtBranchColor(b)+';margin-bottom:6px;">'+dtBranchLabel(b)+'</div>'
        +'<div style="font-size:20px;font-weight:800;">'+fmt(tot[b])+'</div>'
        +'<div style="font-size:10px;color:var(--text-muted);">كتابة</div>'
        +'</div>';
    });
    html+='</div>';
    /* جدول الأيام */
    html+='<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">'
      +'<thead><tr style="border-bottom:1px solid var(--border);">'
      +'<th style="text-align:right;padding:7px 8px;color:var(--text-muted);font-weight:700;">اليوم</th>'
      +'<th style="text-align:center;padding:7px 8px;color:var(--violet-l);font-weight:700;">T1</th>'
      +'<th style="text-align:center;padding:7px 8px;color:var(--teal-l);font-weight:700;">T2</th>'
      +'<th style="text-align:center;padding:7px 8px;color:var(--amber-l);font-weight:700;">T3</th>'
      +'<th style="text-align:center;padding:7px 8px;color:var(--text-dim);font-weight:700;">الإجمالي</th>'
      +'</tr></thead><tbody>';
    mds.forEach(function(d){
      var day=DT.store[d]||{};
      var t1=(day.T1&&day.T1.loaded)?(day.T1.rows||[]).length:null;
      var t2=(day.T2&&day.T2.loaded)?(day.T2.rows||[]).length:null;
      var t3=(day.T3&&day.T3.loaded)?(day.T3.rows||[]).length:null;
      var tot2=(t1||0)+(t2||0)+(t3||0);
      html+='<tr onclick="DT.view=\'daily\';DT.selDate=\''+d+'\';renderDailyTrack()" style="border-bottom:1px solid var(--border);cursor:pointer;" onmouseover="this.style.background=\'var(--bg-glass2)\'" onmouseout="this.style.background=\'\'">'
        +'<td style="padding:7px 8px;font-weight:600;">'+dtFmtAr(d)+' <span style="font-size:10px;color:var(--text-muted);">('+dtDayName(d)+')</span></td>'
        +'<td style="text-align:center;padding:7px 8px;color:var(--violet-l);font-weight:700;">'+(t1!==null?fmt(t1):'—')+'</td>'
        +'<td style="text-align:center;padding:7px 8px;color:var(--teal-l);font-weight:700;">'+(t2!==null?fmt(t2):'—')+'</td>'
        +'<td style="text-align:center;padding:7px 8px;color:var(--amber-l);font-weight:700;">'+(t3!==null?fmt(t3):'—')+'</td>'
        +'<td style="text-align:center;padding:7px 8px;font-weight:800;">'+fmt(tot2)+'</td>'
        +'</tr>';
    });
    /* صف الإجمالي */
    html+='<tr style="background:var(--bg-glass2);font-weight:800;border-top:2px solid var(--border);">'
      +'<td style="padding:8px;">الإجمالي</td>'
      +'<td style="text-align:center;padding:8px;color:var(--violet-l);">'+fmt(tot.T1)+'</td>'
      +'<td style="text-align:center;padding:8px;color:var(--teal-l);">'+fmt(tot.T2)+'</td>'
      +'<td style="text-align:center;padding:8px;color:var(--amber-l);">'+fmt(tot.T3)+'</td>'
      +'<td style="text-align:center;padding:8px;">'+fmt(grand)+'</td>'
      +'</tr>';
    html+='</tbody></table></div></div>';
  });
  return html||'<div style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد بيانات شهرية</div>';
}

/* ── مقارنة الفروع ── */
function dtRenderCompare(dates){
  var html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">';
  ['T1','T2','T3'].forEach(function(b){
    var bDates=dates.filter(function(d){ return DT.store[d]&&DT.store[d][b]&&DT.store[d][b].loaded; });
    var totalW=0; bDates.forEach(function(d){ totalW+=(DT.store[d][b].rows||[]).length; });
    var avgDay=bDates.length?Math.round(totalW/bDates.length):0;
    /* top docs across all days */
    var allDocMap={};
    bDates.forEach(function(d){ (DT.store[d][b].topDocs||[]).forEach(function(doc){ allDocMap[doc.name]=(allDocMap[doc.name]||0)+doc.count; }); });
    var topDocs=Object.keys(allDocMap).map(function(n){ return {name:n,count:allDocMap[n]}; }).sort(function(a,b){ return b.count-a.count; }).slice(0,8);
    var maxC=topDocs[0]?topDocs[0].count:1;
    html+='<div style="background:var(--bg-card);border:1px solid var(--border);border-right:3px solid '+dtBranchColor(b)+';border-radius:var(--r-md);padding:16px;">'
      +'<div style="font-size:13px;font-weight:800;color:'+dtBranchColor(b)+';margin-bottom:14px;">'+dtBranchLabel(b)+'<span style="font-size:10px;color:var(--text-muted);font-weight:400;margin-right:8px;">'+bDates.length+' يوم</span></div>';
    if(bDates.length){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">'
        +'<div style="padding:10px;background:var(--bg-glass);border-radius:var(--r-sm);text-align:center;"><div style="font-size:19px;font-weight:800;">'+fmt(totalW)+'</div><div style="font-size:10px;color:var(--text-muted);">إجمالي الكتابات</div></div>'
        +'<div style="padding:10px;background:var(--bg-glass);border-radius:var(--r-sm);text-align:center;"><div style="font-size:19px;font-weight:800;">'+fmt(avgDay)+'</div><div style="font-size:10px;color:var(--text-muted);">متوسط يومي</div></div>'
        +'</div>'
        +'<div style="font-size:11px;font-weight:700;color:var(--text-dim);margin-bottom:10px;">👨‍⚕️ أكثر الأطباء كتابة</div>';
      topDocs.forEach(function(doc){
        var p=Math.round(doc.count/maxC*100);
        html+='<div style="margin-bottom:8px;">'
          +'<div style="display:flex;justify-content:space-between;margin-bottom:3px;">'
          +'<span style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:75%;">'+escapeHtml(doc.name)+'</span>'
          +'<span style="font-size:11px;font-weight:700;color:'+dtBranchColor(b)+';">'+doc.count+'</span></div>'
          +'<div style="background:var(--bg-glass3);border-radius:3px;height:4px;"><div style="width:'+p+'%;height:100%;background:'+dtBranchColor(b)+';border-radius:3px;"></div></div>'
          +'</div>';
      });
    } else {
      html+='<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">لا توجد بيانات<br>'
        +'<button onclick="dtOpenUpload(\''+dtToday()+'\')" style="margin-top:8px;padding:5px 12px;background:var(--bg-glass3);border:1px solid var(--border);border-radius:6px;color:var(--text-dim);font-size:11px;cursor:pointer;font-family:inherit;">رفع ملف</button></div>';
    }
    html+='</div>';
  });
  html+='</div>';
  return html;
}

/* ── PL Summary Card (يومي) ── */
function dtRenderPLCard(ds){
  var day=DT.store[ds]||{};
  /* اجمع كل الصفوف من الفروع المحملة */
  var byBranch={T1:[],T2:[],T3:[]};
  var anyLoaded=false;
  ['T1','T2','T3'].forEach(function(b){
    if(day[b]&&day[b].loaded){ byBranch[b]=day[b].rows||[]; anyLoaded=true; }
  });
  if(!anyLoaded) return '';

  /* احسب كتابات كل منتج PL لكل فرع */
  var plData=PRIVATE_LABEL.map(function(pl){
    var row={name:pl.name,form:pl.form,key:pl.key,T1:0,T2:0,T3:0,total:0};
    ['T1','T2','T3'].forEach(function(b){
      byBranch[b].forEach(function(r){
        if(r.service&&r.service.toLowerCase().indexOf(pl.key)>-1){ row[b]++; row.total++; }
      });
    });
    return row;
  });

  var grandTotal=plData.reduce(function(s,p){ return s+p.total; },0);
  var totalAll=['T1','T2','T3'].reduce(function(s,b){ return s+byBranch[b].length; },0);
  var plPct=totalAll>0?Math.round(grandTotal/totalAll*100):0;

  /* ألوان PL */
  var plColors=['#60a5fa','#14b8a6','#fb923c','#f472b6','#a78bfa','#14b8a6'];

  var html='<div style="background:var(--bg-card);border:1px solid var(--border);border-top:2px solid var(--violet);border-radius:var(--r-md);padding:16px;margin-top:14px;">'
    /* Header */
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">'
    +'<div style="display:flex;align-items:center;gap:10px;">'
    +'<div style="width:34px;height:34px;background:linear-gradient(135deg,var(--violet),var(--teal));border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;">💊</div>'
    +'<div><div style="font-size:13px;font-weight:800;">منتجاتي — NOSTRI Private Label</div>'
    +'<div style="font-size:11px;color:var(--text-muted);margin-top:1px;">كتابات '+dtFmtAr(ds)+'</div></div></div>'
    /* KPI pill */
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    +'<div style="padding:6px 14px;background:rgba(37,99,235,.12);border:1px solid rgba(37,99,235,.3);border-radius:999px;font-size:12px;font-weight:800;color:var(--violet-l);">إجمالي: '+grandTotal+' كتابة</div>'
    +'<div style="padding:6px 14px;background:rgba(13,148,136,.1);border:1px solid rgba(13,148,136,.25);border-radius:999px;font-size:12px;font-weight:800;color:var(--teal-l);">'+plPct+'% من الإجمالي</div>'
    +'</div></div>';

  /* جدول المنتجات */
  html+='<div style="overflow-x:auto;">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
    +'<thead><tr style="border-bottom:1px solid var(--border);">'
    +'<th style="text-align:right;padding:8px 10px;color:var(--text-muted);font-weight:700;white-space:nowrap;">المنتج</th>'
    +'<th style="text-align:center;padding:8px 10px;color:var(--violet-l);font-weight:700;">T1</th>'
    +'<th style="text-align:center;padding:8px 10px;color:var(--teal-l);font-weight:700;">T2</th>'
    +'<th style="text-align:center;padding:8px 10px;color:var(--amber-l);font-weight:700;">T3</th>'
    +'<th style="text-align:center;padding:8px 10px;color:var(--text);font-weight:700;">الإجمالي</th>'
    +'<th style="text-align:right;padding:8px 10px;color:var(--text-muted);font-weight:700;min-width:100px;">الأداء</th>'
    +'</tr></thead><tbody>';

  var maxTotal=Math.max.apply(null,plData.map(function(p){ return p.total; }))||1;

  plData.forEach(function(pl,i){
    var pct2=Math.round(pl.total/maxTotal*100);
    var hasAny=pl.total>0;
    html+='<tr style="border-bottom:1px solid var(--border);'+(hasAny?'':'opacity:.45;')+'" '
      +(hasAny?'onmouseover="this.style.background=\'var(--bg-glass2)\'" onmouseout="this.style.background=\'\'"':'')+'>'
      +'<td style="padding:9px 10px;">'
      +'<div style="display:flex;align-items:center;gap:8px;">'
      +'<span style="width:8px;height:8px;border-radius:50%;background:'+plColors[i]+';flex-shrink:0;display:inline-block;"></span>'
      +'<div><div style="font-weight:700;font-size:12.5px;">'+pl.name+'</div>'
      +'<div style="font-size:10px;color:var(--text-muted);">'+pl.form+'</div></div></div></td>'
      +'<td style="text-align:center;padding:9px 10px;font-weight:700;color:'+(pl.T1>0?'var(--violet-l)':'var(--text-muted)')+';">'+(pl.T1||'—')+'</td>'
      +'<td style="text-align:center;padding:9px 10px;font-weight:700;color:'+(pl.T2>0?'var(--teal-l)':'var(--text-muted)')+';">'+(pl.T2||'—')+'</td>'
      +'<td style="text-align:center;padding:9px 10px;font-weight:700;color:'+(pl.T3>0?'var(--amber-l)':'var(--text-muted)')+';">'+(pl.T3||'—')+'</td>'
      +'<td style="text-align:center;padding:9px 10px;font-weight:800;font-size:13px;">'+(pl.total||'—')+'</td>'
      +'<td style="padding:9px 10px;">'
      +'<div style="display:flex;align-items:center;gap:7px;">'
      +'<div style="flex:1;background:var(--bg-glass3);border-radius:4px;height:6px;">'
      +'<div style="width:'+pct2+'%;height:100%;background:'+plColors[i]+';border-radius:4px;transition:.4s;"></div></div>'
      +'<span style="font-size:10px;color:var(--text-muted);min-width:28px;">'+pct2+'%</span>'
      +'</div></td>'
      +'</tr>';
  });
  html+='</tbody></table></div>';

  /* Summary bar — مجمّع كل المنتجات */
  if(grandTotal>0){
    html+='<div style="margin-top:14px;padding:12px 14px;background:var(--bg-glass);border:1px solid var(--border);border-radius:var(--r-sm);display:flex;align-items:center;flex-wrap:wrap;gap:10px;">'
      +'<div style="font-size:11px;font-weight:700;color:var(--text-dim);">📊 توزيع الفروع:</div>';
    ['T1','T2','T3'].forEach(function(b){
      var bTotal=plData.reduce(function(s,p){ return s+p[b]; },0);
      var bPct=grandTotal>0?Math.round(bTotal/grandTotal*100):0;
      html+='<div style="display:flex;align-items:center;gap:5px;">'
        +'<span style="width:8px;height:8px;border-radius:50%;background:'+dtBranchColor(b)+';display:inline-block;"></span>'
        +'<span style="font-size:11.5px;font-weight:700;color:var(--text-dim);">'+dtBranchLabel(b)+':</span>'
        +'<span style="font-size:12px;font-weight:800;color:var(--text);">'+bTotal+' ('+bPct+'%)</span>'
        +'</div>';
    });
    html+='</div>';
  }

  html+='</div>';
  return html;
}

/* ── INIT: افتح على اليوم الحالي ── */
DT.selDate=dtToday();

/* ══════════════════════════════════════════════════════
   END DAILY TRACK
══════════════════════════════════════════════════════ */

/* ── INIT ── */
/* ── افتتاحية NOSTRI (مرة لكل جلسة) ── */
(function(){
  try{
    if(sessionStorage.getItem('pd_splash')) return;
    sessionStorage.setItem('pd_splash','1');
  }catch(e){}
  try{
    var s = document.createElement('div');
    s.id = 'pdSplash';
    s.innerHTML = '<div class="pds-in"><div class="pds-logo">NOSTRI</div><div class="pds-sub">PharmaDash — لوحة التحليلات الدوائية</div><div class="pds-bar"><span></span></div></div>';
    document.body.appendChild(s);
    setTimeout(function(){ s.classList.add('out'); setTimeout(function(){ s.remove(); }, 650); }, 1150);
  }catch(e){}
})();
window.addEventListener('load',async ()=>{
  renderFeatured();
  /* ملف مشاركة مضمّن له الأولوية على البيانات المحفوظة محلياً */
  if(window.__EMBEDDED_RX__){_dataUnlocked=true;await loadEmbedded();return;}
  if(sessionStorage.getItem('pharmdash_user')) await unlockStoredData();
});
window.addEventListener('error',e=>console.error('V8 Error:',e.error||e.message));


// ══════════════════════════════════
// SECTION — أصناف PureHerb
// ══════════════════════════════════
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

function renderPureHerb(){
  const el = document.getElementById('pureherb-content');
  if(!el) return;
  const loaded = Object.keys(STATE.data).filter(b=>STATE.data[b]);
  if(!loaded.length){
    el.innerHTML='<div id="phTargetCard" style="margin-bottom:16px;"></div><div class="card"><div style="text-align:center;padding:48px 24px;"><h3 style="color:var(--text-dim);margin-bottom:8px;">لا توجد بيانات كتابات</h3><p style="color:var(--text-muted);font-size:13px;">مبيعات ومستهدف PureHerb أعلاه يُدخلان يدوياً. لتحليل الكتابات، ارفع ملف الفرع (PDF أو Excel) من شريط الفروع بالأعلى</p></div></div>';
    renderPHTarget();
    return;
  }
  /* Collect PureHerb drugs from loaded branches */
  var phData = {};
  PUREHERB_PRODUCTS.forEach(p=>{ phData[p.key]={name:p.name,total:0,branches:{}}; });
  loaded.forEach(b=>{
    const bd = STATE.data[b];
    if(!bd||!bd.drugs) return;
    PUREHERB_PRODUCTS.forEach(p=>{
      const found = bd.drugs.filter(d=>findPureHerbProduct(d.name)?.key===p.key);
      const cnt = found.reduce((s,x)=>s+(x.total||x.count||0),0);
      if(cnt>0){
        phData[p.key].total += cnt;
        phData[p.key].branches[b] = cnt;
      }
    });
  });
  var totalAll = Object.values(phData).reduce((s,x)=>s+x.total,0);
  var html='<div id="phTargetCard" style="margin-bottom:16px;"></div><div class="card"><div class="card-head"><div class="card-title"><span class="dot" style="background:#7c3aed;"></span> أصناف PureHerb — تحليل الكتابات</div></div><div class="card-body">';
  /* KPI strip */
  html+='<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">';
  html+='<div style="flex:1;min-width:140px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:12px;padding:16px;text-align:center;">';
  html+='<div style="font-size:11px;color:var(--text-dim);font-weight:700;margin-bottom:4px;">إجمالي الكتابات</div>';
  html+='<div style="font-size:28px;font-weight:800;color:#7c3aed;">'+totalAll.toLocaleString('en-US')+'</div></div>';
  html+='<div style="flex:1;min-width:140px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:12px;padding:16px;text-align:center;">';
  html+='<div style="font-size:11px;color:var(--text-dim);font-weight:700;margin-bottom:4px;">عدد المنتجات</div>';
  html+='<div style="font-size:28px;font-weight:800;color:#6d28d9;">'+PUREHERB_PRODUCTS.length+'</div></div>';
  html+='<div style="flex:1;min-width:140px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:12px;padding:16px;text-align:center;">';
  html+='<div style="font-size:11px;color:var(--text-dim);font-weight:700;margin-bottom:4px;">الفروع النشطة</div>';
  html+='<div style="font-size:28px;font-weight:800;color:#e879f9;">'+loaded.length+'</div></div></div>';
  /* Product bars */
  var sorted = Object.values(phData).sort((a,b)=>b.total-a.total);
  var maxV = sorted.length ? sorted[0].total : 1;
  html+='<div style="margin-top:12px;">';
  sorted.forEach(p=>{
    var pct = maxV>0 ? (p.total/maxV*100) : 0;
    html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">';
    html+='<div style="min-width:120px;font-size:12px;font-weight:700;color:var(--text);text-align:left;">'+p.name+'</div>';
    html+='<div style="flex:1;height:22px;background:rgba(124,58,237,.08);border-radius:6px;overflow:hidden;">';
    html+='<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#7c3aed,#6d28d9);border-radius:6px;transition:width .5s;"></div></div>';
    html+='<div style="min-width:40px;text-align:left;font-size:13px;font-weight:800;color:#7c3aed;">'+p.total+'</div></div>';
  });
  html+='</div>';
  /* Branch breakdown */
  if(loaded.length>1){
    html+='<div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">';
    html+='<div style="font-size:12px;font-weight:700;color:var(--text-dim);margin-bottom:10px;">توزيع الفروع</div>';
    html+='<div style="display:flex;gap:10px;flex-wrap:wrap;">';
    loaded.forEach(b=>{
      var bTotal = Object.values(phData).reduce((s,x)=>s+(x.branches[b]||0),0);
      html+='<div style="flex:1;min-width:120px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;">';
      html+='<div style="font-size:11px;color:var(--text-dim);font-weight:600;">'+b+'</div>';
      html+='<div style="font-size:22px;font-weight:800;color:#7c3aed;margin-top:4px;">'+bTotal+'</div></div>';
    });
    html+='</div></div>';
  }
  html+='</div></div>';
  html+='<div id="phDoctorsAgg" style="margin-top:20px;"></div>';
  el.innerHTML=html;
  renderPHTarget();
  renderPHDoctorsAgg();
}
