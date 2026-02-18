// app/boot_hotfix.js — Rev7.3 FULL
(function(){
  const $=id=>document.getElementById(id);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const L=()=> (localStorage.getItem('pm_lang')==='EN'?'EN':'AR');
  function showMsg(hostId, txt){ const h=$(hostId); if(h) h.innerHTML = '<div class="msg">'+txt+'</div>'; }
  function navTo(id){ qa('.section').forEach(s=> s.classList.remove('active')); const el=$(id); if(el) el.classList.add('active'); }
  function bind(){
    const mf=$('btnMonthlyFaults'); if(mf && !mf._bound){
      mf.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); navTo('faultsSection'); if(typeof window.renderFaultsUI==='function'){ try{ window.renderFaultsUI(); }catch(err){ showMsg('faultsSection','خطأ تشغيل تقرير الأعطال.'); } } else { showMsg('faultsSection','ملف app/faults.js غير محمّل.'); } });
      mf._bound=true;
    }
    const ad=$('btnAdmin'); if(ad && !ad._bound){
      ad.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); if(typeof window.askPinAndOpen==='function'){ try{ window.askPinAndOpen(); }catch(err){ navTo('adminSection'); showMsg('adminSection','خطأ فتح الإدارة.'); } } else { navTo('adminSection'); showMsg('adminSection','ملف app/admin.js غير محمّل.'); } });
      ad._bound=true;
    }
  }
  function syncBtnLang(){ const m=$('btnMonthlyFaults'); const a=$('btnAdmin'); const ar=L()==='AR'; if(m) m.textContent = ar? 'تقرير الأعطال الشهريه':'Monthly Faults Report'; if(a) a.textContent = ar? 'الإدارة':'Administration'; }
  function boot(){ bind(); syncBtnLang(); const lt=$('langToggle'); if(lt && !lt._wired){ lt.addEventListener('click', ()=> setTimeout(()=>{ syncBtnLang(); const sec=$('faultsSection'); if(sec && sec.classList.contains('active') && typeof window.renderFaultsUI==='function') window.renderFaultsUI(); const secA=$('adminSection'); if(secA && secA.classList.contains('active') && typeof window.askPinAndOpen==='function') window.askPinAndOpen(''); }, 120)); lt._wired=true; } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
