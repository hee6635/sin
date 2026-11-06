// v0.142: 날짜 창 날씨 카드(쉬는 날 지금만) · 날씨만 알림 소리(알람마다) · 알람 5분 전 "이번만 끄기" · 유찬 · 가족 달력 가로 스크롤 · 날짜 창 · 쉬는 날 날씨
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h)=>Date.UTC(y,mo-1,d,h-9);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const TP=[5,5,4,4,4,4,4,5,8,10,12,13,14,14,15,14,13,10,8,7,6,6,5,5];
  const mk=r=>{const h={},n={};for(let d=11;d<=18;d++){for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[TP[x],10,0,1,0,2,50];n[`202610${p2(d)}`]=[4,15];}return {v:1,r,n:'',s:{b:'202610120500',h,n},m:{b:'',d:{}},a:{b:'',d:{}},q:null};};
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());const c=(u.searchParams.get('r')||'41111,41113').split(',').filter(Boolean);r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(u.searchParams.has('past')?{d:{}}:{list:c.map(mk)})});}]];
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  { // 1) 날짜 창 날씨 카드 · 알람
    const alarms=[{id:'al1',on:true,shift:'주',time:'06:00',label:'주간 출근',days:[],sound:true},{id:'al2',on:true,shift:'주',time:'07:30',label:'한 번',once:true,until:0},{id:'al3',on:true,shift:'*',time:'08:00',label:'날씨',wxOnly:true,sound:false,tone:''}];
    const p=await boot(b,{...base,alarms,addons:{...base.addons,wx:true},wx:{home:'41111',work:'41113',fw:{},nm:{}}},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes});
    await p.waitForTimeout(2200);
    const card=async k=>{await p.evaluate(k=>{__wx.closeSheet();__wx.openDay(k);},k);await p.waitForTimeout(400);return p.evaluate(()=>[...document.querySelectorAll('#sheet #wxDay .wc')].map(c=>c.innerText.replace(/\s+/g,' ')));};
    const a=await card('2026-10-12');T('쉬는 날 오늘 날짜 창: "지금 12°" 한 칸',a.length===1&&/지금/.test(a[0])&&/12°/.test(a[0]),JSON.stringify(a));
    const c=await card('2026-10-13');T('쉬는 날 다른 날: "하루 4°~15°" 한 칸',c.length===1&&/하루/.test(c[0])&&/4°~15°/.test(c[0]),JSON.stringify(c));
    const w=await card('2026-10-14');T('근무 날: 출근 → 퇴근 두 칸 그대로',w.length===2,JSON.stringify(w));
    // 알람 목록 → 폰: pre(5분 전) · 날씨만 소리
    const sent=await p.evaluate(()=>{let A='',Rm='';window.AndroidBridge.setAlarms=j=>{A=j;};window.AndroidBridge.setReminders=j=>{Rm=j;};__wx.S.alarms.find(x=>x.id==='al3').sound=true;__wx.S.alarms.find(x=>x.id==='al3').tone='content://t/1';__wx.save();__wx.render();return {A:JSON.parse(A||'[]'),R:JSON.parse(Rm||'[]')};});
    const rep=sent.A.filter(x=>x.id.startsWith('al1_')),one=sent.A.filter(x=>x.id.startsWith('al2_')),wx=sent.R.filter(x=>x.type==='wx');
    T('반복 알람은 pre=1 (5분 전 알림) · 한 번만 알람은 0',rep.length>0&&rep.every(x=>x.pre===1)&&one.every(x=>x.pre===0),JSON.stringify([rep[0],one[0]]).slice(0,200));
    T('날씨만 알림에 소리 · 고른 소리 실어 보냄',wx.length>0&&wx[0].snd===1&&wx[0].tone==='content://t/1',JSON.stringify(wx[0]||{}).slice(0,200));
    // 폰에서 "이번만 끄기" → 앱이 가져가서 그 알람 건너뜀
    const at=rep[0].at;
    const sk=await p.evaluate(([id,at])=>{window.AndroidBridge.takeSkips=()=>{const v=JSON.stringify([{id,at}]);window.AndroidBridge.takeSkips=()=>'[]';return v;};let A='';window.AndroidBridge.setAlarms=j=>{A=j;};__wx.save();const L=JSON.parse(A||'[]');return {skip:__wx.S.alarms.find(x=>x.id==='al1').skipAt,still:L.some(x=>x.at===at&&x.id.startsWith('al1_'))};},[rep[0].id,at]);
    T('5분 전 알림에서 끈 알람: 앱이 가져가 그 시각 건너뜀 · 다시 안 보냄',sk.skip===at&&!sk.still,JSON.stringify(sk));
    // 알람 고치기: 5분 전 스위치 · 날씨만 소리 고르기
    await p.evaluate(()=>__wx.closeSheet());await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(300);
    await p.evaluate(()=>{const c=[...document.querySelectorAll('#view [data-act="aedit"],#view .acard')].find(x=>/주간 출근/.test(x.textContent));c&&c.click();});await p.waitForTimeout(400);
    const ed=await p.evaluate(()=>({pre:!!document.getElementById('aPre'),t:(document.querySelector('#page.open')||{}).innerText||''}));
    T('반복 알람 고치기: "⏰ 5분 전 알림" 스위치(켜짐)',ed.pre&&/5분 전 알림/.test(ed.t),ed.t.slice(0,80));
    await p.evaluate(()=>{const x=document.querySelector('#page.open [data-act="page-close"]');x&&x.click();});await p.waitForTimeout(200);
    await p.evaluate(()=>{const c=[...document.querySelectorAll('#view [data-act="aedit"],#view .acard')].find(x=>/날씨/.test(x.textContent)&&/알림만/.test(x.textContent));c&&c.click();});await p.waitForTimeout(400);
    const wd=await p.evaluate(()=>(document.querySelector('#page.open')||{}).innerText||'');
    T('날씨만 알람 고치기: "🔔 알림 소리 [소리 · 무음]" · 소리 고르기 · 5분 전 없음',/알림 소리/.test(wd)&&/소리 고르기/.test(wd)&&!/5분 전 알림/.test(wd),wd.replace(/\s+/g,' ').slice(0,200));
    T('오류 없음 (날씨 카드 · 알람)',p.errs.filter(x=>!/Failed to load/.test(x)).length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 유찬 달력: 가로 스크롤 · 날짜 창 넘기기
    const fam=[{id:'f1',name:'유찬',kind:'student',label:'유치원',start:'09:00',end:'15:00',vac:[],color:'#ec4899',notes:{'2026-10-20':'체육복'},sdefs:[],stk:{}}];
    const p=await boot(b,{...base,family:fam},{touch:true});await p.waitForTimeout(500);
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
    await p.evaluate(()=>{const x=document.querySelector('[data-act="fam-mancal"]');x&&x.click();});await p.waitForTimeout(600);
    const cdp=await p.context().newCDPSession(p);
    const sw=async(dir,sel)=>{const r=await p.evaluate(s=>{const b=document.querySelector(s).getBoundingClientRect();return [b.x+b.width/2,b.y+Math.min(b.height/2,300)];},sel);const x0=r[0]+(dir>0?120:-120);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:r[1]}]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0-dir*i*40,y:r[1]}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
    for(let i=0;i<3;i++){await sw(1,'#vctr');await p.waitForTimeout(150);}await p.waitForTimeout(1200);
    const r=await p.evaluate(()=>({b:document.querySelector('.vcnav b').textContent,n:document.querySelectorAll('#vcsl').length,mk:+document.getElementById('vcsl').dataset.mk}));
    T('유찬 달력: 0.15초 간격 3번 밀기 → 3달 (가로 스크롤 · 안 씹힘)',r.b==='2027.01'&&r.n===1&&r.mk===2027*12,JSON.stringify(r));
    await p.evaluate(()=>document.querySelector('[data-act="vc-prev"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('[data-act="vc-prev"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('[data-act="vc-prev"]').click());await p.waitForTimeout(400);
    T('‹ 버튼 3번 → 다시 2026.10',await p.evaluate(()=>document.querySelector('.vcnav b').textContent)==='2026.10');
    await p.evaluate(()=>{const c=document.querySelector('#vcsl .cell[data-k="2026-10-19"]');c&&c.click();});await p.waitForTimeout(500);
    await p.evaluate(()=>{window.__m=document.querySelector('#sheet .dft');});
    await sw(1,'#sheet.open');await p.waitForTimeout(800);
    const s=await p.evaluate(()=>({t:(document.querySelector('#sheet.open .dft b')||{}).textContent,re:!document.querySelector('#sheet').contains(window.__m),ids:!!document.querySelector('#sheet #dstrip'),swn:document.querySelectorAll('#sheet .swn').length,note:/체육복/.test(document.querySelector('#sheet.open').innerText)||[...document.querySelectorAll('#sheet textarea,#sheet input')].some(x=>/체육복/.test(x.value))}));
    T('유찬 날짜 창 밀기 → 10/20 · 그려 둔 판 그대로 · 날짜 띠 id · 그날 메모',/10월 20일/.test(s.t||'')&&s.re&&s.ids&&s.swn===0&&s.note,JSON.stringify(s));
    T('오류 없음 (유찬 달력)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 3) 가족(근무표 나눈 사람) 쉬는 날 날씨 = 지금 · 오늘 요약
    const sch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['휴','휴','휴','휴'],anchor:'2026-10-02',types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],overrides:{},holRest:false,wx:{w:'41113',h:'41111',tm:{'주':['07:00','19:00']}}};
    const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'view'}];
    const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{},nm:{}},link:{hid:'dad',role:'guest',name:'엄마',perm:'write',mode:'view',uid:'mom',hash:'',stkAsked:1},fam2:{members,scheds:{dad:sch},memos:{},reqIn:{},reqOut:{},me:{sent:2,bonus:0},seenMemo:[],init:true},requests:[]},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes});
    await p.waitForTimeout(2200);
    const c=await p.evaluate(()=>{const m=__wx.famPeers()[0];__wx.famWxOpen?__wx.famWxOpen(m,'2026-10-12'):null;return [...document.querySelectorAll('#pop .wxcs .wxc')].map(x=>x.innerText.replace(/\s+/g,' '));});
    T('가족 쉬는 날 날씨: 왼쪽 지금 · 오른쪽 오늘 요약',c.length===2&&/지금/.test(c[0])&&/오늘 요약/.test(c[1]),JSON.stringify(c));
    T('오류 없음 (가족 날씨)',p.errs.filter(x=>!/Failed to load/.test(x)).length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();})();
