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
    const p=await boot(b,{...base,memos,tune:{appCover:{stk:99,ink:'x'},cover:{stk:1.2},inner:null}},{touch:true});
    const raw=await p.evaluate(()=>{window.__cp=[];window.AndroidBridge.copyText=t=>window.__cp.push(t);window.AndroidBridge.widgetDebug=()=>'한 달 위젯 #7: 최소폭 300dp → 커버 값';window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(JSON.parse(j));return 1;});
    await toSet(p);
    T('설정에는 "모양 조정" 줄이 안 보임(숨은 화면)',await p.evaluate(()=>!/모양 조정/.test(document.querySelector('#view').textContent)));
    for(let i=0;i<7;i++)await p.evaluate(()=>document.querySelector('[data-act="about-tap"]').click());await p.waitForTimeout(500);
    T('앱 정보를 7번 누르면 개발자 메뉴에 "모양 조정" 버튼',await p.evaluate(()=>!!document.querySelector('[data-act="tune-open"]')));
    await p.evaluate(()=>document.querySelector('[data-act="tune-open"]').click());await p.waitForTimeout(500);
    T('모양 조정 화면: 앱 달력 미리보기(일주일 줄만 · 7칸) + 슬라이더 46개(앱 안쪽 · 앱 커버 × 12 · 위젯 커버 · 위젯 안쪽 × 11)',await p.evaluate(()=>document.querySelectorAll('#tnPrev .grid .cell').length===7&&document.querySelectorAll('.tn-r').length===46),String(await p.evaluate(()=>document.querySelectorAll('.tn-r').length)));
    T('모양 조정 화면에 놓인 위젯의 마지막 그림 상태(커버 · 안쪽 중 어느 값을 썼는지)가 보임',await p.evaluate(()=>/최소폭 300dp → 커버 값/.test(document.querySelector('#page').textContent)));
    T('이상한 저장 값은 범위 안으로(99 → 1.6 · 글자 → 기본 1.15)',await p.evaluate(()=>{const s=document.querySelector('.tn-r[data-g="appCover"][data-k="stk"]'),i=document.querySelector('.tn-r[data-g="appCover"][data-k="ink"]');return +s.value===1.6&&+i.value===1.15;}));
    const setR=(g,k,v)=>p.evaluate(([g,k,v])=>{const e=document.querySelector(`.tn-r[data-g="${g}"][data-k="${k}"]`);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},[g,k,v]);
    await setR('appCover','stk',1.3);await setR('appCover','ink',0.8);await setR('appCover','memo',1.2);await p.waitForTimeout(300);
    const css=await p.evaluate(()=>{const s=getComputedStyle(document.documentElement);return {stk:s.getPropertyValue('--tstk').trim(),ink:s.getPropertyValue('--tink').trim(),plf:parseFloat(s.getPropertyValue('--plf'))};});
    T('앱 달력 슬라이더가 바로 반영(스티커 1.3 · 주야 0.8)',css.stk==='1.3'&&css.ink==='0.8',JSON.stringify(css));
    T('값 숫자 표시가 따라 바뀜',await p.evaluate(()=>document.getElementById('tnv_appCover_stk').textContent==='1.30'));
    {const d=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1')).tune;return {stk:s.appCover.stk,bar:document.querySelector('#tnBar').textContent,dis:document.querySelector('[data-act="tune-save"]').disabled};});T('저장 전에는 저장된 값이 그대로(저장 안 한 값이 있어요 표시 · 저장 버튼 켜짐)',d.stk!==1.3&&/저장 안 한/.test(d.bar)&&!d.dis,JSON.stringify(d));}
    await setR('cover','ink',0.9);await setR('inner','memo',1.4);await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="tune-save"]').click());await p.waitForTimeout(1200);
    const w=await p.evaluate(()=>window.__wg[window.__wg.length-1]);
    T('위젯 데이터에 커버 · 안쪽 값이 실림',!!w&&w.tune&&w.tune.cover.ink===0.9&&w.tune.inner.memo===1.4&&w.tune.cover.stk===1.2,JSON.stringify(w&&w.tune));
    T('저장됨',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1')).tune;return s.appCover.stk===1.3&&s.cover.ink===0.9&&s.inner.memo===1.4;}));
    await p.evaluate(()=>document.querySelector('[data-act="tune-copy"]').click());await p.waitForTimeout(200);
    const cp=await p.evaluate(()=>window.__cp);
    T('값 복사: 앱 · 위젯 커버 · 위젯 안쪽 값이 한 글에 들어감',cp.length===1&&/\[모양 조정\]/.test(cp[0])&&/앱 달력 안쪽/.test(cp[0])&&/앱 달력 커버/.test(cp[0])&&/위젯 커버/.test(cp[0])&&/위젯 안쪽/.test(cp[0])&&/1\.3/.test(cp[0]),cp[0]);
    await p.evaluate(()=>document.querySelector('[data-act="tune-reset"]').click());await p.waitForTimeout(400);
    T('처음 값으로: 화면에서만 기본값(저장은 "저장"을 눌러야)',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1')).tune;return s.appCover.stk===1.3&&+document.querySelector('.tn-r[data-g="appInner"][data-k="stk"]').value===1.05&&+document.querySelector('.tn-r[data-g="cover"][data-k="ink"]').value===1.5;}));
    await p.evaluate(()=>document.querySelector('[data-act="tune-save"]').click());await p.waitForTimeout(300);
    T('저장하면 기본값이 됨(앱 커버 주야 1.15 · 앱 안쪽 메모 1 · 위젯 안쪽 메모 1.1) · 이전 저장이 기록에 남음',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return s.tune.appCover.ink===1.15&&s.tune.appInner.memo===1&&s.tune.inner.memo===1.1&&s.tuneHist.length>=2;}));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 공휴일 이름 · 스티커 자리 (v0.87: 커버 화면에서 스티커 2개 이상이면 이름은 숫자 아래 두 글자 · 아래 줄 스티커와 부딪히면 한 글자)
  {
    const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
    const defs=[{id:'s_pill',kind:'pill',emoji:'💊',name:'약',times:1,color:'#ef4d5a',rep:'none',days:[],dates:['2026-10-09'],skip:[],ats:[]},mk('a','👟','조깅',{dates:['2026-10-09']}),mk('b','📖','독서',{dates:['2026-10-09']}),mk('c','💰','가계',{dates:['2026-10-09']})];
    for(const w of [300,390]){
      const p=await boot(b,{...base,stamps:{defs,log:{},v3:1,v4:1,lastAt:[]}},{w,h:800,touch:true});
      const r=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-09"]');return {h1:(c.querySelector('.h1')||{}).textContent||'',hnb:!!c.querySelector('.hnb'),hbt:(c.querySelector('.hnb')||{}).textContent||'',s1:c.querySelectorAll('.dn>.stp>*').length,s2:c.querySelectorAll('.s2>*').length};});
      T(`한글날 + 스티커 4개 (폭 ${w}, 커버): 이름은 숫자 아래(두 글자 또는 한 글자)`,r.hnb&&(r.hbt==='한'||r.hbt==='한글')&&r.s1+r.s2===4,JSON.stringify(r));
      T(`폭 ${w}: 스티커 둘째 줄이 생김(4개는 한 줄에 안 들어감)`,r.s2>=2,JSON.stringify(r));
      T(`폭 ${w}: 오류 없음`,p.errs.length===0,p.errs.join('|'));await p.close();
    }
  }
  // ── 스티커를 옆으로 옮겨도(모양 조정) 자리가 있는데 아래 줄로 밀리지 않음
  {
    const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
    const defs=[mk('a','👟','조깅',{dates:['2026-10-09']}),mk('b','💪','운동',{dates:['2026-10-09']})];
    const res=[];
    for(const t of [0,0.5]){
      const p=await boot(b,{...base,stamps:{defs,log:{},v3:1,v4:1,lastAt:[]},tune:{appCover:{stkX:t,stk:1.3}}},{touch:true});
      res.push(await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-09"]');return {s1:c.querySelectorAll('.dn>.stp>*').length,s2:c.querySelectorAll('.s2>*').length,hnb:!!c.querySelector('.hnb')};}));
      await p.close();
    }
    T('스티커 2개 + 한글날(커버): 스티커는 한 줄에 그대로(옆으로 옮겨도 아래로 안 밀림) · 이름은 숫자 아래',res[0].s1===2&&res[0].s2===0&&res[1].s1===2&&res[1].s2===0&&res[0].hnb&&res[1].hnb,JSON.stringify(res));
  }
  // ── 모양 조정을 열었다 닫아도 달력 메모 줄 수가 달라지지 않음 (미리보기 달력을 메인 달력으로 착각해 1줄로 줄던 문제)
  {
    const m=(id,text)=>({id,text,shared:false,by:'host',t});
    const p=await boot(b,{...base,memos:{'2026-10-16':[m('a','첫째'),m('b','둘째'),m('c','셋째')]}},{touch:true});
    const cnt=()=>p.evaluate(()=>document.querySelectorAll('.track .panel:nth-child(2) .cell[data-k="2026-10-16"] .pill-wrap>*').length);
    const before=await cnt();
    await toSet(p);
    for(let i=0;i<7;i++)await p.evaluate(()=>document.querySelector('[data-act="about-tap"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('[data-act="tune-open"]').click());await p.waitForTimeout(500);
    await p.evaluate(()=>document.querySelector('[data-act="page-close"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="page-close"]')&&document.querySelector('[data-act="page-close"]').click());
    await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(500);
    const after=await cnt();
    T('모양 조정을 열었다 닫은 뒤에도 메모 줄 수가 그대로',before>=2&&after===before,before+' → '+after);
    T('닫으면 미리보기 달력이 남아 있지 않음',await p.evaluate(()=>!document.querySelector('#tnPrev')));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 앱 달력 모양 값은 화면 크기로 자동 선택 (폭 600dp 이상 = 안쪽 · 아니면 커버) · 값이 없으면 기본값
  {
    const st={...base};delete st.tune;
    const rd=async(w,h)=>{const p=await boot(b,st,{w,h,touch:true});const r=await p.evaluate(()=>{const c=getComputedStyle(document.documentElement);return {stk:c.getPropertyValue('--tstk').trim(),ink:c.getPropertyValue('--tink').trim(),err:0};});r.errs=p.errs.length;await p.close();return r;};
    const small=await rd(390,844),big=await rd(820,1100);
    T('작은 화면(390): 앱 커버 값(기본 스티커 1.15 · 주야 1.15)',small.stk==='1.15'&&small.ink==='1.15'&&small.errs===0,JSON.stringify(small));
    T('큰 화면(820): 앱 안쪽 값(기본 스티커 1.05 · 주야 1.15)',big.stk==='1.05'&&big.ink==='1.15'&&big.errs===0,JSON.stringify(big));
    const p=await boot(b,st,{touch:true});await p.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(JSON.parse(j));});await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="more-widget"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="wg-look"][data-v="fill"]').click());await p.waitForTimeout(1000);
    const w=await p.evaluate(()=>window.__wg[window.__wg.length-1]);
    T('위젯 기본값: 커버(주야 1.5 · 메모 1.5) · 안쪽(주야 0.95 · 메모 1.1)',!!w&&w.tune&&w.tune.cover.ink===1.5&&w.tune.cover.memo===1.5&&w.tune.inner.ink===0.95&&w.tune.inner.memo===1.1,JSON.stringify(w&&w.tune));
    await p.close();
  }
  T.sum();await b.close();
})();
