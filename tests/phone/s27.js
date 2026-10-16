const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const p=await boot(b,base,{touch:true});
 await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]');await p.waitForTimeout(500);
 const n=await p.$$eval('#dstrip .dsi',a=>a.length);
 T('날짜 띠: 앞뒤 30일(61칸)',n===61,String(n));
 T('가운데에 고른 날(14일)',await p.evaluate(()=>{const el=document.getElementById('dstrip'),on=el.querySelector('.dsi.on');return on.dataset.k==='2026-10-14'&&Math.abs(on.offsetLeft+on.offsetWidth/2-el.clientWidth/2-el.scrollLeft)<3;}));
 // 한 번에 6일 쭉 밀기 → 멈추면 20일로
 await p.evaluate(()=>{const el=document.getElementById('dstrip'),w=el.children[0].offsetWidth;el.scrollLeft+=6*w;});await p.waitForTimeout(700);
 T('쭉 밀면 6일 뒤(20일)로 이동',await p.evaluate(()=>document.querySelector('#sheet .dft b').textContent.includes('20일')));
 // 이어서 한 번 더(멈췄다가) 밀어도 다시 가운데에서 시작
 T('이동 뒤에도 띠 가운데에 새 날',await p.evaluate(()=>{const el=document.getElementById('dstrip'),on=el.querySelector('.dsi.on');return on.dataset.k==='2026-10-20'&&Math.abs(on.offsetLeft+on.offsetWidth/2-el.clientWidth/2-el.scrollLeft)<3;}));
 await p.evaluate(()=>{const el=document.getElementById('dstrip'),w=el.children[0].offsetWidth;el.scrollLeft-=25*w;});await p.waitForTimeout(700);
 T('25일을 거꾸로 밀어도 한 번에 이동(9월 25일)',await p.evaluate(()=>document.querySelector('#sheet .dft b').textContent.includes('9월 25일')));
 console.log(p.errs);
 // 달력 범위 끝: 2026년 1월 첫날 앞쪽은 없음
 const p2=await boot(b,{...base,anchor:'2026-01-02'},{touch:true});
 await p2.evaluate(()=>{});
 T.sum();await b.close();})();
