// v0.217: 알람 예약 실패 배너("sched") · 설정 열기 · 개발자 메뉴 알람 기록 복사 (브라우저에선 기록 칸 없음)
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const toSet=async p=>{await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);};
 const openDev=async p=>{await toSet(p);await p.evaluate(()=>document.querySelector('[data-act="more-info"]').click());await p.waitForTimeout(300);for(let i=0;i<7;i++)await p.evaluate(()=>document.querySelector('[data-act="about-tap"]').click());await p.waitForTimeout(500);};
 {const p=await boot(b,{...base});
  await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(300);
  T('권한 다 켜짐: 배너 없음',!(await p.$('.alw .notice-banner')));
  await p.evaluate(()=>{window.__opened=[];const B=window.AndroidBridge;B.status=()=>'sched';B.openSettings=k=>window.__opened.push(k);window.__refresh&&window.__refresh();});
  await p.waitForTimeout(300);
  const t=await p.evaluate(()=>{const e=document.querySelector('.alw .notice-banner');return e?e.textContent:'';});
  T('예약 실패: 알람 탭 맨 위 배너 + 설정 열기',/알람 예약에 실패했어요/.test(t)&&/설정 열기/.test(t),t);
  await p.click('.alw .notice-banner[data-k="sched"]');await p.waitForTimeout(200);
  T('배너 누르면 openSettings("sched")',(await p.evaluate(()=>window.__opened.join(',')))==='sched');
  await p.evaluate(()=>{window.AndroidBridge.status=()=>'';window.__refresh&&window.__refresh();});await p.waitForTimeout(300);
  T('예약 성공(기록 지워짐) 뒤 돌아오면 배너 사라짐',!(await p.$('.alw .notice-banner')));
  await openDev(p);
  T('브라우저(alarmLog 없음): 알람 기록 칸 없음',!(await p.$('#page [data-act="alog-copy"]')));
  T('오류 없음(1)',p.errs.length===0,p.errs.join('|'));await p.close();}
 {const p=await boot(b,{...base});
  const log='11-25 06:29:00 예약 11-25 06:30:00 id=a1_2026-11-25\n11-25 06:30:42 울림 id=a1_2026-11-25 예정 06:30:00 (+42초)\n11-25 06:30:42 재생 실패: 고른 벨소리 (준비 3초 넘음)';
  await p.evaluate(l=>{window.__copied='';const B=window.AndroidBridge;B.alarmLog=()=>l;B.copyText=x=>{window.__copied=x;};},log);
  await openDev(p);
  const box=await p.evaluate(()=>{const e=document.querySelector('#page .alog');return e?e.textContent:'';});
  T('개발자 메뉴: 알람 기록 칸에 줄이 보임',/\+42초/.test(box)&&/준비 3초 넘음/.test(box),box);
  await p.evaluate(()=>document.querySelector('#page [data-act="alog-copy"]').click());await p.waitForTimeout(200);
  const c=await p.evaluate(()=>window.__copied||'');
  T('복사: 기록 전체',c===log||c.includes('+42초'),c.slice(0,80));
  T('오류 없음(2)',p.errs.length===0,p.errs.join('|'));await p.close();}
 await b.close();T.sum();})();
