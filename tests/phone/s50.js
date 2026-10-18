// 스티커 꾹 눌러서 고치기 (v0.65): 날짜 창에서 스티커 줄을 꾹 누르면 고치기 화면 · 반복을 고쳐도 고른 날 이전은 그대로 · 처음 한 번만 안내
const {chromium,boot}=require('./x_common.js');
const {mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const mk=(id,emoji,name,o={})=>Object.assign({id,kind:'mark',emoji,name,times:1,rep:'none',days:[],dates:[],skip:[],ats:[]},o);
  const state=()=>({...base,stamps:{defs:[
    {id:'s_pill',kind:'pill',emoji:'💊',name:'약',times:2,color:'#ef4d5a',shape:'caps',rep:'daily',from:'2026-10-01',days:[],dates:[],skip:[],ats:['08:00','20:00']},
    mk('s_run','👟','조깅',{rep:'daily',from:'2026-10-01',ats:['07:00']}),
    mk('s_gym','💪','운동',{rep:'dow',days:[1,3,5],from:'2026-10-01'}),
    mk('s_water','💧','물',{rep:'daily',from:'2026-10-01'}),
    mk('s_read','📖','독서'),mk('s_empty','','',{empty:true}),
    mk('o_cake','🎂','생일',{one:true,dates:['2026-10-21'],ats:['09:30']})],
    log:{},snap:{},remind:false,pillTimes:['08:00','13:00','20:00'],lastAt:[],v3:1,v4:1}});
  const S=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
  const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
  const has=(p,k,em)=>p.evaluate(([c,e])=>{const el=document.querySelector(c);return !!el&&el.textContent.includes(e);},[cell(k),em]);
  const day=(n)=>'2026-10-'+String(n).padStart(2,'0');
  const openDay=async(p,k)=>{await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell(k));await p.waitForTimeout(450);};
  const closePop=p=>p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';});
  const hold=async(p,sel)=>{const c=await p.$eval(sel,e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];});await p.mouse.move(c[0],c[1]);await p.mouse.down();await p.waitForTimeout(700);await p.mouse.up();await p.waitForTimeout(500);};
  const rowSel=id=>`#pop .sdr[data-id="${id}"]`;
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

  let p=await boot(b,state());
  // ===== 처음 한 번만 안내 =====
  await openDay(p,day(13));
  T('처음 날짜 창을 열면 "꾹 누르면 고칠 수 있어요" 안내',(await p.innerText('#toast')).includes('꾹 누르면')&&(await S(p)).tipStk===true,await p.innerText('#toast'));
  await closePop(p);await p.waitForTimeout(3000);
  await openDay(p,day(13));
  T('두 번째부터는 안내가 안 뜸',await p.evaluate(()=>!document.querySelector('#toast').classList.contains('show')));
  T('날짜 창 스티커 줄이 꾹 누르기 대상(data-hold)',await p.evaluate(()=>[...document.querySelectorAll('#pop .sdr')].every(r=>r.dataset.hold==='stk'&&r.dataset.id&&r.dataset.k)));
  // ===== 짧게 누르면 아무 일 없음 · 버튼은 그대로 =====
  await p.click(rowSel('s_run')+' .nm');await p.waitForTimeout(350);
  T('짧게 누르면 고치기 화면이 안 열림',await p.evaluate(()=>!document.querySelector('#page.open')&&!!document.querySelector('#pop .sdr')));
  // ===== 꾹 누르면 고치기 화면 =====
  const before=await S(p);
  await hold(p,rowSel('s_run'));
  T('꾹 누르면 "조깅 고치기" 화면이 열림',await p.evaluate(()=>!!document.querySelector('#page.open .srpg')&&document.querySelector('#page .pg-h b').textContent.includes('조깅 고치기')));
  T('안내: 10월 13일부터 적용 · 이전 날은 그대로',(await p.innerText('#page')).includes('10월 13일부터 적용돼요 (이전 날은 그대로)'));
  T('지금 값이 채워져 있음(매일 · 알림 켜짐 · 오전 7:00)',await p.evaluate(()=>!!document.querySelector('#page [data-act="sr-rep"][data-v="daily"].on')&&document.getElementById('srAlarm').checked&&document.querySelector('#page').innerText.includes('오전 7:00')));
  T('고치기 화면은 "반복 없음" 선택이 있고 "이날만"은 없음',await p.evaluate(()=>!!document.querySelector('#page [data-act="sr-rep"][data-v="none"]')&&!document.querySelector('#page [data-act="sr-rep"][data-v="once"]')));
  await p.screenshot({path:'/tmp/s50_edit.png'});
  await p.click('#page [data-act="sr-back"]');await p.waitForTimeout(450);
  T('뒤로 가면 날짜 창으로 돌아오고 아무것도 안 바뀜',await p.evaluate(()=>!document.querySelector('#page.open')&&!!document.querySelector('#pop .sdr'))&&same((await S(p)).stamps,before.stamps));

  // ===== 반복 규칙 고치기: 매일 → 화·목 (10/13부터). 그 전 날은 그대로 =====
  await hold(p,rowSel('s_run'));
  await p.click('#page [data-act="sr-rep"][data-v="dow"]');await p.waitForTimeout(250);
  await p.click('#page [data-act="sr-day"][data-v="4"]');await p.waitForTimeout(250);
  await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(600);
  let s=await S(p),run=s.stamps.defs.find(x=>x.id==='s_run');
  T('조깅 규칙이 요일(화 · 목)로 바뀜 · 시작일은 그대로',run.rep==='dow'&&same(run.days.slice().sort(),[2,4])&&run.from==='2026-10-01'&&!run.to,JSON.stringify(run));
  T('토스트: 고쳤어요',(await p.innerText('#toast')).includes('고쳤어요'),await p.innerText('#toast'));
  T('저장하면 날짜 창으로 돌아옴',await p.evaluate(()=>!document.querySelector('#page.open')&&!!document.querySelector('#pop .sdr')));
  const pinned=['02','03','04','05','07','09','10','11','12'].map(x=>day(+x)).sort();
  T('지난 날 중 새 규칙(화·목)에 안 맞는 9일은 날짜로 남음',same(run.dates.slice().sort(),pinned),JSON.stringify(run.dates));
  await closePop(p);
  let all=true;for(let n=1;n<=12;n++)if(!(await has(p,day(n),'👟')))all=false;
  T('고치기 전에 깔려 있던 지난 날(10/1~10/12) 조깅이 전부 그대로',all);
  const fut=[];for(const n of [13,14,15,16,17,20])fut.push(await has(p,day(n),'👟'));
  T('10/13 부터는 새 규칙: 화(13 · 20) · 목(15) 만 있고 수 · 금 · 토(14 · 16 · 17)는 없음',same(fut,[true,false,true,false,false,true]),JSON.stringify(fut));
  await p.waitForTimeout(700);
  const rem=await p.evaluate(()=>(window.__rem||[]).map(r=>String(r.id)));
  T('알림도 새 규칙대로: 10/13 · 10/15 7시에는 있고 10/14 에는 없음',rem.includes('a_s_run_'+day(13)+'_0')&&rem.includes('a_s_run_'+day(15)+'_0')&&!rem.includes('a_s_run_'+day(14)+'_0'),JSON.stringify(rem.filter(x=>x.startsWith('a_s_run')).slice(0,6)));

  // ===== 알림만 고치기: 규칙은 그대로(날짜 · 건너뜀이 안 늘어남) =====
  await openDay(p,day(13));
  const d0=(await S(p)).stamps.defs.find(x=>x.id==='s_run');
  await hold(p,rowSel('s_run'));
  await p.evaluate(()=>{const c=document.getElementById('srAlarm');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(250);
  await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(600);
  s=await S(p);const d1=s.stamps.defs.find(x=>x.id==='s_run');
  T('알림을 끄면 알림 시각이 비워짐',(d1.ats||[]).length===0);
  T('알림만 고쳤으니 날짜 · 건너뛴 날은 그대로(안 늘어남)',same(d1.dates,d0.dates)&&same(d1.skip,d0.skip)&&d1.rep==='dow'&&same(d1.days,d0.days));
  T('날짜 창 조깅 줄에서 🔔 사라짐',await p.evaluate(()=>{const r=document.querySelector('#pop .sdr[data-id="s_run"] .nm small');return !!r&&!r.textContent.includes('🔔');}));
  await closePop(p);

  // ===== 반복을 넓히기: 운동 월·수·금 → 매일 (10/14 부터). 그 전에 안 깔렸던 날은 안 생김 =====
  await openDay(p,day(14));
  await hold(p,rowSel('s_gym'));
  T('운동 고치기 화면(요일 선택됨)',await p.evaluate(()=>document.querySelector('#page .pg-h b').textContent.includes('운동 고치기')&&!!document.querySelector('#page [data-act="sr-rep"][data-v="dow"].on')));
  await p.click('#page [data-act="sr-rep"][data-v="daily"]');await p.waitForTimeout(250);
  await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(600);
  s=await S(p);const gym=s.stamps.defs.find(x=>x.id==='s_gym');
  T('운동이 매일로 바뀜',gym.rep==='daily'&&gym.from==='2026-10-01',JSON.stringify(gym));
  await closePop(p);
  const gp=[];for(const n of [2,5,6,7,8,12,13,14,15,16])gp.push(await has(p,day(n),'💪'));
  T('지난 날은 그대로: 월 · 수 · 금(2 · 5 · 7 · 12)만 있고 화 · 목(6 · 8 · 13)은 새로 안 생김',same(gp,[true,true,false,true,false,true,false,true,true,true]),JSON.stringify(gp));

  // ===== ＋ 로 붙인 스티커(반복 없음)도 고쳐짐 =====
  await openDay(p,day(21));
  const c0=(await S(p)).stamps.defs.find(x=>x.id==='o_cake');
  await hold(p,rowSel('o_cake'));
  T('＋ 생일 고치기: "반복 없음" 선택 · 알림 9:30',await p.evaluate(()=>!!document.querySelector('#page [data-act="sr-rep"][data-v="none"].on')&&document.getElementById('srAlarm').checked&&document.querySelector('#page').innerText.includes('오전 9:30')));
  await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(600);
  const c1=(await S(p)).stamps.defs.find(x=>x.id==='o_cake');
  T('아무것도 안 바꾸고 저장하면 날짜 · 알림 그대로',same(c1.dates,c0.dates)&&same(c1.ats,c0.ats)&&c1.rep==='none'&&c1.one===true&&same(c1.skip,c0.skip));
  await closePop(p);
  T('오류 없음',p.errs.length===0,p.errs.join('|'));

  // ===== 다시 켜도 (저장 데이터로) =====
  const saved=await S(p);await p.close();
  p=await boot(b,saved);
  T('다시 켜도 안내 표시는 켜진 채(tipStk) · 고친 규칙 그대로',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return s.tipStk===true&&s.stamps.defs.find(x=>x.id==='s_run').rep==='dow';}));
  await openDay(p,day(13));
  T('다시 켠 뒤에도 안내가 또 안 뜸',await p.evaluate(()=>!document.querySelector('#toast').classList.contains('show')));
  T('오류 없음(2)',p.errs.length===0,p.errs.join('|'));
  await p.close();
  T.sum();await b.close();
})();
