// v0.125 가족(보기만) 폰: 가족 탭 그 사람 카드에 날씨 · 그 사람 달력 날짜 창 = 날짜 띠 · "근무 요청 ▾" 접기 · 날씨 · 가족 메모 · 옆으로 밀기
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const sch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
    types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],
    overrides:{},holRest:false,wx:{w:'41113',tm:{'주':['07:00','19:00'],'야':['19:00','07:00']}}};
  const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'view'}];
  const memos={'2026-10-14':[{id:'fm1',text:'9시 지게차 교육',shared:true,by:'host',t:1}]};
  const mk=r=>{const h={};for(let d=11;d<=20;d++)for(let x=0;x<24;x++){const rain=x>=18;h[`202610${p2(d)}${p2(x)}`]=[12,rain?80:10,rain?1:0,rain?4:1,rain?2:0,2,50];}return {v:1,r,n:'',s:{b:'202610120500',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{}},q:null};};
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({list:[mk('41111'),mk('41113')]})})]];
  const state=wx=>({...base,memos,addons:{...base.addons,wx},wx:{home:wx?'41111':'',work:'',fw:{},nm:{}},
    link:{hid:'dad',role:'guest',name:'엄마',perm:'write',mode:'view',uid:'mom',hash:'',stkAsked:1},
    fam2:{members,scheds:{dad:sch},memos:{},reqIn:{},reqOut:{},me:{sent:2,bonus:0},seenMemo:[],init:true},requests:[]});
  const tap=(p,sel)=>p.evaluate(sel=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const o=document.querySelector(sel);o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();},sel);
  { const p=await boot(b,state(true),{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes,touch:true,fold:true});await p.waitForTimeout(2500);
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(500);
    const c=await p.evaluate(()=>{const e=[...document.querySelectorAll('.now.fams .fc2')].find(x=>/아빠/.test(x.innerText));return e?{t:e.innerText.replace(/\s+/g,' '),wx:!!e.querySelector('.mwx:not(.mwx-off)'),badge:!!e.querySelector('.st .badge')}:null;});
    T('근무 시간을 모를 때도 🔁 대신 근무 동그라미(야)',!!c&&c.badge&&!/🔁/.test(c.t),JSON.stringify(c));
    T('가족 탭: 아빠 카드에 작은 날씨 줄 (출근 · 퇴근) · 결론 "퇴근길에 비"',!!c&&c.wx&&/출근/.test(c.t)&&/퇴근/.test(c.t)&&/비/.test(c.t),JSON.stringify(c));
    await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(600);
    await p.evaluate(()=>document.querySelector('#vcsl .cell[data-k="2026-10-14"]').click());await p.waitForTimeout(600);
    const d0=await p.evaluate(()=>{const s=document.getElementById('sheet');const y=q=>{const e=s.querySelector(q);return e?Math.round(e.getBoundingClientRect().top):-1;};return {full:s.classList.contains('full'),strip:!!s.querySelector('#dstrip .dsi.on'),pill:(s.querySelector('.vcrq .sh-pill')||{}).innerText||'',rq:!!document.getElementById('rqm2'),yp:y('.vcrq'),yw:y('.wxcard'),ym:y('.vcm'),memo:/9시 지게차 교육/.test(s.innerText),bar:!!document.getElementById('vcmemo'),t:(s.querySelector('.dft')||{}).innerText};});
    T('날짜 창: 전체 화면 · 날짜 띠 · "야간 · 근무 요청 ▾" (접힘 · 요청 칸 숨김)',d0.full&&d0.strip&&/야간/.test(d0.pill)&&/근무 요청/.test(d0.pill)&&!d0.rq,JSON.stringify(d0));
    T('순서: 근무 칩 → 날씨 카드 → 가족 메모 (메모 · 쓰는 칸)',d0.yp>0&&d0.yw>d0.yp&&d0.ym>d0.yw&&d0.memo&&d0.bar,JSON.stringify(d0));
    T('제목 아래: 아빠 · 야간 · 보기만',/아빠 · 야간 · 보기만/.test(d0.t),d0.t);
    await tap(p,'#sheet [data-act="vc-rq"]');await p.waitForTimeout(400);
    const d1=await p.evaluate(()=>({rq:!!document.getElementById('rqm2'),chips:document.querySelectorAll('#sheet .vcrq .tchip').length,send:!!document.querySelector('#sheet [data-act="vc-send"]'),multi:!!document.querySelector('#sheet [data-act="vc-multi-from"]'),t:document.querySelector('#sheet .vcrq').innerText.replace(/\s+/g,' ')}));
    T('칩 누르면 펼침: 아빠에게 근무 요청 · 근무 동그라미 3개 · 메시지 · 여러 날 · 보내기 · 무료 8건',d1.rq&&d1.chips===3&&d1.send&&d1.multi&&/아빠에게 근무 요청/.test(d1.t)&&/무료 8건/.test(d1.t),JSON.stringify(d1));
    await tap(p,'#sheet .vcrq .tchip:nth-child(3)');await p.waitForTimeout(200);
    T('근무 고르기 (휴무)',await p.evaluate(()=>document.querySelector('#sheet .vcrq .tchip.on small').textContent==='휴무'));
    await p.evaluate(()=>{document.getElementById('rqm2').value='같이 가자';document.querySelector('#sheet [data-act="vc-send"]').click();});await p.waitForTimeout(400);
    T('보내기 → 확인 창 (요청)',await p.evaluate(()=>/요청/.test((document.querySelector('#pop')||{}).innerText||'')&&!!document.querySelector('#pop [data-act="cfm-ok"]')));
    await p.evaluate(()=>__wx.closePop());await p.waitForTimeout(200);
    await tap(p,'#sheet [data-act="vc-rq"]');await p.waitForTimeout(300);
    T('▴ 접기',await p.evaluate(()=>!document.getElementById('rqm2')));
    // 옆으로 밀기 → 다음날
    await p.evaluate(()=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const bx=document.getElementById('sheet').getBoundingClientRect();const x=bx.left+bx.width/2,y=bx.top+60,t=document.elementFromPoint(x,y);const ev=(ty,xx)=>t.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:xx,clientY:y,pointerId:3}));ev('pointerdown',x);for(let i=1;i<=6;i++)ev('pointermove',x-130*i/6);ev('pointerup',x-130);});await p.waitForTimeout(800);
    T('옆으로 밀면 다음날 (15일)',await p.evaluate(()=>/10월 15일/.test(document.querySelector('#sheet .dft').innerText)),await p.evaluate(()=>document.querySelector('#sheet .dft').innerText));
    await tap(p,'#sheet #dstrip [data-k="2026-10-13"]');await p.waitForTimeout(500);
    const d2=await p.evaluate(()=>({t:document.querySelector('#sheet .dft').innerText,pill:(document.querySelector('#sheet .vcrq .sh-pill')||{}).innerText||''}));
    T('날짜 띠로 지난 날(13일): 칩엔 근무만 (요청 없음 · ▾ 없음)',/10월 13일/.test(d2.t)&&!/근무 요청/.test(d2.pill)&&!/▾/.test(d2.pill),JSON.stringify(d2));
    await tap(p,'#sheet #dstrip [data-k="2026-10-14"]');await p.waitForTimeout(500);
    await p.evaluate(()=>document.querySelector('#sheet .wxcard[data-act="vc-wx"]').click());await p.waitForTimeout(400);
    T('날씨 카드 누르면 아빠 그날 날씨 팝업',await p.evaluate(()=>/아빠 · 10월 14일/.test(document.querySelector('#pop').innerText)));
    {const er=p.errs.filter(e=>!/Failed to load resource/.test(e));T('오류 없음',er.length===0,er.join('|'));};await p.close();
  }
  { const p=await boot(b,state(false),{tz:'Asia/Seoul',T:KST(2026,10,14,10),touch:true});await p.waitForTimeout(1200);
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(500);
    T('날씨 꺼진 폰: "날씨도 보기" 버튼 없음 (v0.134 가족 날씨는 늘 자동)',await p.evaluate(()=>!document.querySelector('.now.fams .mwx-off')&&!/날씨도 보기/.test(document.querySelector('.now.fams').innerText)));
    T('오류 없음 (날씨 꺼짐)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
