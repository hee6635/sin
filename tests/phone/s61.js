// v0.80 묶음 2: 회사 휴무일=명절 모양 · 기념일=메모 줄 · 오늘 띠 색 · 메모 칸 하한 · 시각 1분 조정 · 1/2 배지 비례
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const toSet=async p=>{await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);};
  // ── 회사 휴무일 · 기념일
  {
    const st={...base,addons:{...base.addons,comp:true},companyHols:[{id:'c1',name:'창립기념일',date:'2026-10-14',yearly:false,kind:'off',emoji:'🏢'},{id:'c2',name:'엄마 생일',date:'2026-10-16',yearly:false,kind:'memo',emoji:'🎂'}]};
    const p=await boot(b,st,{touch:true});
    const r=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]'),dn=c.querySelector('.dn'),d2=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-16"]');return {cls:dn.className,txt:dn.textContent.replace(/\s+/g,' ').trim(),num:getComputedStyle(dn.querySelector('.num')).color,dd:[...d2.querySelectorAll('.pl.dd')].map(x=>x.textContent.trim())};});
    T('회사 휴무일(창립기념일): 공휴일처럼 빨간 날짜 + 띠에 짧은 이름 "창립"',/\bhol\b/.test(r.cls)&&/\bsun\b/.test(r.cls)&&/창립/.test(r.txt)&&!/기념일/.test(r.txt),JSON.stringify(r));
    T('기념일(엄마 생일)은 메모 줄로 보임',r.dd.length===1&&/엄마 생일/.test(r.dd[0]),JSON.stringify(r.dd));
    await p.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(JSON.parse(j));});
    await toSet(p);await p.evaluate(()=>document.querySelector('[data-act="more-widget"]').click());await p.waitForTimeout(500);
    await p.evaluate(()=>document.querySelector('[data-act="wg-look"][data-v="circle"]').click());await p.waitForTimeout(900);
    const w=await p.evaluate(()=>window.__wg[window.__wg.length-1]);
    const d14=w&&w.days.find(x=>x.k==='2026-10-14');
    T('위젯 데이터에도 회사 휴무일이 명절처럼(hol=창립)',!!d14&&d14.hol==='창립',JSON.stringify(d14||(w&&w.days.slice(0,3))));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 오늘 띠 색 (설정 + 조정 화면) · 메모 칸 하한 · 위젯 데이터
  {
    const p=await boot(b,{...base,calLook:'fill'},{touch:true});
    await p.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(JSON.parse(j));});
    await toSet(p);
    T('설정(칸 채우기)에 "오늘 띠 색" 줄(근무 색 + 동그라미 6개 + 직접 고르기)',await p.evaluate(()=>document.querySelectorAll('.tdc[data-act="todaycolor"]').length===7&&!!document.querySelector('.tdc-shift')&&!!document.querySelector('.tdc-pick input')));
    await p.evaluate(()=>document.querySelector('.tdc[data-v="#1fa971"]').click());await p.waitForTimeout(400);
    const c1=await p.evaluate(()=>({v:getComputedStyle(document.documentElement).getPropertyValue('--tdc').trim(),s:JSON.parse(localStorage.getItem('eonjeswieo:v1')).todayColor}));
    T('초록을 고르면 --tdc · 저장됨',c1.v==='#1fa971'&&c1.s==='#1fa971',JSON.stringify(c1));
    await p.evaluate(()=>document.querySelector('[data-act="more-widget"]')&&document.querySelector('[data-act="more-widget"]').click());await p.waitForTimeout(500);
    const w=await p.evaluate(()=>window.__wg[window.__wg.length-1]);
    T('위젯 데이터에 오늘 표시 모양 · 색이 실림(today.look · today.color)',!!w&&w.today&&w.today.look==='b'&&w.today.color==='#1fa971',JSON.stringify(w&&w.today));
    await p.evaluate(()=>document.querySelector('[data-act="page-close"]')&&document.querySelector('[data-act="page-close"]').click());await p.waitForTimeout(250);
    for(let i=0;i<7;i++)await p.evaluate(()=>document.querySelector('[data-act="about-tap"]')&&document.querySelector('[data-act="about-tap"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="tune-open"]')&&document.querySelector('[data-act="tune-open"]').click());await p.waitForTimeout(500);
    T('조정 화면에도 띠 색 줄 · 메모 칸 높이 하한 0.4',await p.evaluate(()=>!!document.querySelector('#page .tdc-row')&&+document.querySelector('.tn-r[data-g="appCover"][data-k="pill"]').min===0.4));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // (시간 고르기는 v0.83 에서 바퀴로 바뀜 → s63)
  T.sum();await b.close();
})();
