// v0.80: 모양 조정 저장/되돌리기 · 새 값 4개 · 접고 펼 때 값 바뀜 · 요청 링 기간 · 칸 채우기 명절 띠/오늘 칸
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const t=+new Date('2026-10-12T10:00:00');
  const m=(id,text,sh)=>({id,text,shared:!!sh,by:'host',t});
  const toSet=async p=>{await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);};
  const openTune=async p=>{await toSet(p);for(let i=0;i<7;i++)await p.evaluate(()=>document.querySelector('[data-act="about-tap"]').click());await p.waitForTimeout(400);await p.evaluate(()=>document.querySelector('[data-act="tune-open"]').click());await p.waitForTimeout(500);};
  const setR=(p,g,k,v)=>p.evaluate(([g,k,v])=>{const e=document.querySelector(`.tn-r[data-g="${g}"][data-k="${k}"]`);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},[g,k,v]);
  const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));

  // ── 저장 · 되돌리기 · 새 값
  {
    const st={...base};delete st.tune;
    const p=await boot(b,{...st,memos:{'2026-10-16':[m('a','첫째'),m('b','둘째'),m('c','셋째')]}},{touch:true});
    await openTune(p);
    T('슬라이더 44개 · 스티커/주야/메모 묶음(접기) 12개',await p.evaluate(()=>document.querySelectorAll('.tn-r').length===44&&document.querySelectorAll('.tn-d').length===12));
    T('지금 화면(앱 커버)의 묶음만 펼쳐져 있음',await p.evaluate(()=>{const ds=[...document.querySelectorAll('.tn-d')];return ds.filter(d=>d.open).length===3;}));
    T('새 값 4개(스티커 좌우 간격 · 상하 간격 · 메모 위치 · 줄 간격)가 있음',await p.evaluate(()=>['stkGX','stkGY','memoY','memoG'].every(k=>!!document.querySelector(`.tn-r[data-g="appCover"][data-k="${k}"]`))));
    T('처음에는 저장된 값 · 저장 버튼 꺼짐 · 되돌리기 꺼짐',await p.evaluate(()=>/저장된 값/.test(document.querySelector('#tnBar').textContent)&&document.querySelector('[data-act="tune-save"]').disabled&&document.querySelector('[data-act="tune-undo"]').disabled));
    await setR(p,'appCover','stkGX',0.5);await setR(p,'appCover','stkGY',-0.4);await setR(p,'appCover','memoY',0.3);await setR(p,'appCover','memoG',0.6);await p.waitForTimeout(300);
    const css=await p.evaluate(()=>{const s=getComputedStyle(document.documentElement);return ['--tgx','--tgy','--tmy','--tmg'].map(k=>s.getPropertyValue(k).trim());});
    T('새 값이 CSS 로 바로 반영',JSON.stringify(css)===JSON.stringify(['0.5','-0.4','0.3','0.6']),JSON.stringify(css));
    T('저장 전에는 저장소가 그대로 · "저장 안 한 값" 표시 · 저장 켜짐',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return (!s.tune||s.tune.appCover.stkGX===undefined||s.tune.appCover.stkGX===0)&&/저장 안 한/.test(document.querySelector('#tnBar').textContent)&&!document.querySelector('[data-act="tune-save"]').disabled;}));
    await p.evaluate(()=>document.querySelector('[data-act="tune-save"]').click());await p.waitForTimeout(300);
    let s=await saved(p);
    T('저장을 누르면 저장됨 · 이전 값이 기록에 1개',s.tune.appCover.stkGX===0.5&&s.tune.appCover.memoG===0.6&&s.tuneHist.length===1,JSON.stringify(s.tuneHist.length));
    await setR(p,'appCover','stkGX',-0.8);await p.waitForTimeout(200);
    await p.evaluate(()=>document.querySelector('[data-act="tune-save"]').click());await p.waitForTimeout(300);
    s=await saved(p);T('두 번째 저장 → 기록 2개',s.tuneHist.length===2&&s.tune.appCover.stkGX===-0.8);
    await p.evaluate(()=>document.querySelector('[data-act="tune-undo"]').click());await p.waitForTimeout(500);
    s=await saved(p);
    T('이전 저장으로 → 직전 값(0.5)으로 돌아가고 기록은 1개로',s.tune.appCover.stkGX===0.5&&s.tuneHist.length===1&&+(await p.evaluate(()=>document.querySelector('.tn-r[data-g="appCover"][data-k="stkGX"]').value))===0.5);
    // 저장 안 하고 나가기: 확인창 → 취소하면 그대로 · 확인하면 버림
    await setR(p,'appCover','stkGX',0.9);
    let msg='';p.once('dialog',d=>{msg=d.message();d.dismiss();});
    await p.evaluate(()=>document.querySelector('[data-act="page-close"]').click());await p.waitForTimeout(300);
    T('저장 안 하고 나가려 하면 확인창 · 취소하면 화면에 그대로',/저장하지 않은/.test(msg)&&await p.evaluate(()=>!!document.querySelector('#tnPrev')),msg);
    p.once('dialog',d=>d.accept());
    await p.evaluate(()=>document.querySelector('[data-act="page-close"]').click());await p.waitForTimeout(300);
    s=await saved(p);
    T('나가면 저장 안 한 값은 버려지고 저장된 값(0.5)으로 돌아옴',s.tune.appCover.stkGX===0.5&&await p.evaluate(()=>!document.querySelector('#tnPrev')&&getComputedStyle(document.documentElement).getPropertyValue('--tgx').trim()==='0.5'));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 경고 줄: 메모가 줄어들 때
  {
    const st={...base};delete st.tune;
    const memos={'2026-10-16':[m('a','첫째'),m('b','둘째'),m('c','셋째')]};
    const p=await boot(b,{...st,memos},{touch:true});
    await openTune(p);
    T('값이 무난하면 경고 없음',await p.evaluate(()=>document.querySelector('#tnWarn').textContent.trim()===''));
    await setR(p,'appCover','memoY',-1);await p.waitForTimeout(300);
    const w=await p.evaluate(()=>document.querySelector('#tnWarn').textContent);
    T('메모를 위로 많이 올리면(−1) 경고가 뜸(근무 글자와 겹침)',/메모/.test(w),w+' | '+await p.evaluate(()=>JSON.stringify({pl:[...document.querySelectorAll('#tnPrev .pill-wrap>*')].map(x=>[x.clientHeight,x.scrollHeight]),plf:getComputedStyle(document.documentElement).getPropertyValue('--plf'),plh:getComputedStyle(document.documentElement).getPropertyValue('--plh'),prevH:document.querySelector('#tnPrev').clientHeight})));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 접고 펼 때(폭이 바뀔 때) 그 화면 값으로 바로 바뀜
  {
    const st={...base,tune:{appCover:{...base.tune.appCover,stk:.7},appInner:{...base.tune.appInner,stk:1.4},cover:base.tune.cover,inner:base.tune.inner}};
    const p=await boot(b,st,{w:390,h:844,touch:true});
    const g=()=>p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--tstk').trim());
    T('좁은 화면: 커버 값(0.7)',await g()==='0.7');
    await p.setViewportSize({width:820,height:1100});await p.waitForTimeout(600);
    T('폭이 넓어지면(펼침) 새로고침 없이 안쪽 값(1.4)으로 바뀜',await g()==='1.4',await g());
    await p.setViewportSize({width:390,height:844});await p.waitForTimeout(600);
    T('다시 좁아지면(접음) 커버 값(0.7)으로 돌아옴',await g()==='0.7',await g());
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 요청 링 기간: 승인 하루 · 거절 3일 · 받은 요청 처리는 바로 사라짐
  {
    const R=(id,date,st,age,x={})=>({id,date,want:'휴',msg:'',st,reply:'',prev:null,t:t-age,tu:t-age,by:'guest',...x});
    const reqs=[R('a','2026-10-13','accepted',6*36e5),R('b','2026-10-14','accepted',30*36e5),R('c','2026-10-15','rejected',2*864e5),R('d','2026-10-16','rejected',4*864e5),R('e','2026-10-19','rejected',36e5,{srv:true,dir:'in'})];
    const p=await boot(b,{...base,requests:reqs},{touch:true});
    const ring=await p.evaluate(()=>['13','14','15','16','19'].map(d=>{const c=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="2026-10-${d}"]`);return (c.className.match(/rq-\w+/)||[''])[0];}));
    T('승인 6시간=ok · 승인 30시간=없음 · 거절 2일=no · 거절 4일=없음 · 받은 요청 처리=없음',JSON.stringify(ring)==='["rq-ok","","rq-no","",""]',JSON.stringify(ring));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 칸 채우기: 명절 띠 파스텔 · 오늘 칸 떠 보임
  {
    const p=await boot(b,{...base,calLook:'fill'},{touch:true});
    const r=await p.evaluate(()=>{const c=getComputedStyle(document.documentElement);const td=document.querySelector('.track .panel:nth-child(2) .cell.today');return {hb:c.getPropertyValue('--hol-bg').trim(),hx:c.getPropertyValue('--holx').trim(),sh:td?getComputedStyle(td).boxShadow:''};});
    T('칸 채우기: 명절 띠가 연한 분홍(#fcebee) · 글자는 장미빛',r.hb==='#fcebee'&&r.hx==='#c8627a',JSON.stringify(r));
    T('오늘 칸: 테두리 없이 아래쪽 그림자',/rgba?\(/.test(r.sh)&&r.sh!=='none'&&!/ 0px 0px 0px 1\.5px/.test(r.sh),r.sh);
    const q=await boot(b,{...base},{touch:true});
    T('동그라미 모양은 명절 띠 색 그대로(#f8d5d9)',await q.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--hol-bg').trim()==='#f8d5d9'));
    await q.close();T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 오늘 칸에 스티커 2개: 일반 날과 같은 줄에 놓임(오늘 도장 때문에 아래로 밀리지 않음)
  {
    const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
    const defs=['👟','📖'].map((e,i)=>mk('m'+i,e,'s'+i,{dates:['2026-10-12','2026-10-13']}));
    for(const w of [412,390]){
      const p=await boot(b,{...base,calLook:'fill',stamps:{defs,log:{},v3:1,v4:1,lastAt:[]}},{w,h:900,touch:true});
      const r=await p.evaluate(()=>['2026-10-12','2026-10-13'].map(k=>{const c=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);return [c.querySelectorAll('.dn>.stp>*').length,c.querySelectorAll('.s2>*').length];}));
      T(`폭 ${w}: 오늘(12일)도 일반 날(13일)처럼 스티커 2개가 첫 줄`,JSON.stringify(r)==='[[2,0],[2,0]]',JSON.stringify(r));
      await p.close();
    }
  }
  T.sum();await b.close();
})();
