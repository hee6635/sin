// v0.145: 새 모양 1차 — 글꼴 · 파랑 · 알람 고치기 · 근무 패턴 · 패턴 제외 초기화 · 달력 오늘 테두리 · 빛 두 바퀴 · 설정 오늘 표시 = 색만
const {chromium,boot,mkT,base}=require('./lib.js');
const fs=require('fs');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const act=(p,a,ds={})=>p.evaluate(([a,ds])=>{const x=document.createElement('button');x.dataset.act=a;Object.assign(x.dataset,ds);document.body.appendChild(x);x.click();x.remove();},[a,ds]);
  { // 1) 공통 · 알람 고치기
    const p=await boot(b,{...base,alarms:[{id:'al1',on:true,shift:'주',time:'05:36',label:'',days:[],sound:true}]});
    await p.waitForTimeout(800);
    T('글꼴 파일 · 라이선스 있음',fs.existsSync('/home/user/sin/app/src/main/assets/fonts/PretendardVariable.woff2')&&fs.existsSync('/home/user/sin/app/src/main/assets/fonts/Pretendard-LICENSE.txt'));
    T('앱 글꼴 = Pretendard',await p.evaluate(()=>/Pretendard/.test(getComputedStyle(document.body).fontFamily)));
    T('강조색 = 밝은 파랑',await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()==='#3182f6'));
    await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(300);
    await p.evaluate(()=>{const x=document.querySelector('[data-act="aedit"][data-id="al1"]');x&&x.click();});await p.waitForTimeout(500);
    const a=await p.evaluate(()=>{const pg=document.querySelector('#page.open');return {np:!!pg.querySelector('.pg-b.np'),hero:!!pg.querySelector('.nphero .timebox'),tm:(pg.querySelector('.nphero .timebox')||{}).textContent,pills:pg.querySelectorAll('.nppills [data-act="dshift"]').length,on:(pg.querySelector('.nppills .on')||{}).textContent,caps:[...pg.querySelectorAll('.pg-cap')].map(x=>x.textContent),ids:['aRepeat','aNoHol','aPre','al','almsg'].filter(i=>pg.querySelector('#'+i)).length,del:!!pg.querySelector('.danger-row[data-act="adel"]'),hint:pg.querySelectorAll('.hint').length};});
    T('알람 고치기: 위 칸(큰 시간 5:36 · 근무 칩 · 고른 주간)',a.np&&a.hero&&/5:36/.test(a.tm)&&!/05:36/.test(a.tm)&&a.pills>=3&&/주간/.test(a.on),JSON.stringify(a));
    T('묶음 반복 / 울릴 때 / 함께 · 스위치 · 이름 칸 그대로 · 삭제 줄',a.caps.join()==='반복,울릴 때,함께'&&a.ids===5&&a.del,JSON.stringify(a));
    await p.click('#page.open [data-act="dsnd-open"]');await p.waitForTimeout(300);
    T('소리와 진동 누르면 펼침(볼륨 · 다시 울림)',await p.evaluate(()=>!!document.querySelector('#page.open .npsub #aVol')&&document.querySelectorAll('#page.open .npsub [data-act="dsnmax"]').length===5));
    await p.click('#page.open .nppills [data-act="dshift"][data-v="야"]');await p.waitForTimeout(300);
    T('근무 칩 바꾸면 위 칸 근무 색도',await p.evaluate(()=>/야간/.test(document.querySelector('#page.open .nppills .on').textContent)&&/night|#|var/.test(document.querySelector('#page.open .nphero').getAttribute('style'))));
    T('오류 없음 (알람)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 근무 패턴 · 패턴 제외 초기화
    const p=await boot(b,{...base,overrides:{'2026-10-20':'휴','2026-10-25':'주','2026-11-03':'주'}});
    await p.waitForTimeout(800);await act(p,'more-pattern');await p.waitForTimeout(500);
    const g=await p.evaluate(()=>{const pg=document.querySelector('#page.open');return {hero:(pg.querySelector('.nppat')||{}).innerText||'',caps:[...pg.querySelectorAll('.pg-cap')].map(x=>x.textContent.trim()),reset:!!pg.querySelector('[data-act="pat-reset"]'),old:!!pg.querySelector('[data-act="clearov"]'),hint:[...pg.querySelectorAll('.hint')].filter(h=>h.offsetParent).length,pc:pg.querySelectorAll('#pgrid .pc').length,inp:!!pg.querySelector('#patternName')&&!!pg.querySelector('#holRest')&&!!pg.querySelector('#patWeek')};});
    T('근무 패턴: 위 칸 이름 · 반복 · 오늘 칸 · 패턴 칸',/4조2교대/.test(g.hero)&&/일 반복/.test(g.hero)&&/번째 칸/.test(g.hero)&&g.pc>=2,JSON.stringify(g));
    T('묶음 근무 종류 · 패턴 설정 · 기타 (v0.171 조는 동료 근무로) · 보이는 설명 줄 없음',g.caps.join()==='근무 종류,패턴 설정,기타'&&g.hint===0&&g.inp,JSON.stringify(g));
    T('빨간 "수동 변경 초기화" 대신 "패턴 제외 초기화" 줄',g.reset&&!g.old);
    const msg=[];p.on('dialog',d=>{msg.push(d.message());d.accept();});
    await act(p,'pat-reset');await p.waitForTimeout(300);
    T('누르면 기간(이번 달) 고르기',await p.evaluate(()=>document.getElementById('prS').value==='2026-10-01'&&document.getElementById('prE').value==='2026-10-31'));
    await p.click('#pop [data-act="pr-go"]');await p.waitForTimeout(400);
    T('경고 2번 (기간 · 일수 / 되돌릴 수 없음) → 그 기간만 지움',msg.length===2&&/10\/1 ~ 10\/31/.test(msg[0])&&/2일/.test(msg[0])&&/되돌릴 수 없어요/.test(msg[1])&&JSON.stringify(await p.evaluate(()=>Object.keys(__wx.S.overrides)))==='["2026-11-03"]',JSON.stringify(msg));
    await act(p,'pat-reset');await p.click('#pop [data-act="pr-q"][data-v="n"]');await p.waitForTimeout(200);
    T('다음 달 버튼',await p.evaluate(()=>document.getElementById('prS').value==='2026-11-01'&&document.getElementById('prE').value==='2026-11-30'));
    p.removeAllListeners('dialog');p.on('dialog',d=>d.dismiss());
    await p.click('#pop [data-act="pr-go"]');await p.waitForTimeout(300);
    T('경고에서 취소하면 안 지움',await p.evaluate(()=>!!__wx.S.overrides['2026-11-03']));
    T('오류 없음 (패턴)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 3) 달력 오늘 테두리 · 빛 · 설정 오늘 표시 = 색만 · 날짜 창 오늘 색
    for(const look of ['fill','circle']){
      const p=await boot(b,{...base,calLook:look,todayLook:'a'});await p.waitForTimeout(900);
      const r=await p.evaluate(()=>{const c=document.querySelector('#track .panel:nth-child(2) .cell.today'),af=getComputedStyle(c,'::after'),o=document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-10-13"]');return {bw:af.borderTopWidth,bt:af.borderTopStyle,z:af.zIndex,dt:document.documentElement.dataset.today,h:c.getBoundingClientRect().height,h2:o.getBoundingClientRect().height,fs:getComputedStyle(c.querySelector('.num')).fontSize,fs2:getComputedStyle(o.querySelector('.num')).fontSize};});
      T(`${look}: 오늘 칸 전체 3px 테두리 (z 2 · 저장된 모양 a 무시)`,r.bw==='3px'&&r.bt==='solid'&&r.z==='2'&&r.dt==='b',JSON.stringify(r));
      T(`${look}: 오늘 칸 크기 · 숫자 크기 = 다른 날`,Math.abs(r.h-r.h2)<.5&&r.fs===r.fs2,JSON.stringify(r));
      await p.close();
    }
    const p=await boot(b,base);for(let i=0;i<40&&!(await p.evaluate(()=>!!document.querySelector('.tglow')));i++)await p.waitForTimeout(100);
    T('빛 1.6초 · 두 바퀴 (둘레마다 되풀이)',await p.evaluate(()=>{const e=document.querySelector('.tglow .g-halo');if(!e)return 'none';const d=e.getAttribute('stroke-dasharray').split(' ').map(Number),c=document.querySelector('.tglow');return Math.abs(d[0]+d[1]-(+c.dataset.per))<1;})===true);
    await act(p,'more-look');await p.waitForTimeout(400);
    T('설정 › 화면: 오늘 표시는 색만 (모양 버튼 없음)',await p.evaluate(()=>!document.querySelector('#page.open [data-act="todaylook"]')&&!!document.querySelector('#page.open .tdc-row')));
    await p.evaluate(()=>{document.querySelector('#page.open [data-act="page-close"]').click();__wx.openDay('2026-10-12');});await p.waitForTimeout(500);
    T('날짜 창 "오늘" 표 · 띠 오늘 = 테두리 (v0.155)',await p.evaluate(()=>{const a=getComputedStyle(document.querySelector('#sheet.open .dft .tdy')).backgroundColor,b=getComputedStyle(document.querySelector('#sheet.open .dsi.td')).boxShadow;return a!=='rgba(0, 0, 0, 0)'&&/inset/.test(b);}));
    T('dsTgo/dsTdy: 오늘이면 버튼 없음 · 다른 날이면 man-go 로 오늘',await p.evaluate(()=>__wx.dsTgo('2026-10-12','man-go')===''&&/data-act="man-go" data-k="2026-10-12"/.test(__wx.dsTgo('2026-10-20','man-go'))&&/오늘/.test(__wx.dsTdy('2026-10-12'))&&__wx.dsTdy('2026-10-13')===''));
    T('오류 없음 (달력)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();})();
