const {chromium,boot,mkT,base}=require('./lib.js');
const O='/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/';
(async()=>{const b=await chromium.launch();const T=mkT();
 // 옛 데이터: personal:true → 전체 개인
 let p=await boot(b,{...base,personal:true},{touch:true,w:384});
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);
 T('옛 personal:true → 전부 개인 캘린더(설정에 "근무표 쓰기")',await p.evaluate(()=>!!document.querySelector('[data-act="personal-off"]')));
 T('오류 없음',p.errs.length===0,p.errs.join('|'));
 // 근무표 쓰기: 오늘(10/12)부터 → 이전은 개인, 이후 근무
 await p.evaluate(()=>document.querySelector('[data-act="personal-off"]').click());await p.waitForTimeout(300);
 T('"언제부터" 화면',await p.evaluate(()=>document.getElementById('page').innerText.includes('언제부터 근무표를 다시')));
 await p.evaluate(()=>document.querySelector('[data-act="pers-ok"]').click());await p.waitForTimeout(400);
 T('저장: 1900~오늘 개인',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return s.pers.length===1&&s.pers[0].t==='2026-10-12'&&s.personal===false;}));
 await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(400);
 const cellInfo=k=>p.evaluate(k=>{const c=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);return c?{pers:c.classList.contains('pers'),badge:!!c.querySelector('.bwrap .badge')}:null;},k);
 const a=await cellInfo('2026-10-11'),c=await cellInfo('2026-10-13');
 T('10/11은 개인 칸(근무 없음), 10/13은 근무 표시',a&&a.pers&&!a.badge&&c&&!c.pers&&c.badge,JSON.stringify([a,c]));
 await p.screenshot({path:O+'pers1.png'});
 // 개인으로 다시: 10/20부터
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('[data-act="more-pattern"]').click());await p.waitForTimeout(400);
 await p.evaluate(()=>document.querySelector('[data-act="personal-on"]').click());await p.waitForTimeout(400);
 T('"언제부터 개인 캘린더" 화면',await p.evaluate(()=>document.getElementById('page').innerText.includes('언제부터 개인 캘린더')));
 await p.evaluate(()=>{document.getElementById('persD').value='2026-10-20';});
 await p.evaluate(()=>document.querySelector('[data-act="pers-ok"]').click());await p.waitForTimeout(400);
 T('저장: 10/20부터 개인(오늘은 근무)',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return s.pers.length===2&&s.pers[1].f==='2026-10-20'&&!s.pers[1].t&&s.personal===false;}));
 await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(400);
 const d1=await cellInfo('2026-10-19'),d2=await cellInfo('2026-10-21'),d3=await cellInfo('2026-10-11');
 T('10/19 근무 · 10/21 개인 · 10/11 개인',d1&&!d1.pers&&d2&&d2.pers&&d3&&d3.pers,JSON.stringify([d1,d2,d3]));
 await p.screenshot({path:O+'pers2.png'});
 // 같은 달 섞임 스티커 위치: 스티커 하나 추가 (개인 칸 / 근무 칸 둘 다)
 console.log(p.errs);T.sum();await b.close();})();
