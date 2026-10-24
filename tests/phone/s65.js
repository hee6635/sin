// v0.93: 업무 일지(부가 기능 "업무 메모") · 메모/일지 찾기
const {chromium,boot,mkT,base}=require('./lib.js');
const ONLY=process.env.ONLY||'';
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const want=k=>!ONLY||ONLY.split(',').includes(k);
  const t0=+new Date('2026-10-12T10:00:00');
  const memo=(id,text,x={})=>({id,text,shared:false,by:'host',t:t0,...x});
  const st0={...base,memos:{'2026-10-12':[memo('m1','엄마 생신 저녁')],'2026-09-03':[memo('m2','병원 순찰 예약')]}};
  const click=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)throw new Error('없음 '+s);e.click();},sel);
  const openDay=(p,k)=>p.evaluate(k=>document.querySelector(`#track .panel:nth-child(2) .cell[data-k="${k}"]`).click(),k);
  const ls=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
  const act=(p,a)=>p.evaluate(a=>{const x=document.createElement('button');x.dataset.act=a;document.body.appendChild(x);x.click();x.remove();},a);
  // ── 1. 꺼져 있으면 아무것도 안 늘어남
  if(want('off')){
    const p=await boot(b,st0,{touch:true});
    await openDay(p,'2026-10-12');await p.waitForTimeout(500);
    T('꺼짐: 날짜 창 안내 줄은 그대로("가족에게는 자세히에서")',await p.evaluate(()=>/가족에게는 "자세히"에서/.test(document.querySelector('.ibar .note').textContent)&&!document.querySelector('.wlrow')));
    await click(p,'[data-act="memo-detail"]');await p.waitForTimeout(400);
    T('꺼짐: 메모 자세히에 일지 만들기 줄 없음',await p.evaluate(()=>!document.querySelector('[data-act="wl-new"]')));
    await p.evaluate(()=>document.querySelector('[data-act="md-back"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('#sheet [data-act="close"]').click());await p.waitForTimeout(300);
    await click(p,'#nav [data-tab="set"]');await p.waitForTimeout(300);
    T('꺼짐: 설정 맨 위 "🔍 메모 찾기"',await p.evaluate(()=>/메모 찾기/.test(document.querySelector('.srch-entry').textContent)&&!/일지/.test(document.querySelector('.srch-entry').textContent)));
    await click(p,'.srch-entry');await p.waitForTimeout(300);
    await p.fill('#srchQ','순찰');await p.waitForTimeout(400);
    const r=await p.evaluate(()=>({chips:document.querySelectorAll('#page [data-act="srch-kind"]').length,rows:[...document.querySelectorAll('.srow')].map(x=>x.textContent)}));
    T('꺼짐: 찾기에 메모/일지 칩 없음 · 9/3 메모 "병원 순찰 예약" 찾음 · 찾은 글자 표시',r.chips===0&&r.rows.length===1&&/9\/3/.test(r.rows[0])&&await p.evaluate(()=>document.querySelector('.srow mark').textContent==='순찰'),JSON.stringify(r));
    await click(p,'.srow');await p.waitForTimeout(600);
    T('찾은 줄을 누르면 그 달 · 그 날짜 창',await p.evaluate(()=>document.querySelector('#sheet').classList.contains('open')&&/9월 3일/.test(document.querySelector('#sheet').textContent)));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 2. 켜고 처음 만들기: 자세히 → 이름 → 안내 → 팝업에 쓰기
  if(want('first')){
    const p=await boot(b,{...st0,addons:{...base.addons,wlog:true}},{touch:true});
    await openDay(p,'2026-10-12');await p.waitForTimeout(500);
    T('켜짐: 안내 줄 "일지는 \\"자세히\\"에서"',await p.evaluate(()=>/일지는 "자세히"에서/.test(document.querySelector('.ibar .note').textContent)));
    await click(p,'[data-act="memo-detail"]');await p.waitForTimeout(400);
    T('자세히에 "📋 일지 만들기 · 인수 · 인계 · 지시 · 특이를 따로 적어요"',await p.evaluate(()=>{const e=document.querySelector('[data-act="wl-new"]');return !!e&&/일지 만들기/.test(e.textContent)&&/인수 · 인계 · 지시 · 특이를 따로/.test(e.textContent);}));
    await click(p,'[data-act="wl-new"]');await p.waitForTimeout(400);
    T('처음엔 이름 정하기 창(미리 "업무 일지" · 빠른 칩 5개)',await p.evaluate(()=>document.querySelector('#wlNm').value==='업무 일지'&&document.querySelectorAll('[data-act="wl-nmchip"]').length===5));
    await click(p,'[data-act="wl-nmchip"][data-v="인수인계"]');await click(p,'[data-act="wl-nmok"]');await p.waitForTimeout(300);
    const nt=await p.evaluate(()=>document.querySelector('#pop').textContent.replace(/\s+/g,' '));
    T('처음 한 번 안내: "인수인계는 백업되지 않아요 · 회사 보안 · 설정에서 켜 주세요"',/인수인계는 백업되지 않아요/.test(nt)&&/회사 보안을 위해 폰에만 저장돼요/.test(nt)&&/그래도 백업하시려면 설정에서 켜 주세요/.test(nt),nt);
    await click(p,'[data-act="wl-seen"]');await p.waitForTimeout(300);
    T('일지 팝업: 제목 "📋 인수인계 ✎" · 칸 4개 · "쓰는 대로 저장돼요"',await p.evaluate(()=>/인수인계/.test(document.querySelector('.wlp .ttl').textContent)&&document.querySelectorAll('.wls').length===4&&/쓰는 대로 저장돼요/.test(document.querySelector('.wlp .sub').textContent)));
    await click(p,'[data-act="wl-add"][data-s="b"]');await p.waitForTimeout(200);
    await p.keyboard.type('원료 재고 확인');await p.keyboard.press('Enter');await p.waitForTimeout(150);
    await p.keyboard.type('순찰 2회');await p.keyboard.press('Enter');await p.waitForTimeout(150);
    await click(p,'[data-act="wl-add"][data-s="d"]');await p.waitForTimeout(200);
    await p.keyboard.type('냉각수 압력 낮음');await p.waitForTimeout(100);
    await click(p,'[data-act="wl-close"]');await p.waitForTimeout(500);
    let s=await ls(p);
    T('엔터로 줄 이어 쓰기 · 닫으면 쓰던 줄도 저장(인계 2 · 특이 1)',s.wlog.name==='인수인계'&&s.wlog.days['2026-10-12'].b.length===2&&s.wlog.days['2026-10-12'].d.length===1&&s.wlog.seen===true,JSON.stringify(s.wlog.days));
    const row=await p.evaluate(()=>{const r=document.querySelector('.wlrow'),m=document.querySelector('#sheet .mcard');return r&&{t:r.textContent.replace(/\s+/g,' '),h:r.getBoundingClientRect().height,mh:m.getBoundingClientRect().height,first:r.previousElementSibling&&r.previousElementSibling.textContent.trim()==='메모'};});
    T('날짜 창: 메모 맨 위 일지 줄 "인수인계 · 인계 2 · 특이 1" · 메모 줄의 약 1.3배 높이',!!row&&/인수인계/.test(row.t)&&/인계 2 · 특이 1/.test(row.t)&&row.first&&row.h>=row.mh*1.25&&row.h<=row.mh*1.45,JSON.stringify(row));
    await p.evaluate(()=>document.querySelector('#sheet [data-act="close"]').click());await p.waitForTimeout(400);
    const cell=await p.evaluate(()=>{const c=document.querySelector('#track .panel:nth-child(2) .cell[data-k="2026-10-12"]');const pl=[...c.querySelectorAll('.pill-wrap>.pl')];return {cls:pl.map(x=>x.className),hs:pl.map(x=>Math.round(x.getBoundingClientRect().height)),t:pl.map(x=>x.textContent)};});
    T('달력 칸: 메모 맨 위 "📋 인수인계" 줄 · 다른 메모와 같은 높이',cell.cls[0]&&cell.cls[0].includes('wl')&&/인수인계/.test(cell.t[0])&&cell.hs.length>=2&&cell.hs[0]===cell.hs[1],JSON.stringify(cell));
    // 공유 그림에는 안 나옴 (sharing)
    // 다른 날: 이름 창 없이 바로 · 자세히 줄에 이름
    await openDay(p,'2026-10-14');await p.waitForTimeout(500);
    await click(p,'[data-act="memo-detail"]');await p.waitForTimeout(300);
    T('두 번째부터: 자세히 줄 "📋 인수인계 만들기"',await p.evaluate(()=>/인수인계 만들기/.test(document.querySelector('[data-act="wl-new"]').textContent)));
    await click(p,'[data-act="wl-new"]');await p.waitForTimeout(300);
    T('이름 창 · 안내 없이 바로 일지 팝업',await p.evaluate(()=>!!document.querySelector('.wlp')&&!document.querySelector('#wlNm')));
    // 제목 눌러 이름 바꾸기
    await click(p,'.wlp .ttl');await p.waitForTimeout(200);
    await p.fill('#wlRen','근무 일지');await click(p,'[data-act="wl-renok"]');await p.waitForTimeout(200);
    T('제목을 눌러 이름 바꾸기 → "근무 일지"',await p.evaluate(()=>/근무 일지/.test(document.querySelector('.wlp .ttl').textContent))&&(await ls(p)).wlog.name==='근무 일지');
    // 줄 고치기 · 지우기 (12일)
    await click(p,'[data-act="wl-close"]');await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('#sheet [data-act="close"]').click());await p.waitForTimeout(300);
    await openDay(p,'2026-10-12');await p.waitForTimeout(500);
    await click(p,'.wlrow');await p.waitForTimeout(300);
    await p.evaluate(()=>[...document.querySelectorAll('.wln')].find(e=>/순찰/.test(e.textContent)).click());await p.waitForTimeout(200);
    await p.fill('#wlEdIn','순찰 3회');await p.keyboard.press('Enter');await p.waitForTimeout(200);
    await p.evaluate(()=>[...document.querySelectorAll('.wln')].find(e=>/냉각수/.test(e.textContent)).click());await p.waitForTimeout(200);
    await click(p,'[data-act="wl-del"]');await p.waitForTimeout(200);
    s=await ls(p);
    T('줄 고치기(순찰 3회) · 지우기(특이 칸 비면 없어짐)',s.wlog.days['2026-10-12'].b[1].t==='순찰 3회'&&!s.wlog.days['2026-10-12'].d,JSON.stringify(s.wlog.days['2026-10-12']));
    await p.evaluate(()=>{const p=document.getElementById('pop');p.dispatchEvent(new MouseEvent('click',{bubbles:true}));});await p.waitForTimeout(300);
    T('바깥(어두운 곳)을 누르면 닫힘',await p.evaluate(()=>!document.querySelector('#pop').classList.contains('open')));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 3. 설정 · 백업 · 찾기 · 저장 데이터
  if(want('set')){
    const wlog={name:'인수인계',secs:[{id:'a',n:'인수',h:false},{id:'b',n:'인계',h:false},{id:'c',n:'지시',h:false},{id:'d',n:'특이',h:false}],backup:false,seen:true,
      days:{'2026-10-12':{b:[{id:'x1',t:'순찰 2회 완료'}],d:[{id:'x2',t:'2호기 압력'}]},'2026-08-01':{a:[{id:'x3',t:'인수 순찰 메모'}]},'bad':{a:[{t:'x'}]},'2026-10-13':{z:[{t:'?'}],a:[{id:'y',t:'  '}]}}};
    const p=await boot(b,{...st0,addons:{...base.addons,wlog:true},wlog},{touch:true});
    // 백업 파일: 기본은 일지 없음
    await p.evaluate(()=>{window.AndroidBridge.shareFile=(n,j)=>{window.__bk=JSON.parse(j);};});
    await act(p,'backup-export');await p.waitForTimeout(200);
    T('백업 파일: 기본은 업무 일지가 빠짐',await p.evaluate(()=>!!window.__bk&&!('wlog' in window.__bk)&&!!window.__bk.memos));
    await click(p,'#nav [data-tab="set"]');await p.waitForTimeout(300);
    T('켜짐: 설정 맨 위 "🔍 메모 · 일지 찾기"',await p.evaluate(()=>/메모 · 일지 찾기/.test(document.querySelector('.srch-entry').textContent)));
    await click(p,'.srch-entry');await p.waitForTimeout(300);
    await click(p,'[data-act="srch-kind"][data-v="wl"]');await p.waitForTimeout(200);
    await p.fill('#srchQ','순찰');await p.waitForTimeout(400);
    let r=await p.evaluate(()=>[...document.querySelectorAll('.srow')].map(x=>x.textContent.replace(/\s+/g,' ')));
    T('일지 찾기: "순찰" → 10/12 인계 · 8/1 인수 (최근 날짜 먼저 · 칸 이름 표시) · 메모는 안 나옴',r.length===2&&/10\/12/.test(r[0])&&/인계/.test(r[0])&&/8\/1/.test(r[1])&&/인수/.test(r[1]),JSON.stringify(r));
    await click(p,'[data-act="srch-kind"][data-v="memo"]');await p.waitForTimeout(300);
    r=await p.evaluate(()=>[...document.querySelectorAll('.srow')].map(x=>x.textContent.replace(/\s+/g,' ')));
    T('메모 칩: 같은 글자로 메모만(9/3 병원 순찰 예약)',r.length===1&&/병원 순찰/.test(r[0]),JSON.stringify(r));
    T('고른 칩(메모/일지)을 기억',(await ls(p)).srchKind==='memo');
    await click(p,'[data-act="srch-kind"][data-v="wl"]');await p.waitForTimeout(300);
    await click(p,'.srow');await p.waitForTimeout(700);
    T('일지 결과를 누르면 그 날짜 창 + 일지 팝업',await p.evaluate(()=>document.querySelector('#sheet').classList.contains('open')&&!!document.querySelector('.wlp')&&/10월 12일/.test(document.querySelector('.wlp .sub').textContent)));
    // 설정(⚙): 칸 이름 · 숨기기 · 백업
    await click(p,'.wlp [data-act="wl-set"]');await p.waitForTimeout(400);
    await p.fill('#wlsS_c','안전');await p.waitForTimeout(500);
    await p.evaluate(()=>{const c=document.querySelector('#wlsH_a');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(200);
    await p.evaluate(()=>{const c=document.querySelector('#wlsBk');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(200);
    let s=await ls(p);
    T('⚙ 설정: 칸 이름 "지시 → 안전" · 인수 숨기기 · 백업에 넣기',s.wlog.secs[2].n==='안전'&&s.wlog.secs[0].h===true&&s.wlog.backup===true,JSON.stringify(s.wlog.secs)+s.wlog.backup);
    // 모두 숨기기는 막음
    await p.evaluate(()=>['b','c','d'].forEach(id=>{const c=document.querySelector('#wlsH_'+id);c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));}));await p.waitForTimeout(200);
    s=await ls(p);T('칸을 모두 숨길 수는 없음(하나는 남음)',s.wlog.secs.filter(x=>!x.h).length===1,JSON.stringify(s.wlog.secs));
    await act(p,'backup-export');await p.waitForTimeout(200);
    T('백업에 넣기를 켜면 백업 파일에 일지가 들어감',await p.evaluate(()=>!!window.__bk.wlog&&!!window.__bk.wlog.days['2026-10-12']));
    T('저장 데이터: 이상한 날짜 · 모르는 칸 · 빈 줄은 버림(normalize)',!s.wlog.days.bad&&!s.wlog.days['2026-10-13'],JSON.stringify(Object.keys(s.wlog.days)));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 4. 옛 저장 데이터(wlog 없음)로 켜짐 · 부가 기능 켜기
  if(want('old')){
    const st={...st0};delete st.wlog;
    const p=await boot(b,st,{touch:true});
    const s=await p.evaluate(()=>{const x=document.querySelector('#track .cell');return !!x;});
    T('옛 저장 데이터로 켜짐',s);
    await click(p,'#nav [data-tab="set"]');await p.waitForTimeout(300);
    await p.evaluate(()=>{const it=[...document.querySelectorAll('[data-act]')].find(e=>/부가 기능/.test(e.textContent));it.click();});await p.waitForTimeout(400);
    T('부가 기능에 "업무 메모 (인수인계)" 스위치',await p.evaluate(()=>!!document.querySelector('#ad_wlog')));
    await p.evaluate(()=>{const c=document.querySelector('#ad_wlog');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(400);
    T('켜면 그 아래 "📋 업무 일지 설정" 줄',await p.evaluate(()=>/업무 일지 설정/.test(document.querySelector('#page').textContent)));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();
