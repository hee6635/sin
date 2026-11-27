// v0.239: 가족 탭 빈 화면 = 가족 초대하기(앞) · 내 폰에만 적어 두기(아래) · 튜토리얼과 "일부 기능이 옮겨졌어요" 안 겹침 · 스티커 공유 질문은 스티커를 쓴 사람에게만 · 알람 빈 화면 회색 줄 없음
const {chromium,boot,mkT,base}=require('./lib.js');
const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'own'}];
const link={hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:''};
const fam2=()=>({members,scheds:{},memos:{},reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:[],init:true});
(async()=>{const T=mkT();const b=await chromium.launch();
  // 1. 가족 탭 빈 화면
  {const p=await boot(b,{...base});await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(500);
   const r=await p.evaluate(()=>{const a=document.querySelector('.ftt .paint-btn.finv'),e=document.querySelector('.ftt .fempty');return {inv:a&&a.dataset.act,invT:a&&a.innerText.trim(),man:e&&e.dataset.act,manT:e&&e.innerText.trim(),order:!!(a&&e&&a.compareDocumentPosition(e)&4)};});
   T('가족 초대하기가 앞 · 내 폰에만 적어 두기는 아래',r.inv==='link-invite'&&/가족 초대하기/.test(r.invT)&&r.man==='fam-add'&&/내 폰에만 적어 두기/.test(r.manT)&&r.order,JSON.stringify(r));
   await p.click('.ftt .paint-btn.finv');await p.waitForTimeout(400);
   T('누르면 초대 코드 만들기 창',await p.evaluate(()=>/초대 코드/.test(document.querySelector('#pop').innerText)));
   T('오류 없음 (가족 탭)',p.errs.length===0,p.errs.join('|'));await p.close();}
  // 2. 튜토리얼과 안내 창이 겹치지 않음
  {const p=await boot(b,{...base,addonNote:'old',hints:{}},{coach:true});await p.waitForTimeout(2500);
   const a=await p.evaluate(()=>({tut:!!document.querySelector('#tutx'),pop:document.querySelector('#pop').classList.contains('open')}));
   T('튜토리얼이 떠 있는 동안 "일부 기능이 옮겨졌어요" 창은 안 뜸',a.tut&&!a.pop,JSON.stringify(a));
   if(a.tut){await p.click('#tutx .sk');await p.waitForTimeout(1200);}
   const c=await p.evaluate(()=>({tut:!!document.querySelector('#tutx'),pop:document.querySelector('#pop').classList.contains('open'),t:(document.querySelector('#pop .mh')||{}).textContent||''}));
   T('튜토리얼을 닫으면 그다음에 뜸',!c.tut&&c.pop&&/옮겨졌어요/.test(c.t),JSON.stringify(c));
   T('오류 없음 (안내)',p.errs.length===0,p.errs.join('|'));await p.close();}
  // 3. 스티커 공유 질문
  {const p=await boot(b,{...base,link,fam2:fam2(),requests:[],stamps:{defs:[],log:{},snap:{},v3:1,v4:1,lastAt:[]}});await p.waitForTimeout(2500);
   const r=await p.evaluate(()=>({pop:/스티커를 가족에게/.test(document.querySelector('#pop').innerText),asked:!!__wx.S.link.stkAsked}));
   T('스티커를 안 쓴 사람: 묻지 않음 (나중에 물을 수 있게 남겨 둠)',!r.pop&&!r.asked,JSON.stringify(r));await p.close();}
  {const mk={id:'r1',kind:'mark',emoji:'👟',name:'조깅',times:1,rep:'none',from:'',to:'',days:[],dates:[],skip:[],ats:[]};
   const p=await boot(b,{...base,link,fam2:fam2(),requests:[],stamps:{defs:[mk],log:{'2026-10-10':{r1:1}},snap:{},v3:1,v4:1,lastAt:[]}});await p.waitForTimeout(2500);
   const r=await p.evaluate(()=>/스티커를 가족에게/.test(document.querySelector('#pop').innerText));
   T('스티커를 쓴 사람: 지금처럼 물음',r);await p.close();}
  // 4. 알람 빈 화면
  {const p=await boot(b,{...base,alarms:[]});await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(500);
   const r=await p.evaluate(()=>{const e=document.querySelector('.alempty');return e&&[e.innerText.trim(),!!e.querySelector('.sub')];});
   T('알람 빈 화면: "알람이 없어요"만 (회색 줄 없음)',r&&r[0]==='알람이 없어요'&&!r[1],JSON.stringify(r));await p.close();}
  await b.close();T.sum();
})();
