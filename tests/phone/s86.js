// v0.128 묶음: 업무 메모 옆 날짜로 잘못 저장 · 포스트잇 바로 저장 · 위젯 → 직접 추가한 가족 달력 · 스티커 크기 기억(버벅임) · "다음날" 퇴근 칸 안 · 시간별 줄 점선
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
  { // 1) 업무 메모: 쓰고 바로 옆으로 밀어도 옆 날짜 글이 이 날짜로 안 들어감
    const p=await boot(b,{...base,addons:{...base.addons,wlog:true},wlog:{name:'인계',seen:true,days:{'2026-10-13':{b:'B날 인계'}}}},{touch:true});
    await p.evaluate(()=>{const x=document.createElement('button');x.dataset.act='wl-open';x.dataset.k='2026-10-12';document.body.appendChild(x);x.click();});await p.waitForTimeout(400);
    const r=await p.evaluate(async()=>{
      const ta=document.querySelector('#pop .wlta[data-s="a"]');ta.value='A날 새 글';ta.dispatchEvent(new Event('input',{bubbles:true}));   // 저장 대기(0.35초) 중에
      const m=document.querySelector('#pop .wlp'),bx=m.getBoundingClientRect(),x=bx.left+bx.width/2,y=bx.top+40,t=document.elementFromPoint(x,y);
      const ev=(ty,xx)=>t.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:xx,clientY:y,pointerId:3}));
      ev('pointerdown',x);for(let i=1;i<=9;i++)ev('pointermove',x-160*i/9);
      const ro=[...document.querySelectorAll('#pop .swn .wlta')].every(e=>e.readOnly);
      await new Promise(r=>setTimeout(r,400));   // 옆 날짜 판이 붙어 있는 동안 저장이 돎
      ev('pointerup',x-160);await new Promise(r=>setTimeout(r,800));
      return {ro,days:__wx.S.wlog.days};});
    T('쓰다가 바로 밀어도 10/12 = 쓴 글만 · 10/13 글은 그대로 (복사 안 됨)',JSON.stringify(r.days['2026-10-12'])==='{"a":"A날 새 글"}'&&JSON.stringify(r.days['2026-10-13'])==='{"b":"B날 인계"}',JSON.stringify(r.days));
    T('미는 동안 옆 날짜 칸은 읽기 전용',r.ro);
    T('오류 없음 (업무 메모)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 포스트잇: 새로 쓰다가 바깥을 누르면 바로 저장 · 되돌리기
    const p=await boot(b,{...base});
    await p.evaluate(()=>document.querySelector('#top [data-act="open-board"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('[data-act="pi-new"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>{const n=document.querySelector('[data-act="pi-type"][data-v="note"]');if(n)n.click();});await p.waitForTimeout(200);
    await p.evaluate(()=>{const t=document.getElementById('piText');t.value='우유 사기';});
    await p.evaluate(()=>{const e=document.getElementById('pop');e.dispatchEvent(new MouseEvent('click',{bubbles:true}));});await p.waitForTimeout(300);
    const s1=await p.evaluate(()=>({n:Object.values(__wx.S.board).flat().filter(x=>x.text==='우유 사기').length,toast:document.getElementById('toast').innerText}));
    T('바깥을 누르면 묻지 않고 저장 + "저장했어요 되돌리기"',s1.n===1&&/저장했어요/.test(s1.toast)&&/되돌리기/.test(s1.toast),JSON.stringify(s1));
    await p.evaluate(()=>document.querySelector('#toast .tu').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));await p.evaluate(()=>document.querySelector('#toast').click());await p.waitForTimeout(300);
    T('되돌리기 → 지워짐',await p.evaluate(()=>Object.values(__wx.S.board).flat().filter(x=>x.text==='우유 사기').length===0));
    await p.evaluate(()=>document.querySelector('[data-act="pi-new"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>{const e=document.getElementById('pop');e.dispatchEvent(new MouseEvent('click',{bubbles:true}));});await p.waitForTimeout(300);
    T('빈 포스트잇은 그냥 닫힘 (저장 안 함)',await p.evaluate(()=>!document.getElementById('pop').classList.contains('open')&&Object.values(__wx.S.board).flat().length===0));
    T('오류 없음 (포스트잇)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 3) 위젯 → 직접 추가한 가족(유찬) 달력 · 스티커 크기 기억 · 다음날 표시
    const fam=[{id:'f1',name:'유찬',kind:'student',label:'유치원',start:'09:00',end:'15:00',vac:[],color:'#ec4899'}];
    const p=await boot(b,{...base,family:fam});
    await p.evaluate(()=>{window.__od='2026-10-15@f1';window.AndroidBridge.takeOpenDate=()=>{const v=window.__od||'';window.__od='';return v;};__wx.widgetSync();});await p.waitForTimeout(600);
    const w=await p.evaluate(()=>({pg:__wx.page.pageMode,sh:!!document.querySelector('#sheet.open'),t:(document.querySelector('#sheet.open')||{}).innerText||''}));
    T('위젯 "@f1"(유찬) → 유찬 달력 + 10/15 날짜 창',w.pg==='mancal'&&w.sh&&/15/.test(w.t),JSON.stringify(w).slice(0,200));
    await p.evaluate(()=>{__wx.closeSheet();__wx.closePage();window.__od='2026-11-01#m@f1';__wx.widgetSync();});await p.waitForTimeout(500);
    T('위젯 달력 버튼 "#m@f1" → 유찬 달력 (날짜 창 없이)',await p.evaluate(()=>__wx.page.pageMode==='mancal'&&!document.querySelector('#sheet.open')));
    await p.evaluate(()=>__wx.closePage());await p.waitForTimeout(300);
    const st=await p.evaluate(()=>{const P=JSON.parse(localStorage.getItem('eonjeswieo:stz')||'{}'),k=Object.keys(P);const t0=k.length?P[k[0]].t:0;__wx.render();const P2=JSON.parse(localStorage.getItem('eonjeswieo:stz')||'{}');return {n:k.length,same:k.length>0&&P2[k[0]].t===t0};});
    T('스티커 크기를 폰에 기억 · 같은 내용으로 다시 그리면 다시 재지 않음',st.n>0&&st.same,JSON.stringify(st));
    await p.evaluate(()=>document.querySelector('#nav [data-tab="set"]').click());await p.waitForTimeout(250);await p.click('[data-act="more-pattern"]');await p.waitForTimeout(400);
    await p.evaluate(()=>document.querySelector('.tltimes [data-s="야"]').click());await p.waitForTimeout(300);
    const set=(id,v)=>p.evaluate(([id,v])=>{const s=document.getElementById(id);s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));},[id,v]);
    await set('tdS','19:00');await p.waitForTimeout(150);await set('tdE','07:00');await p.waitForTimeout(200);
    const n1=await p.evaluate(()=>({mid:!!document.querySelector('.tdtm>small'),nx:!!document.querySelector('.tdtm .tbtn.nx'),c:getComputedStyle(document.querySelector('.tdtm .tbtn.nx span'),'::before').content}));
    T('야간(오후 7시 → 오전 7시): 가운데 글자 없이 퇴근 칸 안에 "다음날"',!n1.mid&&n1.nx&&/다음날/.test(n1.c),JSON.stringify(n1));
    await set('tdS','07:00');await p.waitForTimeout(150);await set('tdE','19:00');await p.waitForTimeout(200);
    T('주간(오전 7시 → 오후 7시): "다음날" 없음',await p.evaluate(()=>!document.querySelector('.tdtm .tbtn.nx')&&!/다음날/.test(document.querySelector('.tdtm').innerText)));
    T('오류 없음 (위젯 · 스티커 · 다음날)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();})();
