// v0.117 가족 일정 종류 (근무타입처럼) · 위치 · 가족 날씨 · 이 날부터 새 일정 · 날짜 창 접기 · 칠하기 · 위쪽 ✏️🖌 없음
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const fam=[{id:'f1',name:'유찬',kind:'student',label:'유치원',start:'09:00',end:'15:00',vac:[],color:'#ec4899',ov:{'2026-10-15':'off'},loc:'41113'}];
  const h={};for(let d=11;d<=20;d++)for(let x=0;x<24;x++){const rain=x===15;h[`202610${p2(d)}${p2(x)}`]=[12,rain?80:10,rain?1:0,rain?4:1,rain?2:0,2,50];}
  const raw={v:1,r:'41111',n:'',s:{b:'202610120500',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{}},q:null},raw2={...raw,r:'41113'};
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({list:[raw,raw2]})})]];
  const tap=(p,sel)=>p.evaluate(sel=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const o=document.querySelector(sel);o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();},sel);
  const st={...base,family:fam,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{},nm:{}}};
  const p=await boot(b,st,{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes,touch:true});await p.waitForTimeout(2500);
  // 예전 데이터 → 기본 종류
  const r0=await p.evaluate(()=>{const m=__wx.S.family[0];return {lbl:__wx.famLbl(m),wed:__wx.famTypeAt(m,new Date(2026,9,14)).name,thu:__wx.famTypeAt(m,new Date(2026,9,15)).rest,hol:__wx.famTypeAt(m,new Date(2026,9,9)).rest};});
  T('예전 데이터: 가는 곳 이름 · 시간 → 기본 종류 (유치원 · 쉬는 날) · 이 날만 바꾼 것 · 공휴일(한글날) 쉼',r0.lbl==='유치원'&&r0.wed==='유치원'&&r0.thu===true&&r0.hol===true,JSON.stringify(r0));
  // 가족 탭: 상태 · 날씨 · 시간표 동그라미
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(500);
  const card=await p.evaluate(()=>document.querySelector('.now.fams .nc:not(.w)').innerText.replace(/\s+/g,' '));
  T('가족 카드: 유치원 · 15:00 하원 · 날씨 한 줄(다음 하원에 비 → "하원 때 비 · 우산")',/유치원/.test(card)&&/15:00 하원/.test(card)&&/하원길에 비 와요/.test(card),card);
  T('가족 시간표: 유찬도 동그라미 (유치원 → "유")',await p.evaluate(()=>{const c=[...document.querySelectorAll('.fc .badge')].map(e=>e.textContent);return c.includes('유');}));
  // 달력: 위쪽 ✏️🖌 없음
  await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(500);
  T('유찬 달력 위쪽에 ✏️ · 🖌 없음',await p.evaluate(()=>!document.querySelector('#page .pg-h [data-act="man-edit"]')&&!document.querySelector('#page .pg-h [data-act="man-paint"]')));
  // 날짜 창: 종류 칩 · 날씨 · 접기
  await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-14"]').click());await p.waitForTimeout(500);
  const d=await p.evaluate(()=>({chips:[...document.querySelectorAll('#sheet .tchips .tchip')].map(c=>c.innerText.replace(/\s+/g,'')),paint:!!document.querySelector('#sheet [data-act="man-paint"]'),wx:(document.querySelector('#sheet .wxcard')||{}).innerText||''}));
  T('날짜 창: 종류 칩(유치원 · 쉬는 날) · 🖌 여러 날 칠하기',d.chips.length===2&&/유치원/.test(d.chips[0])&&d.paint,JSON.stringify(d));
  T('날짜 창 날씨: 등원 → 하원 · "하원길에 비 와요"',/등원/.test(d.wx)&&/하원/.test(d.wx)&&/하원길에 비 와요/.test(d.wx),d.wx);
  await tap(p,'#sheet [data-act="man-fold"]');await p.waitForTimeout(300);
  T('▴ 접기 → 칩 숨김',await p.evaluate(()=>!document.querySelector('#sheet .tchips')));
  await tap(p,'#sheet [data-act="man-go"][aria-label="다음날"]');await p.waitForTimeout(400);
  T('다른 날로 가도 접힌 채',await p.evaluate(()=>!document.querySelector('#sheet .tchips')&&/10월 15일/.test(document.querySelector('#sheet .dft').innerText)));
  await tap(p,'#sheet [data-act="man-fold"]');await p.waitForTimeout(300);
  // 종류 더하기 (길게 누르기 → 고치기 · ＋ 는 가족 ✏️)
  await p.evaluate(()=>{const e=document.querySelector('#sheet .tchips [data-hk="on"]');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:5,clientY:5}));});await p.waitForTimeout(700);
  T('칩 길게 → 종류 고치기 (이름 · 달력 표시 · 시간 · 색)',await p.evaluate(()=>!!document.getElementById('ftName')&&document.getElementById('ftName').value==='유치원'&&!!document.getElementById('ftS')&&!!document.querySelector('#pop .ftc')));
  await p.evaluate(()=>{const s=document.getElementById('ftS');s.value='08:50';s.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(200);
  await tap(p,'#pop [data-act="ft-save"]');await p.waitForTimeout(300);
  T('시간 저장 (08:50 ~ 15:00)',await p.evaluate(()=>{const t=__wx.S.family[0].ftypes[0];return t.s==='08:50'&&t.e==='15:00';}));
  await p.evaluate(()=>__wx.closeSheet());
  // 가족 ✏️: 종류 더하기 · 구간
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);await tap(p,'[data-act="fam-edit"][data-id="f1"]');await p.waitForTimeout(400);
  T('가족 ✏️: "🔁 일정 패턴" 한 줄 (유치원 08:50~15:00 · 위치)',await p.evaluate(()=>{const e=document.querySelector('#page [data-act="fe-pat"]');return !!e&&/유치원 08:50~15:00/.test(e.innerText)&&/📍/.test(e.innerText);}));
  await tap(p,'#page [data-act="fe-pat"]');await p.waitForTimeout(400);
  T('일정 패턴: 일정 종류 목록 · 위치 · 이 날부터 새 일정 · 공휴일',await p.evaluate(()=>document.querySelectorAll('#page [data-act="fe-ft"]').length===2&&!!document.querySelector('#page [data-act="fe-loc"]')&&!!document.querySelector('#page [data-act="fe-era-add"]')&&!!document.getElementById('feHol')));
  await tap(p,'#page [data-act="fe-ftadd"]');await p.waitForTimeout(300);
  await p.evaluate(()=>{document.getElementById('ftName').value='반일반';const s=document.getElementById('ftE');s.value='13:00';s.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(200);
  await p.evaluate(()=>{document.getElementById('ftName').value='반일반';});await tap(p,'#pop [data-act="ft-save"]');await p.waitForTimeout(300);
  T('＋ 종류 더하기 → 반일반 (달력 표시 자동 "반")',await p.evaluate(()=>{const r=[...document.querySelectorAll('#page [data-act="fe-ft"]')].map(e=>e.innerText.replace(/\s+/g,' '));return r.length===3&&r.some(x=>/반 반일반/.test(x)&&/13:00/.test(x));}));
  // 이 날부터 새 일정 (11월 2일부터 학교)
  await tap(p,'#page [data-act="fe-era-add"]');await p.waitForTimeout(300);
  await p.evaluate(()=>{const s=document.getElementById('eraD');s.value='2026-11-02';});await tap(p,'#pop [data-act="fe-era-ok"]');await p.waitForTimeout(400);
  T('구간 생김 · 그 구간을 고치는 중 (칩 "2026.11.2부터")',await p.evaluate(()=>/2026\.11\.2부터/.test(document.querySelector('#page').innerText)&&!!document.querySelector('#page [data-act="fe-era"].on[data-i="0"]')));
  await tap(p,'#page [data-act="fe-ft"][data-k="on"]');await p.waitForTimeout(300);
  await p.evaluate(()=>{document.getElementById('ftName').value='학교';});await tap(p,'#pop [data-act="ft-save"]');await p.waitForTimeout(300);
  await tap(p,'[data-act="fp-done"]');await p.waitForTimeout(300);await tap(p,'[data-act="fe-save"]');await p.waitForTimeout(500);
  const e=await p.evaluate(()=>{const m=__wx.S.family[0];return {before:__wx.famTypeAt(m,new Date(2026,10,1+1-1)).name,b2:__wx.famTypeAt(m,new Date(2026,9,30)).name,after:__wx.famTypeAt(m,new Date(2026,10,3)).name,ed:m._ed};});
  T('이 날부터 새 일정: 10월 30일 유치원 · 11월 3일 학교 · 저장엔 편집 표시 없음',e.b2==='유치원'&&e.after==='학교'&&e.ed===undefined,JSON.stringify(e));
  // 날짜 창 ⚙️ 일정 패턴 → 바로 고치고 [저장]
  await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(400);
  await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-14"]').click());await p.waitForTimeout(400);
  await tap(p,'#sheet [data-act="man-pat"]');await p.waitForTimeout(400);
  T('날짜 창 "⚙️ 일정 패턴" → 일정 패턴 화면 [저장]',await p.evaluate(()=>/유찬 일정 패턴/.test(document.querySelector('#page .pg-h').innerText)&&!!document.querySelector('#page [data-act="fp-save"]')));
  await p.evaluate(()=>{document.getElementById('feHol').checked=false;});await tap(p,'#page [data-act="fp-save"]');await p.waitForTimeout(400);
  T('[저장] → 유찬 달력으로 · 바꾼 것 저장 (공휴일엔 쉬어요 끔)',await p.evaluate(()=>!!document.getElementById('vcsl')&&__wx.S.family[0].holOff===false&&__wx.S.family[0]._own===undefined));
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(300);
  // 칠하기: 반일반으로
  await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(400);
  await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-14"]').click());await p.waitForTimeout(400);
  await tap(p,'#sheet [data-act="man-paint"]');await p.waitForTimeout(400);
  T('🖌 여러 날 칠하기 → 아래 종류 막대 (유치원 · 반일반 · 쉬는 날)',await p.evaluate(()=>document.querySelectorAll('#page [data-act="man-pk"]').length===3));
  const kHalf=await p.evaluate(()=>__wx.S.family[0].ftypes.find(t=>t.name==='반일반').k);
  await p.evaluate(k=>document.querySelector(`#page [data-act="man-pk"][data-v="${k}"]`).click(),kHalf);await p.waitForTimeout(200);
  const bb=await (await p.$('#page .cell[data-k="2026-10-16"]')).boundingBox();await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(300);
  T('칠하면 그 날 반일반 ("반" 동그라미)',await p.evaluate(k=>__wx.S.family[0].ov['2026-10-16']===k&&document.querySelector('#page .cell[data-k="2026-10-16"] .bwrap .badge').textContent==='반',kHalf));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  { // v0.120 가족 스티커 = 내 스티커 규칙: 일정 맞춤 · 하루 2번(1/2) · 알림 · 스티커 목록 (기분 · 아이 · 육아)
    const fam2=[{id:'f1',name:'유찬',kind:'student',vac:[],color:'#ec4899',sdefs:[{id:'m_p',emoji:'💊',name:'약',rep:'work',wtypes:['on'],times:2,ats:['08:00','19:00']}]}];
    const p=await boot(b,{...base,family:fam2},{touch:true,tz:'Asia/Seoul',T:KST(2026,10,14,7)});
    const pl=await p.evaluate(()=>{const m=__wx.S.family[0],x=m.sdefs[0];return [__wx.manPlanned(m,x,'2026-10-14'),__wx.manPlanned(m,x,'2026-10-17')];});
    T('일정 맞춤: 유치원 가는 날(수)만 깔림 · 토요일은 안 깔림',pl[0]===true&&pl[1]===false,JSON.stringify(pl));
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-14"]').click());await p.waitForTimeout(400);
    T('날짜 창: 깔린 약 (점선 · 0/2)',await p.evaluate(()=>{const e=document.querySelector('#sheet .mstk [data-id="m_p"]');return e.classList.contains('todo')&&/0\/2/.test(e.innerText);}));
    await tap(p,'#sheet .mstk [data-id="m_p"]');await p.waitForTimeout(300);
    T('한 번 누르면 1/2',await p.evaluate(()=>/1\/2/.test(document.querySelector('#sheet .mstk [data-id="m_p"]').innerText)));
    await tap(p,'#sheet .mstk [data-id="m_p"]');await p.waitForTimeout(300);
    T('두 번이면 2/2 완료',await p.evaluate(()=>{const e=document.querySelector('#sheet .mstk [data-id="m_p"]');return /2\/2/.test(e.innerText)&&e.classList.contains('on')&&!e.classList.contains('half');}));
    await p.evaluate(()=>__wx.pushRemindersToNative());await p.waitForTimeout(200);
    T('가족 스티커 알림 (내 폰 · 오늘 08:00 은 한 번 했으니 19:00 만 · 내일 2번)',await p.evaluate(()=>{const r=(window.__rem||[]).filter(x=>/^f_f1_m_p_/.test(x.id)).map(x=>x.id);return !r.includes('f_f1_m_p_2026-10-14_0')&&!r.includes('f_f1_m_p_2026-10-14_1')&&r.includes('f_f1_m_p_2026-10-15_0')&&r.includes('f_f1_m_p_2026-10-15_1');}),await p.evaluate(()=>JSON.stringify((window.__rem||[]).map(x=>x.id).filter(x=>/^f_/.test(x)).slice(0,6))));
    await tap(p,'#sheet [data-act="man-stk-add"]');await p.waitForTimeout(400);
    T('스티커 고르기: 기분 · 아이 · 육아 탭',await p.evaluate(()=>{const t=[...document.querySelectorAll('#pop [data-act="icn-tab"]')].map(b=>b.innerText);return t.includes('기분')&&t.includes('아이 · 육아');}));
    T('오류 없음 (가족 스티커 규칙)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
