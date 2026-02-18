// app/faults.js — Rev7.3 FULL (guard + report + KPI)
(function(){
  const $=id=>document.getElementById(id);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const L=()=> (localStorage.getItem('pm_lang')==='EN'?'EN':'AR');
  const ymKey=(d)=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const fmt=(iso)=>{ try{ const d=new Date(iso); if(!isFinite(d)) return String(iso||''); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); const hh=String(d.getHours()).padStart(2,'0'); const mi=String(d.getMinutes()).padStart(2,'0'); return `${y}-${m}-${dd} ${hh}:${mi}`; }catch(_){ return String(iso||''); } };

  // Local store (fallback for Netlify if absent)
  const Store={ list(ym){ try{ return JSON.parse(localStorage.getItem('faults-'+ym)||'[]'); }catch(_){ return []; } }, save(ym,rows){ try{ localStorage.setItem('faults-'+ym, JSON.stringify(rows)); }catch(_){ } } };

  function readHeader(){
    const grid=$('headerGrid'); if(!grid) return {};
    const out={};
    qa('.kv',grid).forEach(k=>{ const lab=(k.querySelector('label')||{}).textContent||''; const val=(k.querySelector('.val')||{}).textContent||''; const t=lab.toLowerCase(); if(/code|كود/.test(t)) out.code=val.trim(); if(/machine|اسم الآلة|اسم الماك|الماكينة/.test(t)) out.machine=val.trim(); if(/location|الموقع/.test(t)) out.location=val.trim(); });
    // technician/date are editable; but we don't need them for faults
    return out;
  }

  function captureRow(row){
    const sel=row.querySelector('select'); if(!sel) return null;
    const ta=row.querySelector('textarea');
    const photos=row.querySelectorAll('.photosWrap img');
    const ar=(row.querySelector('.labelBox .ar')||{}).textContent||'';
    const en=(row.querySelector('.labelBox .en')||{}).textContent||'';
    const item=(ar&&en)? `${ar} / ${en}`: (ar||en||'-');
    const H=readHeader();
    return { date:new Date().toISOString(), code:H.code||'', machine:H.machine||'', location:H.location||'', item, remark:(ta&&ta.value||'').trim(), photosCount:photos.length, status:(sel? sel.value:'' ) };
  }

  function upsertFaultToday(rec){ if(!rec || rec.status!=='fault') return; const d=new Date(rec.date); const ym=ymKey(d); const rows=Store.list(ym); const dayKey=`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; const key=`${rec.code}__${rec.item}__${dayKey}`; let found=false; for(let i=0;i<rows.length;i++){ const di=new Date(rows[i].date||rec.date); const dk=`${di.getFullYear()}-${di.getMonth()+1}-${di.getDate()}`; const k2=`${rows[i].code}__${rows[i].item}__${dk}`; if(k2===key){ rows[i]={...rows[i], ...rec, date: rows[i].date||rec.date}; found=true; break; } } if(!found) rows.push(rec); Store.save(ym, rows); }

  function wireChecklistCapture(){ const host=$('checklistView'); if(!host) return; const bind=(row)=>{ if(row._wired) return; row._wired=true; const sel=row.querySelector('select'); const ta=row.querySelector('textarea'); const ph=row.querySelector('.photosWrap'); const fire=()=>{ const rec=captureRow(row); upsertFaultToday(rec); };
      if(sel) sel.addEventListener('change', fire); if(ta) ta.addEventListener('input', fire); if(ph){ const mo=new MutationObserver(fire); mo.observe(ph,{childList:true}); row._mo=mo; } };
    qa('.itemRow',host).forEach(bind);
    const mo=new MutationObserver(()=> qa('.itemRow',host).forEach(bind)); mo.observe(host,{childList:true,subtree:true});
  }

  function guardExportPDF(){ const btn=$('btnExportPDF'); if(!btn || btn._guarded) return;
    const M=(L()==='AR')? {needRemark:'أدخل الملاحظة لكل عنصر حالته NOT OK', needPhoto:'أضِف صورة لكل عنصر حالته NOT OK'} : {needRemark:'Enter remarks for every NOT OK item', needPhoto:'Add at least one photo for every NOT OK item'};
    // capture phase guard
    btn.addEventListener('click', ()=>{}, true);
    btn.addEventListener('click', (e)=>{
      const host=$('checklistView'); if(!host) return; let badR=null, badP=null; qa('.itemRow',host).forEach(row=>{ const rec=captureRow(row); if(rec && rec.status==='fault'){ if(!badR && !rec.remark) badR=row; if(!badP && rec.photosCount===0) badP=row; } });
      if(badR||badP){ e.stopImmediatePropagation(); e.preventDefault(); const msg=(badR?M.needRemark:'')+((badR&&badP)?' — ':'')+(badP?M.needPhoto:''); alert(msg); [badR,badP].forEach(x=>{ if(x){ x.style.outline='3px solid #f44336'; setTimeout(()=> x.style.outline='', 1500);} }); return false; }
      // else ensure snapshot store
      try{ qa('.itemRow',host).forEach(row=>{ const rec=captureRow(row); upsertFaultToday(rec); }); }catch(_){ }
      return true;
    });
    btn._guarded=true;
  }

  // ===== Faults page =====
  function renderFaultsUI(){
    const lang=L();
    const tr=(lang==='AR')? {title:'تقرير الأعطال الشهري', month:'الشهر', code:'فلترة بالكود', no:'لا توجد سجلات.', x:'تصدير XLSX', share:'مشاركة (واتساب/إيميل)', kpi:'KPI + رسم بياني', back:'رجوع', photo10:'صورة (1/0)'} : {title:'Monthly Faults Report', month:'Month', code:'Filter by code', no:'No records.', x:'Export XLSX', share:'Share (WhatsApp/Email)', kpi:'KPI + Chart', back:'Back', photo10:'Photo (1/0)'};
    const sec=$('faultsSection'); if(!sec) return; sec.innerHTML=''; sec.dir=(lang==='AR'?'rtl':'ltr');
    const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0');
    const card=document.createElement('div'); card.className='group'; card.style.padding='10px'; card.innerHTML=`<h4 style="margin:0 0 10px">${tr.title}</h4><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label>${tr.month} <input id="fltMonth" type="month" value="${y}-${m}" style="padding:8px;border:1px solid #d2d6e0;border-radius:8px"></label><label>${tr.code} <input id="fltCode" type="text" style="padding:8px;border:1px solid #d2d6e0;border-radius:8px"></label><button id="btnExportFaultsXLSX" class="secondary">${tr.x}</button><button id="btnShareFaults" class="ghost">${tr.share}</button><button id="btnOpenKPI" class="primary">${tr.kpi}</button><button id="btnBackFaults" class="ghost">${tr.back}</button></div>`;
    sec.appendChild(card);
    const wrap=document.createElement('div'); wrap.id='faultsTableWrap'; wrap.className='group'; wrap.style.padding='10px'; sec.appendChild(wrap);

    async function fetchRows(){ const ym=$('fltMonth').value; return Store.list(ym); }
    function rer(rows){ const f=($('fltCode').value||'').trim().toUpperCase(); const arr=rows.filter(r=>{ const code=String(r.code||'').toUpperCase(); return !f || code.includes(f); }); if(!arr.length){ wrap.innerHTML=`<div class="msg">${tr.no}</div>`; return; } const headers=(L()==='AR')? ['تاريخ','كود','ماكينة','موقع','عنصر','ملاحظة',tr.photo10] : ['Date','Code','Machine','Location','Item','Remarks',tr.photo10]; const t=document.createElement('table'); const trh=document.createElement('tr'); headers.forEach(h=>{ const th=document.createElement('th'); th.textContent=h; trh.appendChild(th); }); t.appendChild(trh); const tb=document.createElement('tbody'); arr.forEach(r=>{ const trr=document.createElement('tr'); [fmt(r.date), r.code||'', r.machine||'', r.location||'', r.item||'', r.remark||'', (r.photosCount||0)>0?1:0].forEach(v=>{ const td=document.createElement('td'); td.textContent=(v==null?'':v); trr.appendChild(td); }); tb.appendChild(trr); }); t.appendChild(tb); wrap.innerHTML=''; wrap.appendChild(t); }

    (async()=>{ rer(await fetchRows()); })();
    $('fltMonth').addEventListener('input', async()=> rer(await fetchRows()));
    $('fltCode').addEventListener('input', async()=> rer(await fetchRows()));
    $('btnExportFaultsXLSX').onclick=()=>{ try{ if(!window.XLSX){ alert('XLSX lib missing'); return; } const ym=$('fltMonth').value; const rows=Store.list(ym); const out=rows.map(r=> ({Date:fmt(r.date), Code:r.code, Machine:r.machine, Location:r.location, Item:r.item, Remark:r.remark, Photo:(r.photosCount||0)>0?1:0})); const ws=XLSX.utils.json_to_sheet(out); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Faults'); XLSX.writeFile(wb, `AMMS Faults report - ${ym}.xlsx`); }catch(e){ alert('Export XLSX failed: '+e); } };
    $('btnShareFaults').onclick=()=>{ const ym=$('fltMonth').value; const rows=Store.list(ym); const txt=(L()==='AR'?`تقرير أعطال ${ym}: `:`Faults report ${ym}: `)+rows.length; const url=`https://wa.me/?text=${encodeURIComponent(txt)}`; if(navigator.share){ navigator.share({text:txt}).catch(()=> window.open(url,'_blank')); } else window.open(url,'_blank'); };
    $('btnOpenKPI').onclick=()=> openKPI();
    $('btnBackFaults').onclick=()=>{ qa('.section').forEach(s=> s.classList.remove('active')); $('homeSection')?.classList.add('active'); };
  }

  function drawBars(canvas, labels, values){ const DPR=Math.max(1, window.devicePixelRatio||1); const W=canvas.clientWidth||640, H=260; canvas.width=W*DPR; canvas.height=H*DPR; canvas.style.width=W+'px'; canvas.style.height=H+'px'; const ctx=canvas.getContext('2d'); ctx.scale(DPR,DPR); ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H); const pad={l:56,r:20,t:14,b:56}; const plotW=W-pad.l-pad.r, plotH=H-pad.t-pad.b; const max=Math.max(...values,1); ctx.strokeStyle='#e8eef6'; ctx.fillStyle='#607089'; const step=Math.max(1, Math.ceil(max/6)); for(let y=0;y<=max;y+=step){ const yy=pad.t+plotH-(y/max)*plotH; ctx.beginPath(); ctx.moveTo(pad.l,yy); ctx.lineTo(W-pad.r,yy); ctx.stroke(); ctx.font='11px Segoe UI'; ctx.fillText(String(Math.round(y)), 8, yy+3); } const n=values.length; const gap=14; const bw=Math.max(18, Math.floor((plotW-gap*(n-1))/n)); let x=pad.l; ctx.textAlign='center'; for(let i=0;i<n;i++){ const v=values[i]; const h=(v/max)*plotH; ctx.fillStyle='#2B8BEA'; ctx.fillRect(x, pad.t+plotH-h, bw, h); ctx.fillStyle='#0f172a'; ctx.font='11px Segoe UI'; ctx.fillText(String(Math.round(v)), x+bw/2, pad.t+plotH-h-6); const lbl=labels[i]||''; ctx.fillStyle='#48566A'; ctx.font='12px Segoe UI'; ctx.fillText(lbl, x+bw/2, H-18); x += bw+gap; }
  }

  async function openKPI(){
    const lang=L(); const tr=(lang==='AR')? {title:'مؤشرات الأداء', eff:'كفاءة المعدّات', daily:'اليومي', monthly:'الشهري', total:'إجمالي الأصول', oos:'خارج الخدمة'} : {title:'KPI Dashboard', eff:'Equipment efficiency', daily:'Daily', monthly:'Monthly', total:'Total Assets', oos:'Out of service'};
    const sec=$('faultsSection'); if(!sec) return; const box=document.createElement('div'); box.className='group'; box.style.padding='10px'; box.innerHTML=`<h4 style="margin:0 0 8px">${tr.title}</h4><div id="kpiCards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px"></div><div style="border:1px solid #e5e8ef;border-radius:12px;padding:8px;margin-top:8px"><canvas id="kpiCv" style="width:640px;max-width:100%;height:260px"></canvas></div>`; sec.appendChild(box);
    try{
      if(!window.XLSX) throw new Error('XLSX lib missing');
      const urls=['./PM MAINTENANCE.xlsx','./PM%20MAINTENANCE.xlsx','PM MAINTENANCE.xlsx','PM_MAINTENANCE.xlsx']; let ab=null; for(const u of urls){ try{ const r=await fetch(u,{cache:'no-store'}); if(r.ok){ ab=await r.arrayBuffer(); break; } }catch(_){ } }
      if(!ab) throw new Error('PM file not found');
      const wb=XLSX.read(new Uint8Array(ab),{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''}); const head=rows[0]||[]; const data=rows.slice(1);
      const low=head.map(h=> String(h).toLowerCase()); const idx=(kw)=> low.findIndex(h=> h.includes(kw));
      const iCode=idx('code'); const iCond=idx('condition'); const iEst=idx('estimated maintenance hrs');
      const totalAssets=data.filter(r=> String(r[iCode]||'').trim()).length;
      const oos=data.filter(r=> /out of service|خارج/.test(String(r[iCond]||''))).length;
      const estVals=data.map(r=> Number(r[iEst]||0)).filter(v=> isFinite(v) && v>=0);
      const totalEstMonth= estVals.reduce((a,b)=> a+b, 0);
      const now=new Date(); const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
      const activeAssets=Math.max(1, totalAssets - oos);
      const effDaily=Math.max(0, 1 - (totalEstMonth/(24*activeAssets))) * 100;
      const effMonthly=Math.max(0, 1 - (totalEstMonth/(24*daysInMonth*activeAssets))) * 100;
      const cards=$('kpiCards'); const add=(lab,val)=>{ const c=document.createElement('div'); c.style.border='1px solid #e5e8ef'; c.style.borderRadius='12px'; c.style.background='#fafcff'; c.style.padding='10px'; c.innerHTML=`<div style=\"font:600 12px Segoe UI;color:#607089\">${lab}</div><div style=\"font:800 18px Segoe UI;color:#0b1324\">${val}</div>`; cards.appendChild(c); };
      add(tr.total, String(totalAssets)); add(tr.oos, String(oos));
      drawBars($('kpiCv'), [tr.daily,tr.monthly], [effDaily, effMonthly]);
    }catch(e){ alert('KPI failed: '+(e&&e.message?e.message:e)); }
  }

  document.addEventListener('DOMContentLoaded', ()=>{ guardExportPDF(); wireChecklistCapture(); });
  window.renderFaultsUI = renderFaultsUI; window.openKPI=openKPI;
})();
