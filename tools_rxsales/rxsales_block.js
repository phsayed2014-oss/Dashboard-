
  /* ════════════════ الكتابة مقابل الصرف (rxsales) ════════════════ */
  const SALES_KEY = 'pharmaDash.sales.v1';
  const SALES_BRANCH_MAP = { 'صيدلية 1':'T1', 'صيدلية 18':'T2', 'صيدلية 7':'T3' };
  /* 13 unified product keys — matches sales dashboard const PRODUCTS (literal keys verified) */
  const RX_PRODUCTS = [
    {key:'reflex', name:'Reflex'}, {key:'rizer', name:'Rizer'}, {key:'oracure', name:'Oracure'},
    {key:'intimo', name:'Intimo'}, {key:'nostriderm', name:'Nostriderm'}, {key:'nostricure', name:'Nostricure'},
    {key:'pure_omega', name:'Pure Omega-3'}, {key:'purefeel', name:'PureFeel'}, {key:'centrozon_w', name:'Centrozon Women'},
    {key:'centrozon', name:'Centrozon'}, {key:'zincolive', name:'Zincolive'}, {key:'bonefriend', name:'BoneFriend'}, {key:'argigrow', name:'ArgiGrow'}
  ];
  const RX_NAME = {}; RX_PRODUCTS.forEach(function(p){ RX_NAME[p.key]=p.name; });
  const RX_KEYSET = RX_PRODUCTS.map(function(p){ return p.key; });
  /* PureHerb matcher keys (from const PUREHERB_PRODUCTS) → unified sales keys */
  const PUREHERB_KEYMAP = { 'PURE OMEGA':'pure_omega','PUREFEEL':'purefeel','CENTROZON W':'centrozon_w','CENTROZON':'centrozon','ZINCOLIVE':'zincolive','BONEFRIEND':'bonefriend','ARGIGROW':'argigrow' };
  const RX_BRANCH_LABEL = { T1:'التعاون الأول', T2:'التعاون الثاني', T3:'التعاون الثالث' };

  /* map an Oracle service string → unified product key (reuses existing matchers, no new rules) */
  function productKeyOf(service){
    const pl = findPrivateLabelProduct(service); if(pl) return pl.key;
    const ph = findPureHerbProduct(service); if(ph) return PUREHERB_KEYMAP[ph.key] || null;
    return null;
  }
  function rxNum(v){ const n=Number(v); return Number.isFinite(n) && n>0 ? n : 0; }
  function rxPad(n){ return String(n).padStart(2,'0'); }
  function rxDaysInMonth(y,m){ return new Date(y, m, 0).getDate(); }

  /* ── sales file import + storage ── */
  function rxExtractEntries(json){
    if(Array.isArray(json)) return json;
    if(json && typeof json==='object'){
      const wraps=['entries','data','records','rows','items','sales'];
      for(let i=0;i<wraps.length;i++){ if(Array.isArray(json[wraps[i]])) return json[wraps[i]]; }
    }
    return null;
  }
  function rxValidEntry(e){
    return !!(e && typeof e==='object'
      && /^\d{4}-\d{2}-\d{2}$/.test(String(e.date||''))
      && Object.prototype.hasOwnProperty.call(SALES_BRANCH_MAP, e.pharmacy)
      && RX_KEYSET.indexOf(String(e.product)) !== -1);
  }
  /* normalize to per-unit price/cost. Handles both shapes:
     · sales-dashboard backup: `amount`/`cost` are TOTALS for the line → divide by units
     · per-unit shape (`price`/`cost` per unit) when no `amount` present */
  function rxNormalize(e){
    const units = rxNum(e.units);
    let unitPrice, unitCost;
    if(e.price != null && e.amount == null){
      unitPrice = rxNum(e.price); unitCost = rxNum(e.cost);
    } else {
      unitPrice = units>0 ? rxNum(e.amount)/units : 0;
      unitCost  = units>0 ? rxNum(e.cost)/units : 0;
    }
    return { date:e.date, pharmacy:e.pharmacy, branch:SALES_BRANCH_MAP[e.pharmacy],
      product:String(e.product), units:units, unitPrice:unitPrice, unitCost:unitCost, prescriptions:rxNum(e.prescriptions) };
  }
  function saveSales(){ try{ localStorage.setItem(SALES_KEY, JSON.stringify(STATE.sales)); }catch(e){} }
  function restoreSales(){
    try{ const s=JSON.parse(localStorage.getItem(SALES_KEY));
      if(s && Array.isArray(s.entries) && s.entries.length){
        /* re-map branch defensively in case of older payloads */
        s.entries.forEach(function(e){ if(!e.branch) e.branch=SALES_BRANCH_MAP[e.pharmacy]; });
        STATE.sales = s;
      }
    }catch(e){}
  }
  function removeSales(){
    STATE.sales = null;
    try{ localStorage.removeItem(SALES_KEY); }catch(e){}
    rxToast('تمت إزالة ملف المبيعات');
    rerenderCurrent();
  }
  function onSalesFile(f){
    const reader = new FileReader();
    reader.onerror = function(){ alert('تعذّر قراءة ملف المبيعات.'); };
    reader.onload = function(){
      let json;
      try{ json = JSON.parse(reader.result); }
      catch(err){ alert('ملف JSON غير صالح — تعذّر تحليله.'); return; }
      const raw = rxExtractEntries(json);
      if(!raw){ alert('لم يتم العثور على مصفوفة إدخالات مبيعات داخل الملف.'); return; }
      let invalid=0; const entries=[];
      raw.forEach(function(e){ if(rxValidEntry(e)) entries.push(rxNormalize(e)); else invalid++; });
      if(!entries.length){ alert('لا توجد إدخالات مبيعات صالحة في الملف (تحقّق من date / pharmacy / product).'); return; }
      STATE.sales = { entries:entries, loadedAt:Date.now(), fileName:String(f.name||'sales.json'), invalid:invalid };
      saveSales();
      rxToast(rxSummaryText(STATE.sales));
      nav.querySelectorAll('.nav-item').forEach(function(x){ x.classList.remove('active'); });
      const it = nav.querySelector('.nav-item[data-k="rxsales"]'); if(it) it.classList.add('active');
      viewNav(function(){ showSection('rxsales'); });
    };
    reader.readAsText(f);
  }
  function rxSummaryText(s){
    const e=s.entries; const dates=e.map(function(x){ return x.date; }).sort();
    const branches=[...new Set(e.map(function(x){ return x.branch; }))].length;
    const prods=[...new Set(e.map(function(x){ return x.product; }))].length;
    return 'تم استيراد '+fmt(e.length)+' إدخال مبيعات · من '+dates[0]+' إلى '+dates[dates.length-1]
      +' · '+branches+' فرع · '+prods+' صنف'+(s.invalid?(' · تجاهل '+fmt(s.invalid)+' غير صالح'):'');
  }
  let _rxToastT=null;
  function rxToast(msg){
    let t=document.getElementById('rxToast');
    if(!t){ t=document.createElement('div'); t.id='rxToast'; t.className='rx-toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show');
    clearTimeout(_rxToastT); _rxToastT=setTimeout(function(){ t.classList.remove('show'); }, 4600);
  }

  /* ── period → matching window ── */
  function rxNewestPeriodName(bk){
    let best=null, bestScore=-1;
    const scan=function(ps){ (ps||[]).forEach(function(p){ const s=periodInfo(p.name).score; if(s>bestScore){ bestScore=s; best=p.name; } }); };
    if(bk==='ALL'){ BRANCHES.forEach(function(b){ scan(STATE[b.key].periods); }); }
    else { scan(STATE[bk] && STATE[bk].periods); }
    return best;
  }
  function rxParseWindow(name){
    const clean=String(name||'').replace(/_/g,' ');
    /* full ISO dates present → use min/max */
    const ymd=[...clean.matchAll(/(20\d{2})[.\-\/](0[1-9]|1[0-2])[.\-\/](0[1-9]|[12]\d|3[01])/g)];
    if(ymd.length){
      const ds=ymd.map(function(x){ return x[1]+'-'+x[2]+'-'+x[3]; }).sort();
      const a=ds[0], b=ds[ds.length-1];
      return { month:+a.slice(5,7), year:+a.slice(0,4), dayStart:+a.slice(8,10), dayEnd:+b.slice(8,10), start:a, end:b };
    }
    /* yearless day-month range: "01-07 to 20-07" (month must agree across tokens) */
    const dm=[...clean.matchAll(/\b(0?[1-9]|[12]\d|3[01])[\-\/](0?[1-9]|1[0-2])\b/g)];
    if(dm.length){
      const months=[...new Set(dm.map(function(m){ return +m[2]; }))];
      if(months.length===1){
        const m=months[0]; const days=dm.map(function(x){ return +x[1]; });
        return { month:m, year:null, dayStart:Math.min.apply(null,days), dayEnd:Math.max.apply(null,days) };
      }
    }
    /* labeled month / YYYY-MM → whole month via periodInfo score (year*10000+month*100) */
    const info=periodInfo(name);
    if(info.sure && info.score>=10000){
      const y=Math.floor(info.score/10000), m=Math.floor((info.score%10000)/100);
      if(m>=1 && m<=12) return { month:m, year:y, dayStart:1, dayEnd:rxDaysInMonth(y,m) };
    }
    return null;
  }
  function rxResolveYear(month){
    const cur=new Date().getFullYear();
    if(!STATE.sales) return cur;
    const years={};
    STATE.sales.entries.forEach(function(e){ if(+e.date.slice(5,7)===month){ const y=+e.date.slice(0,4); years[y]=(years[y]||0)+1; } });
    const ks=Object.keys(years);
    if(!ks.length) return cur;
    ks.sort(function(a,b){ return years[b]-years[a] || (+b)-(+a); });   // most frequent, tie → latest
    return +ks[0];
  }
  function rxWindow(){
    const nm=rxNewestPeriodName(STATE.active);
    if(!nm) return null;
    const w=rxParseWindow(nm);
    if(!w) return null;
    const year=w.year || rxResolveYear(w.month);
    let dayEnd=w.dayEnd; const dim=rxDaysInMonth(year, w.month);
    if(dayEnd>dim) dayEnd=dim;
    const start=w.start || (year+'-'+rxPad(w.month)+'-'+rxPad(w.dayStart));
    const end=w.end || (year+'-'+rxPad(w.month)+'-'+rxPad(dayEnd));
    const branch = STATE.active==='ALL' ? 'كل المجمعات' : curBranch().label;
    return { start:start, end:end, month:w.month, year:year, dayStart:w.dayStart, dayEnd:dayEnd, name:nm, branch:branch };
  }
  function rxDatesBetween(a,b){
    const out=[]; const sa=a.split('-').map(Number), sb=b.split('-').map(Number);
    let d=new Date(sa[0], sa[1]-1, sa[2]); const end=new Date(sb[0], sb[1]-1, sb[2]);
    let guard=0;
    while(d<=end && guard<400){ out.push(d.getFullYear()+'-'+rxPad(d.getMonth()+1)+'-'+rxPad(d.getDate())); d.setDate(d.getDate()+1); guard++; }
    return out;
  }

  /* ── computation ── */
  /* written per (branch|product) from each in-scope branch's newest period rows */
  function rxWrittenMap(){
    const map={};
    const keys = STATE.active==='ALL' ? BRANCHES.map(function(b){ return b.key; }) : [STATE.active];
    keys.forEach(function(bk){
      const dd = STATE[bk] && STATE[bk].data; if(!dd) return;
      (dd.rows||[]).forEach(function(r){ const k=productKeyOf(r.service); if(k){ const ck=bk+'|'+k; map[ck]=(map[ck]||0)+1; } });
    });
    return map;
  }
  function rxCompute(win){
    const wmap=rxWrittenMap();
    const inWin=STATE.sales.entries.filter(function(e){
      if(e.date < win.start || e.date > win.end) return false;
      if(STATE.active!=='ALL' && e.branch!==STATE.active) return false;
      return true;
    });
    /* branch × product cells */
    const cellMap={};
    function touch(branch,key){ const ck=branch+'|'+key;
      if(!cellMap[ck]) cellMap[ck]={ branch:branch, key:key, name:RX_NAME[key]||key, written:0, units:0, pw:0, cw:0, n:0, pSum:0, priced:0 };
      return cellMap[ck]; }
    Object.keys(wmap).forEach(function(ck){ const bits=ck.split('|'); touch(bits[0],bits[1]).written=wmap[ck]; });
    inWin.forEach(function(e){ const c=touch(e.branch,e.product);
      c.units+=e.units; c.pw+=e.unitPrice*e.units; c.cw+=e.unitCost*e.units;
      c.pSum+=e.unitPrice; c.n++; if(e.unitPrice>0) c.priced++; });
    function priceOf(o){
      if(o.units>0 && o.pw>0) return { p:o.pw/o.units, c:o.cw/o.units, noPrice:false };
      if(o.n>0 && o.pSum>0) return { p:o.pSum/o.n, c:0, noPrice:false };   // simple-average fallback
      return { p:0, c:0, noPrice:true };
    }
    /* aggregate cells → per product (across active scope) */
    const prodMap={};
    Object.keys(cellMap).forEach(function(ck){ const c=cellMap[ck];
      let p=prodMap[c.key]; if(!p){ p={ key:c.key, name:c.name, written:0, units:0, pw:0, cw:0, n:0, pSum:0, priced:0 }; prodMap[c.key]=p; }
      p.written+=c.written; p.units+=c.units; p.pw+=c.pw; p.cw+=c.cw; p.n+=c.n; p.pSum+=c.pSum; p.priced+=c.priced; });
    const products=Object.keys(prodMap).map(function(k){ const p=prodMap[k]; const pr=priceOf(p);
      const gap=p.written - p.units; const wu=Math.max(0,gap);
      return { key:p.key, name:p.name, written:p.written, dispensed:p.units, gap:gap,
        conv: p.written>0 ? p.units/p.written*100 : null, price:pr.p, cost:pr.c, noPrice:(p.units>0 && pr.noPrice),
        wasteUnits:wu, wasteRevenue:wu*pr.p, wasteMargin:wu*(pr.p-pr.c) };
    });
    const cells=Object.keys(cellMap).map(function(ck){ const c=cellMap[ck]; const pr=priceOf(c);
      const gap=c.written - c.units; const wu=Math.max(0,gap);
      return { branch:c.branch, key:c.key, name:c.name, written:c.written, dispensed:c.units, gap:gap,
        conv: c.written>0 ? c.units/c.written*100 : null, wasteRevenue:wu*pr.p, wasteMargin:wu*(pr.p-pr.c) };
    });
    const totWritten=products.reduce(function(s,p){ return s+p.written; },0);
    const totDisp=products.reduce(function(s,p){ return s+p.dispensed; },0);
    const wasteRev=products.reduce(function(s,p){ return s+p.wasteRevenue; },0);
    const wasteMar=products.reduce(function(s,p){ return s+p.wasteMargin; },0);
    return { products:products, cells:cells, inWin:inWin,
      totWritten:totWritten, totDisp:totDisp, gap:totWritten-totDisp,
      conv: totWritten>0 ? totDisp/totWritten*100 : 0,
      wasteRev:wasteRev, wasteMar:wasteMar, noPrice:products.some(function(p){ return p.noPrice; }) };
  }
  function rxSeverity(conv){ if(conv==null) return ''; if(conv<40) return 'rx-red'; if(conv<80) return 'rx-amber'; return 'rx-green'; }

  /* ── screen ── */
  function rxEmptyCard(title, body){
    return '<div class="rx-empty"><div class="rx-empty-ico">'+ICO.swap+'</div>'
      + '<h3>'+esc(title)+'</h3><p>'+esc(body)+'</p>'
      + '<button class="btn btn-primary" id="rxPick">'+ICO.image+' رفع ملف مبيعات (JSON)</button></div>';
  }
  function rxNote(title, body){
    return '<div class="rx-note"><div class="rx-note-h">'+ICO.warn+' '+esc(title)+'</div><p>'+esc(body)+'</p></div>';
  }
  function rxFileBar(s){
    return '<div class="rx-filebar"><div class="rx-file-info">'+ICO.money
      + '<div><div class="rx-file-name">'+esc(s.fileName)+'</div>'
      + '<div class="rx-file-sub">'+fmt(s.entries.length)+' إدخال مبيعات'+(s.invalid?(' · '+fmt(s.invalid)+' غير صالح'):'')+'</div></div></div>'
      + '<button class="btn rx-remove">✕ إزالة ملف المبيعات</button></div>';
  }
  function rxWindowBanner(win){
    const range = (win.dayStart && win.dayEnd)
      ? ('<span dir="ltr">'+win.dayStart+'–'+win.dayEnd+'</span> '+esc(MONTH_AR[win.month]||''))
      : (esc(MONTH_AR[win.month]||'')+' '+win.year);
    return '<div class="rx-window">'+ICO.clock+'<span>نافذة المطابقة: <b>'+range+'</b> · '+esc(win.branch)+'</span>'
      + '<span class="rx-window-dates" dir="ltr">'+esc(win.start)+' → '+esc(win.end)+'</span></div>';
  }
  function rxKpi(def){
    const suf=def.suf||'';
    const disp = (def.dec!=null) ? Number(def.val).toFixed(def.dec)+suf : fmt(Math.round(def.val))+suf;
    return '<div class="kpi kpi-'+def.cls+(def.neg?' rx-neg':'')+'">'
      + '<div class="kpi-head"><div class="kpi-label">'+esc(def.label)+'</div><div class="kpi-ico">'+(KICON[def.cls]||ICO.swap)+'</div></div>'
      + '<div class="kpi-num" data-to="'+def.val+'" data-dec="'+(def.dec||0)+'" data-suf="'+suf+'">'+disp+'</div>'
      + '<div class="kpi-foot">'+esc(def.foot)+(def.badge?' <span class="rx-badge">'+esc(def.badge)+'</span>':'')+'</div></div>';
  }
  function rxDoctorChips(comp){
    const d=activeData(); const rows=(d && d.rows)||[];
    const top=comp.products.filter(function(p){ return p.gap>0; }).sort(function(a,b){ return b.gap-a.gap; }).slice(0,3);
    if(!top.length) return '';
    const blocks=top.map(function(p){
      const byDoc={};
      rows.forEach(function(r){ if(productKeyOf(r.service)===p.key){ const nm=String(r.doctor||'').trim(); if(!nm) return;
        const k=entityKey(nm); if(!byDoc[k]) byDoc[k]={ name:nm, c:0 }; byDoc[k].c++;
        if(nm.length>byDoc[k].name.length) byDoc[k].name=nm; } });
      const docs=Object.keys(byDoc).map(function(k){ return byDoc[k]; }).sort(function(a,b){ return b.c-a.c; }).slice(0,5);
      const chips=docs.map(function(dc){ return '<button class="chip rx-doc-chip" data-doc="'+escAttr(dc.name)+'">'+esc(dc.name)+' <b>'+fmt(dc.c)+'</b></button>'; }).join('');
      return '<div class="rx-chip-block"><div class="rx-chip-h">'+esc(p.name)+' — يُكتب ولا يُصرف · راجع التوافر أو تسرب المرضى للخارج</div>'
        + '<div class="chips">'+(chips || '<span class="rx-chip-none">لا أطباء لهذا الصنف في الفترة</span>')+'</div></div>';
    }).join('');
    return '<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> ربط الأطباء — أعلى الأصناف تسربًا</div></div><div class="rx-chips-wrap">'+blocks+'</div></div>';
  }
  function rxLeakTable(comp, win){
    const rows=comp.cells.slice().sort(function(a,b){ return b.gap-a.gap; });
    const body=rows.map(function(r){ const sev=rxSeverity(r.conv);
      return '<tr><td><strong>'+esc(r.name)+'</strong></td>'
        + '<td><span class="tag teal">'+esc(RX_BRANCH_LABEL[r.branch]||r.branch)+'</span></td>'
        + '<td class="num">'+fmt(r.written)+'</td>'
        + '<td class="num">'+fmt(r.dispensed)+'</td>'
        + '<td class="num"><span class="rx-conv '+sev+'">'+(r.conv==null?'—':r.conv.toFixed(1)+'%')+'</span></td>'
        + '<td class="num'+(r.gap<0?' rx-neg-num':'')+'">'+(r.gap<0?'−'+fmt(Math.abs(r.gap)):fmt(r.gap))+'</td>'
        + '<td class="num">'+fmt(Math.round(r.wasteRevenue))+'</td>'
        + '<td class="num">'+fmt(Math.round(r.wasteMargin))+'</td></tr>';
    }).join('') || '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--ink-3)">لا يوجد</td></tr>';
    return '<div class="tbl-card"><div class="tbl-head"><div class="tbl-title"><span class="dot"></span> جدول التسرب (فرع × صنف)</div>'
      + '<div class="tbl-title" style="font-size:13px;color:var(--ink-3)">'+esc(win.branch)+'</div></div>'
      + '<div class="tbl-scroll"><table class="data"><thead><tr><th>الصنف</th><th>الفرع</th><th>كُتب</th><th>صُرف</th><th>تحويل%</th><th>فجوة</th><th>إيراد مُهدَر</th><th>هامش مُهدَر</th></tr></thead><tbody>'+body+'</tbody></table></div></div>';
  }
  function rxDailyChart(id, win, comp){
    const el=document.getElementById(id); if(!el||!window.Chart) return; destroy(id);
    const tc=themeColors();
    const days=rxDatesBetween(win.start, win.end);
    const perDay={}; comp.inWin.forEach(function(e){ perDay[e.date]=(perDay[e.date]||0)+e.units; });
    let cum=0; const data=days.map(function(dt){ cum+=(perDay[dt]||0); return cum; });
    const baseline=comp.totWritten;
    const labels=days.map(function(dt){ return +dt.slice(8,10); });
    CH[id]=new Chart(el,{ type:'line',
      data:{ labels:labels, datasets:[
        { label:'مصروف تراكمي', data:data, borderColor:'#1d4ed8', backgroundColor:'rgba(29,78,216,.10)', fill:true, tension:.25, pointRadius:2, pointHoverRadius:5, borderWidth:2.4, order:1 },
        { label:'إجمالي كتابات الفترة', data:days.map(function(){ return baseline; }), borderColor:'#c0392b', borderDash:[7,5], borderWidth:2, pointRadius:0, fill:false, order:2 }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, animation:{ duration: noMotion()?0:600 },
        plugins:{ legend:{ position:'bottom', labels:{ color:tc.tick, boxWidth:12, usePointStyle:true, font:{size:11}, padding:12 } },
          tooltip:{ ...chartTip(), callbacks:{ title:function(items){ return 'يوم '+(items[0]?items[0].label:''); }, label:function(c){ return c.dataset.label+': '+fmt(c.parsed.y); } } } },
        scales:{ x:{ grid:{display:false}, border:{display:false}, ticks:{ color:tc.tick, font:{size:10} } },
                 y:{ grid:{ color:tc.grid, drawTicks:false }, border:{display:false}, beginAtZero:true, ticks:{ color:tc.tick, font:{size:10}, padding:6 } } } }
    });
  }
  function rxBarChart(id, comp){
    const el=document.getElementById(id); if(!el||!window.Chart) return; destroy(id);
    const tc=themeColors();
    const list=comp.products.slice().sort(function(a,b){ return b.gap-a.gap; });
    const labels=list.map(function(p){ return p.name; });
    CH[id]=new Chart(el,{ type:'bar',
      data:{ labels:labels, datasets:[
        { label:'كُتب', data:list.map(function(p){ return p.written; }), backgroundColor:'#3b6ef0', borderRadius:4, borderSkipped:false, maxBarThickness:26, animation:barDelay(45) },
        { label:'صُرف', data:list.map(function(p){ return p.dispensed; }), backgroundColor:'#0d9488', borderRadius:4, borderSkipped:false, maxBarThickness:26, animation:barDelay(45) }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, animation:{ duration:600 },
        plugins:{ legend:{ position:'bottom', labels:{ color:tc.tick, boxWidth:10, boxHeight:10, usePointStyle:true, font:{size:11}, padding:12 } },
          tooltip:{ ...chartTip(), callbacks:{ afterBody:function(items){ const p=list[items[0].dataIndex]; return 'تحويل: '+(p.conv==null?'—':p.conv.toFixed(1)+'%'); } } } },
        scales:{ x:{ grid:{display:false}, border:{display:false}, ticks:{ color:tc.tick, font:{size:10}, maxRotation:55, minRotation:30 } },
                 y:{ beginAtZero:true, grid:{ color:tc.grid, drawTicks:false }, border:{display:false}, ticks:{ color:tc.tick, font:{size:10}, padding:6 } } } }
    });
  }
  function renderRxSales(){
    const S=STATE.sales;
    if(!S){
      stub.innerHTML = rxEmptyCard('لا يوجد ملف مبيعات',
        'صدّر «نسخة احتياطية» من داشبورد المبيعات (ملف JSON) ثم ارفعه من زر «رفع ملف» أعلى الصفحة لمقارنة كتابات الأطباء بالصرف الفعلي.');
      const pk=document.getElementById('rxPick'); if(pk) pk.onclick=function(){ pickFile(); };
      return;
    }
    const bar=rxFileBar(S);
    const d=activeData();
    if(!d){
      stub.innerHTML = bar + rxNote('لا توجد فترة أوراكل للفرع النشط',
        'افتح «نظرة عامة» وارفع تقرير الوصفات (PDF/Excel) لهذا المجمّع، ثم عُد لهذه الشاشة.');
      wireRxCommon();
      return;
    }
    const win=rxWindow();
    if(!win){
      stub.innerHTML = bar + rxNote('تعذّر تحديد نافذة الفترة من اسم الملف',
        'اسم ملف الفترة لا يحوي تاريخًا واضحًا. استخدم اسمًا يحوي نطاق التواريخ مثل 01-07_to_20-07 أو YYYY-MM-DD.');
      wireRxCommon();
      return;
    }
    const comp=rxCompute(win);
    if(!comp.inWin.length){
      stub.innerHTML = bar + rxWindowBanner(win) + rxNote('لا توجد مبيعات داخل نافذة الفترة',
        'يوجد '+fmt(S.entries.length)+' إدخال مبيعات لكنها خارج النطاق ['+win.start+' → '+win.end+']'
        + (STATE.active!=='ALL'?(' لفرع '+curBranch().label):'')+'. تحقّق من الفترة أو الفرع النشط.');
      wireRxCommon();
      return;
    }
    const kpis=[
      rxKpi({ label:'كتابات الفترة', val:comp.totWritten, cls:'k1', foot:'مجموع الأصناف الـ13', dec:0 }),
      rxKpi({ label:'وحدات مصروفة', val:comp.totDisp, cls:'k2', foot:'مجموع الوحدات داخل النافذة', dec:0 }),
      rxKpi({ label:'معدل التحويل', val:comp.conv, cls:'k7', foot:'مصروف ÷ مكتوب', dec:1, suf:'%' }),
      rxKpi({ label:'فجوة التسرب (وحدات)', val:comp.gap, cls:'k3', neg:(comp.gap<0), foot:(comp.gap<0?'صرف أعلى من الكتابة':'مكتوب − مصروف'), dec:0 }),
      rxKpi({ label:'إيراد مُهدَر (ج.م)', val:comp.wasteRev, cls:'k5', foot:'سعر بيع مرجّح بالوحدات', dec:0, badge:(comp.noPrice?'بعض الأصناف بلا سعر':'') }),
      rxKpi({ label:'هامش مُهدَر (ج.م)', val:comp.wasteMar, cls:'k6', foot:'(سعر − تكلفة) × الفجوة', dec:0 })
    ].join('');
    stub.innerHTML = bar + rxWindowBanner(win)
      + '<div class="kpi-grid">'+kpis+'</div>'
      + boardBar('الكتابة مقابل الصرف', 'rxBoard')
      + '<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> الصرف التراكمي اليومي مقابل إجمالي كتابات الفترة</div></div><div class="chart-box" style="height:320px"><canvas id="rxLine"></canvas></div></div>'
      + '<div class="card"><div class="card-head"><div class="card-title"><span class="dot"></span> كُتب مقابل صُرف لكل صنف (مرتّب بالفجوة)</div></div><div class="chart-box" style="height:340px"><canvas id="rxBar"></canvas></div></div>'
      + rxDoctorChips(comp)
      + rxLeakTable(comp, win);
    animateKpiNums(stub);
    rxDailyChart('rxLine', win, comp);
    rxBarChart('rxBar', comp);
    wireBoard('rxBoard', 'rxLine', 'الكتابة مقابل الصرف — الصرف التراكمي');
    stub.querySelectorAll('.rx-doc-chip').forEach(function(c){ c.onclick=function(){ openDoctorFrom(c.dataset.doc); }; });
    wireRxCommon();
  }
  function wireRxCommon(){
    stub.querySelectorAll('.rx-remove').forEach(function(b){ b.onclick=removeSales; });
  }
