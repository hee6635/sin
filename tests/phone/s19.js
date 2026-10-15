const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const m=(text,o={})=>({id:Math.random().toString(36).slice(2),text,shared:false,by:'host',t:1,...o});
 const p=await boot(b,{...base,memos:{'2026-10-14':[m('병원 예약'),m('서류',{color:'#fff1c4'}),m('장모님',{shared:true})]}},{touch:true});
 await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]').click());await p.waitForTimeout(500);
 T('띠 15칸',await p.evaluate(()=>document.querySelectorAll('#dstrip .dsi').length===15));
 const c0=await p.evaluate(()=>{const e=document.getElementById('dstrip');const w=e.clientWidth/7;return Math.round((e.scrollLeft+e.clientWidth/2-w/2)/w)});
 T('처음엔 가운데(7번째)',c0===7,String(c0));
 // 옆으로 2칸 밀기 → 16일
 await p.evaluate(()=>{const e=document.getElementById('dstrip');e.scrollTo({left:e.scrollLeft+2*e.clientWidth/7,behavior:'instant'});});
 await p.waitForTimeout(700);
 T('2칸 밀면 16일로 이동',await p.evaluate(()=>document.querySelector('.dft b').textContent.includes('16일')));
 T('다시 가운데',await p.evaluate(()=>{const e=document.getElementById('dstrip');const w=e.clientWidth/7;return Math.round((e.scrollLeft+e.clientWidth/2-w/2)/w)===7}));
 await p.click('.dsi[data-k="2026-10-15"]');await p.waitForTimeout(400);
 T('누르면 15일',await p.evaluate(()=>document.querySelector('.dft b').textContent.includes('15일')));
 await p.click('.dtop button');await p.waitForTimeout(300);
 await p.screenshot({path:'z1.png',clip:{x:0,y:150,width:390,height:360}});
 T('메모 줄 수(칸 높이에 맞춤) 최소 3줄',await p.evaluate(()=>document.querySelectorAll('.track .panel:nth-child(2) .cell[data-k="2026-10-14"] .pl').length>=3));
 console.log(p.errs);T.sum();await b.close();})();
