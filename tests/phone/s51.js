// 위젯 데이터: 공휴일 두 글자 · 한 글자(h2 · h1) + 알림 켠 스티커 표시(b) (v0.70)
const {chromium,boot}=require('./x_common.js');
const {mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const mk=(id,emoji,name,o={})=>Object.assign({id,kind:'mark',emoji,name,times:1,rep:'none',days:[],dates:[],skip:[],ats:[]},o);
  const img='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const state=()=>({...base,icons:{p1:img},stamps:{defs:[
    {id:'s_pill',kind:'pill',emoji:'💊',name:'약',times:2,color:'#ef4d5a',shape:'caps',rep:'daily',from:'2026-10-01',days:[],dates:[],skip:[],ats:['08:00','20:00']},
    mk('s_run','👟','조깅',{rep:'daily',from:'2026-10-01',ats:['07:00']}),
    mk('s_water','💧','물',{rep:'daily',from:'2026-10-01'}),
    mk('s_photo','@p1','사진',{rep:'daily',from:'2026-10-01',ats:['21:00']}),
    mk('s_gone','📖','옛 독서',{retired:true,rep:'daily',from:'2026-10-01'})],
    log:{},snap:{},remind:false,pillTimes:['08:00','13:00','20:00'],lastAt:[],v3:1,v4:1}});
  // 서버에서 받은 공휴일처럼 이름을 넣음 (설날 · 긴 이름들) — 위젯 데이터에 들어가는 날짜 범위(10/6 ~ 12/10)
  const HOL={'2026-10-20':'설날','2026-10-21':'대체공휴일(삼일절)','2026-10-22':'부처님오신날','2026-10-23':'개천절·추석','2026-10-24':'연휴','2026-10-25':'어린이날','2026-12-01':'대체공휴일(설날)'};
  const pre=`localStorage.setItem('eonjeswieo:hol',JSON.stringify({fetchedAt:Date.now(),years:{2026:${JSON.stringify(HOL)}}}));`;
  const wgOn=pg=>pg.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(JSON.parse(j));});
  const p=await boot(b,state(),{touch:true,w:384,preInit:pre});
  await wgOn(p);
  await p.click('#nav [data-tab="set"]');await p.waitForTimeout(200);
  await p.evaluate(()=>document.querySelector('[data-act="memolines"][data-v="4"]').click());await p.waitForTimeout(1000);
  const w=await p.evaluate(()=>window.__wg[window.__wg.length-1]);
  const day=k=>w.days.find(x=>x.k===k);
  // ===== 공휴일 글자 =====
  T('설날 → 두 글자 "설날" · 한 글자 "설"',day('2026-10-20').hol==='설날'&&day('2026-10-20').h2==='설날'&&day('2026-10-20').h1==='설',JSON.stringify(day('2026-10-20')));
  T('대체공휴일(삼일절) → "대체" · "대" (괄호 이름이 안 길어짐)',day('2026-10-21').h2==='대체'&&day('2026-10-21').h1==='대');
  T('부처님오신날 → "부처" · "부"',day('2026-10-22').h2==='부처'&&day('2026-10-22').h1==='부');
  T('개천절·추석(겹친 날) → 앞 이름 "개천" · "개"',day('2026-10-23').h2==='개천'&&day('2026-10-23').h1==='개');
  T('연휴 → "연휴" (두 글자)',day('2026-10-24').h2==='연휴'&&day('2026-10-24').h1.length===1);
  T('어린이날 → "어린" · "어"',day('2026-10-25').h2==='어린'&&day('2026-10-25').h1==='어');
  T('2주 뒤 날(far)에도 두 글자 · 한 글자가 같이 감 (대체공휴일(설날) → "대체")',day('2026-12-01').far===1&&day('2026-12-01').h2==='대체'&&day('2026-12-01').h1==='대',JSON.stringify(day('2026-12-01')));
  T('모든 두 글자는 2자 이하 · 한 글자는 1자',w.days.filter(x=>x.h2).every(x=>x.h2.length>=1&&x.h2.length<=2&&x.h1.length===1));
  T('공휴일이 없는 날에는 h2 · h1 이 아예 없음 (안 쓰는 날 데이터 안 늘어남)',w.days.filter(x=>!x.hol).every(x=>!('h2' in x)&&!('h1' in x))&&w.days.some(x=>!x.hol));
  T('옛 이름 칸(hol)은 그대로 전체 이름 (큰 창 · 옛 위젯용)',day('2026-10-21').hol==='대체공휴일(삼일절)');
  // ===== 알림 켠 스티커 표시 =====
  const d13=day('2026-10-13');
  const has=id=>{const s=d13.sa.find(x=>x.id===id);return s&&s.b===1;};
  T('알림 켠 스티커에만 b:1 — 약(알약) · 조깅 · 사진 스티커',has('s_pill')&&has('s_run')&&has('s_photo'),JSON.stringify(d13.sa));
  T('알림 없는 스티커(물)에는 b 가 없음',d13.sa.find(x=>x.id==='s_water')&&!('b' in d13.sa.find(x=>x.id==='s_water')),JSON.stringify(d13.sa));
  T('위젯 칸용 목록(stk)에도 같은 값이 실려 있음(칸에는 안 그림)',d13.stk.every(x=>x.b===1||!('b' in x)));
  T('옛 스티커(지운 칸)는 알림이 없어 b 없음',!d13.sa.some(x=>x.id==='s_gone'&&x.b));
  // ===== 알림을 끄면 b 가 사라짐 (날짜 창에서 조깅을 꾹 눌러 고치기 → 알림 끄기 → 저장) =====
  const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
  const hold=async(pg,sel)=>{const c=await pg.$eval(sel,e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];});await pg.mouse.move(c[0],c[1]);await pg.mouse.down();await pg.waitForTimeout(700);await pg.mouse.up();await pg.waitForTimeout(500);};
  await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
  await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell('2026-10-13'));await p.waitForTimeout(450);
  await hold(p,'#pop .sdr[data-id="s_run"]');
  await wgOn(p);
  await p.evaluate(()=>{const c=document.getElementById('srAlarm');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(250);
  await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(1500);
  const w2=await p.evaluate(()=>window.__wg[window.__wg.length-1]);
  const run2=w2&&w2.days.find(x=>x.k==='2026-10-13').sa.find(x=>x.id==='s_run');
  T('조깅 알림을 끄고 저장하면 위젯 데이터의 b 가 사라짐 · 약은 그대로',!!run2&&!('b' in run2)&&w2.days.find(x=>x.k==='2026-10-13').sa.find(x=>x.id==='s_pill').b===1,JSON.stringify(run2));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));
  await p.close();

  // ===== 알림 · 공휴일을 한 번도 안 쓰는 사람: 데이터가 안 늘어남 =====
  {
    const st=state();st.stamps.defs.forEach(x=>{x.ats=[];});
    const q=await boot(b,st,{touch:true,w:384,preInit:pre});
    await wgOn(q);
    await q.click('#nav [data-tab="set"]');await q.waitForTimeout(200);
    await q.evaluate(()=>document.querySelector('[data-act="memolines"][data-v="4"]').click());await q.waitForTimeout(1000);
    const ww=await q.evaluate(()=>window.__wg[window.__wg.length-1]);
    T('알림이 하나도 없으면 스티커 항목에 b 가 하나도 없음',ww&&ww.days.every(x=>(x.sa||[]).every(s=>!('b' in s))),JSON.stringify(ww&&ww.days[7]&&ww.days[7].sa));
    T('오류 없음(2)',q.errs.length===0,q.errs.join('|'));
    await q.close();
  }
  T.sum();await b.close();
})();
