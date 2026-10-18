// 스티커 칸 바꾸기 (v0.64): 칸을 바꿔도 이미 붙인 스티커는 그대로 ("＋ 로 붙인 스티커" 쪽으로 옮김) · 바꾸는 목록 맨 위 "＋ 로 붙인 스티커" 줄로 칸에 복사
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

  // ===== 1. 칸 바꾸기: 이미 붙인 건 그대로 =====
  {
    const p=await boot(b,state());
    for(const [k,em,why] of [['2026-10-05','👟','지난 체크'],['2026-10-06','👟','지난 날(체크 안 한 흐린 것)'],['2026-10-13','👟','앞으로(매일 반복)'],['2026-10-03','💪','지난 체크'],['2026-10-14','💪','앞으로 날짜']])
      T(`바꾸기 전: ${k} ${em} (${why})`,await has(p,k,em));
    const s0=await S(p);
    await toSlots(p);
    T('설정: 내 스티커 5칸 · ＋ 로 붙인 스티커 2개',await cnt(p,'#page .stgrid[data-grp="slot"] [data-act="slot-open"]')===5&&await cnt(p,'#page .stgrid[data-grp="extra"] [data-act="slot-open"]')===2);
    await openSlot(p,'s_run');
    T('칸 창에 "다른 스티커로" 버튼',await cnt(p,'#pop [data-act="slot-swap"]')===1);
    await p.click('#pop [data-act="slot-swap"]');await p.waitForTimeout(300);
    T('바꾸기 창: 안내가 "달력에 붙인 옛 스티커는 그대로 남아요"',(await p.innerText('#pop .mh')).includes('달력에 붙인 옛 스티커는 그대로 남아요'));
    T('바꾸기 창 맨 위에 "＋ 로 붙인 스티커" 줄(2개)',(await p.innerText('#pop')).includes('＋ 로 붙인 스티커')&&await cnt(p,'#pop [data-act="icn-pick"][data-src]')===2);
    await p.screenshot({path:'/tmp/s48_swap.png'});
    await p.click('#pop [data-act="icn-pick"][data-v="🌿"]');await p.waitForTimeout(250);
    await p.click('#pop [data-act="icn-save"]');await p.waitForTimeout(400);
    T('토스트: 달력에 붙인 옛 스티커는 그대로예요',(await p.innerText('#toast')).includes('달력에 붙인 옛 스티커는 그대로예요'),await p.innerText('#toast'));
    const s1=await S(p);
    T('내 스티커는 그대로 5칸 · 같은 자리에 새 스티커(요가)',slotN(s1)===slotN(s0)&&s1.stamps.defs[0].emoji==='🌿'&&s1.stamps.defs[0].name==='요가'&&!s1.stamps.defs[0].one,JSON.stringify(ids(s1)));
    const old=s1.stamps.defs.find(x=>x.id==='s_run');
    T('옛 조깅은 지워지지 않고 ＋ 쪽으로(one) · 반복 · 알림 · 시작일 그대로',!!old&&old.one===true&&!old.retired&&old.rep==='daily'&&old.from==='2026-10-01'&&(old.ats||[]).join()==='07:00',JSON.stringify(old));
    T('지난 체크 기록도 그대로',(s1.stamps.log['2026-10-05']||{}).s_run===1);
    T('새 요가 스티커는 깨끗함(붙은 곳 없음)',s1.stamps.defs[0].dates.length===0&&s1.stamps.defs[0].rep==='none');
    T('설정: ＋ 로 붙인 스티커 줄에 조깅이 옮겨져 보임(3개)',await cnt(p,'#page .stgrid[data-grp="extra"] [data-act="slot-open"]')===3&&(await p.innerText('#page .stgrid[data-grp="extra"]')).includes('조깅'));
    T('설정: 내 스티커 줄에 요가 · 조깅은 없음',(await p.innerText('#page .stgrid[data-grp="slot"]')).includes('요가')&&!(await p.innerText('#page .stgrid[data-grp="slot"]')).includes('조깅'));
    await toCal(p);
    for(const [k,em,why] of [['2026-10-05','👟','지난 체크'],['2026-10-06','👟','지난 날(체크 안 한 흐린 것)'],['2026-10-13','👟','앞으로(매일 반복)'],['2026-10-14','👟','앞으로(매일 반복) 2']])
      T(`바꾼 뒤에도: ${k} ${em} (${why})`,await has(p,k,em));
    T('바꾼 뒤 새 요가는 달력에 안 깔림',!(await has(p,'2026-10-13','🌿')));
    await p.waitForTimeout(700);
    const rem=await p.evaluate(()=>window.__rem||[]);
    T('조깅 알림 예약도 그대로 (a_s_run_…)',rem.some(r=>String(r.id).startsWith('a_s_run_')),JSON.stringify(rem.slice(0,3)));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));

    // ===== 2. 아무데도 안 붙인 스티커를 바꾸면: 옛 방식대로 정리(retired) — ＋ 쪽에 남지 않음 =====
    await toSlots(p);
    await swapTo(p,'s_water','#pop [data-act="icn-pick"][data-v="🏊"]');
    const s2=await S(p);
    const w=s2.stamps.defs.find(x=>x.id==='s_water');
    T('붙인 곳 없던 물 스티커는 그냥 정리됨(retired) · ＋ 쪽으로 안 감',!!w&&w.retired===true&&!w.one,JSON.stringify(w));
    T('내 스티커는 여전히 5칸',slotN(s2)===5,JSON.stringify(ids(s2)));
    T('설정 ＋ 줄은 그대로 3개(물은 안 늘어남)',await cnt(p,'#page .stgrid[data-grp="extra"] [data-act="slot-open"]')===3);

    // ===== 3. 큰 목록 맨 위 "＋ 로 붙인 스티커" 줄로 칸에 복사 =====
    // 3-a 빈 칸(바로 고르기)
    await openSlot(p,'s_empty');
    T('빈 칸 고르기 창에 "＋ 로 붙인 스티커" 줄(3개: 생일 · 혈압약 · 조깅)',(await p.innerText('#pop')).includes('＋ 로 붙인 스티커')&&await cnt(p,'#pop [data-act="icn-pick"][data-src]')===3);
    await p.click('#pop [data-act="icn-pick"][data-src="o_cake"]');await p.waitForTimeout(500);
    let s3=await S(p);
    const cake=s3.stamps.defs.find(x=>x.id==='s_empty'),cakeO=s3.stamps.defs.find(x=>x.id==='o_cake');
    T('빈 칸이 🎂 생일 로 채워짐 (복사)',!!cake&&cake.emoji==='🎂'&&cake.name==='생일'&&!cake.empty&&!cake.one&&cake.dates.length===0,JSON.stringify(cake));
    T('＋ 쪽 🎂 은 날짜 그대로(안 건드림)',!!cakeO&&cakeO.one===true&&cakeO.dates.join()==='2026-10-20');
    // 3-b 바꾸기(약 복사: 색 · 모양 · 횟수)
    await openSlot(p,'s_gym');await p.click('#pop [data-act="slot-swap"]');await p.waitForTimeout(300);
    await p.click('#pop [data-act="icn-pick"][data-src="o_pill"]');await p.waitForTimeout(250);
    T('고르면 이름 칸이 혈압약으로 채워지고 그 칸이 눌린 모양',await p.evaluate(()=>document.querySelector('#icnName').value==='혈압약'&&!!document.querySelector('#pop [data-src="o_pill"].on')));
    await p.click('#pop [data-act="icn-save"]');await p.waitForTimeout(500);
    s3=await S(p);
    const gymNew=s3.stamps.defs.find(x=>x.kind==='pill'&&x.name==='혈압약'&&!x.one),gymOld=s3.stamps.defs.find(x=>x.id==='s_gym'),pillO=s3.stamps.defs.find(x=>x.id==='o_pill');
    T('운동 칸이 혈압약(둥근 알약 · 파랑 · 하루 2번)으로',!!gymNew&&gymNew.shape==='round'&&gymNew.color==='#3b82f6'&&gymNew.times===2&&gymNew.dates.length===0&&(gymNew.ats||[]).length===0,JSON.stringify(gymNew));
    T('가족에게 보이기 설정도 복사(fam:true)',!!gymNew&&gymNew.fam===true);
    T('옛 운동은 ＋ 쪽으로(날짜 2개 · 지난 체크 그대로)',!!gymOld&&gymOld.one===true&&gymOld.dates.join()==='2026-10-03,2026-10-14'&&(s3.stamps.log['2026-10-03']||{}).s_gym===1);
    T('＋ 쪽 혈압약은 그대로(날짜 · 횟수)',!!pillO&&pillO.one===true&&pillO.dates.join()==='2026-10-25'&&pillO.times===2);
    T('내 스티커는 여전히 5칸',slotN(s3)===5,JSON.stringify(ids(s3)));
    await toCal(p);
    T('운동은 지난 체크(10/3) · 앞으로(10/14) 달력에 그대로',await has(p,'2026-10-14','💪'));
    T('오류 없음(2)',p.errs.length===0,p.errs.join('|'));

    // ===== 4. 날짜 창: 옮겨진 반복 스티커는 "건너뛰기" · 이날만 붙인 ＋ 는 "지우기" =====
    await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell('2026-10-13'));await p.waitForTimeout(350);
    const lab=await p.evaluate(()=>[...document.querySelectorAll('#pop .sdr')].map(r=>{const bt=r.nextElementSibling;return r.querySelector('.nm').textContent.slice(0,6)+':'+[...bt.querySelectorAll('button')].map(x=>x.textContent.trim()).join('/');}));
    T('날짜 창: 매일 반복 조깅은 건너뛰기 · 그만하기',lab.some(x=>x.startsWith('조깅')&&x.includes('건너뛰기')&&x.includes('그만하기')&&!x.includes('지우기')),JSON.stringify(lab));
    await p.evaluate(()=>[...document.querySelectorAll('#pop .sdr')].find(r=>r.textContent.includes('조깅')).nextElementSibling.querySelector('[data-act="sd-skip"]').click());await p.waitForTimeout(400);
    let s4=await S(p);
    T('건너뛰기: 그 날만 skip 에 들어가고 반복은 그대로',(s4.stamps.defs.find(x=>x.id==='s_run').skip||[]).includes('2026-10-13')&&s4.stamps.defs.find(x=>x.id==='s_run').rep==='daily');
    T('달력에서 10/13 의 조깅이 사라지고 10/14 는 그대로',!(await has(p,'2026-10-13','👟'))&&await has(p,'2026-10-14','👟'));
    await p.evaluate(()=>{const u=document.querySelector('#toast .tu');u&&u.click();});await p.waitForTimeout(350);
    s4=await S(p);
    T('되돌리기: 다시 깔림',!(s4.stamps.defs.find(x=>x.id==='s_run').skip||[]).includes('2026-10-13')&&await has(p,'2026-10-13','👟'));
    await p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';});
    await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell('2026-10-20'));await p.waitForTimeout(350);
    T('이날만 붙인 ＋ 생일은 "지우기"',await p.evaluate(()=>[...document.querySelectorAll('#pop .sdr')].some(r=>r.textContent.includes('생일')&&/지우기/.test(r.nextElementSibling.textContent))));
    await p.evaluate(()=>[...document.querySelectorAll('#pop .sdr')].find(r=>r.textContent.includes('생일')).nextElementSibling.querySelector('[data-act="sd-skip"]').click());await p.waitForTimeout(400);
    s4=await S(p);
    T('지우기: 생일 10/20 날짜가 빠짐',!s4.stamps.defs.find(x=>x.id==='o_cake').dates.includes('2026-10-20'));
    await p.evaluate(()=>{const u=document.querySelector('#toast .tu');u&&u.click();});await p.waitForTimeout(350);
    T('되돌리기: 생일 날짜 돌아옴',(await S(p)).stamps.defs.find(x=>x.id==='o_cake').dates.includes('2026-10-20'));
    await p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';});

    // ===== 5. ＋ 로 같은 그림을 고르면: 반복이 남은 옮겨진 스티커와 섞이지 않고 새 ＋ 스티커 =====
    const before=(await S(p)).stamps.defs.find(x=>x.id==='s_run');
    await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell('2026-10-16'));await p.waitForTimeout(350);
    await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
    await p.click('#pop [data-act="sp-plus"]');await p.waitForTimeout(300);
    T('＋ 큰 목록에는 "＋ 로 붙인 스티커" 줄이 없음(칸에 넣는 목록에만)',!(await p.innerText('#pop')).includes('고르면 칸에 복사해요'));
    await p.click('#pop [data-act="icn-pick"][data-v="👟"]');await p.waitForTimeout(500);
    await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(450);
    const s5=await S(p),run=s5.stamps.defs.find(x=>x.id==='s_run'),nw=s5.stamps.defs.filter(x=>x.one&&x.emoji==='👟'&&x.id!=='s_run');
    T('새 ＋ 👟 스티커가 따로 생기고 10/16 이 들어감',nw.length===1&&nw[0].dates.join()==='2026-10-16'&&nw[0].rep==='none',JSON.stringify(nw));
    T('옮겨진 조깅의 반복 · 날짜는 그대로(안 섞임)',run.rep===before.rep&&run.from===before.from&&JSON.stringify(run.dates)===JSON.stringify(before.dates)&&JSON.stringify(run.days)===JSON.stringify(before.days));
    T('오류 없음(3)',p.errs.length===0,p.errs.join('|'));

    // ===== 6. 저장 → 다시 켜기 (옛 저장 데이터처럼 읽혀야 함) =====
    const saved=await S(p);await p.close();
    const p2=await boot(b,saved);
    const s6=await S(p2);
    T('다시 켜도 옮겨진 조깅이 그대로(one · 반복 · 기록)',(()=>{const o=s6.stamps.defs.find(x=>x.id==='s_run');return !!o&&o.one===true&&o.rep==='daily'&&(s6.stamps.log['2026-10-05']||{}).s_run===1;})());
    T('다시 켜도 달력에 조깅(지난 · 앞으로)',await has(p2,'2026-10-05','👟')&&await has(p2,'2026-10-13','👟'));
    T('다시 켜도 오류 없음',p2.errs.length===0,p2.errs.join('|'));
    await p2.close();
  }

  // ===== 7. ＋ 로 붙인 스티커가 없는 사람: 줄이 안 보임(늘어나는 게 없음) =====
  {
    const p=await boot(b,state(false));
    await toSlots(p);
    T('＋ 로 붙인 스티커가 없으면 설정에 그 줄도 없음',await cnt(p,'#page .stgrid[data-grp="extra"]')===0);
    await openSlot(p,'s_empty');
    T('빈 칸 고르기 창에 "＋ 로 붙인 스티커" 줄이 없음',!(await p.innerText('#pop')).includes('＋ 로 붙인 스티커')&&await cnt(p,'#pop [data-src]')===0);
    await p.click('#pop [data-act="icn-pick"][data-v="🌿"]');await p.waitForTimeout(450);
    const s=await S(p);
    T('그래도 보통대로 칸이 채워짐',s.stamps.defs.find(x=>x.id==='s_empty').emoji==='🌿');
    // 같은 그림을 고르면(이름만 바뀜) 옛 스티커를 옮기지 않음
    await openSlot(p,'s_run');await p.click('#pop [data-act="slot-swap"]');await p.waitForTimeout(300);
    T('바꾸기 창에도 ＋ 줄이 없음',await cnt(p,'#pop [data-src]')===0);
    await p.click('#pop [data-act="icn-pick"][data-v="👟"]');await p.waitForTimeout(250);
    await p.click('#pop [data-act="icn-save"]');await p.waitForTimeout(450);
    const s2=await S(p);
    T('같은 그림이면 옮기지 않고 이름만 고침',s2.stamps.defs.filter(x=>x.emoji==='👟').length===1&&!s2.stamps.defs.find(x=>x.id==='s_run').one&&s2.stamps.defs.find(x=>x.id==='s_run').rep==='daily');
    T('오류 없음(4)',p.errs.length===0,p.errs.join('|'));
    await p.close();
  }
  // ===== 8. 칸 비우기도 같은 규칙: 이미 붙인 스티커는 그대로 · ＋ 쪽 "지우기"만 진짜 지우기 =====
  {
    const p=await boot(b,state());
    await toSlots(p);
    await openSlot(p,'s_run');
    await p.click('#pop [data-act="slot-clear"]');await p.waitForTimeout(450);
    T('토스트: 달력에 붙인 스티커는 그대로예요',(await p.innerText('#toast')).includes('달력에 붙인 스티커는 그대로예요'),await p.innerText('#toast'));
    let s=await S(p);
    const r=s.stamps.defs.find(x=>x.id==='s_run');
    T('비운 조깅: ＋ 쪽으로(one) · 반복 · 알림 · 기록 그대로',!!r&&r.one===true&&!r.retired&&r.rep==='daily'&&(r.ats||[]).join()==='07:00'&&(s.stamps.log['2026-10-05']||{}).s_run===1,JSON.stringify(r));
    T('그 자리에 빈 칸 · 내 스티커는 여전히 5칸',slotN(s)===5&&s.stamps.defs[0].empty===true,JSON.stringify(ids(s)));
    T('설정: 조깅이 ＋ 로 붙인 스티커 줄에 보임',(await p.innerText('#page .stgrid[data-grp="extra"]')).includes('조깅'));
    await toCal(p);
    T('비운 뒤에도 달력 그대로: 10/5 체크 · 10/6 흐린 것 · 10/13 앞으로',await has(p,'2026-10-05','👟')&&await has(p,'2026-10-06','👟')&&await has(p,'2026-10-13','👟'));
    await p.waitForTimeout(700);
    T('비운 뒤에도 조깅 알림 예약 그대로',(await p.evaluate(()=>window.__rem||[])).some(x=>String(x.id).startsWith('a_s_run_')));
    // 붙인 곳 없는 스티커를 비우면 그냥 정리
    await toSlots(p);await openSlot(p,'s_read');
    await p.click('#pop [data-act="slot-clear"]');await p.waitForTimeout(450);
    T('붙인 곳 없던 독서는 그냥 비워짐(retired) · 토스트는 "비웠어요"',(await S(p)).stamps.defs.find(x=>x.id==='s_read').retired===true&&(await p.innerText('#toast')).trim()==='비웠어요',await p.innerText('#toast'));
    s=await S(p);
    T('독서는 ＋ 쪽에 안 감 · 내 스티커 5칸',!s.stamps.defs.find(x=>x.id==='s_read').one&&slotN(s)===5);
    // ＋ 쪽에서 "지우기" = 진짜 지우기 (앞으로 일정 · 체크 안 한 흐린 것은 없어지고, 체크한 지난 기록만 남음)
    await p.click('#page .stgrid[data-grp="extra"] [data-act="slot-open"][data-id="s_run"]');await p.waitForTimeout(300);
    T('＋ 쪽 창은 "다른 스티커로" 없이 "지우기"',await cnt(p,'#pop [data-act="slot-swap"]')===0&&(await p.innerText('#pop [data-act="slot-clear"]')).includes('지우기'));
    await p.click('#pop [data-act="slot-clear"]');await p.waitForTimeout(450);
    T('토스트: 지웠어요 · 지난 체크 기록은 그대로예요',(await p.innerText('#toast')).includes('지난 체크 기록은 그대로예요'),await p.innerText('#toast'));
    s=await S(p);
    const r2=s.stamps.defs.find(x=>x.id==='s_run');
    T('지우기: 조깅은 은퇴(반복 · 알림 없어짐) · 지난 체크 기록은 남음',r2.retired===true&&r2.rep==='none'&&(r2.ats||[]).length===0&&(s.stamps.log['2026-10-05']||{}).s_run===1);
    await toCal(p);
    T('지운 뒤: 10/5 체크는 남고 · 흐린 것(10/6) · 앞으로(10/13)는 없어짐',await has(p,'2026-10-05','👟')&&!(await has(p,'2026-10-06','👟'))&&!(await has(p,'2026-10-13','👟')));
    T('오류 없음(5)',p.errs.length===0,p.errs.join('|'));
    await p.close();
  }
  T.sum();await b.close();
})();
