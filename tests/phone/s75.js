// v0.107 날짜 창 · 업무 메모 옆으로 밀기 · 내 카드(날씨 없음 = 상태 크게) · 근무 시간 한 곳 · 어제 날씨(예보로 대신)
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const swipe=async(p,sel,dx)=>{const r=await p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+Math.min(b.height/2,30)};},sel);if(!r)return false;
    await p.evaluate(([x,y,dx])=>{const t=document.elementFromPoint(x,y);const ev=(ty,xx)=>t.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:xx,clientY:y,pointerId:1}));ev('pointerdown',x);for(let i=1;i<=6;i++)ev('pointermove',x+dx*i/6);const sc=document.querySelector('#sheet.open .swc:not(.swn),#pop .swc:not(.swn)');window.__swT=sc?sc.style.transform:'';window.__swN=!!document.querySelector('.swc.swn');ev('pointerup',x+dx);},[r.x,r.y,dx]);await p.waitForTimeout(700);return true;};
  { const p=await boot(b,{...base,addons:{...base.addons,wlog:true},wlog:{name:'업무 메모',seen:true,days:{}}},{touch:true});
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(300);
    const key=()=>p.evaluate(()=>{const b=document.querySelector('#sheet .dft b');return b?b.textContent:'';});
    T('시작: 10월 14일',/10월 14일/.test(await key()));
    await swipe(p,'#sheet .mempty',-120);
    T('날짜 창 가운데(메모 쪽)를 왼쪽으로 밀면 다음날',/10월 15일/.test(await key()),await key());
    await swipe(p,'#sheet .dfh',140);
    T('오른쪽으로 밀면 전날',/10월 14일/.test(await key()),await key());
    await swipe(p,'#sheet .tchips',-140);
    T('근무타입 칩 줄에서 민 건 날짜 안 바뀜',/10월 14일/.test(await key()),await key());
    await swipe(p,'#sheet .dfh',-30);
    T('조금만 밀면 제자리 (날짜 그대로)',/10월 14일/.test(await key()),await key());
    T('미는 동안 손가락을 따라 움직임 (translateX)',/translateX\(-30px\)/.test(await p.evaluate(()=>window.__swT||'')),await p.evaluate(()=>window.__swT||''));
    T('스프링 끝나면 원래 모양 (판 풀림)',await p.evaluate(()=>!document.querySelector('#sheet .swc')&&document.querySelector('#sheet').style.transform===''));
    await swipe(p,'#sheet .mempty',-120);
    T('밀 때 옆 날짜 판이 붙어 있음',await p.evaluate(()=>window.__swN===true));
    T('오류 없음 (날짜 창)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 업무 메모 창도 옆으로 밀면 다음날
    const p=await boot(b,{...base,addons:{...base.addons,wlog:true},wlog:{name:'업무 메모',seen:true,days:{'2026-10-14':{a:'인수할 것'}}}},{touch:true});
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('#sheet [data-act="wl-open"]').click());await p.waitForTimeout(400);
    await swipe(p,'#pop .wlp h4',-130);
    T('업무 메모 창 옆으로 밀면 다음날 (10월 15일)',await p.evaluate(()=>/10월 15일/.test(document.querySelector('#pop').innerText)));
    T('오류 없음 (업무 메모)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 스티커 창도 옆으로 밀면 다음날 (없는 날은 "없어요")
    const p=await boot(b,{...base,stamps:{defs:[{id:'p1',kind:'pill',emoji:'💊',name:'비타민',times:3,color:'#ef4d5a',rep:'daily',from:'2026-10-01',to:'',days:[],dates:[],skip:[]}],log:{'2026-10-14':{p1:1}},remind:false,more:false,pillTimes:['07:30','12:30','21:00'],lastRt:''}},{touch:true});
    await p.evaluate(()=>__wx.render());await p.waitForTimeout(300);
    const ok=await p.evaluate(()=>{const c=document.querySelector('[data-act="stamp-dn"][data-k="2026-10-14"]');if(!c)return false;c.click();return true;});await p.waitForTimeout(400);
    const t1=await p.evaluate(()=>document.querySelector('#pop').innerText);
    if(ok&&/스티커/.test(t1)){await swipe(p,'#pop .menu.sdpop .mh',-130);
      T('스티커 창 옆으로 밀면 다음날 (10월 15일)',await p.evaluate(()=>/10월 15일/.test(document.querySelector('#pop').innerText)),await p.evaluate(()=>document.querySelector('#pop').innerText.slice(0,40)));}
    else T('스티커 창 열기 (시험 준비)',false,t1.slice(0,60));
    T('오류 없음 (스티커)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 날씨 팝업도 옆으로 밀면 다음날 · 업무 메모 안 쓰는 칸 위에서 밀어도 넘어감 · 근무타입 편집 창에서 시간 저장
    const h={};for(let d=11;d<=16;d++)for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[8+x%5,10,0,1,0,2,50];
    const raw={v:1,r:'41111',n:'',s:{b:'202610120500',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{}},q:null};
    const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
    const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(raw)})]];
    const p=await boot(b,{...base,addons:{...base.addons,wx:true,wlog:true},wx:{home:'41111',work:'',fw:{}},wlog:{name:'업무 메모',seen:true,days:{'2026-10-14':{a:'인수할 것'}}}},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes,touch:true});await p.waitForTimeout(2600);
    await p.evaluate(()=>__wx.openDay('2026-10-13'));await p.waitForTimeout(300);await p.click('#wxDay');await p.waitForTimeout(400);
    await swipe(p,'#pop .wxp .wh',-130);
    T('날씨 팝업 옆으로 밀면 다음날 (10월 14일 날씨)',await p.evaluate(()=>/10월 14일 \(수\) 날씨/.test(document.querySelector('#pop').innerText)),await p.evaluate(()=>document.querySelector('#pop').innerText.slice(0,30)));
    await p.evaluate(()=>{__wx.closePop();__wx.openDay('2026-10-14');});await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('#sheet [data-act="wl-open"]').click());await p.waitForTimeout(400);
    await swipe(p,'#pop .wlp textarea',-130);
    T('업무 메모: 안 쓰는 글 칸 위에서 밀어도 다음날',await p.evaluate(()=>/10월 15일/.test(document.querySelector('#pop').innerText)));
    await p.evaluate(()=>{__wx.closePop();__wx.closeSheet&&__wx.closeSheet();});await p.keyboard.press("Escape");await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('#nav [data-tab="set"]').click());await p.waitForTimeout(250);await p.click('[data-act="more-pattern"]');await p.waitForTimeout(400);
    T('근무 패턴 화면: 근무타입마다 시간 줄 (야간 = 시간 정하기)',await p.evaluate(()=>{const r=[...document.querySelectorAll('.tltimes .prow')].map(e=>e.innerText.replace(/\s+/g,' '));return r.some(x=>/야간 시간 정하기/.test(x))&&r.some(x=>/휴무 쉬는 날/.test(x));}));
    await p.evaluate(()=>document.querySelector('.tltimes [data-s="야"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>{const s=document.getElementById('tdS');s.value='18:30';s.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(200);
    await p.evaluate(()=>{const s=document.getElementById('tdE');s.value='06:30';s.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(200);
    await p.click('[data-act="type-save"]');await p.waitForTimeout(300);
    T('편집 창에서 시간 저장 → 목록에 18:30 → 다음날 06:30',await p.evaluate(()=>{const t=window.__wx.S.shiftTimes['야'];return t&&t.start==='18:30'&&t.end==='06:30'&&/18:30 → 다음날 06:30/.test(document.querySelector('.tltimes').innerText);}));
    T('오류 없음 (날씨 · 메모 · 시간)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 근무 시간: 가족 탭 내 카드 → 근무 패턴 화면 근무 시간 칸 펼침 · 날씨 없으면 상태 크게
    const st={...base,anchor:'2026-10-12',shiftTimes:{'주':{start:'09:00',end:'18:00'}}};
    const p=await boot(b,st,{tz:'Asia/Seoul',T:KST(2026,10,12,10)});
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
    const me=await p.evaluate(()=>{const c=document.querySelector('.nc.me2');return c?{big:c.classList.contains('big'),t:c.innerText}:null;});
    T('날씨 안 켠 사람: 내 카드 상태 크게 (근무 중 · 18:00 끝 · 퇴근까지)',!!me&&me.big&&/근무 중/.test(me.t)&&/18:00 끝/.test(me.t)&&/퇴근까지/.test(me.t),JSON.stringify(me));
    await p.evaluate(()=>document.querySelector('.nc.me2').click());await p.waitForTimeout(400);
    T('내 카드 누르면 지금 근무(주간)의 근무타입 편집 창 · 출근 · 퇴근 시각',await p.evaluate(()=>!!document.querySelector('#sheet.open #tdS')&&!!document.querySelector('#sheet.open #tdE')&&document.getElementById('tdName').value==='주간'&&/오전 9:00/.test(document.querySelector('#sheet').innerText)));
    T('오류 없음 (근무 시간)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 어제 날씨: 관측이 아직 없으면 받아 둔 예보로 한 줄 + 누르면 팝업
    const h={};for(let d=11;d<=13;d++)for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[8+x%5,10,0,1,0,2,50];
    const raw={v:1,r:'41111',n:'',s:{b:'202610120500',h,n:{'20261011':[5,15]}},m:{b:'',d:{}},a:{b:'',d:{}},q:null};
    const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
    const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());if(u.searchParams.has('past'))return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({r:'41111',ym:'202610',st:'',d:{}})});r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(raw)});}]];
    const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{}}},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes});await p.waitForTimeout(2600);
    await p.evaluate(()=>__wx.openDay('2026-10-11'));await p.waitForTimeout(400);
    const l=await p.evaluate(()=>{const e=document.getElementById('wxDay');return e?{t:e.innerText,act:e.getAttribute('data-act'),hid:e.hidden}:null;});
    T('어제: 관측 없으면 예보로 한 줄 ("예보" 표시 · 누를 수 있음)',!!l&&!l.hid&&/예보/.test(l.t)&&l.act==='wx-day',JSON.stringify(l));
    T('오류 없음 (어제)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
