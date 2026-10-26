// v0.92: 글자 크게여도 스티커 그대로 · 날짜 창 근무타입 접기 · 강조색 파스텔 · 가족 포스트잇(서버 복사본 보이기 · 남의 것은 제목 못 고침)
const {chromium,boot,mkT,base}=require('./lib.js');
const ONLY=process.env.ONLY||'';
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const want=k=>!ONLY||ONLY.split(',').includes(k);
  const t0=+new Date('2026-10-12T10:00:00');
  const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
  // ── 1. 글자 크게(폰 textZoom 120%) → 이모지 스티커는 1.2로 나눠서 그대로
  if(want('tz')){
    const defs=[mk('a','👟','운동',{dates:['2026-10-14']})];
    const st={...base,stamps:{defs,log:{},v3:1,v4:1,lastAt:[]}};
    const p=await boot(b,{...st,fontScale:100},{touch:true});
    const fs0=await p.evaluate(()=>{const e=document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-10-14"] .stp .se');return e?parseFloat(getComputedStyle(e).fontSize):0;});
    await p.close();
    const q=await boot(b,{...st,fontScale:120},{touch:true});
    const r=await q.evaluate(()=>{const e=document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-10-14"] .stp .se');return {tz:getComputedStyle(document.documentElement).getPropertyValue('--tz').trim(),fs:e?parseFloat(getComputedStyle(e).fontSize):0};});
    T('글자 크게: --tz 1.2 (폰 글자 확대만큼 스티커를 나눠 둠)',r.tz==='1.2',JSON.stringify(r));
    T('글자 크게일 때 이모지 스티커 글자 크기 = 보통 ÷ 1.2 (폰에서 1.2배 되면 보통과 같음)',fs0>0&&Math.abs(r.fs*1.2-fs0)<0.6,JSON.stringify({fs0,fs:r.fs}));
    T('오류 없음',q.errs.length===0,q.errs.join('|'));await q.close();
  }
  // ── 2. 날짜 창 근무타입 접기
  if(want('fold')){
    const p=await boot(b,{...base},{touch:true,fold:true});
    const openDay=k=>p.evaluate(k=>{const c=document.querySelector(`#track .panel:nth-child(2) .cell[data-k="${k}"]`);c.click();},k);
    const st=()=>p.evaluate(()=>{const s=document.querySelector('.shsec');return s?{open:s.classList.contains('open'),pill:(s.querySelector('.sh-pill')||{}).textContent,chipsH:s.querySelector('.sh-body').getBoundingClientRect().height}:null;});
    await openDay('2026-10-12');await p.waitForTimeout(600);
    let r=await st();
    T('처음엔 접힘: 알약 "휴무 ▾" 하나 · 칩 줄은 높이 0',r&&!r.open&&/휴무/.test(r.pill)&&r.chipsH<2,JSON.stringify(r));
    await p.evaluate(()=>document.querySelector('.shsec .sh-pill').click());await p.waitForTimeout(400);
    r=await st();T('알약을 누르면 칩 줄이 열림',r.open&&r.chipsH>30,JSON.stringify(r));
    await p.evaluate(()=>document.querySelector('.tchip[data-s="주"]').click());await p.waitForTimeout(500);
    r=await st();T('근무를 골라도 열린 채(앱을 쓰는 동안 유지)',r.open,JSON.stringify(r));
    await p.evaluate(()=>{document.querySelector('#sheet [data-act="close"]').click();});await p.waitForTimeout(400);
    await openDay('2026-10-13');await p.waitForTimeout(600);
    r=await st();T('날짜 창을 닫고 다른 날을 열어도 열린 채',r.open,JSON.stringify(r));
    // 앱을 나갔다가 5분 안에 돌아옴 → 그대로 / 5분 넘게 → 접힘
    const away=ms=>p.evaluate(ms=>{const now0=Date.now;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
      const t1=now0()+ms;Date.now=()=>t1;Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));Date.now=now0;},ms);
    await away(3*60e3);await p.evaluate(()=>{document.querySelector('#sheet [data-act="close"]').click();});await p.waitForTimeout(300);
    await openDay('2026-10-14');await p.waitForTimeout(600);
    r=await st();T('앱을 나갔다가 3분 만에 돌아오면 열린 채',r.open,JSON.stringify(r));
    await away(6*60e3);await p.evaluate(()=>{document.querySelector('#sheet [data-act="close"]').click();});await p.waitForTimeout(300);
    await openDay('2026-10-15');await p.waitForTimeout(600);
    r=await st();T('6분 만에 돌아오면 다시 접힘',r&&!r.open,JSON.stringify(r));
    await p.evaluate(()=>document.querySelector('.shsec .sh-pill').click());await p.waitForTimeout(300);
    T('다시 열기',await p.evaluate(()=>document.querySelector('.shsec').classList.contains('open')));
    await p.evaluate(()=>document.querySelector('.shsec .sh-fold').click());await p.waitForTimeout(300);
    r=await st();T('▴ 접기로 직접 접기',r&&!r.open,JSON.stringify(r));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
    // 불규칙 근무표는 날마다 근무를 넣으니 처음부터 펼침
    const q=await boot(b,{...base,noPat:true,overrides:{}},{touch:true,fold:true});
    await q.evaluate(()=>document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-10-12"]').click());await q.waitForTimeout(600);
    T('불규칙 근무표(noPat)는 처음부터 펼침',await q.evaluate(()=>document.querySelector('.shsec').classList.contains('open')));
    await q.close();
  }
  // ── 3. 강조색: 고른 버튼은 파스텔 바탕 + 진한 글자 (진한 파랑 바탕에 흰 글자 아님)
  if(want('acc')){
    const p=await boot(b,{...base},{touch:true});
    await p.evaluate(()=>document.querySelector('#nav [data-tab="set"]').click());await p.waitForTimeout(400);await p.evaluate(()=>{const b=document.querySelector('[data-act="more-look"]');if(b)b.click();});await p.waitForTimeout(300);
    const r=await p.evaluate(()=>{const e=document.querySelector('#page .chips button.on');const cs=getComputedStyle(e);return {bg:cs.backgroundColor,fg:cs.color};});
    T('설정 "보통" 같은 고른 버튼: 연한 바탕(밝기 높음) · 흰 글자 아님',(()=>{const m=r.bg.match(/\d+/g).map(Number);return m[0]+m[1]+m[2]>600&&r.fg!=='rgb(255, 255, 255)';})(),JSON.stringify(r));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 4. 가족 포스트잇: 서버 복사본이 벽 · 달력 날짜에 보임 · 남의 것은 제목 못 고침 · 지우기 없음
  if(want('board')){
    const me='uMe000',mom='uMom00';
    const doc={by:mom,byName:'엄마',mk:'2026-10',type:'list',title:'장보기',text:'',date:'2026-10-20',dateAuto:true,repeat:false,rootId:'',torn:false,tornAt:0,t:t0,reacts:{},lines:{a1:{x:'우유',d:true,b:mom,o:0},b2:{x:'계란',d:false,b:'',o:1}},ua:t0,ub:mom};
    const st={...base,link:{hid:'uHost0',role:'guest',name:'나',perm:'write',mode:'own',uid:me,hash:'',stkAsked:1},
      fam2:{members:[{uid:'uHost0',role:'host',name:'아빠',mode:'own'},{uid:mom,role:'guest',name:'엄마',mode:'own'},{uid:me,role:'guest',name:'나',mode:'own'}],scheds:{},memos:{},reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:[],init:true,
        board:{[mom+'_p1']:doc,'bad id!':{x:1},[mom+'_p2']:{by:mom,mk:'nope'}},boardDot:1}};
    const p=await boot(b,st,{touch:true});
    T('포스트잇 아이콘에 작은 점 · 할 일 남은 수 1',await p.evaluate(()=>!!document.querySelector('.pi-btn .pi-dot')&&(document.querySelector('.pi-btn .bdg')||{}).textContent==='1'));
    T('달력 20일 칸에 가족 포스트잇 줄',await p.evaluate(()=>/장보기/.test(document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-10-20"]').textContent)));
    await p.evaluate(()=>document.querySelector('[data-act="open-board"]').click());await p.waitForTimeout(500);
    const w=await p.evaluate(()=>document.querySelector('#page').textContent);
    T('벽에 "장보기 · 우유(엄마가 완료) · 계란" · 점은 사라짐',/장보기/.test(w)&&/엄마가 완료/.test(w)&&/계란/.test(w)&&await p.evaluate(()=>!JSON.parse(localStorage.getItem('eonjeswieo:v1')).fam2.boardDot),w.slice(0,200));
    await p.evaluate(()=>[...document.querySelectorAll('#page .pi')].find(e=>/장보기/.test(e.textContent)).click());await p.waitForTimeout(400);
    T('남의 가족 포스트잇: 제목 읽기 전용 · 지우기 없음 · 나만/가족 고르기 없음 · 줄 추가 칸은 있음',await p.evaluate(()=>document.querySelector('#piTitle').readOnly&&!document.querySelector('#pop [data-act="pi-del"]')&&!document.querySelector('#pop [data-act="pi-share"]')&&!!document.querySelector('#piLine')));
    // 체크하면 복사본이 바로 바뀜 (서버는 연결이 없어 안 감 · 오류도 없음)
    await p.evaluate(()=>[...document.querySelectorAll('#pop .ck i')][1].click());await p.waitForTimeout(400);
    const l=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).fam2.board['uMom00_p1'].lines.b2);
    const s0=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).fam2.board);
    T('저장된 가족 포스트잇 복사본: 모양이 틀린 것은 버리고 켜짐(normalize · 저장 뒤 확인)',Object.keys(s0).length===1&&!!s0['uMom00_p1'],JSON.stringify(Object.keys(s0)));
    T('계란 체크 → 복사본에 d=true · b=내 uid (화면 바로)',l.d===true&&l.b==='uMe000',JSON.stringify(l));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
