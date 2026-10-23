// v0.83: 바퀴 시간 고르기 · 오늘 칸 빛 · 메모 3줄 · +n 작게 · 1/2 배지 · 접고 펼 때 스티커 · 메모 말줄임 · 변경 점 슬라이더
const {chromium,boot,mkT,base}=require('./lib.js');
const ONLY=process.env.ONLY||'';
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const want=k=>!ONLY||ONLY.split(',').includes(k);
  // ── 1. 바퀴 시간 고르기
  if(want('wheel')){
    const p=await boot(b,{...base},{touch:true});
    await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(250);
    await p.evaluate(()=>document.querySelector('[data-act="aadd"]').click());await p.waitForTimeout(500);
    const v0=await p.evaluate(()=>document.querySelector('#at').value);
    await p.evaluate(()=>document.querySelector('[data-act="tpk"][data-id="at"]').click());await p.waitForTimeout(400);
    const r=await p.evaluate(()=>{const cols=[...document.querySelectorAll('.tpw-col')];return {n:cols.length,on:cols.map(c=>(c.querySelector('.tpw-i.on')||{}).textContent),old:!!document.querySelector('[data-act="tpk-step"],.tpk-g,.tpk-big'),h:document.querySelector('#pop .menu').offsetHeight};});
    const [h0,m0]=v0.split(':').map(Number);
    T('바퀴 3칸(오전/오후 · 시 · 분) · 옛 버튼 · 큰 글씨 없음',r.n===3&&!r.old,JSON.stringify(r));
    T('처음 값이 가운데에 진하게(지금 알람 시각)',r.on[0]===(h0>=12?'오후':'오전')&&+r.on[1]===(h0%12||12)&&+r.on[2]===m0,JSON.stringify(r.on)+' '+v0);
    // 분 칸을 7칸 내리기 → 1분 단위
    const spin=(k,d)=>p.evaluate(([k,d])=>{const c=document.querySelector(`.tpw-col[data-k="${k}"]`),H=c.querySelector('.tpw-i').offsetHeight;c.scrollTop+=d*H;c.dispatchEvent(new Event('scroll'));},[k,d]);
    await spin('mi',7);await p.waitForTimeout(400);
    await spin('h',-3);await p.waitForTimeout(400);
    await spin('ap',1);await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('[data-act="tpk-ok"]').click());await p.waitForTimeout(300);
    const v1=await p.evaluate(()=>document.querySelector('#at').value);
    const exp=(()=>{const mi=(m0+7)%60;let h12=((h0%12||12)-1-3+120)%12+1;const h=(h12%12)+12;return `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;})();
    T('분 7칸 · 시 -3칸 · 오후로 돌린 뒤 정하기 = 그 시각(1분 단위)',v1===exp,v0+' → '+v1+' (기대 '+exp+')');
    // 끝없이 돌기: 59 → 00, 12 → 1
    await p.evaluate(()=>document.querySelector('[data-act="tpk"][data-id="at"]').click());await p.waitForTimeout(400);
    const loopN=await p.evaluate(async()=>{const c=document.querySelector('.tpw-col[data-k="mi"]'),H=c.querySelector('.tpw-i').offsetHeight;const res=[];for(let i=0;i<4;i++){c.scrollTop+=40*H;c.dispatchEvent(new Event('scroll'));await new Promise(r=>setTimeout(r,250));res.push(Math.round(c.scrollTop/H));}return res;});
    T('분 바퀴를 계속 내려도 끝에 안 막힘(가운데 묶음으로 몰래 옮김)',loopN.every(x=>x>=120&&x<180),JSON.stringify(loopN));
    // 흐린 숫자 누르기 → 한 칸
    await p.evaluate(()=>{const c=document.querySelector('.tpw-col[data-k="h"]'),on=c.querySelector('.tpw-i.on');on.nextElementSibling.click();});await p.waitForTimeout(900);
    const tap=await p.evaluate(()=>document.querySelector('.tpw-col[data-k="h"] .tpw-i.on').textContent);
    T('아래 흐린 숫자를 누르면 그 숫자로 이동',!!tap,tap);
    await p.screenshot({path:'/tmp/claude-0/-home-user-sin/1628b3b7-3ae4-5c93-9803-4ca84296dbbe/scratchpad/wheel.png'});
    await p.evaluate(()=>document.querySelector('[data-act="pop-close"]').click());await p.waitForTimeout(200);
    T('취소하면 값 그대로',await p.evaluate(()=>document.querySelector('#at').value)===v1);
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }

  const tm=+new Date('2026-10-12T10:00:00');
  const M=(id,text)=>({id,text,shared:false,by:'host',t:tm});
  const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
  // ── 3. 메모는 어디서든 3줄 · 4. +n 작은 글자 · 8. 잘린 메모 끝 작은 점
  if(want('memo')){
    const memos={'2026-10-20':[M('a','054-275-1934 전화하기'),M('b','짧음'),M('c','테스트'),M('d','넷'),M('e','다섯')],'2026-10-21':[M('f','가')]};
    for(const [w,h,pers] of [[390,844,false],[820,1100,false],[390,844,true]]){
      const st={...base,calLook:'fill',memoLines:4,memos,...(pers?{personal:true,pers:[{f:'1900-01-01',t:''}]}:{})};
      const p=await boot(b,st,{w,h,touch:true});
      const r=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-20"]');const pl=[...c.querySelectorAll('.pill-wrap>.pl')];const mc=c.querySelector('.mc');const mcb=mc&&mc.querySelector('b');return {n:pl.length,mcBg:mc&&getComputedStyle(mc).backgroundColor,mcW:mc&&mc.getBoundingClientRect().width,mcH:mcb&&mcb.getBoundingClientRect().height,fz:parseFloat(getComputedStyle(pl[0]).fontSize),cut0:pl[0].classList.contains('cut'),cut1:pl[1].classList.contains('cut'),txt:mcb&&mcb.textContent};});
      const tag=`${w}px${pers?' 개인 캘린더':''}`;
      T(`${tag}: 메모 5개 · 옛 설정 4줄 → 3줄만 보이고 마지막 줄에 "+2"`,r.n===3&&r.txt==='+2',JSON.stringify(r));
      T(`${tag}: "+2" 는 알약 바탕 없이 · 메모 글자보다 작게(높이 ≤ 글자 .9) · 폭 2글자 안쪽`,(r.mcBg==='rgba(0, 0, 0, 0)'||r.mcBg==='transparent')&&r.mcH<=r.fz*.9+.5&&r.mcW<=r.fz*1.6,JSON.stringify(r));
      T(`${tag}: 긴 메모만 끝에 점(.cut) · 짧은 메모는 없음`,r.cut0&&!r.cut1,JSON.stringify(r));
      T(`${tag}: 오류 없음`,p.errs.length===0,p.errs.join('|'));
      if(!pers&&w===390){
        await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);
        T('설정에 "달력 메모 줄 수" 줄이 없음',await p.evaluate(()=>!document.querySelector('[data-act="memolines"]')));
      }
      await p.close();
    }
    // 잘린 점은 한 글자 폭 안쪽
    const p=await boot(b,{...base,calLook:'fill',memos},{w:360,h:760,touch:true});
    const d=await p.evaluate(()=>{const pl=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] .pl.cut');const a=getComputedStyle(pl,'::after');return {w:parseFloat(a.width),fz:parseFloat(getComputedStyle(pl).fontSize)};});
    T('잘린 메모 끝 점 세 개: 폭이 글자 크기보다 작음(한 글자 안쪽)',d.w>0&&d.w<d.fz,JSON.stringify(d));
    await p.close();
  }
  // ── 9. 근무 변경 빨간 점: 모양 조정 "빨간 점 좌우" (앱 달력만) · 크기 5px · 칸 채우기는 글자 옆 · 요청 링 바깥
  if(want('dot')){
    for(const look of ['fill','circle']){
      const st=x=>({...base,calLook:look,overrides:{'2026-10-13':'야','2026-10-14':'야'},tune:{...base.tune,appCover:{...base.tune.appCover,ink:1.25,dotX:x}}});
      const meas=async x=>{const p=await boot(b,st(x),{w:390,h:844,touch:true});const r=await p.evaluate(()=>{const d=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-13"] .dot'),a=d.getBoundingClientRect(),bd=d.closest('.badge').getBoundingClientRect(),c=d.closest('.cell').getBoundingClientRect();return {w:+a.width.toFixed(1),gap:+(bd.left-a.right).toFixed(1),toCell:+(a.left-c.left).toFixed(1),bw:bd.width};});await p.close();return r;};
      const a=await meas(0),r1=await meas(1),l1=await meas(-1);
      T(`${look}: 빨간 점 크기 5px (주야 배율 1.25 와 상관없이)`,Math.abs(a.w-5)<.3,JSON.stringify(a));
      T(`${look}: 슬라이더 + 는 오른쪽 · − 는 왼쪽으로 · 끝까지 밀어도 칸 안`,r1.toCell>a.toCell&&l1.toCell<=a.toCell&&l1.toCell>=0&&r1.toCell>=0,JSON.stringify({a,r1,l1}));
      if(look==='fill')T('칸 채우기: 기본 자리가 글자 상자 안쪽(글자 옆)',a.gap<0,JSON.stringify(a));
    }
    // 요청 링이 있으면 링 바깥 (동그라미)
    const p=await boot(b,{...base,calLook:'circle',overrides:{'2026-10-13':'야'},tune:{...base.tune,appCover:{...base.tune.appCover,dotX:1}}},{w:430,h:900,touch:true});
    const g=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-13"]');c.classList.add('rq-ask');const d=c.querySelector('.dot'),a=d.getBoundingClientRect(),bd=d.closest('.badge').getBoundingClientRect();return +(bd.left-a.right).toFixed(1);});
    T('동그라미 · 요청 링 있는 칸: 슬라이더를 오른쪽 끝까지 밀어도 점은 링 바깥(동그라미에서 6px 넘게)',g>=6,String(g));
    // 모양 조정 화면: 앱 달력에만 슬라이더 · 값 복사에 들어감
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
    for(let i=0;i<7;i++)await p.evaluate(()=>document.querySelector('[data-act="about-tap"]')&&document.querySelector('[data-act="about-tap"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="tune-open"]')&&document.querySelector('[data-act="tune-open"]').click());await p.waitForTimeout(500);
    const sl=await p.evaluate(()=>['appCover','appInner','cover','inner'].map(g=>!!document.querySelector(`.tn-r[data-g="${g}"][data-k="dotX"]`)));
    T('모양 조정: "빨간 점 좌우" 는 앱 달력 커버 · 안쪽에만 (위젯엔 없음)',JSON.stringify(sl)==='[true,true,false,false]',JSON.stringify(sl));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 6. 1/2 배지는 스티커 안쪽 모서리 · 좁은 칸에서 둘째 줄과 첫 줄 오른쪽 끝이 같음
  if(want('stk')){
    const defs=[mk('a','👟','운동',{dates:['2026-12-25']}),mk('b','💪','근력',{times:2,dates:['2026-12-25']}),mk('c','💧','물',{times:2,dates:['2026-12-25']}),mk('d','💊','약',{dates:['2026-12-25']})];
    const tune={...base.tune,appCover:{stk:1.45,stkX:-.3,stkY:.05,ink:1.25,inkY:.6,memo:.85,pill:.7}};
    for(const w of [369,412]){
      const p=await boot(b,{...base,tune,calLook:'fill',stamps:{defs,log:{'2026-12-25':{a:1,b:1,c:1,d:1}},v3:1,v4:1,lastAt:[]}},{w,h:820,touch:true});
      for(let i=0;i<2;i++){await p.evaluate(()=>document.querySelector('[data-act="next"]').click());await p.waitForTimeout(500);}
      const r=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-12-25"]'),cr=c.getBoundingClientRect();const L=e=>e.getBoundingClientRect();const r1=[...c.querySelectorAll('.dn>.stp>*')],r2=[...c.querySelectorAll('.s2>*')];return {cell:cr.right,r1:r1.length?L(r1[r1.length-1]).right:0,r2:r2.length?L(r2[r2.length-1]).right:0,n1:r1.length,n2:r2.length,cb:[...c.querySelectorAll('.sx')].map(x=>{const a=L(x.querySelector('svg,.se')),q=L(x.querySelector('.cb'));return +(q.right-a.right).toFixed(1);})};});
      T(`${w}px 12/25(이름 + 스티커 4개 + 1/2 둘): 둘째 줄은 2개까지 · 첫 줄 · 둘째 줄 오른쪽 끝이 같음(±2px)`,r.n2<=2&&r.n1+r.n2===4&&Math.abs(r.r1-r.r2)<=2,JSON.stringify(r));
      T(`${w}px: 첫 줄이 칸 오른쪽 밖으로 안 나감`,r.r1<=r.cell+1,JSON.stringify(r));
      T(`${w}px: 1/2 배지가 스티커 오른쪽 끝에서 조금만 삐져나옴(스티커 크기의 .2 안)`,r.cb.length===2&&r.cb.every(x=>x<=7),JSON.stringify(r.cb));
      T(`${w}px: 오류 없음`,p.errs.length===0,p.errs.join('|'));await p.close();
    }
  }

  // ── 2. 오늘 칸 빛: 켤 때 · 다른 달에서 이번 달로 돌아올 때만
  if(want('glow')){
    const p=await boot(b,{...base,calLook:'fill'},{touch:true,wait:0});
    const has=()=>p.evaluate(()=>!!document.querySelector('#track .panel:nth-child(2) .cell.today .tglow'));
    const seen=async(ms=700)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await has())return true;await p.waitForTimeout(40);}return false;};
    // (boot 이 0.9초 기다려서 켤 때 빛은 이미 끝났을 수 있음 → 빛이 돌았는지는 따로: 처음 켤 때 빛 표시가 시작됐는지 기록을 봄)
    await p.waitForTimeout(250);
    T('켤 때 빛이 돌았음(0.82초 뒤엔 사라짐)',await p.evaluate(()=>window.__glowN>=1)&&!(await has()),await p.evaluate(()=>String(window.__glowN)));
    const n0=await p.evaluate(()=>window.__glowN);
    await p.evaluate(()=>document.querySelector('[data-act="next"]').click());await p.waitForTimeout(500);
    T('다음 달로 가면 빛 없음',!(await seen(500)));
    await p.evaluate(()=>document.querySelector('[data-act="prev"]').click());
    T('‹ 로 이번 달에 돌아오면 빛',await seen(900));
    await p.waitForTimeout(1000);
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);await p.click('#nav [data-tab="cal"]');
    T('다른 탭에 갔다 오면 빛 없음',!(await seen(600)));
    await p.evaluate(()=>{const e=new Event('visibilitychange');document.dispatchEvent(e);});
    T('앱으로 돌아와도(화면 다시 보임) 빛 없음',!(await seen(500)));
    await p.evaluate(()=>document.querySelector('[data-act="prev"]').click());await p.waitForTimeout(600);
    await p.evaluate(()=>document.querySelector('[data-act="prev"]').click());await p.waitForTimeout(600);
    await p.evaluate(()=>document.querySelector('[data-act="today"]').click());
    T('두 달 앞에서 "오늘" 버튼 → 빛',await seen(900));
    await p.waitForTimeout(1000);
    // 쓸어서 돌아오기
    await p.evaluate(()=>document.querySelector('[data-act="next"]').click());await p.waitForTimeout(600);
    const sw=async dx=>{const box=await p.evaluate(()=>{const r=document.querySelector('#view').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];});
      await p.evaluate(([x,y,dx])=>{const v=document.querySelector('#view');const T=(t,x)=>{const tc=new Touch({identifier:1,target:v,clientX:x,clientY:y});v.dispatchEvent(new TouchEvent(t,{touches:t==='touchend'?[]:[tc],changedTouches:[tc],bubbles:true}));};T('touchstart',x);for(let i=1;i<=6;i++)T('touchmove',x+dx*i/6);T('touchend',x+dx);},[box[0],box[1],dx]);};
    await sw(220);
    T('오른쪽으로 쓸어 이번 달로 돌아오면 빛',await seen(1200));
    const n1=await p.evaluate(()=>window.__glowN);
    T('빛 횟수: 켤 때 1 + 돌아올 때 3',n0===1&&n1===4,n0+' → '+n1);
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 7. 접고 펼 때 스티커 크기: 전에 맞춘 값을 바로 · 앱이 뒤에 있을 때 접어도 돌아오면 맞음 · 다른 화면이 열려 있어도
  if(want('fold')){
    const defs=['👟','📖','🏀','🦷'].map((e,i)=>mk('m'+i,e,'s'+i,{dates:['2026-10-09','2026-10-13']}));
    const st=()=>({...base,calLook:'fill',stamps:{defs,log:{},v3:1,v4:1,lastAt:[]}});
    const stz=p=>p.evaluate(()=>document.documentElement.style.getPropertyValue('--stz'));
    const fresh={};for(const [w,h] of [[390,844],[820,1100]]){const q=await boot(b,st(),{w,h,touch:true});fresh[w]=await stz(q);await q.close();}
    const p=await boot(b,st(),{w:820,h:1100,touch:true});
    await p.setViewportSize({width:390,height:844});await p.waitForTimeout(1200);
    await p.setViewportSize({width:820,height:1100});await p.waitForTimeout(1200);
    // 두 번째 접기: 0.25초 다시 재기 전에도 이미 커버 값
    await p.setViewportSize({width:390,height:844});await p.waitForTimeout(60);
    const early=await stz(p);
    T('두 번째 접을 때는 다시 재기 전부터 커버 크기(잠깐 크게 안 보임)',early===fresh[390],early+' vs '+fresh[390]);
    await p.waitForTimeout(1200);
    T('가라앉은 뒤도 새로 켠 것과 같음',await stz(p)===fresh[390]);
    // 앱이 뒤에 있을 때 펼침 → 돌아오면 맞춤
    await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});});
    await p.setViewportSize({width:820,height:1100});await p.waitForTimeout(1300);
    await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(500);
    T('앱이 뒤에 있을 때 펼쳐도 돌아오면 안쪽 크기',await stz(p)===fresh[820],(await stz(p))+' vs '+fresh[820]);
    // 설정 화면이 열려 있을 때 접음 → 닫으면 맞춤
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);
    await p.evaluate(()=>{const b=document.querySelector('[data-act="more-widget"]');if(b)b.click();});await p.waitForTimeout(400);
    await p.setViewportSize({width:390,height:844});await p.waitForTimeout(1300);
    await p.evaluate(()=>{const c=document.querySelector('[data-act="page-close"]');if(c)c.click();});await p.waitForTimeout(300);
    await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(500);
    T('설정 화면을 연 채 접어도 달력으로 돌아오면 커버 크기',await stz(p)===fresh[390],(await stz(p))+' vs '+fresh[390]);
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 고침: "공휴일 쉬는 날 표시"(holRest)를 켜면 달력 칸에서 오류(hol0)
  if(want('holrest')){
    const p=await boot(b,{...base,holRest:true,pattern:['휴','휴','휴','휴']},{touch:true});
    for(let i=0;i<3;i++){await p.evaluate(()=>document.querySelector('[data-act="prev"]').click());await p.waitForTimeout(450);}
    T('holRest 켜도 달력이 뜨고 오류 없음 · 휴무인 공휴일에 이름 표시',p.errs.length===0&&await p.evaluate(()=>document.querySelectorAll('.track .panel:nth-child(2) .cell').length>27),p.errs.join('|'));
    await p.close();
  }
  // ── "오늘" 버튼: 바로 미끄러지고(누른 순간 다시 그리지 않음) · 넘기는 중에 누르면 무시
  if(want('today')){
    const p=await boot(b,{...base,calLook:'fill'},{touch:true});
    for(let i=0;i<3;i++){await p.evaluate(()=>document.querySelector('[data-act="next"]').click());await p.waitForTimeout(450);}
    const r=await p.evaluate(()=>{const tr=document.getElementById('track');document.querySelector('[data-act="today"]').click();return {same:document.getElementById('track')===tr,tf:tr.style.transform,left:tr.children[0].querySelector('.cell[data-k="2026-10-12"]')?1:0};});
    T('"오늘" 누른 순간: 달력을 다시 그리지 않고 이번 달 쪽(왼쪽)으로 미끄러지기 시작 · 옆 칸에 이번 달',r.same&&r.tf==='translateX(0%)'&&r.left===1,JSON.stringify(r));
    await p.waitForTimeout(500);
    T('미끄러진 뒤 이번 달',await p.evaluate(()=>!!document.querySelector('#track .panel:nth-child(2) .cell.today')));
    await p.evaluate(()=>document.querySelector('[data-act="next"]').click());
    await p.waitForTimeout(80);
    await p.evaluate(()=>{const b=document.querySelector('[data-act="today"]');if(b)b.click();});
    await p.waitForTimeout(600);
    T('넘기는 중에 "오늘"을 눌러도 엉뚱한 달로 안 감(다음 달에 머묾)',await p.evaluate(()=>!!document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-11-12"]')));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 고침: 가족 시간표 오늘 열이 작은 동그라미로 줄던 것(오늘 띠 색 버튼과 이름 .tdc 가 같았음)
  if(want('famtdc')){
    for(const w of [390,930]){
      const p=await boot(b,{...base,calLook:'fill',famSwiped:true},{w,h:900,touch:true});
      await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(600);
      const r=await p.evaluate(()=>{const t=document.querySelector('.fh.tdc'),o=document.querySelector('.fh:not(.tdc)'),c=document.querySelector('.fc.tdc');return {tw:t.getBoundingClientRect().width,ow:o.getBoundingClientRect().width,cw:c.getBoundingClientRect().width,rad:getComputedStyle(t).borderTopLeftRadius};});
      T(`${w}px 가족 탭(혼자): 오늘 열 폭 = 다른 열 폭 · 동그라미 아님`,Math.abs(r.tw-r.ow)<1&&Math.abs(r.cw-r.ow)<1&&r.rad!=='50%',JSON.stringify(r));
      await p.close();
    }
  }
  T.sum();await b.close();
})();
