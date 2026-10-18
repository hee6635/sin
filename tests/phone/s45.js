// v0.63: 위젯 자료(60일 · 회사 휴무 · 기념일) · 알람 180일 · 납작약 가운데 줄 · 문의 메일 · 백업 되돌리기 · 오류 기록 · 안전 화면
const {chromium,boot,rich,K}=require('./x_common.js');
const {mkT}=require('./lib.js');
const T0=+new Date('2026-10-12T10:00:00');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const grab=`window.__wd=null;window.__al=null;window.__mail=null;const B=window.AndroidBridge;
    const w0=B.setWidgetData,a0=B.setAlarms,m0=B.sendMail;
    B.setWidgetData=j=>{window.__wd=j;return w0&&w0(j);};B.setAlarms=j=>{window.__al=j;return a0&&a0(j);};B.sendMail=(t,s,bd)=>{window.__mail=[t,s,bd];};`;
  // ── 위젯 자료 · 알람
  let s=rich();
  let p=await boot(b,s,{preInit:grab,wait:1400});
  const wd=JSON.parse(await p.evaluate(()=>window.__wd)),al=JSON.parse(await p.evaluate(()=>window.__al));
  T('위젯 자료: 지난 2달 ~ 다음 12달의 달력(7/26 ~ 2027-11-06) = 469일 (한 달 위젯이 넘겨 봄)',wd.days.length===469&&wd.days[0].k==='2026-07-26'&&wd.days[wd.days.length-1].k==='2027-11-06',wd.days.length+' '+wd.days[0].k+' '+wd.days[wd.days.length-1].k);
  const near=wd.days.filter(d=>d.k>='2026-10-06'&&d.k<='2026-10-25');
  T('오늘 6일 전 ~ 13일 뒤(20일)는 스티커 · 메모 칸이 다 있음',near.length===20&&near.every(d=>Array.isArray(d.sa)&&Array.isArray(d.mi)&&!d.far));
  T('그 밖(지난 날 · 2주 뒤부터)은 근무 · 공휴일(+회사 휴무 · 기념일 · 한 달 칸용 메모 · 스티커 몇 개)만 + far 표시(지난 날 2 · 앞날 1)',wd.days.filter(d=>d.k<'2026-10-06'||d.k>'2026-10-25').every(d=>d.far===(d.k<'2026-10-06'?2:1)&&d.sa===undefined&&d.mi===undefined&&typeof d.t==='string'&&'w' in d&&'hol' in d&&Array.isArray(d.stk)&&d.stk.length<=4&&Array.isArray(d.ms)&&d.ms.length<=3));
  const d25=wd.days.find(d=>d.k==='2026-10-25'),d30=wd.days.find(d=>d.k==='2026-10-30'),far=wd.days.filter(d=>d.far);
  T('큰 창용: 회사 휴무(창립기념일) 이름이 ch 로 감',d25&&d25.ch==='창립기념일',JSON.stringify(d25&&d25.ch));
  T('큰 창용: 기념일(엄마 생일)이 an 으로 감 (이모티콘 포함 · 2주 뒤 날도)',d30&&d30.far===1&&Array.isArray(d30.an)&&d30.an.length===1&&d30.an[0].includes('엄마 생일'),JSON.stringify(d30&&d30.an));
  const d06=wd.days.find(d=>d.k==='2026-10-06');
  T('휴무일 · 기념일이 없는 날은 ch · an 칸이 아예 없음 (자료를 안 늘림)',!!d06&&!('ch' in d06)&&!('an' in d06));
  const last=Math.max(...al.map(x=>x.at));
  T('알람: 앞으로 150일 넘게 폰에 보냄 (400개 한도 안)',last-T0>150*864e5&&al.length<=400,Math.round((last-T0)/864e5)+'일 · '+al.length+'개');
  await p.ctx.close();
  // ── 납작약: 가운데 줄은 1번짜리만
  s=rich();s.stamps.defs[0]={...s.stamps.defs[0],shape:'tab',times:3,rep:'daily',ats:[]};
  p=await boot(b,s,{});
  const cnt=async n=>{
    await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"] .stz').click());await p.waitForTimeout(300);
    return p.evaluate(()=>{const sv=document.querySelector('#pop .sdr svg.pillic');return sv?{pr:sv.querySelectorAll('line.pr').length,pd:sv.querySelectorAll('line.pd').length}:null;});
  };
  const c3=await cnt(3);
  T('납작약 3번: 칸 나눔 줄 2개만 (가운데 홈 줄 없음)',c3&&c3.pd===2&&c3.pr===0,JSON.stringify(c3));
  await p.evaluate(()=>{const pp=document.getElementById('pop');pp.className='';pp.innerHTML='';});
  await p.ctx.close();
  s=rich();s.stamps.defs[0]={...s.stamps.defs[0],shape:'tab',times:1,rep:'daily',ats:[]};
  p=await boot(b,s,{});const c1=await cnt(1);
  T('납작약 1번: 가운데 홈 줄 1개 (나눔 줄 없음)',c1&&c1.pd===0&&c1.pr===1,JSON.stringify(c1));
  await p.ctx.close();
  s=rich();s.stamps.defs[0]={...s.stamps.defs[0],shape:'tab',times:2,rep:'daily',ats:[]};
  p=await boot(b,s,{});const c2=await cnt(2);
  T('납작약 2번: 가운데 나눔 줄 하나만',c2&&c2.pd===1&&c2.pr===0,JSON.stringify(c2));
  await p.ctx.close();
  // ── 문의하기: 받는 주소 + 최근 오류가 메일 본문에
  s=rich();
  p=await boot(b,s,{preInit:grab});
  await p.evaluate(()=>{window.__logErr('시험 오류 하나','x.js:7');});
  await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
  await p.evaluate(()=>document.querySelector('[data-act="more-mail"]').click());await p.waitForTimeout(250);
  const mail=await p.evaluate(()=>window.__mail);
  T('문의하기: 받는 사람이 운영용 주소',mail&&mail[0]==='eonjeswieo.app@gmail.com',JSON.stringify(mail&&mail[0]));
  T('문의 메일 본문에 최근 오류가 붙음',mail&&/최근 오류/.test(mail[2])&&/시험 오류 하나/.test(mail[2]),String(mail&&mail[2]).slice(0,120));
  await p.ctx.close();
  // ── 오류 기록: 같은 오류를 연달아 내도 한 줄, 5개까지만
  p=await boot(b,rich(),{});
  const lg=await p.evaluate(()=>{for(let i=0;i<4;i++)window.__logErr('같은 오류','a');for(let i=0;i<9;i++)window.__logErr('오류 '+i,'b');return JSON.parse(localStorage.getItem('eonjeswieo:err'));});
  T('오류 기록: 같은 오류는 합쳐지고 최근 5개만 남음',lg.length===5&&lg[4].m==='오류 8'&&lg.filter(x=>x.m==='같은 오류').length===0,JSON.stringify(lg.map(x=>x.m)));
  // 안전 화면
  await p.evaluate(()=>{window.__crash('시험으로 띄움');});
  const cr=await p.evaluate(()=>{const e=document.getElementById('crashBox');return e?{btn:[...e.querySelectorAll('button')].map(x=>x.textContent),txt:e.innerText.slice(0,60)}:null;});
  T('안전 화면: 다시 열기 · 데이터 보내기 · 새로 시작 버튼',cr&&cr.btn.length===3&&/다시 열기/.test(cr.btn[0])&&/파일로/.test(cr.btn[1])&&/새로 시작/.test(cr.btn[2]),JSON.stringify(cr));
  await p.ctx.close();
  // ── 저장 문자열이 깨졌을 때: 안내 + 내보내기 줄
  {const trunc=JSON.stringify(rich()).slice(0,500);
   p=await boot(b,trunc,{wait:2300});
   const tt=await p.evaluate(()=>document.getElementById('toast').textContent+'|'+(document.getElementById('toast').className));
   T('깨진 저장 데이터로 켜지면 안내 한 줄',/읽지 못해/.test(tt),tt);
   await p.evaluate(()=>document.getElementById('onboard').classList.remove('open'));   // 처음 시작 화면은 닫고 (실제로는 건너뛰기)
   await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
   await p.evaluate(()=>document.querySelector('[data-act="more-backup"]')?.click());await p.waitForTimeout(350);
   const rows=await p.evaluate(()=>({bad:!!document.querySelector('#page [data-act="bad-export"]'),undo:!!document.querySelector('#page [data-act="backup-undo"]')}));
   T('백업 · 복원 화면에 "읽지 못한 저장 데이터 내보내기" 줄이 나옴',rows.bad&&!rows.undo,JSON.stringify(rows));
   await p.ctx.close();}
  // ── 복원 직전 되돌리기
  {const prevS=rich();prevS.patternName='되돌릴패턴';
   p=await boot(b,rich(),{});
   p.removeAllListeners('dialog');p.on('dialog',d=>d.accept());
   await p.evaluate(x=>localStorage.setItem('eonjeswieo:v1:prev',JSON.stringify({at:Date.now(),s:x})),prevS);
   await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
   await p.evaluate(()=>document.querySelector('[data-act="more-backup"]')?.click());await p.waitForTimeout(350);
   T('복원 사본이 있으면 "복원 직전 상태로 되돌리기" 줄이 나옴',await p.evaluate(()=>!!document.querySelector('#page [data-act="backup-undo"]')));
   await p.click('#page [data-act="backup-undo"]');await p.waitForTimeout(500);
   const pn=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).patternName);
   T('되돌리기 → 복원 전 데이터로 돌아옴',pn==='되돌릴패턴',pn);
   T('되돌린 뒤 사본은 지워짐',await p.evaluate(()=>!localStorage.getItem('eonjeswieo:v1:prev')));
   await p.ctx.close();}
  await b.close();T.sum();
})();
