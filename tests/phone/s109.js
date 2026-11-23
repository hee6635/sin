// v0.237: 반복 메모 "그날이 ○○이 아니면" 3가지 (건너뛰기 · 앞당기기(prev) · 미루기) · 근무 조건 한 줄 칩 · 설명문은 고른 것에 맞춰 · 3개 이상은 줄여 씀
const {chromium,boot,mkT,base}=require('./lib.js');
// base: anchor 2026-10-02 · 주 야 휴 휴 → 주간 날 = 10/2 6 10 14 18 22 26 30 · 10/24 는 휴
const rm=(id,md,miss)=>({id,text:'메모'+id,md,sh:['주'],miss,from:'2026-09-01',t:1});
(async()=>{const T=mkT();const b=await chromium.launch();
  const p=await boot(b,{...base,rmemos:[rm('a',24,'skip'),rm('b',24,'prev'),rm('c',24,'next'),rm('d',1,'prev')]});
  const on=k=>p.evaluate(k=>__wx.visibleMemos(k).filter(m=>m.rep).map(m=>m.rep).sort().join(''),k);
  const got={};for(const k of ['2026-10-22','2026-10-24','2026-10-26','2026-10-30','2026-10-01','2026-09-28']){got[k]=await on(k);}
  T('건너뛰기: 24일이 휴무면 그달은 없음',!Object.values(got).join('').includes('a'),JSON.stringify(got));
  T('앞당기기: 바로 앞 주간 날(22일)',got['2026-10-22']==='b',JSON.stringify(got));
  T('미루기: 바로 뒤 주간 날(26일)',got['2026-10-26']==='c',JSON.stringify(got));
  T('앞당기기가 달을 넘어감: 11월 1일 몫 → 10월 30일 · 10월 1일 몫 → 9월 28일 (10월 1일엔 없음)',got['2026-10-30']==='d'&&got['2026-09-28']==='d'&&got['2026-10-01']==='',JSON.stringify(got));
  const sv=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return (s.rmemos||[]).map(r=>r.miss).join(',');});
  T('저장 값 그대로 (prev 도 남음)',sv==='skip,prev,next,prev'||sv==='',sv);
  T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  // 다시 켜도 prev 유지
  const q=await boot(b,{...base,rmemos:[rm('b',24,'prev'),{...rm('x',24,'weird')}]});
  const m=await q.evaluate(()=>__wx.S.rmemos.map(r=>r.miss).join(','));
  T('다시 켜도 앞당기기 유지 · 이상한 값은 건너뛰기',m==='prev,skip',m);await q.close();
  // 화면에서: 근무 조건 고르고 앞당기기 → 저장
  {const r=await boot(b,{...base});
   await r.evaluate(()=>{const b=document.createElement('button');b.dataset.act='per-open';b.dataset.k='2026-10-24';b.dataset.id='';document.body.appendChild(b);b.click();b.remove();});await r.waitForTimeout(500);
   await r.fill('#mdText','월급');await r.click('#page [data-act="md-rep"]');await r.waitForTimeout(400);
   await r.click('#pop [data-act="rr-sh"][data-v="주"]');await r.waitForTimeout(250);
   const ui=await r.evaluate(()=>({h:(document.querySelector('#pop .rrmh')||{}).textContent,n:document.querySelectorAll('#pop .rrmiss button').length,chipH:Math.round(document.querySelector('#pop .rrsh [data-v="주"]').getBoundingClientRect().height),bh:Math.round(document.querySelector('#pop .rrsh [data-v="주"] .badge').getBoundingClientRect().height)}));
   T('근무 조건 한 줄 칩 (배지가 칩 안) · 제목 "그날이 주간이 아니면" · 버튼 3개',ui.h==='그날이 주간이 아니면'&&ui.n===3&&ui.bh<ui.chipH,JSON.stringify(ui));
   await r.click('#pop [data-act="rr-miss"][data-v="prev"]');await r.waitForTimeout(250);
   const sum=await r.evaluate(()=>document.querySelector('#pop .rrsum').textContent);
   T('설명문이 고른 것에 맞춰',sum==='매달 24일 · 주간인 날만 · 아니면 바로 앞 주간 날에',sum);
   await r.click('#pop [data-act="rr-ok"]');await r.waitForTimeout(400);await r.click('#page [data-act="md-save"]');await r.waitForTimeout(600);
   const rr=await r.evaluate(()=>(__wx.S.rmemos||[]).map(x=>x.miss+'/'+x.md+'/'+x.sh.join('')).join(','));
   T('저장: 앞당기기(prev) 그대로',rr==='prev/24/주',rr);
   T('오류 없음 (화면)',r.errs.length===0,r.errs.join('|'));await r.close();}
  await b.close();T.sum();
})();
