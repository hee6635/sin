const {chromium,boot,mkT,base}=require('./lib.js');
const mk=(id,name,emoji,extra={})=>({id,kind:'mark',emoji,name,rep:'none',days:[],dates:[],skip:[],...extra});
const defs=[
 {id:'p1',kind:'pill',emoji:'💊',name:'약',times:2,color:'#e5484d',rep:'daily',from:'2026-10-25',to:'',days:[],dates:[],skip:[]},
 mk('s_run','조깅','👟',{rep:'daily',from:'2026-10-18',to:''}),mk('s_gym','운동','🏋️'),mk('s_yoga','요가','🧘'),mk('s_water','물','💧')];
const log={'2026-10-16':{s_run:1,s_gym:1,s_yoga:1,s_water:1},'2026-10-12':{s_gym:1},'2026-10-09':{p1:1}};
const st={...base,pattern:['야','휴','휴','휴'],anchor:'2026-10-12',stamps:{defs,log,remind:true,more:true,v4:1,pillTimes:['10:00','13:00','20:00'],lastRt:''}};
(async()=>{const b=await chromium.launch();const T_=mkT();
let p=await boot(b,st);
const q=(s)=>p.$eval(s,e=>e.outerHTML.slice(0,200)).catch(()=>null);
// ---- 레이아웃: 4개인 날(14일) 동그라미 크기 = 스티커 없는 날과 같음
const info=await p.evaluate(()=>{
  const w=k=>document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);
  const sz=k=>{const c=w(k),bd=c&&c.querySelector('.bwrap .badge.c');return bd?bd.getBoundingClientRect().width:0;};
  const c14=w('2026-10-16');return {s2:!!c14.querySelector('.s2'),s2pos:c14.querySelector('.s2')?getComputedStyle(c14.querySelector('.s2')).position:'',
   one:!!w('2026-10-12').querySelector('.stp.one'),sid:!!c14.querySelector('[data-sid="s_water"]'),
   c20:sz('2026-10-20'),c24:sz('2026-10-24'),c14:sz('2026-10-16'),c12:sz('2026-10-12'),
   s2right:(()=>{const s=c14.querySelector('.s2');const r=s.getBoundingClientRect(),cr=c14.getBoundingClientRect();return {l:r.left-cr.left,r:cr.right-r.right,justify:getComputedStyle(s).justifyContent};})()};});
console.log(JSON.stringify(info));
T_('4개인 날: 3~4번째가 절대 위치 둘째 줄(.s2)',info.s2&&info.s2pos==='absolute');
T_('3~4번째 오른쪽 정렬',info.s2right.justify==='flex-end');
T_('스티커가 있는 날 근무 동그라미도 원래 크기(야간 같은 날과 비교)',info.c14>0&&(Math.abs(info.c14-info.c12)<1||Math.abs(info.c14-info.c24)<1),JSON.stringify([info.c14,info.c20,info.c24]));
T_('한 개뿐인 날도 다른 날과 같은 크기(.one 없음)',!info.one);
T_('스티커에 data-sid 가 붙음',info.sid);
const tf=await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-12"] .stp>*',e=>getComputedStyle(e).transform);
T_('한 개일 때도 확대 없음(scale 1.4 아님)',!/matrix\(1\.[34]/.test(tf),tf);
// ---- 약: 안 먹은 날도 정한 색 테두리
const pc=await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-26"] .pillic',e=>({cls:e.getAttribute('class'),style:e.getAttribute('style'),stroke:getComputedStyle(e.querySelector('.pr')).stroke,op:getComputedStyle(e.querySelector('.pr')).opacity,lines:e.querySelectorAll('.pd').length}));
T_('안 먹은 약(2번): 정한 색(#e5484d) 연한 테두리 + 나눔선 1개',pc.cls.includes('off')&&/rgb\(229, 72, 77\)/.test(pc.stroke)&&pc.lines===1&&+pc.op<1,JSON.stringify(pc));
// ---- 위쪽 눌림
await p.evaluate(()=>{const z=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] .stz');const r=z.getBoundingClientRect();z.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+5,clientY:r.top+5,pointerId:3}));});
T_('위쪽 1/3 누르면 pressTop (그 칸만 연한 파랑)',await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-20"]',e=>e.classList.contains('pressTop')&&!e.classList.contains('press')));
await p.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:3})));await p.waitForTimeout(250);
T_('손 떼면 사라짐',await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-20"]',e=>!e.classList.contains('pressTop')));
// ---- 톡: 완료 누르면 방금 붙인 스티커에 .tok
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] .stz');await p.waitForTimeout(350);
const popTxt=await p.$eval('#pop',e=>e.innerText.replace(/\s+/g,' '));
T_('날짜 스티커 창: 조깅 완료 버튼 + "이날부터 끝내기"',popTxt.includes('완료')&&popTxt.includes('그만하기'),popTxt.slice(0,160));

