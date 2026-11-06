// v0.143: 날씨만 알람 소리 고르기 = 폰 알림음 목록 · 가족 탭 내 카드 쉬는 날 "지금 · 오늘" · 유찬 시간별 줄 "🏫 유치원"
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h)=>Date.UTC(y,mo-1,d,h-9);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const TP=[5,5,4,4,4,4,4,5,8,10,12,13,14,14,15,14,13,10,8,7,6,6,5,5];
  const mk=r=>{const h={},n={};for(let d=11;d<=18;d++){for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[TP[x],10,0,1,0,2,50];n[`202610${p2(d)}`]=[4,15];}return {v:1,r,n:'',s:{b:'202610120500',h,n},m:{b:'',d:{}},a:{b:'',d:{}},q:null};};
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());const c=(u.searchParams.get('r')||'41111,41113').split(',').filter(Boolean);r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(u.searchParams.has('past')?{d:{}}:{list:c.map(mk)})});}]];
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  const fam=[{id:'f1',name:'유찬',kind:'student',label:'유치원',start:'09:00',end:'15:00',vac:[],color:'#ec4899',notes:{},sdefs:[],stk:{},loc:'41113'}];
  const alarms=[{id:'al3',on:true,shift:'*',time:'08:00',label:'날씨',wxOnly:true,sound:true,tone:''},{id:'al1',on:true,shift:'주',time:'06:00',label:'주간 출근',sound:true}];
  const p=await boot(b,{...base,family:fam,alarms,addons:{...base.addons,wx:true},wx:{home:'41111',work:'41113',fw:{f1:'41113',f_f1:'41113'},nm:{}}},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes});
  await p.waitForTimeout(2200);
  // 1) 소리 고르기
  await p.evaluate(()=>{window.__pk=[];window.AndroidBridge.pickTone=(r,c)=>window.__pk.push(r);window.AndroidBridge.pickToneFile=r=>window.__pk.push('file:'+r);});
  await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(300);
  const open=async re=>{await p.evaluate(re=>{const c=[...document.querySelectorAll('#view .acard,#view [data-act="aedit"]')].find(x=>new RegExp(re).test(x.textContent));c&&c.click();},re);await p.waitForTimeout(400);};
  await open('알림만');
  await p.evaluate(()=>document.querySelector('#page.open [data-act="dtone"]').click());await p.waitForTimeout(200);
  const pk=await p.evaluate(()=>window.__pk.slice());
  T('날씨만 알람 "소리 고르기" → 폰 알림음 목록 (요청 n:…) · 음악 파일 고르기 안 거침',pk.length===1&&pk[0]==='n:al3',JSON.stringify(pk));
  await p.evaluate(()=>window.__onTone({req:'n:al3',uri:'content://n/5',title:'딩동'}));await p.waitForTimeout(200);
  T('고른 알림음 이름이 줄에 보임',await p.evaluate(()=>/딩동/.test(document.querySelector('#page.open').innerText)));
  await p.evaluate(()=>{const x=document.querySelector('#page.open [data-act="page-close"]');x&&x.click();});await p.waitForTimeout(200);
  await p.evaluate(()=>{window.__pk=[];});await open('주간 출근');
  await p.evaluate(()=>{const s=document.querySelector('#page.open [data-act="dsnd-open"]');s&&s.click();});await p.waitForTimeout(200);
  await p.evaluate(()=>{const x=document.querySelector('#page.open [data-act="dtone"]');x&&x.click();});await p.waitForTimeout(200);
  T('일반 알람은 그대로 (알람음 · 음악 파일 고르기 창)',await p.evaluate(()=>!!document.querySelector('#pop [data-act="dtone-sys"]')));
  await p.evaluate(()=>{__wx.closePop();const x=document.querySelector('#page.open [data-act="page-close"]');x&&x.click();});await p.waitForTimeout(200);
  // 2) 가족 탭 내 카드
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(600);
  const me=await p.evaluate(()=>{const c=document.querySelector('[data-u="me"]');return c?c.innerText.replace(/\s+/g,' '):'';});
  T('가족 탭 내 카드(쉬는 날): "지금 12°" · "오늘 4°/15°"',/지금\s*12°/.test(me)&&/오늘\s*4°\/15°/.test(me)&&!/오전/.test(me),me);
  // 3) 유찬 시간별 줄
  const hr=await p.evaluate(()=>{const m=__wx.S.family[0];__wx.famWxOpen(m,'2026-10-12');return [...document.querySelectorAll('#pop .wxhr .sg .hl')].map(x=>x.innerText);});
  T('유찬 날씨 시간별 줄: "🏫 유치원" (직장 아님)',hr.some(x=>/🏫\s*유치원/.test(x))&&!hr.some(x=>/직장/.test(x)),JSON.stringify(hr));
  T('오류 없음',p.errs.filter(x=>!/Failed to load/.test(x)).length===0,p.errs.join('|'));await p.close();
  T.sum();await b.close();})();
