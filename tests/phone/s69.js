// v0.97: 설정 정리(타일 · 화면 · 알림 · 도움 페이지) · 새로 설치 = 칸 채우기 · 근무 띠 없앰 · 배경 "또렷하게" · "휴" 크기 = 근무 글자 · 흰 바탕 근무타입 글자
const {chromium,boot,mkT,base}=require('./lib.js');
const ONLY=process.env.ONLY||'';
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const want=k=>!ONLY||ONLY.split(',').includes(k);
  const toSet=async p=>{await p.evaluate(()=>document.querySelector('[data-tab="set"]').click());await p.waitForTimeout(400);};
  if(want('set')){
    const p=await boot(b,{...base,calLook:'fill'});
    await toSet(p);
    const r=await p.evaluate(()=>({tiles:[...document.querySelectorAll('.stile b')].map(e=>e.textContent),look:!!document.querySelector('.mi2[data-act="more-look"]'),info:!!document.querySelector('.mi2[data-act="more-info"]'),
      chips:!!document.querySelector('#view [data-act="font"]'),band:!!document.querySelector('#showBand')}));
    T('첫 화면 타일: 근무 패턴 · 가족 · 알림 · 스티커 · 백업',['근무 패턴','알림','스티커','백업'].every(x=>r.tiles.includes(x))&&r.tiles.some(x=>x.startsWith('가족')),JSON.stringify(r.tiles));
    T('화면 · 도움 줄이 있고, 글자 크기 같은 칩은 첫 화면에 없음 · 근무 띠 없음',r.look&&r.info&&!r.chips&&!r.band,JSON.stringify(r));
    await p.evaluate(()=>document.querySelector('[data-act="more-look"]').click());await p.waitForTimeout(400);
    const lk=await p.evaluate(()=>({font:!!document.querySelector('#page [data-act="font"]'),viv:!!document.querySelector('#page [data-act="bgmode"][data-v="vivid"]'),tune:!!document.querySelector('#page [data-act="tune-open"]'),tdc:!!document.querySelector('#page [data-act="todaycolor"]')}));
    T('화면 페이지: 글자 크기 · 배경(또렷하게) · 오늘 표시 색 · 모양 세부 조정',lk.font&&lk.viv&&lk.tune&&lk.tdc,JSON.stringify(lk));
    await p.evaluate(()=>document.querySelector('#page [data-act="bgmode"][data-v="vivid"]').click());await p.waitForTimeout(300);
    const v=await p.evaluate(()=>({attr:document.documentElement.getAttribute('data-bg'),on:document.querySelector('#page [data-act="bgmode"][data-v="vivid"]').classList.contains('on'),st:JSON.parse(localStorage.getItem('eonjeswieo:v1')).bg,cbm:getComputedStyle(document.documentElement).getPropertyValue('--cbm').trim()}));
    T('또렷하게: 저장 · 화면에 바로 · 칩 켜짐 · 칸 색 진하게(58%)',v.attr==='vivid'&&v.on&&v.st==='vivid'&&v.cbm==='58%',JSON.stringify(v));
    await p.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(j);window.__refresh();});await p.waitForTimeout(1100);
    T('위젯에도 bg:vivid',await p.evaluate(()=>JSON.parse(window.__wg[window.__wg.length-1]).bg)==='vivid');
    await p.evaluate(()=>document.querySelector('#page [data-act="page-close"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="more-notif"]').click());await p.waitForTimeout(300);
    T('알림 페이지 열림 (알람 탭 안내)',await p.evaluate(()=>!!document.querySelector('#page [data-act="notif-alarm"]')));
    await p.evaluate(()=>document.querySelector('#page [data-act="page-close"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="more-info"]').click());await p.waitForTimeout(300);
    T('도움 · 정보 페이지: 문의 · 개인정보 · 지우기',await p.evaluate(()=>['more-mail','more-privacy','more-wipe'].every(a=>document.querySelector(`#page [data-act="${a}"]`))));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  if(want('default')){
    const p=await boot(b,{...base});   // 예전부터 쓰던 사람(달력 모양을 고른 적 없음)
    T('예전부터 쓰던 사람은 동그라미 그대로',await p.evaluate(()=>document.documentElement.getAttribute('data-cal'))!=='fill');
    await p.close();
    const p2=await boot(b,null);   // 새로 설치
    T('새로 설치하면 칸 채우기',await p2.evaluate(()=>document.documentElement.getAttribute('data-cal'))==='fill');
    T('근무 띠는 늘 숨김',await p2.evaluate(()=>document.body.classList.contains('noband')));
    await p2.close();
  }
  if(want('rest')){
    const p=await boot(b,{...base,calLook:'fill'});
    const r=await p.evaluate(()=>{const g=k=>{const e=document.querySelector(`#track .panel:nth-child(2) .cell[data-k="${k}"] .bwrap .badge`);return e?parseFloat(getComputedStyle(e).fontSize):0;};return {work:g('2026-10-02'),rest:g('2026-10-04')};});
    T('칸 채우기: "휴" 글자 = 근무 글자 크기',r.work>0&&Math.abs(r.work-r.rest)<0.6,JSON.stringify(r));
    await p.close();
  }
  T.sum();await b.close();
})();
