// v0.113 가족 달력을 앱 달력처럼 (동그라미 · 칸 채우기 · 가는 곳 이름) · 가족 스티커판 · 날짜 창 · 가족 탭 내 카드 · 또렷하게 검은 글자
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const fam=[{id:'f1',name:'유찬',kind:'student',vac:[],color:'#ec4899',stk:{'2026-10-14':['s_teeth','s_pill']},notes:{'2026-10-14':'준비물 리코더'}}];
  const openCal=async p=>{await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(500);};
  { // 예전 저장 데이터(내 스티커를 빌려 붙인 가족)로 켜짐 · 스티커판 옮김
    const p=await boot(b,{...base,family:fam},{touch:true});
    const sd=await p.evaluate(()=>__wx.S.family[0].sdefs);
    T('예전 데이터: 가족 스티커판이 생김 (내 판 복사 · 같은 id)',Array.isArray(sd)&&sd.some(x=>x.id==='s_teeth'&&x.emoji==='🦷')&&sd.some(x=>x.id==='s_pill'&&x.emoji==='💊')&&sd.length>=5,JSON.stringify(sd));
    await openCal(p);
    const c=await p.evaluate(()=>{const e=document.querySelector('#vcsl [data-k="2026-10-14"]');return {b:e.querySelector('.bwrap .badge.c').textContent,st:e.querySelectorAll('.stp .ico,.stp img,.stp span').length,cb:e.getAttribute('style')||'',memo:e.innerText};});
    T('달력 칸: 동그라미 "학교"(두 글자까지) · 칸 채우기 색 · 예전 스티커 · 메모',c.b==='학교'&&/--cb/.test(c.cb)&&/준비물/.test(c.memo),JSON.stringify(c));
    T('쉬는 날은 "휴"',await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-17"] .bwrap .badge.r').textContent==='휴'));
    // 날짜 창
    await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-14"]').click());await p.waitForTimeout(500);
    const d=await p.evaluate(()=>({t:document.querySelector('#sheet .dft').innerText,strip:!!document.querySelector('#sheet #dstrip .dsi.on'),chips:[...document.querySelectorAll('#sheet .tchips .tchip')].map(x=>x.className.includes('on')),st:document.querySelectorAll('#sheet .mstk button').length,n:__wx.S.family[0].sdefs.length,on:document.querySelectorAll('#sheet .mstk button.on').length}));
    T('날짜 창: 제목 · 날짜 띠 · 학교 칩 켜짐 · 스티커판(그날 붙인 2개 + ＋ 붙이기)',/10월 14일/.test(d.t)&&d.strip&&d.chips[0]===true&&d.chips[1]===false&&d.st===3&&d.on===2,JSON.stringify(d));
    // 스티커 붙이기
    // v0.126 내 방식: ＋ → 붙일 스티커 창 → 고르면 창이 닫히고 옵션(이날만) → 등록하면 반투명으로 깔림 → 누르면 완료
    await p.evaluate(()=>document.querySelector('#sheet [data-act="man-stk-pick"]').click());await p.waitForTimeout(300);
    T('＋ → 붙일 스티커 창 (판에 없는 것 + 새로)',await p.evaluate(()=>!!document.querySelector('#pop [data-act="man-stk-place"][data-id="s_read"]')&&!!document.querySelector('#pop [data-act="man-stk-add"]')));
    await p.evaluate(()=>document.querySelector('#pop [data-act="man-stk-place"][data-id="s_read"]').click());await p.waitForTimeout(400);
    T('고르면 창 닫히고 옵션 화면 (이날만)',await p.evaluate(()=>!document.querySelector('#pop.open')&&!!document.querySelector('#page .srpg')&&!!document.querySelector('#page [data-act="sr-rep"][data-v="once"].on')));
    await p.evaluate(()=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));document.querySelector('#page [data-act="sr-save"]').click();});await p.waitForTimeout(500);
    T('등록 → 날짜 창에 반투명으로 깔림 (아직 안 함)',await p.evaluate(()=>{const e=document.querySelector('#sheet .mstk [data-id="s_read"]');return !!e&&e.classList.contains('todo')&&!(__wx.S.family[0].stk['2026-10-14']||[]).includes('s_read');}));
    await p.evaluate(()=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const o=document.querySelector('#sheet .mstk [data-id="s_read"]');o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();});await p.waitForTimeout(300);
    T('스티커 누르면 완료 (저장 · 칸에도)',await p.evaluate(()=>__wx.S.family[0].stk['2026-10-14'].includes('s_read')&&document.querySelectorAll('#sheet .mstk button.on').length===3));
    // 쉬는 날로 바꾸기
    await p.evaluate(()=>document.querySelector('#sheet .tchips [data-v="off"]').click());await p.waitForTimeout(300);
    T('쉬는 날 칩 → 그날만 휴 (달력 칸도)',await p.evaluate(()=>__wx.S.family[0].ov['2026-10-14']==='off'&&!!document.querySelector('#vcsl [data-k="2026-10-14"] .bwrap .badge.r')));
    await p.evaluate(()=>document.querySelector('#sheet .tchips [data-v="on"]').click());await p.waitForTimeout(300);
    T('다시 학교 → 바꾼 것 없어짐',await p.evaluate(()=>!__wx.S.family[0].ov||!__wx.S.family[0].ov['2026-10-14']));
    // 새 스티커 만들기 → 그림 고르면 내 스티커 고치기와 같은 화면 (v0.120)
    const tp=sel=>p.evaluate(sel=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const o=document.querySelector(sel);o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();},sel);
    await p.evaluate(()=>document.querySelector('#sheet [data-act="man-stk-pick"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('#pop [data-act="man-stk-add"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('#pop [data-act="icn-pick"]').click());await p.waitForTimeout(400);
    T('＋ 만들기 → 그림 고르면 스티커 고치기 화면 (하루 몇 번 · 얼마나 · 일정 맞춤)',await p.evaluate(()=>!!document.querySelector('#page .srpg [data-act="sr-times"]')&&/일정 맞춤/.test(document.querySelector('#page').innerText)&&__wx.S.family[0].sdefs.length>0));
    await tp('#page [data-act="sr-save"]');await p.waitForTimeout(400);
    const n2=await p.evaluate(()=>({n:__wx.S.family[0].sdefs.filter(x=>!x.retired).length,b:document.querySelectorAll('#sheet .mstk button').length,todo:document.querySelectorAll('#sheet .mstk button.todo').length}));
    T('저장 → 그날 판에 반투명으로 하나 늘어남',n2.b===5&&n2.todo===1&&n2.n===d.n+1,JSON.stringify(n2));
    T('가족 스티커는 내 스티커판에 안 섞임',await p.evaluate(()=>!__wx.S.stamps.defs.some(x=>/^m_/.test(x.id))));
    // 길게 → 고치기 화면 (이름 · 반복 · 빼기)
    const nid=await p.evaluate(()=>__wx.S.family[0].sdefs.slice(-1)[0].id);
    await p.evaluate(id=>{const e=document.querySelector(`#sheet .mstk [data-id="${id}"]`);e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:10,clientY:10}));},nid);await p.waitForTimeout(700);
    T('길게 누르면 스티커 고치기 화면',await p.evaluate(()=>!!document.getElementById('srName')&&!!document.querySelector('#page [data-act="mstk-del"]')));
    await p.evaluate(()=>{document.getElementById('srName').value='피아노';});await tp('#page [data-act="sr-save"]');await p.waitForTimeout(400);
    T('이름 바꾸기 저장',await p.evaluate(id=>__wx.S.family[0].sdefs.find(x=>x.id===id).name==='피아노',nid));
    await p.evaluate(id=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const e=document.querySelector(`#sheet .mstk [data-id="${id}"]`);e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:10,clientY:10}));},nid);await p.waitForTimeout(700);
    await tp('#page [data-act="mstk-del"]');await p.waitForTimeout(400);
    T('빼기 → 판에서 빠짐 (기록 위해 숨김)',await p.evaluate(id=>__wx.S.family[0].sdefs.find(x=>x.id===id).retired===true&&!document.querySelector(`#sheet .mstk [data-id="${id}"]`),nid));
    // 옆으로 밀면 다음날
    await p.evaluate(()=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const b=document.getElementById('sheet').getBoundingClientRect();const x=b.left+b.width/2,y=b.top+60,t=document.elementFromPoint(x,y);const ev=(ty,xx)=>t.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:xx,clientY:y,pointerId:3}));ev('pointerdown',x);for(let i=1;i<=6;i++)ev('pointermove',x-130*i/6);ev('pointerup',x-130);});await p.waitForTimeout(800);
    T('날짜 창 옆으로 밀면 다음날 (15일)',await p.evaluate(()=>/10월 15일/.test(document.querySelector('#sheet .dft').innerText)),await p.evaluate(()=>document.querySelector('#sheet .dft').innerText));
    await p.evaluate(()=>{const o=document.querySelector('#sheet [data-act="man-go"][aria-label="다음날"]');o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();});await p.waitForTimeout(400);
    T('› 누르면 다음날 (16일)',await p.evaluate(()=>/10월 16일/.test(document.querySelector('#sheet .dft').innerText)));
    T('오류 없음 (가족 달력)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 가는 곳 이름 바꾸기
    const p=await boot(b,{...base,family:fam},{touch:true});await openCal(p);
    const tap=sel=>p.evaluate(sel=>{const o=document.querySelector(sel);o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();},sel);
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);await tap('[data-act="fam-edit"][data-id="f1"]');await p.waitForTimeout(400);   // v0.117 ✏️ 은 가족 탭에서 · 이름은 일정 종류에서
    await tap('#page [data-act="fe-pat"]');await p.waitForTimeout(300);   // v0.119 일정은 일정 패턴 화면
    await tap('#page [data-act="fe-ft"][data-k="on"]');await p.waitForTimeout(300);
    await p.evaluate(()=>{document.getElementById('ftName').value='유치원';});await tap('#pop [data-act="ft-save"]');await p.waitForTimeout(300);
    await tap('[data-act="fp-done"]');await p.waitForTimeout(300);await tap('[data-act="fe-save"]');await p.waitForTimeout(500);
    T('일정 종류 이름 저장 (유치원)',await p.evaluate(()=>__wx.S.family[0].ftypes[0].name==='유치원'),await p.evaluate(()=>JSON.stringify(__wx.S.family[0].ftypes)));
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
    T('가족 시간표 · 카드에 "유치원"',await p.evaluate(()=>/유치원/.test(document.querySelector('#view').innerText)));
    await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(500);
    T('달력 칸 동그라미는 세 글자면 첫 글자 "유"',await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-14"] .bwrap .badge.c').textContent==='유'));
    T('오류 없음 (이름)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 가족 탭: 가족이 있으면 내 카드 한 줄 · 위쪽 = 달력(오늘) · 시간표 [오늘] 은 그대로
    const p=await boot(b,{...base,family:fam},{touch:true});
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
    const l=await p.evaluate(()=>{const me=document.querySelector('.nc.w.fc2'),f=document.querySelector('.now.fams .nc:not(.w)');return {mw:me.getBoundingClientRect().width,fw:f.getBoundingClientRect().width,mt:me.getBoundingClientRect().top,ft:f.getBoundingClientRect().top,same:me.closest('.now')===f.closest('.now')};});
    T('v0.121 내 카드 · 가족 카드 같은 줄 · 같은 폭',l.same&&Math.abs(l.mw-l.fw)<2&&Math.abs(l.mt-l.ft)<2,JSON.stringify(l));
    await p.evaluate(()=>{const s=document.getElementById('fgs');s.scrollLeft+=s.clientWidth;});await p.waitForTimeout(500);
    await p.click('#fwkNow');await p.waitForTimeout(700);
    T('시간표 [오늘] 은 그대로 가족 탭',await p.evaluate(()=>document.querySelector('#nav [data-tab="fam"]').classList.contains('on')&&!!document.getElementById('fgs')));
    await p.evaluate(()=>document.querySelector('.nc.w.fc2[data-act="fam-mycal"]').click());await p.waitForTimeout(600);
    T('내 카드 → 달력 탭 · 오늘(12일) 날짜 창',await p.evaluate(()=>document.querySelector('#nav [data-tab="cal"]').classList.contains('on')&&/10월 12일/.test(document.querySelector('#sheet.open .dft').innerText)));
    T('오류 없음 (가족 탭)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 또렷하게 + 동그라미: 밝은 화면은 검은 글자 · 어두운 화면은 흰 글자
    for(const [th,want] of [['light','rgb(15, 18, 21)'],['dark','rgb(255, 255, 255)']]){
      const p=await boot(b,{...base,bg:'vivid',calLook:'circle',theme:th},{});
      const c=await p.evaluate(()=>{const e=document.querySelector('#view .cell .bwrap .badge.c');return e?getComputedStyle(e).color:'';});
      T(`또렷하게 · 동그라미 · ${th}: 근무 글자 ${th==='light'?'검은색':'흰색'}`,c===want,c);
      await p.close();
    }
  }
  T.sum();await b.close();
})();
