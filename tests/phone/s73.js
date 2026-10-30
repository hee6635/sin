// v0.104 날씨 그림 · 둥근 글씨체 · 미세먼지 큰 화면(출근/퇴근 탭 · 항목 표) · 위젯 창 날씨 줄 · 알람 카드에 실을 새 모양
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
function raw(code){const h={};for(let d=12;d<=16;d++)for(let x=0;x<24;x++){const k=`202610${p2(d)}${p2(x)}`,rain=d===14&&x>=17&&x<=21;const tp=d===14?(x<=8?6:x<=18?6+(x-8):12):10;h[k]=[tp,rain?70:10,rain?1:0,d===14?4:1,rain?3:0,2.1,60];}
  const work=code==='41597';
  return {v:1,r:code,n:'',s:{b:'202610120800',h,n:{'20261014':[5,16]}},m:{b:'202610120600',d:{}},a:{b:'2026101205',d:{'20261012':[1,1],'20261013':[2,1],'20261014':[2,2]}},
    q:work?{t:'2026-10-12 09:00',p10:92,p25:48,st:'동탄',x:{k:[128,3],o3:[0.041,2],no2:[0.031,2],co:[0.6,1],so2:[0.011,2]}}:{t:'2026-10-12 09:00',p10:20,p25:6,st:'연무동',x:{k:[40,1]}}};}
