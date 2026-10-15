const {chromium,boot,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const p=await boot(b,base,{touch:true});
 await p.evaluate(()=>document.querySelector('[data-act="prev"]').click());await p.waitForTimeout(500);
 await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-03"]')||0);
 await p.evaluate(()=>document.querySelector('[data-act="next"]').click());await p.waitForTimeout(500);
 await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-03"]').click());await p.waitForTimeout(400);
 console.log(await p.evaluate(()=>[...document.querySelectorAll('.dft .hl')].map(e=>getComputedStyle(e).color).join(' | ')));
 await p.screenshot({path:'l1.png',clip:{x:0,y:0,width:390,height:200}});console.log(p.errs);await b.close();})();