await p.click('#pop [data-act="sd-done"][data-id="s_run"]');await p.waitForTimeout(60);
const tok=await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] [data-sid="s_run"]',e=>e.classList.contains('tok')).catch(()=>false);
T_('완료 누르는 순간 "톡"(.tok)',tok);
await p.waitForTimeout(600);
T_('톡은 잠깐만(0.4초 뒤 사라짐)',!(await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] [data-sid="s_run"]',e=>e.classList.contains('tok')).catch(()=>false)));
// 떼기는 조용히
await p.click('#pop [data-act="sd-undo"][data-id="s_run"]');await p.waitForTimeout(60);
T_('완료 취소(떼기)는 효과 없음',!(await p.$('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] .tok')));
// ---- 이날부터 끝내기 + 되돌리기
await p.click('#pop [data-act="sd-end"][data-id="s_run"]');await p.waitForTimeout(300);
let S=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
let run=S.stamps.defs.find(x=>x.id==='s_run');
T_('이날부터 끝내기: 끝 날짜 = 전날(10/19) · 지난 기록은 그대로',run.to==='2026-10-19'&&S.stamps.log['2026-10-16'].s_run===1,JSON.stringify([run.to,S.stamps.log['2026-10-16']]));
T_('끝낸 뒤 20일엔 조깅 스티커가 안 깔림',!(await p.$('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] [data-sid="s_run"]')));
T_('끝낸 뒤 19일까지는 깔림',!!(await p.$('.track .panel:nth-child(2) .cell[data-k="2026-10-19"] [data-sid="s_run"]')));
await p.click('#toast .tu');await p.waitForTimeout(300);
S=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
T_('되돌리기: 끝 날짜 없음으로 복원',S.stamps.defs.find(x=>x.id==='s_run').to==='',S.stamps.defs.find(x=>x.id==='s_run').to);
// ---- 반복 없는 스티커엔 끝내기 없음
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-16"] .stz');await p.waitForTimeout(350);
const pop14=await p.$eval('#pop',e=>e.innerText.replace(/\s+/g,' '));
T_('반복 없는 스티커(운동 등)에는 "끝내기" 없음',!(await p.$('#pop [data-act="sd-end"][data-id="s_gym"]')));
await p.evaluate(()=>document.getElementById('pop').click());await p.waitForTimeout(250);
// ---- 활동 알림: 등록 창에 ⏰
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-21"] .stz');await p.waitForTimeout(350);
await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(400);
await p.click('#pop [data-act="sp-pick"][data-id="s_yoga"]');await p.waitForTimeout(300);
await p.evaluate(()=>{const c=document.getElementById('srAlarm');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(150);
await p.evaluate(()=>{const h=document.getElementById('srAt0');h.value='10:00';h.dispatchEvent(new Event('change',{bubbles:true}));});
await p.click('#page [data-act="sr-rep"][data-v="daily"]');await p.waitForTimeout(150);
await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(500);
S=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
const yoga=S.stamps.defs.find(x=>x.id==='s_yoga');
T_('저장: 요가 ats=[10:00] · 마지막 시각 기억',JSON.stringify(yoga.ats)==='["10:00"]'&&S.stamps.lastAt[0]==='10:00',JSON.stringify([yoga.ats,S.stamps.lastAt]));
const rem=await p.evaluate(()=>window.__rem);
const ya=rem.filter(x=>x.id.startsWith('a_s_yoga_'));
T_('알림 목록: 요가 알림이 생김(type stk · date 있음 · 문구)',ya.length>3&&ya.every(x=>x.type==='stk'&&/^\d{4}-/.test(x.date)&&x.text.includes('스티커 찍어')&&x.title.includes('요가')),JSON.stringify(ya[0]));
T_('이미 지난 시각은 건너뜀',!ya.some(x=>x.date==='2026-10-12'));
T_('자는 시간(야간 뒤 낮)에는 활동 알림 건너뜀(21·25일 없음)',!ya.some(x=>['2026-10-21','2026-10-25'].includes(x.date))&&ya.some(x=>x.date==='2026-10-22'),ya.map(x=>x.date).join(','));
const pr=rem.filter(x=>x.id.startsWith('a_p1_'));
T_('약 알림은 자는 시간에도 그대로 · 눌러 열기용 type/date',pr.length>0&&pr.every(x=>x.type==='stk'&&x.date),JSON.stringify(pr[0]));
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-23"] .stz').catch(()=>{});await p.waitForTimeout(350);
await p.click('#pop [data-act="sd-add"]').catch(()=>{});await p.waitForTimeout(300);
await p.click('#pop [data-act="sp-pick"][data-id="s_water"]');await p.waitForTimeout(300);
await p.evaluate(()=>{const c=document.getElementById('srAlarm');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(150);
T_('새 스티커 알림 처음 값 = 마지막에 정한 시각(10:00)',(await p.$eval('#srAt0',e=>e.value))==='10:00');
await p.click('#page [data-act="sr-back"]');await p.waitForTimeout(250);
// ---- 설정 › 스티커
await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);
await p.click('[data-act="stk-board"]');await p.waitForTimeout(400);
const pg=await p.$eval('#page',e=>e.innerText.replace(/\s+/g,' ')).catch(()=>'');
T_('설정 › 스티커: 9칸 격자 + ＋ (큰 시간 알림 스위치 없음)',!pg.includes('시간 알림')&&pg.includes('내 스티커'),pg.slice(0,300));
T_('JS 오류 없음',p.errs.length===0,p.errs.join('|'));
await p.close();
// ---- 애니메이션 줄이기: 톡 · 진동 없음
p=await boot(b,st,{rm:true});
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] .stz');await p.waitForTimeout(350);
await p.click('#pop [data-act="sd-done"][data-id="s_run"]');await p.waitForTimeout(60);
T_('애니메이션 줄이기: .tok 없음',!(await p.$('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] .tok')));
await p.close();
await b.close();T_.sum();})();
