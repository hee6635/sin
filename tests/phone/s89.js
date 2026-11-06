// v0.136: 달 넘기기 "페이지 넘기기" 방식(옆 판 옮기기 · 넘기는 중 밀기 안 버림) · 앱 달력 기본 모양값 · 같은 그림 겹침 / 4개 넘음 버튼 3개 · 이럴 땐 이렇게 자세히 27개
const {chromium,boot,mkT,base}=require('./lib.js');
const fs=require('fs');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const act=(p,a)=>p.evaluate(a=>{const x=document.createElement('button');x.dataset.act=a;document.body.appendChild(x);x.click();x.remove();},a);
  { // 1) 달 넘기기: 연속으로 밀어도 하나도 안 씹힘 · 판 3개가 늘 앞 · 지금 · 다음 달
    const p=await boot(b,{...base},{touch:true});await p.waitForTimeout(600);
    const cdp=await p.context().newCDPSession(p);
    const swipe=async(dir=1)=>{const y=500,x0=dir>0?330:60;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y}]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0-dir*i*40,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
    const ym=()=>p.evaluate(()=>document.querySelector('.ym h1').textContent);
    const st=()=>p.evaluate(()=>{const P=[...document.querySelectorAll('#track>.panel')];const mk=x=>{const ks=[...x.querySelectorAll('.cell[data-k]')].map(c=>c.dataset.k.slice(0,7));const c={};ks.forEach(k=>c[k]=(c[k]||0)+1);return Object.keys(c).sort((a,b)=>c[b]-c[a])[0]||'-';};return P.slice(0,3).map(mk);});   // (v0.138 판 7개 · 문서 앞 3개 = 앞 · 지금 · 다음)
    const a=await ym();
    for(let i=0;i<3;i++){await swipe();await p.waitForTimeout(120);}   // 넘어가는 0.25초 안에 다음 밀기
    await p.waitForTimeout(900);
    T('0.12초 간격으로 3번 밀기 → 3달 넘어감 (안 씹힘)',a==='2026.10'&&await ym()==='2027.01',a+' → '+await ym());
    T('판 3개 = 12월 · 1월 · 2월',JSON.stringify(await st())==='["2026-12","2027-01","2027-02"]',JSON.stringify(await st()));
    for(let i=0;i<2;i++){await swipe(-1);await p.waitForTimeout(120);}await p.waitForTimeout(900);
    T('뒤로 2번 → 11월 · 판 10 · 11 · 12월',await ym()==='2026.11'&&JSON.stringify(await st())==='["2026-10","2026-11","2026-12"]',await ym()+JSON.stringify(await st()));
    await p.waitForTimeout(400);
    T('옆 판도 스티커 크기 붙음 (조금 뒤)',await p.evaluate(()=>[...document.querySelectorAll('#track>.panel')].every(x=>x.style.getPropertyValue('--stz')!=='')));
    await p.click('#top [data-act="next"]');await p.waitForTimeout(500);
    T('‹ › 버튼도 그대로',await ym()==='2026.12');
    await p.evaluate(()=>{__wx.S.memos['2027-01-05']=[{id:'m1',text:'새 메모',shared:false,by:'host',t:1}];__wx.save();__wx.render();});await p.waitForTimeout(200);
    T('데이터가 바뀌면 옆 판도 다시 그림',await p.evaluate(()=>/새 메모/.test(document.querySelector('#track>.panel:nth-child(3)').textContent)));
    T('오류 없음 (달 넘기기)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 1-2) 날짜 창 넘기기: 그려 둔 옆 판을 그대로 씀 (다시 안 그림) · 넘긴 뒤에도 메모 · 근무 · 날짜 띠 그대로 동작 · 달 바뀌면 달력도
    const p=await boot(b,{...base},{touch:true});await p.waitForTimeout(500);
    const cdp=await p.context().newCDPSession(p);
    const swipe=async(dir=1)=>{const y=420,x0=dir>0?330:60;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y}]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0-dir*i*40,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
    await p.evaluate(()=>__wx.openDay('2026-10-30'));await p.waitForTimeout(500);
    await p.evaluate(()=>{window.__mark=document.querySelector('#sheet .dft');});
    await swipe();await p.waitForTimeout(700);
    const r=await p.evaluate(()=>({t:document.querySelector('#sheet.open .dft b').textContent,same:!document.querySelector('#sheet').contains(window.__mark),ids:['dstrip','memoInput'].every(i=>document.getElementById(i)&&document.getElementById(i).closest('#sheet')),one:document.querySelectorAll('#sheet [id="dstrip"]').length,left:document.querySelectorAll('#sheet .swc').length}));
    T('밀어서 10/31 · 옆 판을 그대로 씀 · id 되살림 (날짜 띠 · 메모 칸)',/10월 31일/.test(r.t)&&r.ids&&r.one===1&&r.left===1,JSON.stringify(r));
    await swipe();await p.waitForTimeout(700);
    T('한 번 더 → 11/1 · 달력도 11월',await p.evaluate(()=>/11월 1일/.test(document.querySelector('#sheet.open .dft b').textContent)&&document.querySelector('.ym h1').textContent==='2026.11'));
    await p.fill('#memoInput','넘긴 뒤 메모');await p.click('#sheet [data-act="memo-send"]');await p.waitForTimeout(300);
    T('넘긴 뒤 메모 쓰기 → 그 날(11/1)에 저장',await p.evaluate(()=>(__wx.S.memos['2026-11-01']||[]).some(x=>x.text==='넘긴 뒤 메모')));
    await p.evaluate(()=>{const cur=__wx.shiftOf(new Date(2026,10,1)),b=[...document.querySelectorAll('#sheet [data-act="setshift"]')].find(x=>x.dataset.s&&x.dataset.s!==cur);b&&b.click();});await p.waitForTimeout(300);
    T('넘긴 뒤 근무 바꾸기 → 그 날 근무',await p.evaluate(()=>__wx.S.overrides['2026-11-01']!=null));
    await swipe(-1);await p.waitForTimeout(700);
    T('뒤로 → 10/31 · 달력 10월',await p.evaluate(()=>/10월 31일/.test(document.querySelector('#sheet.open .dft b').textContent)&&document.querySelector('.ym h1').textContent==='2026.10'));
    T('오류 없음 (날짜 창 넘기기)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 앱 달력 기본 모양값: 새로 설치 = 사용자 값 · 이미 저장된 값은 그대로
    const p=await boot(b,{...base,tune:undefined});await p.waitForTimeout(300);
    const t=await p.evaluate(()=>({c:__wx.S.tune.appCover,i:__wx.S.tune.appInner}));
    T('새 기본: 커버 스티커 1.05 · 좌우 0.55 · 주야 1.25 · 높이 0.65 · 메모 0.9 · 칸 0.7',t.c.stk===1.05&&t.c.stkX===.55&&t.c.stkY===.05&&t.c.ink===1.25&&t.c.inkY===.65&&t.c.memo===.9&&t.c.pill===.7,JSON.stringify(t.c));
    T('새 기본: 안쪽 스티커 0.9 · 좌우 -0.25 · 주야 1.05 · 메모 1.1 · 칸 0.95',t.i.stk===.9&&t.i.stkX===-.25&&t.i.stkY===-.05&&t.i.ink===1.05&&t.i.inkY===.1&&t.i.memo===1.1&&t.i.pill===.95,JSON.stringify(t.i));
    await p.close();
    const p2=await boot(b,{...base});await p2.waitForTimeout(300);
    T('이미 쓰는 사람(저장된 값)은 그대로',await p2.evaluate(()=>__wx.S.tune.appCover.stk===1&&__wx.S.tune.appCover.stkX===0));await p2.close();
  }
  { // 3) 같은 그림 겹침: 지금 만든 것만 보이기 · 겹친 날 건너뛰기 · 취소
    for(const how of ['clash-show','clash-skip','sh-undo']){
      const p=await boot(b,{...base});await p.waitForTimeout(300);
      await p.evaluate(()=>{const S=__wx.S,t=S.stamps.defs.find(x=>x.id==='s_teeth');t.dates=['2026-10-13'];S.stamps.log['2026-10-13']={s_teeth:1};S.stamps.defs.push({id:'o_b',one:true,kind:'mark',emoji:t.emoji,name:'양치',times:1,rep:'none',days:[],dates:[],skip:[],ats:[]});__wx.save();});
      await p.evaluate(()=>__wx.openStampReg('2026-10-10','o_b'));await p.waitForTimeout(300);
      await p.evaluate(()=>{[...document.querySelectorAll('#page.open .hseg button')].find(x=>/매일/.test(x.innerText)).click();});await p.waitForTimeout(150);
      await p.evaluate(()=>{(document.querySelector('#page.open [data-act="sr-save"]')||[...document.querySelectorAll('#page.open button')].find(x=>/저장|등록/.test(x.innerText))).click();});await p.waitForTimeout(400);
      const pop=await p.evaluate(()=>document.querySelector('#pop').innerText.replace(/\s+/g,' '));
      if(how==='clash-show')T('매일로 깔면 "10/13에 🦷양치가 이미 있어요" · 버튼 3개',/10\/13에 .*양치가 이미 있어요/.test(pop)&&/지금 만든 스티커만 보이기/.test(pop)&&/겹친 날은 건너뛰기/.test(pop)&&/취소/.test(pop),pop);
      await p.click(`#pop [data-act="${how}"]`);await p.waitForTimeout(250);
      const r=await p.evaluate(()=>{const S=__wx.S,t=S.stamps.defs.find(x=>x.id==='s_teeth'),o=S.stamps.defs.find(x=>x.id==='o_b');return {t:__wx.stampPlanned(t,'2026-10-13'),o:__wx.stampPlanned(o,'2026-10-13'),rep:o.rep,log:S.stamps.log['2026-10-13']||{}};});
      if(how==='clash-show')T('지금 만든 것만: 13일엔 새 양치 · 체크 1번 옮김',!r.t&&r.o&&r.log.o_b===1&&!r.log.s_teeth,JSON.stringify(r));
      if(how==='clash-skip')T('겹친 날 건너뛰기: 13일엔 원래 양치 · 체크 그대로 · 새 것은 매일',r.t&&!r.o&&r.rep==='daily'&&r.log.s_teeth===1,JSON.stringify(r));
      if(how==='sh-undo')T('취소: 저장 안 됨',r.t&&r.rep==='none',JSON.stringify(r));
      T('오류 없음 ('+how+')',p.errs.length===0,p.errs.join('|'));await p.close();
    }
  }
  { // 4) 4개 넘음도 같은 버튼 3개
    const p=await boot(b,{...base});await p.waitForTimeout(300);
    await p.evaluate(()=>{const S=__wx.S;S.stamps.defs.filter(x=>!x.empty&&!x.retired).slice(0,4).forEach(x=>{x.rep='daily';x.from='2026-10-01';});S.stamps.defs.push({id:'o_c',one:true,kind:'mark',emoji:'🎸',name:'기타',times:1,rep:'none',days:[],dates:[],skip:[],ats:[]});__wx.save();});
    await p.evaluate(()=>__wx.openStampReg('2026-10-14','o_c'));await p.waitForTimeout(300);
    await p.evaluate(()=>{[...document.querySelectorAll('#page.open .hseg button')].find(x=>/매일/.test(x.innerText)).click();});await p.waitForTimeout(150);
    await p.evaluate(()=>{(document.querySelector('#page.open [data-act="sr-save"]')||[...document.querySelectorAll('#page.open button')].find(x=>/저장|등록/.test(x.innerText))).click();});await p.waitForTimeout(400);
    const pop=await p.evaluate(()=>document.querySelector('#pop').innerText.replace(/\s+/g,' '));
    T('4개 넘음: "스티커가 4개를 넘어요" · 무엇이 가려지는지 · 버튼 3개',/4개를 넘어요/.test(pop)&&/가려져요/.test(pop)&&/겹친 날은 건너뛰기/.test(pop),pop);
    await p.click('#pop [data-act="clash-show"]');await p.waitForTimeout(250);
    T('지금 만든 것만 보이기 → 그 날 기타가 보임',await p.evaluate(()=>__wx.stampsOn('2026-10-20').some(x=>x.s.id==='o_c')));
    T('오류 없음 (4개)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 5) 이럴 땐 이렇게: 자세히 27개 · "스티커가 왜 안 붙지?" · 사진 파일
    const p=await boot(b,{...base});await act(p,'tips-open');await p.waitForTimeout(300);
    const r=await p.evaluate(()=>{const t=[...document.querySelectorAll('.tips .tip')];return {n:t.filter(x=>x.querySelector('ol.tds')).length,why:t.some(x=>/스티커가 왜 안 붙지/.test(x.textContent)&&x.querySelector('ol.tds')),img:[...document.querySelectorAll('.tips img')].map(i=>i.getAttribute('src'))};});
    T('자세히 27개 (한두 번 누르는 것은 한 줄 그대로)',r.n===27,r.n);
    T('"스티커가 왜 안 붙지?" 자세히',r.why);
    T('사진 파일 모두 있음',r.img.length>=11&&r.img.every(s=>fs.existsSync('/home/user/sin/app/src/main/assets/'+s)),JSON.stringify(r.img));
    T('오류 없음 (팁)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 6) 지난 날 날씨 팝업: 시간별 줄 지난 칸 미세먼지 = 실제 잰 얼굴로 남음 · 어제 남은 칸도 채움
    const KST=(y,mo,d,h)=>Date.UTC(y,mo-1,d,h-9);const p2=n=>String(n).padStart(2,'0');
    const mk=r=>{const h={},hh={};for(let d=12;d<=16;d++)for(let x=0;x<24;x++){h[`202610${p2(d)}${p2(x)}`]=[12,10,0,1,0,2,50];if(d<14||(d===14&&x<=15))hh[`202610${p2(d)}${p2(x)}`]=[95,60];}
      const md={};for(let d=12;d<=18;d++)md[`202610${p2(d)}`]=[1,1];
      return {v:1,r,n:'',s:{b:'202610140500',h,n:{}},m:{b:'',d:{}},a:{b:'202610140500',d:md},q:{t:'2026-10-14 15:00',p10:95,p25:60,hh}};};
    const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(u.searchParams.has('past')?{d:{}}:{list:[mk('41111')]})});}]];
    const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
    const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{},nm:{}}},{tz:'Asia/Seoul',T:KST(2026,10,14,16),cfg,routes});
    await p.waitForTimeout(2200);
    await p.evaluate(()=>{const H=__wx.wxHist();H['2026-10-13']={at:1,s:'하루 요약',c:H['2026-10-14']&&H['2026-10-14'].c,hr:{i0:3,at:Array.from({length:12},(_,i)=>({t:Date.UTC(2026,9,12,15+2*i),l:'',f:'faces/1',fc:true}))}};__wx.wxHistSave(true);});
    const r=await p.evaluate(()=>{const H=__wx.wxHist(),x=H['2026-10-14'],y=H['2026-10-13'];const at=x&&x.hr&&x.hr.at||[];const past=at.filter(c=>c.t<Date.now()-2*3600e3),fut=at.filter(c=>c.t>Date.now());
      return {past:past.map(c=>[c.f,!!c.fc]).slice(0,3),pastReal:past.length>0&&past.every(c=>c.f&&!c.fc),futFc:fut.length>0&&fut.every(c=>c.fc||!c.f),yReal:y.hr.at.filter(c=>!c.fc).length};});
    T('오늘 저장본: 지난 칸 미세먼지 = 실제 잰 얼굴 (예보 아님)',r.pastReal,JSON.stringify(r));
    T('앞으로의 칸은 예보 그대로',r.futFc,JSON.stringify(r));
    T('어제 저장본에 예보로 남은 칸도 서버 지난 값으로 채움',r.yReal>=6,JSON.stringify(r));
    await p.evaluate(()=>{const H=__wx.wxHist();const x=H['2026-10-14'],c=x.hr.at.find(c=>c.fc);window.__ct=c.t;c.f='faces/7';c.fc=false;localStorage.setItem('eonjeswieo:wxh',JSON.stringify(H));__wx.wxHistSave(true);});
    T('한 번 저장된 실제 값은 예보로 다시 덮이지 않음',await p.evaluate(()=>{const c=__wx.wxHist()['2026-10-14'].hr.at.find(c=>c.t===window.__ct);return c&&c.f==='faces/7'&&!c.fc;}));
    T('오류 없음 (미세먼지 기록)',p.errs.filter(x=>!/Failed to load resource/.test(x)).length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();})();
