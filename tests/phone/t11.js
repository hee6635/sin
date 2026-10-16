const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T_=mkT();
let p=await boot(b,{...base,pattern:['주','주','주','주']},{touch:false});
const cellBox=async k=>await p.$eval(`.track .panel:nth-child(2) .cell[data-k="${k}"]`,e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height*0.7};});
const ov=async()=>await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).overrides);
// ===== 칠하기 취소 / 결정
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]');await p.waitForTimeout(400);
await p.click('[data-act="paint-open"]');await p.waitForTimeout(400);
const btns=await p.$$eval('.paintbar button',a=>a.map(x=>x.textContent.replace(/\s+/g,' ').trim()).filter(x=>x));
T_('칠하기 막대: 근무 칩 + 취소 + 결정 (끝 없음)',btns.includes('취소')&&btns.some(x=>x.startsWith('결정'))&&!btns.includes('끝'),btns.join('|'));
await p.click('.paintbar [data-act="paint-k"][data-s="야"]');await p.waitForTimeout(150);
const c15=await cellBox('2026-10-15');await p.mouse.click(c15.x,c15.y);await p.waitForTimeout(250);
T_('한 날 눌러 칠함 → 결정 옆 "1일"',(await p.$eval('#pbN',e=>e.textContent)).trim()==='1일',await p.$eval('#pbN',e=>e.textContent));
// 쭉 긋기 20 → 21 → 22, 그리고 21 로 되돌아옴
const c20=await cellBox('2026-10-20'),c21=await cellBox('2026-10-21'),c22=await cellBox('2026-10-22'),c23=await cellBox('2026-10-23');
await p.mouse.move(c20.x,c20.y);await p.mouse.down();await p.mouse.move(c21.x,c21.y,{steps:4});await p.mouse.move(c22.x,c22.y,{steps:4});await p.mouse.move(c23.x,c23.y,{steps:4});
let n3=(await p.$eval('#pbN',e=>e.textContent)).trim();
T_('쭉 그으면 20·21·22·23 4일 + 앞서 1일 = 5일',n3==='5일',n3);
await p.mouse.move(c22.x,c22.y,{steps:4});
let n4=(await p.$eval('#pbN',e=>e.textContent)).trim();
T_('22일로 되돌아오면 23일 칠하기 취소 → 4일',n4==='4일',n4);
await p.mouse.move(c21.x,c21.y,{steps:4});
let n5=(await p.$eval('#pbN',e=>e.textContent)).trim();
T_('21일로 더 되돌아오면 22일도 취소 → 3일',n5==='3일',n5);
await p.mouse.move(c22.x,c22.y,{steps:4});
let n6=(await p.$eval('#pbN',e=>e.textContent)).trim();
T_('다시 앞으로 가면 22일 다시 칠함 → 4일',n6==='4일',n6);
await p.mouse.up();await p.waitForTimeout(200);
let o=await ov();
T_('저장된 근무: 15·20·21·22일만 야로 바뀜',['2026-10-15','2026-10-20','2026-10-21','2026-10-22'].every(k=>o[k]==='야')&&!o['2026-10-23'],JSON.stringify(o));
await p.click('[data-act="paint-cancel"]');await p.waitForTimeout(300);
o=await ov();
T_('취소: 칠한 것 모두 원래대로',Object.keys(o).length===0,JSON.stringify(o));
T_('취소 후 막대 사라짐',!(await p.$('.paintbar')));
// 다시 칠하고 결정
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]');await p.waitForTimeout(400);
await p.click('[data-act="paint-open"]');await p.waitForTimeout(300);await p.click('.paintbar [data-act="paint-k"][data-s="야"]');
const c16=await cellBox('2026-10-16');await p.mouse.click(c16.x,c16.y);await p.waitForTimeout(200);
await p.click('[data-act="paint-done"]');await p.waitForTimeout(300);
o=await ov();
T_('결정: 칠한 것 그대로 남음',o['2026-10-16']==='야',JSON.stringify(o));
// ===== 흐린 이웃 달 누르면 이동
const out=await p.$eval('.track .panel:nth-child(2) .cell.out',e=>e.dataset.k);
await p.click(`.track .panel:nth-child(2) .cell.out[data-k="${out}"]`);await p.waitForTimeout(700);
T_('흐린 칸(9월) 누르면 9월로 이동',!!(await p.$('.track .panel:nth-child(2) .cell[data-k="2026-09-14"]')),out);
T_('이동하면서 그 날 날짜 창도 열림',!!(await p.$('#sheet.open')));
await p.evaluate(()=>document.getElementById('scrim').click());await p.waitForTimeout(300);
// 다음 달 흐린 칸
await p.click('[data-act="today"]').catch(()=>{});await p.waitForTimeout(400);
// ===== 없음 근무타입
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-15"]');await p.waitForTimeout(400);
await p.evaluate(()=>document.getElementById('scrim').click());await p.waitForTimeout(300);
await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.click('[data-act="more-pattern"]');await p.waitForTimeout(300);
await p.click('[data-act="type-pick-page"]');await p.waitForTimeout(300);
T_('근무타입 추가 목록에 "없음"',!!(await p.$('.pk-i[data-k="_"]')));
await p.click('.pk-i[data-k="_"]');await p.waitForTimeout(400);
await p.click('[data-act="page-close"]');await p.waitForTimeout(300);await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(250);
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-15"]');await p.waitForTimeout(400);
await p.click('[data-act="type-more"]');await p.waitForTimeout(250);await p.click('#pop [data-act="setshift"][data-s="_"]');await p.waitForTimeout(400);
let st=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
T_('없음 추가: types 에 {k:_ rest} · 그날 근무 _',st.types.some(t=>t.k==='_'&&t.rest&&t.name==='없음')&&st.overrides['2026-10-15']==='_',JSON.stringify([st.types.filter(t=>t.k==='_'),st.overrides]));
await p.evaluate(()=>{const s=document.querySelector('#sheet [data-act="sheet-close"],#sheet .ib');});
await p.evaluate(()=>document.getElementById('scrim').click());await p.waitForTimeout(300);
const cellHtml=await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-15"] .bwrap',e=>e.innerText.trim());
T_('달력 칸에 글자 없음',cellHtml==='',JSON.stringify(cellHtml));
await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-17"]');await p.waitForTimeout(400);
await p.click('[data-act="type-more"]');await p.waitForTimeout(250);
T_('더보기 목록에 "없음" 점선 동그라미',!!(await p.$('#pop .tchip .badge.nonb.ph')));await p.evaluate(()=>document.getElementById('pop').click());
// 길게 눌러 편집 창: 이름만
await p.evaluate(()=>{});
await p.close();
// ===== 처음 근무표 만들기: 글자 없이
p=await boot(b,null);
await p.click('[data-act="ob-mine"]');await p.waitForTimeout(300);
await p.click('[data-act="ob-way"][data-v="custom"]');await p.waitForTimeout(300);
await p.click('[data-act="ob-next"]');await p.waitForTimeout(300);   // len
const hasNone=!!(await p.$('[data-act="ob-rnone"]'));
T_('근무 이름 화면: "글자 없이" 버튼',hasNone,(await p.$eval('#onboard',e=>e.innerText.slice(0,200))));
if(hasNone){
  await p.click('[data-act="ob-rnone"]');await p.waitForTimeout(200);
  T_('누르면 "없음 (아무것도 안 보여요)" 표시',(await p.$eval('#onboard',e=>e.innerText)).includes('없음 (아무것도 안 보여요)'));
  await p.click('[data-act="ob-next"]');await p.waitForTimeout(300);
  T_('채우기 화면에 점선 "없음" 칩',!!(await p.$('#onboard .fillchips .badge.nonb.ph')));
  await p.click('#onboard .fillchips [data-act="ob-brush"]:first-child');await p.click('#onboard [data-act="ob-cell"][data-i="0"]');await p.waitForTimeout(150);
  for(let i=0;i<6;i++){const nx=await p.$('#onboard [data-act="ob-next"]');if(!nx)break;await nx.click();await p.waitForTimeout(350);}
  // 알람 단계
  const fin=await p.$('#onboard [data-act="ob-finish"],#onboard [data-act="ob-done"],#onboard [data-act^="ob-fin"]');
  console.log('last step buttons:',await p.$$eval('#onboard [data-act]',a=>a.map(x=>x.dataset.act).join(',')));
}
await p.close();
await b.close();T_.sum();})();
