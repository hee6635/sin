// v0.94: 업무 일지 위젯 표시 · 위젯에서 일지 열기 · 스티커 근무 맞춤(근무타입별) · 알림 소리 바로가기
const {chromium,boot,mkT,base}=require('./lib.js');
const ONLY=process.env.ONLY||'';
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const want=k=>!ONLY||ONLY.split(',').includes(k);
  const t0=+new Date('2026-10-12T10:00:00');
  const wlog={name:'인수인계',secs:[{id:'a',n:'인수',h:false},{id:'b',n:'인계',h:false},{id:'c',n:'지시',h:false},{id:'d',n:'특이',h:false}],backup:false,seen:true,days:{'2026-10-12':{b:'원료 확인\n순찰 2회',d:'비밀 압력 낮음'}}};
  const memo=(id,text,x={})=>({id,text,shared:false,by:'host',t:t0,...x});
  // ── 1. 위젯 데이터: 메모 맨 위 "📋 이름" · wl:1 · wlr 요약 · 글 내용은 안 감
  if(want('wg')){
    const p=await boot(b,{...base,addons:{...base.addons,wlog:true},wlog,memos:{'2026-10-12':[memo('m1','엄마 생신'),memo('m2','가족 메모',{shared:true})]}},{});
    await p.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(j);window.__refresh();});await p.waitForTimeout(1200);
    const r=await p.evaluate(()=>{const j=window.__wg[window.__wg.length-1];const o=JSON.parse(j);let d=null;const w=x=>{if(Array.isArray(x))x.forEach(w);else if(x&&typeof x==='object'){if(x.k==='2026-10-12'&&x.ms)d=x;Object.values(x).forEach(w);}};w(o);return {d,raw:j};});
    T('위젯: 메모 맨 위 "📋 인수인계" · wl:1 · 가족 메모 수(nf)는 그대로',r.d&&r.d.ms[0]==='📋 인수인계'&&r.d.wl===1&&r.d.nf===1&&r.d.ms[1]==='가족 메모',JSON.stringify(r.d&&{ms:r.d.ms,wl:r.d.wl,nf:r.d.nf}));
    T('위젯 날짜 창용 요약 "인계 2 · 특이 1"',r.d&&r.d.wlr&&r.d.wlr.n==='인수인계'&&r.d.wlr.c==='인계 2 · 특이 1',JSON.stringify(r.d&&r.d.wlr));
    T('일지 글(내용)은 위젯 데이터에 안 들어감',!/비밀 압력|원료 확인/.test(r.raw));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
    // 업무 메모를 끄면 위젯에도 없음
    const q=await boot(b,{...base,wlog,memos:{'2026-10-12':[memo('m1','엄마 생신')]}},{});
    await q.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(j);window.__refresh();});await q.waitForTimeout(1200);
    T('업무 메모를 끄면 위젯에 일지 줄 없음',await q.evaluate(()=>{const j=window.__wg[window.__wg.length-1];return !/📋|"wl"/.test(j);}));
    await q.close();
  }
  // ── 2. 위젯 날짜 창의 일지 줄 → 앱이 그 날짜 + 일지 팝업
  if(want('open')){
    const p=await boot(b,{...base,addons:{...base.addons,wlog:true},wlog},{});
    await p.evaluate(()=>{window.AndroidBridge.takeOpenDate=()=>'2026-10-12#wl';});
    await p.evaluate(()=>window.__widgetSync&&window.__widgetSync());await p.waitForTimeout(700);
    T('"2026-10-12#wl" 로 열리면 날짜 창 + 일지 팝업',await p.evaluate(()=>document.querySelector('#sheet').classList.contains('open')&&!!document.querySelector('.wlp')&&/10월 12일/.test(document.querySelector('.wlp .sub').textContent)));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 3. 스티커 근무 맞춤: 근무타입 골라서
  if(want('wt')){
    const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
    // 옛 값(휴무 날만) 그대로 동작 · 새 값(wtypes: 야간만)
    const defs=[mk('a','🏃','운동',{rep:'work',workMode:'rest'}),mk('b','💤','낮잠',{rep:'work',wtypes:['야']}),mk('c','📕','책',{rep:'work',wtypes:'bad'})];
    const p=await boot(b,{...base,stamps:{defs,log:{},v3:1,v4:1,lastAt:[]}},{touch:true});
    const has=(k,e)=>p.evaluate(([k,e])=>document.querySelector(`#track .panel:nth-child(2) .cell[data-k="${k}"]`).textContent.includes(e),[k,e]);
    // base 패턴: 10/12 휴 · 10/14 주 · 10/15 야 (s63 기준)
    const sh=await p.evaluate(()=>['2026-10-12','2026-10-14','2026-10-15'].map(k=>document.querySelector(`#track .panel:nth-child(2) .cell[data-k="${k}"] .bwrap`).textContent.trim()));
    T('옛 "휴무 날만" 스티커는 그대로 휴무 날에만',await has('2026-10-12','🏃')&&!(await has('2026-10-14','🏃')),JSON.stringify(sh));
    T('새 "야간만" 스티커는 야간 날에만',await has('2026-10-15','💤')&&!(await has('2026-10-12','💤'))&&!(await has('2026-10-14','💤')),JSON.stringify(sh));
    T('이상한 값(wtypes 문자열)은 빈 목록으로 → 옛 규칙(휴무 날만)으로 동작',await has('2026-10-12','📕')&&!(await has('2026-10-14','📕')));
    // 등록 화면: 근무 맞춤 칩
    await p.evaluate(()=>document.querySelector('#nav [data-tab="set"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>{window.__os=null;window.AndroidBridge.openSettings=k=>{window.__os=k;};document.querySelector('[data-act="stk-board"]').click();});await p.waitForTimeout(400);
    T('스티커 화면에 "🔔 알림 소리 바꾸기"',await p.evaluate(()=>/알림 소리 바꾸기/.test(document.querySelector('#page').textContent)));
    await p.evaluate(()=>{document.querySelector('[data-act="remind-sound"]').click();});
    T('누르면 폰의 "기념일 · 알림" 화면(remind_sound)',await p.evaluate(()=>window.__os==='remind_sound'));
    await p.evaluate(()=>{const x=document.querySelector('#page [data-act="page-close"]');x&&x.click();});await p.waitForTimeout(200);
    await p.evaluate(()=>document.querySelector('#nav [data-tab="cal"]').click());await p.waitForTimeout(300);
    // 새 스티커를 날짜에서 등록 → 반복 "근무 맞춤" → 근무타입 칩
    const act=(a,ds)=>p.evaluate(([a,ds])=>{const x=document.createElement('button');x.dataset.act=a;Object.assign(x.dataset,ds);document.body.appendChild(x);x.click();x.remove();},[a,ds]);
    await act('sp-pick',{k:'2026-10-14',id:'__new'});await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('[data-act="sr-rep"][data-v="work"]').click());await p.waitForTimeout(300);
    const ui=await p.evaluate(()=>{const g=document.querySelector('.srwt');return g&&{n:g.querySelectorAll('button').length,on:[...g.querySelectorAll('button.on')].map(x=>x.dataset.v),hint:/여러 개/.test(document.querySelector('#sheet,#page').textContent)};});
    T('근무 맞춤: 저장된 근무타입이 칩으로 · 처음엔 휴무 골라짐(예전 기본 "휴무 날만"과 같게)',!!ui&&ui.n>=3&&ui.on.join()==='휴',JSON.stringify(ui));
    await p.evaluate(()=>{document.querySelector('.srwt [data-v="휴"]').click();});await p.waitForTimeout(200);
    await p.evaluate(()=>document.querySelector('[data-act="sr-save"]').click());await p.waitForTimeout(300);
    T('하나도 안 고르면 저장 안 됨(안내)',await p.evaluate(()=>!!document.querySelector('.srwt')));
    await p.evaluate(()=>{document.querySelector('.srwt [data-v="주"]').click();});await p.waitForTimeout(150);
    await p.evaluate(()=>{document.querySelector('.srwt [data-v="야"]').click();});await p.waitForTimeout(150);
    await p.evaluate(()=>document.querySelector('[data-act="sr-save"]').click());await p.waitForTimeout(500);
    const nd=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).stamps.defs.find(x=>x.rep==='work'&&Array.isArray(x.wtypes)&&x.wtypes.length===2));
    T('주간 · 야간 골라 저장 → wtypes ["주","야"]',!!nd&&JSON.stringify(nd.wtypes)==='["주","야"]',JSON.stringify(nd));
    const e=nd&&nd.emoji;
    T('달력: 새 스티커가 주간(14) · 야간(15) 날에 (같은 🏃 인 "운동"은 휴무 날만이라 14 · 15 엔 없음)',!!e&&await has('2026-10-14',e)&&await has('2026-10-15',e));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
