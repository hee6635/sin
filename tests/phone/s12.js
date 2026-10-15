const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const p=await boot(b,{...base},{touch:true});
 await p.evaluate(()=>document.querySelector('[data-act="prev"]').click());await p.waitForTimeout(500);
 const open=async()=>{await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-09-25"] .stz').click());await p.waitForTimeout(350);};
 // 스티커가 없으면 바로 등록 페이지
 await open();await p.click('#pop [data-act="sp-pick"][data-id="s_run"]');await p.waitForTimeout(300);await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(400);
 // 둘째: 팝업 → 스티커 추가
 await open();await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
 await p.click('#pop [data-act="sp-pick"][data-id="s_gym"]');await p.waitForTimeout(300);
 await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(400);
 const n=await p.evaluate(()=>document.querySelectorAll('.track .panel:nth-child(2) .cell[data-k="2026-09-25"] .stp>*,.track .panel:nth-child(2) .cell[data-k="2026-09-25"] .s2>*').length);
 const d=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).stamps.defs.map(x=>[x.name,x.rep,x.dates.join()]));
 console.log(JSON.stringify(d));T('둘 다 등록되어 2개',n===2&&d.filter(x=>x[2]).length===2);
 console.log(p.errs);await b.close();})();
