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
    T('달력 칸: 동그라미 "학" · 칸 채우기 색 · 예전 스티커 · 메모',c.b==='학'&&/--cb/.test(c.cb)&&/준비물/.test(c.memo),JSON.stringify(c));
    T('쉬는 날은 "휴"',await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-17"] .bwrap .badge.r').textContent==='휴'));
    // 날짜 창
    await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-14"]').click());await p.waitForTimeout(500);
    const d=await p.evaluate(()=>({t:document.querySelector('#sheet .dft').innerText,strip:!!document.querySelector('#sheet #dstrip .dsi.on'),chips:[...document.querySelectorAll('#sheet .tchips .tchip')].map(x=>x.className.includes('on')),st:document.querySelectorAll('#sheet .mstk button').length,n:__wx.S.family[0].sdefs.length,on:document.querySelectorAll('#sheet .mstk button.on').length}));
    T('날짜 창: 제목 · 날짜 띠 · 학교 칩 켜짐 · 스티커판(판 + 만들기) · 붙인 2개',/10월 14일/.test(d.t)&&d.strip&&d.chips[1]===true&&d.chips[0]===false&&d.st===d.n+1&&d.on===2,JSON.stringify(d));
    // 스티커 붙이기
    await p.evaluate(()=>document.querySelector('#sheet .mstk [data-id="s_read"]').click());await p.waitForTimeout(300);
    T('스티커 누르면 붙음 (저장 · 칸에도)',await p.evaluate(()=>__wx.S.family[0].stk['2026-10-14'].includes('s_read')&&document.querySelectorAll('#sheet .mstk button.on').length===3));
    // 쉬는 날로 바꾸기
    await p.evaluate(()=>document.querySelector('#sheet .tchips [data-v="off"]').click());await p.waitForTimeout(300);
    T('쉬는 날 칩 → 그날만 휴 (달력 칸도)',await p.evaluate(()=>__wx.S.family[0].ov['2026-10-14']==='off'&&!!document.querySelector('#vcsl [data-k="2026-10-14"] .bwrap .badge.r')));
    await p.evaluate(()=>document.querySelector('#sheet .tchips [data-v="on"]').click());await p.waitForTimeout(300);
    T('다시 학교 → 바꾼 것 없어짐',await p.evaluate(()=>!__wx.S.family[0].ov||!__wx.S.family[0].ov['2026-10-14']));
    // 새 스티커 만들기
    await p.evaluate(()=>document.querySelector('#sheet [data-act="man-stk-add"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('#pop [data-act="icn-pick"]').click());await p.waitForTimeout(400);
    const n2=await p.evaluate(()=>({n:__wx.S.family[0].sdefs.length,b:document.querySelectorAll('#sheet .mstk button').length,pop:document.querySelector('#pop').classList.contains('open')}));
    T('＋ 만들기 → 그림 고르면 판에 하나 늘어남 · 창 닫힘',n2.b===n2.n+1&&n2.n===d.n+1&&!n2.pop,JSON.stringify(n2));
    T('가족 스티커는 내 스티커판에 안 섞임',await p.evaluate(()=>!__wx.S.stamps.defs.some(x=>/^m_/.test(x.id))));
    // 길게 눌러 고치기 · 지우기
    const nid=await p.evaluate(()=>__wx.S.family[0].sdefs.slice(-1)[0].id);
    await p.evaluate(id=>{const e=document.querySelector(`#sheet .mstk [data-id="${id}"]`);e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:10,clientY:10}));},nid);await p.waitForTimeout(700);
    T('길게 누르면 고치기 창',await p.evaluate(()=>!!document.getElementById('mstkName')));
    await p.evaluate(()=>{document.getElementById('mstkName').value='피아노';const o=document.querySelector('#pop [data-act="mstk-ok"]');o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();});await p.waitForTimeout(300);
    T('이름 바꾸기 저장',await p.evaluate(id=>__wx.S.family[0].sdefs.find(x=>x.id===id).name==='피아노',nid));
    await p.evaluate(id=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const e=document.querySelector(`#sheet .mstk [data-id="${id}"]`);e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:10,clientY:10}));},nid);await p.waitForTimeout(700);
    await p.evaluate(()=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const o=document.querySelector('#pop [data-act="mstk-del"]');o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();});await p.waitForTimeout(300);
    T('지우기 → 판에서 빠짐',await p.evaluate(id=>!__wx.S.family[0].sdefs.some(x=>x.id===id),nid));
    // 옆으로 밀면 다음날
    await p.evaluate(()=>{document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));const b=document.getElementById('sheet').getBoundingClientRect();const x=b.left+b.width/2,y=b.top+60,t=document.elementFromPoint(x,y);const ev=(ty,xx)=>t.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:xx,clientY:y,pointerId:3}));ev('pointerdown',x);for(let i=1;i<=6;i++)ev('pointermove',x-130*i/6);ev('pointerup',x-130);});await p.waitForTimeout(800);
    T('날짜 창 옆으로 밀면 다음날 (15일)',await p.evaluate(()=>/10월 15일/.test(document.querySelector('#sheet .dft').innerText)),await p.evaluate(()=>document.querySelector('#sheet .dft').innerText));
    await p.evaluate(()=>{const o=document.querySelector('#sheet [data-act="man-go"][aria-label="다음날"]');o.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));o.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));o.click();});await p.waitForTimeout(400);
    T('› 누르면 다음날 (16일)',await p.evaluate(()=>/10월 16일/.test(document.querySelector('#sheet .dft').innerText)));
    T('오류 없음 (가족 달력)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 가는 곳 이름 바꾸기
    const p=await boot(b,{...base,family:fam},{touch:true});await openCal(p);
    await p.evaluate(()=>document.querySelector('#page [data-act="man-edit"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>{document.getElementById('feLbl').value='유치원';document.querySelector('[data-act="fe-save"]').click();});await p.waitForTimeout(500);
    T('가는 곳 이름 저장 (유치원)',await p.evaluate(()=>__wx.S.family[0].label==='유치원'));
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
    T('가족 시간표 · 카드에 "유치원"',await p.evaluate(()=>/유치원/.test(document.querySelector('#view').innerText)));
    await p.evaluate(()=>document.querySelector('[data-act="fam-mancal"]').click());await p.waitForTimeout(500);
    T('달력 칸 동그라미는 첫 글자 "유"',await p.evaluate(()=>document.querySelector('#vcsl [data-k="2026-10-14"] .bwrap .badge.c').textContent==='유'));
    T('오류 없음 (이름)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 가족 탭: 가족이 있으면 내 카드 한 줄 · 위쪽 = 달력(오늘) · 시간표 [오늘] 은 그대로
    const p=await boot(b,{...base,family:fam},{touch:true});
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
    const l=await p.evaluate(()=>{const me=document.querySelector('.nc.me2'),f=document.querySelector('.now.fams .nc');return {mw:me.getBoundingClientRect().width,vw:document.querySelector('#view').clientWidth,fh:f.getBoundingClientRect().height,mh:me.getBoundingClientRect().height,sep:me.closest('.now')!==f.closest('.now')};});
    T('내 카드 한 줄 전체 · 가족 카드는 아래 줄',l.sep&&l.mw>l.vw*0.8,JSON.stringify(l));
    await p.evaluate(()=>{const s=document.getElementById('fgs');s.scrollLeft+=s.clientWidth;});await p.waitForTimeout(500);
    await p.click('#fwkNow');await p.waitForTimeout(700);
    T('시간표 [오늘] 은 그대로 가족 탭',await p.evaluate(()=>document.querySelector('#nav [data-tab="fam"]').classList.contains('on')&&!!document.getElementById('fgs')));
    await p.evaluate(()=>document.querySelector('.nc.me2 [data-act="fam-mycal"],.nc.me2[data-act="fam-mycal"]').click());await p.waitForTimeout(600);
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
