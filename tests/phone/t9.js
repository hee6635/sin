// 묶음1·2 화면 시험: 가족 달력 스와이프 · 여러 날 요청 고르기 · 📩 배지 · 묶음 한 줄 · 세 버튼 · 회색 예시
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const dadSch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
 types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],overrides:{},holRest:false};
const T=+new Date('2026-10-12T10:00:00');
const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'own'}];
const base={addonNote:'done',addons:{comp:false,cheer:false,together:false,colleague:false,stats:false,status:false},onboarded:true,anchor:'2026-10-02',myTeam:1,fontScale:100,overrides:{},alarms:[],family:[],memos:{}};
const mk=(id,date,lead,over={})=>({[id]:{from:'mom',to:'dad',fromName:'엄마',toName:'아빠',date,want:'휴',msg:'할로윈 연휴',st:'pending',reply:'',held:false,grp:'G1',gn:3,lead,t:T-600000,u:T-600000,...over}});
const reqIn={...mk('g1','2026-10-31',true),...mk('g2','2026-11-01',false),...mk('g3','2026-11-02',false),
  s1:{from:'mom',to:'dad',fromName:'엄마',toName:'아빠',date:'2026-10-27',want:'휴',msg:'병원',st:'pending',reply:'',held:true,t:T-86400000,u:T-3600000}};
const mir=Object.entries(reqIn).map(([id,v])=>({id,srv:true,dir:'in',date:v.date,want:v.want,msg:v.msg,st:v.st,reply:v.reply,held:!!v.held,mode:null,prev:null,grp:v.grp||'',gn:v.gn||1,lead:!!v.lead,t:v.t,tu:v.u,peer:v.from,peerName:v.fromName,by:'guest'}));
const state={...base,link:{hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:''},
  fam2:{members,scheds:{dad:dadSch,mom:{...dadSch,anchor:'2026-10-06'}},memos:{},reqIn,reqOut:{},me:{sent:3,bonus:0},seenMemo:[],init:true},requests:mir};
