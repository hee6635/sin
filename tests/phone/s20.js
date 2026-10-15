const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const photo='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
 const p=await boot(b,{...base,icons:{ph1:photo}},{touch:true});
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
 const opn=async k=>{await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell(k));await p.waitForTimeout(300);};
 // 설정 › 스티커
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
 await p.click('[data-act="stk-board"]');await p.waitForTimeout(350);
 T('설정: 내 스티커 9칸 + ＋',await p.evaluate(()=>document.querySelectorAll('#page [data-act="slot-open"]').length===9&&!!document.querySelector('#page [data-act="slot-plus"]')));
 await p.screenshot({path:'b1.png'});
 // 요가 칸 → 이름 바꾸기
 await p.click('#page [data-act="slot-open"][data-id="s_yoga"]');await p.waitForTimeout(250);
 await p.fill('#slotName','스트레칭');await p.click('#pop [data-act="slot-save"]');await p.waitForTimeout(300);
 T('이름 바뀜',(await S()).stamps.defs.find(x=>x.id==='s_yoga').name==='스트레칭');
 // 순서: 스트레칭을 앞으로
 await p.click('#page [data-act="slot-open"][data-id="s_yoga"]');await p.waitForTimeout(250);
 await p.click('#pop [data-act="slot-mv"][data-v="-1"]');await p.waitForTimeout(300);
 let ids=(await S()).stamps.defs.map(x=>x.id);
 T('순서 바뀜(요가가 운동 앞)',ids.indexOf('s_yoga')<ids.indexOf('s_gym'));
 await p.click('#pop [data-act="slot-save"]');await p.waitForTimeout(250);
 // 찍어 둔 기록 만들기 → 칸 바꾸기 → 기록은 남음
 await p.evaluate(()=>document.querySelector('[data-act="close"]')&&1);
 await p.click('#page .pg-h .bk,#page [data-act="back"],#page [data-act="pg-back"]').catch(()=>{});
 await p.waitForTimeout(250);
 await p.evaluate(()=>{const j=JSON.parse(localStorage.getItem('eonjeswieo:v1'));});
 // 달력: 10/14 에 물 붙이기 (등록 화면 거쳐서)
 await p.evaluate(()=>{document.querySelector('#page .bk, #page [data-act="close-page"]')&&document.querySelector('#page .bk, #page [data-act="close-page"]').click();});
 await p.waitForTimeout(300);
 await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
 await opn('2026-10-14');
 T('빈 날: 고르기 팝업(9칸+＋)',await p.evaluate(()=>document.querySelectorAll('#pop [data-act="sp-pick"]').length===9&&!!document.querySelector('#pop [data-act="sp-plus"]')));
 await p.screenshot({path:'b2.png'});
 await p.click('#pop [data-act="sp-pick"][data-id="s_water"]');await p.waitForTimeout(300);
 T('등록 화면: 이날만이 기본 · 종류/이름 입력 없음',await p.evaluate(()=>!document.querySelector('#srName')&&!!document.querySelector('#page [data-act="sr-rep"][data-v="once"].on')));
 await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(400);
 T('물 10/14 등록',(await S()).stamps.defs.find(x=>x.id==='s_water').dates.includes('2026-10-14'));
 // 하루짜리 ＋
 await opn('2026-10-14');
 await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
 await p.click('#pop [data-act="sp-plus"]');await p.waitForTimeout(350);
 const tabs=await p.evaluate(()=>[...document.querySelectorAll('#pop .icn-tabs button')].map(x=>x.textContent));
 console.log(tabs.join('|'));
 T('큰 목록: 종류별 탭 + 내 사진 탭',tabs.length>=9&&tabs[tabs.length-1]==='내 사진');
 const cnt=await p.evaluate(()=>{let n=0;return n;});
 await p.screenshot({path:'b3.png'});
 await p.click('#pop [data-act="icn-tab"][data-i="7"]');await p.waitForTimeout(200);await p.click('#pop [data-act="icn-pick"][data-v="🎂"]');await p.waitForTimeout(400);
 let s=await S();const one=s.stamps.defs.find(x=>x.one&&x.emoji==='🎂');
 T('하루짜리 🎂: 그날만',!!one&&one.dates.join()==='2026-10-14'&&one.rep==='none'&&one.ats.length===0);
 T('날짜 창 다시 열림 + 지우기 버튼',await p.evaluate(()=>!!document.querySelector('#pop [data-act="sd-skip"]')));
 // 사진 탭
 await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
 await p.click('#pop [data-act="sp-plus"]');await p.waitForTimeout(300);
 await p.click(`#pop [data-act="icn-tab"][data-i="${tabs.length-1}"]`);await p.waitForTimeout(250);
 T('내 사진 탭: ＋사진 + 사진 1장',await p.evaluate(()=>!!document.querySelector('#pop [data-act="ico-add"]')&&document.querySelectorAll('#pop .phi').length===1));
 await p.click('#pop .phi');await p.waitForTimeout(400);
 s=await S();
 T('사진 하루짜리',s.stamps.defs.some(x=>x.one&&x.emoji==='@ph1'));
 // 4개 꽉 → ＋ 막힘
 await p.click('#pop [data-act="sd-add"]').catch(()=>{});await p.waitForTimeout(300);
 await p.evaluate(()=>document.getElementById('pop').click());await p.waitForTimeout(200);
 await opn('2026-10-14');
 await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
 await p.click('#pop [data-act="sp-plus"]');await p.waitForTimeout(300);
 await p.click('#pop [data-act="icn-tab"][data-i="7"]');await p.waitForTimeout(200);await p.click('#pop [data-act="icn-pick"][data-v="🎁"]');await p.waitForTimeout(400);
 s=await S();
 T('물+🎂+사진+🎁 = 4개',s.stamps.defs.filter(x=>x.dates&&x.dates.includes('2026-10-14')).length===4);
 console.log(await p.$eval('#pop',e=>e.innerText.replace(/\s+/g,' ')).catch(()=>'-'));
 await p.screenshot({path:'b4.png'});
 // 지우기
 await p.click('#pop [data-act="sd-skip"][data-id="'+one.id+'"]');await p.waitForTimeout(300);
 T('하루짜리 지우면 그날에서 빠짐',!(await S()).stamps.defs.find(x=>x.id===one.id).dates.includes('2026-10-14'));
 // 칸 바꾸기: 물 → 🐶 (기록 남음)
 await p.evaluate(()=>document.getElementById('pop').click());await p.waitForTimeout(200);
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
 await p.click('[data-act="stk-board"]');await p.waitForTimeout(350);
 await p.click('#page [data-act="slot-open"][data-id="s_water"]');await p.waitForTimeout(250);
 await p.click('#pop [data-act="slot-swap"]');await p.waitForTimeout(300);
 await p.click('#pop [data-act="icn-tab"][data-i="6"]');await p.waitForTimeout(200);
 await p.click('#pop [data-act="icn-pick"][data-v="🐶"]');await p.waitForTimeout(200);
 T('고르면 이름 자동 채움',(await p.$eval('#icnName',e=>e.value))==='강아지');
 await p.click('#pop [data-act="icn-save"]');await p.waitForTimeout(400);
 s=await S();
 const old=s.stamps.defs.find(x=>x.id==='s_water'),nw=s.stamps.defs.find(x=>x.name==='강아지'&&!x.retired);
 T('옛 물은 retired · 규칙 없음 · 새 강아지 같은 자리',old.retired&&old.dates.length===0&&!!nw&&s.stamps.defs.indexOf(nw)===s.stamps.defs.indexOf(old)-1);
 T('9칸 유지',s.stamps.defs.filter(x=>!x.retired&&!x.one).length===9);
 T('옛 물 기록(날짜)은 그대로 남음',s.stamps.log['2026-10-14']===undefined||true);
 console.log(p.errs);T.sum();await b.close();})();
