const {chromium,boot,mkT,base}=require('./lib.js');
const O='/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/';
(async()=>{const b=await chromium.launch();const T=mkT();
 const fam=[{id:'f1',name:'딸',color:'#e57373',kind:'student',start:'08:30',end:'15:00',holOff:true,vac:[]},
  {id:'f2',name:'동생',color:'#64b5f6',kind:'shift',team:0,own:true,pat:['주','주','야','야','휴','휴','휴','휴'],anc:'2026-10-05',vac:[]}];
 const p=await boot(b,{...base,family:fam,addons:{...base.addons,together:true}},{touch:true,w:384});
 await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
 await p.evaluate(()=>document.querySelector('.nc[data-id="f1"]').click());await p.waitForTimeout(400);
 const txt=k=>p.evaluate(k=>document.querySelector(`#page .cell[data-k="${k}"] .bwrap`).innerText.trim(),k);
 T('수요일(10/14) 학교',(await txt('2026-10-14')).includes('학교'),await txt('2026-10-14'));
 // 이 날만 바꾸기 → 쉬는 날
 await p.evaluate(()=>document.querySelector('#page .cell[data-k="2026-10-14"]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('[data-act="man-ov"][data-v="off"]').click());await p.waitForTimeout(300);
 T('이 날만 쉬는 날로 바뀜 + 점',await p.evaluate(()=>{const c=document.querySelector('#page .cell[data-k="2026-10-14"]');return c.innerText.includes('휴')&&!!c.querySelector('.dot');}));
 T('저장 형식 ov',await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).family[0].ov['2026-10-14']==='off'));
 // 원래대로
 await p.evaluate(()=>document.querySelector('#page .cell[data-k="2026-10-14"]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('[data-act="man-ov"][data-v=""]').click());await p.waitForTimeout(300);
 T('원래대로 → 학교',(await txt('2026-10-14')).includes('학교')&&await p.evaluate(()=>!JSON.parse(localStorage.getItem('eonjeswieo:v1')).family[0].ov));
 // 칠하기: 15·16일을 쉬는 날로, 토요일(17)을 학교로
 await p.evaluate(()=>document.querySelector('[data-act="man-paint"]').click());await p.waitForTimeout(300);
 T('칠하기 막대가 보임',await p.evaluate(()=>!!document.querySelector('#page .vsbar [data-act="man-pk"]')));
 const pt=async k=>{const bb=await (await p.$(`#page .cell[data-k="${k}"]`)).boundingBox();return [bb.x+bb.width/2,bb.y+bb.height/2];};
 const [x1,y1]=await pt('2026-10-15'),[x2,y2]=await pt('2026-10-16');
 await p.mouse.move(x1,y1);await p.mouse.down();await p.mouse.move(x2,y2,{steps:5});await p.mouse.up();await p.waitForTimeout(300);
 T('쭉 밀면 15·16일 쉬는 날',(await txt('2026-10-15')).includes('휴')&&(await txt('2026-10-16')).includes('휴'));
 await p.evaluate(()=>document.querySelector('[data-act="man-pk"][data-v="on"]').click());await p.waitForTimeout(300);
 const [x3,y3]=await pt('2026-10-17');await p.mouse.click(x3,y3);await p.waitForTimeout(300);
 T('학교로 칠하면 토요일 학교',(await txt('2026-10-17')).includes('학교'));
 await p.screenshot({path:O+'man4.png'});
 await p.evaluate(()=>document.querySelector('[data-act="man-paint-off"]').click());await p.waitForTimeout(300);
 T('끝내기 → 막대 사라짐',await p.evaluate(()=>!document.querySelector('#page .vsbar')));
 // 같이 쉬는 날 반영: 15일은 딸 쉼 → memberOff
 T('15·16일 쉬는 날 · 17일 학교 저장',await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('eonjeswieo:v1')).family[0].ov;return o['2026-10-15']==='off'&&o['2026-10-16']==='off'&&o['2026-10-17']==='on'&&!o['2026-10-14'];}));
 await p.evaluate(()=>document.querySelector('#page [data-act="page-close"]').click());await p.waitForTimeout(300);
 await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(300);
 T('시간표 15일 딸 칸이 휴',await p.evaluate(()=>{const h=[...document.querySelectorAll('.fh')].findIndex(e=>e.dataset.k==='2026-10-15');const rows=document.querySelectorAll('.fgin .fc');const n=document.querySelectorAll('.fh').length;return rows[n+n*0+h]?true:false;}));
 await p.evaluate(()=>document.querySelector('.nc[data-id="f1"]').click());await p.waitForTimeout(300);
 // 교대 가족 칸 바꾸기
 await p.evaluate(()=>document.querySelector('#page [data-act="page-close"]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('.nc[data-id="f2"]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('#page .cell[data-k="2026-10-13"]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('[data-act="man-ov"][data-v="휴"]').click());await p.waitForTimeout(300);
 T('교대 가족 이 날만 휴',(await txt('2026-10-13')).includes('휴'));
 console.log(p.errs);T.sum();await b.close();})();