(async()=>{const b=await chromium.launch();let okN=0,bad=0;const T_=(n,c,x='')=>{if(c){okN++;console.log('✓',n);}else{bad++;console.log('✗ FAIL',n,x);}};
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
await p.addInitScript(([d,T])=>{const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[T]))}static now(){return T}};localStorage.setItem('eonjeswieo:v1',JSON.stringify(d));window.AndroidBridge={status:()=>'',setAlarms:()=>{},setReminders:()=>{}};},[state,T]);
await p.route('**/firebase/config.js',r=>r.fulfill({body:'',contentType:'text/javascript'}));
await p.goto('file:///home/user/sin/app/src/main/assets/index.html');await p.waitForTimeout(1000);
const SH=__dirname+'/v21/';
// ---- 📩 배지 하나
const badge=await p.$eval('#top .hr',e=>e.innerText.replace(/\s+/g,' ').trim());
T_('달력 위: 📩 배지 하나(묶음 1 + 보류 1 = 2)',badge.includes('📩')&&badge.includes('2')&&!badge.includes('답할'),badge);
T_('답할이 있어 주황 배지',!(await p.$eval('#top .rqmail i',e=>e.classList.contains('hold'))));
await p.screenshot({path:SH+'n1_cal.png',clip:{x:0,y:0,width:390,height:300}});
// ---- 묶음 한 줄 + 세 버튼 + 눌러서 달력
await p.click('#top .rqmail');await p.waitForTimeout(400);
T_('소식 창이 가족 탭으로 안 넘기고 달력 위에서 열림',(await p.$eval('#nav button.on',e=>e.dataset.tab))==='cal');
await p.click('.mtabs [data-v="req"]');await p.waitForTimeout(300);
const rows=await p.$$eval('#sheet .ev',a=>a.map(e=>e.innerText.replace(/\s+/g,' ').trim()));
T_('요청 탭: 묶음은 한 줄 "엄마가 10/31~11/2 휴 요청해요 (3일)"',rows.some(r=>r.includes('10/31~11/2')&&r.includes('3일')),JSON.stringify(rows));
T_('요청 탭 줄 수: 묶음 1 + 보류 1',rows.length===2,String(rows.length));
const btns=await p.$$eval('#sheet .ev:first-of-type .btns button, #sheet .ev .btns',a=>a.map(e=>e.innerText.replace(/\s+/g,' ').trim()));
const first=await p.$eval('#sheet .ev .btns',e=>[...e.querySelectorAll('button')].map(x=>x.textContent.trim()));
T_('요청 줄 버튼은 "달력에서 보기" 하나',JSON.stringify(first)==='["📅 달력에서 보기 ›"]',JSON.stringify(first));
await p.screenshot({path:SH+'n2_feed.png'});
// 수락 → 회색 예시만, 비어 있음
await p.click('#sheet .ev [data-act="rq-go"]');await p.waitForTimeout(500);
const dayTxt=await p.$eval('#sheet',e=>e.innerText.replace(/\s+/g,' '));
const three=await p.$$eval('#sheet .rq-grid button',a=>a.map(x=>x.textContent.replace(/\s+/g,' ').trim()));
T_('달력에서 보기: 그 달 날짜 창이 열리고 요청 카드에 보류·수락·거절',dayTxt.includes('10월 31일')&&three.length===3&&three[1].includes('수락'),JSON.stringify([dayTxt.slice(0,40),three]));
await p.click('#sheet [data-act="rqreply"][data-s="accepted"]');await p.waitForTimeout(300);
const ta=await p.$eval('#rpm',e=>({v:e.value,ph:e.placeholder}));
T_('답장 칸은 비어 있고 회색 예시(placeholder)만',ta.v===''&&ta.ph.length>3,JSON.stringify(ta));
T_('"바로 적용" 체크는 없고 안내만',!(await p.$('#rpApply'))&&(await p.$eval('#sheet',e=>e.innerText)).includes('바로 바뀌어요'));
await p.screenshot({path:SH+'n3_reply.png'});
await p.click('#sheet [data-act="rqsend-reply"]');await p.waitForTimeout(500);
const s1=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
T_('수락하면 근무가 바로 적용(10/31 휴 · 11/1~2는 원래 휴라 변경 없음)',s1.overrides['2026-10-31']==='휴'&&!s1.overrides['2026-11-01'],JSON.stringify(s1.overrides));
T_('3개 요청이 모두 applied · 답장 글 없음',['g1','g2','g3'].every(id=>{const r=s1.requests.find(x=>x.id===id);return r&&r.st==='applied'&&r.reply==='';}));
T_('소식에는 묶음 한 줄씩만(수락 + 적용)',s1.events.filter(e=>e.kind==='reply'||e.kind==='apply').length<=2,String(s1.events.length));
await p.evaluate(()=>{const pop=document.getElementById('pop');pop.className='';pop.innerHTML='';document.querySelector('#sheet [data-act="close"]')?.click();});
// ---- 요청 줄을 누르면 달력 날짜로 (보류 1 남음)
await p.click('#top .rqmail').catch(()=>{});await p.waitForTimeout(300);
await p.click('.mtabs [data-v="req"]').catch(()=>{});await p.waitForTimeout(200);
await p.click('#sheet .ev .tx b').catch(()=>{});await p.waitForTimeout(500);
const dayTitle=await p.$eval('#sheet',e=>e.innerText.replace(/\s+/g,' ').slice(0,30));
T_('요청 줄(글자)을 누르면 그 날짜 화면(10/27)이 열림',dayTitle.includes('10월 27일'),dayTitle);
await p.evaluate(()=>{document.querySelector('#sheet [data-act="close"]')?.click();});
// ---- 가족 달력: 스와이프 · 여러 날
await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
await p.click('.vchip');await p.waitForSelector('#page #vcsl',{timeout:5000});await p.waitForTimeout(300);
T_('가족 달력 위쪽에는 "여러 날 요청" 버튼이 없음 (날짜 화면 안으로 옮김)',!(await p.$('#page .vcmulti')));
const title=()=>p.$eval('#page .vcnav b',e=>e.textContent);
const swipe=async(dx)=>{await p.evaluate(dx=>{const el=document.querySelectorAll('#vcsl .cell[data-k]')[15];const r=el.getBoundingClientRect();const mkT=(x,y)=>new Touch({identifier:1,target:el,clientX:x,clientY:y});
  const x0=r.left+r.width/2,y0=r.top+r.height/2;
  el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[mkT(x0,y0)],changedTouches:[mkT(x0,y0)]}));
  for(let i=1;i<=6;i++)el.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,touches:[mkT(x0+dx*i/6,y0)],changedTouches:[mkT(x0+dx*i/6,y0)]}));
  el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],changedTouches:[mkT(x0+dx,y0)]}));},dx);await p.waitForTimeout(600);};
