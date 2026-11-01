// v0.121 가족 집 위치 (등원 날씨) · 미세먼지 큰 화면 활동 탭
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const fam=[{id:'f1',name:'유찬',kind:'student',label:'유치원',start:'09:00',end:'15:00',vac:[],color:'#ec4899',loc:'41113',home:'41115',
    sdefs:[{id:'m_a',emoji:'🎹',name:'피아노',act:{s:'16:00',e:'17:00',r:'41117'}}],stk:{'2026-10-14':['m_a']}},
    {id:'f2',name:'옛',kind:'student',start:'09:00',end:'15:00',vac:[],color:'#22c55e',home:'xx'}];
  const mk=(r,p10)=>{const h={};for(let d=11;d<=20;d++)for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[12,10,0,1,0,2,50];return {v:1,r,n:'',s:{b:'202610120500',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{'20261014':[2,2],'20261015':[1,1]}},q:{t:'2026-10-14 09:00',p10,p25:Math.round(p10/2),st:r}};};
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({list:[mk('41111',20),mk('41113',40),mk('41115',90),mk('41117',60)]})})]];
  const st={...base,stamps:{...(base.stamps||{}),v3:1,v4:1},family:fam,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{},nm:{'41111':'우리동','41113':'학교동','41115':'할머니동','41117':'학원동'}}};
  const p=await boot(b,st,{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes,touch:true});await p.waitForTimeout(2500);
  T('예전/틀린 집 값은 지움 · 맞는 값은 남김',await p.evaluate(()=>__wx.S.family[0].home==='41115'&&__wx.S.family[1].home===undefined));
  const x=await p.evaluate(()=>{const m=__wx.S.family[0],r=__wx.famWx(m,new Date(2026,9,14));return {hm:r&&r.hm,loc:r&&r.loc,n:r?(r.acts||[]).length:-1,c:JSON.stringify(r&&r.c).slice(0,600)};});
  T('유찬 날씨: 등원 = 유찬 집(할머니동) · 하원 = 학교동 · 활동 1개',x.hm==='41115'&&x.loc==='41113'&&x.n===1&&/팔달구/.test(x.c),JSON.stringify(x));
  await p.evaluate(()=>{__wx.S.family[0];});
  // 날씨 팝업 → 미세먼지 큰 화면
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
  await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(500);
  await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-14"]').click());await p.waitForTimeout(500);
  await p.evaluate(()=>{const e=document.querySelector('#sheet [data-act="man-wx"]')||document.querySelector('#sheet .wxcard');e.click();});await p.waitForTimeout(500);
  const hasDz=await p.evaluate(()=>!!document.querySelector('#pop [data-act="wx-dust"]'));
  T('날씨 팝업에 미세먼지 누를 곳',hasDz);
  if(hasDz){await p.evaluate(()=>document.querySelector('#pop [data-act="wx-dust"]').click());await p.waitForTimeout(400);}
  const tabs=await p.evaluate(()=>[...document.querySelectorAll('#pop .wxd .tabs button')].map(b=>b.innerText.replace(/\s*\n\s*/g,' · ')));
  T('미세먼지 탭 3개: 등원 · 할머니동 / 하원 · 학교동 / 🎹활동 · 학원동',tabs.length===3&&/등원 · 수원시 팔달구/.test(tabs[0])&&/하원 · 수원시 권선구/.test(tabs[1])&&/🎹활동 · 수원시 영통구/.test(tabs[2]),JSON.stringify(tabs));
  const fy=()=>p.evaluate(()=>Math.round(document.querySelector('#pop .wxd img.big').getBoundingClientRect().top));
  const y0=await fy();
  if(tabs.length===3){await p.evaluate(()=>document.querySelectorAll('#pop .wxd .tabs button')[2].click());await p.waitForTimeout(300);
    T('v0.124 탭을 바꿔도 큰 얼굴 높이 그대로 (활동 줄 자리를 늘 남김)',Math.abs(await fy()-y0)<=1,y0);await p.waitForTimeout(300);
    const t=await p.evaluate(()=>document.querySelector('#pop .wxd').innerText.replace(/\s+/g,' '));
    T('활동 탭: "활동 16:00 때" · 학원동 측정소',/활동 16:00 때/.test(t)&&/41117 측정소/.test(t),t.slice(0,300));}
  await p.evaluate(()=>{const e=document.querySelector('#pop [data-act="wx-dust-close"]');if(e)e.click();});await p.waitForTimeout(200);
  await p.evaluate(()=>__wx.closePop&&__wx.closePop());await p.evaluate(()=>__wx.closeSheet&&__wx.closeSheet());await p.waitForTimeout(300);
  // 일정 패턴 화면: 🏠 집 줄
  await p.evaluate(()=>{const e=document.querySelector('[data-act="man-pat"]');if(e)e.click();});await p.waitForTimeout(400);
  const row=await p.evaluate(()=>{const e=document.querySelector('#page [data-act="fe-home"]');return e?e.innerText.replace(/\s+/g,' '):'';});
  T('일정 패턴: 🏠 집 줄 (할머니동)',/집/.test(row)&&/팔달구/.test(row),row);
  // 내 날: 활동 없으면 탭 2개 이하 그대로
  T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();T.sum();await b.close();
})();
