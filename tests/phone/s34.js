const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const fam=[
  {id:'f1',name:'엄마',color:'#e57373',kind:'office',days:[1,2,3,4,5],start:'09:00',end:'18:00',holOff:true,vac:[],team:0},
  {id:'f2',name:'동생',color:'#64b5f6',kind:'shift',team:0,own:true,pat:['주','주','야','야','휴','휴','휴','휴'],anc:'2026-10-05',vac:[]}];
 const p=await boot(b,{...base,family:fam},{touch:true,w:384});
 // 옛 데이터(own 없음)로도 켜지는지
 const p0=await boot(b,{...base,family:[{id:'f1',name:'엄마',color:'#e57373',kind:'shift',team:0,vac:[]}]},{touch:true});
 await p0.click('#nav [data-tab="fam"]');await p0.waitForTimeout(400);
 T('옛 가족 데이터로 가족 탭이 켜짐',await p0.evaluate(()=>!!document.getElementById('fgs')&&document.body.innerText.includes('엄마')));
 T('옛 데이터 오류 없음',p0.errs.length===0,p0.errs.join('|'));
 await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(500);
 T('직접 만든 가족 카드에 ✏️',await p.evaluate(()=>document.querySelectorAll('.nc .mced').length===2));
 // 짧게 누르면 달력
 await p.evaluate(()=>document.querySelector('.nc[data-act="fam-mancal"][data-id="f2"]').click());await p.waitForTimeout(400);
 T('짧게 누르면 그 가족 달력',await p.evaluate(()=>document.getElementById('page').innerText.includes('동생 달력')&&!!document.querySelector('#page .cell')));
 // 자기 패턴: 10/5 주 주 야 야 휴... → 10/12 는 (12-5)=7 → 휴, 10/5 → 주
 const lab=await p.evaluate(()=>{const g=k=>{const c=document.querySelector(`#page .cell[data-k="${k}"] .bwrap`);return c?c.innerText.trim():'';};return [g('2026-10-05'),g('2026-10-07'),g('2026-10-09'),g('2026-10-13')];});
 T('자기 패턴대로 근무가 보임(주·야·휴·주)',lab[0]==='주'&&lab[1]==='야'&&lab[2]==='휴'&&lab[3]==='주',JSON.stringify(lab));
 await p.screenshot({path:'/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/man1.png'});
 // 날짜 → 메모 · 스티커
 await p.evaluate(()=>document.querySelector('#page .cell[data-k="2026-10-14"]').click());await p.waitForTimeout(400);
 await p.evaluate(()=>{const i=document.getElementById('manNote');i.value='병원 가는 날';document.querySelector('[data-act="man-note"]').click();});await p.waitForTimeout(400);
 T('메모가 칸에 보임',await p.evaluate(()=>document.querySelector('#page .cell[data-k="2026-10-14"]').innerText.includes('병원')));
 await p.evaluate(()=>document.querySelector('#page .cell[data-k="2026-10-14"]').click());await p.waitForTimeout(400);
 const hasDef=await p.evaluate(()=>!!document.querySelector('[data-act="man-stk"]'));
 if(hasDef){await p.evaluate(()=>document.querySelector('[data-act="man-stk"]').click());await p.waitForTimeout(300);
  T('스티커가 칸에 붙음',await p.evaluate(()=>!!document.querySelector('#page .cell[data-k="2026-10-14"] .stp .se')));
  T('저장됐고 내 스티커 기록은 그대로',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));const m=s.family.find(x=>x.id==='f2');return !!(m.stk&&m.stk['2026-10-14']&&m.stk['2026-10-14'].length)&&!s.stamps.log['2026-10-14'];}));}
 else console.log('(스티커 정의 없음 - 건너뜀)');
 T('메모는 로컬(family)에 저장',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return s.family.find(x=>x.id==='f2').notes['2026-10-14']==='병원 가는 날';}));
 await p.screenshot({path:'/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/man2.png'});
 // 뒤로
 await p.evaluate(()=>{document.querySelector('[data-act="close"]')&&document.querySelector('[data-act="close"]').click();});await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('#page [data-act="page-close"]').click());await p.waitForTimeout(300);
 // 길게 누르기 → 고치기
 const bb=await (await p.$('.nc[data-id="f2"]')).boundingBox();
 await p.mouse.move(bb.x+20,bb.y+bb.height-12);await p.mouse.down();await p.waitForTimeout(650);await p.mouse.up();await p.waitForTimeout(400);
 T('꾹 누르면 가족 고치기',await p.evaluate(()=>document.getElementById('page').innerText.includes('가족 고치기')));
 T('고치기에 직접 패턴 칸이 보임',await p.evaluate(()=>document.querySelectorAll('#page .pgrid .pc').length===8));
 // 패턴 칸 바꾸기 + 저장
 await p.evaluate(()=>document.querySelector('#page [data-act="fe-pcell"][data-i="0"]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('[data-act="fe-pset"][data-s="휴"]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('[data-act="fe-padd"]').click());await p.waitForTimeout(300);
 T('칸 추가 9칸',await p.evaluate(()=>document.querySelectorAll('#page .pgrid .pc').length===9));
 await p.screenshot({path:'/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/man3.png'});
 await p.evaluate(()=>document.querySelector('[data-act="fe-save"]').click());await p.waitForTimeout(400);
 T('저장 후 패턴 반영',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));const m=s.family.find(x=>x.id==='f2');return m.pat.length===9&&m.pat[0]==='휴';}));
 // 내 조 따라가기로 바꾸면 own 꺼짐
 await p.evaluate(()=>document.querySelector('.nc[data-id="f2"] .mced').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('[data-act="fe-own"][data-v="0"]').click());await p.waitForTimeout(300);
 T('따라가기로 바꾸면 패턴 칸이 숨음',await p.evaluate(()=>document.querySelectorAll('#page .pgrid .pc').length===0));
 // 시간표 이름 누르면 달력
 await p.evaluate(()=>document.querySelector('#page [data-act="page-close"]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('.fgn .fn[data-act="fam-mancal"]').click());await p.waitForTimeout(300);
 T('시간표 이름을 누르면 달력',await p.evaluate(()=>document.getElementById('page').innerText.includes('달력')));
 console.log(p.errs);T.sum();await b.close();})();
