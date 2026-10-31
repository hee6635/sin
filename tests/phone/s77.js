// v0.114 스티커 활동 (학원 · 취미 · 동아리): 활동 시간 · 근무 겹침 빼기 · 끝나면 자동 완료 · 날씨 3칸(시간 순서) · 가족 활동
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const sw={id:'s_sw',kind:'mark',emoji:'🏊',name:'수영',times:1,rep:'dow',days:[1,3,5],dates:[],skip:[],ats:[],act:{s:'19:00',e:'20:00',r:'',since:'2026-10-01'}};
  const mine={...base,anchor:'2026-10-12',shiftTimes:{'주':{start:'07:00',end:'18:00'},'야':{start:'19:00',end:'07:00'}},stamps:{defs:[sw],log:{},v3:1,v4:1}};
  // 예보: 14일 20시 비 · 17시 비
  const h={};for(let d=11;d<=16;d++)for(let x=0;x<24;x++){const rain=x===17||x===20;h[`202610${p2(d)}${p2(x)}`]=[12,rain?80:10,rain?1:0,rain?4:1,rain?2:0,2,50];}
  const raw={v:1,r:'41111',n:'',s:{b:'202610120500',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{}},q:null};
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(raw)})]];
  { // 근무 겹침 · 자동 완료
    const p=await boot(b,mine,{tz:'Asia/Seoul',T:KST(2026,10,12,21)});
    const r=await p.evaluate(()=>{const s=__wx.S.stamps.defs.find(x=>x.id==='s_sw');const o={};['2026-10-02','2026-10-05','2026-10-07','2026-10-09','2026-10-12'].forEach(k=>o[k]=[__wx.stampPlanned(s,k),__wx.shiftOf?'':'' ]);return {pl:Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v[0]])),log:__wx.S.stamps.log,act:s.act};});
    T('활동 시간이 저장된 채로 켜짐',r.act&&r.act.s==='19:00'&&r.act.e==='20:00');
    T('근무(야간 19시~)와 겹치는 월·금은 빠짐 · 주간 날은 깔림',r.pl['2026-10-02']&&r.pl['2026-10-07']&&!r.pl['2026-10-05']&&!r.pl['2026-10-09'],JSON.stringify(r.pl));
    T('끝 시간(20시) 지난 날은 자동 완료 (오늘 21시 포함)',!!(r.log['2026-10-02']&&r.log['2026-10-07']&&r.log['2026-10-12']),JSON.stringify(r.log));
    await p.evaluate(()=>{delete __wx.S.stamps.log['2026-10-12'];__wx.actAuto();});
    T('자동 완료를 풀면 다시 채우지 않음',await p.evaluate(()=>!__wx.S.stamps.log['2026-10-12']));
    T('오류 없음 (자동 완료)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 끝나기 전엔 완료 안 됨
    const p=await boot(b,mine,{tz:'Asia/Seoul',T:KST(2026,10,12,19,30)});
    T('끝나기 전(19:30)엔 오늘은 아직',await p.evaluate(()=>!__wx.S.stamps.log['2026-10-12']&&!!__wx.S.stamps.log['2026-10-07']));
    await p.close();
  }
  { // 날씨: 출근 · 퇴근 · 수영 3칸 (시간 순서) · 결론 "수영 끝날 때 비"
    const p=await boot(b,{...mine,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{}}},{tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes});await p.waitForTimeout(2500);
    const days=await p.evaluate(()=>{const s=__wx.S.stamps.defs.find(x=>x.id==='s_sw'),o={};for(let i=12;i<=16;i++){const d=new Date(2026,9,i),k='2026-10-'+i;o[i]={pl:__wx.stampPlanned(s,k),work:!!__wx.wxMyWin(d)};}return o;});
    const wd=Object.keys(days).find(i=>days[i].pl&&days[i].work),rd=Object.keys(days).find(i=>days[i].pl&&!days[i].work),nd=Object.keys(days).find(i=>!days[i].pl&&days[i].work);
    const card=i=>p.evaluate(i=>{const x=__wx.wxMine(new Date(2026,9,+i),Date.now());return x?{l:(x.c||[]).map(v=>v.l),k:x.k&&x.k.t,s:x.k&&x.k.s}:null;},i);
    const c=wd?await card(wd):null;
    T(`근무 날(${wd}일) 3칸: 출근 → 퇴근 → 수영 (시간 순서)`,!!c&&c.l.length===3&&/^출근/.test(c.l[0])&&/^퇴근/.test(c.l[1])&&/^수영 20:00/.test(c.l[2]),JSON.stringify([days,c]));
    T('결론: 출퇴근은 맑고 수영 끝날 때 비 → "수영 끝날 때 비 와요 · 우산"',!!c&&c.k==='수영 끝날 때 비 와요'&&/우산/.test(c.s),JSON.stringify(c));
    const r2=rd?await card(rd):null;
    T(`쉬는 날(${rd}일) 활동이 있으면 활동 칸만`,!!r2&&r2.l.length===1&&/^수영/.test(r2.l[0])&&r2.k==='수영 끝날 때 비 와요',JSON.stringify(r2));
    const c2=nd?await card(nd):null;
    T(`활동 없는 근무 날(${nd}일)은 출근 · 퇴근 2칸 그대로`,!!c2&&c2.l.length===2,JSON.stringify(c2));
    // 편집 화면: 접는 칸 · 시간 넣으면 알림 30분 전
    await p.evaluate(()=>__wx.openStampReg('2026-10-14','s_sw','day'));await p.waitForTimeout(400);
    T('스티커 편집: 활동 칸 (이미 정한 활동은 펼쳐짐 · 19:00 ~ 20:00)',await p.evaluate(()=>!!document.getElementById('srAS')&&/19:00 ~ 20:00/.test(document.querySelector('.actf').innerText)));
    await p.evaluate(()=>{const s=document.getElementById('srAS');s.value='18:30';s.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(300);
    T('시작을 바꾸면 길이 그대로 끝도 (18:30 ~ 19:30) · 알림 18:00 미리 채움',await p.evaluate(()=>document.getElementById('srAE').value==='19:30'&&!!document.getElementById('srAt0')&&document.getElementById('srAt0').value==='18:00'));
    await p.evaluate(()=>document.querySelector('[data-act="sr-save"]').click());await p.waitForTimeout(400);
    T('저장: 활동 18:30~19:30 · 알림 18:00',await p.evaluate(()=>{const s=__wx.S.stamps.defs.find(x=>x.id==='s_sw');return s.act.s==='18:30'&&s.act.e==='19:30'&&s.ats[0]==='18:00'&&s.act.since==='2026-10-01';}));
    T('오류 없음 (날씨 · 편집)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 가족(유찬) 활동: 요일 · 시간 → 자동으로 깔림 · 지금 활동 중 · 끝날 때 비
    const fam=[{id:'f1',name:'유찬',kind:'student',vac:[],color:'#ec4899',sdefs:[{id:'m_pi',emoji:'🎹',name:'피아노',act:{days:[1,3,5],s:'16:00',e:'17:00',r:'',since:'2026-10-01'}},{id:'m_t',emoji:'🦷',name:'양치'}]}];
    const p=await boot(b,{...base,family:fam,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{}}},{tz:'Asia/Seoul',T:KST(2026,10,14,16,30),cfg,routes,touch:true});await p.waitForTimeout(2500);
    const f=await p.evaluate(()=>{const m=__wx.S.family[0];return {act:m.sdefs[0].act,stk:m.stk||{},now:__wx.famActNow(m,Date.now())};});
    T('가족 스티커 활동이 저장된 채로 켜짐',f.act&&f.act.s==='16:00'&&f.act.days.join()==='1,3,5');
    T('지난 월·금(끝난 날)은 자동 완료 · 오늘은 아직',(f.stk['2026-10-12']||[]).includes('m_pi')&&(f.stk['2026-10-09']||[]).includes('m_pi')&&!(f.stk['2026-10-14']||[]).includes('m_pi'),JSON.stringify(f.stk));
    T('지금(16:30) 상태: 피아노 중 · 17:00 끝',!!f.now&&f.now[1]==='피아노 중'&&/17:00 끝/.test(f.now[2]),JSON.stringify(f.now));
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(500);
    const card=await p.evaluate(()=>document.querySelector('.now.fams .nc').innerText.replace(/\s+/g,' '));
    T('가족 카드: 피아노 중 · 끝날 때 비 · 우산',/피아노 중/.test(card)&&/피아노 끝날 때 비 · 우산/.test(card),card);
    await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(500);
    T('달력: 앞으로 깔릴 날(16일 금)은 흐린 피아노',await p.evaluate(()=>{const e=document.querySelector('#vcsl [data-k="2026-10-16"] .stp .se');return !!e&&/opacity/.test(e.getAttribute('style')||'');}));
    await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-12"]').click());await p.waitForTimeout(500);
    T('지난 날 창: 피아노 완료(켜짐) · 시각 표시',await p.evaluate(()=>{const e=document.querySelector('#sheet .mstk [data-id="m_pi"]');return e.classList.contains('on')&&/16:00/.test(e.innerText);}));
    await p.evaluate(()=>{const o=document.querySelector('#sheet .mstk [data-id="m_pi"]');o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();});await p.waitForTimeout(400);
    T('안 간 날: 눌러서 풀면 그 날은 빠짐 (다시 안 채움)',await p.evaluate(()=>{const m=__wx.S.family[0];__wx.actAuto();return !((m.stk||{})['2026-10-12']||[]).includes('m_pi')&&m.sdefs[0].act.skip.includes('2026-10-12')&&!__wx.manPlanned(m,m.sdefs[0],'2026-10-12');}));
    // 편집: 양치에 활동 넣기 (요일 · 시간)
    await p.evaluate(()=>{const e=document.querySelector('#sheet .mstk [data-id="m_t"]');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:5,clientY:5}));});await p.waitForTimeout(700);
    const tap=sel=>p.evaluate(sel=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const o=document.querySelector(sel);o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();},sel);
    await tap('#pop [data-act="ms-actf"]');await p.waitForTimeout(300);
    T('가족 스티커 편집: 활동 칸 펼치면 요일 · 시간',await p.evaluate(()=>!!document.querySelector('#pop [data-act="ms-aday"]')&&!!document.getElementById('msAS')));
    await tap('#pop [data-act="ms-aday"][data-v="2"]');await p.waitForTimeout(200);
    await p.evaluate(()=>{const s=document.getElementById('msAS');s.value='18:00';s.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(300);
    await tap('#pop [data-act="mstk-ok"]');await p.waitForTimeout(300);
    T('저장: 화 18:00 ~ 19:00',await p.evaluate(()=>{const a=__wx.S.family[0].sdefs[1].act;return !!a&&a.days.join()==='2'&&a.s==='18:00'&&a.e==='19:00';}));
    T('오류 없음 (가족 활동)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
