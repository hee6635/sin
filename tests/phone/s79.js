// v0.118 반복 메모 (매달 n일 · 말일 · 근무 조건 · 미루기) · 💡 이럴 땐 이렇게 (바로 가기)
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const tap=(p,sel)=>p.evaluate(sel=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const o=document.querySelector(sel);o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();},sel);
  { const p=await boot(b,{...base},{touch:true});
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(300);
    await p.evaluate(()=>{document.getElementById('memoInput').value='📦 재고 조사';});await tap(p,'#sheet [data-act="memo-detail"]');await p.waitForTimeout(400);
    T('메모 자세히에 🔁 반복 줄',await p.evaluate(()=>!!document.querySelector('#page [data-act="md-rep"]')));
    await tap(p,'#page [data-act="md-rep"]');await p.waitForTimeout(300);
    await tap(p,'#pop [data-act="rr-md"][data-v="1"]');await p.waitForTimeout(200);
    await tap(p,'#pop [data-act="rr-sh"][data-v="주"]');await p.waitForTimeout(200);
    await tap(p,'#pop [data-act="rr-miss"][data-v="next"]');await p.waitForTimeout(200);
    T('반복 고르기: 매달 1일 · 주간인 날만 · 아니면 다음 근무 날로',await p.evaluate(()=>/매달 1일 · 주간인 날만 · 아니면 다음 근무 날로/.test(document.querySelector('#pop').innerText)));
    await tap(p,'#pop [data-act="rr-ok"]');await p.waitForTimeout(300);
    T('가족에게 칸은 숨김 (반복은 나만)',await p.evaluate(()=>!document.querySelector('#page [data-act="md-share"]')));
    await tap(p,'#page [data-act="md-save"]');await p.waitForTimeout(400);
    const r=await p.evaluate(()=>{const R=__wx.S.rmemos;const exp=[];['2026-11','2026-12','2027-01'].forEach(ym=>{let d=new Date(+ym.slice(0,4),+ym.slice(5)-1,1);while(__wx.shiftOf(d)!=='주')d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);exp.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));});
      const got=exp.map(k=>__wx.visibleMemos(k).some(m=>m.rep&&/재고 조사/.test(m.text)));
      const firstNov=__wx.visibleMemos('2026-11-01').some(m=>m.rep);return {n:R.length,from:R[0]&&R[0].from,exp,got,firstNov,s1:__wx.shiftOf(new Date(2026,10,1)),memo14:__wx.S.memos['2026-10-14']};});
    T('반복 메모 하나 저장 (그 날 메모로는 안 남음)',r.n===1&&r.from==='2026-10-01'&&!r.memo14,JSON.stringify(r));
    T('매달 1일이 주간이 아니면 다음 주간 날로 (11월 · 12월 · 1월)',r.got.every(Boolean)&&(r.s1==='주'||!r.firstNov),JSON.stringify(r));
    // 체크는 그 날만
    const k=r.exp[0];await p.evaluate(k=>__wx.openDay(k),k);await p.waitForTimeout(300);
    T('날짜 창에 🔁 반복 표시',await p.evaluate(()=>/🔁 반복/.test(document.querySelector('#sheet').innerText)));
    // 말일 하루 전
    await p.evaluate(()=>{__wx.S.rmemos.push({id:'x2',text:'정산',md:-2,sh:[],miss:'skip',from:'2026-10-01'});});
    T('말일 하루 전: 10월 30일 · 11월 29일 · 2월 27일',await p.evaluate(()=>['2026-10-30','2026-11-29','2027-02-27'].every(k=>__wx.visibleMemos(k).some(m=>m.rep==='x2'))&&!__wx.visibleMemos('2026-10-31').some(m=>m.rep==='x2')));
    T('오류 없음 (반복 메모)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 저장된 반복 메모로 켜짐 · 할 일 체크 · 이 날 빼기 · 알림
    const st={...base,rmemos:[{id:'a1',text:'월말 보고',md:-1,sh:[],miss:'skip',from:'2026-10-01',todo:true,time:'09:00',al:'0'},{id:'bad',text:'',md:0}]};
    const p=await boot(b,st,{touch:true});
    T('예전 데이터로 켜짐 (잘못된 칸은 버림)',await p.evaluate(()=>__wx.S.rmemos.length===1&&__wx.S.rmemos[0].id==='a1'));
    await p.evaluate(()=>__wx.openDay('2026-10-31'));await p.waitForTimeout(300);
    await tap(p,'#sheet [data-act="memo-chk"]');await p.waitForTimeout(300);
    T('할 일 체크는 그 날만 (10월 31일 완료 · 11월 30일은 아직)',await p.evaluate(()=>__wx.S.rmemos[0].done.includes('2026-10-31')&&!__wx.visibleMemos('2026-11-30').find(m=>m.rep==='a1').done));
    await p.evaluate(()=>__wx.pushRemindersToNative());await p.waitForTimeout(200);
    T('시각 알림이 반복 날마다 (r_ 알림)',await p.evaluate(()=>(window.__rem||[]).some(x=>/^r_a1_/.test(x.id))));
    await p.evaluate(()=>{const e=document.querySelector('#sheet [data-mid="r:a1"]');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:5,clientY:5}));});await p.waitForTimeout(700);
    await tap(p,'#pop [data-act="rm-skip"]');await p.waitForTimeout(300);
    T('길게 → 이 날만 빼기',await p.evaluate(()=>!__wx.visibleMemos('2026-10-31').some(m=>m.rep==='a1')&&__wx.visibleMemos('2026-11-30').some(m=>m.rep==='a1')));
    T('오류 없음 (체크 · 빼기)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 💡 이럴 땐 이렇게: 바로 가기마다 화면이 열림
    const p=await boot(b,{...base},{touch:true,cfg:"window.FIREBASE_CONFIG={projectId:'demo-x',apiKey:'x',authDomain:'x',appId:'x'};"});
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="tips-open"]').click());await p.waitForTimeout(300);
    const n=await p.evaluate(()=>({g:document.querySelectorAll('#page .tipg').length,t:document.querySelectorAll('#page .tip').length,acts:[...new Set([...document.querySelectorAll('#page [data-act="tip-go"]')].map(b=>b.dataset.a))]}));
    T('설정 맨 아래 → 💡 이럴 땐 이렇게 (묶음 8 · 팁 30개 넘게)',n.g===8&&n.t>=30,JSON.stringify(n));
    const bad=[];
    for(const a of n.acts){
      await p.evaluate(()=>{const o=document.getElementById('page');if(o&&o.classList.contains('open')){}});
      await p.evaluate(()=>window.__wx.openTips&&0);
      await p.evaluate(()=>{document.querySelector('#nav [data-tab="set"]').click();});await p.waitForTimeout(150);
      await p.evaluate(()=>{const x=document.querySelector('#page.open [data-act="page-close"]');if(x)x.click();});await p.waitForTimeout(100);
      await p.evaluate(()=>document.querySelector('[data-act="tips-open"]').click());await p.waitForTimeout(150);
      const before=await p.evaluate(()=>document.querySelector('#page').innerHTML.length);
      await p.evaluate(a=>{const b=document.querySelector(`#page [data-act="tip-go"][data-a="${a}"]`);b.click();},a);await p.waitForTimeout(300);
      const ok=await p.evaluate(a=>{const pg=document.querySelector('#page');if(a.startsWith('tab:'))return document.querySelector(`#nav [data-tab="${a.slice(4)}"]`).classList.contains('on')&&!pg.classList.contains('open');if(a==='more-share')return document.getElementById('app').classList.contains('share-mode');return pg.classList.contains('open')&&!pg.querySelector('.tips')||document.querySelector('#pop.open')!==null;},a);
      if(!ok)bad.push(a);
      await p.evaluate(()=>{document.getElementById('app').classList.remove('share-mode');});
      await p.evaluate(()=>{const x=document.querySelector('#pop.open');if(x)window.__wx.closePop();});
    }
    T('바로 가기마다 그 화면이 열림',bad.length===0,bad.join(','));
    {const er=p.errs.filter(e=>!/Failed to load resource/.test(e));T('오류 없음 (팁 · 가짜 서버 주소의 네트워크 오류는 뺌)',er.length===0,er.join('|'));}await p.close();
  }
  T.sum();await b.close();
})();
