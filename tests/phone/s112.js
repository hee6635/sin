// v0.240: 같이 쉬는 날 달 넘기기 (‹ › · 좌우로 밀기 · "이번 달") · 화면에 코드 주석 글자 없음
const {chromium,boot,mkT,base}=require('./lib.js');
const st={...base,addons:{...base.addons,together:true},family:[{id:'f1',name:'아내',color:'#e57373',kind:'shift',team:3}]};
(async()=>{const T=mkT();const b=await chromium.launch();
  const p=await boot(b,st,{w:390,h:844});await p.waitForTimeout(400);
  await p.evaluate(()=>{__wx.closePop&&__wx.closePop();document.querySelector('#nav [data-tab="fam"]').click();});await p.waitForTimeout(700);
  const hd=()=>p.evaluate(()=>{const h=document.querySelector('#tgbox .tghd');return {t:h.querySelector('span').textContent,now:!!h.querySelector('.tgnow'),prevOff:h.querySelector('[data-v="-1"]').disabled,chips:[...document.querySelectorAll('#tgbox .tg-chip')].map(c=>c.dataset.k)};});
  let r=await hd();T('처음: 10월에 남은 같이 쉬는 날 · ‹ 막힘 · 이번 달 버튼 없음',r.t==='10월에 남은 같이 쉬는 날'&&r.prevOff&&!r.now&&r.chips.every(k=>k.startsWith('2026-10')),JSON.stringify(r));
  await p.click('#tgbox [data-v="1"]');await p.waitForTimeout(400);r=await hd();
  T('› 누르면 11월 · 이번 달 버튼',r.t==='11월 같이 쉬는 날'&&r.now&&r.chips.length>0&&r.chips.every(k=>k.startsWith('2026-11')),JSON.stringify(r));
  await p.click('#tgbox .tgnow');await p.waitForTimeout(400);r=await hd();T('이번 달 누르면 10월로',r.t.startsWith('10월')&&!r.now,JSON.stringify(r));
  // 좌우로 밀기 (칩 줄 위)
  const box=await (await p.$('#tgbox .tg-row,#tgbox .mempty')).boundingBox();
  await p.mouse.move(box.x+box.width*0.8,box.y+10);await p.mouse.down();await p.mouse.move(box.x+box.width*0.2,box.y+12,{steps:6});await p.mouse.up();await p.waitForTimeout(400);
  r=await hd();T('왼쪽으로 밀면 다음 달',r.t==='11월 같이 쉬는 날',JSON.stringify(r));
  await p.mouse.move(box.x+box.width*0.2,box.y+10);await p.mouse.down();await p.mouse.move(box.x+box.width*0.8,box.y+12,{steps:6});await p.mouse.up();await p.waitForTimeout(400);
  r=await hd();T('오른쪽으로 밀면 앞 달',r.t.startsWith('10월'),JSON.stringify(r));
  T('오늘 네모: "낮엔 같이" 머리 칸도 몸 칸과 같은 테두리 자리 (계단 없음)',await p.evaluate(()=>{const mk=c=>{const e=document.createElement('div');e.className=c;document.body.appendChild(e);const w=getComputedStyle(e).borderLeftWidth;e.remove();return w;};return mk('fh day tdc')===mk('fc day tdc')&&mk('fh all tdc')===mk('fc all tdc');}));
  T('화면에 코드 주석 글자 없음',!/\/\/ ?v0\./.test(await p.evaluate(()=>document.body.innerText)));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));await b.close();T.sum();
})();
