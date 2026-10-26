// v0.76: 종이 배경 · 사용 통계(횟수만) · 새 소식 팝업(소식 있는 버전만) · 달력 메모 알약 높이 1.3배 제한
const {chromium,boot}=require('./x_common.js');
const {mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const bgVar=p=>p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase());
  const toSet=async p=>{await p.click('#nav [data-tab="set"]',{timeout:3000});await p.waitForTimeout(250);};
  const stored=(p,re)=>p.evaluate(s=>Object.keys(localStorage).some(k=>new RegExp(s).test(localStorage.getItem(k)||'')),re);

  // ── 종이 배경
  {
    const p=await boot(b,{...base},{touch:true});
    T('기본: 배경 표시 없음 · 예전 색 그대로(#ffffff)',await p.evaluate(()=>!document.documentElement.hasAttribute('data-bg'))&&await bgVar(p)==='#ffffff',await bgVar(p));
    await toSet(p);await p.evaluate(()=>document.querySelector('[data-act="more-look"]').click());await p.waitForTimeout(300);
    T('설정 › 화면에 "배경" 줄(기본 · 종이)이 있음',await p.evaluate(()=>!!document.querySelector('[data-act="bgmode"][data-v="paper"]')&&!!document.querySelector('[data-act="bgmode"][data-v=""]')));
    await p.evaluate(()=>document.querySelector('[data-act="bgmode"][data-v="paper"]').click());await p.waitForTimeout(300);
    T('종이를 고르면 바로 바뀜 · 배경 #fbf8f1',await p.evaluate(()=>document.documentElement.getAttribute('data-bg'))==='paper'&&await bgVar(p)==='#fbf8f1',await bgVar(p));
    T('고른 값이 저장됨',await stored(p,'"bg":"paper"'));
    await p.evaluate(()=>document.querySelector('[data-act="bgmode"][data-v=""]').click());await p.waitForTimeout(300);
    T('기본으로 되돌리면 예전 색(#ffffff)',await p.evaluate(()=>!document.documentElement.hasAttribute('data-bg'))&&await bgVar(p)==='#ffffff',await bgVar(p));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  for(const [th,want] of [['dark','#17150f'],['light','#fbf8f1']]){
    const p=await boot(b,{...base,bg:'paper',theme:th},{touch:true});
    T(`종이 + ${th}: 배경 ${want}`,await bgVar(p)===want,await bgVar(p));
    await p.screenshot({path:`/tmp/s54_paper_${th}.png`,clip:{x:0,y:0,width:390,height:600}});
    await p.close();
  }
  {
    const p=await boot(b,{...base,bg:'weird'},{touch:true});
    T('이상한 배경 값 → 기본으로 켜짐(normalize)',await p.evaluate(()=>!document.documentElement.hasAttribute('data-bg')),'');
    await p.close();
  }

  // ── 사용 통계
  {
    const pre='window.__ev=[];window.__en=[];window.AndroidBridge.logEvent=n=>window.__ev.push(n);window.AndroidBridge.setStatsEnabled=o=>window.__en.push(o);';
    const p=await boot(b,{...base,onboarded:true},{touch:true,preInit:pre});
    T('앱을 켜면 app_start 만 기록 (내용 없음)',(await p.evaluate(()=>window.__ev)).join()==='app_start',JSON.stringify(await p.evaluate(()=>window.__ev)));
    T('시작할 때 통계 켜짐 상태를 앱에 알림',(await p.evaluate(()=>window.__en))[0]===true);
    await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(250);
    await p.evaluate(()=>{window.__ev.length=0;document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-13"]').click();});await p.waitForTimeout(500);
    await p.fill('#memoInput','비밀 메모 내용');await p.click('[data-act="memo-send"]');await p.waitForTimeout(300);
    const ev=await p.evaluate(()=>window.__ev);
    T('메모를 쓰면 memo_mine 이름만 기록 (메모 글자는 안 보냄)',ev.join()==='memo_mine'&&!ev.join().includes('비밀'),JSON.stringify(ev));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
    // 설정에서 끄기 (메모 창이 안 열린 새 화면에서)
    const pq=await boot(b,{...base,onboarded:true},{touch:true,preInit:pre});
    await toSet(pq);await pq.evaluate(()=>document.querySelector('[data-act="more-info"]').click());await pq.waitForTimeout(300);
    T('설정에 "사용 통계 보내기" 스위치가 켜져 있음',await pq.evaluate(()=>{const e=document.getElementById('statsOn');return !!e&&e.checked;}));
    await pq.evaluate(()=>{const e=document.getElementById('statsOn');e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}));});await pq.waitForTimeout(200);
    T('끄면 앱에 꺼짐을 알리고 저장',(await pq.evaluate(()=>window.__en)).slice(-1)[0]===false&&await stored(pq,'"stats":false'),JSON.stringify(await pq.evaluate(()=>window.__en)));
    await pq.click('#nav [data-tab="cal"]');await pq.waitForTimeout(250);
    await pq.evaluate(()=>{window.__ev.length=0;document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]').click();});await pq.waitForTimeout(500);
    await pq.fill('#memoInput','또 메모');await pq.click('[data-act="memo-send"]');await pq.waitForTimeout(300);
    T('끈 뒤에는 아무 이벤트도 안 보냄',(await pq.evaluate(()=>window.__ev)).length===0);
    T('오류 없음',pq.errs.length===0,pq.errs.join('|'));await pq.close();
    const p2=await boot(b,{...base,stats:false},{touch:true,preInit:pre});
    T('꺼 둔 채로 다시 켜도 app_start 를 안 보냄 · 꺼짐 유지',(await p2.evaluate(()=>window.__ev)).length===0&&(await p2.evaluate(()=>window.__en))[0]===false);
    await p2.close();
    const p3=await boot(b,{...base},{touch:true});
    await toSet(p3);await p3.evaluate(()=>document.querySelector('[data-act="more-info"]').click());await p3.waitForTimeout(300);T('옛 저장 데이터(통계 값 없음) → 켜짐으로 읽음',await p3.evaluate(()=>{const e=document.getElementById('statsOn');return !!e&&e.checked;}),'');await p3.close();
  }

  // ── 새 소식 팝업: 소식이 적힌 버전만
  {
    const open=p=>p.evaluate(()=>document.querySelector('#pop').classList.contains('open'));
    const mk=v=>`window.AndroidBridge.appInfo=()=>JSON.stringify({version:"${v}",device:"T",android:"15"});`;
    const p=await boot(b,{...base,onboarded:true,seenVer:'v0.63'},{touch:true,preInit:mk('0.99'),wait:1500});
    T('소식이 없는 버전(0.99): 팝업이 안 뜸 · 본 버전으로만 기록',!(await open(p))&&await stored(p,'"seenVer":"v0.99"'),'');
    await p.close();
    const p2=await boot(b,{...base,onboarded:true,seenVer:'v0.75'},{touch:true,preInit:mk('0.76'),wait:1500});
    T('소식이 있는 버전(0.76): 한 번 뜸 · 종이 배경 · 사용 통계 안내',(await open(p2))&&await p2.evaluate(()=>/새로 생겼어요/.test(document.querySelector('#pop').textContent)&&/종이/.test(document.querySelector('#pop').textContent)&&/사용 통계/.test(document.querySelector('#pop').textContent)),'');
    await p2.close();
    const p3=await boot(b,{...base,onboarded:true,seenVer:'v0.76'},{touch:true,preInit:mk('0.76'),wait:1500});
    T('이미 본 버전: 다시 안 뜸',!(await open(p3)));await p3.close();
  }

  // ── 메모 알약 높이: 높은 화면에서도 글자 줄 높이의 1.3배까지만
  {
    const memos={'2026-10-13':[{id:'a',text:'치과',shared:false},{id:'b',text:'장보기',shared:false}],'2026-10-14':[{id:'c',text:'운동',shared:false}]};
    for(const [w,h,nm] of [[390,844,'폰'],[360,1000,'긴 폰(커버 화면 비슷)'],[360,1300,'아주 긴 화면'],[820,1100,'태블릿']]){
      const p=await boot(b,{...base,memos,pattern:['주','야','휴','휴'],anchor:'2026-10-02'},{w,h,touch:true});
      const r=await p.evaluate(()=>{const cs=getComputedStyle(document.documentElement);const lh=parseFloat(cs.getPropertyValue('--plh')),ph=parseFloat(cs.getPropertyValue('--plhf'));
        const e=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-13"] .pill-wrap>.pl');return {lh,ph,real:e?e.getBoundingClientRect().height:0};});
      T(`${nm}: 알약 높이(${r.ph}px) ≤ 글자 줄 높이(${r.lh}px)의 1.15배`,r.ph<=Math.round(r.lh*1.15)+0.5&&r.real<=r.ph+1.5&&r.real>0,JSON.stringify(r));
      T(`${nm}: 오류 없음`,p.errs.length===0,p.errs.join('|'));await p.close();
    }
  }
  T.sum();await b.close();
})();
