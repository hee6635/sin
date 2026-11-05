// v0.135 묶음: 근무 바뀐 기록(각자 폰) · 처음 안내(말풍선) · 이럴 땐 이렇게 자세히 · 한 번만 알람 → 원래 알람 그날만 건너뛰기 · 포스트잇 크게 보기 · 설정 네모 칸 · 스티커 그만하기
const {chromium,boot,mkT,base}=require('./lib.js');
const fs=require('fs');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const act=(p,a,ds={})=>p.evaluate(([a,ds])=>{const x=document.createElement('button');x.dataset.act=a;Object.assign(x.dataset,ds);document.body.appendChild(x);x.click();x.remove();},[a,ds]);
  { // 1) 근무 바뀐 기록: 내가 바꾼 것 · 소식 탭 · 백업 · 잘못된 기록은 버림
    const p=await boot(b,{...base,chLog:[{t:Date.now()-864e5,k:'2026-10-20',w:'아빠',a:'accepted',f:'',to:'',want:'휴무'},{t:'x',k:'bad'},{t:1,k:'2026-01-01',w:'옛날',a:'chg'},'junk']});
    await p.waitForTimeout(500);
    T('잘못된 기록은 버리고 읽음',await p.evaluate(()=>__wx.S.chLog.length>=1&&__wx.S.chLog.every(x=>typeof x.t==='number'&&/^\d{4}-/.test(x.k))),JSON.stringify(await p.evaluate(()=>__wx.S.chLog)));
    await p.evaluate(()=>{__wx.S.overrides['2026-10-15']='휴';__wx.save();});
    const L=await p.evaluate(()=>__wx.S.chLog.filter(x=>x.w==='나'));
    T('내가 근무를 바꾸면 기록 (며칠 · 무엇 → 무엇)',L.length===1&&L[0].k==='2026-10-15'&&L[0].to==='휴무',JSON.stringify(L));
    await p.evaluate(()=>__wx.save());
    T('그냥 저장은 기록 안 늘어남',await p.evaluate(()=>__wx.S.chLog.filter(x=>x.w==='나').length===1));
    T('백업에 근무 기록 포함',await p.evaluate(()=>Array.isArray(__wx.backupData().chLog)));
    await p.evaluate(()=>__wx.openFeed());await p.waitForTimeout(300);
    await p.click('#sheet [data-act="feed-tab"][data-v="log"]');await p.waitForTimeout(300);
    const t=await p.evaluate(()=>(document.querySelector('#sheet .chlog')||{}).innerText||'');
    T('소식 › 근무 기록 탭: 내 변경 + 가족 요청 수락',/나 · 10\/15/.test(t)&&/휴무/.test(t)&&/수락/.test(t),t.replace(/\s+/g,' '));
    await p.click('#sheet .chlog .ev');await p.waitForTimeout(400);
    T('기록을 누르면 그 날짜 창',await p.evaluate(()=>/15일/.test((document.querySelector('#sheet.open')||{}).innerText||'')));
    T('오류 없음 (근무 기록)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 처음 안내: 달력 3단계 · 건너뛰기 저장 · 다시 보기
    const p=await boot(b,{...base,hints:{}},{coach:true});await p.waitForTimeout(1300);
    const g=()=>p.evaluate(()=>{const e=document.querySelector('#tutx .bub');return e?e.innerText.replace(/\s+/g,' '):'';});
    T('처음 달력: 1/3 "날짜 윗부분" 말풍선',/윗부분/.test(await g())&&/1 \/ 3/.test(await g()),await g());
    T('안내 중엔 뒤 화면이 안 눌림',await p.evaluate(()=>{const r=document.querySelector('#tutx').getBoundingClientRect();return r.width>=innerWidth-1&&r.height>=innerHeight-1;}));
    await p.click('#tutx .nx');await p.waitForTimeout(200);
    T('다음 → 2/3 "아랫부분"',/아랫부분/.test(await g()));
    await p.click('#tutx .sk');await p.waitForTimeout(200);
    T('건너뛰기 → 닫힘 · 다시 안 뜸(저장)',!(await g())&&await p.evaluate(()=>__wx.S.hints.tcal===1));
    await p.evaluate(()=>__wx.render());await p.waitForTimeout(900);
    T('다시 그려도 안 뜸',!(await g()));
    await act(p,'coach-again');await p.waitForTimeout(1000);
    T('이럴 땐 이렇게 "처음 안내 다시 보기" → 다시 뜸',/윗부분/.test(await g()));
    T('오류 없음 (처음 안내)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 3) 이럴 땐 이렇게 자세히 · 한 번만 알람 → 원래 알람 그날만 건너뛰기
    const p=await boot(b,{...base,alarms:[{id:'al1',on:true,shift:'주',time:'07:00',label:'주간 출근',days:[],sound:true}]});
    await act(p,'tips-open');await p.waitForTimeout(400);
    const tp=await p.evaluate(()=>{const t=[...document.querySelectorAll('.tips .tip')].find(x=>/내일 하루만/.test(x.textContent));return t?{d:!!t.querySelector('ol.tds'),img:[...t.querySelectorAll('img')].map(i=>i.getAttribute('src')),n:document.querySelectorAll('.tips ol.tds').length}:null;});
    T('팁 10개 자세히 (이럴 때 · 단계 · 사진)',tp&&tp.d&&tp.n===10&&tp.img.length===2,JSON.stringify(tp));
    T('팁 사진 파일이 앱에 있음',tp&&tp.img.every(s=>fs.existsSync('/home/user/sin/app/src/main/assets/'+s)));
    const all=await p.evaluate(()=>[...document.querySelectorAll('.tips img')].map(i=>i.getAttribute('src')));
    T('모든 팁 사진 파일 있음 (8장)',all.length>=8&&all.every(s=>fs.existsSync('/home/user/sin/app/src/main/assets/'+s)),JSON.stringify(all.filter(s=>!fs.existsSync('/home/user/sin/app/src/main/assets/'+s))));
    await p.evaluate(()=>{const x=document.querySelector('#page.open [data-act="page-close"]');x&&x.click();});
    await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(300);
    await p.click('#top [data-act="aadd"]');await p.waitForTimeout(400);
    await p.evaluate(()=>{const s=document.getElementById('aRepeat');s.checked=false;s.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(200);
    await p.click('#page.open [data-act="asave"]');await p.waitForTimeout(600);
    const q=await p.evaluate(()=>(document.querySelector('#pop')||{}).innerText||'');
    T('한 번만 알람 저장 → "그날 오전 7:00 주간 출근도 울려요. 그날만 건너뛸까요?"',/주간 출근도 울려요/.test(q)&&/건너뛸까요/.test(q),q.replace(/\s+/g,' '));
    await p.click('#pop [data-act="askip-day"]');await p.waitForTimeout(300);
    const sk=await p.evaluate(()=>{const a=__wx.S.alarms.find(x=>x.id==='al1'),o=__wx.S.alarms.find(x=>x.once);return {sk:a.skipAt,o:!!o,txt:(document.querySelector('#view')||{}).innerText||''};});
    T('그날만 건너뛰기 → 원래 알람 그날 건너뜀 · 카드에 "건너뜀 · 되돌리기"',sk.sk>0&&sk.o&&/건너뜀/.test(sk.txt),JSON.stringify({sk:sk.sk,o:sk.o}));
    T('오류 없음 (팁 · 알람)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 4) 포스트잇 크게 보기 · 설정 네모 칸 · 부가 기능 칸
    const k='2026-10-12';
    const p=await boot(b,{...base,board:{'2026-10':[{id:'p1',type:'list',title:'장보기',lines:[{id:'l1',text:'우유',done:false,doneBy:''},{id:'l2',text:'빵',done:false,doneBy:''}],text:'',shared:false,by:'host',color:'y',repeat:false,dateAuto:true,date:k,reacts:{},torn:false,tornAt:0,t:Date.UTC(2026,9,3)}]}});
    await p.click('#top .pi-btn');await p.waitForTimeout(500);
    await p.evaluate(()=>{const c=document.querySelector('[data-act="pi-open"][data-id="p1"]');c&&c.click();});await p.waitForTimeout(400);
    T('할 일 포스트잇을 누르면 크게 보기 (줄 · 수정하기)',await p.evaluate(()=>!!document.querySelector('.pi-view')&&document.querySelectorAll('.pi-view [data-act="pi-vcheck"]').length===2&&!!document.querySelector('[data-act="pi-vedit"]')));
    for(let i=0;i<2;i++){await p.evaluate(i=>{const x=document.querySelectorAll('.pi-view [data-act="pi-vcheck"]')[i];x&&x.click();},i);await p.waitForTimeout(250);}
    const pi=await p.evaluate(()=>{const n=__wx.S.board['2026-10'][0];return {d:n.lines.every(l=>l.done)};});
    T('크게 보기에서 줄 체크 → 저장',pi.d,JSON.stringify(pi));
    await p.evaluate(()=>{__wx.closePop&&__wx.closePop();__wx.closeSheet&&__wx.closeSheet();});
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(400);
    const st=await p.evaluate(()=>({n:document.querySelectorAll('#view .stiles [data-act]').length,rows:document.querySelectorAll('#view .mi2').length}));
    T('설정: 네모 칸들 (목록 줄 없음)',st.n>=10,JSON.stringify(st));
    await act(p,'more-addons');await p.waitForTimeout(400);
    const ad=await p.evaluate(()=>document.querySelectorAll('#page.open .stiles.adt [data-act="ad-tile"]').length);
    T('부가 기능: 칸 + 스위치',ad>=5,ad);
    T('오류 없음 (포스트잇 · 설정)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();})();
