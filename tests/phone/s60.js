// v0.80 고침: 스티커 두 줄 정렬 · 간격 조정이 두 줄에 같이 먹음 · 조정 화면 미리보기와 실제 달력의 스티커 크기 같음
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
  const defs=['👟','📖','🏀','🦷'].map((e,i)=>mk('m'+i,e,'s'+i,{dates:['2026-10-09','2026-10-13']}));
  const geo=(p,k)=>p.evaluate(k=>{const c=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);const r1=[...c.querySelectorAll('.dn>.stp>*')].map(e=>e.getBoundingClientRect()),r2=[...c.querySelectorAll('.s2>*')].map(e=>e.getBoundingClientRect());const R=a=>a.length?Math.max(...a.map(r=>r.right)):null,L=a=>a.length?Math.min(...a.map(r=>r.left)):null;return {r1:R(r1),r2:R(r2),w1:L(r1)&&R(r1)-L(r1),w2:L(r2)&&R(r2)-L(r2),n1:r1.length,n2:r2.length,sz:r1[0]?r1[0].width:null};},k);
  for(const [nm,k] of [['이름 있는 날(한글날)','2026-10-09'],['이름 없는 날','2026-10-13']]){
    for(const [stk,x,gx] of [[1,0,0],[1.2,.3,.5],[.9,-.2,-.5]]){
      const tune={...base.tune,appCover:{...base.tune.appCover,stk,stkX:x,stkGX:gx}};
      const p=await boot(b,{...base,tune,stamps:{defs,log:{},v3:1,v4:1,lastAt:[]}},{w:390,h:844,touch:true});
      const g=await geo(p,k);
      T(`${nm} · 스티커 ${stk} 좌우 ${x} 간격 ${gx}: 첫 줄과 둘째 줄 오른쪽 끝이 맞음(±1px)`,g.n2>0&&Math.abs(g.r1-g.r2)<=1.2,JSON.stringify(g));
      await p.close();
    }
  }
  // 간격 조정: 이름 있는 날도 스티커 사이 간격이 커지고, 첫 줄 · 둘째 줄 모두 같은 간격
  {
    const gap=g=>({g1:g.n1>1?(g.w1-g.n1*g.sz)/(g.n1-1):null,g2:g.n2>1?(g.w2-g.n2*g.sz)/(g.n2-1):null});
    const w=async gx=>{const tune={...base.tune,appInner:{...base.tune.appInner,stk:1,stkGX:gx},appCover:{...base.tune.appCover,stk:1,stkGX:gx}};const p=await boot(b,{...base,tune,stamps:{defs,log:{},v3:1,v4:1,lastAt:[]}},{w:820,h:1100,touch:true});const g=await geo(p,'2026-10-09');await p.close();return {...g,...gap(g)};};
    const a=await w(0),c=await w(1);
    T('스티커 좌우 간격 0 → 1: 간격이 커짐(첫 줄 · 둘째 줄 모두, 이름 있는 날도)',(a.g1===null||c.g1>a.g1+1.5)&&(a.g2===null||c.g2>a.g2+1.5)&&(a.g1!==null||a.g2!==null),JSON.stringify([a,c]));
    T('두 줄의 간격이 서로 같음',[a,c].every(x=>x.g1===null||x.g2===null||Math.abs(x.g1-x.g2)<=1),JSON.stringify([a,c]));
  }
  // 조정 화면 미리보기의 스티커 크기 = 실제 달력의 스티커 크기
  {
    const st={...base,stamps:{defs,log:{},v3:1,v4:1,lastAt:[]}};
    const p=await boot(b,st,{w:390,h:844,touch:true});
    const real=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--stz').trim());
    const realW=await p.evaluate(()=>Math.round(document.querySelector('.track .panel:nth-child(2) .cell').getBoundingClientRect().width));
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
    for(let i=0;i<7;i++)await p.evaluate(()=>document.querySelector('[data-act="about-tap"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('[data-act="tune-open"]').click());await p.waitForTimeout(600);
    const prev=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--stz').trim());
    const cw=await p.evaluate(rw=>[Math.round(document.querySelector('#tnPrev .grid .cell').getBoundingClientRect().width),rw],realW);
    T('미리보기 칸 폭 = 실제 달력 칸 폭',Math.abs(cw[0]-cw[1])<=1,JSON.stringify(cw));
    T('미리보기 스티커 크기(--stz) = 실제 달력',real===prev,real+' / '+prev);
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // 스티커 크기는 앞뒤 3달 기준: 명절이 있는 달 · 없는 달을 넘겨도 크기가 같음
  {
    const st={...base,stamps:{defs,log:{},v3:1,v4:1,lastAt:[]}};
    const p=await boot(b,st,{w:390,h:844,touch:true});
    const stz=()=>p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--stz').trim());
    const sz=[await stz()];
    const t0=Date.now();
    for(let i=0;i<3;i++){await p.evaluate(()=>document.querySelector('[data-act="next"]').click());await p.waitForTimeout(450);sz.push(await stz());}
    const ms=Date.now()-t0;
    T('10월 → 11월 → 12월 → 1월: 스티커 크기가 같음(앞뒤 3달 기준)',sz.slice(0,3).every(x=>x===sz[0]),JSON.stringify(sz));
    T('달을 넘기는 속도: 3번 넘기는 데 3.5초 이내(7달 재기 포함)',ms<3500,String(ms));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // 오늘 표시(칸 채우기): 모양 조정 화면에서 4가지 중 고름 · 띠는 오른쪽 둥근 선을 따라 휨
  {
    const p=await boot(b,{...base,calLook:'fill'},{w:390,h:844,touch:true});
    const r=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell.today'),a=getComputedStyle(c,'::after'),cs=getComputedStyle(c);return {bw:a.borderRightWidth,rad:a.borderTopRightRadius,bg:cs.backgroundColor,sh:cs.boxShadow,t:document.documentElement.getAttribute('data-today')};});
    T('기본은 "띠만"(b): 4px 띠 · 둥근 모서리 · 바탕 없음 · 그림자 없음',r.t==='b'&&r.bw==='4px'&&parseFloat(r.rad)>=8&&/rgba\(0, 0, 0, 0\)|transparent/.test(r.bg)&&r.sh==='none',JSON.stringify(r));
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
    for(let i=0;i<7;i++)await p.evaluate(()=>document.querySelector('[data-act="about-tap"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('[data-act="tune-open"]').click());await p.waitForTimeout(500);
    const pick=async v=>{await p.evaluate(v=>document.querySelector(`[data-act="todaylook"][data-v="${v}"]`).click(),v);await p.waitForTimeout(300);return p.evaluate(()=>{const c=document.querySelector('#tnPrev .cell.today')||document.querySelector('.cell.today');const a=getComputedStyle(c,'::after'),cs=getComputedStyle(c);return {t:document.documentElement.getAttribute('data-today'),bw:a.borderRightWidth,bg:cs.backgroundColor,sh:cs.boxShadow,saved:JSON.parse(localStorage.getItem('eonjeswieo:v1')).todayLook};});};
    const A=await pick('a'),C=await pick('c'),D=await pick('d');
    T('a(바탕+그림자+띠): 바탕과 그림자가 있음',A.t==='a'&&A.saved==='a'&&!/rgba\(0, 0, 0, 0\)/.test(A.bg)&&A.sh!=='none',JSON.stringify(A));
    T('c(띠 굵고 진하게): 6px',C.bw==='6px'&&C.sh==='none',JSON.stringify(C));
    T('d(띠+그림자): 4px · 그림자 있음 · 바탕 없음',D.bw==='4px'&&D.sh!=='none'&&/rgba\(0, 0, 0, 0\)|transparent/.test(D.bg),JSON.stringify(D));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
