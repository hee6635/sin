// v0.107 날짜 창 · 업무 메모 옆으로 밀기 · 내 카드(날씨 없음 = 상태 크게) · 근무 시간 한 곳 · 어제 날씨(예보로 대신)
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const swipe=async(p,sel,dx)=>{const r=await p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+Math.min(b.height/2,30)};},sel);if(!r)return false;
    await p.evaluate(([x,y,dx])=>{const t=document.elementFromPoint(x,y);const ev=(ty,xx)=>t.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:xx,clientY:y,pointerId:1}));ev('pointerdown',x);for(let i=1;i<=6;i++)ev('pointermove',x+dx*i/6);const sc=document.querySelector('#sheet.open .swc:not(.swn),#pop .swc:not(.swn)');window.__swT=sc?sc.style.transform:'';window.__swN=!!document.querySelector('.swc.swn');ev('pointerup',x+dx);},[r.x,r.y,dx]);await p.waitForTimeout(700);return true;};
  const slow=async(p,sel,dx)=>{const r=await p.evaluate(s=>{const e=document.querySelector(s);const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+Math.min(b.height/2,30)};},sel);   // 천천히 조금 (0.3초 넘게)
    await p.evaluate(([x,y])=>{window.__st=document.elementFromPoint(x,y);window.__sv=(ty,xx)=>__st.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:xx,clientY:y,pointerId:1}));__sv('pointerdown',x);},[r.x,r.y]);
    for(let i=1;i<=6;i++){await p.evaluate(([x,v])=>__sv('pointermove',x+v),[r.x,dx*i/6]);await p.waitForTimeout(60);}
    await p.evaluate(()=>{const sc=document.querySelector('#sheet.open .swc:not(.swn),#pop .swc:not(.swn)');window.__swT=sc?sc.style.transform:'';window.__swN=!!document.querySelector('.swc.swn');});
    await p.evaluate(([x,v])=>__sv('pointerup',x+v),[r.x,dx]);await p.waitForTimeout(700);};
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
    await slow(p,'#sheet .dfh',-30);
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
  { // 여러 번 연달아 밀어도 하루씩만 (날짜 띠가 옮겨지며 처음으로 돌아가 엉뚱한 달로 튀던 것 · v0.110)
    const p=await boot(b,{...base},{touch:true});
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(400);
    const key=()=>p.evaluate(()=>{const b=document.querySelector('#sheet .dft b');return b?b.textContent:'';});
    const seen=[];
    for(let i=0;i<5;i++){await swipe(p,'#sheet .dfh',-130);await p.waitForTimeout(250);seen.push(await key());}
    await slow(p,'#sheet .dfh',-30);await p.waitForTimeout(600);seen.push(await key());   // 덜 밀고 제자리 → 그대로
    T('연달아 5번 밀면 15 → 16 → 17 → 18 → 19일 (덜 밀면 그대로)',seen.join(',')==='10월 15일 (목),10월 16일 (금),10월 17일 (토),10월 18일 (일),10월 19일 (월),10월 19일 (월)',seen.join(','));
    { // 넘어가는 중(0.3초 안)에 또 밀어도 씹히지 않음 · 진짜 터치로 (화면이 바뀌며 손가락 아래 칸이 사라져도)
      const cdp=await p.context().newCDPSession(p);const r=await p.evaluate(()=>{const b=document.getElementById('sheet').getBoundingClientRect();return [b.left+b.width/2,b.top+90];});
      for(let i=0;i<4;i++){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r[0],y:r[1]}]});
        for(let j=1;j<=8;j++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r[0]-17*j,y:r[1]}]});await p.waitForTimeout(25);}
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(60);
      }
    }
    await p.waitForTimeout(800);
    T('빠르게 4번 (0.1초 간격) → 23일 (씹힘 없음)',/10월 23일/.test(await key()),await key());
    { // 짧게 빠르게 튕기기 (42px · 0.1초) → 넘김
      const cdp=await p.context().newCDPSession(p);const r=await p.evaluate(()=>{const b=document.getElementById('sheet').getBoundingClientRect();return [b.left+b.width/2,b.top+90];});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r[0],y:r[1]}]});
      for(let j=1;j<=3;j++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r[0]-14*j,y:r[1]}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(800);
      T('짧게 빠르게 튕겨도 넘김 → 24일',/10월 24일/.test(await key()),await key());
      await slow(p,'#sheet .dfh',-30);await p.waitForTimeout(600);   // 천천히 조금 = 그대로
      T('천천히 조금 밀면 그대로 (24일)',/10월 24일/.test(await key()),await key());
    }
    T('날짜 띠: 고른 날이 가운데',await p.evaluate(()=>{const el=document.getElementById('dstrip'),on=el.querySelector('.dsi.on');return Math.abs(on.offsetLeft+on.offsetWidth/2-el.clientWidth/2-el.scrollLeft)<4;}));
    T('오류 없음 (연달아 밀기)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 업무 메모: 옆에 붙어 오는 날짜의 칸 높이가 넘어간 뒤와 같음 (넘어가서 칸이 늘어나는 느낌 없게)
    const p=await boot(b,{...base,addons:{...base.addons,wlog:true},wlog:{name:'업무 메모',seen:true,days:{'2026-10-14':{a:'인수할 것'},'2026-10-15':{a:'내일 것\n둘째 줄\n셋째\n넷째'}}}},{touch:true});
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('#sheet [data-act="wl-open"]').click());await p.waitForTimeout(400);
    const mid=await p.evaluate(()=>{const e=document.querySelector('#pop .wlp');const b=e.getBoundingClientRect();const x=b.left+b.width/2,y=b.top+30,t=document.elementFromPoint(x,y);
      window.__ev=(ty,xx)=>t.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:xx,clientY:y,pointerId:1}));window.__x=x;__ev('pointerdown',x);for(let i=1;i<=6;i++)__ev('pointermove',x-120*i/6);
      return [...document.querySelectorAll('#pop .swn .wlta')].map(t=>t.offsetHeight).join(',');});
    await p.evaluate(()=>__ev('pointerup',__x-120));await p.waitForTimeout(800);
    const after=await p.evaluate(()=>[...document.querySelectorAll('#pop .wlta')].map(t=>t.offsetHeight).join(','));
    T('업무 메모: 붙어 오는 칸 높이 = 넘어간 뒤 높이',mid===after&&/^1\d\d,/.test(mid),mid+' / '+after);
    T('오류 없음 (메모 칸 높이)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 날씨 팝업도 옆으로 밀면 다음날 · 업무 메모 안 쓰는 칸 위에서 밀어도 넘어감 · 근무타입 편집 창에서 시간 저장
    const h={};for(let d=11;d<=16;d++)for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[8+x%5,10,0,1,0,2,50];
    const raw={v:1,r:'41111',n:'',s:{b:'202610120500',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{}},q:null};
    const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
    const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(raw)})]];
    const p=await boot(b,{...base,addons:{...base.addons,wx:true,wlog:true},wx:{home:'41111',work:'',fw:{}},wlog:{name:'업무 메모',seen:true,days:{'2026-10-14':{a:'인수할 것'}}}},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes,touch:true});await p.waitForTimeout(2600);
    await p.evaluate(()=>__wx.openDay('2026-10-13'));await p.waitForTimeout(300);await p.click('#wxDay');await p.waitForTimeout(400);
    { // 진짜 손가락 터치로 (touch-action 이 막으면 실패함 · v0.109 폰에서 안 되던 것)
      const cdp=await p.context().newCDPSession(p);const r=await p.evaluate(()=>{const e=document.querySelector('#pop .wxp .wxk')||document.querySelector('#pop .wxp .wh');const b=e.getBoundingClientRect();return [b.left+b.width/2,b.top+10];});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r[0],y:r[1]}]});
      for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r[0]-13*i,y:r[1]}]});await p.waitForTimeout(16);}
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(700);
    }
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
    T('편집 창: 총 12시간 근무',await p.evaluate(()=>/총 12시간 근무/.test(document.querySelector('.tdtot').innerText)));
    await p.click('[data-act="type-save"]');await p.waitForTimeout(300);
    T('편집 창에서 시간 저장 → 목록에 18:30 → 다음날 06:30',await p.evaluate(()=>{const t=window.__wx.S.shiftTimes['야'];return t&&t.start==='18:30'&&t.end==='06:30'&&/18:30 → 다음날 06:30 · 12시간/.test(document.querySelector('.tltimes').innerText);}));
    T('오류 없음 (날씨 · 메모 · 시간)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 근무 시간: 가족 탭 내 카드 → 근무 패턴 화면 근무 시간 칸 펼침 · 날씨 없으면 상태 크게
    const st={...base,anchor:'2026-10-12',shiftTimes:{'주':{start:'09:00',end:'18:00'}}};
    const p=await boot(b,st,{tz:'Asia/Seoul',T:KST(2026,10,12,10)});
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
    const me=await p.evaluate(()=>{const c=document.querySelector('.nc.me2');return c?{big:c.classList.contains('big'),t:c.innerText}:null;});
    T('날씨 안 켠 사람: 내 카드 상태 크게 (근무 중 · 18:00 끝 · 퇴근까지)',!!me&&me.big&&/근무 중/.test(me.t)&&/18:00 끝/.test(me.t)&&/퇴근까지/.test(me.t),JSON.stringify(me));
    await p.evaluate(()=>document.querySelector('.nc.me2').click());await p.waitForTimeout(400);
    T('내 카드 누르면 달력 탭 · 오늘 날짜 창 (v0.113)',await p.evaluate(()=>document.querySelector('#nav [data-tab="cal"]').classList.contains('on')&&document.querySelector('#sheet.open')&&/10월 12일/.test(document.querySelector('#sheet .dft').innerText)),await p.evaluate(()=>(document.querySelector('#sheet .dft')||{}).innerText));
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
