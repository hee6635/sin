// v0.95: 업무 일지 전체 복사 · 위젯 날짜 창용 글(가까운 날만) · 앱 달력 메모 위치(잘림 없이)
const {chromium,boot,mkT,base}=require('./lib.js');
const ONLY=process.env.ONLY||'';
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const want=k=>!ONLY||ONLY.split(',').includes(k);
  const t0=+new Date('2026-10-12T10:00:00');
  const wlog={name:'인수인계',secs:[{id:'a',n:'인수',h:false},{id:'b',n:'인계',h:false},{id:'c',n:'지시',h:true},{id:'d',n:'특이사항',h:false}],backup:false,seen:true,
    days:{'2026-10-12':{a:'3번 라인 점검 끝\n필터 교체',b:'원료 확인\n순찰 2회   ',c:'숨긴 칸 글',d:'2호기 압력 낮음'},'2026-12-20':{a:'먼 날 글'}}};
  const memo=(id,text,x={})=>({id,text,shared:false,by:'host',t:t0,...x});
  if(want('copy')){
    const p=await boot(b,{...base,addons:{...base.addons,wlog:true},wlog},{touch:true});
    await p.evaluate(()=>{window.__cp=null;window.AndroidBridge.copyText=t=>{window.__cp=t;};});
    await p.evaluate(()=>document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-10-12"]').click());await p.waitForTimeout(500);
    await p.evaluate(()=>document.querySelector('.wlrow').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="wl-copy"]').click());await p.waitForTimeout(200);
    const cp=await p.evaluate(()=>window.__cp);
    T('전체 복사: 날짜 줄 + 칸 이름 + 글 · 칸 사이 빈 줄 · 숨긴 칸 · 끝 공백 빠짐',cp==='10/12(월) 휴무\n\n인수\n3번 라인 점검 끝\n필터 교체\n\n인계\n원료 확인\n순찰 2회\n\n특이사항\n2호기 압력 낮음',JSON.stringify(cp));
    T('복사했어요 알림',await p.evaluate(()=>/복사했어요/.test(document.body.textContent)));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  if(want('wg')){
    const p=await boot(b,{...base,addons:{...base.addons,wlog:true},wlog},{});
    await p.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(j);window.__refresh();});await p.waitForTimeout(1200);
    const r=await p.evaluate(()=>{const o=JSON.parse(window.__wg[window.__wg.length-1]);const f=k=>{let r=null;const w=x=>{if(Array.isArray(x))x.forEach(w);else if(x&&typeof x==='object'){if(x.k===k&&x.wlr)r=x;Object.values(x).forEach(w);}};w(o);return r;};return {near:f('2026-10-12'),far:f('2026-12-20')};});
    T('가까운 날: 위젯 날짜 창에서 펼쳐 볼 칸별 글(숨긴 칸 빼고)',!!r.near&&Array.isArray(r.near.wlr.s)&&r.near.wlr.s.map(x=>x.n).join()==='인수,인계,특이사항'&&r.near.wlr.s[0].t==='3번 라인 점검 끝\n필터 교체',JSON.stringify(r.near&&r.near.wlr));
    T('먼 날: 글은 안 보냄(이름 · 개수만 → 누르면 앱으로)',!!r.far&&!r.far.wlr.s&&r.far.wlr.c==='인수 1',JSON.stringify(r.far&&r.far.wlr));
    await p.close();
  }
  if(want('memoY')){
    for(const y of [3,-1]){
      const tune=JSON.parse(JSON.stringify(base.tune));tune.appCover.memoY=y;
      const p=await boot(b,{...base,tune,calLook:'fill',memos:{'2026-10-08':[memo('a','병원')],'2026-10-13':[memo('b','하나'),memo('c','둘'),memo('d','셋')]}},{w:344,h:860});
      const r=await p.evaluate(()=>['2026-10-08','2026-10-13'].map(k=>{const c=document.querySelector(`#track .panel:nth-child(2) .cell[data-k="${k}"]`),cr=c.getBoundingClientRect(),ps=[...c.querySelectorAll('.pill-wrap>*')],l=ps[ps.length-1].getBoundingClientRect(),f=ps[0].getBoundingClientRect(),bw=c.querySelector('.bwrap').getBoundingClientRect();return {gap:+(cr.bottom-l.bottom).toFixed(1),top:+(f.top-bw.bottom).toFixed(1)};}));
      if(y===3){
        T('메모 위치 3(아래): 1줄 메모는 칸 바닥 가까이(4px 안) · 넘치지 않음',r[0].gap>=-0.6&&r[0].gap<=4,JSON.stringify(r));
        T('메모 위치 3: 3줄이 꽉 찬 날은 잘리지 않음(바닥을 안 넘음)',r[1].gap>=-0.6,JSON.stringify(r));
      }else T('메모 위치 −1(위): 위로 올라감(근무 표시와 가까워짐)',r[0].top<0,JSON.stringify(r));
      T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
    }
  }
  T.sum();await b.close();
})();
