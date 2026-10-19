// v0.79: 앱 달력 칸 채우기 모양(선택) · 숨은 "모양 조정" 화면(앱 달력 · 한 달 위젯 커버/안쪽) · 값 복사
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const t=+new Date('2026-10-11T10:00:00');
  const m=(id,text,sh)=>({id,text,shared:!!sh,by:'host',t});
  const memos={'2026-10-16':[m('a','10시 치과',0),m('b','11시 자동차',1)]};
  const reqs=[{id:'q2',date:'2026-10-22',want:'휴',msg:'',st:'rejected',reply:'',prev:null,t,tu:t,by:'guest'}];
  const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
  const toSet=async p=>{await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);};

  // ── 달력 모양 선택
  {
    const p=await boot(b,{...base,memos,requests:reqs},{touch:true});
    T('기본: 동그라미 (data-cal 없음)',await p.evaluate(()=>!document.documentElement.hasAttribute('data-cal')));
        await toSet(p);
    T('설정 › 화면에 "달력 모양" 줄 (동그라미 · 칸 채우기)',await p.evaluate(()=>!!document.querySelector('[data-act="callook"][data-v="fill"]')&&!!document.querySelector('[data-act="callook"][data-v="circle"]')));
    await p.evaluate(()=>document.querySelector('[data-act="callook"][data-v="fill"]').click());await p.waitForTimeout(400);
    T('칸 채우기를 고르면 저장 · data-cal=fill',await p.evaluate(()=>document.documentElement.getAttribute('data-cal')==='fill'&&JSON.parse(localStorage.getItem('eonjeswieo:v1')).calLook==='fill'));
    await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(400);
    const r=await p.evaluate(()=>{const s=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;const g=k=>document.querySelector(s(k));const bg=e=>getComputedStyle(e).backgroundColor;
      const work=g('2026-10-15'),rest=g('2026-10-13');
      return {workCb:work.getAttribute('style')||'',restCb:rest.getAttribute('style')||'',workBg:bg(work),restBg:bg(rest),badge:getComputedStyle(work.querySelector('.badge')).backgroundColor,ring:getComputedStyle(g('2026-10-22').querySelector('.badge')).boxShadow};});
    T('일하는 날 칸에는 근무 색(--cb)이 있고 쉬는 날 칸에는 없음',/--cb/.test(r.workCb)&&!/--cb/.test(r.restCb),JSON.stringify(r));
    T('일하는 날 칸 배경이 색으로 채워짐 · 쉬는 날은 투명',r.workBg!==r.restBg&&/rgba\(0, 0, 0, 0\)|transparent/.test(r.restBg),r.workBg+' / '+r.restBg);
    T('동그라미 배경이 없어짐(글자만)',/rgba\(0, 0, 0, 0\)|transparent/.test(r.badge),r.badge);
    T('거절 링은 글자 주위(안쪽 링) · 빨강',/inset/.test(r.ring)&&/209, 47, 74/.test(r.ring),r.ring);
    const num=await p.evaluate(()=>{const g=k=>getComputedStyle(document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"] .dn .num`)).color;return {no:g('2026-10-22'),plain:g('2026-10-21')};});
    T('요청 날짜 숫자는 일반 색 (링만)',num.no===num.plain,JSON.stringify(num));
    await p.screenshot({path:'/tmp/s57_fill.png',clip:{x:0,y:0,width:390,height:760}});
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 옛 데이터(모양 값 없음) · 이상한 값 → 동그라미
    for(const [nm,v] of [['옛 데이터',undefined],['이상한 값','weird']]){
      const st={...base};if(v!==undefined)st.calLook=v;
      const p=await boot(b,st,{touch:true});
      T(`${nm} → 동그라미`,await p.evaluate(()=>!document.documentElement.hasAttribute('data-cal')));
      T(`${nm}: 오류 없음`,p.errs.length===0,p.errs.join('|'));await p.close();
    }
  }
  // ── 숨은 모양 조정 화면
  {
    const p=await boot(b,{...base,memos,tune:{app:{stk:99,ink:'x'},cover:{stk:1.2},inner:null}},{touch:true});
    const raw=await p.evaluate(()=>{window.__cp=[];window.AndroidBridge.copyText=t=>window.__cp.push(t);window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(JSON.parse(j));return 1;});
    await toSet(p);
    T('설정에는 "모양 조정" 줄이 안 보임(숨은 화면)',await p.evaluate(()=>!/모양 조정/.test(document.querySelector('#view').textContent)));
    for(let i=0;i<7;i++)await p.evaluate(()=>document.querySelector('[data-act="about-tap"]').click());await p.waitForTimeout(500);
    T('앱 정보를 7번 누르면 개발자 메뉴에 "모양 조정" 버튼',await p.evaluate(()=>!!document.querySelector('[data-act="tune-open"]')));
    await p.evaluate(()=>document.querySelector('[data-act="tune-open"]').click());await p.waitForTimeout(500);
    T('모양 조정 화면: 앱 달력 미리보기(일주일 줄만 · 7칸) + 슬라이더 21개(앱 · 커버 · 안쪽 × 7)',await p.evaluate(()=>document.querySelectorAll('#tnPrev .grid .cell').length===7&&document.querySelectorAll('.tn-r').length===21),String(await p.evaluate(()=>document.querySelectorAll('.tn-r').length)));
    T('이상한 저장 값은 범위 안으로(99 → 1.6 · 글자 → 기본 1)',await p.evaluate(()=>{const s=document.querySelector('.tn-r[data-g="app"][data-k="stk"]'),i=document.querySelector('.tn-r[data-g="app"][data-k="ink"]');return +s.value===1.6&&+i.value===1;}));
    const setR=(g,k,v)=>p.evaluate(([g,k,v])=>{const e=document.querySelector(`.tn-r[data-g="${g}"][data-k="${k}"]`);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},[g,k,v]);
    await setR('app','stk',1.3);await setR('app','ink',0.8);await setR('app','memo',1.2);await p.waitForTimeout(300);
    const css=await p.evaluate(()=>{const s=getComputedStyle(document.documentElement);return {stk:s.getPropertyValue('--tstk').trim(),ink:s.getPropertyValue('--tink').trim(),plf:parseFloat(s.getPropertyValue('--plf'))};});
    T('앱 달력 슬라이더가 바로 반영(스티커 1.3 · 주야 0.8)',css.stk==='1.3'&&css.ink==='0.8',JSON.stringify(css));
    T('값 숫자 표시가 따라 바뀜',await p.evaluate(()=>document.getElementById('tnv_app_stk').textContent==='1.30'));
    await setR('cover','ink',0.9);await setR('inner','memo',1.4);await p.waitForTimeout(1200);
    const w=await p.evaluate(()=>window.__wg[window.__wg.length-1]);
    T('위젯 데이터에 커버 · 안쪽 값이 실림',!!w&&w.tune&&w.tune.cover.ink===0.9&&w.tune.inner.memo===1.4&&w.tune.cover.stk===1.2,JSON.stringify(w&&w.tune));
    T('저장됨',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1')).tune;return s.app.stk===1.3&&s.cover.ink===0.9&&s.inner.memo===1.4;}));
    await p.evaluate(()=>document.querySelector('[data-act="tune-copy"]').click());await p.waitForTimeout(200);
    const cp=await p.evaluate(()=>window.__cp);
    T('값 복사: 앱 · 위젯 커버 · 위젯 안쪽 값이 한 글에 들어감',cp.length===1&&/\[모양 조정\]/.test(cp[0])&&/앱 달력/.test(cp[0])&&/위젯 커버/.test(cp[0])&&/위젯 안쪽/.test(cp[0])&&/1\.3/.test(cp[0]),cp[0]);
    await p.evaluate(()=>document.querySelector('[data-act="tune-reset"]').click());await p.waitForTimeout(400);
    T('처음 값으로: 전부 기본(1 · 0)',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1')).tune;return s.app.stk===1&&s.cover.ink===1&&s.inner.memo===1&&s.app.stkX===0;}));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
