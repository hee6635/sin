// v0.141: 쉬는 날 날씨 팝업 위쪽 = 왼쪽 지금 · 오른쪽 오늘 요약 · 모양 조정 정리(주 고르기 · 접기 · 오늘 표시는 화면으로)
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h)=>Date.UTC(y,mo-1,d,h-9);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const act=(p,a,ds={})=>p.evaluate(([a,ds])=>{const x=document.createElement('button');x.dataset.act=a;Object.assign(x.dataset,ds);document.body.appendChild(x);x.click();x.remove();},[a,ds]);
  { // 1) 쉬는 날 날씨
    const TP=[5,5,4,4,4,4,4,5,8,10,12,13,14,14,15,14,13,10,8,7,6,6,5,5];
    const mk=r=>{const h={},n={};for(let d=11;d<=18;d++){for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[TP[x],10,0,1,0,2,50];n[`202610${p2(d)}`]=[4,15];}return {v:1,r,n:'',s:{b:'202610120500',h,n},m:{b:'',d:{}},a:{b:'',d:{}},q:null};};
    const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(u.searchParams.has('past')?{d:{}}:{list:[mk('41111'),mk('41113')]})});}]];
    const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
    const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'41113',fw:{},nm:{}}},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes});
    await p.waitForTimeout(2200);
    const cards=async k=>{await p.evaluate(()=>__wx.closePop());await p.evaluate(k=>__wx.wxOpenDay(k),k);await p.waitForTimeout(500);return p.evaluate(()=>[...document.querySelectorAll('#pop .wxcs .wxc')].map(c=>c.innerText.replace(/\s+/g,' ')));};
    const a=await cards('2026-10-12');
    T('쉬는 날 오늘: 왼쪽 "지금 오전 10시 12°" · 오른쪽 "오늘 요약 4° / 15° · 일교차 11°"',a.length===2&&/지금/.test(a[0])&&/12°/.test(a[0])&&/오늘 요약/.test(a[1])&&/4° \/ 15°/.test(a[1])&&/일교차 11°/.test(a[1]),JSON.stringify(a));
    T('옷 · 시간별 줄은 그대로',await p.evaluate(()=>!!document.querySelector('#pop .wxrw.all')&&!!document.querySelector('#pop .wxhr')));
    const c=await cards('2026-10-13');
    T('쉬는 날 다른 날: 왼쪽 "하루 10월 13일" 날씨 · 오른쪽 "하루 요약 4° / 15°"',c.length===2&&/하루 10월 13일/.test(c[0])&&/하루 요약/.test(c[1])&&/4° \/ 15°/.test(c[1]),JSON.stringify(c));
    const w=await cards('2026-10-14');
    T('근무 날은 출근 · 퇴근 그대로',w.length===2&&/출근/.test(w[0])&&/퇴근/.test(w[1]),JSON.stringify(w));
    T('오류 없음 (쉬는 날 날씨)',p.errs.filter(x=>!/Failed to load/.test(x)).length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 모양 조정 정리
    const m=(id,t)=>({id,text:t,shared:false,by:'host',t:1});
    const p=await boot(b,{...base,calLook:'fill',memos:{'2026-10-14':[m('a','치과 3시'),m('b','택배'),m('c','장보기')]}});
    await act(p,'tune-open');await p.waitForTimeout(500);
    const r=await p.evaluate(()=>({look:!!document.querySelector('#page.open [data-act="callook"]'),today:!!document.querySelector('#page.open [data-act="todaylook"],#page.open .tdc-row'),wk:document.getElementById('tnWk').innerText.replace(/\s+/g,' '),
      open:[...document.querySelectorAll('#page.open details.tn-grp')].filter(d=>d.open).map(d=>d.querySelector('summary').textContent),n:document.querySelectorAll('#page.open details.tn-grp').length}));
    T('모양 조정: 달력 모양 · 오늘 표시 없음 (화면에만)',!r.look&&!r.today,JSON.stringify(r));
    T('지금 이 화면 묶음만 펼침 · 나머지 접힘',r.open.length===1&&/지금 이 화면/.test(r.open[0])&&r.n>=4,JSON.stringify(r));
    T('미리보기 주 고르기: 메모 많은 주(3째 주)부터',/10월 3째 주/.test(r.wk),r.wk);
    await p.click('[data-act="tn-wk"][data-d="1"]');await p.waitForTimeout(200);
    const k=await p.evaluate(()=>[...document.querySelectorAll('#tnPrev .cell[data-k]')].map(c=>c.dataset.k));
    T('▼ → 4째 주 (10/18 ~ 10/24)',k[0]==='2026-10-18'&&k.length===7&&/4째 주/.test(await p.evaluate(()=>document.getElementById('tnWk').innerText)),JSON.stringify(k));
    const hh=await p.evaluate(()=>{const pc=document.querySelector('#tnPrev .cell'),rc=document.querySelector('#view #track>.panel:nth-child(2) .cell');return [pc.getBoundingClientRect().height,rc.getBoundingClientRect().height];});
    T('미리보기 칸 높이 ≈ 실제 달력 칸 (안 잘림)',Math.abs(hh[0]-hh[1])<6,JSON.stringify(hh));
    await p.evaluate(()=>{const x=document.querySelector('#page.open [data-act="page-close"]');x&&x.click();});await act(p,'more-look');await p.waitForTimeout(400);
    T('설정 › 화면에 오늘 표시 색 · 모양',await p.evaluate(()=>!!document.querySelector('#page.open .tdc-row')&&document.querySelectorAll('#page.open [data-act="todaylook"]').length===4));
    await p.evaluate(()=>document.querySelector('#page.open [data-act="todaylook"][data-v="c"]').click());await p.waitForTimeout(200);
    T('화면에서 오늘 표시 모양 바꾸기 → 저장 · 화면 그대로',await p.evaluate(()=>__wx.S.todayLook==='c'&&!!document.querySelector('#page.open .tdc-row')));
    T('오류 없음 (모양 조정)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();})();
