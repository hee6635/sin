// 스티커 칸 바꾸기 · 비우기 (v0.176 ＋ 없앰): 붙인 적 있는 스티커는 지난 날짜 · 기록은 그대로, 오늘부터는 안 깔림 · 안 쓴 것은 정리(retired) · 설정에 ＋ 줄 없음
const {chromium,boot}=require('./x_common.js');
const {mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const mk=(id,emoji,name,o={})=>Object.assign({id,kind:'mark',emoji,name,times:1,rep:'none',days:[],dates:[],skip:[],ats:[]},o);
  const state=(extras=true)=>({...base,stamps:{defs:[
    mk('s_run','👟','조깅',{rep:'daily',from:'2026-10-01',ats:['07:00']}),     // 매일 반복 + 알림 + 지난 체크 1개
    mk('s_gym','💪','운동',{dates:['2026-10-03','2026-10-14']}),               // 지난 날 체크 + 앞으로 날짜
    mk('s_water','💧','물'),                                                    // 아무데도 안 붙인 스티커
    mk('s_read','📖','독서'),
    mk('s_empty','','',{empty:true}),
    ...(extras?[mk('o_cake','🎂','생일',{one:true,dates:['2026-10-20']}),
                {id:'o_pill',kind:'pill',emoji:'💊',name:'혈압약',times:2,color:'#3b82f6',shape:'round',one:true,rep:'none',days:[],dates:['2026-10-25'],skip:[],ats:[],fam:true}]:[])],
    log:{'2026-10-05':{s_run:1},'2026-10-03':{s_gym:1}},snap:{},remind:false,pillTimes:['08:00','13:00','20:00'],lastAt:[],v3:1,v4:1}});
  const S=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
  const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
  const has=(p,k,em)=>p.evaluate(([c,e])=>{const el=document.querySelector(c);return !!el&&el.textContent.includes(e);},[cell(k),em]);
  const toSlots=async p=>{await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.evaluate(()=>document.querySelector('[data-act="stk-board"]').click());await p.waitForTimeout(350);};
  const toCal=async p=>{await p.evaluate(()=>{const b=document.querySelector('#page .pg-h .bk');b&&b.click();});await p.waitForTimeout(250);await p.evaluate(()=>document.querySelector('#nav [data-tab="cal"]').click());await p.waitForTimeout(350);};
  const openSlot=async(p,id)=>{await p.evaluate(i=>document.querySelector(`#page [data-act="slot-open"][data-id="${i}"]`).click(),id);await p.waitForTimeout(300);};
  const cnt=(p,sel)=>p.evaluate(s=>document.querySelectorAll(s).length,sel);
  const slotN=s=>s.stamps.defs.filter(x=>!x.retired&&!x.one).length;
  const ids=s=>s.stamps.defs.map(x=>x.id+(x.one?'+':'')+(x.retired?'-':''));
  const swapTo=async(p,id,pickSel)=>{await openSlot(p,id);await p.click('#pop [data-act="slot-swap"]');await p.waitForTimeout(300);await p.click(pickSel);await p.waitForTimeout(250);await p.click('#pop [data-act="icn-save"]');await p.waitForTimeout(500);};

  // ===== 1. 바꾸기: 매일 조깅(쓰던 것) → 다른 그림 =====
  {
    const p=await boot(b,state());
    await toSlots(p);
    T('설정에 ＋ 로 붙인 스티커 줄 없음 (옛 ＋ 스티커가 있어도)',await cnt(p,'#page .stgrid[data-grp="extra"]')===0&&!(await p.innerText('#page')).includes('＋ 로 붙인'));
    await openSlot(p,'s_run');await p.click('#pop [data-act="slot-swap"]');await p.waitForTimeout(300);
    T('바꾸기 창에 ＋ 줄 없음',await cnt(p,'#pop [data-src]')===0&&!(await p.innerText('#pop')).includes('＋ 로 붙인'));
    await p.click('#pop [data-act="icn-pick"][data-v="🌿"]');await p.waitForTimeout(250);await p.click('#pop [data-act="icn-save"]');await p.waitForTimeout(500);
    let s=await S(p);const r=s.stamps.defs.find(x=>x.id==='s_run');
    T('옛 조깅: 반복은 어제까지 · 알림 없음 · 지난 체크 그대로',r.one===true&&!r.retired&&r.to==='2026-10-11'&&(r.ats||[]).length===0&&(s.stamps.log['2026-10-05']||{}).s_run===1,JSON.stringify(r));
    T('칸은 10개 (5개 + v0.221 빈 칸 채움)',slotN(s)===10,JSON.stringify(ids(s)));
    await toCal(p);
    T('달력: 지난 체크(10/5) 남음 · 앞으로(10/13) 조깅 없음',await has(p,'2026-10-05','👟')&&!(await has(p,'2026-10-13','👟')));
    await p.waitForTimeout(700);
    T('조깅 알림 예약 없어짐',!(await p.evaluate(()=>window.__rem||[])).some(x=>String(x.id).startsWith('a_s_run_')));
    // 운동(지난 체크 + 앞으로 날짜) 바꾸기 → 앞으로 날짜만 빠짐
    await toSlots(p);await openSlot(p,'s_gym');await p.click('#pop [data-act="slot-swap"]');await p.waitForTimeout(300);
    await p.click('#pop [data-act="icn-pick"][data-v="🌿"]');await p.waitForTimeout(250);await p.click('#pop [data-act="icn-save"]');await p.waitForTimeout(500);
    s=await S(p);const g=s.stamps.defs.find(x=>x.id==='s_gym');
    T('옛 운동: 지난 날짜(10/3) · 체크 남고 앞으로(10/14) 빠짐',g.dates.join()==='2026-10-03'&&(s.stamps.log['2026-10-03']||{}).s_gym===1,JSON.stringify(g));
    // 안 쓴 물 바꾸기 → 정리
    await openSlot(p,'s_water');await p.click('#pop [data-act="slot-swap"]');await p.waitForTimeout(300);
    await p.click('#pop [data-act="icn-pick"][data-v="🌿"]');await p.waitForTimeout(250);await p.click('#pop [data-act="icn-save"]');await p.waitForTimeout(500);
    s=await S(p);
    T('안 쓴 물은 정리(retired)',s.stamps.defs.find(x=>x.id==='s_water').retired===true);
    await toCal(p);
    T('옛 ＋ 생일(10/20)은 달력에 그대로',await has(p,'2026-10-20','🎂'));
    T('오류 없음(1)',p.errs.length===0,p.errs.join('|'));
    const saved=await S(p);await p.close();
    const p2=await boot(b,saved);
    T('다시 켜도 오류 없음 · 10/5 조깅 체크 그대로',p2.errs.length===0&&await has(p2,'2026-10-05','👟'));
    await p2.close();
  }
  // ===== 2. 비우기: 쓰던 조깅 → 오늘부터 안 깔림 · 빈 칸 =====
  {
    const p=await boot(b,state(false));
    await toSlots(p);await openSlot(p,'s_run');
    await p.click('#pop [data-act="slot-clear"]');await p.waitForTimeout(450);
    T('토스트: 비웠어요 · 지난 기록은 그대로예요',(await p.innerText('#toast')).includes('지난 기록은 그대로예요'),await p.innerText('#toast'));
    const s=await S(p),r=s.stamps.defs.find(x=>x.id==='s_run');
    T('비운 조깅: 어제까지 · 기록 그대로 · 그 자리에 빈 칸',r.to==='2026-10-11'&&(s.stamps.log['2026-10-05']||{}).s_run===1&&slotN(s)===10&&s.stamps.defs[0].empty===true,JSON.stringify(ids(s)));
    await openSlot(p,'s_read');await p.click('#pop [data-act="slot-clear"]');await p.waitForTimeout(450);
    T('안 쓴 독서는 그냥 정리',(await S(p)).stamps.defs.find(x=>x.id==='s_read').retired===true);
    T('오류 없음(2)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
