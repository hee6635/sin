// v0.144: 날짜 창 오늘 표시(띠 색 · "오늘" · 제목 누르면 오늘로) · 쉬는 날 다른 날 왼쪽 칸 그림 두 개 · 가족 탭 내 날씨 팝업 옆으로 밀기
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h)=>Date.UTC(y,mo-1,d,h-9);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const TP=[5,5,4,4,4,4,4,5,8,10,12,13,14,14,15,14,13,10,8,7,6,6,5,5];
  const mk=r=>{const h={},n={};for(let d=11;d<=18;d++){for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[TP[x],10,0,d===13&&x<12?3:1,0,2,50];n[`202610${p2(d)}`]=[4,15];}return {v:1,r,n:'',s:{b:'202610120500',h,n},m:{b:'',d:{}},a:{b:'',d:{}},q:null};};
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(u.searchParams.has('past')?{d:{}}:{list:[mk('41111'),mk('41113')]})});}]];
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'41113',fw:{},nm:{}},
    family:[{id:'f1',name:'남편',kind:'shift',team:1,own:true,pat:['주','휴'],patAnchor:'2026-10-12',days:[]}]},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes});
  await p.waitForTimeout(2200);
  // 1) 내 날짜 창
  await p.evaluate(()=>__wx.openDay('2026-10-12'));await p.waitForTimeout(500);
  const a=await p.evaluate(()=>{const s=document.querySelector('#sheet.open');return {td:[...s.querySelectorAll('.dsi.td')].map(x=>x.dataset.k),tdy:!!s.querySelector('#sheet.open .dft .tdy'),act:s.querySelector('.dft').dataset.act||'',hint:!!s.querySelector('.dft .tgo')};});
  T('오늘 볼 때: 띠의 12일 색 · "오늘" 표 · 안내 없음 · 눌러도 그대로',a.td.includes('2026-10-12')&&a.tdy&&!a.act&&!a.hint,JSON.stringify(a));
  await p.evaluate(()=>{__wx.closeSheet();__wx.openDay('2026-10-15');});await p.waitForTimeout(500);
  const o=await p.evaluate(()=>{const s=document.querySelector('#sheet.open');return {td:[...s.querySelectorAll('.dsi.td')].map(x=>x.dataset.k),tdy:!!s.querySelector('.dft .tdy'),h:(s.querySelector('.dft .tgo')||{}).textContent||''};});
  T('다른 날: 띠에 오늘(12일)만 색 · "오늘" 없음 · "날짜를 누르면 오늘(12일)로"',o.td.length===1&&o.td[0]==='2026-10-12'&&!o.tdy&&/오늘\(12일\)로/.test(o.h),JSON.stringify(o));
  await p.click('#sheet.open .dft');await p.waitForTimeout(600);
  T('제목 누르면 오늘 날짜 창',await p.evaluate(()=>/10월 12일/.test(document.querySelector('#sheet.open .dft b').textContent)));
  // 2) 가족 날짜 창도
  await p.evaluate(()=>__wx.closeSheet());
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
  // 3) 가족 탭 내 날씨 → 날씨 탭과 같은 팝업 (밀기 판)
  await p.evaluate(()=>{const x=document.querySelector('.nc.w.fc2 .mwx[data-act="wx-fam"]');x&&x.click();});await p.waitForTimeout(400);
  const m=await p.evaluate(()=>({sw:!!document.querySelector('#pop.open .wxdpop .swc'),t:(document.querySelector('#pop.open')||{}).innerText||''}));
  T('가족 탭 내 날씨 팝업: 옆으로 미는 판',m.sw&&/10월 12일/.test(m.t),JSON.stringify({sw:m.sw,t:m.t.slice(0,60)}));
  await p.evaluate(()=>__wx.closePop());
  // 4) 쉬는 날 다른 날 왼쪽 칸
  await p.evaluate(()=>__wx.wxOpenDay('2026-10-13'));await p.waitForTimeout(500);
  const c=await p.evaluate(()=>{const c=document.querySelector('#pop .wxcs .wxc'),r=c.getBoundingClientRect(),ov=[...c.querySelectorAll('*')].filter(e=>{const q=e.getBoundingClientRect();return q.width&&(q.right>r.right+1||q.left<r.left-1);}).length;return {n:c.querySelectorAll('.s img').length,ar:!!c.querySelector('.s .ar'),big:!!c.querySelector('.big'),d:c.querySelector('.d').textContent,ov};});
  T('다른 날 왼쪽: 그림 두 개(→) · 한 줄 "흐림 → 맑음" · 칸 밖으로 안 나감',c.n===2&&c.ar&&!c.big&&/→/.test(c.d)&&c.ov===0,JSON.stringify(c));
  await p.evaluate(()=>{__wx.closePop();__wx.wxOpenDay('2026-10-17');});await p.waitForTimeout(500);
  const s=await p.evaluate(()=>{const c=document.querySelector('#pop .wxcs .wxc');return c?{n:c.querySelectorAll('.s img').length,d:c.querySelector('.d').textContent}:null;});
  T('하루 종일 같으면 그림 하나 · "하루 종일 맑음"',s&&(s.n===1&&/하루 종일/.test(s.d)),JSON.stringify(s));
  T('오류 없음',p.errs.filter(x=>!/Failed to load/.test(x)).length===0,p.errs.join('|'));await p.close();
  T.sum();await b.close();})();
