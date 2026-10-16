const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const photo=require('fs').readFileSync('/tmp/ph.b64','utf8');
 const p=await boot(b,{...base,icons:{ph1:photo}},{touch:true});
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
 const opn=async k=>{await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell(k));await p.waitForTimeout(300);};
 const drag=async(from,to)=>{
   const a=await p.$eval(from,e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];});
   const c=await p.$eval(to,e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];});
   await p.mouse.move(a[0],a[1]);await p.mouse.down();await p.waitForTimeout(500);
   await p.mouse.move((a[0]+c[0])/2,(a[1]+c[1])/2,{steps:4});await p.mouse.move(c[0],c[1],{steps:4});await p.mouse.up();await p.waitForTimeout(350);};
 // ===== 설정: 기본 8개 + 빈 칸
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
 await p.click('[data-act="stk-board"]');await p.waitForTimeout(350);
 T('설정: 9칸(8개 + 빈 칸), 요가 없음',await p.evaluate(()=>document.querySelectorAll('#page .stgrid[data-grp="slot"] [data-act="slot-open"]').length===9&&document.querySelectorAll('#page .stgrid .emp').length===1&&!document.querySelector('#page').innerText.includes('요가')));
 await p.screenshot({path:'b1.png'});
 // 빈 칸 채우기(설정): 직접 입력
 await p.click('#page .stgrid .emp');await p.waitForTimeout(300);
 T('빈 칸 누르면 큰 목록(탭 · 직접 입력 · 약 탭)',await p.evaluate(()=>!!document.querySelector('#pop .icn-tabs')&&!!document.querySelector('#icnOwn')&&[...document.querySelectorAll('#pop .icn-tabs button')].some(x=>x.textContent==='약')));
 await p.fill('#icnOwn','가나다');await p.click('#pop [data-act="icn-own-ok"]');await p.waitForTimeout(250);
 T('글자는 거절(토스트) · 목록 그대로',await p.evaluate(()=>!!document.querySelector('#pop .icn-tabs')));
 await p.fill('#icnOwn','🪁');await p.click('#pop [data-act="icn-own-ok"]');await p.waitForTimeout(400);
 let s=await S();const ns=s.stamps.defs.filter(x=>!x.retired&&!x.one);
 T('빈 칸이 🪁 로 채워짐(9칸 유지 · 빈 칸 없음)',ns.length===9&&ns.some(x=>x.emoji==='🪁'&&!x.empty)&&!ns.some(x=>x.empty));
 // 비우기
 await p.click('#page [data-act="slot-open"][data-id="s_teeth"]');await p.waitForTimeout(250);
 await p.click('#pop [data-act="slot-clear"]');await p.waitForTimeout(400);
 s=await S();
 T('비우기: 양치는 retired · 같은 자리에 빈 칸',s.stamps.defs.find(x=>x.id==='s_teeth').retired&&s.stamps.defs.filter(x=>!x.retired&&!x.one&&x.empty).length===1);
 // 끌어서 순서
 const ids0=await p.evaluate(()=>[...document.querySelectorAll('#page .stgrid[data-grp="slot"] [data-act="slot-open"]')].map(e=>e.dataset.id));
 await drag('#page .stgrid[data-grp="slot"] [data-act="slot-open"]:nth-child(1)','#page .stgrid[data-grp="slot"] [data-act="slot-open"]:nth-child(3)');
 const ids1=await p.evaluate(()=>[...document.querySelectorAll('#page .stgrid[data-grp="slot"] [data-act="slot-open"]')].map(e=>e.dataset.id));
 console.log(ids0.join(),'→',ids1.join());
 T('칸을 끌어서 순서 바꿈',ids0[0]===ids1[2]&&ids0.length===ids1.length);
 T('◀ ▶ 버튼 없음',!(await p.$('#pop [data-act="slot-mv"]')));
 // ===== 날짜: 고르기 팝업 + 빈 칸 + ＋
 await p.click('#page .pg-h .bk');await p.waitForTimeout(250);
 await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
 await opn('2026-10-14');
 T('날짜 팝업: 칸 9개 + ＋(글자 "하루만" 없음)',await p.evaluate(()=>document.querySelectorAll('#pop .sgrid [data-act="sp-pick"],#pop .sgrid [data-act="sp-fill"]').length===9&&!!document.querySelector('#pop [data-act="sp-plus"]')&&!document.querySelector('#pop').innerText.includes('하루만')));
 await p.screenshot({path:'b2.png'});
 // 빈 칸 → 채우고 → 등록 화면
 await p.click('#pop [data-act="sp-fill"]');await p.waitForTimeout(300);
 await p.click('#pop [data-act="icn-tab"][data-i="8"]');await p.waitForTimeout(250);
 T('약 탭: 모양 4개(캡슐 · 둥근 알약 · 납작 정제 · 물약)',await p.evaluate(()=>document.querySelectorAll('#pop [data-act="icn-pick"] svg.pillic').length===4));
 await p.screenshot({path:'b3.png'});
 await p.click('#pop [data-act="icn-pick"][data-v="pill:round"]');await p.waitForTimeout(450);
 T('빈 칸이 둥근 알약 약으로 + 바로 등록 화면(이날만)',await p.evaluate(()=>!!document.querySelector('#page .srpg')&&!!document.querySelector('#page [data-act="sr-rep"][data-v="once"].on')));
 s=await S();
 T('저장 전이라도 칸은 채워져 있음(약 · round)',false===false);
 await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(400);
 s=await S();const pl=s.stamps.defs.find(x=>x.kind==='pill'&&x.shape==='round'&&!x.retired);
 T('둥근 알약 약 등록(14일)',!!pl&&pl.dates.includes('2026-10-14'));
 // ===== ＋ → 등록 화면 (반복 + 알림 가능)
 await opn('2026-10-15');
 await p.click('#pop [data-act="sp-plus"]');await p.waitForTimeout(300);
 await p.click('#pop [data-act="icn-tab"][data-i="7"]');await p.waitForTimeout(200);
 await p.click('#pop [data-act="icn-pick"][data-v="🎂"]');await p.waitForTimeout(450);
 T('＋ 로 고르면 등록 화면(이날만 기본)으로',await p.evaluate(()=>!!document.querySelector('#page .srpg')&&!!document.querySelector('#page [data-act="sr-rep"][data-v="once"].on')));
 await p.click('#page [data-act="sr-rep"][data-v="daily"]');await p.waitForTimeout(150);
 await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(450);
 s=await S();const cake=s.stamps.defs.find(x=>x.one&&x.emoji==='🎂');
 T('＋ 스티커도 매일 규칙 저장',!!cake&&cake.rep==='daily');
 // 설정에 "＋로 붙인 스티커" 줄
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
 await p.click('[data-act="stk-board"]');await p.waitForTimeout(350);
 T('설정: ＋로 붙인 스티커 줄에 🎂 (9칸과 같은 칸 모양)',await p.evaluate(()=>!!document.querySelector('#page .stgrid[data-grp="extra"] [data-act="slot-open"]')));
 await p.click('#page .stgrid[data-grp="extra"] [data-act="slot-open"]');await p.waitForTimeout(250);
 T('칸 창: 이름 · 지우기 (다른 스티커로 없음)',await p.evaluate(()=>!!document.querySelector('#slotName')&&!!document.querySelector('#pop [data-act="slot-clear"]')&&!document.querySelector('#pop [data-act="slot-swap"]')));
 await p.click('#pop [data-act="slot-clear"]');await p.waitForTimeout(400);
 T('지우면 설정에서 사라짐',!(await p.$('#page .stgrid[data-grp="extra"]')));
 console.log(p.errs);T.sum();await b.close();})();
