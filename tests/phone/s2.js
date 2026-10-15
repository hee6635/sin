const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const p=await boot(b,base,{touch:true});
 await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]').click());
 await p.waitForTimeout(400);
 T('전체 화면',await p.evaluate(()=>{const s=document.querySelector('#sheet');return s.classList.contains('full')&&s.getBoundingClientRect().height>=window.innerHeight-2}));
 await p.screenshot({path:'b1.png'});
 // 띠 눌러 이동
 await p.click('.dsi[data-k="2026-10-16"]');await p.waitForTimeout(300);
 T('16일로 이동',await p.evaluate(()=>document.querySelector('.dft b').textContent.includes('16일')));
 // 다음 달로 넘기기
 for(let i=0;i<16;i++){await p.click('.dfh .ib:last-child');await p.waitForTimeout(60);}
 T('11월로 월 이동',await p.evaluate(()=>document.querySelector('.dft b').textContent.includes('11월')&&/2026\.11/.test(document.body.innerText)));
 // 메모 자세히
 await p.click('[data-act="memo-detail"]');await p.waitForTimeout(300);
 await p.fill('#mdText','서류 챙기기');
 await p.click('[data-act="md-col"]');
 await p.evaluate(()=>{const c=document.getElementById('mdTodo');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});
 await p.click('[data-act="md-settime"]');await p.click('[data-act="md-al"][data-v="10"]');
 await p.screenshot({path:'b2.png'});
 await p.click('[data-act="md-save"]');await p.waitForTimeout(400);
 const m=(await p.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('eonjeswieo:v1')).memos)[0]))[0];
 console.log(JSON.stringify(m));
 T('메모 저장 extras',m&&m.todo&&m.time==='09:00'&&m.al==='10'&&!m.shared);
 T('알림 등록',await p.evaluate(()=>window.__rem.some(r=>r.title==='📝 메모')));
 await p.click('.mchk');await p.waitForTimeout(200);
 T('체크 완료',await p.evaluate(()=>!!document.querySelector('.mcard.done')));
 await p.screenshot({path:'b3.png'});
 // 뒤로 → 선택 유지
 await p.click('.dtop button');await p.waitForTimeout(400);
 T('뒤로 가면 칸이 평소대로',await p.evaluate(()=>!document.querySelector('.cell.sel')));
 // 근무타입 순서
 await p.evaluate(()=>{/*설정 근무패턴*/});
 const t0=await p.evaluate(()=>{window.__x=1;return 1});
 console.log(p.errs);T.sum();await b.close();})();
