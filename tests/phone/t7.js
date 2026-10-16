// 처음 근무표 만들기 새 흐름 (v0.21)
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const T=+new Date('2026-10-12T10:00:00');
const fs=require('fs');
async function mk(b,init){
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
  await p.addInitScript(([d,T])=>{const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[T]))}static now(){return T}};if(d&&!localStorage.getItem('eonjeswieo:v1'))localStorage.setItem('eonjeswieo:v1',JSON.stringify(d));window.AndroidBridge={status:()=>'',setAlarms:()=>{},setReminders:()=>{}};},[init,T]);
  await p.route('**/firebase/config.js',r=>r.fulfill({body:'',contentType:'text/javascript'}));
  await p.goto('file:///home/user/sin/app/src/main/assets/index.html');await p.waitForTimeout(900);
  p.errs=errs;return p;
}
const st=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')||'{}'));
const ob=(p,a,extra='')=>p.click(`#onboard [data-act="${a}"]${extra}`);
const txt=p=>p.evaluate(()=>document.getElementById('onboard').innerText.replace(/\s+/g,' ').slice(0,700));
const SH=__dirname+'/v21/';
const closeNotice=async p=>{await p.waitForTimeout(950);if(await p.$('#pop.open [data-act="pop-close"]'))await p.click('#pop.open [data-act="pop-close"]');await p.waitForTimeout(200);};
(async()=>{const b=await chromium.launch();let ok=0,bad=0;const T_=(n,c)=>{if(c){ok++;console.log('✓',n);}else{bad++;console.log('✗ FAIL',n);}};
// ---- 1. 일정하게 (프리셋)
{const p=await mk(b,null);
 T_('처음 화면',(await txt(p)).includes('내 근무표 만들기'));
 await ob(p,'ob-mine');await p.waitForTimeout(150);
 T_('방식 선택 화면',(await txt(p)).includes('근무가 어떻게')&&(await txt(p)).includes('불규칙해요')&&(await txt(p)).includes('건너뛰기'));
 await p.screenshot({path:SH+'o1_way.png'});
 await ob(p,'ob-way','[data-v="preset"]');await p.waitForTimeout(150);
 T_('프리셋 화면',(await txt(p)).includes('가장 비슷한 걸'));
 await p.screenshot({path:SH+'o2_preset.png'});
 await ob(p,'ob-next');await ob(p,'ob-next');await p.waitForTimeout(100);
 T_('확인 화면',(await txt(p)).includes('이렇게 맞나요'));
 await ob(p,'ob-next');await p.waitForTimeout(100);
 T_('알람 화면',(await txt(p)).includes('출근 알람'));
 await ob(p,'ob-finish','[data-v="0"]');await p.waitForTimeout(100);
 T_('끝 화면',(await txt(p)).includes('준비 끝'));
 await ob(p,'ob-done');await p.waitForTimeout(500);
 const s=await st(p);T_('myset true · noPat false · 4조2교대',s.myset===true&&s.noPat===false&&s.patternName==='4조2교대'&&s.pattern.length===8);
 T_('달력 위 줄에 근무 이름이 없음',!(await p.$eval('.cal-mid .sub',e=>e.textContent)).includes('4조2교대'));
 console.log('ERR',p.errs);await p.context().close();}
// ---- 2. 직접 만들게요
{const p=await mk(b,null);
 await ob(p,'ob-mine');await ob(p,'ob-way','[data-v="custom"]');await p.waitForTimeout(150);
 T_('날 수 화면',(await txt(p)).includes('며칠마다'));
 await p.screenshot({path:SH+'o3_len.png'});
 await ob(p,'ob-len','[data-v="6"][data-m="set"]');
 await ob(p,'ob-next');await p.waitForTimeout(150);
 T_('이름 화면',(await txt(p)).includes('근무 이름'));
 await p.fill('#onboard [data-obn="w0"]','D');await p.fill('#onboard [data-obn="w1"]','N');await p.fill('#onboard [data-obn="r"]','쉼');
 await p.screenshot({path:SH+'o4_names.png'});
 await ob(p,'ob-next');await p.waitForTimeout(150);
 T_('채우기 화면 6칸',(await p.$$('#onboard .fillgrid .pc')).length===6);
 // D D N N 쉼 쉼
 await ob(p,'ob-brush','[data-k="D"]');await ob(p,'ob-cell','[data-i="0"]');await ob(p,'ob-cell','[data-i="1"]');
 await ob(p,'ob-brush','[data-k="N"]');await ob(p,'ob-cell','[data-i="2"]');await ob(p,'ob-cell','[data-i="3"]');
 await p.screenshot({path:SH+'o5_fill.png'});
 await ob(p,'ob-next');await p.waitForTimeout(150);
 T_('오늘 몇 번째 화면',(await txt(p)).includes('오늘'));
 await ob(p,'ob-pos','[data-v="2"]');   // 오늘 = 3번째(N)
 await p.screenshot({path:SH+'o6_pos.png'});
 await ob(p,'ob-next');await p.waitForTimeout(100);await p.screenshot({path:SH+'o7_verify.png'});
 await ob(p,'ob-next');await p.waitForTimeout(100);
 const al=await p.evaluate(()=>[...document.querySelectorAll('#onboard .alrow')].length);T_('알람 줄 2개(D N)',al===2);
 await ob(p,'ob-finish','[data-v="1"]');await p.waitForTimeout(100);await ob(p,'ob-done');await p.waitForTimeout(500);
 const s=await st(p);
 T_('패턴 DDNN쉼쉼',JSON.stringify(s.pattern)==='["D","D","N","N","쉼","쉼"]');
 T_('타입 D N 쉼 생김',['D','N','쉼'].every(k=>s.types.some(t=>t.k===k))&&!s.types.some(t=>t.k==='상'));
 T_('쉼은 쉬는 날',s.types.find(t=>t.k==='쉼').rest===true&&!s.types.find(t=>t.k==='D').rest);
 T_('알람 2개 D·N',s.alarms.length===2&&s.alarms.every(a=>['D','N'].includes(a.shift)));
 const cell=await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-12"] .bwrap',e=>e.textContent.trim());
 T_('오늘(10/12)=N',cell==='N');
 await p.screenshot({path:SH+'o8_cal.png'});
 console.log('ERR',p.errs);await p.context().close();}
// ---- 3. 불규칙
{const p=await mk(b,null);
 await ob(p,'ob-mine');await ob(p,'ob-way','[data-v="irregular"]');await p.waitForTimeout(150);
 T_('끝 화면(불규칙)',(await txt(p)).includes('달력에서 날짜를 눌러'));
 await ob(p,'ob-done');await p.waitForTimeout(500);
 const s=await st(p);T_('myset true · noPat true',s.myset===true&&s.noPat===true);
 T_('달력 위 안내',(await p.$eval('.cal-mid .sub',e=>e.textContent)).includes('날짜를 눌러서 근무를 넣어요'));
 const cells=await p.$$eval('.track .panel:nth-child(2) .cell .bwrap',a=>a.filter(e=>e.textContent.trim()).length);T_('달력 근무 표시 0개',cells===0);
 await p.screenshot({path:SH+'o9_irr.png'});
 await p.waitForTimeout(900);if(await p.$('#pop.open [data-act="pop-close"]'))await p.click('#pop.open [data-act="pop-close"]');await p.waitForTimeout(200);
 await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]');await p.waitForTimeout(300);
 await p.screenshot({path:SH+'o10_irr_sheet.png'});
 console.log('시트:',(await p.evaluate(()=>document.getElementById('sheet').innerText.replace(/\s+/g,' ').slice(0,120))));
 // 근무 하나 넣기
 await p.click('#sheet [data-act="setshift"][data-s="주"]').catch(async()=>{console.log('shift 버튼 셀렉터 확인 필요',await p.evaluate(()=>[...document.querySelectorAll('#sheet [data-act]')].map(e=>e.dataset.act).join(',')));});
 await p.waitForTimeout(300);
 const s2=await st(p);T_('10/14 주 저장',s2.overrides['2026-10-14']==='주');
 await p.screenshot({path:SH+'o11_irr_set.png'});
 console.log('위 줄:',await p.$eval('.cal-mid .sub',e=>e.textContent));
 console.log('ERR',p.errs);await p.context().close();}
// ---- 4. 건너뛰기 → 나중에 만들기
{const p=await mk(b,null);
 await ob(p,'ob-mine');await ob(p,'ob-skip');await p.waitForTimeout(500);
 const s=await st(p);T_('건너뛰기: myset false · noPat true · onboarded',s.myset===false&&s.noPat===true&&s.onboarded===true);
 T_('달력 위 만들기 안내',(await p.$eval('.cal-mid .sub',e=>e.textContent)).includes('내 근무표 만들기'));
 await p.screenshot({path:SH+'o12_skip.png'});
 await closeNotice(p);
 await p.click('[data-act="mk-sched"]');await p.waitForTimeout(200);
 T_('다시 방식 화면',(await txt(p)).includes('근무가 어떻게'));
 T_('돌아가기 버튼 있음(later)',!!(await p.$('#onboard .ob-back')));
 T_('닫기 문구',(await txt(p)).includes('닫기'));
 await ob(p,'ob-way','[data-v="preset"]');await ob(p,'ob-next');await ob(p,'ob-next');await ob(p,'ob-next');await ob(p,'ob-finish','[data-v="0"]');await ob(p,'ob-done');await p.waitForTimeout(400);
 const s2=await st(p);T_('만든 뒤 myset true · noPat false',s2.myset===true&&s2.noPat===false);
 T_('안내 사라짐',!(await p.$eval('.cal-mid .sub',e=>e.textContent)).includes('내 근무표 만들기'));
 console.log('ERR',p.errs);await p.context().close();}
// ---- 5. 예전 사용자
{const OLD={onboarded:true,anchor:'2026-10-06',myTeam:2,fontScale:100,overrides:{},alarms:[],memos:{},addonNote:'done',addons:{}};
 const p=await mk(b,OLD);
 const s=await st(p);
 const cell=await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-12"] .bwrap',e=>e.textContent.trim());
 T_('예전 사용자: 달력 그대로(근무 표시)',cell.length>0);
 // 설정 > 근무 패턴 > 다시 하기
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(200);
 await p.click('[data-act="more-pattern"]');await p.waitForTimeout(300);
 await p.click('[data-act="redo-onboard"]');await p.waitForTimeout(250);
 T_('다시하기: 방식 화면',(await txt(p)).includes('근무가 어떻게'));
 await ob(p,'ob-back');await p.waitForTimeout(150);
 T_('뒤로 → 닫힘',!(await p.$eval('#onboard',e=>e.classList.contains('open'))));
 console.log('ERR',p.errs);await p.context().close();}
console.log(ok,'통과',bad,'실패');
await b.close();})();
