// v0.105 날씨: 시간별 줄(그날 24시간 · 집/직장 · 지금 칸 왼쪽 두 번째) · 지난 출근 칸 · 미세먼지 결론 누르기 · 특보 · 자외선 · 같은 지역으로 · 날짜 창 순서 · 답한 요청 숨김
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
function raw(code,o={}){const h={};for(let d=29;d<=31;d++)for(let x=0;x<24;x++){const k=`202610${p2(d)}${p2(x)}`;if(d===30&&x<o.from)continue;h[k]=[code==='41597'?20+x%3:5+x%5,10,0,x<8?4:1,0,2,50];}
  const out={v:1,r:code,n:'',s:{b:'202610301700',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{'20261030':[1,1]}},q:code==='41597'?{t:'2026-10-30 17:00',p10:90,p25:40,st:'제철동'}:{t:'2026-10-30 17:00',p10:20,p25:6,st:'효곡동'}};
  if(o.alert)out.w={t:'202610301700',l:[['강풍','주의보']]};
  if(o.uv)out.u={b:'2026103006',h:{'2026103009':5,'2026103012':9,'2026103015':7}};
  return out;}
let mode={};
const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());const codes=(u.searchParams.get('r')||'').split(',');const one=c=>raw(c,mode);r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(codes.length>1?{list:codes.map(one)}:one(codes[0]))});}]];
const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
const st0={...base,addons:{...base.addons,wx:true},wx:{home:'4711158000',work:'4711162000',fw:{},nm:{'4711158000':'효곡동','4711162000':'제철동'}}};
const SH=process.env.SHOT||'';
(async()=>{
  const T=mkT();const b=await chromium.launch();
  { // 1) 오늘 18시 (주간 07~19): 출근 지남 · 퇴근 = 직장(미세먼지 나쁨) · 시간별 줄
    mode={from:0};
    const st={...st0,wx:{...st0.wx,work:'41597',nm:{'4711158000':'효곡동'}},requests:[{id:'r1',date:'2026-10-30',by:'guest',want:'휴',st:'rejected',t:1,msg:'a'},{id:'r2',date:'2026-10-31',by:'guest',want:'휴',st:'pending',t:2,msg:'b'}]};
    const p=await boot(b,st,{tz:'Asia/Seoul',T:KST(2026,10,30,18),cfg,routes});await p.waitForTimeout(2600);
    await p.evaluate(()=>__wx.openDay('2026-10-30'));await p.waitForTimeout(300);
    const ord=await p.evaluate(()=>{const sh=document.querySelector('#sheet');const y=s=>{const e=sh.querySelector(s);return e?e.getBoundingClientRect().top:-1;};return {shift:y('.shsec'),wx:y('#wxDay'),memo:y('.memo-sec, .msec, [data-memo], #memoIn')||9999,req:!!sh.querySelector('.req-card, [data-act="rqact"]')&&/근무 요청/.test(sh.innerText)};});
    T('날짜 창 순서: 근무 타입 → 날씨 (근무 타입이 위)',ord.shift>0&&ord.wx>ord.shift,JSON.stringify(ord));
    T('답한(거절) 요청은 날짜 창에 안 보임',!/이 날의 근무 요청/.test(await p.evaluate(()=>document.querySelector('#sheet').innerText)));
    T('날씨 카드(2배): 결론 + 출근 → 퇴근 + 얼굴',await p.evaluate(()=>{const e=document.getElementById('wxDay');return e.classList.contains('wxcard')&&!!e.querySelector('.wb img.f')&&/출근/.test(e.innerText)&&/퇴근/.test(e.innerText);}));
    if(SH)await p.screenshot({path:SH+'b_day.png'});
    await p.click('#wxDay');await p.waitForTimeout(500);
    const pop=await p.evaluate(()=>({t:document.querySelector('#pop').innerText,past:!!document.querySelector('#pop .wxc.past .tag'),k:document.querySelector('#pop .wxk').getAttribute('data-act'),dzRow:!!document.querySelector('#pop .wxrw.dz')}));
    T('지난 출근 칸: 그때 날씨 + "지남"',pop.past&&/출근 07:00/.test(pop.t),pop.t.slice(0,200));
    T('미세먼지가 결론 → 결론을 누르면 큰 화면 · 아래 미세먼지 칸은 없음',/미세먼지 상당히 나쁨/.test(pop.t)&&pop.k==='wx-dust'&&!pop.dzRow,JSON.stringify(pop).slice(0,300));
    const hr=await p.evaluate(()=>{const s=document.querySelector('#pop .wxhs');const hs=[...s.querySelectorAll('.hc')];const now=s.querySelector('.hc.hn');const left=s.getBoundingClientRect().left;const vis=hs.filter(h=>h.getBoundingClientRect().left>=left-2).map(h=>h.innerText.split('\n')[0]);return {n:hs.length,segs:[...s.querySelectorAll('.sg')].map(g=>g.className+':'+g.querySelector('.hl').innerText),vis:vis.slice(0,3),now:now&&now.innerText};});
    T('시간별 줄: 12칸 · 집 → 직장 → 집 구간',hr.n===12&&hr.segs.length===3&&/home/.test(hr.segs[0])&&/work.*직장 · 화성시 동탄구/.test(hr.segs[1])&&/home/.test(hr.segs[2]),JSON.stringify(hr));
    const end=await p.evaluate(()=>{const s=document.querySelector('#pop .wxhs');return s.scrollLeft+s.clientWidth>=s.scrollWidth-2;});
    T('열면 지금 칸이 왼쪽에서 두 번째 (줄 끝이면 끝까지 밀린 채)',(hr.vis[1]&&/지금/.test(hr.vis[1]))||(end&&hr.vis.length>0),JSON.stringify(hr.vis));
    if(SH)await p.screenshot({path:SH+'b_pop.png'});
    await p.click('#pop .wxk[data-act="wx-dust"]');await p.waitForTimeout(300);
    T('결론 눌러 미세먼지 큰 화면',await p.evaluate(()=>document.querySelector('#pop').classList.contains('wxfull')));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 특보 · 자외선
    mode={from:0,alert:1,uv:1};
    const p=await boot(b,{...st0,wx:{...st0.wx,work:''}},{tz:'Asia/Seoul',T:KST(2026,10,30,6),cfg,routes});await p.waitForTimeout(2600);
    await p.evaluate(()=>__wx.openDay('2026-10-30'));await p.waitForTimeout(300);
    const l=await p.evaluate(()=>{const e=document.getElementById('wxDay');return {t:e.innerText,c:e.className,img:e.querySelector('.wa img').getAttribute('src')};});
    T('특보: 날짜 창 결론 = 강풍주의보 (노랑 · 특보 그림)',/강풍주의보/.test(l.t)&&/al1/.test(l.c)&&l.img==='wx/alert/wind.webp',JSON.stringify(l));
    await p.click('#wxDay');await p.waitForTimeout(400);
    const t=await p.evaluate(()=>document.querySelector('#pop').innerText);
    T('자외선 높으면 챙길 것에 선크림',/선크림 \(자외선 매우 높음\)/.test(t),t.slice(0,400));
    T('직장 없으면 시간별 줄 한 줄 (시간별 · 효곡동)',await p.evaluate(()=>{const g=document.querySelectorAll('#pop .wxhs .sg');return g.length===1&&/시간별 · 효곡동/.test(g[0].innerText);}));
    T('특보 그림 · 자외선 그림 파일 있음',await p.evaluate(async()=>{const ok=async u=>{const i=new Image();i.src=u;await new Promise(r=>{i.onload=i.onerror=r;});return i.naturalWidth>0;};return (await ok('wx/alert/wind.webp'))&&(await ok('wx/sky/uv.webp'))&&(await ok('wx/alert/heavy.webp'));}));
    T('오류 없음 (특보)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 3) 같은 지역으로: 가까운 직장 고르면 물어봄 → 같은 지역 → 한 곳 날씨 · 설정 스위치
    mode={from:0};
    const p=await boot(b,{...st0,wx:{home:'4711158000',work:'',fw:{},nm:{'4711158000':'효곡동'}}},{tz:'Asia/Seoul',T:KST(2026,10,30,6),cfg,routes});await p.waitForTimeout(2200);
    await p.evaluate(()=>{__wx.closePage();});await p.evaluate(()=>{window.__wx.openAddonPage();});await p.waitForTimeout(150);
    await p.evaluate(()=>{document.querySelector('[data-act="wx-set"]')?document.querySelector('[data-act="wx-set"]').click():null;});
    await p.evaluate(()=>{const W=window.__wx;W.S.wx.work='';});
    const asked=await p.evaluate(()=>{window.__wxPick&&0;return true;});
    // 직장 고르기 흐름 대신 직접: 가까운 시·군·구(포항 북구) 고르기
    await p.evaluate(()=>{document.querySelector('#page [data-act="wx-pick-work"]')&&document.querySelector('#page [data-act="wx-pick-work"]').click();});await p.waitForTimeout(150);
    await p.click('#pop [data-act="wx-sido"][data-v="경북"]');await p.waitForTimeout(150);
    await p.click('#pop [data-act="wx-sgg"][data-v="47111"]');await p.waitForTimeout(500);
    T('가까운 직장(같은 포항 남구) → "같은 지역으로 볼까요?"',await p.evaluate(()=>/같은 지역으로 볼까요/.test(document.querySelector('#pop').innerText)));
    await p.click('#pop [data-act="wx-one"][data-v="1"]');await p.waitForTimeout(300);
    T('같은 지역으로 → 저장(one) · 직장은 남김 · 설정에 스위치 켜짐',await p.evaluate(()=>{const S=window.__wx.S;return S.wx.one===true&&S.wx.work==='47111'&&!!document.getElementById('wxOne')&&document.getElementById('wxOne').checked;}));
    await p.evaluate(()=>{__wx.closePage();__wx.openDay('2026-10-30');});await p.waitForTimeout(300);await p.click('#wxDay');await p.waitForTimeout(400);
    T('같은 지역: 칸마다 동네 이름 없음 · 시간별 줄 한 줄',await p.evaluate(()=>[...document.querySelectorAll('#pop .wxc .p')].length===0&&document.querySelectorAll('#pop .wxhs .sg').length===1));
    T('저장 후 다시 켜도 one 유지 (normalize)',await p.evaluate(()=>{const raw=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return raw.wx.one===true;}));
    T('오류 없음 (같은 지역)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