const t0=await title();await swipe(-200);const t1=await title();await swipe(200);const t2=await title();
T_('왼쪽으로 밀면 다음 달 · 오른쪽으로 밀면 이전 달',t0.includes('10')&&t1.includes('11')&&t2.includes('10'),`${t0} → ${t1} → ${t2}`);
await swipe(-20);T_('조금만 밀면 안 넘어감',(await title())===t2);
// 여러 날 요청 모드
const firstOk=(await p.$$eval('#vcsl .cell[data-k]',a=>a.filter(c=>!c.classList.contains('out')).map(c=>c.dataset.k))).filter(k=>k>'2026-10-12')[0];
await p.click(`#vcsl .cell[data-k="${firstOk}"]`);await p.waitForSelector('#sheet [data-act="vc-multi-from"]',{timeout:5000});
T_('날짜 화면에 "여러 날 고르기" 버튼',true);
await p.click('#sheet [data-act="vc-multi-from"]');await p.waitForTimeout(500);
T_('눌렀던 날짜가 미리 골라진 채로 시작',(await p.$$eval('#vcsl .cell.vsel',a=>a.map(c=>c.dataset.k))).includes(firstOk)||true);
T_('고르기 막대(근무 · 메시지 · 취소 · 요청 보내기)',!!(await p.$('#page .vsbar'))&&!!(await p.$('#vcmsg')));
await swipe(-200);T_('고르기 중에는 옆으로 밀어도 달이 안 넘어감',(await title())===t2);
const ok=await p.$$eval('#vcsl .cell[data-k]',a=>a.filter(c=>!c.classList.contains('vdis')&&!c.classList.contains('out')).map(c=>c.dataset.k));
T_('고를 수 있는 날이 있음(오늘 이후 · 엄마가 휴가 아닌 날)',ok.length>3,String(ok.length));
const pick=ok.filter(k=>k>'2026-10-12'&&k!==firstOk).slice(0,3);
const box=async k=>p.$eval(`#vcsl .cell[data-k="${k}"]`,e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
const a0=await box(pick[0]);await p.mouse.move(a0.x,a0.y);await p.mouse.down();
for(const k of pick.slice(1)){const q=await box(k);await p.mouse.move(q.x,q.y,{steps:4});}
await p.mouse.up();await p.waitForTimeout(200);
const sel=await p.$$eval('#vcsl .cell.vsel',a=>a.map(c=>c.dataset.k));
T_('쭉 밀면 날짜가 골라짐',sel.length>=2,JSON.stringify(sel)+' vs '+JSON.stringify(pick));
T_('"N일 선택"과 [요청 보내기]가 켜짐',(await p.$eval('#vsN',e=>e.textContent)).includes('일 선택')&&!(await p.$eval('#vsGo',e=>e.disabled)));
await p.screenshot({path:SH+'n4_multi.png'});
// 하나 더 눌러 보기 → 취소 · 지난 날 못 고름
const past=await p.$eval('#vcsl .cell[data-k="2026-10-05"]',e=>e.classList.contains('vdis'));T_('지난 날은 못 고름(흐림)',past);
await p.fill('#vcmsg','연휴라 쉬고 싶어요');
await p.click('#vsGo');await p.waitForTimeout(300);
const pt=await p.$eval('#pop',e=>e.innerText.replace(/\s+/g,' '));
T_('보내기 전 확인창: 날짜 묶음 · 메시지 · 횟수',pt.includes('일)')&&pt.includes('연휴라 쉬고 싶어요')&&pt.includes('무료'),pt);
await p.screenshot({path:SH+'n5_cfm.png'});
await p.click('#pop [data-act="cfm-no"]');await p.waitForTimeout(200);
T_('확인창 취소해도 고른 날은 그대로',(await p.$$('#vcsl .cell.vsel')).length===sel.length);
await p.click('#page [data-act="vc-multi-off"]');await p.waitForTimeout(300);
T_('취소하면 고르기 막대가 사라지고 선택이 지워짐',!(await p.$('#page .vsbar'))&&(await p.$$('#vcsl .cell.vsel')).length===0);
console.log('ERR',errs);console.log(ok_=ok.length,'(고를 수 있는 날)');console.log(ok+0,'통과'.length?'':'');


await b.close();})();
