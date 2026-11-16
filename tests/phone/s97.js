// v0.158: 남은 화면 새 모양 (가족 추가 · 일정 패턴 · 가족 스티커 · 메모 자세히 · 처음 안내) · 포스트잇 끌어서 순서 · 옛 화면 지움
const {chromium,boot,mkT,base}=require('./lib.js');
const SHOT=process.env.SHOT||'';
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const fam=[{id:'f1',name:'유찬',color:'#f59e0b',kind:'student',days:[1,2,3,4,5],start:'08:30',end:'15:00',holOff:true,vac:[]}];
  const board={'2026-10':[{id:'pa',type:'note',text:'첫째',t:1,by:'host',color:'y'},{id:'pb',type:'note',text:'둘째',t:2,by:'host',color:'g'},{id:'pc',type:'note',text:'셋째',t:3,by:'host',color:'b'}]};
  const p=await boot(b,{...base,family:fam,board});
  const shot=async n=>{if(SHOT)await p.screenshot({path:`${SHOT}/${n}.png`});};
  const act=async(a,ds={})=>p.evaluate(([a,ds])=>{const x=document.createElement('button');x.dataset.act=a;Object.assign(x.dataset,ds);document.body.appendChild(x);x.click();x.remove();},[a,ds]);
  // 가족 추가
  await act('fam-add');await p.waitForTimeout(300);await shot('fe-new');
  let r=await p.evaluate(()=>({np:!!document.querySelector('#page .pg-b.np.feb'),k:document.querySelectorAll('#page .fk2 button .npi svg').length,cam:!!document.querySelector('#page .fe-cam svg'),pat:!!document.querySelector('#page [data-act="fe-pat"]'),txt:document.querySelector('#page').innerText}));
  T('가족 추가: 새 모양 · 평소 일정 4칸 선 아이콘 · 사진 카메라 · 일정 패턴 줄',r.np&&r.k===4&&r.cam&&r.pat,JSON.stringify(r).slice(0,200));
  T('가족 추가: 설명 글 없음',!/요일 · 출퇴근 시간|항상 같이 가능|주말 · 공휴일/.test(r.txt),r.txt);
  await p.click('#page [data-act="fe-kind"][data-v="shift"]');await p.waitForTimeout(200);
  r=await p.evaluate(()=>[...document.querySelectorAll('#page .npseg [data-act="fe-own"]')].length);
  T('교대 근무를 고르면 같은 교대 / 직접 패턴 두 칸',r===2,String(r));
  await p.click('#page [data-act="fe-kind"][data-v="office"]');await p.waitForTimeout(200);
  await p.click('#page [data-act="fe-pat"]');await p.waitForTimeout(300);await shot('fe-pat');
  r=await p.evaluate(()=>({np:!!document.querySelector('#page .pg-b.np'),add:!!document.querySelector('#page .addr[data-act="fe-ftadd"]'),era:!!document.querySelector('#page [data-act="fe-era-add"] .npi'),hol:!!document.querySelector('#page #feHol'),days:document.querySelectorAll('#page [data-act="fe-day"]').length}));
  T('일정 패턴: 새 모양 · 종류 더하기 · 이 날부터 새 일정 · 공휴일 스위치 · 요일',r.np&&r.add&&r.era&&r.hol&&r.days===7,JSON.stringify(r));
  await p.evaluate(()=>{document.querySelector('#feHol').checked=false;});await p.click('#page [data-act="fp-done"]');await p.waitForTimeout(300);
  await p.fill('#feName','엄마');await p.click('#page [data-act="fe-save"]');await p.waitForTimeout(300);
  r=await p.evaluate(()=>{const m=__wx.S.family.find(x=>x.name==='엄마');return m?[m.kind,m.holOff]:null;});
  T('저장: 이름 · 종류 · 공휴일 스위치 값이 들어감',r&&r[0]==='office'&&r[1]===false,JSON.stringify(r));
  // 가족 고치기 (학생)
  await p.evaluate(()=>{__wx.closePage();});
  // 가족 스티커
  await act('fam-mancal',{id:'f1'});await p.waitForTimeout(300);
  await p.evaluate(()=>{__wx.closeSheet();});
  await act('mstk-page');await p.waitForTimeout(300);
  r=await p.evaluate(()=>({np:!!document.querySelector('#page .pg-b.np .mstgrid'),add:!!document.querySelector('#page .npadd svg'),cap:(document.querySelector('#page .pg-cap')||{}).innerText||''}));
  await shot('man-stk');
  T('가족 스티커: 새 모양 · 개수 · 더하기 칸',r.np&&r.add&&/스티커/.test(r.cap),JSON.stringify(r));
  await p.evaluate(()=>{__wx.closePage();});
  // 메모 자세히
  await p.evaluate(()=>{__wx.openDay('2026-10-14');});await p.waitForTimeout(300);
  await p.evaluate(()=>{const i=document.querySelector('#sheet .mdet2,#sheet [data-act="memo-detail"]');if(i)i.click();});await p.waitForTimeout(300);
  r=await p.evaluate(()=>({pm:__wx.page.pageMode,np:!!document.querySelector('#page .mdpg'),rows:document.querySelectorAll('#page .mdpg .prow .npi').length,seg:document.querySelectorAll('#page .mdshare [data-act="md-share"]').length,txt:(document.querySelector('#page')||{}).innerText||''}));
  await shot('memo');
  T('메모 자세히: 새 모양 · 할 일/시간/반복 줄 · 나만/가족에게',r.pm==='memodetail'&&r.np&&r.rows>=3&&r.seg===2,JSON.stringify(r).slice(0,200));
  T('메모 자세히: "입력칸에 쓰는…" 설명 없음',!/입력칸에 쓰는/.test(r.txt),r.txt);
  await p.evaluate(()=>{__wx.closePage();__wx.closeSheet();});
  // 포스트잇 끌어서 순서
  await act('open-board');await p.waitForTimeout(400);
  const ord=()=>p.evaluate(()=>[...document.querySelectorAll('#page .pi[data-id]')].map(x=>x.dataset.id).join(''));
  T('포스트잇 처음 순서 = 쓴 순서',(await ord())==='papbpc',await ord());
  const bx=async id=>p.evaluate(id=>{const r=document.querySelector(`#page .pi[data-id="${id}"]`).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r.height];},id);
  const [ax,ay]=await bx('pc'),[tx,ty,th]=await bx('pa');
  await p.mouse.move(ax,ay);await p.mouse.down();await p.waitForTimeout(600);
  const lift=await p.evaluate(()=>!!document.querySelector('.pi-ghost'));
  await p.mouse.move(tx,ty-th/4,{steps:8});await p.waitForTimeout(100);await p.mouse.up();await p.waitForTimeout(500);
  T('길게 눌러 들어 올림',lift);
  T('끌어 놓으면 순서가 바뀜 (셋째 → 맨 앞)',(await ord())==='pcpapb',await ord());
  T('바뀐 순서가 저장됨 · 포스트잇이 열리지 않음',JSON.stringify((await p.evaluate(()=>__wx.S.piOrder))['2026-10'])==='["pc","pa","pb"]'&&(await p.evaluate(()=>__wx.page.pageMode))==='board');
  await p.mouse.move(tx,ty);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(300);
  T('짧게 누르면 그대로 열림',(await p.evaluate(()=>!!document.querySelector('.pi.big')))||(await p.evaluate(()=>__wx.page.pageMode))!=='board');
  await p.evaluate(()=>{__wx.closePop&&__wx.closePop();__wx.closePage();});
  // 옛 화면 지움 · 가족 탭에 가족 추가 버튼 없음
  r=await p.evaluate(()=>['openStatusPage','openTimesPage','openFamilyPage','openStickerBoard'].filter(n=>typeof window[n]==='function'));
  T('옛 화면 함수 없음',r.length===0,r.join());
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
  r=await p.evaluate(()=>!!document.querySelector('#view .fsec [data-act="fam-add"]'));
  T('가족 탭 시간표 제목에 "+ 가족 추가" 없음',!r);
  T('오류 없음',p.errs.length===0,p.errs.join('|'));
  await b.close();
  // 처음 안내
  const b2=await chromium.launch();const q=await boot(b2,null);
  r=await q.evaluate(()=>({n:document.querySelectorAll('#onboard .choice .ic svg').length,e:[...document.querySelectorAll('#onboard .choice .ic')].map(x=>x.textContent.trim()).join('')}));
  if(SHOT)await q.screenshot({path:`${SHOT}/onboard.png`});
  T('처음 안내: 이모지 대신 선 아이콘 4개',r.n===4&&r.e==='',JSON.stringify(r));
  T('처음 안내 오류 없음',q.errs.length===0,q.errs.join('|'));
  await b2.close();T.sum();
})();
