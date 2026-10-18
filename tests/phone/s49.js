// 스티커에 "알림 있음" 표시 (v0.64): 설정 스티커 칸의 🔔 · 날짜 창 줄의 시각 — 알림 켠 스티커에만 (안 쓰는 사람 화면은 그대로)
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
    mk('s_read','📖','독서'),
    mk('s_teeth','🦷','양치',{ats:['22:00']}),
    mk('s_empty','','',{empty:true}),
    mk('o_cake','🎂','생일',{one:true,dates:['2026-10-20'],ats:['09:30']})],
    log:{},snap:{},remind:false,pillTimes:['08:00','13:00','20:00'],lastAt:[],v3:1,v4:1}});
  const S=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
  const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
  const toSlots=async p=>{await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.evaluate(()=>document.querySelector('[data-act="stk-board"]').click());await p.waitForTimeout(400);};
  const toCal=async p=>{await p.evaluate(()=>{const b=document.querySelector('#page .pg-h .bk');b&&b.click();});await p.waitForTimeout(250);await p.evaluate(()=>document.querySelector('#nav [data-tab="cal"]').click());await p.waitForTimeout(350);};
  const bells=p=>p.evaluate(()=>[...document.querySelectorAll('#page .stgrid [data-act="slot-open"]')].filter(b=>b.querySelector('.stbell')).map(b=>b.dataset.id).sort());
  const rowText=(p,name)=>p.evaluate(n=>{const r=[...document.querySelectorAll('#pop .sdr')].find(x=>x.querySelector('.nm').textContent.startsWith(n));return r?r.querySelector('.nm small').textContent:null;},name);
  const openDay=async(p,k)=>{await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell(k));await p.waitForTimeout(400);};
  const closePop=p=>p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';});

  const p=await boot(b,state());
  // ===== 설정 › 스티커 =====
  await toSlots(p);
  T('알림 켠 스티커에만 🔔 (약 · 조깅 · 양치 · ＋ 생일)',JSON.stringify(await bells(p))===JSON.stringify(['o_cake','s_pill','s_run','s_teeth']),JSON.stringify(await bells(p)));
  T('알림 없는 스티커(운동 · 물 · 독서) · 빈 칸에는 🔔 없음',await p.evaluate(()=>['s_gym','s_water','s_read','s_empty'].every(id=>!document.querySelector(`#page [data-act="slot-open"][data-id="${id}"] .stbell`))));
  T('🔔은 화면 읽기용 이름이 있음 ("알림 있음")',await p.evaluate(()=>{const e=document.querySelector('#page [data-act="slot-open"][data-id="s_pill"] .stbell');return !!e&&e.getAttribute('role')==='img'&&e.getAttribute('aria-label')==='알림 있음';}));
  T('🔔은 칸 안쪽 오른쪽 위에 있고 이름 글자와 안 겹침',await p.evaluate(()=>{const bt=document.querySelector('#page [data-act="slot-open"][data-id="s_pill"]'),e=bt.querySelector('.stbell'),sm=bt.querySelector('small'),a=bt.getBoundingClientRect(),r=e.getBoundingClientRect(),t=sm.getBoundingClientRect();return r.right<=a.right&&r.left>=a.left&&r.top>=a.top&&r.bottom<=t.top+1;}));
  T('칸의 크기 · 개수는 그대로(내 스티커 7칸 + ＋ 1개)',await p.evaluate(()=>document.querySelectorAll('#page .stgrid[data-grp="slot"] [data-act="slot-open"]').length===7&&document.querySelectorAll('#page .stgrid[data-grp="extra"] [data-act="slot-open"]').length===1));
  await p.screenshot({path:'/tmp/s49_set.png',clip:{x:0,y:0,width:390,height:420}});
  await toCal(p);
  // ===== 날짜 창 =====
  await openDay(p,'2026-10-13');
  const pillT=await rowText(p,'약'),runT=await rowText(p,'조깅'),waterT=await rowText(p,'물');
  T('날짜 창: 약 줄에 "🔔 8:00 · 20:00"',!!pillT&&pillT.includes('🔔 8:00 · 20:00')&&pillT.includes('하루 2번 · 매일'),pillT);
  T('날짜 창: 조깅 줄에 "🔔 7:00"',!!runT&&runT.includes('매일 · 🔔 7:00 · 아직'),runT);
  T('날짜 창: 알림 없는 물 줄에는 🔔 없음',!!waterT&&!waterT.includes('🔔')&&waterT.includes('매일 · 아직'),waterT);
  await p.screenshot({path:'/tmp/s49_day.png',clip:{x:0,y:430,width:390,height:414}});
  await closePop(p);
  // ===== 알림을 켜면 표시가 생기고, 끄면 사라짐 (등록 화면 → 설정) =====
  await openDay(p,'2026-10-17');
  await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
  await p.click('#pop [data-act="sp-pick"][data-id="s_read"]');await p.waitForTimeout(450);
  await p.evaluate(()=>{const c=document.getElementById('srAlarm');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(250);
  await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(450);
  let s=await S(p);
  T('독서에 알림 시각이 저장됨',(s.stamps.defs.find(x=>x.id==='s_read').ats||[]).length===1,JSON.stringify(s.stamps.defs.find(x=>x.id==='s_read').ats));
  const at1=s.stamps.defs.find(x=>x.id==='s_read').ats[0].replace(/^0/,'');
  await openDay(p,'2026-10-17');
  const readT=await rowText(p,'독서');
  T('날짜 창: 독서 줄에 방금 정한 시각 표시',!!readT&&readT.includes('🔔 '+at1),readT);
  await closePop(p);
  await toSlots(p);
  T('설정: 독서 칸에 🔔 생김',(await bells(p)).includes('s_read'));
  await toCal(p);
  await openDay(p,'2026-10-18');
  await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
  await p.click('#pop [data-act="sp-pick"][data-id="s_read"]');await p.waitForTimeout(450);
  T('다시 등록 화면: 알림 스위치가 켜진 채로 열림',await p.evaluate(()=>document.getElementById('srAlarm').checked));
  await p.evaluate(()=>{const c=document.getElementById('srAlarm');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(250);
  await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(450);
  s=await S(p);
  T('알림을 끄면 독서의 알림 시각이 비워짐',(s.stamps.defs.find(x=>x.id==='s_read').ats||[]).length===0);
  await toSlots(p);
  T('설정: 독서 칸의 🔔 사라짐 · 나머지는 그대로',JSON.stringify(await bells(p))===JSON.stringify(['o_cake','s_pill','s_run','s_teeth']),JSON.stringify(await bells(p)));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));
  await p.close();

  // ===== 알림을 한 번도 안 쓰는 사람: 화면에 달라지는 게 없음 =====
  {
    const st=state();st.stamps.defs.forEach(x=>{x.ats=[];});
    const q=await boot(b,st);
    await toSlots(q);
    T('알림이 하나도 없으면 설정에 🔔이 하나도 없음',(await bells(q)).length===0&&await q.evaluate(()=>!document.querySelector('#page .stbell')));
    await toCal(q);await openDay(q,'2026-10-13');
    T('알림이 하나도 없으면 날짜 창에도 🔔 없음',await q.evaluate(()=>!document.querySelector('#pop .sdr .nm small').textContent.includes('🔔')&&![...document.querySelectorAll('#pop .sdr .nm small')].some(x=>x.textContent.includes('🔔'))));
    T('오류 없음(2)',q.errs.length===0,q.errs.join('|'));
    await q.close();
  }
  T.sum();await b.close();
})();
