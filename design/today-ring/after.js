const {chromium,boot,base}=require('../../tests/phone/lib.js');
const D=__dirname+'/';
(async()=>{const b=await chromium.launch();const m=(id,t,c)=>({id,text:t,color:c||'',done:false});
 for(const look of ['fill','circle'])for(const [nm,T] of [['mid','2026-10-12T10:00:00'],['edge','2026-10-11T10:00:00']]){
  const p=await boot(b,{...base,calLook:look,memos:{'2026-10-12':[m('a','교육 확정','#7b5cf0')],'2026-10-11':[m('c','업무 메모','#7b5cf0')],'2026-10-13':[m('b','바이올린','#7b5cf0')]}},{T:+new Date(T)});
  await p.waitForTimeout(4000);
  const r=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell.today').getBoundingClientRect();return [c.x,c.y,c.width,c.height];});
  await p.screenshot({path:D+`after_${look}_${nm}.png`,clip:{x:Math.max(0,r[0]-r[2]-6),y:r[1]-8,width:r[2]*3+12,height:r[3]+16}});
  console.log(look,nm,p.errs);await p.close();}
 await b.close();})();
