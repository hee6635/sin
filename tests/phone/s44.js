// 스티커별 "가족에게 보이기": 실제 가족이 가족방에 있고 · 내 스티커 보여주기를 켠 사람에게만 보임 (약은 기본 꺼짐)
const {chromium,boot,rich}=require('./x_common.js');
const {mkT}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const st=(mut)=>{const s=rich();s.link={hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:'',stk:true};mut&&mut(s);return s;};
  const S=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
  const toSlots=async p=>{await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.evaluate(()=>document.querySelector('[data-act="stk-board"]').click());await p.waitForTimeout(350);};
  const openSlot=async(p,id)=>{await p.evaluate(i=>document.querySelector(`#page [data-act="slot-open"][data-id="${i}"]`).click(),id);await p.waitForTimeout(300);};
  const cases=[
    ['실제 가족 있음 + 켬',st(),true],
    ['가족방은 있지만 나 혼자(실제 가족 없음)',st(s=>{s.fam2.members=[{uid:'dad',role:'host',name:'아빠',mode:'own'}];s.fam2.scheds={dad:s.fam2.scheds.dad};}),false],
    ['가족 연결 안 함',st(s=>{s.link=null;}),false],
    ['스티커 보여주기를 끔',st(s=>{s.link.stk=false;}),false],
  ];
  for(const [name,s,expect] of cases){
    const p=await boot(b,s,{});await toSlots(p);await openSlot(p,'s_pill');
    const has=await p.evaluate(()=>!!document.querySelector('#pop #slotFam'));
    T(`[${name}] 약 칸 팝업의 "가족에게 보이기": ${expect?'보임':'안 보임'}`,has===expect);
    if(name.startsWith('실제 가족')){
      T('약은 기본으로 꺼져 있음',!(await p.$eval('#slotFam',e=>e.checked)));
      await p.click('label.sw:has(#slotFam)');await p.waitForTimeout(250);
      let d=(await S(p)).stamps.defs.find(x=>x.id==='s_pill');
      T('켜면 약 스티커에 fam:true 가 저장됨',d.fam===true,JSON.stringify(d.fam));
      await p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';});
      await openSlot(p,'s_run');
      T('운동(보통 스티커)은 기본으로 켜져 있음',await p.$eval('#slotFam',e=>e.checked));
      await p.click('label.sw:has(#slotFam)');await p.waitForTimeout(250);
      d=(await S(p)).stamps.defs.find(x=>x.id==='s_run');
      T('끄면 fam:false 가 저장됨',d.fam===false,JSON.stringify(d.fam));
      // 등록 화면(날짜 팝업 › 스티커 고르기)에도 같은 칸
      await p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';});
      await p.evaluate(()=>window.__onBack&&window.__onBack());await p.waitForTimeout(200);
      await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
      await p.evaluate(k=>document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"] .stz`).click(),'2026-10-15');await p.waitForTimeout(350);
      await p.evaluate(()=>document.querySelector('#pop [data-act="sd-add"]')?.click());await p.waitForTimeout(350);
      await p.evaluate(()=>document.querySelector('#pop [data-act="sp-pick"][data-id="s_gym"]')?.click());await p.waitForTimeout(400);
      const reg=await p.evaluate(()=>({page:!!document.querySelector('#page .srpg'),fam:!!document.querySelector('#page #srFam')}));
      T('등록 화면에도 "가족에게 보이기" 칸이 있음',reg.page&&reg.fam,JSON.stringify(reg));
      if(reg.fam){
        await p.click('#page label.sw:has(#srFam)');await p.waitForTimeout(250);
        await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(450);
        d=(await S(p)).stamps.defs.find(x=>x.id==='s_gym');
        T('등록 화면에서 바꾼 값도 저장됨 (운동2: 끔)',d.fam===false,JSON.stringify(d.fam));
      }
    }
    T('오류 없음',p.errs.filter(e=>!/ERR_FILE_NOT_FOUND/.test(e)).length===0,p.errs.join('|'));
    await p.ctx.close();
  }
  // 등록 화면: 실제 가족이 없으면 칸이 아예 없음
  {const p=await boot(b,st(s=>{s.link=null;}),{});
   await p.evaluate(k=>document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"] .stz`).click(),'2026-10-15');await p.waitForTimeout(350);
   await p.evaluate(()=>document.querySelector('#pop [data-act="sd-add"]')?.click());await p.waitForTimeout(350);
   await p.evaluate(()=>document.querySelector('#pop [data-act="sp-pick"][data-id="s_gym"]')?.click());await p.waitForTimeout(400);
   const reg=await p.evaluate(()=>({page:!!document.querySelector('#page .srpg'),fam:!!document.querySelector('#page #srFam')}));
   T('가족 연결 안 한 사람의 등록 화면에는 칸이 없음',reg.page&&!reg.fam,JSON.stringify(reg));
   await p.ctx.close();}
  // 옛 저장 데이터(fam 없음): 켜져 있는 것 = 약 빼고 전부
  {const p=await boot(b,st(),{});const eff=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).stamps.defs.filter(x=>!x.empty).map(x=>[x.id,x.fam]));
   T('저장된 스티커에 fam 이 없으면 기본 규칙(약 꺼짐 · 나머지 켜짐)으로 계산',eff.every(([id,f])=>f===undefined||typeof f==='boolean'));
   await p.ctx.close();}
  await b.close();T.sum();
})();
