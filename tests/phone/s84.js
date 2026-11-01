// v0.126 묶음: 오늘 버튼(유찬 달력) · 동그라미 모양 오늘 색 · 알람 위쪽 한 줄 · 알람 화면 문구 · 스티커 상세 조건 접기 · 안내 줄 처음만 · 12시간제
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
  const fam=[{id:'f1',name:'유찬',kind:'student',label:'유치원',start:'09:00',end:'15:00',vac:[],color:'#ec4899'}];
  const memos={'2026-10-18':[{id:'a1',text:'9시 지게차 교육',t:1}]};
  const alarms=[{id:'al1',on:true,shift:'주',time:'05:30',label:'',days:[],sound:true}];
  const p=await boot(b,{...base,family:fam,memos,alarms,calLook:'circle'},{touch:true});
  await p.evaluate(()=>{window.__al=[];window.AndroidBridge.setAlarms=j=>window.__al.push(JSON.parse(j));});
  // 12시간제
  // 유찬 달력 오늘 버튼
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
  await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(400);
  T('유찬 달력: 이번 달엔 [오늘] 없음',await p.evaluate(()=>!document.querySelector('#page .vcnav [data-act="vc-today"]')));
  await p.evaluate(()=>document.querySelector('#page [data-act="vc-next"]').click());await p.waitForTimeout(300);
  T('다른 달이면 [오늘] → 누르면 이번 달',await p.evaluate(()=>{const e=document.querySelector('#page .vcnav [data-act="vc-today"]');if(!e)return false;e.click();return true;})&&await p.evaluate(()=>/2026\.10/.test(document.querySelector('#page .vcnav b').textContent)));
  await p.evaluate(()=>__wx.closePop&&__wx.closePop());await p.evaluate(()=>{const b=document.querySelector('#page [data-act="back"],#page .bk');if(b)b.click();});await p.waitForTimeout(300);
  // 오늘 색 (동그라미 모양)
  await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);
  const lookOpen=await p.evaluate(()=>{const e=[...document.querySelectorAll('[data-act]')].find(x=>/달력 모양|화면/.test(x.innerText)&&/look|disp|screen/.test(x.dataset.act));if(e){e.click();return e.dataset.act;}return '';});await p.waitForTimeout(400);
  T('동그라미 모양에서도 오늘 표시 색 줄',await p.evaluate(()=>!!document.querySelector('.tdc-line')),lookOpen);
  await p.evaluate(()=>{const e=document.querySelector('.tdc-line [data-act="todaycolor"]:not([data-v=""]):not([data-v="shift"])');if(e)e.click();});await p.waitForTimeout(300);
  T('색 고르면 data-tdc · 오늘 칸 테두리 색',await p.evaluate(()=>document.documentElement.hasAttribute('data-tdc')));
  // 알람 탭 한 줄
  await p.click('#nav [data-tab="alarm"]').catch(()=>{});await p.waitForTimeout(400);
  const al=await p.evaluate(()=>({one:(document.querySelector('.anext1')||{}).innerText||'',big:!!document.querySelector('.anext')}));
  T('알람 탭 위쪽: 한 줄 "다음 알람 · … 오전 5:30 · … 후"',/다음 알람/.test(al.one)&&/오전 5:30/.test(al.one)&&/후/.test(al.one)&&!al.big,JSON.stringify(al));
  // 알람 문구
  await p.evaluate(()=>window.__refresh&&window.__refresh());await p.waitForTimeout(800);
  const msg=await p.evaluate(()=>{const l=window.__al[window.__al.length-1]||[];return l.slice(0,6).map(x=>[x.id,x.msg]);});
  T('알람 문구: 메모 있는 날 = "📝 오늘 · 9시 지게차 교육"',msg.some(([id,m])=>/2026-10-18/.test(id)&&/📝 오늘 · 9시 지게차 교육/.test(m||'')),JSON.stringify(msg));
  T('알람 문구: 나머지 날도 한 줄 (근무 흐름 · 응원)',msg.every(([,m])=>typeof m==='string'&&m.length>0),JSON.stringify(msg));
  // 스티커 상세 조건 접기
  await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"] .stz').click());await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelector('#pop [data-act="sp-pick"]').click());await p.waitForTimeout(400);
  await p.evaluate(()=>document.querySelector('#page [data-act="sr-rep"][data-v="daily"]').click());await p.waitForTimeout(300);
  const r0=await p.evaluate(()=>({more:!!document.querySelector('#page .srmore'),hol:!!document.getElementById('srHol'),alarm:!!document.getElementById('srAlarm')}));
  T('스티커 등록: 기본은 몇 번 · 얼마나 · 알림 / 기간 · 공휴일은 "상세 조건 더보기"에 접힘',r0.more&&!r0.hol&&r0.alarm,JSON.stringify(r0));
  await p.evaluate(()=>document.querySelector('#page [data-act="sr-more"]').click());await p.waitForTimeout(300);
  await p.evaluate(()=>{const c=document.getElementById('srHol');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});
  await p.evaluate(()=>document.querySelector('#page [data-act="sr-more"]').click());await p.waitForTimeout(300);
  T('펼쳐서 공휴일 빼기 켜고 접으면 요약에 보임',await p.evaluate(()=>/공휴일 빼기/.test(document.querySelector('#page .srmore').innerText)));
  await p.evaluate(()=>{const b=document.querySelector('#page [data-act="sr-back"]');if(b)b.click();});await p.waitForTimeout(300);
  // 안내 줄: 내 메모 3개 전까지만
  await p.evaluate(()=>{__wx.closePop&&__wx.closePop();__wx.openDay('2026-10-14');});await p.waitForTimeout(400);
  T('내 메모 1개: 안내 줄 보임',await p.evaluate(()=>!!document.querySelector('#sheet .ibar .note')));
  await p.evaluate(()=>{__wx.S.memos['2026-10-16']=[{id:'a2',text:'x',t:2},{id:'a3',text:'y',t:3}];__wx.closeSheet();__wx.openDay('2026-10-14');});await p.waitForTimeout(400);
  T('내 메모 3개부터: 안내 줄 없음 · 입력칸 "🔒 나만 보는 메모"',await p.evaluate(()=>!document.querySelector('#sheet .ibar .note')&&document.getElementById('memoInput').placeholder==='🔒 나만 보는 메모'));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));
  T.sum();await b.close();})();
