// 메모 복사: 고치는 중 막대의 [복사] · 길게 누르는 메뉴의 [📋 복사] · 남이 쓴 메모는 복사만
const {chromium,boot,rich}=require('./x_common.js');
const {mkT}=require('./lib.js');
const K='2026-10-14';
const memo=(id,text,x={})=>({id,text,shared:false,by:'host',t:1760000000000,...x});
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const copied=p=>p.evaluate(()=>window.__calls.filter(c=>c[0]==='copyText').map(c=>JSON.parse(c[1])[0]));
  const press=async(p,sel)=>{const bx=await (await p.$(sel)).boundingBox();await p.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2);await p.mouse.down();await p.waitForTimeout(750);await p.mouse.up();await p.waitForTimeout(250);};
  // 1) 내 메모: 눌러서 고치는 중 → [복사]
  let s=rich();s.memos={[K]:[memo('m1','병원 예약 확인 https://example.com/a'),memo('m2','가족에게 쓴 글',{shared:true})]};s.link=null;s.fam2=undefined;delete s.fam2;
  let p=await boot(b,s,{});
  await p.evaluate(k=>document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`).click(),K);await p.waitForTimeout(500);
  await p.click('[data-act="memo-tap"][data-mid="m1"] .tx');await p.waitForTimeout(300);
  T('고치는 중 막대에 [복사] 와 [취소]가 나란히',await p.evaluate(()=>{const e=document.querySelector('.ibar .editing');return !!e&&!!e.querySelector('[data-act="memo-copy"]')&&!!e.querySelector('[data-act="memo-cancel"]');}));
  await p.click('[data-act="memo-copy"]');await p.waitForTimeout(200);
  T('[복사] → 입력칸의 글이 복사됨',JSON.stringify(await copied(p))===JSON.stringify(['병원 예약 확인 https://example.com/a']),JSON.stringify(await copied(p)));
  T('복사해도 고치는 중 상태는 그대로',await p.evaluate(()=>!!document.querySelector('.ibar .editing')));
  // 고치다가 글을 바꾼 뒤 복사하면 바뀐 글
  await p.fill('#memoInput','바꾼 글');await p.click('[data-act="memo-copy"]');await p.waitForTimeout(150);
  T('입력칸 글을 고쳤으면 고친 글이 복사됨',(await copied(p)).pop()==='바꾼 글');
  await p.click('[data-act="memo-cancel"]');await p.waitForTimeout(200);
  // 2) 길게 누르기 메뉴
  await press(p,'[data-act="memo-tap"][data-mid="m2"]');
  T('길게 누르면 메뉴에 📋 복사 (고치기 · 삭제와 함께)',await p.evaluate(()=>{const m=document.querySelector('#pop');return !!m.querySelector('[data-act="mm-copy"]')&&!!m.querySelector('[data-act="mm-edit"]')&&!!m.querySelector('[data-act="mm-del"]');}));
  await p.click('#pop [data-act="mm-copy"]');await p.waitForTimeout(200);
  T('메뉴의 복사 → 그 메모 글이 복사됨',(await copied(p)).pop()==='가족에게 쓴 글');
  T('복사하면 메뉴가 닫힘',await p.evaluate(()=>!document.querySelector('#pop').classList.contains('open')||!document.querySelector('#pop [data-act="mm-copy"]')));
  T('오류 없음',p.errs.filter(e=>!/ERR_FILE_NOT_FOUND/.test(e)).length===0,p.errs.join('|'));
  await p.ctx.close();
  // 3) 남이 쓴 메모(손님 입장에서 근무자 메모): 복사만
  s=rich();s.syncSettings={...s.syncSettings,isGuestMode:true};s.memos={[K]:[memo('g1','근무자가 쓴 메모',{by:'host',shared:true})]};s.link=null;delete s.fam2;
  p=await boot(b,s,{});
  await p.evaluate(k=>document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`).click(),K);await p.waitForTimeout(500);
  await press(p,'[data-act="memo-tap"][data-mid="g1"]');
  T('남이 쓴 메모: 길게 누르면 복사만 있고 고치기 · 삭제는 없음',await p.evaluate(()=>{const m=document.querySelector('#pop');return !!m.querySelector('[data-act="mm-copy"]')&&!m.querySelector('[data-act="mm-edit"]')&&!m.querySelector('[data-act="mm-del"]');}));
  await p.click('#pop [data-act="mm-copy"]');await p.waitForTimeout(200);
  T('남이 쓴 메모도 복사됨',(await copied(p)).pop()==='근무자가 쓴 메모');
  await p.ctx.close();
  // 4) 서버에서 온 가족 메모(s:) — 방 주인이 아니어도 복사, 방 주인은 삭제도
  for(const role of ['guest','host']){
    s=rich();const uidMe=role==='host'?'dad':'mom';
    s.link={hid:'dad',role,name:role==='host'?'아빠':'엄마',perm:'write',mode:'own',uid:uidMe,hash:''};
    s.fam2.members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'own'}];
    const other=role==='host'?'mom':'dad';
    s.fam2.memos={sm1:{by:other,byName:'가족',date:K,text:'서버에서 온 글',to:['dad','mom'],rev:0,time:'',al:'',t:1760000000000}};
    s.memos={};
    p=await boot(b,s,{});
    await p.evaluate(k=>document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`).click(),K);await p.waitForTimeout(500);
    await press(p,'[data-act="memo-tap"][data-mid="s:sm1"]');
    T(`서버 가족 메모(${role}): 길게 누르면 복사${role==='host'?' + 삭제':'만'}`,await p.evaluate(h=>{const m=document.querySelector('#pop');return !!m.querySelector('[data-act="mm-copy"]')&&(!!m.querySelector('[data-act="srvmm-del"]')===h);},role==='host'),'');
    await p.click('#pop [data-act="mm-copy"]');await p.waitForTimeout(200);
    T(`서버 가족 메모(${role}) 복사됨`,(await copied(p)).pop()==='서버에서 온 글');
    await p.ctx.close();
  }
  await b.close();T.sum();
})();
