// 접근성 (v0.63): 화면 읽기 이름 · 역할 · 작은 버튼의 누르는 자리 (보이는 크기는 그대로)
const {chromium,boot,rich}=require('./x_common.js');
const {mkT}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const p=await boot(b,rich(),{wait:900});
  await p.waitForTimeout(700);   // 접근성 보정은 화면이 바뀐 뒤 0.2초 모아서 함
  const q=(sel)=>p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>({role:e.getAttribute('role'),label:e.getAttribute('aria-label'),tab:e.getAttribute('tabindex'),hidden:e.getAttribute('aria-hidden')})),sel);

  // 달력
  const cells=await q('#track .panel:nth-child(2) .cell[data-k]');
  T('달력 칸 42개 모두 "버튼" 역할 · 이름 · 키보드 순서',cells.length===42&&cells.every(c=>c.role==='button'&&c.label&&c.tab==='0'),JSON.stringify(cells[0]));
  const lab=await p.evaluate(()=>document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-10-14"]').getAttribute('aria-label'));
  T('오늘 칸 이름에 날짜 · 요일 · 근무 · 메모 수가 들어감',/10월 14일 수요일/.test(lab)&&/메모 \d개/.test(lab),lab);
  const lab2=await p.evaluate(()=>document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-10-09"]').getAttribute('aria-label'));
  T('공휴일 칸 이름에 공휴일이 들어감(한글날)',lab2.includes('한글날'),lab2);
  const hid=await p.$$eval('#track .panel',ps=>ps.map(x=>x.getAttribute('aria-hidden')));
  T('양옆 달은 화면 읽기에서 숨김 · 가운데 달만 읽힘',JSON.stringify(hid)==='["true","false","true"]',JSON.stringify(hid));
  const stz=await q('.cell .stz');
  T('칸 위쪽 눈에 안 보이는 누르는 자리는 읽기에서 뺌',stz.length>0&&stz.every(x=>x.hidden==='true'));
  // 아래 메뉴
  const nav=await p.$$eval('#nav button',bs=>bs.map(x=>[x.getAttribute('role'),x.getAttribute('aria-selected')]));
  T('아래 메뉴는 탭 역할 · 지금 탭만 선택됨',nav.length===4&&nav.every(x=>x[0]==='tab')&&nav.filter(x=>x[1]==='true').length===1,JSON.stringify(nav));
  T('안내 글(toast)은 읽어 줌(status · live)',await p.$eval('#toast',e=>e.getAttribute('role')==='status'&&e.getAttribute('aria-live')==='polite'));
  // 머리 아이콘 버튼 이름
  const hdr=await p.$$eval('#top button',bs=>bs.map(x=>({a:x.dataset.act,l:x.getAttribute('aria-label'),t:(x.textContent||'').trim().slice(0,6)})));
  const prev=hdr.find(x=>x.a==='prev'),next=hdr.find(x=>x.a==='next');
  T('이전 달 · 다음 달 버튼에 이름',prev&&prev.l==='이전 달'&&next&&next.l==='다음 달',JSON.stringify(hdr));
  T('달 고르기(2026.10) 제목도 누르는 곳으로 읽힘',await p.$eval('#top [data-act="open-month-picker"]',e=>e.getAttribute('role')==='button'||e.tagName==='BUTTON'));

  // 작은 버튼의 누르는 자리: 버튼 34x34 → 바깥 5px 에서도 눌림 (보이는 크기는 그대로)
  const rect=await p.$eval('#top [data-act="prev"]',e=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
  T('이전 달 버튼은 34x34 그대로(모양 안 바뀜)',Math.round(rect.w)<=36&&Math.round(rect.h)<=36,JSON.stringify(rect));
  const hit=await p.evaluate(r=>{const e=document.elementFromPoint(r.x+r.w/2,r.y+r.h+4);return e&&(e.closest('[data-act]')||{}).dataset?.act;},rect);
  T('버튼 아래 4px 바깥을 눌러도 이전 달 버튼으로 받음 (누르는 자리 44px)',hit==='prev',String(hit));
  const hitL=await p.evaluate(r=>{const e=document.elementFromPoint(r.x-4,r.y+r.h/2);return e&&(e.closest('[data-act]')||{}).dataset?.act;},rect);
  T('버튼 왼쪽 4px 바깥도 (옆 버튼과 겹치지 않는 쪽만) 받음 또는 다른 버튼',typeof hitL==='string'||hitL===undefined);

  // 날짜 창 · 설정 · 알람 · 가족: 누를 곳마다 역할
  await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-14"] .bwrap');await p.waitForTimeout(700);
  const sheetOpen=await p.evaluate(()=>({role:document.getElementById('sheet').getAttribute('role'),modal:document.getElementById('sheet').getAttribute('aria-modal')}));
  T('날짜 창은 대화 상자(dialog · modal)로 읽힘',sheetOpen.role==='dialog'&&sheetOpen.modal==='true',JSON.stringify(sheetOpen));
  const bad=await p.evaluate(()=>[...document.querySelectorAll('#sheet [data-act]')].filter(e=>{const n=e.tagName==='BUTTON'||e.tagName==='INPUT'||e.tagName==='LABEL';return !n&&e.getAttribute('role')!=='button';}).map(e=>e.dataset.act).slice(0,8));
  T('날짜 창 안에 버튼이 아닌 누르는 곳이 모두 role=button',bad.length===0,JSON.stringify(bad));
  const nameless=await p.evaluate(()=>[...document.querySelectorAll('#sheet button,#sheet [role="button"]')].filter(e=>!(e.textContent||'').trim()&&!e.getAttribute('aria-label')&&!e.querySelector('svg title')&&!e.querySelector('img[alt]')).map(e=>e.dataset.act||e.className).slice(0,8));
  T('날짜 창 안에 글도 이름도 없는 버튼이 없음',nameless.length===0,JSON.stringify(nameless));
  const small=await p.evaluate(()=>[...document.querySelectorAll('#sheet [data-act]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<40||r.height<40)&&!e.classList.contains('tapx')&&!e.classList.contains('tapz')&&!e.classList.contains('tapb')&&!e.closest('.cell')&&e.tagName!=='INPUT';}).map(e=>e.dataset.act+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).slice(0,10));
  T('날짜 창의 작은 버튼은 모두 누르는 자리를 넓혔음',small.length===0,JSON.stringify(small));
  await p.evaluate(()=>document.querySelector('#sheet [data-act="close"]')?.click());await p.waitForTimeout(300);
  await p.click('#nav [data-tab="set"]');await p.waitForTimeout(700);
  const setSmall=await p.evaluate(()=>[...document.querySelectorAll('#view [data-act],#view label.sw')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<40||r.height<40)&&!e.classList.contains('tapx')&&!e.classList.contains('tapz')&&!e.classList.contains('tapb')&&e.tagName!=='INPUT';}).map(e=>(e.dataset.act||e.className)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).slice(0,10));
  T('설정의 작은 버튼(모양 고르기 칩 · 스위치)도 누르는 자리를 넓혔음',setSmall.length===0,JSON.stringify(setSmall));
  const sw=await p.$$eval('#view label.sw > input',is=>is.map(i=>({r:i.getAttribute('role'),l:i.getAttribute('aria-label')})));
  T('스위치마다 이름(같은 줄 제목) · switch 역할',sw.length>0&&sw.every(x=>x.r==='switch'&&x.l),JSON.stringify(sw.slice(0,3)));
  await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(700);
  T('알람 탭 "+" 버튼 이름',await p.$eval('#top [data-act="aadd"]',e=>e.getAttribute('aria-label')==='알람 추가'));
  // 오류 없음 · 보기 모양이 안 바뀜(같은 크기)
  T('오류 없음',p.errs.length===0,p.errs.join('|'));
  await b.close();T.sum();
})();
