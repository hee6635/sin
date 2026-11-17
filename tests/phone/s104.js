// v0.176: 스티커 떼기 메뉴 · 전부 떼기 · ＋ 없앰 · 다시 붙여도 복사본 없음 · 색이 다른 약 = 새 칸 · 설정 🔔 없음 · 가족 메모 띠 없음 · 위젯 배경화면
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const S=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',from:'',to:'',days:[],dates:[],skip:[],ats:[],...x});
 const pill={id:'p1',kind:'pill',emoji:'💊',name:'약',times:1,color:'#ef4d5a',shape:'caps',rep:'daily',from:'2026-10-01',to:'',days:[],dates:[],skip:[],ats:['08:00']};
 const st={defs:[pill,mk('r1','👟','조깅',{rep:'daily',from:'2026-10-01',ats:['07:00']}),mk('w1','💧','물'),mk('e1','',' ',{empty:true}),mk('e2','',' ',{empty:true})],log:{'2026-10-13':{r1:1}},snap:{},v3:1,v4:1,lastAt:[]};
 const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
 const open=async(p,k)=>{await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell(k));await p.waitForTimeout(350);};
 {const p=await boot(b,{...base,stamps:JSON.parse(JSON.stringify(st))},{touch:true});
  await open(p,'2026-10-13');
  await p.click('#pop .sdr2[data-id="r1"] [data-act="sd-more"]');await p.waitForTimeout(250);
  const m=await p.evaluate(()=>[...document.querySelectorAll('#pop .mi')].map(x=>x.textContent.trim()).join('/'));
  T('⋯ 메뉴: 스티커 떼기 · 이날부터 떼기 · 스티커 전부 떼기(2개 이상)',/스티커 떼기/.test(m)&&/이날부터 떼기/.test(m)&&/전부 떼기/.test(m)&&!/건너뛰기|그만하기/.test(m),m);
  await p.click('#pop [data-act="sd-all"]');await p.waitForTimeout(350);
  let s=await S(p);
  T('전부 떼기: 그날 스티커가 다 빠짐 (기록도) · 다른 날은 그대로',!(await p.$('#pop .sdr2'))&&!((s.stamps.log['2026-10-13']||{}).r1)&&await p.evaluate(c=>!!document.querySelector(c+' .stp>*'),cell('2026-10-14')));
  await p.evaluate(()=>document.querySelector('#toast .tu').click());await p.waitForTimeout(350);
  s=await S(p);T('되돌리기: 다시 붙고 완료 기록도',(s.stamps.log['2026-10-13']||{}).r1===1);
  // 하나만 있는 날은 전부 떼기 없음
  await p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';});
  await p.evaluate(()=>{const d=__wx.S.stamps.defs.find(x=>x.id==='p1');d.skip=['2026-10-15'];__wx.render&&__wx.render();});
  await open(p,'2026-10-15');
  if(await p.$('#pop .sdr2')){await p.click('#pop .sdr2 [data-act="sd-more"]');await p.waitForTimeout(250);}
  T('스티커가 하나뿐인 날엔 전부 떼기 없음',!(await p.$('#pop [data-act="sd-all"]')));
  T('오류 없음(1)',p.errs.length===0,p.errs.join('|'));await p.close();}
 {const p=await boot(b,{...base,stamps:JSON.parse(JSON.stringify(st))},{touch:true});
  await open(p,'2026-10-20');
  await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
  T('고르는 창에 ＋ 없음 (내 스티커만)',!(await p.$('#pop [data-act="sp-plus"]'))&&!!(await p.$('#pop [data-act="sp-pick"][data-id="w1"]')));
  // 물(이날만 · 다른 날 기록 있음)을 다른 횟수로 붙여도 복사본 안 생김
  await p.evaluate(()=>{__wx.S.stamps.defs.find(x=>x.id==='w1').dates=['2026-10-10'];});
  await p.click('#pop [data-act="sp-pick"][data-id="w1"]');await p.waitForTimeout(400);
  await p.evaluate(()=>{const b=document.querySelector('#page [data-act="sr-times"][data-v="2"]');b&&b.click();});await p.waitForTimeout(150);
  await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(400);
  let s=await S(p);const w=s.stamps.defs.filter(x=>x.emoji==='💧');
  T('다시 붙이면 복사본 없이 같은 스티커에 날짜 · 고른 횟수는 그 날만 (v0.188)',w.length===1&&w[0].dates.includes('2026-10-20')&&w[0].times===1&&w[0].tday&&w[0].tday['2026-10-20']===2,JSON.stringify(w));
  // 색이 다른 약 → 빈 칸에 새 약
  await p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';});
  await open(p,'2026-10-20');await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
  await p.click('#pop [data-act="sp-pick"][data-id="p1"]');await p.waitForTimeout(400);
  const cols=await p.evaluate(()=>[...document.querySelectorAll('#page [data-act="sr-col"],#page [data-act="slot-col"],#page [data-act="pill-col"]')].map(x=>x.dataset.v||x.dataset.c));
  const other=cols.find(c=>c&&c.toLowerCase()!=='#ef4d5a');
  if(other){await p.evaluate(v=>{const b=[...document.querySelectorAll('#page [data-act="sr-col"],#page [data-act="slot-col"],#page [data-act="pill-col"]')].find(x=>(x.dataset.v||x.dataset.c)===v);b.click();},other);await p.waitForTimeout(150);}
  await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(400);
  s=await S(p);const pills=s.stamps.defs.filter(x=>x.kind==='pill'&&!x.retired);
  T('색이 다른 약 → 빈 칸에 새 약 (원래 약 색 그대로)',!!other&&pills.length===2&&pills.find(x=>x.id==='p1').color==='#ef4d5a'&&pills.some(x=>x.id!=='p1'&&!x.one&&x.dates.includes('2026-10-20')),JSON.stringify({cols,pills:pills.map(x=>[x.id,x.color,x.name,x.dates])}));
  // 설정 스티커
  await p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';const pg=document.getElementById('page');pg.classList.remove('open');});
  await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.click('[data-act="stk-board"]');await p.waitForTimeout(350);
  T('설정 › 스티커: 🔔 없음 · ＋ 로 붙인 스티커 칸 없음',await p.evaluate(()=>!document.querySelector('#page .stbell')&&!document.querySelector('#page [data-grp="extra"]')&&!document.querySelector('#page').innerText.includes('＋ 로 붙인')));
  T('오류 없음(2)',p.errs.length===0,p.errs.join('|'));await p.close();}
 {// 가족 메모 띠 없음 · 위젯 배경화면
  const p=await boot(b,{...base,memos:{'2026-10-13':[{id:'f1',text:'오카리나공개수업',shared:true,by:'u2',color:'',done:false}]}},{touch:true});
  await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-13"]').click());await p.waitForTimeout(400);
  T('날짜 창에 가족 메모 띠 없음',await p.evaluate(()=>!document.querySelector('#sheet .family-warning-box')));
  await p.evaluate(()=>{window.__wp=[];window.__ws=[];window.AndroidBridge=window.AndroidBridge||{};window.AndroidBridge.showWallpaper=v=>window.__wp.push(v);window.AndroidBridge.widgetPreview=()=>'';window.AndroidBridge.openWidgetStyle=j=>window.__ws.push(j);});
  await p.evaluate(()=>{__wx.closeSheet&&__wx.closeSheet();const x=document.createElement('button');x.dataset.act='more-widget';document.body.appendChild(x);x.click();x.remove();});await p.waitForTimeout(500);
  T('위젯 설정: 앱 화면 투명 방식 안 씀',await p.evaluate(()=>window.__wp.indexOf(true)<0&&!document.documentElement.classList.contains('wpshow')));
  T('미리보기에 "배경화면에서 보기"',await p.evaluate(()=>!!document.querySelector('#wgPv[data-act="wg-style"] .wgpvb')));
  await p.evaluate(()=>document.querySelector('#wgPv').click());await p.waitForTimeout(200);
  T('누르면 폰 위젯 설정 화면 (위젯 자료 넘김)',await p.evaluate(()=>window.__ws.length===1&&JSON.parse(window.__ws[0]).days!=null));
  await p.evaluate(()=>window.__wgStyle(JSON.stringify({theme:'dark',alpha:40,bg:'vivid',look:'circle'})));await p.waitForTimeout(300);
  const w=(await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).widget));
  T('저장하면 앱 설정에 반영',w.theme==='dark'&&w.alpha===40&&w.bg==='vivid'&&w.look==='circle',JSON.stringify(w));
  T('화면도 새 값',await p.evaluate(()=>document.getElementById('wgAv').textContent==='40%'));
  await p.evaluate(()=>window.__wgStyle('{"theme":"x","alpha":"abc"}'));
  T('이상한 값은 무시',(await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).widget)).theme==='dark');
  T('오류 없음(3)',p.errs.length===0,p.errs.join('|'));await p.close();}
 T.sum();await b.close();})();