const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());const codes=(u.searchParams.get('r')||'').split(',');r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(codes.length>1?{list:codes.map(raw)}:raw(codes[0]))});}]];
const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
const st={...base,addons:{...base.addons,wx:true},wx:{home:'4111160000',work:'41597',fw:{},nm:{'4111160000':'연무동'}}};
(async()=>{
  const T=mkT();const b=await chromium.launch();
  { // 1) 오늘(10/12 쉬는 날 · 지금 값): 출근 동네 좋음 · 직장 동네 상당히 나쁨 → 큰 화면 탭
    const p=await boot(b,st,{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes,csp:true});
    await p.evaluate(()=>{window.__wg=null;window.AndroidBridge.setWidgetData=j=>{window.__wg=JSON.parse(j);};window.__al=null;window.AndroidBridge.setAlarms=j=>{window.__al=j;};});
    await p.waitForTimeout(2600);
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(300);await p.click('#wxDay');await p.waitForTimeout(500);
    T('그림이 보안 잠금(CSP) 켠 채로도 뜸 (assets/wx)',await p.evaluate(()=>{const a=[...document.querySelectorAll('#pop img')];return a.length>=5&&a.every(i=>i.complete&&i.naturalWidth>0);}));
    T('둥근 글씨체(주아) 읽힘',await p.evaluate(async()=>{await document.fonts.ready;return document.fonts.check('20px Jua');}));
    await p.click('#pop [data-act="wx-dust"]');await p.waitForTimeout(300);
    const t1=await p.evaluate(()=>({t:document.querySelector('#pop').innerText,tabs:document.querySelectorAll('#pop .tabs button').length,bg:getComputedStyle(document.querySelector('#pop .menu')).backgroundColor}));
    T('큰 화면: 출근 · 퇴근 탭 2개 · 출근(연무동) 좋음 · 파랑 배경',t1.tabs===2&&/출근 · 연무동/.test(t1.t)&&/퇴근 · 화성시 동탄구/.test(t1.t)&&/좋음/.test(t1.t)&&/연무동 측정소/.test(t1.t)&&t1.bg==='rgb(75, 158, 230)',JSON.stringify(t1).slice(0,300));
    await p.click('#pop [data-act="wx-dust-tab"][data-i="1"]');await p.waitForTimeout(300);
    const t2=await p.evaluate(()=>({t:document.querySelector('#pop').innerText,rows:document.querySelectorAll('#pop table tr').length,bg:getComputedStyle(document.querySelector('#pop .menu')).backgroundColor,face:document.querySelector('#pop img.big').getAttribute('src')}));
    T('퇴근 탭: 동탄 측정소 · 상당히 나쁨 · 주황 배경 · 큰 얼굴 5번',/동탄 측정소/.test(t2.t)&&/상당히 나쁨/.test(t2.t)&&t2.bg==='rgb(232, 102, 42)'&&t2.face==='wx/faces/5.webp',JSON.stringify(t2).slice(0,300));
    T('항목 표 7줄 (통합 · 미세 · 초미세 · 오존 · 이산화질소 · 일산화탄소 · 아황산가스)',t2.rows===7&&/통합대기지수/.test(t2.t)&&/아황산가스/.test(t2.t)&&/0\.041 ppm/.test(t2.t),t2.rows);
    T('예보 3일 (오늘 · 내일 · 모레)',/오늘\s*예보/.test(t2.t)&&/내일\s*예보/.test(t2.t)&&/모레\s*예보/.test(t2.t));
    await p.click('#pop [data-act="wx-dust-close"]');await p.waitForTimeout(250);
    T('✕ → 날씨 팝업으로 돌아옴 (미세먼지 칸 다시 누를 수 있음)',await p.evaluate(()=>!document.querySelector('#pop').classList.contains('wxfull')&&!!document.querySelector('#pop .wxrw.dz[data-act="wx-dust"]')));
    // 오늘 팝업: 결론이 미세먼지 (직장 쪽이 나쁨)
    await p.evaluate(()=>{__wx.closePop();__wx.openDay('2026-10-12');});await p.waitForTimeout(300);await p.click('#wxDay');await p.waitForTimeout(300);
    const pop=await p.evaluate(()=>document.querySelector('#pop').innerText);
    T('쉬는 날(오늘) 팝업은 집 미세먼지 하나 (좋음)',/미세먼지 좋음/.test(pop),pop);
    // 위젯: 오늘 · 내일만 날씨 줄
    await p.evaluate(()=>{__wx.closePop();__wx.render();});await p.waitForTimeout(1200);
    const wg=await p.evaluate(()=>{const d=(window.__wg&&window.__wg.days)||[];const f=k=>d.find(x=>x.k===k);return {t:f('2026-10-12')&&f('2026-10-12').wx,n:f('2026-10-13')&&f('2026-10-13').wx,x:f('2026-10-14')&&f('2026-10-14').wx};});
    T('위젯 자료: 오늘 · 내일만 날씨 (모레는 없음)',!!wg.t&&!!wg.n&&!wg.x,JSON.stringify(wg).slice(0,300));
    T('위젯 날씨 줄 모양 (결론 · 그림 · 기온 · 새로 물어볼 주소)',!!wg.t&&!!wg.t.t&&/^sky\//.test(wg.t.c[0][0])&&wg.t.c[0][1]===10&&/cloudfunctions\.net\/wx\?h=4111160000/.test(wg.t.q)&&wg.t.at>0,JSON.stringify(wg.t));
    // 위젯 날씨 줄 → 앱이 그 날짜 + 날씨 팝업
    await p.evaluate(()=>{window.AndroidBridge.takeOpenDate=()=>{const v=window.__od||'';window.__od='';return v;};window.__od='2026-10-14#wx';window.__widgetSync();});await p.waitForTimeout(400);
    T('위젯 날씨 줄 누름("#wx") → 10/14 날씨 팝업',await p.evaluate(()=>/10월 14일 \(수\) 날씨/.test(document.querySelector('#pop').innerText)&&!!document.querySelector('#pop .wxp.v2')));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 꺼져 있으면 위젯에 날씨 없음
    const p=await boot(b,{...base},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes});
    await p.evaluate(()=>{window.__wg=null;window.AndroidBridge.setWidgetData=j=>{window.__wg=JSON.parse(j);};__wx.save();});await p.waitForTimeout(1500);
    T('날씨를 안 켜면 위젯 자료에 wx 없음',await p.evaluate(()=>!!window.__wg&&window.__wg.days.every(x=>!x.wx)));
    T('오류 없음 (꺼짐)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
